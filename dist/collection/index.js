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
export class Collection {
    items;
    constructor(items = []) {
        this.items = Object.freeze([...items]);
    }
    // ============================================================
    // Static Constructors
    // ============================================================
    /**
     * Create a new Collection instance
     */
    static collect(items = []) {
        return new Collection(items);
    }
    /**
     * Wrap a value in a Collection
     */
    static wrap(value) {
        if (Array.isArray(value)) {
            return new Collection(value);
        }
        return new Collection([value]);
    }
    /**
     * Create a Collection from an iterable
     */
    static from(items) {
        return new Collection(Array.from(items));
    }
    /**
     * Create a Collection of numbers in a range
     */
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
    /**
     * Create a Collection by invoking a callback n times
     */
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
    /**
     * Get all items as an array
     */
    all() {
        return [...this.items];
    }
    /**
     * Get item at index
     */
    get(index, defaultValue) {
        return this.items[index] ?? defaultValue;
    }
    /**
     * Get the first item, optionally matching a predicate
     */
    first(predicate) {
        if (!predicate) {
            return this.items[0];
        }
        for (let i = 0; i < this.items.length; i++) {
            if (predicate(this.items[i], i)) {
                return this.items[i];
            }
        }
        return undefined;
    }
    /**
     * Get the first item matching key/value, with optional operator
     */
    firstWhere(key, operatorOrValue, value) {
        const { operator, compareValue } = this.parseOperator(operatorOrValue, value);
        return this.first((item) => this.compareValues(item[key], operator, compareValue));
    }
    /**
     * Get the last item, optionally matching a predicate
     */
    last(predicate) {
        if (!predicate) {
            return this.items[this.items.length - 1];
        }
        for (let i = this.items.length - 1; i >= 0; i--) {
            if (predicate(this.items[i], i)) {
                return this.items[i];
            }
        }
        return undefined;
    }
    /**
     * Get the item before a given item
     */
    before(item) {
        const index = this.search(item);
        if (index <= 0)
            return undefined;
        return this.items[index - 1];
    }
    /**
     * Get the item after a given item
     */
    after(item) {
        const index = this.search(item);
        if (index === -1 || index >= this.items.length - 1)
            return undefined;
        return this.items[index + 1];
    }
    pluck(key, keyBy) {
        if (keyBy !== undefined) {
            const map = new Map();
            for (const item of this.items) {
                map.set(item[keyBy], item[key]);
            }
            return map;
        }
        return new Collection(this.items.map(item => item[key]));
    }
    /**
     * Get only specified keys from each item
     */
    only(keys) {
        return new Collection(this.items.map(item => {
            const result = {};
            for (const key of keys) {
                if (key in item) {
                    result[key] = item[key];
                }
            }
            return result;
        }));
    }
    /**
     * Get all keys except specified ones from each item
     */
    except(keys) {
        const keySet = new Set(keys);
        return new Collection(this.items.map(item => {
            const result = {};
            for (const key in item) {
                if (!keySet.has(key)) {
                    result[key] = item[key];
                }
            }
            return result;
        }));
    }
    /**
     * Get a random item or items
     */
    random(count) {
        if (this.items.length === 0)
            return undefined;
        if (count === undefined) {
            return this.items[Math.floor(Math.random() * this.items.length)];
        }
        const shuffled = [...this.items].sort(() => Math.random() - 0.5);
        return new Collection(shuffled.slice(0, count));
    }
    // ============================================================
    // Filtering Methods
    // ============================================================
    /**
     * Filter items using a callback
     */
    filter(predicate) {
        return new Collection(this.items.filter((item, i) => predicate(item, i)));
    }
    /**
     * Filter items where key matches value, with optional operator
     */
    where(key, operatorOrValue, value) {
        const { operator, compareValue } = this.parseOperator(operatorOrValue, value);
        return this.filter((item) => this.compareValues(item[key], operator, compareValue));
    }
    /**
     * Filter items where key is in array of values
     */
    whereIn(key, values) {
        const valueSet = new Set(values);
        return this.filter((item) => valueSet.has(item[key]));
    }
    /**
     * Filter items where key is not in array of values
     */
    whereNotIn(key, values) {
        const valueSet = new Set(values);
        return this.filter((item) => !valueSet.has(item[key]));
    }
    /**
     * Filter items where key is between two values
     */
    whereBetween(key, range) {
        const [min, max] = range;
        return this.filter((item) => {
            const val = item[key];
            return val >= min && val <= max;
        });
    }
    /**
     * Filter items where key is not between two values
     */
    whereNotBetween(key, range) {
        const [min, max] = range;
        return this.filter((item) => {
            const val = item[key];
            return val < min || val > max;
        });
    }
    /**
     * Filter items where key is null or undefined
     */
    whereNull(key) {
        return this.filter((item) => item[key] == null);
    }
    /**
     * Filter items where key is not null or undefined
     */
    whereNotNull(key) {
        return this.filter((item) => item[key] != null);
    }
    /**
     * Reject items matching predicate (inverse of filter)
     */
    reject(predicate) {
        return this.filter((item, i) => !predicate(item, i));
    }
    /**
     * Get unique items, optionally by key
     */
    unique(key) {
        if (key === undefined) {
            return new Collection([...new Set(this.items)]);
        }
        const seen = new Set();
        const result = [];
        for (const item of this.items) {
            const val = item[key];
            if (!seen.has(val)) {
                seen.add(val);
                result.push(item);
            }
        }
        return new Collection(result);
    }
    /**
     * Get duplicate items, optionally by key
     */
    duplicates(key) {
        const seen = new Map();
        const result = [];
        for (const item of this.items) {
            const val = key ? item[key] : item;
            const count = seen.get(val) || 0;
            seen.set(val, count + 1);
            if (count === 1) {
                result.push(item);
            }
        }
        return new Collection(result);
    }
    // ============================================================
    // Transformation Methods
    // ============================================================
    /**
     * Map each item through a callback
     */
    map(mapper) {
        return new Collection(this.items.map((item, i) => mapper(item, i)));
    }
    /**
     * Map and flatten by one level
     */
    flatMap(mapper) {
        return new Collection(this.items.flatMap((item, i) => mapper(item, i)));
    }
    /**
     * Map to key/value pairs
     */
    mapWithKeys(mapper) {
        const result = new Map();
        for (let i = 0; i < this.items.length; i++) {
            const { key, value } = mapper(this.items[i], i);
            result.set(key, value);
        }
        return result;
    }
    keyBy(keyOrCallback) {
        const result = new Map();
        for (const item of this.items) {
            const k = typeof keyOrCallback === 'function'
                ? keyOrCallback(item)
                : item[keyOrCallback];
            result.set(k, item);
        }
        return result;
    }
    groupBy(keyOrCallback) {
        const groups = new Map();
        for (const item of this.items) {
            const k = typeof keyOrCallback === 'function'
                ? keyOrCallback(item)
                : item[keyOrCallback];
            if (!groups.has(k)) {
                groups.set(k, []);
            }
            groups.get(k).push(item);
        }
        const result = new Map();
        for (const [k, v] of groups) {
            result.set(k, new Collection(v));
        }
        return result;
    }
    countBy(keyOrCallback) {
        const counts = new Map();
        for (const item of this.items) {
            const k = keyOrCallback === undefined
                ? item
                : typeof keyOrCallback === 'function'
                    ? keyOrCallback(item)
                    : item[keyOrCallback];
            counts.set(k, (counts.get(k) || 0) + 1);
        }
        return counts;
    }
    /**
     * Partition items into two collections based on predicate
     */
    partition(predicate) {
        const pass = [];
        const fail = [];
        for (let i = 0; i < this.items.length; i++) {
            if (predicate(this.items[i], i)) {
                pass.push(this.items[i]);
            }
            else {
                fail.push(this.items[i]);
            }
        }
        return [new Collection(pass), new Collection(fail)];
    }
    /**
     * Flatten nested arrays
     */
    flatten(depth = 1) {
        return new Collection(this.items.flat(depth));
    }
    /**
     * Collapse an array of arrays into a single flat collection
     */
    collapse() {
        return new Collection(this.items.flat(1));
    }
    /**
     * Flip keys and values (for simple arrays)
     */
    flip() {
        const result = new Map();
        for (let i = 0; i < this.items.length; i++) {
            result.set(this.items[i], i);
        }
        return result;
    }
    // ============================================================
    // Ordering Methods
    // ============================================================
    /**
     * Sort items
     */
    sort(comparator) {
        const sorted = [...this.items];
        sorted.sort(comparator);
        return new Collection(sorted);
    }
    sortBy(keyOrCallback) {
        const sorted = [...this.items];
        sorted.sort((a, b) => {
            const aVal = typeof keyOrCallback === 'function' ? keyOrCallback(a) : a[keyOrCallback];
            const bVal = typeof keyOrCallback === 'function' ? keyOrCallback(b) : b[keyOrCallback];
            if (aVal < bVal)
                return -1;
            if (aVal > bVal)
                return 1;
            return 0;
        });
        return new Collection(sorted);
    }
    sortByDesc(keyOrCallback) {
        const sorted = [...this.items];
        sorted.sort((a, b) => {
            const aVal = typeof keyOrCallback === 'function' ? keyOrCallback(a) : a[keyOrCallback];
            const bVal = typeof keyOrCallback === 'function' ? keyOrCallback(b) : b[keyOrCallback];
            if (aVal < bVal)
                return 1;
            if (aVal > bVal)
                return -1;
            return 0;
        });
        return new Collection(sorted);
    }
    /**
     * Sort descending
     */
    sortDesc() {
        const sorted = [...this.items];
        sorted.sort((a, b) => {
            if (a < b)
                return 1;
            if (a > b)
                return -1;
            return 0;
        });
        return new Collection(sorted);
    }
    /**
     * Reverse the order
     */
    reverse() {
        return new Collection([...this.items].reverse());
    }
    /**
     * Shuffle the items randomly
     */
    shuffle() {
        const shuffled = [...this.items];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return new Collection(shuffled);
    }
    // ============================================================
    // Slicing Methods
    // ============================================================
    /**
     * Take the first n items
     */
    take(count) {
        if (count < 0) {
            return new Collection(this.items.slice(count));
        }
        return new Collection(this.items.slice(0, count));
    }
    /**
     * Take items while predicate is true
     */
    takeWhile(predicate) {
        const result = [];
        for (let i = 0; i < this.items.length; i++) {
            if (!predicate(this.items[i], i))
                break;
            result.push(this.items[i]);
        }
        return new Collection(result);
    }
    /**
     * Take items until predicate is true
     */
    takeUntil(predicate) {
        const result = [];
        for (let i = 0; i < this.items.length; i++) {
            if (predicate(this.items[i], i))
                break;
            result.push(this.items[i]);
        }
        return new Collection(result);
    }
    /**
     * Skip the first n items
     */
    skip(count) {
        return new Collection(this.items.slice(count));
    }
    /**
     * Skip items while predicate is true
     */
    skipWhile(predicate) {
        let index = 0;
        for (let i = 0; i < this.items.length; i++) {
            if (!predicate(this.items[i], i))
                break;
            index = i + 1;
        }
        return new Collection(this.items.slice(index));
    }
    /**
     * Skip items until predicate is true
     */
    skipUntil(predicate) {
        let index = 0;
        for (let i = 0; i < this.items.length; i++) {
            if (predicate(this.items[i], i))
                break;
            index = i + 1;
        }
        return new Collection(this.items.slice(index));
    }
    /**
     * Get a slice of the collection
     */
    slice(start, end) {
        return new Collection(this.items.slice(start, end));
    }
    /**
     * Get items for a specific page
     */
    forPage(page, perPage) {
        const start = (page - 1) * perPage;
        return new Collection(this.items.slice(start, start + perPage));
    }
    /**
     * Split into n groups
     */
    split(count) {
        if (count <= 0)
            return new Collection([]);
        const size = Math.ceil(this.items.length / count);
        const result = [];
        for (let i = 0; i < this.items.length; i += size) {
            result.push(new Collection(this.items.slice(i, i + size)));
        }
        return new Collection(result);
    }
    /**
     * Break into chunks of given size
     */
    chunk(size) {
        const chunks = [];
        for (let i = 0; i < this.items.length; i += size) {
            chunks.push(new Collection(this.items.slice(i, i + size)));
        }
        return new Collection(chunks);
    }
    /**
     * Get sliding windows of items
     */
    sliding(size, step = 1) {
        const result = [];
        for (let i = 0; i <= this.items.length - size; i += step) {
            result.push(new Collection(this.items.slice(i, i + size)));
        }
        return new Collection(result);
    }
    /**
     * Get every nth item
     */
    nth(step, offset = 0) {
        const result = [];
        for (let i = offset; i < this.items.length; i += step) {
            result.push(this.items[i]);
        }
        return new Collection(result);
    }
    // ============================================================
    // Adding/Removing Methods (return new Collection)
    // ============================================================
    /**
     * Add an item to the end
     */
    push(...items) {
        return new Collection([...this.items, ...items]);
    }
    /**
     * Add an item to the beginning
     */
    prepend(item) {
        return new Collection([item, ...this.items]);
    }
    /**
     * Remove and return the last item
     */
    pop() {
        if (this.items.length === 0) {
            return { item: undefined, collection: new Collection([]) };
        }
        return {
            item: this.items[this.items.length - 1],
            collection: new Collection(this.items.slice(0, -1))
        };
    }
    /**
     * Remove and return the first item
     */
    shift() {
        if (this.items.length === 0) {
            return { item: undefined, collection: new Collection([]) };
        }
        return {
            item: this.items[0],
            collection: new Collection(this.items.slice(1))
        };
    }
    /**
     * Remove an item by key/index
     */
    forget(index) {
        const result = [...this.items];
        result.splice(index, 1);
        return new Collection(result);
    }
    /**
     * Remove and return an item by key
     */
    pull(index) {
        const item = this.items[index];
        return { item, collection: this.forget(index) };
    }
    /**
     * Set a value at index
     */
    put(index, value) {
        const result = [...this.items];
        result[index] = value;
        return new Collection(result);
    }
    /**
     * Toggle an item (add if missing, remove if present)
     */
    toggle(item, key) {
        if (key !== undefined) {
            const index = this.items.findIndex(i => i[key] === item[key]);
            if (index >= 0) {
                return this.forget(index);
            }
            return this.push(item);
        }
        const index = this.items.indexOf(item);
        if (index >= 0) {
            return this.forget(index);
        }
        return this.push(item);
    }
    // ============================================================
    // Combining Methods
    // ============================================================
    /**
     * Concatenate with other collections or arrays
     */
    concat(...items) {
        let result = [...this.items];
        for (const item of items) {
            if (item instanceof Collection) {
                result = result.concat(item.all());
            }
            else {
                result = result.concat(item);
            }
        }
        return new Collection(result);
    }
    /**
     * Merge with another collection (overwrites by index)
     */
    merge(items) {
        const other = items instanceof Collection ? items.all() : items;
        const result = [...this.items];
        for (let i = 0; i < other.length; i++) {
            result[i] = other[i];
        }
        return new Collection(result);
    }
    /**
     * Get items not present in given collection
     */
    diff(items) {
        const other = items instanceof Collection ? items.all() : items;
        const otherSet = new Set(other);
        return this.filter(item => !otherSet.has(item));
    }
    /**
     * Get items present in both collections
     */
    intersect(items) {
        const other = items instanceof Collection ? items.all() : items;
        const otherSet = new Set(other);
        return this.filter(item => otherSet.has(item));
    }
    /**
     * Combine keys with values
     */
    combine(values) {
        const result = new Map();
        const len = Math.min(this.items.length, values.length);
        for (let i = 0; i < len; i++) {
            result.set(this.items[i], values[i]);
        }
        return result;
    }
    /**
     * Zip with another collection
     */
    zip(items) {
        const result = [];
        const len = Math.min(this.items.length, items.length);
        for (let i = 0; i < len; i++) {
            result.push([this.items[i], items[i]]);
        }
        return new Collection(result);
    }
    /**
     * Pad collection to specified size
     */
    pad(size, value) {
        const absSize = Math.abs(size);
        if (this.items.length >= absSize) {
            return new Collection([...this.items]);
        }
        const padding = Array(absSize - this.items.length).fill(value);
        if (size > 0) {
            return new Collection([...this.items, ...padding]);
        }
        return new Collection([...padding, ...this.items]);
    }
    // ============================================================
    // Aggregation Methods
    // ============================================================
    /**
     * Reduce to a single value
     */
    reduce(reducer, initial) {
        return this.items.reduce((acc, item, i) => reducer(acc, item, i), initial);
    }
    /**
     * Get sum of items or key values
     */
    sum(key) {
        if (key === undefined) {
            return this.items.reduce((a, b) => a + b, 0);
        }
        return this.items.reduce((sum, item) => sum + item[key], 0);
    }
    /**
     * Get average of items or key values
     */
    avg(key) {
        if (this.items.length === 0)
            return 0;
        return this.sum(key) / this.items.length;
    }
    /**
     * Alias for avg
     */
    average(key) {
        return this.avg(key);
    }
    /**
     * Get minimum value
     */
    min(key) {
        if (this.items.length === 0)
            return undefined;
        if (key === undefined) {
            return this.items.reduce((min, item) => item < min ? item : min);
        }
        let minItem = this.items[0];
        for (const item of this.items) {
            if (item[key] < minItem[key]) {
                minItem = item;
            }
        }
        return minItem[key];
    }
    /**
     * Get maximum value
     */
    max(key) {
        if (this.items.length === 0)
            return undefined;
        if (key === undefined) {
            return this.items.reduce((max, item) => item > max ? item : max);
        }
        let maxItem = this.items[0];
        for (const item of this.items) {
            if (item[key] > maxItem[key]) {
                maxItem = item;
            }
        }
        return maxItem[key];
    }
    /**
     * Get median value
     */
    median(key) {
        if (this.items.length === 0)
            return undefined;
        const values = key !== undefined
            ? this.items.map(item => item[key])
            : this.items;
        const sorted = [...values].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        if (sorted.length % 2 === 0) {
            return (sorted[mid - 1] + sorted[mid]) / 2;
        }
        return sorted[mid];
    }
    /**
     * Get mode value(s)
     */
    mode(key) {
        if (this.items.length === 0)
            return undefined;
        const values = key !== undefined
            ? this.items.map(item => item[key])
            : this.items;
        const counts = new Map();
        let maxCount = 0;
        for (const val of values) {
            const count = (counts.get(val) || 0) + 1;
            counts.set(val, count);
            if (count > maxCount)
                maxCount = count;
        }
        const result = [];
        for (const [val, count] of counts) {
            if (count === maxCount) {
                result.push(val);
            }
        }
        return result;
    }
    // ============================================================
    // Boolean Methods
    // ============================================================
    /**
     * Check if collection contains an item or matches predicate
     */
    contains(keyOrValue, value) {
        // Predicate function
        if (typeof keyOrValue === 'function') {
            return this.items.some((item, i) => keyOrValue(item, i));
        }
        // Key/value pair
        if (value !== undefined) {
            return this.items.some(item => item[keyOrValue] === value);
        }
        // Direct value check
        return this.items.includes(keyOrValue);
    }
    /**
     * Inverse of contains
     */
    doesntContain(keyOrValue, value) {
        return !this.contains(keyOrValue, value);
    }
    /**
     * Check if key exists (for object-based items)
     */
    has(key) {
        return key >= 0 && key < this.items.length;
    }
    /**
     * Check if collection is empty
     */
    isEmpty() {
        return this.items.length === 0;
    }
    /**
     * Check if collection is not empty
     */
    isNotEmpty() {
        return this.items.length > 0;
    }
    /**
     * Check if all items pass predicate
     */
    every(predicate) {
        return this.items.every((item, i) => predicate(item, i));
    }
    /**
     * Check if any item passes predicate (alias for contains with predicate)
     */
    some(predicate) {
        return this.items.some((item, i) => predicate(item, i));
    }
    // ============================================================
    // Iteration Methods
    // ============================================================
    /**
     * Iterate over each item
     */
    each(callback) {
        for (let i = 0; i < this.items.length; i++) {
            if (callback(this.items[i], i) === false)
                break;
        }
        return this;
    }
    /**
     * Pass collection to callback, return self (for side effects)
     */
    tap(callback) {
        callback(this);
        return this;
    }
    /**
     * Pass collection to callback, return result
     */
    pipe(callback) {
        return callback(this);
    }
    /**
     * Conditionally apply transformation
     */
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
    /**
     * Inverse of when
     */
    unless(condition, callback, fallback) {
        const shouldSkip = typeof condition === 'function' ? condition() : condition;
        return this.when(!shouldSkip, callback, fallback);
    }
    /**
     * Apply callback if collection is empty
     */
    whenEmpty(callback) {
        return this.when(this.isEmpty(), callback);
    }
    /**
     * Apply callback if collection is not empty
     */
    whenNotEmpty(callback) {
        return this.when(this.isNotEmpty(), callback);
    }
    search(itemOrPredicate) {
        if (typeof itemOrPredicate === 'function') {
            return this.items.findIndex((item, i) => itemOrPredicate(item, i));
        }
        return this.items.indexOf(itemOrPredicate);
    }
    // ============================================================
    // String Methods
    // ============================================================
    /**
     * Join items with a separator
     */
    join(glue = ', ', finalGlue) {
        if (this.items.length === 0)
            return '';
        if (this.items.length === 1)
            return String(this.items[0]);
        if (finalGlue !== undefined) {
            const allButLast = this.items.slice(0, -1);
            return allButLast.join(glue) + finalGlue + this.items[this.items.length - 1];
        }
        return this.items.join(glue);
    }
    /**
     * Join items by key with a separator
     */
    implode(key, glue = ', ') {
        return this.pluck(key).join(glue);
    }
    // ============================================================
    // Output Methods
    // ============================================================
    /**
     * Get item count
     */
    count() {
        return this.items.length;
    }
    /**
     * Get all keys (indices)
     */
    keys() {
        return new Collection(Array.from({ length: this.items.length }, (_, i) => i));
    }
    /**
     * Get all values (resets keys)
     */
    values() {
        return new Collection([...this.items]);
    }
    /**
     * Convert to JSON string
     */
    toJson() {
        return JSON.stringify(this.items);
    }
    /**
     * Make collection iterable
     */
    [Symbol.iterator]() {
        return this.items[Symbol.iterator]();
    }
    /**
     * Get length property for Vue reactivity
     */
    get length() {
        return this.items.length;
    }
    // ============================================================
    // Private Helpers
    // ============================================================
    parseOperator(operatorOrValue, value) {
        if (value !== undefined) {
            return { operator: operatorOrValue, compareValue: value };
        }
        return { operator: '===', compareValue: operatorOrValue };
    }
    compareValues(itemValue, operator, compareValue) {
        switch (operator) {
            case '=':
            case '==':
                return itemValue == compareValue;
            case '===':
                return itemValue === compareValue;
            case '!=':
            case '<>':
                return itemValue != compareValue;
            case '!==':
                return itemValue !== compareValue;
            case '<':
                return itemValue < compareValue;
            case '<=':
                return itemValue <= compareValue;
            case '>':
                return itemValue > compareValue;
            case '>=':
                return itemValue >= compareValue;
            default:
                return itemValue === compareValue;
        }
    }
}
