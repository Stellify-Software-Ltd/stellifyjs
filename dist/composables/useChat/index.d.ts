type Role = 'system' | 'user' | 'assistant' | 'function' | 'tool';
interface Message {
    id: string;
    role: Role;
    content: string;
    timestamp: number;
    metadata?: Record<string, unknown>;
}
/**
 * Options for useChat
 */
export interface ChatOptions {
    systemPrompt?: string;
    maxMessages?: number;
}
/**
 * Return type for useChat
 */
export interface ChatReturn {
    addMessage: (role: Role, content: string, metadata?: Record<string, unknown>) => ChatReturn;
    addUser: (content: string) => ChatReturn;
    addAssistant: (content: string) => ChatReturn;
    addSystem: (content: string) => ChatReturn;
    getMessage: (id: string) => Message | undefined;
    getHistory: () => Message[];
    getMessages: () => Array<{
        role: Role;
        content: string;
    }>;
    getLastMessage: () => Message | undefined;
    getLastUserMessage: () => Message | undefined;
    getLastAssistantMessage: () => Message | undefined;
    updateMessage: (id: string, content: string) => ChatReturn;
    removeMessage: (id: string) => ChatReturn;
    clear: () => ChatReturn;
    clearAll: () => ChatReturn;
    fork: (fromMessageId?: string) => ChatReturn;
    truncate: (keepCount: number) => ChatReturn;
    count: () => number;
    countTokensEstimate: () => number;
    toJSON: () => string;
    history: import('vue').ComputedRef<Message[]>;
    messages: Readonly<import('vue').ShallowRef<readonly Message[]>>;
    messageCount: import('vue').ComputedRef<number>;
    isEmpty: import('vue').ComputedRef<boolean>;
}
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
export declare function useChat(options?: ChatOptions): ChatReturn;
/**
 * Create a chat from existing message history
 */
export declare function useChatFromHistory(messageHistory: Array<{
    role: Role;
    content: string;
}>, options?: ChatOptions): ChatReturn;
export {};
