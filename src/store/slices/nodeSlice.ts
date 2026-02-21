import { DEFAULT_NEW_NODE_POSITION_OFFSET } from '@/lib/constants';
import { generateId } from '@/lib/utils';
import type { FlowNode } from '@/types/flow';
import type { GetState, SetState, StoreState } from '../types';
import { withMutation } from '../helpers';

const DEFAULT_FIRST_NODE_POSITION = { x: 200, y: 120 } as const;

export function createNodeSlice(set: SetState, get: GetState) {
  return {
    addNode: () => {
      withMutation(set, get, (state) => {
        const lastNode = state.nodes[state.nodes.length - 1];
        const position = lastNode
          ? {
              x: lastNode.position.x + DEFAULT_NEW_NODE_POSITION_OFFSET.x,
              y: lastNode.position.y + DEFAULT_NEW_NODE_POSITION_OFFSET.y,
            }
          : { ...DEFAULT_FIRST_NODE_POSITION };

        const node: FlowNode = {
          id: generateId(),
          type: 'custom',
          position,
          data: {
            label: 'New Node',
            description: '',
            prompt: '',
          },
        };

        return { nodes: [...state.nodes, node] };
      });
    },

    deleteNode: (nodeId: string) => {
      const state = get();
      if (!state.nodes.some((node) => node.id === nodeId)) return;

      const connectedEdgeCount = state.edges.filter(
        (edge) => edge.source === nodeId || edge.target === nodeId,
      ).length;

      withMutation(set, get, (current) => {
        const nodes = current.nodes.filter((node) => node.id !== nodeId);
        const edges = current.edges.filter(
          (edge) => edge.source !== nodeId && edge.target !== nodeId,
        );

        return {
          nodes,
          edges,
          startNodeId:
            current.startNodeId === nodeId ? null : current.startNodeId,
          selectedNodeId:
            current.selectedNodeId === nodeId ? null : current.selectedNodeId,
          sidebarOpen:
            current.selectedNodeId === nodeId ? false : current.sidebarOpen,
        };
      });

      return connectedEdgeCount;
    },

    updateNodeData: (
      nodeId: string,
      data: Partial<StoreState['nodes'][number]['data']>,
    ) => {
      if (!get().nodes.some((node) => node.id === nodeId)) return;

      withMutation(set, get, (current) => ({
        nodes: current.nodes.map((node) =>
          node.id === nodeId
            ? { ...node, data: { ...node.data, ...data } }
            : node,
        ),
      }));
    },

    setStartNode: (nodeId: string | null) => {
      if (nodeId !== null && !get().nodes.some((n) => n.id === nodeId)) return;

      withMutation(set, get, () => ({ startNodeId: nodeId }));
    },
  } satisfies Partial<StoreState>;
}
