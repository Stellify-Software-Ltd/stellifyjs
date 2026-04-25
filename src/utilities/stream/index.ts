type ChunkCallback = (chunk: string) => void
type CompleteCallback = (full: string) => void
type ErrorCallback = (error: StreamError) => void

interface StreamOptions {
  headers?: Record<string, string>
  signal?: AbortSignal
}

interface StreamState {
  buffer: string
  chunks: string[]
  isStreaming: boolean
}

export class Stream {
  private url: string
  private options: StreamOptions
  private state: StreamState
  private controller: AbortController | null = null
  private chunkCallback: ChunkCallback | null = null
  private completeCallback: CompleteCallback | null = null
  private errorCallback: ErrorCallback | null = null

  private constructor(url: string) {
    this.url = url
    this.options = {}
    this.state = {
      buffer: '',
      chunks: [],
      isStreaming: false
    }
  }

  static create(url: string): Stream {
    return new Stream(url)
  }

  headers(headers: Record<string, string>): this {
    this.options.headers = { ...this.options.headers, ...headers }
    return this
  }

  withToken(token: string): this {
    return this.headers({ Authorization: `Bearer ${token}` })
  }

  onChunk(callback: ChunkCallback): this {
    this.chunkCallback = callback
    return this
  }

  onComplete(callback: CompleteCallback): this {
    this.completeCallback = callback
    return this
  }

  onError(callback: ErrorCallback): this {
    this.errorCallback = callback
    return this
  }

  async get(): Promise<string> {
    return this.request('GET')
  }

  async post(body?: unknown): Promise<string> {
    return this.request('POST', body)
  }

  private async request(method: string, body?: unknown): Promise<string> {
    this.controller = new AbortController()
    this.state = { buffer: '', chunks: [], isStreaming: true }

    try {
      const response = await fetch(this.url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          ...this.options.headers
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: this.controller.signal
      })

      if (!response.ok) {
        throw new StreamError(`HTTP ${response.status}: ${response.statusText}`)
      }

      if (!response.body) {
        throw new StreamError('Response body is not available')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          break
        }

        const text = decoder.decode(value, { stream: true })
        this.processChunk(text)
      }

      this.state.isStreaming = false
      this.completeCallback?.(this.state.buffer)
      return this.state.buffer

    } catch (error) {
      this.state.isStreaming = false

      if (error instanceof Error && error.name === 'AbortError') {
        return this.state.buffer
      }

      const streamError = error instanceof StreamError
        ? error
        : new StreamError(error instanceof Error ? error.message : 'Stream failed')

      this.errorCallback?.(streamError)
      throw streamError
    }
  }

  private processChunk(text: string): void {
    // Handle SSE format (data: ...\n\n)
    const lines = text.split('\n')

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6)

        if (data === '[DONE]') {
          continue
        }

        try {
          // Try to parse as JSON (OpenAI format)
          const parsed = JSON.parse(data)
          const content = parsed.choices?.[0]?.delta?.content
            || parsed.delta?.text
            || parsed.text
            || data

          if (content) {
            this.emitChunk(content)
          }
        } catch {
          // Not JSON, emit raw data
          this.emitChunk(data)
        }
      } else if (line.trim() && !line.startsWith(':')) {
        // Plain text streaming (not SSE)
        this.emitChunk(line)
      }
    }
  }

  private emitChunk(chunk: string): void {
    this.state.chunks.push(chunk)
    this.state.buffer += chunk
    this.chunkCallback?.(chunk)
  }

  abort(): this {
    this.controller?.abort()
    this.state.isStreaming = false
    return this
  }

  getBuffer(): string {
    return this.state.buffer
  }

  getChunks(): string[] {
    return [...this.state.chunks]
  }

  isStreaming(): boolean {
    return this.state.isStreaming
  }

  clear(): this {
    this.state = { buffer: '', chunks: [], isStreaming: false }
    return this
  }
}

export class StreamError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'StreamError'
  }
}
