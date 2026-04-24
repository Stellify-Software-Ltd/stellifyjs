/**
 * Ordering atomics - sort, sortBy, sortByDesc, sortDesc, reverse, shuffle
 */

/**
 * Sort items
 */
export function sort<T>(items: readonly T[], comparator?: (a: T, b: T) => number): T[] {
  const sorted = [...items]
  sorted.sort(comparator)
  return sorted
}

/**
 * Sort by key ascending
 */
export function sortBy<T>(items: readonly T[], key: keyof T): T[]
export function sortBy<T>(items: readonly T[], callback: (item: T) => unknown): T[]
export function sortBy<T>(items: readonly T[], keyOrCallback: keyof T | ((item: T) => unknown)): T[] {
  const sorted = [...items]
  sorted.sort((a, b) => {
    const aVal: unknown = typeof keyOrCallback === 'function' ? keyOrCallback(a) : a[keyOrCallback]
    const bVal: unknown = typeof keyOrCallback === 'function' ? keyOrCallback(b) : b[keyOrCallback]
    if ((aVal as number) < (bVal as number)) return -1
    if ((aVal as number) > (bVal as number)) return 1
    return 0
  })
  return sorted
}

/**
 * Sort by key descending
 */
export function sortByDesc<T>(items: readonly T[], key: keyof T): T[]
export function sortByDesc<T>(items: readonly T[], callback: (item: T) => unknown): T[]
export function sortByDesc<T>(items: readonly T[], keyOrCallback: keyof T | ((item: T) => unknown)): T[] {
  const sorted = [...items]
  sorted.sort((a, b) => {
    const aVal: unknown = typeof keyOrCallback === 'function' ? keyOrCallback(a) : a[keyOrCallback]
    const bVal: unknown = typeof keyOrCallback === 'function' ? keyOrCallback(b) : b[keyOrCallback]
    if ((aVal as number) < (bVal as number)) return 1
    if ((aVal as number) > (bVal as number)) return -1
    return 0
  })
  return sorted
}

/**
 * Sort descending
 */
export function sortDesc<T>(items: readonly T[]): T[] {
  const sorted = [...items]
  sorted.sort((a, b) => {
    if (a < b) return 1
    if (a > b) return -1
    return 0
  })
  return sorted
}

/**
 * Reverse the order
 */
export function reverse<T>(items: readonly T[]): T[] {
  return [...items].reverse()
}

/**
 * Shuffle the items randomly
 */
export function shuffle<T>(items: readonly T[]): T[] {
  const shuffled = [...items]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}
