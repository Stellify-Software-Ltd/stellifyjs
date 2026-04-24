/**
 * Mutation atomics - push, prepend, pop, shift, forget, pull, put, toggle
 * Note: These return new arrays, not mutate in place (immutable)
 */
/**
 * Add items to the end
 */
export function push(items, ...newItems) {
    return [...items, ...newItems];
}
/**
 * Add an item to the beginning
 */
export function prepend(items, item) {
    return [item, ...items];
}
/**
 * Remove and return the last item
 */
export function pop(items) {
    if (items.length === 0) {
        return { item: undefined, items: [] };
    }
    return {
        item: items[items.length - 1],
        items: items.slice(0, -1)
    };
}
/**
 * Remove and return the first item
 */
export function shift(items) {
    if (items.length === 0) {
        return { item: undefined, items: [] };
    }
    return {
        item: items[0],
        items: items.slice(1)
    };
}
/**
 * Remove an item by index
 */
export function forget(items, index) {
    const result = [...items];
    result.splice(index, 1);
    return result;
}
/**
 * Remove and return an item by index
 */
export function pull(items, index) {
    const item = items[index];
    return { item, items: forget(items, index) };
}
/**
 * Set a value at index
 */
export function put(items, index, value) {
    const result = [...items];
    result[index] = value;
    return result;
}
/**
 * Toggle an item (add if missing, remove if present)
 */
export function toggle(items, item, key) {
    if (key !== undefined) {
        const index = items.findIndex(i => i[key] === item[key]);
        if (index >= 0) {
            return forget(items, index);
        }
        return push(items, item);
    }
    const index = items.indexOf(item);
    if (index >= 0) {
        return forget(items, index);
    }
    return push(items, item);
}
