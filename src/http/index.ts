type HttpOptions = {
  headers?: Record<string, string>
  params?: Record<string, string>
  timeout?: number
}

type RequestOptions = HttpOptions & {
  method: string
  body?: unknown
}

export class Http {
  private baseUrl: string
  private defaultHeaders: Record<string, string>
  private defaultTimeout: number

  private constructor(baseUrl: string = '', options: HttpOptions = {}) {
    this.baseUrl = baseUrl
    this.defaultHeaders = options.headers || {}
    this.defaultTimeout = options.timeout || 30000
  }

  static create(baseUrl: string = '', options: HttpOptions = {}): Http {
    return new Http(baseUrl, options)
  }

  private getOrigin(): string {
    // Handle iframe contexts where window.location.origin might be 'null' or unavailable
    try {
      const origin = window.location.origin
      if (origin && origin !== 'null') {
        return origin
      }
      // Try parent window if we're in an iframe
      if (window.parent && window.parent !== window) {
        const parentOrigin = window.parent.location.origin
        if (parentOrigin && parentOrigin !== 'null') {
          return parentOrigin
        }
      }
    } catch {
      // Cross-origin iframe - can't access parent
    }
    // Fallback: construct from protocol + host
    return `${window.location.protocol}//${window.location.host}`
  }

  private buildUrl(path: string, params?: Record<string, string>): string {
    const origin = this.getOrigin()

    // If baseUrl is a relative path, prepend the origin
    let base = this.baseUrl
    if (base && !base.startsWith('http://') && !base.startsWith('https://')) {
      base = origin + base
    }

    const url = new URL(path || '', base || origin)

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value)
      }
    }

    return url.toString()
  }

  private async request<T>(path: string, options: RequestOptions): Promise<T> {
    const url = this.buildUrl(path, options.params)

    const headers: Record<string, string> = {
      ...this.defaultHeaders,
      ...options.headers
    }

    if (options.body && typeof options.body === 'object') {
      headers['Content-Type'] = 'application/json'
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), options.timeout || this.defaultTimeout)

    try {
      const response = await fetch(url, {
        method: options.method,
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal
      })

      clearTimeout(timeout)

      if (!response.ok) {
        throw new HttpError(response.status, response.statusText, await response.text())
      }

      const contentType = response.headers.get('content-type')
      if (contentType?.includes('application/json')) {
        return response.json()
      }

      return response.text() as T
    } catch (error) {
      clearTimeout(timeout)

      if (error instanceof HttpError) {
        throw error
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new HttpError(408, 'Request Timeout', 'Request timed out')
      }

      throw error
    }
  }

  async get<T = unknown>(path: string, options: HttpOptions = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: 'GET' })
  }

  async post<T = unknown>(path: string, data?: unknown, options: HttpOptions = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: 'POST', body: data })
  }

  async put<T = unknown>(path: string, data?: unknown, options: HttpOptions = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: 'PUT', body: data })
  }

  async patch<T = unknown>(path: string, data?: unknown, options: HttpOptions = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: 'PATCH', body: data })
  }

  async delete<T = unknown>(path: string, options: HttpOptions = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: 'DELETE' })
  }

  withHeaders(headers: Record<string, string>): Http {
    return new Http(this.baseUrl, {
      headers: { ...this.defaultHeaders, ...headers },
      timeout: this.defaultTimeout
    })
  }

  withToken(token: string): Http {
    return this.withHeaders({ Authorization: `Bearer ${token}` })
  }

  withTimeout(ms: number): Http {
    return new Http(this.baseUrl, {
      headers: this.defaultHeaders,
      timeout: ms
    })
  }
}

export class HttpError extends Error {
  status: number
  statusText: string
  body: string

  constructor(status: number, statusText: string, body: string) {
    super(`${status} ${statusText}`)
    this.name = 'HttpError'
    this.status = status
    this.statusText = statusText
    this.body = body
  }
}
