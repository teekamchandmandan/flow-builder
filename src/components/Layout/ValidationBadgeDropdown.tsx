import { useCallback, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ValidationPanel } from '@/components/Layout/ValidationPanel';

interface ValidationBadgeDropdownProps {
  errorCount: number;
  warningCount: number;
}

/**
 * Validation status badge with a dropdown that shows the full
 * ValidationPanel when clicked.
 */
export function ValidationBadgeDropdown({
  errorCount,
  warningCount,
}: ValidationBadgeDropdownProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const totalIssues = errorCount + warningCount;

  const handleBlur = useCallback((e: React.FocusEvent) => {
    if (
      wrapperRef.current &&
      !wrapperRef.current.contains(e.relatedTarget as Node)
    ) {
      setOpen(false);
    }
  }, []);

  const icon =
    errorCount > 0 ? (
      <XCircle className='h-4 w-4' />
    ) : warningCount > 0 ? (
      <AlertTriangle className='h-4 w-4' />
    ) : (
      <CheckCircle className='h-4 w-4' />
    );

  const colorClass =
    errorCount > 0
      ? 'text-red-500'
      : warningCount > 0
        ? 'text-amber-500'
        : 'text-green-500';

  const label =
    errorCount > 0
      ? `${errorCount} error${errorCount !== 1 ? 's' : ''}${warningCount > 0 ? `, ${warningCount} warning${warningCount !== 1 ? 's' : ''}` : ''}`
      : warningCount > 0
        ? `${warningCount} warning${warningCount !== 1 ? 's' : ''}`
        : 'No validation issues';

  const badgeText = totalIssues > 0 ? String(totalIssues) : 'Valid';

  return (
    <div className='relative' ref={wrapperRef} onBlur={handleBlur}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant='ghost'
            size='sm'
            className={`h-8 gap-1 px-2 ${colorClass}`}
            aria-label={label}
            aria-expanded={open}
            onClick={() => setOpen((prev) => !prev)}
          >
            {icon}
            <span className='text-xs'>{badgeText}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>

      {open && totalIssues > 0 && (
        <div className='absolute right-0 top-full z-50 mt-1 w-80 rounded-md border border-border bg-popover shadow-md'>
          <ValidationPanel />
        </div>
      )}
    </div>
  );
}
