/**
 * Get a value from an object by dot-path
 */
export function get(obj: unknown, path: string): unknown {
  if (!path) return obj
  const parts = path.split('.')
  let current: unknown = obj

  for (const part of parts) {
    if (current === null || current === undefined) return undefined
    if (typeof current !== 'object') return undefined
    current = (current as Record<string, unknown>)[part]
  }

  return current
}

/**
 * Set a value in an object by dot-path, creating intermediates as needed
 */
export function set(obj: unknown, path: string, value: unknown): void {
  if (!path) return
  const parts = path.split('.')
  let current = obj as Record<string, unknown>

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i]
    const nextPart = parts[i + 1]
    const isNextIndex = /^\d+$/.test(nextPart)

    if (current[part] === undefined || current[part] === null) {
      current[part] = isNextIndex ? [] : {}
    }
    current = current[part] as Record<string, unknown>
  }

  current[parts[parts.length - 1]] = value
}

/**
 * Expand wildcard paths against actual data
 * 'items.*.name' with items=[{}, {}, {}] returns ['items.0.name', 'items.1.name', 'items.2.name']
 */
export function expandWildcards(obj: unknown, pattern: string): string[] {
  if (!pattern.includes('*')) return [pattern]

  const parts = pattern.split('.')
  const results: string[] = []

  function expand(current: unknown, partIndex: number, currentPath: string): void {
    if (partIndex >= parts.length) {
      results.push(currentPath)
      return
    }

    const part = parts[partIndex]

    if (part === '*') {
      if (!Array.isArray(current)) return
      for (let i = 0; i < current.length; i++) {
        const newPath = currentPath ? `${currentPath}.${i}` : String(i)
        expand(current[i], partIndex + 1, newPath)
      }
    } else {
      const newPath = currentPath ? `${currentPath}.${part}` : part
      if (current === null || current === undefined) {
        expand(undefined, partIndex + 1, newPath)
      } else if (typeof current === 'object') {
        expand((current as Record<string, unknown>)[part], partIndex + 1, newPath)
      } else {
        expand(undefined, partIndex + 1, newPath)
      }
    }
  }

  expand(obj, 0, '')
  return results
}

/**
 * Deep clone an object (handles primitives, arrays, plain objects, dates)
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as T
  }

  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item)) as T
  }

  const cloned = {} as Record<string, unknown>
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone((obj as Record<string, unknown>)[key])
    }
  }
  return cloned as T
}

/**
 * Deep equality check
 */
export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (a === null || b === null) return a === b
  if (typeof a !== typeof b) return false
  if (typeof a !== 'object') return a === b

  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime()
  }

  if (Array.isArray(a) !== Array.isArray(b)) return false

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false
    return a.every((item, i) => deepEqual(item, b[i]))
  }

  const aObj = a as Record<string, unknown>
  const bObj = b as Record<string, unknown>
  const aKeys = Object.keys(aObj)
  const bKeys = Object.keys(bObj)

  if (aKeys.length !== bKeys.length) return false

  return aKeys.every(key => deepEqual(aObj[key], bObj[key]))
}
