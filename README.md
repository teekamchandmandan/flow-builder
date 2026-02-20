# Flow Builder

A visual drag-and-drop flow builder for creating conversational/logic flows with nodes, conditional edges, real-time validation, and schema-safe JSON export.

<!-- TODO: Add screenshot/GIF of the deployed app showing a flow with connected nodes, sidebar, and JSON panel -->

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## Features

### Core

- **Visual Canvas** — Drag-and-drop node graph editor with snap-to-grid, minimap, and smooth-step edges
- **Node Editing** — Add, edit (label, description, prompt), and delete nodes via a sidebar panel
- **Edge Editing** — Connect nodes by dragging handles; edit condition text inline on the canvas or in the sidebar
- **Start Node** — Designate any node as the flow entry point with a visual indicator (violet border + badge)
- **JSON Preview** — Collapsible panel with syntax-highlighted, live-updating JSON output

### Validations

- Inline errors in sidebar with `aria-invalid` fields and red border on invalid nodes
- Required fields: description, prompt, edge conditions must be non-empty
- Unique node IDs enforced
- `startNodeId` must reference an existing node
- Edge targets must reference existing nodes
- Disconnected node warnings (DFS reachability from start)
- Self-loop warnings
- Live validation badge in toolbar (green/red/amber)

### Bonus

- **Import / Export** — Download JSON, copy to clipboard, or import a JSON file with Zod validation and error feedback
- **Delete Key** — Press Backspace/Delete to remove selected nodes or edges
- **Disconnected Warnings** — Nodes unreachable from the start node are flagged
- **Edge Parameters** — Key-value parameter editor on each edge (add/remove/edit rows)

### Extras

- **Undo / Redo** — Snapshot-based history (up to 50 entries) with Cmd/Ctrl+Z and Cmd/Ctrl+Shift+Z
- **Dark Mode** — System-aware toggle, persisted to localStorage
- **Auto-Layout** — Dagre-powered top-to-bottom graph layout, applied on demand or on import
- **MiniMap** — React Flow minimap for orientation on large graphs
- **Keyboard Shortcuts** — See table below
- **Empty State** — Helpful prompt when the canvas is empty
- **Error Boundaries** — App-level and canvas-level error boundaries with recovery actions
- **Toast Notifications** — Feedback on import, export, copy, layout, and delete actions

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Cmd/Ctrl+Z | Undo |
| Cmd/Ctrl+Shift+Z | Redo |
| Cmd/Ctrl+S | Download JSON |
| Delete/Backspace | Remove selected node or edge |
| Escape | Close sidebar |

## Tech Stack

| Technology | Rationale |
|------------|-----------|
| **React 19 + TypeScript + Vite** | Fast iteration with type safety and near-instant HMR. Vite's ESM-native dev server keeps feedback loops tight. |
| **React Flow (`@xyflow/react`)** | Purpose-built library for node-based graph UIs — handles rendering, interaction, viewport, and connection logic out of the box. |
| **Zustand** | Minimal boilerplate global state without Context/Provider nesting. Direct `getState()` access enables deferred reads that avoid unnecessary re-renders. Simpler than Redux for a single-store app. |
| **Tailwind CSS + shadcn/ui** | Utility-first styling with pre-built, accessible Radix-based components (Dialog, Select, Switch, Tooltip, Sheet). Avoids writing custom primitives. |
| **Zod** | Runtime schema validation for JSON import/export, with structured error paths that map directly to field-level UI feedback. |
| **react-syntax-highlighter** | Syntax-highlighted JSON preview with dark/light theme support (atom-one-dark / atom-one-light). |
| **@dagrejs/dagre** | Directed graph layout algorithm for automatic node positioning. |
| **Vitest + Testing Library** | Fast Vite-native test runner with jsdom, compatible with React Testing Library. |

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    App Shell                         │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │ Toolbar  │  │  FlowCanvas  │  │ JSON Preview  │  │
│  │ (actions)│  │ (React Flow) │  │ (serialized)  │  │
│  └──────────┘  └──────┬───────┘  └───────┬───────┘  │
│                       │                  │           │
│                ┌──────▼──────────────────▼──────┐    │
│                │     Zustand Store (single)     │    │
│                │  nodes, edges, startNodeId,    │    │
│                │  selection, validation, history │    │
│                └──────┬────────────────┬────────┘    │
│                       │                │             │
│              ┌────────▼───┐    ┌───────▼────────┐    │
│              │ Validation │    │ Serialization  │    │
│              │ Zod + BFS  │    │ Internal ↔ JSON│    │
│              └────────────┘    └────────────────┘    │
└─────────────────────────────────────────────────────┘
```

- **Zustand store** is the single source of truth — components subscribe to minimal slices to avoid unnecessary re-renders
- **React Flow** renders the graph and handles user interactions (drag, connect, select)
- **Zod + DFS** validates schema structure and graph connectivity in real-time after every mutation
- **Serialization layer** cleanly separates internal React Flow types (`FlowNode`, `FlowEdge`) from the export schema (`SchemaNode`, `SchemaEdge`)

## Design Decisions

### Why React Flow over alternatives

React Flow (`@xyflow/react`) provides a complete node graph toolkit — handles pan/zoom viewport, node dragging, edge connections, minimap, and selection out of the box. Building these primitives from scratch (e.g., with D3 or raw SVG) would have been weeks of work for the same result.

### Why Zustand (not Context or Redux)

Zustand offers a single `create()` call with no Provider boilerplate. Direct `getState()` reads let toolbar actions (auto-layout, export) access state without subscribing to every node position change. For a single-store app with 20+ actions, Zustand's simplicity is a major advantage over Redux's action/reducer ceremony.

### Why separate internal and export type systems

React Flow nodes carry rendering metadata (position, selected, measured dimensions) that shouldn't leak into the exported JSON schema. A dedicated serialization layer (`toSchema` / `fromSchema`) keeps the export clean and the internal model flexible.

### Why immutable IDs + editable labels

Node IDs are auto-generated (`generateId()`) and never change — edge references remain valid. Labels are user-editable display names that don't affect graph structure.

### Validation timing strategy

Validation runs synchronously after every mutation via a `withMutation` helper that wraps every store action with `pushSnapshot → apply change → validate`. This ensures the UI is always consistent with the current validation state without debouncing or manual triggers.

## Project Structure

```
src/
  components/
    Canvas/       — FlowCanvas, CustomNode, CustomEdge, EmptyState
    JsonPreview/  — JsonPreview panel, ImportDialog
    Layout/       — AppLayout, Toolbar, ValidationPanel
    Sidebar/      — NodeSidebar, EdgeEditor, ParameterEditor, ValidatedField
    ui/           — shadcn/ui primitives
  hooks/          — useDarkMode
  lib/            — constants, layout (dagre), serialization, utils
  store/          — Zustand flowStore
  types/          — flow types, schema types, validation types
  validation/     — Zod schemas, graph validation (DFS), combined validator
```

## Testing

```bash
npm run test
```

- **Store tests** (9 tests) — Unit tests against Zustand store: addNode, deleteNode (cascading edge removal), setStartNode, updateEdgeTarget, validate, exportJSON, importJSON (success + failure), undo
- **Serialization tests** — Round-trip: `toSchema` → validate → `fromSchema` → verify data preservation
- **App smoke test** — Full `<App>` render, asserts React Flow container mounts

## Build

```bash
npm run build
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Type-check and create production build |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |
| `npm run test` | Run tests once |
| `npm run test:watch` | Run tests in watch mode |
