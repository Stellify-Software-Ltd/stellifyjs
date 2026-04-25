# Vision Gap Analysis

## Target scenario

A developer asks the Stellify platform: *"Build me a dashboard showing monthly sales data. Include a sortable table of transactions and a bar chart of revenue by region, both pulling from `/api/sales`."*

The AI produces small, declarative configuration stored in a database. The framework provides all substrate — chunking, retries, reconnection, sort/filter/paginate, chart drawing, layout, validation, data binding.

## Expected application configuration shape

```json
{
  "layout": {
    "type": "grid",
    "columns": 2,
    "gap": "1rem"
  },
  "panels": [
    {
      "type": "table",
      "title": "Transactions",
      "endpoint": "/api/sales/transactions",
      "columns": ["date", "customer", "amount", "region"],
      "sort": { "key": "date", "direction": "desc" },
      "pagination": { "perPage": 20 }
    },
    {
      "type": "chart",
      "chartType": "bar",
      "title": "Revenue by Region",
      "endpoint": "/api/sales/by-region",
      "x": { "field": "region", "label": "Region" },
      "y": { "field": "revenue", "label": "Revenue ($)" }
    }
  ]
}
```

This configuration should be ~30 lines. The framework renders it. No substrate logic leaks into the config.

---

## Responsibility breakdown

### Data fetch

- **Substrate:** `Http` (core), `useLiveData` (Vue adapter)
- **Status:** ✅ Covered well
- **Notes:**
  - `Http` (277 lines) provides timeout handling, abort controller integration, and Laravel response unwrapping (`.items()`, `.store()`, `.update()`, `.destroy()`).
  - `useLiveData` (553 lines) adds HTTP + WebSocket sync with merge strategies for real-time updates.
  - Retry logic exists in `Uploader` but not in `Http`. For the dashboard scenario, basic fetch is sufficient. If retries were needed for general HTTP, that would be a gap — but it's not critical for this use case.

---

### Table state (sort, filter, paginate)

- **Substrate:** `Table` (core, 154 lines), `useTable` (Vue adapter, 97 lines)
- **Status:** ⚠️ Covered thinly
- **Notes:**
  - The core `Table` class is a basic in-memory state container: it holds rows, applies sort/filter/pagination, and returns sliced data.
  - **What's missing from core:**
    - No server-side pagination awareness (doesn't know about `current_page`, `last_page`, `total` from Laravel responses)
    - No URL-based sort/filter persistence
    - No column configuration beyond `label`, `sortable`, `formatter`
    - No selection state (checkboxes)
    - No column resizing, reordering, visibility toggles
  - **The Vue adapter (`useTable`)** is a thin reactive wrapper — it delegates everything to the core `Table` and syncs state. It adds no additional logic.
  - **For the scenario:** The AI would need to supplement with `useQueryState` for URL sync and `useInfiniteScroll` or manual pagination handling for server-side data. The core Table is designed for client-side data, not server-driven tables.
  - **Inversion check:** No inversion — the adapter is correctly thin. The gap is that the core module itself is thin for the server-side table use case.

---

### Chart composition

- **Substrate:** None
- **Status:** ❌ Not covered
- **Notes:**
  - **This is the largest missing piece.**
  - The framework has primitives: `Scale` (linear/log/time/band), `Axis` (tick generation), `Svg` (element creation), `Graph` (node-link diagrams with layout algorithms).
  - **What's missing:** A `Chart` module that takes declarative input like `{ type: 'bar', x: 'region', y: 'revenue', data }` and orchestrates Scale + Axis + Svg into a rendered chart.
  - Without this, every chart in every application requires the AI to:
    1. Create appropriate scales (`Scale.band()` for x, `Scale.linear()` for y)
    2. Configure domains from data
    3. Create axes with tick formatting
    4. Calculate bar positions and dimensions
    5. Generate SVG rects with correct coordinates
    6. Handle responsive sizing
    7. Add colour assignment
    8. Handle tooltips, legends, labels
  - That's 50-100+ lines of substrate code per chart — exactly what the vision says should NOT be in application configuration.
  - **Recommendation:** A `Chart` module that supports at minimum: bar, line, area, pie. It should accept data + field mappings + options, and output rendered SVG (or a renderTo target).

---

### Chart drawing primitives

- **Substrate:** `Svg` (255 lines), `Canvas` (330 lines), `Scale` (255 lines), `Axis` (90 lines)
- **Status:** ✅ Covered well (as primitives)
- **Notes:**
  - `Scale` provides D3-style domain-to-range mapping with linear, log, time, and band scales. Well-implemented.
  - `Axis` generates tick positions and labels from a scale. Clean interface.
  - `Svg` provides chainable SVG element creation. Works both from scratch and by selecting existing elements.
  - These are good building blocks. The gap is composition, not primitives.
  - **Discoverability concern:** The AI generating a chart would need to know to use Scale + Axis + Svg together. The README lists them separately under "Graphics" but doesn't explain their relationship. Without a `Chart` module, the AI might not discover these at all and could try to generate raw SVG or reach for an external library.

---

### Layout / dashboard structure

- **Substrate:** None
- **Status:** ❌ Not covered
- **Notes:**
  - The scenario requires two panels in a grid arrangement.
  - Currently, no module owns layout/grid/panel structure.
  - The AI would need to emit CSS grid/flexbox into application config, which is acceptable for simple cases but sprawls for:
    - Responsive breakpoints
    - Panel resizing/collapsing
    - Dashboard with many panels
    - Drag-and-drop panel reordering
  - **Recommendation:** Consider a `Layout` or `Dashboard` module that accepts panel configuration and handles grid/responsive arrangement. This keeps layout substrate out of application config.
  - **Counterpoint:** For MVP, CSS-in-config may be acceptable. This is lower priority than Chart.

---

### Data-UI binding (reactive refresh on state change)

- **Substrate:** `useLiveData` (Vue), `useInfiniteScroll` (Vue), `useQueryState` (Vue)
- **Status:** 🔄 Inverted — logic is in Vue adapters only
- **Notes:**
  - `useLiveData` (553 lines) handles HTTP fetch + WebSocket sync with merge strategies. **Substantial substrate work.**
  - `useInfiniteScroll` (493 lines) handles IntersectionObserver + pagination + deduplication + bidirectional loading. **Substantial substrate work.**
  - `useQueryState` (421 lines) handles URL ↔ state sync with debouncing, type coercion, history API. **Substantial substrate work.**
  - **The problem:** All of this logic is Vue-specific. A React app (or vanilla JS, or Svelte, or Solid) would need to reimplement from scratch.
  - **For the scenario:** The table needs to re-fetch when sort/filter changes. `useQueryState` can sync URL params, and `useLiveData` can fetch. But wiring "when table sorts, re-fetch with new params" requires application code unless there's a composed solution.
  - **Inversion:** Yes — significant substrate logic lives only in Vue adapters. The React adapters (228 lines total) are much thinner and less capable.
  - **Recommendation:** Extract the framework-agnostic core logic from these composables into substrate modules. The Vue/React adapters become thin reactive wrappers around framework-agnostic state machines.

---

### Form state (for filters, date pickers, etc.)

- **Substrate:** `Form` (core, 94 lines), `useForm` (Vue adapter, 118 lines)
- **Status:** 🔄 Inverted — adapter is more capable than core
- **Notes:**
  - **Core `Form`:**
    - Data container with get/set
    - Validation rules (field → error message)
    - Reset to initial values
    - Raw `fetch` calls for store/update/delete (doesn't use `Http`, no Laravel response unwrapping)
  - **Vue `useForm`:**
    - Reactive state wrapper
    - `bind()` helper for v-model integration (text, checkbox, file, select)
    - Delegates HTTP to core Form
  - **Inversion:** The adapter adds meaningful functionality (binding helpers) that could be framework-agnostic patterns. The core Form's `store/update/delete` methods bypass `Http` entirely, which is inconsistent.
  - **For the scenario:** Filter inputs on the dashboard would use Form or useForm. Current implementation is adequate for simple cases but thin for complex forms (multi-step, conditional fields, array fields, server-side validation errors).

---

### Motion / transitions (if charts animate on update)

- **Substrate:** `Motion` (217 lines)
- **Status:** ✅ Covered well
- **Notes:**
  - Provides `Tween` (value interpolation with easing) and `Spring` (physics-based animation).
  - Includes easing function library.
  - For chart animations (bars growing, lines drawing), this provides the primitives.
  - The gap is in integration — without a `Chart` module, Motion can't be automatically applied to chart updates.

---

## Summary

### Missing modules (❌)

1. **Chart** — declarative chart composition from data + config. Without this, every chart requires 50-100+ lines of substrate code in application config. **Highest priority gap.**

2. **Layout/Dashboard** — panel/grid arrangement system. Lower priority; CSS-in-config acceptable for MVP.

### Modules needing enhancement (⚠️)

1. **Table** — thin for server-side table use case. Missing:
   - Server pagination awareness
   - Selection state
   - Column configuration (resize, reorder, visibility)
   - Integration with URL state

2. **Form** — thin, and `store/update/delete` bypass `Http`. Should either use `Http` or be removed (lean into adapters as primary).

### Inverted modules (🔄 — logic in adapter, should be in core)

1. **useInfiniteScroll** — 493 lines of substantial pagination/deduplication/observer logic is Vue-only. Extract to framework-agnostic core.

2. **useLiveData** — 553 lines of HTTP+WebSocket sync with merge strategies is Vue-only. Extract to framework-agnostic core.

3. **useQueryState** — 421 lines of URL ↔ state sync is Vue-only. Extract to framework-agnostic core.

4. **useForm** — `bind()` pattern could be framework-agnostic interface definitions. Core Form should use Http.

### Modules that are fine (✅)

- **Http** — solid foundation for data fetching with Laravel conventions
- **Scale** — D3-style domain/range mapping, all four types implemented well
- **Axis** — clean tick generation from scales
- **Svg** — chainable element creation, works for chart primitives
- **Motion** — Tween + Spring + easing library, ready for animations
- **Socket** — WebSocket wrapper with reconnection (used by useLiveData)
- **Collection** — comprehensive, used by infinite scroll for data management
- **Uploader** — substantial, handles chunking/retry/concurrency

---

## Recommendations

### Highest priority gaps to close

1. **Create a `Chart` module**

   A declarative chart composer that accepts:
   ```typescript
   Chart.create({
     type: 'bar',
     data: [...],
     x: { field: 'region' },
     y: { field: 'revenue' },
     width: 600,
     height: 400,
   }).render(container)
   ```

   Internally orchestrates Scale + Axis + Svg. Supports bar, line, area, pie at minimum. This single module would eliminate the largest source of substrate code leaking into application config.

2. **Extract adapter logic to framework-agnostic core**

   The substantial logic in `useInfiniteScroll`, `useLiveData`, and `useQueryState` should become core modules:
   - `PaginationController` — manages page state, deduplication, load-more logic
   - `LiveSync` — manages HTTP+WebSocket sync with merge strategies
   - `UrlState` — manages URL ↔ state binding

   Vue/React adapters become thin reactive wrappers (~50 lines each). This achieves:
   - React parity with Vue
   - Framework-agnostic substrate
   - Testable core logic without framework dependencies

3. **Enhance Table for server-side use cases**

   Add awareness of Laravel pagination responses, integrate with URL state for sort/filter persistence, add selection state for bulk actions.

### Architectural questions for Matt to decide

1. **Should Chart be a single module or multiple?**
   - Option A: One `Chart` module with `type: 'bar' | 'line' | 'area' | 'pie'`
   - Option B: Separate `BarChart`, `LineChart`, etc. modules
   - Option A is more discoverable for AI; Option B is more tree-shakeable.

2. **Should Graph be extended to cover charting, or kept separate?**
   - `Graph` currently handles node-link diagrams with force/tree/grid/circular layouts.
   - Charts (bar/line/area/pie) are conceptually different — data visualization vs. relationship visualization.
   - Recommendation: Keep separate. `Graph` is for network diagrams; `Chart` is for data charts.

3. **How much layout substrate is needed?**
   - For dashboards, is CSS-in-config acceptable, or should there be a `Layout` module?
   - If dashboards become a major use case, a `Dashboard` module that handles panel arrangement, responsive sizing, and drag-reorder could be valuable.
   - For MVP, CSS-in-config is probably fine. Revisit after Chart is built.

4. **Should Form continue to exist, or lean into adapters only?**
   - Core Form (94 lines) is thin and bypasses Http.
   - Option A: Enhance Form to use Http, add more validation patterns, keep as substrate.
   - Option B: Deprecate core Form, make `useForm` adapters the primary API (they can create internal Form instances).
   - The current middle state is awkward.

---

*Analysis completed. Ready for Matt's review and prioritization decisions.*
