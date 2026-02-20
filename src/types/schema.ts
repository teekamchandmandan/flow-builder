export interface SchemaEdge {
  to_node_id: string;
  condition: string;
  parameters?: Record<string, string>;
}

export interface SchemaNode {
  id: string;
  label?: string;
  description: string;
  prompt: string;
  edges: SchemaEdge[];
  position?: { x: number; y: number };
}

export interface FlowSchema {
  startNodeId: string;
  nodes: SchemaNode[];
}
