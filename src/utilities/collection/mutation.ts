/**
 * Mutation atomics - push, prepend, pop, shift, forget, pull, put, toggle
 * Note: These return new arrays, not mutate in place (immutable)
 */

/**
 * Add items to the end
 */
export function push<T>(items: readonly T[], ...newItems: T[]): T[] {
  return [...items, ...newItems]
}

/**
 * Add an item to the beginning
 */
export function prepend<T>(items: readonly T[], item: T): T[] {
  return [item, ...items]
}

/**
 * Remove and return the last item
 */
export function pop<T>(items: readonly T[]): { item: T | undefined; items: T[] } {
  if (items.length === 0) {
    return { item: undefined, items: [] }
  }
  return {
    item: items[items.length - 1],
    items: items.slice(0, -1)
  }
}

/**
 * Remove and return the first item
 */
export function shift<T>(items: readonly T[]): { item: T | undefined; items: T[] } {
  if (items.length === 0) {
    return { item: undefined, items: [] }
  }
  return {
    item: items[0],
    items: items.slice(1)
  }
}

/**
 * Remove an item by index
 */
export function forget<T>(items: readonly T[], index: number): T[] {
  const result = [...items]
  result.splice(index, 1)
  return result
}

/**
 * Remove and return an item by index
 */
export function pull<T>(items: readonly T[], index: number): { item: T | undefined; items: T[] } {
  const item = items[index]
  return { item, items: forget(items, index) }
}

/**
 * Set a value at index
 */
export function put<T>(items: readonly T[], index: number, value: T): T[] {
  const result = [...items]
  result[index] = value
  return result
}

/**
 * Toggle an item (add if missing, remove if present)
 */
export function toggle<T>(items: readonly T[], item: T, key?: keyof T): T[] {
  if (key !== undefined) {
    const index = items.findIndex(i => i[key] === (item as T)[key])
    if (index >= 0) {
      return forget(items, index)
    }
    return push(items, item)
  }

  const index = items.indexOf(item)
  if (index >= 0) {
    return forget(items, index)
  }
  return push(items, item)
}
