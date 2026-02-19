export class Http {
    baseUrl;
    defaultHeaders;
    defaultTimeout;
    constructor(baseUrl = '', options = {}) {
        this.baseUrl = baseUrl;
        this.defaultHeaders = options.headers || {};
        this.defaultTimeout = options.timeout || 30000;
    }
    static create(baseUrl = '', options = {}) {
        return new Http(baseUrl, options);
    }
    getOrigin() {
        // Handle iframe contexts where window.location.origin might be 'null' or unavailable
        try {
            const origin = window.location.origin;
            if (origin && origin !== 'null') {
                return origin;
            }
            // Try parent window if we're in an iframe
            if (window.parent && window.parent !== window) {
                const parentOrigin = window.parent.location.origin;
                if (parentOrigin && parentOrigin !== 'null') {
                    return parentOrigin;
                }
            }
        }
        catch {
            // Cross-origin iframe - can't access parent
        }
        // Fallback: construct from protocol + host
        return `${window.location.protocol}//${window.location.host}`;
    }
    buildUrl(path, params) {
        const origin = this.getOrigin();
        // If baseUrl is a relative path, prepend the origin
        let base = this.baseUrl;
        if (base && !base.startsWith('http://') && !base.startsWith('https://')) {
            base = origin + base;
        }
        const url = new URL(path || '', base || origin);
        if (params) {
            for (const [key, value] of Object.entries(params)) {
                url.searchParams.set(key, value);
            }
        }
        return url.toString();
    }
    async request(path, options) {
        const url = this.buildUrl(path, options.params);
        const headers = {
            ...this.defaultHeaders,
            ...options.headers
        };
        if (options.body && typeof options.body === 'object') {
            headers['Content-Type'] = 'application/json';
        }
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), options.timeout || this.defaultTimeout);
        try {
            const response = await fetch(url, {
                method: options.method,
                headers,
                body: options.body ? JSON.stringify(options.body) : undefined,
                signal: controller.signal
            });
            clearTimeout(timeout);
            if (!response.ok) {
                throw new HttpError(response.status, response.statusText, await response.text());
            }
            const contentType = response.headers.get('content-type');
            if (contentType?.includes('application/json')) {
                return response.json();
            }
            return response.text();
        }
        catch (error) {
            clearTimeout(timeout);
            if (error instanceof HttpError) {
                throw error;
            }
            if (error instanceof Error && error.name === 'AbortError') {
                throw new HttpError(408, 'Request Timeout', 'Request timed out');
            }
            throw error;
        }
    }
    async get(path, options = {}) {
        return this.request(path, { ...options, method: 'GET' });
    }
    async post(path, data, options = {}) {
        return this.request(path, { ...options, method: 'POST', body: data });
    }
    async put(path, data, options = {}) {
        return this.request(path, { ...options, method: 'PUT', body: data });
    }
    async patch(path, data, options = {}) {
        return this.request(path, { ...options, method: 'PATCH', body: data });
    }
    async delete(path, options = {}) {
        return this.request(path, { ...options, method: 'DELETE' });
    }
    withHeaders(headers) {
        return new Http(this.baseUrl, {
            headers: { ...this.defaultHeaders, ...headers },
            timeout: this.defaultTimeout
        });
    }
    withToken(token) {
        return this.withHeaders({ Authorization: `Bearer ${token}` });
    }
    withTimeout(ms) {
        return new Http(this.baseUrl, {
            headers: this.defaultHeaders,
            timeout: ms
        });
    }
}
export class HttpError extends Error {
    status;
    statusText;
    body;
    constructor(status, statusText, body) {
        super(`${status} ${statusText}`);
        this.name = 'HttpError';
        this.status = status;
        this.statusText = statusText;
        this.body = body;
    }
}
