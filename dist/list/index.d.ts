type Comparator<T> = (a: T, b: T) => number;
type Predicate<T> = (item: T, index: number) => boolean;
type Mapper<T, U> = (item: T, index: number) => U;
type Reducer<T, U> = (acc: U, item: T, index: number) => U;
export declare class List<T = unknown> {
    private items;
    private constructor();
    static create<T>(items?: T[]): List<T>;
    static from<T>(items: Iterable<T>): List<T>;
    static range(start: number, end: number, step?: number): List<number>;
    add(item: T, index?: number): List<T>;
    remove(index: number): List<T>;
    removeWhere(predicate: Predicate<T>): List<T>;
    set(index: number, item: T): List<T>;
    get(index: number): T | undefined;
    first(): T | undefined;
    last(): T | undefined;
    sort(comparator?: Comparator<T>): List<T>;
    sortBy(key: keyof T, direction?: 'asc' | 'desc'): List<T>;
    reverse(): List<T>;
    filter(predicate: Predicate<T>): List<T>;
    find(predicate: Predicate<T>): T | undefined;
    findIndex(predicate: Predicate<T>): number;
    map<U>(mapper: Mapper<T, U>): List<U>;
    reduce<U>(reducer: Reducer<T, U>, initial: U): U;
    forEach(callback: (item: T, index: number) => void): List<T>;
    includes(item: T): boolean;
    indexOf(item: T): number;
    every(predicate: Predicate<T>): boolean;
    some(predicate: Predicate<T>): boolean;
    slice(start?: number, end?: number): List<T>;
    take(count: number): List<T>;
    skip(count: number): List<T>;
    chunk(size: number): List<T[]>;
    unique(): List<T>;
    uniqueBy(key: keyof T): List<T>;
    groupBy(key: keyof T): Map<unknown, T[]>;
    flatten<U>(): List<U>;
    concat(...lists: List<T>[]): List<T>;
    isEmpty(): boolean;
    isNotEmpty(): boolean;
    count(): number;
    clear(): List<T>;
    toArray(): T[];
    toJSON(): T[];
    /**
     * Makes List iterable, allowing it to work with for...of loops and Vue's v-for directive.
     * This eliminates the need to call .toArray() before using with v-for.
     */
    [Symbol.iterator](): Iterator<T>;
    /**
     * Returns the length of the list.
     * Required for Vue reactivity to properly detect List as array-like.
     */
    get length(): number;
    clone(): List<T>;
    sum(): number;
    avg(): number;
    min(): T | undefined;
    max(): T | undefined;
}
export {};
