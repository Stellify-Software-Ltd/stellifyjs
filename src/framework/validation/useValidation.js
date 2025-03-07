import { container } from "../container/container";
import { validate, validateAsync } from "./validation";

export function useValidation(formKey, rules, asyncRules = {}) {

    // Get the store from the DI container
    const store = container.make("store");

    // Ensure the store has a default structure for the form
    if (!store.get(formKey)) {
        store.set(formKey, { data: {}, errors: {}, isValid: false });
    }

    const state = store.get(formKey);

    function validateField(field) {
        state.errors[field] = validate({ [field]: state.data[field] }, { [field]: rules[field] })[field] || [];

        // Update store
        store.set(formKey, state);
    }

    async function validateFieldAsync(field) {
        state.errors[field] = await validateAsync(
        { [field]: state.data[field] },
        { [field]: rules[field] },
        { [field]: asyncRules[field] }
        )[field] || [];

        // Update store
        store.set(formKey, state);
    }

    function validateForm() {
        state.errors = validate(state.data, rules);
        state.isValid = Object.keys(state.errors).length === 0;

        // Update store
        store.set(formKey, state);

        return state.isValid;
    }

    async function validateFormAsync() {
        state.errors = await validateAsync(state.data, rules, asyncRules);
        state.isValid = Object.keys(state.errors).length === 0;

        // Update store
        store.set(formKey, state);

        return state.isValid;
    }

    function setFieldValue(field, value) {
        state.data[field] = value;
        validateField(field);
        store.set(formKey, state);
    }

    return { state, setFieldValue, validateField, validateFieldAsync, validateForm, validateFormAsync };
}
