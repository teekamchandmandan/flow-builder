import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { FlowNode } from '@/types/flow';

interface AddEdgeSelectorProps {
  options: FlowNode[];
  onSelect: (targetId: string) => void;
  onCancel: () => void;
}

/**
 * Inline selector for picking a target node when adding an edge.
 *
 * Extracted from NodeSidebar to isolate the add-edge interaction
 * (architecture-compound-components).
 */
export function AddEdgeSelector({
  options,
  onSelect,
  onCancel,
}: AddEdgeSelectorProps) {
  return (
    <div className='space-y-1.5 rounded-md border border-dashed border-border p-3'>
      <label className='text-xs font-medium'>Select target node</label>
      <Select onValueChange={onSelect}>
        <SelectTrigger className='h-8 text-xs'>
          <SelectValue placeholder='Choose a node…' />
        </SelectTrigger>
        <SelectContent>
          {options.map((node) => (
            <SelectItem key={node.id} value={node.id} className='text-xs'>
              {node.data.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        type='button'
        variant='ghost'
        size='sm'
        className='h-6 text-xs'
        onClick={onCancel}
      >
        Cancel
      </Button>
    </div>
  );
}
