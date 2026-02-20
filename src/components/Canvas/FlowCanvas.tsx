import { useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type NodeMouseHandler,
  BackgroundVariant,
} from '@xyflow/react';

import { useFlowStore, isValidConnection } from '@/store/flowStore';
import { SNAP_GRID } from '@/lib/constants';
import { CustomNode } from '@/components/Canvas/CustomNode';
import { CustomEdge } from '@/components/Canvas/CustomEdge';
import { EmptyState } from '@/components/Canvas/EmptyState';
import { ErrorBoundary } from '@/components/ErrorBoundary';

/* ------------------------------------------------------------------ */
/*  Register types OUTSIDE component to avoid re-registration warning */
/* ------------------------------------------------------------------ */
const nodeTypes = { custom: CustomNode };
const edgeTypes = { custom: CustomEdge };
const defaultEdgeOptions = { type: 'custom' as const, animated: false };

/* ------------------------------------------------------------------ */
/*  FlowCanvas                                                         */
/* ------------------------------------------------------------------ */
export function FlowCanvas() {
  const nodes = useFlowStore((s) => s.nodes);
  const edges = useFlowStore((s) => s.edges);
  const onNodesChange = useFlowStore((s) => s.onNodesChange);
  const onEdgesChange = useFlowStore((s) => s.onEdgesChange);
  const addEdge = useFlowStore((s) => s.addEdge);
  const selectNode = useFlowStore((s) => s.selectNode);
  const closeSidebar = useFlowStore((s) => s.closeSidebar);
  const reset = useFlowStore((s) => s.reset);

  // Zustand selectors return stable references — pass directly
  // instead of wrapping in useCallback (rerender-simple-expression-in-memo).
  const onNodeClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      selectNode(node.id);
    },
    [selectNode],
  );

  return (
    <ErrorBoundary
      onReset={reset}
      title='Something went wrong'
      description='The canvas encountered an unexpected error.'
      actionLabel='Reset'
    >
      <div className='relative h-full w-full'>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={addEdge}
          isValidConnection={isValidConnection}
          onNodeClick={onNodeClick}
          onPaneClick={closeSidebar}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          deleteKeyCode={['Backspace', 'Delete']}
          snapToGrid
          snapGrid={SNAP_GRID}
          fitView
        >
          <Background variant={BackgroundVariant.Dots} gap={SNAP_GRID[0]} />
          <Controls />
          <MiniMap
            className='!bg-card !border-border'
            maskColor='rgba(0,0,0,0.1)'
          />
        </ReactFlow>

        {nodes.length === 0 && <EmptyState />}
      </div>
    </ErrorBoundary>
  );
}
