import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';

import { Badge } from '@/components/ui/badge';
import { useFlowStore } from '@/store/flowStore';
import type { FlowNode } from '@/types/flow';

type Status = 'default' | 'start' | 'error' | 'warning';

const borderByStatus: Record<Status, string> = {
  default: 'border-border',
  start: 'border-violet-500',
  error: 'border-red-500',
  warning: 'border-amber-500',
};

const badgeByStatus: Partial<
  Record<Status, { label: string; className: string }>
> = {
  start: { label: 'Start', className: 'bg-violet-500 text-white' },
  error: { label: '!', className: 'bg-red-500 text-white' },
  warning: { label: '!', className: 'bg-amber-500 text-white' },
};

function CustomNodeInner({ id, data, selected }: NodeProps<FlowNode>) {
  const nodeData = data;
  const startNodeId = useFlowStore((s) => s.startNodeId);
  const hasError = useFlowStore((s) => s.errors.some((e) => e.nodeId === id));
  const hasWarning = useFlowStore((s) =>
    s.warnings.some((w) => w.nodeId === id),
  );
  const edgeCount = useFlowStore(
    (s) => s.edges.filter((e) => e.source === id).length,
  );

  let status: Status = 'default';
  if (id === startNodeId) status = 'start';
  if (hasWarning) status = 'warning';
  if (hasError) status = 'error';

  const badge = badgeByStatus[status];
  const descriptionPreview =
    nodeData.description.length > 40
      ? `${nodeData.description.slice(0, 40)}…`
      : nodeData.description;

  return (
    <div
      className={`relative w-[200px] rounded-lg border-2 bg-card text-card-foreground shadow-sm transition-all duration-200 hover:shadow-md ${borderByStatus[status]} ${selected ? 'shadow-lg ring-2 ring-violet-500/60' : ''}`}
      role='group'
      aria-label={`Node: ${nodeData.label}${status === 'start' ? ' (start node)' : ''}${status === 'error' ? ' (has errors)' : ''}${status === 'warning' ? ' (has warnings)' : ''}`}
    >
      <Handle
        type='target'
        position={Position.Top}
        className='!h-3 !w-3 !border-2 !border-violet-500 !bg-background'
      />

      {badge ? (
        <Badge
          className={`absolute -top-2.5 right-2 text-[10px] px-1.5 py-0 leading-4 ${badge.className}`}
        >
          {badge.label}
        </Badge>
      ) : null}

      <div className='px-3 py-2.5 space-y-1'>
        <p className='text-sm font-semibold truncate'>{nodeData.label}</p>
        {descriptionPreview ? (
          <p className='text-xs text-muted-foreground truncate'>
            {descriptionPreview}
          </p>
        ) : null}
        <div className='flex items-center justify-end'>
          <Badge
            variant='secondary'
            className='text-[10px] px-1.5 py-0 leading-4'
          >
            {edgeCount} edge{edgeCount !== 1 ? 's' : ''}
          </Badge>
        </div>
      </div>

      <Handle
        type='source'
        position={Position.Bottom}
        className='!h-3 !w-3 !border-2 !border-violet-500 !bg-background'
      />
    </div>
  );
}

export const CustomNode = memo(CustomNodeInner);
