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

## Modules (28 total)

| Category | Modules |
|----------|---------|
| Data & Forms | Form, Table, List, Tree |
| Network | Http, Socket, Auth, Stream |
| Graphics | Svg, Canvas, Graph, Scale, Axis, Motion |
| Platform | Router, Storage, Events, Clipboard, Notify, Geo, Media, DB, Worker, WorkerPool |
| AI & Language | Speech, Chat, Embed, Diff |
| Utilities | Time |

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
