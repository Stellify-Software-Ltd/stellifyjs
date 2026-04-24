/**
 * Where atomics - where, whereIn, whereNotIn, whereBetween, whereNotBetween, whereNull, whereNotNull
 */
import type { Operator } from './types';
/**
 * Filter items where key matches value, with optional operator
 */
export declare function where<T>(items: readonly T[], key: keyof T, operatorOrValue?: Operator | unknown, value?: unknown): T[];
/**
 * Filter items where key is in array of values
 */
export declare function whereIn<T>(items: readonly T[], key: keyof T, values: unknown[]): T[];
/**
 * Filter items where key is not in array of values
 */
export declare function whereNotIn<T>(items: readonly T[], key: keyof T, values: unknown[]): T[];
/**
 * Filter items where key is between two values
 */
export declare function whereBetween<T>(items: readonly T[], key: keyof T, range: [number, number]): T[];
/**
 * Filter items where key is not between two values
 */
export declare function whereNotBetween<T>(items: readonly T[], key: keyof T, range: [number, number]): T[];
/**
 * Filter items where key is null or undefined
 */
export declare function whereNull<T>(items: readonly T[], key: keyof T): T[];
/**
 * Filter items where key is not null or undefined
 */
export declare function whereNotNull<T>(items: readonly T[], key: keyof T): T[];
