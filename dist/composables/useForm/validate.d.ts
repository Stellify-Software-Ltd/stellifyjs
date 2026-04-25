import type { Rule } from './types';
/**
 * Run validation rules against data
 * Returns empty object if all pass, otherwise returns errors by path
 */
export declare function runValidation<T>(data: T, rules: Record<string, Rule<T>[]>): Record<string, string[]>;
