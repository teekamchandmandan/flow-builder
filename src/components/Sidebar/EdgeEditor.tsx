import { useCallback, useMemo, useState } from 'react';
import { Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ParameterEditor } from '@/components/Sidebar/ParameterEditor';
import { useFlowStore } from '@/store/flowStore';
import { cn } from '@/lib/utils';
import type { FlowEdge, FlowNode } from '@/types/flow';

/** Hoisted empty default to avoid new object reference each render (rerender-memo-with-default-value). */
const EMPTY_PARAMS: Record<string, string> = {};

interface EdgeEditorProps {
  edge: FlowEdge;
  sourceNodeId: string;
}

/**
 * Edits a single outgoing edge: target selection, condition, parameters.
 * Subscribes only to the specific store slices it needs
 * (rerender-derived-state).
 */
export function EdgeEditor({ edge, sourceNodeId }: EdgeEditorProps) {
  const nodes = useFlowStore((s) => s.nodes);
  const updateEdgeData = useFlowStore((s) => s.updateEdgeData);
  const updateEdgeTarget = useFlowStore((s) => s.updateEdgeTarget);
  const deleteEdge = useFlowStore((s) => s.deleteEdge);

  const [conditionTouched, setConditionTouched] = useState(false);

  const condition = edge.data?.condition ?? '';
  const parameters = edge.data?.parameters ?? EMPTY_PARAMS;
  const conditionError = conditionTouched && condition.trim() === '';

  // Memoize derived lookups (rerender-derived-state-no-effect)
  const targetOptions: FlowNode[] = useMemo(
    () => nodes.filter((n) => n.id !== sourceNodeId),
    [nodes, sourceNodeId],
  );

  const targetNode = useMemo(
    () => nodes.find((n) => n.id === edge.target),
    [nodes, edge.target],
  );

  const handleConditionChange = useCallback(
    (value: string) => {
      updateEdgeData(edge.id, { condition: value });
    },
    [edge.id, updateEdgeData],
  );

  const handleTargetChange = useCallback(
    (targetId: string) => {
      updateEdgeTarget(edge.id, targetId);
    },
    [edge.id, updateEdgeTarget],
  );

  const handleParametersChange = useCallback(
    (params: Record<string, string>) => {
      updateEdgeData(edge.id, { parameters: params });
    },
    [edge.id, updateEdgeData],
  );

  const handleDelete = useCallback(() => {
    deleteEdge(edge.id);
  }, [edge.id, deleteEdge]);

  return (
    <div className='space-y-3 rounded-md border border-border bg-muted/30 p-3'>
      <div className='flex items-center justify-between'>
        <span className='text-xs font-medium'>
          → {targetNode?.data.label ?? 'No target'}
        </span>
        <Button
          type='button'
          variant='ghost'
          size='icon'
          className='h-6 w-6 text-muted-foreground hover:text-destructive'
          onClick={handleDelete}
          aria-label={`Remove edge to ${targetNode?.data.label ?? 'unknown'}`}
        >
          <Trash2 className='h-3.5 w-3.5' />
        </Button>
      </div>

      {/* Target node selector */}
      <div className='space-y-1'>
        <label
          htmlFor={`edge-target-${edge.id}`}
          className='text-xs font-medium'
        >
          Target Node
        </label>
        <Select value={edge.target} onValueChange={handleTargetChange}>
          <SelectTrigger id={`edge-target-${edge.id}`} className='h-8 text-xs'>
            <SelectValue placeholder='Select target node' />
          </SelectTrigger>
          <SelectContent>
            {targetOptions.map((node) => (
              <SelectItem key={node.id} value={node.id} className='text-xs'>
                {node.data.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Condition */}
      <div className='space-y-1'>
        <label
          htmlFor={`edge-condition-${edge.id}`}
          className='text-xs font-medium'
        >
          Condition
        </label>
        <Input
          id={`edge-condition-${edge.id}`}
          value={condition}
          onChange={(e) => handleConditionChange(e.target.value)}
          onBlur={() => setConditionTouched(true)}
          placeholder='Enter condition'
          className={cn('h-8 text-xs', conditionError && 'border-red-500')}
          aria-invalid={conditionError || undefined}
          aria-describedby={
            conditionError ? `edge-condition-${edge.id}-error` : undefined
          }
        />
        {conditionError && (
          <p
            id={`edge-condition-${edge.id}-error`}
            className='text-[11px] text-red-500'
            role='alert'
          >
            Condition is required
          </p>
        )}
      </div>

      <Separator className='my-1' />

      {/* Parameters */}
      <ParameterEditor
        parameters={parameters}
        onChange={handleParametersChange}
      />
    </div>
  );
}
