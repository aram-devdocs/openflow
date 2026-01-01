import {
  Box,
  Flex,
  Heading,
  type ResponsiveValue,
  Text,
  VisuallyHidden,
} from '@openflow/primitives';
import { cn } from '@openflow/utils';
import type { LucideIcon } from 'lucide-react';
import { forwardRef, useId } from 'react';
import { Button, type ButtonVariant } from '../atoms/Button';
import { Icon } from '../atoms/Icon';

export type EmptyStateSize = 'sm' | 'md' | 'lg';

export interface EmptyStateAction {
  /** Button label text */
  label: string;
  /** Click handler */
  onClick: () => void;
  /** Button variant - defaults to 'primary' for primary action, 'secondary' for secondary */
  variant?: ButtonVariant;
  /** Whether the button is in loading state */
  loading?: boolean;
  /** Accessible label for the button (defaults to label) */
  'aria-label'?: string;
}

export interface EmptyStateProps {
  /** Icon to display above the title */
  icon?: LucideIcon;
  /** Main heading text */
  title: string;
  /** Optional description text below the title */
  description?: string;
  /** Primary action button */
  action?: EmptyStateAction;
  /** Secondary action button */
  secondaryAction?: EmptyStateAction;
  /** Additional CSS classes */
  className?: string;
  /** Size variant - 'sm' for inline, 'md' for panels, 'lg' for full page - supports responsive values */
  size?: ResponsiveValue<EmptyStateSize>;
  /** Test ID for automated testing */
  'data-testid'?: string;
  /** Accessible label for screen readers (uses title by default) */
  'aria-label'?: string;
}

/**
 * Base classes for the EmptyState container
 */
export const EMPTY_STATE_BASE_CLASSES = 'flex flex-col items-center justify-center text-center';

/**
 * Size-specific styles for EmptyState
 */
export const SIZE_STYLES = {
  sm: {
    container: 'py-6 px-4',
    iconWrapper: 'mb-2 p-2',
    icon: 'h-5 w-5',
    headingSize: 'sm' as const,
    descriptionSize: 'xs' as const,
    actions: 'mt-3 gap-2',
    buttonSize: 'sm' as const,
  },
  md: {
    container: 'py-8 px-6',
    iconWrapper: 'mb-3 p-3',
    icon: 'h-6 w-6',
    headingSize: 'base' as const,
    descriptionSize: 'sm' as const,
    actions: 'mt-4 gap-3',
    buttonSize: 'md' as const,
  },
  lg: {
    container: 'py-12 px-6',
    iconWrapper: 'mb-4 p-4',
    icon: 'h-8 w-8',
    headingSize: 'lg' as const,
    descriptionSize: 'sm' as const,
    actions: 'mt-6 gap-3',
    buttonSize: 'md' as const,
  },
} as const;

/**
 * Breakpoint order for responsive class generation
 */
const BREAKPOINT_ORDER = ['base', 'sm', 'md', 'lg', 'xl', '2xl'] as const;
type Breakpoint = (typeof BREAKPOINT_ORDER)[number];

/**
 * Get the base size for non-responsive property access
 */
export function getBaseSize(size: ResponsiveValue<EmptyStateSize>): EmptyStateSize {
  if (typeof size === 'string') {
    return size;
  }
  if (typeof size === 'object' && size !== null) {
    return (size as Partial<Record<Breakpoint, EmptyStateSize>>).base ?? 'md';
  }
  return 'md';
}

/**
 * Generate responsive container classes for size prop
 */
export function getResponsiveSizeClasses(size: ResponsiveValue<EmptyStateSize>): string[] {
  const classes: string[] = [];

  if (typeof size === 'string') {
    // Split container classes into individual classes
    const containerClasses = SIZE_STYLES[size].container.split(' ');
    classes.push(...containerClasses);
  } else if (typeof size === 'object' && size !== null) {
    for (const breakpoint of BREAKPOINT_ORDER) {
      const breakpointValue = (size as Partial<Record<Breakpoint, EmptyStateSize>>)[breakpoint];
      if (breakpointValue !== undefined) {
        const containerClasses = SIZE_STYLES[breakpointValue].container.split(' ');
        for (const cls of containerClasses) {
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
 * EmptyState component for displaying placeholder content when there's no data.
 * Stateless - receives all data via props, emits actions via callbacks.
 *
 * Built on @openflow/primitives for accessibility and responsiveness:
 * - Uses Heading for proper semantic heading hierarchy
 * - Uses Text for accessible description content
 * - Uses VisuallyHidden for screen reader announcements
 * - Supports responsive sizing via ResponsiveValue
 *
 * Accessibility:
 * - `role="status"` indicates this is a status region
 * - `aria-label` provides accessible name for screen readers
 * - Proper heading hierarchy (h3 for contextual placement)
 * - Description linked via `aria-describedby`
 * - Screen reader announces empty state context
 *
 * @example
 * // Simple empty state
 * <EmptyState
 *   icon={Inbox}
 *   title="No messages"
 *   description="Your inbox is empty."
 * />
 *
 * @example
 * // With action buttons
 * <EmptyState
 *   icon={FolderPlus}
 *   title="No projects"
 *   description="Get started by creating your first project."
 *   action={{
 *     label: 'Create Project',
 *     onClick: () => openCreateDialog(),
 *   }}
 *   secondaryAction={{
 *     label: 'Learn More',
 *     onClick: () => openDocs(),
 *   }}
 * />
 *
 * @example
 * // Responsive sizing
 * <EmptyState
 *   size={{ base: 'sm', md: 'md', lg: 'lg' }}
 *   title="No results"
 *   description="Try a different search term."
 * />
 */
export const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(function EmptyState(
  {
    icon: IconComponent,
    title,
    description,
    action,
    secondaryAction,
    className,
    size = 'md',
    'data-testid': testId,
    'aria-label': ariaLabel,
  },
  ref
) {
  const baseSize = getBaseSize(size);
  const styles = SIZE_STYLES[baseSize];
  const responsiveClasses = getResponsiveSizeClasses(size);
  const descriptionId = useId();

  return (
    <Box
      ref={ref}
      className={cn(EMPTY_STATE_BASE_CLASSES, ...responsiveClasses, className)}
      role="status"
      aria-label={ariaLabel ?? title}
      aria-describedby={description ? descriptionId : undefined}
      data-testid={testId}
      data-size={baseSize}
    >
      {/* Screen reader context announcement */}
      <VisuallyHidden>
        <Text as="span" aria-live="polite">
          Empty state: {title}
        </Text>
      </VisuallyHidden>

      {IconComponent && (
        <Box className={cn('rounded-full bg-[rgb(var(--muted))]', styles.iconWrapper)}>
          <Icon
            icon={IconComponent}
            className={cn('text-[rgb(var(--muted-foreground))]', styles.icon)}
            aria-hidden="true"
          />
        </Box>
      )}

      <Heading
        level={3}
        size={styles.headingSize}
        weight="medium"
        color="foreground"
        className="text-center"
      >
        {title}
      </Heading>

      {description && (
        <Text
          id={descriptionId}
          as="p"
          size={styles.descriptionSize}
          color="muted-foreground"
          className="mt-1 max-w-sm text-center"
        >
          {description}
        </Text>
      )}

      {(action || secondaryAction) && (
        <Flex align="center" gap={baseSize === 'sm' ? '2' : '3'} className={styles.actions}>
          {action && (
            <Button
              variant={action.variant ?? 'primary'}
              size={styles.buttonSize}
              onClick={action.onClick}
              loading={action.loading}
              aria-label={action['aria-label']}
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant={secondaryAction.variant ?? 'secondary'}
              size={styles.buttonSize}
              onClick={secondaryAction.onClick}
              loading={secondaryAction.loading}
              aria-label={secondaryAction['aria-label']}
            >
              {secondaryAction.label}
            </Button>
          )}
        </Flex>
      )}
    </Box>
  );
});

EmptyState.displayName = 'EmptyState';
