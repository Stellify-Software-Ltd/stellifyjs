/**
 * Aggregate atomics - reduce, sum, avg, min, max, median, mode
 */

import type { Reducer } from './types'

/**
 * Reduce to a single value
 */
export function reduce<T, U>(items: readonly T[], reducer: Reducer<T, U>, initial: U): U {
  return items.reduce((acc, item, i) => reducer(acc, item, i), initial)
}

/**
 * Get sum of items or key values
 */
export function sum<T>(items: readonly T[], key?: keyof T): number {
  if (key === undefined) {
    return (items as unknown as number[]).reduce((a, b) => a + b, 0)
  }
  return items.reduce((s, item) => s + (item[key] as unknown as number), 0)
}

/**
 * Get average of items or key values
 */
export function avg<T>(items: readonly T[], key?: keyof T): number {
  if (items.length === 0) return 0
  return sum(items, key) / items.length
}

/**
 * Get minimum value
 */
export function min<T>(items: readonly T[], key?: keyof T): T | T[keyof T] | undefined {
  if (items.length === 0) return undefined

  if (key === undefined) {
    return items.reduce((minVal, item) => item < minVal ? item : minVal)
  }

  let minItem = items[0]
  for (const item of items) {
    if (item[key] < minItem[key]) {
      minItem = item
    }
  }
  return minItem[key]
}

/**
 * Get maximum value
 */
export function max<T>(items: readonly T[], key?: keyof T): T | T[keyof T] | undefined {
  if (items.length === 0) return undefined

  if (key === undefined) {
    return items.reduce((maxVal, item) => item > maxVal ? item : maxVal)
  }

  let maxItem = items[0]
  for (const item of items) {
    if (item[key] > maxItem[key]) {
      maxItem = item
    }
  }
  return maxItem[key]
}

/**
 * Get median value
 */
export function median<T>(items: readonly T[], key?: keyof T): number | undefined {
  if (items.length === 0) return undefined

  const values = key !== undefined
    ? items.map(item => item[key] as unknown as number)
    : items as unknown as number[]

  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)

  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2
  }
  return sorted[mid]
}

/**
 * Get mode value(s)
 */
export function mode<T>(items: readonly T[], key?: keyof T): T[] | T[keyof T][] | undefined {
  if (items.length === 0) return undefined

  const values = key !== undefined
    ? items.map(item => item[key])
    : items

  const counts = new Map<unknown, number>()
  let maxCount = 0

  for (const val of values) {
    const count = (counts.get(val) || 0) + 1
    counts.set(val, count)
    if (count > maxCount) maxCount = count
  }

  const result: unknown[] = []
  for (const [val, count] of counts) {
    if (count === maxCount) {
      result.push(val)
    }
  }

  return result as T[] | T[keyof T][]
}
