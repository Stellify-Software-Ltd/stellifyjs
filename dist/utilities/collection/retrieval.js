/**
 * Retrieval atomics - get, first, firstWhere, last, before, after, random, pluck, only, except
 */
import { parseOperator, compareValues } from './operators';
import { search } from './misc';
/**
 * Get item at index
 */
export function get(items, index, defaultValue) {
    return items[index] ?? defaultValue;
}
/**
 * Get the first item, optionally matching a predicate
 */
export function first(items, predicate) {
    if (!predicate) {
        return items[0];
    }
    for (let i = 0; i < items.length; i++) {
        if (predicate(items[i], i)) {
            return items[i];
        }
    }
    return undefined;
}
/**
 * Get the first item matching key/value, with optional operator
 */
export function firstWhere(items, key, operatorOrValue, value) {
    const { operator, compareValue } = parseOperator(operatorOrValue, value);
    return first(items, (item) => compareValues(item[key], operator, compareValue));
}
/**
 * Get the last item, optionally matching a predicate
 */
export function last(items, predicate) {
    if (!predicate) {
        return items[items.length - 1];
    }
    for (let i = items.length - 1; i >= 0; i--) {
        if (predicate(items[i], i)) {
            return items[i];
        }
    }
    return undefined;
}
/**
 * Get the item before a given item
 */
export function before(items, item) {
    const index = search(items, item);
    if (index <= 0)
        return undefined;
    return items[index - 1];
}
/**
 * Get the item after a given item
 */
export function after(items, item) {
    const index = search(items, item);
    if (index === -1 || index >= items.length - 1)
        return undefined;
    return items[index + 1];
}
export function random(items, count) {
    if (items.length === 0)
        return count === undefined ? undefined : [];
    if (count === undefined) {
        return items[Math.floor(Math.random() * items.length)];
    }
    const shuffled = [...items].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
}
export function pluck(items, key, keyBy) {
    if (keyBy !== undefined) {
        const map = new Map();
        for (const item of items) {
            map.set(item[keyBy], item[key]);
        }
        return map;
    }
    return items.map(item => item[key]);
}
/**
 * Get only specified keys from each item
 */
export function only(items, keys) {
    return items.map(item => {
        const result = {};
        for (const key of keys) {
            if (key in item) {
                result[key] = item[key];
            }
        }
        return result;
    });
}
/**
 * Get all keys except specified ones from each item
 */
export function except(items, keys) {
    const keySet = new Set(keys);
    return items.map(item => {
        const result = {};
        for (const key in item) {
            if (!keySet.has(key)) {
                result[key] = item[key];
            }
        }
        return result;
    });
}
