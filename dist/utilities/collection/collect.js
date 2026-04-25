/**
 * Collection class - chainable wrapper that delegates to atomic functions
 */
import * as retrieval from './retrieval';
import * as whereOps from './where';
import * as filterOps from './filter';
import * as transform from './transform';
import * as grouping from './grouping';
import * as ordering from './ordering';
import * as slicing from './slicing';
import * as mutation from './mutation';
import * as combining from './combining';
import * as aggregate from './aggregate';
import * as predicates from './predicates';
import * as control from './control';
import * as misc from './misc';
export class Collection {
    items;
    constructor(items = []) {
        this.items = Object.freeze([...items]);
    }
    // ============================================================
    // Static Constructors
    // ============================================================
    static collect(items = []) {
        return new Collection(items);
    }
    static wrap(value) {
        if (Array.isArray(value)) {
            return new Collection(value);
        }
        return new Collection([value]);
    }
    static from(items) {
        return new Collection(Array.from(items));
    }
    static range(start, end, step = 1) {
        const items = [];
        if (step > 0) {
            for (let i = start; i < end; i += step) {
                items.push(i);
            }
        }
        else if (step < 0) {
            for (let i = start; i > end; i += step) {
                items.push(i);
            }
        }
        return new Collection(items);
    }
    static times(count, callback) {
        const items = [];
        for (let i = 1; i <= count; i++) {
            items.push(callback(i));
        }
        return new Collection(items);
    }
    // ============================================================
    // Retrieval Methods
    // ============================================================
    all() {
        return [...this.items];
    }
    get(index, defaultValue) {
        return retrieval.get(this.items, index, defaultValue);
    }
    first(predicate) {
        return retrieval.first(this.items, predicate);
    }
    firstWhere(key, operatorOrValue, value) {
        return retrieval.firstWhere(this.items, key, operatorOrValue, value);
    }
    last(predicate) {
        return retrieval.last(this.items, predicate);
    }
    before(item) {
        return retrieval.before(this.items, item);
    }
    after(item) {
        return retrieval.after(this.items, item);
    }
    pluck(key, keyBy) {
        if (keyBy !== undefined) {
            return retrieval.pluck(this.items, key, keyBy);
        }
        return new Collection(retrieval.pluck(this.items, key));
    }
    only(keys) {
        return new Collection(retrieval.only(this.items, keys));
    }
    except(keys) {
        return new Collection(retrieval.except(this.items, keys));
    }
    random(count) {
        if (this.items.length === 0)
            return undefined;
        if (count === undefined) {
            return retrieval.random(this.items);
        }
        return new Collection(retrieval.random(this.items, count));
    }
    // ============================================================
    // Filtering / Where Methods
    // ============================================================
    filter(predicate) {
        return new Collection(filterOps.filter(this.items, predicate));
    }
    where(key, operatorOrValue, value) {
        return new Collection(whereOps.where(this.items, key, operatorOrValue, value));
    }
    whereIn(key, values) {
        return new Collection(whereOps.whereIn(this.items, key, values));
    }
    whereNotIn(key, values) {
        return new Collection(whereOps.whereNotIn(this.items, key, values));
    }
    whereBetween(key, range) {
        return new Collection(whereOps.whereBetween(this.items, key, range));
    }
    whereNotBetween(key, range) {
        return new Collection(whereOps.whereNotBetween(this.items, key, range));
    }
    whereNull(key) {
        return new Collection(whereOps.whereNull(this.items, key));
    }
    whereNotNull(key) {
        return new Collection(whereOps.whereNotNull(this.items, key));
    }
    reject(predicate) {
        return new Collection(filterOps.reject(this.items, predicate));
    }
    unique(key) {
        return new Collection(filterOps.unique(this.items, key));
    }
    duplicates(key) {
        return new Collection(filterOps.duplicates(this.items, key));
    }
    // ============================================================
    // Transformation Methods
    // ============================================================
    map(mapper) {
        return new Collection(transform.map(this.items, mapper));
    }
    flatMap(mapper) {
        return new Collection(transform.flatMap(this.items, mapper));
    }
    mapWithKeys(mapper) {
        return transform.mapWithKeys(this.items, mapper);
    }
    keyBy(keyOrCallback) {
        return grouping.keyBy(this.items, keyOrCallback);
    }
    groupBy(keyOrCallback) {
        const groups = grouping.groupBy(this.items, keyOrCallback);
        const result = new Map();
        for (const [k, v] of groups) {
            result.set(k, new Collection(v));
        }
        return result;
    }
    countBy(keyOrCallback) {
        return grouping.countBy(this.items, keyOrCallback);
    }
    partition(predicate) {
        const [pass, fail] = grouping.partition(this.items, predicate);
        return [new Collection(pass), new Collection(fail)];
    }
    flatten(depth = 1) {
        return new Collection(transform.flatten(this.items, depth));
    }
    collapse() {
        return new Collection(transform.collapse(this.items));
    }
    flip() {
        return transform.flip(this.items);
    }
    // ============================================================
    // Ordering Methods
    // ============================================================
    sort(comparator) {
        return new Collection(ordering.sort(this.items, comparator));
    }
    sortBy(keyOrCallback) {
        return new Collection(ordering.sortBy(this.items, keyOrCallback));
    }
    sortByDesc(keyOrCallback) {
        return new Collection(ordering.sortByDesc(this.items, keyOrCallback));
    }
    sortDesc() {
        return new Collection(ordering.sortDesc(this.items));
    }
    reverse() {
        return new Collection(ordering.reverse(this.items));
    }
    shuffle() {
        return new Collection(ordering.shuffle(this.items));
    }
    // ============================================================
    // Slicing Methods
    // ============================================================
    take(count) {
        return new Collection(slicing.take(this.items, count));
    }
    takeWhile(predicate) {
        return new Collection(slicing.takeWhile(this.items, predicate));
    }
    takeUntil(predicate) {
        return new Collection(slicing.takeUntil(this.items, predicate));
    }
    skip(count) {
        return new Collection(slicing.skip(this.items, count));
    }
    skipWhile(predicate) {
        return new Collection(slicing.skipWhile(this.items, predicate));
    }
    skipUntil(predicate) {
        return new Collection(slicing.skipUntil(this.items, predicate));
    }
    slice(start, end) {
        return new Collection(slicing.slice(this.items, start, end));
    }
    forPage(page, perPage) {
        return new Collection(slicing.forPage(this.items, page, perPage));
    }
    split(count) {
        const groups = slicing.split(this.items, count);
        return new Collection(groups.map(g => new Collection(g)));
    }
    chunk(size) {
        const chunks = slicing.chunk(this.items, size);
        return new Collection(chunks.map(c => new Collection(c)));
    }
    sliding(size, step = 1) {
        const windows = slicing.sliding(this.items, size, step);
        return new Collection(windows.map(w => new Collection(w)));
    }
    nth(step, offset = 0) {
        return new Collection(slicing.nth(this.items, step, offset));
    }
    // ============================================================
    // Mutation Methods (return new Collections)
    // ============================================================
    push(...items) {
        return new Collection(mutation.push(this.items, ...items));
    }
    prepend(item) {
        return new Collection(mutation.prepend(this.items, item));
    }
    pop() {
        const result = mutation.pop(this.items);
        return { item: result.item, collection: new Collection(result.items) };
    }
    shift() {
        const result = mutation.shift(this.items);
        return { item: result.item, collection: new Collection(result.items) };
    }
    forget(index) {
        return new Collection(mutation.forget(this.items, index));
    }
    pull(index) {
        const result = mutation.pull(this.items, index);
        return { item: result.item, collection: new Collection(result.items) };
    }
    put(index, value) {
        return new Collection(mutation.put(this.items, index, value));
    }
    toggle(item, key) {
        return new Collection(mutation.toggle(this.items, item, key));
    }
    // ============================================================
    // Combining Methods
    // ============================================================
    concat(...items) {
        const arrays = items.map(i => i instanceof Collection ? i.all() : i);
        return new Collection(combining.concat(this.items, ...arrays));
    }
    merge(items) {
        const other = items instanceof Collection ? items.all() : items;
        return new Collection(combining.merge(this.items, other));
    }
    diff(items) {
        const other = items instanceof Collection ? items.all() : items;
        return new Collection(combining.diff(this.items, other));
    }
    intersect(items) {
        const other = items instanceof Collection ? items.all() : items;
        return new Collection(combining.intersect(this.items, other));
    }
    combine(values) {
        return combining.combine(this.items, values);
    }
    zip(items) {
        return new Collection(combining.zip(this.items, items));
    }
    pad(size, value) {
        return new Collection(combining.pad(this.items, size, value));
    }
    // ============================================================
    // Aggregation Methods
    // ============================================================
    reduce(reducer, initial) {
        return aggregate.reduce(this.items, reducer, initial);
    }
    sum(key) {
        return aggregate.sum(this.items, key);
    }
    avg(key) {
        return aggregate.avg(this.items, key);
    }
    average(key) {
        return this.avg(key);
    }
    min(key) {
        return aggregate.min(this.items, key);
    }
    max(key) {
        return aggregate.max(this.items, key);
    }
    median(key) {
        return aggregate.median(this.items, key);
    }
    mode(key) {
        return aggregate.mode(this.items, key);
    }
    // ============================================================
    // Boolean/Predicate Methods
    // ============================================================
    contains(keyOrValue, value) {
        return predicates.contains(this.items, keyOrValue, value);
    }
    doesntContain(keyOrValue, value) {
        return predicates.doesntContain(this.items, keyOrValue, value);
    }
    has(key) {
        return predicates.has(this.items, key);
    }
    isEmpty() {
        return predicates.isEmpty(this.items);
    }
    isNotEmpty() {
        return predicates.isNotEmpty(this.items);
    }
    every(predicate) {
        return predicates.every(this.items, predicate);
    }
    some(predicate) {
        return predicates.some(this.items, predicate);
    }
    // ============================================================
    // Control Flow Methods
    // ============================================================
    each(callback) {
        control.each(this.items, callback);
        return this;
    }
    tap(callback) {
        callback(this);
        return this;
    }
    pipe(callback) {
        return callback(this);
    }
    when(condition, callback, fallback) {
        const shouldRun = typeof condition === 'function' ? condition() : condition;
        if (shouldRun) {
            return callback(this);
        }
        if (fallback) {
            return fallback(this);
        }
        return this;
    }
    unless(condition, callback, fallback) {
        const shouldSkip = typeof condition === 'function' ? condition() : condition;
        return this.when(!shouldSkip, callback, fallback);
    }
    whenEmpty(callback) {
        return this.when(this.isEmpty(), callback);
    }
    whenNotEmpty(callback) {
        return this.when(this.isNotEmpty(), callback);
    }
    search(itemOrPredicate) {
        return misc.search(this.items, itemOrPredicate);
    }
    join(glue = ', ', finalGlue) {
        return misc.join(this.items, glue, finalGlue);
    }
    implode(key, glue = ', ') {
        return misc.implode(this.items, key, glue);
    }
    count() {
        return misc.count(this.items);
    }
    keys() {
        return new Collection(misc.keys(this.items));
    }
    values() {
        return new Collection(misc.values(this.items));
    }
    toJson() {
        return misc.toJson(this.items);
    }
    // ============================================================
    // Iterator & Length
    // ============================================================
    [Symbol.iterator]() {
        return this.items[Symbol.iterator]();
    }
    get length() {
        return this.items.length;
    }
}
/**
 * Create a new Collection instance
 */
export function collect(items = []) {
    return Collection.collect(items);
}
