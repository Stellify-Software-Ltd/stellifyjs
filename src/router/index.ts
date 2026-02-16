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

export class Router {
  private routes: Route[] = []
  private currentPath: string = ''
  private listeners: Array<(path: string, params: Record<string, string>) => void> = []

  private constructor() {
    if (typeof window !== 'undefined') {
      this.currentPath = window.location.pathname
      window.addEventListener('popstate', () => this.handlePopState())
    }
  }

  static create(): Router {
    return new Router()
  }

  private pathToRegex(path: string): { pattern: RegExp; paramNames: string[] } {
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

  register(path: string, handler: RouteHandler): Router {
    const { pattern, paramNames } = this.pathToRegex(path)
    this.routes.push({ path, pattern, paramNames, handler })
    return this
  }

  navigate(path: string, options: NavigateOptions = {}): Router {
    if (typeof window === 'undefined') return this

    if (options.replace) {
      window.history.replaceState(options.state || null, '', path)
    } else {
      window.history.pushState(options.state || null, '', path)
    }

    this.currentPath = path
    this.resolve()
    return this
  }

  back(): Router {
    if (typeof window !== 'undefined') {
      window.history.back()
    }
    return this
  }

  forward(): Router {
    if (typeof window !== 'undefined') {
      window.history.forward()
    }
    return this
  }

  private handlePopState(): void {
    if (typeof window !== 'undefined') {
      this.currentPath = window.location.pathname
      this.resolve()
    }
  }

  private resolve(): void {
    const path = this.currentPath

    for (const route of this.routes) {
      const match = path.match(route.pattern)
      if (match) {
        const params: Record<string, string> = {}
        route.paramNames.forEach((name, i) => {
          params[name] = match[i + 1]
        })
        route.handler(params)
        this.notifyListeners(path, params)
        return
      }
    }
  }

  getParams(): Record<string, string> {
    const path = this.currentPath

    for (const route of this.routes) {
      const match = path.match(route.pattern)
      if (match) {
        const params: Record<string, string> = {}
        route.paramNames.forEach((name, i) => {
          params[name] = match[i + 1]
        })
        return params
      }
    }

    return {}
  }

  getQuery(): Record<string, string> {
    if (typeof window === 'undefined') return {}

    const params: Record<string, string> = {}
    const searchParams = new URLSearchParams(window.location.search)
    searchParams.forEach((value, key) => {
      params[key] = value
    })
    return params
  }

  getCurrent(): string {
    return this.currentPath
  }

  getState(): unknown {
    if (typeof window === 'undefined') return null
    return window.history.state
  }

  onNavigate(callback: (path: string, params: Record<string, string>) => void): Router {
    this.listeners.push(callback)
    return this
  }

  offNavigate(callback: (path: string, params: Record<string, string>) => void): Router {
    this.listeners = this.listeners.filter(l => l !== callback)
    return this
  }

  private notifyListeners(path: string, params: Record<string, string>): void {
    for (const listener of this.listeners) {
      listener(path, params)
    }
  }

  start(): Router {
    this.resolve()
    return this
  }
}
