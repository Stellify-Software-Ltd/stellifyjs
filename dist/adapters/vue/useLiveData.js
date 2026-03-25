import { ref, shallowRef, onMounted, onUnmounted } from 'vue';
import { Http } from '../../http';
import { Socket } from '../../socket';
import { Collection } from '../../collection';
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
export function useLiveData(endpoint, options = {}) {
    const { channel, event, model, merge = 'prepend', keyField = 'id', transform, immediate = true, socketUrl, http = Http, params = {}, asCollection = true, } = options;
    // State
    const data = shallowRef(asCollection ? Collection.collect([]) : []);
    const loading = ref(false);
    const error = ref(null);
    const connected = ref(false);
    // WebSocket instance
    let socket = null;
    /**
     * Get items as array regardless of storage type
     */
    const getItems = () => {
        const current = data.value;
        if (current instanceof Collection) {
            return current.all();
        }
        return current;
    };
    /**
     * Set items, converting to Collection if needed
     */
    const setItems = (items) => {
        if (asCollection) {
            data.value = Collection.collect(items);
        }
        else {
            data.value = items;
        }
    };
    /**
     * Apply transformation to items if configured
     */
    const transformItems = (items) => {
        if (transform) {
            return items.map(transform);
        }
        return items;
    };
    /**
     * Build URL with query params
     */
    const buildUrl = () => {
        const url = new URL(endpoint, window.location.origin);
        for (const [key, value] of Object.entries(params)) {
            url.searchParams.set(key, String(value));
        }
        return url.pathname + url.search;
    };
    /**
     * Fetch data from server
     */
    const fetchData = async () => {
        loading.value = true;
        error.value = null;
        try {
            const response = await http.get(buildUrl());
            // Handle Laravel API response format
            const items = Array.isArray(response)
                ? response
                : response.data;
            setItems(transformItems(items));
        }
        catch (e) {
            error.value = e instanceof Error ? e : new Error(String(e));
        }
        finally {
            loading.value = false;
        }
    };
    /**
     * Apply merge strategy
     */
    const applyMerge = (eventData) => {
        const current = getItems();
        const incoming = Array.isArray(eventData.data)
            ? eventData.data
            : [eventData.data];
        const transformed = transformItems(incoming);
        let newItems;
        if (typeof merge === 'function') {
            newItems = merge(current, eventData);
        }
        else {
            switch (merge) {
                case 'prepend':
                    newItems = [...transformed, ...current];
                    break;
                case 'append':
                    newItems = [...current, ...transformed];
                    break;
                case 'replace':
                    newItems = transformed;
                    break;
                case 'upsert':
                    newItems = [...current];
                    for (const item of transformed) {
                        const key = item[keyField];
                        const index = newItems.findIndex(i => i[keyField] === key);
                        if (index >= 0) {
                            newItems[index] = { ...newItems[index], ...item };
                        }
                        else {
                            newItems.unshift(item);
                        }
                    }
                    break;
                default:
                    newItems = [...transformed, ...current];
            }
        }
        setItems(newItems);
    };
    /**
     * Handle delete events
     */
    const handleDelete = (eventData) => {
        const current = getItems();
        const toDelete = Array.isArray(eventData.data)
            ? eventData.data
            : [eventData.data];
        const deleteKeys = new Set(toDelete.map(item => item[keyField]));
        const newItems = current.filter(item => !deleteKeys.has(item[keyField]));
        setItems(newItems);
    };
    /**
     * Handle incoming WebSocket event
     */
    const handleEvent = (eventData) => {
        // Check for delete action
        if (eventData.action === 'deleted') {
            handleDelete(eventData);
            return;
        }
        // Apply merge for create/update
        applyMerge(eventData);
    };
    /**
     * Determine WebSocket URL
     */
    const getSocketUrl = () => {
        if (socketUrl) {
            return socketUrl;
        }
        // Auto-detect Reverb WebSocket URL
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        return `${protocol}//${host}/app/reverb`;
    };
    /**
     * Get channel name
     */
    const getChannel = () => {
        if (channel) {
            return channel;
        }
        if (model) {
            const modelName = typeof model === 'string' ? model : model.name;
            const modelConfig = typeof model === 'string' ? null : model;
            if (modelConfig?.channel) {
                return modelConfig.channel;
            }
            // Default: lowercase plural (Post -> posts)
            return modelName.toLowerCase() + 's';
        }
        return null;
    };
    /**
     * Get events to subscribe to
     */
    const getEvents = () => {
        if (event) {
            return [event];
        }
        if (model) {
            const modelName = typeof model === 'string' ? model : model.name;
            return [
                `${modelName}Created`,
                `${modelName}Updated`,
                `${modelName}Deleted`,
            ];
        }
        return [];
    };
    /**
     * Set up WebSocket connection
     */
    const setupSocket = () => {
        const channelName = getChannel();
        const events = getEvents();
        if (!channelName || events.length === 0) {
            return; // No real-time updates configured
        }
        socket = Socket.create(getSocketUrl());
        socket.on('open', () => {
            connected.value = true;
            // Subscribe to channel (Reverb/Pusher protocol)
            socket?.send({
                event: 'pusher:subscribe',
                data: { channel: channelName }
            });
        });
        socket.on('close', () => {
            connected.value = false;
        });
        socket.on('error', () => {
            connected.value = false;
        });
        // Listen for each event
        for (const eventName of events) {
            socket.on(eventName, (eventData) => {
                const typed = eventData;
                // Determine action from event name if not specified
                if (!typed.action) {
                    if (eventName.endsWith('Created')) {
                        typed.action = 'created';
                    }
                    else if (eventName.endsWith('Updated')) {
                        typed.action = 'updated';
                    }
                    else if (eventName.endsWith('Deleted')) {
                        typed.action = 'deleted';
                    }
                }
                handleEvent(typed);
            });
        }
        socket.connect();
    };
    /**
     * Disconnect WebSocket
     */
    const disconnect = () => {
        if (socket) {
            socket.disconnect();
            socket = null;
            connected.value = false;
        }
    };
    /**
     * Reconnect WebSocket
     */
    const reconnect = () => {
        disconnect();
        setupSocket();
    };
    /**
     * Refresh data from server
     */
    const refresh = async () => {
        await fetchData();
    };
    /**
     * Push an item locally
     */
    const push = (item) => {
        const current = getItems();
        setItems([item, ...current]);
    };
    /**
     * Remove an item locally by key
     */
    const remove = (key) => {
        const current = getItems();
        setItems(current.filter(item => item[keyField] !== key));
    };
    /**
     * Update an item locally
     */
    const update = (key, updates) => {
        const current = getItems();
        const index = current.findIndex(item => item[keyField] === key);
        if (index >= 0) {
            const newItems = [...current];
            newItems[index] = { ...newItems[index], ...updates };
            setItems(newItems);
        }
    };
    // Lifecycle
    onMounted(() => {
        if (immediate) {
            fetchData();
        }
        setupSocket();
    });
    onUnmounted(() => {
        disconnect();
    });
    return {
        data: data,
        loading,
        error,
        connected,
        refresh,
        disconnect,
        reconnect,
        push,
        remove,
        update,
    };
}
