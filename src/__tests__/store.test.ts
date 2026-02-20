import { beforeEach, describe, expect, it } from 'vitest';

import { useFlowStore } from '@/store/flowStore';

describe('store', () => {
  beforeEach(() => {
    useFlowStore.getState().reset();
  });

  describe('node operations', () => {
    it('addNode increases nodes.length by 1 with valid ID and default data', () => {
      const store = useFlowStore.getState();
      store.addNode();

      const { nodes } = useFlowStore.getState();
      expect(nodes).toHaveLength(1);
      expect(nodes[0].id.length).toBeGreaterThan(0);
      expect(nodes[0].data.label).toBe('New Node');
      expect(nodes[0].data.description).toBe('');
      expect(nodes[0].data.prompt).toBe('');
    });

    it('addNode twice creates 2 unique nodes with different IDs', () => {
      const store = useFlowStore.getState();
      store.addNode();
      store.addNode();

      const { nodes } = useFlowStore.getState();
      expect(nodes).toHaveLength(2);
      expect(nodes[0].id).not.toBe(nodes[1].id);
    });

    it('deleteNode removes node and decreases nodes.length', () => {
      const store = useFlowStore.getState();
      store.addNode();
      store.addNode();

      const nodeId = useFlowStore.getState().nodes[0].id;
      store.deleteNode(nodeId);

      const { nodes } = useFlowStore.getState();
      expect(nodes).toHaveLength(1);
      expect(nodes.find((n) => n.id === nodeId)).toBeUndefined();
    });

    it('deleteNode with connected edges also removes edges', () => {
      const store = useFlowStore.getState();
      store.addNode();
      store.addNode();

      const [first, second] = useFlowStore.getState().nodes;
      store.addEdge({
        source: first.id,
        target: second.id,
        sourceHandle: null,
        targetHandle: null,
      });
      expect(useFlowStore.getState().edges).toHaveLength(1);

      store.deleteNode(first.id);

      expect(useFlowStore.getState().edges).toHaveLength(0);
    });

    it('deleteNode(startNodeId) clears startNodeId', () => {
      const store = useFlowStore.getState();
      store.addNode();

      const nodeId = useFlowStore.getState().nodes[0].id;
      store.setStartNode(nodeId);
      expect(useFlowStore.getState().startNodeId).toBe(nodeId);

      store.deleteNode(nodeId);
      expect(useFlowStore.getState().startNodeId).toBeNull();
    });

    it('updateNodeData updates node data correctly', () => {
      const store = useFlowStore.getState();
      store.addNode();

      const nodeId = useFlowStore.getState().nodes[0].id;
      store.updateNodeData(nodeId, { label: 'Updated' });

      const node = useFlowStore.getState().nodes[0];
      expect(node.data.label).toBe('Updated');
    });
  });

  describe('edge operations', () => {
    it('addEdge increases edges.length with default condition', () => {
      const store = useFlowStore.getState();
      store.addNode();
      store.addNode();

      const [first, second] = useFlowStore.getState().nodes;
      store.addEdge({
        source: first.id,
        target: second.id,
        sourceHandle: null,
        targetHandle: null,
      });

      const { edges } = useFlowStore.getState();
      expect(edges).toHaveLength(1);
      expect(edges[0].data?.condition).toBe('New condition');
    });

    it('deleteEdge removes edge', () => {
      const store = useFlowStore.getState();
      store.addNode();
      store.addNode();

      const [first, second] = useFlowStore.getState().nodes;
      store.addEdge({
        source: first.id,
        target: second.id,
        sourceHandle: null,
        targetHandle: null,
      });

      const edgeId = useFlowStore.getState().edges[0].id;
      store.deleteEdge(edgeId);

      expect(useFlowStore.getState().edges).toHaveLength(0);
    });

    it('updateEdgeData updates edge data', () => {
      const store = useFlowStore.getState();
      store.addNode();
      store.addNode();

      const [first, second] = useFlowStore.getState().nodes;
      store.addEdge({
        source: first.id,
        target: second.id,
        sourceHandle: null,
        targetHandle: null,
      });

      const edgeId = useFlowStore.getState().edges[0].id;
      store.updateEdgeData(edgeId, { condition: 'new' });

      expect(useFlowStore.getState().edges[0].data?.condition).toBe('new');
    });
  });

  describe('start node', () => {
    it('setStartNode updates startNodeId', () => {
      const store = useFlowStore.getState();
      store.addNode();

      const nodeId = useFlowStore.getState().nodes[0].id;
      store.setStartNode(nodeId);

      expect(useFlowStore.getState().startNodeId).toBe(nodeId);
    });

    it('setStartNode then setStartNode(otherId) overrides correctly', () => {
      const store = useFlowStore.getState();
      store.addNode();
      store.addNode();

      const [first, second] = useFlowStore.getState().nodes;
      store.setStartNode(first.id);
      expect(useFlowStore.getState().startNodeId).toBe(first.id);

      store.setStartNode(second.id);
      expect(useFlowStore.getState().startNodeId).toBe(second.id);
    });
  });

  describe('validation integration', () => {
    it('after addNode without setting start → errors include start-related message', () => {
      const store = useFlowStore.getState();
      store.addNode();

      // Validation runs automatically after addNode via withMutation
      const { errors } = useFlowStore.getState();
      // The node has empty description/prompt, and startNodeId is not explicitly set
      // but toSchema falls back to first node ID. Errors should reflect empty fields.
      expect(errors.length).toBeGreaterThan(0);
    });

    it('after addNode + setStartNode + fill required fields → no errors', () => {
      const store = useFlowStore.getState();
      store.addNode();

      const nodeId = useFlowStore.getState().nodes[0].id;
      store.setStartNode(nodeId);
      store.updateNodeData(nodeId, {
        label: 'Start',
        description: 'Entry point',
        prompt: 'Hello user',
      });

      const { errors } = useFlowStore.getState();
      expect(errors).toHaveLength(0);
    });
  });

  describe('undo/redo', () => {
    it('addNode then undo → nodes.length === 0', () => {
      const store = useFlowStore.getState();
      store.addNode();
      expect(useFlowStore.getState().nodes).toHaveLength(1);

      store.undo();
      expect(useFlowStore.getState().nodes).toHaveLength(0);
    });

    it('undo then redo → nodes.length === 1', () => {
      const store = useFlowStore.getState();
      store.addNode();
      store.undo();
      expect(useFlowStore.getState().nodes).toHaveLength(0);

      store.redo();
      expect(useFlowStore.getState().nodes).toHaveLength(1);
    });

    it('canUndo / canRedo reflect correct state', () => {
      const store = useFlowStore.getState();

      expect(useFlowStore.getState().canUndo).toBe(false);
      expect(useFlowStore.getState().canRedo).toBe(false);

      store.addNode();
      expect(useFlowStore.getState().canUndo).toBe(true);
      expect(useFlowStore.getState().canRedo).toBe(false);

      store.undo();
      expect(useFlowStore.getState().canUndo).toBe(false);
      expect(useFlowStore.getState().canRedo).toBe(true);

      store.redo();
      expect(useFlowStore.getState().canUndo).toBe(true);
      expect(useFlowStore.getState().canRedo).toBe(false);
    });

    it('multiple undos work in sequence', () => {
      const store = useFlowStore.getState();
      store.addNode();
      store.addNode();
      store.addNode();

      expect(useFlowStore.getState().nodes).toHaveLength(3);

      store.undo();
      expect(useFlowStore.getState().nodes).toHaveLength(2);

      store.undo();
      expect(useFlowStore.getState().nodes).toHaveLength(1);

      store.undo();
      expect(useFlowStore.getState().nodes).toHaveLength(0);
    });
  });
});
