import { Plus } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AddEdgeSelector } from '@/components/Sidebar/AddEdgeSelector';
import { EdgeEditor } from '@/components/Sidebar/EdgeEditor';
import type { FlowEdge, FlowNode } from '@/types/flow';

interface OutgoingEdgesSectionProps {
  outgoingEdges: FlowEdge[];
  edgeTargetOptions: FlowNode[];
  selectedNodeId: string;
  addEdgeOpen: boolean;
  onAddEdgeOpenChange: (open: boolean) => void;
  onAddEdge: (targetId: string) => void;
}

/**
 * Outgoing edges list with inline add-edge controls.
 *
 * Extracted from NodeSidebar so the sidebar's render tree stays
 * shallow and each section can be reasoned about independently
 * (architecture-compound-components).
 */
export function OutgoingEdgesSection({
  outgoingEdges,
  edgeTargetOptions,
  selectedNodeId,
  addEdgeOpen,
  onAddEdgeOpenChange,
  onAddEdge,
}: OutgoingEdgesSectionProps) {
  return (
    <div className='space-y-3'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <span className='text-sm font-medium'>Outgoing Edges</span>
          <Badge variant='secondary' className='text-[10px] px-1.5'>
            {outgoingEdges.length}
          </Badge>
        </div>
        <Button
          type='button'
          variant='outline'
          size='sm'
          className='h-7 text-xs'
          onClick={() => onAddEdgeOpenChange(true)}
          disabled={edgeTargetOptions.length === 0}
          aria-label='Add outgoing edge'
        >
          <Plus className='mr-1 h-3 w-3' />
          Add Edge
        </Button>
      </div>

      {/* Add-edge target selector */}
      {addEdgeOpen && (
        <AddEdgeSelector
          options={edgeTargetOptions}
          onSelect={onAddEdge}
          onCancel={() => onAddEdgeOpenChange(false)}
        />
      )}

      {/* Edge list */}
      {outgoingEdges.length === 0 ? (
        <p className='text-xs text-muted-foreground italic'>
          No outgoing edges
        </p>
      ) : (
        <div className='space-y-2'>
          {outgoingEdges.map((edge) => (
            <EdgeEditor
              key={edge.id}
              edge={edge}
              sourceNodeId={selectedNodeId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
