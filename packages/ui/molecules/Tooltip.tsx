import { cn } from '@openflow/utils';
import { useCallback, useId, useRef, useState } from 'react';

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

export interface TooltipProps {
  /** Content to display in the tooltip */
  content: React.ReactNode;
  /** Position of the tooltip relative to the trigger */
  position?: TooltipPosition;
  /** Element that triggers the tooltip on hover */
  children: React.ReactElement;
  /** Delay before showing tooltip (ms) */
  delayShow?: number;
  /** Delay before hiding tooltip (ms) */
  delayHide?: number;
  /** Whether the tooltip is disabled */
  disabled?: boolean;
  /** Additional class name for the tooltip content */
  className?: string;
  /** Accessible label when content is not a string */
  'aria-label'?: string;
}

const positionClasses: Record<TooltipPosition, string> = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
};

const arrowClasses: Record<TooltipPosition, string> = {
  top: 'top-full left-1/2 -translate-x-1/2 border-t-[rgb(var(--popover))] border-x-transparent border-b-transparent',
  bottom:
    'bottom-full left-1/2 -translate-x-1/2 border-b-[rgb(var(--popover))] border-x-transparent border-t-transparent',
  left: 'left-full top-1/2 -translate-y-1/2 border-l-[rgb(var(--popover))] border-y-transparent border-r-transparent',
  right:
    'right-full top-1/2 -translate-y-1/2 border-r-[rgb(var(--popover))] border-y-transparent border-l-transparent',
};

/**
 * Tooltip component for displaying hints on hover.
 * Stateless - receives all data via props, emits actions via callbacks.
 *
 * Features:
 * - Multiple positions (top, bottom, left, right)
 * - Configurable show/hide delays
 * - Keyboard accessibility (shows on focus)
 * - Arrow indicator pointing to trigger
 *
 * @example
 * <Tooltip content="This is helpful info">
 *   <Button>Hover me</Button>
 * </Tooltip>
 *
 * @example
 * <Tooltip content="Save changes" position="right" delayShow={500}>
 *   <IconButton icon={Save} />
 * </Tooltip>
 */
export function Tooltip({
  content,
  position = 'top',
  children,
  delayShow = 200,
  delayHide = 0,
  disabled = false,
  className,
  'aria-label': ariaLabel,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const showTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const id = useId();
  const tooltipId = `${id}-tooltip`;

  const clearTimeouts = useCallback(() => {
    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current);
      showTimeoutRef.current = null;
    }
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, []);

  const showTooltip = useCallback(() => {
    if (disabled) return;
    clearTimeouts();
    showTimeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delayShow);
  }, [disabled, delayShow, clearTimeouts]);

  const hideTooltip = useCallback(() => {
    clearTimeouts();
    hideTimeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, delayHide);
  }, [delayHide, clearTimeouts]);

  // Handle keyboard events on the trigger
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape' && isVisible) {
      event.preventDefault();
      setIsVisible(false);
    }
  };

  // Don't render tooltip if disabled or no content
  if (disabled || !content) {
    return children;
  }

  return (
    <div className="relative inline-flex">
      {/* Trigger wrapper */}
      <div
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        onKeyDown={handleKeyDown}
        aria-describedby={isVisible ? tooltipId : undefined}
      >
        {children}
      </div>

      {/* Tooltip */}
      {isVisible && (
        <div
          id={tooltipId}
          role="tooltip"
          aria-label={ariaLabel}
          className={cn(
            'absolute z-50 pointer-events-none',
            // Animation - respects reduced motion
            'motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:duration-150',
            positionClasses[position]
          )}
        >
          <div
            className={cn(
              'relative px-3 py-1.5 text-xs font-medium',
              'rounded-md shadow-md',
              'bg-[rgb(var(--popover))] text-[rgb(var(--popover-foreground))]',
              'border border-[rgb(var(--border))]',
              'max-w-xs whitespace-normal break-words',
              className
            )}
          >
            {content}
            {/* Arrow */}
            <div className={cn('absolute border-4', arrowClasses[position])} />
          </div>
        </div>
      )}
    </div>
  );
}

Tooltip.displayName = 'Tooltip';
