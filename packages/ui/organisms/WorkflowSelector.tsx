import type { WorkflowTemplate } from '@openflow/generated';
import { Box, Text, VisuallyHidden } from '@openflow/primitives';
import { cn } from '@openflow/utils';
import { AlertCircle, Check, ChevronRight, FileText, type LucideIcon } from 'lucide-react';
import { forwardRef, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Button } from '../atoms/Button';
import { Icon } from '../atoms/Icon';
import { Skeleton } from '../atoms/Skeleton';
import { EmptyState } from '../molecules/EmptyState';

// ============================================================================
// Types
// ============================================================================

/** Breakpoint names for responsive values */
export type WorkflowSelectorBreakpoint = 'base' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

/** Size variants for the workflow selector */
export type WorkflowSelectorSize = 'sm' | 'md' | 'lg';

/** Responsive value type supporting breakpoints */
export type ResponsiveValue<T> = T | Partial<Record<WorkflowSelectorBreakpoint, T>>;

export interface WorkflowSelectorProps {
  /** Available workflow templates to choose from */
  workflows: WorkflowTemplate[];
  /** Currently selected workflow template (null for no template) */
  selectedWorkflow: WorkflowTemplate | null;
  /** Callback when a workflow is selected or deselected */
  onSelectWorkflow: (workflow: WorkflowTemplate | null) => void;
  /** Whether workflows are still loading */
  loading?: boolean;
  /** Whether the selector is disabled */
  disabled?: boolean;
  /** Size variant - supports responsive values */
  size?: ResponsiveValue<WorkflowSelectorSize>;
  /** Additional CSS classes */
  className?: string;
  /** Accessible label for the listbox region */
  'aria-label'?: string;
  /** ID for aria-describedby */
  'aria-describedby'?: string;
  /** Test ID for automated testing */
  'data-testid'?: string;
}

export interface WorkflowSelectorSkeletonProps {
  /** Number of skeleton items to show */
  count?: number;
  /** Size variant - supports responsive values */
  size?: ResponsiveValue<WorkflowSelectorSize>;
  /** Additional CSS classes */
  className?: string;
  /** Test ID for automated testing */
  'data-testid'?: string;
}

export interface WorkflowSelectorErrorProps {
  /** Error message to display */
  message?: string;
  /** Callback when retry button is clicked */
  onRetry?: () => void;
  /** Size variant - supports responsive values */
  size?: ResponsiveValue<WorkflowSelectorSize>;
  /** Additional CSS classes */
  className?: string;
  /** Test ID for automated testing */
  'data-testid'?: string;
}

// ============================================================================
// Constants
// ============================================================================

// Default labels
export const DEFAULT_ARIA_LABEL = 'Workflow template options';
export const DEFAULT_NO_TEMPLATE_TITLE = 'No template';
export const DEFAULT_NO_TEMPLATE_DESCRIPTION = 'Start with a blank task';
export const DEFAULT_EMPTY_TITLE = 'No workflow templates found';
export const DEFAULT_EMPTY_DESCRIPTION = 'Add .md files to openflow/workflows/ in your project';
export const DEFAULT_LOADING_LABEL = 'Loading workflows';
export const DEFAULT_ERROR_TITLE = 'Failed to load workflows';
export const DEFAULT_ERROR_RETRY_LABEL = 'Retry';
export const DEFAULT_SKELETON_COUNT = 3;
export const DEFAULT_SELECTED_INDICATOR = 'Selected';

// Screen reader announcements
export const SR_WORKFLOW_SELECTED = 'Selected';
export const SR_WORKFLOW_DESELECTED = 'Deselected template. Now using: No template';
export const SR_OPTION_COUNT_TEMPLATE = '{count} workflow templates available';
export const SR_STEP_COUNT_TEMPLATE = '{count} step';
export const SR_STEPS_COUNT_TEMPLATE = '{count} steps';
export const SR_NAVIGATION_HINT = 'Use arrow keys to navigate, Enter or Space to select';
export const SR_NO_TEMPLATE_HINT = 'No template selected';

// Size class constants
export const WORKFLOW_OPTION_SIZE_CLASSES: Record<WorkflowSelectorSize, string> = {
  sm: 'min-h-[44px] p-2 text-sm',
  md: 'min-h-[44px] p-3 text-sm sm:min-h-[52px]',
  lg: 'min-h-[48px] p-4 text-base sm:min-h-[60px]',
};

export const WORKFLOW_OPTION_GAP_CLASSES: Record<WorkflowSelectorSize, string> = {
  sm: 'gap-2',
  md: 'gap-3',
  lg: 'gap-4',
};

export const WORKFLOW_TITLE_SIZE_CLASSES: Record<WorkflowSelectorSize, string> = {
  sm: 'text-sm',
  md: 'text-sm sm:text-base',
  lg: 'text-base sm:text-lg',
};

export const WORKFLOW_DESCRIPTION_SIZE_CLASSES: Record<WorkflowSelectorSize, string> = {
  sm: 'text-xs',
  md: 'text-xs sm:text-sm',
  lg: 'text-sm',
};

export const WORKFLOW_ICON_SIZE_MAP: Record<WorkflowSelectorSize, 'sm' | 'md' | 'lg'> = {
  sm: 'sm',
  md: 'md',
  lg: 'lg',
};

// Base class constants
export const WORKFLOW_SELECTOR_BASE_CLASSES = 'space-y-2';

export const WORKFLOW_OPTION_BASE_CLASSES =
  'flex w-full items-center rounded-lg border text-left motion-safe:transition-colors motion-safe:duration-150';

export const WORKFLOW_OPTION_FOCUS_CLASSES =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--background))]';

export const WORKFLOW_OPTION_DEFAULT_CLASSES = 'border-[rgb(var(--border))] bg-transparent';

export const WORKFLOW_OPTION_HOVER_CLASSES = 'hover:border-[rgb(var(--muted-foreground))]';

export const WORKFLOW_OPTION_SELECTED_CLASSES =
  'border-[rgb(var(--primary))] bg-[rgb(var(--primary))]/5';

export const WORKFLOW_OPTION_HIGHLIGHTED_CLASSES =
  'border-[rgb(var(--ring))] bg-[rgb(var(--accent))]';

export const WORKFLOW_OPTION_DISABLED_CLASSES = 'cursor-not-allowed opacity-60';

export const WORKFLOW_TITLE_BASE_CLASSES =
  'block font-medium truncate text-[rgb(var(--foreground))]';

export const WORKFLOW_DESCRIPTION_BASE_CLASSES = 'text-[rgb(var(--muted-foreground))]';

export const WORKFLOW_SKELETON_CLASSES = 'h-14 w-full rounded-lg sm:h-16';

export const WORKFLOW_ERROR_BASE_CLASSES =
  'flex flex-col items-center justify-center gap-4 rounded-lg border border-[rgb(var(--destructive))]/20 bg-[rgb(var(--destructive))]/5 p-6 text-center';

export const WORKFLOW_ERROR_PADDING_CLASSES: Record<WorkflowSelectorSize, string> = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get the base size from a responsive value.
 */
export function getBaseSize(size: ResponsiveValue<WorkflowSelectorSize>): WorkflowSelectorSize {
  if (typeof size === 'string') {
    return size;
  }
  return size.base ?? 'md';
}

/**
 * Generate responsive size classes from a size value.
 */
export function getResponsiveSizeClasses(
  size: ResponsiveValue<WorkflowSelectorSize>,
  classMap: Record<WorkflowSelectorSize, string>
): string {
  if (typeof size === 'string') {
    return classMap[size];
  }

  const classes: string[] = [];
  const breakpointOrder: WorkflowSelectorBreakpoint[] = ['base', 'sm', 'md', 'lg', 'xl', '2xl'];

  for (const bp of breakpointOrder) {
    const sizeValue = size[bp];
    if (sizeValue) {
      const sizeClass = classMap[sizeValue];
      if (bp === 'base') {
        // Split and add each class
        classes.push(...sizeClass.split(' '));
      } else {
        // Add breakpoint prefix to each class
        classes.push(...sizeClass.split(' ').map((cls) => `${bp}:${cls}`));
      }
    }
  }

  return classes.join(' ');
}

/**
 * Generate option ID for aria-activedescendant.
 */
export function getOptionId(listboxId: string, index: number): string {
  return `${listboxId}-option-${index}`;
}

/**
 * Format step count text for display.
 */
export function formatStepCount(count: number): string {
  return `${count} step${count !== 1 ? 's' : ''}`;
}

/**
 * Build screen reader announcement for selection change.
 */
export function buildSelectionAnnouncement(workflow: WorkflowTemplate | null): string {
  if (!workflow) {
    return SR_WORKFLOW_DESELECTED;
  }
  return `${SR_WORKFLOW_SELECTED} ${workflow.name}, ${formatStepCount(workflow.steps.length)}`;
}

/**
 * Build screen reader announcement for highlighted option.
 */
export function buildHighlightAnnouncement(
  name: string,
  stepCount: number | null,
  index: number,
  total: number
): string {
  const position = `${index + 1} of ${total}`;
  if (stepCount !== null) {
    return `${name}, ${formatStepCount(stepCount)}, ${position}`;
  }
  return `${name}, ${position}`;
}

/**
 * Build accessible label for a workflow option.
 */
export function buildWorkflowAccessibleLabel(
  workflow: WorkflowTemplate | null,
  isSelected: boolean
): string {
  if (!workflow) {
    const parts = [DEFAULT_NO_TEMPLATE_TITLE, DEFAULT_NO_TEMPLATE_DESCRIPTION];
    if (isSelected) {
      parts.push(DEFAULT_SELECTED_INDICATOR);
    }
    return parts.join(', ');
  }

  const parts = [workflow.name, formatStepCount(workflow.steps.length)];
  if (isSelected) {
    parts.push(DEFAULT_SELECTED_INDICATOR);
  }
  return parts.join(', ');
}

/**
 * Build count announcement for available options.
 */
export function buildCountAnnouncement(count: number): string {
  return SR_OPTION_COUNT_TEMPLATE.replace('{count}', String(count));
}

// ============================================================================
// Skeleton Component
// ============================================================================

/**
 * Loading skeleton for WorkflowSelector.
 */
export const WorkflowSelectorSkeleton = forwardRef<HTMLDivElement, WorkflowSelectorSkeletonProps>(
  function WorkflowSelectorSkeleton(
    { count = DEFAULT_SKELETON_COUNT, size = 'md', className, 'data-testid': testId },
    ref
  ) {
    const baseSize = getBaseSize(size);

    return (
      <Box
        ref={ref}
        className={cn(WORKFLOW_SELECTOR_BASE_CLASSES, className)}
        aria-hidden="true"
        role="presentation"
        aria-label={DEFAULT_LOADING_LABEL}
        data-testid={testId ?? 'workflow-selector-skeleton'}
        data-size={baseSize}
        data-count={count}
      >
        {Array.from({ length: count }).map((_, i) => (
          <Skeleton key={`workflow-skeleton-${i}`} className={WORKFLOW_SKELETON_CLASSES} />
        ))}
      </Box>
    );
  }
);

WorkflowSelectorSkeleton.displayName = 'WorkflowSelectorSkeleton';

// ============================================================================
// Error Component
// ============================================================================

/**
 * Error state for WorkflowSelector.
 */
export const WorkflowSelectorError = forwardRef<HTMLDivElement, WorkflowSelectorErrorProps>(
  function WorkflowSelectorError(
    { message = DEFAULT_ERROR_TITLE, onRetry, size = 'md', className, 'data-testid': testId },
    ref
  ) {
    const baseSize = getBaseSize(size);
    const paddingClasses = getResponsiveSizeClasses(size, WORKFLOW_ERROR_PADDING_CLASSES);

    return (
      <Box
        ref={ref}
        role="alert"
        aria-live="assertive"
        className={cn(WORKFLOW_ERROR_BASE_CLASSES, paddingClasses, className)}
        data-testid={testId ?? 'workflow-selector-error'}
        data-size={baseSize}
      >
        <VisuallyHidden>
          <Text as="span" role="status" aria-live="assertive">
            {message}
          </Text>
        </VisuallyHidden>
        <Icon
          icon={AlertCircle}
          size={WORKFLOW_ICON_SIZE_MAP[baseSize]}
          className="text-[rgb(var(--destructive))]"
          aria-hidden="true"
        />
        <Text as="p" className="text-sm text-[rgb(var(--destructive))]">
          {message}
        </Text>
        {onRetry && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onRetry}
            aria-label={DEFAULT_ERROR_RETRY_LABEL}
            data-testid={testId ? `${testId}-retry` : 'workflow-selector-error-retry'}
          >
            {DEFAULT_ERROR_RETRY_LABEL}
          </Button>
        )}
      </Box>
    );
  }
);

WorkflowSelectorError.displayName = 'WorkflowSelectorError';

// ============================================================================
// WorkflowOption Sub-Component
// ============================================================================

interface WorkflowOptionProps {
  /** The workflow template (null for "no template" option) */
  workflow: WorkflowTemplate | null;
  /** Whether this option is currently selected */
  isSelected: boolean;
  /** Whether this option is currently highlighted via keyboard */
  isHighlighted: boolean;
  /** Click handler */
  onClick: () => void;
  /** Mouse enter handler for highlight */
  onMouseEnter: () => void;
  /** Whether the option is disabled */
  disabled: boolean;
  /** Size classes to apply */
  sizeClasses: string;
  /** Gap classes to apply */
  gapClasses: string;
  /** Title size classes */
  titleSizeClasses: string;
  /** Description size classes */
  descriptionSizeClasses: string;
  /** Icon component to use */
  icon?: LucideIcon;
  /** Icon size */
  iconSize: 'sm' | 'md' | 'lg';
  /** Option ID for aria-activedescendant */
  id: string;
  /** Data index for keyboard navigation */
  dataIndex: number;
  /** Test ID prefix */
  testIdPrefix?: string;
}

const WorkflowOption = forwardRef<HTMLButtonElement, WorkflowOptionProps>(function WorkflowOption(
  {
    workflow,
    isSelected,
    isHighlighted,
    onClick,
    onMouseEnter,
    disabled,
    sizeClasses,
    gapClasses,
    titleSizeClasses,
    descriptionSizeClasses,
    icon: IconComponent,
    iconSize,
    id,
    dataIndex,
    testIdPrefix,
  },
  ref
) {
  const title = workflow?.name ?? DEFAULT_NO_TEMPLATE_TITLE;
  const description = workflow
    ? formatStepCount(workflow.steps.length)
    : DEFAULT_NO_TEMPLATE_DESCRIPTION;

  return (
    <Box
      as="button"
      ref={ref}
      type="button"
      id={id}
      role="option"
      aria-selected={isSelected}
      aria-label={buildWorkflowAccessibleLabel(workflow, isSelected)}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      disabled={disabled}
      data-index={dataIndex}
      data-highlighted={isHighlighted || undefined}
      data-selected={isSelected || undefined}
      data-workflow-id={workflow?.id ?? 'no-template'}
      data-testid={
        testIdPrefix
          ? `${testIdPrefix}-option-${workflow?.id ?? 'no-template'}`
          : `workflow-option-${workflow?.id ?? 'no-template'}`
      }
      className={cn(
        WORKFLOW_OPTION_BASE_CLASSES,
        WORKFLOW_OPTION_FOCUS_CLASSES,
        sizeClasses,
        gapClasses,
        // State styles
        isSelected && WORKFLOW_OPTION_SELECTED_CLASSES,
        isHighlighted && !isSelected && WORKFLOW_OPTION_HIGHLIGHTED_CLASSES,
        !isSelected && !isHighlighted && WORKFLOW_OPTION_DEFAULT_CLASSES,
        !isSelected && !isHighlighted && !disabled && WORKFLOW_OPTION_HOVER_CLASSES,
        disabled && WORKFLOW_OPTION_DISABLED_CLASSES
      )}
    >
      {/* Optional leading icon */}
      {IconComponent && (
        <Icon
          icon={IconComponent}
          size={iconSize}
          className="shrink-0 text-[rgb(var(--muted-foreground))]"
          aria-hidden="true"
        />
      )}

      {/* Content */}
      <Box className="flex-1 min-w-0">
        <Text as="span" className={cn(WORKFLOW_TITLE_BASE_CLASSES, titleSizeClasses)}>
          {title}
        </Text>
        <Text as="p" className={cn(WORKFLOW_DESCRIPTION_BASE_CLASSES, descriptionSizeClasses)}>
          {description}
        </Text>
      </Box>

      {/* Selection indicator or arrow */}
      {isSelected ? (
        <Icon
          icon={Check}
          size={iconSize}
          className="shrink-0 text-[rgb(var(--primary))]"
          aria-hidden="true"
        />
      ) : (
        <Icon
          icon={ChevronRight}
          size={iconSize}
          className="shrink-0 text-[rgb(var(--muted-foreground))]"
          aria-hidden="true"
        />
      )}
    </Box>
  );
});

WorkflowOption.displayName = 'WorkflowOption';

// ============================================================================
// Main Component
// ============================================================================

/**
 * WorkflowSelector component for choosing workflow templates when creating tasks.
 * Stateless - receives all data via props, emits actions via callbacks.
 *
 * Features:
 * - "No template" option for blank tasks
 * - List of available workflow templates
 * - Step count display for each template
 * - Selected state with check icon
 * - Loading skeleton state
 * - Error state with retry
 * - Empty state when no templates available
 * - Full keyboard navigation (Arrow keys, Home, End, Enter, Space)
 * - ARIA listbox pattern
 * - Screen reader announcements
 * - Touch target compliance (44px minimum on mobile)
 * - Responsive sizing
 *
 * @example
 * <WorkflowSelector
 *   workflows={templates}
 *   selectedWorkflow={selected}
 *   onSelectWorkflow={setSelected}
 *   loading={isLoading}
 * />
 */
export const WorkflowSelector = forwardRef<HTMLDivElement, WorkflowSelectorProps>(
  function WorkflowSelector(
    {
      workflows,
      selectedWorkflow,
      onSelectWorkflow,
      loading = false,
      disabled = false,
      size = 'md',
      className,
      'aria-label': ariaLabel = DEFAULT_ARIA_LABEL,
      'aria-describedby': ariaDescribedBy,
      'data-testid': testId,
    },
    ref
  ) {
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const [announcement, setAnnouncement] = useState('');
    const listRef = useRef<HTMLDivElement>(null);
    const id = useId();
    const listboxId = `${id}-listbox`;

    // Calculate sizes
    const baseSize = getBaseSize(size);
    const sizeClasses = getResponsiveSizeClasses(size, WORKFLOW_OPTION_SIZE_CLASSES);
    const gapClasses = getResponsiveSizeClasses(size, WORKFLOW_OPTION_GAP_CLASSES);
    const titleSizeClasses = getResponsiveSizeClasses(size, WORKFLOW_TITLE_SIZE_CLASSES);
    const descriptionSizeClasses = getResponsiveSizeClasses(
      size,
      WORKFLOW_DESCRIPTION_SIZE_CLASSES
    );
    const iconSize = WORKFLOW_ICON_SIZE_MAP[baseSize];

    // Build options array with "no template" first
    const options = useMemo(() => {
      const allOptions: Array<WorkflowTemplate | null> = [null, ...workflows];
      return allOptions;
    }, [workflows]);

    // Total items count
    const totalItems = options.length;

    // Get highlighted option ID for aria-activedescendant
    const highlightedOptionId =
      highlightedIndex >= 0 ? getOptionId(listboxId, highlightedIndex) : undefined;

    // Find current selection index - reserved for future keyboard navigation enhancement
    useMemo(() => {
      if (selectedWorkflow === null) return 0;
      return options.findIndex((opt) => opt !== null && opt.id === selectedWorkflow.id);
    }, [options, selectedWorkflow]);

    const selectWorkflow = useCallback(
      (workflow: WorkflowTemplate | null) => {
        onSelectWorkflow(workflow);
        setAnnouncement(buildSelectionAnnouncement(workflow));
      },
      [onSelectWorkflow]
    );

    // Reset highlighted index when workflows change
    // biome-ignore lint/correctness/useExhaustiveDependencies: Intentionally reset when workflows array changes
    useEffect(() => {
      setHighlightedIndex(-1);
    }, [workflows]);

    // Announce highlighted option for screen readers
    useEffect(() => {
      if (highlightedIndex < 0) return;

      const option = options[highlightedIndex];
      setAnnouncement(
        buildHighlightAnnouncement(
          option?.name ?? DEFAULT_NO_TEMPLATE_TITLE,
          option?.steps.length ?? null,
          highlightedIndex,
          totalItems
        )
      );
    }, [highlightedIndex, options, totalItems]);

    // Scroll highlighted item into view
    useEffect(() => {
      if (highlightedIndex >= 0 && listRef.current) {
        const highlightedElement = listRef.current.querySelector(
          `[data-index="${highlightedIndex}"]`
        );
        highlightedElement?.scrollIntoView({ block: 'nearest' });
      }
    }, [highlightedIndex]);

    const handleKeyDown = useCallback(
      (event: React.KeyboardEvent) => {
        if (disabled) return;

        switch (event.key) {
          case 'ArrowDown':
            event.preventDefault();
            setHighlightedIndex((prev) => (prev < totalItems - 1 ? prev + 1 : 0));
            break;
          case 'ArrowUp':
            event.preventDefault();
            setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : totalItems - 1));
            break;
          case 'Home':
            event.preventDefault();
            setHighlightedIndex(0);
            break;
          case 'End':
            event.preventDefault();
            setHighlightedIndex(totalItems - 1);
            break;
          case 'Enter':
          case ' ':
            event.preventDefault();
            if (highlightedIndex >= 0 && highlightedIndex < options.length) {
              selectWorkflow(options[highlightedIndex] ?? null);
            }
            break;
        }
      },
      [disabled, totalItems, options, highlightedIndex, selectWorkflow]
    );

    // Loading state with skeletons
    if (loading) {
      return (
        <WorkflowSelectorSkeleton
          count={DEFAULT_SKELETON_COUNT}
          size={size}
          className={className}
          data-testid={testId ? `${testId}-skeleton` : undefined}
        />
      );
    }

    // Empty state when no workflows available (still show "no template" option)
    if (workflows.length === 0) {
      return (
        <Box
          ref={ref}
          className={cn(WORKFLOW_SELECTOR_BASE_CLASSES, className)}
          role="listbox"
          aria-label={ariaLabel}
          aria-describedby={ariaDescribedBy}
          aria-activedescendant={highlightedOptionId}
          tabIndex={disabled ? -1 : 0}
          onKeyDown={handleKeyDown}
          data-testid={testId ?? 'workflow-selector'}
          data-state="empty"
          data-size={baseSize}
          data-disabled={disabled || undefined}
        >
          {/* Screen reader announcements */}
          <VisuallyHidden>
            <Box role="status" aria-live="polite" aria-atomic="true">
              {announcement}
            </Box>
          </VisuallyHidden>

          {/* No template option */}
          <WorkflowOption
            workflow={null}
            isSelected={selectedWorkflow === null}
            isHighlighted={highlightedIndex === 0}
            onClick={() => selectWorkflow(null)}
            onMouseEnter={() => setHighlightedIndex(0)}
            disabled={disabled}
            sizeClasses={sizeClasses}
            gapClasses={gapClasses}
            titleSizeClasses={titleSizeClasses}
            descriptionSizeClasses={descriptionSizeClasses}
            iconSize={iconSize}
            id={getOptionId(listboxId, 0)}
            dataIndex={0}
            testIdPrefix={testId}
          />

          {/* Empty state message */}
          <EmptyState
            icon={FileText}
            title={DEFAULT_EMPTY_TITLE}
            description={DEFAULT_EMPTY_DESCRIPTION}
            size="sm"
            className="mt-4"
            data-testid={testId ? `${testId}-empty` : 'workflow-selector-empty'}
          />
        </Box>
      );
    }

    return (
      <Box
        ref={ref}
        className={cn(WORKFLOW_SELECTOR_BASE_CLASSES, className)}
        role="listbox"
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        aria-activedescendant={highlightedOptionId}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={handleKeyDown}
        data-testid={testId ?? 'workflow-selector'}
        data-state="populated"
        data-size={baseSize}
        data-workflow-count={workflows.length}
        data-selected-workflow={selectedWorkflow?.id ?? 'none'}
        data-disabled={disabled || undefined}
      >
        {/* Screen reader announcements */}
        <VisuallyHidden>
          <Box role="status" aria-live="polite" aria-atomic="true">
            {announcement}
          </Box>
          <Box>
            {buildCountAnnouncement(workflows.length)}. {SR_NAVIGATION_HINT}
          </Box>
        </VisuallyHidden>

        {/* Workflow options */}
        <Box ref={listRef}>
          {options.map((workflow, index) => (
            <WorkflowOption
              key={workflow?.id ?? 'no-template'}
              workflow={workflow}
              isSelected={
                workflow === null ? selectedWorkflow === null : selectedWorkflow?.id === workflow.id
              }
              isHighlighted={highlightedIndex === index}
              onClick={() => selectWorkflow(workflow)}
              onMouseEnter={() => setHighlightedIndex(index)}
              disabled={disabled}
              sizeClasses={sizeClasses}
              gapClasses={gapClasses}
              titleSizeClasses={titleSizeClasses}
              descriptionSizeClasses={descriptionSizeClasses}
              icon={workflow ? FileText : undefined}
              iconSize={iconSize}
              id={getOptionId(listboxId, index)}
              dataIndex={index}
              testIdPrefix={testId}
            />
          ))}
        </Box>
      </Box>
    );
  }
);

WorkflowSelector.displayName = 'WorkflowSelector';
