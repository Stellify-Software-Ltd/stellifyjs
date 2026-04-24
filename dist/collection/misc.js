/**
 * Misc atomics - search, join, implode, count, keys, values, toJson
 */
export function search(items, itemOrPredicate) {
    if (typeof itemOrPredicate === 'function') {
        return items.findIndex((item, i) => itemOrPredicate(item, i));
    }
    return items.indexOf(itemOrPredicate);
}
/**
 * Join items with a separator
 */
export function join(items, glue = ', ', finalGlue) {
    if (items.length === 0)
        return '';
    if (items.length === 1)
        return String(items[0]);
    if (finalGlue !== undefined) {
        const allButLast = items.slice(0, -1);
        return allButLast.join(glue) + finalGlue + items[items.length - 1];
    }
    return items.join(glue);
}
/**
 * Join items by key with a separator
 */
export function implode(items, key, glue = ', ') {
    return items.map(item => item[key]).join(glue);
}
/**
 * Get item count
 */
export function count(items) {
    return items.length;
}
/**
 * Get all keys (indices)
 */
export function keys(items) {
    return Array.from({ length: items.length }, (_, i) => i);
}
/**
 * Get all values (copy)
 */
export function values(items) {
    return [...items];
}
/**
 * Convert to JSON string
 */
export function toJson(items) {
    return JSON.stringify(items);
}
