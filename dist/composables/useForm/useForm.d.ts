import type { FormOptions, FormReturn } from './types';
/**
 * Vue composable for complete form lifecycle.
 *
 * Handles data, validation, submission, errors, dirty tracking, and reset.
 * Automatically unwraps Laravel 422 responses into the errors ref.
 *
 * @example
 * ```ts
 * import { useForm, rules } from 'stellify-framework'
 *
 * const { data, errors, isSubmitting, isValid, submit } = useForm({
 *   data: { email: '', password: '' },
 *   endpoint: '/api/login',
 *   rules: {
 *     email: [rules.required(), rules.email()],
 *     password: [rules.required(), rules.min(8)],
 *   },
 * })
 * ```
 */
export declare function useForm<T extends object, R = unknown>(options: FormOptions<T>): FormReturn<T, R>;
