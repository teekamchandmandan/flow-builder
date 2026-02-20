import {
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type EdgeChange,
  type NodeChange,
} from '@xyflow/react';
import { create } from 'zustand';
import { ZodError } from 'zod';

import {
  DEFAULT_NEW_NODE_POSITION_OFFSET,
  MAX_HISTORY_SIZE,
} from '@/lib/constants';
import { fromSchema, toSchema } from '@/lib/serialization';
import { generateId } from '@/lib/utils';
import type { EdgeData, FlowEdge, FlowNode, NodeData } from '@/types/flow';
import type { ValidationError, ValidationWarning } from '@/types/validation';
import { parseFlowSchema } from '@/validation/schemas';
import { validateAll } from '@/validation';

const DEFAULT_FIRST_NODE_POSITION = { x: 200, y: 120 } as const;

type Snapshot = {
  nodes: FlowNode[];
  edges: FlowEdge[];
  startNodeId: string | null;
};

type ImportResult = {
  success: boolean;
  errors?: string[];
};

type StoreState = {
  nodes: FlowNode[];
  edges: FlowEdge[];
  startNodeId: string | null;

  selectedNodeId: string | null;
  sidebarOpen: boolean;
  jsonPanelOpen: boolean;

  errors: ValidationError[];
  warnings: ValidationWarning[];

  past: Snapshot[];
  future: Snapshot[];
  canUndo: boolean;
  canRedo: boolean;

  addNode: () => void;
  deleteNode: (nodeId: string) => void;
  updateNodeData: (nodeId: string, data: Partial<NodeData>) => void;
  setStartNode: (nodeId: string) => void;

  addEdge: (connection: Connection) => void;
  deleteEdge: (edgeId: string) => void;
  updateEdgeData: (edgeId: string, data: Partial<EdgeData>) => void;
  updateEdgeTarget: (edgeId: string, targetNodeId: string) => void;

  onNodesChange: (changes: NodeChange<FlowNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<FlowEdge>[]) => void;

  selectNode: (nodeId: string | null) => void;
  toggleJsonPanel: () => void;
  closeSidebar: () => void;

  validate: () => void;
  getNodeErrors: (nodeId: string) => (ValidationError | ValidationWarning)[];
  getEdgeErrors: (edgeId: string) => (ValidationError | ValidationWarning)[];

  exportJSON: () => string;
  importJSON: (jsonString: string) => ImportResult;

  undo: () => void;
  redo: () => void;

  reset: () => void;
};

function toSnapshot(
  state: Pick<StoreState, 'nodes' | 'edges' | 'startNodeId'>,
): Snapshot {
  return {
    nodes: state.nodes,
    edges: state.edges,
    startNodeId: state.startNodeId,
  };
}

function updateHistoryFlags(
  set: (updater: (state: StoreState) => Partial<StoreState>) => void,
): void {
  set((state) => ({
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
  }));
}

function pushSnapshot(
  set: (updater: (state: StoreState) => Partial<StoreState>) => void,
  get: () => StoreState,
): void {
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

function validateState(
  get: () => StoreState,
  set: (updater: (state: StoreState) => Partial<StoreState>) => void,
): void {
  const state = get();
  const schema = toSchema(state.nodes, state.edges, state.startNodeId);
  const result = validateAll(schema);

  set(() => ({
    errors: result.errors,
    warnings: result.warnings,
  }));
}

function createInitialState(): Pick<
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

export const useFlowStore = create<StoreState>((set, get) => ({
  ...createInitialState(),

  addNode: () => {
    pushSnapshot(set, get);

    set((state) => {
      const lastNode = state.nodes[state.nodes.length - 1];
      const position = lastNode
        ? {
            x: lastNode.position.x + DEFAULT_NEW_NODE_POSITION_OFFSET.x,
            y: lastNode.position.y + DEFAULT_NEW_NODE_POSITION_OFFSET.y,
          }
        : { ...DEFAULT_FIRST_NODE_POSITION };

      const node: FlowNode = {
        id: generateId(),
        position,
        data: {
          label: 'New Node',
          description: '',
          prompt: '',
        },
      };

      return {
        nodes: [...state.nodes, node],
      };
    });

    get().validate();
  },

  deleteNode: (nodeId) => {
    const state = get();
    const exists = state.nodes.some((node) => node.id === nodeId);

    if (!exists) {
      return;
    }

    pushSnapshot(set, get);

    set((current) => {
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

    get().validate();
  },

  updateNodeData: (nodeId, data) => {
    const state = get();
    const exists = state.nodes.some((node) => node.id === nodeId);

    if (!exists) {
      return;
    }

    pushSnapshot(set, get);

    set((current) => ({
      nodes: current.nodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                ...data,
              },
            }
          : node,
      ),
    }));

    get().validate();
  },

  setStartNode: (nodeId) => {
    const state = get();
    const exists = state.nodes.some((node) => node.id === nodeId);

    if (!exists) {
      return;
    }

    pushSnapshot(set, get);

    set(() => ({
      startNodeId: nodeId,
    }));

    get().validate();
  },

  addEdge: (connection) => {
    const { source, target } = connection;

    if (!source || !target) {
      return;
    }

    pushSnapshot(set, get);

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

    set((state) => ({
      edges: [...state.edges, newEdge],
    }));

    get().validate();
  },

  deleteEdge: (edgeId) => {
    const state = get();
    const exists = state.edges.some((edge) => edge.id === edgeId);

    if (!exists) {
      return;
    }

    pushSnapshot(set, get);

    set((current) => ({
      edges: current.edges.filter((edge) => edge.id !== edgeId),
    }));

    get().validate();
  },

  updateEdgeData: (edgeId, data) => {
    const state = get();
    const exists = state.edges.some((edge) => edge.id === edgeId);

    if (!exists) {
      return;
    }

    pushSnapshot(set, get);

    set((current) => ({
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

    get().validate();
  },

  updateEdgeTarget: (edgeId, targetNodeId) => {
    const state = get();
    const edgeExists = state.edges.some((edge) => edge.id === edgeId);
    const targetExists = state.nodes.some((node) => node.id === targetNodeId);

    if (!edgeExists || !targetExists) {
      return;
    }

    pushSnapshot(set, get);

    set((current) => ({
      edges: current.edges.map((edge) =>
        edge.id === edgeId
          ? {
              ...edge,
              target: targetNodeId,
            }
          : edge,
      ),
    }));

    get().validate();
  },

  onNodesChange: (changes) => {
    set((state) => ({
      nodes: applyNodeChanges<FlowNode>(changes, state.nodes),
    }));
  },

  onEdgesChange: (changes) => {
    const removed = changes.some((change) => change.type === 'remove');

    set((state) => ({
      edges: applyEdgeChanges<FlowEdge>(changes, state.edges),
    }));

    if (removed) {
      get().validate();
    }
  },

  selectNode: (nodeId) => {
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
    validateState(get, set);
  },

  getNodeErrors: (nodeId) => {
    const { errors, warnings } = get();

    return [...errors, ...warnings].filter((issue) => issue.nodeId === nodeId);
  },

  getEdgeErrors: (edgeId) => {
    const { errors, warnings } = get();

    return [...errors, ...warnings].filter((issue) => issue.edgeId === edgeId);
  },

  exportJSON: () => {
    const state = get();
    const schema = toSchema(state.nodes, state.edges, state.startNodeId);
    return JSON.stringify(schema, null, 2);
  },

  importJSON: (jsonString) => {
    try {
      const parsed = JSON.parse(jsonString) as unknown;
      const schema = parseFlowSchema(parsed);
      const hydrated = fromSchema(schema);

      set((state) => ({
        nodes: hydrated.nodes,
        edges: hydrated.edges,
        startNodeId: hydrated.startNodeId,
        selectedNodeId: null,
        sidebarOpen: false,
        past: [],
        future: [],
        canUndo: false,
        canRedo: false,
        errors: state.errors,
        warnings: state.warnings,
      }));

      get().validate();

      return { success: true };
    } catch (error) {
      if (error instanceof ZodError) {
        return {
          success: false,
          errors: error.issues.map((issue) => issue.message),
        };
      }

      if (error instanceof Error) {
        return { success: false, errors: [error.message] };
      }

      return { success: false, errors: ['Invalid JSON input'] };
    }
  },

  undo: () => {
    const state = get();

    if (state.past.length === 0) {
      return;
    }

    const previous = state.past[state.past.length - 1];
    const currentSnapshot = toSnapshot(state);

    set(() => ({
      nodes: previous.nodes,
      edges: previous.edges,
      startNodeId: previous.startNodeId,
      past: state.past.slice(0, -1),
      future: [currentSnapshot, ...state.future],
      selectedNodeId: null,
      sidebarOpen: false,
    }));

    updateHistoryFlags(set);
    get().validate();
  },

  redo: () => {
    const state = get();

    if (state.future.length === 0) {
      return;
    }

    const [next, ...remainingFuture] = state.future;
    const currentSnapshot = toSnapshot(state);

    set(() => {
      const nextPast = [...state.past, currentSnapshot];
      if (nextPast.length > MAX_HISTORY_SIZE) {
        nextPast.shift();
      }

      return {
        nodes: next.nodes,
        edges: next.edges,
        startNodeId: next.startNodeId,
        past: nextPast,
        future: remainingFuture,
        selectedNodeId: null,
        sidebarOpen: false,
      };
    });

    updateHistoryFlags(set);
    get().validate();
  },

  reset: () => {
    set(() => ({
      ...createInitialState(),
    }));
  },
}));

export function isValidConnection(connection: Connection | FlowEdge): boolean {
  const source = connection.source;
  const target = connection.target;

  if (!source || !target) {
    return false;
  }

  if (source === target) {
    return false;
  }

  const edges = useFlowStore.getState().edges;
  const hasDuplicate = edges.some(
    (edge) => edge.source === source && edge.target === target,
  );

  return !hasDuplicate;
}
