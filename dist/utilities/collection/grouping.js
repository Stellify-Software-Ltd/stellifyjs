/**
 * Grouping atomics - keyBy, groupBy, countBy, partition
 */
export function keyBy(items, keyOrCallback) {
    const result = new Map();
    for (const item of items) {
        const k = typeof keyOrCallback === 'function'
            ? keyOrCallback(item)
            : item[keyOrCallback];
        result.set(k, item);
    }
    return result;
}
export function groupBy(items, keyOrCallback) {
    const groups = new Map();
    for (const item of items) {
        const k = typeof keyOrCallback === 'function'
            ? keyOrCallback(item)
            : item[keyOrCallback];
        if (!groups.has(k)) {
            groups.set(k, []);
        }
        groups.get(k).push(item);
    }
    return groups;
}
export function countBy(items, keyOrCallback) {
    const counts = new Map();
    for (const item of items) {
        const k = keyOrCallback === undefined
            ? item
            : typeof keyOrCallback === 'function'
                ? keyOrCallback(item)
                : item[keyOrCallback];
        counts.set(k, (counts.get(k) || 0) + 1);
    }
    return counts;
}
/**
 * Partition items into two arrays based on predicate
 */
export function partition(items, predicate) {
    const pass = [];
    const fail = [];
    for (let i = 0; i < items.length; i++) {
        if (predicate(items[i], i)) {
            pass.push(items[i]);
        }
        else {
            fail.push(items[i]);
        }
    }
    return [pass, fail];
}
