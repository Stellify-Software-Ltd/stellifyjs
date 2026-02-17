export class Form {
    data;
    initial;
    rules;
    errors;
    constructor(data = {}) {
        this.data = { ...data };
        this.initial = { ...data };
        this.rules = {};
        this.errors = {};
    }
    static create(data = {}) {
        return new Form(data);
    }
    set(key, value) {
        this.data[key] = value;
        return this;
    }
    get(key) {
        return this.data[key];
    }
    getData() {
        return { ...this.data };
    }
    validate(rules) {
        if (rules) {
            this.rules = rules;
        }
        this.errors = {};
        for (const [field, rule] of Object.entries(this.rules)) {
            const error = rule(this.data[field]);
            if (error) {
                this.errors[field] = error;
            }
        }
        return this;
    }
    isValid() {
        return Object.keys(this.errors).length === 0;
    }
    getErrors() {
        return { ...this.errors };
    }
    getError(key) {
        return this.errors[key] || null;
    }
    reset() {
        this.data = { ...this.initial };
        this.errors = {};
        return this;
    }
    async store(url) {
        return fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(this.data)
        });
    }
    async update(url) {
        return fetch(url, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(this.data)
        });
    }
    async delete(url) {
        return fetch(url, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
