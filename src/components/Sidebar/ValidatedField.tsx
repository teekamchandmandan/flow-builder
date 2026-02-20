import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface ValidatedFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  error?: string | false;
  placeholder?: string;
  multiline?: boolean;
  className?: string;
}

/**
 * Reusable form field with label, validation error display, and
 * support for both Input and Textarea rendering.
 */
export function ValidatedField({
  id,
  label,
  value,
  onChange,
  onBlur,
  error,
  placeholder,
  multiline = false,
  className,
}: ValidatedFieldProps) {
  const errorClass = error ? 'border-red-500' : '';
  const Component = multiline ? Textarea : Input;

  return (
    <div className='space-y-1.5'>
      <label htmlFor={id} className='text-sm font-medium'>
        {label}
      </label>
      <Component
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        className={`text-sm ${errorClass} ${className ?? ''}`}
      />
      {error && <p className='text-xs text-red-500'>{error}</p>}
    </div>
  );
}
