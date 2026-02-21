import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
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
  const startNodeId = useFlowStore((s) => s.startNodeId);
  const hasError = useFlowStore((s) => s.errors.some((e) => e.nodeId === id));
  const hasWarning = useFlowStore((s) =>
    s.warnings.some((w) => w.nodeId === id),
  );

  let status: Status = 'default';
  if (id === startNodeId) status = 'start';
  if (hasWarning) status = 'warning';
  if (hasError) status = 'error';

  const badge = badgeByStatus[status];
  const descriptionPreview =
    data.description.length > 40
      ? `${data.description.slice(0, 40)}…`
      : data.description;

  return (
    <div
      className={cn(
        'relative w-[200px] rounded-lg border-2 bg-card text-card-foreground shadow-sm transition-all duration-200 hover:shadow-md',
        borderByStatus[status],
        selected && 'shadow-lg ring-2 ring-violet-500/60',
      )}
      role='group'
      aria-label={`Node: ${data.label}${status === 'start' ? ' (start node)' : ''}${status === 'error' ? ' (has errors)' : ''}${status === 'warning' ? ' (has warnings)' : ''}`}
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
        <p className='text-sm font-semibold truncate'>{data.label}</p>
        <p className='text-xs text-muted-foreground truncate'>
          {descriptionPreview || (
            <span className='italic opacity-50'>No description</span>
          )}
        </p>
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
