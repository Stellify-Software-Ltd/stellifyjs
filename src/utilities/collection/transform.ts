/**
 * Transform atomics - map, flatMap, mapWithKeys, flatten, collapse, flip
 */

import type { Mapper, KeyMapper } from './types'

/**
 * Map each item through a callback
 */
export function map<T, U>(items: readonly T[], mapper: Mapper<T, U>): U[] {
  return items.map((item, i) => mapper(item, i))
}

/**
 * Map and flatten by one level
 */
export function flatMap<T, U>(items: readonly T[], mapper: Mapper<T, U[]>): U[] {
  return items.flatMap((item, i) => mapper(item, i))
}

/**
 * Map to key/value pairs
 */
export function mapWithKeys<T>(items: readonly T[], mapper: KeyMapper<T>): Map<string | number, unknown> {
  const result = new Map<string | number, unknown>()
  for (let i = 0; i < items.length; i++) {
    const { key, value } = mapper(items[i], i)
    result.set(key, value)
  }
  return result
}

/**
 * Flatten nested arrays
 */
export function flatten<T>(items: readonly T[], depth: number = 1): unknown[] {
  return (items as unknown[]).flat(depth)
}

/**
 * Collapse an array of arrays into a single flat array
 */
export function collapse<T>(items: readonly T[]): unknown[] {
  return (items as unknown[]).flat(1)
}

/**
 * Flip keys and values (for simple arrays)
 */
export function flip<T>(items: readonly T[]): Map<unknown, number> {
  const result = new Map<unknown, number>()
  for (let i = 0; i < items.length; i++) {
    result.set(items[i], i)
  }
  return result
}
