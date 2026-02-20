import { describe, expect, it } from 'vitest';

import { validateGraph } from '@/validation/graph';
import type { FlowSchema } from '@/types/schema';

describe('validateGraph', () => {
  it('connected graph (all reachable from start) → no warnings', () => {
    const schema: FlowSchema = {
      startNodeId: 'A',
      nodes: [
        {
          id: 'A',
          description: 'A',
          prompt: 'PA',
          edges: [{ to_node_id: 'B', condition: 'always' }],
        },
        { id: 'B', description: 'B', prompt: 'PB', edges: [] },
      ],
    };

    const result = validateGraph(schema);
    expect(result.warnings).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
    expect(result.isValid).toBe(true);
  });

  it('one disconnected node → warning with that node ID', () => {
    const schema: FlowSchema = {
      startNodeId: 'A',
      nodes: [
        { id: 'A', description: 'A', prompt: 'PA', edges: [] },
        { id: 'B', description: 'B', prompt: 'PB', edges: [] },
      ],
    };

    const result = validateGraph(schema);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0].nodeId).toBe('B');
    expect(result.warnings[0].message).toContain('disconnected');
  });

  it('multiple disconnected nodes → warning for each', () => {
    const schema: FlowSchema = {
      startNodeId: 'A',
      nodes: [
        { id: 'A', description: 'A', prompt: 'PA', edges: [] },
        { id: 'B', description: 'B', prompt: 'PB', edges: [] },
        { id: 'C', description: 'C', prompt: 'PC', edges: [] },
      ],
    };

    const result = validateGraph(schema);
    expect(result.warnings).toHaveLength(2);

    const warnIds = result.warnings.map((w) => w.nodeId);
    expect(warnIds).toContain('B');
    expect(warnIds).toContain('C');
  });

  it('self-loop edge → warning with edge details', () => {
    const schema: FlowSchema = {
      startNodeId: 'A',
      nodes: [
        {
          id: 'A',
          description: 'A',
          prompt: 'PA',
          edges: [{ to_node_id: 'A', condition: 'loop' }],
        },
      ],
    };

    const result = validateGraph(schema);
    const selfLoopWarning = result.warnings.find((w) =>
      w.message.includes('self-loop'),
    );
    expect(selfLoopWarning).toBeDefined();
    expect(selfLoopWarning?.nodeId).toBe('A');
  });

  it('no start node → error', () => {
    const schema: FlowSchema = {
      startNodeId: 'missing',
      nodes: [{ id: 'A', description: 'A', prompt: 'PA', edges: [] }],
    };

    const result = validateGraph(schema);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.isValid).toBe(false);
    expect(result.errors[0].message).toContain('Start node');
  });

  it('linear chain (A→B→C) all reachable → no warnings', () => {
    const schema: FlowSchema = {
      startNodeId: 'A',
      nodes: [
        {
          id: 'A',
          description: 'A',
          prompt: 'PA',
          edges: [{ to_node_id: 'B', condition: 'next' }],
        },
        {
          id: 'B',
          description: 'B',
          prompt: 'PB',
          edges: [{ to_node_id: 'C', condition: 'next' }],
        },
        { id: 'C', description: 'C', prompt: 'PC', edges: [] },
      ],
    };

    const result = validateGraph(schema);
    expect(result.warnings).toHaveLength(0);
    expect(result.isValid).toBe(true);
  });

  it('branching (A→B, A→C) all reachable → no warnings', () => {
    const schema: FlowSchema = {
      startNodeId: 'A',
      nodes: [
        {
          id: 'A',
          description: 'A',
          prompt: 'PA',
          edges: [
            { to_node_id: 'B', condition: 'left' },
            { to_node_id: 'C', condition: 'right' },
          ],
        },
        { id: 'B', description: 'B', prompt: 'PB', edges: [] },
        { id: 'C', description: 'C', prompt: 'PC', edges: [] },
      ],
    };

    const result = validateGraph(schema);
    expect(result.warnings).toHaveLength(0);
    expect(result.isValid).toBe(true);
  });
});
