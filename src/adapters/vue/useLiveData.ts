import { ref, shallowRef, onMounted, onUnmounted, type Ref } from 'vue'
import { Http } from '../../http'
import { Socket } from '../../socket'
import { Collection } from '../../collection'

/**
 * Merge strategies for incoming WebSocket events
 */
type MergeStrategy<T> =
  | 'prepend'   // Add to beginning
  | 'append'    // Add to end
  | 'replace'   // Replace entire dataset
  | 'upsert'    // Update existing or insert new (requires keyField)
  | ((current: T[], event: WebSocketEvent<T>) => T[])  // Custom function

/**
 * WebSocket event structure
 */
interface WebSocketEvent<T> {
  type?: string
  event?: string
  data: T | T[]
  action?: 'created' | 'updated' | 'deleted'
}

/**
 * Model event configuration for automatic CRUD subscriptions
 */
interface ModelConfig {
  /**
   * Model name (e.g., 'Post', 'Comment')
   * Subscribes to {Model}Created, {Model}Updated, {Model}Deleted events
   */
  name: string

  /**
   * Channel name (defaults to lowercase plural: 'posts', 'comments')
   */
  channel?: string
}

/**
 * Options for useLiveData
 */
interface LiveDataOptions<T> {
  /**
   * WebSocket channel to subscribe to
   */
  channel?: string

  /**
   * Specific event name to listen for
   */
  event?: string

  /**
   * Model configuration for automatic CRUD event handling
   */
  model?: string | ModelConfig

  /**
   * How to merge incoming events with current data
   */
  merge?: MergeStrategy<T>

  /**
   * Key field for upsert/delete operations (default: 'id')
   */
  keyField?: keyof T

  /**
   * Transform data after fetching or receiving events
   */
  transform?: (item: unknown) => T

  /**
   * Whether to fetch data immediately on mount (default: true)
   */
  immediate?: boolean

  /**
   * WebSocket URL (default: auto-detect from window.location)
   */
  socketUrl?: string

  /**
   * Custom HTTP instance
   */
  http?: typeof Http

  /**
   * Custom params for initial HTTP request
   */
  params?: Record<string, string | number | boolean>

  /**
   * Return data as Collection instead of array (default: true)
   */
  asCollection?: boolean
}

/**
 * Return type for useLiveData
 */
interface LiveDataReturn<T> {
  /**
   * The reactive data (Collection or array based on options)
   */
  data: Ref<Collection<T> | T[]>

  /**
   * Whether initial load is in progress
   */
  loading: Ref<boolean>

  /**
   * Any error that occurred
   */
  error: Ref<Error | null>

  /**
   * Whether WebSocket is connected
   */
  connected: Ref<boolean>

  /**
   * Manually refresh data from the server
   */
  refresh: () => Promise<void>

  /**
   * Manually disconnect WebSocket
   */
  disconnect: () => void

  /**
   * Manually reconnect WebSocket
   */
  reconnect: () => void

  /**
   * Push an item locally (without server)
   */
  push: (item: T) => void

  /**
   * Remove an item locally by key
   */
  remove: (key: unknown) => void

  /**
   * Update an item locally
   */
  update: (key: unknown, updates: Partial<T>) => void
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
export function useLiveData<T = unknown>(
  endpoint: string,
  options: LiveDataOptions<T> = {}
): LiveDataReturn<T> {
  const {
    channel,
    event,
    model,
    merge = 'prepend',
    keyField = 'id' as keyof T,
    transform,
    immediate = true,
    socketUrl,
    http = Http,
    params = {},
    asCollection = true,
  } = options

  // State
  const data = shallowRef<Collection<T> | T[]>(
    asCollection ? Collection.collect<T>([]) : []
  )
  const loading = ref(false)
  const error = ref<Error | null>(null)
  const connected = ref(false)

  // WebSocket instance
  let socket: Socket | null = null

  /**
   * Get items as array regardless of storage type
   */
  const getItems = (): T[] => {
    const current = data.value
    if (current instanceof Collection) {
      return current.all()
    }
    return current
  }

  /**
   * Set items, converting to Collection if needed
   */
  const setItems = (items: T[]): void => {
    if (asCollection) {
      data.value = Collection.collect(items)
    } else {
      data.value = items
    }
  }

  /**
   * Apply transformation to items if configured
   */
  const transformItems = (items: unknown[]): T[] => {
    if (transform) {
      return items.map(transform)
    }
    return items as T[]
  }

  /**
   * Build URL with query params
   */
  const buildUrl = (): string => {
    const url = new URL(endpoint, window.location.origin)
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, String(value))
    }
    return url.pathname + url.search
  }

  /**
   * Fetch data from server
   */
  const fetchData = async (): Promise<void> => {
    loading.value = true
    error.value = null

    try {
      const response = await http.get<{ data: T[] } | T[]>(buildUrl())

      // Handle Laravel API response format
      const items = Array.isArray(response)
        ? response
        : response.data

      setItems(transformItems(items))
    } catch (e) {
      error.value = e instanceof Error ? e : new Error(String(e))
    } finally {
      loading.value = false
    }
  }

  /**
   * Apply merge strategy
   */
  const applyMerge = (eventData: WebSocketEvent<T>): void => {
    const current = getItems()
    const incoming = Array.isArray(eventData.data)
      ? eventData.data
      : [eventData.data]

    const transformed = transformItems(incoming as unknown[])

    let newItems: T[]

    if (typeof merge === 'function') {
      newItems = merge(current, eventData)
    } else {
      switch (merge) {
        case 'prepend':
          newItems = [...transformed, ...current]
          break

        case 'append':
          newItems = [...current, ...transformed]
          break

        case 'replace':
          newItems = transformed
          break

        case 'upsert':
          newItems = [...current]
          for (const item of transformed) {
            const key = item[keyField]
            const index = newItems.findIndex(i => i[keyField] === key)
            if (index >= 0) {
              newItems[index] = { ...newItems[index], ...item }
            } else {
              newItems.unshift(item)
            }
          }
          break

        default:
          newItems = [...transformed, ...current]
      }
    }

    setItems(newItems)
  }

  /**
   * Handle delete events
   */
  const handleDelete = (eventData: WebSocketEvent<T>): void => {
    const current = getItems()
    const toDelete = Array.isArray(eventData.data)
      ? eventData.data
      : [eventData.data]

    const deleteKeys = new Set(toDelete.map(item => item[keyField]))
    const newItems = current.filter(item => !deleteKeys.has(item[keyField]))

    setItems(newItems)
  }

  /**
   * Handle incoming WebSocket event
   */
  const handleEvent = (eventData: WebSocketEvent<T>): void => {
    // Check for delete action
    if (eventData.action === 'deleted') {
      handleDelete(eventData)
      return
    }

    // Apply merge for create/update
    applyMerge(eventData)
  }

  /**
   * Determine WebSocket URL
   */
  const getSocketUrl = (): string => {
    if (socketUrl) {
      return socketUrl
    }

    // Auto-detect Reverb WebSocket URL
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host
    return `${protocol}//${host}/app/reverb`
  }

  /**
   * Get channel name
   */
  const getChannel = (): string | null => {
    if (channel) {
      return channel
    }

    if (model) {
      const modelName = typeof model === 'string' ? model : model.name
      const modelConfig = typeof model === 'string' ? null : model

      if (modelConfig?.channel) {
        return modelConfig.channel
      }

      // Default: lowercase plural (Post -> posts)
      return modelName.toLowerCase() + 's'
    }

    return null
  }

  /**
   * Get events to subscribe to
   */
  const getEvents = (): string[] => {
    if (event) {
      return [event]
    }

    if (model) {
      const modelName = typeof model === 'string' ? model : model.name
      return [
        `${modelName}Created`,
        `${modelName}Updated`,
        `${modelName}Deleted`,
      ]
    }

    return []
  }

  /**
   * Set up WebSocket connection
   */
  const setupSocket = (): void => {
    const channelName = getChannel()
    const events = getEvents()

    if (!channelName || events.length === 0) {
      return // No real-time updates configured
    }

    socket = Socket.create(getSocketUrl())

    socket.on('open', () => {
      connected.value = true

      // Subscribe to channel (Reverb/Pusher protocol)
      socket?.send({
        event: 'pusher:subscribe',
        data: { channel: channelName }
      })
    })

    socket.on('close', () => {
      connected.value = false
    })

    socket.on('error', () => {
      connected.value = false
    })

    // Listen for each event
    for (const eventName of events) {
      socket.on(eventName, (eventData: unknown) => {
        const typed = eventData as WebSocketEvent<T>

        // Determine action from event name if not specified
        if (!typed.action) {
          if (eventName.endsWith('Created')) {
            typed.action = 'created'
          } else if (eventName.endsWith('Updated')) {
            typed.action = 'updated'
          } else if (eventName.endsWith('Deleted')) {
            typed.action = 'deleted'
          }
        }

        handleEvent(typed)
      })
    }

    socket.connect()
  }

  /**
   * Disconnect WebSocket
   */
  const disconnect = (): void => {
    if (socket) {
      socket.disconnect()
      socket = null
      connected.value = false
    }
  }

  /**
   * Reconnect WebSocket
   */
  const reconnect = (): void => {
    disconnect()
    setupSocket()
  }

  /**
   * Refresh data from server
   */
  const refresh = async (): Promise<void> => {
    await fetchData()
  }

  /**
   * Push an item locally
   */
  const push = (item: T): void => {
    const current = getItems()
    setItems([item, ...current])
  }

  /**
   * Remove an item locally by key
   */
  const remove = (key: unknown): void => {
    const current = getItems()
    setItems(current.filter(item => item[keyField] !== key))
  }

  /**
   * Update an item locally
   */
  const update = (key: unknown, updates: Partial<T>): void => {
    const current = getItems()
    const index = current.findIndex(item => item[keyField] === key)
    if (index >= 0) {
      const newItems = [...current]
      newItems[index] = { ...newItems[index], ...updates }
      setItems(newItems)
    }
  }

  // Lifecycle
  onMounted(() => {
    if (immediate) {
      fetchData()
    }
    setupSocket()
  })

  onUnmounted(() => {
    disconnect()
  })

  return {
    data: data as Ref<Collection<T> | T[]>,
    loading,
    error,
    connected,
    refresh,
    disconnect,
    reconnect,
    push,
    remove,
    update,
  }
}
