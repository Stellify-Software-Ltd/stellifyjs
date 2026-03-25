import { type Ref } from 'vue';
/**
 * Supported query param types
 */
type QueryParamType = 'string' | 'number' | 'boolean' | 'array';
/**
 * Configuration for a single query parameter
 */
interface QueryParamConfig<T = unknown> {
    /**
     * Default value when param is not in URL
     */
    default: T;
    /**
     * Type for automatic coercion (default: inferred from default value)
     */
    type?: QueryParamType;
    /**
     * Debounce delay in ms before updating URL (useful for search inputs)
     */
    debounce?: number;
    /**
     * Use history.replaceState instead of pushState (default: true)
     */
    replace?: boolean;
    /**
     * Transform value before setting in URL
     */
    serialize?: (value: T) => string;
    /**
     * Transform value after reading from URL
     */
    deserialize?: (value: string) => T;
    /**
     * Validate value - return false to reject and use default
     */
    validate?: (value: T) => boolean;
}
/**
 * Shorthand config: just a default value
 */
type ShorthandConfig<T> = T;
/**
 * Full schema type
 */
type QuerySchema = Record<string, QueryParamConfig<unknown> | ShorthandConfig<unknown>>;
/**
 * Extract the value type from a config
 */
type ExtractValueType<C> = C extends QueryParamConfig<infer T> ? T : C;
/**
 * Return type: refs for each param
 */
type QueryStateReturn<S extends QuerySchema> = {
    [K in keyof S]: Ref<ExtractValueType<S[K]>>;
} & {
    /**
     * Get all current values as an object
     */
    getAll: () => {
        [K in keyof S]: ExtractValueType<S[K]>;
    };
    /**
     * Set multiple values at once
     */
    setAll: (values: Partial<{
        [K in keyof S]: ExtractValueType<S[K]>;
    }>) => void;
    /**
     * Reset all values to defaults
     */
    reset: () => void;
    /**
     * Get the current URL with query params
     */
    getUrl: () => string;
};
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
export declare function useQueryState<S extends QuerySchema>(schema: S): QueryStateReturn<S>;
export {};
