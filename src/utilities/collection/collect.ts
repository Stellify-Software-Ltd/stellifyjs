/**
 * Collection class - chainable wrapper that delegates to atomic functions
 */

import type { Predicate, Mapper, Reducer, KeyMapper, Operator } from './types'
import * as retrieval from './retrieval'
import * as whereOps from './where'
import * as filterOps from './filter'
import * as transform from './transform'
import * as grouping from './grouping'
import * as ordering from './ordering'
import * as slicing from './slicing'
import * as mutation from './mutation'
import * as combining from './combining'
import * as aggregate from './aggregate'
import * as predicates from './predicates'
import * as control from './control'
import * as misc from './misc'

export class Collection<T = unknown> {
  private readonly items: readonly T[]

  private constructor(items: T[] = []) {
    this.items = Object.freeze([...items])
  }

  // ============================================================
  // Static Constructors
  // ============================================================

  static collect<T>(items: T[] = []): Collection<T> {
    return new Collection(items)
  }

  static wrap<T>(value: T | T[]): Collection<T> {
    if (Array.isArray(value)) {
      return new Collection(value)
    }
    return new Collection([value])
  }

  static from<T>(items: Iterable<T>): Collection<T> {
    return new Collection(Array.from(items))
  }

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

  all(): T[] {
    return [...this.items]
  }

  get(index: number, defaultValue?: T): T | undefined {
    return retrieval.get(this.items, index, defaultValue)
  }

  first(predicate?: Predicate<T>): T | undefined {
    return retrieval.first(this.items, predicate)
  }

  firstWhere(key: keyof T, operatorOrValue?: Operator | unknown, value?: unknown): T | undefined {
    return retrieval.firstWhere(this.items, key, operatorOrValue, value)
  }

  last(predicate?: Predicate<T>): T | undefined {
    return retrieval.last(this.items, predicate)
  }

  before(item: T): T | undefined {
    return retrieval.before(this.items, item)
  }

  after(item: T): T | undefined {
    return retrieval.after(this.items, item)
  }

  pluck<K extends keyof T>(key: K): Collection<T[K]>
  pluck<K extends keyof T, V extends keyof T>(value: K, keyBy: V): Map<T[V], T[K]>
  pluck<K extends keyof T, V extends keyof T>(key: K, keyBy?: V): Collection<T[K]> | Map<T[V], T[K]> {
    if (keyBy !== undefined) {
      return retrieval.pluck(this.items, key, keyBy)
    }
    return new Collection(retrieval.pluck(this.items, key))
  }

  only<K extends keyof T>(keys: K[]): Collection<Pick<T, K>> {
    return new Collection(retrieval.only(this.items, keys))
  }

  except<K extends keyof T>(keys: K[]): Collection<Omit<T, K>> {
    return new Collection(retrieval.except(this.items, keys))
  }

  random(count?: number): T | Collection<T> | undefined {
    if (this.items.length === 0) return undefined
    if (count === undefined) {
      return retrieval.random(this.items)
    }
    return new Collection(retrieval.random(this.items, count))
  }

  // ============================================================
  // Filtering / Where Methods
  // ============================================================

  filter(predicate: Predicate<T>): Collection<T> {
    return new Collection(filterOps.filter(this.items, predicate))
  }

  where(key: keyof T, operatorOrValue?: Operator | unknown, value?: unknown): Collection<T> {
    return new Collection(whereOps.where(this.items, key, operatorOrValue, value))
  }

  whereIn(key: keyof T, values: unknown[]): Collection<T> {
    return new Collection(whereOps.whereIn(this.items, key, values))
  }

  whereNotIn(key: keyof T, values: unknown[]): Collection<T> {
    return new Collection(whereOps.whereNotIn(this.items, key, values))
  }

  whereBetween(key: keyof T, range: [number, number]): Collection<T> {
    return new Collection(whereOps.whereBetween(this.items, key, range))
  }

  whereNotBetween(key: keyof T, range: [number, number]): Collection<T> {
    return new Collection(whereOps.whereNotBetween(this.items, key, range))
  }

  whereNull(key: keyof T): Collection<T> {
    return new Collection(whereOps.whereNull(this.items, key))
  }

  whereNotNull(key: keyof T): Collection<T> {
    return new Collection(whereOps.whereNotNull(this.items, key))
  }

  reject(predicate: Predicate<T>): Collection<T> {
    return new Collection(filterOps.reject(this.items, predicate))
  }

  unique(key?: keyof T): Collection<T> {
    return new Collection(filterOps.unique(this.items, key))
  }

  duplicates(key?: keyof T): Collection<T> {
    return new Collection(filterOps.duplicates(this.items, key))
  }

  // ============================================================
  // Transformation Methods
  // ============================================================

  map<U>(mapper: Mapper<T, U>): Collection<U> {
    return new Collection(transform.map(this.items, mapper))
  }

  flatMap<U>(mapper: Mapper<T, U[]>): Collection<U> {
    return new Collection(transform.flatMap(this.items, mapper))
  }

  mapWithKeys(mapper: KeyMapper<T>): Map<string | number, unknown> {
    return transform.mapWithKeys(this.items, mapper)
  }

  keyBy(key: keyof T): Map<unknown, T>
  keyBy(callback: (item: T) => string | number): Map<string | number, T>
  keyBy(keyOrCallback: keyof T | ((item: T) => string | number)): Map<unknown, T> {
    return grouping.keyBy(this.items, keyOrCallback as keyof T)
  }

  groupBy(key: keyof T): Map<unknown, Collection<T>>
  groupBy(callback: (item: T) => string | number): Map<string | number, Collection<T>>
  groupBy(keyOrCallback: keyof T | ((item: T) => string | number)): Map<unknown, Collection<T>> {
    const groups = grouping.groupBy(this.items, keyOrCallback as keyof T)
    const result = new Map<unknown, Collection<T>>()
    for (const [k, v] of groups) {
      result.set(k, new Collection(v))
    }
    return result
  }

  countBy(key?: keyof T): Map<unknown, number>
  countBy(callback: (item: T) => string | number): Map<string | number, number>
  countBy(keyOrCallback?: keyof T | ((item: T) => string | number)): Map<unknown, number> {
    return grouping.countBy(this.items, keyOrCallback as keyof T)
  }

  partition(predicate: Predicate<T>): [Collection<T>, Collection<T>] {
    const [pass, fail] = grouping.partition(this.items, predicate)
    return [new Collection(pass), new Collection(fail)]
  }

  flatten(depth: number = 1): Collection<unknown> {
    return new Collection(transform.flatten(this.items, depth))
  }

  collapse(): Collection<unknown> {
    return new Collection(transform.collapse(this.items))
  }

  flip(): Map<unknown, number> {
    return transform.flip(this.items)
  }

  // ============================================================
  // Ordering Methods
  // ============================================================

  sort(comparator?: (a: T, b: T) => number): Collection<T> {
    return new Collection(ordering.sort(this.items, comparator))
  }

  sortBy(key: keyof T): Collection<T>
  sortBy(callback: (item: T) => unknown): Collection<T>
  sortBy(keyOrCallback: keyof T | ((item: T) => unknown)): Collection<T> {
    return new Collection(ordering.sortBy(this.items, keyOrCallback as keyof T))
  }

  sortByDesc(key: keyof T): Collection<T>
  sortByDesc(callback: (item: T) => unknown): Collection<T>
  sortByDesc(keyOrCallback: keyof T | ((item: T) => unknown)): Collection<T> {
    return new Collection(ordering.sortByDesc(this.items, keyOrCallback as keyof T))
  }

  sortDesc(): Collection<T> {
    return new Collection(ordering.sortDesc(this.items))
  }

  reverse(): Collection<T> {
    return new Collection(ordering.reverse(this.items))
  }

  shuffle(): Collection<T> {
    return new Collection(ordering.shuffle(this.items))
  }

  // ============================================================
  // Slicing Methods
  // ============================================================

  take(count: number): Collection<T> {
    return new Collection(slicing.take(this.items, count))
  }

  takeWhile(predicate: Predicate<T>): Collection<T> {
    return new Collection(slicing.takeWhile(this.items, predicate))
  }

  takeUntil(predicate: Predicate<T>): Collection<T> {
    return new Collection(slicing.takeUntil(this.items, predicate))
  }

  skip(count: number): Collection<T> {
    return new Collection(slicing.skip(this.items, count))
  }

  skipWhile(predicate: Predicate<T>): Collection<T> {
    return new Collection(slicing.skipWhile(this.items, predicate))
  }

  skipUntil(predicate: Predicate<T>): Collection<T> {
    return new Collection(slicing.skipUntil(this.items, predicate))
  }

  slice(start?: number, end?: number): Collection<T> {
    return new Collection(slicing.slice(this.items, start, end))
  }

  forPage(page: number, perPage: number): Collection<T> {
    return new Collection(slicing.forPage(this.items, page, perPage))
  }

  split(count: number): Collection<Collection<T>> {
    const groups = slicing.split(this.items, count)
    return new Collection(groups.map(g => new Collection(g)))
  }

  chunk(size: number): Collection<Collection<T>> {
    const chunks = slicing.chunk(this.items, size)
    return new Collection(chunks.map(c => new Collection(c)))
  }

  sliding(size: number, step: number = 1): Collection<Collection<T>> {
    const windows = slicing.sliding(this.items, size, step)
    return new Collection(windows.map(w => new Collection(w)))
  }

  nth(step: number, offset: number = 0): Collection<T> {
    return new Collection(slicing.nth(this.items, step, offset))
  }

  // ============================================================
  // Mutation Methods (return new Collections)
  // ============================================================

  push(...items: T[]): Collection<T> {
    return new Collection(mutation.push(this.items, ...items))
  }

  prepend(item: T): Collection<T> {
    return new Collection(mutation.prepend(this.items, item))
  }

  pop(): { item: T | undefined; collection: Collection<T> } {
    const result = mutation.pop(this.items)
    return { item: result.item, collection: new Collection(result.items) }
  }

  shift(): { item: T | undefined; collection: Collection<T> } {
    const result = mutation.shift(this.items)
    return { item: result.item, collection: new Collection(result.items) }
  }

  forget(index: number): Collection<T> {
    return new Collection(mutation.forget(this.items, index))
  }

  pull(index: number): { item: T | undefined; collection: Collection<T> } {
    const result = mutation.pull(this.items, index)
    return { item: result.item, collection: new Collection(result.items) }
  }

  put(index: number, value: T): Collection<T> {
    return new Collection(mutation.put(this.items, index, value))
  }

  toggle(item: T, key?: keyof T): Collection<T> {
    return new Collection(mutation.toggle(this.items, item, key))
  }

  // ============================================================
  // Combining Methods
  // ============================================================

  concat(...items: (Collection<T> | T[])[]): Collection<T> {
    const arrays = items.map(i => i instanceof Collection ? i.all() : i)
    return new Collection(combining.concat(this.items, ...arrays))
  }

  merge(items: Collection<T> | T[]): Collection<T> {
    const other = items instanceof Collection ? items.all() : items
    return new Collection(combining.merge(this.items, other))
  }

  diff(items: Collection<T> | T[]): Collection<T> {
    const other = items instanceof Collection ? items.all() : items
    return new Collection(combining.diff(this.items, other))
  }

  intersect(items: Collection<T> | T[]): Collection<T> {
    const other = items instanceof Collection ? items.all() : items
    return new Collection(combining.intersect(this.items, other))
  }

  combine<U>(values: U[]): Map<T extends string | number ? T : never, U> {
    return combining.combine(this.items as (T extends string | number ? T : never)[], values)
  }

  zip<U>(items: U[]): Collection<[T, U]> {
    return new Collection(combining.zip(this.items, items))
  }

  pad(size: number, value: T): Collection<T> {
    return new Collection(combining.pad(this.items, size, value))
  }

  // ============================================================
  // Aggregation Methods
  // ============================================================

  reduce<U>(reducer: Reducer<T, U>, initial: U): U {
    return aggregate.reduce(this.items, reducer, initial)
  }

  sum(key?: keyof T): number {
    return aggregate.sum(this.items, key)
  }

  avg(key?: keyof T): number {
    return aggregate.avg(this.items, key)
  }

  average(key?: keyof T): number {
    return this.avg(key)
  }

  min(key?: keyof T): T | T[keyof T] | undefined {
    return aggregate.min(this.items, key)
  }

  max(key?: keyof T): T | T[keyof T] | undefined {
    return aggregate.max(this.items, key)
  }

  median(key?: keyof T): number | undefined {
    return aggregate.median(this.items, key)
  }

  mode(key?: keyof T): T[] | T[keyof T][] | undefined {
    return aggregate.mode(this.items, key)
  }

  // ============================================================
  // Boolean/Predicate Methods
  // ============================================================

  contains(keyOrValue: keyof T | T | Predicate<T>, value?: unknown): boolean {
    return predicates.contains(this.items, keyOrValue, value)
  }

  doesntContain(keyOrValue: keyof T | T | Predicate<T>, value?: unknown): boolean {
    return predicates.doesntContain(this.items, keyOrValue, value)
  }

  has(key: number): boolean {
    return predicates.has(this.items, key)
  }

  isEmpty(): boolean {
    return predicates.isEmpty(this.items)
  }

  isNotEmpty(): boolean {
    return predicates.isNotEmpty(this.items)
  }

  every(predicate: Predicate<T>): boolean {
    return predicates.every(this.items, predicate)
  }

  some(predicate: Predicate<T>): boolean {
    return predicates.some(this.items, predicate)
  }

  // ============================================================
  // Control Flow Methods
  // ============================================================

  each(callback: (item: T, index: number) => void | false): Collection<T> {
    control.each(this.items, callback)
    return this
  }

  tap(callback: (collection: Collection<T>) => void): Collection<T> {
    callback(this)
    return this
  }

  pipe<U>(callback: (collection: Collection<T>) => U): U {
    return callback(this)
  }

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

  unless<U>(
    condition: boolean | (() => boolean),
    callback: (collection: Collection<T>) => Collection<U>,
    fallback?: (collection: Collection<T>) => Collection<U>
  ): Collection<T> | Collection<U> {
    const shouldSkip = typeof condition === 'function' ? condition() : condition
    return this.when(!shouldSkip, callback, fallback)
  }

  whenEmpty<U>(callback: (collection: Collection<T>) => Collection<U>): Collection<T> | Collection<U> {
    return this.when(this.isEmpty(), callback)
  }

  whenNotEmpty<U>(callback: (collection: Collection<T>) => Collection<U>): Collection<T> | Collection<U> {
    return this.when(this.isNotEmpty(), callback)
  }

  // ============================================================
  // Search / Misc Methods
  // ============================================================

  search(item: T): number
  search(predicate: Predicate<T>): number
  search(itemOrPredicate: T | Predicate<T>): number {
    return misc.search(this.items, itemOrPredicate as T)
  }

  join(glue: string = ', ', finalGlue?: string): string {
    return misc.join(this.items, glue, finalGlue)
  }

  implode(key: keyof T, glue: string = ', '): string {
    return misc.implode(this.items, key, glue)
  }

  count(): number {
    return misc.count(this.items)
  }

  keys(): Collection<number> {
    return new Collection(misc.keys(this.items))
  }

  values(): Collection<T> {
    return new Collection(misc.values(this.items))
  }

  toJson(): string {
    return misc.toJson(this.items)
  }

  // ============================================================
  // Iterator & Length
  // ============================================================

  [Symbol.iterator](): Iterator<T> {
    return this.items[Symbol.iterator]()
  }

  get length(): number {
    return this.items.length
  }
}

/**
 * Create a new Collection instance
 */
export function collect<T>(items: T[] = []): Collection<T> {
  return Collection.collect(items)
}
