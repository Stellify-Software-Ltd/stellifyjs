interface StoreSchema {
  name: string
  keyPath?: string
  autoIncrement?: boolean
  indexes?: Array<{
    name: string
    keyPath: string | string[]
    unique?: boolean
  }>
}

interface QueryOptions {
  index?: string
  direction?: IDBCursorDirection
  limit?: number
  offset?: number
}

export class DB {
  private db: IDBDatabase | null = null
  private dbName: string
  private version: number
  private stores: StoreSchema[] = []

  private constructor(name: string, version: number = 1) {
    this.dbName = name
    this.version = version
  }

  static create(name: string, version: number = 1): DB {
    return new DB(name, version)
  }

  store(schema: StoreSchema): this {
    this.stores.push(schema)
    return this
  }

  async open(): Promise<this> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => {
        reject(new DBError(`Failed to open database: ${request.error?.message}`))
      }

      request.onsuccess = () => {
        this.db = request.result
        resolve(this)
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        for (const schema of this.stores) {
          if (!db.objectStoreNames.contains(schema.name)) {
            const store = db.createObjectStore(schema.name, {
              keyPath: schema.keyPath,
              autoIncrement: schema.autoIncrement
            })

            if (schema.indexes) {
              for (const index of schema.indexes) {
                store.createIndex(index.name, index.keyPath, { unique: index.unique })
              }
            }
          }
        }
      }
    })
  }

  close(): this {
    this.db?.close()
    this.db = null
    return this
  }

  async put<T>(storeName: string, value: T, key?: IDBValidKey): Promise<IDBValidKey> {
    return this.transaction(storeName, 'readwrite', (store) => {
      return store.put(value, key)
    })
  }

  async add<T>(storeName: string, value: T, key?: IDBValidKey): Promise<IDBValidKey> {
    return this.transaction(storeName, 'readwrite', (store) => {
      return store.add(value, key)
    })
  }

  async get<T>(storeName: string, key: IDBValidKey): Promise<T | undefined> {
    return this.transaction(storeName, 'readonly', (store) => {
      return store.get(key)
    })
  }

  async getAll<T>(storeName: string, options: QueryOptions = {}): Promise<T[]> {
    return this.transaction(storeName, 'readonly', async (store) => {
      const source = options.index ? store.index(options.index) : store

      return new Promise((resolve, reject) => {
        const results: T[] = []
        let skipped = 0
        let collected = 0

        const request = source.openCursor(null, options.direction)

        request.onsuccess = () => {
          const cursor = request.result

          if (cursor) {
            if (options.offset && skipped < options.offset) {
              skipped++
              cursor.continue()
              return
            }

            if (options.limit && collected >= options.limit) {
              resolve(results)
              return
            }

            results.push(cursor.value)
            collected++
            cursor.continue()
          } else {
            resolve(results)
          }
        }

        request.onerror = () => reject(new DBError('Cursor failed'))
      })
    })
  }

  async find<T>(storeName: string, indexName: string, value: IDBValidKey): Promise<T[]> {
    return this.transaction(storeName, 'readonly', async (store) => {
      const index = store.index(indexName)

      return new Promise((resolve, reject) => {
        const request = index.getAll(value)
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(new DBError('Find failed'))
      })
    })
  }

  async delete(storeName: string, key: IDBValidKey): Promise<void> {
    return this.transaction(storeName, 'readwrite', (store) => {
      return store.delete(key)
    })
  }

  async clear(storeName: string): Promise<void> {
    return this.transaction(storeName, 'readwrite', (store) => {
      return store.clear()
    })
  }

  async count(storeName: string, key?: IDBValidKey | IDBKeyRange): Promise<number> {
    return this.transaction(storeName, 'readonly', (store) => {
      return store.count(key)
    })
  }

  async keys(storeName: string): Promise<IDBValidKey[]> {
    return this.transaction(storeName, 'readonly', (store) => {
      return store.getAllKeys()
    })
  }

  async update<T>(storeName: string, key: IDBValidKey, updates: Partial<T>): Promise<T> {
    return this.transaction(storeName, 'readwrite', async (store) => {
      return new Promise((resolve, reject) => {
        const getRequest = store.get(key)

        getRequest.onsuccess = () => {
          const existing = getRequest.result
          if (!existing) {
            reject(new DBError(`Record not found: ${key}`))
            return
          }

          const updated = { ...existing, ...updates }
          const putRequest = store.put(updated)

          putRequest.onsuccess = () => resolve(updated)
          putRequest.onerror = () => reject(new DBError('Update failed'))
        }

        getRequest.onerror = () => reject(new DBError('Get failed'))
      })
    })
  }

  async batch<T>(storeName: string, operations: Array<{ type: 'put' | 'add' | 'delete'; value?: T; key?: IDBValidKey }>): Promise<void> {
    return this.transaction(storeName, 'readwrite', async (store) => {
      return new Promise((resolve, reject) => {
        for (const op of operations) {
          switch (op.type) {
            case 'put':
              store.put(op.value, op.key)
              break
            case 'add':
              store.add(op.value, op.key)
              break
            case 'delete':
              if (op.key) store.delete(op.key)
              break
          }
        }

        // Transaction will auto-complete after all operations
        resolve()
      })
    })
  }

  private async transaction<T>(
    storeName: string,
    mode: IDBTransactionMode,
    callback: (store: IDBObjectStore) => IDBRequest | Promise<T>
  ): Promise<T> {
    if (!this.db) {
      throw new DBError('Database not open')
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, mode)
      const store = transaction.objectStore(storeName)

      const result = callback(store)

      if (result instanceof Promise) {
        result.then(resolve).catch(reject)
      } else {
        result.onsuccess = () => resolve(result.result)
        result.onerror = () => reject(new DBError(result.error?.message ?? 'Transaction failed'))
      }
    })
  }

  // Static utilities
  static async deleteDatabase(name: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(name)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(new DBError('Delete database failed'))
    })
  }

  static async databases(): Promise<IDBDatabaseInfo[]> {
    if ('databases' in indexedDB) {
      return indexedDB.databases()
    }
    return []
  }
}

export class DBError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DBError'
  }
}
