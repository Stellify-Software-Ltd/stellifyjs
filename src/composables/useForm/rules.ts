import type { Rule } from './types'
import { get } from './paths'

/**
 * Built-in validation rules.
 * Each factory returns a Rule function: (value, data, path) => string | true
 */
export const rules = {
  /**
   * Field must have a non-empty value
   */
  required<T = unknown>(message?: string): Rule<T> {
    return (value) => {
      if (value === null || value === undefined || value === '') {
        return message ?? 'This field is required'
      }
      if (Array.isArray(value) && value.length === 0) {
        return message ?? 'This field is required'
      }
      return true
    }
  },

  /**
   * Field must be a valid email address
   */
  email<T = unknown>(message?: string): Rule<T> {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return (value) => {
      if (value === null || value === undefined || value === '') return true
      if (typeof value !== 'string') return message ?? 'Must be a valid email'
      return emailRegex.test(value) ? true : (message ?? 'Must be a valid email')
    }
  },

  /**
   * Field must be a valid URL
   */
  url<T = unknown>(message?: string): Rule<T> {
    return (value) => {
      if (value === null || value === undefined || value === '') return true
      if (typeof value !== 'string') return message ?? 'Must be a valid URL'
      try {
        new URL(value)
        return true
      } catch {
        return message ?? 'Must be a valid URL'
      }
    }
  },

  /**
   * Minimum length (strings) or value (numbers)
   */
  min<T = unknown>(n: number, message?: string): Rule<T> {
    return (value) => {
      if (value === null || value === undefined || value === '') return true
      if (typeof value === 'string') {
        return value.length >= n ? true : (message ?? `Must be at least ${n} characters`)
      }
      if (typeof value === 'number') {
        return value >= n ? true : (message ?? `Must be at least ${n}`)
      }
      if (Array.isArray(value)) {
        return value.length >= n ? true : (message ?? `Must have at least ${n} items`)
      }
      return true
    }
  },

  /**
   * Maximum length (strings) or value (numbers)
   */
  max<T = unknown>(n: number, message?: string): Rule<T> {
    return (value) => {
      if (value === null || value === undefined || value === '') return true
      if (typeof value === 'string') {
        return value.length <= n ? true : (message ?? `Must be at most ${n} characters`)
      }
      if (typeof value === 'number') {
        return value <= n ? true : (message ?? `Must be at most ${n}`)
      }
      if (Array.isArray(value)) {
        return value.length <= n ? true : (message ?? `Must have at most ${n} items`)
      }
      return true
    }
  },

  /**
   * Value must be between min and max (inclusive)
   */
  between<T = unknown>(min: number, max: number, message?: string): Rule<T> {
    return (value) => {
      if (value === null || value === undefined || value === '') return true
      if (typeof value === 'string') {
        const len = value.length
        return len >= min && len <= max ? true : (message ?? `Must be between ${min} and ${max} characters`)
      }
      if (typeof value === 'number') {
        return value >= min && value <= max ? true : (message ?? `Must be between ${min} and ${max}`)
      }
      return true
    }
  },

  /**
   * Field must match regex pattern
   */
  pattern<T = unknown>(regex: RegExp, message?: string): Rule<T> {
    return (value) => {
      if (value === null || value === undefined || value === '') return true
      if (typeof value !== 'string') return message ?? 'Invalid format'
      return regex.test(value) ? true : (message ?? 'Invalid format')
    }
  },

  /**
   * Field must be one of the allowed values
   */
  in<T = unknown>(values: unknown[], message?: string): Rule<T> {
    return (value) => {
      if (value === null || value === undefined || value === '') return true
      return values.includes(value) ? true : (message ?? `Must be one of: ${values.join(', ')}`)
    }
  },

  /**
   * Field must not be one of the disallowed values
   */
  notIn<T = unknown>(values: unknown[], message?: string): Rule<T> {
    return (value) => {
      if (value === null || value === undefined || value === '') return true
      return !values.includes(value) ? true : (message ?? `Must not be one of: ${values.join(', ')}`)
    }
  },

  /**
   * Field must match another field's value
   */
  same<T = unknown>(otherPath: string, message?: string): Rule<T> {
    return (value, data) => {
      if (value === null || value === undefined || value === '') return true
      const otherValue = get(data, otherPath)
      return value === otherValue ? true : (message ?? `Must match ${otherPath}`)
    }
  },

  /**
   * Field must be different from another field's value
   */
  different<T = unknown>(otherPath: string, message?: string): Rule<T> {
    return (value, data) => {
      if (value === null || value === undefined || value === '') return true
      const otherValue = get(data, otherPath)
      return value !== otherValue ? true : (message ?? `Must be different from ${otherPath}`)
    }
  },

  /**
   * Field must be an integer
   */
  integer<T = unknown>(message?: string): Rule<T> {
    return (value) => {
      if (value === null || value === undefined || value === '') return true
      if (typeof value === 'number') {
        return Number.isInteger(value) ? true : (message ?? 'Must be an integer')
      }
      if (typeof value === 'string') {
        const num = Number(value)
        return !isNaN(num) && Number.isInteger(num) ? true : (message ?? 'Must be an integer')
      }
      return message ?? 'Must be an integer'
    }
  },

  /**
   * Field must be numeric
   */
  numeric<T = unknown>(message?: string): Rule<T> {
    return (value) => {
      if (value === null || value === undefined || value === '') return true
      if (typeof value === 'number') return !isNaN(value) ? true : (message ?? 'Must be a number')
      if (typeof value === 'string') {
        return !isNaN(Number(value)) ? true : (message ?? 'Must be a number')
      }
      return message ?? 'Must be a number'
    }
  },

  /**
   * Field must be a boolean
   */
  boolean<T = unknown>(message?: string): Rule<T> {
    return (value) => {
      if (value === null || value === undefined) return true
      return typeof value === 'boolean' ? true : (message ?? 'Must be true or false')
    }
  },

  /**
   * Field must be a valid date
   */
  date<T = unknown>(message?: string): Rule<T> {
    return (value) => {
      if (value === null || value === undefined || value === '') return true
      if (value instanceof Date) return !isNaN(value.getTime()) ? true : (message ?? 'Must be a valid date')
      if (typeof value === 'string' || typeof value === 'number') {
        const d = new Date(value)
        return !isNaN(d.getTime()) ? true : (message ?? 'Must be a valid date')
      }
      return message ?? 'Must be a valid date'
    }
  },

  /**
   * Custom validation function
   */
  custom<T = unknown>(
    fn: (value: unknown, data: T) => boolean,
    message?: string
  ): Rule<T> {
    return (value, data) => {
      return fn(value, data) ? true : (message ?? 'Invalid value')
    }
  },
}
