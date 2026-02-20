import { useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';
import { AlertTriangle, XCircle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useFlowStore } from '@/store/flowStore';
import type { ValidationIssue } from '@/types/validation';

/**
 * Collapsible validation panel listing all current errors and warnings.
 *
 * Each item is clickable: selecting it highlights the node on canvas
 * via store.selectNode + fitView centered on the problematic node.
 */
export function ValidationPanel() {
  const errors = useFlowStore((s) => s.errors);
  const warnings = useFlowStore((s) => s.warnings);
  const selectNode = useFlowStore((s) => s.selectNode);
  const { fitView } = useReactFlow();

  const handleItemClick = useCallback(
    (nodeId?: string) => {
      if (!nodeId) return;
      selectNode(nodeId);
      fitView({ nodes: [{ id: nodeId }], duration: 300 });
    },
    [selectNode, fitView],
  );

  const issues: ValidationIssue[] = [
    ...errors,
    ...warnings,
  ];

  if (issues.length === 0) {
    return (
      <div className='px-4 py-3 text-xs text-muted-foreground'>
        No issues found
      </div>
    );
  }

  return (
    <ScrollArea className='max-h-[200px]'>
      <div className='space-y-1 p-2'>
        {issues.map((issue) => (
          <button
            key={`${issue.type}-${issue.nodeId ?? 'graph'}-${issue.message}`}
            type='button'
            className='flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-muted'
            onClick={() => handleItemClick(issue.nodeId)}
          >
            {issue.type === 'error' ? (
              <XCircle className='mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500' />
            ) : (
              <AlertTriangle className='mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500' />
            )}
            <div className='min-w-0 flex-1'>
              <p className='truncate'>{issue.message}</p>
              {issue.nodeId && (
                <Badge
                  variant='secondary'
                  className='mt-0.5 text-[10px] px-1 py-0'
                >
                  {issue.nodeId.slice(0, 8)}…
                </Badge>
              )}
            </div>
          </button>
        ))}
      </div>
    </ScrollArea>
  );
}
