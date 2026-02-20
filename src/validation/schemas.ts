import { z } from 'zod';

import type { FlowSchema } from '@/types/schema';
import type { ValidationError, ValidationResult } from '@/types/validation';

const NonEmptyString = z
  .string()
  .trim()
  .min(1, { message: 'Must be a non-empty string' });

export const SchemaEdgeZ = z.object({
  to_node_id: NonEmptyString,
  condition: NonEmptyString,
  parameters: z.record(z.string(), z.string()).optional(),
});

export const SchemaNodeZ = z.object({
  id: NonEmptyString,
  label: NonEmptyString.optional(),
  description: NonEmptyString,
  prompt: NonEmptyString,
  edges: z.array(SchemaEdgeZ),
  position: z
    .object({
      x: z.number(),
      y: z.number(),
    })
    .optional(),
});

export const FlowSchemaZ = z
  .object({
    startNodeId: NonEmptyString,
    nodes: z.array(SchemaNodeZ),
  })
  .superRefine((schema, ctx) => {
    const seenIds = new Set<string>();

    for (let nodeIndex = 0; nodeIndex < schema.nodes.length; nodeIndex += 1) {
      const node = schema.nodes[nodeIndex];

      if (seenIds.has(node.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['nodes', nodeIndex, 'id'],
          message: `Duplicate node id: ${node.id}`,
        });
      }

      seenIds.add(node.id);
    }

    if (!seenIds.has(schema.startNodeId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['startNodeId'],
        message: `startNodeId must reference an existing node: ${schema.startNodeId}`,
      });
    }

    for (let nodeIndex = 0; nodeIndex < schema.nodes.length; nodeIndex += 1) {
      const node = schema.nodes[nodeIndex];

      for (let edgeIndex = 0; edgeIndex < node.edges.length; edgeIndex += 1) {
        const edge = node.edges[edgeIndex];

        if (!seenIds.has(edge.to_node_id)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['nodes', nodeIndex, 'edges', edgeIndex, 'to_node_id'],
            message: `Edge target does not exist: ${edge.to_node_id}`,
          });
        }
      }
    }
  });

function getNodeIdFromPath(
  path: PropertyKey[],
  data: unknown,
): string | undefined {
  if (path[0] !== 'nodes' || typeof path[1] !== 'number') {
    return undefined;
  }

  if (!data || typeof data !== 'object' || !('nodes' in data)) {
    return undefined;
  }

  const nodesValue = (data as { nodes?: unknown }).nodes;
  if (!Array.isArray(nodesValue)) {
    return undefined;
  }

  const node = nodesValue[path[1]];
  if (!node || typeof node !== 'object' || !('id' in node)) {
    return undefined;
  }

  const nodeId = (node as { id?: unknown }).id;
  return typeof nodeId === 'string' ? nodeId : undefined;
}

function mapIssueToValidationError(
  issue: z.ZodIssue,
  data: unknown,
): ValidationError {
  const field = issue.path.length > 0 ? issue.path.join('.') : undefined;
  const nodeId = getNodeIdFromPath(issue.path, data);

  return {
    type: 'error',
    message: issue.message,
    field,
    nodeId,
  };
}

export function validateFlowSchema(data: unknown): ValidationResult {
  const parsed = FlowSchemaZ.safeParse(data);

  if (parsed.success) {
    return {
      errors: [],
      warnings: [],
      isValid: true,
    };
  }

  const errors = parsed.error.issues.map((issue) =>
    mapIssueToValidationError(issue, data),
  );

  return {
    errors,
    warnings: [],
    isValid: false,
  };
}

export function parseFlowSchema(data: unknown): FlowSchema {
  return FlowSchemaZ.parse(data);
}
