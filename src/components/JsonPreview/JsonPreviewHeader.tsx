import { Copy, Download, Upload, X } from 'lucide-react';

import { ToolbarButton } from '@/components/Layout/ToolbarButton';

interface JsonPreviewHeaderProps {
  onImport: () => void;
  onDownload: () => void;
  onCopy: () => void;
  onClose: () => void;
}

/**
 * Header bar for the JSON preview panel with import/download/copy/close buttons.
 *
 * Reuses ToolbarButton (size='sm') to eliminate the repetitive
 * Tooltip+Button pattern (architecture-compound-components).
 */
export function JsonPreviewHeader({
  onImport,
  onDownload,
  onCopy,
  onClose,
}: JsonPreviewHeaderProps) {
  return (
    <div className='flex items-center justify-between border-b border-border px-4 py-2'>
      <span className='text-sm font-semibold'>JSON Schema</span>
      <div className='flex items-center gap-1'>
        <ToolbarButton
          size='sm'
          onClick={onImport}
          label='Import JSON'
          tooltip='Import'
          icon={<Upload className='h-3.5 w-3.5' />}
        />
        <ToolbarButton
          size='sm'
          onClick={onDownload}
          label='Download JSON'
          tooltip='Download'
          icon={<Download className='h-3.5 w-3.5' />}
        />
        <ToolbarButton
          size='sm'
          onClick={onCopy}
          label='Copy JSON'
          tooltip='Copy'
          icon={<Copy className='h-3.5 w-3.5' />}
        />
        <ToolbarButton
          size='sm'
          onClick={onClose}
          label='Close JSON panel'
          tooltip='Close'
          icon={<X className='h-3.5 w-3.5' />}
        />
      </div>
    </div>
  );
}
