# Stellify Framework

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

## Framework Adapters

```javascript
// React
import { useForm } from 'stellify-framework/adapters/react'
const form = useForm({ name: '' })
<input {...form.bind('name')} />

// Vue
import { useForm } from 'stellify-framework/adapters/vue'
const form = useForm({ name: '' })
<input v-model="form.data.name" />
```

## Design Principles

1. **Rule of Seven** - Max 7 primary methods per module
2. **Verb-noun naming** - `addNode()`, `setData()`, `getErrors()`
3. **Chainable returns** - Methods return `this`
4. **Computation, not presentation** - Calculate values, don't dictate styling

## Documentation

See [STELLIFY_FRAMEWORK.md](./STELLIFY_FRAMEWORK.md) for complete API reference and examples.

## Part of Stellify

This framework integrates with [Stellify](https://stellify.cloud), a coding platform for AI-assisted development:

- **Backend**: Laravel/PHP via Stellify's MCP tools
- **Frontend**: This framework for consistent, AI-friendly primitives

## License

MIT
