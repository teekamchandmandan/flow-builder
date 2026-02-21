interface ValidationSummaryProps {
  errorCount: number;
  warningCount: number;
}

/**
 * Compact one-line validation status indicator.
 * Shows "✓ Valid" when clean, or error/warning counts.
 */
export function ValidationSummary({
  errorCount,
  warningCount,
}: ValidationSummaryProps) {
  if (errorCount === 0 && warningCount === 0) {
    return <span className='text-green-600 dark:text-green-400'>✓ Valid</span>;
  }

  return (
    <span className='space-x-2'>
      {errorCount > 0 && (
        <span className='text-red-500'>
          ✕ {errorCount} error{errorCount !== 1 ? 's' : ''}
        </span>
      )}
      {warningCount > 0 && (
        <span className='text-amber-500'>
          ⚠ {warningCount} warning{warningCount !== 1 ? 's' : ''}
        </span>
      )}
    </span>
  );
}
