/**
 * Transform atomics - map, flatMap, mapWithKeys, flatten, collapse, flip
 */
/**
 * Map each item through a callback
 */
export function map(items, mapper) {
    return items.map((item, i) => mapper(item, i));
}
/**
 * Map and flatten by one level
 */
export function flatMap(items, mapper) {
    return items.flatMap((item, i) => mapper(item, i));
}
/**
 * Map to key/value pairs
 */
export function mapWithKeys(items, mapper) {
    const result = new Map();
    for (let i = 0; i < items.length; i++) {
        const { key, value } = mapper(items[i], i);
        result.set(key, value);
    }
    return result;
}
/**
 * Flatten nested arrays
 */
export function flatten(items, depth = 1) {
    return items.flat(depth);
}
/**
 * Collapse an array of arrays into a single flat array
 */
export function collapse(items) {
    return items.flat(1);
}
/**
 * Flip keys and values (for simple arrays)
 */
export function flip(items) {
    const result = new Map();
    for (let i = 0; i < items.length; i++) {
        result.set(items[i], i);
    }
    return result;
}
