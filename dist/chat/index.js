export class Chat {
    messages = [];
    maxMessages = null;
    constructor() { }
    static create(options = {}) {
        const chat = new Chat();
        if (options.systemPrompt) {
            chat.addMessage('system', options.systemPrompt);
        }
        if (options.maxMessages) {
            chat.maxMessages = options.maxMessages;
        }
        return chat;
    }
    static fromHistory(messages) {
        const chat = new Chat();
        messages.forEach(m => chat.addMessage(m.role, m.content));
        return chat;
    }
    addMessage(role, content, metadata) {
        const message = {
            id: this.generateId(),
            role,
            content,
            timestamp: Date.now(),
            metadata
        };
        this.messages.push(message);
        this.enforceMaxMessages();
        return this;
    }
    addUser(content) {
        return this.addMessage('user', content);
    }
    addAssistant(content) {
        return this.addMessage('assistant', content);
    }
    addSystem(content) {
        return this.addMessage('system', content);
    }
    getMessage(id) {
        return this.messages.find(m => m.id === id);
    }
    getHistory() {
        return [...this.messages];
    }
    getMessages() {
        return this.messages.map(m => ({ role: m.role, content: m.content }));
    }
    getLastMessage() {
        return this.messages[this.messages.length - 1];
    }
    getLastUserMessage() {
        return [...this.messages].reverse().find(m => m.role === 'user');
    }
    getLastAssistantMessage() {
        return [...this.messages].reverse().find(m => m.role === 'assistant');
    }
    updateMessage(id, content) {
        const message = this.messages.find(m => m.id === id);
        if (message) {
            message.content = content;
            message.timestamp = Date.now();
        }
        return this;
    }
    removeMessage(id) {
        const index = this.messages.findIndex(m => m.id === id);
        if (index !== -1) {
            this.messages.splice(index, 1);
        }
        return this;
    }
    clear() {
        // Keep system messages
        this.messages = this.messages.filter(m => m.role === 'system');
        return this;
    }
    clearAll() {
        this.messages = [];
        return this;
    }
    fork(fromMessageId) {
        const chat = new Chat();
        chat.maxMessages = this.maxMessages;
        if (fromMessageId) {
            const index = this.messages.findIndex(m => m.id === fromMessageId);
            if (index !== -1) {
                chat.messages = this.messages.slice(0, index + 1).map(m => ({ ...m }));
            }
        }
        else {
            chat.messages = this.messages.map(m => ({ ...m }));
        }
        return chat;
    }
    truncate(keepCount) {
        // Always keep system messages at the start
        const systemMessages = this.messages.filter(m => m.role === 'system');
        const nonSystemMessages = this.messages.filter(m => m.role !== 'system');
        this.messages = [
            ...systemMessages,
            ...nonSystemMessages.slice(-keepCount)
        ];
        return this;
    }
    count() {
        return this.messages.length;
    }
    countTokensEstimate() {
        // Rough estimate: 1 token ≈ 4 characters
        return Math.ceil(this.messages.reduce((sum, m) => sum + m.content.length, 0) / 4);
    }
    toJSON() {
        return JSON.stringify(this.messages);
    }
    generateId() {
        return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    }
    enforceMaxMessages() {
        if (this.maxMessages && this.messages.length > this.maxMessages) {
            // Keep system messages, truncate the rest
            const systemMessages = this.messages.filter(m => m.role === 'system');
            const nonSystemMessages = this.messages.filter(m => m.role !== 'system');
            this.messages = [
                ...systemMessages,
                ...nonSystemMessages.slice(-(this.maxMessages - systemMessages.length))
            ];
        }
    }
}
