# Flow Builder

A visual flow builder built with React + TypeScript.

Users can create conversational/logic flows as nodes and conditional edges, validate graph data, and serialize state into a schema-safe JSON structure.

## Stack

- React 19 + TypeScript + Vite
- React Flow (`@xyflow/react`) for graph modeling and canvas primitives
- Zustand for app state
- Zod for schema validation
- Dagre for auto-layout
- Tailwind CSS + shadcn/ui for UI foundations
- Vitest + Testing Library for tests

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+

### Install

```bash
npm install
```

### Run locally

```bash
npm run dev
```

Open the local URL shown by Vite (typically `http://localhost:5173`).

## Scripts

- `npm run dev` — start development server
- `npm run build` — type-check and create production build
- `npm run preview` — preview production build locally
- `npm run lint` — run ESLint
- `npm run test` — run tests once
- `npm run test:watch` — run tests in watch mode

## Data Layer

The project defines a strict separation between:

- Internal graph types (`FlowNode`, `FlowEdge`)
- Export schema types (`FlowSchema`, `SchemaNode`, `SchemaEdge`)

Core modules:

- `src/types/*` — type definitions
- `src/validation/*` — schema validation + graph validation
- `src/lib/serialization.ts` — conversion between React Flow state and export schema
- `src/lib/layout.ts` — auto-layout with Dagre

## Validation Rules

Current validation covers:

- unique node IDs
- valid `startNodeId`
- valid edge target references
- disconnected node warnings
- self-loop warnings

## Test Coverage

Includes a serialization round-trip test to verify that converting flow data to schema and back preserves structure.

## Project Structure

```text
src/
  components/
  lib/
  types/
  validation/
  App.tsx
  main.tsx
```

## Notes

- Path alias `@/` maps to `src/`
- Vitest is configured with `jsdom`
