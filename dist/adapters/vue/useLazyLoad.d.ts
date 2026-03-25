import { type Ref } from 'vue';
/**
 * Options for useLazyLoad
 */
interface LazyLoadOptions {
    /**
     * Root margin for IntersectionObserver (default: '0px')
     * Use positive values like '100px' to pre-load before element is visible
     */
    rootMargin?: string;
    /**
     * Threshold for visibility (0-1, default: 0)
     * 0 = trigger when any part visible, 1 = trigger when fully visible
     */
    threshold?: number;
    /**
     * Whether to fetch immediately when visible (default: true)
     * Set to false to manually trigger with load()
     */
    immediate?: boolean;
    /**
     * Only load once, even if element leaves and re-enters viewport (default: true)
     */
    once?: boolean;
    /**
     * Custom root element for intersection (default: viewport)
     */
    root?: Ref<HTMLElement | null> | (() => HTMLElement | null);
}
/**
 * Return type for useLazyLoad
 */
interface LazyLoadReturn<T> {
    /**
     * The loaded data
     */
    data: Ref<T | null>;
    /**
     * Whether the element is visible in viewport
     */
    visible: Ref<boolean>;
    /**
     * Whether data is currently loading
     */
    loading: Ref<boolean>;
    /**
     * Whether data has been loaded at least once
     */
    loaded: Ref<boolean>;
    /**
     * Any error that occurred during loading
     */
    error: Ref<Error | null>;
    /**
     * Ref to attach to the target element
     */
    targetRef: Ref<HTMLElement | null>;
    /**
     * Manually trigger loading
     */
    load: () => Promise<void>;
    /**
     * Reset state and allow re-loading
     */
    reset: () => void;
}
/**
 * Lazy load composable for Vue 3
 *
 * Defers data fetching until an element enters the viewport.
 * Uses IntersectionObserver for efficient visibility detection.
 *
 * @example
 * ```vue
 * <script setup>
 * import { useLazyLoad } from 'stellify-framework'
 * import { Http } from 'stellify-framework'
 *
 * // Basic usage
 * const { data, loading, visible, targetRef } = useLazyLoad(
 *   () => Http.get('/api/heavy-data')
 * )
 *
 * // Pre-load when 200px away from viewport
 * const { data: comments } = useLazyLoad(
 *   () => Http.get('/api/comments'),
 *   { rootMargin: '200px' }
 * )
 *
 * // Manual loading control
 * const { data, load, visible } = useLazyLoad(
 *   () => Http.get('/api/data'),
 *   { immediate: false }
 * )
 * </script>
 *
 * <template>
 *   <div ref="targetRef">
 *     <template v-if="visible">
 *       <div v-if="loading">Loading...</div>
 *       <div v-else-if="data">{{ data }}</div>
 *     </template>
 *     <div v-else class="placeholder">
 *       <!-- Placeholder content -->
 *     </div>
 *   </div>
 * </template>
 * ```
 */
export declare function useLazyLoad<T = unknown>(fetcher: () => Promise<T>, options?: LazyLoadOptions): LazyLoadReturn<T>;
export {};
