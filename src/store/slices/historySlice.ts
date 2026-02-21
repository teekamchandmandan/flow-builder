import { MAX_HISTORY_SIZE } from '@/lib/constants';
import type { GetState, SetState, StoreState } from '../types';
import { toSnapshot, validateState } from '../helpers';

export function createHistorySlice(set: SetState, get: GetState) {
  return {
    undo: () => {
      const state = get();
      if (state.past.length === 0) return;

      const previous = state.past[state.past.length - 1];
      const currentSnapshot = toSnapshot(state);
      const newPast = state.past.slice(0, -1);
      const newFuture = [currentSnapshot, ...state.future];

      set(() => ({
        nodes: previous.nodes,
        edges: previous.edges,
        startNodeId: previous.startNodeId,
        past: newPast,
        future: newFuture,
        canUndo: newPast.length > 0,
        canRedo: newFuture.length > 0,
        selectedNodeId: null,
        sidebarOpen: false,
      }));

      validateState(get, set);
    },

    redo: () => {
      const state = get();
      if (state.future.length === 0) return;

      const [next, ...remainingFuture] = state.future;
      const currentSnapshot = toSnapshot(state);
      const nextPast = [...state.past, currentSnapshot];
      if (nextPast.length > MAX_HISTORY_SIZE) {
        nextPast.shift();
      }

      set(() => ({
        nodes: next.nodes,
        edges: next.edges,
        startNodeId: next.startNodeId,
        past: nextPast,
        future: remainingFuture,
        canUndo: nextPast.length > 0,
        canRedo: remainingFuture.length > 0,
        selectedNodeId: null,
        sidebarOpen: false,
      }));

      validateState(get, set);
    },
  } satisfies Partial<StoreState>;
}
