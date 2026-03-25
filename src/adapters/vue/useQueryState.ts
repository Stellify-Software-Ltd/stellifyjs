import { ref, watch, onMounted, onUnmounted, type Ref } from 'vue'

/**
 * Supported query param types
 */
type QueryParamType = 'string' | 'number' | 'boolean' | 'array'

/**
 * Configuration for a single query parameter
 */
interface QueryParamConfig<T = unknown> {
  /**
   * Default value when param is not in URL
   */
  default: T

  /**
   * Type for automatic coercion (default: inferred from default value)
   */
  type?: QueryParamType

  /**
   * Debounce delay in ms before updating URL (useful for search inputs)
   */
  debounce?: number

  /**
   * Use history.replaceState instead of pushState (default: true)
   */
  replace?: boolean

  /**
   * Transform value before setting in URL
   */
  serialize?: (value: T) => string

  /**
   * Transform value after reading from URL
   */
  deserialize?: (value: string) => T

  /**
   * Validate value - return false to reject and use default
   */
  validate?: (value: T) => boolean
}

/**
 * Shorthand config: just a default value
 */
type ShorthandConfig<T> = T

/**
 * Full schema type
 */
type QuerySchema = Record<string, QueryParamConfig<unknown> | ShorthandConfig<unknown>>

/**
 * Extract the value type from a config
 */
type ExtractValueType<C> = C extends QueryParamConfig<infer T>
  ? T
  : C

/**
 * Return type: refs for each param
 */
type QueryStateReturn<S extends QuerySchema> = {
  [K in keyof S]: Ref<ExtractValueType<S[K]>>
} & {
  /**
   * Get all current values as an object
   */
  getAll: () => { [K in keyof S]: ExtractValueType<S[K]> }

  /**
   * Set multiple values at once
   */
  setAll: (values: Partial<{ [K in keyof S]: ExtractValueType<S[K]> }>) => void

  /**
   * Reset all values to defaults
   */
  reset: () => void

  /**
   * Get the current URL with query params
   */
  getUrl: () => string
}

/**
 * Infer type from a default value
 */
const inferType = (value: unknown): QueryParamType => {
  if (typeof value === 'number') return 'number'
  if (typeof value === 'boolean') return 'boolean'
  if (Array.isArray(value)) return 'array'
  return 'string'
}

/**
 * Parse a string value to the target type
 */
const parseValue = (
  value: string | null,
  type: QueryParamType,
  defaultValue: unknown
): unknown => {
  if (value === null || value === '') {
    return defaultValue
  }

  switch (type) {
    case 'number': {
      const num = Number(value)
      return isNaN(num) ? defaultValue : num
    }

    case 'boolean':
      return value === 'true' || value === '1'

    case 'array':
      return value.split(',').filter(Boolean)

    case 'string':
    default:
      return value
  }
}

/**
 * Serialize a value to string for URL
 */
const serializeValue = (value: unknown, type: QueryParamType): string => {
  if (value === null || value === undefined) {
    return ''
  }

  switch (type) {
    case 'array':
      return Array.isArray(value) ? value.join(',') : ''

    case 'boolean':
      return value ? 'true' : 'false'

    case 'number':
    case 'string':
    default:
      return String(value)
  }
}

/**
 * Normalize config to full form
 */
const normalizeConfig = <T>(config: QueryParamConfig<T> | T): QueryParamConfig<T> => {
  if (
    typeof config === 'object' &&
    config !== null &&
    'default' in config
  ) {
    return config as QueryParamConfig<T>
  }

  return {
    default: config as T,
  }
}

/**
 * Query state composable for Vue 3
 *
 * Provides two-way binding between reactive state and URL query parameters.
 * Changes to refs update the URL, and URL changes (back/forward) update the refs.
 *
 * @example
 * ```vue
 * <script setup>
 * import { useQueryState } from 'stellify-framework'
 *
 * // Simple usage
 * const { search, page, sort } = useQueryState({
 *   search: '',
 *   page: 1,
 *   sort: 'created_at',
 * })
 *
 * // With full config
 * const { filter, tags } = useQueryState({
 *   filter: {
 *     default: '',
 *     debounce: 300,
 *   },
 *   tags: {
 *     default: [] as string[],
 *     type: 'array',
 *   },
 * })
 * </script>
 *
 * <template>
 *   <input v-model="search" placeholder="Search..." />
 *   <button @click="page++">Next Page</button>
 * </template>
 * ```
 */
export function useQueryState<S extends QuerySchema>(
  schema: S
): QueryStateReturn<S> {
  // Normalize all configs
  const configs: Record<string, QueryParamConfig<unknown>> = {}
  for (const [key, config] of Object.entries(schema)) {
    configs[key] = normalizeConfig(config)
  }

  // Create refs for each param
  const refs: Record<string, Ref<unknown>> = {}
  const debounceTimers: Record<string, ReturnType<typeof setTimeout>> = {}

  /**
   * Read current URL params
   */
  const readFromUrl = (): Record<string, unknown> => {
    const searchParams = new URLSearchParams(window.location.search)
    const values: Record<string, unknown> = {}

    for (const [key, config] of Object.entries(configs)) {
      const urlValue = searchParams.get(key)
      const type = config.type ?? inferType(config.default)

      let value: unknown

      if (config.deserialize && urlValue !== null) {
        value = config.deserialize(urlValue)
      } else {
        value = parseValue(urlValue, type, config.default)
      }

      // Validate
      if (config.validate && !config.validate(value)) {
        value = config.default
      }

      values[key] = value
    }

    return values
  }

  /**
   * Write values to URL
   */
  const writeToUrl = (replace: boolean = true): void => {
    const searchParams = new URLSearchParams()

    for (const [key, config] of Object.entries(configs)) {
      const value = refs[key].value
      const type = config.type ?? inferType(config.default)

      // Skip default values to keep URL clean
      const isDefault = JSON.stringify(value) === JSON.stringify(config.default)
      if (isDefault) {
        continue
      }

      const serialized = config.serialize
        ? config.serialize(value)
        : serializeValue(value, type)

      if (serialized) {
        searchParams.set(key, serialized)
      }
    }

    const newSearch = searchParams.toString()
    const newUrl = newSearch
      ? `${window.location.pathname}?${newSearch}`
      : window.location.pathname

    if (replace) {
      window.history.replaceState(null, '', newUrl)
    } else {
      window.history.pushState(null, '', newUrl)
    }
  }

  /**
   * Initialize refs from URL
   */
  const initializeRefs = (): void => {
    const initialValues = readFromUrl()

    for (const [key, config] of Object.entries(configs)) {
      const initialValue = initialValues[key] ?? config.default
      refs[key] = ref(initialValue)

      // Set up watcher for each ref
      watch(refs[key], (newValue) => {
        const debounceMs = config.debounce ?? 0
        const shouldReplace = config.replace ?? true

        // Clear existing timer
        if (debounceTimers[key]) {
          clearTimeout(debounceTimers[key])
        }

        if (debounceMs > 0) {
          debounceTimers[key] = setTimeout(() => {
            writeToUrl(shouldReplace)
          }, debounceMs)
        } else {
          writeToUrl(shouldReplace)
        }
      })
    }
  }

  /**
   * Handle popstate (back/forward navigation)
   */
  const handlePopState = (): void => {
    const values = readFromUrl()

    for (const [key, value] of Object.entries(values)) {
      if (refs[key]) {
        refs[key].value = value
      }
    }
  }

  /**
   * Get all current values
   */
  const getAll = (): Record<string, unknown> => {
    const values: Record<string, unknown> = {}
    for (const key of Object.keys(configs)) {
      values[key] = refs[key].value
    }
    return values
  }

  /**
   * Set multiple values at once
   */
  const setAll = (values: Record<string, unknown>): void => {
    for (const [key, value] of Object.entries(values)) {
      if (refs[key]) {
        refs[key].value = value
      }
    }
  }

  /**
   * Reset all values to defaults
   */
  const reset = (): void => {
    for (const [key, config] of Object.entries(configs)) {
      refs[key].value = config.default
    }
  }

  /**
   * Get the current URL with query params
   */
  const getUrl = (): string => {
    const searchParams = new URLSearchParams()

    for (const [key, config] of Object.entries(configs)) {
      const value = refs[key].value
      const type = config.type ?? inferType(config.default)

      const isDefault = JSON.stringify(value) === JSON.stringify(config.default)
      if (isDefault) continue

      const serialized = config.serialize
        ? config.serialize(value)
        : serializeValue(value, type)

      if (serialized) {
        searchParams.set(key, serialized)
      }
    }

    const search = searchParams.toString()
    return search
      ? `${window.location.pathname}?${search}`
      : window.location.pathname
  }

  // Initialize
  initializeRefs()

  // Lifecycle
  onMounted(() => {
    window.addEventListener('popstate', handlePopState)
  })

  onUnmounted(() => {
    window.removeEventListener('popstate', handlePopState)

    // Clear any pending debounce timers
    for (const timer of Object.values(debounceTimers)) {
      clearTimeout(timer)
    }
  })

  // Build return object with refs and helpers
  const result = {
    getAll,
    setAll,
    reset,
    getUrl,
  } as QueryStateReturn<S>

  for (const key of Object.keys(configs)) {
    (result as Record<string, unknown>)[key] = refs[key]
  }

  return result
}
