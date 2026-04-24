/**
 * Ordering atomics - sort, sortBy, sortByDesc, sortDesc, reverse, shuffle
 */
/**
 * Sort items
 */
export function sort(items, comparator) {
    const sorted = [...items];
    sorted.sort(comparator);
    return sorted;
}
export function sortBy(items, keyOrCallback) {
    const sorted = [...items];
    sorted.sort((a, b) => {
        const aVal = typeof keyOrCallback === 'function' ? keyOrCallback(a) : a[keyOrCallback];
        const bVal = typeof keyOrCallback === 'function' ? keyOrCallback(b) : b[keyOrCallback];
        if (aVal < bVal)
            return -1;
        if (aVal > bVal)
            return 1;
        return 0;
    });
    return sorted;
}
export function sortByDesc(items, keyOrCallback) {
    const sorted = [...items];
    sorted.sort((a, b) => {
        const aVal = typeof keyOrCallback === 'function' ? keyOrCallback(a) : a[keyOrCallback];
        const bVal = typeof keyOrCallback === 'function' ? keyOrCallback(b) : b[keyOrCallback];
        if (aVal < bVal)
            return 1;
        if (aVal > bVal)
            return -1;
        return 0;
    });
    return sorted;
}
/**
 * Sort descending
 */
export function sortDesc(items) {
    const sorted = [...items];
    sorted.sort((a, b) => {
        if (a < b)
            return 1;
        if (a > b)
            return -1;
        return 0;
    });
    return sorted;
}
/**
 * Reverse the order
 */
export function reverse(items) {
    return [...items].reverse();
}
/**
 * Shuffle the items randomly
 */
export function shuffle(items) {
    const shuffled = [...items];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}
