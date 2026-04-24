/**
 * Operator parsing and comparison helpers
 */

import type { Operator } from './types'

/**
 * Parse operator and value from flexible arguments
 */
export function parseOperator(
  operatorOrValue?: Operator | unknown,
  value?: unknown
): { operator: Operator; compareValue: unknown } {
  if (value !== undefined) {
    return { operator: operatorOrValue as Operator, compareValue: value }
  }
  return { operator: '===', compareValue: operatorOrValue }
}

/**
 * Compare two values using an operator
 */
export function compareValues(
  itemValue: unknown,
  operator: Operator,
  compareValue: unknown
): boolean {
  switch (operator) {
    case '=':
    case '==':
      return itemValue == compareValue
    case '===':
      return itemValue === compareValue
    case '!=':
    case '<>':
      return itemValue != compareValue
    case '!==':
      return itemValue !== compareValue
    case '<':
      return (itemValue as number) < (compareValue as number)
    case '<=':
      return (itemValue as number) <= (compareValue as number)
    case '>':
      return (itemValue as number) > (compareValue as number)
    case '>=':
      return (itemValue as number) >= (compareValue as number)
    default:
      return itemValue === compareValue
  }
}
