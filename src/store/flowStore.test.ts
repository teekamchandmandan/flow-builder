import { beforeEach, describe, expect, it } from 'vitest';

import { useFlowStore } from '@/store/flowStore';

describe('flowStore', () => {
  beforeEach(() => {
    useFlowStore.getState().reset();
  });

  it('addNode creates a default node', () => {
    const store = useFlowStore.getState();

    store.addNode();

    const { nodes } = useFlowStore.getState();
    expect(nodes).toHaveLength(1);
    expect(nodes[0].id.length).toBeGreaterThan(0);
    expect(nodes[0].data.label).toBe('New Node');
    expect(nodes[0].data.description).toBe('');
    expect(nodes[0].data.prompt).toBe('');
  });

  it('deleteNode removes node and connected edges', () => {
    const store = useFlowStore.getState();

    store.addNode();
    store.addNode();

    const [firstNode, secondNode] = useFlowStore.getState().nodes;

    store.addEdge({
      source: firstNode.id,
      target: secondNode.id,
      sourceHandle: null,
      targetHandle: null,
    });
    const edgeId = useFlowStore.getState().edges[0].id;

    expect(useFlowStore.getState().edges).toHaveLength(1);

    store.deleteNode(firstNode.id);

    const state = useFlowStore.getState();
    expect(state.nodes).toHaveLength(1);
    expect(state.nodes[0].id).toBe(secondNode.id);
    expect(state.edges).toHaveLength(0);
    expect(state.edges.find((edge) => edge.id === edgeId)).toBeUndefined();
  });

  it('setStartNode updates startNodeId', () => {
    const store = useFlowStore.getState();

    store.addNode();
    const nodeId = useFlowStore.getState().nodes[0].id;

    store.setStartNode(nodeId);

    expect(useFlowStore.getState().startNodeId).toBe(nodeId);
  });

  it('updateEdgeTarget changes the edge target', () => {
    const store = useFlowStore.getState();

    store.addNode();
    store.addNode();
    store.addNode();

    const [first, second, third] = useFlowStore.getState().nodes;

    store.addEdge({
      source: first.id,
      target: second.id,
      sourceHandle: null,
      targetHandle: null,
    });

    const edgeId = useFlowStore.getState().edges[0].id;

    store.updateEdgeTarget(edgeId, third.id);

    const edge = useFlowStore.getState().edges[0];
    expect(edge.target).toBe(third.id);
  });

  it('validate reports errors for empty graph', () => {
    const store = useFlowStore.getState();

    store.validate();

    const { errors, warnings } = useFlowStore.getState();
    expect(errors.length).toBeGreaterThan(0);
    expect(warnings).toHaveLength(0);
  });

  it('exportJSON returns valid schema JSON', () => {
    const store = useFlowStore.getState();

    store.addNode();
    const nodeId = useFlowStore.getState().nodes[0].id;
    store.setStartNode(nodeId);

    const json = store.exportJSON();
    const parsed = JSON.parse(json) as {
      startNodeId: string;
      nodes: unknown[];
    };

    expect(parsed.startNodeId).toBe(nodeId);
    expect(parsed.nodes).toHaveLength(1);
  });

  it('importJSON hydrates state for valid schema', () => {
    const store = useFlowStore.getState();

    const json = JSON.stringify({
      startNodeId: 'n1',
      nodes: [
        {
          id: 'n1',
          label: 'Start',
          description: 'Entry',
          prompt: 'Hello',
          edges: [
            {
              to_node_id: 'n2',
              condition: 'always',
            },
          ],
          position: { x: 10, y: 20 },
        },
        {
          id: 'n2',
          label: 'Next',
          description: 'Second',
          prompt: 'Continue',
          edges: [],
          position: { x: 100, y: 200 },
        },
      ],
    });

    const result = store.importJSON(json);

    expect(result.success).toBe(true);

    const state = useFlowStore.getState();
    expect(state.nodes).toHaveLength(2);
    expect(state.edges).toHaveLength(1);
    expect(state.startNodeId).toBe('n1');
    expect(state.canUndo).toBe(false);
  });

  it('importJSON returns errors and keeps state unchanged for invalid schema', () => {
    const store = useFlowStore.getState();

    store.addNode();
    const previousNodeCount = useFlowStore.getState().nodes.length;

    const result = store.importJSON('{"startNodeId":"missing","nodes":[]}');

    expect(result.success).toBe(false);
    expect(result.errors?.length).toBeGreaterThan(0);
    expect(useFlowStore.getState().nodes).toHaveLength(previousNodeCount);
  });

  it('undo after addNode reverts to empty graph', () => {
    const store = useFlowStore.getState();

    store.addNode();
    expect(useFlowStore.getState().nodes).toHaveLength(1);

    store.undo();

    const state = useFlowStore.getState();
    expect(state.nodes).toHaveLength(0);
    expect(state.canRedo).toBe(true);
  });
});
