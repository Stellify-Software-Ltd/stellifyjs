type User = Record<string, unknown>
type Credentials = Record<string, unknown>
type AuthCallback = (user: User | null) => void

interface AuthConfig {
  loginUrl?: string
  logoutUrl?: string
  userUrl?: string
  tokenKey?: string
  storage?: 'local' | 'session'
}

export class Auth {
  private user: User | null = null
  private token: string | null = null
  private config: AuthConfig
  private listeners: Set<AuthCallback> = new Set()
  private storage: globalThis.Storage | null = null

  private constructor(config: AuthConfig = {}) {
    this.config = {
      loginUrl: '/api/auth/login',
      logoutUrl: '/api/auth/logout',
      userUrl: '/api/auth/user',
      tokenKey: 'auth_token',
      storage: 'local',
      ...config
    }

    if (typeof window !== 'undefined') {
      this.storage = this.config.storage === 'session'
        ? window.sessionStorage
        : window.localStorage
      this.loadToken()
    }
  }

  static create(config: AuthConfig = {}): Auth {
    return new Auth(config)
  }

  private loadToken(): void {
    if (!this.storage) return
    this.token = this.storage.getItem(this.config.tokenKey!)
  }

  private saveToken(token: string): void {
    if (!this.storage) return
    this.token = token
    this.storage.setItem(this.config.tokenKey!, token)
  }

  private clearToken(): void {
    if (!this.storage) return
    this.token = null
    this.storage.removeItem(this.config.tokenKey!)
  }

  async login(credentials: Credentials): Promise<User> {
    const response = await fetch(this.config.loginUrl!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    })

    if (!response.ok) {
      throw new AuthError(response.status, 'Login failed')
    }

    const data = await response.json()

    if (data.token) {
      this.saveToken(data.token)
    }

    this.user = data.user || data
    this.notifyListeners()

    return this.user!
  }

  async logout(): Promise<void> {
    if (this.token) {
      try {
        await fetch(this.config.logoutUrl!, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
          }
        })
      } catch {
        // Logout request failed, but clear local state anyway
      }
    }

    this.clearToken()
    this.user = null
    this.notifyListeners()
  }

  async fetchUser(): Promise<User | null> {
    if (!this.token) return null

    try {
      const response = await fetch(this.config.userUrl!, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      })

      if (!response.ok) {
        this.clearToken()
        this.user = null
        this.notifyListeners()
        return null
      }

      this.user = await response.json()
      this.notifyListeners()
      return this.user
    } catch {
      return null
    }
  }

  getUser(): User | null {
    return this.user
  }

  getToken(): string | null {
    return this.token
  }

  isAuthenticated(): boolean {
    return this.token !== null
  }

  setToken(token: string): Auth {
    this.saveToken(token)
    return this
  }

  setUser(user: User): Auth {
    this.user = user
    this.notifyListeners()
    return this
  }

  async refresh(): Promise<void> {
    await this.fetchUser()
  }

  onAuthChange(callback: AuthCallback): Auth {
    this.listeners.add(callback)
    return this
  }

  offAuthChange(callback: AuthCallback): Auth {
    this.listeners.delete(callback)
    return this
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener(this.user)
    }
  }

  getAuthHeader(): Record<string, string> {
    if (!this.token) return {}
    return { 'Authorization': `Bearer ${this.token}` }
  }
}

export class AuthError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'AuthError'
    this.status = status
  }
}
