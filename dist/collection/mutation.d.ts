/**
 * Mutation atomics - push, prepend, pop, shift, forget, pull, put, toggle
 * Note: These return new arrays, not mutate in place (immutable)
 */
/**
 * Add items to the end
 */
export declare function push<T>(items: readonly T[], ...newItems: T[]): T[];
/**
 * Add an item to the beginning
 */
export declare function prepend<T>(items: readonly T[], item: T): T[];
/**
 * Remove and return the last item
 */
export declare function pop<T>(items: readonly T[]): {
    item: T | undefined;
    items: T[];
};
/**
 * Remove and return the first item
 */
export declare function shift<T>(items: readonly T[]): {
    item: T | undefined;
    items: T[];
};
/**
 * Remove an item by index
 */
export declare function forget<T>(items: readonly T[], index: number): T[];
/**
 * Remove and return an item by index
 */
export declare function pull<T>(items: readonly T[], index: number): {
    item: T | undefined;
    items: T[];
};
/**
 * Set a value at index
 */
export declare function put<T>(items: readonly T[], index: number, value: T): T[];
/**
 * Toggle an item (add if missing, remove if present)
 */
export declare function toggle<T>(items: readonly T[], item: T, key?: keyof T): T[];
