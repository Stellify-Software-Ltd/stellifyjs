import { ref, computed, readonly, shallowRef } from 'vue';
/**
 * Vue composable for chat/conversation state management.
 *
 * Provides reactive message history for LLM conversations.
 * Supports forking, truncation, and message manipulation.
 *
 * @example
 * ```vue
 * <script setup>
 * import { useChat } from 'stellify-framework'
 *
 * const chat = useChat({
 *   systemPrompt: 'You are a helpful assistant.',
 *   maxMessages: 50,
 * })
 *
 * // Add messages
 * chat.addUser('What is 2+2?')
 * chat.addAssistant('4')
 *
 * // Get messages for API call
 * const messages = chat.getMessages()
 * </script>
 *
 * <template>
 *   <div v-for="msg in chat.history" :key="msg.id">
 *     <strong>{{ msg.role }}:</strong> {{ msg.content }}
 *   </div>
 * </template>
 * ```
 */
export function useChat(options = {}) {
    const { systemPrompt, maxMessages = null } = options;
    // Reactive state
    const messages = shallowRef([]);
    const maxMessagesRef = ref(maxMessages);
    // Helper to generate IDs
    const generateId = () => {
        return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    };
    // Helper to enforce max messages
    const enforceMaxMessages = () => {
        if (maxMessagesRef.value && messages.value.length > maxMessagesRef.value) {
            const systemMessages = messages.value.filter(m => m.role === 'system');
            const nonSystemMessages = messages.value.filter(m => m.role !== 'system');
            messages.value = [
                ...systemMessages,
                ...nonSystemMessages.slice(-(maxMessagesRef.value - systemMessages.length))
            ];
        }
    };
    /**
     * Add a message with any role
     */
    const addMessage = (role, content, metadata) => {
        const message = {
            id: generateId(),
            role,
            content,
            timestamp: Date.now(),
            metadata
        };
        messages.value = [...messages.value, message];
        enforceMaxMessages();
        return chatReturn;
    };
    /**
     * Add a user message
     */
    const addUser = (content) => {
        return addMessage('user', content);
    };
    /**
     * Add an assistant message
     */
    const addAssistant = (content) => {
        return addMessage('assistant', content);
    };
    /**
     * Add a system message
     */
    const addSystem = (content) => {
        return addMessage('system', content);
    };
    /**
     * Get a message by ID
     */
    const getMessage = (id) => {
        return messages.value.find(m => m.id === id);
    };
    /**
     * Get full message history with metadata
     */
    const getHistory = () => {
        return [...messages.value];
    };
    /**
     * Get messages in API-compatible format
     */
    const getMessages = () => {
        return messages.value.map(m => ({ role: m.role, content: m.content }));
    };
    /**
     * Get the last message
     */
    const getLastMessage = () => {
        return messages.value[messages.value.length - 1];
    };
    /**
     * Get the last user message
     */
    const getLastUserMessage = () => {
        return [...messages.value].reverse().find(m => m.role === 'user');
    };
    /**
     * Get the last assistant message
     */
    const getLastAssistantMessage = () => {
        return [...messages.value].reverse().find(m => m.role === 'assistant');
    };
    /**
     * Update a message's content
     */
    const updateMessage = (id, content) => {
        const index = messages.value.findIndex(m => m.id === id);
        if (index !== -1) {
            const newMessages = [...messages.value];
            newMessages[index] = {
                ...newMessages[index],
                content,
                timestamp: Date.now()
            };
            messages.value = newMessages;
        }
        return chatReturn;
    };
    /**
     * Remove a message by ID
     */
    const removeMessage = (id) => {
        messages.value = messages.value.filter(m => m.id !== id);
        return chatReturn;
    };
    /**
     * Clear all messages except system messages
     */
    const clear = () => {
        messages.value = messages.value.filter(m => m.role === 'system');
        return chatReturn;
    };
    /**
     * Clear all messages including system messages
     */
    const clearAll = () => {
        messages.value = [];
        return chatReturn;
    };
    /**
     * Fork the conversation, optionally from a specific message
     */
    const fork = (fromMessageId) => {
        const forkedChat = useChat({ maxMessages: maxMessagesRef.value ?? undefined });
        if (fromMessageId) {
            const index = messages.value.findIndex(m => m.id === fromMessageId);
            if (index !== -1) {
                const forkedMessages = messages.value.slice(0, index + 1).map(m => ({ ...m, id: generateId() }));
                forkedMessages.forEach(m => forkedChat.addMessage(m.role, m.content, m.metadata));
            }
        }
        else {
            messages.value.forEach(m => forkedChat.addMessage(m.role, m.content, m.metadata));
        }
        return forkedChat;
    };
    /**
     * Truncate to keep only the last N non-system messages
     */
    const truncate = (keepCount) => {
        const systemMessages = messages.value.filter(m => m.role === 'system');
        const nonSystemMessages = messages.value.filter(m => m.role !== 'system');
        messages.value = [
            ...systemMessages,
            ...nonSystemMessages.slice(-keepCount)
        ];
        return chatReturn;
    };
    /**
     * Get message count
     */
    const count = () => {
        return messages.value.length;
    };
    /**
     * Estimate token count (rough: 1 token ~ 4 chars)
     */
    const countTokensEstimate = () => {
        return Math.ceil(messages.value.reduce((sum, m) => sum + m.content.length, 0) / 4);
    };
    /**
     * Serialize messages to JSON
     */
    const toJSON = () => {
        return JSON.stringify(messages.value);
    };
    // Computed values
    const history = computed(() => messages.value);
    const messageCount = computed(() => messages.value.length);
    const isEmpty = computed(() => messages.value.length === 0);
    // Initialize with system prompt if provided
    if (systemPrompt) {
        addMessage('system', systemPrompt);
    }
    const chatReturn = {
        // Methods (same surface as old Chat class)
        addMessage,
        addUser,
        addAssistant,
        addSystem,
        getMessage,
        getHistory,
        getMessages,
        getLastMessage,
        getLastUserMessage,
        getLastAssistantMessage,
        updateMessage,
        removeMessage,
        clear,
        clearAll,
        fork,
        truncate,
        count,
        countTokensEstimate,
        toJSON,
        // Reactive state (new - Vue composable style)
        history,
        messages: readonly(messages),
        messageCount,
        isEmpty,
    };
    return chatReturn;
}
/**
 * Create a chat from existing message history
 */
export function useChatFromHistory(messageHistory, options = {}) {
    const chat = useChat(options);
    messageHistory.forEach(m => chat.addMessage(m.role, m.content));
    return chat;
}
