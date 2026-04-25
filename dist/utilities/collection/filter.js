/**
 * Filter atomics - filter, reject, unique, duplicates
 */
/**
 * Filter items using a callback
 */
export function filter(items, predicate) {
    return items.filter((item, i) => predicate(item, i));
}
/**
 * Reject items matching predicate (inverse of filter)
 */
export function reject(items, predicate) {
    return items.filter((item, i) => !predicate(item, i));
}
/**
 * Get unique items, optionally by key
 */
export function unique(items, key) {
    if (key === undefined) {
        return [...new Set(items)];
    }
    const seen = new Set();
    const result = [];
    for (const item of items) {
        const val = item[key];
        if (!seen.has(val)) {
            seen.add(val);
            result.push(item);
        }
    }
    return result;
}
/**
 * Get duplicate items, optionally by key
 */
export function duplicates(items, key) {
    const seen = new Map();
    const result = [];
    for (const item of items) {
        const val = key ? item[key] : item;
        const count = seen.get(val) || 0;
        seen.set(val, count + 1);
        if (count === 1) {
            result.push(item);
        }
    }
    return result;
}
