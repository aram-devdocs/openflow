import type { Meta, StoryObj } from '@storybook/react';
import { useRef, useState } from 'react';
import { Spinner } from './Spinner';

const meta: Meta<typeof Spinner> = {
  title: 'Atoms/Spinner',
  component: Spinner,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Spinner component for loading states with full accessibility support.

## Features
- **Responsive Sizing**: Supports breakpoint-based responsive sizes
- **Screen Reader Announcements**: Uses aria-live region to announce loading state
- **Reduced Motion**: Respects prefers-reduced-motion preference
- **Customizable Label**: Change the text announced to screen readers

## Accessibility
- \`role="status"\` and \`aria-live="polite"\` announce loading to screen readers
- SVG is \`aria-hidden="true"\` (decorative, label provides meaning)
- Animation disabled via \`motion-safe:\` for users with motion sensitivity
- \`focusable="false"\` prevents SVG from receiving keyboard focus

## Usage Patterns
- **Standalone**: Use default \`announce={true}\` for screen reader announcements
- **Inside Button**: Set \`announce={false}\` and use \`aria-busy\` on button
- **Custom Context**: Provide meaningful \`label\` for the specific operation
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
      description: 'Size of the spinner - supports responsive values',
    },
    label: {
      control: 'text',
      description: 'Accessible label announced to screen readers',
    },
    announce: {
      control: 'boolean',
      description: 'Whether to announce loading state to screen readers',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes for custom styling',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Spinner>;

// =============================================================================
// BASIC SIZES
// =============================================================================

/** Default spinner with medium size */
export const Default: Story = {
  args: {
    size: 'md',
  },
};

/** Extra small spinner for tight spaces */
export const ExtraSmall: Story = {
  args: {
    size: 'xs',
  },
};

/** Small spinner for inline use */
export const Small: Story = {
  args: {
    size: 'sm',
  },
};

/** Medium spinner (default) */
export const Medium: Story = {
  args: {
    size: 'md',
  },
};

/** Large spinner for prominent loading states */
export const Large: Story = {
  args: {
    size: 'lg',
  },
};

/** Extra large spinner for full-page loading states */
export const ExtraLarge: Story = {
  args: {
    size: 'xl',
  },
};

/** All sizes displayed together for comparison */
export const AllSizes: Story = {
  render: () => (
    <div className="flex items-end gap-6">
      <div className="flex flex-col items-center gap-2">
        <Spinner size="xs" announce={false} />
        <span className="text-xs text-[rgb(var(--muted-foreground))]">xs (12px)</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Spinner size="sm" announce={false} />
        <span className="text-xs text-[rgb(var(--muted-foreground))]">sm (16px)</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Spinner size="md" announce={false} />
        <span className="text-xs text-[rgb(var(--muted-foreground))]">md (20px)</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Spinner size="lg" announce={false} />
        <span className="text-xs text-[rgb(var(--muted-foreground))]">lg (24px)</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Spinner size="xl" announce={false} />
        <span className="text-xs text-[rgb(var(--muted-foreground))]">xl (32px)</span>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Visual comparison of all spinner sizes from extra small to extra large.',
      },
    },
  },
};

// =============================================================================
// RESPONSIVE SIZING
// =============================================================================

/** Responsive sizing - grows with viewport */
export const ResponsiveSizing: Story = {
  args: {
    size: { base: 'sm', sm: 'md', md: 'lg', lg: 'xl' },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Spinner size increases with viewport: sm on mobile, md on small screens, lg on medium, xl on large screens.',
      },
    },
  },
};

/** Responsive example with just base and large breakpoints */
export const ResponsiveSimple: Story = {
  args: {
    size: { base: 'sm', lg: 'lg' },
  },
  parameters: {
    docs: {
      description: {
        story: 'Simple responsive sizing: small on mobile/tablet, large on desktop.',
      },
    },
  },
};

// =============================================================================
// CUSTOM LABELS
// =============================================================================

/** Custom label for specific operations */
export const CustomLabel: Story = {
  args: {
    size: 'md',
    label: 'Saving your changes',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Custom label announced to screen readers. Use descriptive labels for specific operations.',
      },
    },
  },
};

/** Using aria-label prop directly */
export const AriaLabel: Story = {
  args: {
    size: 'md',
    'aria-label': 'Processing payment',
  },
  parameters: {
    docs: {
      description: {
        story: 'Alternative way to provide accessible label using aria-label prop.',
      },
    },
  },
};

// =============================================================================
// CUSTOM COLORS
// =============================================================================

/** Spinner with custom color via className */
export const CustomColorBlue: Story = {
  args: {
    size: 'lg',
    className: 'text-blue-500',
  },
};

/** Green success-themed spinner */
export const CustomColorGreen: Story = {
  args: {
    size: 'lg',
    className: 'text-green-500',
  },
};

/** Multiple colors demo */
export const CustomColors: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <div className="flex flex-col items-center gap-2">
        <Spinner size="lg" className="text-[rgb(var(--primary))]" announce={false} />
        <span className="text-xs text-[rgb(var(--muted-foreground))]">Primary</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Spinner size="lg" className="text-blue-500" announce={false} />
        <span className="text-xs text-[rgb(var(--muted-foreground))]">Blue</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Spinner size="lg" className="text-green-500" announce={false} />
        <span className="text-xs text-[rgb(var(--muted-foreground))]">Green</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Spinner size="lg" className="text-red-500" announce={false} />
        <span className="text-xs text-[rgb(var(--muted-foreground))]">Red</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Spinner size="lg" className="text-purple-500" announce={false} />
        <span className="text-xs text-[rgb(var(--muted-foreground))]">Purple</span>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Spinner inherits text color from parent or className. Useful for matching brand colors.',
      },
    },
  },
};

// =============================================================================
// CONTEXTUAL USAGE
// =============================================================================

/** Spinner in a loading button context */
export const InButtonContext: Story = {
  render: () => (
    <button
      type="button"
      className="inline-flex min-h-[44px] items-center gap-2 rounded-md bg-[rgb(var(--primary))] px-4 py-2 text-sm font-medium text-[rgb(var(--primary-foreground))]"
      disabled
      aria-busy="true"
      aria-label="Loading, please wait"
    >
      <Spinner size="sm" announce={false} />
      Loading...
    </button>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'When inside a button, set `announce={false}` and use `aria-busy="true"` on the button. The button provides the accessible context.',
      },
    },
  },
};

/** Spinner in a card loading state */
export const InCardContext: Story = {
  render: () => (
    <div className="flex h-32 w-48 items-center justify-center rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))]">
      <div className="flex flex-col items-center gap-2">
        <Spinner size="lg" label="Loading card content" />
        <span className="text-sm text-[rgb(var(--muted-foreground))]">Loading...</span>
      </div>
    </div>
  ),
};

/** Full page loading spinner */
export const FullPageLoading: Story = {
  render: () => (
    <div className="flex h-64 w-full items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Spinner size="xl" className="text-[rgb(var(--primary))]" label="Loading page content" />
        <p className="text-sm text-[rgb(var(--muted-foreground))]">Please wait...</p>
      </div>
    </div>
  ),
};

/** Inline loading indicator */
export const InlineLoading: Story = {
  render: () => (
    <p className="flex items-center gap-2 text-sm text-[rgb(var(--muted-foreground))]">
      <Spinner size="xs" announce={false} />
      Checking availability...
    </p>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Small inline spinner next to status text. Use xs or sm size for inline contexts.',
      },
    },
  },
};

// =============================================================================
// ACCESSIBILITY DEMOS
// =============================================================================

/** Screen reader accessibility demo */
export const ScreenReaderAccessibility: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div className="rounded border border-[rgb(var(--border))] p-4">
        <h3 className="mb-2 font-semibold">Default Announcement</h3>
        <p className="mb-3 text-sm text-[rgb(var(--muted-foreground))]">
          Screen readers will announce: "Loading"
        </p>
        <Spinner size="md" />
      </div>

      <div className="rounded border border-[rgb(var(--border))] p-4">
        <h3 className="mb-2 font-semibold">Custom Announcement</h3>
        <p className="mb-3 text-sm text-[rgb(var(--muted-foreground))]">
          Screen readers will announce: "Uploading files"
        </p>
        <Spinner size="md" label="Uploading files" />
      </div>

      <div className="rounded border border-[rgb(var(--border))] p-4">
        <h3 className="mb-2 font-semibold">No Announcement (for use in labeled containers)</h3>
        <p className="mb-3 text-sm text-[rgb(var(--muted-foreground))]">
          Spinner is silent - parent provides context
        </p>
        <div role="status" aria-label="Submitting form">
          <Spinner size="md" announce={false} />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: `
The spinner uses an aria-live region to announce its presence to screen readers.

- **Default**: Announces "Loading"
- **Custom label**: Announces your custom label
- **announce={false}**: Silent, use when parent provides context

Test with VoiceOver (Mac: Cmd+F5) or NVDA (Windows) to verify announcements.
        `,
      },
    },
  },
};

/** Reduced motion preference demo */
export const ReducedMotionDemo: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-[rgb(var(--muted-foreground))]">
        This spinner uses{' '}
        <code className="rounded bg-[rgb(var(--muted))] px-1">motion-safe:animate-spin</code>.
        Enable "Reduce motion" in your OS accessibility settings to see the animation stop.
      </p>
      <div className="flex items-center gap-4">
        <Spinner size="lg" />
        <span className="text-sm">Animation respects prefers-reduced-motion</span>
      </div>
      <p className="text-xs text-[rgb(var(--muted-foreground))]">
        macOS: System Preferences → Accessibility → Display → Reduce motion
        <br />
        Windows: Settings → Ease of Access → Display → Show animations
      </p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'The spinner animation is disabled when users have enabled "Reduce motion" in their OS settings.',
      },
    },
  },
};

// =============================================================================
// REF FORWARDING
// =============================================================================

/** Ref forwarding demo */
export const RefForwarding: Story = {
  render: function RefForwardingStory() {
    const spinnerRef = useRef<SVGSVGElement>(null);
    const [dimensions, setDimensions] = useState<string>('Click button to measure');

    const measureSpinner = () => {
      if (spinnerRef.current) {
        const rect = spinnerRef.current.getBoundingClientRect();
        setDimensions(`${Math.round(rect.width)}px × ${Math.round(rect.height)}px`);
      }
    };

    return (
      <div className="flex flex-col items-center gap-4">
        <Spinner ref={spinnerRef} size="lg" announce={false} />
        <button
          type="button"
          onClick={measureSpinner}
          className="rounded bg-[rgb(var(--primary))] px-3 py-1 text-sm text-[rgb(var(--primary-foreground))]"
        >
          Measure Spinner
        </button>
        <p className="text-sm text-[rgb(var(--muted-foreground))]">{dimensions}</p>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'The Spinner forwards refs to the underlying SVG element for DOM measurements or animations.',
      },
    },
  },
};

// =============================================================================
// DATA ATTRIBUTES
// =============================================================================

/** Data-testid for testing */
export const DataTestId: Story = {
  args: {
    size: 'md',
    'data-testid': 'loading-spinner',
  },
  parameters: {
    docs: {
      description: {
        story: 'Use data-testid for reliable element selection in automated tests.',
      },
    },
  },
};

// =============================================================================
// REAL-WORLD EXAMPLES
// =============================================================================

/** Form submission loading state */
export const FormSubmission: Story = {
  render: () => (
    <div className="flex w-64 flex-col gap-4 rounded-lg border border-[rgb(var(--border))] p-4">
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          value="user@example.com"
          disabled
          className="w-full rounded border border-[rgb(var(--border))] bg-[rgb(var(--muted))] px-3 py-2 text-sm opacity-50"
        />
      </div>
      <button
        type="button"
        className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-md bg-[rgb(var(--primary))] px-4 py-2 text-sm font-medium text-[rgb(var(--primary-foreground))]"
        disabled
        aria-busy="true"
      >
        <Spinner size="sm" announce={false} />
        Subscribing...
      </button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Common pattern for form submission with loading indicator in submit button.',
      },
    },
  },
};

/** Data table loading overlay */
export const DataTableLoading: Story = {
  render: () => (
    <div className="relative w-96">
      {/* Simulated table */}
      <table className="w-full border-collapse text-sm opacity-50">
        <thead>
          <tr className="border-b border-[rgb(var(--border))]">
            <th className="p-2 text-left">Name</th>
            <th className="p-2 text-left">Status</th>
            <th className="p-2 text-left">Date</th>
          </tr>
        </thead>
        <tbody>
          {[1, 2, 3].map((i) => (
            <tr key={i} className="border-b border-[rgb(var(--border))]">
              <td className="p-2">Item {i}</td>
              <td className="p-2">Active</td>
              <td className="p-2">2024-01-0{i}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Loading overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-[rgb(var(--background))]/50">
        <Spinner size="lg" label="Refreshing data" />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Overlay spinner for refreshing data in tables without removing existing content.',
      },
    },
  },
};

/** Interactive loading demo */
export const InteractiveDemo: Story = {
  render: function InteractiveDemoStory() {
    const [isLoading, setIsLoading] = useState(false);

    const handleClick = () => {
      setIsLoading(true);
      setTimeout(() => setIsLoading(false), 2000);
    };

    return (
      <div className="flex flex-col items-center gap-4">
        <button
          type="button"
          onClick={handleClick}
          disabled={isLoading}
          aria-busy={isLoading}
          className="inline-flex min-h-[44px] min-w-[120px] items-center justify-center gap-2 rounded-md bg-[rgb(var(--primary))] px-4 py-2 text-sm font-medium text-[rgb(var(--primary-foreground))] disabled:opacity-70"
        >
          {isLoading ? (
            <>
              <Spinner size="sm" announce={false} />
              Loading...
            </>
          ) : (
            'Click to Load'
          )}
        </button>
        <p className="text-xs text-[rgb(var(--muted-foreground))]">
          {isLoading ? 'Spinner will hide after 2 seconds' : 'Click the button to show spinner'}
        </p>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive demo showing spinner appearing and disappearing with button state.',
      },
    },
  },
};

/** Multiple concurrent operations */
export const ConcurrentOperations: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <h3 className="font-semibold">Background Operations</h3>
      <div className="space-y-3">
        <div className="flex items-center gap-3 rounded border border-[rgb(var(--border))] p-3">
          <Spinner size="sm" label="Syncing contacts" />
          <div>
            <p className="text-sm font-medium">Syncing contacts</p>
            <p className="text-xs text-[rgb(var(--muted-foreground))]">47 of 128 contacts</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded border border-[rgb(var(--border))] p-3">
          <Spinner size="sm" className="text-green-500" label="Uploading images" />
          <div>
            <p className="text-sm font-medium">Uploading images</p>
            <p className="text-xs text-[rgb(var(--muted-foreground))]">3 of 5 images</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded border border-[rgb(var(--border))] p-3">
          <Spinner size="sm" className="text-blue-500" label="Processing videos" />
          <div>
            <p className="text-sm font-medium">Processing videos</p>
            <p className="text-xs text-[rgb(var(--muted-foreground))]">Encoding: 67%</p>
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Multiple spinners for concurrent background operations with distinct labels.',
      },
    },
  },
};
