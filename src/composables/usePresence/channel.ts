import { Socket } from '../../utilities/socket'
import type {
  PresenceUser,
  PresenceOptions,
  CursorMessage,
  FocusMessage,
  MetaMessage,
  SubscriptionSucceededPayload,
  MemberAddedPayload,
  MemberRemovedPayload,
} from './types'

/**
 * Channel event handlers interface
 */
export interface ChannelHandlers {
  onSubscribed: (members: Map<string | number, PresenceUser>, self: PresenceUser) => void
  onMemberAdded: (user: PresenceUser) => void
  onMemberRemoved: (userId: string | number) => void
  onCursor: (message: CursorMessage) => void
  onFocus: (message: FocusMessage) => void
  onMeta: (message: MetaMessage) => void
  onConnected: () => void
  onDisconnected: () => void
  onError: (error: Error) => void
}

/**
 * Presence channel manager
 * Handles channel subscription, message routing, and client broadcasts
 */
export class PresenceChannel {
  private socket: Socket | null = null
  private channelName: string
  private user: PresenceOptions['user']
  private handlers: ChannelHandlers
  private socketUrl: string
  private isSubscribed = false

  constructor(
    options: PresenceOptions,
    handlers: ChannelHandlers
  ) {
    this.channelName = `presence-${options.channel}`
    this.user = options.user
    this.handlers = handlers
    this.socketUrl = options.socketUrl || this.getDefaultSocketUrl()
  }

  /**
   * Auto-detect Reverb WebSocket URL
   */
  private getDefaultSocketUrl(): string {
    if (typeof window === 'undefined') {
      return 'ws://localhost/app/reverb'
    }
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host
    return `${protocol}//${host}/app/reverb`
  }

  /**
   * Connect to socket and subscribe to presence channel
   */
  async connect(): Promise<void> {
    if (this.socket) {
      return
    }

    this.socket = Socket.create(this.socketUrl)

    // Connection lifecycle
    this.socket.on('open', this.handleOpen)
    this.socket.on('close', this.handleClose)
    this.socket.on('error', this.handleError)

    // Presence channel events
    this.socket.on('pusher:subscription_succeeded', this.handleSubscribed)
    this.socket.on('pusher_internal:member_added', this.handleMemberAdded)
    this.socket.on('pusher_internal:member_removed', this.handleMemberRemoved)

    // Client-broadcast events
    this.socket.on('client-cursor', this.handleCursor)
    this.socket.on('client-focus', this.handleFocus)
    this.socket.on('client-meta', this.handleMeta)

    this.socket.connect()
  }

  /**
   * Disconnect and cleanup
   */
  disconnect(): void {
    if (!this.socket) {
      return
    }

    // Unsubscribe from channel
    if (this.isSubscribed) {
      this.socket.send({
        event: 'pusher:unsubscribe',
        data: { channel: this.channelName }
      })
    }

    // Remove listeners
    this.socket.off('open', this.handleOpen)
    this.socket.off('close', this.handleClose)
    this.socket.off('error', this.handleError)
    this.socket.off('pusher:subscription_succeeded', this.handleSubscribed)
    this.socket.off('pusher_internal:member_added', this.handleMemberAdded)
    this.socket.off('pusher_internal:member_removed', this.handleMemberRemoved)
    this.socket.off('client-cursor', this.handleCursor)
    this.socket.off('client-focus', this.handleFocus)
    this.socket.off('client-meta', this.handleMeta)

    this.socket.disconnect()
    this.socket = null
    this.isSubscribed = false
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.isConnected() ?? false
  }

  /**
   * Broadcast cursor position to channel
   */
  whisperCursor(x: number, y: number): void {
    if (!this.socket?.isConnected() || !this.isSubscribed) {
      return
    }

    this.socket.send({
      event: 'client-cursor',
      channel: this.channelName,
      data: { id: this.user.id, x, y }
    })
  }

  /**
   * Broadcast focus state to channel
   */
  whisperFocus(focus: string | null): void {
    if (!this.socket?.isConnected() || !this.isSubscribed) {
      return
    }

    this.socket.send({
      event: 'client-focus',
      channel: this.channelName,
      data: { id: this.user.id, focus }
    })
  }

  /**
   * Broadcast meta state to channel
   */
  whisperMeta(meta: Record<string, unknown>): void {
    if (!this.socket?.isConnected() || !this.isSubscribed) {
      return
    }

    this.socket.send({
      event: 'client-meta',
      channel: this.channelName,
      data: { id: this.user.id, meta }
    })
  }

  /**
   * Handle socket connection opened
   */
  private handleOpen = (): void => {
    this.handlers.onConnected()

    // Subscribe to presence channel with auth
    this.socket?.send({
      event: 'pusher:subscribe',
      data: {
        channel: this.channelName,
        auth: { user: this.user }
      }
    })
  }

  /**
   * Handle socket connection closed
   */
  private handleClose = (): void => {
    this.isSubscribed = false
    this.handlers.onDisconnected()
  }

  /**
   * Handle socket error
   */
  private handleError = (data: unknown): void => {
    const error = data instanceof Error
      ? data
      : new Error(typeof data === 'string' ? data : 'Socket error')
    this.handlers.onError(error)
  }

  /**
   * Handle successful channel subscription
   */
  private handleSubscribed = (data: unknown): void => {
    this.isSubscribed = true
    const payload = data as SubscriptionSucceededPayload

    // Build members map from subscription data
    const members = new Map<string | number, PresenceUser>()
    let self: PresenceUser | null = null

    if (payload?.presence?.hash) {
      for (const [id, userInfo] of Object.entries(payload.presence.hash)) {
        const userId = typeof userInfo.id === 'number' ? userInfo.id : id
        const presenceUser = this.createPresenceUser(userInfo)

        if (String(userId) === String(this.user.id)) {
          self = presenceUser
        } else {
          members.set(userId, presenceUser)
        }
      }
    }

    // Ensure self exists even if not in hash
    if (!self) {
      self = this.createPresenceUser(this.user)
    }

    this.handlers.onSubscribed(members, self)
  }

  /**
   * Handle member joining channel
   */
  private handleMemberAdded = (data: unknown): void => {
    const payload = data as MemberAddedPayload

    // Ignore self
    if (String(payload.user_id) === String(this.user.id)) {
      return
    }

    const presenceUser = this.createPresenceUser(payload.user_info)
    this.handlers.onMemberAdded(presenceUser)
  }

  /**
   * Handle member leaving channel
   */
  private handleMemberRemoved = (data: unknown): void => {
    const payload = data as MemberRemovedPayload
    this.handlers.onMemberRemoved(payload.user_id)
  }

  /**
   * Handle cursor broadcast from another user
   */
  private handleCursor = (data: unknown): void => {
    const message = data as CursorMessage
    // Ignore own cursor broadcasts
    if (String(message.id) === String(this.user.id)) {
      return
    }
    this.handlers.onCursor(message)
  }

  /**
   * Handle focus broadcast from another user
   */
  private handleFocus = (data: unknown): void => {
    const message = data as FocusMessage
    // Ignore own focus broadcasts
    if (String(message.id) === String(this.user.id)) {
      return
    }
    this.handlers.onFocus(message)
  }

  /**
   * Handle meta broadcast from another user
   */
  private handleMeta = (data: unknown): void => {
    const message = data as MetaMessage
    // Ignore own meta broadcasts
    if (String(message.id) === String(this.user.id)) {
      return
    }
    this.handlers.onMeta(message)
  }

  /**
   * Create a PresenceUser from user info
   */
  private createPresenceUser(userInfo: { id: string | number; [key: string]: unknown }): PresenceUser {
    return {
      ...userInfo,
      id: userInfo.id,
      joinedAt: Date.now(),
      cursor: null,
      focus: null,
      meta: {},
    }
  }
}
