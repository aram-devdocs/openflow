import type { TaskStatus } from '@openflow/generated';
import {
  Box,
  type ResponsiveValue,
  Text,
  type TextSize,
  VisuallyHidden,
} from '@openflow/primitives';
import { cn } from '@openflow/utils';
import { type ReactNode, forwardRef } from 'react';

export type BadgeVariant =
  | 'default'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'todo'
  | 'inprogress'
  | 'inreview'
  | 'done'
  | 'cancelled';

export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps {
  /** Visual style variant */
  variant?: BadgeVariant;
  /** Size of the badge - supports responsive values */
  size?: ResponsiveValue<BadgeSize>;
  /** Badge content */
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Whether this badge represents a status (adds sr-only "Status:" prefix) */
  isStatus?: boolean;
  /** Optional status icon to convey meaning beyond color */
  icon?: ReactNode;
  /** Custom aria-label for the badge (overrides default behavior) */
  'aria-label'?: string;
  /** Data attributes for testing */
  'data-testid'?: string;
}

/**
 * Variant to Tailwind background/text color classes mapping.
 * These colors are designed to meet WCAG 2.1 AA contrast requirements (≥4.5:1).
 * Background uses 20% opacity to maintain readability while text uses full color.
 */
const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-muted text-muted-foreground',
  success: 'bg-success/20 text-success',
  warning: 'bg-warning/20 text-warning',
  error: 'bg-error/20 text-error',
  info: 'bg-info/20 text-info',
  // Task status variants using semantic status colors
  todo: 'bg-status-todo/20 text-status-todo',
  inprogress: 'bg-status-inprogress/20 text-status-inprogress',
  inreview: 'bg-status-inreview/20 text-status-inreview',
  done: 'bg-status-done/20 text-status-done',
  cancelled: 'bg-status-cancelled/20 text-status-cancelled',
};

/**
 * Size to Tailwind spacing and font size mapping.
 * Provides consistent sizing across all badge variants.
 */
const sizeClasses: Record<BadgeSize, string> = {
  sm: 'px-1.5 py-0.5 text-xs gap-1',
  md: 'px-2 py-0.5 text-xs gap-1.5',
  lg: 'px-2.5 py-1 text-sm gap-1.5',
};

/**
 * Size to text size mapping for responsive sizing
 */
const sizeToTextSize: Record<BadgeSize, TextSize> = {
  sm: 'xs',
  md: 'xs',
  lg: 'sm',
};

/**
 * Breakpoint order for responsive class generation
 */
const BREAKPOINT_ORDER = ['base', 'sm', 'md', 'lg', 'xl', '2xl'] as const;
type Breakpoint = (typeof BREAKPOINT_ORDER)[number];

/**
 * Generate responsive classes for size prop
 */
function getResponsiveSizeClasses(size: ResponsiveValue<BadgeSize>): string[] {
  const classes: string[] = [];

  if (typeof size === 'string') {
    classes.push(sizeClasses[size]);
  } else if (typeof size === 'object' && size !== null) {
    for (const breakpoint of BREAKPOINT_ORDER) {
      const breakpointValue = (size as Partial<Record<Breakpoint, BadgeSize>>)[breakpoint];
      if (breakpointValue !== undefined) {
        const sizeClass = sizeClasses[breakpointValue];
        // Parse individual classes and add breakpoint prefix
        const individualClasses = sizeClass.split(' ');
        for (const cls of individualClasses) {
          if (breakpoint === 'base') {
            classes.push(cls);
          } else {
            classes.push(`${breakpoint}:${cls}`);
          }
        }
      }
    }
  }

  return classes;
}

/**
 * Get responsive text size from badge size
 */
function getResponsiveTextSize(size: ResponsiveValue<BadgeSize>): ResponsiveValue<TextSize> {
  if (typeof size === 'string') {
    return sizeToTextSize[size];
  }

  if (typeof size === 'object' && size !== null) {
    const textSize: Partial<Record<Breakpoint, TextSize>> = {};
    for (const breakpoint of BREAKPOINT_ORDER) {
      const breakpointValue = (size as Partial<Record<Breakpoint, BadgeSize>>)[breakpoint];
      if (breakpointValue !== undefined) {
        textSize[breakpoint] = sizeToTextSize[breakpointValue];
      }
    }
    return textSize;
  }

  return 'xs';
}

/**
 * Map TaskStatus enum values to badge variants.
 * Useful for rendering badges based on task status.
 */
export function taskStatusToVariant(status: TaskStatus): BadgeVariant {
  const statusMap: Record<TaskStatus, BadgeVariant> = {
    todo: 'todo',
    inprogress: 'inprogress',
    inreview: 'inreview',
    done: 'done',
    cancelled: 'cancelled',
  };
  return statusMap[status] ?? 'default';
}

/**
 * Map TaskStatus enum values to display labels.
 */
export function taskStatusToLabel(status: TaskStatus): string {
  const labelMap: Record<TaskStatus, string> = {
    todo: 'To Do',
    inprogress: 'In Progress',
    inreview: 'In Review',
    done: 'Done',
    cancelled: 'Cancelled',
  };
  return labelMap[status] ?? status;
}

/**
 * Badge component for displaying status and labels.
 *
 * Built on @openflow/primitives for accessibility and responsiveness:
 * - Uses Text primitive for proper typography
 * - Uses VisuallyHidden for screen reader announcements
 * - Supports responsive sizing via ResponsiveValue
 * - Optional icon prop to convey meaning beyond color (WCAG 1.4.1)
 * - Not interactive (no button/link semantics) - purely informational
 *
 * Accessibility:
 * - When `isStatus` is true, adds "Status: " prefix for screen readers
 * - Icon + text pattern ensures color is not sole means of conveying information
 * - Text contrast meets WCAG 2.1 AA requirements (≥4.5:1)
 *
 * @example
 * // Basic usage
 * <Badge variant="success">Completed</Badge>
 *
 * @example
 * // With status semantics
 * <Badge variant="inprogress" isStatus>In Progress</Badge>
 *
 * @example
 * // With icon for color-blind accessibility
 * <Badge variant="error" icon={<AlertIcon />}>Failed</Badge>
 *
 * @example
 * // Responsive sizing
 * <Badge size={{ base: 'sm', md: 'md', lg: 'lg' }}>Responsive</Badge>
 *
 * @example
 * // With task status helpers
 * <Badge variant={taskStatusToVariant(task.status)} isStatus>
 *   {taskStatusToLabel(task.status)}
 * </Badge>
 */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  {
    variant = 'default',
    size = 'md',
    className,
    children,
    isStatus = false,
    icon,
    'aria-label': ariaLabel,
    'data-testid': dataTestId,
  },
  ref
) {
  const responsiveSizeClasses = getResponsiveSizeClasses(size);
  const textSize = getResponsiveTextSize(size);

  return (
    <Text
      ref={ref}
      as="span"
      size={textSize}
      weight="medium"
      data-testid={dataTestId}
      aria-label={ariaLabel}
      className={cn(
        // Base styles
        'inline-flex items-center justify-center rounded',
        'whitespace-nowrap',
        // Variant colors
        variantClasses[variant],
        // Responsive sizing
        ...responsiveSizeClasses,
        className
      )}
    >
      {/* Screen reader announcement for status badges */}
      {isStatus && <VisuallyHidden>Status: </VisuallyHidden>}

      {/* Optional icon for conveying meaning beyond color */}
      {icon && (
        <Box as="span" className="shrink-0" aria-hidden={true}>
          {icon}
        </Box>
      )}

      {children}
    </Text>
  );
});

Badge.displayName = 'Badge';
