/**
 * Slicing atomics - take, takeWhile, takeUntil, skip, skipWhile, skipUntil, slice, forPage, split, chunk, sliding, nth
 */

import type { Predicate } from './types'

/**
 * Take the first n items
 */
export function take<T>(items: readonly T[], count: number): T[] {
  if (count < 0) {
    return items.slice(count)
  }
  return items.slice(0, count)
}

/**
 * Take items while predicate is true
 */
export function takeWhile<T>(items: readonly T[], predicate: Predicate<T>): T[] {
  const result: T[] = []
  for (let i = 0; i < items.length; i++) {
    if (!predicate(items[i], i)) break
    result.push(items[i])
  }
  return result
}

/**
 * Take items until predicate is true
 */
export function takeUntil<T>(items: readonly T[], predicate: Predicate<T>): T[] {
  const result: T[] = []
  for (let i = 0; i < items.length; i++) {
    if (predicate(items[i], i)) break
    result.push(items[i])
  }
  return result
}

/**
 * Skip the first n items
 */
export function skip<T>(items: readonly T[], count: number): T[] {
  return items.slice(count)
}

/**
 * Skip items while predicate is true
 */
export function skipWhile<T>(items: readonly T[], predicate: Predicate<T>): T[] {
  let index = 0
  for (let i = 0; i < items.length; i++) {
    if (!predicate(items[i], i)) break
    index = i + 1
  }
  return items.slice(index)
}

/**
 * Skip items until predicate is true
 */
export function skipUntil<T>(items: readonly T[], predicate: Predicate<T>): T[] {
  let index = 0
  for (let i = 0; i < items.length; i++) {
    if (predicate(items[i], i)) break
    index = i + 1
  }
  return items.slice(index)
}

/**
 * Get a slice of the collection
 */
export function slice<T>(items: readonly T[], start?: number, end?: number): T[] {
  return items.slice(start, end)
}

/**
 * Get items for a specific page
 */
export function forPage<T>(items: readonly T[], page: number, perPage: number): T[] {
  const start = (page - 1) * perPage
  return items.slice(start, start + perPage)
}

/**
 * Split into n groups
 */
export function split<T>(items: readonly T[], count: number): T[][] {
  if (count <= 0) return []

  const size = Math.ceil(items.length / count)
  const result: T[][] = []

  for (let i = 0; i < items.length; i += size) {
    result.push(items.slice(i, i + size))
  }
  return result
}

/**
 * Break into chunks of given size
 */
export function chunk<T>(items: readonly T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size))
  }
  return chunks
}

/**
 * Get sliding windows of items
 */
export function sliding<T>(items: readonly T[], size: number, step: number = 1): T[][] {
  const result: T[][] = []
  for (let i = 0; i <= items.length - size; i += step) {
    result.push(items.slice(i, i + size))
  }
  return result
}

/**
 * Get every nth item
 */
export function nth<T>(items: readonly T[], step: number, offset: number = 0): T[] {
  const result: T[] = []
  for (let i = offset; i < items.length; i += step) {
    result.push(items[i])
  }
  return result
}
