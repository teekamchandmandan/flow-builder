import { describe, expect, it } from 'vitest';

import { toSchema, fromSchema } from '@/lib/serialization';
import type { FlowEdge, FlowNode } from '@/types/flow';
import { validateAll } from '@/validation';

describe('serialization', () => {
  it('round-trips schema-compatible flow data', () => {
    const nodes: FlowNode[] = [
      {
        id: 'start',
        position: { x: 10, y: 20 },
        data: {
          label: 'Start',
          description: 'Entry node',
          prompt: 'Hello',
        },
      },
      {
        id: 'next',
        position: { x: 150, y: 200 },
        data: {
          label: 'Next',
          description: 'Second node',
          prompt: 'Continue',
        },
      },
    ];

    const edges: FlowEdge[] = [
      {
        id: 'edge-start-next',
        source: 'start',
        target: 'next',
        data: {
          condition: 'always',
          parameters: {
            channel: 'voice',
          },
        },
      },
    ];

    const schema = toSchema(nodes, edges, 'start');
    const validation = validateAll(schema);

    expect(validation.isValid).toBe(true);

    const restored = fromSchema(schema);

    expect(restored.startNodeId).toBe('start');
    expect(restored.nodes).toHaveLength(2);
    expect(restored.edges).toHaveLength(1);
    expect(restored.nodes.find((node) => node.id === 'start')?.data.label).toBe(
      'Start',
    );
    expect(restored.edges[0].source).toBe('start');
    expect(restored.edges[0].target).toBe('next');
    expect(restored.edges[0].data?.condition).toBe('always');
  });
});
