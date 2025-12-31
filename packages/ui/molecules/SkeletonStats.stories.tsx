import type { Meta, StoryObj } from '@storybook/react';
import { useEffect, useState } from 'react';
import {
  DEFAULT_STAT_COUNT,
  SKELETON_STATS_BASE_CLASSES,
  SKELETON_STATS_GAP_CLASSES,
  SKELETON_STATS_GRID_CLASSES,
  SKELETON_STAT_CARD_CLASSES,
  SKELETON_STAT_CARD_PADDING_CLASSES,
  SKELETON_STAT_GAP_CLASSES,
  SKELETON_STAT_ICON_CLASSES,
  SKELETON_STAT_ICON_MARGIN_CLASSES,
  SKELETON_STAT_LABEL_CLASSES,
  SKELETON_STAT_TREND_CLASSES,
  SKELETON_STAT_TREND_MARGIN_CLASSES,
  SKELETON_STAT_VALUE_CLASSES,
  SkeletonStats,
  getBaseSize,
  getIconDimensions,
  getResponsiveSizeClasses,
} from './SkeletonStats';

const meta: Meta<typeof SkeletonStats> = {
  title: 'Molecules/SkeletonStats',
  component: SkeletonStats,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
SkeletonStats provides loading placeholders for dashboard stat cards.

## Features
- Uses Skeleton atom for consistent loading animation
- Responsive grid layout (1 column on mobile, 2 on tablet, 4 on desktop)
- Configurable count, size, and optional icon/trend indicators
- Properly hidden from screen readers (aria-hidden="true")
- forwardRef support for ref forwarding
- data-testid support for automated testing

## Accessibility
- \`aria-hidden="true"\` hides the skeleton from screen readers
- \`role="presentation"\` indicates decorative purpose
- The actual stats should be announced when loaded

## Usage
\`\`\`tsx
// Default 4 stats
<SkeletonStats />

// With trend indicators
<SkeletonStats showTrend />

// With icons
<SkeletonStats showIcon />

// Responsive sizing
<SkeletonStats size={{ base: 'sm', md: 'md', lg: 'lg' }} />
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
      description: 'Size variant for the skeleton stats',
    },
    count: {
      control: { type: 'number', min: 1, max: 8 },
      description: 'Number of stat cards to render',
    },
    showTrend: {
      control: 'boolean',
      description: 'Whether to show trend indicator skeleton',
    },
    showIcon: {
      control: 'boolean',
      description: 'Whether to show icon skeleton',
    },
    'data-testid': {
      control: 'text',
      description: 'Data attribute for testing',
    },
  },
};

export default meta;
type Story = StoryObj<typeof SkeletonStats>;

// =============================================================================
// BASIC EXAMPLES
// =============================================================================

/** Default 4-column stats skeleton */
export const Default: Story = {
  render: () => <SkeletonStats />,
};

/** Stats skeleton with 3 cards */
export const ThreeStats: Story = {
  render: () => <SkeletonStats count={3} />,
};

/** Stats skeleton with 2 cards */
export const TwoStats: Story = {
  render: () => <SkeletonStats count={2} />,
};

/** Single stat skeleton */
export const SingleStat: Story = {
  render: () => (
    <div className="w-64">
      <SkeletonStats count={1} />
    </div>
  ),
};

/** Many stats in grid */
export const ManyStats: Story = {
  render: () => <SkeletonStats count={8} />,
};

// =============================================================================
// WITH OPTIONAL ELEMENTS
// =============================================================================

/** Stats with trend indicators */
export const WithTrend: Story = {
  render: () => <SkeletonStats showTrend />,
};

/** Stats with icons */
export const WithIcon: Story = {
  render: () => <SkeletonStats showIcon />,
};

/** Stats with both icon and trend */
export const WithIconAndTrend: Story = {
  render: () => <SkeletonStats showIcon showTrend />,
};

/** Comparison of optional elements */
export const OptionalElementsComparison: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-medium mb-2 text-[rgb(var(--muted-foreground))]">
          Basic (no icon, no trend)
        </h3>
        <SkeletonStats count={2} />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2 text-[rgb(var(--muted-foreground))]">With Icon</h3>
        <SkeletonStats count={2} showIcon />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2 text-[rgb(var(--muted-foreground))]">With Trend</h3>
        <SkeletonStats count={2} showTrend />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2 text-[rgb(var(--muted-foreground))]">
          With Icon and Trend
        </h3>
        <SkeletonStats count={2} showIcon showTrend />
      </div>
    </div>
  ),
};

// =============================================================================
// SIZE VARIANTS
// =============================================================================

/** Small size stats skeleton */
export const SizeSmall: Story = {
  render: () => <SkeletonStats size="sm" />,
};

/** Medium size stats skeleton (default) */
export const SizeMedium: Story = {
  render: () => <SkeletonStats size="md" />,
};

/** Large size stats skeleton */
export const SizeLarge: Story = {
  render: () => <SkeletonStats size="lg" />,
};

/** All sizes comparison */
export const AllSizes: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-medium mb-2 text-[rgb(var(--muted-foreground))]">Small (sm)</h3>
        <SkeletonStats size="sm" count={2} showIcon showTrend />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2 text-[rgb(var(--muted-foreground))]">
          Medium (md) - Default
        </h3>
        <SkeletonStats size="md" count={2} showIcon showTrend />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2 text-[rgb(var(--muted-foreground))]">Large (lg)</h3>
        <SkeletonStats size="lg" count={2} showIcon showTrend />
      </div>
    </div>
  ),
};

// =============================================================================
// RESPONSIVE SIZING
// =============================================================================

/** Responsive sizing - changes size at different breakpoints */
export const ResponsiveSizing: Story = {
  render: () => (
    <div className="space-y-4">
      <p className="text-sm text-[rgb(var(--muted-foreground))]">
        Resize the viewport to see size changes: sm on mobile, md on tablet, lg on desktop
      </p>
      <SkeletonStats size={{ base: 'sm', md: 'md', lg: 'lg' }} showIcon showTrend />
    </div>
  ),
};

/** Responsive with only some breakpoints */
export const ResponsivePartial: Story = {
  render: () => (
    <div className="space-y-4">
      <p className="text-sm text-[rgb(var(--muted-foreground))]">
        Only base and lg specified: starts small, jumps to large on lg breakpoint
      </p>
      <SkeletonStats size={{ base: 'sm', lg: 'lg' }} showIcon showTrend />
    </div>
  ),
};

// =============================================================================
// USAGE CONTEXTS
// =============================================================================

/** In dashboard context */
export const InDashboardContext: Story = {
  render: () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Dashboard Overview</h2>
      <SkeletonStats showTrend />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 h-64">
          <div className="h-4 w-24 bg-[rgb(var(--muted))] rounded animate-pulse mb-4" />
          <div className="h-full bg-[rgb(var(--muted))] rounded animate-pulse" />
        </div>
        <div className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 h-64">
          <div className="h-4 w-24 bg-[rgb(var(--muted))] rounded animate-pulse mb-4" />
          <div className="h-full bg-[rgb(var(--muted))] rounded animate-pulse" />
        </div>
      </div>
    </div>
  ),
};

/** Analytics page loading */
export const AnalyticsPageLoading: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold mb-4">Key Metrics</h2>
        <SkeletonStats showIcon showTrend />
      </div>
      <div>
        <h2 className="text-lg font-semibold mb-4">Performance</h2>
        <SkeletonStats count={3} showTrend />
      </div>
    </div>
  ),
};

/** Widget loading in sidebar */
export const SidebarWidgetLoading: Story = {
  render: () => (
    <div className="w-72 border border-[rgb(var(--border))] rounded-lg p-4 bg-[rgb(var(--card))]">
      <h3 className="text-sm font-medium mb-3">Quick Stats</h3>
      <div className="grid grid-cols-2 gap-3">
        <SkeletonStats count={4} size="sm" className="grid-cols-2 lg:grid-cols-2" />
      </div>
    </div>
  ),
};

/** Mobile view simulation */
export const MobileView: Story = {
  render: () => (
    <div className="max-w-[375px] border border-[rgb(var(--border))] rounded-lg p-4 mx-auto bg-[rgb(var(--background))]">
      <h2 className="text-lg font-semibold mb-4">Your Stats</h2>
      <SkeletonStats size="sm" showTrend />
    </div>
  ),
};

// =============================================================================
// ACCESSIBILITY
// =============================================================================

/** Accessibility demonstration */
export const AccessibilityDemo: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
        <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
          Accessibility Features
        </h3>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
          <li>aria-hidden="true" - Hidden from screen readers</li>
          <li>role="presentation" - Indicates decorative purpose</li>
          <li>motion-safe:animate-pulse - Respects reduced motion preference</li>
          <li>Skeleton provides visual loading feedback for sighted users</li>
          <li>Screen reader users should hear "Loading stats" or similar from parent</li>
        </ul>
      </div>
      <SkeletonStats data-testid="a11y-demo" showIcon showTrend />
    </div>
  ),
};

/** Reduced motion demonstration */
export const ReducedMotionDemo: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="p-4 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800">
        <h3 className="font-medium text-amber-900 dark:text-amber-100 mb-2">
          Reduced Motion Support
        </h3>
        <p className="text-sm text-amber-800 dark:text-amber-200">
          The skeleton uses <code>motion-safe:animate-pulse</code> which respects the user's reduced
          motion preference. To test, enable "Reduce motion" in your OS accessibility settings.
        </p>
      </div>
      <SkeletonStats showIcon showTrend />
    </div>
  ),
};

// =============================================================================
// REF FORWARDING & DATA ATTRIBUTES
// =============================================================================

/** Ref forwarding demonstration */
export const RefForwarding: Story = {
  render: function RefForwardingDemo() {
    const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);

    return (
      <div className="space-y-4">
        <SkeletonStats
          ref={(el) => {
            if (el && !dimensions) {
              const rect = el.getBoundingClientRect();
              setDimensions({ width: Math.round(rect.width), height: Math.round(rect.height) });
            }
          }}
        />
        {dimensions && (
          <p className="text-sm text-[rgb(var(--muted-foreground))]">
            Container dimensions: {dimensions.width}x{dimensions.height}px (via ref)
          </p>
        )}
      </div>
    );
  },
};

/** Data-testid demonstration */
export const DataTestId: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
        <h3 className="font-medium text-green-900 dark:text-green-100 mb-2">Testing Attributes</h3>
        <p className="text-sm text-green-800 dark:text-green-200 mb-2">
          Inspect the DOM to see these test IDs:
        </p>
        <ul className="text-sm text-green-800 dark:text-green-200 space-y-1 list-disc list-inside">
          <li>stats-skeleton (container)</li>
          <li>stats-skeleton-stat-0, stats-skeleton-stat-1, etc. (stat cards)</li>
          <li>stats-skeleton-stat-0-icon (icon skeleton)</li>
          <li>stats-skeleton-stat-0-label (label skeleton)</li>
          <li>stats-skeleton-stat-0-value (value skeleton)</li>
          <li>stats-skeleton-stat-0-trend (trend skeleton)</li>
        </ul>
      </div>
      <SkeletonStats data-testid="stats-skeleton" count={2} showIcon showTrend />
    </div>
  ),
};

// =============================================================================
// REAL-WORLD EXAMPLES
// =============================================================================

/** Loading transition demo */
export const LoadingTransitionDemo: Story = {
  render: function LoadingDemo() {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      const timer = setInterval(() => {
        setIsLoading((prev) => !prev);
      }, 3000);
      return () => clearInterval(timer);
    }, []);

    if (isLoading) {
      return (
        <div className="space-y-4">
          <p className="text-sm text-[rgb(var(--muted-foreground))]">
            Loading... (switches every 3 seconds)
          </p>
          <SkeletonStats showTrend />
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <p className="text-sm text-[rgb(var(--muted-foreground))]">
          Loaded! (switches every 3 seconds)
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Total Users', value: '12,345', trend: '+12.5%' },
            { label: 'Active Sessions', value: '1,234', trend: '+5.2%' },
            { label: 'Revenue', value: '$45,678', trend: '+18.3%' },
            { label: 'Conversion', value: '3.2%', trend: '-2.1%' },
          ].map((stat, i) => (
            <div
              key={i}
              className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4"
            >
              <p className="text-xs text-[rgb(var(--muted-foreground))]">{stat.label}</p>
              <p className="text-2xl font-bold mt-1">{stat.value}</p>
              <p
                className={`text-xs mt-2 ${stat.trend.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}
              >
                {stat.trend}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  },
};

/** E-commerce dashboard stats */
export const EcommerceDashboard: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Sales Overview</h2>
        <div className="flex gap-2">
          <div className="h-8 w-24 bg-[rgb(var(--muted))] rounded animate-pulse" />
          <div className="h-8 w-24 bg-[rgb(var(--muted))] rounded animate-pulse" />
        </div>
      </div>
      <SkeletonStats showIcon showTrend />
      <div className="text-sm text-[rgb(var(--muted-foreground))]">
        Loading sales data, order counts, revenue, and conversion metrics...
      </div>
    </div>
  ),
};

/** Project metrics loading */
export const ProjectMetricsLoading: Story = {
  render: () => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Project Health</h3>
      <SkeletonStats count={3} showTrend size="sm" />
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
          <div className="h-4 w-20 bg-[rgb(var(--muted))] rounded animate-pulse mb-2" />
          <div className="h-32 bg-[rgb(var(--muted))] rounded animate-pulse" />
        </div>
        <div className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
          <div className="h-4 w-20 bg-[rgb(var(--muted))] rounded animate-pulse mb-2" />
          <div className="h-32 bg-[rgb(var(--muted))] rounded animate-pulse" />
        </div>
      </div>
    </div>
  ),
};

/** Compact stats in header */
export const CompactHeaderStats: Story = {
  render: () => (
    <div className="border-b border-[rgb(var(--border))] pb-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex gap-6">
          {/* Inline mini stats */}
          <div className="flex items-center gap-2">
            <div className="h-3 w-16 bg-[rgb(var(--muted))] rounded animate-pulse" />
            <div className="h-5 w-12 bg-[rgb(var(--muted))] rounded animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-16 bg-[rgb(var(--muted))] rounded animate-pulse" />
            <div className="h-5 w-12 bg-[rgb(var(--muted))] rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  ),
};

// =============================================================================
// CONSTANTS & UTILITIES REFERENCE
// =============================================================================

/** Constants and utility functions reference */
export const ConstantsReference: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border">
        <h3 className="font-medium mb-4">Exported Constants</h3>
        <div className="space-y-4 text-sm font-mono">
          <div>
            <p className="text-[rgb(var(--muted-foreground))]">DEFAULT_STAT_COUNT:</p>
            <p>{DEFAULT_STAT_COUNT}</p>
          </div>
          <div>
            <p className="text-[rgb(var(--muted-foreground))]">SKELETON_STATS_BASE_CLASSES:</p>
            <p>"{SKELETON_STATS_BASE_CLASSES}"</p>
          </div>
          <div>
            <p className="text-[rgb(var(--muted-foreground))]">SKELETON_STATS_GRID_CLASSES:</p>
            <p>"{SKELETON_STATS_GRID_CLASSES}"</p>
          </div>
          <div>
            <p className="text-[rgb(var(--muted-foreground))]">SKELETON_STATS_GAP_CLASSES:</p>
            <pre>{JSON.stringify(SKELETON_STATS_GAP_CLASSES, null, 2)}</pre>
          </div>
          <div>
            <p className="text-[rgb(var(--muted-foreground))]">SKELETON_STAT_CARD_CLASSES:</p>
            <p>"{SKELETON_STAT_CARD_CLASSES}"</p>
          </div>
          <div>
            <p className="text-[rgb(var(--muted-foreground))]">
              SKELETON_STAT_CARD_PADDING_CLASSES:
            </p>
            <pre>{JSON.stringify(SKELETON_STAT_CARD_PADDING_CLASSES, null, 2)}</pre>
          </div>
          <div>
            <p className="text-[rgb(var(--muted-foreground))]">SKELETON_STAT_LABEL_CLASSES:</p>
            <pre>{JSON.stringify(SKELETON_STAT_LABEL_CLASSES, null, 2)}</pre>
          </div>
          <div>
            <p className="text-[rgb(var(--muted-foreground))]">SKELETON_STAT_VALUE_CLASSES:</p>
            <pre>{JSON.stringify(SKELETON_STAT_VALUE_CLASSES, null, 2)}</pre>
          </div>
          <div>
            <p className="text-[rgb(var(--muted-foreground))]">SKELETON_STAT_GAP_CLASSES:</p>
            <pre>{JSON.stringify(SKELETON_STAT_GAP_CLASSES, null, 2)}</pre>
          </div>
          <div>
            <p className="text-[rgb(var(--muted-foreground))]">SKELETON_STAT_TREND_CLASSES:</p>
            <pre>{JSON.stringify(SKELETON_STAT_TREND_CLASSES, null, 2)}</pre>
          </div>
          <div>
            <p className="text-[rgb(var(--muted-foreground))]">SKELETON_STAT_ICON_CLASSES:</p>
            <pre>{JSON.stringify(SKELETON_STAT_ICON_CLASSES, null, 2)}</pre>
          </div>
          <div>
            <p className="text-[rgb(var(--muted-foreground))]">
              SKELETON_STAT_ICON_MARGIN_CLASSES:
            </p>
            <pre>{JSON.stringify(SKELETON_STAT_ICON_MARGIN_CLASSES, null, 2)}</pre>
          </div>
          <div>
            <p className="text-[rgb(var(--muted-foreground))]">
              SKELETON_STAT_TREND_MARGIN_CLASSES:
            </p>
            <pre>{JSON.stringify(SKELETON_STAT_TREND_MARGIN_CLASSES, null, 2)}</pre>
          </div>
        </div>
      </div>

      <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border">
        <h3 className="font-medium mb-4">Utility Functions</h3>
        <div className="space-y-4 text-sm font-mono">
          <div>
            <p className="text-[rgb(var(--muted-foreground))]">getBaseSize('lg'):</p>
            <p>"{getBaseSize('lg')}"</p>
          </div>
          <div>
            <p className="text-[rgb(var(--muted-foreground))]">
              getBaseSize({'{ base: "sm", md: "lg" }'}):
            </p>
            <p>"{getBaseSize({ base: 'sm', md: 'lg' })}"</p>
          </div>
          <div>
            <p className="text-[rgb(var(--muted-foreground))]">
              getResponsiveSizeClasses('md', SKELETON_STATS_GAP_CLASSES):
            </p>
            <p>"{getResponsiveSizeClasses('md', SKELETON_STATS_GAP_CLASSES)}"</p>
          </div>
          <div>
            <p className="text-[rgb(var(--muted-foreground))]">
              getResponsiveSizeClasses({'{ base: "sm", lg: "lg" }'}, SKELETON_STATS_GAP_CLASSES):
            </p>
            <p>
              "{getResponsiveSizeClasses({ base: 'sm', lg: 'lg' }, SKELETON_STATS_GAP_CLASSES)}"
            </p>
          </div>
          <div>
            <p className="text-[rgb(var(--muted-foreground))]">getIconDimensions('lg'):</p>
            <pre>{JSON.stringify(getIconDimensions('lg'), null, 2)}</pre>
          </div>
        </div>
      </div>
    </div>
  ),
};
