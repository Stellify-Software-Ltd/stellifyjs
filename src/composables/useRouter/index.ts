import { ref, computed, readonly, onMounted, onUnmounted } from 'vue'

type RouteHandler = (params: Record<string, string>) => void
type NavigateOptions = {
  replace?: boolean
  state?: unknown
}

interface Route {
  path: string
  pattern: RegExp
  paramNames: string[]
  handler: RouteHandler
}

/**
 * Return type for useRouter
 */
export interface RouterReturn {
  register: (path: string, handler: RouteHandler) => RouterReturn
  navigate: (path: string, options?: NavigateOptions) => RouterReturn
  push: (path: string, options?: NavigateOptions) => RouterReturn
  back: () => RouterReturn
  forward: () => RouterReturn
  getParams: () => Record<string, string>
  getQuery: () => Record<string, string>
  getCurrent: () => string
  getState: () => unknown
  onNavigate: (callback: (path: string, params: Record<string, string>) => void) => RouterReturn
  offNavigate: (callback: (path: string, params: Record<string, string>) => void) => RouterReturn
  start: () => RouterReturn
  currentPath: Readonly<import('vue').Ref<string>>
  params: import('vue').ComputedRef<Record<string, string>>
  query: import('vue').ComputedRef<Record<string, string>>
  state: Readonly<import('vue').Ref<unknown>>
}

/**
 * Vue composable for client-side routing.
 *
 * Provides reactive route state with parameter extraction and navigation.
 * Works with browser History API.
 *
 * @example
 * ```vue
 * <script setup>
 * import { useRouter } from 'stellify-framework'
 *
 * const router = useRouter()
 *
 * // Register routes
 * router
 *   .register('/users/:id', (params) => {
 *     console.log('User ID:', params.id)
 *   })
 *   .register('/posts/:slug', (params) => {
 *     console.log('Post:', params.slug)
 *   })
 *   .start()
 *
 * // Navigate
 * router.navigate('/users/123')
 * </script>
 *
 * <template>
 *   <div>Current path: {{ router.currentPath }}</div>
 *   <div>Params: {{ router.params }}</div>
 * </template>
 * ```
 */
export function useRouter(): RouterReturn {
  // Internal state
  const routes = ref<Route[]>([])
  const currentPath = ref('')
  const currentParams = ref<Record<string, string>>({})
  const currentQuery = ref<Record<string, string>>({})
  const currentState = ref<unknown>(null)

  // Listeners
  const listeners: Array<(path: string, params: Record<string, string>) => void> = []

  // Helper to convert path to regex
  const pathToRegex = (path: string): { pattern: RegExp; paramNames: string[] } => {
    const paramNames: string[] = []
    const pattern = path
      .replace(/\//g, '\\/')
      .replace(/:(\w+)/g, (_, name) => {
        paramNames.push(name)
        return '([^\\/]+)'
      })
    return {
      pattern: new RegExp(`^${pattern}$`),
      paramNames
    }
  }

  // Helper to notify listeners
  const notifyListeners = (path: string, params: Record<string, string>): void => {
    for (const listener of listeners) {
      listener(path, params)
    }
  }

  // Helper to resolve current route
  const resolve = (): void => {
    const path = currentPath.value

    for (const route of routes.value) {
      const match = path.match(route.pattern)
      if (match) {
        const params: Record<string, string> = {}
        route.paramNames.forEach((name, i) => {
          params[name] = match[i + 1]
        })
        currentParams.value = params
        route.handler(params)
        notifyListeners(path, params)
        return
      }
    }

    // No match
    currentParams.value = {}
  }

  // Helper to update query params
  const updateQuery = (): void => {
    if (typeof window === 'undefined') return

    const params: Record<string, string> = {}
    const searchParams = new URLSearchParams(window.location.search)
    searchParams.forEach((value, key) => {
      params[key] = value
    })
    currentQuery.value = params
  }

  // Handle popstate
  const handlePopState = (): void => {
    if (typeof window !== 'undefined') {
      currentPath.value = window.location.pathname
      currentState.value = window.history.state
      updateQuery()
      resolve()
    }
  }

  /**
   * Register a route with a handler
   */
  const register = (path: string, handler: RouteHandler) => {
    const { pattern, paramNames } = pathToRegex(path)
    routes.value = [...routes.value, { path, pattern, paramNames, handler }]
    return routerReturn
  }

  /**
   * Navigate to a path
   */
  const navigate = (path: string, options: NavigateOptions = {}) => {
    if (typeof window === 'undefined') return routerReturn

    if (options.replace) {
      window.history.replaceState(options.state || null, '', path)
    } else {
      window.history.pushState(options.state || null, '', path)
    }

    currentPath.value = path
    currentState.value = options.state || null
    updateQuery()
    resolve()
    return routerReturn
  }

  /**
   * Alias for navigate (Laravel-style)
   */
  const push = (path: string, options: NavigateOptions = {}) => {
    return navigate(path, options)
  }

  /**
   * Navigate back
   */
  const back = () => {
    if (typeof window !== 'undefined') {
      window.history.back()
    }
    return routerReturn
  }

  /**
   * Navigate forward
   */
  const forward = () => {
    if (typeof window !== 'undefined') {
      window.history.forward()
    }
    return routerReturn
  }

  /**
   * Get current route params
   */
  const getParams = (): Record<string, string> => {
    return { ...currentParams.value }
  }

  /**
   * Get current query params
   */
  const getQuery = (): Record<string, string> => {
    return { ...currentQuery.value }
  }

  /**
   * Get current path
   */
  const getCurrent = (): string => {
    return currentPath.value
  }

  /**
   * Get current history state
   */
  const getState = (): unknown => {
    return currentState.value
  }

  /**
   * Add navigation listener
   */
  const onNavigate = (callback: (path: string, params: Record<string, string>) => void) => {
    listeners.push(callback)
    return routerReturn
  }

  /**
   * Remove navigation listener
   */
  const offNavigate = (callback: (path: string, params: Record<string, string>) => void) => {
    const index = listeners.indexOf(callback)
    if (index !== -1) {
      listeners.splice(index, 1)
    }
    return routerReturn
  }

  /**
   * Start the router (resolve current path)
   */
  const start = () => {
    resolve()
    return routerReturn
  }

  // Computed values
  const params = computed(() => currentParams.value)
  const query = computed(() => currentQuery.value)
  const path = computed(() => currentPath.value)

  // Initialize
  if (typeof window !== 'undefined') {
    currentPath.value = window.location.pathname
    currentState.value = window.history.state
    updateQuery()
  }

  // Lifecycle - set up popstate listener
  onMounted(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('popstate', handlePopState)
    }
  })

  onUnmounted(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('popstate', handlePopState)
    }
  })

  const routerReturn = {
    // Methods (same surface as old Router class)
    register,
    navigate,
    push,
    back,
    forward,
    getParams,
    getQuery,
    getCurrent,
    getState,
    onNavigate,
    offNavigate,
    start,

    // Reactive state (new - Vue composable style)
    currentPath: readonly(currentPath),
    params,
    query,
    state: readonly(currentState),
  }

  return routerReturn
}
