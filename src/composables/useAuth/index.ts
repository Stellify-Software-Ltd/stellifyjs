import { ref, computed, readonly } from 'vue'

type User = Record<string, unknown>
type Credentials = Record<string, unknown>

/**
 * Options for useAuth
 */
export interface AuthOptions {
  loginUrl?: string
  logoutUrl?: string
  userUrl?: string
  tokenKey?: string
  storage?: 'local' | 'session'
}

/**
 * Return type for useAuth
 */
export interface AuthReturn {
  login: (credentials: Credentials) => Promise<User>
  logout: () => Promise<void>
  fetchUser: () => Promise<User | null>
  getUser: () => User | null
  getToken: () => string | null
  setToken: (token: string) => AuthReturn
  setUser: (user: User) => AuthReturn
  refresh: () => Promise<void>
  getAuthHeader: () => Record<string, string>
  user: Readonly<import('vue').Ref<User | null>>
  token: Readonly<import('vue').Ref<string | null>>
  isAuthenticated: import('vue').ComputedRef<boolean>
}

export class AuthError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'AuthError'
    this.status = status
  }
}

/**
 * Vue composable for authentication state management.
 *
 * Provides reactive auth state with login, logout, and user management.
 * Works with Laravel Sanctum/Passport out of the box.
 *
 * @example
 * ```vue
 * <script setup>
 * import { useAuth } from 'stellify-framework'
 *
 * const auth = useAuth({
 *   loginUrl: '/api/auth/login',
 *   userUrl: '/api/auth/user',
 * })
 *
 * // Reactive state
 * const { user, isAuthenticated, token } = auth
 *
 * // Methods
 * await auth.login({ email, password })
 * await auth.logout()
 * </script>
 *
 * <template>
 *   <div v-if="isAuthenticated">
 *     Welcome, {{ user?.name }}
 *     <button @click="auth.logout()">Logout</button>
 *   </div>
 * </template>
 * ```
 */
export function useAuth(config: AuthOptions = {}): AuthReturn {
  const resolvedConfig = {
    loginUrl: '/api/auth/login',
    logoutUrl: '/api/auth/logout',
    userUrl: '/api/auth/user',
    tokenKey: 'auth_token',
    storage: 'local' as const,
    ...config
  }

  // Reactive state
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)

  // Computed
  const isAuthenticated = computed(() => token.value !== null)

  // Storage helper
  const getStorage = (): globalThis.Storage | null => {
    if (typeof window === 'undefined') return null
    return resolvedConfig.storage === 'session'
      ? window.sessionStorage
      : window.localStorage
  }

  // Load token from storage on init
  const loadToken = (): void => {
    const storage = getStorage()
    if (storage) {
      token.value = storage.getItem(resolvedConfig.tokenKey)
    }
  }

  const saveToken = (newToken: string): void => {
    const storage = getStorage()
    if (storage) {
      token.value = newToken
      storage.setItem(resolvedConfig.tokenKey, newToken)
    }
  }

  const clearToken = (): void => {
    const storage = getStorage()
    if (storage) {
      token.value = null
      storage.removeItem(resolvedConfig.tokenKey)
    }
  }

  /**
   * Log in with credentials
   */
  const login = async (credentials: Credentials): Promise<User> => {
    const response = await fetch(resolvedConfig.loginUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    })

    if (!response.ok) {
      throw new AuthError(response.status, 'Login failed')
    }

    const data = await response.json()

    if (data.token) {
      saveToken(data.token)
    }

    user.value = data.user || data
    return user.value!
  }

  /**
   * Log out the current user
   */
  const logout = async (): Promise<void> => {
    if (token.value) {
      try {
        await fetch(resolvedConfig.logoutUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token.value}`,
            'Content-Type': 'application/json'
          }
        })
      } catch {
        // Logout request failed, but clear local state anyway
      }
    }

    clearToken()
    user.value = null
  }

  /**
   * Fetch the current user from the server
   */
  const fetchUser = async (): Promise<User | null> => {
    if (!token.value) return null

    try {
      const response = await fetch(resolvedConfig.userUrl, {
        headers: {
          'Authorization': `Bearer ${token.value}`
        }
      })

      if (!response.ok) {
        clearToken()
        user.value = null
        return null
      }

      user.value = await response.json()
      return user.value
    } catch {
      return null
    }
  }

  /**
   * Get the current user (reactive)
   */
  const getUser = (): User | null => {
    return user.value
  }

  /**
   * Get the current token
   */
  const getToken = (): string | null => {
    return token.value
  }

  /**
   * Set the auth token manually
   */
  const setToken = (newToken: string) => {
    saveToken(newToken)
    return { login, logout, fetchUser, getUser, getToken, setToken, setUser, refresh, getAuthHeader, user, token, isAuthenticated }
  }

  /**
   * Set the user manually
   */
  const setUser = (newUser: User) => {
    user.value = newUser
    return { login, logout, fetchUser, getUser, getToken, setToken, setUser, refresh, getAuthHeader, user, token, isAuthenticated }
  }

  /**
   * Refresh the current user from server
   */
  const refresh = async (): Promise<void> => {
    await fetchUser()
  }

  /**
   * Get authorization header for HTTP requests
   */
  const getAuthHeader = (): Record<string, string> => {
    if (!token.value) return {}
    return { 'Authorization': `Bearer ${token.value}` }
  }

  // Initialize - load token from storage
  loadToken()

  return {
    // Methods (same surface as old Auth class)
    login,
    logout,
    fetchUser,
    getUser,
    getToken,
    setToken,
    setUser,
    refresh,
    getAuthHeader,

    // Reactive state (new - Vue composable style)
    user: readonly(user),
    token: readonly(token),
    isAuthenticated,
  }
}
