/**
 * Combining atomics - concat, merge, diff, intersect, combine, zip, pad
 */
/**
 * Concatenate with other arrays
 */
export declare function concat<T>(items: readonly T[], ...others: (readonly T[])[]): T[];
/**
 * Merge with another array (overwrites by index)
 */
export declare function merge<T>(items: readonly T[], other: readonly T[]): T[];
/**
 * Get items not present in given array
 */
export declare function diff<T>(items: readonly T[], other: readonly T[]): T[];
/**
 * Get items present in both arrays
 */
export declare function intersect<T>(items: readonly T[], other: readonly T[]): T[];
/**
 * Combine keys with values
 */
export declare function combine<T extends string | number, U>(keys: readonly T[], values: readonly U[]): Map<T, U>;
/**
 * Zip with another array
 */
export declare function zip<T, U>(items: readonly T[], other: readonly U[]): [T, U][];
/**
 * Pad array to specified size
 */
export declare function pad<T>(items: readonly T[], size: number, value: T): T[];
