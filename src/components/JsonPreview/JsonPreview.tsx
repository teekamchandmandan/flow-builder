import { useCallback, useMemo, useState } from 'react';
import SyntaxHighlighter from 'react-syntax-highlighter/dist/esm/light';
import json from 'react-syntax-highlighter/dist/esm/languages/hljs/json';
import atomOneDark from 'react-syntax-highlighter/dist/esm/styles/hljs/atom-one-dark';
import atomOneLight from 'react-syntax-highlighter/dist/esm/styles/hljs/atom-one-light';
import { Copy, Download, Upload, X } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useFlowStore } from '@/store/flowStore';
import { ImportDialog } from './ImportDialog';
import { cn, downloadJsonFile } from '@/lib/utils';
import { useDarkMode } from '../../hooks/useDarkMode';

SyntaxHighlighter.registerLanguage('json', json);

/**
 * Collapsible JSON preview panel with live syntax-highlighted output,
 * copy/download actions, and validation summary.
 *
 * Uses memoized JSON computation (rerender-simple-expression-in-memo)
 * and granular store selectors (rerender-derived-state).
 */
export function JsonPreview() {
  const nodes = useFlowStore((s) => s.nodes);
  const edges = useFlowStore((s) => s.edges);
  const startNodeId = useFlowStore((s) => s.startNodeId);
  const errors = useFlowStore((s) => s.errors);
  const warnings = useFlowStore((s) => s.warnings);
  const jsonPanelOpen = useFlowStore((s) => s.jsonPanelOpen);
  const toggleJsonPanel = useFlowStore((s) => s.toggleJsonPanel);
  const exportJSON = useFlowStore((s) => s.exportJSON);

  const [importOpen, setImportOpen] = useState(false);
  const isDark = useDarkMode();

  const jsonString = useMemo(
    () => exportJSON(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [nodes, edges, startNodeId],
  );

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      toast.success('Copied to clipboard!');
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  }, [jsonString]);

  const handleDownload = useCallback(() => {
    downloadJsonFile(jsonString);
    toast.success('Downloaded flow-schema.json');
  }, [jsonString]);

  const errorCount = errors.length;
  const warningCount = warnings.length;

  return (
    <>
      <div
        className={cn(
          'flex h-full flex-col border-l border-border bg-card transition-[width,opacity] duration-300 ease-in-out',
          jsonPanelOpen
            ? 'w-[400px] opacity-100'
            : 'w-0 opacity-0 overflow-hidden',
        )}
      >
        {/* Header */}
        <div className='flex items-center justify-between border-b border-border px-4 py-2'>
          <span className='text-sm font-semibold'>JSON Schema</span>
          <div className='flex items-center gap-1'>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-7 w-7'
                  onClick={() => setImportOpen(true)}
                  aria-label='Import JSON'
                >
                  <Upload className='h-3.5 w-3.5' />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Import</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-7 w-7'
                  onClick={handleDownload}
                  aria-label='Download JSON'
                >
                  <Download className='h-3.5 w-3.5' />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Download</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-7 w-7'
                  onClick={handleCopy}
                  aria-label='Copy JSON'
                >
                  <Copy className='h-3.5 w-3.5' />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copy</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-7 w-7'
                  onClick={toggleJsonPanel}
                  aria-label='Close JSON panel'
                >
                  <X className='h-3.5 w-3.5' />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Close</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Validation summary */}
        <div className='border-b border-border px-4 py-1.5 text-xs'>
          {errorCount === 0 && warningCount === 0 ? (
            <span className='text-green-600 dark:text-green-400'>✓ Valid</span>
          ) : (
            <span className='space-x-2'>
              {errorCount > 0 && (
                <span className='text-red-500'>
                  ✕ {errorCount} error{errorCount !== 1 ? 's' : ''}
                </span>
              )}
              {warningCount > 0 && (
                <span className='text-amber-500'>
                  ⚠ {warningCount} warning{warningCount !== 1 ? 's' : ''}
                </span>
              )}
            </span>
          )}
        </div>

        {/* JSON content */}
        <ScrollArea className='flex-1'>
          <SyntaxHighlighter
            language='json'
            style={isDark ? atomOneDark : atomOneLight}
            customStyle={{
              margin: 0,
              padding: '1rem',
              fontSize: '12px',
              background: 'transparent',
              minHeight: '100%',
            }}
          >
            {jsonString}
          </SyntaxHighlighter>
        </ScrollArea>
      </div>

      <ImportDialog open={importOpen} onOpenChange={setImportOpen} />
    </>
  );
}
