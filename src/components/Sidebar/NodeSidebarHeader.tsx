import { Input } from '@/components/ui/input';
import {
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

interface NodeSidebarHeaderProps {
  label: string;
  labelError: boolean;
  isStart: boolean;
  selectedNodeId: string;
  onLabelChange: (value: string) => void;
  onLabelBlur: () => void;
  onStartToggle: (checked: boolean) => void;
}

/**
 * Header section of the node sidebar: editable label, start-node
 * toggle, and read-only node ID.
 *
 * Extracted from NodeSidebar to keep the parent focused on layout
 * orchestration (architecture-compound-components).
 */
export function NodeSidebarHeader({
  label,
  labelError,
  isStart,
  selectedNodeId,
  onLabelChange,
  onLabelBlur,
  onStartToggle,
}: NodeSidebarHeaderProps) {
  return (
    <SheetHeader className='px-6 pt-6 pb-2'>
      {/* Editable label heading */}
      <SheetTitle className='sr-only'>Edit Node</SheetTitle>
      <Input
        id='node-label'
        value={label}
        onChange={(e) => onLabelChange(e.target.value)}
        onBlur={onLabelBlur}
        className={cn(
          'text-lg font-semibold border-none shadow-none px-0 h-auto focus-visible:ring-0',
          labelError && 'text-red-500',
        )}
        aria-label='Node label'
        aria-invalid={labelError || undefined}
        aria-describedby={labelError ? 'node-label-error' : undefined}
      />
      {labelError && (
        <p id='node-label-error' className='text-xs text-red-500' role='alert'>
          Node name is required
        </p>
      )}

      {/* Start node toggle */}
      <div className='flex items-center justify-between pt-1'>
        <label htmlFor='start-node-switch' className='text-sm font-medium'>
          Set as Start Node
        </label>
        <Switch
          id='start-node-switch'
          checked={isStart}
          onCheckedChange={onStartToggle}
          aria-label='Set as start node'
        />
      </div>

      {/* Read-only node ID */}
      <SheetDescription className='font-mono text-[11px]'>
        {selectedNodeId}
      </SheetDescription>
    </SheetHeader>
  );
}
