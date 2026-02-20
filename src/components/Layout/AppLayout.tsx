import { Toaster } from 'sonner';

import { FlowCanvas } from '@/components/Canvas/FlowCanvas';
import { JsonPreview } from '@/components/JsonPreview/JsonPreview';
import { Toolbar } from '@/components/Layout/Toolbar';
import { NodeSidebar } from '@/components/Sidebar/NodeSidebar';
import { useDarkMode } from '@/hooks/useDarkMode';

/**
 * Full-viewport app layout:
 *  - Toolbar (fixed height, top)
 *  - Main area: canvas fills remaining space + JSON panel on right.
 *  - NodeSidebar renders as Sheet overlay (floats over canvas).
 *  - Sonner <Toaster /> for toast notifications.
 */
export function AppLayout() {
  const isDark = useDarkMode();

  return (
    <div className='flex h-screen flex-col bg-background text-foreground'>
      <Toolbar />

      <div className='flex flex-1 overflow-hidden'>
        {/* Canvas — fills all remaining space */}
        <div className='relative flex-1'>
          <FlowCanvas />
        </div>

        {/* JSON preview panel — conditional right panel */}
        <JsonPreview />
      </div>

      {/* Sidebar overlay — floats over canvas, doesn't affect layout */}
      <NodeSidebar />

      {/* Toast notifications */}
      <Toaster
        position='bottom-right'
        richColors
        closeButton
        theme={isDark ? 'dark' : 'light'}
      />
    </div>
  );
}
