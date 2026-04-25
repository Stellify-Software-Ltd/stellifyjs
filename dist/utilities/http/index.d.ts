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
    /**
     * Fetch paginated data and return just the items array.
     * Automatically extracts .data from Laravel-style paginated responses.
     *
     * @example
     * // Instead of: const response = await Http.get('/api/notes'); notes.value = response.data;
     * // Use: notes.value = await Http.items('/api/notes');
     */
    static items<T = unknown>(path: string, options?: HttpOptions): Promise<T[]>;
    /**
     * Instance method for fetching paginated items
     */
    items<T = unknown>(path: string, options?: HttpOptions): Promise<T[]>;
    /**
     * Create a resource and return just the created item.
     * Automatically extracts .data from Laravel-style responses.
     *
     * @example
     * // Instead of: const response = await Http.post('/api/notes', data); notes.unshift(response.data);
     * // Use: const note = await Http.store('/api/notes', data); notes.unshift(note);
     */
    static store<T = unknown>(path: string, data?: unknown, options?: HttpOptions): Promise<T>;
    /**
     * Instance method for creating a resource
     */
    store<T = unknown>(path: string, data?: unknown, options?: HttpOptions): Promise<T>;
    /**
     * Update a resource and return just the updated item.
     * Automatically extracts .data from Laravel-style responses.
     *
     * @example
     * // Instead of: const response = await Http.put('/api/notes/1', data); Object.assign(note, response.data);
     * // Use: const updated = await Http.update('/api/notes/1', data); Object.assign(note, updated);
     */
    static update<T = unknown>(path: string, data?: unknown, options?: HttpOptions): Promise<T>;
    /**
     * Instance method for updating a resource
     */
    update<T = unknown>(path: string, data?: unknown, options?: HttpOptions): Promise<T>;
    /**
     * Delete a resource and return the response data (if any).
     * Automatically extracts .data from Laravel-style responses.
     *
     * @example
     * // Instead of: await Http.delete('/api/notes/1');
     * // Use: await Http.destroy('/api/notes/1');
     */
    static destroy<T = unknown>(path: string, options?: HttpOptions): Promise<T | null>;
    /**
     * Instance method for deleting a resource
     */
    destroy<T = unknown>(path: string, options?: HttpOptions): Promise<T | null>;
}
export declare class HttpError extends Error {
    status: number;
    statusText: string;
    body: string;
    constructor(status: number, statusText: string, body: string);
}
export {};
