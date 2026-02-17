import { reactive } from 'vue';
import { Form } from '../../form';
export function useForm(initialData = {}) {
    const form = Form.create(initialData);
    const state = reactive({
        data: { ...initialData },
        errors: {}
    });
    const set = (key, value) => {
        form.set(key, value);
        state.data[key] = value;
        return form;
    };
    const get = (key) => {
        return state.data[key];
    };
    const getData = () => {
        return { ...state.data };
    };
    const validate = (rules) => {
        form.validate(rules);
        state.errors = form.getErrors();
        return form;
    };
    const isValid = () => {
        return Object.keys(state.errors).length === 0;
    };
    const getErrors = () => {
        return { ...state.errors };
    };
    const getError = (key) => {
        return state.errors[key] || null;
    };
    const reset = () => {
        form.reset();
        const freshData = form.getData();
        for (const key of Object.keys(state.data)) {
            state.data[key] = freshData[key];
        }
        state.errors = {};
        return form;
    };
    const bind = (field, type = 'text') => {
        switch (type) {
            case 'checkbox':
                return {
                    checked: Boolean(get(field)),
                    onChange: (e) => {
                        set(field, e.target.checked);
                    }
                };
            case 'file':
                return {
                    onChange: (e) => {
                        set(field, e.target.files);
                    }
                };
            case 'text':
            case 'select':
            default:
                return {
                    value: String(get(field) ?? ''),
                    onInput: (e) => {
                        set(field, e.target.value);
                    }
                };
        }
    };
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
    };
}
