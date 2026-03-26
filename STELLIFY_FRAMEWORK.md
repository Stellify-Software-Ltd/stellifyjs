# Stellify Framework

A frontend framework built for AI code generation, not just human developers.

## The Problem

Current frontend libraries fail AI because:
- Too many ways to do the same thing
- Massive API surfaces with implicit conventions
- Configuration sprawl (objects with 50+ properties)
- Undocumented "you just know" patterns

When AI generates code against existing libraries, it hallucinates methods, gets signatures wrong, and produces inconsistent output.

## The Solution

Stellify provides:
- **Constrained APIs** - 5-7 methods per module maximum
- **One obvious way** to do each common task
- **Laravel-style expressiveness** - chainable, readable, predictable
- **Primitives, not opinions** - computation without presentation
- **Framework-agnostic core** - pure JavaScript with React/Vue adapters

## Philosophy

**Like Laravel for the frontend.**

Laravel doesn't rebuild SQL - it provides Eloquent as an expressive interface with database drivers (MySQL, Postgres, SQLite) handling implementation.

Stellify doesn't rebuild reactivity - it provides expressive modules with framework adapters (React, Vue, Svelte) handling the actual reactivity.

```
Laravel                         Stellify
───────────────────────────────────────────
Eloquent (expressive API)  →    Form, Http, Graph (expressive API)
Database Drivers           →    Framework Adapters
MySQL, Postgres, SQLite    →    React, Vue, Svelte
```

The modules are the product. The adapters are plumbing.

## Modules

### Data & Forms
| Module | Purpose | Key Methods |
|--------|---------|-------------|
| Form | Form data, validation, HTTP | `create()`, `set()`, `get()`, `validate()`, `store()`, `update()`, `delete()` |
| Table | Rows, sorting, filtering, pagination | `create()`, `setData()`, `addColumn()`, `sort()`, `filter()`, `paginate()` |
| List | Collection operations | `create()`, `add()`, `remove()`, `sort()`, `filter()`, `map()`, `reduce()` |
| Tree | Hierarchical data | `create()`, `setRoot()`, `addChild()`, `getNode()`, `traverse()`, `move()` |

### Network
| Module | Purpose | Key Methods |
|--------|---------|-------------|
| Http | Fetch wrapper | `create()`, `get()`, `post()`, `put()`, `delete()`, `withToken()` |
| Socket | WebSocket | `create()`, `connect()`, `disconnect()`, `send()`, `on()`, `off()` |
| Auth | Authentication | `create()`, `login()`, `logout()`, `getUser()`, `getToken()`, `isAuthenticated()` |
| Stream | SSE/streaming responses | `create()`, `post()`, `onChunk()`, `onComplete()`, `abort()`, `getBuffer()` |

### Graphics & Visualization
| Module | Purpose | Key Methods |
|--------|---------|-------------|
| Svg | SVG DOM manipulation | `create()`, `select()`, `rect()`, `circle()`, `line()`, `path()`, `text()` |
| Canvas | Canvas 2D drawing | `create()`, `rect()`, `circle()`, `line()`, `text()`, `drawImage()`, `toDataURL()` |
| Graph | Nodes, edges, layouts | `create()`, `addNode()`, `addEdge()`, `removeNode()`, `layout()`, `getNodes()` |
| Scale | Value mapping | `linear()`, `log()`, `time()`, `band()`, `domain()`, `range()`, `value()` |
| Axis | Tick generation | `create()`, `orientation()`, `ticks()`, `tickFormat()`, `getTicks()` |
| Motion | Animation | `tween()`, `spring()`, `onUpdate()`, `onComplete()`, `start()`, `stop()` |

### Platform APIs
| Module | Purpose | Key Methods |
|--------|---------|-------------|
| Router | History API routing | `create()`, `register()`, `navigate()`, `back()`, `forward()`, `getParams()` |
| Storage | localStorage/sessionStorage | `local()`, `session()`, `set()`, `get()`, `remove()`, `clear()` |
| Events | Pub/sub | `create()`, `on()`, `off()`, `once()`, `emit()`, `clear()` |
| Clipboard | Copy/paste | `copy()`, `paste()`, `copyImage()`, `copyHtml()`, `isSupported()` |
| Notify | Browser notifications | `request()`, `send()`, `getPermission()`, `isSupported()` |
| Geo | Geolocation | `getPosition()`, `watchPosition()`, `stopWatching()`, `distance()` |
| Media | File handling | `selectFile()`, `capture()`, `resize()`, `toBase64()`, `getMetadata()` |
| DB | IndexedDB persistence | `create()`, `store()`, `open()`, `put()`, `get()`, `delete()`, `clear()` |
| Worker | Web Workers | `create()`, `fromFunction()`, `run()`, `post()`, `terminate()`, `onMessage()` |

### AI & Language
| Module | Purpose | Key Methods |
|--------|---------|-------------|
| Speech | Speech recognition/synthesis | `create()`, `listen()`, `speak()`, `stopListening()`, `getVoices()`, `onResult()` |
| Stream | LLM streaming responses | `create()`, `post()`, `onChunk()`, `onComplete()`, `abort()`, `getBuffer()` |
| Chat | Conversation state | `create()`, `addMessage()`, `getHistory()`, `clear()`, `fork()`, `truncate()` |
| Embed | Vector embeddings | `create()`, `store()`, `compare()`, `nearest()`, `search()`, `toJSON()` |
| Diff | Text diffing | `chars()`, `words()`, `lines()`, `apply()`, `createPatch()`, `distance()` |

### Utilities
| Module | Purpose | Key Methods |
|--------|---------|-------------|
| Time | Date manipulation | `now()`, `create()`, `format()`, `add()`, `subtract()`, `diff()`, `relative()` |

## Adapters

### Generic Adapter
Works with any module:
```javascript
// React
import { useStellify } from 'stellify-framework/adapters/react'
const table = useStellify(Table.create(data))

// Vue
import { useStellify } from 'stellify-framework/adapters/vue'
const table = useStellify(Table.create(data))
```

### Form Adapter
Includes `bind()` helper for inputs:
```javascript
// React
import { useForm } from 'stellify-framework/adapters/react'
const form = useForm({ name: '', email: '' })

<input {...form.bind('name')} />
<input {...form.bind('agree', 'checkbox')} />
```

### Table Adapter
Reactive sorting, filtering, pagination:
```javascript
// Vue
import { useTable } from 'stellify-framework'
const table = useTable(users)

table.sort('name')
table.filter(row => row.active)
table.paginate(10)
```

## Vue Composables

### useInfiniteScroll
Automatic pagination with scroll detection using IntersectionObserver:
```javascript
import { useInfiniteScroll } from 'stellify-framework'

const { items, loading, hasMore, sentinelRef } = useInfiniteScroll('/api/posts', {
  perPage: 12,        // Items per page (default: 15)
  threshold: 200,     // Pixels from bottom to trigger (default: 200)
  immediate: true,    // Load first page on mount (default: true)
  keyField: 'id',     // Field for deduplication (default: 'id')
})

// Returns:
// - items: Ref<Collection<T>> - All loaded items as a reactive Collection
// - loading: Ref<boolean> - Currently loading
// - hasMore: Ref<boolean> - More items available
// - loadMore: () => Promise - Manual load trigger
// - reset: () => Promise - Reset and reload from beginning
// - sentinelRef: Ref<HTMLElement> - Attach to sentinel element
```

### useLiveData
HTTP fetch with WebSocket real-time updates:
```javascript
import { useLiveData } from 'stellify-framework'

// Auto-subscribe to model CRUD events
const { data, loading, connected } = useLiveData('/api/notifications', {
  model: 'Notification',  // Subscribes to NotificationCreated/Updated/Deleted
})

// Or custom channel/event
const { data } = useLiveData('/api/messages', {
  channel: 'chat.room.1',
  event: 'MessageSent',
  merge: 'append',  // 'prepend' | 'append' | 'replace' | 'upsert' | custom function
})

// Returns:
// - data: Ref<Collection<T>> - Reactive data
// - loading: Ref<boolean> - Initial load in progress
// - connected: Ref<boolean> - WebSocket connected
// - refresh: () => Promise - Reload from server
// - push/remove/update: Local mutations
```

### useQueryState
Two-way binding between Vue refs and URL query parameters:
```javascript
import { useQueryState } from 'stellify-framework'

const { search, page, sort } = useQueryState({
  search: { default: '', debounce: 300 },
  page: { default: 1, type: 'number' },
  sort: 'created_at',  // Shorthand for { default: 'created_at' }
})

// Now search.value syncs with ?search=...
// Back/forward navigation updates the refs
// Type coercion: 'string' | 'number' | 'boolean' | 'array'
```

### useLazyLoad
Defer data fetching until element enters viewport:
```javascript
import { useLazyLoad, Http } from 'stellify-framework'

const { data, loading, visible, targetRef } = useLazyLoad(
  () => Http.get('/api/heavy-data'),
  { rootMargin: '200px' }  // Pre-load 200px before visible
)

// Returns:
// - data: Ref<T | null> - Loaded data
// - visible: Ref<boolean> - Element is visible
// - loading: Ref<boolean> - Currently loading
// - loaded: Ref<boolean> - Has been loaded at least once
// - targetRef: Ref<HTMLElement> - Attach to target element
// - load: () => Promise - Manual load trigger
```

## Usage Examples

### Form with Validation
```javascript
Form.create({ name: '', email: '' })
  .validate({
    name: v => v ? null : 'Required',
    email: v => v?.includes('@') ? null : 'Invalid'
  })
  .store('/api/users')
```

### Streaming LLM Response
```javascript
Stream.create('/api/chat')
  .withToken(apiKey)
  .onChunk(text => appendToUI(text))
  .onComplete(full => saveResponse(full))
  .post({ messages: chat.getMessages() })
```

### Voice Input
```javascript
Speech.create()
  .onResult(text => chat.addUser(text))
  .onEnd(() => sendToLLM())
  .listen({ continuous: true, language: 'en-US' })
```

### Chat Conversation Management
```javascript
const chat = Chat.create({ systemPrompt: 'You are a helpful assistant.' })
  .addUser('What is 2+2?')
  .addAssistant('2+2 equals 4.')

chat.fork()  // Create branch for regeneration
chat.truncate(10)  // Keep last 10 messages
chat.getMessages()  // For API calls
```

### Vector Similarity Search
```javascript
const embedder = Embed.create({ dimensions: 1536 })
  .store('doc1', vector1, { title: 'Introduction' })
  .store('doc2', vector2, { title: 'Chapter 1' })

const similar = embedder.nearest(queryVector, 5)
// [{ id: 'doc1', score: 0.95, metadata: {...} }, ...]
```

### Text Diffing
```javascript
const changes = Diff.lines(oldCode, newCode)
// [{ type: 'equal', value: '...' }, { type: 'insert', value: '...' }, ...]

const patch = Diff.createPatch('file.js', oldCode, newCode)
// Standard unified diff format
```

### Background Processing with Workers
```javascript
const worker = Worker.fromFunction((data) => {
  // Heavy computation
  return expensiveOperation(data)
})

const result = await worker.run(largeDataset)
worker.terminate()

// Or use a pool for parallel processing
const pool = WorkerPool.fromFunction(4, processItem)
const results = await pool.map(items)
```

### IndexedDB Persistence
```javascript
const db = await DB.create('myapp')
  .store({ name: 'chats', keyPath: 'id' })
  .store({ name: 'embeddings', keyPath: 'id' })
  .open()

await db.put('chats', { id: '1', messages: [...] })
const chat = await db.get('chats', '1')
```

### Canvas Drawing
```javascript
const canvas = Canvas.create(800, 600)
  .fill('#1a1a2e')
  .circle(400, 300, 50, { fill: '#e94560' })
  .text('Hello', 400, 300, { fill: 'white', font: '24px sans-serif' })
  .appendTo('#container')

canvas.toDataURL()  // Export as image
```

### Graph with Layout
```javascript
const graph = Graph.create()
  .size(800, 600)
  .addNode('ceo', { label: 'CEO' })
  .addNode('cto', { label: 'CTO' })
  .addNode('cfo', { label: 'CFO' })
  .addEdge('ceo', 'cto')
  .addEdge('ceo', 'cfo')
  .layout('tree')

// Render with Svg
const svg = Svg.create(800, 600)
graph.getNodes().forEach(n => svg.circle(n.x, n.y, 20))
graph.getEdgesWithPositions().forEach(e =>
  svg.line(e.sourceX, e.sourceY, e.targetX, e.targetY)
)
```

### Bar Chart with Scales
```javascript
const data = [{ label: 'Jan', value: 30 }, { label: 'Feb', value: 60 }]

const xScale = Scale.band()
  .domain(data.map(d => d.label))
  .range([50, 350])

const yScale = Scale.linear()
  .domain([0, Math.max(...data.map(d => d.value))])
  .range([250, 50])

const svg = Svg.create(400, 300)
data.forEach(d => {
  svg.rect(xScale.value(d.label), yScale.value(d.value), xScale.bandwidth(), 250 - yScale.value(d.value))
})
```

### Animated Transition
```javascript
Motion.tween(0, 100, { duration: 500, easing: Motion.easing.easeOut })
  .onUpdate(value => Svg.select('.bar').attr('height', value))
  .onComplete(() => console.log('done'))
  .start()
```

### WebSocket Connection
```javascript
Socket.create('wss://api.example.com')
  .on('message', data => console.log(data))
  .on('error', err => console.error(err))
  .connect()
  .send({ type: 'subscribe', channel: 'updates' })
```

### Time Formatting
```javascript
Time.now().format('YYYY-MM-DD HH:mm')
Time.create('2024-01-15').add(7, 'days').relative()  // "in 7 days"
Time.create(timestamp).diff(Time.now(), 'hours')
```

## Project Structure

```
stellify-framework/
├── src/
│   ├── form/index.ts
│   ├── table/index.ts
│   ├── list/index.ts
│   ├── tree/index.ts
│   ├── http/index.ts
│   ├── socket/index.ts
│   ├── auth/index.ts
│   ├── stream/index.ts
│   ├── svg/index.ts
│   ├── canvas/index.ts
│   ├── graph/index.ts
│   ├── scale/index.ts
│   ├── axis/index.ts
│   ├── motion/index.ts
│   ├── router/index.ts
│   ├── storage/index.ts
│   ├── events/index.ts
│   ├── clipboard/index.ts
│   ├── notify/index.ts
│   ├── geo/index.ts
│   ├── media/index.ts
│   ├── db/index.ts
│   ├── worker/index.ts
│   ├── speech/index.ts
│   ├── chat/index.ts
│   ├── embed/index.ts
│   ├── diff/index.ts
│   ├── time/index.ts
│   ├── adapters/
│   │   ├── react/
│   │   │   ├── useStellify.ts
│   │   │   ├── useForm.ts
│   │   │   └── useTable.ts
│   │   └── vue/
│   │       ├── useStellify.ts
│   │       ├── useForm.ts
│   │       ├── useTable.ts
│   │       ├── useInfiniteScroll.ts
│   │       ├── useLiveData.ts
│   │       ├── useQueryState.ts
│   │       └── useLazyLoad.ts
│   └── index.ts
├── package.json
└── tsconfig.json
```

## Design Principles

1. **Rule of Seven** - Maximum 7 primary methods per module
2. **Verb-noun naming** - `addNode()`, `setData()`, `getErrors()`
3. **Chainable returns** - Methods return `this` for chaining
4. **Required params positional, optional in object** - `addNode(id, { label })`
5. **Fail fast with clear errors** - Never silently succeed
6. **Computation, not presentation** - Calculate values, don't dictate styling
7. **Framework-agnostic core** - Pure JS, adapters add reactivity

## What This Is NOT

- Not a UI component library (no buttons, modals, etc.)
- Not a styling framework (no CSS, themes)
- Not a state management library (use framework's native state)
- Not tied to React or Vue (they're just adapters)

## Integration with Stellify

This framework is designed to be incorporated into Stellify as part of a "Super Framework" for AI-assisted development:

- **Backend**: Laravel/PHP via Stellify's existing tools
- **Frontend**: This framework for consistent, AI-friendly primitives

Together they form a full-stack framework where AI can reliably generate code on both sides.

## Module Count: 28

| Category | Modules |
|----------|---------|
| Data & Forms | Form, Table, List, Tree |
| Network | Http, Socket, Auth, Stream |
| Graphics | Svg, Canvas, Graph, Scale, Axis, Motion |
| Platform | Router, Storage, Events, Clipboard, Notify, Geo, Media, DB, Worker |
| AI & Language | Speech, Chat, Embed, Diff |
| Utilities | Time |

## Next Steps

1. Add tests for all modules
2. Add TypeScript declaration files
3. Publish to npm
4. Create documentation site
5. Build higher-level modules on top (Chart using Svg+Scale, etc.)
6. Add more framework adapters (Svelte, Solid)
