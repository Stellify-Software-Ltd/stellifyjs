/**
 * Operator parsing and comparison helpers
 */
import type { Operator } from './types';
/**
 * Parse operator and value from flexible arguments
 */
export declare function parseOperator(operatorOrValue?: Operator | unknown, value?: unknown): {
    operator: Operator;
    compareValue: unknown;
};
/**
 * Compare two values using an operator
 */
export declare function compareValues(itemValue: unknown, operator: Operator, compareValue: unknown): boolean;
