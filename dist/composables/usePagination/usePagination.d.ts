import type { PaginationOptions, PaginationReturn } from './types';
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
export declare function usePagination<T = unknown>(options: PaginationOptions): PaginationReturn<T>;
