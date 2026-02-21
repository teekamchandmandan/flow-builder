import type { GetState, SetState, StoreState } from '../types';
import { validateState } from '../helpers';

export function createUiSlice(set: SetState, _get: GetState) {
  return {
    selectNode: (nodeId: string | null) => {
      set(() => ({
        selectedNodeId: nodeId,
        sidebarOpen: nodeId !== null,
      }));
    },

    toggleJsonPanel: () => {
      set((state) => ({
        jsonPanelOpen: !state.jsonPanelOpen,
      }));
    },

    closeSidebar: () => {
      set(() => ({
        selectedNodeId: null,
        sidebarOpen: false,
      }));
    },

    validate: () => {
      validateState(_get, set);
    },

    getNodeErrors: (nodeId: string) => {
      const { errors, warnings } = _get();
      return [...errors, ...warnings].filter(
        (issue) => issue.nodeId === nodeId,
      );
    },

    getEdgeErrors: (edgeId: string) => {
      const { errors, warnings } = _get();
      return [...errors, ...warnings].filter(
        (issue) => issue.edgeId === edgeId,
      );
    },
  } satisfies Partial<StoreState>;
}
