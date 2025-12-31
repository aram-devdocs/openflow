/**
 * SkeletonChat Molecule - Loading placeholder for chat panel
 *
 * Provides visual loading indication while chat messages are being fetched.
 * Renders alternating message bubbles to simulate a chat conversation loading state.
 *
 * Features:
 * - Uses Skeleton atom for consistent loading placeholders
 * - Responsive sizing support via ResponsiveValue
 * - Properly hidden from screen readers (aria-hidden="true")
 * - forwardRef support for ref forwarding
 * - data-testid support for testing
 * - Alternating left (assistant) and right (user) message layouts
 */

import type { Breakpoint, ResponsiveValue } from '@openflow/primitives';
import { cn } from '@openflow/utils';
import { type HTMLAttributes, forwardRef } from 'react';
import { Skeleton } from '../atoms/Skeleton';

/** Skeleton chat size variants */
export type SkeletonChatSize = 'sm' | 'md' | 'lg';

/** Breakpoint names for responsive values - re-exported for convenience */
export type SkeletonChatBreakpoint = Breakpoint;

/**
 * SkeletonChat component props
 */
export interface SkeletonChatProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Number of skeleton messages to render */
  messageCount?: number;
  /**
   * Size variant for the skeleton chat
   * - 'sm': Compact spacing (12px padding, smaller bubbles)
   * - 'md': Standard spacing (16px padding) - default
   * - 'lg': Larger spacing (20px padding, larger bubbles)
   */
  size?: ResponsiveValue<SkeletonChatSize>;
  /** Data attribute for testing */
  'data-testid'?: string;
}

/** Default number of skeleton messages */
export const DEFAULT_MESSAGE_COUNT = 3;

/** Base classes for the skeleton chat container */
export const SKELETON_CHAT_BASE_CLASSES = 'flex flex-col';

/** Size-specific classes for container padding */
export const SKELETON_CHAT_PADDING_CLASSES: Record<SkeletonChatSize, string> = {
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
};

/** Size-specific classes for message gap */
export const SKELETON_CHAT_GAP_CLASSES: Record<SkeletonChatSize, string> = {
  sm: 'gap-3',
  md: 'gap-4',
  lg: 'gap-5',
};

/** Size-specific classes for bubble gap (between avatar and bubble) */
export const SKELETON_BUBBLE_GAP_CLASSES: Record<SkeletonChatSize, string> = {
  sm: 'gap-2',
  md: 'gap-3',
  lg: 'gap-4',
};

/** Size-specific avatar dimensions */
export const SKELETON_AVATAR_DIMENSIONS: Record<
  SkeletonChatSize,
  { width: number; height: number }
> = {
  sm: { width: 28, height: 28 },
  md: { width: 32, height: 32 },
  lg: { width: 40, height: 40 },
};

/** Size-specific classes for message bubble container */
export const SKELETON_BUBBLE_CLASSES: Record<SkeletonChatSize, string> = {
  sm: 'max-w-[65%] rounded-md p-2',
  md: 'max-w-[70%] rounded-lg p-3',
  lg: 'max-w-[75%] rounded-xl p-4',
};

/** Size-specific classes for bubble internal spacing */
export const SKELETON_BUBBLE_SPACING_CLASSES: Record<SkeletonChatSize, string> = {
  sm: 'space-y-1.5',
  md: 'space-y-2',
  lg: 'space-y-2.5',
};

/** Size-specific classes for text line heights */
export const SKELETON_TEXT_HEIGHT_CLASSES: Record<SkeletonChatSize, string> = {
  sm: 'h-3',
  md: 'h-4',
  lg: 'h-5',
};

/** User message width variants (shorter messages) */
export const SKELETON_USER_PRIMARY_WIDTH_CLASSES: Record<SkeletonChatSize, string> = {
  sm: 'w-28',
  md: 'w-32',
  lg: 'w-36',
};

export const SKELETON_USER_SECONDARY_WIDTH_CLASSES: Record<SkeletonChatSize, string> = {
  sm: 'w-20',
  md: 'w-24',
  lg: 'w-28',
};

/** Assistant message width variants (longer messages) */
export const SKELETON_ASSISTANT_PRIMARY_WIDTH_CLASSES: Record<SkeletonChatSize, string> = {
  sm: 'w-40',
  md: 'w-48',
  lg: 'w-56',
};

export const SKELETON_ASSISTANT_SECONDARY_WIDTH_CLASSES: Record<SkeletonChatSize, string> = {
  sm: 'w-28',
  md: 'w-32',
  lg: 'w-40',
};

export const SKELETON_ASSISTANT_TERTIARY_WIDTH_CLASSES: Record<SkeletonChatSize, string> = {
  sm: 'w-32',
  md: 'w-40',
  lg: 'w-48',
};

/** Breakpoint order for responsive values */
const BREAKPOINT_ORDER: Breakpoint[] = ['base', 'sm', 'md', 'lg', 'xl', '2xl'];

/** Type for responsive size object */
type ResponsiveSizeObject = Partial<Record<Breakpoint, SkeletonChatSize>>;

/**
 * Check if value is a responsive object (not a string size)
 */
function isResponsiveObject(
  value: ResponsiveValue<SkeletonChatSize>
): value is ResponsiveSizeObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Get base size from responsive value
 */
export function getBaseSize(size: ResponsiveValue<SkeletonChatSize>): SkeletonChatSize {
  if (!isResponsiveObject(size)) {
    return size;
  }
  return size.base ?? 'md';
}

/**
 * Get responsive size classes for a given class map
 */
export function getResponsiveSizeClasses(
  size: ResponsiveValue<SkeletonChatSize>,
  classMap: Record<SkeletonChatSize, string>
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
 * Get avatar dimensions based on size (uses base size for responsive objects)
 */
export function getAvatarDimensions(size: ResponsiveValue<SkeletonChatSize>): {
  width: number;
  height: number;
} {
  const baseSize = getBaseSize(size);
  return SKELETON_AVATAR_DIMENSIONS[baseSize];
}

/**
 * Props for a single skeleton message
 */
interface SkeletonMessageProps {
  /** Whether this is a user message (right side) or assistant (left side) */
  isUser: boolean;
  /** Size variant */
  size: ResponsiveValue<SkeletonChatSize>;
  /** Message index for stable keys */
  index: number;
  /** Optional data-testid prefix */
  testIdPrefix?: string;
}

/**
 * Single skeleton chat message
 */
function SkeletonMessage({ isUser, size, index, testIdPrefix }: SkeletonMessageProps) {
  const bubbleGapClasses = getResponsiveSizeClasses(size, SKELETON_BUBBLE_GAP_CLASSES);
  const bubbleClasses = getResponsiveSizeClasses(size, SKELETON_BUBBLE_CLASSES);
  const bubbleSpacingClasses = getResponsiveSizeClasses(size, SKELETON_BUBBLE_SPACING_CLASSES);
  const textHeightClasses = getResponsiveSizeClasses(size, SKELETON_TEXT_HEIGHT_CLASSES);
  const avatarDimensions = getAvatarDimensions(size);

  // Different widths for user vs assistant
  const primaryWidthClasses = isUser
    ? getResponsiveSizeClasses(size, SKELETON_USER_PRIMARY_WIDTH_CLASSES)
    : getResponsiveSizeClasses(size, SKELETON_ASSISTANT_PRIMARY_WIDTH_CLASSES);
  const secondaryWidthClasses = isUser
    ? getResponsiveSizeClasses(size, SKELETON_USER_SECONDARY_WIDTH_CLASSES)
    : getResponsiveSizeClasses(size, SKELETON_ASSISTANT_SECONDARY_WIDTH_CLASSES);
  const tertiaryWidthClasses = getResponsiveSizeClasses(
    size,
    SKELETON_ASSISTANT_TERTIARY_WIDTH_CLASSES
  );

  const baseTestId = testIdPrefix ? `${testIdPrefix}-message-${index}` : undefined;

  return (
    <div
      className={cn('flex', bubbleGapClasses, isUser ? 'justify-end' : 'justify-start')}
      data-testid={baseTestId}
      data-message-type={isUser ? 'user' : 'assistant'}
    >
      {/* Assistant avatar on left */}
      {!isUser && (
        <Skeleton
          variant="circular"
          width={avatarDimensions.width}
          height={avatarDimensions.height}
          data-testid={baseTestId ? `${baseTestId}-avatar` : undefined}
        />
      )}

      {/* Message bubble */}
      <div
        className={cn(
          bubbleClasses,
          bubbleSpacingClasses,
          isUser ? 'bg-[rgb(var(--primary))]/10' : 'bg-[rgb(var(--muted))]'
        )}
        data-testid={baseTestId ? `${baseTestId}-bubble` : undefined}
      >
        <Skeleton
          variant="text"
          className={cn(textHeightClasses, primaryWidthClasses)}
          data-testid={baseTestId ? `${baseTestId}-text-1` : undefined}
        />
        <Skeleton
          variant="text"
          className={cn(textHeightClasses, secondaryWidthClasses)}
          data-testid={baseTestId ? `${baseTestId}-text-2` : undefined}
        />
        {/* Assistant messages have 3 lines */}
        {!isUser && (
          <Skeleton
            variant="text"
            className={cn(textHeightClasses, tertiaryWidthClasses)}
            data-testid={baseTestId ? `${baseTestId}-text-3` : undefined}
          />
        )}
      </div>

      {/* User avatar on right */}
      {isUser && (
        <Skeleton
          variant="circular"
          width={avatarDimensions.width}
          height={avatarDimensions.height}
          data-testid={baseTestId ? `${baseTestId}-avatar` : undefined}
        />
      )}
    </div>
  );
}

/**
 * SkeletonChat - Loading placeholder for chat panel
 *
 * Renders alternating message bubbles to simulate a chat loading state.
 * Matches the ChatPanel message structure with avatars and varying bubble widths.
 *
 * @example
 * // Default 3 messages with medium size
 * <SkeletonChat />
 *
 * @example
 * // Custom message count
 * <SkeletonChat messageCount={5} />
 *
 * @example
 * // Small size variant
 * <SkeletonChat size="sm" />
 *
 * @example
 * // Responsive sizing
 * <SkeletonChat size={{ base: 'sm', md: 'md', lg: 'lg' }} />
 */
export const SkeletonChat = forwardRef<HTMLDivElement, SkeletonChatProps>(function SkeletonChat(
  {
    messageCount = DEFAULT_MESSAGE_COUNT,
    size = 'md',
    className,
    'data-testid': dataTestId,
    ...props
  },
  ref
) {
  const paddingClasses = getResponsiveSizeClasses(size, SKELETON_CHAT_PADDING_CLASSES);
  const gapClasses = getResponsiveSizeClasses(size, SKELETON_CHAT_GAP_CLASSES);

  return (
    <div
      ref={ref}
      className={cn(SKELETON_CHAT_BASE_CLASSES, paddingClasses, gapClasses, className)}
      aria-hidden={true}
      role="presentation"
      data-testid={dataTestId}
      data-message-count={messageCount}
      data-size={typeof size === 'string' ? size : 'responsive'}
      {...props}
    >
      {Array.from({ length: messageCount }).map((_, index) => {
        // Alternate between assistant (even) and user (odd) messages
        const isUser = index % 2 !== 0;
        return (
          <SkeletonMessage
            key={`skeleton-chat-message-${index}`}
            isUser={isUser}
            size={size}
            index={index}
            testIdPrefix={dataTestId}
          />
        );
      })}
    </div>
  );
});

SkeletonChat.displayName = 'SkeletonChat';
