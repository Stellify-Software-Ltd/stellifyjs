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
type Predicate<T> = (item: T, index: number) => boolean;
type Mapper<T, U> = (item: T, index: number) => U;
type Reducer<T, U> = (acc: U, item: T, index: number) => U;
type KeyMapper<T> = (item: T, index: number) => {
    key: string | number;
    value: unknown;
};
type Operator = '=' | '==' | '===' | '!=' | '!==' | '<' | '<=' | '>' | '>=' | '<>';
export declare class Collection<T = unknown> {
    private readonly items;
    private constructor();
    /**
     * Create a new Collection instance
     */
    static collect<T>(items?: T[]): Collection<T>;
    /**
     * Wrap a value in a Collection
     */
    static wrap<T>(value: T | T[]): Collection<T>;
    /**
     * Create a Collection from an iterable
     */
    static from<T>(items: Iterable<T>): Collection<T>;
    /**
     * Create a Collection of numbers in a range
     */
    static range(start: number, end: number, step?: number): Collection<number>;
    /**
     * Create a Collection by invoking a callback n times
     */
    static times<T>(count: number, callback: (index: number) => T): Collection<T>;
    /**
     * Get all items as an array
     */
    all(): T[];
    /**
     * Get item at index
     */
    get(index: number, defaultValue?: T): T | undefined;
    /**
     * Get the first item, optionally matching a predicate
     */
    first(predicate?: Predicate<T>): T | undefined;
    /**
     * Get the first item matching key/value, with optional operator
     */
    firstWhere(key: keyof T, operatorOrValue?: Operator | unknown, value?: unknown): T | undefined;
    /**
     * Get the last item, optionally matching a predicate
     */
    last(predicate?: Predicate<T>): T | undefined;
    /**
     * Get the item before a given item
     */
    before(item: T): T | undefined;
    /**
     * Get the item after a given item
     */
    after(item: T): T | undefined;
    /**
     * Extract values for a given key
     */
    pluck<K extends keyof T>(key: K): Collection<T[K]>;
    pluck<K extends keyof T, V extends keyof T>(value: K, keyBy: V): Map<T[V], T[K]>;
    /**
     * Get only specified keys from each item
     */
    only<K extends keyof T>(keys: K[]): Collection<Pick<T, K>>;
    /**
     * Get all keys except specified ones from each item
     */
    except<K extends keyof T>(keys: K[]): Collection<Omit<T, K>>;
    /**
     * Get a random item or items
     */
    random(count?: number): T | Collection<T> | undefined;
    /**
     * Filter items using a callback
     */
    filter(predicate: Predicate<T>): Collection<T>;
    /**
     * Filter items where key matches value, with optional operator
     */
    where(key: keyof T, operatorOrValue?: Operator | unknown, value?: unknown): Collection<T>;
    /**
     * Filter items where key is in array of values
     */
    whereIn(key: keyof T, values: unknown[]): Collection<T>;
    /**
     * Filter items where key is not in array of values
     */
    whereNotIn(key: keyof T, values: unknown[]): Collection<T>;
    /**
     * Filter items where key is between two values
     */
    whereBetween(key: keyof T, range: [number, number]): Collection<T>;
    /**
     * Filter items where key is not between two values
     */
    whereNotBetween(key: keyof T, range: [number, number]): Collection<T>;
    /**
     * Filter items where key is null or undefined
     */
    whereNull(key: keyof T): Collection<T>;
    /**
     * Filter items where key is not null or undefined
     */
    whereNotNull(key: keyof T): Collection<T>;
    /**
     * Reject items matching predicate (inverse of filter)
     */
    reject(predicate: Predicate<T>): Collection<T>;
    /**
     * Get unique items, optionally by key
     */
    unique(key?: keyof T): Collection<T>;
    /**
     * Get duplicate items, optionally by key
     */
    duplicates(key?: keyof T): Collection<T>;
    /**
     * Map each item through a callback
     */
    map<U>(mapper: Mapper<T, U>): Collection<U>;
    /**
     * Map and flatten by one level
     */
    flatMap<U>(mapper: Mapper<T, U[]>): Collection<U>;
    /**
     * Map to key/value pairs
     */
    mapWithKeys<U>(mapper: KeyMapper<T>): Map<string | number, unknown>;
    /**
     * Key the collection by a field
     */
    keyBy(key: keyof T): Map<unknown, T>;
    keyBy(callback: (item: T) => string | number): Map<string | number, T>;
    /**
     * Group items by key or callback
     */
    groupBy(key: keyof T): Map<unknown, Collection<T>>;
    groupBy(callback: (item: T) => string | number): Map<string | number, Collection<T>>;
    /**
     * Count occurrences by key or callback
     */
    countBy(key?: keyof T): Map<unknown, number>;
    countBy(callback: (item: T) => string | number): Map<string | number, number>;
    /**
     * Partition items into two collections based on predicate
     */
    partition(predicate: Predicate<T>): [Collection<T>, Collection<T>];
    /**
     * Flatten nested arrays
     */
    flatten(depth?: number): Collection<unknown>;
    /**
     * Collapse an array of arrays into a single flat collection
     */
    collapse(): Collection<unknown>;
    /**
     * Flip keys and values (for simple arrays)
     */
    flip(): Map<unknown, number>;
    /**
     * Sort items
     */
    sort(comparator?: (a: T, b: T) => number): Collection<T>;
    /**
     * Sort by key ascending
     */
    sortBy(key: keyof T): Collection<T>;
    sortBy(callback: (item: T) => unknown): Collection<T>;
    /**
     * Sort by key descending
     */
    sortByDesc(key: keyof T): Collection<T>;
    sortByDesc(callback: (item: T) => unknown): Collection<T>;
    /**
     * Sort descending
     */
    sortDesc(): Collection<T>;
    /**
     * Reverse the order
     */
    reverse(): Collection<T>;
    /**
     * Shuffle the items randomly
     */
    shuffle(): Collection<T>;
    /**
     * Take the first n items
     */
    take(count: number): Collection<T>;
    /**
     * Take items while predicate is true
     */
    takeWhile(predicate: Predicate<T>): Collection<T>;
    /**
     * Take items until predicate is true
     */
    takeUntil(predicate: Predicate<T>): Collection<T>;
    /**
     * Skip the first n items
     */
    skip(count: number): Collection<T>;
    /**
     * Skip items while predicate is true
     */
    skipWhile(predicate: Predicate<T>): Collection<T>;
    /**
     * Skip items until predicate is true
     */
    skipUntil(predicate: Predicate<T>): Collection<T>;
    /**
     * Get a slice of the collection
     */
    slice(start?: number, end?: number): Collection<T>;
    /**
     * Get items for a specific page
     */
    forPage(page: number, perPage: number): Collection<T>;
    /**
     * Split into n groups
     */
    split(count: number): Collection<Collection<T>>;
    /**
     * Break into chunks of given size
     */
    chunk(size: number): Collection<Collection<T>>;
    /**
     * Get sliding windows of items
     */
    sliding(size: number, step?: number): Collection<Collection<T>>;
    /**
     * Get every nth item
     */
    nth(step: number, offset?: number): Collection<T>;
    /**
     * Add an item to the end
     */
    push(...items: T[]): Collection<T>;
    /**
     * Add an item to the beginning
     */
    prepend(item: T): Collection<T>;
    /**
     * Remove and return the last item
     */
    pop(): {
        item: T | undefined;
        collection: Collection<T>;
    };
    /**
     * Remove and return the first item
     */
    shift(): {
        item: T | undefined;
        collection: Collection<T>;
    };
    /**
     * Remove an item by key/index
     */
    forget(index: number): Collection<T>;
    /**
     * Remove and return an item by key
     */
    pull(index: number): {
        item: T | undefined;
        collection: Collection<T>;
    };
    /**
     * Set a value at index
     */
    put(index: number, value: T): Collection<T>;
    /**
     * Toggle an item (add if missing, remove if present)
     */
    toggle(item: T, key?: keyof T): Collection<T>;
    /**
     * Concatenate with other collections or arrays
     */
    concat(...items: (Collection<T> | T[])[]): Collection<T>;
    /**
     * Merge with another collection (overwrites by index)
     */
    merge(items: Collection<T> | T[]): Collection<T>;
    /**
     * Get items not present in given collection
     */
    diff(items: Collection<T> | T[]): Collection<T>;
    /**
     * Get items present in both collections
     */
    intersect(items: Collection<T> | T[]): Collection<T>;
    /**
     * Combine keys with values
     */
    combine<U>(values: U[]): Map<T extends string | number ? T : never, U>;
    /**
     * Zip with another collection
     */
    zip<U>(items: U[]): Collection<[T, U]>;
    /**
     * Pad collection to specified size
     */
    pad(size: number, value: T): Collection<T>;
    /**
     * Reduce to a single value
     */
    reduce<U>(reducer: Reducer<T, U>, initial: U): U;
    /**
     * Get sum of items or key values
     */
    sum(key?: keyof T): number;
    /**
     * Get average of items or key values
     */
    avg(key?: keyof T): number;
    /**
     * Alias for avg
     */
    average(key?: keyof T): number;
    /**
     * Get minimum value
     */
    min(key?: keyof T): T | T[keyof T] | undefined;
    /**
     * Get maximum value
     */
    max(key?: keyof T): T | T[keyof T] | undefined;
    /**
     * Get median value
     */
    median(key?: keyof T): number | undefined;
    /**
     * Get mode value(s)
     */
    mode(key?: keyof T): T[] | T[keyof T][] | undefined;
    /**
     * Check if collection contains an item or matches predicate
     */
    contains(keyOrValue: keyof T | T | Predicate<T>, value?: unknown): boolean;
    /**
     * Inverse of contains
     */
    doesntContain(keyOrValue: keyof T | T | Predicate<T>, value?: unknown): boolean;
    /**
     * Check if key exists (for object-based items)
     */
    has(key: number): boolean;
    /**
     * Check if collection is empty
     */
    isEmpty(): boolean;
    /**
     * Check if collection is not empty
     */
    isNotEmpty(): boolean;
    /**
     * Check if all items pass predicate
     */
    every(predicate: Predicate<T>): boolean;
    /**
     * Check if any item passes predicate (alias for contains with predicate)
     */
    some(predicate: Predicate<T>): boolean;
    /**
     * Iterate over each item
     */
    each(callback: (item: T, index: number) => void | false): Collection<T>;
    /**
     * Pass collection to callback, return self (for side effects)
     */
    tap(callback: (collection: Collection<T>) => void): Collection<T>;
    /**
     * Pass collection to callback, return result
     */
    pipe<U>(callback: (collection: Collection<T>) => U): U;
    /**
     * Conditionally apply transformation
     */
    when<U>(condition: boolean | (() => boolean), callback: (collection: Collection<T>) => Collection<U>, fallback?: (collection: Collection<T>) => Collection<U>): Collection<T> | Collection<U>;
    /**
     * Inverse of when
     */
    unless<U>(condition: boolean | (() => boolean), callback: (collection: Collection<T>) => Collection<U>, fallback?: (collection: Collection<T>) => Collection<U>): Collection<T> | Collection<U>;
    /**
     * Apply callback if collection is empty
     */
    whenEmpty<U>(callback: (collection: Collection<T>) => Collection<U>): Collection<T> | Collection<U>;
    /**
     * Apply callback if collection is not empty
     */
    whenNotEmpty<U>(callback: (collection: Collection<T>) => Collection<U>): Collection<T> | Collection<U>;
    /**
     * Search for an item and return its index
     */
    search(item: T): number;
    search(predicate: Predicate<T>): number;
    /**
     * Join items with a separator
     */
    join(glue?: string, finalGlue?: string): string;
    /**
     * Join items by key with a separator
     */
    implode(key: keyof T, glue?: string): string;
    /**
     * Get item count
     */
    count(): number;
    /**
     * Get all keys (indices)
     */
    keys(): Collection<number>;
    /**
     * Get all values (resets keys)
     */
    values(): Collection<T>;
    /**
     * Convert to JSON string
     */
    toJson(): string;
    /**
     * Make collection iterable
     */
    [Symbol.iterator](): Iterator<T>;
    /**
     * Get length property for Vue reactivity
     */
    get length(): number;
    private parseOperator;
    private compareValues;
}
export {};
