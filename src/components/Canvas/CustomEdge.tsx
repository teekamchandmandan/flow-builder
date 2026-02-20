import { memo, useCallback, useRef, useState } from 'react';
import {
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
} from '@xyflow/react';
import { X } from 'lucide-react';

import { useFlowStore } from '@/store/flowStore';
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

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(condition);
  const inputRef = useRef<HTMLInputElement>(null);

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  const onLabelClick = useCallback(() => {
    setDraft(condition);
    setEditing(true);
    // Focus after render
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [condition]);

  const commitEdit = useCallback(() => {
    setEditing(false);
    if (draft.trim() !== condition) {
      updateEdgeData(id, { condition: draft.trim() || condition });
    }
  }, [id, draft, condition, updateEdgeData]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') commitEdit();
      if (e.key === 'Escape') {
        setDraft(condition);
        setEditing(false);
      }
    },
    [commitEdit, condition],
  );

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      deleteEdge(id);
    },
    [id, deleteEdge],
  );

  const truncated =
    condition.length > 24 ? `${condition.slice(0, 24)}…` : condition;

  return (
    <>
      <path
        id={id}
        className={`react-flow__edge-path ${selected ? 'stroke-violet-500' : 'stroke-border'}`}
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
          {editing ? (
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={onKeyDown}
              className='rounded border border-input bg-background px-2 py-0.5 text-xs text-foreground outline-none ring-1 ring-ring w-32'
              aria-label='Edit edge condition'
            />
          ) : (
            <button
              type='button'
              onClick={onLabelClick}
              className='cursor-pointer rounded-full border border-border bg-background px-2 py-0.5 text-[11px] text-muted-foreground shadow-sm transition-colors hover:bg-muted'
              aria-label={`Edge condition: ${condition}`}
            >
              {truncated || 'Add condition'}
            </button>
          )}

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
