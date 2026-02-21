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
import type {
  ValidationError,
  ValidationIssue,
  ValidationWarning,
} from '@/types/validation';
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

function formatIssuePath(path: (string | number)[]): string {
  if (path.length === 0) {
    return 'root';
  }

  return path
    .map((segment, index) => {
      if (typeof segment === 'number') {
        return `[${segment}]`;
      }

      if (index === 0) {
        return segment;
      }

      return `.${segment}`;
    })
    .join('');
}

function formatZodIssues(error: ZodError): string[] {
  const messages = error.issues.map((issue) => {
    const path = formatIssuePath(issue.path as (string | number)[]);
    return `${path}: ${issue.message}`;
  });

  return Array.from(new Set(messages));
}

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
  deleteNode: (nodeId: string) => number | undefined;
  updateNodeData: (nodeId: string, data: Partial<NodeData>) => void;
  setStartNode: (nodeId: string | null) => void;

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
  getNodeErrors: (nodeId: string) => ValidationIssue[];
  getEdgeErrors: (edgeId: string) => ValidationIssue[];

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

/**
 * Wraps a typical mutation: pushSnapshot → apply updater → validate.
 * Reduces boilerplate across all mutating store actions.
 */
function withMutation(
  set: (updater: (state: StoreState) => Partial<StoreState>) => void,
  get: () => StoreState,
  updater: (state: StoreState) => Partial<StoreState>,
): void {
  pushSnapshot(set, get);
  set(updater);
  validateState(get, set);
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
  },

  deleteNode: (nodeId) => {
    const state = get();
    const exists = state.nodes.some((node) => node.id === nodeId);

    if (!exists) {
      return;
    }

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

  updateNodeData: (nodeId, data) => {
    const state = get();
    const exists = state.nodes.some((node) => node.id === nodeId);

    if (!exists) {
      return;
    }

    withMutation(set, get, (current) => ({
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
  },

  setStartNode: (nodeId) => {
    if (nodeId !== null) {
      const state = get();
      const exists = state.nodes.some((node) => node.id === nodeId);

      if (!exists) {
        return;
      }
    }

    withMutation(set, get, () => ({
      startNodeId: nodeId,
    }));
  },

  addEdge: (connection) => {
    const { source, target } = connection;

    if (!source || !target) {
      return;
    }

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

  deleteEdge: (edgeId) => {
    const state = get();
    const exists = state.edges.some((edge) => edge.id === edgeId);

    if (!exists) {
      return;
    }

    withMutation(set, get, (current) => ({
      edges: current.edges.filter((edge) => edge.id !== edgeId),
    }));
  },

  updateEdgeData: (edgeId, data) => {
    const state = get();
    const exists = state.edges.some((edge) => edge.id === edgeId);

    if (!exists) {
      return;
    }

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

  updateEdgeTarget: (edgeId, targetNodeId) => {
    const state = get();
    const edgeExists = state.edges.some((edge) => edge.id === edgeId);
    const targetExists = state.nodes.some((node) => node.id === targetNodeId);

    if (!edgeExists || !targetExists) {
      return;
    }

    withMutation(set, get, (current) => ({
      edges: current.edges.map((edge) =>
        edge.id === edgeId
          ? {
              ...edge,
              target: targetNodeId,
            }
          : edge,
      ),
    }));
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
        return {
          success: false,
          errors: formatZodIssues(error),
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

    if (state.future.length === 0) {
      return;
    }

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
