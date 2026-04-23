/**
 * Stellify Uploads
 *
 * A driver-agnostic file upload primitive that works with stellify/file-uploads
 * server-side package. Handles chunked uploads through either:
 * - Direct-to-storage via pre-signed URLs (S3/R2/MinIO)
 * - Through-app uploads (any Laravel disk)
 *
 * The client discovers per-part which strategy to use based on server response.
 * Consumer code never needs to know which driver is active.
 *
 * @example
 * const uploader = Uploader.create({
 *   endpoints: {
 *     initiate: '/uploads/initiate',
 *     signPart: '/uploads/sign-part',
 *     storePart: '/uploads/store-part',
 *     complete: '/uploads/complete',
 *     abort: '/uploads/abort',
 *   },
 * });
 *
 * uploader.on('progress', ({ loaded, total, percent }) => {
 *   console.log(`${percent}% complete`);
 * });
 *
 * uploader.on('complete', (result) => {
 *   console.log('Upload complete:', result);
 * });
 *
 * await uploader.upload(file);
 */

// Types

export type UploadEndpoints = {
  initiate: string
  signPart: string
  storePart: string
  complete: string
  abort: string
}

export type UploaderOptions = {
  endpoints: UploadEndpoints
  chunkSize?: number
  concurrency?: number
  retries?: number
  retryBackoffMs?: number
  headers?: Record<string, string>
  credentials?: RequestCredentials
}

export type UploadHandle = {
  id: string
  disk: string
  filename: string
  total_parts: number
  chunk_size: number
  driver_data: Record<string, unknown>
}

export type PartReceipt = {
  part_number: number
  size: number
  receipt_data: Record<string, unknown>
}

export type SignedPartResponse = {
  signed_url: string | null
}

export type UploadResult = {
  path: string
  size: number
  mime: string
  original_name: string
  disk: string
}

export type ProgressEvent = {
  loaded: number
  total: number
  percent: number
}

export type PartCompleteEvent = {
  partNumber: number
  size: number
  total: number
  completed: number
}

export type UploadErrorCode =
  | 'NETWORK'
  | 'SIGNING_FAILED'
  | 'PART_UPLOAD_FAILED'
  | 'COMPLETE_FAILED'
  | 'VALIDATION'
  | 'ABORTED'
  | 'UNKNOWN'

export class UploadError extends Error {
  code: UploadErrorCode
  cause?: Error

  constructor(code: UploadErrorCode, message: string, cause?: Error) {
    super(message)
    this.name = 'UploadError'
    this.code = code
    this.cause = cause
  }
}

type EventCallback<T = unknown> = (data: T) => void

type UploaderEvents = {
  start: UploadHandle
  'part-complete': PartCompleteEvent
  progress: ProgressEvent
  complete: UploadResult
  abort: void
  error: UploadError
}

type PartState = {
  partNumber: number
  start: number
  end: number
  size: number
  loaded: number
  completed: boolean
  controller: AbortController
}

// Default configuration matching server-side defaults
const DEFAULT_CHUNK_SIZE = 5 * 1024 * 1024 // 5 MB
const DEFAULT_CONCURRENCY = 4
const DEFAULT_RETRIES = 3
const DEFAULT_RETRY_BACKOFF_MS = 1000

export class Uploader {
  private endpoints: UploadEndpoints
  private chunkSize: number
  private concurrency: number
  private retries: number
  private retryBackoffMs: number
  private headers: Record<string, string>
  private credentials: RequestCredentials

  private listeners: Map<string, Set<EventCallback>> = new Map()
  private handle: UploadHandle | null = null
  private receipts: PartReceipt[] = []
  private parts: PartState[] = []
  private file: File | null = null
  private aborted = false
  private uploading = false

  private constructor(options: UploaderOptions) {
    this.endpoints = options.endpoints
    this.chunkSize = options.chunkSize ?? DEFAULT_CHUNK_SIZE
    this.concurrency = options.concurrency ?? DEFAULT_CONCURRENCY
    this.retries = options.retries ?? DEFAULT_RETRIES
    this.retryBackoffMs = options.retryBackoffMs ?? DEFAULT_RETRY_BACKOFF_MS
    this.headers = this.buildHeaders(options.headers ?? {})
    this.credentials = options.credentials ?? 'same-origin'
  }

  /**
   * Create a new Uploader instance.
   */
  static create(options: UploaderOptions): Uploader {
    return new Uploader(options)
  }

  /**
   * Build headers including CSRF token from meta tag if present.
   */
  private buildHeaders(customHeaders: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = { ...customHeaders }

    // Auto-detect CSRF token from meta tag if not provided
    if (!headers['X-CSRF-TOKEN'] && typeof document !== 'undefined') {
      const csrfMeta = document.querySelector('meta[name="csrf-token"]')
      if (csrfMeta) {
        headers['X-CSRF-TOKEN'] = csrfMeta.getAttribute('content') || ''
      }
    }

    return headers
  }

  /**
   * Register an event listener.
   */
  on<K extends keyof UploaderEvents>(
    event: K,
    callback: EventCallback<UploaderEvents[K]>
  ): Uploader {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback as EventCallback)
    return this
  }

  /**
   * Remove an event listener.
   */
  off<K extends keyof UploaderEvents>(
    event: K,
    callback: EventCallback<UploaderEvents[K]>
  ): Uploader {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      callbacks.delete(callback as EventCallback)
      if (callbacks.size === 0) {
        this.listeners.delete(event)
      }
    }
    return this
  }

  /**
   * Emit an event to all listeners.
   */
  private emit<K extends keyof UploaderEvents>(event: K, data: UploaderEvents[K]): void {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      for (const callback of callbacks) {
        callback(data)
      }
    }
  }

  /**
   * Upload a file.
   * Resolves when complete, rejects on error or abort.
   */
  async upload(file: File): Promise<UploadResult> {
    if (this.uploading) {
      throw new UploadError('UNKNOWN', 'Upload already in progress')
    }

    this.reset()
    this.file = file
    this.uploading = true

    try {
      // Step 1: Initiate the upload
      this.handle = await this.initiate(file)
      this.emit('start', this.handle)

      // Step 2: Calculate parts based on server's chunk size (honour server values)
      const chunkSize = this.handle.chunk_size || this.chunkSize
      this.parts = this.calculateParts(file, chunkSize, this.handle.total_parts)

      // Step 3: Upload all parts with concurrency control
      await this.uploadAllParts()

      // Step 4: Complete the upload
      const result = await this.complete()
      this.emit('complete', result)
      return result

    } catch (error) {
      // Clean up on the server
      await this.callAbortEndpoint().catch(() => {
        // Ignore cleanup errors
      })

      if (this.aborted) {
        this.emit('abort', undefined)
        throw new UploadError('ABORTED', 'Upload was aborted')
      }

      const uploadError = error instanceof UploadError
        ? error
        : new UploadError('UNKNOWN', (error as Error).message, error as Error)

      this.emit('error', uploadError)

      throw uploadError
    } finally {
      this.uploading = false
    }
  }

  /**
   * Abort an in-progress upload.
   * Safe to call at any point in the lifecycle.
   */
  abort(): void {
    if (!this.uploading) {
      return // No-op if not uploading
    }

    this.aborted = true

    // Cancel all in-flight part requests
    for (const part of this.parts) {
      if (!part.completed) {
        part.controller.abort()
      }
    }

    // The upload() method will handle cleanup and emit abort event
  }

  /**
   * Reset internal state for a new upload.
   */
  private reset(): void {
    this.handle = null
    this.receipts = []
    this.parts = []
    this.file = null
    this.aborted = false
  }

  /**
   * Initiate the upload with the server.
   */
  private async initiate(file: File): Promise<UploadHandle> {
    const response = await this.fetchJson<{ handle: UploadHandle }>(
      this.endpoints.initiate,
      {
        method: 'POST',
        body: JSON.stringify({
          filename: file.name,
          mime: file.type || 'application/octet-stream',
          size: file.size,
        }),
      }
    )

    return response.handle
  }

  /**
   * Calculate part boundaries.
   */
  private calculateParts(file: File, chunkSize: number, totalParts: number): PartState[] {
    const parts: PartState[] = []

    for (let i = 0; i < totalParts; i++) {
      const start = i * chunkSize
      const end = Math.min(start + chunkSize, file.size)
      parts.push({
        partNumber: i + 1,
        start,
        end,
        size: end - start,
        loaded: 0,
        completed: false,
        controller: new AbortController(),
      })
    }

    return parts
  }

  /**
   * Upload all parts with concurrency control.
   */
  private async uploadAllParts(): Promise<void> {
    const pending = [...this.parts]
    const inFlight: Promise<void>[] = []

    const processNext = async (): Promise<void> => {
      while (pending.length > 0 && !this.aborted) {
        const part = pending.shift()!
        await this.uploadPartWithRetry(part)
      }
    }

    // Start concurrent workers
    for (let i = 0; i < this.concurrency; i++) {
      inFlight.push(processNext())
    }

    await Promise.all(inFlight)

    if (this.aborted) {
      throw new UploadError('ABORTED', 'Upload was aborted')
    }
  }

  /**
   * Upload a single part with retry logic.
   */
  private async uploadPartWithRetry(part: PartState): Promise<void> {
    let lastError: Error | null = null

    for (let attempt = 0; attempt <= this.retries; attempt++) {
      if (this.aborted) {
        throw new UploadError('ABORTED', 'Upload was aborted')
      }

      try {
        await this.uploadPart(part)
        return
      } catch (error) {
        lastError = error as Error

        // Don't retry on abort
        if (this.aborted) {
          throw new UploadError('ABORTED', 'Upload was aborted')
        }

        // Don't retry on 4xx errors (permanent failures)
        if (this.isPermanentError(error)) {
          throw error
        }

        // Retry with exponential backoff for transient errors
        if (attempt < this.retries) {
          const delay = this.retryBackoffMs * Math.pow(2, attempt)
          await this.sleep(delay)
          // Reset controller for retry
          part.controller = new AbortController()
          part.loaded = 0
        }
      }
    }

    throw new UploadError(
      'PART_UPLOAD_FAILED',
      `Failed to upload part ${part.partNumber} after ${this.retries + 1} attempts`,
      lastError ?? undefined
    )
  }

  /**
   * Upload a single part.
   * Decides between signed URL (direct) or store-part (through app).
   */
  private async uploadPart(part: PartState): Promise<void> {
    const chunk = this.file!.slice(part.start, part.end)

    // Step 1: Ask server for signed URL or null
    const signResponse = await this.signPart(part.partNumber)

    let receipt: PartReceipt

    if (signResponse.signed_url) {
      // Direct upload to storage via signed URL
      receipt = await this.uploadDirect(part, chunk, signResponse.signed_url)
    } else {
      // Upload through the app
      receipt = await this.uploadThroughApp(part, chunk)
    }

    this.receipts.push(receipt)
    part.completed = true
    part.loaded = part.size

    this.emitProgress()
    this.emit('part-complete', {
      partNumber: part.partNumber,
      size: part.size,
      total: this.parts.length,
      completed: this.receipts.length,
    })
  }

  /**
   * Get signed URL for a part (or null for through-app).
   */
  private async signPart(partNumber: number): Promise<SignedPartResponse> {
    try {
      return await this.fetchJson<SignedPartResponse>(
        this.endpoints.signPart,
        {
          method: 'POST',
          body: JSON.stringify({
            handle: this.handle,
            part_number: partNumber,
          }),
        }
      )
    } catch (error) {
      throw new UploadError(
        'SIGNING_FAILED',
        `Failed to get signed URL for part ${partNumber}`,
        error as Error
      )
    }
  }

  /**
   * Upload directly to storage using signed URL.
   * Does NOT include CSRF tokens or session cookies.
   */
  private async uploadDirect(
    part: PartState,
    chunk: Blob,
    signedUrl: string
  ): Promise<PartReceipt> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          part.loaded = event.loaded
          this.emitProgress()
        }
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          // Capture ETag from response headers (required for S3 multipart)
          const etag = xhr.getResponseHeader('ETag')
          resolve({
            part_number: part.partNumber,
            size: chunk.size,
            receipt_data: { etag: etag?.replace(/"/g, '') ?? '' },
          })
        } else if (xhr.status >= 400 && xhr.status < 500) {
          reject(new UploadError('VALIDATION', `Upload rejected: ${xhr.status} ${xhr.statusText}`))
        } else {
          reject(new UploadError('PART_UPLOAD_FAILED', `Upload failed: ${xhr.status} ${xhr.statusText}`))
        }
      }

      xhr.onerror = () => {
        reject(new UploadError('NETWORK', 'Network error during direct upload'))
      }

      xhr.onabort = () => {
        reject(new UploadError('ABORTED', 'Upload was aborted'))
      }

      // Listen for abort signal
      part.controller.signal.addEventListener('abort', () => {
        xhr.abort()
      })

      xhr.open('PUT', signedUrl, true)
      // Signed URL uploads should NOT include credentials
      xhr.withCredentials = false
      xhr.send(chunk)
    })
  }

  /**
   * Upload through the app (chunk-through-app driver).
   */
  private async uploadThroughApp(
    part: PartState,
    chunk: Blob
  ): Promise<PartReceipt> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      const formData = new FormData()

      formData.append('handle', JSON.stringify(this.handle))
      formData.append('part_number', String(part.partNumber))
      formData.append('chunk', chunk)

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          part.loaded = event.loaded
          this.emitProgress()
        }
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText)
            resolve(response.receipt)
          } catch {
            reject(new UploadError('UNKNOWN', 'Invalid response from store-part endpoint'))
          }
        } else if (xhr.status >= 400 && xhr.status < 500) {
          reject(new UploadError('VALIDATION', `Upload rejected: ${xhr.status} ${xhr.statusText}`))
        } else {
          reject(new UploadError('PART_UPLOAD_FAILED', `Upload failed: ${xhr.status} ${xhr.statusText}`))
        }
      }

      xhr.onerror = () => {
        reject(new UploadError('NETWORK', 'Network error during upload'))
      }

      xhr.onabort = () => {
        reject(new UploadError('ABORTED', 'Upload was aborted'))
      }

      // Listen for abort signal
      part.controller.signal.addEventListener('abort', () => {
        xhr.abort()
      })

      xhr.open('POST', this.buildUrl(this.endpoints.storePart), true)
      xhr.withCredentials = this.credentials === 'include'

      // Add headers (including CSRF token)
      for (const [key, value] of Object.entries(this.headers)) {
        // Don't set Content-Type - FormData sets it with boundary
        if (key.toLowerCase() !== 'content-type') {
          xhr.setRequestHeader(key, value)
        }
      }

      xhr.send(formData)
    })
  }

  /**
   * Complete the upload.
   */
  private async complete(): Promise<UploadResult> {
    try {
      const response = await this.fetchJson<{ result: UploadResult }>(
        this.endpoints.complete,
        {
          method: 'POST',
          body: JSON.stringify({
            handle: this.handle,
            receipts: this.receipts,
          }),
        }
      )

      return response.result
    } catch (error) {
      throw new UploadError(
        'COMPLETE_FAILED',
        'Failed to complete upload',
        error as Error
      )
    }
  }

  /**
   * Call the abort endpoint to clean up server-side resources.
   * Does not emit events - caller handles that.
   */
  private async callAbortEndpoint(): Promise<void> {
    if (!this.handle) {
      return
    }

    try {
      await this.fetchJson(
        this.endpoints.abort,
        {
          method: 'POST',
          body: JSON.stringify({ handle: this.handle }),
        }
      )
    } catch {
      // Ignore errors during cleanup
    }
  }

  /**
   * Emit a progress event with aggregated byte counts.
   */
  private emitProgress(): void {
    if (!this.file) return

    const loaded = this.parts.reduce((sum, part) => sum + part.loaded, 0)
    const total = this.file.size
    const percent = total > 0 ? Math.round((loaded / total) * 100) : 0

    this.emit('progress', { loaded, total, percent })
  }

  /**
   * Make a JSON request to an app endpoint.
   */
  private async fetchJson<T>(
    endpoint: string,
    options: RequestInit
  ): Promise<T> {
    const url = this.buildUrl(endpoint)

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...this.headers,
      },
      credentials: this.credentials,
    })

    if (!response.ok) {
      const body = await response.text()
      let message = `${response.status} ${response.statusText}`

      try {
        const json = JSON.parse(body)
        message = json.error || json.message || message
      } catch {
        // Use default message
      }

      if (response.status >= 400 && response.status < 500) {
        throw new UploadError('VALIDATION', message)
      }

      throw new UploadError('NETWORK', message)
    }

    return response.json()
  }

  /**
   * Build a full URL from a relative endpoint.
   */
  private buildUrl(endpoint: string): string {
    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
      return endpoint
    }

    // Handle iframe contexts
    try {
      const origin = window.location.origin
      if (origin && origin !== 'null') {
        return origin + endpoint
      }
      if (window.parent && window.parent !== window) {
        const parentOrigin = window.parent.location.origin
        if (parentOrigin && parentOrigin !== 'null') {
          return parentOrigin + endpoint
        }
      }
    } catch {
      // Cross-origin iframe
    }

    return `${window.location.protocol}//${window.location.host}${endpoint}`
  }

  /**
   * Check if an error is permanent (should not be retried).
   */
  private isPermanentError(error: unknown): boolean {
    if (error instanceof UploadError) {
      return error.code === 'VALIDATION' || error.code === 'ABORTED'
    }
    return false
  }

  /**
   * Sleep for a given number of milliseconds.
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Get the current upload progress.
   */
  getProgress(): ProgressEvent {
    if (!this.file) {
      return { loaded: 0, total: 0, percent: 0 }
    }

    const loaded = this.parts.reduce((sum, part) => sum + part.loaded, 0)
    const total = this.file.size
    const percent = total > 0 ? Math.round((loaded / total) * 100) : 0

    return { loaded, total, percent }
  }

  /**
   * Check if an upload is currently in progress.
   */
  isUploading(): boolean {
    return this.uploading
  }
}

// Future enhancement: Resumable uploads
// - Store handle + completed receipts to localStorage on each part-complete
// - On page load, check for incomplete uploads and offer to resume
// - Resume by skipping already-uploaded parts and continuing from where we left off
// - Clear localStorage on complete or explicit cancel
// Not implemented in this session - scope for future work.
