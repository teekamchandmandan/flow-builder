import { useCallback, useState } from 'react';
import { useReactFlow } from '@xyflow/react';
import {
  CheckCircle,
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
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ImportDialog } from '@/components/JsonPreview/ImportDialog';
import { useFlowStore } from '@/store/flowStore';
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
  const exportJSON = useFlowStore((s) => s.exportJSON);
  const errorCount = useFlowStore((s) => s.errors.length);
  const warningCount = useFlowStore((s) => s.warnings.length);
  const nodes = useFlowStore((s) => s.nodes);
  const edges = useFlowStore((s) => s.edges);

  const { fitView, setNodes } = useReactFlow();

  const [importOpen, setImportOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() =>
    document.documentElement.classList.contains('dark'),
  );

  const handleDownload = useCallback(() => {
    const jsonString = exportJSON();
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'flow-schema.json';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Downloaded flow-schema.json');
  }, [exportJSON]);

  const handleCopy = useCallback(async () => {
    try {
      const jsonString = exportJSON();
      await navigator.clipboard.writeText(jsonString);
      toast.success('Copied to clipboard!');
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  }, [exportJSON]);

  const handleAutoLayout = useCallback(() => {
    const laidOut = autoLayout(nodes, edges);
    setNodes(laidOut);
    // Also update the store
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
  }, [nodes, edges, setNodes, fitView]);

  const handleToggleDark = useCallback(() => {
    const next = !darkMode;
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
    setDarkMode(next);
  }, [darkMode]);

  return (
    <>
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-card px-4">
        {/* Left: Title */}
        <div className="flex items-center gap-2">
          <Code2 className="h-5 w-5 text-violet-500" />
          <span className="text-sm font-bold tracking-tight">Flow Builder</span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={addNode}
                aria-label="Add node"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add Node</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={undo}
                disabled={!canUndo}
                aria-label="Undo"
              >
                <Undo2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Undo (⌘Z)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={redo}
                disabled={!canRedo}
                aria-label="Redo"
              >
                <Redo2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Redo (⌘⇧Z)</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="mx-1 h-5" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setImportOpen(true)}
                aria-label="Import JSON"
              >
                <Upload className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Import</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleDownload}
                aria-label="Download JSON"
              >
                <Download className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Download (⌘S)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleCopy}
                aria-label="Copy JSON"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copy JSON</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="mx-1 h-5" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={jsonPanelOpen ? 'secondary' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={toggleJsonPanel}
                aria-label="Toggle JSON panel"
              >
                <Code2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>JSON Panel</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleAutoLayout}
                aria-label="Auto layout"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Auto Layout</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="mx-1 h-5" />

          {/* Validation badge */}
          <ValidationBadge errorCount={errorCount} warningCount={warningCount} />

          {/* Dark mode toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleToggleDark}
                aria-label="Toggle dark mode"
              >
                {darkMode ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{darkMode ? 'Light mode' : 'Dark mode'}</TooltipContent>
          </Tooltip>
        </div>
      </header>

      <ImportDialog open={importOpen} onOpenChange={setImportOpen} />
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Validation Badge — extracted for clarity                            */
/* ------------------------------------------------------------------ */

function ValidationBadge({
  errorCount,
  warningCount,
}: {
  errorCount: number;
  warningCount: number;
}) {
  if (errorCount > 0) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1 px-2 text-red-500"
            aria-label={`${errorCount} validation error${errorCount !== 1 ? 's' : ''}`}
          >
            <XCircle className="h-4 w-4" />
            <span className="text-xs">{errorCount}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {errorCount} error{errorCount !== 1 ? 's' : ''}
          {warningCount > 0 && `, ${warningCount} warning${warningCount !== 1 ? 's' : ''}`}
        </TooltipContent>
      </Tooltip>
    );
  }

  if (warningCount > 0) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1 px-2 text-amber-500"
            aria-label={`${warningCount} validation warning${warningCount !== 1 ? 's' : ''}`}
          >
            <AlertTriangle className="h-4 w-4" />
            <span className="text-xs">{warningCount}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {warningCount} warning{warningCount !== 1 ? 's' : ''}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1 px-2 text-green-500"
          aria-label="No validation issues"
        >
          <CheckCircle className="h-4 w-4" />
          <span className="text-xs">Valid</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>No issues found</TooltipContent>
    </Tooltip>
  );
}
