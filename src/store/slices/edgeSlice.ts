import type { Connection } from '@xyflow/react';

import { generateId } from '@/lib/utils';
import type { EdgeData, FlowEdge } from '@/types/flow';
import type { GetState, SetState, StoreState } from '../types';
import { withMutation } from '../helpers';

export function createEdgeSlice(set: SetState, get: GetState) {
  return {
    addEdge: (connection: Connection) => {
      const { source, target } = connection;
      if (!source || !target) return;

      const newEdge: FlowEdge = {
        id: generateId(),
        source,
        target,
        sourceHandle: connection.sourceHandle,
        targetHandle: connection.targetHandle,
        data: {
          condition: 'New condition',
          parameters: {},
        },
      };

      withMutation(set, get, (state) => ({
        edges: [...state.edges, newEdge],
      }));
    },

    deleteEdge: (edgeId: string) => {
      if (!get().edges.some((edge) => edge.id === edgeId)) return;

      withMutation(set, get, (current) => ({
        edges: current.edges.filter((edge) => edge.id !== edgeId),
      }));
    },

    updateEdgeData: (edgeId: string, data: Partial<EdgeData>) => {
      if (!get().edges.some((edge) => edge.id === edgeId)) return;

      withMutation(set, get, (current) => ({
        edges: current.edges.map((edge) =>
          edge.id === edgeId
            ? {
                ...edge,
                data: {
                  condition: edge.data?.condition ?? 'New condition',
                  parameters: edge.data?.parameters ?? {},
                  ...data,
                },
              }
            : edge,
        ),
      }));
    },

    updateEdgeTarget: (edgeId: string, targetNodeId: string) => {
      const state = get();
      const edgeExists = state.edges.some((edge) => edge.id === edgeId);
      const targetExists = state.nodes.some((node) => node.id === targetNodeId);
      if (!edgeExists || !targetExists) return;

      withMutation(set, get, (current) => ({
        edges: current.edges.map((edge) =>
          edge.id === edgeId ? { ...edge, target: targetNodeId } : edge,
        ),
      }));
    },
  } satisfies Partial<StoreState>;
}
