import { autoLayout } from '@/lib/layout';
import { generateId } from '@/lib/utils';
import type { FlowEdge, FlowNode } from '@/types/flow';
import type { FlowSchema, SchemaEdge, SchemaNode } from '@/types/schema';

export function toSchema(nodes: FlowNode[], edges: FlowEdge[], startNodeId: string | null): FlowSchema {
  const edgesBySource = new Map<string, FlowEdge[]>();

  for (const edge of edges) {
    const existing = edgesBySource.get(edge.source);
    if (existing) {
      existing.push(edge);
    } else {
      edgesBySource.set(edge.source, [edge]);
    }
  }

  const schemaNodes: SchemaNode[] = nodes.map((node) => {
    const nodeEdges = edgesBySource.get(node.id) ?? [];

    const schemaEdges: SchemaEdge[] = nodeEdges.map((edge) => ({
      to_node_id: edge.target,
      condition: edge.data?.condition ?? '',
      parameters: edge.data?.parameters,
    }));

    return {
      id: node.id,
      label: node.data.label,
      description: node.data.description,
      prompt: node.data.prompt,
      edges: schemaEdges,
      position: {
        x: node.position.x,
        y: node.position.y,
      },
    };
  });

  return {
    startNodeId: startNodeId ?? nodes[0]?.id ?? '',
    nodes: schemaNodes,
  };
}

export function fromSchema(schema: FlowSchema): { nodes: FlowNode[]; edges: FlowEdge[]; startNodeId: string } {
  const nodes: FlowNode[] = schema.nodes.map((schemaNode) => ({
    id: schemaNode.id,
    position: schemaNode.position ?? { x: 0, y: 0 },
    data: {
      label: schemaNode.label ?? schemaNode.id,
      description: schemaNode.description,
      prompt: schemaNode.prompt,
    },
  }));

  const edges: FlowEdge[] = schema.nodes.flatMap((schemaNode) =>
    schemaNode.edges.map((schemaEdge) => ({
      id: generateId(),
      source: schemaNode.id,
      target: schemaEdge.to_node_id,
      data: {
        condition: schemaEdge.condition,
        parameters: schemaEdge.parameters,
      },
    })),
  );

  const hasMissingPositions = schema.nodes.some((node) => !node.position);
  const laidOutNodes = hasMissingPositions ? autoLayout(nodes, edges) : nodes;

  return {
    nodes: laidOutNodes,
    edges,
    startNodeId: schema.startNodeId,
  };
}
