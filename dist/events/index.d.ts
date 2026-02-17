type EventCallback = (...args: unknown[]) => void;
export declare class Events {
    private listeners;
    private constructor();
    static create(): Events;
    on(event: string, callback: EventCallback): Events;
    off(event: string, callback: EventCallback): Events;
    once(event: string, callback: EventCallback): Events;
    emit(event: string, ...args: unknown[]): Events;
    clear(event?: string): Events;
    listenerCount(event: string): number;
    eventNames(): string[];
}
export {};
