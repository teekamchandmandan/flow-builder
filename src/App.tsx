import { useEffect } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { TooltipProvider } from '@/components/ui/tooltip';

import { AppLayout } from '@/components/Layout/AppLayout';
import { useGlobalShortcuts } from '@/hooks/useGlobalShortcuts';
import { ErrorBoundary } from '@/components/ErrorBoundary';

/* ------------------------------------------------------------------ */
/*  App                                                                */
/* ------------------------------------------------------------------ */

function AppInner() {
  useGlobalShortcuts();

  // Restore dark mode preference on mount (fall back to system preference)
  useEffect(() => {
    const stored = localStorage.getItem('theme');
    if (stored === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (stored === 'light') {
      document.documentElement.classList.remove('dark');
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  return <AppLayout />;
}

function App() {
  return (
    <ErrorBoundary>
      <ReactFlowProvider>
        <TooltipProvider delayDuration={300}>
          <AppInner />
        </TooltipProvider>
      </ReactFlowProvider>
    </ErrorBoundary>
  );
}

export default App;
