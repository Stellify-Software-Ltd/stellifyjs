import { type Ref } from 'vue';
import { Http } from '../../http';
import { Collection } from '../../collection';
/**
 * Options for useInfiniteScroll
 */
interface InfiniteScrollOptions<T> {
    /**
     * Number of items per page (default: 15)
     */
    perPage?: number;
    /**
     * Element to observe for scroll position.
     * Can be a ref, a function returning an element, or undefined for window.
     */
    scrollElement?: Ref<HTMLElement | null> | (() => HTMLElement | null);
    /**
     * Distance from bottom (in px) to trigger loading (default: 200)
     */
    threshold?: number;
    /**
     * Start loading automatically on mount (default: true)
     */
    immediate?: boolean;
    /**
     * Use cursor-based pagination instead of page numbers
     */
    cursor?: boolean;
    /**
     * Custom query params to include with each request
     */
    params?: Record<string, string | number | boolean>;
    /**
     * Direction to load more items: 'down' appends, 'up' prepends (default: 'down')
     */
    direction?: 'down' | 'up';
    /**
     * Transform each item after fetching
     */
    transform?: (item: unknown) => T;
    /**
     * Unique key field for deduplication (default: 'id')
     */
    keyField?: keyof T;
    /**
     * Custom HTTP instance to use
     */
    http?: typeof Http;
}
/**
 * Return type for useInfiniteScroll
 */
interface InfiniteScrollReturn<T> {
    /**
     * All loaded items as a reactive Collection
     */
    items: Ref<Collection<T>>;
    /**
     * Whether currently loading
     */
    loading: Ref<boolean>;
    /**
     * Whether there are more items to load
     */
    hasMore: Ref<boolean>;
    /**
     * Any error that occurred
     */
    error: Ref<Error | null>;
    /**
     * Current page number (or cursor)
     */
    page: Ref<number | string>;
    /**
     * Total number of items (if known)
     */
    total: Ref<number | null>;
    /**
     * Manually load more items
     */
    loadMore: () => Promise<void>;
    /**
     * Reset and reload from the beginning
     */
    reset: () => Promise<void>;
    /**
     * Reload current data without resetting
     */
    refresh: () => Promise<void>;
    /**
     * Ref to attach to the sentinel element for intersection observation
     */
    sentinelRef: Ref<HTMLElement | null>;
}
/**
 * Infinite scroll composable for Vue 3
 *
 * Automatically loads more data as the user scrolls, using IntersectionObserver
 * for performance. Works with Laravel's pagination responses out of the box.
 *
 * @example
 * ```vue
 * <script setup>
 * import { useInfiniteScroll } from 'stellify-framework'
 *
 * const { items, loading, hasMore, sentinelRef } = useInfiniteScroll('/api/posts', {
 *   perPage: 20,
 *   threshold: 300,
 * })
 * </script>
 *
 * <template>
 *   <div v-for="post in items" :key="post.id">
 *     {{ post.title }}
 *   </div>
 *   <div ref="sentinelRef" v-if="hasMore">
 *     <span v-if="loading">Loading...</span>
 *   </div>
 * </template>
 * ```
 */
export declare function useInfiniteScroll<T = unknown>(endpoint: string, options?: InfiniteScrollOptions<T>): InfiniteScrollReturn<T>;
export {};
