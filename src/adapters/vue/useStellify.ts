import { shallowRef, triggerRef } from 'vue'

type AnyModule = Record<string, unknown>

export function useStellify<T extends AnyModule>(module: T): T {
  const moduleRef = shallowRef(module)

  const handler: ProxyHandler<T> = {
    get(target, prop) {
      const value = target[prop as keyof T]

      if (typeof value === 'function') {
        return (...args: unknown[]) => {
          const result = (value as Function).apply(target, args)

          // If method returns the module (chainable), trigger reactivity
          if (result === target) {
            triggerRef(moduleRef)
          }

          return result
        }
      }

      return value
    }
  }

  return new Proxy(module, handler)
}
