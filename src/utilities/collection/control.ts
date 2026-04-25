/**
 * Control flow atomics - each, tap, pipe, when, unless, whenEmpty, whenNotEmpty
 */

/**
 * Iterate over each item
 */
export function each<T>(items: readonly T[], callback: (item: T, index: number) => void | false): void {
  for (let i = 0; i < items.length; i++) {
    if (callback(items[i], i) === false) break
  }
}

/**
 * Pass items to callback for side effects, return items unchanged
 */
export function tap<T>(items: readonly T[], callback: (items: readonly T[]) => void): T[] {
  callback(items)
  return [...items]
}

/**
 * Pass items to callback, return result
 */
export function pipe<T, U>(items: readonly T[], callback: (items: readonly T[]) => U): U {
  return callback(items)
}

/**
 * Conditionally apply transformation
 */
export function when<T, U>(
  items: readonly T[],
  condition: boolean | (() => boolean),
  callback: (items: readonly T[]) => U[],
  fallback?: (items: readonly T[]) => U[]
): T[] | U[] {
  const shouldRun = typeof condition === 'function' ? condition() : condition
  if (shouldRun) {
    return callback(items)
  }
  if (fallback) {
    return fallback(items)
  }
  return [...items]
}

/**
 * Inverse of when
 */
export function unless<T, U>(
  items: readonly T[],
  condition: boolean | (() => boolean),
  callback: (items: readonly T[]) => U[],
  fallback?: (items: readonly T[]) => U[]
): T[] | U[] {
  const shouldSkip = typeof condition === 'function' ? condition() : condition
  return when(items, !shouldSkip, callback, fallback)
}

/**
 * Apply callback if array is empty
 */
export function whenEmpty<T, U>(
  items: readonly T[],
  callback: (items: readonly T[]) => U[]
): T[] | U[] {
  return when(items, items.length === 0, callback)
}

/**
 * Apply callback if array is not empty
 */
export function whenNotEmpty<T, U>(
  items: readonly T[],
  callback: (items: readonly T[]) => U[]
): T[] | U[] {
  return when(items, items.length > 0, callback)
}
