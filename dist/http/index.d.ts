type HttpOptions = {
    headers?: Record<string, string>;
    params?: Record<string, string>;
    timeout?: number;
};
export declare class Http {
    private baseUrl;
    private defaultHeaders;
    private defaultTimeout;
    private constructor();
    static create(baseUrl?: string, options?: HttpOptions): Http;
    private static defaultInstance;
    static get<T = unknown>(path: string, options?: HttpOptions): Promise<T>;
    static post<T = unknown>(path: string, data?: unknown, options?: HttpOptions): Promise<T>;
    static put<T = unknown>(path: string, data?: unknown, options?: HttpOptions): Promise<T>;
    static patch<T = unknown>(path: string, data?: unknown, options?: HttpOptions): Promise<T>;
    static delete<T = unknown>(path: string, options?: HttpOptions): Promise<T>;
    private getOrigin;
    private buildUrl;
    private request;
    get<T = unknown>(path: string, options?: HttpOptions): Promise<T>;
    post<T = unknown>(path: string, data?: unknown, options?: HttpOptions): Promise<T>;
    put<T = unknown>(path: string, data?: unknown, options?: HttpOptions): Promise<T>;
    patch<T = unknown>(path: string, data?: unknown, options?: HttpOptions): Promise<T>;
    delete<T = unknown>(path: string, options?: HttpOptions): Promise<T>;
    withHeaders(headers: Record<string, string>): Http;
    withToken(token: string): Http;
    withTimeout(ms: number): Http;
}
export declare class HttpError extends Error {
    status: number;
    statusText: string;
    body: string;
    constructor(status: number, statusText: string, body: string);
}
export {};
