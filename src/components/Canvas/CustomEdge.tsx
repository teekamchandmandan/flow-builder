import { memo, useCallback } from 'react';
import {
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
} from '@xyflow/react';
import { X } from 'lucide-react';

import { useFlowStore } from '@/store/flowStore';
import { cn } from '@/lib/utils';
import { EdgeLabelEditor } from '@/components/Canvas/EdgeLabelEditor';
import type { EdgeData } from '@/types/flow';

function CustomEdgeInner({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps) {
  const edgeData = data as EdgeData | undefined;
  const condition = edgeData?.condition ?? '';

  const updateEdgeData = useFlowStore((s) => s.updateEdgeData);
  const deleteEdge = useFlowStore((s) => s.deleteEdge);

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  const handleConditionCommit = useCallback(
    (value: string) => {
      updateEdgeData(id, { condition: value });
    },
    [id, updateEdgeData],
  );

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      deleteEdge(id);
    },
    [id, deleteEdge],
  );

  return (
    <>
      <path
        id={id}
        className={cn(
          'react-flow__edge-path',
          selected ? 'stroke-violet-500' : 'stroke-border',
        )}
        d={edgePath}
        strokeWidth={2}
        fill='none'
      />

      <EdgeLabelRenderer>
        <div
          className='nodrag nopan group pointer-events-auto absolute'
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
          }}
        >
          <EdgeLabelEditor
            condition={condition}
            onCommit={handleConditionCommit}
          />

          <button
            type='button'
            onClick={handleDelete}
            className='absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-white opacity-0 transition-opacity group-hover:opacity-100'
            aria-label='Delete edge'
          >
            <X className='h-2.5 w-2.5' />
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export const CustomEdge = memo(CustomEdgeInner);
