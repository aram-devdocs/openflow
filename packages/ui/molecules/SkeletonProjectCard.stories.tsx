/**
 * SkeletonProjectCard Stories
 *
 * Comprehensive Storybook stories demonstrating all features:
 * - Size variants (sm, md, lg)
 * - Responsive sizing
 * - Description visibility options
 * - Accessibility features
 * - Real-world usage contexts
 */

import type { Meta, StoryObj } from '@storybook/react';
import { useRef, useState } from 'react';
import {
  SKELETON_PROJECT_CARD_BASE_CLASSES,
  SKELETON_PROJECT_CARD_DESCRIPTION_CLASSES,
  SKELETON_PROJECT_CARD_ICON_CLASSES,
  SKELETON_PROJECT_CARD_ICON_MARGIN_CLASSES,
  SKELETON_PROJECT_CARD_PADDING_CLASSES,
  SKELETON_PROJECT_CARD_TITLE_CLASSES,
  SKELETON_PROJECT_CARD_TITLE_MARGIN_CLASSES,
  SkeletonProjectCard,
  getBaseSize,
  getIconDimensions,
  getResponsiveSizeClasses,
} from './SkeletonProjectCard';

const meta: Meta<typeof SkeletonProjectCard> = {
  title: 'Molecules/SkeletonProjectCard',
  component: SkeletonProjectCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
SkeletonProjectCard provides a loading placeholder that matches the ProjectCard layout.

## Features
- **Responsive sizing**: Supports \`sm\`, \`md\`, \`lg\` sizes with breakpoint support
- **Accessibility**: Uses \`aria-hidden={true}\` and \`role="presentation"\` to hide from screen readers
- **forwardRef**: Supports ref forwarding for DOM access
- **data-testid**: Built-in testing support

## Usage
\`\`\`tsx
// Basic usage
<SkeletonProjectCard />

// Custom size
<SkeletonProjectCard size="lg" />

// Responsive size
<SkeletonProjectCard size={{ base: 'sm', md: 'md', lg: 'lg' }} />

// Without description
<SkeletonProjectCard showDescription={false} />
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      description: 'Size variant for the skeleton card',
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
    },
    showDescription: {
      description: 'Whether to show the description/path skeleton line',
      control: { type: 'boolean' },
    },
    className: {
      description: 'Additional CSS classes',
      control: { type: 'text' },
    },
    'data-testid': {
      description: 'Test ID for automated testing',
      control: { type: 'text' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof SkeletonProjectCard>;

// =============================================================================
// Basic Examples
// =============================================================================

/** Default project card skeleton with medium size */
export const Default: Story = {
  render: () => (
    <div className="w-64">
      <SkeletonProjectCard />
    </div>
  ),
};

/** Project card skeleton without description line */
export const NoDescription: Story = {
  render: () => (
    <div className="w-64">
      <SkeletonProjectCard showDescription={false} />
    </div>
  ),
};

// =============================================================================
// Size Variants
// =============================================================================

/** Small size variant - compact spacing */
export const SizeSmall: Story = {
  render: () => (
    <div className="w-56">
      <SkeletonProjectCard size="sm" />
    </div>
  ),
};

/** Medium size variant (default) - standard spacing */
export const SizeMedium: Story = {
  render: () => (
    <div className="w-64">
      <SkeletonProjectCard size="md" />
    </div>
  ),
};

/** Large size variant - expanded spacing */
export const SizeLarge: Story = {
  render: () => (
    <div className="w-72">
      <SkeletonProjectCard size="lg" />
    </div>
  ),
};

/** All sizes comparison */
export const AllSizes: Story = {
  render: () => (
    <div className="flex items-start gap-6">
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-[rgb(var(--muted-foreground))]">Small</span>
        <div className="w-56">
          <SkeletonProjectCard size="sm" />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-[rgb(var(--muted-foreground))]">Medium</span>
        <div className="w-64">
          <SkeletonProjectCard size="md" />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-[rgb(var(--muted-foreground))]">Large</span>
        <div className="w-72">
          <SkeletonProjectCard size="lg" />
        </div>
      </div>
    </div>
  ),
};

// =============================================================================
// Responsive Sizing
// =============================================================================

/** Responsive size - changes at breakpoints */
export const ResponsiveSizing: Story = {
  render: () => (
    <div className="w-full max-w-sm">
      <p className="mb-4 text-sm text-[rgb(var(--muted-foreground))]">
        Resize the viewport to see the skeleton change sizes:
        <br />• Mobile: Small (sm)
        <br />• Tablet: Medium (md)
        <br />• Desktop: Large (lg)
      </p>
      <SkeletonProjectCard size={{ base: 'sm', md: 'md', lg: 'lg' }} />
    </div>
  ),
};

/** Responsive sizing demo with breakpoint labels */
export const ResponsiveSizingWithLabels: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-full max-w-sm">
      <div>
        <p className="mb-2 text-xs font-medium text-[rgb(var(--muted-foreground))]">base: sm</p>
        <SkeletonProjectCard size={{ base: 'sm' }} />
      </div>
      <div>
        <p className="mb-2 text-xs font-medium text-[rgb(var(--muted-foreground))]">
          base: sm, md: md
        </p>
        <SkeletonProjectCard size={{ base: 'sm', md: 'md' }} />
      </div>
      <div>
        <p className="mb-2 text-xs font-medium text-[rgb(var(--muted-foreground))]">
          base: sm, md: md, lg: lg
        </p>
        <SkeletonProjectCard size={{ base: 'sm', md: 'md', lg: 'lg' }} />
      </div>
    </div>
  ),
};

// =============================================================================
// Grid Layouts
// =============================================================================

/** Multiple project cards showing a loading grid */
export const Grid: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4 w-[540px]">
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonProjectCard key={`skeleton-project-${i}`} />
      ))}
    </div>
  ),
};

/** Three column grid layout */
export const ThreeColumnGrid: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-4 w-[720px]">
      {Array.from({ length: 6 }).map((_, i) => (
        <SkeletonProjectCard key={`skeleton-project-${i}`} size="sm" />
      ))}
    </div>
  ),
};

/** Responsive grid - changes columns at breakpoints */
export const ResponsiveGrid: Story = {
  render: () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full max-w-5xl">
      {Array.from({ length: 8 }).map((_, i) => (
        <SkeletonProjectCard key={`skeleton-project-${i}`} size={{ base: 'sm', md: 'md' }} />
      ))}
    </div>
  ),
};

// =============================================================================
// Usage Contexts
// =============================================================================

/** Wide project card skeleton */
export const WideCard: Story = {
  render: () => (
    <div className="w-80">
      <SkeletonProjectCard />
    </div>
  ),
};

/** In page context with header */
export const InPageContext: Story = {
  render: () => (
    <div className="w-full max-w-4xl p-6 bg-[rgb(var(--background))] rounded-lg">
      <h1 className="text-2xl font-bold text-[rgb(var(--foreground))] mb-6">Projects</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonProjectCard key={`project-${i}`} />
        ))}
      </div>
    </div>
  ),
};

/** Projects list loading state */
export const ProjectsListLoading: Story = {
  render: () => (
    <div className="w-full max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <div className="w-32 h-8 bg-[rgb(var(--muted))] rounded animate-pulse" />
        <div className="w-24 h-9 bg-[rgb(var(--muted))] rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonProjectCard key={`project-${i}`} />
        ))}
      </div>
    </div>
  ),
};

/** Dashboard widget loading */
export const DashboardWidgetLoading: Story = {
  render: () => (
    <div className="w-full max-w-md p-4 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))]">
      <h2 className="text-lg font-semibold text-[rgb(var(--foreground))] mb-4">Recent Projects</h2>
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonProjectCard key={`recent-${i}`} size="sm" />
        ))}
      </div>
    </div>
  ),
};

/** In scrollable container */
export const InScrollableContainer: Story = {
  render: () => (
    <div className="w-full max-w-md h-[400px] overflow-y-auto p-4 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))]">
      <h2 className="text-lg font-semibold text-[rgb(var(--foreground))] mb-4 sticky top-0 bg-[rgb(var(--card))]">
        All Projects
      </h2>
      <div className="flex flex-col gap-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <SkeletonProjectCard key={`scroll-${i}`} />
        ))}
      </div>
    </div>
  ),
};

// =============================================================================
// Accessibility Demos
// =============================================================================

/** Accessibility demo - shows how skeleton is hidden from screen readers */
export const AccessibilityDemo: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-full max-w-md">
      <div className="p-4 bg-[rgb(var(--muted))] rounded-lg">
        <h3 className="font-medium text-[rgb(var(--foreground))] mb-2">Accessibility Features</h3>
        <ul className="text-sm text-[rgb(var(--muted-foreground))] space-y-1 list-disc list-inside">
          <li>aria-hidden={true} - Hidden from screen readers</li>
          <li>role="presentation" - Semantic non-content role</li>
          <li>motion-safe: prefix - Respects reduced motion</li>
        </ul>
      </div>
      <SkeletonProjectCard data-testid="accessible-skeleton" />
      <p className="text-xs text-[rgb(var(--muted-foreground))]">
        Inspect the DOM to see aria-hidden={true} and role="presentation" attributes.
      </p>
    </div>
  ),
};

/** Reduced motion demo */
export const ReducedMotionDemo: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-full max-w-md">
      <div className="p-4 bg-[rgb(var(--muted))] rounded-lg">
        <h3 className="font-medium text-[rgb(var(--foreground))] mb-2">Reduced Motion Support</h3>
        <p className="text-sm text-[rgb(var(--muted-foreground))]">
          The skeleton pulse animation respects the user's `prefers-reduced-motion` setting. Enable
          reduced motion in your system settings to see the static skeleton.
        </p>
      </div>
      <SkeletonProjectCard />
    </div>
  ),
};

// =============================================================================
// Ref Forwarding & Data Attributes
// =============================================================================

/** Demonstrates ref forwarding */
export const RefForwarding: Story = {
  render: function RefForwardingStory() {
    const ref = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);

    const measureElement = () => {
      if (ref.current) {
        const { width, height } = ref.current.getBoundingClientRect();
        setDimensions({ width: Math.round(width), height: Math.round(height) });
      }
    };

    return (
      <div className="flex flex-col gap-4 w-64">
        <SkeletonProjectCard ref={ref} />
        <button
          type="button"
          onClick={measureElement}
          className="px-4 py-2 bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))] rounded-md text-sm"
        >
          Measure Element
        </button>
        {dimensions && (
          <p className="text-sm text-[rgb(var(--muted-foreground))]">
            Dimensions: {dimensions.width}px × {dimensions.height}px
          </p>
        )}
      </div>
    );
  },
};

/** Demonstrates data-testid support */
export const DataTestId: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-64">
      <SkeletonProjectCard data-testid="project-skeleton" />
      <div className="p-4 bg-[rgb(var(--muted))] rounded-lg text-sm">
        <p className="font-medium text-[rgb(var(--foreground))] mb-2">Data Test IDs:</p>
        <ul className="text-[rgb(var(--muted-foreground))] space-y-1 list-disc list-inside">
          <li>project-skeleton (container)</li>
          <li>project-skeleton-icon</li>
          <li>project-skeleton-title</li>
          <li>project-skeleton-description</li>
        </ul>
      </div>
    </div>
  ),
};

// =============================================================================
// Real-World Examples
// =============================================================================

/** Loading transition demo - simulates loading to loaded state */
export const LoadingTransitionDemo: Story = {
  render: function LoadingTransitionStory() {
    const [isLoading, setIsLoading] = useState(true);

    return (
      <div className="flex flex-col gap-4 w-full max-w-md">
        <button
          type="button"
          onClick={() => setIsLoading(!isLoading)}
          className="self-start px-4 py-2 bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))] rounded-md text-sm"
        >
          {isLoading ? 'Show Loaded Content' : 'Show Loading State'}
        </button>
        <div className="grid grid-cols-2 gap-4">
          {isLoading ? (
            <>
              <SkeletonProjectCard />
              <SkeletonProjectCard />
              <SkeletonProjectCard />
              <SkeletonProjectCard />
            </>
          ) : (
            <>
              {['OpenFlow', 'Analytics', 'Dashboard', 'Settings'].map((name) => (
                <div
                  key={name}
                  className="flex flex-col rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4"
                >
                  <div className="w-10 h-10 rounded-lg bg-[rgb(var(--primary))] mb-3 flex items-center justify-center text-[rgb(var(--primary-foreground))] font-bold">
                    {name[0]}
                  </div>
                  <p className="font-medium text-[rgb(var(--foreground))]">{name}</p>
                  <p className="text-sm text-[rgb(var(--muted-foreground))]">
                    ~/projects/{name.toLowerCase()}
                  </p>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    );
  },
};

/** Empty projects page loading state */
export const EmptyProjectsPageLoading: Story = {
  render: () => (
    <div className="w-full max-w-4xl p-8 bg-[rgb(var(--background))]">
      <div className="flex justify-between items-center mb-8">
        <div className="flex flex-col gap-2">
          <div className="w-40 h-8 bg-[rgb(var(--muted))] rounded animate-pulse" />
          <div className="w-64 h-4 bg-[rgb(var(--muted))] rounded animate-pulse" />
        </div>
        <div className="w-32 h-10 bg-[rgb(var(--muted))] rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonProjectCard key={`empty-${i}`} size={{ base: 'sm', md: 'md' }} />
        ))}
      </div>
    </div>
  ),
};

/** Sidebar project list loading */
export const SidebarProjectListLoading: Story = {
  render: () => (
    <div className="w-64 h-[500px] p-3 bg-[rgb(var(--card))] border-r border-[rgb(var(--border))]">
      <div className="flex justify-between items-center mb-4">
        <div className="w-20 h-5 bg-[rgb(var(--muted))] rounded animate-pulse" />
        <div className="w-6 h-6 bg-[rgb(var(--muted))] rounded animate-pulse" />
      </div>
      <div className="flex flex-col gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonProjectCard key={`sidebar-${i}`} size="sm" showDescription={false} />
        ))}
      </div>
    </div>
  ),
};

/** Mobile project selector loading */
export const MobileView: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  render: () => (
    <div className="w-full p-4 bg-[rgb(var(--background))]">
      <div className="flex justify-between items-center mb-4">
        <div className="w-24 h-6 bg-[rgb(var(--muted))] rounded animate-pulse" />
        <div className="w-8 h-8 bg-[rgb(var(--muted))] rounded animate-pulse" />
      </div>
      <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonProjectCard key={`mobile-${i}`} size="sm" />
        ))}
      </div>
    </div>
  ),
};

// =============================================================================
// Constants Reference
// =============================================================================

/** Reference for exported constants */
export const ConstantsReference: Story = {
  render: () => (
    <div className="w-full max-w-2xl p-6 bg-[rgb(var(--muted))] rounded-lg">
      <h3 className="font-semibold text-[rgb(var(--foreground))] mb-4">Exported Constants</h3>
      <div className="space-y-4 text-sm font-mono">
        <div>
          <p className="font-medium text-[rgb(var(--foreground))]">
            SKELETON_PROJECT_CARD_BASE_CLASSES:
          </p>
          <p className="text-[rgb(var(--muted-foreground))] break-all">
            {SKELETON_PROJECT_CARD_BASE_CLASSES}
          </p>
        </div>
        <div>
          <p className="font-medium text-[rgb(var(--foreground))]">
            SKELETON_PROJECT_CARD_PADDING_CLASSES:
          </p>
          <pre className="text-[rgb(var(--muted-foreground))]">
            {JSON.stringify(SKELETON_PROJECT_CARD_PADDING_CLASSES, null, 2)}
          </pre>
        </div>
        <div>
          <p className="font-medium text-[rgb(var(--foreground))]">
            SKELETON_PROJECT_CARD_ICON_CLASSES:
          </p>
          <pre className="text-[rgb(var(--muted-foreground))]">
            {JSON.stringify(SKELETON_PROJECT_CARD_ICON_CLASSES, null, 2)}
          </pre>
        </div>
        <div>
          <p className="font-medium text-[rgb(var(--foreground))]">
            SKELETON_PROJECT_CARD_ICON_MARGIN_CLASSES:
          </p>
          <pre className="text-[rgb(var(--muted-foreground))]">
            {JSON.stringify(SKELETON_PROJECT_CARD_ICON_MARGIN_CLASSES, null, 2)}
          </pre>
        </div>
        <div>
          <p className="font-medium text-[rgb(var(--foreground))]">
            SKELETON_PROJECT_CARD_TITLE_CLASSES:
          </p>
          <pre className="text-[rgb(var(--muted-foreground))]">
            {JSON.stringify(SKELETON_PROJECT_CARD_TITLE_CLASSES, null, 2)}
          </pre>
        </div>
        <div>
          <p className="font-medium text-[rgb(var(--foreground))]">
            SKELETON_PROJECT_CARD_TITLE_MARGIN_CLASSES:
          </p>
          <pre className="text-[rgb(var(--muted-foreground))]">
            {JSON.stringify(SKELETON_PROJECT_CARD_TITLE_MARGIN_CLASSES, null, 2)}
          </pre>
        </div>
        <div>
          <p className="font-medium text-[rgb(var(--foreground))]">
            SKELETON_PROJECT_CARD_DESCRIPTION_CLASSES:
          </p>
          <pre className="text-[rgb(var(--muted-foreground))]">
            {JSON.stringify(SKELETON_PROJECT_CARD_DESCRIPTION_CLASSES, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  ),
};

/** Reference for exported utility functions */
export const UtilityFunctionsReference: Story = {
  render: () => {
    // Example usage of utility functions
    const baseSizeFromString = getBaseSize('lg');
    const baseSizeFromObject = getBaseSize({ base: 'sm', md: 'md', lg: 'lg' });
    const responsiveClasses = getResponsiveSizeClasses(
      { base: 'sm', md: 'md', lg: 'lg' },
      SKELETON_PROJECT_CARD_PADDING_CLASSES
    );
    const iconDimensionsSm = getIconDimensions('sm');
    const iconDimensionsMd = getIconDimensions('md');
    const iconDimensionsLg = getIconDimensions('lg');

    return (
      <div className="w-full max-w-2xl p-6 bg-[rgb(var(--muted))] rounded-lg">
        <h3 className="font-semibold text-[rgb(var(--foreground))] mb-4">
          Exported Utility Functions
        </h3>
        <div className="space-y-4 text-sm font-mono">
          <div>
            <p className="font-medium text-[rgb(var(--foreground))]">getBaseSize('lg'):</p>
            <p className="text-[rgb(var(--muted-foreground))]">{baseSizeFromString}</p>
          </div>
          <div>
            <p className="font-medium text-[rgb(var(--foreground))]">
              getBaseSize({'{ base: "sm", md: "md", lg: "lg" }'}):
            </p>
            <p className="text-[rgb(var(--muted-foreground))]">{baseSizeFromObject}</p>
          </div>
          <div>
            <p className="font-medium text-[rgb(var(--foreground))]">
              getResponsiveSizeClasses({'{ base: "sm", md: "md", lg: "lg" }'}, PADDING_CLASSES):
            </p>
            <p className="text-[rgb(var(--muted-foreground))] break-all">{responsiveClasses}</p>
          </div>
          <div>
            <p className="font-medium text-[rgb(var(--foreground))]">getIconDimensions('sm'):</p>
            <p className="text-[rgb(var(--muted-foreground))]">
              {JSON.stringify(iconDimensionsSm)}
            </p>
          </div>
          <div>
            <p className="font-medium text-[rgb(var(--foreground))]">getIconDimensions('md'):</p>
            <p className="text-[rgb(var(--muted-foreground))]">
              {JSON.stringify(iconDimensionsMd)}
            </p>
          </div>
          <div>
            <p className="font-medium text-[rgb(var(--foreground))]">getIconDimensions('lg'):</p>
            <p className="text-[rgb(var(--muted-foreground))]">
              {JSON.stringify(iconDimensionsLg)}
            </p>
          </div>
        </div>
      </div>
    );
  },
};
