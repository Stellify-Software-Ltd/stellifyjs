type Role = 'system' | 'user' | 'assistant' | 'function' | 'tool';
interface Message {
    id: string;
    role: Role;
    content: string;
    timestamp: number;
    metadata?: Record<string, unknown>;
}
interface ChatOptions {
    systemPrompt?: string;
    maxMessages?: number;
}
export declare class Chat {
    private messages;
    private maxMessages;
    private constructor();
    static create(options?: ChatOptions): Chat;
    static fromHistory(messages: Array<{
        role: Role;
        content: string;
    }>): Chat;
    addMessage(role: Role, content: string, metadata?: Record<string, unknown>): this;
    addUser(content: string): this;
    addAssistant(content: string): this;
    addSystem(content: string): this;
    getMessage(id: string): Message | undefined;
    getHistory(): Message[];
    getMessages(): Array<{
        role: Role;
        content: string;
    }>;
    getLastMessage(): Message | undefined;
    getLastUserMessage(): Message | undefined;
    getLastAssistantMessage(): Message | undefined;
    updateMessage(id: string, content: string): this;
    removeMessage(id: string): this;
    clear(): this;
    clearAll(): this;
    fork(fromMessageId?: string): Chat;
    truncate(keepCount: number): this;
    count(): number;
    countTokensEstimate(): number;
    toJSON(): string;
    private generateId;
    private enforceMaxMessages;
}
export {};
