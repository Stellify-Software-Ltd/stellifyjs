type ChunkCallback = (chunk: string) => void;
type CompleteCallback = (full: string) => void;
type ErrorCallback = (error: StreamError) => void;
export declare class Stream {
    private url;
    private options;
    private state;
    private controller;
    private chunkCallback;
    private completeCallback;
    private errorCallback;
    private constructor();
    static create(url: string): Stream;
    headers(headers: Record<string, string>): this;
    withToken(token: string): this;
    onChunk(callback: ChunkCallback): this;
    onComplete(callback: CompleteCallback): this;
    onError(callback: ErrorCallback): this;
    get(): Promise<string>;
    post(body?: unknown): Promise<string>;
    private request;
    private processChunk;
    private emitChunk;
    abort(): this;
    getBuffer(): string;
    getChunks(): string[];
    isStreaming(): boolean;
    clear(): this;
}
export declare class StreamError extends Error {
    constructor(message: string);
}
export {};
