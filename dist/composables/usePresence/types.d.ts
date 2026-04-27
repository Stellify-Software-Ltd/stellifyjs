import type { ComputedRef, Ref } from 'vue';
/**
 * Configuration options for usePresence
 */
export interface PresenceOptions {
    /**
     * Laravel broadcast channel name
     * Convention: project-scoped channels like 'customers' or 'project.{id}'
     */
    channel: string;
    /**
     * Current user's identity - broadcast to other clients
     * id is required; name/avatar/colour are common additions
     */
    user: {
        id: string | number;
        [key: string]: unknown;
    };
    /**
     * Whether to automatically join on mount (default: true)
     */
    autoJoin?: boolean;
    /**
     * Throttle interval for cursor broadcasts in ms (default: 50)
     */
    throttleMs?: number;
    /**
     * WebSocket URL (default: auto-detect from window.location)
     */
    socketUrl?: string;
}
/**
 * Presence user record
 */
export interface PresenceUser {
    /**
     * User ID from config
     */
    id: string | number;
    /**
     * Timestamp when user joined (Date.now())
     */
    joinedAt: number;
    /**
     * Current cursor position (page-relative coordinates)
     */
    cursor: {
        x: number;
        y: number;
    } | null;
    /**
     * What the user is currently focused on (row id, field name, etc.)
     */
    focus: string | null;
    /**
     * Arbitrary metadata broadcast via setMeta()
     */
    meta: Record<string, unknown>;
    /**
     * Additional fields from config user object
     */
    [key: string]: unknown;
}
/**
 * Return type for usePresence
 */
export interface PresenceReturn {
    /**
     * Other users currently present (excluding self)
     */
    users: ComputedRef<PresenceUser[]>;
    /**
     * Current user's own presence record
     */
    self: Ref<PresenceUser | null>;
    /**
     * Call from @mousemove to broadcast cursor position
     */
    cursor: (event: MouseEvent | PointerEvent) => void;
    /**
     * Broadcast what the user is focused on (row id, field, etc.)
     * Pass null to clear focus
     */
    focus: (key: string | null) => void;
    /**
     * Broadcast arbitrary metadata
     * Meta is shallow-merged, not replaced
     */
    setMeta: (meta: Record<string, unknown>) => void;
    /**
     * Whether WebSocket is connected
     */
    isConnected: Ref<boolean>;
    /**
     * Any connection error
     */
    error: Ref<Error | null>;
    /**
     * Manually join channel (auto-called on mount unless autoJoin: false)
     */
    join: () => Promise<void>;
    /**
     * Manually leave channel (auto-called on unmount)
     */
    leave: () => void;
}
/**
 * Internal message types for client broadcasts
 */
export interface CursorMessage {
    id: string | number;
    x: number;
    y: number;
}
export interface FocusMessage {
    id: string | number;
    focus: string | null;
}
export interface MetaMessage {
    id: string | number;
    meta: Record<string, unknown>;
}
/**
 * Pusher presence channel subscription_succeeded payload
 */
export interface SubscriptionSucceededPayload {
    presence: {
        ids: (string | number)[];
        hash: Record<string | number, {
            id: string | number;
            [key: string]: unknown;
        }>;
        count: number;
    };
}
/**
 * Pusher presence channel member_added payload
 */
export interface MemberAddedPayload {
    user_id: string | number;
    user_info: {
        id: string | number;
        [key: string]: unknown;
    };
}
/**
 * Pusher presence channel member_removed payload
 */
export interface MemberRemovedPayload {
    user_id: string | number;
}
