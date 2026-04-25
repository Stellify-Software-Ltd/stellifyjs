import { ref, computed, type Ref } from 'vue'
import { Http } from '../../utilities/http'
import { deepClone, deepEqual } from './paths'
import { runValidation } from './validate'
import type { FormOptions, FormReturn, SubmitResult, Rule } from './types'

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
export function useForm<T extends object, R = unknown>(
  options: FormOptions<T>
): FormReturn<T, R> {
  const {
    data: initialData,
    rules: validationRules = {},
    endpoint,
    method = 'POST',
    transform,
  } = options

  // Deep clone initial data for snapshot
  const initialSnapshot = deepClone(initialData)

  // Reactive state - use explicit Ref<T> typing to avoid T | undefined issue
  const data = ref<T>(deepClone(initialData)) as Ref<T>
  const errors = ref<Record<string, string[]>>({})
  const isSubmitting = ref(false)

  // Computed state
  const isDirty = computed(() => !deepEqual(data.value, initialSnapshot))
  const hasErrors = computed(() => Object.keys(errors.value).length > 0)
  const isValid = computed(() => {
    if (hasErrors.value) return false
    // Run validation to check if all rules pass
    const validationErrors = runValidation(data.value as T, validationRules as Record<string, Rule<T>[]>)
    return Object.keys(validationErrors).length === 0
  })

  /**
   * Run client-side validation
   */
  function validate(): boolean {
    const validationErrors = runValidation(data.value as T, validationRules as Record<string, Rule<T>[]>)
    errors.value = validationErrors
    return Object.keys(validationErrors).length === 0
  }

  /**
   * Reset form to initial state
   */
  function reset(): void {
    data.value = deepClone(initialSnapshot) as T
    errors.value = {}
    isSubmitting.value = false
  }

  /**
   * Set an error for a specific path
   */
  function setError(path: string, message: string): void {
    if (!errors.value[path]) {
      errors.value[path] = []
    }
    errors.value[path].push(message)
    // Trigger reactivity
    errors.value = { ...errors.value }
  }

  /**
   * Clear errors (all or for a specific path)
   */
  function clearErrors(path?: string): void {
    if (path) {
      const newErrors = { ...errors.value }
      delete newErrors[path]
      errors.value = newErrors
    } else {
      errors.value = {}
    }
  }

  /**
   * Submit the form
   */
  async function submit(): Promise<SubmitResult<R>> {
    // 1. Clear errors
    errors.value = {}

    // 2. Run client-side validation
    if (!validate()) {
      return { ok: false, validationFailed: true }
    }

    // Check endpoint is configured
    if (!endpoint) {
      throw new Error('useForm: submit() called but no endpoint configured.')
    }

    // 3. Set isSubmitting
    isSubmitting.value = true

    try {
      // 4. Build payload
      const payload = transform ? transform(data.value as T) : data.value

      // 5. Make HTTP request
      const httpMethod = method.toLowerCase() as 'post' | 'put' | 'patch' | 'delete'
      const response = await Http[httpMethod]<R>(endpoint, payload as Record<string, unknown>)

      // 6. Success
      isSubmitting.value = false
      return { ok: true, data: response }
    } catch (err: unknown) {
      isSubmitting.value = false

      // Check for 422 validation error from Laravel
      if (err && typeof err === 'object' && 'status' in err) {
        const httpErr = err as { status: number; body?: { errors?: Record<string, string[]> } }
        if (httpErr.status === 422 && httpErr.body?.errors) {
          // 7. Populate errors from server
          errors.value = httpErr.body.errors
          return { ok: false, validationFailed: true }
        }
      }

      // 8. Other errors
      const error = err instanceof Error ? err : new Error(String(err))
      return { ok: false, error }
    }
  }

  return {
    data,
    errors,
    isDirty,
    isValid,
    isSubmitting,
    hasErrors,
    submit,
    reset,
    validate,
    setError,
    clearErrors,
  }
}
