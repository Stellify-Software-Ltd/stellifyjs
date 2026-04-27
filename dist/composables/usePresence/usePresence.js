import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { PresenceChannel } from './channel';
import { throttle } from './throttle';
/**
 * Real-time collaborative presence composable
 *
 * Enables seeing who else is on a page, where their cursor is, and what they're focused on.
 * Works with Laravel Reverb / Pusher presence channels.
 *
 * @example
 * ```vue
 * <script setup>
 * import { usePresence } from 'stellify-framework'
 *
 * const { users, cursor, focus } = usePresence({
 *   channel: 'customers',
 *   user: { id: currentUser.id, name: currentUser.name },
 * })
 * </script>
 *
 * <template>
 *   <div @mousemove="cursor" class="relative">
 *     <div v-for="row in rows" :key="row.id"
 *          @mouseenter="focus(row.id)"
 *          @mouseleave="focus(null)">
 *       {{ row.name }}
 *     </div>
 *     <UserCursor v-for="user in users" :key="user.id" :user="user" />
 *   </div>
 * </template>
 * ```
 */
export function usePresence(options) {
    const { autoJoin = true, throttleMs = 50, } = options;
    // Internal state
    const usersMap = ref(new Map());
    const self = ref(null);
    const isConnected = ref(false);
    const error = ref(null);
    // Channel instance
    let channel = null;
    // Current state for reconnection
    let currentFocus = null;
    let currentMeta = {};
    /**
     * Computed: other users (excludes self)
     */
    const users = computed(() => {
        return Array.from(usersMap.value.values());
    });
    /**
     * Create channel with handlers
     */
    const createChannel = () => {
        return new PresenceChannel(options, {
            onSubscribed: (members, selfUser) => {
                usersMap.value = members;
                self.value = selfUser;
                // Re-broadcast current state on reconnection
                if (currentFocus !== null) {
                    channel?.whisperFocus(currentFocus);
                }
                if (Object.keys(currentMeta).length > 0) {
                    channel?.whisperMeta(currentMeta);
                }
            },
            onMemberAdded: (user) => {
                usersMap.value.set(user.id, user);
                // Trigger reactivity
                usersMap.value = new Map(usersMap.value);
            },
            onMemberRemoved: (userId) => {
                usersMap.value.delete(userId);
                // Trigger reactivity
                usersMap.value = new Map(usersMap.value);
            },
            onCursor: (message) => {
                const user = usersMap.value.get(message.id);
                if (user) {
                    user.cursor = { x: message.x, y: message.y };
                    // Trigger reactivity
                    usersMap.value = new Map(usersMap.value);
                }
            },
            onFocus: (message) => {
                const user = usersMap.value.get(message.id);
                if (user) {
                    user.focus = message.focus;
                    // Trigger reactivity
                    usersMap.value = new Map(usersMap.value);
                }
            },
            onMeta: (message) => {
                const user = usersMap.value.get(message.id);
                if (user) {
                    // Shallow merge meta
                    user.meta = { ...user.meta, ...message.meta };
                    // Trigger reactivity
                    usersMap.value = new Map(usersMap.value);
                }
            },
            onConnected: () => {
                isConnected.value = true;
                error.value = null;
            },
            onDisconnected: () => {
                isConnected.value = false;
            },
            onError: (err) => {
                error.value = err;
            },
        });
    };
    /**
     * Join the presence channel
     */
    const join = async () => {
        if (channel) {
            return;
        }
        channel = createChannel();
        await channel.connect();
    };
    /**
     * Leave the presence channel
     */
    const leave = () => {
        if (!channel) {
            return;
        }
        channel.disconnect();
        channel = null;
        usersMap.value = new Map();
        self.value = null;
        isConnected.value = false;
        currentFocus = null;
        currentMeta = {};
    };
    /**
     * Throttled cursor broadcast
     */
    const cursorThrottled = throttle((x, y) => {
        channel?.whisperCursor(x, y);
        // Update self cursor
        if (self.value) {
            self.value.cursor = { x, y };
        }
    }, throttleMs);
    /**
     * Handle cursor event (from @mousemove)
     */
    const cursor = (event) => {
        cursorThrottled(event.clientX, event.clientY);
    };
    /**
     * Broadcast focus state
     */
    const focus = (key) => {
        currentFocus = key;
        channel?.whisperFocus(key);
        // Update self focus
        if (self.value) {
            self.value.focus = key;
        }
    };
    /**
     * Broadcast meta state (shallow merge)
     */
    const setMeta = (meta) => {
        currentMeta = { ...currentMeta, ...meta };
        channel?.whisperMeta(meta);
        // Update self meta
        if (self.value) {
            self.value.meta = { ...self.value.meta, ...meta };
        }
    };
    // Watch for reconnection
    watch(isConnected, (connected, wasConnected) => {
        // On reconnection (was disconnected, now connected)
        if (connected && wasConnected === false && channel) {
            // State is re-broadcast in onSubscribed handler
        }
    });
    // Lifecycle
    onMounted(() => {
        if (autoJoin) {
            join();
        }
    });
    onUnmounted(() => {
        leave();
    });
    return {
        users,
        self,
        cursor,
        focus,
        setMeta,
        isConnected,
        error,
        join,
        leave,
    };
}
