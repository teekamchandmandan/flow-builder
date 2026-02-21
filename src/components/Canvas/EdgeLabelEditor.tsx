import { useCallback, useRef, useState } from 'react';

interface EdgeLabelEditorProps {
  condition: string;
  onCommit: (value: string) => void;
}

/**
 * Inline-editable edge condition label.
 *
 * Toggles between a clickable pill (read mode) and a text input
 * (edit mode). Extracted from CustomEdge to keep the SVG rendering
 * logic separate from interaction state (architecture-compound-components).
 */
export function EdgeLabelEditor({ condition, onCommit }: EdgeLabelEditorProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(condition);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = useCallback(() => {
    setDraft(condition);
    setEditing(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [condition]);

  const commitEdit = useCallback(() => {
    setEditing(false);
    if (draft.trim() !== condition) {
      onCommit(draft.trim() || condition);
    }
  }, [draft, condition, onCommit]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') commitEdit();
      if (e.key === 'Escape') {
        setDraft(condition);
        setEditing(false);
      }
    },
    [commitEdit, condition],
  );

  const truncated =
    condition.length > 24 ? `${condition.slice(0, 24)}…` : condition;

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commitEdit}
        onKeyDown={onKeyDown}
        className='rounded border border-input bg-background px-2 py-0.5 text-xs text-foreground outline-none ring-1 ring-ring w-32'
        aria-label='Edit edge condition'
      />
    );
  }

  return (
    <button
      type='button'
      onClick={handleClick}
      className='cursor-pointer rounded-full border border-border bg-background px-2 py-0.5 text-[11px] text-muted-foreground shadow-sm transition-colors hover:bg-muted'
      aria-label={`Edge condition: ${condition}`}
    >
      {truncated || 'Add condition'}
    </button>
  );
}
