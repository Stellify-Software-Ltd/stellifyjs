import type { Ref, ComputedRef } from 'vue';
/**
 * A validation rule function.
 * Returns `true` if valid, or an error message string if invalid.
 */
export type Rule<T = unknown> = (value: unknown, data: T, path: string) => string | true;
/**
 * Options for useForm
 */
export interface FormOptions<T> {
    /**
     * Initial form data (required)
     */
    data: T;
    /**
     * Validation rules by dot-path
     * Supports wildcards for arrays: 'items.*.name'
     */
    rules?: Record<string, Rule<T>[]>;
    /**
     * Submission endpoint URL
     */
    endpoint?: string;
    /**
     * HTTP method for submission (default: POST)
     */
    method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    /**
     * Transform data before submission
     */
    transform?: (data: T) => unknown;
}
/**
 * Result of form submission
 */
export type SubmitResult<R = unknown> = {
    ok: true;
    data: R;
} | {
    ok: false;
    validationFailed: true;
    error?: never;
} | {
    ok: false;
    validationFailed?: false;
    error: Error;
};
/**
 * Return type for useForm
 */
export interface FormReturn<T, R = unknown> {
    /**
     * Reactive form data
     */
    data: Ref<T>;
    /**
     * Per-path error arrays (dot-notation keys)
     */
    errors: Ref<Record<string, string[]>>;
    /**
     * True if data differs from initial snapshot
     */
    isDirty: ComputedRef<boolean>;
    /**
     * True if no errors and all rules pass
     */
    isValid: ComputedRef<boolean>;
    /**
     * True while submission is in progress
     */
    isSubmitting: Ref<boolean>;
    /**
     * True if any errors exist
     */
    hasErrors: ComputedRef<boolean>;
    /**
     * Submit the form
     */
    submit: () => Promise<SubmitResult<R>>;
    /**
     * Reset form to initial state
     */
    reset: () => void;
    /**
     * Run client-side validation
     */
    validate: () => boolean;
    /**
     * Set an error for a path
     */
    setError: (path: string, message: string) => void;
    /**
     * Clear errors (all or for a specific path)
     */
    clearErrors: (path?: string) => void;
}
