/**
 * Slicing atomics - take, takeWhile, takeUntil, skip, skipWhile, skipUntil, slice, forPage, split, chunk, sliding, nth
 */
/**
 * Take the first n items
 */
export function take(items, count) {
    if (count < 0) {
        return items.slice(count);
    }
    return items.slice(0, count);
}
/**
 * Take items while predicate is true
 */
export function takeWhile(items, predicate) {
    const result = [];
    for (let i = 0; i < items.length; i++) {
        if (!predicate(items[i], i))
            break;
        result.push(items[i]);
    }
    return result;
}
/**
 * Take items until predicate is true
 */
export function takeUntil(items, predicate) {
    const result = [];
    for (let i = 0; i < items.length; i++) {
        if (predicate(items[i], i))
            break;
        result.push(items[i]);
    }
    return result;
}
/**
 * Skip the first n items
 */
export function skip(items, count) {
    return items.slice(count);
}
/**
 * Skip items while predicate is true
 */
export function skipWhile(items, predicate) {
    let index = 0;
    for (let i = 0; i < items.length; i++) {
        if (!predicate(items[i], i))
            break;
        index = i + 1;
    }
    return items.slice(index);
}
/**
 * Skip items until predicate is true
 */
export function skipUntil(items, predicate) {
    let index = 0;
    for (let i = 0; i < items.length; i++) {
        if (predicate(items[i], i))
            break;
        index = i + 1;
    }
    return items.slice(index);
}
/**
 * Get a slice of the collection
 */
export function slice(items, start, end) {
    return items.slice(start, end);
}
/**
 * Get items for a specific page
 */
export function forPage(items, page, perPage) {
    const start = (page - 1) * perPage;
    return items.slice(start, start + perPage);
}
/**
 * Split into n groups
 */
export function split(items, count) {
    if (count <= 0)
        return [];
    const size = Math.ceil(items.length / count);
    const result = [];
    for (let i = 0; i < items.length; i += size) {
        result.push(items.slice(i, i + size));
    }
    return result;
}
/**
 * Break into chunks of given size
 */
export function chunk(items, size) {
    const chunks = [];
    for (let i = 0; i < items.length; i += size) {
        chunks.push(items.slice(i, i + size));
    }
    return chunks;
}
/**
 * Get sliding windows of items
 */
export function sliding(items, size, step = 1) {
    const result = [];
    for (let i = 0; i <= items.length - size; i += step) {
        result.push(items.slice(i, i + size));
    }
    return result;
}
/**
 * Get every nth item
 */
export function nth(items, step, offset = 0) {
    const result = [];
    for (let i = offset; i < items.length; i += step) {
        result.push(items[i]);
    }
    return result;
}
