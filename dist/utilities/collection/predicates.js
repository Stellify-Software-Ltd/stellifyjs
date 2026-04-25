/**
 * Predicate atomics - contains, doesntContain, has, isEmpty, isNotEmpty, every, some
 */
/**
 * Check if array contains an item or matches predicate
 */
export function contains(items, keyOrValue, value) {
    // Predicate function
    if (typeof keyOrValue === 'function') {
        return items.some((item, i) => keyOrValue(item, i));
    }
    // Key/value pair
    if (value !== undefined) {
        return items.some(item => item[keyOrValue] === value);
    }
    // Direct value check
    return items.includes(keyOrValue);
}
/**
 * Inverse of contains
 */
export function doesntContain(items, keyOrValue, value) {
    return !contains(items, keyOrValue, value);
}
/**
 * Check if index exists
 */
export function has(items, index) {
    return index >= 0 && index < items.length;
}
/**
 * Check if array is empty
 */
export function isEmpty(items) {
    return items.length === 0;
}
/**
 * Check if array is not empty
 */
export function isNotEmpty(items) {
    return items.length > 0;
}
/**
 * Check if all items pass predicate
 */
export function every(items, predicate) {
    return items.every((item, i) => predicate(item, i));
}
/**
 * Check if any item passes predicate
 */
export function some(items, predicate) {
    return items.some((item, i) => predicate(item, i));
}
