/**
 * Predicate atomics - contains, doesntContain, has, isEmpty, isNotEmpty, every, some
 */

import type { Predicate } from './types'

/**
 * Check if array contains an item or matches predicate
 */
export function contains<T>(
  items: readonly T[],
  keyOrValue: keyof T | T | Predicate<T>,
  value?: unknown
): boolean {
  // Predicate function
  if (typeof keyOrValue === 'function') {
    return items.some((item, i) => (keyOrValue as Predicate<T>)(item, i))
  }

  // Key/value pair
  if (value !== undefined) {
    return items.some(item => item[keyOrValue as keyof T] === value)
  }

  // Direct value check
  return items.includes(keyOrValue as T)
}

/**
 * Inverse of contains
 */
export function doesntContain<T>(
  items: readonly T[],
  keyOrValue: keyof T | T | Predicate<T>,
  value?: unknown
): boolean {
  return !contains(items, keyOrValue, value)
}

/**
 * Check if index exists
 */
export function has<T>(items: readonly T[], index: number): boolean {
  return index >= 0 && index < items.length
}

/**
 * Check if array is empty
 */
export function isEmpty<T>(items: readonly T[]): boolean {
  return items.length === 0
}

/**
 * Check if array is not empty
 */
export function isNotEmpty<T>(items: readonly T[]): boolean {
  return items.length > 0
}

/**
 * Check if all items pass predicate
 */
export function every<T>(items: readonly T[], predicate: Predicate<T>): boolean {
  return items.every((item, i) => predicate(item, i))
}

/**
 * Check if any item passes predicate
 */
export function some<T>(items: readonly T[], predicate: Predicate<T>): boolean {
  return items.some((item, i) => predicate(item, i))
}
