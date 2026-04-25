/**
 * Combining atomics - concat, merge, diff, intersect, combine, zip, pad
 */
/**
 * Concatenate with other arrays
 */
export function concat(items, ...others) {
    let result = [...items];
    for (const other of others) {
        result = result.concat([...other]);
    }
    return result;
}
/**
 * Merge with another array (overwrites by index)
 */
export function merge(items, other) {
    const result = [...items];
    for (let i = 0; i < other.length; i++) {
        result[i] = other[i];
    }
    return result;
}
/**
 * Get items not present in given array
 */
export function diff(items, other) {
    const otherSet = new Set(other);
    return items.filter(item => !otherSet.has(item));
}
/**
 * Get items present in both arrays
 */
export function intersect(items, other) {
    const otherSet = new Set(other);
    return items.filter(item => otherSet.has(item));
}
/**
 * Combine keys with values
 */
export function combine(keys, values) {
    const result = new Map();
    const len = Math.min(keys.length, values.length);
    for (let i = 0; i < len; i++) {
        result.set(keys[i], values[i]);
    }
    return result;
}
/**
 * Zip with another array
 */
export function zip(items, other) {
    const result = [];
    const len = Math.min(items.length, other.length);
    for (let i = 0; i < len; i++) {
        result.push([items[i], other[i]]);
    }
    return result;
}
/**
 * Pad array to specified size
 */
export function pad(items, size, value) {
    const absSize = Math.abs(size);
    if (items.length >= absSize) {
        return [...items];
    }
    const padding = Array(absSize - items.length).fill(value);
    if (size > 0) {
        return [...items, ...padding];
    }
    return [...padding, ...items];
}
