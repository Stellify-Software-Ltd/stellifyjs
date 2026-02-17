interface StoreSchema {
    name: string;
    keyPath?: string;
    autoIncrement?: boolean;
    indexes?: Array<{
        name: string;
        keyPath: string | string[];
        unique?: boolean;
    }>;
}
interface QueryOptions {
    index?: string;
    direction?: IDBCursorDirection;
    limit?: number;
    offset?: number;
}
export declare class DB {
    private db;
    private dbName;
    private version;
    private stores;
    private constructor();
    static create(name: string, version?: number): DB;
    store(schema: StoreSchema): this;
    open(): Promise<this>;
    close(): this;
    put<T>(storeName: string, value: T, key?: IDBValidKey): Promise<IDBValidKey>;
    add<T>(storeName: string, value: T, key?: IDBValidKey): Promise<IDBValidKey>;
    get<T>(storeName: string, key: IDBValidKey): Promise<T | undefined>;
    getAll<T>(storeName: string, options?: QueryOptions): Promise<T[]>;
    find<T>(storeName: string, indexName: string, value: IDBValidKey): Promise<T[]>;
    delete(storeName: string, key: IDBValidKey): Promise<void>;
    clear(storeName: string): Promise<void>;
    count(storeName: string, key?: IDBValidKey | IDBKeyRange): Promise<number>;
    keys(storeName: string): Promise<IDBValidKey[]>;
    update<T>(storeName: string, key: IDBValidKey, updates: Partial<T>): Promise<T>;
    batch<T>(storeName: string, operations: Array<{
        type: 'put' | 'add' | 'delete';
        value?: T;
        key?: IDBValidKey;
    }>): Promise<void>;
    private transaction;
    static deleteDatabase(name: string): Promise<void>;
    static databases(): Promise<IDBDatabaseInfo[]>;
}
export declare class DBError extends Error {
    constructor(message: string);
}
export {};
