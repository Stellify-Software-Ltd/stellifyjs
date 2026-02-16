type SocketCallback = (data: unknown) => void
type SocketState = 'connecting' | 'open' | 'closing' | 'closed'

interface SocketOptions {
  protocols?: string | string[]
  reconnect?: boolean
  reconnectInterval?: number
  maxReconnectAttempts?: number
}

export class Socket {
  private ws: WebSocket | null = null
  private url: string
  private options: SocketOptions
  private listeners: Map<string, Set<SocketCallback>> = new Map()
  private reconnectAttempts = 0
  private shouldReconnect = false

  private constructor(url: string, options: SocketOptions = {}) {
    this.url = url
    this.options = {
      reconnect: true,
      reconnectInterval: 1000,
      maxReconnectAttempts: 5,
      ...options
    }
  }

  static create(url: string, options: SocketOptions = {}): Socket {
    return new Socket(url, options)
  }

  connect(): Socket {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return this
    }

    this.shouldReconnect = true
    this.ws = new WebSocket(this.url, this.options.protocols)

    this.ws.onopen = () => {
      this.reconnectAttempts = 0
      this.emit('open', null)
    }

    this.ws.onclose = (event) => {
      this.emit('close', { code: event.code, reason: event.reason })
      this.attemptReconnect()
    }

    this.ws.onerror = (event) => {
      this.emit('error', event)
    }

    this.ws.onmessage = (event) => {
      let data: unknown = event.data

      try {
        data = JSON.parse(event.data)
      } catch {
        // Keep as string if not JSON
      }

      this.emit('message', data)

      // If data has a type/event property, emit that too
      if (typeof data === 'object' && data !== null) {
        const typed = data as Record<string, unknown>
        if (typed.type && typeof typed.type === 'string') {
          this.emit(typed.type, typed.data ?? typed)
        }
        if (typed.event && typeof typed.event === 'string') {
          this.emit(typed.event, typed.data ?? typed)
        }
      }
    }

    return this
  }

  disconnect(): Socket {
    this.shouldReconnect = false
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    return this
  }

  send(data: unknown): Socket {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('Socket is not connected')
      return this
    }

    const message = typeof data === 'string' ? data : JSON.stringify(data)
    this.ws.send(message)
    return this
  }

  sendEvent(event: string, data?: unknown): Socket {
    return this.send({ event, data })
  }

  on(event: string, callback: SocketCallback): Socket {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback)
    return this
  }

  off(event: string, callback: SocketCallback): Socket {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      callbacks.delete(callback)
    }
    return this
  }

  once(event: string, callback: SocketCallback): Socket {
    const wrapper: SocketCallback = (data) => {
      this.off(event, wrapper)
      callback(data)
    }
    return this.on(event, wrapper)
  }

  private emit(event: string, data: unknown): void {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      for (const callback of callbacks) {
        callback(data)
      }
    }
  }

  private attemptReconnect(): void {
    if (!this.shouldReconnect || !this.options.reconnect) {
      return
    }

    if (this.options.maxReconnectAttempts && this.reconnectAttempts >= this.options.maxReconnectAttempts) {
      this.emit('reconnect_failed', null)
      return
    }

    this.reconnectAttempts++
    this.emit('reconnecting', { attempt: this.reconnectAttempts })

    setTimeout(() => {
      this.connect()
    }, this.options.reconnectInterval)
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN
  }

  getState(): SocketState {
    if (!this.ws) return 'closed'

    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting'
      case WebSocket.OPEN:
        return 'open'
      case WebSocket.CLOSING:
        return 'closing'
      case WebSocket.CLOSED:
      default:
        return 'closed'
    }
  }
}
