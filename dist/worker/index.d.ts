type MessageHandler<T = unknown, R = unknown> = (data: T) => R | Promise<R>;
export declare class Worker {
    private worker;
    private tasks;
    private messageHandler;
    private errorHandler;
    private isTerminated;
    private constructor();
    static create(scriptUrl: string): Worker;
    static fromFunction(fn: Function): Worker;
    static fromCode(code: string): Worker;
    private setupListeners;
    run<T = unknown, R = unknown>(data: T): Promise<R>;
    post(data: unknown): this;
    onMessage<T = unknown>(handler: MessageHandler<T>): this;
    onError(handler: (error: Error) => void): this;
    terminate(): this;
    isRunning(): boolean;
    getPendingCount(): number;
    private generateId;
}
export declare class WorkerPool {
    private size;
    private createWorker;
    private workers;
    private queue;
    private activeCount;
    private constructor();
    static create(size: number, scriptUrl: string): WorkerPool;
    static fromFunction(size: number, fn: Function): WorkerPool;
    run<T = unknown, R = unknown>(data: T): Promise<R>;
    private processQueue;
    map<T, R>(items: T[]): Promise<R[]>;
    terminate(): this;
    getSize(): number;
    getActiveCount(): number;
    getQueueLength(): number;
}
export declare class WorkerError extends Error {
    constructor(message: string);
}
export {};
