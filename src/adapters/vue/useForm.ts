import { reactive, computed } from 'vue'
import { Form } from '../../form'

type BindType = 'text' | 'checkbox' | 'select' | 'file'

interface TextBinding {
  value: string
  onInput: (e: Event) => void
}

interface CheckboxBinding {
  checked: boolean
  onChange: (e: Event) => void
}

interface FileBinding {
  onChange: (e: Event) => void
}

type Binding = TextBinding | CheckboxBinding | FileBinding

type FormData = Record<string, unknown>

export function useForm(initialData: FormData = {}) {
  const form = Form.create(initialData)

  const state = reactive({
    data: { ...initialData },
    errors: {} as Record<string, string>
  })

  const set = (key: string, value: unknown) => {
    form.set(key, value)
    state.data[key] = value
    return form
  }

  const get = (key: string): unknown => {
    return state.data[key]
  }

  const getData = (): FormData => {
    return { ...state.data }
  }

  const validate = (rules?: Record<string, (value: unknown) => string | null>) => {
    form.validate(rules)
    state.errors = form.getErrors()
    return form
  }

  const isValid = (): boolean => {
    return Object.keys(state.errors).length === 0
  }

  const getErrors = (): Record<string, string> => {
    return { ...state.errors }
  }

  const getError = (key: string): string | null => {
    return state.errors[key] || null
  }

  const reset = () => {
    form.reset()
    const freshData = form.getData()
    for (const key of Object.keys(state.data)) {
      state.data[key] = freshData[key]
    }
    state.errors = {}
    return form
  }

  const bind = (field: string, type: BindType = 'text'): Binding => {
    switch (type) {
      case 'checkbox':
        return {
          checked: Boolean(get(field)),
          onChange: (e: Event) => {
            set(field, (e.target as HTMLInputElement).checked)
          }
        }

      case 'file':
        return {
          onChange: (e: Event) => {
            set(field, (e.target as HTMLInputElement).files)
          }
        }

      case 'text':
      case 'select':
      default:
        return {
          value: String(get(field) ?? ''),
          onInput: (e: Event) => {
            set(field, (e.target as HTMLInputElement).value)
          }
        }
    }
  }

  return {
    set,
    get,
    getData,
    validate,
    isValid,
    getErrors,
    getError,
    reset,
    store: form.store.bind(form),
    update: form.update.bind(form),
    delete: form.delete.bind(form),
    bind,
    state
  }
}
