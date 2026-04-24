/**
 * Tests for Collection module - atomics and chainable API
 */

import { describe, it, expect } from 'vitest'
import {
  // Main API
  Collection,
  collect,
  // Retrieval
  get,
  first,
  firstWhere,
  last,
  before,
  after,
  random,
  pluck,
  only,
  except,
  // Where
  where,
  whereIn,
  whereNotIn,
  whereBetween,
  whereNotBetween,
  whereNull,
  whereNotNull,
  // Filter
  filter,
  reject,
  unique,
  duplicates,
  // Transform
  map,
  flatMap,
  mapWithKeys,
  flatten,
  collapse,
  flip,
  // Grouping
  keyBy,
  groupBy,
  countBy,
  partition,
  // Ordering
  sort,
  sortBy,
  sortByDesc,
  sortDesc,
  reverse,
  shuffle,
  // Slicing
  take,
  takeWhile,
  takeUntil,
  skip,
  skipWhile,
  skipUntil,
  slice,
  forPage,
  split,
  chunk,
  sliding,
  nth,
  // Mutation
  push,
  prepend,
  pop,
  shift,
  forget,
  pull,
  put,
  toggle,
  // Combining
  concat,
  merge,
  diff,
  intersect,
  combine,
  zip,
  pad,
  // Aggregate
  reduce,
  sum,
  avg,
  min,
  max,
  median,
  mode,
  // Predicates
  contains,
  doesntContain,
  has,
  isEmpty,
  isNotEmpty,
  every,
  some,
  // Control
  each,
  tap,
  pipe,
  when,
  unless,
  whenEmpty,
  whenNotEmpty,
  // Misc
  search,
  join,
  implode,
  count,
  keys,
  values,
  toJson,
} from '../src/collection'

type User = { id: number; name: string; age: number; active?: boolean }

const users: User[] = [
  { id: 1, name: 'Alice', age: 25, active: true },
  { id: 2, name: 'Bob', age: 30, active: false },
  { id: 3, name: 'Charlie', age: 35, active: true },
]

// ============================================================
// Retrieval atomics
// ============================================================

describe('retrieval', () => {
  it('get returns item at index', () => {
    expect(get([1, 2, 3], 1)).toBe(2)
    expect(get([1, 2, 3], 5)).toBeUndefined()
    expect(get([1, 2, 3], 5, 99)).toBe(99)
  })

  it('first returns first item or matching predicate', () => {
    expect(first([1, 2, 3])).toBe(1)
    expect(first([])).toBeUndefined()
    expect(first([1, 2, 3], (x) => x > 1)).toBe(2)
  })

  it('firstWhere returns first matching key/value', () => {
    expect(firstWhere(users, 'name', 'Bob')).toEqual(users[1])
    expect(firstWhere(users, 'age', '>', 25)).toEqual(users[1])
  })

  it('last returns last item or matching predicate', () => {
    expect(last([1, 2, 3])).toBe(3)
    expect(last([])).toBeUndefined()
    expect(last([1, 2, 3], (x) => x < 3)).toBe(2)
  })

  it('before returns item before given item', () => {
    expect(before([1, 2, 3], 2)).toBe(1)
    expect(before([1, 2, 3], 1)).toBeUndefined()
  })

  it('after returns item after given item', () => {
    expect(after([1, 2, 3], 2)).toBe(3)
    expect(after([1, 2, 3], 3)).toBeUndefined()
  })

  it('random returns random item(s)', () => {
    const items = [1, 2, 3, 4, 5]
    const single = random(items)
    expect(items).toContain(single)

    const multiple = random(items, 2)
    expect(multiple).toHaveLength(2)
  })

  it('pluck extracts values for key', () => {
    expect(pluck(users, 'name')).toEqual(['Alice', 'Bob', 'Charlie'])
  })

  it('pluck with keyBy returns map', () => {
    const result = pluck(users, 'name', 'id')
    expect(result.get(1)).toBe('Alice')
    expect(result.get(2)).toBe('Bob')
  })

  it('only returns only specified keys', () => {
    const result = only(users, ['id', 'name'])
    expect(result[0]).toEqual({ id: 1, name: 'Alice' })
  })

  it('except returns all keys except specified', () => {
    const result = except(users, ['active'])
    expect(result[0]).toEqual({ id: 1, name: 'Alice', age: 25 })
  })
})

// ============================================================
// Where atomics
// ============================================================

describe('where', () => {
  it('where filters by key/value', () => {
    expect(where(users, 'active', true)).toHaveLength(2)
    expect(where(users, 'age', '>', 25)).toHaveLength(2)
  })

  it('whereIn filters by values in array', () => {
    expect(whereIn(users, 'id', [1, 3])).toHaveLength(2)
  })

  it('whereNotIn filters by values not in array', () => {
    expect(whereNotIn(users, 'id', [1, 3])).toHaveLength(1)
  })

  it('whereBetween filters by range', () => {
    expect(whereBetween(users, 'age', [25, 30])).toHaveLength(2)
  })

  it('whereNotBetween filters outside range', () => {
    expect(whereNotBetween(users, 'age', [26, 34])).toHaveLength(2)
  })

  it('whereNull filters null/undefined values', () => {
    const items = [{ a: 1 }, { a: null }, { a: undefined }]
    expect(whereNull(items, 'a')).toHaveLength(2)
  })

  it('whereNotNull filters non-null values', () => {
    const items = [{ a: 1 }, { a: null }, { a: 2 }]
    expect(whereNotNull(items, 'a')).toHaveLength(2)
  })
})

// ============================================================
// Filter atomics
// ============================================================

describe('filter', () => {
  it('filter with predicate', () => {
    expect(filter([1, 2, 3, 4], (x) => x % 2 === 0)).toEqual([2, 4])
  })

  it('reject with predicate', () => {
    expect(reject([1, 2, 3, 4], (x) => x % 2 === 0)).toEqual([1, 3])
  })

  it('unique removes duplicates', () => {
    expect(unique([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3])
  })

  it('unique by key', () => {
    const items = [
      { type: 'a', val: 1 },
      { type: 'a', val: 2 },
      { type: 'b', val: 3 },
    ]
    expect(unique(items, 'type')).toHaveLength(2)
  })

  it('duplicates returns duplicate items', () => {
    expect(duplicates([1, 2, 2, 3, 3, 3])).toEqual([2, 3])
  })
})

// ============================================================
// Transform atomics
// ============================================================

describe('transform', () => {
  it('map transforms items', () => {
    expect(map([1, 2, 3], (x) => x * 2)).toEqual([2, 4, 6])
  })

  it('flatMap transforms and flattens', () => {
    expect(flatMap([1, 2], (x) => [x, x * 2])).toEqual([1, 2, 2, 4])
  })

  it('mapWithKeys creates map from key/value pairs', () => {
    const result = mapWithKeys(users, (u) => ({ key: u.name, value: u.age }))
    expect(result.get('Alice')).toBe(25)
  })

  it('flatten flattens nested arrays', () => {
    expect(flatten([[1, 2], [3, 4]])).toEqual([1, 2, 3, 4])
  })

  it('collapse flattens one level', () => {
    expect(collapse([[1, 2], [3, 4]])).toEqual([1, 2, 3, 4])
  })

  it('flip swaps keys and values', () => {
    const result = flip(['a', 'b', 'c'])
    expect(result.get('a')).toBe(0)
    expect(result.get('c')).toBe(2)
  })
})

// ============================================================
// Grouping atomics
// ============================================================

describe('grouping', () => {
  it('keyBy creates map keyed by field', () => {
    const result = keyBy(users, 'id')
    expect(result.get(1)?.name).toBe('Alice')
  })

  it('keyBy with callback', () => {
    const result = keyBy(users, (u) => u.name.toLowerCase())
    expect(result.get('alice')?.id).toBe(1)
  })

  it('groupBy groups by field', () => {
    const result = groupBy(users, 'active')
    expect(result.get(true)).toHaveLength(2)
    expect(result.get(false)).toHaveLength(1)
  })

  it('countBy counts occurrences', () => {
    const items = ['a', 'b', 'a', 'c', 'a']
    const result = countBy(items)
    expect(result.get('a')).toBe(3)
  })

  it('partition splits by predicate', () => {
    const [pass, fail] = partition([1, 2, 3, 4], (x) => x % 2 === 0)
    expect(pass).toEqual([2, 4])
    expect(fail).toEqual([1, 3])
  })
})

// ============================================================
// Ordering atomics
// ============================================================

describe('ordering', () => {
  it('sort sorts items', () => {
    expect(sort([3, 1, 2])).toEqual([1, 2, 3])
  })

  it('sort with comparator', () => {
    expect(sort([3, 1, 2], (a, b) => b - a)).toEqual([3, 2, 1])
  })

  it('sortBy sorts by key', () => {
    const result = sortBy(users, 'age')
    expect(result[0].name).toBe('Alice')
    expect(result[2].name).toBe('Charlie')
  })

  it('sortByDesc sorts descending by key', () => {
    const result = sortByDesc(users, 'age')
    expect(result[0].name).toBe('Charlie')
  })

  it('sortDesc sorts descending', () => {
    expect(sortDesc([1, 3, 2])).toEqual([3, 2, 1])
  })

  it('reverse reverses order', () => {
    expect(reverse([1, 2, 3])).toEqual([3, 2, 1])
  })

  it('shuffle randomizes order', () => {
    const items = [1, 2, 3, 4, 5]
    const shuffled = shuffle(items)
    expect(shuffled).toHaveLength(5)
    expect(shuffled.sort()).toEqual(items)
  })
})

// ============================================================
// Slicing atomics
// ============================================================

describe('slicing', () => {
  it('take returns first n items', () => {
    expect(take([1, 2, 3, 4, 5], 3)).toEqual([1, 2, 3])
    expect(take([1, 2, 3, 4, 5], -2)).toEqual([4, 5])
  })

  it('takeWhile takes while predicate true', () => {
    expect(takeWhile([1, 2, 3, 4, 1], (x) => x < 3)).toEqual([1, 2])
  })

  it('takeUntil takes until predicate true', () => {
    expect(takeUntil([1, 2, 3, 4], (x) => x === 3)).toEqual([1, 2])
  })

  it('skip skips first n items', () => {
    expect(skip([1, 2, 3, 4, 5], 2)).toEqual([3, 4, 5])
  })

  it('skipWhile skips while predicate true', () => {
    expect(skipWhile([1, 2, 3, 4, 1], (x) => x < 3)).toEqual([3, 4, 1])
  })

  it('skipUntil skips until predicate true', () => {
    expect(skipUntil([1, 2, 3, 4], (x) => x === 3)).toEqual([3, 4])
  })

  it('slice returns slice of array', () => {
    expect(slice([1, 2, 3, 4, 5], 1, 3)).toEqual([2, 3])
  })

  it('forPage returns page of items', () => {
    expect(forPage([1, 2, 3, 4, 5, 6], 2, 2)).toEqual([3, 4])
  })

  it('split splits into n groups', () => {
    expect(split([1, 2, 3, 4, 5, 6], 3)).toEqual([[1, 2], [3, 4], [5, 6]])
  })

  it('chunk splits into chunks of size', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]])
  })

  it('sliding returns sliding windows', () => {
    expect(sliding([1, 2, 3, 4], 2)).toEqual([[1, 2], [2, 3], [3, 4]])
    expect(sliding([1, 2, 3, 4, 5], 2, 2)).toEqual([[1, 2], [3, 4]])
  })

  it('nth returns every nth item', () => {
    expect(nth([1, 2, 3, 4, 5, 6], 2)).toEqual([1, 3, 5])
    expect(nth([1, 2, 3, 4, 5, 6], 2, 1)).toEqual([2, 4, 6])
  })
})

// ============================================================
// Mutation atomics
// ============================================================

describe('mutation', () => {
  it('push adds items to end', () => {
    expect(push([1, 2], 3, 4)).toEqual([1, 2, 3, 4])
  })

  it('prepend adds item to beginning', () => {
    expect(prepend([2, 3], 1)).toEqual([1, 2, 3])
  })

  it('pop removes and returns last item', () => {
    const result = pop([1, 2, 3])
    expect(result.item).toBe(3)
    expect(result.items).toEqual([1, 2])
  })

  it('shift removes and returns first item', () => {
    const result = shift([1, 2, 3])
    expect(result.item).toBe(1)
    expect(result.items).toEqual([2, 3])
  })

  it('forget removes item at index', () => {
    expect(forget([1, 2, 3], 1)).toEqual([1, 3])
  })

  it('pull removes and returns item at index', () => {
    const result = pull([1, 2, 3], 1)
    expect(result.item).toBe(2)
    expect(result.items).toEqual([1, 3])
  })

  it('put sets value at index', () => {
    expect(put([1, 2, 3], 1, 5)).toEqual([1, 5, 3])
  })

  it('toggle adds or removes item', () => {
    expect(toggle([1, 2], 3)).toEqual([1, 2, 3])
    expect(toggle([1, 2, 3], 2)).toEqual([1, 3])
  })
})

// ============================================================
// Combining atomics
// ============================================================

describe('combining', () => {
  it('concat combines arrays', () => {
    expect(concat([1, 2], [3, 4], [5])).toEqual([1, 2, 3, 4, 5])
  })

  it('merge overwrites by index', () => {
    expect(merge([1, 2, 3], [4, 5])).toEqual([4, 5, 3])
  })

  it('diff returns items not in other array', () => {
    expect(diff([1, 2, 3, 4], [2, 4, 6])).toEqual([1, 3])
  })

  it('intersect returns items in both arrays', () => {
    expect(intersect([1, 2, 3, 4], [2, 4, 6])).toEqual([2, 4])
  })

  it('combine creates map from keys and values', () => {
    const result = combine(['a', 'b'], [1, 2])
    expect(result.get('a')).toBe(1)
    expect(result.get('b')).toBe(2)
  })

  it('zip pairs items from two arrays', () => {
    expect(zip([1, 2], ['a', 'b'])).toEqual([
      [1, 'a'],
      [2, 'b'],
    ])
  })

  it('pad pads array to size', () => {
    expect(pad([1, 2], 5, 0)).toEqual([1, 2, 0, 0, 0])
    expect(pad([1, 2], -5, 0)).toEqual([0, 0, 0, 1, 2])
  })
})

// ============================================================
// Aggregate atomics
// ============================================================

describe('aggregate', () => {
  it('reduce reduces to single value', () => {
    expect(reduce([1, 2, 3], (acc, x) => acc + x, 0)).toBe(6)
  })

  it('sum sums values', () => {
    expect(sum([1, 2, 3, 4])).toBe(10)
    expect(sum(users, 'age')).toBe(90)
  })

  it('avg calculates average', () => {
    expect(avg([1, 2, 3, 4, 5])).toBe(3)
    expect(avg(users, 'age')).toBe(30)
  })

  it('min returns minimum', () => {
    expect(min([3, 1, 4, 1, 5])).toBe(1)
    expect(min(users, 'age')).toBe(25)
  })

  it('max returns maximum', () => {
    expect(max([3, 1, 4, 1, 5])).toBe(5)
    expect(max(users, 'age')).toBe(35)
  })

  it('median returns median', () => {
    expect(median([1, 2, 3])).toBe(2)
    expect(median([1, 2, 3, 4])).toBe(2.5)
  })

  it('mode returns most frequent values', () => {
    expect(mode([1, 2, 2, 3, 3, 3])).toEqual([3])
    expect(mode([1, 1, 2, 2])).toEqual([1, 2])
  })
})

// ============================================================
// Predicate atomics
// ============================================================

describe('predicates', () => {
  it('contains checks for item', () => {
    expect(contains([1, 2, 3], 2)).toBe(true)
    expect(contains([1, 2, 3], 5)).toBe(false)
  })

  it('contains with predicate', () => {
    expect(contains([1, 2, 3], (x) => x > 2)).toBe(true)
  })

  it('contains with key/value', () => {
    expect(contains(users, 'name', 'Alice')).toBe(true)
  })

  it('doesntContain is inverse of contains', () => {
    expect(doesntContain([1, 2, 3], 5)).toBe(true)
    expect(doesntContain([1, 2, 3], 2)).toBe(false)
  })

  it('has checks index exists', () => {
    expect(has([1, 2, 3], 1)).toBe(true)
    expect(has([1, 2, 3], 5)).toBe(false)
  })

  it('isEmpty checks if empty', () => {
    expect(isEmpty([])).toBe(true)
    expect(isEmpty([1])).toBe(false)
  })

  it('isNotEmpty checks if not empty', () => {
    expect(isNotEmpty([1])).toBe(true)
    expect(isNotEmpty([])).toBe(false)
  })

  it('every checks all items match', () => {
    expect(every([2, 4, 6], (x) => x % 2 === 0)).toBe(true)
    expect(every([2, 3, 6], (x) => x % 2 === 0)).toBe(false)
  })

  it('some checks any item matches', () => {
    expect(some([1, 2, 3], (x) => x > 2)).toBe(true)
    expect(some([1, 2, 3], (x) => x > 5)).toBe(false)
  })
})

// ============================================================
// Control atomics
// ============================================================

describe('control', () => {
  it('each iterates over items', () => {
    const result: number[] = []
    each([1, 2, 3], (x) => result.push(x))
    expect(result).toEqual([1, 2, 3])
  })

  it('each stops on false', () => {
    const result: number[] = []
    each([1, 2, 3, 4], (x) => {
      result.push(x)
      if (x === 2) return false
    })
    expect(result).toEqual([1, 2])
  })

  it('tap passes items to callback and returns them', () => {
    let captured: readonly number[] = []
    const result = tap([1, 2, 3], (items) => {
      captured = items
    })
    expect(captured).toEqual([1, 2, 3])
    expect(result).toEqual([1, 2, 3])
  })

  it('pipe passes items to callback and returns result', () => {
    const result = pipe([1, 2, 3], (items) => items.length)
    expect(result).toBe(3)
  })

  it('when applies callback when condition true', () => {
    const result = when([1, 2, 3], true, (items) => [...items, 4])
    expect(result).toEqual([1, 2, 3, 4])
  })

  it('when returns items when condition false', () => {
    const result = when([1, 2, 3], false, (items) => [...items, 4])
    expect(result).toEqual([1, 2, 3])
  })

  it('unless is inverse of when', () => {
    const result = unless([1, 2, 3], false, (items) => [...items, 4])
    expect(result).toEqual([1, 2, 3, 4])
  })

  it('whenEmpty applies callback when empty', () => {
    expect(whenEmpty([], () => [1, 2, 3])).toEqual([1, 2, 3])
    expect(whenEmpty([1], () => [4, 5, 6])).toEqual([1])
  })

  it('whenNotEmpty applies callback when not empty', () => {
    expect(whenNotEmpty([1, 2], (items) => [...items, 3])).toEqual([1, 2, 3])
    expect(whenNotEmpty([], () => [1, 2, 3])).toEqual([])
  })
})

// ============================================================
// Misc atomics
// ============================================================

describe('misc', () => {
  it('search finds item index', () => {
    expect(search([1, 2, 3], 2)).toBe(1)
    expect(search([1, 2, 3], 5)).toBe(-1)
  })

  it('search with predicate', () => {
    expect(search([1, 2, 3], (x) => x > 1)).toBe(1)
  })

  it('join joins items', () => {
    expect(join([1, 2, 3])).toBe('1, 2, 3')
    expect(join([1, 2, 3], '-')).toBe('1-2-3')
    expect(join([1, 2, 3], ', ', ' and ')).toBe('1, 2 and 3')
  })

  it('implode joins by key', () => {
    expect(implode(users, 'name')).toBe('Alice, Bob, Charlie')
  })

  it('count returns length', () => {
    expect(count([1, 2, 3])).toBe(3)
  })

  it('keys returns indices', () => {
    expect(keys([1, 2, 3])).toEqual([0, 1, 2])
  })

  it('values returns copy', () => {
    const original = [1, 2, 3]
    const result = values(original)
    expect(result).toEqual([1, 2, 3])
    expect(result).not.toBe(original)
  })

  it('toJson converts to JSON string', () => {
    expect(toJson([1, 2, 3])).toBe('[1,2,3]')
  })
})

// ============================================================
// Collection class (chainable API)
// ============================================================

describe('Collection class', () => {
  it('collect creates collection', () => {
    const c = collect([1, 2, 3])
    expect(c.all()).toEqual([1, 2, 3])
  })

  it('Collection.collect creates collection', () => {
    const c = Collection.collect([1, 2, 3])
    expect(c.all()).toEqual([1, 2, 3])
  })

  it('Collection.wrap wraps value', () => {
    expect(Collection.wrap(1).all()).toEqual([1])
    expect(Collection.wrap([1, 2]).all()).toEqual([1, 2])
  })

  it('Collection.from creates from iterable', () => {
    const set = new Set([1, 2, 3])
    expect(Collection.from(set).all()).toEqual([1, 2, 3])
  })

  it('Collection.range creates range', () => {
    expect(Collection.range(0, 5).all()).toEqual([0, 1, 2, 3, 4])
    expect(Collection.range(0, 10, 2).all()).toEqual([0, 2, 4, 6, 8])
  })

  it('Collection.times creates by callback', () => {
    expect(Collection.times(3, (i) => i * 2).all()).toEqual([2, 4, 6])
  })

  it('chaining works correctly', () => {
    const result = collect(users)
      .where('active', true)
      .sortBy('age')
      .pluck('name')
      .all()
    expect(result).toEqual(['Alice', 'Charlie'])
  })

  it('is iterable', () => {
    const c = collect([1, 2, 3])
    const result = [...c]
    expect(result).toEqual([1, 2, 3])
  })

  it('has length property', () => {
    expect(collect([1, 2, 3]).length).toBe(3)
  })

  it('is immutable', () => {
    const c = collect([1, 2, 3])
    const c2 = c.push(4)
    expect(c.all()).toEqual([1, 2, 3])
    expect(c2.all()).toEqual([1, 2, 3, 4])
  })

  it('groupBy returns Collections', () => {
    const groups = collect(users).groupBy('active')
    expect(groups.get(true)).toBeInstanceOf(Collection)
    expect(groups.get(true)!.all()).toHaveLength(2)
  })

  it('chunk returns Collections', () => {
    const chunks = collect([1, 2, 3, 4]).chunk(2)
    expect(chunks.all()[0]).toBeInstanceOf(Collection)
    expect(chunks.all()[0].all()).toEqual([1, 2])
  })

  it('partition returns Collections', () => {
    const [evens, odds] = collect([1, 2, 3, 4]).partition((x) => x % 2 === 0)
    expect(evens).toBeInstanceOf(Collection)
    expect(evens.all()).toEqual([2, 4])
    expect(odds.all()).toEqual([1, 3])
  })

  it('tap returns self for chaining', () => {
    let captured: Collection<number> | null = null
    const result = collect([1, 2, 3])
      .tap((c) => {
        captured = c
      })
      .push(4)
    expect(captured!.all()).toEqual([1, 2, 3])
    expect(result.all()).toEqual([1, 2, 3, 4])
  })

  it('when conditionally applies transformation', () => {
    const shouldFilter = true
    const result = collect([1, 2, 3, 4])
      .when(shouldFilter, (c) => c.filter((x) => x > 2))
      .all()
    expect(result).toEqual([3, 4])
  })
})
