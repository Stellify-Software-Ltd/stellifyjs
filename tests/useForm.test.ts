import { describe, it, expect, vi, beforeEach } from 'vitest'
import { get, set, expandWildcards, deepClone, deepEqual } from '../src/composables/useForm/paths'
import { rules } from '../src/composables/useForm/rules'
import { runValidation } from '../src/composables/useForm/validate'
import { useForm } from '../src/composables/useForm/useForm'
import { Http } from '../src/utilities/http'

// Mock Vue's ref and computed for non-Vue test environment
vi.mock('vue', () => ({
  ref: <T>(value: T) => ({ value }),
  computed: <T>(fn: () => T) => ({ get value() { return fn() } }),
}))

// Mock Http for submission tests
vi.mock('../src/utilities/http', () => ({
  Http: {
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('Path helpers', () => {
  describe('get', () => {
    it('gets top-level values', () => {
      expect(get({ name: 'John' }, 'name')).toBe('John')
    })

    it('gets nested values', () => {
      const obj = { user: { profile: { name: 'John' } } }
      expect(get(obj, 'user.profile.name')).toBe('John')
    })

    it('gets array values by index', () => {
      const obj = { items: ['a', 'b', 'c'] }
      expect(get(obj, 'items.1')).toBe('b')
    })

    it('returns undefined for missing paths', () => {
      expect(get({ a: 1 }, 'b')).toBe(undefined)
      expect(get({ a: { b: 1 } }, 'a.c')).toBe(undefined)
    })

    it('handles null/undefined in path', () => {
      expect(get({ a: null }, 'a.b')).toBe(undefined)
      expect(get({ a: undefined }, 'a.b')).toBe(undefined)
    })
  })

  describe('set', () => {
    it('sets top-level values', () => {
      const obj: Record<string, unknown> = {}
      set(obj, 'name', 'John')
      expect(obj.name).toBe('John')
    })

    it('sets nested values, creating intermediates', () => {
      const obj: Record<string, unknown> = {}
      set(obj, 'user.profile.name', 'John')
      expect((obj.user as Record<string, unknown>).profile).toEqual({ name: 'John' })
    })

    it('creates arrays for numeric paths', () => {
      const obj: Record<string, unknown> = {}
      set(obj, 'items.0', 'first')
      expect(Array.isArray(obj.items)).toBe(true)
      expect((obj.items as string[])[0]).toBe('first')
    })
  })

  describe('expandWildcards', () => {
    it('returns path as-is without wildcards', () => {
      expect(expandWildcards({}, 'user.name')).toEqual(['user.name'])
    })

    it('expands single wildcard', () => {
      const obj = { items: [{ name: 'a' }, { name: 'b' }, { name: 'c' }] }
      expect(expandWildcards(obj, 'items.*.name')).toEqual([
        'items.0.name',
        'items.1.name',
        'items.2.name',
      ])
    })

    it('expands multiple wildcards', () => {
      const obj = {
        categories: [
          { items: [{ id: 1 }, { id: 2 }] },
          { items: [{ id: 3 }] },
        ],
      }
      expect(expandWildcards(obj, 'categories.*.items.*.id')).toEqual([
        'categories.0.items.0.id',
        'categories.0.items.1.id',
        'categories.1.items.0.id',
      ])
    })

    it('handles empty arrays', () => {
      expect(expandWildcards({ items: [] }, 'items.*.name')).toEqual([])
    })
  })

  describe('deepClone', () => {
    it('clones primitives', () => {
      expect(deepClone(42)).toBe(42)
      expect(deepClone('hello')).toBe('hello')
      expect(deepClone(null)).toBe(null)
    })

    it('clones objects', () => {
      const obj = { a: 1, b: { c: 2 } }
      const cloned = deepClone(obj)
      expect(cloned).toEqual(obj)
      expect(cloned).not.toBe(obj)
      expect(cloned.b).not.toBe(obj.b)
    })

    it('clones arrays', () => {
      const arr = [1, [2, 3], { a: 4 }]
      const cloned = deepClone(arr)
      expect(cloned).toEqual(arr)
      expect(cloned).not.toBe(arr)
      expect(cloned[1]).not.toBe(arr[1])
    })

    it('clones dates', () => {
      const date = new Date('2024-01-01')
      const cloned = deepClone(date)
      expect(cloned).toEqual(date)
      expect(cloned).not.toBe(date)
    })
  })

  describe('deepEqual', () => {
    it('compares primitives', () => {
      expect(deepEqual(1, 1)).toBe(true)
      expect(deepEqual(1, 2)).toBe(false)
      expect(deepEqual('a', 'a')).toBe(true)
      expect(deepEqual(null, null)).toBe(true)
      expect(deepEqual(null, undefined)).toBe(false)
    })

    it('compares objects', () => {
      expect(deepEqual({ a: 1 }, { a: 1 })).toBe(true)
      expect(deepEqual({ a: 1 }, { a: 2 })).toBe(false)
      expect(deepEqual({ a: 1 }, { b: 1 })).toBe(false)
      expect(deepEqual({ a: { b: 1 } }, { a: { b: 1 } })).toBe(true)
    })

    it('compares arrays', () => {
      expect(deepEqual([1, 2], [1, 2])).toBe(true)
      expect(deepEqual([1, 2], [1, 3])).toBe(false)
      expect(deepEqual([1], [1, 2])).toBe(false)
    })

    it('compares dates', () => {
      expect(deepEqual(new Date('2024-01-01'), new Date('2024-01-01'))).toBe(true)
      expect(deepEqual(new Date('2024-01-01'), new Date('2024-01-02'))).toBe(false)
    })
  })
})

describe('Rules', () => {
  describe('required', () => {
    const rule = rules.required()

    it('fails on empty values', () => {
      expect(rule(null, {}, '')).toBe('This field is required')
      expect(rule(undefined, {}, '')).toBe('This field is required')
      expect(rule('', {}, '')).toBe('This field is required')
      expect(rule([], {}, '')).toBe('This field is required')
    })

    it('passes on non-empty values', () => {
      expect(rule('hello', {}, '')).toBe(true)
      expect(rule(0, {}, '')).toBe(true)
      expect(rule(false, {}, '')).toBe(true)
      expect(rule(['item'], {}, '')).toBe(true)
    })

    it('uses custom message', () => {
      const custom = rules.required('Required!')
      expect(custom('', {}, '')).toBe('Required!')
    })
  })

  describe('email', () => {
    const rule = rules.email()

    it('validates email format', () => {
      expect(rule('test@example.com', {}, '')).toBe(true)
      expect(rule('invalid', {}, '')).toBe('Must be a valid email')
      expect(rule('no@domain', {}, '')).toBe('Must be a valid email')
    })

    it('passes on empty values', () => {
      expect(rule('', {}, '')).toBe(true)
      expect(rule(null, {}, '')).toBe(true)
    })
  })

  describe('url', () => {
    const rule = rules.url()

    it('validates URL format', () => {
      expect(rule('https://example.com', {}, '')).toBe(true)
      expect(rule('http://localhost:3000', {}, '')).toBe(true)
      expect(rule('not-a-url', {}, '')).toBe('Must be a valid URL')
    })

    it('passes on empty values', () => {
      expect(rule('', {}, '')).toBe(true)
    })
  })

  describe('min', () => {
    it('validates string length', () => {
      const rule = rules.min(3)
      expect(rule('abc', {}, '')).toBe(true)
      expect(rule('ab', {}, '')).toBe('Must be at least 3 characters')
    })

    it('validates number value', () => {
      const rule = rules.min(10)
      expect(rule(10, {}, '')).toBe(true)
      expect(rule(9, {}, '')).toBe('Must be at least 10')
    })

    it('validates array length', () => {
      const rule = rules.min(2)
      expect(rule([1, 2], {}, '')).toBe(true)
      expect(rule([1], {}, '')).toBe('Must have at least 2 items')
    })
  })

  describe('max', () => {
    it('validates string length', () => {
      const rule = rules.max(3)
      expect(rule('abc', {}, '')).toBe(true)
      expect(rule('abcd', {}, '')).toBe('Must be at most 3 characters')
    })

    it('validates number value', () => {
      const rule = rules.max(10)
      expect(rule(10, {}, '')).toBe(true)
      expect(rule(11, {}, '')).toBe('Must be at most 10')
    })
  })

  describe('between', () => {
    it('validates string length range', () => {
      const rule = rules.between(2, 4)
      expect(rule('ab', {}, '')).toBe(true)
      expect(rule('abcd', {}, '')).toBe(true)
      expect(rule('a', {}, '')).toBe('Must be between 2 and 4 characters')
      expect(rule('abcde', {}, '')).toBe('Must be between 2 and 4 characters')
    })

    it('validates number range', () => {
      const rule = rules.between(1, 10)
      expect(rule(5, {}, '')).toBe(true)
      expect(rule(0, {}, '')).toBe('Must be between 1 and 10')
    })
  })

  describe('pattern', () => {
    it('validates regex match', () => {
      const rule = rules.pattern(/^[A-Z]{3}$/)
      expect(rule('ABC', {}, '')).toBe(true)
      expect(rule('abc', {}, '')).toBe('Invalid format')
      expect(rule('ABCD', {}, '')).toBe('Invalid format')
    })
  })

  describe('in', () => {
    it('validates inclusion', () => {
      const rule = rules.in(['a', 'b', 'c'])
      expect(rule('a', {}, '')).toBe(true)
      expect(rule('d', {}, '')).toBe('Must be one of: a, b, c')
    })
  })

  describe('notIn', () => {
    it('validates exclusion', () => {
      const rule = rules.notIn(['x', 'y'])
      expect(rule('a', {}, '')).toBe(true)
      expect(rule('x', {}, '')).toBe('Must not be one of: x, y')
    })
  })

  describe('same', () => {
    it('matches another field', () => {
      const rule = rules.same('password')
      const data = { password: 'secret', confirm: 'secret' }
      expect(rule('secret', data, 'confirm')).toBe(true)
      expect(rule('different', data, 'confirm')).toBe('Must match password')
    })
  })

  describe('different', () => {
    it('differs from another field', () => {
      const rule = rules.different('oldPassword')
      const data = { oldPassword: 'old', newPassword: 'new' }
      expect(rule('new', data, 'newPassword')).toBe(true)
      expect(rule('old', data, 'newPassword')).toBe('Must be different from oldPassword')
    })
  })

  describe('integer', () => {
    const rule = rules.integer()

    it('validates integers', () => {
      expect(rule(42, {}, '')).toBe(true)
      expect(rule(0, {}, '')).toBe(true)
      expect(rule(-5, {}, '')).toBe(true)
      expect(rule(3.14, {}, '')).toBe('Must be an integer')
    })

    it('validates string integers', () => {
      expect(rule('42', {}, '')).toBe(true)
      expect(rule('3.14', {}, '')).toBe('Must be an integer')
    })
  })

  describe('numeric', () => {
    const rule = rules.numeric()

    it('validates numbers', () => {
      expect(rule(42, {}, '')).toBe(true)
      expect(rule(3.14, {}, '')).toBe(true)
      expect(rule('100', {}, '')).toBe(true)
      expect(rule('abc', {}, '')).toBe('Must be a number')
    })
  })

  describe('boolean', () => {
    const rule = rules.boolean()

    it('validates booleans', () => {
      expect(rule(true, {}, '')).toBe(true)
      expect(rule(false, {}, '')).toBe(true)
      expect(rule('true', {}, '')).toBe('Must be true or false')
      expect(rule(1, {}, '')).toBe('Must be true or false')
    })
  })

  describe('date', () => {
    const rule = rules.date()

    it('validates dates', () => {
      expect(rule(new Date(), {}, '')).toBe(true)
      expect(rule('2024-01-01', {}, '')).toBe(true)
      expect(rule('not-a-date', {}, '')).toBe('Must be a valid date')
    })
  })

  describe('custom', () => {
    it('runs custom validation', () => {
      const rule = rules.custom((value) => typeof value === 'string' && value.startsWith('X'))
      expect(rule('XYZ', {}, '')).toBe(true)
      expect(rule('ABC', {}, '')).toBe('Invalid value')
    })

    it('has access to full data', () => {
      type FormData = { min: number; max: number }
      const rule = rules.custom<FormData>((value, data) => (value as number) <= data.max)
      expect(rule(5, { min: 0, max: 10 }, '')).toBe(true)
      expect(rule(15, { min: 0, max: 10 }, '')).toBe('Invalid value')
    })
  })
})

describe('Validation engine', () => {
  it('validates flat data', () => {
    const data = { email: 'invalid', password: '' }
    const validationRules = {
      email: [rules.required(), rules.email()],
      password: [rules.required()],
    }
    const errors = runValidation(data, validationRules)
    expect(errors.email).toEqual(['Must be a valid email'])
    expect(errors.password).toEqual(['This field is required'])
  })

  it('validates nested data', () => {
    const data = { user: { profile: { name: '' } } }
    const validationRules = {
      'user.profile.name': [rules.required()],
    }
    const errors = runValidation(data, validationRules)
    expect(errors['user.profile.name']).toEqual(['This field is required'])
  })

  it('validates array data with wildcards', () => {
    const data = { items: [{ name: '' }, { name: 'valid' }, { name: '' }] }
    const validationRules = {
      'items.*.name': [rules.required()],
    }
    const errors = runValidation(data, validationRules)
    expect(errors['items.0.name']).toEqual(['This field is required'])
    expect(errors['items.1.name']).toBeUndefined()
    expect(errors['items.2.name']).toEqual(['This field is required'])
  })

  it('stops at first error per path', () => {
    const data = { email: '' }
    const validationRules = {
      email: [rules.required(), rules.email()],
    }
    const errors = runValidation(data, validationRules)
    // Should only have required error, not email error
    expect(errors.email).toEqual(['This field is required'])
  })

  it('returns empty object when all valid', () => {
    const data = { email: 'test@example.com' }
    const validationRules = {
      email: [rules.required(), rules.email()],
    }
    const errors = runValidation(data, validationRules)
    expect(errors).toEqual({})
  })
})

describe('useForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('initializes with provided data', () => {
    const { data } = useForm({ data: { email: 'test@example.com' } })
    expect(data.value.email).toBe('test@example.com')
  })

  it('tracks dirty state', () => {
    const { data, isDirty } = useForm({ data: { name: 'John' } })
    expect(isDirty.value).toBe(false)

    data.value.name = 'Jane'
    expect(isDirty.value).toBe(true)
  })

  it('validates on validate()', () => {
    const { errors, validate } = useForm({
      data: { email: 'invalid' },
      rules: { email: [rules.email()] },
    })

    expect(errors.value).toEqual({})
    const isValid = validate()
    expect(isValid).toBe(false)
    expect(errors.value.email).toEqual(['Must be a valid email'])
  })

  it('resets to initial state', () => {
    const { data, errors, reset, setError } = useForm({
      data: { name: 'John' },
    })

    data.value.name = 'Jane'
    setError('name', 'Some error')

    reset()

    expect(data.value.name).toBe('John')
    expect(errors.value).toEqual({})
  })

  it('sets and clears errors', () => {
    const { errors, setError, clearErrors } = useForm({
      data: { email: '', password: '' },
    })

    setError('email', 'Invalid')
    setError('password', 'Too short')

    expect(errors.value.email).toEqual(['Invalid'])
    expect(errors.value.password).toEqual(['Too short'])

    clearErrors('email')
    expect(errors.value.email).toBeUndefined()
    expect(errors.value.password).toEqual(['Too short'])

    clearErrors()
    expect(errors.value).toEqual({})
  })

  it('throws when submit() called without endpoint', async () => {
    const { submit } = useForm({ data: { email: '' } })

    await expect(submit()).rejects.toThrow('useForm: submit() called but no endpoint configured.')
  })

  it('validates before submission', async () => {
    const { submit, errors } = useForm({
      data: { email: '' },
      rules: { email: [rules.required()] },
      endpoint: '/api/submit',
    })

    const result = await submit()

    expect(result).toEqual({ ok: false, validationFailed: true })
    expect(errors.value.email).toEqual(['This field is required'])
    expect(Http.post).not.toHaveBeenCalled()
  })

  it('submits successfully', async () => {
    const responseData = { id: 1, email: 'test@example.com' }
    vi.mocked(Http.post).mockResolvedValue(responseData)

    const { submit, isSubmitting } = useForm({
      data: { email: 'test@example.com' },
      endpoint: '/api/submit',
    })

    const result = await submit()

    expect(result).toEqual({ ok: true, data: responseData })
    expect(Http.post).toHaveBeenCalledWith('/api/submit', { email: 'test@example.com' })
    expect(isSubmitting.value).toBe(false)
  })

  it('uses correct HTTP method', async () => {
    vi.mocked(Http.put).mockResolvedValue({})

    const { submit } = useForm({
      data: { id: 1, name: 'Updated' },
      endpoint: '/api/update',
      method: 'PUT',
    })

    await submit()

    expect(Http.put).toHaveBeenCalledWith('/api/update', { id: 1, name: 'Updated' })
  })

  it('transforms data before submission', async () => {
    vi.mocked(Http.post).mockResolvedValue({})

    const { submit } = useForm({
      data: { email: 'TEST@EXAMPLE.COM' },
      endpoint: '/api/submit',
      transform: (data) => ({ email: data.email.toLowerCase() }),
    })

    await submit()

    expect(Http.post).toHaveBeenCalledWith('/api/submit', { email: 'test@example.com' })
  })

  it('handles 422 validation errors', async () => {
    const serverErrors = { email: ['Email already taken'], password: ['Too weak'] }
    vi.mocked(Http.post).mockRejectedValue({
      status: 422,
      body: { message: 'Validation failed', errors: serverErrors },
    })

    const { submit, errors } = useForm({
      data: { email: 'test@example.com', password: 'weak' },
      endpoint: '/api/submit',
    })

    const result = await submit()

    expect(result).toEqual({ ok: false, validationFailed: true })
    expect(errors.value).toEqual(serverErrors)
  })

  it('handles network errors', async () => {
    const networkError = new Error('Network failure')
    vi.mocked(Http.post).mockRejectedValue(networkError)

    const { submit, errors } = useForm({
      data: { email: 'test@example.com' },
      endpoint: '/api/submit',
    })

    const result = await submit()

    expect(result).toEqual({ ok: false, error: networkError })
    expect(errors.value).toEqual({})
  })

  it('clears errors before submission', async () => {
    vi.mocked(Http.post).mockResolvedValue({})

    const { submit, errors, setError } = useForm({
      data: { email: 'valid@example.com' },
      endpoint: '/api/submit',
    })

    setError('email', 'Previous error')
    expect(errors.value.email).toEqual(['Previous error'])

    await submit()

    expect(errors.value).toEqual({})
  })

  it('computes isValid correctly', () => {
    const form1 = useForm({
      data: { email: 'valid@example.com' },
      rules: { email: [rules.required(), rules.email()] },
    })
    expect(form1.isValid.value).toBe(true)

    const form2 = useForm({
      data: { email: 'invalid' },
      rules: { email: [rules.email()] },
    })
    expect(form2.isValid.value).toBe(false)
  })

  it('computes hasErrors correctly', () => {
    const { hasErrors, setError, clearErrors } = useForm({
      data: { email: '' },
    })

    expect(hasErrors.value).toBe(false)

    setError('email', 'Error')
    expect(hasErrors.value).toBe(true)

    clearErrors()
    expect(hasErrors.value).toBe(false)
  })
})
