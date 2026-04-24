/**
 * Control flow atomics - each, tap, pipe, when, unless, whenEmpty, whenNotEmpty
 */
/**
 * Iterate over each item
 */
export declare function each<T>(items: readonly T[], callback: (item: T, index: number) => void | false): void;
/**
 * Pass items to callback for side effects, return items unchanged
 */
export declare function tap<T>(items: readonly T[], callback: (items: readonly T[]) => void): T[];
/**
 * Pass items to callback, return result
 */
export declare function pipe<T, U>(items: readonly T[], callback: (items: readonly T[]) => U): U;
/**
 * Conditionally apply transformation
 */
export declare function when<T, U>(items: readonly T[], condition: boolean | (() => boolean), callback: (items: readonly T[]) => U[], fallback?: (items: readonly T[]) => U[]): T[] | U[];
/**
 * Inverse of when
 */
export declare function unless<T, U>(items: readonly T[], condition: boolean | (() => boolean), callback: (items: readonly T[]) => U[], fallback?: (items: readonly T[]) => U[]): T[] | U[];
/**
 * Apply callback if array is empty
 */
export declare function whenEmpty<T, U>(items: readonly T[], callback: (items: readonly T[]) => U[]): T[] | U[];
/**
 * Apply callback if array is not empty
 */
export declare function whenNotEmpty<T, U>(items: readonly T[], callback: (items: readonly T[]) => U[]): T[] | U[];
