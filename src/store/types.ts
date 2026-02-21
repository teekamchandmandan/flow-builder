import type { Connection, EdgeChange, NodeChange } from '@xyflow/react';

import type { EdgeData, FlowEdge, FlowNode, NodeData } from '@/types/flow';
import type {
  ValidationError,
  ValidationIssue,
  ValidationWarning,
} from '@/types/validation';

/* ------------------------------------------------------------------ */
/*  Snapshot for undo / redo history                                    */
/* ------------------------------------------------------------------ */

export type Snapshot = {
  nodes: FlowNode[];
  edges: FlowEdge[];
  startNodeId: string | null;
};

/* ------------------------------------------------------------------ */
/*  Import result                                                       */
/* ------------------------------------------------------------------ */

export type ImportResult = {
  success: boolean;
  errors?: string[];
};

/* ------------------------------------------------------------------ */
/*  Store state                                                         */
/* ------------------------------------------------------------------ */

export type StoreState = {
  /* Data */
  nodes: FlowNode[];
  edges: FlowEdge[];
  startNodeId: string | null;

  /* UI */
  selectedNodeId: string | null;
  sidebarOpen: boolean;
  jsonPanelOpen: boolean;

  /* Validation */
  errors: ValidationError[];
  warnings: ValidationWarning[];

  /* History */
  past: Snapshot[];
  future: Snapshot[];
  canUndo: boolean;
  canRedo: boolean;

  /* Node actions */
  addNode: () => void;
  deleteNode: (nodeId: string) => number | undefined;
  updateNodeData: (nodeId: string, data: Partial<NodeData>) => void;
  setStartNode: (nodeId: string | null) => void;

  /* Edge actions */
  addEdge: (connection: Connection) => void;
  deleteEdge: (edgeId: string) => void;
  updateEdgeData: (edgeId: string, data: Partial<EdgeData>) => void;
  updateEdgeTarget: (edgeId: string, targetNodeId: string) => void;

  /* React Flow change handlers */
  onNodesChange: (changes: NodeChange<FlowNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<FlowEdge>[]) => void;

  /* UI actions */
  selectNode: (nodeId: string | null) => void;
  toggleJsonPanel: () => void;
  closeSidebar: () => void;

  /* Validation actions */
  validate: () => void;
  getNodeErrors: (nodeId: string) => ValidationIssue[];
  getEdgeErrors: (edgeId: string) => ValidationIssue[];

  /* I/O */
  exportJSON: () => string;
  importJSON: (jsonString: string) => ImportResult;

  /* History */
  undo: () => void;
  redo: () => void;

  /* Reset */
  reset: () => void;
};

/* ------------------------------------------------------------------ */
/*  Setter / getter type aliases used by slices                        */
/* ------------------------------------------------------------------ */

export type SetState = (
  updater: (state: StoreState) => Partial<StoreState>,
) => void;
export type GetState = () => StoreState;
