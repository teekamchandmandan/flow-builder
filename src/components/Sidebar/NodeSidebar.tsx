import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { DeleteNodeDialog } from '@/components/Sidebar/DeleteNodeDialog';
import { NodeSidebarHeader } from '@/components/Sidebar/NodeSidebarHeader';
import { OutgoingEdgesSection } from '@/components/Sidebar/OutgoingEdgesSection';
import { ValidatedField } from '@/components/Sidebar/ValidatedField';
import { useFlowStore } from '@/store/flowStore';
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
          <NodeSidebarHeader
            label={label}
            labelError={labelError}
            isStart={isStart}
            selectedNodeId={selectedNodeId!}
            onLabelChange={(v) => handleFieldChange('label', v)}
            onLabelBlur={() => markTouched('label')}
            onStartToggle={handleStartToggle}
          />

          <Separator />

          <ScrollArea className='flex-1 px-6'>
            <div className='space-y-5 py-4'>
              {/* Section heading */}
              <h3 className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
                Node Details
              </h3>

              {/* Description field */}
              <ValidatedField
                id='node-description'
                label='Description'
                value={description}
                onChange={(v) => handleFieldChange('description', v)}
                onBlur={() => markTouched('description')}
                error={descError && 'Description is required'}
                placeholder='Describe what this node does…'
                helperText='A short summary shown on the canvas card'
                multiline
                required
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
                placeholder='Enter the prompt text…'
                helperText='The prompt text associated with this node'
                multiline
                required
                className='min-h-[100px]'
              />

              <Separator />

              {/* Outgoing Edges section */}
              <OutgoingEdgesSection
                outgoingEdges={outgoingEdges}
                edgeTargetOptions={edgeTargetOptions}
                selectedNodeId={selectedNodeId!}
                addEdgeOpen={addEdgeOpen}
                onAddEdgeOpenChange={setAddEdgeOpen}
                onAddEdge={handleAddEdge}
              />
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
      <DeleteNodeDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}
