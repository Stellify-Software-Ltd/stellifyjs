/**
 * Filter atomics - filter, reject, unique, duplicates
 */
import type { Predicate } from './types';
/**
 * Filter items using a callback
 */
export declare function filter<T>(items: readonly T[], predicate: Predicate<T>): T[];
/**
 * Reject items matching predicate (inverse of filter)
 */
export declare function reject<T>(items: readonly T[], predicate: Predicate<T>): T[];
/**
 * Get unique items, optionally by key
 */
export declare function unique<T>(items: readonly T[], key?: keyof T): T[];
/**
 * Get duplicate items, optionally by key
 */
export declare function duplicates<T>(items: readonly T[], key?: keyof T): T[];
