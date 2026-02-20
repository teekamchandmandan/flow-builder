import { useCallback } from 'react';
import { Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ParameterEditorProps {
  parameters: Record<string, string>;
  onChange: (parameters: Record<string, string>) => void;
}

/**
 * Renders a list of key-value parameter rows with add/remove controls.
 * Derives entries from the parameters object during render
 * (rerender-derived-state-no-effect).
 */
export function ParameterEditor({
  parameters,
  onChange,
}: ParameterEditorProps) {
  const entries = Object.entries(parameters);

  const handleKeyChange = useCallback(
    (oldKey: string, newKey: string) => {
      const updated: Record<string, string> = {};
      for (const [k, v] of Object.entries(parameters)) {
        if (k === oldKey) {
          updated[newKey] = v;
        } else {
          updated[k] = v;
        }
      }
      onChange(updated);
    },
    [parameters, onChange],
  );

  const handleValueChange = useCallback(
    (key: string, newValue: string) => {
      onChange({ ...parameters, [key]: newValue });
    },
    [parameters, onChange],
  );

  const handleRemove = useCallback(
    (key: string) => {
      const { [key]: _removed, ...rest } = parameters;
      void _removed;
      onChange(rest);
    },
    [parameters, onChange],
  );

  const handleAdd = useCallback(() => {
    // Find a unique placeholder key
    let idx = 1;
    while (`key${idx}` in parameters) idx++;
    onChange({ ...parameters, [`key${idx}`]: '' });
  }, [parameters, onChange]);

  return (
    <div className='space-y-2'>
      <div className='flex items-center justify-between'>
        <span className='text-xs font-medium text-muted-foreground'>
          Parameters
        </span>
        <Button
          type='button'
          variant='ghost'
          size='sm'
          className='h-6 px-2 text-xs'
          onClick={handleAdd}
          aria-label='Add parameter'
        >
          <Plus className='mr-1 h-3 w-3' />
          Add
        </Button>
      </div>

      {entries.length === 0 ? (
        <p className='text-xs text-muted-foreground italic'>No parameters</p>
      ) : (
        <div className='space-y-1.5'>
          {entries.map(([key, value], index) => (
            <ParameterRow
              key={`${index}-${key}`}
              paramKey={key}
              paramValue={value}
              onKeyChange={handleKeyChange}
              onValueChange={handleValueChange}
              onRemove={handleRemove}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  ParameterRow — individual key/value pair                           */
/* ------------------------------------------------------------------ */

interface ParameterRowProps {
  paramKey: string;
  paramValue: string;
  onKeyChange: (oldKey: string, newKey: string) => void;
  onValueChange: (key: string, value: string) => void;
  onRemove: (key: string) => void;
}

function ParameterRow({
  paramKey,
  paramValue,
  onKeyChange,
  onValueChange,
  onRemove,
}: ParameterRowProps) {
  const keyError = paramKey.trim() === '';

  return (
    <div className='flex items-start gap-1.5'>
      <div className='flex-1 space-y-0.5'>
        <Input
          value={paramKey}
          onChange={(e) => onKeyChange(paramKey, e.target.value)}
          placeholder='Key'
          className={`h-7 text-xs ${keyError ? 'border-red-500' : ''}`}
          aria-label={`Parameter key ${paramKey || 'empty'}`}
        />
        {keyError && (
          <p className='text-[10px] text-red-500'>Parameter key is required</p>
        )}
      </div>
      <div className='flex-1'>
        <Input
          value={paramValue}
          onChange={(e) => onValueChange(paramKey, e.target.value)}
          placeholder='Value'
          className='h-7 text-xs'
          aria-label={`Parameter value for ${paramKey || 'empty key'}`}
        />
      </div>
      <Button
        type='button'
        variant='ghost'
        size='icon'
        className='h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive'
        onClick={() => onRemove(paramKey)}
        aria-label={`Remove parameter ${paramKey}`}
      >
        <Trash2 className='h-3 w-3' />
      </Button>
    </div>
  );
}
