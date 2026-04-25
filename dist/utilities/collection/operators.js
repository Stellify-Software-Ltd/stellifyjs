/**
 * Operator parsing and comparison helpers
 */
/**
 * Parse operator and value from flexible arguments
 */
export function parseOperator(operatorOrValue, value) {
    if (value !== undefined) {
        return { operator: operatorOrValue, compareValue: value };
    }
    return { operator: '===', compareValue: operatorOrValue };
}
/**
 * Compare two values using an operator
 */
export function compareValues(itemValue, operator, compareValue) {
    switch (operator) {
        case '=':
        case '==':
            return itemValue == compareValue;
        case '===':
            return itemValue === compareValue;
        case '!=':
        case '<>':
            return itemValue != compareValue;
        case '!==':
            return itemValue !== compareValue;
        case '<':
            return itemValue < compareValue;
        case '<=':
            return itemValue <= compareValue;
        case '>':
            return itemValue > compareValue;
        case '>=':
            return itemValue >= compareValue;
        default:
            return itemValue === compareValue;
    }
}
