import { Component, useEffect, type ReactNode } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { TooltipProvider } from '@/components/ui/tooltip';

import { AppLayout } from '@/components/Layout/AppLayout';
import { useFlowStore } from '@/store/flowStore';
import { downloadJsonFile } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/*  Global keyboard shortcuts                                          */
/* ------------------------------------------------------------------ */

/** Tags where shortcuts should be suppressed (user is typing). */
const INPUT_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

function useGlobalShortcuts() {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (INPUT_TAGS.has(tag)) return;

      const mod = e.metaKey || e.ctrlKey;

      if (mod && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        useFlowStore.getState().undo();
        return;
      }

      if (mod && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        useFlowStore.getState().redo();
        return;
      }

      if (mod && e.key === 's') {
        e.preventDefault();
        downloadJsonFile(useFlowStore.getState().exportJSON());
        return;
      }

      if (e.key === 'Escape') {
        useFlowStore.getState().closeSidebar();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}

/* ------------------------------------------------------------------ */
/*  App-level error boundary                                           */
/* ------------------------------------------------------------------ */

interface ErrorBoundaryState {
  hasError: boolean;
}

class AppErrorBoundary extends Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className='flex h-screen w-full items-center justify-center bg-background text-foreground'>
          <div className='text-center space-y-2'>
            <p className='text-lg font-semibold'>Something went wrong</p>
            <p className='text-sm text-muted-foreground'>
              Please refresh the page to continue.
            </p>
            <button
              type='button'
              className='rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90'
              onClick={() => {
                this.setState({ hasError: false });
                window.location.reload();
              }}
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

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
    <AppErrorBoundary>
      <ReactFlowProvider>
        <TooltipProvider delayDuration={300}>
          <AppInner />
        </TooltipProvider>
      </ReactFlowProvider>
    </AppErrorBoundary>
  );
}

export default App;
