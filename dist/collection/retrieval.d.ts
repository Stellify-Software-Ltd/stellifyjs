/**
 * Retrieval atomics - get, first, firstWhere, last, before, after, random, pluck, only, except
 */
import type { Predicate, Operator } from './types';
/**
 * Get item at index
 */
export declare function get<T>(items: readonly T[], index: number, defaultValue?: T): T | undefined;
/**
 * Get the first item, optionally matching a predicate
 */
export declare function first<T>(items: readonly T[], predicate?: Predicate<T>): T | undefined;
/**
 * Get the first item matching key/value, with optional operator
 */
export declare function firstWhere<T>(items: readonly T[], key: keyof T, operatorOrValue?: Operator | unknown, value?: unknown): T | undefined;
/**
 * Get the last item, optionally matching a predicate
 */
export declare function last<T>(items: readonly T[], predicate?: Predicate<T>): T | undefined;
/**
 * Get the item before a given item
 */
export declare function before<T>(items: readonly T[], item: T): T | undefined;
/**
 * Get the item after a given item
 */
export declare function after<T>(items: readonly T[], item: T): T | undefined;
/**
 * Get a random item
 */
export declare function random<T>(items: readonly T[]): T | undefined;
export declare function random<T>(items: readonly T[], count: number): T[];
/**
 * Extract values for a given key
 */
export declare function pluck<T, K extends keyof T>(items: readonly T[], key: K): T[K][];
export declare function pluck<T, K extends keyof T, V extends keyof T>(items: readonly T[], value: K, keyBy: V): Map<T[V], T[K]>;
/**
 * Get only specified keys from each item
 */
export declare function only<T, K extends keyof T>(items: readonly T[], keys: K[]): Pick<T, K>[];
/**
 * Get all keys except specified ones from each item
 */
export declare function except<T, K extends keyof T>(items: readonly T[], keys: K[]): Omit<T, K>[];
