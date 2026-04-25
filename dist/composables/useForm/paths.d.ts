/**
 * Get a value from an object by dot-path
 */
export declare function get(obj: unknown, path: string): unknown;
/**
 * Set a value in an object by dot-path, creating intermediates as needed
 */
export declare function set(obj: unknown, path: string, value: unknown): void;
/**
 * Expand wildcard paths against actual data
 * 'items.*.name' with items=[{}, {}, {}] returns ['items.0.name', 'items.1.name', 'items.2.name']
 */
export declare function expandWildcards(obj: unknown, pattern: string): string[];
/**
 * Deep clone an object (handles primitives, arrays, plain objects, dates)
 */
export declare function deepClone<T>(obj: T): T;
/**
 * Deep equality check
 */
export declare function deepEqual(a: unknown, b: unknown): boolean;
