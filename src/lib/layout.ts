import dagre from '@dagrejs/dagre';

import { DEFAULT_NODE_HEIGHT, DEFAULT_NODE_WIDTH } from '@/lib/constants';
import type { FlowEdge, FlowNode } from '@/types/flow';

export function autoLayout(nodes: FlowNode[], edges: FlowEdge[]): FlowNode[] {
  if (nodes.length === 0) {
    return nodes;
  }

  const graph = new dagre.graphlib.Graph();
  graph.setDefaultEdgeLabel(() => ({}));
  graph.setGraph({
    rankdir: 'TB',
    nodesep: 50,
    ranksep: 80,
  });

  for (const node of nodes) {
    const width = node.width ?? DEFAULT_NODE_WIDTH;
    const height = node.height ?? DEFAULT_NODE_HEIGHT;
    graph.setNode(node.id, { width, height });
  }

  for (const edge of edges) {
    if (graph.hasNode(edge.source) && graph.hasNode(edge.target)) {
      graph.setEdge(edge.source, edge.target);
    }
  }

  dagre.layout(graph);

  return nodes.map((node) => {
    const dagreNode = graph.node(node.id) as { x: number; y: number } | undefined;
    if (!dagreNode) {
      return node;
    }

    const width = node.width ?? DEFAULT_NODE_WIDTH;
    const height = node.height ?? DEFAULT_NODE_HEIGHT;

    return {
      ...node,
      position: {
        x: dagreNode.x - width / 2,
        y: dagreNode.y - height / 2,
      },
    };
  });
}
