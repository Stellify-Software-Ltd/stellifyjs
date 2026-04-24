/**
 * Aggregate atomics - reduce, sum, avg, min, max, median, mode
 */
import type { Reducer } from './types';
/**
 * Reduce to a single value
 */
export declare function reduce<T, U>(items: readonly T[], reducer: Reducer<T, U>, initial: U): U;
/**
 * Get sum of items or key values
 */
export declare function sum<T>(items: readonly T[], key?: keyof T): number;
/**
 * Get average of items or key values
 */
export declare function avg<T>(items: readonly T[], key?: keyof T): number;
/**
 * Get minimum value
 */
export declare function min<T>(items: readonly T[], key?: keyof T): T | T[keyof T] | undefined;
/**
 * Get maximum value
 */
export declare function max<T>(items: readonly T[], key?: keyof T): T | T[keyof T] | undefined;
/**
 * Get median value
 */
export declare function median<T>(items: readonly T[], key?: keyof T): number | undefined;
/**
 * Get mode value(s)
 */
export declare function mode<T>(items: readonly T[], key?: keyof T): T[] | T[keyof T][] | undefined;
