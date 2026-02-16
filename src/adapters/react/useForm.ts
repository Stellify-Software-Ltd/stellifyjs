import { useState, useCallback } from 'react'
import { Form } from '../../form'

type BindType = 'text' | 'checkbox' | 'select' | 'file'

interface TextBinding {
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void
}

interface CheckboxBinding {
  checked: boolean
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

interface FileBinding {
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

type Binding = TextBinding | CheckboxBinding | FileBinding

export interface ReactForm extends Form {
  bind(field: string, type?: BindType): Binding
}

type FormData = Record<string, unknown>

export function useForm(initialData: FormData = {}): ReactForm {
  const [form, setForm] = useState(() => Form.create(initialData))
  const [, forceUpdate] = useState(0)

  const rerender = useCallback(() => {
    forceUpdate(n => n + 1)
  }, [])

  const reactiveSet = useCallback((key: string, value: unknown) => {
    form.set(key, value)
    rerender()
    return form
  }, [form, rerender])

  const bind = useCallback((field: string, type: BindType = 'text'): Binding => {
    switch (type) {
      case 'checkbox':
        return {
          checked: Boolean(form.get(field)),
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
            reactiveSet(field, e.target.checked)
          }
        }

      case 'file':
        return {
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
            reactiveSet(field, e.target.files)
          }
        }

      case 'text':
      case 'select':
      default:
        return {
          value: String(form.get(field) ?? ''),
          onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
            reactiveSet(field, e.target.value)
          }
        }
    }
  }, [form, reactiveSet])

  const reactiveValidate = useCallback((rules?: Record<string, (value: unknown) => string | null>) => {
    form.validate(rules)
    rerender()
    return form
  }, [form, rerender])

  const reactiveReset = useCallback(() => {
    form.reset()
    rerender()
    return form
  }, [form, rerender])

  return {
    ...form,
    set: reactiveSet,
    get: form.get.bind(form),
    getData: form.getData.bind(form),
    validate: reactiveValidate,
    isValid: form.isValid.bind(form),
    getErrors: form.getErrors.bind(form),
    getError: form.getError.bind(form),
    reset: reactiveReset,
    store: form.store.bind(form),
    update: form.update.bind(form),
    delete: form.delete.bind(form),
    bind
  } as ReactForm
}
