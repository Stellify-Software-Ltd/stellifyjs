import type { Rule } from './types';
/**
 * Built-in validation rules.
 * Each factory returns a Rule function: (value, data, path) => string | true
 */
export declare const rules: {
    /**
     * Field must have a non-empty value
     */
    required<T = unknown>(message?: string): Rule<T>;
    /**
     * Field must be a valid email address
     */
    email<T = unknown>(message?: string): Rule<T>;
    /**
     * Field must be a valid URL
     */
    url<T = unknown>(message?: string): Rule<T>;
    /**
     * Minimum length (strings) or value (numbers)
     */
    min<T = unknown>(n: number, message?: string): Rule<T>;
    /**
     * Maximum length (strings) or value (numbers)
     */
    max<T = unknown>(n: number, message?: string): Rule<T>;
    /**
     * Value must be between min and max (inclusive)
     */
    between<T = unknown>(min: number, max: number, message?: string): Rule<T>;
    /**
     * Field must match regex pattern
     */
    pattern<T = unknown>(regex: RegExp, message?: string): Rule<T>;
    /**
     * Field must be one of the allowed values
     */
    in<T = unknown>(values: unknown[], message?: string): Rule<T>;
    /**
     * Field must not be one of the disallowed values
     */
    notIn<T = unknown>(values: unknown[], message?: string): Rule<T>;
    /**
     * Field must match another field's value
     */
    same<T = unknown>(otherPath: string, message?: string): Rule<T>;
    /**
     * Field must be different from another field's value
     */
    different<T = unknown>(otherPath: string, message?: string): Rule<T>;
    /**
     * Field must be an integer
     */
    integer<T = unknown>(message?: string): Rule<T>;
    /**
     * Field must be numeric
     */
    numeric<T = unknown>(message?: string): Rule<T>;
    /**
     * Field must be a boolean
     */
    boolean<T = unknown>(message?: string): Rule<T>;
    /**
     * Field must be a valid date
     */
    date<T = unknown>(message?: string): Rule<T>;
    /**
     * Custom validation function
     */
    custom<T = unknown>(fn: (value: unknown, data: T) => boolean, message?: string): Rule<T>;
};
