import { Component, useCallback, type ReactNode } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Connection,
  type NodeMouseHandler,
  BackgroundVariant,
} from '@xyflow/react';

import { useFlowStore, isValidConnection } from '@/store/flowStore';
import { SNAP_GRID } from '@/lib/constants';
import { CustomNode } from '@/components/Canvas/CustomNode';
import { CustomEdge } from '@/components/Canvas/CustomEdge';
import { EmptyState } from '@/components/Canvas/EmptyState';

/* ------------------------------------------------------------------ */
/*  Register types OUTSIDE component to avoid re-registration warning */
/* ------------------------------------------------------------------ */
const nodeTypes = { custom: CustomNode };
const edgeTypes = { custom: CustomEdge };
const defaultEdgeOptions = { type: 'custom' as const, animated: false };

/* ------------------------------------------------------------------ */
/*  Error Boundary                                                     */
/* ------------------------------------------------------------------ */
interface ErrorBoundaryProps {
  children: ReactNode;
  onReset: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class CanvasErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-background text-foreground">
          <p className="text-lg font-semibold">Something went wrong</p>
          <p className="text-sm text-muted-foreground">
            The canvas encountered an unexpected error.
          </p>
          <button
            type="button"
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
            onClick={() => {
              this.props.onReset();
              this.setState({ hasError: false });
            }}
          >
            Reset
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

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

  const onConnect = useCallback(
    (connection: Connection) => {
      addEdge(connection);
    },
    [addEdge],
  );

  const onNodeClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      selectNode(node.id);
    },
    [selectNode],
  );

  const onPaneClick = useCallback(() => {
    closeSidebar();
  }, [closeSidebar]);

  return (
    <CanvasErrorBoundary onReset={reset}>
      <div className="relative h-full w-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          isValidConnection={isValidConnection}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
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
            className="!bg-card !border-border"
            maskColor="rgba(0,0,0,0.1)"
          />
        </ReactFlow>

        {nodes.length === 0 && <EmptyState />}
      </div>
    </CanvasErrorBoundary>
  );
}
