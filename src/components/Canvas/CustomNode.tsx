import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';

import { Badge } from '@/components/ui/badge';
import { useFlowStore } from '@/store/flowStore';
import type { NodeData } from '@/types/flow';

type Status = 'default' | 'start' | 'error' | 'warning';

const borderByStatus: Record<Status, string> = {
  default: 'border-border',
  start: 'border-violet-500',
  error: 'border-red-500',
  warning: 'border-amber-500',
};

const badgeByStatus: Partial<Record<Status, { label: string; className: string }>> = {
  start: { label: 'Start', className: 'bg-violet-500 text-white' },
  error: { label: '!', className: 'bg-red-500 text-white' },
  warning: { label: '!', className: 'bg-amber-500 text-white' },
};

function CustomNodeInner({ id, data, selected }: NodeProps) {
  const nodeData = data as NodeData;
  const startNodeId = useFlowStore((s) => s.startNodeId);
  const issues = useFlowStore((s) => s.getNodeErrors(id));
  const edgeCount = useFlowStore((s) => s.edges.filter((e) => e.source === id).length);

  let status: Status = 'default';
  if (id === startNodeId) status = 'start';
  if (issues.some((i) => i.type === 'warning')) status = 'warning';
  if (issues.some((i) => i.type === 'error')) status = 'error';

  // Keep start status visible when there are no errors
  if (id === startNodeId && status === 'default') status = 'start';

  const badge = badgeByStatus[status];
  const descriptionPreview =
    nodeData.description.length > 40
      ? `${nodeData.description.slice(0, 40)}…`
      : nodeData.description;

  return (
    <div
      className={`relative w-[200px] rounded-lg border-2 bg-card text-card-foreground shadow-sm transition-shadow ${borderByStatus[status]} ${selected ? 'shadow-md ring-2 ring-ring' : ''}`}
      aria-label={nodeData.label}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!h-3 !w-3 !border-2 !border-violet-500 !bg-background"
      />

      {badge && (
        <Badge className={`absolute -top-2.5 right-2 text-[10px] px-1.5 py-0 leading-4 ${badge.className}`}>
          {badge.label}
        </Badge>
      )}

      <div className="px-3 py-2.5 space-y-1">
        <p className="text-sm font-semibold truncate">{nodeData.label}</p>
        {descriptionPreview && (
          <p className="text-xs text-muted-foreground truncate">
            {descriptionPreview}
          </p>
        )}
        <div className="flex items-center justify-end">
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 leading-4">
            {edgeCount} edge{edgeCount !== 1 ? 's' : ''}
          </Badge>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-3 !w-3 !border-2 !border-violet-500 !bg-background"
      />
    </div>
  );
}

export const CustomNode = memo(CustomNodeInner);
