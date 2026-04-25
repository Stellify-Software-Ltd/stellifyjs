/**
 * Aggregate atomics - reduce, sum, avg, min, max, median, mode
 */
/**
 * Reduce to a single value
 */
export function reduce(items, reducer, initial) {
    return items.reduce((acc, item, i) => reducer(acc, item, i), initial);
}
/**
 * Get sum of items or key values
 */
export function sum(items, key) {
    if (key === undefined) {
        return items.reduce((a, b) => a + b, 0);
    }
    return items.reduce((s, item) => s + item[key], 0);
}
/**
 * Get average of items or key values
 */
export function avg(items, key) {
    if (items.length === 0)
        return 0;
    return sum(items, key) / items.length;
}
/**
 * Get minimum value
 */
export function min(items, key) {
    if (items.length === 0)
        return undefined;
    if (key === undefined) {
        return items.reduce((minVal, item) => item < minVal ? item : minVal);
    }
    let minItem = items[0];
    for (const item of items) {
        if (item[key] < minItem[key]) {
            minItem = item;
        }
    }
    return minItem[key];
}
/**
 * Get maximum value
 */
export function max(items, key) {
    if (items.length === 0)
        return undefined;
    if (key === undefined) {
        return items.reduce((maxVal, item) => item > maxVal ? item : maxVal);
    }
    let maxItem = items[0];
    for (const item of items) {
        if (item[key] > maxItem[key]) {
            maxItem = item;
        }
    }
    return maxItem[key];
}
/**
 * Get median value
 */
export function median(items, key) {
    if (items.length === 0)
        return undefined;
    const values = key !== undefined
        ? items.map(item => item[key])
        : items;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 0) {
        return (sorted[mid - 1] + sorted[mid]) / 2;
    }
    return sorted[mid];
}
/**
 * Get mode value(s)
 */
export function mode(items, key) {
    if (items.length === 0)
        return undefined;
    const values = key !== undefined
        ? items.map(item => item[key])
        : items;
    const counts = new Map();
    let maxCount = 0;
    for (const val of values) {
        const count = (counts.get(val) || 0) + 1;
        counts.set(val, count);
        if (count > maxCount)
            maxCount = count;
    }
    const result = [];
    for (const [val, count] of counts) {
        if (count === maxCount) {
            result.push(val);
        }
    }
    return result;
}
