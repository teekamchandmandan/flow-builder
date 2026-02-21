import type { Connection } from '@xyflow/react';
import { create } from 'zustand';

import type { FlowEdge } from '@/types/flow';
import type { StoreState } from './types';
import { createInitialState } from './helpers';
import { createNodeSlice } from './slices/nodeSlice';
import { createEdgeSlice } from './slices/edgeSlice';
import { createChangeHandlerSlice } from './slices/changeHandlerSlice';
import { createUiSlice } from './slices/uiSlice';
import { createHistorySlice } from './slices/historySlice';
import { createIOSlice } from './slices/ioSlice';

/**
 * Main Zustand store — composed from focused slices.
 *
 * Each slice lives in `store/slices/*` and owns a coherent subset of
 * state + actions.  Types are in `store/types.ts`; shared helpers
 * (snapshot, validation, mutation wrapper) are in `store/helpers.ts`.
 */
export const useFlowStore = create<StoreState>((set, get) => ({
  ...createInitialState(),
  ...createNodeSlice(set, get),
  ...createEdgeSlice(set, get),
  ...createChangeHandlerSlice(set, get),
  ...createUiSlice(set, get),
  ...createHistorySlice(set, get),
  ...createIOSlice(set, get),
}));

/* ------------------------------------------------------------------ */
/*  Standalone connection validator (used by React Flow)                */
/* ------------------------------------------------------------------ */

export function isValidConnection(connection: Connection | FlowEdge): boolean {
  const { source, target } = connection;
  if (!source || !target) return false;
  if (source === target) return false;

  const edges = useFlowStore.getState().edges;
  return !edges.some(
    (edge) => edge.source === source && edge.target === target,
  );
}
