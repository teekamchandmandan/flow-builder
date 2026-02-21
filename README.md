# Flow Builder

A single-page visual flow builder where users construct node-based workflows, connect them with conditional transitions, validate in real time, and export/import as JSON.

**Live demo:** [https://flow-builder-ruddy.vercel.app](https://flow-builder-ruddy.vercel.app)

## Screenshots

|              Flow Canvas with JSON Preview               |                    Node Sidebar Editing                    |
| :------------------------------------------------------: | :--------------------------------------------------------: |
| ![Flow with JSON](public/screenshots/flow-with-json.png) | ![Sidebar Editing](public/screenshots/sidebar-editing.png) |

|                       Validation Errors                        |                   Dark Mode                    |
| :------------------------------------------------------------: | :--------------------------------------------: |
| ![Validation Errors](public/screenshots/validation-errors.png) | ![Dark Mode](public/screenshots/dark-mode.png) |

## Features

- **Canvas** — Add, drag, and delete nodes; connect them by drawing edges; visually mark a start node
- **Edge conditions** — Label each edge with a transition condition; edit inline on the canvas or in the sidebar
- **Node sidebar** — Click a node to edit its label, description, and prompt; manage outgoing edges (add/remove, pick target, write condition, key-value parameters)
- **JSON preview** — Live syntax-highlighted JSON that updates as you edit; copy to clipboard or download
- **Import** — Load a JSON file to reconstruct a flow on canvas with schema validation and error feedback
- **Real-time validation** — Unique IDs, required fields, valid start node, valid edge targets, disconnected-node warnings, self-loop detection; inline errors on every field
- **Undo / Redo** — Snapshot-based history (Cmd/Ctrl+Z, Cmd/Ctrl+Shift+Z)
- **Auto-layout** — Dagre-powered automatic node positioning
- **Dark mode** — System-aware toggle, persisted to localStorage
- **Keyboard shortcuts** — Delete/Backspace removes selection; Cmd/Ctrl+S downloads JSON; Escape closes sidebar

## Run Locally

Requires Node.js 20+ and npm 10+.

```bash
npm install
npm run dev        # http://localhost:5173
```

```bash
npm run build      # type-check + production build
npm run test       # 64 tests across 7 suites
```

## Design Choices

- **React Flow (`@xyflow/react`)** — Purpose-built for node-graph UIs. Handles drag, connect, pan/zoom, selection, and minimap out of the box, avoiding weeks of custom canvas work.
- **Zustand** — Single flat store with no Provider boilerplate. Direct `getState()` access lets toolbar actions (export, layout) read state without subscribing to every re-render.
- **Zod + DFS validation** — Structural schema checks (Zod) combined with graph-level reachability (DFS from start node) run after every mutation so the UI is always consistent with the current validation state.
- **Serialization boundary** — A dedicated layer (`toSchema` / `fromSchema`) separates React Flow's internal types (positions, selection flags) from the clean exported JSON schema, keeping import/export stable and the internal model flexible.
- **Immutable IDs + editable labels** — Auto-generated node IDs never change, so edge references stay valid. Users edit display labels freely without breaking the graph.
- **Tailwind CSS + shadcn/ui** — Utility-first styling with pre-built accessible Radix primitives. Minimal custom component code, consistent look.
