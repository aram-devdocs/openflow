import type { Task, TaskStatus } from '@openflow/generated';
import { type ResponsiveValue, Text, VisuallyHidden } from '@openflow/primitives';
import { cn } from '@openflow/utils';
import { AlertCircle, MoreVertical } from 'lucide-react';
import { type HTMLAttributes, forwardRef } from 'react';
import { Badge, taskStatusToLabel, taskStatusToVariant } from '../atoms/Badge';
import { Icon } from '../atoms/Icon';
import { Card, CardContent } from '../molecules/Card';
import { Dropdown, type DropdownOption } from '../molecules/Dropdown';

// ============================================================================
// Types
// ============================================================================

export type TaskCardSize = 'sm' | 'md' | 'lg';

export type TaskCardBreakpoint = 'base' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface TaskCardProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'onSelect' | 'onContextMenu'> {
  /** Task data to display */
  task: Task;
  /** Whether the card is in a selected state */
  isSelected?: boolean;
  /** Callback when the card is clicked/selected */
  onSelect?: (id: string) => void;
  /** Callback when the task status is changed */
  onStatusChange?: (id: string, status: TaskStatus) => void;
  /** Callback when more options button is clicked (for context menu) */
  onMoreClick?: (id: string, event: React.MouseEvent) => void;
  /** Callback when context menu is triggered (right-click) */
  onContextMenu?: (id: string, event: React.MouseEvent) => void;
  /** Responsive size - affects padding and typography */
  size?: ResponsiveValue<TaskCardSize>;
  /** Accessible label for the card (defaults to task title) */
  'aria-label'?: string;
  /** Data attributes for testing */
  'data-testid'?: string;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Breakpoint order for responsive class generation
 */
const BREAKPOINT_ORDER = ['base', 'sm', 'md', 'lg', 'xl', '2xl'] as const;

/**
 * Default label for task options button
 */
export const DEFAULT_MORE_OPTIONS_LABEL = 'Task options';

/**
 * Default label for selected state screen reader announcement
 */
export const DEFAULT_SELECTED_LABEL = 'Selected';

/**
 * Default label for actions required screen reader announcement
 */
export const DEFAULT_ACTIONS_REQUIRED_LABEL = 'Actions required';

/**
 * Default label for single action required
 */
export const DEFAULT_SINGLE_ACTION_LABEL = 'action required';

/**
 * Default label for multiple actions required
 */
export const DEFAULT_MULTIPLE_ACTIONS_LABEL = 'actions required';

/**
 * Default label for status dropdown
 */
export const DEFAULT_STATUS_DROPDOWN_LABEL = 'Change task status';

/**
 * Screen reader announcement for status change
 */
export const SR_STATUS_CHANGED = 'Task status changed to';

/**
 * Screen reader announcement for actions badge
 */
export const SR_ACTIONS_COUNT = 'action';

/**
 * Status options for the dropdown
 */
export const STATUS_OPTIONS: DropdownOption[] = [
  { value: 'todo', label: 'To Do' },
  { value: 'inprogress', label: 'In Progress' },
  { value: 'inreview', label: 'In Review' },
  { value: 'done', label: 'Done' },
  { value: 'cancelled', label: 'Cancelled' },
];

/**
 * Size classes for TaskCard - padding via CardContent
 */
export const TASK_CARD_PADDING_CLASSES: Record<TaskCardSize, string> = {
  sm: 'p-2',
  md: 'p-3',
  lg: 'p-4',
};

/**
 * Title text size classes
 */
export const TASK_CARD_TITLE_SIZE_CLASSES: Record<TaskCardSize, string> = {
  sm: 'text-sm',
  md: 'text-sm',
  lg: 'text-base',
};

/**
 * Description text size classes
 */
export const TASK_CARD_DESCRIPTION_SIZE_CLASSES: Record<TaskCardSize, string> = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-sm',
};

/**
 * Footer margin classes
 */
export const TASK_CARD_FOOTER_MARGIN_CLASSES: Record<TaskCardSize, string> = {
  sm: 'mt-2',
  md: 'mt-3',
  lg: 'mt-4',
};

/**
 * Description margin classes
 */
export const TASK_CARD_DESCRIPTION_MARGIN_CLASSES: Record<TaskCardSize, string> = {
  sm: 'mt-1',
  md: 'mt-1.5',
  lg: 'mt-2',
};

/**
 * Badge size mapping
 */
export const TASK_CARD_BADGE_SIZE_MAP: Record<TaskCardSize, 'sm' | 'md' | 'lg'> = {
  sm: 'sm',
  md: 'sm',
  lg: 'md',
};

/**
 * Icon size mapping
 */
export const TASK_CARD_ICON_SIZE_MAP: Record<TaskCardSize, 'xs' | 'sm' | 'md' | 'lg' | 'xl'> = {
  sm: 'xs',
  md: 'xs',
  lg: 'sm',
};

/**
 * Base classes for the title element
 */
export const TASK_CARD_TITLE_BASE_CLASSES = 'flex-1 font-medium leading-tight line-clamp-2';

/**
 * Classes for cancelled task title (strikethrough and muted)
 */
export const TASK_CARD_TITLE_CANCELLED_CLASSES = 'text-[rgb(var(--muted-foreground))] line-through';

/**
 * Base classes for the description element
 */
export const TASK_CARD_DESCRIPTION_BASE_CLASSES =
  'text-[rgb(var(--muted-foreground))] line-clamp-2';

/**
 * Classes for the header container
 */
export const TASK_CARD_HEADER_CLASSES = 'flex items-start justify-between gap-2';

/**
 * Classes for the footer container
 */
export const TASK_CARD_FOOTER_CLASSES = 'flex items-center justify-between';

/**
 * Classes for the more button - with touch target ≥44px on mobile
 */
export const TASK_CARD_MORE_BUTTON_CLASSES = [
  'rounded p-1',
  'text-[rgb(var(--muted-foreground))]',
  // Touch target ≥44px on mobile (WCAG 2.5.5)
  'min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0',
  'opacity-0 transition-opacity group-hover:opacity-100',
  'hover:bg-[rgb(var(--accent))] hover:text-[rgb(var(--accent-foreground))]',
  // Focus ring with offset for visibility on all backgrounds
  'focus-visible:opacity-100 focus-visible:outline-none',
  'focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))]',
  'focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--background))]',
  // Motion-safe transitions
  'motion-safe:transition-opacity',
].join(' ');

/**
 * Classes for the status dropdown wrapper
 */
export const TASK_CARD_STATUS_DROPDOWN_CLASSES = 'shrink-0';

/**
 * Classes for the status dropdown trigger override
 */
export const TASK_CARD_STATUS_DROPDOWN_TRIGGER_CLASSES =
  'h-auto min-w-0 border-0 px-2 py-0.5 text-xs bg-transparent hover:bg-transparent';

/**
 * Classes for the actions badge container
 */
export const TASK_CARD_ACTIONS_BADGE_CLASSES = 'flex items-center';

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get the base size value from a responsive size prop
 */
export function getBaseSize(size: ResponsiveValue<TaskCardSize>): TaskCardSize {
  if (typeof size === 'string') {
    return size;
  }
  if (typeof size === 'object' && size !== null) {
    // Return the 'base' value or the first defined breakpoint value
    const responsiveSize = size as Partial<Record<TaskCardBreakpoint, TaskCardSize>>;
    if (responsiveSize.base) return responsiveSize.base;
    for (const bp of BREAKPOINT_ORDER) {
      if (responsiveSize[bp]) return responsiveSize[bp] as TaskCardSize;
    }
  }
  return 'md';
}

/**
 * Generate responsive classes from a size-to-class mapping
 */
export function getResponsiveSizeClasses(
  size: ResponsiveValue<TaskCardSize>,
  classMap: Record<TaskCardSize, string>
): string[] {
  const classes: string[] = [];

  if (typeof size === 'string') {
    classes.push(classMap[size]);
  } else if (typeof size === 'object' && size !== null) {
    const responsiveSize = size as Partial<Record<TaskCardBreakpoint, TaskCardSize>>;
    for (const breakpoint of BREAKPOINT_ORDER) {
      const breakpointValue = responsiveSize[breakpoint];
      if (breakpointValue !== undefined) {
        const sizeClass = classMap[breakpointValue];
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
 * Build accessible label for task card
 */
export function buildAccessibleLabel(
  task: Task,
  isSelected: boolean,
  customLabel?: string
): string {
  if (customLabel) return customLabel;

  const parts: string[] = [];

  // Task title
  parts.push(task.title);

  // Status
  parts.push(`Status: ${taskStatusToLabel(task.status)}`);

  // Actions required
  if (task.actionsRequiredCount > 0) {
    const actionWord =
      task.actionsRequiredCount === 1
        ? DEFAULT_SINGLE_ACTION_LABEL
        : DEFAULT_MULTIPLE_ACTIONS_LABEL;
    parts.push(`${task.actionsRequiredCount} ${actionWord}`);
  }

  // Selected state
  if (isSelected) {
    parts.push(DEFAULT_SELECTED_LABEL);
  }

  return parts.join('. ');
}

/**
 * Build screen reader announcement for actions count
 */
export function buildActionsAnnouncement(count: number): string {
  if (count === 0) return '';
  const actionWord = count === 1 ? 'action' : 'actions';
  return `${count} ${actionWord} required`;
}

/**
 * Build screen reader announcement for status change
 */
export function buildStatusChangeAnnouncement(status: TaskStatus): string {
  return `${SR_STATUS_CHANGED} ${taskStatusToLabel(status)}`;
}

// ============================================================================
// Component
// ============================================================================

/**
 * TaskCard component for displaying task information.
 *
 * Built on @openflow/primitives for accessibility and responsiveness:
 * - Uses Text primitive for proper typography
 * - Uses VisuallyHidden for screen reader announcements
 * - Supports responsive sizing via ResponsiveValue
 * - Status conveyed beyond color (icon + text in badge)
 * - Proper heading hierarchy (h3 for task title)
 * - Touch targets ≥44px on mobile (WCAG 2.5.5)
 * - Focus rings with offset for visibility on all backgrounds
 *
 * Accessibility:
 * - Card is focusable and keyboard-activatable when clickable
 * - Screen reader announces task title, status, actions required
 * - Status dropdown has proper aria-label
 * - More options button has aria-label
 * - Selected state announced via VisuallyHidden
 *
 * @example
 * <TaskCard
 *   task={task}
 *   isSelected={selectedTaskId === task.id}
 *   onSelect={(id) => setSelectedTaskId(id)}
 *   onStatusChange={(id, status) => updateTaskStatus(id, status)}
 * />
 *
 * @example
 * // Responsive sizing
 * <TaskCard
 *   task={task}
 *   size={{ base: 'sm', md: 'md', lg: 'lg' }}
 * />
 */
export const TaskCard = forwardRef<HTMLDivElement, TaskCardProps>(
  (
    {
      task,
      isSelected = false,
      onSelect,
      onStatusChange,
      onMoreClick,
      onContextMenu,
      size = 'md',
      className,
      'aria-label': ariaLabel,
      'data-testid': testId,
      ...props
    },
    ref
  ) => {
    const baseSize = getBaseSize(size);

    const handleClick = () => {
      onSelect?.(task.id);
    };

    const handleStatusChange = (value: string) => {
      onStatusChange?.(task.id, value as TaskStatus);
    };

    const handleStatusClick = (e: React.MouseEvent) => {
      // Prevent card selection when clicking on status dropdown
      e.stopPropagation();
    };

    const handleStatusKeyDown = (e: React.KeyboardEvent) => {
      // Prevent card activation when using dropdown with keyboard
      if (e.key === 'Enter' || e.key === ' ') {
        e.stopPropagation();
      }
    };

    const handleContextMenu = (e: React.MouseEvent) => {
      if (onContextMenu) {
        e.preventDefault();
        e.stopPropagation();
        onContextMenu(task.id, e);
      }
    };

    const handleMoreClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      onMoreClick?.(task.id, e);
    };

    const hasActionsRequired = task.actionsRequiredCount > 0;
    const accessibleLabel = buildAccessibleLabel(task, isSelected, ariaLabel);

    // Generate responsive classes
    const paddingClasses = getResponsiveSizeClasses(size, TASK_CARD_PADDING_CLASSES);
    const titleSizeClasses = getResponsiveSizeClasses(size, TASK_CARD_TITLE_SIZE_CLASSES);
    const descriptionSizeClasses = getResponsiveSizeClasses(
      size,
      TASK_CARD_DESCRIPTION_SIZE_CLASSES
    );
    const descriptionMarginClasses = getResponsiveSizeClasses(
      size,
      TASK_CARD_DESCRIPTION_MARGIN_CLASSES
    );
    const footerMarginClasses = getResponsiveSizeClasses(size, TASK_CARD_FOOTER_MARGIN_CLASSES);
    const badgeSize = TASK_CARD_BADGE_SIZE_MAP[baseSize];
    const iconSize = TASK_CARD_ICON_SIZE_MAP[baseSize];

    return (
      <Card
        ref={ref}
        isSelected={isSelected}
        isClickable={Boolean(onSelect)}
        onClick={onSelect ? handleClick : undefined}
        onContextMenu={handleContextMenu}
        className={cn('group', className)}
        aria-label={accessibleLabel}
        data-testid={testId}
        data-task-id={task.id}
        data-status={task.status}
        data-selected={isSelected}
        data-size={baseSize}
        {...props}
      >
        <CardContent className={cn(paddingClasses)}>
          {/* Screen reader announcement for selected state */}
          {isSelected && (
            <VisuallyHidden>
              <span role="status" aria-live="polite">
                {DEFAULT_SELECTED_LABEL}
              </span>
            </VisuallyHidden>
          )}

          {/* Header: Title and Status */}
          <div className={TASK_CARD_HEADER_CLASSES}>
            <Text
              as="span"
              className={cn(
                TASK_CARD_TITLE_BASE_CLASSES,
                titleSizeClasses,
                task.status === 'cancelled' && TASK_CARD_TITLE_CANCELLED_CLASSES
              )}
              aria-label={`Task: ${task.title}`}
            >
              {task.title}
            </Text>

            {/* Status dropdown or badge */}
            <div
              onClick={handleStatusClick}
              onKeyDown={handleStatusKeyDown}
              className={TASK_CARD_STATUS_DROPDOWN_CLASSES}
              role="presentation"
            >
              {onStatusChange ? (
                <Dropdown
                  options={STATUS_OPTIONS}
                  value={task.status}
                  onChange={handleStatusChange}
                  aria-label={DEFAULT_STATUS_DROPDOWN_LABEL}
                  className={TASK_CARD_STATUS_DROPDOWN_TRIGGER_CLASSES}
                  data-testid={testId ? `${testId}-status-dropdown` : undefined}
                />
              ) : (
                <Badge
                  variant={taskStatusToVariant(task.status)}
                  size={badgeSize}
                  isStatus
                  data-testid={testId ? `${testId}-status-badge` : undefined}
                >
                  {taskStatusToLabel(task.status)}
                </Badge>
              )}
            </div>
          </div>

          {/* Description preview */}
          {task.description && (
            <Text
              as="p"
              className={cn(
                TASK_CARD_DESCRIPTION_BASE_CLASSES,
                descriptionSizeClasses,
                descriptionMarginClasses
              )}
              data-testid={testId ? `${testId}-description` : undefined}
            >
              {task.description}
            </Text>
          )}

          {/* Footer: Metadata and indicators */}
          <div className={cn(TASK_CARD_FOOTER_CLASSES, footerMarginClasses)}>
            {/* Actions required badge */}
            {hasActionsRequired ? (
              <Badge
                variant="warning"
                size={badgeSize}
                icon={<Icon icon={AlertCircle} size={iconSize} aria-hidden="true" />}
                aria-label={buildActionsAnnouncement(task.actionsRequiredCount)}
                data-testid={testId ? `${testId}-actions-badge` : undefined}
              >
                <span aria-hidden="true">
                  {task.actionsRequiredCount}{' '}
                  {task.actionsRequiredCount === 1 ? 'action' : 'actions'} required
                </span>
              </Badge>
            ) : (
              <span aria-hidden="true" />
            )}

            {/* Context menu button - visible on hover */}
            <button
              type="button"
              className={TASK_CARD_MORE_BUTTON_CLASSES}
              onClick={handleMoreClick}
              aria-label={DEFAULT_MORE_OPTIONS_LABEL}
              data-testid={testId ? `${testId}-more-button` : undefined}
            >
              <Icon icon={MoreVertical} size={iconSize} aria-hidden="true" />
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }
);

TaskCard.displayName = 'TaskCard';
