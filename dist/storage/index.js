export class Storage {
    store = null;
    prefix = '';
    constructor(type, prefix = '') {
        this.prefix = prefix;
        if (typeof window !== 'undefined') {
            this.store = type === 'local' ? window.localStorage : window.sessionStorage;
        }
    }
    static local(prefix = '') {
        return new Storage('local', prefix);
    }
    static session(prefix = '') {
        return new Storage('session', prefix);
    }
    prefixKey(key) {
        return this.prefix ? `${this.prefix}:${key}` : key;
    }
    set(key, value) {
        if (!this.store)
            return this;
        const serialized = JSON.stringify(value);
        this.store.setItem(this.prefixKey(key), serialized);
        return this;
    }
    get(key, defaultValue) {
        if (!this.store)
            return defaultValue ?? null;
        const item = this.store.getItem(this.prefixKey(key));
        if (item === null)
            return defaultValue ?? null;
        try {
            return JSON.parse(item);
        }
        catch {
            return item;
        }
    }
    remove(key) {
        if (!this.store)
            return this;
        this.store.removeItem(this.prefixKey(key));
        return this;
    }
    clear() {
        if (!this.store)
            return this;
        if (this.prefix) {
            // Only clear prefixed keys
            const keysToRemove = [];
            for (let i = 0; i < this.store.length; i++) {
                const key = this.store.key(i);
                if (key && key.startsWith(`${this.prefix}:`)) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(key => this.store.removeItem(key));
        }
        else {
            this.store.clear();
        }
        return this;
    }
    has(key) {
        if (!this.store)
            return false;
        return this.store.getItem(this.prefixKey(key)) !== null;
    }
    keys() {
        if (!this.store)
            return [];
        const keys = [];
        const prefixLength = this.prefix ? this.prefix.length + 1 : 0;
        for (let i = 0; i < this.store.length; i++) {
            const key = this.store.key(i);
            if (key) {
                if (this.prefix) {
                    if (key.startsWith(`${this.prefix}:`)) {
                        keys.push(key.slice(prefixLength));
                    }
                }
                else {
                    keys.push(key);
                }
            }
        }
        return keys;
    }
    getAll() {
        const result = {};
        for (const key of this.keys()) {
            result[key] = this.get(key);
        }
        return result;
    }
    size() {
        return this.keys().length;
    }
}
