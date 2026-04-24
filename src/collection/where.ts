/**
 * Where atomics - where, whereIn, whereNotIn, whereBetween, whereNotBetween, whereNull, whereNotNull
 */

import type { Operator } from './types'
import { parseOperator, compareValues } from './operators'

/**
 * Filter items where key matches value, with optional operator
 */
export function where<T>(
  items: readonly T[],
  key: keyof T,
  operatorOrValue?: Operator | unknown,
  value?: unknown
): T[] {
  const { operator, compareValue } = parseOperator(operatorOrValue, value)
  return items.filter((item) => compareValues(item[key], operator, compareValue))
}

/**
 * Filter items where key is in array of values
 */
export function whereIn<T>(items: readonly T[], key: keyof T, values: unknown[]): T[] {
  const valueSet = new Set(values)
  return items.filter((item) => valueSet.has(item[key]))
}

/**
 * Filter items where key is not in array of values
 */
export function whereNotIn<T>(items: readonly T[], key: keyof T, values: unknown[]): T[] {
  const valueSet = new Set(values)
  return items.filter((item) => !valueSet.has(item[key]))
}

/**
 * Filter items where key is between two values
 */
export function whereBetween<T>(items: readonly T[], key: keyof T, range: [number, number]): T[] {
  const [min, max] = range
  return items.filter((item) => {
    const val = item[key] as unknown as number
    return val >= min && val <= max
  })
}

/**
 * Filter items where key is not between two values
 */
export function whereNotBetween<T>(items: readonly T[], key: keyof T, range: [number, number]): T[] {
  const [min, max] = range
  return items.filter((item) => {
    const val = item[key] as unknown as number
    return val < min || val > max
  })
}

/**
 * Filter items where key is null or undefined
 */
export function whereNull<T>(items: readonly T[], key: keyof T): T[] {
  return items.filter((item) => item[key] == null)
}

/**
 * Filter items where key is not null or undefined
 */
export function whereNotNull<T>(items: readonly T[], key: keyof T): T[] {
  return items.filter((item) => item[key] != null)
}
