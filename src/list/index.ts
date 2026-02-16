type Comparator<T> = (a: T, b: T) => number
type Predicate<T> = (item: T, index: number) => boolean
type Mapper<T, U> = (item: T, index: number) => U
type Reducer<T, U> = (acc: U, item: T, index: number) => U

export class List<T = unknown> {
  private items: T[]

  private constructor(items: T[] = []) {
    this.items = [...items]
  }

  static create<T>(items: T[] = []): List<T> {
    return new List(items)
  }

  static from<T>(items: Iterable<T>): List<T> {
    return new List(Array.from(items))
  }

  static range(start: number, end: number, step: number = 1): List<number> {
    const items: number[] = []
    for (let i = start; i < end; i += step) {
      items.push(i)
    }
    return new List(items)
  }

  add(item: T, index?: number): List<T> {
    if (index !== undefined) {
      this.items.splice(index, 0, item)
    } else {
      this.items.push(item)
    }
    return this
  }

  remove(index: number): List<T> {
    this.items.splice(index, 1)
    return this
  }

  removeWhere(predicate: Predicate<T>): List<T> {
    this.items = this.items.filter((item, i) => !predicate(item, i))
    return this
  }

  set(index: number, item: T): List<T> {
    if (index >= 0 && index < this.items.length) {
      this.items[index] = item
    }
    return this
  }

  get(index: number): T | undefined {
    return this.items[index]
  }

  first(): T | undefined {
    return this.items[0]
  }

  last(): T | undefined {
    return this.items[this.items.length - 1]
  }

  sort(comparator?: Comparator<T>): List<T> {
    this.items.sort(comparator)
    return this
  }

  sortBy(key: keyof T, direction: 'asc' | 'desc' = 'asc'): List<T> {
    const dir = direction === 'asc' ? 1 : -1
    this.items.sort((a, b) => {
      const aVal = a[key]
      const bVal = b[key]
      if (aVal < bVal) return -1 * dir
      if (aVal > bVal) return 1 * dir
      return 0
    })
    return this
  }

  reverse(): List<T> {
    this.items.reverse()
    return this
  }

  filter(predicate: Predicate<T>): List<T> {
    return new List(this.items.filter(predicate))
  }

  find(predicate: Predicate<T>): T | undefined {
    return this.items.find((item, i) => predicate(item, i))
  }

  findIndex(predicate: Predicate<T>): number {
    return this.items.findIndex((item, i) => predicate(item, i))
  }

  map<U>(mapper: Mapper<T, U>): List<U> {
    return new List(this.items.map(mapper))
  }

  reduce<U>(reducer: Reducer<T, U>, initial: U): U {
    return this.items.reduce(reducer, initial)
  }

  forEach(callback: (item: T, index: number) => void): List<T> {
    this.items.forEach(callback)
    return this
  }

  includes(item: T): boolean {
    return this.items.includes(item)
  }

  indexOf(item: T): number {
    return this.items.indexOf(item)
  }

  every(predicate: Predicate<T>): boolean {
    return this.items.every(predicate)
  }

  some(predicate: Predicate<T>): boolean {
    return this.items.some(predicate)
  }

  slice(start?: number, end?: number): List<T> {
    return new List(this.items.slice(start, end))
  }

  take(count: number): List<T> {
    return new List(this.items.slice(0, count))
  }

  skip(count: number): List<T> {
    return new List(this.items.slice(count))
  }

  chunk(size: number): List<T[]> {
    const chunks: T[][] = []
    for (let i = 0; i < this.items.length; i += size) {
      chunks.push(this.items.slice(i, i + size))
    }
    return new List(chunks)
  }

  unique(): List<T> {
    return new List([...new Set(this.items)])
  }

  uniqueBy(key: keyof T): List<T> {
    const seen = new Set()
    const result: T[] = []
    for (const item of this.items) {
      const val = item[key]
      if (!seen.has(val)) {
        seen.add(val)
        result.push(item)
      }
    }
    return new List(result)
  }

  groupBy(key: keyof T): Map<unknown, T[]> {
    const groups = new Map<unknown, T[]>()
    for (const item of this.items) {
      const val = item[key]
      if (!groups.has(val)) {
        groups.set(val, [])
      }
      groups.get(val)!.push(item)
    }
    return groups
  }

  flatten<U>(): List<U> {
    return new List(this.items.flat() as U[])
  }

  concat(...lists: List<T>[]): List<T> {
    const all = [...this.items]
    for (const list of lists) {
      all.push(...list.toArray())
    }
    return new List(all)
  }

  isEmpty(): boolean {
    return this.items.length === 0
  }

  isNotEmpty(): boolean {
    return this.items.length > 0
  }

  count(): number {
    return this.items.length
  }

  clear(): List<T> {
    this.items = []
    return this
  }

  toArray(): T[] {
    return [...this.items]
  }

  toJSON(): T[] {
    return this.toArray()
  }

  clone(): List<T> {
    return new List([...this.items])
  }

  // Numeric operations (when T is number)
  sum(): number {
    return (this.items as number[]).reduce((a, b) => a + b, 0)
  }

  avg(): number {
    if (this.items.length === 0) return 0
    return this.sum() / this.items.length
  }

  min(): T | undefined {
    if (this.items.length === 0) return undefined
    return this.items.reduce((min, item) => item < min ? item : min)
  }

  max(): T | undefined {
    if (this.items.length === 0) return undefined
    return this.items.reduce((max, item) => item > max ? item : max)
  }
}
