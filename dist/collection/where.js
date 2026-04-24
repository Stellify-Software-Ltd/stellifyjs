/**
 * Where atomics - where, whereIn, whereNotIn, whereBetween, whereNotBetween, whereNull, whereNotNull
 */
import { parseOperator, compareValues } from './operators';
/**
 * Filter items where key matches value, with optional operator
 */
export function where(items, key, operatorOrValue, value) {
    const { operator, compareValue } = parseOperator(operatorOrValue, value);
    return items.filter((item) => compareValues(item[key], operator, compareValue));
}
/**
 * Filter items where key is in array of values
 */
export function whereIn(items, key, values) {
    const valueSet = new Set(values);
    return items.filter((item) => valueSet.has(item[key]));
}
/**
 * Filter items where key is not in array of values
 */
export function whereNotIn(items, key, values) {
    const valueSet = new Set(values);
    return items.filter((item) => !valueSet.has(item[key]));
}
/**
 * Filter items where key is between two values
 */
export function whereBetween(items, key, range) {
    const [min, max] = range;
    return items.filter((item) => {
        const val = item[key];
        return val >= min && val <= max;
    });
}
/**
 * Filter items where key is not between two values
 */
export function whereNotBetween(items, key, range) {
    const [min, max] = range;
    return items.filter((item) => {
        const val = item[key];
        return val < min || val > max;
    });
}
/**
 * Filter items where key is null or undefined
 */
export function whereNull(items, key) {
    return items.filter((item) => item[key] == null);
}
/**
 * Filter items where key is not null or undefined
 */
export function whereNotNull(items, key) {
    return items.filter((item) => item[key] != null);
}
