import type { Meta, StoryObj } from '@storybook/react';
import { useEffect, useRef, useState } from 'react';
import {
  SKELETON_TASK_CARD_BADGE_CLASSES,
  SKELETON_TASK_CARD_BASE_CLASSES,
  SKELETON_TASK_CARD_PADDING_CLASSES,
  SKELETON_TASK_CARD_TITLE_CLASSES,
  SkeletonTaskCard,
  getBadgeDimensions,
  getBaseSize,
  getResponsiveSizeClasses,
} from './SkeletonTaskCard';

const meta: Meta<typeof SkeletonTaskCard> = {
  title: 'Molecules/SkeletonTaskCard',
  component: SkeletonTaskCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
SkeletonTaskCard provides a loading placeholder for task card layouts.
It matches the TaskCard component layout and provides consistent loading states.

## Features
- **Responsive sizing**: Supports sm, md, lg sizes with responsive breakpoints
- **Configurable content**: Show/hide description and footer sections
- **Accessibility**: Uses aria-hidden="true" and role="presentation"
- **forwardRef support**: For programmatic control
- **Testing support**: data-testid attributes for all skeleton elements

## Usage
\`\`\`tsx
import { SkeletonTaskCard } from '@openflow/ui/molecules';

// Basic usage
<SkeletonTaskCard />

// Without footer
<SkeletonTaskCard showFooter={false} />

// Responsive sizing
<SkeletonTaskCard size={{ base: 'sm', md: 'md', lg: 'lg' }} />

// Multiple cards in a list
{Array.from({ length: 5 }).map((_, i) => (
  <SkeletonTaskCard key={i} />
))}
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
      description: 'Size variant for the skeleton task card',
    },
    showDescription: {
      control: 'boolean',
      description: 'Whether to show description lines skeleton',
    },
    showFooter: {
      control: 'boolean',
      description: 'Whether to show footer metadata skeleton',
    },
    descriptionLines: {
      control: 'select',
      options: [1, 2],
      description: 'Number of description lines to show',
    },
  },
};

export default meta;
type Story = StoryObj<typeof SkeletonTaskCard>;

// =============================================================================
// Basic Examples
// =============================================================================

/** Default task card skeleton with all sections */
export const Default: Story = {
  render: () => (
    <div className="w-80">
      <SkeletonTaskCard />
    </div>
  ),
};

/** Task card skeleton without description section */
export const NoDescription: Story = {
  render: () => (
    <div className="w-80">
      <SkeletonTaskCard showDescription={false} />
    </div>
  ),
};

/** Task card skeleton without footer section */
export const NoFooter: Story = {
  render: () => (
    <div className="w-80">
      <SkeletonTaskCard showFooter={false} />
    </div>
  ),
};

/** Minimal skeleton with only header (title + badge) */
export const Minimal: Story = {
  render: () => (
    <div className="w-80">
      <SkeletonTaskCard showDescription={false} showFooter={false} />
    </div>
  ),
};

/** Single description line */
export const SingleDescriptionLine: Story = {
  render: () => (
    <div className="w-80">
      <SkeletonTaskCard descriptionLines={1} />
    </div>
  ),
};

// =============================================================================
// Size Variants
// =============================================================================

/** Small size variant - compact spacing */
export const SizeSmall: Story = {
  render: () => (
    <div className="w-80">
      <SkeletonTaskCard size="sm" />
    </div>
  ),
};

/** Medium size variant - default spacing */
export const SizeMedium: Story = {
  render: () => (
    <div className="w-80">
      <SkeletonTaskCard size="md" />
    </div>
  ),
};

/** Large size variant - expanded spacing */
export const SizeLarge: Story = {
  render: () => (
    <div className="w-80">
      <SkeletonTaskCard size="lg" />
    </div>
  ),
};

/** All size variants side by side for comparison */
export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-sm text-[rgb(var(--muted-foreground))] mb-2">Small (sm)</p>
        <div className="w-80">
          <SkeletonTaskCard size="sm" />
        </div>
      </div>
      <div>
        <p className="text-sm text-[rgb(var(--muted-foreground))] mb-2">Medium (md) - Default</p>
        <div className="w-80">
          <SkeletonTaskCard size="md" />
        </div>
      </div>
      <div>
        <p className="text-sm text-[rgb(var(--muted-foreground))] mb-2">Large (lg)</p>
        <div className="w-80">
          <SkeletonTaskCard size="lg" />
        </div>
      </div>
    </div>
  ),
};

// =============================================================================
// Responsive Sizing
// =============================================================================

/** Responsive sizing - changes size at different breakpoints */
export const ResponsiveSizing: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Resize the viewport to see the skeleton change size: sm on mobile, md on tablet, lg on desktop.',
      },
    },
  },
  render: () => (
    <div className="w-full max-w-md">
      <p className="text-sm text-[rgb(var(--muted-foreground))] mb-4">
        Resize the viewport: sm (mobile) → md (tablet) → lg (desktop)
      </p>
      <SkeletonTaskCard size={{ base: 'sm', md: 'md', lg: 'lg' }} />
    </div>
  ),
};

/** Responsive sizing with only base and lg breakpoints */
export const ResponsiveBaseAndLg: Story = {
  render: () => (
    <div className="w-full max-w-md">
      <p className="text-sm text-[rgb(var(--muted-foreground))] mb-4">sm → lg at lg breakpoint</p>
      <SkeletonTaskCard size={{ base: 'sm', lg: 'lg' }} />
    </div>
  ),
};

// =============================================================================
// Multiple Cards (Lists)
// =============================================================================

/** Multiple task cards showing a loading list */
export const MultipleCards: Story = {
  render: () => (
    <div className="w-80 space-y-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonTaskCard key={`skeleton-task-${i}`} />
      ))}
    </div>
  ),
};

/** Many task cards showing a long loading list */
export const ManyCards: Story = {
  render: () => (
    <div className="w-80 space-y-2 max-h-96 overflow-y-auto">
      {Array.from({ length: 10 }).map((_, i) => (
        <SkeletonTaskCard key={`skeleton-task-${i}`} />
      ))}
    </div>
  ),
};

/** Single task card in a list context */
export const SingleCard: Story = {
  render: () => (
    <div className="w-80 space-y-2">
      <SkeletonTaskCard />
    </div>
  ),
};

// =============================================================================
// Layout Contexts
// =============================================================================

/** Wide task card skeleton */
export const WideCard: Story = {
  render: () => (
    <div className="w-[500px]">
      <SkeletonTaskCard />
    </div>
  ),
};

/** Task cards in a grid layout */
export const GridLayout: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4 w-[700px]">
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonTaskCard key={`skeleton-task-${i}`} />
      ))}
    </div>
  ),
};

/** Task cards in responsive grid */
export const ResponsiveGrid: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-4xl">
      {Array.from({ length: 6 }).map((_, i) => (
        <SkeletonTaskCard key={`skeleton-task-${i}`} size={{ base: 'sm', md: 'md' }} />
      ))}
    </div>
  ),
};

/** In a sidebar context */
export const InSidebarContext: Story = {
  render: () => (
    <div className="w-64 border-r border-[rgb(var(--border))] bg-[rgb(var(--muted))] p-4 space-y-2">
      <p className="text-xs font-semibold text-[rgb(var(--muted-foreground))] uppercase mb-2">
        Tasks
      </p>
      {Array.from({ length: 5 }).map((_, i) => (
        <SkeletonTaskCard key={`skeleton-task-${i}`} size="sm" />
      ))}
    </div>
  ),
};

/** In a scrollable container */
export const InScrollableContainer: Story = {
  render: () => (
    <div className="w-96 h-64 overflow-y-auto border border-[rgb(var(--border))] rounded-lg p-4 space-y-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <SkeletonTaskCard key={`skeleton-task-${i}`} />
      ))}
    </div>
  ),
};

/** Mobile view */
export const MobileView: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  render: () => (
    <div className="w-full p-2 space-y-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonTaskCard key={`skeleton-task-${i}`} size="sm" />
      ))}
    </div>
  ),
};

// =============================================================================
// Accessibility Demos
// =============================================================================

/** Accessibility demo - aria-hidden and role */
export const AccessibilityDemo: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'The skeleton has `aria-hidden="true"` and `role="presentation"` to hide it from screen readers. Inspect the DOM to verify.',
      },
    },
  },
  render: () => (
    <div className="space-y-4">
      <div className="p-4 bg-[rgb(var(--muted))] rounded-lg">
        <p className="text-sm mb-2">
          This skeleton is hidden from screen readers with{' '}
          <code className="px-1 py-0.5 bg-[rgb(var(--accent))] rounded">aria-hidden="true"</code>{' '}
          and{' '}
          <code className="px-1 py-0.5 bg-[rgb(var(--accent))] rounded">role="presentation"</code>
        </p>
        <p className="text-sm text-[rgb(var(--muted-foreground))]">
          Screen reader users will not hear anything for this skeleton.
        </p>
      </div>
      <SkeletonTaskCard data-testid="a11y-demo-skeleton" />
    </div>
  ),
};

/** Reduced motion demo */
export const ReducedMotionDemo: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'The skeleton animation respects `prefers-reduced-motion`. Enable reduced motion in your OS settings to see.',
      },
    },
  },
  render: () => (
    <div className="space-y-4">
      <div className="p-4 bg-[rgb(var(--muted))] rounded-lg">
        <p className="text-sm mb-2">The skeleton uses motion-safe: prefix for animations.</p>
        <p className="text-sm text-[rgb(var(--muted-foreground))]">
          Enable reduced motion in your OS/browser to disable the pulse animation.
        </p>
      </div>
      <div className="w-80">
        <SkeletonTaskCard />
      </div>
    </div>
  ),
};

// =============================================================================
// Ref Forwarding and Testing
// =============================================================================

/** Ref forwarding demo */
export const RefForwarding: Story = {
  render: function RefForwardingDemo() {
    const ref = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    useEffect(() => {
      if (ref.current) {
        setDimensions({
          width: ref.current.offsetWidth,
          height: ref.current.offsetHeight,
        });
      }
    }, []);

    return (
      <div className="space-y-4">
        <p className="text-sm text-[rgb(var(--muted-foreground))]">
          Skeleton dimensions: {dimensions.width}px × {dimensions.height}px
        </p>
        <div className="w-80">
          <SkeletonTaskCard ref={ref} />
        </div>
      </div>
    );
  },
};

/** Data-testid demo */
export const DataTestId: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'The skeleton and its parts have data-testid attributes for automated testing. Inspect the DOM to see them.',
      },
    },
  },
  render: () => (
    <div className="space-y-4">
      <div className="p-4 bg-[rgb(var(--muted))] rounded-lg">
        <p className="text-sm mb-2">Test IDs available:</p>
        <ul className="text-sm text-[rgb(var(--muted-foreground))] space-y-1 list-disc list-inside">
          <li>task-skeleton (container)</li>
          <li>task-skeleton-title</li>
          <li>task-skeleton-badge</li>
          <li>task-skeleton-description-1, description-2</li>
          <li>task-skeleton-footer</li>
          <li>task-skeleton-metadata-1, metadata-2</li>
        </ul>
      </div>
      <div className="w-80">
        <SkeletonTaskCard data-testid="task-skeleton" />
      </div>
    </div>
  ),
};

/** Data attributes demo */
export const DataAttributes: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'The skeleton has data attributes for size and visibility state. Inspect the DOM to see data-size, data-show-description, etc.',
      },
    },
  },
  render: () => (
    <div className="space-y-4">
      <div className="p-4 bg-[rgb(var(--muted))] rounded-lg">
        <p className="text-sm mb-2">Data attributes on container:</p>
        <ul className="text-sm text-[rgb(var(--muted-foreground))] space-y-1 list-disc list-inside">
          <li>data-size="md" (or "responsive" for object sizes)</li>
          <li>data-show-description="true"</li>
          <li>data-show-footer="true"</li>
          <li>data-description-lines="2"</li>
        </ul>
      </div>
      <div className="w-80">
        <SkeletonTaskCard data-testid="data-attrs-demo" />
      </div>
    </div>
  ),
};

// =============================================================================
// Real-World Examples
// =============================================================================

/** Loading transition demo - shows skeleton then content */
export const LoadingTransitionDemo: Story = {
  render: function LoadingTransition() {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      const timer = setTimeout(() => setIsLoading(false), 2000);
      return () => clearTimeout(timer);
    }, []);

    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setIsLoading(true)}
          className="px-3 py-1.5 text-sm bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))] rounded-md"
        >
          {isLoading ? 'Loading...' : 'Reload'}
        </button>
        <div className="w-80">
          {isLoading ? (
            <SkeletonTaskCard />
          ) : (
            <div className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-3 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-medium">Implement user authentication</h3>
                <span className="shrink-0 px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-800">
                  In Progress
                </span>
              </div>
              <p className="text-sm text-[rgb(var(--muted-foreground))]">
                Add OAuth 2.0 support with Google and GitHub providers for seamless user login.
              </p>
              <div className="flex items-center gap-4 pt-2 text-xs text-[rgb(var(--muted-foreground))]">
                <span>2 days ago</span>
                <span>High priority</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  },
};

/** Task list page loading state */
export const TaskListPageLoading: Story = {
  render: () => (
    <div className="w-full max-w-2xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tasks</h1>
        <div className="h-9 w-24 bg-[rgb(var(--muted))] rounded-md animate-pulse" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonTaskCard key={`skeleton-task-${i}`} />
        ))}
      </div>
    </div>
  ),
};

/** Kanban board loading state */
export const KanbanBoardLoading: Story = {
  render: () => (
    <div className="flex gap-4 p-4 overflow-x-auto">
      {['To Do', 'In Progress', 'Done'].map((column) => (
        <div key={column} className="w-72 shrink-0">
          <h3 className="font-semibold mb-3">{column}</h3>
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonTaskCard key={`${column}-${i}`} size="sm" />
            ))}
          </div>
        </div>
      ))}
    </div>
  ),
};

/** Task detail panel loading */
export const TaskDetailPanelLoading: Story = {
  render: () => (
    <div className="w-96 border-l border-[rgb(var(--border))] p-4 space-y-4">
      <h2 className="text-lg font-semibold">Task Details</h2>
      <SkeletonTaskCard size="lg" />
      <div className="space-y-2">
        <div className="h-4 w-20 bg-[rgb(var(--muted))] rounded animate-pulse" />
        <div className="h-24 w-full bg-[rgb(var(--muted))] rounded animate-pulse" />
      </div>
    </div>
  ),
};

/** Dashboard widget loading */
export const DashboardWidgetLoading: Story = {
  render: () => (
    <div className="w-80 border border-[rgb(var(--border))] rounded-lg p-4">
      <h3 className="font-semibold mb-3">Recent Tasks</h3>
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonTaskCard key={`skeleton-task-${i}`} size="sm" showFooter={false} />
        ))}
      </div>
    </div>
  ),
};

// =============================================================================
// Constants Reference
// =============================================================================

/** Constants and utility functions reference */
export const ConstantsReference: Story = {
  parameters: {
    docs: {
      description: {
        story: `
This story documents the exported constants and utility functions available for testing and customization.

## Exported Constants
- \`SKELETON_TASK_CARD_BASE_CLASSES\` - Base container classes
- \`SKELETON_TASK_CARD_PADDING_CLASSES\` - Size-specific padding classes
- \`SKELETON_TASK_CARD_SPACING_CLASSES\` - Content spacing classes
- \`SKELETON_TASK_CARD_HEADER_GAP_CLASSES\` - Header gap classes
- \`SKELETON_TASK_CARD_TITLE_CLASSES\` - Title height classes
- \`SKELETON_TASK_CARD_BADGE_CLASSES\` - Badge dimensions (height/width)
- \`SKELETON_TASK_CARD_DESCRIPTION_CLASSES\` - Description height classes
- \`SKELETON_TASK_CARD_DESCRIPTION_GAP_CLASSES\` - Description spacing classes
- \`SKELETON_TASK_CARD_FOOTER_CLASSES\` - Footer height classes
- \`SKELETON_TASK_CARD_FOOTER_GAP_CLASSES\` - Footer gap classes
- \`SKELETON_TASK_CARD_FOOTER_PADDING_CLASSES\` - Footer padding classes

## Exported Utility Functions
- \`getBaseSize(size)\` - Extract base size from responsive value
- \`getResponsiveSizeClasses(size, classMap)\` - Generate responsive classes
- \`getBadgeDimensions(size)\` - Get badge height/width for a size
        `,
      },
    },
  },
  render: () => (
    <div className="space-y-6 max-w-2xl">
      <div className="p-4 bg-[rgb(var(--muted))] rounded-lg space-y-4">
        <h3 className="font-semibold">Constants Values</h3>
        <div className="space-y-2 text-sm">
          <p>
            <strong>SKELETON_TASK_CARD_BASE_CLASSES:</strong>
            <br />
            <code className="text-xs bg-[rgb(var(--accent))] px-1 rounded">
              {SKELETON_TASK_CARD_BASE_CLASSES}
            </code>
          </p>
          <p>
            <strong>SKELETON_TASK_CARD_PADDING_CLASSES:</strong>
            <br />
            {Object.entries(SKELETON_TASK_CARD_PADDING_CLASSES).map(([size, value]) => (
              <span key={size} className="inline-block mr-4">
                <code className="text-xs bg-[rgb(var(--accent))] px-1 rounded">
                  {size}: {value}
                </code>
              </span>
            ))}
          </p>
          <p>
            <strong>SKELETON_TASK_CARD_TITLE_CLASSES:</strong>
            <br />
            {Object.entries(SKELETON_TASK_CARD_TITLE_CLASSES).map(([size, value]) => (
              <span key={size} className="inline-block mr-4">
                <code className="text-xs bg-[rgb(var(--accent))] px-1 rounded">
                  {size}: {value}
                </code>
              </span>
            ))}
          </p>
          <p>
            <strong>SKELETON_TASK_CARD_BADGE_CLASSES:</strong>
            <br />
            {Object.entries(SKELETON_TASK_CARD_BADGE_CLASSES).map(([size, value]) => (
              <span key={size} className="inline-block mr-4">
                <code className="text-xs bg-[rgb(var(--accent))] px-1 rounded">
                  {size}: {value.height} {value.width}
                </code>
              </span>
            ))}
          </p>
        </div>
      </div>

      <div className="p-4 bg-[rgb(var(--muted))] rounded-lg space-y-4">
        <h3 className="font-semibold">Utility Function Examples</h3>
        <div className="space-y-2 text-sm">
          <p>
            <strong>getBaseSize('md'):</strong>{' '}
            <code className="text-xs bg-[rgb(var(--accent))] px-1 rounded">
              "{getBaseSize('md')}"
            </code>
          </p>
          <p>
            <strong>getBaseSize({'{ base: "sm", md: "lg" }'}):</strong>{' '}
            <code className="text-xs bg-[rgb(var(--accent))] px-1 rounded">
              "{getBaseSize({ base: 'sm', md: 'lg' })}"
            </code>
          </p>
          <p>
            <strong>getBadgeDimensions('md'):</strong>{' '}
            <code className="text-xs bg-[rgb(var(--accent))] px-1 rounded">
              {JSON.stringify(getBadgeDimensions('md'))}
            </code>
          </p>
          <p>
            <strong>getResponsiveSizeClasses('md', PADDING_CLASSES):</strong>{' '}
            <code className="text-xs bg-[rgb(var(--accent))] px-1 rounded">
              "{getResponsiveSizeClasses('md', SKELETON_TASK_CARD_PADDING_CLASSES)}"
            </code>
          </p>
        </div>
      </div>

      <div className="w-80">
        <SkeletonTaskCard />
      </div>
    </div>
  ),
};
