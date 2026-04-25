import { ref, watch, unref, onMounted, type Ref } from 'vue'
import { Http } from '../../utilities/http'
import { readFromUrl, writeToUrl } from './urlSync'
import type {
  PaginationOptions,
  PaginationReturn,
  PaginationMeta,
  LaravelPaginationResponse,
} from './types'

/**
 * Vue composable for server-side paginated data fetching.
 *
 * Works with Laravel's LengthAwarePaginator response format.
 * Automatically fetches on mount and when params change.
 *
 * @example
 * ```ts
 * import { ref, computed } from 'vue'
 * import { usePagination } from 'stellify-framework'
 *
 * const filters = ref({ status: 'active' })
 * const sort = ref({ key: 'date', direction: 'desc' })
 *
 * const params = computed(() => ({
 *   ...filters.value,
 *   sort: sort.value.key,
 *   direction: sort.value.direction,
 * }))
 *
 * const { rows, meta, isLoading, goToPage, nextPage, prevPage } = usePagination({
 *   endpoint: '/api/transactions',
 *   params,
 * })
 * ```
 */
export function usePagination<T = unknown>(
  options: PaginationOptions
): PaginationReturn<T> {
  const {
    endpoint,
    perPage: configPerPage = 25,
    params: userParams,
    syncUrl = false,
  } = options

  // Internal state
  const page = ref(1)
  const perPage = ref(configPerPage)
  const rows = ref<T[]>([]) as Ref<T[]>
  const meta = ref<PaginationMeta | null>(null)
  const isLoading = ref(false)
  const error = ref<Error | null>(null)

  // Request ID for race condition handling
  let currentRequestId = 0

  /**
   * Convert params to string record for Http
   */
  function toStringParams(params: Record<string, unknown>): Record<string, string> {
    const result: Record<string, string> = {}
    for (const [key, value] of Object.entries(params)) {
      if (value !== null && value !== undefined && value !== '') {
        result[key] = String(value)
      }
    }
    return result
  }

  /**
   * Fetch a page of data
   */
  async function fetchPage(): Promise<void> {
    const requestId = ++currentRequestId

    isLoading.value = true
    error.value = null

    try {
      const paramsValue = unref(userParams) ?? {}
      const query = toStringParams({
        page: page.value,
        per_page: perPage.value,
        ...paramsValue,
      })

      const response = await Http.get<LaravelPaginationResponse<T>>(endpoint, {
        params: query,
      })

      // Check if this is still the latest request
      if (requestId !== currentRequestId) {
        return // Discard stale response
      }

      rows.value = response.data
      meta.value = {
        currentPage: response.meta.current_page,
        lastPage: response.meta.last_page,
        perPage: response.meta.per_page,
        total: response.meta.total,
        from: response.meta.from,
        to: response.meta.to,
      }

      // Sync to URL if enabled
      if (syncUrl) {
        writeToUrl({
          page: page.value,
          perPage: perPage.value,
          params: paramsValue,
        })
      }
    } catch (err) {
      // Check if this is still the latest request
      if (requestId !== currentRequestId) {
        return // Discard stale error
      }

      error.value = err instanceof Error ? err : new Error(String(err))
    } finally {
      // Only set isLoading false for the current request
      if (requestId === currentRequestId) {
        isLoading.value = false
      }
    }
  }

  /**
   * Navigate to a specific page
   */
  function goToPage(targetPage: number): void {
    const lastPage = meta.value?.lastPage ?? 1
    const clamped = Math.max(1, Math.min(targetPage, lastPage))
    if (clamped !== page.value) {
      page.value = clamped
    }
  }

  /**
   * Navigate to next page
   */
  function nextPage(): void {
    goToPage(page.value + 1)
  }

  /**
   * Navigate to previous page
   */
  function prevPage(): void {
    goToPage(page.value - 1)
  }

  /**
   * Navigate to first page
   */
  function firstPage(): void {
    goToPage(1)
  }

  /**
   * Navigate to last page
   */
  function lastPage(): void {
    const last = meta.value?.lastPage ?? 1
    goToPage(last)
  }

  /**
   * Manually refresh current page
   */
  async function refresh(): Promise<void> {
    return fetchPage()
  }

  // Watch page changes - trigger fetch
  watch(page, () => {
    fetchPage()
  })

  // Watch params changes - reset page to 1 and fetch
  if (userParams) {
    watch(
      () => unref(userParams),
      () => {
        page.value = 1
        fetchPage()
      },
      { deep: true }
    )
  }

  // Initialize
  onMounted(() => {
    // Read from URL if syncUrl is enabled
    if (syncUrl) {
      const paramKeys = Object.keys(unref(userParams) ?? {})
      const urlState = readFromUrl(paramKeys)

      if (urlState.page !== null) {
        page.value = urlState.page
      }
      if (urlState.perPage !== null) {
        perPage.value = urlState.perPage
      }
      // Note: URL params are merged with userParams by consumer if needed
    }

    // Initial fetch
    fetchPage()
  })

  return {
    rows,
    meta,
    isLoading,
    error,
    goToPage,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    refresh,
  }
}
