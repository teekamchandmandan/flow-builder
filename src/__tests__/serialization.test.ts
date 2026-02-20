import { describe, expect, it } from 'vitest';

import { toSchema, fromSchema } from '@/lib/serialization';
import type { FlowEdge, FlowNode } from '@/types/flow';

describe('serialization', () => {
  describe('toSchema', () => {
    it('converts empty state → { startNodeId: "", nodes: [] }', () => {
      const schema = toSchema([], [], null);
      expect(schema.startNodeId).toBe('');
      expect(schema.nodes).toHaveLength(0);
    });

    it('converts single node (no edges) → correct SchemaNode with position', () => {
      const nodes: FlowNode[] = [
        {
          id: 'n1',
          position: { x: 50, y: 100 },
          data: { label: 'Hello', description: 'Desc', prompt: 'P' },
        },
      ];

      const schema = toSchema(nodes, [], 'n1');
      expect(schema.nodes).toHaveLength(1);
      expect(schema.nodes[0].id).toBe('n1');
      expect(schema.nodes[0].description).toBe('Desc');
      expect(schema.nodes[0].prompt).toBe('P');
      expect(schema.nodes[0].position).toEqual({ x: 50, y: 100 });
      expect(schema.nodes[0].edges).toHaveLength(0);
    });

    it('converts two nodes with edge → edge nested under source node edges[]', () => {
      const nodes: FlowNode[] = [
        {
          id: 'n1',
          position: { x: 0, y: 0 },
          data: { label: 'A', description: 'D1', prompt: 'P1' },
        },
        {
          id: 'n2',
          position: { x: 100, y: 100 },
          data: { label: 'B', description: 'D2', prompt: 'P2' },
        },
      ];

      const edges: FlowEdge[] = [
        {
          id: 'e1',
          source: 'n1',
          target: 'n2',
          data: { condition: 'always', parameters: { key: 'val' } },
        },
      ];

      const schema = toSchema(nodes, edges, 'n1');
      expect(schema.nodes[0].edges).toHaveLength(1);
      expect(schema.nodes[0].edges[0].to_node_id).toBe('n2');
      expect(schema.nodes[1].edges).toHaveLength(0);
    });

    it('edge data maps correctly: condition, parameters', () => {
      const nodes: FlowNode[] = [
        {
          id: 'n1',
          position: { x: 0, y: 0 },
          data: { label: 'A', description: 'D1', prompt: 'P1' },
        },
        {
          id: 'n2',
          position: { x: 100, y: 0 },
          data: { label: 'B', description: 'D2', prompt: 'P2' },
        },
      ];

      const edges: FlowEdge[] = [
        {
          id: 'e1',
          source: 'n1',
          target: 'n2',
          data: { condition: 'if yes', parameters: { channel: 'voice' } },
        },
      ];

      const schema = toSchema(nodes, edges, 'n1');
      const schemaEdge = schema.nodes[0].edges[0];
      expect(schemaEdge.condition).toBe('if yes');
      expect(schemaEdge.parameters).toEqual({ channel: 'voice' });
    });

    it('positions preserved from React Flow nodes', () => {
      const nodes: FlowNode[] = [
        {
          id: 'n1',
          position: { x: 42, y: 84 },
          data: { label: 'A', description: 'D', prompt: 'P' },
        },
      ];

      const schema = toSchema(nodes, [], 'n1');
      expect(schema.nodes[0].position).toEqual({ x: 42, y: 84 });
    });
  });

  describe('fromSchema', () => {
    it('parses single node → creates FlowNode with correct data and position', () => {
      const result = fromSchema({
        startNodeId: 'n1',
        nodes: [
          {
            id: 'n1',
            label: 'Welcome',
            description: 'Entry',
            prompt: 'Hello',
            edges: [],
            position: { x: 10, y: 20 },
          },
        ],
      });

      expect(result.nodes).toHaveLength(1);
      expect(result.nodes[0].id).toBe('n1');
      expect(result.nodes[0].data.label).toBe('Welcome');
      expect(result.nodes[0].data.description).toBe('Entry');
      expect(result.nodes[0].data.prompt).toBe('Hello');
      expect(result.nodes[0].position).toEqual({ x: 10, y: 20 });
    });

    it('parses edges → creates flat FlowEdge[] with correct source/target', () => {
      const result = fromSchema({
        startNodeId: 'n1',
        nodes: [
          {
            id: 'n1',
            description: 'A',
            prompt: 'PA',
            edges: [{ to_node_id: 'n2', condition: 'always' }],
            position: { x: 0, y: 0 },
          },
          {
            id: 'n2',
            description: 'B',
            prompt: 'PB',
            edges: [],
            position: { x: 100, y: 0 },
          },
        ],
      });

      expect(result.edges).toHaveLength(1);
      expect(result.edges[0].source).toBe('n1');
      expect(result.edges[0].target).toBe('n2');
      expect(result.edges[0].data?.condition).toBe('always');
    });

    it('handles missing positions → returns nodes (layout applied)', () => {
      const result = fromSchema({
        startNodeId: 'n1',
        nodes: [
          {
            id: 'n1',
            description: 'A',
            prompt: 'PA',
            edges: [],
          },
        ],
      });

      expect(result.nodes).toHaveLength(1);
      // Position should be set by auto-layout since no position was provided
      expect(result.nodes[0].position).toBeDefined();
      expect(typeof result.nodes[0].position.x).toBe('number');
      expect(typeof result.nodes[0].position.y).toBe('number');
    });

    it('restores startNodeId', () => {
      const result = fromSchema({
        startNodeId: 'n1',
        nodes: [
          {
            id: 'n1',
            description: 'A',
            prompt: 'PA',
            edges: [],
            position: { x: 0, y: 0 },
          },
        ],
      });

      expect(result.startNodeId).toBe('n1');
    });
  });

  describe('round-trip', () => {
    it('fromSchema(toSchema(...)) produces equivalent data', () => {
      const nodes: FlowNode[] = [
        {
          id: 'start',
          position: { x: 10, y: 20 },
          data: { label: 'Start', description: 'Entry node', prompt: 'Hello' },
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
          id: 'edge-1',
          source: 'start',
          target: 'next',
          data: { condition: 'always', parameters: { channel: 'voice' } },
        },
      ];

      const startNodeId = 'start';

      const schema = toSchema(nodes, edges, startNodeId);
      const restored = fromSchema(schema);

      // Same number of nodes
      expect(restored.nodes).toHaveLength(nodes.length);

      // Same node IDs and data
      for (const original of nodes) {
        const restoredNode = restored.nodes.find((n) => n.id === original.id);
        expect(restoredNode).toBeDefined();
        expect(restoredNode!.data.label).toBe(original.data.label);
        expect(restoredNode!.data.description).toBe(original.data.description);
        expect(restoredNode!.data.prompt).toBe(original.data.prompt);
      }

      // Same number of edges
      expect(restored.edges).toHaveLength(edges.length);

      // Same edge connections and data
      expect(restored.edges[0].source).toBe('start');
      expect(restored.edges[0].target).toBe('next');
      expect(restored.edges[0].data?.condition).toBe('always');
      expect(restored.edges[0].data?.parameters).toEqual({ channel: 'voice' });

      // Same startNodeId
      expect(restored.startNodeId).toBe(startNodeId);

      // Positions preserved
      for (const original of nodes) {
        const restoredNode = restored.nodes.find((n) => n.id === original.id);
        expect(restoredNode!.position.x).toBeCloseTo(original.position.x, 0);
        expect(restoredNode!.position.y).toBeCloseTo(original.position.y, 0);
      }
    });

    it('node without label gets fallback to ID on fromSchema', () => {
      const nodes: FlowNode[] = [
        {
          id: 'n1',
          position: { x: 0, y: 0 },
          data: { label: 'n1', description: 'D', prompt: 'P' },
        },
      ];

      // toSchema always includes label from node.data.label
      const schema = toSchema(nodes, [], 'n1');

      // Manually remove label to simulate a schema without label
      delete (schema.nodes[0] as { label?: string }).label;

      const restored = fromSchema(schema);
      // fromSchema uses label ?? id as fallback
      expect(restored.nodes[0].data.label).toBe('n1');
    });
  });
});
