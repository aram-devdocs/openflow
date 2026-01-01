/**
 * SkeletonCard Stories - Storybook documentation for SkeletonCard molecule
 *
 * Demonstrates all variants, sizes, and usage patterns for the SkeletonCard
 * loading placeholder component.
 */

import type { Meta, StoryObj } from '@storybook/react';
import {
  SKELETON_CARD_ACTION_CLASSES,
  SKELETON_CARD_AVATAR_CLASSES,
  SKELETON_CARD_BASE_CLASSES,
  SKELETON_CARD_DESCRIPTION_CLASSES,
  SKELETON_CARD_PADDING_CLASSES,
  SKELETON_CARD_TITLE_CLASSES,
  SkeletonCard,
} from './SkeletonCard';

const meta: Meta<typeof SkeletonCard> = {
  title: 'Molecules/SkeletonCard',
  component: SkeletonCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
SkeletonCard provides a loading placeholder that matches the general Card component layout.

## Features

- **Responsive Sizing**: Supports sm, md, lg sizes with responsive breakpoint values
- **Flexible Content**: Configure avatar, text lines, and action buttons
- **Accessibility**: Uses aria-hidden={true} and role="presentation" for screen readers
- **forwardRef Support**: Full ref forwarding for integration with animations or measurements
- **data-testid Support**: Test-friendly with comprehensive data attributes

## Accessibility

The SkeletonCard is purely decorative and is hidden from assistive technology:
- \`aria-hidden={true}\` - Hidden from screen readers
- \`role="presentation"\` - Indicates decorative content
- Animation uses \`motion-safe:animate-pulse\` for reduced motion preference support

## Usage

\`\`\`tsx
// Basic skeleton
<SkeletonCard />

// With actions
<SkeletonCard showActions />

// Responsive sizing
<SkeletonCard size={{ base: 'sm', md: 'md', lg: 'lg' }} />

// Custom lines
<SkeletonCard lines={3} />
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size variant (can also be responsive object)',
    },
    showAvatar: {
      control: 'boolean',
      description: 'Show avatar/icon skeleton',
    },
    showActions: {
      control: 'boolean',
      description: 'Show action button skeletons',
    },
    lines: {
      control: 'select',
      options: [1, 2, 3],
      description: 'Number of text lines to display',
    },
  },
};

export default meta;
type Story = StoryObj<typeof SkeletonCard>;

// =============================================================================
// Basic Examples
// =============================================================================

/** Default card skeleton with avatar and 2 text lines */
export const Default: Story = {
  render: () => (
    <div className="w-80">
      <SkeletonCard />
    </div>
  ),
};

/** Card skeleton with action buttons */
export const WithActions: Story = {
  render: () => (
    <div className="w-80">
      <SkeletonCard showActions />
    </div>
  ),
};

/** Card skeleton without avatar */
export const NoAvatar: Story = {
  render: () => (
    <div className="w-80">
      <SkeletonCard showAvatar={false} />
    </div>
  ),
};

/** Full card skeleton with avatar and actions */
export const Full: Story = {
  render: () => (
    <div className="w-80">
      <SkeletonCard showAvatar showActions />
    </div>
  ),
};

/** Minimal card skeleton - no avatar, no actions */
export const Minimal: Story = {
  render: () => (
    <div className="w-80">
      <SkeletonCard showAvatar={false} showActions={false} />
    </div>
  ),
};

// =============================================================================
// Lines Variants
// =============================================================================

/** Single line of text (title only) */
export const SingleLine: Story = {
  render: () => (
    <div className="w-80">
      <SkeletonCard lines={1} />
    </div>
  ),
};

/** Two lines of text (default) */
export const TwoLines: Story = {
  render: () => (
    <div className="w-80">
      <SkeletonCard lines={2} />
    </div>
  ),
};

/** Three lines of text */
export const ThreeLines: Story = {
  render: () => (
    <div className="w-80">
      <SkeletonCard lines={3} />
    </div>
  ),
};

/** All line variants comparison */
export const AllLineVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-80">
      <div>
        <p className="text-sm text-muted-foreground mb-2">1 line:</p>
        <SkeletonCard lines={1} />
      </div>
      <div>
        <p className="text-sm text-muted-foreground mb-2">2 lines:</p>
        <SkeletonCard lines={2} />
      </div>
      <div>
        <p className="text-sm text-muted-foreground mb-2">3 lines:</p>
        <SkeletonCard lines={3} />
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
      <SkeletonCard size="sm" showActions />
    </div>
  ),
};

/** Medium size variant (default) */
export const SizeMedium: Story = {
  render: () => (
    <div className="w-80">
      <SkeletonCard size="md" showActions />
    </div>
  ),
};

/** Large size variant */
export const SizeLarge: Story = {
  render: () => (
    <div className="w-96">
      <SkeletonCard size="lg" showActions />
    </div>
  ),
};

/** All sizes comparison */
export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm text-muted-foreground mb-2">Small (sm):</p>
        <div className="w-72">
          <SkeletonCard size="sm" showActions />
        </div>
      </div>
      <div>
        <p className="text-sm text-muted-foreground mb-2">Medium (md):</p>
        <div className="w-80">
          <SkeletonCard size="md" showActions />
        </div>
      </div>
      <div>
        <p className="text-sm text-muted-foreground mb-2">Large (lg):</p>
        <div className="w-96">
          <SkeletonCard size="lg" showActions />
        </div>
      </div>
    </div>
  ),
};

// =============================================================================
// Responsive Sizing
// =============================================================================

/** Responsive sizing demo - resize viewport to see changes */
export const ResponsiveSizing: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Resize the viewport to see the skeleton card adapt its size at different breakpoints.',
      },
    },
  },
  render: () => (
    <div className="w-full max-w-md">
      <p className="text-sm text-muted-foreground mb-2">
        Resize viewport: sm on mobile → md on tablet → lg on desktop
      </p>
      <SkeletonCard size={{ base: 'sm', md: 'md', lg: 'lg' }} showActions />
    </div>
  ),
};

/** Responsive sizing with all content */
export const ResponsiveWithContent: Story = {
  render: () => (
    <div className="w-full max-w-lg">
      <p className="text-sm text-muted-foreground mb-2">Full card with responsive sizing</p>
      <SkeletonCard size={{ base: 'sm', md: 'md', lg: 'lg' }} showAvatar showActions lines={3} />
    </div>
  ),
};

// =============================================================================
// Usage Contexts
// =============================================================================

/** In a card grid layout */
export const InGridContext: Story = {
  render: () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl">
      <SkeletonCard showActions />
      <SkeletonCard showActions />
      <SkeletonCard showActions />
      <SkeletonCard showActions />
      <SkeletonCard showActions />
      <SkeletonCard showActions />
    </div>
  ),
};

/** User profile card loading */
export const ProfileCardLoading: Story = {
  render: () => (
    <div className="w-80">
      <SkeletonCard showAvatar lines={3} showActions />
    </div>
  ),
};

/** Compact list item loading */
export const CompactListItem: Story = {
  render: () => (
    <div className="w-full max-w-md space-y-2">
      <SkeletonCard size="sm" lines={1} />
      <SkeletonCard size="sm" lines={1} />
      <SkeletonCard size="sm" lines={1} />
    </div>
  ),
};

/** Article preview loading */
export const ArticlePreviewLoading: Story = {
  render: () => (
    <div className="w-full max-w-md space-y-4">
      <SkeletonCard size="lg" lines={3} showAvatar={false} />
      <SkeletonCard size="lg" lines={3} showAvatar={false} />
    </div>
  ),
};

/** In scrollable container */
export const InScrollableContainer: Story = {
  render: () => (
    <div className="h-96 overflow-y-auto border rounded-lg p-4 w-80">
      <div className="space-y-4">
        <SkeletonCard showActions />
        <SkeletonCard showActions />
        <SkeletonCard showActions />
        <SkeletonCard showActions />
        <SkeletonCard showActions />
      </div>
    </div>
  ),
};

// =============================================================================
// Accessibility Demos
// =============================================================================

/** Accessibility demo - aria-hidden and role="presentation" */
export const AccessibilityDemo: Story = {
  parameters: {
    docs: {
      description: {
        story: `
This skeleton is hidden from screen readers:
- \`aria-hidden={true}\` prevents announcement
- \`role="presentation"\` indicates decorative content
- Animation respects \`prefers-reduced-motion\` via \`motion-safe:animate-pulse\`
        `,
      },
    },
  },
  render: () => (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Open dev tools and inspect the element to verify:
      </p>
      <ul className="text-sm text-muted-foreground list-disc pl-4 space-y-1">
        <li>aria-hidden=&quot;true&quot;</li>
        <li>role=&quot;presentation&quot;</li>
        <li>data-testid for testing</li>
        <li>data-size, data-show-avatar, data-show-actions, data-lines attributes</li>
      </ul>
      <div className="w-80">
        <SkeletonCard data-testid="skeleton-demo" showActions />
      </div>
    </div>
  ),
};

/** Reduced motion preference support */
export const ReducedMotionDemo: Story = {
  parameters: {
    docs: {
      description: {
        story: `
The skeleton animation respects \`prefers-reduced-motion\`:
- Uses \`motion-safe:animate-pulse\` class via the Skeleton atom
- Animation will pause for users who prefer reduced motion
- You can test by enabling "Reduce Motion" in system preferences
        `,
      },
    },
  },
  render: () => (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Enable &quot;Reduce Motion&quot; in system preferences to see animation disabled:
      </p>
      <div className="w-80">
        <SkeletonCard showActions />
      </div>
    </div>
  ),
};

// =============================================================================
// Ref and Data Attributes
// =============================================================================

/** forwardRef support demo */
export const RefForwardingDemo: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates ref forwarding for measuring or animating the skeleton container.',
      },
    },
  },
  render: () => {
    // Note: In actual usage, you'd use useRef and useEffect
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          The SkeletonCard supports forwardRef for measuring or animations:
        </p>
        <pre className="text-xs bg-muted p-2 rounded">
          {`const ref = useRef<HTMLDivElement>(null);
<SkeletonCard ref={ref} />`}
        </pre>
        <div className="w-80">
          <SkeletonCard />
        </div>
      </div>
    );
  },
};

/** data-testid demo */
export const DataTestIdDemo: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Shows comprehensive data-testid attributes for all skeleton elements.',
      },
    },
  },
  render: () => (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        When data-testid is provided, child elements get derived testids:
      </p>
      <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
        {`data-testid="skeleton" → skeleton-avatar, skeleton-title,
skeleton-description-1, skeleton-description-2,
skeleton-action-primary, skeleton-action-secondary`}
      </pre>
      <div className="w-80">
        <SkeletonCard data-testid="skeleton" showActions lines={3} />
      </div>
    </div>
  ),
};

// =============================================================================
// Real-World Examples
// =============================================================================

/** Dashboard widget loading */
export const DashboardWidgetLoading: Story = {
  render: () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
      <div className="border rounded-lg p-4">
        <h3 className="text-sm font-medium mb-4">Recent Activity</h3>
        <div className="space-y-3">
          <SkeletonCard size="sm" lines={1} showAvatar={false} />
          <SkeletonCard size="sm" lines={1} showAvatar={false} />
          <SkeletonCard size="sm" lines={1} showAvatar={false} />
        </div>
      </div>
      <div className="border rounded-lg p-4">
        <h3 className="text-sm font-medium mb-4">Team Members</h3>
        <div className="space-y-3">
          <SkeletonCard size="sm" lines={1} />
          <SkeletonCard size="sm" lines={1} />
          <SkeletonCard size="sm" lines={1} />
        </div>
      </div>
    </div>
  ),
};

/** Task list loading */
export const TaskListLoading: Story = {
  render: () => (
    <div className="max-w-md border rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b bg-muted/30">
        <h3 className="font-medium">Tasks</h3>
      </div>
      <div className="p-4 space-y-3">
        <SkeletonCard size="sm" lines={2} showAvatar showActions />
        <SkeletonCard size="sm" lines={2} showAvatar showActions />
        <SkeletonCard size="sm" lines={2} showAvatar showActions />
      </div>
    </div>
  ),
};

/** Loading transition demo */
export const LoadingTransitionDemo: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Shows how skeleton cards might be used in a loading transition.',
      },
    },
  },
  render: () => (
    <div className="space-y-6 max-w-md">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Loading state:</p>
        <div className="space-y-3">
          <SkeletonCard size="md" showActions />
          <SkeletonCard size="md" showActions />
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Loaded content (for comparison):</p>
        <div className="space-y-3">
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/20" />
              <div className="flex-1">
                <p className="font-medium">Task Title</p>
                <p className="text-sm text-muted-foreground">Task description</p>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                className="h-8 px-4 text-sm bg-primary text-primary-foreground rounded"
              >
                Primary
              </button>
              <button type="button" className="h-8 px-4 text-sm border rounded">
                Secondary
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
};

/** Project cards loading */
export const ProjectCardsLoading: Story = {
  render: () => (
    <div className="space-y-4 max-w-2xl">
      <h2 className="text-lg font-semibold">Projects</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SkeletonCard size={{ base: 'sm', md: 'md' }} lines={3} showAvatar={false} showActions />
        <SkeletonCard size={{ base: 'sm', md: 'md' }} lines={3} showAvatar={false} showActions />
        <SkeletonCard size={{ base: 'sm', md: 'md' }} lines={3} showAvatar={false} showActions />
        <SkeletonCard size={{ base: 'sm', md: 'md' }} lines={3} showAvatar={false} showActions />
      </div>
    </div>
  ),
};

/** Comment thread loading */
export const CommentThreadLoading: Story = {
  render: () => (
    <div className="max-w-lg space-y-4">
      <h3 className="font-medium">Comments</h3>
      <div className="space-y-3">
        <SkeletonCard lines={2} />
        <div className="ml-8">
          <SkeletonCard size="sm" lines={1} />
        </div>
        <SkeletonCard lines={2} />
        <SkeletonCard lines={3} />
      </div>
    </div>
  ),
};

// =============================================================================
// Constants Reference
// =============================================================================

/** Constants reference - shows exported class constants */
export const ConstantsReference: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Reference for all exported constants that can be used for custom implementations.',
      },
    },
  },
  render: () => (
    <div className="space-y-4 max-w-2xl">
      <h3 className="font-medium">Exported Constants</h3>
      <div className="space-y-3 text-sm">
        <div>
          <p className="font-medium">SKELETON_CARD_BASE_CLASSES:</p>
          <pre className="text-xs bg-muted p-2 rounded mt-1">{SKELETON_CARD_BASE_CLASSES}</pre>
        </div>
        <div>
          <p className="font-medium">SKELETON_CARD_PADDING_CLASSES:</p>
          <pre className="text-xs bg-muted p-2 rounded mt-1">
            {JSON.stringify(SKELETON_CARD_PADDING_CLASSES, null, 2)}
          </pre>
        </div>
        <div>
          <p className="font-medium">SKELETON_CARD_TITLE_CLASSES:</p>
          <pre className="text-xs bg-muted p-2 rounded mt-1">
            {JSON.stringify(SKELETON_CARD_TITLE_CLASSES, null, 2)}
          </pre>
        </div>
        <div>
          <p className="font-medium">SKELETON_CARD_DESCRIPTION_CLASSES:</p>
          <pre className="text-xs bg-muted p-2 rounded mt-1">
            {JSON.stringify(SKELETON_CARD_DESCRIPTION_CLASSES, null, 2)}
          </pre>
        </div>
        <div>
          <p className="font-medium">SKELETON_CARD_ACTION_CLASSES:</p>
          <pre className="text-xs bg-muted p-2 rounded mt-1">
            {JSON.stringify(SKELETON_CARD_ACTION_CLASSES, null, 2)}
          </pre>
        </div>
        <div>
          <p className="font-medium">SKELETON_CARD_AVATAR_CLASSES:</p>
          <pre className="text-xs bg-muted p-2 rounded mt-1">
            {JSON.stringify(SKELETON_CARD_AVATAR_CLASSES, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  ),
};

/** Utility functions reference */
export const UtilityFunctionsReference: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Reference for exported utility functions.',
      },
    },
  },
  render: () => (
    <div className="space-y-4 max-w-2xl">
      <h3 className="font-medium">Exported Utility Functions</h3>
      <div className="space-y-4 text-sm">
        <div>
          <p className="font-medium">getBaseSize(size)</p>
          <p className="text-muted-foreground">Extracts base size from responsive value</p>
          <pre className="text-xs bg-muted p-2 rounded mt-1">
            {`getBaseSize('md') → 'md'
getBaseSize({ base: 'sm', md: 'lg' }) → 'sm'
getBaseSize({ md: 'lg' }) → 'md' // defaults to 'md'`}
          </pre>
        </div>
        <div>
          <p className="font-medium">getResponsiveSizeClasses(size, classMap)</p>
          <p className="text-muted-foreground">Generates responsive Tailwind classes</p>
          <pre className="text-xs bg-muted p-2 rounded mt-1">
            {`getResponsiveSizeClasses('md', SKELETON_CARD_PADDING_CLASSES)
→ 'p-4'

getResponsiveSizeClasses({ base: 'sm', md: 'md', lg: 'lg' }, ...)
→ 'p-3 md:p-4 lg:p-5'`}
          </pre>
        </div>
      </div>
    </div>
  ),
};
