import type { Meta, StoryObj } from '@storybook/react';
import { useRef } from 'react';
import {
  DEFAULT_SKELETON_COUNT,
  SKELETON_ACTION_BUTTON_CLASSES,
  SKELETON_ARCHIVE_LIST_BASE_CLASSES,
  SKELETON_ARCHIVE_LIST_SIZE_CLASSES,
  SKELETON_ITEM_CONTAINER_CLASSES,
  SKELETON_METADATA_CLASSES,
  SKELETON_SECONDARY_ACTION_CLASSES,
  SKELETON_SECONDARY_METADATA_CLASSES,
  SKELETON_TITLE_CLASSES,
  SkeletonArchiveList,
} from './SkeletonArchiveList';

const meta: Meta<typeof SkeletonArchiveList> = {
  title: 'Molecules/SkeletonArchiveList',
  component: SkeletonArchiveList,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
SkeletonArchiveList is a loading placeholder component that matches the layout of archived items
(ArchivedTaskItem, ArchivedChatItem, ArchivedProjectItem) from ArchivePageComponents.

## Features

- **Uses Skeleton atom**: Built on top of the Skeleton atom for consistent loading placeholders
- **Responsive sizing**: Supports sm, md, lg sizes with responsive breakpoint support
- **Accessibility**: Properly hidden from screen readers with \`aria-hidden={true}\`
- **forwardRef support**: Allows ref forwarding for programmatic access
- **data-testid support**: Enables automated testing

## Usage

\`\`\`tsx
// Default 5 items with medium size
<SkeletonArchiveList />

// Custom count
<SkeletonArchiveList count={3} />

// Small size variant
<SkeletonArchiveList size="sm" />

// Responsive sizing
<SkeletonArchiveList size={{ base: 'sm', md: 'md', lg: 'lg' }} />
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
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: String(DEFAULT_SKELETON_COUNT) },
      },
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
      description: 'Size variant for skeleton items',
      table: {
        type: { summary: "'sm' | 'md' | 'lg' | ResponsiveValue" },
        defaultValue: { summary: 'md' },
      },
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
    'data-testid': {
      control: 'text',
      description: 'Data attribute for testing',
    },
  },
};

export default meta;
type Story = StoryObj<typeof SkeletonArchiveList>;

// =============================================================================
// Basic Examples
// =============================================================================

/** Default archive list skeleton with 5 items and medium size */
export const Default: Story = {
  render: () => (
    <div className="max-w-3xl">
      <SkeletonArchiveList />
    </div>
  ),
};

/** Archive list skeleton with 3 items */
export const ThreeItems: Story = {
  render: () => (
    <div className="max-w-3xl">
      <SkeletonArchiveList count={3} />
    </div>
  ),
};

/** Archive list skeleton with many items */
export const ManyItems: Story = {
  render: () => (
    <div className="max-w-3xl">
      <SkeletonArchiveList count={10} />
    </div>
  ),
};

/** Single archive item skeleton */
export const SingleItem: Story = {
  render: () => (
    <div className="max-w-3xl">
      <SkeletonArchiveList count={1} />
    </div>
  ),
};

// =============================================================================
// Size Variants
// =============================================================================

/** Small size variant - compact spacing */
export const SizeSmall: Story = {
  render: () => (
    <div className="max-w-3xl">
      <SkeletonArchiveList size="sm" count={3} />
    </div>
  ),
};

/** Medium size variant (default) - standard spacing */
export const SizeMedium: Story = {
  render: () => (
    <div className="max-w-3xl">
      <SkeletonArchiveList size="md" count={3} />
    </div>
  ),
};

/** Large size variant - generous spacing */
export const SizeLarge: Story = {
  render: () => (
    <div className="max-w-3xl">
      <SkeletonArchiveList size="lg" count={3} />
    </div>
  ),
};

/** All sizes comparison */
export const AllSizes: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="mb-2 text-sm font-medium text-[rgb(var(--muted-foreground))]">Small</h3>
        <div className="max-w-3xl">
          <SkeletonArchiveList size="sm" count={2} />
        </div>
      </div>
      <div>
        <h3 className="mb-2 text-sm font-medium text-[rgb(var(--muted-foreground))]">
          Medium (default)
        </h3>
        <div className="max-w-3xl">
          <SkeletonArchiveList size="md" count={2} />
        </div>
      </div>
      <div>
        <h3 className="mb-2 text-sm font-medium text-[rgb(var(--muted-foreground))]">Large</h3>
        <div className="max-w-3xl">
          <SkeletonArchiveList size="lg" count={2} />
        </div>
      </div>
    </div>
  ),
};

// =============================================================================
// Responsive Sizing
// =============================================================================

/** Responsive sizing - adapts to screen size */
export const ResponsiveSizing: Story = {
  render: () => (
    <div className="max-w-3xl">
      <p className="mb-4 text-sm text-[rgb(var(--muted-foreground))]">
        Resize the browser to see the skeleton adjust: sm on mobile, md on tablet, lg on desktop
      </p>
      <SkeletonArchiveList size={{ base: 'sm', md: 'md', lg: 'lg' }} count={3} />
    </div>
  ),
};

/** Mobile-first responsive sizing */
export const MobileFirstResponsive: Story = {
  render: () => (
    <div className="max-w-3xl">
      <p className="mb-4 text-sm text-[rgb(var(--muted-foreground))]">
        Small on mobile, grows to large on xl screens
      </p>
      <SkeletonArchiveList size={{ base: 'sm', xl: 'lg' }} count={3} />
    </div>
  ),
};

// =============================================================================
// Usage Contexts
// =============================================================================

/** In a page context with header */
export const InPageContext: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-[rgb(var(--foreground))]">Archived Tasks</h2>
        <span className="text-sm text-[rgb(var(--muted-foreground))]">Loading...</span>
      </div>
      <div className="max-w-3xl">
        <SkeletonArchiveList count={5} />
      </div>
    </div>
  ),
};

/** Full page loading state */
export const FullPageLoading: Story = {
  render: () => (
    <div className="min-h-[400px] rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--background))] p-6">
      <div className="mb-6">
        <div className="h-8 w-32 rounded bg-[rgb(var(--muted))] motion-safe:animate-pulse" />
        <div className="mt-2 h-4 w-48 rounded bg-[rgb(var(--muted))] motion-safe:animate-pulse" />
      </div>
      <SkeletonArchiveList count={7} />
    </div>
  ),
};

/** In scrollable container */
export const InScrollableContainer: Story = {
  render: () => (
    <div className="max-h-[400px] overflow-auto rounded-lg border border-[rgb(var(--border))] p-4">
      <SkeletonArchiveList count={12} />
    </div>
  ),
};

// =============================================================================
// Accessibility
// =============================================================================

/** Demonstrates aria-hidden behavior */
export const AccessibilityDemo: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="rounded-lg border border-[rgb(var(--border))] p-4">
        <h3 className="mb-2 text-sm font-medium text-[rgb(var(--foreground))]">
          Screen Reader Behavior
        </h3>
        <p className="mb-4 text-sm text-[rgb(var(--muted-foreground))]">
          The skeleton list has <code>aria-hidden={true}</code> and <code>role="presentation"</code>
          , making it invisible to screen readers. This prevents confusion during loading states.
        </p>
        <SkeletonArchiveList count={2} data-testid="a11y-demo-skeleton" />
      </div>
      <div className="rounded-lg border border-[rgb(var(--border))] p-4">
        <h3 className="mb-2 text-sm font-medium text-[rgb(var(--foreground))]">Reduced Motion</h3>
        <p className="text-sm text-[rgb(var(--muted-foreground))]">
          The skeleton pulse animation respects <code>prefers-reduced-motion</code> via the
          <code>motion-safe:</code> Tailwind prefix on the animation class.
        </p>
      </div>
    </div>
  ),
};

// =============================================================================
// Ref Forwarding and Data Attributes
// =============================================================================

/** Demonstrates ref forwarding */
export const RefForwarding: Story = {
  render: function RefForwardingStory() {
    const ref = useRef<HTMLDivElement>(null);

    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => {
            if (ref.current) {
              ref.current.scrollIntoView({ behavior: 'smooth' });
              ref.current.style.outline = '2px solid rgb(var(--primary))';
              setTimeout(() => {
                if (ref.current) {
                  ref.current.style.outline = '';
                }
              }, 1000);
            }
          }}
          className="rounded-md bg-[rgb(var(--primary))] px-4 py-2 text-sm font-medium text-[rgb(var(--primary-foreground))]"
        >
          Focus Skeleton List
        </button>
        <div className="max-w-3xl">
          <SkeletonArchiveList ref={ref} count={3} />
        </div>
      </div>
    );
  },
};

/** Demonstrates data-testid support */
export const DataTestIdDemo: Story = {
  render: () => (
    <div className="space-y-4">
      <p className="text-sm text-[rgb(var(--muted-foreground))]">
        Container has <code>data-testid="archive-skeleton"</code>, <code>data-count="3"</code>, and{' '}
        <code>data-size="md"</code>. Each item and sub-element has its own data-testid.
      </p>
      <div className="max-w-3xl">
        <SkeletonArchiveList count={3} data-testid="archive-skeleton" />
      </div>
    </div>
  ),
};

// =============================================================================
// Custom Styling
// =============================================================================

/** With custom className */
export const WithCustomClassName: Story = {
  render: () => (
    <div className="max-w-3xl">
      <SkeletonArchiveList
        count={3}
        className="rounded-lg border border-[rgb(var(--border))] p-4"
      />
    </div>
  ),
};

/** Dark theme preview */
export const DarkTheme: Story = {
  render: () => (
    <div className="dark rounded-lg bg-[rgb(var(--background))] p-6">
      <SkeletonArchiveList count={4} />
    </div>
  ),
  parameters: {
    backgrounds: { default: 'dark' },
  },
};

// =============================================================================
// Real-World Examples
// =============================================================================

/** Archive page loading state */
export const ArchivePageLoading: Story = {
  render: () => (
    <div className="min-h-[500px] rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--background))]">
      {/* Header skeleton */}
      <div className="border-b border-[rgb(var(--border))] p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded bg-[rgb(var(--muted))] motion-safe:animate-pulse" />
            <div>
              <div className="h-5 w-24 rounded bg-[rgb(var(--muted))] motion-safe:animate-pulse" />
              <div className="mt-1 h-3 w-32 rounded bg-[rgb(var(--muted))] motion-safe:animate-pulse" />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="h-8 w-20 rounded-md bg-[rgb(var(--muted))] motion-safe:animate-pulse" />
            <div className="h-8 w-20 rounded-md bg-[rgb(var(--muted))] motion-safe:animate-pulse" />
            <div className="h-8 w-20 rounded-md bg-[rgb(var(--muted))] motion-safe:animate-pulse" />
          </div>
        </div>
      </div>
      {/* Content */}
      <div className="p-4">
        <SkeletonArchiveList count={6} />
      </div>
    </div>
  ),
};

/** Tab content loading */
export const TabContentLoading: Story = {
  render: () => (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex gap-1 rounded-lg bg-[rgb(var(--muted))] p-1">
        <div className="rounded-md bg-[rgb(var(--background))] px-4 py-2 text-sm font-medium shadow-sm">
          Tasks (5)
        </div>
        <div className="rounded-md px-4 py-2 text-sm text-[rgb(var(--muted-foreground))]">
          Chats (3)
        </div>
        <div className="rounded-md px-4 py-2 text-sm text-[rgb(var(--muted-foreground))]">
          Projects (2)
        </div>
      </div>
      {/* Loading content */}
      <SkeletonArchiveList count={5} />
    </div>
  ),
};

/** Empty to loading transition */
export const LoadingTransition: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="mb-2 text-sm font-medium text-[rgb(var(--muted-foreground))]">
          Loading State
        </h3>
        <div className="max-w-3xl rounded-lg border border-[rgb(var(--border))] p-4">
          <SkeletonArchiveList count={3} />
        </div>
      </div>
      <div>
        <h3 className="mb-2 text-sm font-medium text-[rgb(var(--muted-foreground))]">
          vs. Empty State
        </h3>
        <div className="max-w-3xl rounded-lg border border-[rgb(var(--border))] p-8">
          <div className="text-center text-[rgb(var(--muted-foreground))]">
            <svg
              className="mx-auto h-12 w-12 text-[rgb(var(--muted-foreground))]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden={true}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-[rgb(var(--foreground))]">
              No archived tasks
            </h3>
            <p className="mt-1 text-sm">Tasks you archive will appear here.</p>
          </div>
        </div>
      </div>
    </div>
  ),
};

// =============================================================================
// Constants Reference
// =============================================================================

/** Constants reference for developers */
export const ConstantsReference: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 text-sm font-semibold text-[rgb(var(--foreground))]">Default Count</h3>
        <code className="text-sm text-[rgb(var(--muted-foreground))]">
          DEFAULT_SKELETON_COUNT = {DEFAULT_SKELETON_COUNT}
        </code>
      </div>
      <div>
        <h3 className="mb-2 text-sm font-semibold text-[rgb(var(--foreground))]">Base Classes</h3>
        <code className="text-sm text-[rgb(var(--muted-foreground))]">
          SKELETON_ARCHIVE_LIST_BASE_CLASSES = "{SKELETON_ARCHIVE_LIST_BASE_CLASSES}"
        </code>
      </div>
      <div>
        <h3 className="mb-2 text-sm font-semibold text-[rgb(var(--foreground))]">
          Size Classes (Gap)
        </h3>
        <pre className="text-sm text-[rgb(var(--muted-foreground))]">
          {JSON.stringify(SKELETON_ARCHIVE_LIST_SIZE_CLASSES, null, 2)}
        </pre>
      </div>
      <div>
        <h3 className="mb-2 text-sm font-semibold text-[rgb(var(--foreground))]">
          Item Container Classes
        </h3>
        <pre className="text-sm text-[rgb(var(--muted-foreground))]">
          {JSON.stringify(SKELETON_ITEM_CONTAINER_CLASSES, null, 2)}
        </pre>
      </div>
      <div>
        <h3 className="mb-2 text-sm font-semibold text-[rgb(var(--foreground))]">Title Classes</h3>
        <pre className="text-sm text-[rgb(var(--muted-foreground))]">
          {JSON.stringify(SKELETON_TITLE_CLASSES, null, 2)}
        </pre>
      </div>
      <div>
        <h3 className="mb-2 text-sm font-semibold text-[rgb(var(--foreground))]">
          Metadata Classes
        </h3>
        <pre className="text-sm text-[rgb(var(--muted-foreground))]">
          {JSON.stringify(SKELETON_METADATA_CLASSES, null, 2)}
        </pre>
      </div>
      <div>
        <h3 className="mb-2 text-sm font-semibold text-[rgb(var(--foreground))]">
          Secondary Metadata Classes
        </h3>
        <pre className="text-sm text-[rgb(var(--muted-foreground))]">
          {JSON.stringify(SKELETON_SECONDARY_METADATA_CLASSES, null, 2)}
        </pre>
      </div>
      <div>
        <h3 className="mb-2 text-sm font-semibold text-[rgb(var(--foreground))]">
          Action Button Classes
        </h3>
        <pre className="text-sm text-[rgb(var(--muted-foreground))]">
          {JSON.stringify(SKELETON_ACTION_BUTTON_CLASSES, null, 2)}
        </pre>
      </div>
      <div>
        <h3 className="mb-2 text-sm font-semibold text-[rgb(var(--foreground))]">
          Secondary Action Classes
        </h3>
        <pre className="text-sm text-[rgb(var(--muted-foreground))]">
          {JSON.stringify(SKELETON_SECONDARY_ACTION_CLASSES, null, 2)}
        </pre>
      </div>
    </div>
  ),
};
