import type { FlowSchema } from '@/types/schema';
import type { ValidationResult, ValidationWarning } from '@/types/validation';

export function validateGraph(schema: FlowSchema): ValidationResult {
  const errors = [] as ValidationResult['errors'];
  const warnings: ValidationWarning[] = [];

  const nodeById = new Map(schema.nodes.map((node) => [node.id, node]));

  if (!nodeById.has(schema.startNodeId)) {
    errors.push({
      type: 'error',
      field: 'startNodeId',
      message: `Start node not found: ${schema.startNodeId}`,
    });

    return {
      errors,
      warnings,
      isValid: false,
    };
  }

  const visited = new Set<string>();
  const stack: string[] = [schema.startNodeId];

  while (stack.length > 0) {
    const nodeId = stack.pop();
    if (!nodeId || visited.has(nodeId)) {
      continue;
    }

    visited.add(nodeId);
    const node = nodeById.get(nodeId);
    if (!node) {
      continue;
    }

    for (const edge of node.edges) {
      if (edge.to_node_id === node.id) {
        warnings.push({
          type: 'warning',
          nodeId: node.id,
          message: 'Node has a self-loop edge',
        });
      }

      if (!visited.has(edge.to_node_id) && nodeById.has(edge.to_node_id)) {
        stack.push(edge.to_node_id);
      }
    }
  }

  for (const node of schema.nodes) {
    if (!visited.has(node.id)) {
      warnings.push({
        type: 'warning',
        nodeId: node.id,
        message: 'Node is disconnected from the flow',
      });
    }
  }

  return {
    errors,
    warnings,
    isValid: errors.length === 0,
  };
}
