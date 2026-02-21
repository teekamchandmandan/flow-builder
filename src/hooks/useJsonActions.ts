import { useCallback } from 'react';
import { toast } from 'sonner';

import { useFlowStore } from '@/store/flowStore';
import { downloadJsonFile } from '@/lib/utils';

/**
 * Shared hook for JSON copy-to-clipboard and download actions.
 *
 * Eliminates duplication between Toolbar and JsonPreview
 * (both had identical handleCopy / handleDownload logic).
 * Uses getState() at call time to avoid subscribing to
 * state changes (rerender-defer-reads).
 */
export function useJsonActions() {
  const exportJSON = useFlowStore((s) => s.exportJSON);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(exportJSON());
      toast.success('Copied to clipboard!');
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  }, [exportJSON]);

  const handleDownload = useCallback(() => {
    downloadJsonFile(exportJSON());
    toast.success('Downloaded flow-schema.json');
  }, [exportJSON]);

  return { handleCopy, handleDownload } as const;
}
