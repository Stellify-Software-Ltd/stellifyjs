/**
 * Slicing atomics - take, takeWhile, takeUntil, skip, skipWhile, skipUntil, slice, forPage, split, chunk, sliding, nth
 */
import type { Predicate } from './types';
/**
 * Take the first n items
 */
export declare function take<T>(items: readonly T[], count: number): T[];
/**
 * Take items while predicate is true
 */
export declare function takeWhile<T>(items: readonly T[], predicate: Predicate<T>): T[];
/**
 * Take items until predicate is true
 */
export declare function takeUntil<T>(items: readonly T[], predicate: Predicate<T>): T[];
/**
 * Skip the first n items
 */
export declare function skip<T>(items: readonly T[], count: number): T[];
/**
 * Skip items while predicate is true
 */
export declare function skipWhile<T>(items: readonly T[], predicate: Predicate<T>): T[];
/**
 * Skip items until predicate is true
 */
export declare function skipUntil<T>(items: readonly T[], predicate: Predicate<T>): T[];
/**
 * Get a slice of the collection
 */
export declare function slice<T>(items: readonly T[], start?: number, end?: number): T[];
/**
 * Get items for a specific page
 */
export declare function forPage<T>(items: readonly T[], page: number, perPage: number): T[];
/**
 * Split into n groups
 */
export declare function split<T>(items: readonly T[], count: number): T[][];
/**
 * Break into chunks of given size
 */
export declare function chunk<T>(items: readonly T[], size: number): T[][];
/**
 * Get sliding windows of items
 */
export declare function sliding<T>(items: readonly T[], size: number, step?: number): T[][];
/**
 * Get every nth item
 */
export declare function nth<T>(items: readonly T[], step: number, offset?: number): T[];
