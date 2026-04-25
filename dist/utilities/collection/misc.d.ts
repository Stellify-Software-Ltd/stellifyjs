/**
 * Misc atomics - search, join, implode, count, keys, values, toJson
 */
import type { Predicate } from './types';
/**
 * Search for an item and return its index
 */
export declare function search<T>(items: readonly T[], item: T): number;
export declare function search<T>(items: readonly T[], predicate: Predicate<T>): number;
/**
 * Join items with a separator
 */
export declare function join<T>(items: readonly T[], glue?: string, finalGlue?: string): string;
/**
 * Join items by key with a separator
 */
export declare function implode<T>(items: readonly T[], key: keyof T, glue?: string): string;
/**
 * Get item count
 */
export declare function count<T>(items: readonly T[]): number;
/**
 * Get all keys (indices)
 */
export declare function keys<T>(items: readonly T[]): number[];
/**
 * Get all values (copy)
 */
export declare function values<T>(items: readonly T[]): T[];
/**
 * Convert to JSON string
 */
export declare function toJson<T>(items: readonly T[]): string;
