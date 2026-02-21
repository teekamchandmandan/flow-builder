import { useCallback, useState } from 'react';
import { useReactFlow } from '@xyflow/react';
import {
  Code2,
  Copy,
  Download,
  LayoutGrid,
  Moon,
  Plus,
  Redo2,
  Sun,
  Undo2,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';

import { Separator } from '@/components/ui/separator';
import { ImportDialog } from '@/components/JsonPreview/ImportDialog';
import { ToolbarButton } from '@/components/Layout/ToolbarButton';
import { ValidationBadgeDropdown } from '@/components/Layout/ValidationBadgeDropdown';
import { useFlowStore } from '@/store/flowStore';
import { useDarkMode } from '@/hooks/useDarkMode';
import { useJsonActions } from '@/hooks/useJsonActions';
import { autoLayout } from '@/lib/layout';

/**
 * Fixed top toolbar with action buttons.
 *
 * Follows rerender-derived-state — subscribes to primitive booleans
 * and counts rather than full arrays for badge rendering. Uses
 * useCallback for all handlers (rerender-functional-setstate).
 */
export function Toolbar() {
  const addNode = useFlowStore((s) => s.addNode);
  const undo = useFlowStore((s) => s.undo);
  const redo = useFlowStore((s) => s.redo);
  const canUndo = useFlowStore((s) => s.canUndo);
  const canRedo = useFlowStore((s) => s.canRedo);
  const toggleJsonPanel = useFlowStore((s) => s.toggleJsonPanel);
  const jsonPanelOpen = useFlowStore((s) => s.jsonPanelOpen);
  const errorCount = useFlowStore((s) => s.errors.length);
  const warningCount = useFlowStore((s) => s.warnings.length);

  // Avoid subscribing to nodes/edges just for auto-layout handler.
  // Read at call time via getState() (rerender-defer-reads).
  const { fitView } = useReactFlow();

  const [importOpen, setImportOpen] = useState(false);
  const darkMode = useDarkMode();
  const { handleCopy, handleDownload } = useJsonActions();

  const handleAutoLayout = useCallback(() => {
    // Read nodes/edges at call time instead of subscribing (rerender-defer-reads).
    const { nodes: currentNodes, edges: currentEdges } =
      useFlowStore.getState();
    const laidOut = autoLayout(currentNodes, currentEdges);
    // Update store only — it's the single source of truth for React Flow.
    useFlowStore.getState().onNodesChange(
      laidOut.map((node) => ({
        type: 'position' as const,
        id: node.id,
        position: node.position,
      })),
    );
    requestAnimationFrame(() => {
      fitView({ duration: 300 });
    });
    toast.success('Layout applied');
  }, [fitView]);

  const handleToggleDark = useCallback(() => {
    const next = !darkMode;
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  }, [darkMode]);

  return (
    <>
      <header className='flex h-12 shrink-0 items-center justify-between border-b border-border bg-card px-4'>
        {/* Left: Title */}
        <div className='flex items-center gap-2'>
          <Code2 className='h-5 w-5 text-violet-500' />
          <span className='text-sm font-bold tracking-tight'>Flow Builder</span>
        </div>

        {/* Right: Actions */}
        <div className='flex items-center gap-1'>
          <ToolbarButton
            onClick={addNode}
            label='Add node'
            tooltip='Add Node'
            icon={<Plus className='h-4 w-4' />}
          />
          <ToolbarButton
            onClick={undo}
            label='Undo'
            tooltip='Undo (⌘Z)'
            icon={<Undo2 className='h-4 w-4' />}
            disabled={!canUndo}
          />
          <ToolbarButton
            onClick={redo}
            label='Redo'
            tooltip='Redo (⌘⇧Z)'
            icon={<Redo2 className='h-4 w-4' />}
            disabled={!canRedo}
          />

          <Separator orientation='vertical' className='mx-1 h-5' />

          <ToolbarButton
            onClick={() => setImportOpen(true)}
            label='Import JSON'
            tooltip='Import'
            icon={<Upload className='h-4 w-4' />}
          />
          <ToolbarButton
            onClick={handleDownload}
            label='Download JSON'
            tooltip='Download (⌘S)'
            icon={<Download className='h-4 w-4' />}
          />
          <ToolbarButton
            onClick={handleCopy}
            label='Copy JSON'
            tooltip='Copy JSON'
            icon={<Copy className='h-4 w-4' />}
          />

          <Separator orientation='vertical' className='mx-1 h-5' />

          <ToolbarButton
            onClick={toggleJsonPanel}
            label='Toggle JSON panel'
            tooltip='JSON Panel'
            icon={<Code2 className='h-4 w-4' />}
            variant={jsonPanelOpen ? 'secondary' : 'ghost'}
          />
          <ToolbarButton
            onClick={handleAutoLayout}
            label='Auto layout'
            tooltip='Auto Layout'
            icon={<LayoutGrid className='h-4 w-4' />}
          />

          <Separator orientation='vertical' className='mx-1 h-5' />

          {/* Validation badge */}
          <ValidationBadgeDropdown
            errorCount={errorCount}
            warningCount={warningCount}
          />

          {/* Dark mode toggle */}
          <ToolbarButton
            onClick={handleToggleDark}
            label='Toggle dark mode'
            tooltip={darkMode ? 'Light mode' : 'Dark mode'}
            icon={
              darkMode ? (
                <Sun className='h-4 w-4' />
              ) : (
                <Moon className='h-4 w-4' />
              )
            }
          />
        </div>
      </header>

      <ImportDialog open={importOpen} onOpenChange={setImportOpen} />
    </>
  );
}
