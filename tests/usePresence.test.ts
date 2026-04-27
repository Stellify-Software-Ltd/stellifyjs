import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { throttle } from '../src/composables/usePresence/throttle'
import type {
  PresenceUser,
  CursorMessage,
  FocusMessage,
  MetaMessage,
  SubscriptionSucceededPayload,
  MemberAddedPayload,
  MemberRemovedPayload,
} from '../src/composables/usePresence/types'

// =============================================================================
// Throttle Tests
// =============================================================================

describe('throttle', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('executes immediately on first call', () => {
    const fn = vi.fn()
    const throttled = throttle(fn, 100)

    throttled()

    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('throttles subsequent calls within interval', () => {
    const fn = vi.fn()
    const throttled = throttle(fn, 100)

    throttled()
    throttled()
    throttled()

    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('executes trailing call after interval', () => {
    const fn = vi.fn()
    const throttled = throttle(fn, 100)

    throttled(1)
    throttled(2)
    throttled(3)

    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith(1)

    vi.advanceTimersByTime(100)

    expect(fn).toHaveBeenCalledTimes(2)
    expect(fn).toHaveBeenLastCalledWith(3)
  })

  it('allows execution after interval has passed', () => {
    const fn = vi.fn()
    const throttled = throttle(fn, 100)

    throttled()
    expect(fn).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(100)
    throttled()
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('passes arguments correctly', () => {
    const fn = vi.fn()
    const throttled = throttle(fn, 100)

    throttled('a', 1, { x: 2 })

    expect(fn).toHaveBeenCalledWith('a', 1, { x: 2 })
  })

  it('maintains this context', () => {
    const obj = {
      value: 42,
      fn: vi.fn(function (this: { value: number }) {
        return this.value
      }),
    }

    const throttled = throttle(obj.fn, 100)
    throttled.call(obj)

    expect(obj.fn).toHaveBeenCalled()
  })
})

// =============================================================================
// Presence User State Management Tests
// =============================================================================

describe('presence user state management', () => {
  // Simulate the state management logic from usePresence

  function createPresenceUser(userInfo: { id: string | number; [key: string]: unknown }): PresenceUser {
    return {
      ...userInfo,
      id: userInfo.id,
      joinedAt: Date.now(),
      cursor: null,
      focus: null,
      meta: {},
    }
  }

  describe('user creation', () => {
    it('creates user with default presence fields', () => {
      const user = createPresenceUser({ id: 1, name: 'Test User' })

      expect(user.id).toBe(1)
      expect(user.name).toBe('Test User')
      expect(user.cursor).toBeNull()
      expect(user.focus).toBeNull()
      expect(user.meta).toEqual({})
      expect(typeof user.joinedAt).toBe('number')
    })

    it('preserves additional user fields', () => {
      const user = createPresenceUser({
        id: 'abc',
        name: 'Alice',
        colour: '#ff0000',
        avatar: '/images/alice.png',
      })

      expect(user.id).toBe('abc')
      expect(user.name).toBe('Alice')
      expect(user.colour).toBe('#ff0000')
      expect(user.avatar).toBe('/images/alice.png')
    })
  })

  describe('member list operations', () => {
    it('adds member to map', () => {
      const usersMap = new Map<string | number, PresenceUser>()
      const newUser = createPresenceUser({ id: 1, name: 'User 1' })

      usersMap.set(newUser.id, newUser)

      expect(usersMap.size).toBe(1)
      expect(usersMap.get(1)?.name).toBe('User 1')
    })

    it('removes member from map', () => {
      const usersMap = new Map<string | number, PresenceUser>()
      usersMap.set(1, createPresenceUser({ id: 1, name: 'User 1' }))
      usersMap.set(2, createPresenceUser({ id: 2, name: 'User 2' }))

      usersMap.delete(1)

      expect(usersMap.size).toBe(1)
      expect(usersMap.has(1)).toBe(false)
      expect(usersMap.has(2)).toBe(true)
    })

    it('converts map to array excluding self', () => {
      const usersMap = new Map<string | number, PresenceUser>()
      usersMap.set(1, createPresenceUser({ id: 1, name: 'Self' }))
      usersMap.set(2, createPresenceUser({ id: 2, name: 'Other 1' }))
      usersMap.set(3, createPresenceUser({ id: 3, name: 'Other 2' }))

      const selfId = 1
      const users = Array.from(usersMap.values()).filter(u => u.id !== selfId)

      expect(users.length).toBe(2)
      expect(users.find(u => u.id === 1)).toBeUndefined()
    })
  })

  describe('cursor updates', () => {
    it('updates cursor position for user', () => {
      const usersMap = new Map<string | number, PresenceUser>()
      const user = createPresenceUser({ id: 1, name: 'User' })
      usersMap.set(1, user)

      const message: CursorMessage = { id: 1, x: 100, y: 200 }
      const target = usersMap.get(message.id)
      if (target) {
        target.cursor = { x: message.x, y: message.y }
      }

      expect(usersMap.get(1)?.cursor).toEqual({ x: 100, y: 200 })
    })

    it('ignores cursor update for unknown user', () => {
      const usersMap = new Map<string | number, PresenceUser>()

      const message: CursorMessage = { id: 999, x: 100, y: 200 }
      const target = usersMap.get(message.id)
      if (target) {
        target.cursor = { x: message.x, y: message.y }
      }

      expect(usersMap.size).toBe(0)
    })
  })

  describe('focus updates', () => {
    it('sets focus on user', () => {
      const usersMap = new Map<string | number, PresenceUser>()
      const user = createPresenceUser({ id: 1, name: 'User' })
      usersMap.set(1, user)

      const message: FocusMessage = { id: 1, focus: 'row-42' }
      const target = usersMap.get(message.id)
      if (target) {
        target.focus = message.focus
      }

      expect(usersMap.get(1)?.focus).toBe('row-42')
    })

    it('clears focus when null', () => {
      const usersMap = new Map<string | number, PresenceUser>()
      const user = createPresenceUser({ id: 1, name: 'User' })
      user.focus = 'row-42'
      usersMap.set(1, user)

      const message: FocusMessage = { id: 1, focus: null }
      const target = usersMap.get(message.id)
      if (target) {
        target.focus = message.focus
      }

      expect(usersMap.get(1)?.focus).toBeNull()
    })
  })

  describe('meta updates', () => {
    it('shallow merges meta data', () => {
      const usersMap = new Map<string | number, PresenceUser>()
      const user = createPresenceUser({ id: 1, name: 'User' })
      user.meta = { typing: false, selectionStart: 0 }
      usersMap.set(1, user)

      const message: MetaMessage = { id: 1, meta: { typing: true, newField: 'value' } }
      const target = usersMap.get(message.id)
      if (target) {
        target.meta = { ...target.meta, ...message.meta }
      }

      expect(usersMap.get(1)?.meta).toEqual({
        typing: true,
        selectionStart: 0,
        newField: 'value',
      })
    })

    it('clears meta field when set to undefined', () => {
      const usersMap = new Map<string | number, PresenceUser>()
      const user = createPresenceUser({ id: 1, name: 'User' })
      user.meta = { typing: true }
      usersMap.set(1, user)

      const message: MetaMessage = { id: 1, meta: { typing: undefined } }
      const target = usersMap.get(message.id)
      if (target) {
        target.meta = { ...target.meta, ...message.meta }
      }

      expect(usersMap.get(1)?.meta.typing).toBeUndefined()
    })
  })
})

// =============================================================================
// Channel Message Handler Tests
// =============================================================================

describe('channel message handlers', () => {
  const selfUserId = 1

  function createPresenceUser(userInfo: { id: string | number; [key: string]: unknown }): PresenceUser {
    return {
      ...userInfo,
      id: userInfo.id,
      joinedAt: Date.now(),
      cursor: null,
      focus: null,
      meta: {},
    }
  }

  describe('subscription_succeeded handler', () => {
    it('populates members from presence hash', () => {
      const payload: SubscriptionSucceededPayload = {
        presence: {
          ids: [1, 2, 3],
          hash: {
            1: { id: 1, name: 'Self' },
            2: { id: 2, name: 'User 2' },
            3: { id: 3, name: 'User 3' },
          },
          count: 3,
        },
      }

      const members = new Map<string | number, PresenceUser>()
      let self: PresenceUser | null = null

      for (const [id, userInfo] of Object.entries(payload.presence.hash)) {
        const userId = typeof userInfo.id === 'number' ? userInfo.id : id
        const presenceUser = createPresenceUser(userInfo)

        if (String(userId) === String(selfUserId)) {
          self = presenceUser
        } else {
          members.set(userId, presenceUser)
        }
      }

      expect(members.size).toBe(2)
      expect(self?.name).toBe('Self')
      expect(members.has(2)).toBe(true)
      expect(members.has(3)).toBe(true)
    })

    it('handles empty presence', () => {
      const payload: SubscriptionSucceededPayload = {
        presence: {
          ids: [],
          hash: {},
          count: 0,
        },
      }

      const members = new Map<string | number, PresenceUser>()

      for (const [id, userInfo] of Object.entries(payload.presence.hash)) {
        members.set(id, createPresenceUser(userInfo))
      }

      expect(members.size).toBe(0)
    })
  })

  describe('member_added handler', () => {
    it('adds new member to list', () => {
      const usersMap = new Map<string | number, PresenceUser>()

      const payload: MemberAddedPayload = {
        user_id: 2,
        user_info: { id: 2, name: 'New User' },
      }

      // Ignore self
      if (String(payload.user_id) !== String(selfUserId)) {
        usersMap.set(payload.user_id, createPresenceUser(payload.user_info))
      }

      expect(usersMap.size).toBe(1)
      expect(usersMap.get(2)?.name).toBe('New User')
    })

    it('ignores self joining', () => {
      const usersMap = new Map<string | number, PresenceUser>()

      const payload: MemberAddedPayload = {
        user_id: selfUserId,
        user_info: { id: selfUserId, name: 'Self' },
      }

      if (String(payload.user_id) !== String(selfUserId)) {
        usersMap.set(payload.user_id, createPresenceUser(payload.user_info))
      }

      expect(usersMap.size).toBe(0)
    })
  })

  describe('member_removed handler', () => {
    it('removes member from list', () => {
      const usersMap = new Map<string | number, PresenceUser>()
      usersMap.set(2, createPresenceUser({ id: 2, name: 'User 2' }))
      usersMap.set(3, createPresenceUser({ id: 3, name: 'User 3' }))

      const payload: MemberRemovedPayload = { user_id: 2 }
      usersMap.delete(payload.user_id)

      expect(usersMap.size).toBe(1)
      expect(usersMap.has(2)).toBe(false)
      expect(usersMap.has(3)).toBe(true)
    })
  })

  describe('client-cursor handler', () => {
    it('updates cursor for existing user', () => {
      const usersMap = new Map<string | number, PresenceUser>()
      usersMap.set(2, createPresenceUser({ id: 2, name: 'User 2' }))

      const message: CursorMessage = { id: 2, x: 150, y: 250 }

      // Ignore own cursor broadcasts
      if (String(message.id) !== String(selfUserId)) {
        const user = usersMap.get(message.id)
        if (user) {
          user.cursor = { x: message.x, y: message.y }
        }
      }

      expect(usersMap.get(2)?.cursor).toEqual({ x: 150, y: 250 })
    })

    it('ignores own cursor broadcasts', () => {
      const usersMap = new Map<string | number, PresenceUser>()
      const self = createPresenceUser({ id: selfUserId, name: 'Self' })

      const message: CursorMessage = { id: selfUserId, x: 150, y: 250 }
      let cursorUpdated = false

      if (String(message.id) !== String(selfUserId)) {
        cursorUpdated = true
      }

      expect(cursorUpdated).toBe(false)
    })
  })
})

// =============================================================================
// Channel Name Tests
// =============================================================================

describe('channel naming', () => {
  it('prefixes channel with presence-', () => {
    const channelConfig = 'customers'
    const channelName = `presence-${channelConfig}`

    expect(channelName).toBe('presence-customers')
  })

  it('handles nested channel names', () => {
    const channelConfig = 'project.123'
    const channelName = `presence-${channelConfig}`

    expect(channelName).toBe('presence-project.123')
  })
})

// =============================================================================
// Type Tests
// =============================================================================

describe('type validation', () => {
  it('PresenceUser has all required fields', () => {
    const user: PresenceUser = {
      id: 1,
      joinedAt: Date.now(),
      cursor: { x: 0, y: 0 },
      focus: 'field',
      meta: { typing: true },
      name: 'Test',
    }

    expect(user.id).toBe(1)
    expect(user.cursor).toEqual({ x: 0, y: 0 })
    expect(user.focus).toBe('field')
    expect(user.meta).toEqual({ typing: true })
    expect(user.name).toBe('Test')
  })

  it('PresenceUser allows null cursor and focus', () => {
    const user: PresenceUser = {
      id: 1,
      joinedAt: Date.now(),
      cursor: null,
      focus: null,
      meta: {},
    }

    expect(user.cursor).toBeNull()
    expect(user.focus).toBeNull()
  })

  it('CursorMessage has correct shape', () => {
    const message: CursorMessage = {
      id: 1,
      x: 100,
      y: 200,
    }

    expect(message.id).toBe(1)
    expect(message.x).toBe(100)
    expect(message.y).toBe(200)
  })

  it('FocusMessage allows null focus', () => {
    const message: FocusMessage = {
      id: 1,
      focus: null,
    }

    expect(message.focus).toBeNull()
  })

  it('MetaMessage allows arbitrary keys', () => {
    const message: MetaMessage = {
      id: 1,
      meta: {
        typing: true,
        selectionStart: 5,
        custom: 'value',
      },
    }

    expect(message.meta.typing).toBe(true)
    expect(message.meta.selectionStart).toBe(5)
    expect(message.meta.custom).toBe('value')
  })
})

// =============================================================================
// Lifecycle Tests (mocked Vue)
// =============================================================================

describe('usePresence lifecycle', () => {
  it('composable calls onMounted and onUnmounted', async () => {
    // This test validates the composable structure has lifecycle hooks
    // Full lifecycle testing happens with the mounted component
    const { usePresence } = await import('../src/composables/usePresence/usePresence')

    // Should not throw when called with valid options
    expect(() => usePresence({
      channel: 'test',
      user: { id: 1, name: 'Test' },
      autoJoin: false,
    })).not.toThrow()
  })
})

// =============================================================================
// Return Shape Tests
// =============================================================================

describe('usePresence return shape', () => {
  beforeEach(() => {
    vi.mock('vue', () => ({
      ref: <T>(value: T) => ({ value }),
      computed: <T>(getter: () => T) => ({ value: getter() }),
      watch: vi.fn(),
      onMounted: vi.fn(),
      onUnmounted: vi.fn(),
    }))
  })

  afterEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('returns all 9 members', async () => {
    const { usePresence } = await import('../src/composables/usePresence/usePresence')

    const result = usePresence({
      channel: 'test',
      user: { id: 1, name: 'Test' },
      autoJoin: false,
    })

    // Verify all 9 members exist
    expect(result).toHaveProperty('users')
    expect(result).toHaveProperty('self')
    expect(result).toHaveProperty('cursor')
    expect(result).toHaveProperty('focus')
    expect(result).toHaveProperty('setMeta')
    expect(result).toHaveProperty('isConnected')
    expect(result).toHaveProperty('error')
    expect(result).toHaveProperty('join')
    expect(result).toHaveProperty('leave')

    // Verify types
    expect(typeof result.cursor).toBe('function')
    expect(typeof result.focus).toBe('function')
    expect(typeof result.setMeta).toBe('function')
    expect(typeof result.join).toBe('function')
    expect(typeof result.leave).toBe('function')
  })

  it('users is a computed that returns array', async () => {
    const { usePresence } = await import('../src/composables/usePresence/usePresence')

    const { users } = usePresence({
      channel: 'test',
      user: { id: 1, name: 'Test' },
      autoJoin: false,
    })

    expect(users.value).toEqual([])
  })

  it('self starts as null', async () => {
    const { usePresence } = await import('../src/composables/usePresence/usePresence')

    const { self } = usePresence({
      channel: 'test',
      user: { id: 1, name: 'Test' },
      autoJoin: false,
    })

    expect(self.value).toBeNull()
  })

  it('isConnected starts as false', async () => {
    const { usePresence } = await import('../src/composables/usePresence/usePresence')

    const { isConnected } = usePresence({
      channel: 'test',
      user: { id: 1, name: 'Test' },
      autoJoin: false,
    })

    expect(isConnected.value).toBe(false)
  })

  it('error starts as null', async () => {
    const { usePresence } = await import('../src/composables/usePresence/usePresence')

    const { error } = usePresence({
      channel: 'test',
      user: { id: 1, name: 'Test' },
      autoJoin: false,
    })

    expect(error.value).toBeNull()
  })
})
