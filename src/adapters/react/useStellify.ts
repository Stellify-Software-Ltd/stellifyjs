import { useState, useCallback, useMemo } from 'react'

type AnyModule = Record<string, unknown>

export function useStellify<T extends AnyModule>(module: T): T {
  const [, forceUpdate] = useState(0)

  const rerender = useCallback(() => {
    forceUpdate(n => n + 1)
  }, [])

  const proxy = useMemo(() => {
    const handler: ProxyHandler<T> = {
      get(target, prop) {
        const value = target[prop as keyof T]

        if (typeof value === 'function') {
          return (...args: unknown[]) => {
            const result = (value as Function).apply(target, args)

            // If method returns the module (chainable), rerender
            if (result === target) {
              rerender()
            }

            return result
          }
        }

        return value
      }
    }

    return new Proxy(module, handler)
  }, [module, rerender])

  return proxy
}
