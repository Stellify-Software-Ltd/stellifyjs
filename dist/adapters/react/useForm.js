import { useState, useCallback } from 'react';
import { Form } from '../../form';
export function useForm(initialData = {}) {
    const [form, setForm] = useState(() => Form.create(initialData));
    const [, forceUpdate] = useState(0);
    const rerender = useCallback(() => {
        forceUpdate(n => n + 1);
    }, []);
    const reactiveSet = useCallback((key, value) => {
        form.set(key, value);
        rerender();
        return form;
    }, [form, rerender]);
    const bind = useCallback((field, type = 'text') => {
        switch (type) {
            case 'checkbox':
                return {
                    checked: Boolean(form.get(field)),
                    onChange: (e) => {
                        reactiveSet(field, e.target.checked);
                    }
                };
            case 'file':
                return {
                    onChange: (e) => {
                        reactiveSet(field, e.target.files);
                    }
                };
            case 'text':
            case 'select':
            default:
                return {
                    value: String(form.get(field) ?? ''),
                    onChange: (e) => {
                        reactiveSet(field, e.target.value);
                    }
                };
        }
    }, [form, reactiveSet]);
    const reactiveValidate = useCallback((rules) => {
        form.validate(rules);
        rerender();
        return form;
    }, [form, rerender]);
    const reactiveReset = useCallback(() => {
        form.reset();
        rerender();
        return form;
    }, [form, rerender]);
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
    };
}
