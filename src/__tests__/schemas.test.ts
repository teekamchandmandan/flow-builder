import { describe, expect, it } from 'vitest';

import {
  SchemaEdgeZ,
  SchemaNodeZ,
  FlowSchemaZ,
} from '@/validation/schemas';

describe('SchemaEdgeZ', () => {
  it('valid edge passes', () => {
    const result = SchemaEdgeZ.safeParse({
      to_node_id: 'node-2',
      condition: 'if yes',
    });
    expect(result.success).toBe(true);
  });

  it('edge with optional parameters passes', () => {
    const result = SchemaEdgeZ.safeParse({
      to_node_id: 'node-2',
      condition: 'if yes',
      parameters: { key: 'value' },
    });
    expect(result.success).toBe(true);
  });

  it('missing to_node_id fails', () => {
    const result = SchemaEdgeZ.safeParse({
      condition: 'if yes',
    });
    expect(result.success).toBe(false);
  });

  it('empty to_node_id fails', () => {
    const result = SchemaEdgeZ.safeParse({
      to_node_id: '',
      condition: 'if yes',
    });
    expect(result.success).toBe(false);
  });

  it('missing condition fails', () => {
    const result = SchemaEdgeZ.safeParse({
      to_node_id: 'node-2',
    });
    expect(result.success).toBe(false);
  });

  it('empty condition fails', () => {
    const result = SchemaEdgeZ.safeParse({
      to_node_id: 'node-2',
      condition: '',
    });
    expect(result.success).toBe(false);
  });
});

describe('SchemaNodeZ', () => {
  it('valid node passes', () => {
    const result = SchemaNodeZ.safeParse({
      id: 'node-1',
      description: 'A node',
      prompt: 'Do something',
      edges: [],
    });
    expect(result.success).toBe(true);
  });

  it('node with optional label passes', () => {
    const result = SchemaNodeZ.safeParse({
      id: 'node-1',
      label: 'Welcome',
      description: 'A node',
      prompt: 'Do something',
      edges: [],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.label).toBe('Welcome');
    }
  });

  it('node with edges passes', () => {
    const result = SchemaNodeZ.safeParse({
      id: 'node-1',
      description: 'A node',
      prompt: 'Do something',
      edges: [{ to_node_id: 'node-2', condition: 'always' }],
    });
    expect(result.success).toBe(true);
  });

  it('node with position passes', () => {
    const result = SchemaNodeZ.safeParse({
      id: 'node-1',
      description: 'A node',
      prompt: 'Do something',
      edges: [],
      position: { x: 100, y: 200 },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.position).toEqual({ x: 100, y: 200 });
    }
  });

  it('missing id fails', () => {
    const result = SchemaNodeZ.safeParse({
      description: 'A node',
      prompt: 'Do something',
      edges: [],
    });
    expect(result.success).toBe(false);
  });

  it('empty description fails', () => {
    const result = SchemaNodeZ.safeParse({
      id: 'node-1',
      description: '',
      prompt: 'Do something',
      edges: [],
    });
    expect(result.success).toBe(false);
  });

  it('empty prompt fails', () => {
    const result = SchemaNodeZ.safeParse({
      id: 'node-1',
      description: 'A node',
      prompt: '',
      edges: [],
    });
    expect(result.success).toBe(false);
  });
});

describe('FlowSchemaZ', () => {
  it('valid schema passes (2 nodes, 1 edge, valid startNodeId)', () => {
    const result = FlowSchemaZ.safeParse({
      startNodeId: 'node-1',
      nodes: [
        {
          id: 'node-1',
          description: 'First',
          prompt: 'P1',
          edges: [{ to_node_id: 'node-2', condition: 'always' }],
        },
        {
          id: 'node-2',
          description: 'Second',
          prompt: 'P2',
          edges: [],
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('duplicate node IDs fails', () => {
    const result = FlowSchemaZ.safeParse({
      startNodeId: 'node-1',
      nodes: [
        {
          id: 'node-1',
          description: 'First',
          prompt: 'P1',
          edges: [],
        },
        {
          id: 'node-1',
          description: 'Duplicate',
          prompt: 'P2',
          edges: [],
        },
      ],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages.some((m) => m.includes('Duplicate'))).toBe(true);
    }
  });

  it('startNodeId references non-existent node fails', () => {
    const result = FlowSchemaZ.safeParse({
      startNodeId: 'missing',
      nodes: [
        {
          id: 'node-1',
          description: 'First',
          prompt: 'P1',
          edges: [],
        },
      ],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(
        messages.some((m) => m.includes('startNodeId') || m.includes('existing')),
      ).toBe(true);
    }
  });

  it('edge to_node_id references non-existent node fails', () => {
    const result = FlowSchemaZ.safeParse({
      startNodeId: 'node-1',
      nodes: [
        {
          id: 'node-1',
          description: 'First',
          prompt: 'P1',
          edges: [{ to_node_id: 'ghost', condition: 'always' }],
        },
      ],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(
        messages.some((m) => m.includes('Edge target') || m.includes('ghost')),
      ).toBe(true);
    }
  });

  it('empty nodes array with empty startNodeId fails zod (non-empty string required)', () => {
    // The schema enforces startNodeId as NonEmptyString, so truly empty state
    // will not pass the Zod schema. This is expected: empty state is only valid
    // at the application level, not at the schema export level.
    const result = FlowSchemaZ.safeParse({
      startNodeId: '',
      nodes: [],
    });
    expect(result.success).toBe(false);
  });
});
