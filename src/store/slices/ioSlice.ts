import { ZodError } from 'zod';

import { fromSchema, toSchema } from '@/lib/serialization';
import { parseFlowSchema } from '@/validation/schemas';
import type { GetState, SetState, StoreState } from '../types';
import { createInitialState, formatZodIssues } from '../helpers';

export function createIOSlice(set: SetState, get: GetState) {
  return {
    exportJSON: () => {
      const state = get();
      const schema = toSchema(state.nodes, state.edges, state.startNodeId);
      return JSON.stringify(schema, null, 2);
    },

    importJSON: (jsonString: string) => {
      try {
        const parsed = JSON.parse(jsonString) as unknown;
        const schema = parseFlowSchema(parsed);
        const hydrated = fromSchema(schema);

        set(() => ({
          nodes: hydrated.nodes,
          edges: hydrated.edges,
          startNodeId: hydrated.startNodeId,
          selectedNodeId: null,
          sidebarOpen: false,
          past: [],
          future: [],
          canUndo: false,
          canRedo: false,
        }));

        get().validate();

        return { success: true };
      } catch (error) {
        if (error instanceof ZodError) {
          return { success: false, errors: formatZodIssues(error) };
        }
        if (error instanceof Error) {
          return { success: false, errors: [error.message] };
        }
        return { success: false, errors: ['Invalid JSON input'] };
      }
    },

    reset: () => {
      set(() => ({ ...createInitialState() }));
    },
  } satisfies Partial<StoreState>;
}
