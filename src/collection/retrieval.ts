/**
 * Retrieval atomics - get, first, firstWhere, last, before, after, random, pluck, only, except
 */

import type { Predicate, Operator } from './types'
import { parseOperator, compareValues } from './operators'
import { search } from './misc'

/**
 * Get item at index
 */
export function get<T>(items: readonly T[], index: number, defaultValue?: T): T | undefined {
  return items[index] ?? defaultValue
}

/**
 * Get the first item, optionally matching a predicate
 */
export function first<T>(items: readonly T[], predicate?: Predicate<T>): T | undefined {
  if (!predicate) {
    return items[0]
  }
  for (let i = 0; i < items.length; i++) {
    if (predicate(items[i], i)) {
      return items[i]
    }
  }
  return undefined
}

/**
 * Get the first item matching key/value, with optional operator
 */
export function firstWhere<T>(
  items: readonly T[],
  key: keyof T,
  operatorOrValue?: Operator | unknown,
  value?: unknown
): T | undefined {
  const { operator, compareValue } = parseOperator(operatorOrValue, value)
  return first(items, (item) => compareValues(item[key], operator, compareValue))
}

/**
 * Get the last item, optionally matching a predicate
 */
export function last<T>(items: readonly T[], predicate?: Predicate<T>): T | undefined {
  if (!predicate) {
    return items[items.length - 1]
  }
  for (let i = items.length - 1; i >= 0; i--) {
    if (predicate(items[i], i)) {
      return items[i]
    }
  }
  return undefined
}

/**
 * Get the item before a given item
 */
export function before<T>(items: readonly T[], item: T): T | undefined {
  const index = search(items, item)
  if (index <= 0) return undefined
  return items[index - 1]
}

/**
 * Get the item after a given item
 */
export function after<T>(items: readonly T[], item: T): T | undefined {
  const index = search(items, item)
  if (index === -1 || index >= items.length - 1) return undefined
  return items[index + 1]
}

/**
 * Get a random item
 */
export function random<T>(items: readonly T[]): T | undefined
export function random<T>(items: readonly T[], count: number): T[]
export function random<T>(items: readonly T[], count?: number): T | T[] | undefined {
  if (items.length === 0) return count === undefined ? undefined : []

  if (count === undefined) {
    return items[Math.floor(Math.random() * items.length)]
  }

  const shuffled = [...items].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

/**
 * Extract values for a given key
 */
export function pluck<T, K extends keyof T>(items: readonly T[], key: K): T[K][]
export function pluck<T, K extends keyof T, V extends keyof T>(
  items: readonly T[],
  value: K,
  keyBy: V
): Map<T[V], T[K]>
export function pluck<T, K extends keyof T, V extends keyof T>(
  items: readonly T[],
  key: K,
  keyBy?: V
): T[K][] | Map<T[V], T[K]> {
  if (keyBy !== undefined) {
    const map = new Map<T[V], T[K]>()
    for (const item of items) {
      map.set(item[keyBy], item[key])
    }
    return map
  }
  return items.map(item => item[key])
}

/**
 * Get only specified keys from each item
 */
export function only<T, K extends keyof T>(items: readonly T[], keys: K[]): Pick<T, K>[] {
  return items.map(item => {
    const result = {} as Pick<T, K>
    for (const key of keys) {
      if (key in (item as object)) {
        result[key] = item[key]
      }
    }
    return result
  })
}

/**
 * Get all keys except specified ones from each item
 */
export function except<T, K extends keyof T>(items: readonly T[], keys: K[]): Omit<T, K>[] {
  const keySet = new Set(keys)
  return items.map(item => {
    const result = {} as Omit<T, K>
    for (const key in item) {
      if (!keySet.has(key as unknown as K)) {
        (result as Record<string, unknown>)[key] = item[key]
      }
    }
    return result
  })
}
