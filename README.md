# StellifyJS

A frontend framework built for AI code generation, not just human developers.

## Why?

Current frontend libraries fail AI because they have too many ways to do the same thing, massive API surfaces, and undocumented conventions. When AI generates code against existing libraries, it hallucinates methods and produces inconsistent output.

**Stellify provides:**
- Constrained APIs (5-7 methods per module max)
- One obvious way to do each task
- Laravel-style chainable, readable patterns
- Framework-agnostic core with React/Vue adapters

## Installation

```bash
npm install stellify-framework
```

## Quick Examples

```javascript
import { Form, Stream, Chat, Speech } from 'stellify-framework'

// Form with validation
Form.create({ name: '', email: '' })
  .validate({ email: v => v?.includes('@') ? null : 'Invalid' })
  .store('/api/users')

// LLM streaming
Stream.create('/api/chat')
  .onChunk(text => appendToUI(text))
  .post({ messages: chat.getMessages() })

// Voice input
Speech.create()
  .onResult(text => chat.addUser(text))
  .listen({ continuous: true })

// Conversation management
Chat.create()
  .addUser('What is 2+2?')
  .addAssistant('4')
  .fork()  // Branch for regeneration
```

## Modules (29 total)

| Category | Modules |
|----------|---------|
| Data & Forms | Form, Table, List, Tree |
| Network | Http, Socket, Auth, Stream, **Uploader** |
| Graphics | Svg, Canvas, Graph, Scale, Axis, Motion |
| Platform | Router, Storage, Events, Clipboard, Notify, Geo, Media, DB, Worker, WorkerPool |
| AI & Language | Speech, Chat, Embed, Diff |
| Utilities | Time |

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

## Framework Adapters

```javascript
// Vue
import { useForm, useTable } from 'stellify-framework'
const form = useForm({ name: '' })
<input v-model="form.state.data.name" />

// React (coming soon)
import { useForm } from 'stellify-framework/react'
```

## Design Principles

1. **Rule of Seven** - Max 7 primary methods per module
2. **Verb-noun naming** - `addNode()`, `setData()`, `getErrors()`
3. **Chainable returns** - Methods return `this`
4. **Computation, not presentation** - Calculate values, don't dictate styling

## Documentation

See [STELLIFY_FRAMEWORK.md](./STELLIFY_FRAMEWORK.md) for complete API reference and examples.

## Part of Stellify

This framework integrates with [Stellify](https://stellisoft.com), a coding platform for AI-assisted development:

- **Backend**: Laravel/PHP via Stellify's MCP tools
- **Frontend**: This framework for consistent, AI-friendly primitives

## License

MIT
