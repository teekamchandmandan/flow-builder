import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ToolbarButtonProps {
  onClick: () => void;
  label: string;
  tooltip: string;
  icon: ReactNode;
  disabled?: boolean;
  variant?: 'ghost' | 'secondary';
  /** Button size preset — 'md' (default, h-8 w-8) or 'sm' (h-7 w-7). */
  size?: 'md' | 'sm';
}

const sizeClasses = {
  md: 'h-8 w-8',
  sm: 'h-7 w-7',
} as const;

/**
 * Reusable toolbar / panel icon button with tooltip.
 *
 * Extracts the repetitive Tooltip → Button pattern used across the
 * toolbar and JSON preview panel into a single compound component
 * (architecture-compound-components).
 */
export function ToolbarButton({
  onClick,
  label,
  tooltip,
  icon,
  disabled,
  variant = 'ghost',
  size = 'md',
}: ToolbarButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={variant}
          size='icon'
          className={sizeClasses[size]}
          onClick={onClick}
          disabled={disabled}
          aria-label={label}
        >
          {icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}
