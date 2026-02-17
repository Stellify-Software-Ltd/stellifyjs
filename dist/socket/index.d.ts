type SocketCallback = (data: unknown) => void;
type SocketState = 'connecting' | 'open' | 'closing' | 'closed';
interface SocketOptions {
    protocols?: string | string[];
    reconnect?: boolean;
    reconnectInterval?: number;
    maxReconnectAttempts?: number;
}
export declare class Socket {
    private ws;
    private url;
    private options;
    private listeners;
    private reconnectAttempts;
    private shouldReconnect;
    private constructor();
    static create(url: string, options?: SocketOptions): Socket;
    connect(): Socket;
    disconnect(): Socket;
    send(data: unknown): Socket;
    sendEvent(event: string, data?: unknown): Socket;
    on(event: string, callback: SocketCallback): Socket;
    off(event: string, callback: SocketCallback): Socket;
    once(event: string, callback: SocketCallback): Socket;
    private emit;
    private attemptReconnect;
    isConnected(): boolean;
    getState(): SocketState;
}
export {};
