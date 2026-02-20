import { useCallback, useState } from 'react';
import { useReactFlow } from '@xyflow/react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useFlowStore } from '@/store/flowStore';

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Dialog for importing a JSON flow schema. Parses, validates, and
 * hydrates the store on success, showing inline errors on failure.
 *
 * Uses functional setState (rerender-functional-setstate) and
 * keeps callbacks stable via useCallback.
 */
export function ImportDialog({ open, onOpenChange }: ImportDialogProps) {
  const importJSON = useFlowStore((s) => s.importJSON);
  const { fitView } = useReactFlow();

  const [jsonText, setJsonText] = useState('');
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleImport = useCallback(async () => {
    setImportErrors([]);

    // Quick JSON syntax check
    try {
      JSON.parse(jsonText);
    } catch {
      setImportErrors(['Invalid JSON syntax']);
      return;
    }

    setLoading(true);

    // Small delay to let the UI render the spinner before dagre runs
    await new Promise((resolve) => setTimeout(resolve, 50));

    const result = importJSON(jsonText);

    setLoading(false);

    if (result.success) {
      toast.success('Flow imported successfully');
      onOpenChange(false);
      setJsonText('');
      setImportErrors([]);
      // Wait a tick for React Flow to update, then fit view
      requestAnimationFrame(() => {
        fitView({ duration: 300 });
      });
    } else {
      setImportErrors(result.errors ?? ['Import failed']);
    }
  }, [jsonText, importJSON, onOpenChange, fitView]);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        setJsonText('');
        setImportErrors([]);
      }
      onOpenChange(nextOpen);
    },
    [onOpenChange],
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='sm:max-w-[560px]'>
        <DialogHeader>
          <DialogTitle>Import Flow</DialogTitle>
          <DialogDescription>
            Paste a JSON flow schema below. This will replace your current flow.
          </DialogDescription>
        </DialogHeader>

        <Textarea
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          placeholder='{"startNodeId": "...", "nodes": [...]}'
          className='min-h-[300px] font-mono text-xs'
          rows={20}
        />

        {importErrors.length > 0 && (
          <div className='space-y-1 rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950'>
            {importErrors.map((err, i) => (
              <p key={i} className='text-xs text-red-600 dark:text-red-400'>
                {err}
              </p>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant='outline' onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={loading || jsonText.trim() === ''}
          >
            {loading ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Importing…
              </>
            ) : (
              'Import'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
