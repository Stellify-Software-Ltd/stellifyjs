import { ref, shallowRef, computed, onMounted, onUnmounted, watch, type Ref } from 'vue'
import { Http } from '../../http'
import { Collection } from '../../collection'

/**
 * Laravel pagination response structure
 */
interface PaginatedResponse<T> {
  data: T[]
  current_page: number
  last_page: number
  per_page: number
  total: number
  next_page_url: string | null
  prev_page_url: string | null
  // Cursor pagination
  next_cursor?: string | null
  prev_cursor?: string | null
}

/**
 * Options for useInfiniteScroll
 */
interface InfiniteScrollOptions<T> {
  /**
   * Number of items per page (default: 15)
   */
  perPage?: number

  /**
   * Element to observe for scroll position.
   * Can be a ref, a function returning an element, or undefined for window.
   */
  scrollElement?: Ref<HTMLElement | null> | (() => HTMLElement | null)

  /**
   * Distance from bottom (in px) to trigger loading (default: 200)
   */
  threshold?: number

  /**
   * Start loading automatically on mount (default: true)
   */
  immediate?: boolean

  /**
   * Use cursor-based pagination instead of page numbers
   */
  cursor?: boolean

  /**
   * Custom query params to include with each request
   */
  params?: Record<string, string | number | boolean>

  /**
   * Direction to load more items: 'down' appends, 'up' prepends (default: 'down')
   */
  direction?: 'down' | 'up'

  /**
   * Transform each item after fetching
   */
  transform?: (item: unknown) => T

  /**
   * Unique key field for deduplication (default: 'id')
   */
  keyField?: keyof T

  /**
   * Custom HTTP instance to use
   */
  http?: typeof Http
}

/**
 * Return type for useInfiniteScroll
 */
interface InfiniteScrollReturn<T> {
  /**
   * All loaded items as a reactive Collection
   */
  items: Ref<Collection<T>>

  /**
   * Whether currently loading
   */
  loading: Ref<boolean>

  /**
   * Whether there are more items to load
   */
  hasMore: Ref<boolean>

  /**
   * Any error that occurred
   */
  error: Ref<Error | null>

  /**
   * Current page number (or cursor)
   */
  page: Ref<number | string>

  /**
   * Total number of items (if known)
   */
  total: Ref<number | null>

  /**
   * Manually load more items
   */
  loadMore: () => Promise<void>

  /**
   * Reset and reload from the beginning
   */
  reset: () => Promise<void>

  /**
   * Reload current data without resetting
   */
  refresh: () => Promise<void>

  /**
   * Ref to attach to the sentinel element for intersection observation
   */
  sentinelRef: Ref<HTMLElement | null>
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
export function useInfiniteScroll<T = unknown>(
  endpoint: string,
  options: InfiniteScrollOptions<T> = {}
): InfiniteScrollReturn<T> {
  const {
    perPage = 15,
    scrollElement,
    threshold = 200,
    immediate = true,
    cursor = false,
    params = {},
    direction = 'down',
    transform,
    keyField = 'id' as keyof T,
    http = Http,
  } = options

  // State
  const items = shallowRef<Collection<T>>(Collection.collect<T>([]))
  const loading = ref(false)
  const hasMore = ref(true)
  const error = ref<Error | null>(null)
  const page = ref<number | string>(cursor ? '' : 1)
  const total = ref<number | null>(null)
  const sentinelRef = ref<HTMLElement | null>(null)

  // Track seen IDs to prevent duplicates
  const seenIds = new Set<unknown>()

  // Intersection observer
  let observer: IntersectionObserver | null = null

  /**
   * Build URL with query params
   */
  const buildUrl = (pageValue: number | string): string => {
    // Handle relative URLs without requiring window.location.origin
    // This makes the composable work in SSR and non-standard browser contexts
    try {
      // Try to construct a full URL
      const origin = typeof window !== 'undefined' && window.location?.origin
        ? window.location.origin
        : 'http://localhost'
      const url = new URL(endpoint, origin)

      // Add custom params
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, String(value))
      }

      // Add pagination params
      url.searchParams.set('per_page', String(perPage))

      if (cursor) {
        if (pageValue) {
          url.searchParams.set('cursor', String(pageValue))
        }
      } else {
        url.searchParams.set('page', String(pageValue))
      }

      return url.pathname + url.search
    } catch {
      // Fallback: manually build query string for relative URLs
      const queryParams = new URLSearchParams()

      // Add custom params
      for (const [key, value] of Object.entries(params)) {
        queryParams.set(key, String(value))
      }

      // Add pagination params
      queryParams.set('per_page', String(perPage))

      if (cursor) {
        if (pageValue) {
          queryParams.set('cursor', String(pageValue))
        }
      } else {
        queryParams.set('page', String(pageValue))
      }

      const queryString = queryParams.toString()
      return queryString ? `${endpoint}?${queryString}` : endpoint
    }
  }

  /**
   * Fetch a page of data
   */
  const fetchPage = async (pageValue: number | string): Promise<PaginatedResponse<T>> => {
    const url = buildUrl(pageValue)
    const response = await http.get<PaginatedResponse<T>>(url)
    return response
  }

  /**
   * Process and merge new items
   */
  const mergeItems = (newItems: T[], prepend: boolean = false): void => {
    // Filter out duplicates
    const uniqueItems = newItems.filter(item => {
      const key = item[keyField]
      if (seenIds.has(key)) {
        return false
      }
      seenIds.add(key)
      return true
    })

    // Apply transform if provided
    const transformedItems = transform
      ? uniqueItems.map(transform)
      : uniqueItems

    // Merge with existing items
    const currentItems = items.value.all()
    if (prepend) {
      items.value = Collection.collect([...transformedItems, ...currentItems])
    } else {
      items.value = Collection.collect([...currentItems, ...transformedItems])
    }
  }

  /**
   * Load more items
   */
  const loadMore = async (): Promise<void> => {
    if (loading.value || !hasMore.value) {
      return
    }

    loading.value = true
    error.value = null

    try {
      const response = await fetchPage(page.value)

      // Update total if available
      if (response.total !== undefined) {
        total.value = response.total
      }

      // Merge new items
      const prepend = direction === 'up'
      mergeItems(response.data, prepend)

      // Update pagination state
      if (cursor) {
        // Cursor-based pagination
        const nextCursor = direction === 'up'
          ? response.prev_cursor
          : response.next_cursor

        if (nextCursor) {
          page.value = nextCursor
        } else {
          hasMore.value = false
        }
      } else {
        // Page-based pagination
        const currentPage = response.current_page
        const lastPage = response.last_page

        if (direction === 'up') {
          if (currentPage > 1) {
            page.value = currentPage - 1
          } else {
            hasMore.value = false
          }
        } else {
          if (currentPage < lastPage) {
            page.value = currentPage + 1
          } else {
            hasMore.value = false
          }
        }
      }
    } catch (e) {
      error.value = e instanceof Error ? e : new Error(String(e))
    } finally {
      loading.value = false

      // After loading completes, check if sentinel is still visible
      // This handles the case where all content fits on screen
      if (hasMore.value && sentinelRef.value) {
        // Use requestAnimationFrame to let the DOM update first
        requestAnimationFrame(() => {
          if (!sentinelRef.value) return
          const rect = sentinelRef.value.getBoundingClientRect()
          const isVisible = rect.top < window.innerHeight + threshold
          if (isVisible && !loading.value && hasMore.value) {
            loadMore()
          }
        })
      }
    }
  }

  /**
   * Reset and reload from the beginning
   */
  const reset = async (): Promise<void> => {
    // Clear state
    items.value = Collection.collect<T>([])
    seenIds.clear()
    page.value = cursor ? '' : 1
    hasMore.value = true
    error.value = null
    total.value = null

    // Load first page
    await loadMore()
  }

  /**
   * Refresh current data without resetting pagination state
   */
  const refresh = async (): Promise<void> => {
    // Store current page
    const currentPage = page.value

    // Reset to beginning
    items.value = Collection.collect<T>([])
    seenIds.clear()
    page.value = cursor ? '' : 1
    hasMore.value = true
    error.value = null

    // Reload all pages up to current
    if (cursor) {
      // For cursor pagination, we can only reload from start
      await loadMore()
    } else {
      // For page-based, reload all pages
      const targetPage = typeof currentPage === 'number' ? currentPage : 1
      for (let p = 1; p <= targetPage && hasMore.value; p++) {
        await loadMore()
      }
    }
  }

  /**
   * Get the scroll container element
   */
  const getScrollElement = (): HTMLElement | null => {
    if (!scrollElement) {
      return null // Will use document
    }
    if (typeof scrollElement === 'function') {
      return scrollElement()
    }
    return scrollElement.value
  }

  /**
   * Set up intersection observer
   */
  const setupObserver = (): void => {
    if (observer) {
      observer.disconnect()
    }

    const root = getScrollElement()

    observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting && hasMore.value && !loading.value) {
          loadMore()
        }
      },
      {
        root,
        rootMargin: `${threshold}px`,
        threshold: 0,
      }
    )

    // Observe sentinel element when available
    if (sentinelRef.value) {
      observer.observe(sentinelRef.value)
    }
  }

  /**
   * Watch for sentinel element changes
   */
  watch(sentinelRef, (el) => {
    if (observer) {
      observer.disconnect()
      if (el) {
        observer.observe(el)
      }
    }
  })

  /**
   * Watch for hasMore changes to reconnect observer
   */
  watch(hasMore, (value) => {
    if (value && sentinelRef.value && observer) {
      observer.observe(sentinelRef.value)
    }
  })

  // Lifecycle
  onMounted(() => {
    setupObserver()

    if (immediate) {
      loadMore()
    }
  })

  onUnmounted(() => {
    if (observer) {
      observer.disconnect()
      observer = null
    }
  })

  return {
    items: items as Ref<Collection<T>>,
    loading,
    hasMore,
    error,
    page,
    total,
    loadMore,
    reset,
    refresh,
    sentinelRef,
  }
}
