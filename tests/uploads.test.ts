import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Uploader, UploadError } from '../src/uploads'

// Mock XMLHttpRequest
class MockXHR {
  static instances: MockXHR[] = []

  url = ''
  method = ''
  headers: Record<string, string> = {}
  body: unknown = null
  withCredentials = false
  readyState = 0
  status = 0
  statusText = ''
  responseText = ''

  upload = {
    onprogress: null as ((e: { loaded: number; lengthComputable: boolean }) => void) | null,
  }

  onload: (() => void) | null = null
  onerror: (() => void) | null = null
  onabort: (() => void) | null = null

  constructor() {
    MockXHR.instances.push(this)
  }

  open(method: string, url: string) {
    this.method = method
    this.url = url
  }

  setRequestHeader(key: string, value: string) {
    this.headers[key] = value
  }

  getResponseHeader(name: string): string | null {
    if (name.toLowerCase() === 'etag') {
      return '"abc123"'
    }
    return null
  }

  send(body: unknown) {
    this.body = body
  }

  abort() {
    this.onabort?.()
  }

  // Test helpers
  simulateSuccess(response: string) {
    this.status = 200
    this.statusText = 'OK'
    this.responseText = response
    this.onload?.()
  }

  simulateProgress(loaded: number) {
    this.upload.onprogress?.({ loaded, lengthComputable: true })
  }

  simulateError() {
    this.onerror?.()
  }

  simulate5xx() {
    this.status = 500
    this.statusText = 'Internal Server Error'
    this.onload?.()
  }

  simulate4xx() {
    this.status = 400
    this.statusText = 'Bad Request'
    this.onload?.()
  }
}

// Mock fetch
const mockFetch = vi.fn()

// Mock File
function createMockFile(size: number, name = 'test.txt', type = 'text/plain'): File {
  const content = new Uint8Array(size).fill(65) // Fill with 'A'
  return new File([content], name, { type })
}

// Setup and teardown
beforeEach(() => {
  MockXHR.instances = []
  vi.stubGlobal('XMLHttpRequest', MockXHR)
  vi.stubGlobal('fetch', mockFetch)
  vi.stubGlobal('window', {
    location: {
      origin: 'http://localhost',
      protocol: 'http:',
      host: 'localhost',
    },
  })
  mockFetch.mockReset()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

const defaultEndpoints = {
  initiate: '/uploads/initiate',
  signPart: '/uploads/sign-part',
  storePart: '/uploads/store-part',
  complete: '/uploads/complete',
  abort: '/uploads/abort',
}

describe('Uploader', () => {
  describe('chunk-through-app driver (sign-part returns null)', () => {
    it('uploads successfully when sign-part returns null', async () => {
      const file = createMockFile(10 * 1024 * 1024) // 10 MB = 2 parts
      const uploader = Uploader.create({ endpoints: defaultEndpoints })

      const completeHandler = vi.fn()
      uploader.on('complete', completeHandler)

      // Mock initiate
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          handle: {
            id: 'upload-123',
            disk: 'local',
            filename: 'test.txt',
            total_parts: 2,
            chunk_size: 5 * 1024 * 1024,
            driver_data: {},
          },
        }),
      })

      // Mock sign-part returns null (chunk-through-app)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ signed_url: null }),
      })
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ signed_url: null }),
      })

      // Mock complete
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          result: {
            path: 'uploads/test.txt',
            size: 10 * 1024 * 1024,
            mime: 'text/plain',
            original_name: 'test.txt',
            disk: 'local',
          },
        }),
      })

      // Start upload
      const uploadPromise = uploader.upload(file)

      // Wait for XHR instances to be created
      await vi.waitFor(() => expect(MockXHR.instances.length).toBeGreaterThan(0))

      // Simulate XHR uploads completing
      for (const xhr of MockXHR.instances) {
        xhr.simulateSuccess(JSON.stringify({ receipt: { part_number: 1, size: 5 * 1024 * 1024, receipt_data: {} } }))
      }

      const result = await uploadPromise

      expect(result.path).toBe('uploads/test.txt')
      expect(result.size).toBe(10 * 1024 * 1024)
      expect(completeHandler).toHaveBeenCalled()
    })

    it('sends CSRF token to store-part endpoint', async () => {
      const file = createMockFile(5 * 1024 * 1024) // 1 part
      const uploader = Uploader.create({
        endpoints: defaultEndpoints,
        headers: { 'X-CSRF-TOKEN': 'test-csrf-token' },
      })

      // Mock initiate
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          handle: {
            id: 'upload-123',
            disk: 'local',
            filename: 'test.txt',
            total_parts: 1,
            chunk_size: 5 * 1024 * 1024,
            driver_data: {},
          },
        }),
      })

      // Mock sign-part returns null
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ signed_url: null }),
      })

      // Mock complete
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          result: { path: 'uploads/test.txt', size: 5 * 1024 * 1024, mime: 'text/plain', original_name: 'test.txt', disk: 'local' },
        }),
      })

      const uploadPromise = uploader.upload(file)

      await vi.waitFor(() => expect(MockXHR.instances.length).toBe(1))

      const xhr = MockXHR.instances[0]
      expect(xhr.headers['X-CSRF-TOKEN']).toBe('test-csrf-token')

      xhr.simulateSuccess(JSON.stringify({ receipt: { part_number: 1, size: 5 * 1024 * 1024, receipt_data: {} } }))

      await uploadPromise
    })
  })

  describe('S3 direct upload driver (sign-part returns URL)', () => {
    it('uploads directly to signed URL', async () => {
      const file = createMockFile(5 * 1024 * 1024)
      const uploader = Uploader.create({ endpoints: defaultEndpoints })

      // Mock initiate
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          handle: {
            id: 'upload-123',
            disk: 's3',
            filename: 'test.txt',
            total_parts: 1,
            chunk_size: 5 * 1024 * 1024,
            driver_data: { upload_id: 's3-multipart-123' },
          },
        }),
      })

      // Mock sign-part returns URL
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ signed_url: 'https://s3.example.com/bucket/key?signature=xxx' }),
      })

      // Mock complete
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          result: { path: 'uploads/test.txt', size: 5 * 1024 * 1024, mime: 'text/plain', original_name: 'test.txt', disk: 's3' },
        }),
      })

      const uploadPromise = uploader.upload(file)

      await vi.waitFor(() => expect(MockXHR.instances.length).toBe(1))

      const xhr = MockXHR.instances[0]
      expect(xhr.url).toBe('https://s3.example.com/bucket/key?signature=xxx')
      expect(xhr.method).toBe('PUT')
      expect(xhr.withCredentials).toBe(false) // No credentials for signed URL

      xhr.simulateSuccess('')

      const result = await uploadPromise
      expect(result.disk).toBe('s3')
    })

    it('does NOT send CSRF token to signed URL', async () => {
      const file = createMockFile(5 * 1024 * 1024)
      const uploader = Uploader.create({
        endpoints: defaultEndpoints,
        headers: { 'X-CSRF-TOKEN': 'test-csrf-token' },
      })

      // Mock initiate
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          handle: {
            id: 'upload-123',
            disk: 's3',
            filename: 'test.txt',
            total_parts: 1,
            chunk_size: 5 * 1024 * 1024,
            driver_data: {},
          },
        }),
      })

      // Mock sign-part returns URL
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ signed_url: 'https://s3.example.com/bucket/key' }),
      })

      // Mock complete
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          result: { path: 'uploads/test.txt', size: 5 * 1024 * 1024, mime: 'text/plain', original_name: 'test.txt', disk: 's3' },
        }),
      })

      const uploadPromise = uploader.upload(file)

      await vi.waitFor(() => expect(MockXHR.instances.length).toBe(1))

      const xhr = MockXHR.instances[0]
      // Signed URL uploads should NOT have CSRF token
      expect(xhr.headers['X-CSRF-TOKEN']).toBeUndefined()

      xhr.simulateSuccess('')

      await uploadPromise
    })

    it('captures ETag from response headers', async () => {
      const file = createMockFile(5 * 1024 * 1024)
      const uploader = Uploader.create({ endpoints: defaultEndpoints })

      // Mock initiate
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          handle: {
            id: 'upload-123',
            disk: 's3',
            filename: 'test.txt',
            total_parts: 1,
            chunk_size: 5 * 1024 * 1024,
            driver_data: {},
          },
        }),
      })

      // Mock sign-part
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ signed_url: 'https://s3.example.com/bucket/key' }),
      })

      // Mock complete - capture the receipts
      let capturedReceipts: unknown[] = []
      mockFetch.mockImplementationOnce(async (url, options) => {
        const body = JSON.parse(options.body as string)
        capturedReceipts = body.receipts
        return {
          ok: true,
          json: () => Promise.resolve({
            result: { path: 'uploads/test.txt', size: 5 * 1024 * 1024, mime: 'text/plain', original_name: 'test.txt', disk: 's3' },
          }),
        }
      })

      const uploadPromise = uploader.upload(file)

      await vi.waitFor(() => expect(MockXHR.instances.length).toBe(1))

      MockXHR.instances[0].simulateSuccess('')

      await uploadPromise

      expect(capturedReceipts[0]).toMatchObject({
        part_number: 1,
        receipt_data: { etag: 'abc123' }, // Quote stripped
      })
    })
  })

  describe('mixed-mode upload', () => {
    it('handles mix of signed and non-signed parts', async () => {
      const file = createMockFile(15 * 1024 * 1024) // 3 parts
      const uploader = Uploader.create({ endpoints: defaultEndpoints, concurrency: 1 })

      // Mock initiate
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          handle: {
            id: 'upload-123',
            disk: 'hybrid',
            filename: 'test.txt',
            total_parts: 3,
            chunk_size: 5 * 1024 * 1024,
            driver_data: {},
          },
        }),
      })

      // Part 1: signed URL
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ signed_url: 'https://s3.example.com/part1' }),
      })
      // Part 2: through app (null)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ signed_url: null }),
      })
      // Part 3: signed URL
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ signed_url: 'https://s3.example.com/part3' }),
      })

      // Mock complete
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          result: { path: 'uploads/test.txt', size: 15 * 1024 * 1024, mime: 'text/plain', original_name: 'test.txt', disk: 'hybrid' },
        }),
      })

      const uploadPromise = uploader.upload(file)

      // Part 1: direct to S3
      await vi.waitFor(() => expect(MockXHR.instances.length).toBe(1))
      expect(MockXHR.instances[0].url).toBe('https://s3.example.com/part1')
      expect(MockXHR.instances[0].method).toBe('PUT')
      MockXHR.instances[0].simulateSuccess('')

      // Part 2: through app
      await vi.waitFor(() => expect(MockXHR.instances.length).toBe(2))
      expect(MockXHR.instances[1].url).toContain('/uploads/store-part')
      expect(MockXHR.instances[1].method).toBe('POST')
      MockXHR.instances[1].simulateSuccess(JSON.stringify({ receipt: { part_number: 2, size: 5 * 1024 * 1024, receipt_data: {} } }))

      // Part 3: direct to S3
      await vi.waitFor(() => expect(MockXHR.instances.length).toBe(3))
      expect(MockXHR.instances[2].url).toBe('https://s3.example.com/part3')
      expect(MockXHR.instances[2].method).toBe('PUT')
      MockXHR.instances[2].simulateSuccess('')

      const result = await uploadPromise
      expect(result.disk).toBe('hybrid')
    })
  })

  describe('concurrency control', () => {
    it('respects concurrency limit', async () => {
      const file = createMockFile(20 * 1024 * 1024) // 4 parts
      const uploader = Uploader.create({ endpoints: defaultEndpoints, concurrency: 2 })

      // Mock initiate
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          handle: {
            id: 'upload-123',
            disk: 'local',
            filename: 'test.txt',
            total_parts: 4,
            chunk_size: 5 * 1024 * 1024,
            driver_data: {},
          },
        }),
      })

      // Mock all sign-part calls to return null (through app)
      for (let i = 0; i < 4; i++) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ signed_url: null }),
        })
      }

      // Mock complete
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          result: { path: 'uploads/test.txt', size: 20 * 1024 * 1024, mime: 'text/plain', original_name: 'test.txt', disk: 'local' },
        }),
      })

      const uploadPromise = uploader.upload(file)

      // Should only have 2 XHRs in flight at once
      await vi.waitFor(() => expect(MockXHR.instances.length).toBe(2))

      // Complete first 2
      MockXHR.instances[0].simulateSuccess(JSON.stringify({ receipt: { part_number: 1, size: 5 * 1024 * 1024, receipt_data: {} } }))
      MockXHR.instances[1].simulateSuccess(JSON.stringify({ receipt: { part_number: 2, size: 5 * 1024 * 1024, receipt_data: {} } }))

      // Now next 2 should start
      await vi.waitFor(() => expect(MockXHR.instances.length).toBe(4))

      MockXHR.instances[2].simulateSuccess(JSON.stringify({ receipt: { part_number: 3, size: 5 * 1024 * 1024, receipt_data: {} } }))
      MockXHR.instances[3].simulateSuccess(JSON.stringify({ receipt: { part_number: 4, size: 5 * 1024 * 1024, receipt_data: {} } }))

      await uploadPromise
    })
  })

  describe('progress events', () => {
    it('fires progress events with monotonic loaded values', async () => {
      const file = createMockFile(10 * 1024 * 1024) // 2 parts
      const uploader = Uploader.create({ endpoints: defaultEndpoints, concurrency: 1 })

      const progressValues: number[] = []
      uploader.on('progress', ({ loaded }) => progressValues.push(loaded))

      // Mock initiate
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          handle: {
            id: 'upload-123',
            disk: 'local',
            filename: 'test.txt',
            total_parts: 2,
            chunk_size: 5 * 1024 * 1024,
            driver_data: {},
          },
        }),
      })

      // Mock sign-part
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ signed_url: null }),
      })
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ signed_url: null }),
      })

      // Mock complete
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          result: { path: 'uploads/test.txt', size: 10 * 1024 * 1024, mime: 'text/plain', original_name: 'test.txt', disk: 'local' },
        }),
      })

      const uploadPromise = uploader.upload(file)

      // Part 1
      await vi.waitFor(() => expect(MockXHR.instances.length).toBe(1))
      MockXHR.instances[0].simulateProgress(1 * 1024 * 1024)
      MockXHR.instances[0].simulateProgress(3 * 1024 * 1024)
      MockXHR.instances[0].simulateProgress(5 * 1024 * 1024)
      MockXHR.instances[0].simulateSuccess(JSON.stringify({ receipt: { part_number: 1, size: 5 * 1024 * 1024, receipt_data: {} } }))

      // Part 2
      await vi.waitFor(() => expect(MockXHR.instances.length).toBe(2))
      MockXHR.instances[1].simulateProgress(2 * 1024 * 1024)
      MockXHR.instances[1].simulateProgress(5 * 1024 * 1024)
      MockXHR.instances[1].simulateSuccess(JSON.stringify({ receipt: { part_number: 2, size: 5 * 1024 * 1024, receipt_data: {} } }))

      await uploadPromise

      // Values should be monotonically increasing
      for (let i = 1; i < progressValues.length; i++) {
        expect(progressValues[i]).toBeGreaterThanOrEqual(progressValues[i - 1])
      }
    })
  })

  describe('abort handling', () => {
    it('cancels in-flight requests and calls abort endpoint', async () => {
      const file = createMockFile(5 * 1024 * 1024) // 1 part only
      const uploader = Uploader.create({ endpoints: defaultEndpoints })

      const abortHandler = vi.fn()
      uploader.on('abort', abortHandler)

      // Mock initiate
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          handle: {
            id: 'upload-123',
            disk: 'local',
            filename: 'test.txt',
            total_parts: 1,
            chunk_size: 5 * 1024 * 1024,
            driver_data: {},
          },
        }),
      })

      // Mock sign-part
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ signed_url: null }),
      })

      // Mock abort endpoint
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })

      const uploadPromise = uploader.upload(file)

      await vi.waitFor(() => expect(MockXHR.instances.length).toBe(1))

      // Abort mid-upload
      uploader.abort()

      await expect(uploadPromise).rejects.toThrow('Upload was aborted')
      expect(abortHandler).toHaveBeenCalled()
    })

    it('is safe to call before initiate', () => {
      const uploader = Uploader.create({ endpoints: defaultEndpoints })
      expect(() => uploader.abort()).not.toThrow()
    })
  })

  describe('retry logic', () => {
    it('retries on 5xx and succeeds', async () => {
      const file = createMockFile(5 * 1024 * 1024)
      const uploader = Uploader.create({ endpoints: defaultEndpoints, retries: 2, retryBackoffMs: 10 })

      // Mock initiate
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          handle: {
            id: 'upload-123',
            disk: 'local',
            filename: 'test.txt',
            total_parts: 1,
            chunk_size: 5 * 1024 * 1024,
            driver_data: {},
          },
        }),
      })

      // Mock sign-part (called multiple times due to retries)
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ signed_url: null }),
      })

      const uploadPromise = uploader.upload(file)

      // First attempt - 500 error
      await vi.waitFor(() => expect(MockXHR.instances.length).toBe(1))
      MockXHR.instances[0].simulate5xx()

      // Second attempt - 500 error
      await vi.waitFor(() => expect(MockXHR.instances.length).toBe(2))
      MockXHR.instances[1].simulate5xx()

      // Third attempt - success
      await vi.waitFor(() => expect(MockXHR.instances.length).toBe(3))

      // Reset mock for complete call
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          result: { path: 'uploads/test.txt', size: 5 * 1024 * 1024, mime: 'text/plain', original_name: 'test.txt', disk: 'local' },
        }),
      })

      MockXHR.instances[2].simulateSuccess(JSON.stringify({ receipt: { part_number: 1, size: 5 * 1024 * 1024, receipt_data: {} } }))

      const result = await uploadPromise
      expect(result.path).toBe('uploads/test.txt')
    })

    it('does not retry on 4xx', async () => {
      const file = createMockFile(5 * 1024 * 1024)
      const uploader = Uploader.create({ endpoints: defaultEndpoints, retries: 2 })

      const errorHandler = vi.fn()
      uploader.on('error', errorHandler)

      // Mock initiate
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          handle: {
            id: 'upload-123',
            disk: 'local',
            filename: 'test.txt',
            total_parts: 1,
            chunk_size: 5 * 1024 * 1024,
            driver_data: {},
          },
        }),
      })

      // Mock sign-part
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ signed_url: null }),
      })

      // Mock abort endpoint
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })

      const uploadPromise = uploader.upload(file)

      await vi.waitFor(() => expect(MockXHR.instances.length).toBe(1))
      MockXHR.instances[0].simulate4xx()

      await expect(uploadPromise).rejects.toThrow()
      expect(errorHandler).toHaveBeenCalled()
      expect(errorHandler.mock.calls[0][0].code).toBe('VALIDATION')

      // Only 1 XHR instance - no retries
      expect(MockXHR.instances.length).toBe(1)
    })
  })

  describe('error handling', () => {
    it('calls abort endpoint on error', async () => {
      const file = createMockFile(5 * 1024 * 1024)
      const uploader = Uploader.create({ endpoints: defaultEndpoints, retries: 0 }) // No retries

      // Mock initiate
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          handle: {
            id: 'upload-123',
            disk: 'local',
            filename: 'test.txt',
            total_parts: 1,
            chunk_size: 5 * 1024 * 1024,
            driver_data: {},
          },
        }),
      })

      // Mock sign-part
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ signed_url: null }),
      })

      // Mock abort endpoint
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })

      const uploadPromise = uploader.upload(file)

      await vi.waitFor(() => expect(MockXHR.instances.length).toBe(1))
      MockXHR.instances[0].simulateError()

      await expect(uploadPromise).rejects.toThrow()

      // Verify abort was called
      const abortCall = mockFetch.mock.calls.find(call =>
        (call[0] as string).includes('/uploads/abort')
      )
      expect(abortCall).toBeDefined()
    })

    it('emits error event with typed code', async () => {
      const file = createMockFile(5 * 1024 * 1024)
      const uploader = Uploader.create({ endpoints: defaultEndpoints, retries: 0 }) // No retries

      const errorHandler = vi.fn()
      uploader.on('error', errorHandler)

      // Mock initiate
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          handle: {
            id: 'upload-123',
            disk: 'local',
            filename: 'test.txt',
            total_parts: 1,
            chunk_size: 5 * 1024 * 1024,
            driver_data: {},
          },
        }),
      })

      // Mock sign-part
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ signed_url: null }),
      })

      // Mock abort
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })

      const uploadPromise = uploader.upload(file)

      await vi.waitFor(() => expect(MockXHR.instances.length).toBe(1))
      MockXHR.instances[0].simulateError()

      await expect(uploadPromise).rejects.toThrow()

      expect(errorHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'PART_UPLOAD_FAILED', // After retries exhausted, this is the error code
        })
      )
    })
  })

  describe('events', () => {
    it('fires start event after initiate', async () => {
      const file = createMockFile(5 * 1024 * 1024)
      const uploader = Uploader.create({ endpoints: defaultEndpoints })

      const startHandler = vi.fn()
      uploader.on('start', startHandler)

      // Mock initiate
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          handle: {
            id: 'upload-123',
            disk: 'local',
            filename: 'test.txt',
            total_parts: 1,
            chunk_size: 5 * 1024 * 1024,
            driver_data: {},
          },
        }),
      })

      // Mock sign-part
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ signed_url: null }),
      })

      // Mock complete
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          result: { path: 'uploads/test.txt', size: 5 * 1024 * 1024, mime: 'text/plain', original_name: 'test.txt', disk: 'local' },
        }),
      })

      const uploadPromise = uploader.upload(file)

      await vi.waitFor(() => expect(startHandler).toHaveBeenCalled())

      expect(startHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'upload-123',
          disk: 'local',
        })
      )

      await vi.waitFor(() => expect(MockXHR.instances.length).toBe(1))
      MockXHR.instances[0].simulateSuccess(JSON.stringify({ receipt: { part_number: 1, size: 5 * 1024 * 1024, receipt_data: {} } }))

      await uploadPromise
    })

    it('fires part-complete event for each part', async () => {
      const file = createMockFile(10 * 1024 * 1024) // 2 parts
      const uploader = Uploader.create({ endpoints: defaultEndpoints, concurrency: 1 })

      const partCompleteHandler = vi.fn()
      uploader.on('part-complete', partCompleteHandler)

      // Mock initiate
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          handle: {
            id: 'upload-123',
            disk: 'local',
            filename: 'test.txt',
            total_parts: 2,
            chunk_size: 5 * 1024 * 1024,
            driver_data: {},
          },
        }),
      })

      // Mock sign-part
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ signed_url: null }),
      })
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ signed_url: null }),
      })

      // Mock complete
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          result: { path: 'uploads/test.txt', size: 10 * 1024 * 1024, mime: 'text/plain', original_name: 'test.txt', disk: 'local' },
        }),
      })

      const uploadPromise = uploader.upload(file)

      await vi.waitFor(() => expect(MockXHR.instances.length).toBe(1))
      MockXHR.instances[0].simulateSuccess(JSON.stringify({ receipt: { part_number: 1, size: 5 * 1024 * 1024, receipt_data: {} } }))

      await vi.waitFor(() => expect(partCompleteHandler).toHaveBeenCalledTimes(1))
      expect(partCompleteHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          partNumber: 1,
          completed: 1,
          total: 2,
        })
      )

      await vi.waitFor(() => expect(MockXHR.instances.length).toBe(2))
      MockXHR.instances[1].simulateSuccess(JSON.stringify({ receipt: { part_number: 2, size: 5 * 1024 * 1024, receipt_data: {} } }))

      await vi.waitFor(() => expect(partCompleteHandler).toHaveBeenCalledTimes(2))

      await uploadPromise
    })
  })
})
