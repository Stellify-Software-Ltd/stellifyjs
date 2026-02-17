export class Stream {
    url;
    options;
    state;
    controller = null;
    chunkCallback = null;
    completeCallback = null;
    errorCallback = null;
    constructor(url) {
        this.url = url;
        this.options = {};
        this.state = {
            buffer: '',
            chunks: [],
            isStreaming: false
        };
    }
    static create(url) {
        return new Stream(url);
    }
    headers(headers) {
        this.options.headers = { ...this.options.headers, ...headers };
        return this;
    }
    withToken(token) {
        return this.headers({ Authorization: `Bearer ${token}` });
    }
    onChunk(callback) {
        this.chunkCallback = callback;
        return this;
    }
    onComplete(callback) {
        this.completeCallback = callback;
        return this;
    }
    onError(callback) {
        this.errorCallback = callback;
        return this;
    }
    async get() {
        return this.request('GET');
    }
    async post(body) {
        return this.request('POST', body);
    }
    async request(method, body) {
        this.controller = new AbortController();
        this.state = { buffer: '', chunks: [], isStreaming: true };
        try {
            const response = await fetch(this.url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'text/event-stream',
                    ...this.options.headers
                },
                body: body ? JSON.stringify(body) : undefined,
                signal: this.controller.signal
            });
            if (!response.ok) {
                throw new StreamError(`HTTP ${response.status}: ${response.statusText}`);
            }
            if (!response.body) {
                throw new StreamError('Response body is not available');
            }
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    break;
                }
                const text = decoder.decode(value, { stream: true });
                this.processChunk(text);
            }
            this.state.isStreaming = false;
            this.completeCallback?.(this.state.buffer);
            return this.state.buffer;
        }
        catch (error) {
            this.state.isStreaming = false;
            if (error instanceof Error && error.name === 'AbortError') {
                return this.state.buffer;
            }
            const streamError = error instanceof StreamError
                ? error
                : new StreamError(error instanceof Error ? error.message : 'Stream failed');
            this.errorCallback?.(streamError);
            throw streamError;
        }
    }
    processChunk(text) {
        // Handle SSE format (data: ...\n\n)
        const lines = text.split('\n');
        for (const line of lines) {
            if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') {
                    continue;
                }
                try {
                    // Try to parse as JSON (OpenAI format)
                    const parsed = JSON.parse(data);
                    const content = parsed.choices?.[0]?.delta?.content
                        || parsed.delta?.text
                        || parsed.text
                        || data;
                    if (content) {
                        this.emitChunk(content);
                    }
                }
                catch {
                    // Not JSON, emit raw data
                    this.emitChunk(data);
                }
            }
            else if (line.trim() && !line.startsWith(':')) {
                // Plain text streaming (not SSE)
                this.emitChunk(line);
            }
        }
    }
    emitChunk(chunk) {
        this.state.chunks.push(chunk);
        this.state.buffer += chunk;
        this.chunkCallback?.(chunk);
    }
    abort() {
        this.controller?.abort();
        this.state.isStreaming = false;
        return this;
    }
    getBuffer() {
        return this.state.buffer;
    }
    getChunks() {
        return [...this.state.chunks];
    }
    isStreaming() {
        return this.state.isStreaming;
    }
    clear() {
        this.state = { buffer: '', chunks: [], isStreaming: false };
        return this;
    }
}
export class StreamError extends Error {
    constructor(message) {
        super(message);
        this.name = 'StreamError';
    }
}
