/**
 * Tooltip Molecule - Accessible tooltip component
 *
 * Provides informational text that appears on hover/focus.
 * Follows ARIA tooltip pattern for accessibility.
 *
 * Features:
 * - Multiple positions (top, bottom, left, right)
 * - Configurable show/hide delays
 * - Keyboard accessibility (shows on focus, Escape dismisses)
 * - Screen reader accessible via aria-describedby
 * - Respects prefers-reduced-motion
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

import { Box, Text, VisuallyHidden } from '@openflow/primitives';
import { cn } from '@openflow/utils';
import { forwardRef, useCallback, useEffect, useId, useRef, useState } from 'react';

// ============================================================================
// Types
// ============================================================================

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';
export type TooltipBreakpoint = 'base' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

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
  /** Accessible label when content is not a string (for screen readers) */
  'aria-label'?: string;
  /** Maximum width of the tooltip (defaults to 'xs' = 20rem) */
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'none';
  /** Data attributes for testing */
  'data-testid'?: string;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Default delay before showing tooltip (ms)
 */
export const DEFAULT_DELAY_SHOW = 200;

/**
 * Default delay before hiding tooltip (ms)
 */
export const DEFAULT_DELAY_HIDE = 0;

/**
 * Position classes for tooltip placement
 */
export const TOOLTIP_POSITION_CLASSES: Record<TooltipPosition, string> = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
};

/**
 * Arrow classes for tooltip indicators
 */
export const TOOLTIP_ARROW_CLASSES: Record<TooltipPosition, string> = {
  top: 'top-full left-1/2 -translate-x-1/2 border-t-[rgb(var(--popover))] border-x-transparent border-b-transparent',
  bottom:
    'bottom-full left-1/2 -translate-x-1/2 border-b-[rgb(var(--popover))] border-x-transparent border-t-transparent',
  left: 'left-full top-1/2 -translate-y-1/2 border-l-[rgb(var(--popover))] border-y-transparent border-r-transparent',
  right:
    'right-full top-1/2 -translate-y-1/2 border-r-[rgb(var(--popover))] border-y-transparent border-l-transparent',
};

/**
 * Max width options for tooltip
 */
export type TooltipMaxWidth = 'xs' | 'sm' | 'md' | 'lg' | 'none';

/**
 * Max width classes for tooltip
 */
export const TOOLTIP_MAX_WIDTH_CLASSES: Record<TooltipMaxWidth, string> = {
  xs: 'max-w-xs',
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  none: '',
};

/**
 * Base classes for tooltip container
 */
export const TOOLTIP_CONTAINER_CLASSES = 'absolute z-50 pointer-events-none';

/**
 * Animation classes for tooltip (respects reduced motion)
 */
export const TOOLTIP_ANIMATION_CLASSES =
  'motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:duration-150';

/**
 * Base classes for tooltip content box
 */
export const TOOLTIP_CONTENT_CLASSES = [
  // Layout
  'relative px-3 py-1.5',
  // Typography
  'text-xs font-medium',
  // Appearance
  'rounded-md shadow-md',
  'bg-[rgb(var(--popover))] text-[rgb(var(--popover-foreground))]',
  'border border-[rgb(var(--border))]',
  // Text handling
  'whitespace-normal break-words',
].join(' ');

/**
 * Classes for tooltip arrow
 */
export const TOOLTIP_ARROW_BASE_CLASSES = 'absolute border-4';

/**
 * Base classes for trigger wrapper
 */
export const TOOLTIP_TRIGGER_CLASSES = 'relative inline-flex';

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get position classes for a tooltip position
 */
export function getPositionClasses(position: TooltipPosition): string {
  return TOOLTIP_POSITION_CLASSES[position];
}

/**
 * Get arrow classes for a tooltip position
 */
export function getArrowClasses(position: TooltipPosition): string {
  return TOOLTIP_ARROW_CLASSES[position];
}

/**
 * Get max width class for tooltip
 */
export function getMaxWidthClass(maxWidth: string): string {
  const validWidths: TooltipMaxWidth[] = ['xs', 'sm', 'md', 'lg', 'none'];
  if (validWidths.includes(maxWidth as TooltipMaxWidth)) {
    return TOOLTIP_MAX_WIDTH_CLASSES[maxWidth as TooltipMaxWidth];
  }
  return TOOLTIP_MAX_WIDTH_CLASSES.xs;
}

/**
 * Get the accessible description from content
 * Used when content is not a string and no aria-label is provided
 */
export function getAccessibleDescription(
  content: React.ReactNode,
  ariaLabel?: string
): string | undefined {
  if (ariaLabel) return ariaLabel;
  if (typeof content === 'string') return content;
  if (typeof content === 'number') return String(content);
  return undefined;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Tooltip component for displaying hints on hover/focus.
 *
 * Accessibility features:
 * - role="tooltip" on tooltip element
 * - aria-describedby linking trigger to tooltip
 * - Shows on focus (keyboard accessible)
 * - Escape key dismisses tooltip
 * - Screen reader announcement via VisuallyHidden
 * - Respects prefers-reduced-motion
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
export const Tooltip = forwardRef<HTMLDivElement, TooltipProps>(function Tooltip(
  {
    content,
    position = 'top',
    children,
    delayShow = DEFAULT_DELAY_SHOW,
    delayHide = DEFAULT_DELAY_HIDE,
    disabled = false,
    className,
    maxWidth = 'xs',
    'aria-label': ariaLabel,
    'data-testid': dataTestId,
  },
  ref
) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenShown, setHasBeenShown] = useState(false);
  const showTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const id = useId();
  const tooltipId = `${id}-tooltip`;

  // Clear all timeouts
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

  // Cleanup on unmount
  useEffect(() => {
    return () => clearTimeouts();
  }, [clearTimeouts]);

  const showTooltip = useCallback(() => {
    if (disabled) return;
    clearTimeouts();
    showTimeoutRef.current = setTimeout(() => {
      setIsVisible(true);
      setHasBeenShown(true);
    }, delayShow);
  }, [disabled, delayShow, clearTimeouts]);

  const hideTooltip = useCallback(() => {
    clearTimeouts();
    hideTimeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, delayHide);
  }, [delayHide, clearTimeouts]);

  // Handle keyboard events on the trigger
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Escape' && isVisible) {
        event.preventDefault();
        event.stopPropagation();
        setIsVisible(false);
      }
    },
    [isVisible]
  );

  // Get accessible description for screen readers
  const accessibleDescription = getAccessibleDescription(content, ariaLabel);

  // Don't render tooltip wrapper if disabled or no content
  if (disabled || !content) {
    return children;
  }

  return (
    <Box ref={ref} className={TOOLTIP_TRIGGER_CLASSES} data-testid={dataTestId}>
      {/* Trigger wrapper - handles hover/focus events */}
      <Box
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        onKeyDown={handleKeyDown}
        aria-describedby={isVisible ? tooltipId : undefined}
        data-state={isVisible ? 'open' : 'closed'}
        data-testid={dataTestId ? `${dataTestId}-trigger` : undefined}
      >
        {children}
      </Box>

      {/* Tooltip - visible when hovering or focused */}
      {isVisible && (
        <Box
          id={tooltipId}
          role="tooltip"
          aria-label={ariaLabel}
          className={cn(
            TOOLTIP_CONTAINER_CLASSES,
            TOOLTIP_ANIMATION_CLASSES,
            TOOLTIP_POSITION_CLASSES[position]
          )}
          data-testid={dataTestId ? `${dataTestId}-tooltip` : undefined}
          data-position={position}
        >
          <Box
            className={cn(TOOLTIP_CONTENT_CLASSES, TOOLTIP_MAX_WIDTH_CLASSES[maxWidth], className)}
          >
            {content}
            {/* Arrow indicator */}
            <Box
              className={cn(TOOLTIP_ARROW_BASE_CLASSES, TOOLTIP_ARROW_CLASSES[position])}
              aria-hidden={true}
            />
          </Box>
        </Box>
      )}

      {/* Screen reader announcement when tooltip first appears */}
      {isVisible && hasBeenShown && accessibleDescription && (
        <VisuallyHidden>
          <Text as="span" role="status" aria-live="polite">
            {accessibleDescription}
          </Text>
        </VisuallyHidden>
      )}
    </Box>
  );
});

Tooltip.displayName = 'Tooltip';
