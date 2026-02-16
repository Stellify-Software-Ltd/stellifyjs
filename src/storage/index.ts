type StorageType = 'local' | 'session'

export class Storage {
  private store: globalThis.Storage | null = null
  private prefix: string = ''

  private constructor(type: StorageType, prefix: string = '') {
    this.prefix = prefix
    if (typeof window !== 'undefined') {
      this.store = type === 'local' ? window.localStorage : window.sessionStorage
    }
  }

  static local(prefix: string = ''): Storage {
    return new Storage('local', prefix)
  }

  static session(prefix: string = ''): Storage {
    return new Storage('session', prefix)
  }

  private prefixKey(key: string): string {
    return this.prefix ? `${this.prefix}:${key}` : key
  }

  set(key: string, value: unknown): Storage {
    if (!this.store) return this

    const serialized = JSON.stringify(value)
    this.store.setItem(this.prefixKey(key), serialized)
    return this
  }

  get<T = unknown>(key: string, defaultValue?: T): T | null {
    if (!this.store) return defaultValue ?? null

    const item = this.store.getItem(this.prefixKey(key))
    if (item === null) return defaultValue ?? null

    try {
      return JSON.parse(item) as T
    } catch {
      return item as T
    }
  }

  remove(key: string): Storage {
    if (!this.store) return this

    this.store.removeItem(this.prefixKey(key))
    return this
  }

  clear(): Storage {
    if (!this.store) return this

    if (this.prefix) {
      // Only clear prefixed keys
      const keysToRemove: string[] = []
      for (let i = 0; i < this.store.length; i++) {
        const key = this.store.key(i)
        if (key && key.startsWith(`${this.prefix}:`)) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach(key => this.store!.removeItem(key))
    } else {
      this.store.clear()
    }

    return this
  }

  has(key: string): boolean {
    if (!this.store) return false
    return this.store.getItem(this.prefixKey(key)) !== null
  }

  keys(): string[] {
    if (!this.store) return []

    const keys: string[] = []
    const prefixLength = this.prefix ? this.prefix.length + 1 : 0

    for (let i = 0; i < this.store.length; i++) {
      const key = this.store.key(i)
      if (key) {
        if (this.prefix) {
          if (key.startsWith(`${this.prefix}:`)) {
            keys.push(key.slice(prefixLength))
          }
        } else {
          keys.push(key)
        }
      }
    }

    return keys
  }

  getAll(): Record<string, unknown> {
    const result: Record<string, unknown> = {}
    for (const key of this.keys()) {
      result[key] = this.get(key)
    }
    return result
  }

  size(): number {
    return this.keys().length
  }
}
