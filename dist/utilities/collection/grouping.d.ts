/**
 * Grouping atomics - keyBy, groupBy, countBy, partition
 */
import type { Predicate } from './types';
/**
 * Key the collection by a field
 */
export declare function keyBy<T>(items: readonly T[], key: keyof T): Map<unknown, T>;
export declare function keyBy<T>(items: readonly T[], callback: (item: T) => string | number): Map<string | number, T>;
/**
 * Group items by key or callback
 */
export declare function groupBy<T>(items: readonly T[], key: keyof T): Map<unknown, T[]>;
export declare function groupBy<T>(items: readonly T[], callback: (item: T) => string | number): Map<string | number, T[]>;
/**
 * Count occurrences by key or callback
 */
export declare function countBy<T>(items: readonly T[], key?: keyof T): Map<unknown, number>;
export declare function countBy<T>(items: readonly T[], callback: (item: T) => string | number): Map<string | number, number>;
/**
 * Partition items into two arrays based on predicate
 */
export declare function partition<T>(items: readonly T[], predicate: Predicate<T>): [T[], T[]];
