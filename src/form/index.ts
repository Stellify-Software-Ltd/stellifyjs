type FormData = Record<string, unknown>
type ValidationRule = (value: unknown) => string | null
type ValidationRules = Record<string, ValidationRule>
type FormErrors = Record<string, string>

export class Form {
  private data: FormData
  private initial: FormData
  private rules: ValidationRules
  private errors: FormErrors

  private constructor(data: FormData = {}) {
    this.data = { ...data }
    this.initial = { ...data }
    this.rules = {}
    this.errors = {}
  }

  static create(data: FormData = {}): Form {
    return new Form(data)
  }

  set(key: string, value: unknown): Form {
    this.data[key] = value
    return this
  }

  get(key: string): unknown {
    return this.data[key]
  }

  getData(): FormData {
    return { ...this.data }
  }

  validate(rules?: ValidationRules): Form {
    if (rules) {
      this.rules = rules
    }

    this.errors = {}

    for (const [field, rule] of Object.entries(this.rules)) {
      const error = rule(this.data[field])
      if (error) {
        this.errors[field] = error
      }
    }

    return this
  }

  isValid(): boolean {
    return Object.keys(this.errors).length === 0
  }

  getErrors(): FormErrors {
    return { ...this.errors }
  }

  getError(key: string): string | null {
    return this.errors[key] || null
  }

  reset(): Form {
    this.data = { ...this.initial }
    this.errors = {}
    return this
  }

  async store(url: string): Promise<Response> {
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(this.data)
    })
  }

  async update(url: string): Promise<Response> {
    return fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(this.data)
    })
  }

  async delete(url: string): Promise<Response> {
    return fetch(url, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
