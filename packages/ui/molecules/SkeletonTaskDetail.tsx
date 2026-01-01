/**
 * SkeletonTaskDetail Molecule - Loading placeholder for task detail page layouts
 *
 * Provides visual loading indication while task detail content is being fetched.
 * Matches the TaskLayout structure with header, tabs, chat messages, input, and steps panel.
 *
 * Features:
 * - Uses Skeleton atom for consistent loading placeholders
 * - Responsive sizing support via ResponsiveValue
 * - Properly hidden from screen readers (aria-hidden="true")
 * - role="presentation" for explicit presentation semantics
 * - forwardRef support for ref forwarding
 * - data-testid support for testing
 * - Configurable sections (showTabs, showStepsPanel, showInput)
 */

import { Box, type Breakpoint, type ResponsiveValue } from '@openflow/primitives';
import { cn } from '@openflow/utils';
import { type HTMLAttributes, forwardRef } from 'react';
import { Skeleton } from '../atoms/Skeleton';

/** Skeleton task detail size variants */
export type SkeletonTaskDetailSize = 'sm' | 'md' | 'lg';

/** Breakpoint names for responsive values - re-exported for convenience */
export type SkeletonTaskDetailBreakpoint = Breakpoint;

/**
 * SkeletonTaskDetail component props
 */
export interface SkeletonTaskDetailProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /**
   * Size variant for the skeleton task detail
   * - 'sm': Compact spacing for narrow layouts
   * - 'md': Standard spacing (default)
   * - 'lg': Larger spacing for wide layouts
   */
  size?: ResponsiveValue<SkeletonTaskDetailSize>;
  /** Number of chat message skeletons to show (default: 3) */
  messageCount?: number;
  /** Number of step skeletons to show (default: 4) */
  stepCount?: number;
  /** Number of tab skeletons to show (default: 4) */
  tabCount?: number;
  /** Whether to show the tabs section (default: true) */
  showTabs?: boolean;
  /** Whether to show the steps panel (default: true) */
  showStepsPanel?: boolean;
  /** Whether to show the input area (default: true) */
  showInput?: boolean;
  /** Data attribute for testing */
  'data-testid'?: string;
}

// ============================================================================
// Constants
// ============================================================================

/** Default number of chat messages to show */
export const DEFAULT_MESSAGE_COUNT = 3;

/** Default number of steps to show */
export const DEFAULT_STEP_COUNT = 4;

/** Default number of tabs to show */
export const DEFAULT_TAB_COUNT = 4;

/** Base classes for the skeleton task detail container */
export const SKELETON_TASK_DETAIL_BASE_CLASSES = 'flex h-full';

/** Size-specific classes for header padding */
export const SKELETON_TASK_DETAIL_HEADER_PADDING_CLASSES: Record<SkeletonTaskDetailSize, string> = {
  sm: 'px-3 py-2',
  md: 'px-4 py-3',
  lg: 'px-6 py-4',
};

/** Size-specific classes for header avatar dimensions */
export const SKELETON_TASK_DETAIL_HEADER_AVATAR_DIMENSIONS: Record<
  SkeletonTaskDetailSize,
  { width: number; height: number }
> = {
  sm: { width: 28, height: 28 },
  md: { width: 32, height: 32 },
  lg: { width: 40, height: 40 },
};

/** Size-specific classes for header title height */
export const SKELETON_TASK_DETAIL_HEADER_TITLE_CLASSES: Record<SkeletonTaskDetailSize, string> = {
  sm: 'h-5 w-48',
  md: 'h-6 w-64',
  lg: 'h-7 w-80',
};

/** Size-specific classes for header subtitle height */
export const SKELETON_TASK_DETAIL_HEADER_SUBTITLE_CLASSES: Record<SkeletonTaskDetailSize, string> =
  {
    sm: 'h-2.5 w-24',
    md: 'h-3 w-32',
    lg: 'h-3.5 w-40',
  };

/** Size-specific classes for header action button */
export const SKELETON_TASK_DETAIL_HEADER_ACTION_CLASSES: Record<SkeletonTaskDetailSize, string> = {
  sm: 'h-7 w-20',
  md: 'h-8 w-24',
  lg: 'h-9 w-28',
};

/** Size-specific classes for tabs section padding */
export const SKELETON_TASK_DETAIL_TABS_PADDING_CLASSES: Record<SkeletonTaskDetailSize, string> = {
  sm: 'px-3 py-1.5',
  md: 'px-4 py-2',
  lg: 'px-6 py-3',
};

/** Size-specific classes for tabs section gap */
export const SKELETON_TASK_DETAIL_TABS_GAP_CLASSES: Record<SkeletonTaskDetailSize, string> = {
  sm: 'gap-1.5',
  md: 'gap-2',
  lg: 'gap-3',
};

/** Size-specific classes for tab button dimensions */
export const SKELETON_TASK_DETAIL_TAB_BUTTON_CLASSES: Record<SkeletonTaskDetailSize, string> = {
  sm: 'h-7 w-16',
  md: 'h-8 w-20',
  lg: 'h-9 w-24',
};

/** Size-specific classes for content area padding */
export const SKELETON_TASK_DETAIL_CONTENT_PADDING_CLASSES: Record<SkeletonTaskDetailSize, string> =
  {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

/** Size-specific classes for content area spacing */
export const SKELETON_TASK_DETAIL_CONTENT_GAP_CLASSES: Record<SkeletonTaskDetailSize, string> = {
  sm: 'space-y-3',
  md: 'space-y-4',
  lg: 'space-y-6',
};

/** Size-specific classes for message avatar dimensions */
export const SKELETON_TASK_DETAIL_MESSAGE_AVATAR_DIMENSIONS: Record<
  SkeletonTaskDetailSize,
  { width: number; height: number }
> = {
  sm: { width: 28, height: 28 },
  md: { width: 32, height: 32 },
  lg: { width: 40, height: 40 },
};

/** Size-specific classes for message bubble */
export const SKELETON_TASK_DETAIL_MESSAGE_BUBBLE_CLASSES: Record<SkeletonTaskDetailSize, string> = {
  sm: 'p-2.5 space-y-1.5',
  md: 'p-3 space-y-2',
  lg: 'p-4 space-y-2.5',
};

/** Size-specific classes for message text height */
export const SKELETON_TASK_DETAIL_MESSAGE_TEXT_CLASSES: Record<SkeletonTaskDetailSize, string> = {
  sm: 'h-3.5',
  md: 'h-4',
  lg: 'h-5',
};

/** Size-specific classes for input area padding */
export const SKELETON_TASK_DETAIL_INPUT_PADDING_CLASSES: Record<SkeletonTaskDetailSize, string> = {
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

/** Size-specific classes for input element */
export const SKELETON_TASK_DETAIL_INPUT_CLASSES: Record<SkeletonTaskDetailSize, string> = {
  sm: 'h-10',
  md: 'h-12',
  lg: 'h-14',
};

/** Size-specific classes for steps panel width */
export const SKELETON_TASK_DETAIL_STEPS_PANEL_WIDTH_CLASSES: Record<
  SkeletonTaskDetailSize,
  string
> = {
  sm: 'w-64',
  md: 'w-80',
  lg: 'w-96',
};

/** Size-specific classes for steps panel padding */
export const SKELETON_TASK_DETAIL_STEPS_PANEL_PADDING_CLASSES: Record<
  SkeletonTaskDetailSize,
  string
> = {
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

/** Size-specific classes for steps panel header */
export const SKELETON_TASK_DETAIL_STEPS_HEADER_CLASSES: Record<SkeletonTaskDetailSize, string> = {
  sm: 'mb-3',
  md: 'mb-4',
  lg: 'mb-6',
};

/** Size-specific classes for steps panel title */
export const SKELETON_TASK_DETAIL_STEPS_TITLE_CLASSES: Record<SkeletonTaskDetailSize, string> = {
  sm: 'h-4 w-20',
  md: 'h-5 w-24',
  lg: 'h-6 w-28',
};

/** Size-specific classes for steps panel action button */
export const SKELETON_TASK_DETAIL_STEPS_ACTION_CLASSES: Record<SkeletonTaskDetailSize, string> = {
  sm: 'h-7 w-7',
  md: 'h-8 w-8',
  lg: 'h-9 w-9',
};

/** Size-specific classes for steps list spacing */
export const SKELETON_TASK_DETAIL_STEPS_GAP_CLASSES: Record<SkeletonTaskDetailSize, string> = {
  sm: 'space-y-2.5',
  md: 'space-y-3',
  lg: 'space-y-4',
};

/** Size-specific classes for step item padding */
export const SKELETON_TASK_DETAIL_STEP_ITEM_PADDING_CLASSES: Record<
  SkeletonTaskDetailSize,
  string
> = {
  sm: 'p-2.5',
  md: 'p-3',
  lg: 'p-4',
};

/** Size-specific classes for step item header gap */
export const SKELETON_TASK_DETAIL_STEP_HEADER_GAP_CLASSES: Record<SkeletonTaskDetailSize, string> =
  {
    sm: 'gap-1.5 mb-1.5',
    md: 'gap-2 mb-2',
    lg: 'gap-2.5 mb-2.5',
  };

/** Size-specific classes for step number dimensions */
export const SKELETON_TASK_DETAIL_STEP_NUMBER_DIMENSIONS: Record<
  SkeletonTaskDetailSize,
  { width: number; height: number }
> = {
  sm: { width: 18, height: 18 },
  md: { width: 20, height: 20 },
  lg: { width: 24, height: 24 },
};

/** Size-specific classes for step title height */
export const SKELETON_TASK_DETAIL_STEP_TITLE_CLASSES: Record<SkeletonTaskDetailSize, string> = {
  sm: 'h-3.5 w-20',
  md: 'h-4 w-24',
  lg: 'h-5 w-28',
};

/** Size-specific classes for step description height */
export const SKELETON_TASK_DETAIL_STEP_DESCRIPTION_CLASSES: Record<SkeletonTaskDetailSize, string> =
  {
    sm: 'h-2.5',
    md: 'h-3',
    lg: 'h-3.5',
  };

// ============================================================================
// Utility Functions
// ============================================================================

/** Breakpoint order for responsive values */
const BREAKPOINT_ORDER: Breakpoint[] = ['base', 'sm', 'md', 'lg', 'xl', '2xl'];

/** Type for responsive size object */
type ResponsiveSizeObject = Partial<Record<Breakpoint, SkeletonTaskDetailSize>>;

/**
 * Check if value is a responsive object (not a string size)
 */
function isResponsiveObject(
  value: ResponsiveValue<SkeletonTaskDetailSize>
): value is ResponsiveSizeObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Get base size from responsive value
 */
export function getBaseSize(size: ResponsiveValue<SkeletonTaskDetailSize>): SkeletonTaskDetailSize {
  if (!isResponsiveObject(size)) {
    return size;
  }
  return size.base ?? 'md';
}

/**
 * Get responsive size classes for a given class map
 */
export function getResponsiveSizeClasses(
  size: ResponsiveValue<SkeletonTaskDetailSize>,
  classMap: Record<SkeletonTaskDetailSize, string>
): string {
  if (!isResponsiveObject(size)) {
    return classMap[size];
  }

  const classes: string[] = [];

  for (const bp of BREAKPOINT_ORDER) {
    const sizeValue = size[bp];
    if (sizeValue !== undefined) {
      const sizeClasses = classMap[sizeValue];
      if (bp === 'base') {
        // Base classes without breakpoint prefix
        classes.push(sizeClasses);
      } else {
        // Add breakpoint prefix to each class
        const prefixedClasses = sizeClasses
          .split(' ')
          .map((c) => `${bp}:${c}`)
          .join(' ');
        classes.push(prefixedClasses);
      }
    }
  }

  return classes.join(' ');
}

/**
 * Get avatar/icon dimensions based on size (uses base size for responsive objects)
 */
export function getAvatarDimensions(
  size: ResponsiveValue<SkeletonTaskDetailSize>,
  dimensionMap: Record<SkeletonTaskDetailSize, { width: number; height: number }>
): { width: number; height: number } {
  const baseSize = getBaseSize(size);
  return dimensionMap[baseSize];
}

// ============================================================================
// Component
// ============================================================================

/**
 * SkeletonTaskDetail - Loading placeholder for task detail page layouts
 *
 * Provides visual loading indication while task detail content is being fetched.
 * Matches the TaskLayout structure with steps panel and main content.
 *
 * Layout structure:
 * - Main content area (flex-1):
 *   - Header: Avatar, title, subtitle, action button
 *   - Tabs: Navigation tabs (optional)
 *   - Chat messages: Alternating user/assistant messages
 *   - Input area: Message input (optional)
 * - Steps panel (sidebar):
 *   - Header with title and action button
 *   - List of step items
 *
 * @example
 * // Basic task detail skeleton
 * <SkeletonTaskDetail />
 *
 * @example
 * // Without steps panel (e.g., mobile view)
 * <SkeletonTaskDetail showStepsPanel={false} />
 *
 * @example
 * // Compact layout
 * <SkeletonTaskDetail size="sm" />
 *
 * @example
 * // Responsive sizing
 * <SkeletonTaskDetail size={{ base: 'sm', md: 'md', lg: 'lg' }} />
 *
 * @example
 * // Custom counts
 * <SkeletonTaskDetail messageCount={5} stepCount={6} />
 */
export const SkeletonTaskDetail = forwardRef<HTMLDivElement, SkeletonTaskDetailProps>(
  function SkeletonTaskDetail(
    {
      className,
      size = 'md',
      messageCount = DEFAULT_MESSAGE_COUNT,
      stepCount = DEFAULT_STEP_COUNT,
      tabCount = DEFAULT_TAB_COUNT,
      showTabs = true,
      showStepsPanel = true,
      showInput = true,
      'data-testid': dataTestId,
      ...props
    },
    ref
  ) {
    // Calculate responsive classes
    const headerPaddingClasses = getResponsiveSizeClasses(
      size,
      SKELETON_TASK_DETAIL_HEADER_PADDING_CLASSES
    );
    const headerAvatarDimensions = getAvatarDimensions(
      size,
      SKELETON_TASK_DETAIL_HEADER_AVATAR_DIMENSIONS
    );
    const headerTitleClasses = getResponsiveSizeClasses(
      size,
      SKELETON_TASK_DETAIL_HEADER_TITLE_CLASSES
    );
    const headerSubtitleClasses = getResponsiveSizeClasses(
      size,
      SKELETON_TASK_DETAIL_HEADER_SUBTITLE_CLASSES
    );
    const headerActionClasses = getResponsiveSizeClasses(
      size,
      SKELETON_TASK_DETAIL_HEADER_ACTION_CLASSES
    );

    const tabsPaddingClasses = getResponsiveSizeClasses(
      size,
      SKELETON_TASK_DETAIL_TABS_PADDING_CLASSES
    );
    const tabsGapClasses = getResponsiveSizeClasses(size, SKELETON_TASK_DETAIL_TABS_GAP_CLASSES);
    const tabButtonClasses = getResponsiveSizeClasses(
      size,
      SKELETON_TASK_DETAIL_TAB_BUTTON_CLASSES
    );

    const contentPaddingClasses = getResponsiveSizeClasses(
      size,
      SKELETON_TASK_DETAIL_CONTENT_PADDING_CLASSES
    );
    const contentGapClasses = getResponsiveSizeClasses(
      size,
      SKELETON_TASK_DETAIL_CONTENT_GAP_CLASSES
    );
    const messageAvatarDimensions = getAvatarDimensions(
      size,
      SKELETON_TASK_DETAIL_MESSAGE_AVATAR_DIMENSIONS
    );
    const messageBubbleClasses = getResponsiveSizeClasses(
      size,
      SKELETON_TASK_DETAIL_MESSAGE_BUBBLE_CLASSES
    );
    const messageTextClasses = getResponsiveSizeClasses(
      size,
      SKELETON_TASK_DETAIL_MESSAGE_TEXT_CLASSES
    );

    const inputPaddingClasses = getResponsiveSizeClasses(
      size,
      SKELETON_TASK_DETAIL_INPUT_PADDING_CLASSES
    );
    const inputClasses = getResponsiveSizeClasses(size, SKELETON_TASK_DETAIL_INPUT_CLASSES);

    const stepsPanelWidthClasses = getResponsiveSizeClasses(
      size,
      SKELETON_TASK_DETAIL_STEPS_PANEL_WIDTH_CLASSES
    );
    const stepsPanelPaddingClasses = getResponsiveSizeClasses(
      size,
      SKELETON_TASK_DETAIL_STEPS_PANEL_PADDING_CLASSES
    );
    const stepsHeaderClasses = getResponsiveSizeClasses(
      size,
      SKELETON_TASK_DETAIL_STEPS_HEADER_CLASSES
    );
    const stepsTitleClasses = getResponsiveSizeClasses(
      size,
      SKELETON_TASK_DETAIL_STEPS_TITLE_CLASSES
    );
    const stepsActionClasses = getResponsiveSizeClasses(
      size,
      SKELETON_TASK_DETAIL_STEPS_ACTION_CLASSES
    );
    const stepsGapClasses = getResponsiveSizeClasses(size, SKELETON_TASK_DETAIL_STEPS_GAP_CLASSES);
    const stepItemPaddingClasses = getResponsiveSizeClasses(
      size,
      SKELETON_TASK_DETAIL_STEP_ITEM_PADDING_CLASSES
    );
    const stepHeaderGapClasses = getResponsiveSizeClasses(
      size,
      SKELETON_TASK_DETAIL_STEP_HEADER_GAP_CLASSES
    );
    const stepNumberDimensions = getAvatarDimensions(
      size,
      SKELETON_TASK_DETAIL_STEP_NUMBER_DIMENSIONS
    );
    const stepTitleClasses = getResponsiveSizeClasses(
      size,
      SKELETON_TASK_DETAIL_STEP_TITLE_CLASSES
    );
    const stepDescriptionClasses = getResponsiveSizeClasses(
      size,
      SKELETON_TASK_DETAIL_STEP_DESCRIPTION_CLASSES
    );

    return (
      <Box
        ref={ref}
        className={cn(SKELETON_TASK_DETAIL_BASE_CLASSES, className)}
        aria-hidden={true}
        role="presentation"
        data-testid={dataTestId}
        data-size={typeof size === 'string' ? size : 'responsive'}
        data-message-count={messageCount}
        data-step-count={stepCount}
        data-tab-count={tabCount}
        data-show-tabs={showTabs}
        data-show-steps-panel={showStepsPanel}
        data-show-input={showInput}
        {...props}
      >
        {/* Main content area */}
        <Box
          className="flex-1 flex flex-col"
          data-testid={dataTestId ? `${dataTestId}-main` : undefined}
        >
          {/* Header */}
          <Box
            className={cn(
              'flex items-center gap-4 border-b border-[rgb(var(--border))] bg-[rgb(var(--card))]',
              headerPaddingClasses
            )}
            data-testid={dataTestId ? `${dataTestId}-header` : undefined}
          >
            <Skeleton
              variant="circular"
              width={headerAvatarDimensions.width}
              height={headerAvatarDimensions.height}
              data-testid={dataTestId ? `${dataTestId}-header-avatar` : undefined}
            />
            <Box className="flex-1">
              <Skeleton
                variant="text"
                className={cn(headerTitleClasses, 'mb-1')}
                data-testid={dataTestId ? `${dataTestId}-header-title` : undefined}
              />
              <Skeleton
                variant="text"
                className={headerSubtitleClasses}
                data-testid={dataTestId ? `${dataTestId}-header-subtitle` : undefined}
              />
            </Box>
            <Skeleton
              className={cn(headerActionClasses, 'rounded-md')}
              data-testid={dataTestId ? `${dataTestId}-header-action` : undefined}
            />
          </Box>

          {/* Tabs */}
          {showTabs && (
            <Box
              className={cn(
                'flex border-b border-[rgb(var(--border))]',
                tabsPaddingClasses,
                tabsGapClasses
              )}
              data-testid={dataTestId ? `${dataTestId}-tabs` : undefined}
            >
              {Array.from({ length: tabCount }).map((_, i) => (
                <Skeleton
                  key={`skeleton-tab-${i}`}
                  className={cn(tabButtonClasses, 'rounded-md')}
                  data-testid={dataTestId ? `${dataTestId}-tab-${i}` : undefined}
                />
              ))}
            </Box>
          )}

          {/* Main content - Chat messages */}
          <Box
            className={cn('flex-1', contentPaddingClasses)}
            data-testid={dataTestId ? `${dataTestId}-content` : undefined}
          >
            <Box className={contentGapClasses}>
              {Array.from({ length: messageCount }).map((_, i) => {
                const isUser = i % 2 !== 0;
                return (
                  <Box
                    key={`skeleton-msg-${i}`}
                    className={cn('flex gap-3', isUser ? 'justify-end' : 'justify-start')}
                    data-testid={dataTestId ? `${dataTestId}-message-${i}` : undefined}
                    data-message-type={isUser ? 'user' : 'assistant'}
                  >
                    {/* Assistant avatar on left */}
                    {!isUser && (
                      <Skeleton
                        variant="circular"
                        width={messageAvatarDimensions.width}
                        height={messageAvatarDimensions.height}
                        data-testid={dataTestId ? `${dataTestId}-message-${i}-avatar` : undefined}
                      />
                    )}

                    {/* Message bubble */}
                    <Box
                      className={cn(
                        'max-w-[70%] rounded-lg bg-[rgb(var(--muted))]',
                        messageBubbleClasses
                      )}
                    >
                      <Skeleton
                        variant="text"
                        className={cn(messageTextClasses, 'w-48')}
                        data-testid={dataTestId ? `${dataTestId}-message-${i}-text-1` : undefined}
                      />
                      <Skeleton
                        variant="text"
                        className={cn(messageTextClasses, 'w-32')}
                        data-testid={dataTestId ? `${dataTestId}-message-${i}-text-2` : undefined}
                      />
                      {/* Assistant messages have 3 lines */}
                      {!isUser && (
                        <Skeleton
                          variant="text"
                          className={cn(messageTextClasses, 'w-40')}
                          data-testid={dataTestId ? `${dataTestId}-message-${i}-text-3` : undefined}
                        />
                      )}
                    </Box>

                    {/* User avatar on right */}
                    {isUser && (
                      <Skeleton
                        variant="circular"
                        width={messageAvatarDimensions.width}
                        height={messageAvatarDimensions.height}
                        data-testid={dataTestId ? `${dataTestId}-message-${i}-avatar` : undefined}
                      />
                    )}
                  </Box>
                );
              })}
            </Box>
          </Box>

          {/* Input area */}
          {showInput && (
            <Box
              className={cn('border-t border-[rgb(var(--border))]', inputPaddingClasses)}
              data-testid={dataTestId ? `${dataTestId}-input` : undefined}
            >
              <Skeleton
                className={cn(inputClasses, 'w-full rounded-xl')}
                data-testid={dataTestId ? `${dataTestId}-input-field` : undefined}
              />
            </Box>
          )}
        </Box>

        {/* Steps panel */}
        {showStepsPanel && (
          <Box
            className={cn(
              'border-l border-[rgb(var(--border))] bg-[rgb(var(--card))]',
              stepsPanelWidthClasses,
              stepsPanelPaddingClasses
            )}
            data-testid={dataTestId ? `${dataTestId}-steps-panel` : undefined}
          >
            {/* Steps header */}
            <Box
              className={cn('flex items-center justify-between', stepsHeaderClasses)}
              data-testid={dataTestId ? `${dataTestId}-steps-header` : undefined}
            >
              <Skeleton
                variant="text"
                className={stepsTitleClasses}
                data-testid={dataTestId ? `${dataTestId}-steps-title` : undefined}
              />
              <Skeleton
                className={cn(stepsActionClasses, 'rounded-md')}
                data-testid={dataTestId ? `${dataTestId}-steps-action` : undefined}
              />
            </Box>

            {/* Steps list */}
            <Box
              className={stepsGapClasses}
              data-testid={dataTestId ? `${dataTestId}-steps-list` : undefined}
            >
              {Array.from({ length: stepCount }).map((_, i) => (
                <Box
                  key={`skeleton-step-${i}`}
                  className={cn(
                    'rounded-lg border border-[rgb(var(--border))]',
                    stepItemPaddingClasses
                  )}
                  data-testid={dataTestId ? `${dataTestId}-step-${i}` : undefined}
                >
                  {/* Step header */}
                  <Box className={cn('flex items-center', stepHeaderGapClasses)}>
                    <Skeleton
                      variant="circular"
                      width={stepNumberDimensions.width}
                      height={stepNumberDimensions.height}
                      data-testid={dataTestId ? `${dataTestId}-step-${i}-number` : undefined}
                    />
                    <Skeleton
                      variant="text"
                      className={stepTitleClasses}
                      data-testid={dataTestId ? `${dataTestId}-step-${i}-title` : undefined}
                    />
                  </Box>
                  {/* Step description */}
                  <Skeleton
                    variant="text"
                    className={cn(stepDescriptionClasses, 'w-full')}
                    data-testid={dataTestId ? `${dataTestId}-step-${i}-description` : undefined}
                  />
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </Box>
    );
  }
);

SkeletonTaskDetail.displayName = 'SkeletonTaskDetail';
