/**
 * Transform atomics - map, flatMap, mapWithKeys, flatten, collapse, flip
 */
import type { Mapper, KeyMapper } from './types';
/**
 * Map each item through a callback
 */
export declare function map<T, U>(items: readonly T[], mapper: Mapper<T, U>): U[];
/**
 * Map and flatten by one level
 */
export declare function flatMap<T, U>(items: readonly T[], mapper: Mapper<T, U[]>): U[];
/**
 * Map to key/value pairs
 */
export declare function mapWithKeys<T>(items: readonly T[], mapper: KeyMapper<T>): Map<string | number, unknown>;
/**
 * Flatten nested arrays
 */
export declare function flatten<T>(items: readonly T[], depth?: number): unknown[];
/**
 * Collapse an array of arrays into a single flat array
 */
export declare function collapse<T>(items: readonly T[]): unknown[];
/**
 * Flip keys and values (for simple arrays)
 */
export declare function flip<T>(items: readonly T[]): Map<unknown, number>;
