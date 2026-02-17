export class DB {
    db = null;
    dbName;
    version;
    stores = [];
    constructor(name, version = 1) {
        this.dbName = name;
        this.version = version;
    }
    static create(name, version = 1) {
        return new DB(name, version);
    }
    store(schema) {
        this.stores.push(schema);
        return this;
    }
    async open() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);
            request.onerror = () => {
                reject(new DBError(`Failed to open database: ${request.error?.message}`));
            };
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this);
            };
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                for (const schema of this.stores) {
                    if (!db.objectStoreNames.contains(schema.name)) {
                        const store = db.createObjectStore(schema.name, {
                            keyPath: schema.keyPath,
                            autoIncrement: schema.autoIncrement
                        });
                        if (schema.indexes) {
                            for (const index of schema.indexes) {
                                store.createIndex(index.name, index.keyPath, { unique: index.unique });
                            }
                        }
                    }
                }
            };
        });
    }
    close() {
        this.db?.close();
        this.db = null;
        return this;
    }
    async put(storeName, value, key) {
        return this.transaction(storeName, 'readwrite', (store) => {
            return store.put(value, key);
        });
    }
    async add(storeName, value, key) {
        return this.transaction(storeName, 'readwrite', (store) => {
            return store.add(value, key);
        });
    }
    async get(storeName, key) {
        return this.transaction(storeName, 'readonly', (store) => {
            return store.get(key);
        });
    }
    async getAll(storeName, options = {}) {
        return this.transaction(storeName, 'readonly', async (store) => {
            const source = options.index ? store.index(options.index) : store;
            return new Promise((resolve, reject) => {
                const results = [];
                let skipped = 0;
                let collected = 0;
                const request = source.openCursor(null, options.direction);
                request.onsuccess = () => {
                    const cursor = request.result;
                    if (cursor) {
                        if (options.offset && skipped < options.offset) {
                            skipped++;
                            cursor.continue();
                            return;
                        }
                        if (options.limit && collected >= options.limit) {
                            resolve(results);
                            return;
                        }
                        results.push(cursor.value);
                        collected++;
                        cursor.continue();
                    }
                    else {
                        resolve(results);
                    }
                };
                request.onerror = () => reject(new DBError('Cursor failed'));
            });
        });
    }
    async find(storeName, indexName, value) {
        return this.transaction(storeName, 'readonly', async (store) => {
            const index = store.index(indexName);
            return new Promise((resolve, reject) => {
                const request = index.getAll(value);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(new DBError('Find failed'));
            });
        });
    }
    async delete(storeName, key) {
        return this.transaction(storeName, 'readwrite', (store) => {
            return store.delete(key);
        });
    }
    async clear(storeName) {
        return this.transaction(storeName, 'readwrite', (store) => {
            return store.clear();
        });
    }
    async count(storeName, key) {
        return this.transaction(storeName, 'readonly', (store) => {
            return store.count(key);
        });
    }
    async keys(storeName) {
        return this.transaction(storeName, 'readonly', (store) => {
            return store.getAllKeys();
        });
    }
    async update(storeName, key, updates) {
        return this.transaction(storeName, 'readwrite', async (store) => {
            return new Promise((resolve, reject) => {
                const getRequest = store.get(key);
                getRequest.onsuccess = () => {
                    const existing = getRequest.result;
                    if (!existing) {
                        reject(new DBError(`Record not found: ${key}`));
                        return;
                    }
                    const updated = { ...existing, ...updates };
                    const putRequest = store.put(updated);
                    putRequest.onsuccess = () => resolve(updated);
                    putRequest.onerror = () => reject(new DBError('Update failed'));
                };
                getRequest.onerror = () => reject(new DBError('Get failed'));
            });
        });
    }
    async batch(storeName, operations) {
        return this.transaction(storeName, 'readwrite', async (store) => {
            return new Promise((resolve, reject) => {
                for (const op of operations) {
                    switch (op.type) {
                        case 'put':
                            store.put(op.value, op.key);
                            break;
                        case 'add':
                            store.add(op.value, op.key);
                            break;
                        case 'delete':
                            if (op.key)
                                store.delete(op.key);
                            break;
                    }
                }
                // Transaction will auto-complete after all operations
                resolve();
            });
        });
    }
    async transaction(storeName, mode, callback) {
        if (!this.db) {
            throw new DBError('Database not open');
        }
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, mode);
            const store = transaction.objectStore(storeName);
            const result = callback(store);
            if (result instanceof Promise) {
                result.then(resolve).catch(reject);
            }
            else {
                result.onsuccess = () => resolve(result.result);
                result.onerror = () => reject(new DBError(result.error?.message ?? 'Transaction failed'));
            }
        });
    }
    // Static utilities
    static async deleteDatabase(name) {
        return new Promise((resolve, reject) => {
            const request = indexedDB.deleteDatabase(name);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(new DBError('Delete database failed'));
        });
    }
    static async databases() {
        if ('databases' in indexedDB) {
            return indexedDB.databases();
        }
        return [];
    }
}
export class DBError extends Error {
    constructor(message) {
        super(message);
        this.name = 'DBError';
    }
}
