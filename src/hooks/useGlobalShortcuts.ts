import { useEffect } from 'react';

import { useFlowStore } from '@/store/flowStore';
import { downloadJsonFile } from '@/lib/utils';

/** Tags where shortcuts should be suppressed (user is typing). */
const INPUT_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

/**
 * Registers global keyboard shortcuts for undo, redo, save, and escape.
 * Reads store at call time via `getState()` to avoid subscribing to
 * state changes (rerender-defer-reads).
 */
export function useGlobalShortcuts() {
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
