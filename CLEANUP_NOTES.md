# Cleanup Notes

Phase 3 sanity audit findings and recommendations.

---

## Media

### Current state
228 lines. Static utility class with methods for:
- **File selection**: `selectFile()`, `selectFiles()` — programmatic file picker
- **Capture**: `capture('photo'|'video'|'audio')` — camera/microphone access with MediaRecorder
- **Image processing**: `resize()`, `toBase64()`, `toArrayBuffer()`, `toText()`
- **Metadata**: `getMetadata()`, `formatSize()`, `isImage()`, `isVideo()`, `isAudio()`

### Analysis
The module splits into two categories:

1. **Pure utilities** (no state, no reactivity needed):
   - `getMetadata()`, `formatSize()`, `isImage()`, `isVideo()`, `isAudio()`
   - `toBase64()`, `toArrayBuffer()`, `toText()`
   - `resize()`

2. **Stateful/async operations** (could benefit from reactive state):
   - `selectFile()`/`selectFiles()` — returns Promise, no ongoing state
   - `capture()` — returns Promise, but the *process* (recording in progress, preview stream) has state that UI needs to reflect

### Recommendation: **Split and introduce `useMediaCapture`**

Keep `Media` utility for pure file operations. Create `useMediaCapture` composable for camera/recording workflows:

```ts
const {
  stream,        // Ref<MediaStream | null> - live preview
  recording,     // Ref<boolean>
  blob,          // Ref<Blob | null> - captured result
  error,         // Ref<Error | null>
  startPreview,  // () => Promise<void>
  capture,       // () => Promise<void> - take photo
  startRecording,// () => void
  stopRecording, // () => void
  stop,          // () => void - cleanup stream
} = useMediaCapture({ video: true, audio: false })
```

This gives Vue components reactive state for:
- Showing live camera preview
- Displaying recording indicator
- Handling capture completion

**Action**: Create `useMediaCapture` composable in Phase 4. Keep current `Media` utility unchanged for now.

---

## Canvas & Svg discoverability

### Current state
- **Canvas**: 330 lines. Chainable wrapper around CanvasRenderingContext2D. Methods: `rect()`, `circle()`, `line()`, `path()`, `text()`, `drawImage()`, transformations, pixel manipulation, export.
- **Svg**: 255 lines. Chainable SVG builder. Methods: `rect()`, `circle()`, `line()`, `path()`, `text()`, DOM selection/manipulation, string serialization.

### Analysis
Both are well-designed utilities for programmatic graphics. The discoverability concern is whether AI generating chart code will find them before `useChart` exists.

Current export paths:
```ts
import { Canvas, Svg } from 'stellify-framework'
import { Canvas } from 'stellify-framework/utilities/canvas'
import { Svg } from 'stellify-framework/utilities/svg'
```

**Discoverability issues:**
1. Names are generic — AI might not associate "Svg" with "chart rendering"
2. No JSDoc on the classes describing chart-related use cases
3. README doesn't mention them as chart primitives

### Recommendation: **Improve documentation, no code changes**

1. Add JSDoc to both classes mentioning chart/visualization use:
   ```ts
   /**
    * SVG builder for programmatic graphics and data visualization.
    * Use for charts, diagrams, and dynamic graphics.
    */
   ```

2. Update README's Utilities table to group them under "Graphics & Charts" instead of just "Graphics"

3. When `useChart` ships in Phase 4, it should internally use these utilities — that creates the AI-discoverable path: user asks for chart → AI finds `useChart` → implementation shows `Scale`, `Axis`, `Svg` patterns.

**Action**: Add JSDoc in Phase 4 alongside `useChart`. No changes now.

---

## Graph utility vs useGraph composable

### Current state
326 lines. Class holding:
- Node map (`Map<string, Node>`) with id, x, y, label, data
- Edge array with from, to, weight, label, data
- Layout algorithms: force-directed, tree, grid, circular

Methods mutate internal state and return `this` for chaining:
```ts
Graph.create()
  .addNode('a')
  .addNode('b')
  .addEdge('a', 'b')
  .layout('force')
  .getNodes() // [{ id: 'a', x: 123, y: 456 }, ...]
```

### Analysis
Graph holds **mutable state** that drives UI (node positions after layout). This is exactly the pattern we moved Auth/Chat/Router away from.

However, Graph differs in one key way: the state mutation is **batch** (call `layout()`, get all positions at once) rather than **incremental** (like Auth where `login()` changes `user` and UI should react).

**Two usage patterns:**

1. **One-shot layout**: Build graph, call `layout()`, render once. No reactivity needed.
2. **Interactive graph**: User drags nodes, adds/removes nodes, UI updates live. Reactivity needed.

For pattern 2, wrapping in `ref()` works:
```ts
const graph = ref(Graph.create().addNode('a').addNode('b').layout('force'))
// After mutation:
graph.value = graph.value.addNode('c').layout('force')
// Or use shallowRef + triggerRef
```

### Recommendation: **Keep as utility, document ref() pattern**

Creating `useGraph` would add complexity for marginal benefit. The current utility + `ref()` pattern is idiomatic Vue. Force-directed layouts with animation would need `useGraph`, but that's a significant feature (tick-based simulation, drag handlers) beyond current scope.

**Action**: Add example in docs showing `ref(Graph.create())` pattern. Consider `useGraph` in future if interactive graph visualization becomes a priority.

---

## Composable API consistency

### Naming audit

All composables follow `useX` pattern:
- `useForm`
- `useTable`
- `useInfiniteScroll`
- `useLiveData`
- `useQueryState`
- `useLazyLoad`
- `useAuth`
- `useChat`
- `useRouter`
- `useStellify`

Additional export `useChatFromHistory` also follows pattern.

### Invocation pattern audit

All composables use `useX(config)` pattern:
```ts
useForm(initialData)
useTable(initialRows)
useInfiniteScroll(endpoint, options)
useLiveData(endpoint, options)
useQueryState(schema)
useLazyLoad(fetcher, options)
useAuth(config)
useChat(options)
useRouter()  // no config needed
useStellify(module)
```

No composables use `.create()` pattern.

### `useStellify` evaluation

**Purpose**: Generic wrapper that makes any chainable module reactive by intercepting method calls and triggering `shallowRef` updates.

**Current implementation**: 30 lines. Wraps module in Proxy, triggers ref on chainable returns.

**Is it still needed?**

With dedicated composables for Form, Table, Auth, Chat, Router, the main use case shrinks to:
- Making `Collection` reactive
- Making `Graph` reactive
- Making any other utility reactive without a dedicated composable

**Verdict**: Still useful as escape hatch. If someone uses `Graph` interactively:
```ts
const graph = useStellify(Graph.create())
graph.addNode('x')  // triggers reactivity
```

### Recommendation: **Keep `useStellify`, add JSDoc clarifying purpose**

Current JSDoc is minimal. Should clarify:
```ts
/**
 * Generic reactivity wrapper for any Stellify utility.
 *
 * Use this when a dedicated composable doesn't exist.
 * For Form, Table, Auth, Chat, Router - prefer the dedicated composables.
 *
 * @example
 * const graph = useStellify(Graph.create())
 * graph.addNode('a')  // triggers Vue reactivity
 */
```

**Action**: Update JSDoc in Phase 4.

---

## Other observations

### Tree utility
`Tree` is exported from utilities but wasn't mentioned in Phase 2 planning. It's a tree data structure utility (not reactive). Appears intentionally kept — no action needed.

### Form and Table core classes
Both `Form` and `Table` classes live in `utilities/form` and `utilities/table`. The composables (`useForm`, `useTable`) import and wrap them. This is the "thin wrapper" pattern the brief mentions will be rebuilt in Phase 4.

Current structure is correct for Phase 2. Phase 4 will absorb the core classes into the composables.

### Missing type exports
Some composables define interfaces internally that consumers might want:
- `useInfiniteScroll`: `InfiniteScrollOptions`, `InfiniteScrollReturn`
- `useLiveData`: `LiveDataOptions`, `LiveDataReturn`
- `useLazyLoad`: `LazyLoadOptions`, `LazyLoadReturn`
- `useQueryState`: `QueryParamConfig`, `QueryStateReturn`

These aren't exported from the composable barrels.

**Recommendation**: Export option/return types for better TypeScript DX. Low priority.

---

## Summary of recommended actions

| Item | Recommendation | Priority | Phase |
|------|---------------|----------|-------|
| Media | Create `useMediaCapture` composable | Medium | 4 |
| Canvas/Svg docs | Add chart-related JSDoc | Low | 4 |
| Graph | Keep as utility, document ref() pattern | Low | 4 |
| useStellify | Keep, improve JSDoc | Low | 4 |
| Type exports | Export option/return types from composables | Low | 4+ |

No code changes required in Phase 3.
