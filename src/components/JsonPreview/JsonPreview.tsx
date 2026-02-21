import { useMemo, useState } from 'react';
import SyntaxHighlighter from 'react-syntax-highlighter/dist/esm/light';
import json from 'react-syntax-highlighter/dist/esm/languages/hljs/json';
import atomOneDark from 'react-syntax-highlighter/dist/esm/styles/hljs/atom-one-dark';
import atomOneLight from 'react-syntax-highlighter/dist/esm/styles/hljs/atom-one-light';

import { ScrollArea } from '@/components/ui/scroll-area';
import { ImportDialog } from '@/components/JsonPreview/ImportDialog';
import { JsonPreviewHeader } from '@/components/JsonPreview/JsonPreviewHeader';
import { ValidationSummary } from '@/components/JsonPreview/ValidationSummary';
import { useFlowStore } from '@/store/flowStore';
import { useDarkMode } from '@/hooks/useDarkMode';
import { useJsonActions } from '@/hooks/useJsonActions';
import { cn } from '@/lib/utils';

SyntaxHighlighter.registerLanguage('json', json);

/**
 * Collapsible JSON preview panel with live syntax-highlighted output,
 * copy/download actions, and validation summary.
 *
 * Uses memoized JSON computation and granular store selectors
 * (rerender-derived-state).
 */
export function JsonPreview() {
  const nodes = useFlowStore((s) => s.nodes);
  const edges = useFlowStore((s) => s.edges);
  const startNodeId = useFlowStore((s) => s.startNodeId);
  const errorCount = useFlowStore((s) => s.errors.length);
  const warningCount = useFlowStore((s) => s.warnings.length);
  const jsonPanelOpen = useFlowStore((s) => s.jsonPanelOpen);
  const toggleJsonPanel = useFlowStore((s) => s.toggleJsonPanel);
  const exportJSON = useFlowStore((s) => s.exportJSON);

  const [importOpen, setImportOpen] = useState(false);
  const isDark = useDarkMode();
  const { handleCopy, handleDownload } = useJsonActions();

  // Recompute JSON only when data changes (nodes/edges/startNodeId are
  // the reactive deps; exportJSON is a stable action reference).
  const jsonString = useMemo(
    () => exportJSON(),
    [exportJSON, nodes, edges, startNodeId],
  );

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
        <JsonPreviewHeader
          onImport={() => setImportOpen(true)}
          onDownload={handleDownload}
          onCopy={handleCopy}
          onClose={toggleJsonPanel}
        />

        {/* Validation summary */}
        <div className='border-b border-border px-4 py-1.5 text-xs'>
          <ValidationSummary
            errorCount={errorCount}
            warningCount={warningCount}
          />
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
