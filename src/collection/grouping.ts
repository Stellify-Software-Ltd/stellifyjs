/**
 * Grouping atomics - keyBy, groupBy, countBy, partition
 */

import type { Predicate } from './types'

/**
 * Key the collection by a field
 */
export function keyBy<T>(items: readonly T[], key: keyof T): Map<unknown, T>
export function keyBy<T>(items: readonly T[], callback: (item: T) => string | number): Map<string | number, T>
export function keyBy<T>(
  items: readonly T[],
  keyOrCallback: keyof T | ((item: T) => string | number)
): Map<unknown, T> {
  const result = new Map<unknown, T>()
  for (const item of items) {
    const k = typeof keyOrCallback === 'function'
      ? keyOrCallback(item)
      : item[keyOrCallback]
    result.set(k, item)
  }
  return result
}

/**
 * Group items by key or callback
 */
export function groupBy<T>(items: readonly T[], key: keyof T): Map<unknown, T[]>
export function groupBy<T>(items: readonly T[], callback: (item: T) => string | number): Map<string | number, T[]>
export function groupBy<T>(
  items: readonly T[],
  keyOrCallback: keyof T | ((item: T) => string | number)
): Map<unknown, T[]> {
  const groups = new Map<unknown, T[]>()
  for (const item of items) {
    const k = typeof keyOrCallback === 'function'
      ? keyOrCallback(item)
      : item[keyOrCallback]
    if (!groups.has(k)) {
      groups.set(k, [])
    }
    groups.get(k)!.push(item)
  }
  return groups
}

/**
 * Count occurrences by key or callback
 */
export function countBy<T>(items: readonly T[], key?: keyof T): Map<unknown, number>
export function countBy<T>(items: readonly T[], callback: (item: T) => string | number): Map<string | number, number>
export function countBy<T>(
  items: readonly T[],
  keyOrCallback?: keyof T | ((item: T) => string | number)
): Map<unknown, number> {
  const counts = new Map<unknown, number>()
  for (const item of items) {
    const k = keyOrCallback === undefined
      ? item
      : typeof keyOrCallback === 'function'
        ? keyOrCallback(item)
        : item[keyOrCallback]
    counts.set(k, (counts.get(k) || 0) + 1)
  }
  return counts
}

/**
 * Partition items into two arrays based on predicate
 */
export function partition<T>(items: readonly T[], predicate: Predicate<T>): [T[], T[]] {
  const pass: T[] = []
  const fail: T[] = []
  for (let i = 0; i < items.length; i++) {
    if (predicate(items[i], i)) {
      pass.push(items[i])
    } else {
      fail.push(items[i])
    }
  }
  return [pass, fail]
}
