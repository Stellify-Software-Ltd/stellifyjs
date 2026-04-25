/**
 * Control flow atomics - each, tap, pipe, when, unless, whenEmpty, whenNotEmpty
 */
/**
 * Iterate over each item
 */
export function each(items, callback) {
    for (let i = 0; i < items.length; i++) {
        if (callback(items[i], i) === false)
            break;
    }
}
/**
 * Pass items to callback for side effects, return items unchanged
 */
export function tap(items, callback) {
    callback(items);
    return [...items];
}
/**
 * Pass items to callback, return result
 */
export function pipe(items, callback) {
    return callback(items);
}
/**
 * Conditionally apply transformation
 */
export function when(items, condition, callback, fallback) {
    const shouldRun = typeof condition === 'function' ? condition() : condition;
    if (shouldRun) {
        return callback(items);
    }
    if (fallback) {
        return fallback(items);
    }
    return [...items];
}
/**
 * Inverse of when
 */
export function unless(items, condition, callback, fallback) {
    const shouldSkip = typeof condition === 'function' ? condition() : condition;
    return when(items, !shouldSkip, callback, fallback);
}
/**
 * Apply callback if array is empty
 */
export function whenEmpty(items, callback) {
    return when(items, items.length === 0, callback);
}
/**
 * Apply callback if array is not empty
 */
export function whenNotEmpty(items, callback) {
    return when(items, items.length > 0, callback);
}
