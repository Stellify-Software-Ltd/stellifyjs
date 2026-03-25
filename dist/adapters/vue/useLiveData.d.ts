import { type Ref } from 'vue';
import { Http } from '../../http';
import { Collection } from '../../collection';
/**
 * Merge strategies for incoming WebSocket events
 */
type MergeStrategy<T> = 'prepend' | 'append' | 'replace' | 'upsert' | ((current: T[], event: WebSocketEvent<T>) => T[]);
/**
 * WebSocket event structure
 */
interface WebSocketEvent<T> {
    type?: string;
    event?: string;
    data: T | T[];
    action?: 'created' | 'updated' | 'deleted';
}
/**
 * Model event configuration for automatic CRUD subscriptions
 */
interface ModelConfig {
    /**
     * Model name (e.g., 'Post', 'Comment')
     * Subscribes to {Model}Created, {Model}Updated, {Model}Deleted events
     */
    name: string;
    /**
     * Channel name (defaults to lowercase plural: 'posts', 'comments')
     */
    channel?: string;
}
/**
 * Options for useLiveData
 */
interface LiveDataOptions<T> {
    /**
     * WebSocket channel to subscribe to
     */
    channel?: string;
    /**
     * Specific event name to listen for
     */
    event?: string;
    /**
     * Model configuration for automatic CRUD event handling
     */
    model?: string | ModelConfig;
    /**
     * How to merge incoming events with current data
     */
    merge?: MergeStrategy<T>;
    /**
     * Key field for upsert/delete operations (default: 'id')
     */
    keyField?: keyof T;
    /**
     * Transform data after fetching or receiving events
     */
    transform?: (item: unknown) => T;
    /**
     * Whether to fetch data immediately on mount (default: true)
     */
    immediate?: boolean;
    /**
     * WebSocket URL (default: auto-detect from window.location)
     */
    socketUrl?: string;
    /**
     * Custom HTTP instance
     */
    http?: typeof Http;
    /**
     * Custom params for initial HTTP request
     */
    params?: Record<string, string | number | boolean>;
    /**
     * Return data as Collection instead of array (default: true)
     */
    asCollection?: boolean;
}
/**
 * Return type for useLiveData
 */
interface LiveDataReturn<T> {
    /**
     * The reactive data (Collection or array based on options)
     */
    data: Ref<Collection<T> | T[]>;
    /**
     * Whether initial load is in progress
     */
    loading: Ref<boolean>;
    /**
     * Any error that occurred
     */
    error: Ref<Error | null>;
    /**
     * Whether WebSocket is connected
     */
    connected: Ref<boolean>;
    /**
     * Manually refresh data from the server
     */
    refresh: () => Promise<void>;
    /**
     * Manually disconnect WebSocket
     */
    disconnect: () => void;
    /**
     * Manually reconnect WebSocket
     */
    reconnect: () => void;
    /**
     * Push an item locally (without server)
     */
    push: (item: T) => void;
    /**
     * Remove an item locally by key
     */
    remove: (key: unknown) => void;
    /**
     * Update an item locally
     */
    update: (key: unknown, updates: Partial<T>) => void;
}
/**
 * Live data composable for Vue 3
 *
 * Fetches data via HTTP and keeps it synchronized via WebSocket.
 * Works with Laravel Echo/Reverb broadcasting out of the box.
 *
 * @example
 * ```vue
 * <script setup>
 * import { useLiveData } from 'stellify-framework'
 *
 * // Simple usage with model auto-subscription
 * const { data, loading } = useLiveData('/api/notifications', {
 *   model: 'Notification',  // Subscribes to NotificationCreated, etc.
 * })
 *
 * // Custom channel and event
 * const { data: messages } = useLiveData('/api/messages', {
 *   channel: 'chat.room.1',
 *   event: 'MessageSent',
 *   merge: 'append',
 * })
 *
 * // Custom merge function
 * const { data: feed } = useLiveData('/api/feed', {
 *   channel: 'feed',
 *   event: 'NewPost',
 *   merge: (current, event) => [event.data, ...current].slice(0, 50),
 * })
 * </script>
 * ```
 */
export declare function useLiveData<T = unknown>(endpoint: string, options?: LiveDataOptions<T>): LiveDataReturn<T>;
export {};
