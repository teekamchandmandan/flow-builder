import type { Edge, Node } from '@xyflow/react';

export interface NodeData {
  label: string;
  description: string;
  prompt: string;
}

export interface EdgeData {
  condition: string;
  parameters?: Record<string, string>;
}

export type FlowNode = Node<NodeData>;
export type FlowEdge = Edge<EdgeData>;
