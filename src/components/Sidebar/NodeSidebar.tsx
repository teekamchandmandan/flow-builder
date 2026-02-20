import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { EdgeEditor } from '@/components/Sidebar/EdgeEditor';
import { ValidatedField } from '@/components/Sidebar/ValidatedField';
import { useFlowStore } from '@/store/flowStore';
import { cn } from '@/lib/utils';
import type { NodeData } from '@/types/flow';

/**
 * Node editing sidebar — slides from the right when a node is selected.
 *
 * Follows rerender-derived-state: derives the selected node from store during
 * render rather than caching in local state. Uses controlled Sheet with
 * functional setState for stable callbacks (rerender-functional-setstate).
 */
export function NodeSidebar() {
  /* ---------------------------------------------------------------- */
  /*  Store subscriptions — granular selectors to minimise re-renders  */
  /* ---------------------------------------------------------------- */
  const sidebarOpen = useFlowStore((s) => s.sidebarOpen);
  const selectedNodeId = useFlowStore((s) => s.selectedNodeId);
  const nodes = useFlowStore((s) => s.nodes);
  const edges = useFlowStore((s) => s.edges);
  const startNodeId = useFlowStore((s) => s.startNodeId);

  const updateNodeData = useFlowStore((s) => s.updateNodeData);
  const setStartNode = useFlowStore((s) => s.setStartNode);
  const deleteNode = useFlowStore((s) => s.deleteNode);
  const addEdge = useFlowStore((s) => s.addEdge);
  const closeSidebar = useFlowStore((s) => s.closeSidebar);

  /* ---------------------------------------------------------------- */
  /*  Derived state (rerender-derived-state-no-effect)                 */
  /* ---------------------------------------------------------------- */
  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId],
  );

  const outgoingEdges = useMemo(
    () => edges.filter((e) => e.source === selectedNodeId),
    [edges, selectedNodeId],
  );

  /* ---------------------------------------------------------------- */
  /*  Local validation touched state                                   */
  /* ---------------------------------------------------------------- */
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addEdgeOpen, setAddEdgeOpen] = useState(false);

  // Use selectedNodeId as key to reset local state without an effect
  // (rerender-derived-state-no-effect / avoid set-state-in-effect).
  const [stateKey, setStateKey] = useState(selectedNodeId);
  if (stateKey !== selectedNodeId) {
    setStateKey(selectedNodeId);
    setTouched({});
    setDeleteDialogOpen(false);
    setAddEdgeOpen(false);
  }

  // Auto-close sidebar if selected node is deleted (stale id).
  // Depend on a boolean rather than the full object so the effect doesn't
  // re-run on every node-data change (narrow-effect-dependencies).
  const selectedNodeExists = selectedNode !== null;
  useEffect(() => {
    if (sidebarOpen && selectedNodeId && !selectedNodeExists) {
      closeSidebar();
    }
  }, [sidebarOpen, selectedNodeId, selectedNodeExists, closeSidebar]);

  /* ---------------------------------------------------------------- */
  /*  Handlers (rerender-functional-setstate for stable references)    */
  /* ---------------------------------------------------------------- */
  const handleFieldChange = useCallback(
    (field: keyof NodeData, value: string) => {
      if (selectedNodeId) updateNodeData(selectedNodeId, { [field]: value });
    },
    [selectedNodeId, updateNodeData],
  );

  const markTouched = useCallback((field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const handleStartToggle = useCallback(
    (checked: boolean) => {
      if (!selectedNodeId) return;
      setStartNode(checked ? selectedNodeId : null);
    },
    [selectedNodeId, setStartNode],
  );

  const handleDeleteConfirm = useCallback(() => {
    if (selectedNodeId) {
      const removedEdgeCount = deleteNode(selectedNodeId);
      setDeleteDialogOpen(false);
      if (removedEdgeCount && removedEdgeCount > 0) {
        toast.success(
          `Removed node and ${removedEdgeCount} connected edge${removedEdgeCount !== 1 ? 's' : ''}`,
        );
      } else {
        toast.success('Node removed');
      }
    }
  }, [selectedNodeId, deleteNode]);

  const handleAddEdge = useCallback(
    (targetId: string) => {
      if (!selectedNodeId) return;
      addEdge({
        source: selectedNodeId,
        target: targetId,
        sourceHandle: null,
        targetHandle: null,
      });
      setAddEdgeOpen(false);
    },
    [selectedNodeId, addEdge],
  );

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) closeSidebar();
    },
    [closeSidebar],
  );

  /* ---------------------------------------------------------------- */
  /*  Validation derived values                                        */
  /* ---------------------------------------------------------------- */
  const label = selectedNode?.data.label ?? '';
  const description = selectedNode?.data.description ?? '';
  const prompt = selectedNode?.data.prompt ?? '';

  const labelError = touched.label && label.trim() === '';
  const descError = touched.description && description.trim() === '';
  const promptError = touched.prompt && prompt.trim() === '';

  const isStart = startNodeId === selectedNodeId;

  // Nodes available as edge targets (exclude self)
  const edgeTargetOptions = useMemo(
    () => nodes.filter((n) => n.id !== selectedNodeId),
    [nodes, selectedNodeId],
  );

  if (!selectedNode) {
    return (
      <Sheet open={sidebarOpen} onOpenChange={handleOpenChange}>
        <SheetContent side='right' className='w-[380px] sm:max-w-[380px]'>
          <SheetHeader>
            <SheetTitle>No node selected</SheetTitle>
            <SheetDescription>
              Click a node on the canvas to edit it.
            </SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <>
      <Sheet open={sidebarOpen} onOpenChange={handleOpenChange}>
        <SheetContent
          side='right'
          className='flex w-[380px] flex-col p-0 sm:max-w-[380px]'
        >
          <SheetHeader className='px-6 pt-6 pb-2'>
            {/* Editable label heading */}
            <SheetTitle className='sr-only'>Edit Node</SheetTitle>
            <Input
              id='node-label'
              value={label}
              onChange={(e) => handleFieldChange('label', e.target.value)}
              onBlur={() => markTouched('label')}
              className={cn(
                'text-lg font-semibold border-none shadow-none px-0 h-auto focus-visible:ring-0',
                labelError && 'text-red-500',
              )}
              aria-label='Node label'
              aria-invalid={labelError || undefined}
              aria-describedby={labelError ? 'node-label-error' : undefined}
            />
            {labelError && (
              <p
                id='node-label-error'
                className='text-xs text-red-500'
                role='alert'
              >
                Node name is required
              </p>
            )}

            {/* Start node toggle */}
            <div className='flex items-center justify-between pt-1'>
              <label
                htmlFor='start-node-switch'
                className='text-sm font-medium'
              >
                Set as Start Node
              </label>
              <Switch
                id='start-node-switch'
                checked={isStart}
                onCheckedChange={handleStartToggle}
                aria-label='Set as start node'
              />
            </div>

            {/* Read-only node ID */}
            <SheetDescription className='font-mono text-[11px]'>
              {selectedNodeId}
            </SheetDescription>
          </SheetHeader>

          <Separator />

          <ScrollArea className='flex-1 px-6'>
            <div className='space-y-5 py-4'>
              {/* Description field */}
              <ValidatedField
                id='node-description'
                label='Description'
                value={description}
                onChange={(v) => handleFieldChange('description', v)}
                onBlur={() => markTouched('description')}
                error={descError && 'Description is required'}
                placeholder='Describe what this node does…'
                multiline
                className='min-h-[80px]'
              />

              {/* Prompt field */}
              <ValidatedField
                id='node-prompt'
                label='Prompt'
                value={prompt}
                onChange={(v) => handleFieldChange('prompt', v)}
                onBlur={() => markTouched('prompt')}
                error={promptError && 'Prompt is required'}
                placeholder='Enter the prompt…'
                multiline
                className='min-h-[100px]'
              />

              <Separator />

              {/* Outgoing Edges section */}
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
                    onClick={() => setAddEdgeOpen(true)}
                    disabled={edgeTargetOptions.length === 0}
                    aria-label='Add outgoing edge'
                  >
                    <Plus className='mr-1 h-3 w-3' />
                    Add Edge
                  </Button>
                </div>

                {/* Add-edge target selector */}
                {addEdgeOpen && (
                  <div className='space-y-1.5 rounded-md border border-dashed border-border p-3'>
                    <label className='text-xs font-medium'>
                      Select target node
                    </label>
                    <Select onValueChange={handleAddEdge}>
                      <SelectTrigger className='h-8 text-xs'>
                        <SelectValue placeholder='Choose a node…' />
                      </SelectTrigger>
                      <SelectContent>
                        {edgeTargetOptions.map((node) => (
                          <SelectItem
                            key={node.id}
                            value={node.id}
                            className='text-xs'
                          >
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
                      onClick={() => setAddEdgeOpen(false)}
                    >
                      Cancel
                    </Button>
                  </div>
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
                        sourceNodeId={selectedNodeId!}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>

          <Separator />

          {/* Delete node button */}
          <div className='p-4'>
            <Button
              type='button'
              variant='destructive'
              className='w-full'
              onClick={() => setDeleteDialogOpen(true)}
            >
              Delete Node
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Node</DialogTitle>
            <DialogDescription>
              Are you sure? This will also remove all connected edges.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant='destructive' onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
