import type { Meta, StoryObj } from '@storybook/react';
import { useRef, useState } from 'react';
import {
  DEFAULT_SKELETON_COUNT,
  DEFAULT_SKELETON_LINES,
  SKELETON_AVATAR_DIMENSIONS,
  SKELETON_ITEM_GAP_CLASSES,
  SKELETON_ITEM_PADDING_CLASSES,
  SKELETON_LIST_BASE_CLASSES,
  SKELETON_LIST_GAP_CLASSES,
  SKELETON_PRIMARY_TEXT_CLASSES,
  SKELETON_SECONDARY_TEXT_CLASSES,
  SKELETON_TERTIARY_TEXT_CLASSES,
  SKELETON_TEXT_GAP_CLASSES,
  SkeletonList,
} from './SkeletonList';

const meta: Meta<typeof SkeletonList> = {
  title: 'Molecules/SkeletonList',
  component: SkeletonList,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
SkeletonList provides a loading placeholder for generic list content.

## Features
- Uses Skeleton atom for consistent loading placeholders
- Responsive sizing support via ResponsiveValue (sm, md, lg)
- Optional avatar/icon placeholders
- Configurable text lines (1, 2, or 3)
- Properly hidden from screen readers (aria-hidden={true}, role="presentation")
- forwardRef support for ref forwarding
- data-testid support for testing

## Accessibility
- \`aria-hidden={true}\` - Decorative loading content hidden from screen readers
- \`role="presentation"\` - Indicates no semantic meaning
- \`motion-safe:animate-pulse\` - Animation respects prefers-reduced-motion

## Usage
\`\`\`tsx
// Default 5 items with avatars
<SkeletonList />

// Custom count without avatars
<SkeletonList count={3} showAvatar={false} />

// Small size with 1 line
<SkeletonList size="sm" lines={1} />

// Responsive sizing
<SkeletonList size={{ base: 'sm', md: 'md', lg: 'lg' }} />
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    count: {
      control: { type: 'number', min: 1, max: 20 },
      description: 'Number of skeleton items to render',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size variant for the skeleton items',
    },
    showAvatar: {
      control: 'boolean',
      description: 'Whether to show avatar/icon for each item',
    },
    lines: {
      control: { type: 'number', min: 1, max: 3 },
      description: 'Number of text lines per item',
    },
  },
};

export default meta;
type Story = StoryObj<typeof SkeletonList>;

// =============================================================================
// Basic Examples
// =============================================================================

/** Default skeleton list with 5 items, avatars, and 2 text lines */
export const Default: Story = {
  render: () => (
    <div className="w-80">
      <SkeletonList />
    </div>
  ),
};

/** List with 3 items */
export const ThreeItems: Story = {
  render: () => (
    <div className="w-80">
      <SkeletonList count={3} />
    </div>
  ),
};

/** Many items for scrollable lists */
export const ManyItems: Story = {
  render: () => (
    <div className="w-80">
      <SkeletonList count={10} />
    </div>
  ),
};

/** Single item loading state */
export const SingleItem: Story = {
  render: () => (
    <div className="w-80">
      <SkeletonList count={1} />
    </div>
  ),
};

// =============================================================================
// Avatar Variations
// =============================================================================

/** List without avatars */
export const NoAvatars: Story = {
  render: () => (
    <div className="w-80">
      <SkeletonList showAvatar={false} />
    </div>
  ),
};

/** Comparison with and without avatars */
export const AvatarComparison: Story = {
  render: () => (
    <div className="flex gap-8">
      <div>
        <p className="mb-2 text-sm font-medium">With Avatars</p>
        <div className="w-80">
          <SkeletonList count={3} showAvatar={true} />
        </div>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">Without Avatars</p>
        <div className="w-80">
          <SkeletonList count={3} showAvatar={false} />
        </div>
      </div>
    </div>
  ),
};

// =============================================================================
// Lines Variations
// =============================================================================

/** Single line items (title only) */
export const SingleLine: Story = {
  render: () => (
    <div className="w-80">
      <SkeletonList lines={1} />
    </div>
  ),
};

/** Two lines (title + subtitle) - default */
export const TwoLines: Story = {
  render: () => (
    <div className="w-80">
      <SkeletonList lines={2} />
    </div>
  ),
};

/** Three lines (title + subtitle + description) */
export const ThreeLines: Story = {
  render: () => (
    <div className="w-80">
      <SkeletonList lines={3} />
    </div>
  ),
};

/** All line variants side by side */
export const AllLineVariants: Story = {
  render: () => (
    <div className="flex gap-8">
      <div>
        <p className="mb-2 text-sm font-medium">1 Line</p>
        <div className="w-64">
          <SkeletonList count={3} lines={1} />
        </div>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">2 Lines</p>
        <div className="w-64">
          <SkeletonList count={3} lines={2} />
        </div>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">3 Lines</p>
        <div className="w-64">
          <SkeletonList count={3} lines={3} />
        </div>
      </div>
    </div>
  ),
};

// =============================================================================
// Size Variants
// =============================================================================

/** Small size variant */
export const SizeSmall: Story = {
  render: () => (
    <div className="w-72">
      <SkeletonList size="sm" count={4} />
    </div>
  ),
};

/** Medium size variant (default) */
export const SizeMedium: Story = {
  render: () => (
    <div className="w-80">
      <SkeletonList size="md" count={4} />
    </div>
  ),
};

/** Large size variant */
export const SizeLarge: Story = {
  render: () => (
    <div className="w-96">
      <SkeletonList size="lg" count={4} />
    </div>
  ),
};

/** All sizes side by side */
export const AllSizes: Story = {
  render: () => (
    <div className="flex gap-8">
      <div>
        <p className="mb-2 text-sm font-medium">Small</p>
        <div className="w-64">
          <SkeletonList size="sm" count={3} />
        </div>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">Medium</p>
        <div className="w-72">
          <SkeletonList size="md" count={3} />
        </div>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">Large</p>
        <div className="w-80">
          <SkeletonList size="lg" count={3} />
        </div>
      </div>
    </div>
  ),
};

// =============================================================================
// Responsive Sizing
// =============================================================================

/** Responsive size - changes across breakpoints */
export const ResponsiveSizing: Story = {
  render: () => (
    <div className="w-full max-w-md">
      <p className="mb-2 text-sm text-[rgb(var(--muted-foreground))]">
        Resize window to see size changes: sm on mobile, md on tablet, lg on desktop
      </p>
      <SkeletonList size={{ base: 'sm', md: 'md', lg: 'lg' }} count={4} />
    </div>
  ),
};

/** Another responsive example with different breakpoints */
export const ResponsiveSizingAlt: Story = {
  render: () => (
    <div className="w-full max-w-lg">
      <p className="mb-2 text-sm text-[rgb(var(--muted-foreground))]">
        sm up to md breakpoint, then lg
      </p>
      <SkeletonList size={{ base: 'sm', md: 'lg' }} count={4} />
    </div>
  ),
};

// =============================================================================
// Usage Contexts
// =============================================================================

/** Skeleton in a sidebar context */
export const InSidebarContext: Story = {
  render: () => (
    <div className="w-64 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
      <div className="mb-3 text-sm font-semibold">Recent Items</div>
      <SkeletonList count={5} size="sm" lines={1} />
    </div>
  ),
};

/** Skeleton in a page list context */
export const InPageListContext: Story = {
  render: () => (
    <div className="w-full max-w-xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-7 w-32 rounded bg-[rgb(var(--muted))]" />
        <div className="h-9 w-24 rounded bg-[rgb(var(--muted))]" />
      </div>
      <div className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
        <SkeletonList count={6} size="md" />
      </div>
    </div>
  ),
};

/** Full page loading state */
export const FullPageLoading: Story = {
  render: () => (
    <div className="w-full max-w-2xl space-y-6">
      <div className="h-8 w-48 rounded bg-[rgb(var(--muted))]" />
      <div className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))]">
        <div className="border-b border-[rgb(var(--border))] p-4">
          <div className="h-5 w-24 rounded bg-[rgb(var(--muted))]" />
        </div>
        <div className="p-4">
          <SkeletonList count={8} />
        </div>
      </div>
    </div>
  ),
};

/** Skeleton in scrollable container */
export const InScrollableContainer: Story = {
  render: () => (
    <div className="h-64 w-80 overflow-y-auto rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-2">
      <SkeletonList count={12} size="sm" />
    </div>
  ),
};

/** Mobile view simulation */
export const MobileView: Story = {
  render: () => (
    <div className="w-72 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--background))] p-4">
      <p className="mb-3 text-sm font-semibold">Notifications</p>
      <SkeletonList count={4} size="sm" lines={2} />
    </div>
  ),
};

// =============================================================================
// Accessibility Demos
// =============================================================================

/** Demonstrates accessibility attributes */
export const AccessibilityDemo: Story = {
  render: () => (
    <div className="space-y-4">
      <p className="text-sm text-[rgb(var(--muted-foreground))]">
        Open DevTools and inspect the skeleton container. It should have:
      </p>
      <ul className="list-inside list-disc text-sm text-[rgb(var(--muted-foreground))]">
        <li>aria-hidden=&quot;true&quot;</li>
        <li>role=&quot;presentation&quot;</li>
        <li>data-count=&quot;3&quot;</li>
        <li>data-size=&quot;md&quot;</li>
        <li>data-show-avatar=&quot;true&quot;</li>
        <li>data-lines=&quot;2&quot;</li>
      </ul>
      <div className="w-80">
        <SkeletonList count={3} data-testid="a11y-demo-skeleton" />
      </div>
    </div>
  ),
};

/** Demonstrates reduced motion support */
export const ReducedMotionDemo: Story = {
  render: () => (
    <div className="space-y-4">
      <p className="text-sm text-[rgb(var(--muted-foreground))]">
        Enable &quot;Reduce motion&quot; in your system preferences to see the animation disabled.
        The skeleton uses <code>motion-safe:animate-pulse</code>.
      </p>
      <div className="w-80">
        <SkeletonList count={3} />
      </div>
    </div>
  ),
};

// =============================================================================
// Ref and Data Attribute Demos
// =============================================================================

/** Demonstrates forwardRef functionality */
export const RefForwarding: Story = {
  render: function RefDemo() {
    const ref = useRef<HTMLDivElement>(null);
    const [message, setMessage] = useState('');

    const handleClick = () => {
      if (ref.current) {
        const itemCount = ref.current.dataset.count;
        const showAvatar = ref.current.dataset.showAvatar;
        setMessage(`Container has ${itemCount} items, showAvatar: ${showAvatar}`);
      }
    };

    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={handleClick}
          className="rounded bg-[rgb(var(--primary))] px-3 py-1.5 text-sm text-[rgb(var(--primary-foreground))]"
        >
          Check Ref
        </button>
        {message && <p className="text-sm text-[rgb(var(--muted-foreground))]">{message}</p>}
        <div className="w-80">
          <SkeletonList ref={ref} count={4} />
        </div>
      </div>
    );
  },
};

/** Demonstrates data-testid attribute */
export const DataTestId: Story = {
  render: () => (
    <div className="space-y-4">
      <p className="text-sm text-[rgb(var(--muted-foreground))]">
        Inspect the DOM to see data-testid attributes on container and items
      </p>
      <div className="w-80">
        <SkeletonList count={3} data-testid="my-skeleton-list" />
      </div>
    </div>
  ),
};

// =============================================================================
// Real-World Examples
// =============================================================================

/** User list loading state */
export const UserListLoading: Story = {
  render: () => (
    <div className="w-full max-w-md space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Team Members</h2>
        <div className="h-9 w-28 rounded bg-[rgb(var(--muted))]" />
      </div>
      <SkeletonList count={5} size="md" lines={2} />
    </div>
  ),
};

/** Chat conversation list loading */
export const ChatListLoading: Story = {
  render: () => (
    <div className="w-72 space-y-2">
      <div className="px-2 text-xs font-semibold uppercase text-[rgb(var(--muted-foreground))]">
        Conversations
      </div>
      <SkeletonList count={6} size="sm" lines={2} />
    </div>
  ),
};

/** Task list loading */
export const TaskListLoading: Story = {
  render: () => (
    <div className="w-full max-w-lg">
      <div className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))]">
        <div className="border-b border-[rgb(var(--border))] px-4 py-3">
          <h3 className="font-medium">Active Tasks</h3>
        </div>
        <div className="divide-y divide-[rgb(var(--border))]">
          <div className="p-4">
            <SkeletonList count={4} showAvatar={false} lines={2} />
          </div>
        </div>
      </div>
    </div>
  ),
};

/** File list loading */
export const FileListLoading: Story = {
  render: () => (
    <div className="w-full max-w-md space-y-3">
      <div className="flex items-center gap-2 text-sm text-[rgb(var(--muted-foreground))]">
        <div className="h-4 w-4 rounded bg-[rgb(var(--muted))]" />
        <span>Files</span>
      </div>
      <SkeletonList count={5} showAvatar={true} size="sm" lines={1} />
    </div>
  ),
};

/** Loading transition demo */
export const LoadingTransitionDemo: Story = {
  render: function TransitionDemo() {
    const [isLoading, setIsLoading] = useState(true);

    const items = [
      { id: 1, name: 'John Doe', email: 'john@example.com' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
      { id: 3, name: 'Bob Johnson', email: 'bob@example.com' },
    ];

    return (
      <div className="w-80 space-y-4">
        <button
          type="button"
          onClick={() => setIsLoading(!isLoading)}
          className="rounded bg-[rgb(var(--primary))] px-3 py-1.5 text-sm text-[rgb(var(--primary-foreground))]"
        >
          Toggle Loading: {isLoading ? 'ON' : 'OFF'}
        </button>
        {isLoading ? (
          <SkeletonList count={3} />
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 rounded-md p-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgb(var(--primary))]">
                  <span className="text-sm font-medium text-[rgb(var(--primary-foreground))]">
                    {item.name[0]}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-[rgb(var(--muted-foreground))]">{item.email}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  },
};

/** Navigation menu loading */
export const NavigationMenuLoading: Story = {
  render: () => (
    <div className="w-56 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-3">
      <SkeletonList count={6} showAvatar={false} size="sm" lines={1} />
    </div>
  ),
};

/** Search results loading */
export const SearchResultsLoading: Story = {
  render: () => (
    <div className="w-full max-w-lg space-y-4">
      <div className="flex gap-2">
        <div className="h-10 flex-1 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--input))]" />
        <div className="h-10 w-20 rounded-lg bg-[rgb(var(--muted))]" />
      </div>
      <p className="text-sm text-[rgb(var(--muted-foreground))]">Searching...</p>
      <SkeletonList count={5} lines={3} />
    </div>
  ),
};

// =============================================================================
// Constants Reference
// =============================================================================

/** Reference for exported constants */
export const ConstantsReference: Story = {
  render: () => (
    <div className="space-y-6 text-sm">
      <div>
        <h3 className="mb-2 font-semibold">Default Values</h3>
        <ul className="space-y-1 text-[rgb(var(--muted-foreground))]">
          <li>DEFAULT_SKELETON_COUNT: {DEFAULT_SKELETON_COUNT}</li>
          <li>DEFAULT_SKELETON_LINES: {DEFAULT_SKELETON_LINES}</li>
        </ul>
      </div>

      <div>
        <h3 className="mb-2 font-semibold">Base Classes</h3>
        <code className="block rounded bg-[rgb(var(--muted))] p-2">
          {SKELETON_LIST_BASE_CLASSES}
        </code>
      </div>

      <div>
        <h3 className="mb-2 font-semibold">Gap Classes (between items)</h3>
        <ul className="space-y-1 text-[rgb(var(--muted-foreground))]">
          <li>sm: {SKELETON_LIST_GAP_CLASSES.sm}</li>
          <li>md: {SKELETON_LIST_GAP_CLASSES.md}</li>
          <li>lg: {SKELETON_LIST_GAP_CLASSES.lg}</li>
        </ul>
      </div>

      <div>
        <h3 className="mb-2 font-semibold">Item Padding Classes</h3>
        <ul className="space-y-1 text-[rgb(var(--muted-foreground))]">
          <li>sm: {SKELETON_ITEM_PADDING_CLASSES.sm}</li>
          <li>md: {SKELETON_ITEM_PADDING_CLASSES.md}</li>
          <li>lg: {SKELETON_ITEM_PADDING_CLASSES.lg}</li>
        </ul>
      </div>

      <div>
        <h3 className="mb-2 font-semibold">Item Gap Classes (avatar to text)</h3>
        <ul className="space-y-1 text-[rgb(var(--muted-foreground))]">
          <li>sm: {SKELETON_ITEM_GAP_CLASSES.sm}</li>
          <li>md: {SKELETON_ITEM_GAP_CLASSES.md}</li>
          <li>lg: {SKELETON_ITEM_GAP_CLASSES.lg}</li>
        </ul>
      </div>

      <div>
        <h3 className="mb-2 font-semibold">Avatar Dimensions (pixels)</h3>
        <ul className="space-y-1 text-[rgb(var(--muted-foreground))]">
          <li>sm: {SKELETON_AVATAR_DIMENSIONS.sm}px</li>
          <li>md: {SKELETON_AVATAR_DIMENSIONS.md}px</li>
          <li>lg: {SKELETON_AVATAR_DIMENSIONS.lg}px</li>
        </ul>
      </div>

      <div>
        <h3 className="mb-2 font-semibold">Text Gap Classes</h3>
        <ul className="space-y-1 text-[rgb(var(--muted-foreground))]">
          <li>sm: {SKELETON_TEXT_GAP_CLASSES.sm}</li>
          <li>md: {SKELETON_TEXT_GAP_CLASSES.md}</li>
          <li>lg: {SKELETON_TEXT_GAP_CLASSES.lg}</li>
        </ul>
      </div>

      <div>
        <h3 className="mb-2 font-semibold">Primary Text Classes</h3>
        <ul className="space-y-1 text-[rgb(var(--muted-foreground))]">
          <li>sm: {SKELETON_PRIMARY_TEXT_CLASSES.sm}</li>
          <li>md: {SKELETON_PRIMARY_TEXT_CLASSES.md}</li>
          <li>lg: {SKELETON_PRIMARY_TEXT_CLASSES.lg}</li>
        </ul>
      </div>

      <div>
        <h3 className="mb-2 font-semibold">Secondary Text Classes</h3>
        <ul className="space-y-1 text-[rgb(var(--muted-foreground))]">
          <li>sm: {SKELETON_SECONDARY_TEXT_CLASSES.sm}</li>
          <li>md: {SKELETON_SECONDARY_TEXT_CLASSES.md}</li>
          <li>lg: {SKELETON_SECONDARY_TEXT_CLASSES.lg}</li>
        </ul>
      </div>

      <div>
        <h3 className="mb-2 font-semibold">Tertiary Text Classes</h3>
        <ul className="space-y-1 text-[rgb(var(--muted-foreground))]">
          <li>sm: {SKELETON_TERTIARY_TEXT_CLASSES.sm}</li>
          <li>md: {SKELETON_TERTIARY_TEXT_CLASSES.md}</li>
          <li>lg: {SKELETON_TERTIARY_TEXT_CLASSES.lg}</li>
        </ul>
      </div>
    </div>
  ),
};
