import type { Edge, Node } from '@xyflow/react';

export interface NodeData {
  label: string;
  description: string;
  prompt: string;
  [key: string]: unknown;
}

export interface EdgeData {
  condition: string;
  parameters?: Record<string, string>;
  [key: string]: unknown;
}

export type FlowNode = Node<NodeData>;
export type FlowEdge = Edge<EdgeData>;
