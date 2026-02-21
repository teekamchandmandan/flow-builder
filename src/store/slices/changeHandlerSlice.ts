import {
  applyEdgeChanges,
  applyNodeChanges,
  type EdgeChange,
  type NodeChange,
} from '@xyflow/react';

import type { FlowEdge, FlowNode } from '@/types/flow';
import type { GetState, SetState, StoreState } from '../types';
import { pushSnapshot, validateState } from '../helpers';

export function createChangeHandlerSlice(set: SetState, get: GetState) {
  return {
    onNodesChange: (changes: NodeChange<FlowNode>[]) => {
      const hasRemove = changes.some((c) => c.type === 'remove');

      if (hasRemove) pushSnapshot(set, get);

      set((state) => {
        const nextNodes = applyNodeChanges<FlowNode>(changes, state.nodes);
        const removedIds = new Set(
          changes.filter((c) => c.type === 'remove').map((c) => c.id),
        );

        return {
          nodes: nextNodes,
          startNodeId:
            state.startNodeId && removedIds.has(state.startNodeId)
              ? null
              : state.startNodeId,
          selectedNodeId:
            state.selectedNodeId && removedIds.has(state.selectedNodeId)
              ? null
              : state.selectedNodeId,
          sidebarOpen:
            state.selectedNodeId && removedIds.has(state.selectedNodeId)
              ? false
              : state.sidebarOpen,
        };
      });

      if (hasRemove) validateState(get, set);
    },

    onEdgesChange: (changes: EdgeChange<FlowEdge>[]) => {
      const hasRemove = changes.some((c) => c.type === 'remove');

      if (hasRemove) pushSnapshot(set, get);

      set((state) => ({
        edges: applyEdgeChanges<FlowEdge>(changes, state.edges),
      }));

      if (hasRemove) validateState(get, set);
    },
  } satisfies Partial<StoreState>;
}
