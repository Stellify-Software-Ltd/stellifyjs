/**
 * Filter atomics - filter, reject, unique, duplicates
 */

import type { Predicate } from './types'

/**
 * Filter items using a callback
 */
export function filter<T>(items: readonly T[], predicate: Predicate<T>): T[] {
  return items.filter((item, i) => predicate(item, i))
}

/**
 * Reject items matching predicate (inverse of filter)
 */
export function reject<T>(items: readonly T[], predicate: Predicate<T>): T[] {
  return items.filter((item, i) => !predicate(item, i))
}

/**
 * Get unique items, optionally by key
 */
export function unique<T>(items: readonly T[], key?: keyof T): T[] {
  if (key === undefined) {
    return [...new Set(items)]
  }

  const seen = new Set()
  const result: T[] = []
  for (const item of items) {
    const val = item[key]
    if (!seen.has(val)) {
      seen.add(val)
      result.push(item)
    }
  }
  return result
}

/**
 * Get duplicate items, optionally by key
 */
export function duplicates<T>(items: readonly T[], key?: keyof T): T[] {
  const seen = new Map<unknown, number>()
  const result: T[] = []

  for (const item of items) {
    const val = key ? item[key] : item
    const count = seen.get(val) || 0
    seen.set(val, count + 1)
    if (count === 1) {
      result.push(item)
    }
  }
  return result
}
