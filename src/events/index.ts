type EventCallback = (...args: unknown[]) => void

export class Events {
  private listeners: Map<string, Set<EventCallback>> = new Map()

  private constructor() {}

  static create(): Events {
    return new Events()
  }

  on(event: string, callback: EventCallback): Events {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback)
    return this
  }

  off(event: string, callback: EventCallback): Events {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      callbacks.delete(callback)
      if (callbacks.size === 0) {
        this.listeners.delete(event)
      }
    }
    return this
  }

  once(event: string, callback: EventCallback): Events {
    const wrapper: EventCallback = (...args) => {
      this.off(event, wrapper)
      callback(...args)
    }
    return this.on(event, wrapper)
  }

  emit(event: string, ...args: unknown[]): Events {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      for (const callback of callbacks) {
        callback(...args)
      }
    }
    return this
  }

  clear(event?: string): Events {
    if (event) {
      this.listeners.delete(event)
    } else {
      this.listeners.clear()
    }
    return this
  }

  listenerCount(event: string): number {
    return this.listeners.get(event)?.size || 0
  }

  eventNames(): string[] {
    return Array.from(this.listeners.keys())
  }
}
