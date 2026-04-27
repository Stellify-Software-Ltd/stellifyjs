import type { PresenceUser, PresenceOptions, CursorMessage, FocusMessage, MetaMessage } from './types';
/**
 * Channel event handlers interface
 */
export interface ChannelHandlers {
    onSubscribed: (members: Map<string | number, PresenceUser>, self: PresenceUser) => void;
    onMemberAdded: (user: PresenceUser) => void;
    onMemberRemoved: (userId: string | number) => void;
    onCursor: (message: CursorMessage) => void;
    onFocus: (message: FocusMessage) => void;
    onMeta: (message: MetaMessage) => void;
    onConnected: () => void;
    onDisconnected: () => void;
    onError: (error: Error) => void;
}
/**
 * Presence channel manager
 * Handles channel subscription, message routing, and client broadcasts
 */
export declare class PresenceChannel {
    private socket;
    private channelName;
    private user;
    private handlers;
    private socketUrl;
    private isSubscribed;
    constructor(options: PresenceOptions, handlers: ChannelHandlers);
    /**
     * Auto-detect Reverb WebSocket URL
     */
    private getDefaultSocketUrl;
    /**
     * Connect to socket and subscribe to presence channel
     */
    connect(): Promise<void>;
    /**
     * Disconnect and cleanup
     */
    disconnect(): void;
    /**
     * Check if connected
     */
    isConnected(): boolean;
    /**
     * Broadcast cursor position to channel
     */
    whisperCursor(x: number, y: number): void;
    /**
     * Broadcast focus state to channel
     */
    whisperFocus(focus: string | null): void;
    /**
     * Broadcast meta state to channel
     */
    whisperMeta(meta: Record<string, unknown>): void;
    /**
     * Handle socket connection opened
     */
    private handleOpen;
    /**
     * Handle socket connection closed
     */
    private handleClose;
    /**
     * Handle socket error
     */
    private handleError;
    /**
     * Handle successful channel subscription
     */
    private handleSubscribed;
    /**
     * Handle member joining channel
     */
    private handleMemberAdded;
    /**
     * Handle member leaving channel
     */
    private handleMemberRemoved;
    /**
     * Handle cursor broadcast from another user
     */
    private handleCursor;
    /**
     * Handle focus broadcast from another user
     */
    private handleFocus;
    /**
     * Handle meta broadcast from another user
     */
    private handleMeta;
    /**
     * Create a PresenceUser from user info
     */
    private createPresenceUser;
}
