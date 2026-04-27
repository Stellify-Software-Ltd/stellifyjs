# StellifyJS

A frontend framework built for AI code generation, not just human developers.

## Why?

Current frontend libraries fail AI because they have too many ways to do the same thing, massive API surfaces, and undocumented conventions. When AI generates code against existing libraries, it hallucinates methods and produces inconsistent output.

**Stellify provides:**
- Consistent, chainable APIs with predictable patterns
- One obvious way to do each task
- Laravel-style readable method chaining
- Vue composables for reactive state management
- Tree-shakeable architecture for minimal bundle sizes

## Installation

```bash
npm install stellify-framework
```

## Quick Examples

```javascript
import { useForm, rules, Stream, useChat } from 'stellify-framework'

// Complete form lifecycle with validation
const { data, errors, submit } = useForm({
  data: { name: '', email: '' },
  endpoint: '/api/users',
  rules: {
    email: [rules.required(), rules.email()],
  },
})

// LLM streaming
Stream.create('/api/chat')
  .onChunk(text => appendToUI(text))
  .post({ messages: chat.getMessages() })

// Conversation management (Vue composable)
const chat = useChat()
chat.addUser('What is 2+2?')
chat.addAssistant('4')
const forked = chat.fork()  // Branch for regeneration
```

## Utilities

Plain TypeScript modules. Import and use directly.

| Category | Modules |
|----------|---------|
| Data | Collection, Tree |
| Network | Http, Socket, Stream, Uploader |
| Graphics | Svg, Canvas, Graph, Scale, Axis, Motion |
| Platform | Media, DB, Worker, WorkerPool |
| AI & Language | Embed, Diff |

## Composables

Vue-reactive modules. Use inside `<script setup>` or `setup()`.

| Category | Composables |
|----------|-------------|
| Form | useForm |
| Data fetching | usePagination, useInfiniteScroll, useLiveData, useLazyLoad |
| State | useQueryState |
| Auth & Chat | useAuth, useChat |
| Collaboration | usePresence |
| Routing | useRouter |

## File Uploads

Large file uploads with chunking, progress tracking, and driver-agnostic architecture. Works with [stellify/file-uploads](https://github.com/stellisoft/file-uploads) Laravel package.

```javascript
import { Uploader } from 'stellify-framework'

const uploader = Uploader.create({
  endpoints: {
    initiate: '/uploads/initiate',
    signPart: '/uploads/sign-part',
    storePart: '/uploads/store-part',
    complete: '/uploads/complete',
    abort: '/uploads/abort',
  },
})

// Progress tracking
uploader.on('progress', ({ loaded, total, percent }) => {
  console.log(`${percent}% complete`)
})

// Completion handler
uploader.on('complete', (result) => {
  // result.path, result.size, result.mime, result.disk
  saveAttachment(result)
})

// Error handling
uploader.on('error', (err) => {
  if (err.code === 'NETWORK') { /* retry logic */ }
  else if (err.code === 'VALIDATION') { /* show message */ }
})

// Upload a file
await uploader.upload(file)

// Abort mid-upload
uploader.abort()
```

### Configuration

```javascript
Uploader.create({
  endpoints: { /* required */ },
  chunkSize: 5 * 1024 * 1024,  // 5 MB default
  concurrency: 4,              // parts in flight
  retries: 3,                  // retry count per part
  retryBackoffMs: 1000,        // initial backoff
  headers: {                   // custom headers
    'X-CSRF-TOKEN': token,
  },
  credentials: 'same-origin',  // fetch credentials mode
})
```

### Events

| Event | Payload | Description |
|-------|---------|-------------|
| `start` | `UploadHandle` | After initiate, before parts upload |
| `progress` | `{ loaded, total, percent }` | Byte-level progress |
| `part-complete` | `{ partNumber, size, total, completed }` | After each part |
| `complete` | `UploadResult` | Upload finished successfully |
| `abort` | - | Upload was aborted |
| `error` | `UploadError` | Unrecoverable error |

### Error Codes

- `NETWORK` - Network error during request
- `SIGNING_FAILED` - Failed to get signed URL
- `PART_UPLOAD_FAILED` - Part upload failed after retries
- `COMPLETE_FAILED` - Failed to complete upload
- `VALIDATION` - Server rejected the request (4xx)
- `ABORTED` - Upload was aborted by user
- `UNKNOWN` - Unexpected error

### CSRF Tokens

CSRF tokens are auto-detected from `<meta name="csrf-token">` if present. Tokens are sent to app endpoints but NOT to signed URLs (direct-to-storage uploads).

### Server Setup

See [stellify/file-uploads](https://github.com/stellisoft/file-uploads) for Laravel server-side setup. The Uploader works with both:

- **Chunk-through-app driver** - Uploads go through your Laravel app (any disk)
- **S3 multipart driver** - Direct-to-S3 uploads via pre-signed URLs

The client automatically detects which strategy to use per-part based on server response.

## Vue Composables

```javascript
import { useInfiniteScroll, useLiveData, useQueryState, useLazyLoad } from 'stellify-framework'

// Infinite scroll - replaces 50+ lines of manual pagination code
const { items, loading, hasMore, sentinelRef } = useInfiniteScroll('/api/posts', {
  perPage: 12,
  threshold: 200
})

// Real-time data - HTTP fetch + WebSocket subscription
const { data, connected } = useLiveData('/api/notifications', {
  model: 'Notification'  // Auto-subscribes to Created/Updated/Deleted events
})

// URL state binding - two-way sync between refs and query params
const { search, page } = useQueryState({
  search: { default: '', debounce: 300 },
  page: { default: 1, type: 'number' }
})

// Lazy loading - defer fetch until element is visible
const { data, visible, targetRef } = useLazyLoad(() => Http.get('/api/heavy-data'))
```

## Form & Pagination Composables

### useForm

Complete form lifecycle: data, validation, submission, errors.

```javascript
import { useForm, rules } from 'stellify-framework'

const { data, errors, isSubmitting, isValid, submit } = useForm({
  data: { email: '', password: '' },
  endpoint: '/api/login',
  rules: {
    email: [rules.required(), rules.email()],
    password: [rules.required(), rules.min(8)],
  },
})
```

Server-side 422 responses from Laravel are automatically unwrapped into the `errors` ref. Nested data uses dot-path rules: `'user.profile.name'`. Array fields use wildcards: `'items.*.price'`.

**Built-in rules:** `required`, `email`, `url`, `min`, `max`, `between`, `pattern`, `in`, `notIn`, `same`, `different`, `integer`, `numeric`, `boolean`, `date`, `custom`

### usePagination

Server-side paginated fetching with Laravel `LengthAwarePaginator` shape.

```typescript
import { ref, computed } from 'vue'
import { usePagination } from 'stellify-framework'

const filters = ref({ status: 'active' })
const sort = ref({ key: 'date', direction: 'desc' })

const params = computed(() => ({
  ...filters.value,
  sort: sort.value.key,
  direction: sort.value.direction,
}))

const { rows, meta, isLoading, goToPage, nextPage, prevPage } = usePagination({
  endpoint: '/api/transactions',
  params,
})
```

Sort state, filter inputs, and any other query state are the consumer's concern — passed in via `params`. Any change to `params` resets to page 1 and refetches. URL sync is optional via `syncUrl: true`.

## Auth, Chat & Router Composables

```javascript
import { useAuth, useChat, useRouter } from 'stellify-framework'

// Authentication with reactive state
const auth = useAuth({ loginUrl: '/api/login' })
await auth.login({ email, password })
// Reactive: auth.user, auth.isAuthenticated, auth.token

// Chat conversation management
const chat = useChat({ systemPrompt: 'You are helpful.' })
chat.addUser('Hello!')
// Reactive: chat.history, chat.messageCount

// Client-side routing
const router = useRouter()
router.register('/users/:id', (params) => loadUser(params.id))
router.navigate('/users/123')
// Reactive: router.currentPath, router.params
```

### usePresence

Real-time collaborative presence: who's here, where their cursor is, what they're focused on.

```javascript
import { usePresence } from 'stellify-framework'

const { users, cursor, focus } = usePresence({
  channel: 'customers',
  user: { id: currentUser.id, name: currentUser.name },
})
```

Wire `cursor` to a `@mousemove` handler. Wire `focus(key)` to row hover or field focus. Other connected users appear in `users` with their cursor positions, focus state, and metadata.

```vue
<template>
  <div @mousemove="cursor" class="relative">
    <div v-for="row in rows" :key="row.id"
         @mouseenter="focus(row.id)"
         @mouseleave="focus(null)">
      {{ row.name }}
      <span v-if="users.find(u => u.focus === row.id)">
        {{ users.find(u => u.focus === row.id).name }} viewing
      </span>
    </div>
    <UserCursor v-for="user in users" :key="user.id" :user="user" />
  </div>
</template>
```

Pairs with Laravel Reverb / Pusher on the backend. Channel name should match a presence channel defined in `routes/channels.php`.

**Options:**
- `channel` (required) - Laravel broadcast channel name
- `user` (required) - `{ id, ...metadata }` current user's identity
- `autoJoin` - Join on mount (default: true)
- `throttleMs` - Cursor broadcast throttle (default: 50ms)

**Returns:**
- `users` - `ComputedRef<PresenceUser[]>` other users present (excludes self)
- `self` - `Ref<PresenceUser | null>` current user's presence record
- `cursor` - `(event: MouseEvent) => void` call from @mousemove
- `focus` - `(key: string | null) => void` broadcast focus state
- `setMeta` - `(meta: Record<string, unknown>) => void` broadcast arbitrary metadata
- `isConnected` - `Ref<boolean>` WebSocket connection state
- `error` - `Ref<Error | null>` connection errors
- `join` / `leave` - Manual channel control

**PresenceUser shape:**
```typescript
{
  id: string | number
  joinedAt: number
  cursor: { x: number; y: number } | null
  focus: string | null
  meta: Record<string, unknown>
  // ...additional fields from user config
}
```

## Design Principles

1. **Chainable APIs** - Fluent method chaining for readable code
2. **Verb-noun naming** - `addNode()`, `setData()`, `getErrors()`
3. **Immutable by default** - Methods return new instances, originals unchanged
4. **Computation, not presentation** - Calculate values, don't dictate styling
5. **Tree-shakeable** - Atomic internals enable dead-code elimination

## Tree-Shaking & Bundle Optimization

StellifyJS is designed for optimal bundle sizes. Each module is built from atomic pure functions that bundlers can tree-shake effectively.

```javascript
// Full chainable API
import { collect } from 'stellify-framework'
const names = collect(users).where('active', true).pluck('name').all()

// Or import specific atomics for maximum tree-shaking
import { where, pluck } from 'stellify-framework/utilities/collection'
const active = where(users, 'active', true)
const names = pluck(active, 'name')
```

The Stellify platform generates per-project bundles at publish time, including only the functions your project actually uses.

## Documentation

See [STELLIFY_FRAMEWORK.md](./STELLIFY_FRAMEWORK.md) for complete API reference and examples.

## Part of Stellify

This framework integrates with [Stellify](https://stellisoft.com), a coding platform for AI-assisted development:

- **Backend**: Laravel/PHP via Stellify's MCP tools
- **Frontend**: This framework for consistent, AI-friendly primitives

## License

MIT
