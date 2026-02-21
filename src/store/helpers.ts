import { ZodError } from 'zod';

import { MAX_HISTORY_SIZE } from '@/lib/constants';
import { toSchema } from '@/lib/serialization';
import { validateAll } from '@/validation';
import type { GetState, SetState, Snapshot, StoreState } from './types';

/* ------------------------------------------------------------------ */
/*  Zod error formatting                                                */
/* ------------------------------------------------------------------ */

function formatIssuePath(path: (string | number)[]): string {
  if (path.length === 0) return 'root';

  return path
    .map((segment, index) => {
      if (typeof segment === 'number') return `[${segment}]`;
      return index === 0 ? segment : `.${segment}`;
    })
    .join('');
}

export function formatZodIssues(error: ZodError): string[] {
  const messages = error.issues.map((issue) => {
    const path = formatIssuePath(issue.path as (string | number)[]);
    return `${path}: ${issue.message}`;
  });

  return Array.from(new Set(messages));
}

/* ------------------------------------------------------------------ */
/*  Snapshot helpers                                                    */
/* ------------------------------------------------------------------ */

export function toSnapshot(
  state: Pick<StoreState, 'nodes' | 'edges' | 'startNodeId'>,
): Snapshot {
  return {
    nodes: state.nodes,
    edges: state.edges,
    startNodeId: state.startNodeId,
  };
}

export function pushSnapshot(set: SetState, get: GetState): void {
  const snapshot = toSnapshot(get());

  set((state) => {
    const nextPast = [...state.past, snapshot];
    if (nextPast.length > MAX_HISTORY_SIZE) {
      nextPast.shift();
    }

    return {
      past: nextPast,
      future: [],
      canUndo: nextPast.length > 0,
      canRedo: false,
    };
  });
}

/* ------------------------------------------------------------------ */
/*  Validation runner                                                   */
/* ------------------------------------------------------------------ */

export function validateState(get: GetState, set: SetState): void {
  const state = get();
  const schema = toSchema(state.nodes, state.edges, state.startNodeId);
  const result = validateAll(schema);

  set(() => ({
    errors: result.errors,
    warnings: result.warnings,
  }));
}

/* ------------------------------------------------------------------ */
/*  Mutation wrapper: snapshot → apply → validate                       */
/* ------------------------------------------------------------------ */

export function withMutation(
  set: SetState,
  get: GetState,
  updater: (state: StoreState) => Partial<StoreState>,
): void {
  pushSnapshot(set, get);
  set(updater);
  validateState(get, set);
}

/* ------------------------------------------------------------------ */
/*  Initial state factory                                               */
/* ------------------------------------------------------------------ */

export function createInitialState(): Pick<
  StoreState,
  | 'nodes'
  | 'edges'
  | 'startNodeId'
  | 'selectedNodeId'
  | 'sidebarOpen'
  | 'jsonPanelOpen'
  | 'errors'
  | 'warnings'
  | 'past'
  | 'future'
  | 'canUndo'
  | 'canRedo'
> {
  return {
    nodes: [],
    edges: [],
    startNodeId: null,
    selectedNodeId: null,
    sidebarOpen: false,
    jsonPanelOpen: false,
    errors: [],
    warnings: [],
    past: [],
    future: [],
    canUndo: false,
    canRedo: false,
  };
}
