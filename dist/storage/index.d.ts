export declare class Storage {
    private store;
    private prefix;
    private constructor();
    static local(prefix?: string): Storage;
    static session(prefix?: string): Storage;
    private prefixKey;
    set(key: string, value: unknown): Storage;
    get<T = unknown>(key: string, defaultValue?: T): T | null;
    remove(key: string): Storage;
    clear(): Storage;
    has(key: string): boolean;
    keys(): string[];
    getAll(): Record<string, unknown>;
    size(): number;
}
