/**
 * SkeletonChat Storybook Stories
 *
 * Comprehensive stories demonstrating the SkeletonChat molecule's capabilities:
 * - Basic usage with different message counts
 * - Size variants (sm, md, lg)
 * - Responsive sizing
 * - Accessibility features
 * - Real-world usage examples
 */

import { cn } from '@openflow/utils';
import type { Meta, StoryObj } from '@storybook/react';
import { useEffect, useRef, useState } from 'react';
import {
  DEFAULT_MESSAGE_COUNT,
  SKELETON_AVATAR_DIMENSIONS,
  SKELETON_BUBBLE_CLASSES,
  SKELETON_CHAT_BASE_CLASSES,
  SKELETON_CHAT_GAP_CLASSES,
  SKELETON_CHAT_PADDING_CLASSES,
  SKELETON_TEXT_HEIGHT_CLASSES,
  SkeletonChat,
} from './SkeletonChat';

const meta: Meta<typeof SkeletonChat> = {
  title: 'Molecules/SkeletonChat',
  component: SkeletonChat,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Loading placeholder for chat panels. Renders alternating message bubbles to simulate a chat conversation loading state.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    messageCount: {
      control: { type: 'number', min: 1, max: 10 },
      description: 'Number of skeleton messages to render',
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
      description: 'Size variant for the skeleton chat',
    },
    className: {
      control: { type: 'text' },
      description: 'Additional CSS classes',
    },
    'data-testid': {
      control: { type: 'text' },
      description: 'Data attribute for testing',
    },
  },
};

export default meta;
type Story = StoryObj<typeof SkeletonChat>;

// =============================================================================
// BASIC EXAMPLES
// =============================================================================

/** Default chat skeleton with 3 messages */
export const Default: Story = {
  render: () => (
    <div className="w-[500px] rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--background))]">
      <SkeletonChat />
    </div>
  ),
};

/** Single message skeleton - minimal loading state */
export const SingleMessage: Story = {
  render: () => (
    <div className="w-[500px] rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--background))]">
      <SkeletonChat messageCount={1} />
    </div>
  ),
};

/** Two messages - a quick exchange */
export const TwoMessages: Story = {
  render: () => (
    <div className="w-[500px] rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--background))]">
      <SkeletonChat messageCount={2} />
    </div>
  ),
};

/** Extended conversation with 5 messages */
export const FiveMessages: Story = {
  render: () => (
    <div className="w-[500px] rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--background))]">
      <SkeletonChat messageCount={5} />
    </div>
  ),
};

/** Many messages for long conversation loading */
export const ManyMessages: Story = {
  render: () => (
    <div className="w-[500px] max-h-[400px] overflow-y-auto rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--background))]">
      <SkeletonChat messageCount={8} />
    </div>
  ),
};

// =============================================================================
// SIZE VARIANTS
// =============================================================================

/** Small size - compact layout for mobile or sidebar */
export const SizeSmall: Story = {
  render: () => (
    <div className="w-[400px] rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--background))]">
      <SkeletonChat size="sm" />
    </div>
  ),
};

/** Medium size - default, balanced layout */
export const SizeMedium: Story = {
  render: () => (
    <div className="w-[500px] rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--background))]">
      <SkeletonChat size="md" />
    </div>
  ),
};

/** Large size - spacious layout for desktop */
export const SizeLarge: Story = {
  render: () => (
    <div className="w-[600px] rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--background))]">
      <SkeletonChat size="lg" />
    </div>
  ),
};

/** All sizes side by side for comparison */
export const AllSizes: Story = {
  render: () => (
    <div className="flex gap-6">
      <div className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--background))]">
        <div className="border-b border-[rgb(var(--border))] p-2 text-center text-sm font-medium">
          Small
        </div>
        <div className="w-[300px]">
          <SkeletonChat size="sm" messageCount={2} />
        </div>
      </div>
      <div className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--background))]">
        <div className="border-b border-[rgb(var(--border))] p-2 text-center text-sm font-medium">
          Medium
        </div>
        <div className="w-[400px]">
          <SkeletonChat size="md" messageCount={2} />
        </div>
      </div>
      <div className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--background))]">
        <div className="border-b border-[rgb(var(--border))] p-2 text-center text-sm font-medium">
          Large
        </div>
        <div className="w-[500px]">
          <SkeletonChat size="lg" messageCount={2} />
        </div>
      </div>
    </div>
  ),
};

// =============================================================================
// RESPONSIVE SIZING
// =============================================================================

/** Responsive size - adapts from sm on mobile to lg on desktop */
export const ResponsiveSizing: Story = {
  render: () => (
    <div className="w-full max-w-[600px] rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--background))]">
      <div className="border-b border-[rgb(var(--border))] p-2 text-center text-sm">
        Resize viewport to see size change: sm → md → lg
      </div>
      <SkeletonChat size={{ base: 'sm', md: 'md', lg: 'lg' }} />
    </div>
  ),
};

/** Responsive with many messages */
export const ResponsiveExtended: Story = {
  render: () => (
    <div className="w-full max-w-[600px] max-h-[400px] overflow-y-auto rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--background))]">
      <SkeletonChat size={{ base: 'sm', sm: 'md', lg: 'lg' }} messageCount={6} />
    </div>
  ),
};

// =============================================================================
// USAGE CONTEXTS
// =============================================================================

/** In chat panel context with header */
export const InChatPanelContext: Story = {
  render: () => (
    <div className="w-[500px] rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--background))]">
      {/* Chat header */}
      <div className="flex items-center gap-3 border-b border-[rgb(var(--border))] p-4">
        <div className="h-10 w-10 rounded-full bg-[rgb(var(--muted))]" />
        <div className="flex-1">
          <div className="h-4 w-32 rounded bg-[rgb(var(--muted))]" />
          <div className="mt-1 h-3 w-20 rounded bg-[rgb(var(--muted))]" />
        </div>
      </div>

      {/* Chat messages */}
      <SkeletonChat />

      {/* Chat input */}
      <div className="border-t border-[rgb(var(--border))] p-4">
        <div className="h-10 w-full rounded-lg bg-[rgb(var(--muted))]" />
      </div>
    </div>
  ),
};

/** Full page loading with sidebar */
export const FullPageLoading: Story = {
  render: () => (
    <div className="flex h-[500px] w-[800px] rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--background))]">
      {/* Sidebar */}
      <div className="w-64 border-r border-[rgb(var(--border))] p-4">
        <div className="mb-4 h-8 w-full rounded bg-[rgb(var(--muted))]" />
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 w-full rounded bg-[rgb(var(--muted))]" />
          ))}
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex flex-1 flex-col">
        <div className="border-b border-[rgb(var(--border))] p-4">
          <div className="h-6 w-48 rounded bg-[rgb(var(--muted))]" />
        </div>
        <div className="flex-1 overflow-y-auto">
          <SkeletonChat messageCount={5} />
        </div>
        <div className="border-t border-[rgb(var(--border))] p-4">
          <div className="h-12 w-full rounded-lg bg-[rgb(var(--muted))]" />
        </div>
      </div>
    </div>
  ),
};

/** In scrollable container with many messages */
export const InScrollableContainer: Story = {
  render: () => (
    <div className="w-[500px]">
      <p className="mb-2 text-sm text-[rgb(var(--muted-foreground))]">
        Scrollable container with many skeleton messages:
      </p>
      <div className="h-[300px] overflow-y-auto rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--background))]">
        <SkeletonChat messageCount={10} />
      </div>
    </div>
  ),
};

/** Mobile view simulation */
export const MobileView: Story = {
  render: () => (
    <div className="w-[320px] h-[568px] rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--background))] overflow-hidden">
      {/* Mobile header */}
      <div className="flex items-center gap-2 border-b border-[rgb(var(--border))] p-3">
        <div className="h-8 w-8 rounded-full bg-[rgb(var(--muted))]" />
        <div className="flex-1">
          <div className="h-4 w-24 rounded bg-[rgb(var(--muted))]" />
        </div>
        <div className="h-6 w-6 rounded bg-[rgb(var(--muted))]" />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto h-[calc(100%-120px)]">
        <SkeletonChat size="sm" messageCount={4} />
      </div>

      {/* Mobile input */}
      <div className="border-t border-[rgb(var(--border))] p-2 flex gap-2">
        <div className="h-9 flex-1 rounded-full bg-[rgb(var(--muted))]" />
        <div className="h-9 w-9 rounded-full bg-[rgb(var(--muted))]" />
      </div>
    </div>
  ),
};

// =============================================================================
// ACCESSIBILITY DEMOS
// =============================================================================

/** Accessibility demonstration */
export const AccessibilityDemo: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
        <h3 className="mb-4 text-lg font-semibold">Accessibility Features</h3>
        <ul className="list-inside list-disc space-y-2 text-sm text-[rgb(var(--muted-foreground))]">
          <li>
            <code>aria-hidden={true}</code> - Hidden from screen readers (decorative)
          </li>
          <li>
            <code>role="presentation"</code> - Indicates decorative purpose
          </li>
          <li>Uses Skeleton atom with consistent pulse animation</li>
          <li>
            Respects <code>prefers-reduced-motion</code> via motion-safe
          </li>
          <li>data-testid support for automated testing</li>
          <li>data-message-type on each message (user/assistant)</li>
        </ul>
      </div>

      <div className="w-[500px] rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--background))]">
        <SkeletonChat data-testid="demo-skeleton-chat" />
      </div>
    </div>
  ),
};

/** Reduced motion demonstration */
export const ReducedMotionDemo: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
        <h3 className="mb-2 text-lg font-semibold">Reduced Motion Support</h3>
        <p className="text-sm text-[rgb(var(--muted-foreground))]">
          The skeleton pulse animation uses <code>motion-safe:</code> prefix, so it will be disabled
          for users with <code>prefers-reduced-motion: reduce</code> set in their system
          preferences.
        </p>
      </div>

      <div className="w-[500px] rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--background))]">
        <SkeletonChat />
      </div>
    </div>
  ),
};

// =============================================================================
// REF FORWARDING AND DATA ATTRIBUTES
// =============================================================================

/** forwardRef demonstration */
export const RefForwarding: Story = {
  render: function RefForwardingExample() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);

    useEffect(() => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    }, []);

    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
          <h3 className="mb-2 font-medium">Ref Forwarding Demo</h3>
          <p className="text-sm text-[rgb(var(--muted-foreground))]">
            Container dimensions:{' '}
            {dimensions ? `${dimensions.width}x${dimensions.height}px` : 'Measuring...'}
          </p>
        </div>

        <div className="w-[500px] rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--background))]">
          <SkeletonChat ref={containerRef} />
        </div>
      </div>
    );
  },
};

/** data-testid demonstration */
export const DataTestId: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
        <h3 className="mb-2 font-medium">data-testid Demo</h3>
        <p className="text-sm text-[rgb(var(--muted-foreground))]">
          Inspect the DOM to see the data-testid attributes on messages and their children.
        </p>
        <pre className="mt-2 rounded bg-[rgb(var(--muted))] p-2 text-xs overflow-x-auto">
          {`data-testid="chat-skeleton" (container)
data-testid="chat-skeleton-message-0" (first message)
data-testid="chat-skeleton-message-0-avatar"
data-testid="chat-skeleton-message-0-bubble"
data-testid="chat-skeleton-message-0-text-1"
...`}
        </pre>
      </div>

      <div className="w-[500px] rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--background))]">
        <SkeletonChat data-testid="chat-skeleton" messageCount={2} />
      </div>
    </div>
  ),
};

// =============================================================================
// REAL-WORLD EXAMPLES
// =============================================================================

/** Chat panel loading state during initial fetch */
export const ChatPanelLoading: Story = {
  render: () => (
    <div className="w-[500px] h-[500px] flex flex-col rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--background))]">
      {/* Header with back button and contact info */}
      <div className="flex items-center gap-3 border-b border-[rgb(var(--border))] p-4">
        <button
          type="button"
          className="h-8 w-8 rounded-full bg-[rgb(var(--muted))] hover:bg-[rgb(var(--muted))]/80"
          aria-label="Go back"
        />
        <div className="h-10 w-10 rounded-full bg-[rgb(var(--muted))]" />
        <div className="flex-1">
          <div className="text-sm font-medium">Loading chat...</div>
          <div className="text-xs text-[rgb(var(--muted-foreground))]">Please wait</div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        <SkeletonChat messageCount={4} />
      </div>

      {/* Input area */}
      <div className="border-t border-[rgb(var(--border))] p-4">
        <div className="flex items-center gap-2">
          <div className="h-10 flex-1 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--muted))]" />
          <div className="h-10 w-10 rounded-lg bg-[rgb(var(--primary))] opacity-50" />
        </div>
      </div>
    </div>
  ),
};

/** AI assistant chat loading */
export const AIAssistantLoading: Story = {
  render: () => (
    <div className="w-[600px] h-[500px] flex flex-col rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--background))]">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-[rgb(var(--border))] p-4 bg-gradient-to-r from-[rgb(var(--primary))]/5 to-transparent">
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[rgb(var(--primary))] to-[rgb(var(--primary))]/50 flex items-center justify-center">
          <span className="text-lg">AI</span>
        </div>
        <div className="flex-1">
          <div className="font-medium">AI Assistant</div>
          <div className="text-sm text-[rgb(var(--muted-foreground))]">Loading conversation...</div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <SkeletonChat size="lg" messageCount={3} />
      </div>

      {/* Input */}
      <div className="border-t border-[rgb(var(--border))] p-4">
        <div className="flex items-end gap-3">
          <div className="flex-1 min-h-[44px] rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--muted))]" />
          <div className="h-10 w-10 rounded-lg bg-[rgb(var(--primary))] opacity-50" />
        </div>
      </div>
    </div>
  ),
};

/** Loading transition demonstration */
export const LoadingTransitionDemo: Story = {
  render: function LoadingTransition() {
    const [isLoading, setIsLoading] = useState(true);

    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setIsLoading(!isLoading)}
          className="rounded-md bg-[rgb(var(--primary))] px-4 py-2 text-sm text-[rgb(var(--primary-foreground))] hover:bg-[rgb(var(--primary))]/90"
        >
          Toggle Loading State
        </button>

        <div className="w-[500px] rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--background))]">
          {isLoading ? (
            <SkeletonChat />
          ) : (
            <div className="flex flex-col gap-4 p-4">
              {/* Assistant message */}
              <div className="flex gap-3 justify-start">
                <div className="h-8 w-8 rounded-full bg-[rgb(var(--primary))] flex items-center justify-center text-xs text-[rgb(var(--primary-foreground))]">
                  AI
                </div>
                <div className="max-w-[70%] rounded-lg bg-[rgb(var(--muted))] p-3">
                  <p className="text-sm">Hello! How can I help you today?</p>
                </div>
              </div>
              {/* User message */}
              <div className="flex gap-3 justify-end">
                <div className="max-w-[70%] rounded-lg bg-[rgb(var(--primary))]/10 p-3">
                  <p className="text-sm">I have a question about the project.</p>
                </div>
                <div className="h-8 w-8 rounded-full bg-[rgb(var(--muted))] flex items-center justify-center text-xs">
                  U
                </div>
              </div>
              {/* Assistant message */}
              <div className="flex gap-3 justify-start">
                <div className="h-8 w-8 rounded-full bg-[rgb(var(--primary))] flex items-center justify-center text-xs text-[rgb(var(--primary-foreground))]">
                  AI
                </div>
                <div className="max-w-[70%] rounded-lg bg-[rgb(var(--muted))] p-3">
                  <p className="text-sm">
                    Of course! I would be happy to help. What would you like to know about the
                    project?
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  },
};

/** Multiple chat skeletons in a list */
export const ChatListLoading: Story = {
  render: () => (
    <div className="w-[800px] flex gap-4">
      {/* Chat list sidebar */}
      <div className="w-64 space-y-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--background))] p-4">
        <div className="h-10 w-full rounded-lg bg-[rgb(var(--muted))]" />
        <div className="space-y-2 mt-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'flex items-center gap-3 rounded-lg p-3',
                i === 0 && 'bg-[rgb(var(--muted))]'
              )}
            >
              <div className="h-10 w-10 rounded-full bg-[rgb(var(--muted))]" />
              <div className="flex-1 space-y-1">
                <div className="h-4 w-24 rounded bg-[rgb(var(--muted))]" />
                <div className="h-3 w-32 rounded bg-[rgb(var(--muted))]" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selected chat loading */}
      <div className="flex-1 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--background))]">
        <div className="flex items-center gap-3 border-b border-[rgb(var(--border))] p-4">
          <div className="h-10 w-10 rounded-full bg-[rgb(var(--muted))]" />
          <div className="flex-1">
            <div className="h-4 w-32 rounded bg-[rgb(var(--muted))]" />
            <div className="mt-1 h-3 w-20 rounded bg-[rgb(var(--muted))]" />
          </div>
        </div>
        <SkeletonChat messageCount={4} />
      </div>
    </div>
  ),
};

// =============================================================================
// CONSTANTS AND UTILITIES REFERENCE
// =============================================================================

/** Reference for exported constants and utilities */
export const ConstantsReference: Story = {
  render: () => (
    <div className="max-w-3xl space-y-6">
      <div className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
        <h3 className="mb-4 text-lg font-semibold">Exported Constants</h3>

        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium">DEFAULT_MESSAGE_COUNT</h4>
            <pre className="mt-1 rounded bg-[rgb(var(--muted))] p-2 text-xs">
              {JSON.stringify(DEFAULT_MESSAGE_COUNT, null, 2)}
            </pre>
          </div>

          <div>
            <h4 className="text-sm font-medium">SKELETON_CHAT_BASE_CLASSES</h4>
            <pre className="mt-1 rounded bg-[rgb(var(--muted))] p-2 text-xs">
              {JSON.stringify(SKELETON_CHAT_BASE_CLASSES, null, 2)}
            </pre>
          </div>

          <div>
            <h4 className="text-sm font-medium">SKELETON_CHAT_PADDING_CLASSES</h4>
            <pre className="mt-1 rounded bg-[rgb(var(--muted))] p-2 text-xs">
              {JSON.stringify(SKELETON_CHAT_PADDING_CLASSES, null, 2)}
            </pre>
          </div>

          <div>
            <h4 className="text-sm font-medium">SKELETON_CHAT_GAP_CLASSES</h4>
            <pre className="mt-1 rounded bg-[rgb(var(--muted))] p-2 text-xs">
              {JSON.stringify(SKELETON_CHAT_GAP_CLASSES, null, 2)}
            </pre>
          </div>

          <div>
            <h4 className="text-sm font-medium">SKELETON_BUBBLE_CLASSES</h4>
            <pre className="mt-1 rounded bg-[rgb(var(--muted))] p-2 text-xs">
              {JSON.stringify(SKELETON_BUBBLE_CLASSES, null, 2)}
            </pre>
          </div>

          <div>
            <h4 className="text-sm font-medium">SKELETON_AVATAR_DIMENSIONS</h4>
            <pre className="mt-1 rounded bg-[rgb(var(--muted))] p-2 text-xs">
              {JSON.stringify(SKELETON_AVATAR_DIMENSIONS, null, 2)}
            </pre>
          </div>

          <div>
            <h4 className="text-sm font-medium">SKELETON_TEXT_HEIGHT_CLASSES</h4>
            <pre className="mt-1 rounded bg-[rgb(var(--muted))] p-2 text-xs">
              {JSON.stringify(SKELETON_TEXT_HEIGHT_CLASSES, null, 2)}
            </pre>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
        <h3 className="mb-4 text-lg font-semibold">Exported Utility Functions</h3>

        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium">getBaseSize(size)</h4>
            <p className="mt-1 text-xs text-[rgb(var(--muted-foreground))]">
              Extracts the base size from a responsive value
            </p>
            <pre className="mt-1 rounded bg-[rgb(var(--muted))] p-2 text-xs">
              {`getBaseSize('md') // 'md'
getBaseSize({ base: 'sm', md: 'lg' }) // 'sm'`}
            </pre>
          </div>

          <div>
            <h4 className="text-sm font-medium">getResponsiveSizeClasses(size, classMap)</h4>
            <p className="mt-1 text-xs text-[rgb(var(--muted-foreground))]">
              Generates responsive Tailwind classes from a class map
            </p>
            <pre className="mt-1 rounded bg-[rgb(var(--muted))] p-2 text-xs">
              {`getResponsiveSizeClasses('md', SKELETON_CHAT_PADDING_CLASSES)
// 'p-4'

getResponsiveSizeClasses(
  { base: 'sm', md: 'lg' },
  SKELETON_CHAT_PADDING_CLASSES
)
// 'p-3 md:p-5'`}
            </pre>
          </div>

          <div>
            <h4 className="text-sm font-medium">getAvatarDimensions(size)</h4>
            <p className="mt-1 text-xs text-[rgb(var(--muted-foreground))]">
              Returns avatar width/height for a given size
            </p>
            <pre className="mt-1 rounded bg-[rgb(var(--muted))] p-2 text-xs">
              {`getAvatarDimensions('sm') // { width: 28, height: 28 }
getAvatarDimensions('md') // { width: 32, height: 32 }
getAvatarDimensions('lg') // { width: 40, height: 40 }`}
            </pre>
          </div>
        </div>
      </div>

      <div className="w-[500px] rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--background))]">
        <SkeletonChat />
      </div>
    </div>
  ),
};
