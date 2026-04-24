/**
 * Ordering atomics - sort, sortBy, sortByDesc, sortDesc, reverse, shuffle
 */
/**
 * Sort items
 */
export declare function sort<T>(items: readonly T[], comparator?: (a: T, b: T) => number): T[];
/**
 * Sort by key ascending
 */
export declare function sortBy<T>(items: readonly T[], key: keyof T): T[];
export declare function sortBy<T>(items: readonly T[], callback: (item: T) => unknown): T[];
/**
 * Sort by key descending
 */
export declare function sortByDesc<T>(items: readonly T[], key: keyof T): T[];
export declare function sortByDesc<T>(items: readonly T[], callback: (item: T) => unknown): T[];
/**
 * Sort descending
 */
export declare function sortDesc<T>(items: readonly T[]): T[];
/**
 * Reverse the order
 */
export declare function reverse<T>(items: readonly T[]): T[];
/**
 * Shuffle the items randomly
 */
export declare function shuffle<T>(items: readonly T[]): T[];
