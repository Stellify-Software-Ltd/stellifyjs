/**
 * Collection - Laravel-style collection class for JavaScript
 *
 * A fluent, immutable wrapper for working with arrays of data.
 * All methods return new Collection instances, leaving the original unchanged.
 *
 * @example
 * const users = Collection.collect([
 *   { id: 1, name: 'John', active: true },
 *   { id: 2, name: 'Jane', active: false },
 * ]);
 *
 * const activeUsers = users.where('active', true);
 * const names = users.pluck('name');
 */

type Predicate<T> = (item: T, index: number) => boolean
type Mapper<T, U> = (item: T, index: number) => U
type Reducer<T, U> = (acc: U, item: T, index: number) => U
type KeyMapper<T> = (item: T, index: number) => { key: string | number; value: unknown }
type Operator = '=' | '==' | '===' | '!=' | '!==' | '<' | '<=' | '>' | '>=' | '<>'

export class Collection<T = unknown> {
  private readonly items: readonly T[]

  private constructor(items: T[] = []) {
    this.items = Object.freeze([...items])
  }

  // ============================================================
  // Static Constructors
  // ============================================================

  /**
   * Create a new Collection instance
   */
  static collect<T>(items: T[] = []): Collection<T> {
    return new Collection(items)
  }

  /**
   * Wrap a value in a Collection
   */
  static wrap<T>(value: T | T[]): Collection<T> {
    if (Array.isArray(value)) {
      return new Collection(value)
    }
    return new Collection([value])
  }

  /**
   * Create a Collection from an iterable
   */
  static from<T>(items: Iterable<T>): Collection<T> {
    return new Collection(Array.from(items))
  }

  /**
   * Create a Collection of numbers in a range
   */
  static range(start: number, end: number, step: number = 1): Collection<number> {
    const items: number[] = []
    if (step > 0) {
      for (let i = start; i < end; i += step) {
        items.push(i)
      }
    } else if (step < 0) {
      for (let i = start; i > end; i += step) {
        items.push(i)
      }
    }
    return new Collection(items)
  }

  /**
   * Create a Collection by invoking a callback n times
   */
  static times<T>(count: number, callback: (index: number) => T): Collection<T> {
    const items: T[] = []
    for (let i = 1; i <= count; i++) {
      items.push(callback(i))
    }
    return new Collection(items)
  }

  // ============================================================
  // Retrieval Methods
  // ============================================================

  /**
   * Get all items as an array
   */
  all(): T[] {
    return [...this.items]
  }

  /**
   * Get item at index
   */
  get(index: number, defaultValue?: T): T | undefined {
    return this.items[index] ?? defaultValue
  }

  /**
   * Get the first item, optionally matching a predicate
   */
  first(predicate?: Predicate<T>): T | undefined {
    if (!predicate) {
      return this.items[0]
    }
    for (let i = 0; i < this.items.length; i++) {
      if (predicate(this.items[i], i)) {
        return this.items[i]
      }
    }
    return undefined
  }

  /**
   * Get the first item matching key/value, with optional operator
   */
  firstWhere(key: keyof T, operatorOrValue?: Operator | unknown, value?: unknown): T | undefined {
    const { operator, compareValue } = this.parseOperator(operatorOrValue, value)
    return this.first((item) => this.compareValues(item[key], operator, compareValue))
  }

  /**
   * Get the last item, optionally matching a predicate
   */
  last(predicate?: Predicate<T>): T | undefined {
    if (!predicate) {
      return this.items[this.items.length - 1]
    }
    for (let i = this.items.length - 1; i >= 0; i--) {
      if (predicate(this.items[i], i)) {
        return this.items[i]
      }
    }
    return undefined
  }

  /**
   * Get the item before a given item
   */
  before(item: T): T | undefined {
    const index = this.search(item)
    if (index <= 0) return undefined
    return this.items[index - 1]
  }

  /**
   * Get the item after a given item
   */
  after(item: T): T | undefined {
    const index = this.search(item)
    if (index === -1 || index >= this.items.length - 1) return undefined
    return this.items[index + 1]
  }

  /**
   * Extract values for a given key
   */
  pluck<K extends keyof T>(key: K): Collection<T[K]>
  pluck<K extends keyof T, V extends keyof T>(value: K, keyBy: V): Map<T[V], T[K]>
  pluck<K extends keyof T, V extends keyof T>(key: K, keyBy?: V): Collection<T[K]> | Map<T[V], T[K]> {
    if (keyBy !== undefined) {
      const map = new Map<T[V], T[K]>()
      for (const item of this.items) {
        map.set(item[keyBy], item[key])
      }
      return map
    }
    return new Collection(this.items.map(item => item[key]))
  }

  /**
   * Get only specified keys from each item
   */
  only<K extends keyof T>(keys: K[]): Collection<Pick<T, K>> {
    return new Collection(
      this.items.map(item => {
        const result = {} as Pick<T, K>
        for (const key of keys) {
          if (key in (item as object)) {
            result[key] = item[key]
          }
        }
        return result
      })
    )
  }

  /**
   * Get all keys except specified ones from each item
   */
  except<K extends keyof T>(keys: K[]): Collection<Omit<T, K>> {
    const keySet = new Set(keys)
    return new Collection(
      this.items.map(item => {
        const result = {} as Omit<T, K>
        for (const key in item) {
          if (!keySet.has(key as unknown as K)) {
            (result as Record<string, unknown>)[key] = item[key]
          }
        }
        return result
      })
    )
  }

  /**
   * Get a random item or items
   */
  random(count?: number): T | Collection<T> | undefined {
    if (this.items.length === 0) return undefined

    if (count === undefined) {
      return this.items[Math.floor(Math.random() * this.items.length)]
    }

    const shuffled = [...this.items].sort(() => Math.random() - 0.5)
    return new Collection(shuffled.slice(0, count))
  }

  // ============================================================
  // Filtering Methods
  // ============================================================

  /**
   * Filter items using a callback
   */
  filter(predicate: Predicate<T>): Collection<T> {
    return new Collection(this.items.filter((item, i) => predicate(item, i)))
  }

  /**
   * Filter items where key matches value, with optional operator
   */
  where(key: keyof T, operatorOrValue?: Operator | unknown, value?: unknown): Collection<T> {
    const { operator, compareValue } = this.parseOperator(operatorOrValue, value)
    return this.filter((item) => this.compareValues(item[key], operator, compareValue))
  }

  /**
   * Filter items where key is in array of values
   */
  whereIn(key: keyof T, values: unknown[]): Collection<T> {
    const valueSet = new Set(values)
    return this.filter((item) => valueSet.has(item[key]))
  }

  /**
   * Filter items where key is not in array of values
   */
  whereNotIn(key: keyof T, values: unknown[]): Collection<T> {
    const valueSet = new Set(values)
    return this.filter((item) => !valueSet.has(item[key]))
  }

  /**
   * Filter items where key is between two values
   */
  whereBetween(key: keyof T, range: [number, number]): Collection<T> {
    const [min, max] = range
    return this.filter((item) => {
      const val = item[key] as unknown as number
      return val >= min && val <= max
    })
  }

  /**
   * Filter items where key is not between two values
   */
  whereNotBetween(key: keyof T, range: [number, number]): Collection<T> {
    const [min, max] = range
    return this.filter((item) => {
      const val = item[key] as unknown as number
      return val < min || val > max
    })
  }

  /**
   * Filter items where key is null or undefined
   */
  whereNull(key: keyof T): Collection<T> {
    return this.filter((item) => item[key] == null)
  }

  /**
   * Filter items where key is not null or undefined
   */
  whereNotNull(key: keyof T): Collection<T> {
    return this.filter((item) => item[key] != null)
  }

  /**
   * Reject items matching predicate (inverse of filter)
   */
  reject(predicate: Predicate<T>): Collection<T> {
    return this.filter((item, i) => !predicate(item, i))
  }

  /**
   * Get unique items, optionally by key
   */
  unique(key?: keyof T): Collection<T> {
    if (key === undefined) {
      return new Collection([...new Set(this.items)])
    }

    const seen = new Set()
    const result: T[] = []
    for (const item of this.items) {
      const val = item[key]
      if (!seen.has(val)) {
        seen.add(val)
        result.push(item)
      }
    }
    return new Collection(result)
  }

  /**
   * Get duplicate items, optionally by key
   */
  duplicates(key?: keyof T): Collection<T> {
    const seen = new Map<unknown, number>()
    const result: T[] = []

    for (const item of this.items) {
      const val = key ? item[key] : item
      const count = seen.get(val) || 0
      seen.set(val, count + 1)
      if (count === 1) {
        result.push(item)
      }
    }
    return new Collection(result)
  }

  // ============================================================
  // Transformation Methods
  // ============================================================

  /**
   * Map each item through a callback
   */
  map<U>(mapper: Mapper<T, U>): Collection<U> {
    return new Collection(this.items.map((item, i) => mapper(item, i)))
  }

  /**
   * Map and flatten by one level
   */
  flatMap<U>(mapper: Mapper<T, U[]>): Collection<U> {
    return new Collection(this.items.flatMap((item, i) => mapper(item, i)))
  }

  /**
   * Map to key/value pairs
   */
  mapWithKeys<U>(mapper: KeyMapper<T>): Map<string | number, unknown> {
    const result = new Map<string | number, unknown>()
    for (let i = 0; i < this.items.length; i++) {
      const { key, value } = mapper(this.items[i], i)
      result.set(key, value)
    }
    return result
  }

  /**
   * Key the collection by a field
   */
  keyBy(key: keyof T): Map<unknown, T>
  keyBy(callback: (item: T) => string | number): Map<string | number, T>
  keyBy(keyOrCallback: keyof T | ((item: T) => string | number)): Map<unknown, T> {
    const result = new Map<unknown, T>()
    for (const item of this.items) {
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
  groupBy(key: keyof T): Map<unknown, Collection<T>>
  groupBy(callback: (item: T) => string | number): Map<string | number, Collection<T>>
  groupBy(keyOrCallback: keyof T | ((item: T) => string | number)): Map<unknown, Collection<T>> {
    const groups = new Map<unknown, T[]>()
    for (const item of this.items) {
      const k = typeof keyOrCallback === 'function'
        ? keyOrCallback(item)
        : item[keyOrCallback]
      if (!groups.has(k)) {
        groups.set(k, [])
      }
      groups.get(k)!.push(item)
    }

    const result = new Map<unknown, Collection<T>>()
    for (const [k, v] of groups) {
      result.set(k, new Collection(v))
    }
    return result
  }

  /**
   * Count occurrences by key or callback
   */
  countBy(key?: keyof T): Map<unknown, number>
  countBy(callback: (item: T) => string | number): Map<string | number, number>
  countBy(keyOrCallback?: keyof T | ((item: T) => string | number)): Map<unknown, number> {
    const counts = new Map<unknown, number>()
    for (const item of this.items) {
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
   * Partition items into two collections based on predicate
   */
  partition(predicate: Predicate<T>): [Collection<T>, Collection<T>] {
    const pass: T[] = []
    const fail: T[] = []
    for (let i = 0; i < this.items.length; i++) {
      if (predicate(this.items[i], i)) {
        pass.push(this.items[i])
      } else {
        fail.push(this.items[i])
      }
    }
    return [new Collection(pass), new Collection(fail)]
  }

  /**
   * Flatten nested arrays
   */
  flatten(depth: number = 1): Collection<unknown> {
    return new Collection((this.items as unknown[]).flat(depth))
  }

  /**
   * Collapse an array of arrays into a single flat collection
   */
  collapse(): Collection<unknown> {
    return new Collection((this.items as unknown[]).flat(1))
  }

  /**
   * Flip keys and values (for simple arrays)
   */
  flip(): Map<unknown, number> {
    const result = new Map<unknown, number>()
    for (let i = 0; i < this.items.length; i++) {
      result.set(this.items[i], i)
    }
    return result
  }

  // ============================================================
  // Ordering Methods
  // ============================================================

  /**
   * Sort items
   */
  sort(comparator?: (a: T, b: T) => number): Collection<T> {
    const sorted = [...this.items]
    sorted.sort(comparator)
    return new Collection(sorted)
  }

  /**
   * Sort by key ascending
   */
  sortBy(key: keyof T): Collection<T>
  sortBy(callback: (item: T) => unknown): Collection<T>
  sortBy(keyOrCallback: keyof T | ((item: T) => unknown)): Collection<T> {
    const sorted = [...this.items]
    sorted.sort((a, b) => {
      const aVal: any = typeof keyOrCallback === 'function' ? keyOrCallback(a) : a[keyOrCallback]
      const bVal: any = typeof keyOrCallback === 'function' ? keyOrCallback(b) : b[keyOrCallback]
      if (aVal < bVal) return -1
      if (aVal > bVal) return 1
      return 0
    })
    return new Collection(sorted)
  }

  /**
   * Sort by key descending
   */
  sortByDesc(key: keyof T): Collection<T>
  sortByDesc(callback: (item: T) => unknown): Collection<T>
  sortByDesc(keyOrCallback: keyof T | ((item: T) => unknown)): Collection<T> {
    const sorted = [...this.items]
    sorted.sort((a, b) => {
      const aVal: any = typeof keyOrCallback === 'function' ? keyOrCallback(a) : a[keyOrCallback]
      const bVal: any = typeof keyOrCallback === 'function' ? keyOrCallback(b) : b[keyOrCallback]
      if (aVal < bVal) return 1
      if (aVal > bVal) return -1
      return 0
    })
    return new Collection(sorted)
  }

  /**
   * Sort descending
   */
  sortDesc(): Collection<T> {
    const sorted = [...this.items]
    sorted.sort((a, b) => {
      if (a < b) return 1
      if (a > b) return -1
      return 0
    })
    return new Collection(sorted)
  }

  /**
   * Reverse the order
   */
  reverse(): Collection<T> {
    return new Collection([...this.items].reverse())
  }

  /**
   * Shuffle the items randomly
   */
  shuffle(): Collection<T> {
    const shuffled = [...this.items]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return new Collection(shuffled)
  }

  // ============================================================
  // Slicing Methods
  // ============================================================

  /**
   * Take the first n items
   */
  take(count: number): Collection<T> {
    if (count < 0) {
      return new Collection(this.items.slice(count))
    }
    return new Collection(this.items.slice(0, count))
  }

  /**
   * Take items while predicate is true
   */
  takeWhile(predicate: Predicate<T>): Collection<T> {
    const result: T[] = []
    for (let i = 0; i < this.items.length; i++) {
      if (!predicate(this.items[i], i)) break
      result.push(this.items[i])
    }
    return new Collection(result)
  }

  /**
   * Take items until predicate is true
   */
  takeUntil(predicate: Predicate<T>): Collection<T> {
    const result: T[] = []
    for (let i = 0; i < this.items.length; i++) {
      if (predicate(this.items[i], i)) break
      result.push(this.items[i])
    }
    return new Collection(result)
  }

  /**
   * Skip the first n items
   */
  skip(count: number): Collection<T> {
    return new Collection(this.items.slice(count))
  }

  /**
   * Skip items while predicate is true
   */
  skipWhile(predicate: Predicate<T>): Collection<T> {
    let index = 0
    for (let i = 0; i < this.items.length; i++) {
      if (!predicate(this.items[i], i)) break
      index = i + 1
    }
    return new Collection(this.items.slice(index))
  }

  /**
   * Skip items until predicate is true
   */
  skipUntil(predicate: Predicate<T>): Collection<T> {
    let index = 0
    for (let i = 0; i < this.items.length; i++) {
      if (predicate(this.items[i], i)) break
      index = i + 1
    }
    return new Collection(this.items.slice(index))
  }

  /**
   * Get a slice of the collection
   */
  slice(start?: number, end?: number): Collection<T> {
    return new Collection(this.items.slice(start, end))
  }

  /**
   * Get items for a specific page
   */
  forPage(page: number, perPage: number): Collection<T> {
    const start = (page - 1) * perPage
    return new Collection(this.items.slice(start, start + perPage))
  }

  /**
   * Split into n groups
   */
  split(count: number): Collection<Collection<T>> {
    if (count <= 0) return new Collection<Collection<T>>([])

    const size = Math.ceil(this.items.length / count)
    const result: Collection<T>[] = []

    for (let i = 0; i < this.items.length; i += size) {
      result.push(new Collection(this.items.slice(i, i + size)))
    }
    return new Collection<Collection<T>>(result)
  }

  /**
   * Break into chunks of given size
   */
  chunk(size: number): Collection<Collection<T>> {
    const chunks: Collection<T>[] = []
    for (let i = 0; i < this.items.length; i += size) {
      chunks.push(new Collection(this.items.slice(i, i + size)))
    }
    return new Collection(chunks)
  }

  /**
   * Get sliding windows of items
   */
  sliding(size: number, step: number = 1): Collection<Collection<T>> {
    const result: Collection<T>[] = []
    for (let i = 0; i <= this.items.length - size; i += step) {
      result.push(new Collection(this.items.slice(i, i + size)))
    }
    return new Collection(result)
  }

  /**
   * Get every nth item
   */
  nth(step: number, offset: number = 0): Collection<T> {
    const result: T[] = []
    for (let i = offset; i < this.items.length; i += step) {
      result.push(this.items[i])
    }
    return new Collection(result)
  }

  // ============================================================
  // Adding/Removing Methods (return new Collection)
  // ============================================================

  /**
   * Add an item to the end
   */
  push(...items: T[]): Collection<T> {
    return new Collection([...this.items, ...items])
  }

  /**
   * Add an item to the beginning
   */
  prepend(item: T): Collection<T> {
    return new Collection([item, ...this.items])
  }

  /**
   * Remove and return the last item
   */
  pop(): { item: T | undefined; collection: Collection<T> } {
    if (this.items.length === 0) {
      return { item: undefined, collection: new Collection<T>([]) }
    }
    return {
      item: this.items[this.items.length - 1],
      collection: new Collection<T>(this.items.slice(0, -1) as T[])
    }
  }

  /**
   * Remove and return the first item
   */
  shift(): { item: T | undefined; collection: Collection<T> } {
    if (this.items.length === 0) {
      return { item: undefined, collection: new Collection<T>([]) }
    }
    return {
      item: this.items[0],
      collection: new Collection<T>(this.items.slice(1) as T[])
    }
  }

  /**
   * Remove an item by key/index
   */
  forget(index: number): Collection<T> {
    const result = [...this.items]
    result.splice(index, 1)
    return new Collection(result)
  }

  /**
   * Remove and return an item by key
   */
  pull(index: number): { item: T | undefined; collection: Collection<T> } {
    const item = this.items[index]
    return { item, collection: this.forget(index) }
  }

  /**
   * Set a value at index
   */
  put(index: number, value: T): Collection<T> {
    const result = [...this.items]
    result[index] = value
    return new Collection(result)
  }

  /**
   * Toggle an item (add if missing, remove if present)
   */
  toggle(item: T, key?: keyof T): Collection<T> {
    if (key !== undefined) {
      const index = this.items.findIndex(i => i[key] === (item as T)[key])
      if (index >= 0) {
        return this.forget(index)
      }
      return this.push(item)
    }

    const index = this.items.indexOf(item)
    if (index >= 0) {
      return this.forget(index)
    }
    return this.push(item)
  }

  // ============================================================
  // Combining Methods
  // ============================================================

  /**
   * Concatenate with other collections or arrays
   */
  concat(...items: (Collection<T> | T[])[]): Collection<T> {
    let result = [...this.items]
    for (const item of items) {
      if (item instanceof Collection) {
        result = result.concat(item.all())
      } else {
        result = result.concat(item)
      }
    }
    return new Collection(result)
  }

  /**
   * Merge with another collection (overwrites by index)
   */
  merge(items: Collection<T> | T[]): Collection<T> {
    const other = items instanceof Collection ? items.all() : items
    const result = [...this.items]
    for (let i = 0; i < other.length; i++) {
      result[i] = other[i]
    }
    return new Collection(result)
  }

  /**
   * Get items not present in given collection
   */
  diff(items: Collection<T> | T[]): Collection<T> {
    const other = items instanceof Collection ? items.all() : items
    const otherSet = new Set(other)
    return this.filter(item => !otherSet.has(item))
  }

  /**
   * Get items present in both collections
   */
  intersect(items: Collection<T> | T[]): Collection<T> {
    const other = items instanceof Collection ? items.all() : items
    const otherSet = new Set(other)
    return this.filter(item => otherSet.has(item))
  }

  /**
   * Combine keys with values
   */
  combine<U>(values: U[]): Map<T extends string | number ? T : never, U> {
    const result = new Map<T extends string | number ? T : never, U>()
    const len = Math.min(this.items.length, values.length)
    for (let i = 0; i < len; i++) {
      result.set(this.items[i] as T extends string | number ? T : never, values[i])
    }
    return result
  }

  /**
   * Zip with another collection
   */
  zip<U>(items: U[]): Collection<[T, U]> {
    const result: [T, U][] = []
    const len = Math.min(this.items.length, items.length)
    for (let i = 0; i < len; i++) {
      result.push([this.items[i], items[i]])
    }
    return new Collection(result)
  }

  /**
   * Pad collection to specified size
   */
  pad(size: number, value: T): Collection<T> {
    const absSize = Math.abs(size)
    if (this.items.length >= absSize) {
      return new Collection([...this.items])
    }

    const padding = Array(absSize - this.items.length).fill(value)
    if (size > 0) {
      return new Collection([...this.items, ...padding])
    }
    return new Collection([...padding, ...this.items])
  }

  // ============================================================
  // Aggregation Methods
  // ============================================================

  /**
   * Reduce to a single value
   */
  reduce<U>(reducer: Reducer<T, U>, initial: U): U {
    return this.items.reduce((acc, item, i) => reducer(acc, item, i), initial)
  }

  /**
   * Get sum of items or key values
   */
  sum(key?: keyof T): number {
    if (key === undefined) {
      return (this.items as unknown as number[]).reduce((a, b) => a + b, 0)
    }
    return this.items.reduce((sum, item) => sum + (item[key] as unknown as number), 0)
  }

  /**
   * Get average of items or key values
   */
  avg(key?: keyof T): number {
    if (this.items.length === 0) return 0
    return this.sum(key) / this.items.length
  }

  /**
   * Alias for avg
   */
  average(key?: keyof T): number {
    return this.avg(key)
  }

  /**
   * Get minimum value
   */
  min(key?: keyof T): T | T[keyof T] | undefined {
    if (this.items.length === 0) return undefined

    if (key === undefined) {
      return this.items.reduce((min, item) => item < min ? item : min)
    }

    let minItem = this.items[0]
    for (const item of this.items) {
      if (item[key] < minItem[key]) {
        minItem = item
      }
    }
    return minItem[key]
  }

  /**
   * Get maximum value
   */
  max(key?: keyof T): T | T[keyof T] | undefined {
    if (this.items.length === 0) return undefined

    if (key === undefined) {
      return this.items.reduce((max, item) => item > max ? item : max)
    }

    let maxItem = this.items[0]
    for (const item of this.items) {
      if (item[key] > maxItem[key]) {
        maxItem = item
      }
    }
    return maxItem[key]
  }

  /**
   * Get median value
   */
  median(key?: keyof T): number | undefined {
    if (this.items.length === 0) return undefined

    const values = key !== undefined
      ? this.items.map(item => item[key] as unknown as number)
      : this.items as unknown as number[]

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
  mode(key?: keyof T): T[] | T[keyof T][] | undefined {
    if (this.items.length === 0) return undefined

    const values = key !== undefined
      ? this.items.map(item => item[key])
      : this.items

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

  // ============================================================
  // Boolean Methods
  // ============================================================

  /**
   * Check if collection contains an item or matches predicate
   */
  contains(keyOrValue: keyof T | T | Predicate<T>, value?: unknown): boolean {
    // Predicate function
    if (typeof keyOrValue === 'function') {
      return this.items.some((item, i) => (keyOrValue as Predicate<T>)(item, i))
    }

    // Key/value pair
    if (value !== undefined) {
      return this.items.some(item => item[keyOrValue as keyof T] === value)
    }

    // Direct value check
    return this.items.includes(keyOrValue as T)
  }

  /**
   * Inverse of contains
   */
  doesntContain(keyOrValue: keyof T | T | Predicate<T>, value?: unknown): boolean {
    return !this.contains(keyOrValue, value)
  }

  /**
   * Check if key exists (for object-based items)
   */
  has(key: number): boolean {
    return key >= 0 && key < this.items.length
  }

  /**
   * Check if collection is empty
   */
  isEmpty(): boolean {
    return this.items.length === 0
  }

  /**
   * Check if collection is not empty
   */
  isNotEmpty(): boolean {
    return this.items.length > 0
  }

  /**
   * Check if all items pass predicate
   */
  every(predicate: Predicate<T>): boolean {
    return this.items.every((item, i) => predicate(item, i))
  }

  /**
   * Check if any item passes predicate (alias for contains with predicate)
   */
  some(predicate: Predicate<T>): boolean {
    return this.items.some((item, i) => predicate(item, i))
  }

  // ============================================================
  // Iteration Methods
  // ============================================================

  /**
   * Iterate over each item
   */
  each(callback: (item: T, index: number) => void | false): Collection<T> {
    for (let i = 0; i < this.items.length; i++) {
      if (callback(this.items[i], i) === false) break
    }
    return this
  }

  /**
   * Pass collection to callback, return self (for side effects)
   */
  tap(callback: (collection: Collection<T>) => void): Collection<T> {
    callback(this)
    return this
  }

  /**
   * Pass collection to callback, return result
   */
  pipe<U>(callback: (collection: Collection<T>) => U): U {
    return callback(this)
  }

  /**
   * Conditionally apply transformation
   */
  when<U>(
    condition: boolean | (() => boolean),
    callback: (collection: Collection<T>) => Collection<U>,
    fallback?: (collection: Collection<T>) => Collection<U>
  ): Collection<T> | Collection<U> {
    const shouldRun = typeof condition === 'function' ? condition() : condition
    if (shouldRun) {
      return callback(this)
    }
    if (fallback) {
      return fallback(this)
    }
    return this
  }

  /**
   * Inverse of when
   */
  unless<U>(
    condition: boolean | (() => boolean),
    callback: (collection: Collection<T>) => Collection<U>,
    fallback?: (collection: Collection<T>) => Collection<U>
  ): Collection<T> | Collection<U> {
    const shouldSkip = typeof condition === 'function' ? condition() : condition
    return this.when(!shouldSkip, callback, fallback)
  }

  /**
   * Apply callback if collection is empty
   */
  whenEmpty<U>(callback: (collection: Collection<T>) => Collection<U>): Collection<T> | Collection<U> {
    return this.when(this.isEmpty(), callback)
  }

  /**
   * Apply callback if collection is not empty
   */
  whenNotEmpty<U>(callback: (collection: Collection<T>) => Collection<U>): Collection<T> | Collection<U> {
    return this.when(this.isNotEmpty(), callback)
  }

  // ============================================================
  // Search Methods
  // ============================================================

  /**
   * Search for an item and return its index
   */
  search(item: T): number
  search(predicate: Predicate<T>): number
  search(itemOrPredicate: T | Predicate<T>): number {
    if (typeof itemOrPredicate === 'function') {
      return this.items.findIndex((item, i) => (itemOrPredicate as Predicate<T>)(item, i))
    }
    return this.items.indexOf(itemOrPredicate)
  }

  // ============================================================
  // String Methods
  // ============================================================

  /**
   * Join items with a separator
   */
  join(glue: string = ', ', finalGlue?: string): string {
    if (this.items.length === 0) return ''
    if (this.items.length === 1) return String(this.items[0])

    if (finalGlue !== undefined) {
      const allButLast = this.items.slice(0, -1)
      return allButLast.join(glue) + finalGlue + this.items[this.items.length - 1]
    }

    return this.items.join(glue)
  }

  /**
   * Join items by key with a separator
   */
  implode(key: keyof T, glue: string = ', '): string {
    return this.pluck(key).join(glue)
  }

  // ============================================================
  // Output Methods
  // ============================================================

  /**
   * Get item count
   */
  count(): number {
    return this.items.length
  }

  /**
   * Get all keys (indices)
   */
  keys(): Collection<number> {
    return new Collection(Array.from({ length: this.items.length }, (_, i) => i))
  }

  /**
   * Get all values (resets keys)
   */
  values(): Collection<T> {
    return new Collection([...this.items])
  }

  /**
   * Convert to JSON string
   */
  toJson(): string {
    return JSON.stringify(this.items)
  }

  /**
   * Make collection iterable
   */
  [Symbol.iterator](): Iterator<T> {
    return this.items[Symbol.iterator]()
  }

  /**
   * Get length property for Vue reactivity
   */
  get length(): number {
    return this.items.length
  }

  // ============================================================
  // Private Helpers
  // ============================================================

  private parseOperator(operatorOrValue?: Operator | unknown, value?: unknown): { operator: Operator; compareValue: unknown } {
    if (value !== undefined) {
      return { operator: operatorOrValue as Operator, compareValue: value }
    }
    return { operator: '===', compareValue: operatorOrValue }
  }

  private compareValues(itemValue: unknown, operator: Operator, compareValue: unknown): boolean {
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
}
