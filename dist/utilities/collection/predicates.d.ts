/**
 * Predicate atomics - contains, doesntContain, has, isEmpty, isNotEmpty, every, some
 */
import type { Predicate } from './types';
/**
 * Check if array contains an item or matches predicate
 */
export declare function contains<T>(items: readonly T[], keyOrValue: keyof T | T | Predicate<T>, value?: unknown): boolean;
/**
 * Inverse of contains
 */
export declare function doesntContain<T>(items: readonly T[], keyOrValue: keyof T | T | Predicate<T>, value?: unknown): boolean;
/**
 * Check if index exists
 */
export declare function has<T>(items: readonly T[], index: number): boolean;
/**
 * Check if array is empty
 */
export declare function isEmpty<T>(items: readonly T[]): boolean;
/**
 * Check if array is not empty
 */
export declare function isNotEmpty<T>(items: readonly T[]): boolean;
/**
 * Check if all items pass predicate
 */
export declare function every<T>(items: readonly T[], predicate: Predicate<T>): boolean;
/**
 * Check if any item passes predicate
 */
export declare function some<T>(items: readonly T[], predicate: Predicate<T>): boolean;
