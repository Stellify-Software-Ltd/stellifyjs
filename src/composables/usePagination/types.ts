import type { Ref, ComputedRef } from 'vue'

/**
 * Pagination metadata from Laravel LengthAwarePaginator
 */
export interface PaginationMeta {
  currentPage: number
  lastPage: number
  perPage: number
  total: number
  from: number | null
  to: number | null
}

/**
 * Options for usePagination
 */
export interface PaginationOptions {
  /**
   * API endpoint to fetch paginated data from (required)
   */
  endpoint: string

  /**
   * Number of items per page (default: 25)
   */
  perPage?: number

  /**
   * Reactive query params to include in requests.
   * Any change triggers a refetch and resets to page 1.
   */
  params?: Ref<Record<string, unknown>> | ComputedRef<Record<string, unknown>>

  /**
   * Sync pagination state with URL query params (default: false)
   */
  syncUrl?: boolean
}

/**
 * Return type for usePagination
 */
export interface PaginationReturn<T> {
  /**
   * Current page of data
   */
  rows: Ref<T[]>

  /**
   * Pagination metadata (null before first fetch)
   */
  meta: Ref<PaginationMeta | null>

  /**
   * Whether a request is in flight
   */
  isLoading: Ref<boolean>

  /**
   * Error from last request (null on success)
   */
  error: Ref<Error | null>

  /**
   * Navigate to a specific page
   */
  goToPage: (page: number) => void

  /**
   * Navigate to next page
   */
  nextPage: () => void

  /**
   * Navigate to previous page
   */
  prevPage: () => void

  /**
   * Navigate to first page
   */
  firstPage: () => void

  /**
   * Navigate to last page
   */
  lastPage: () => void

  /**
   * Manually refresh current page
   */
  refresh: () => Promise<void>
}

/**
 * Laravel pagination response shape
 */
export interface LaravelPaginationResponse<T> {
  data: T[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
    from: number | null
    to: number | null
  }
  links: {
    first: string | null
    last: string | null
    prev: string | null
    next: string | null
  }
}
