import type { Meta, StoryObj } from '@storybook/react';
import { useEffect, useRef, useState } from 'react';
import { Skeleton } from './Skeleton';

const meta: Meta<typeof Skeleton> = {
  title: 'Atoms/Skeleton',
  component: Skeleton,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Skeleton provides visual loading placeholders while content is being fetched.
Built on the Box primitive for consistent spacing and accessibility.

## Features
- **Three variants**: text, circular, rectangular
- **Responsive dimensions**: width/height support responsive objects
- **Motion-safe**: Animation respects prefers-reduced-motion
- **Screen reader hidden**: aria-hidden="true" prevents announcement
- **forwardRef**: Supports ref forwarding for DOM access
- **data-testid**: Supports test automation

## Accessibility
- \`aria-hidden="true"\` - Hidden from screen readers
- \`motion-safe:animate-pulse\` - Animation disabled for reduced motion
- Decorative element - provides visual indication only

## Usage Guidelines
- Use to indicate loading state for content areas
- Match skeleton dimensions to expected content
- Combine multiple skeletons for complex layouts
- Consider providing screen reader announcements via live regions
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['text', 'circular', 'rectangular'],
      description: 'Shape variant of the skeleton',
      table: {
        defaultValue: { summary: 'rectangular' },
      },
    },
    width: {
      control: 'text',
      description: 'Width (number for px, string for CSS unit, or responsive object)',
    },
    height: {
      control: 'text',
      description: 'Height (number for px, string for CSS unit, or responsive object)',
    },
    'data-testid': {
      control: 'text',
      description: 'Test ID for automation',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Skeleton>;

// =============================================================================
// BASIC VARIANTS
// =============================================================================

/** Default rectangular skeleton */
export const Default: Story = {
  args: {
    width: 200,
    height: 40,
  },
};

/** Text variant for single line content */
export const Text: Story = {
  args: {
    variant: 'text',
    className: 'w-48',
  },
};

/** Circular variant for avatars and icons */
export const Circular: Story = {
  args: {
    variant: 'circular',
    width: 48,
    height: 48,
  },
};

/** Rectangular variant for cards and images */
export const Rectangular: Story = {
  args: {
    variant: 'rectangular',
    width: 200,
    height: 120,
  },
};

// =============================================================================
// ALL VARIANTS
// =============================================================================

/** All variants displayed together */
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-[rgb(var(--muted-foreground))]">Text</span>
        <Skeleton variant="text" className="w-48" />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-[rgb(var(--muted-foreground))]">Circular</span>
        <Skeleton variant="circular" width={48} height={48} />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-[rgb(var(--muted-foreground))]">Rectangular</span>
        <Skeleton variant="rectangular" width={200} height={100} />
      </div>
    </div>
  ),
};

// =============================================================================
// RESPONSIVE DIMENSIONS
// =============================================================================

/** Responsive width - changes at breakpoints */
export const ResponsiveWidth: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Width changes at different breakpoints. Resize the viewport to see the skeleton width change: 150px (base) → 200px (sm) → 300px (md) → 400px (lg).',
      },
    },
  },
  render: () => (
    <div className="flex flex-col gap-2">
      <span className="text-xs text-[rgb(var(--muted-foreground))]">
        Resize viewport to see responsive width
      </span>
      <Skeleton
        variant="rectangular"
        width={{ base: 150, sm: 200, md: 300, lg: 400 }}
        height={40}
      />
    </div>
  ),
};

/** Responsive height - changes at breakpoints */
export const ResponsiveHeight: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Height changes at different breakpoints. Resize the viewport to see the skeleton height change.',
      },
    },
  },
  render: () => (
    <div className="flex flex-col gap-2">
      <span className="text-xs text-[rgb(var(--muted-foreground))]">
        Resize viewport to see responsive height
      </span>
      <Skeleton variant="rectangular" width={200} height={{ base: 50, sm: 75, md: 100, lg: 150 }} />
    </div>
  ),
};

/** Both dimensions responsive */
export const ResponsiveBothDimensions: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Both width and height change at different breakpoints.',
      },
    },
  },
  render: () => (
    <div className="flex flex-col gap-2">
      <span className="text-xs text-[rgb(var(--muted-foreground))]">
        Both dimensions are responsive
      </span>
      <Skeleton
        variant="rectangular"
        width={{ base: 150, md: 250, lg: 350 }}
        height={{ base: 80, md: 120, lg: 160 }}
      />
    </div>
  ),
};

// =============================================================================
// DIMENSION TYPES
// =============================================================================

/** Width as percentage */
export const PercentageWidth: Story = {
  render: () => (
    <div className="w-80 p-4 border border-[rgb(var(--border))] rounded-lg">
      <Skeleton variant="rectangular" width="100%" height={40} />
      <div className="mt-2">
        <Skeleton variant="rectangular" width="75%" height={20} />
      </div>
      <div className="mt-2">
        <Skeleton variant="rectangular" width="50%" height={20} />
      </div>
    </div>
  ),
};

/** Dimensions using CSS units */
export const CSSUnits: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <span className="text-xs text-[rgb(var(--muted-foreground))]">rem units</span>
        <Skeleton variant="rectangular" width="15rem" height="3rem" />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-xs text-[rgb(var(--muted-foreground))]">em units</span>
        <Skeleton variant="rectangular" width="12em" height="2.5em" />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-xs text-[rgb(var(--muted-foreground))]">viewport units</span>
        <Skeleton variant="rectangular" width="30vw" height="10vh" />
      </div>
    </div>
  ),
};

// =============================================================================
// COMPOSITE LAYOUTS
// =============================================================================

/** Simulated card content loading */
export const CardContentLoading: Story = {
  render: () => (
    <div className="w-64 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
      <div className="flex items-start gap-3">
        <Skeleton variant="circular" width={40} height={40} />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" className="w-3/4" />
          <Skeleton variant="text" className="w-1/2" />
        </div>
      </div>
      <Skeleton variant="rectangular" className="mt-4 h-24 w-full" />
      <div className="mt-4 flex gap-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  ),
};

/** Multiple text lines - paragraph loading */
export const TextLines: Story = {
  render: () => (
    <div className="w-64 space-y-2">
      <Skeleton variant="text" className="w-full" />
      <Skeleton variant="text" className="w-5/6" />
      <Skeleton variant="text" className="w-4/6" />
      <Skeleton variant="text" className="w-5/6" />
      <Skeleton variant="text" className="w-3/6" />
    </div>
  ),
};

/** Avatar sizes */
export const AvatarSizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      {[24, 32, 40, 48, 64].map((size) => (
        <div key={size} className="flex flex-col items-center gap-2">
          <Skeleton variant="circular" width={size} height={size} />
          <span className="text-xs text-[rgb(var(--muted-foreground))]">{size}px</span>
        </div>
      ))}
    </div>
  ),
};

/** Simulated list loading */
export const ListLoading: Story = {
  render: () => (
    <div className="w-72 space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={`list-item-${i}`} className="flex items-center gap-3">
          <Skeleton variant="circular" width={32} height={32} />
          <div className="flex-1 space-y-1">
            <Skeleton variant="text" className="w-2/3" />
            <Skeleton variant="text" className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  ),
};

/** Dashboard widget loading */
export const DashboardWidget: Story = {
  render: () => (
    <div className="w-80 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
      <div className="flex items-center justify-between mb-4">
        <Skeleton variant="text" className="w-24" />
        <Skeleton variant="rectangular" width={60} height={24} />
      </div>
      <Skeleton variant="rectangular" className="w-full h-32 mb-4" />
      <div className="grid grid-cols-3 gap-2">
        <Skeleton variant="rectangular" className="h-16" />
        <Skeleton variant="rectangular" className="h-16" />
        <Skeleton variant="rectangular" className="h-16" />
      </div>
    </div>
  ),
};

/** Table loading */
export const TableLoading: Story = {
  render: () => (
    <div className="w-96 rounded-lg border border-[rgb(var(--border))] overflow-hidden">
      {/* Header */}
      <div className="flex bg-[rgb(var(--muted))] p-3 gap-4">
        <Skeleton variant="text" className="w-24" />
        <Skeleton variant="text" className="flex-1" />
        <Skeleton variant="text" className="w-20" />
      </div>
      {/* Rows */}
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={`row-${i}`} className="flex p-3 gap-4 border-t border-[rgb(var(--border))]">
          <Skeleton variant="text" className="w-24" />
          <Skeleton variant="text" className="flex-1" />
          <Skeleton variant="text" className="w-20" />
        </div>
      ))}
    </div>
  ),
};

// =============================================================================
// RESPONSIVE COMPOSITE LAYOUTS
// =============================================================================

/** Responsive card - adapts to viewport */
export const ResponsiveCard: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Card skeleton that adapts its dimensions to the viewport.',
      },
    },
  },
  render: () => (
    <div className="w-full max-w-md p-4 border border-[rgb(var(--border))] rounded-lg">
      <Skeleton
        variant="rectangular"
        width="100%"
        height={{ base: 120, md: 160, lg: 200 }}
        className="mb-4"
      />
      <Skeleton variant="text" className="w-3/4 mb-2" />
      <Skeleton variant="text" className="w-1/2" />
    </div>
  ),
};

// =============================================================================
// ACCESSIBILITY
// =============================================================================

/** Accessibility demo - hidden from screen readers */
export const AccessibilityDemo: Story = {
  parameters: {
    docs: {
      description: {
        story: `
Skeleton is properly hidden from screen readers using \`aria-hidden="true"\`.
Screen readers will not announce this content.

For accessible loading states, combine Skeleton with a live region:
\`\`\`tsx
<div>
  {isLoading ? (
    <>
      <div role="status" className="sr-only">Loading content...</div>
      <Skeleton variant="rectangular" width={200} height={100} />
    </>
  ) : (
    <Content />
  )}
</div>
\`\`\`
        `,
      },
    },
  },
  render: () => (
    <div className="space-y-4">
      <div className="p-4 bg-[rgb(var(--muted))] rounded-lg">
        <p className="text-sm mb-2">
          Skeleton has <code className="bg-black/10 px-1 rounded">aria-hidden="true"</code>
        </p>
        <p className="text-xs text-[rgb(var(--muted-foreground))]">
          Use a screen reader to verify - this skeleton won't be announced
        </p>
      </div>
      <Skeleton variant="rectangular" width={200} height={40} />
    </div>
  ),
};

/** Reduced motion demo */
export const ReducedMotionDemo: Story = {
  parameters: {
    docs: {
      description: {
        story: `
Skeleton respects \`prefers-reduced-motion\` using Tailwind's \`motion-safe:\` variant.
When reduced motion is preferred, the pulse animation is disabled.

Test by enabling "Reduce motion" in your OS accessibility settings.
        `,
      },
    },
  },
  render: () => (
    <div className="space-y-4">
      <div className="p-4 bg-[rgb(var(--muted))] rounded-lg">
        <p className="text-sm mb-2">
          Uses <code className="bg-black/10 px-1 rounded">motion-safe:animate-pulse</code>
        </p>
        <p className="text-xs text-[rgb(var(--muted-foreground))]">
          Enable "Reduce motion" in OS settings to see static skeleton
        </p>
      </div>
      <Skeleton variant="rectangular" width={200} height={40} />
    </div>
  ),
};

// =============================================================================
// FORWARDREF & TESTID
// =============================================================================

/** forwardRef demo - access DOM element */
export const ForwardRefDemo: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Skeleton supports ref forwarding for direct DOM access.',
      },
    },
  },
  render: function ForwardRefStory() {
    const skeletonRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    useEffect(() => {
      if (skeletonRef.current) {
        const rect = skeletonRef.current.getBoundingClientRect();
        setDimensions({ width: Math.round(rect.width), height: Math.round(rect.height) });
      }
    }, []);

    return (
      <div className="space-y-4">
        <Skeleton ref={skeletonRef} variant="rectangular" width={200} height={60} />
        <div className="text-xs text-[rgb(var(--muted-foreground))]">
          Measured via ref: {dimensions.width}x{dimensions.height}px
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
        story: 'Skeleton supports data-testid for test automation.',
      },
    },
  },
  render: () => (
    <div className="space-y-2">
      <Skeleton variant="rectangular" width={200} height={40} data-testid="loading-skeleton" />
      <div className="text-xs text-[rgb(var(--muted-foreground))]">
        Element has <code className="bg-black/10 px-1 rounded">data-testid="loading-skeleton"</code>
      </div>
    </div>
  ),
};

// =============================================================================
// REAL-WORLD EXAMPLES
// =============================================================================

/** Profile card loading state */
export const ProfileCardLoading: Story = {
  render: () => (
    <div className="w-72 p-6 border border-[rgb(var(--border))] rounded-xl bg-[rgb(var(--card))]">
      <div className="flex flex-col items-center text-center">
        <Skeleton variant="circular" width={80} height={80} />
        <Skeleton variant="text" className="w-32 mt-4" />
        <Skeleton variant="text" className="w-24 h-3 mt-1" />
        <div className="flex gap-4 mt-4">
          <div className="text-center">
            <Skeleton variant="text" className="w-8 h-5 mx-auto" />
            <Skeleton variant="text" className="w-12 h-3 mt-1" />
          </div>
          <div className="text-center">
            <Skeleton variant="text" className="w-8 h-5 mx-auto" />
            <Skeleton variant="text" className="w-12 h-3 mt-1" />
          </div>
          <div className="text-center">
            <Skeleton variant="text" className="w-8 h-5 mx-auto" />
            <Skeleton variant="text" className="w-12 h-3 mt-1" />
          </div>
        </div>
        <Skeleton variant="rectangular" className="w-full h-9 mt-4" />
      </div>
    </div>
  ),
};

/** Article preview loading */
export const ArticlePreviewLoading: Story = {
  render: () => (
    <article className="w-96 p-4 border border-[rgb(var(--border))] rounded-lg">
      <Skeleton variant="rectangular" className="w-full h-48 mb-4" />
      <div className="flex items-center gap-2 mb-3">
        <Skeleton variant="circular" width={24} height={24} />
        <Skeleton variant="text" className="w-24" />
        <Skeleton variant="text" className="w-16 h-3" />
      </div>
      <Skeleton variant="text" className="w-full h-6 mb-2" />
      <Skeleton variant="text" className="w-full" />
      <Skeleton variant="text" className="w-4/5" />
      <Skeleton variant="text" className="w-2/3" />
    </article>
  ),
};

/** Form loading state */
export const FormLoading: Story = {
  render: () => (
    <div className="w-80 space-y-4">
      <div className="space-y-2">
        <Skeleton variant="text" className="w-16 h-4" />
        <Skeleton variant="rectangular" className="w-full h-10" />
      </div>
      <div className="space-y-2">
        <Skeleton variant="text" className="w-12 h-4" />
        <Skeleton variant="rectangular" className="w-full h-10" />
      </div>
      <div className="space-y-2">
        <Skeleton variant="text" className="w-20 h-4" />
        <Skeleton variant="rectangular" className="w-full h-24" />
      </div>
      <div className="flex gap-2 pt-2">
        <Skeleton variant="rectangular" className="w-20 h-10" />
        <Skeleton variant="rectangular" className="flex-1 h-10" />
      </div>
    </div>
  ),
};

/** Navigation loading */
export const NavigationLoading: Story = {
  render: () => (
    <nav className="w-64 p-4 border border-[rgb(var(--border))] rounded-lg">
      <Skeleton variant="rectangular" className="w-24 h-8 mb-6" />
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={`nav-${i}`} className="flex items-center gap-3 p-2">
            <Skeleton variant="rectangular" width={20} height={20} />
            <Skeleton variant="text" className="flex-1" />
          </div>
        ))}
      </div>
    </nav>
  ),
};

/** Media gallery loading */
export const MediaGalleryLoading: Story = {
  render: () => (
    <div className="w-96 grid grid-cols-3 gap-2">
      {Array.from({ length: 9 }).map((_, i) => (
        <Skeleton key={`media-${i}`} variant="rectangular" className="aspect-square" width="100%" />
      ))}
    </div>
  ),
};

/** Stats cards loading */
export const StatsCardsLoading: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4 w-96">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={`stat-${i}`} className="p-4 border border-[rgb(var(--border))] rounded-lg">
          <Skeleton variant="text" className="w-16 h-3 mb-2" />
          <Skeleton variant="text" className="w-24 h-8 mb-1" />
          <div className="flex items-center gap-1">
            <Skeleton variant="rectangular" width={16} height={16} />
            <Skeleton variant="text" className="w-12 h-3" />
          </div>
        </div>
      ))}
    </div>
  ),
};
