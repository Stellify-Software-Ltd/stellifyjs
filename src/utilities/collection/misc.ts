/**
 * Misc atomics - search, join, implode, count, keys, values, toJson
 */

import type { Predicate } from './types'

/**
 * Search for an item and return its index
 */
export function search<T>(items: readonly T[], item: T): number
export function search<T>(items: readonly T[], predicate: Predicate<T>): number
export function search<T>(items: readonly T[], itemOrPredicate: T | Predicate<T>): number {
  if (typeof itemOrPredicate === 'function') {
    return items.findIndex((item, i) => (itemOrPredicate as Predicate<T>)(item, i))
  }
  return items.indexOf(itemOrPredicate as T)
}

/**
 * Join items with a separator
 */
export function join<T>(items: readonly T[], glue: string = ', ', finalGlue?: string): string {
  if (items.length === 0) return ''
  if (items.length === 1) return String(items[0])

  if (finalGlue !== undefined) {
    const allButLast = items.slice(0, -1)
    return allButLast.join(glue) + finalGlue + items[items.length - 1]
  }

  return items.join(glue)
}

/**
 * Join items by key with a separator
 */
export function implode<T>(items: readonly T[], key: keyof T, glue: string = ', '): string {
  return items.map(item => item[key]).join(glue)
}

/**
 * Get item count
 */
export function count<T>(items: readonly T[]): number {
  return items.length
}

/**
 * Get all keys (indices)
 */
export function keys<T>(items: readonly T[]): number[] {
  return Array.from({ length: items.length }, (_, i) => i)
}

/**
 * Get all values (copy)
 */
export function values<T>(items: readonly T[]): T[] {
  return [...items]
}

/**
 * Convert to JSON string
 */
export function toJson<T>(items: readonly T[]): string {
  return JSON.stringify(items)
}
