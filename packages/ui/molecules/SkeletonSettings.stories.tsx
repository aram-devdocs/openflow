import type { Meta, StoryObj } from '@storybook/react';
import { useRef, useState } from 'react';
import {
  DEFAULT_FIELDS_PER_SECTION,
  DEFAULT_SECTION_COUNT,
  SKELETON_FIELD_GAP_CLASSES,
  SKELETON_FIELD_INPUT_CLASSES,
  SKELETON_FIELD_LABEL_CLASSES,
  SKELETON_SECTION_CARD_CLASSES,
  SKELETON_SECTION_CONTENT_GAP_CLASSES,
  SKELETON_SECTION_CONTENT_PADDING_CLASSES,
  SKELETON_SECTION_HEADER_DESCRIPTION_CLASSES,
  SKELETON_SECTION_HEADER_ICON_CLASSES,
  SKELETON_SECTION_HEADER_PADDING_CLASSES,
  SKELETON_SECTION_HEADER_TITLE_CLASSES,
  SKELETON_SETTINGS_BASE_CLASSES,
  SKELETON_SETTINGS_GAP_CLASSES,
  SkeletonSettings,
  getBaseSize,
  getIconDimensions,
  getResponsiveSizeClasses,
} from './SkeletonSettings';

const meta: Meta<typeof SkeletonSettings> = {
  title: 'Molecules/SkeletonSettings',
  component: SkeletonSettings,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
SkeletonSettings provides loading placeholders for settings page layouts.

## Features
- Uses Skeleton atom for consistent loading placeholders
- Responsive sizing support via ResponsiveValue (sm, md, lg)
- Properly hidden from screen readers (aria-hidden="true", role="presentation")
- forwardRef support for ref forwarding
- data-testid support for testing
- Configurable section and field counts
- Optional section descriptions

## Accessibility
- Container has \`aria-hidden="true"\` and \`role="presentation"\`
- Uses motion-safe:animate-pulse for respecting prefers-reduced-motion
- Not focusable or announced by screen readers

## Usage
\`\`\`tsx
// Default 2 sections with 2 fields each
<SkeletonSettings />

// Custom counts
<SkeletonSettings sectionCount={3} fieldsPerSection={3} />

// Small size
<SkeletonSettings size="sm" />

// Responsive sizing
<SkeletonSettings size={{ base: 'sm', md: 'md', lg: 'lg' }} />
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
      description: 'Size variant (sm, md, lg) or responsive object',
    },
    sectionCount: {
      control: { type: 'number', min: 1, max: 10 },
      description: 'Number of settings sections to render',
    },
    fieldsPerSection: {
      control: { type: 'number', min: 1, max: 10 },
      description: 'Number of fields per section',
    },
    showDescriptions: {
      control: 'boolean',
      description: 'Whether to show section descriptions',
    },
  },
};

export default meta;
type Story = StoryObj<typeof SkeletonSettings>;

// =============================================================================
// Basic Examples
// =============================================================================

/** Default settings skeleton with 2 sections, 2 fields each */
export const Default: Story = {
  render: () => (
    <div className="max-w-2xl">
      <SkeletonSettings />
    </div>
  ),
};

/** Settings skeleton with 3 sections */
export const ThreeSections: Story = {
  render: () => (
    <div className="max-w-2xl">
      <SkeletonSettings sectionCount={3} />
    </div>
  ),
};

/** Settings skeleton with more fields per section */
export const MoreFields: Story = {
  render: () => (
    <div className="max-w-2xl">
      <SkeletonSettings fieldsPerSection={4} />
    </div>
  ),
};

/** Single section skeleton */
export const SingleSection: Story = {
  render: () => (
    <div className="max-w-2xl">
      <SkeletonSettings sectionCount={1} fieldsPerSection={3} />
    </div>
  ),
};

/** Many sections for scrollable content */
export const ManySections: Story = {
  render: () => (
    <div className="max-w-2xl">
      <SkeletonSettings sectionCount={5} fieldsPerSection={2} />
    </div>
  ),
};

/** Without section descriptions */
export const NoDescriptions: Story = {
  render: () => (
    <div className="max-w-2xl">
      <SkeletonSettings showDescriptions={false} />
    </div>
  ),
};

// =============================================================================
// Size Variants
// =============================================================================

/** Small size variant - compact spacing */
export const SizeSmall: Story = {
  render: () => (
    <div className="max-w-2xl">
      <SkeletonSettings size="sm" />
    </div>
  ),
};

/** Medium size variant - standard spacing (default) */
export const SizeMedium: Story = {
  render: () => (
    <div className="max-w-2xl">
      <SkeletonSettings size="md" />
    </div>
  ),
};

/** Large size variant - larger spacing and elements */
export const SizeLarge: Story = {
  render: () => (
    <div className="max-w-2xl">
      <SkeletonSettings size="lg" />
    </div>
  ),
};

/** All sizes side by side */
export const AllSizes: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="mb-2 font-medium text-[rgb(var(--foreground))]">Small (sm)</h3>
        <div className="max-w-md">
          <SkeletonSettings size="sm" sectionCount={1} fieldsPerSection={2} />
        </div>
      </div>
      <div>
        <h3 className="mb-2 font-medium text-[rgb(var(--foreground))]">Medium (md) - Default</h3>
        <div className="max-w-md">
          <SkeletonSettings size="md" sectionCount={1} fieldsPerSection={2} />
        </div>
      </div>
      <div>
        <h3 className="mb-2 font-medium text-[rgb(var(--foreground))]">Large (lg)</h3>
        <div className="max-w-md">
          <SkeletonSettings size="lg" sectionCount={1} fieldsPerSection={2} />
        </div>
      </div>
    </div>
  ),
};

/** Responsive sizing - changes size at different breakpoints */
export const ResponsiveSizing: Story = {
  render: () => (
    <div className="max-w-2xl">
      <p className="mb-4 text-sm text-[rgb(var(--muted-foreground))]">
        Resize the viewport to see the size change: sm on mobile, md on tablet, lg on desktop
      </p>
      <SkeletonSettings size={{ base: 'sm', md: 'md', lg: 'lg' }} />
    </div>
  ),
};

// =============================================================================
// Usage Contexts
// =============================================================================

/** In a settings page context */
export const InSettingsPageContext: Story = {
  render: () => (
    <div className="min-h-[400px] bg-[rgb(var(--background))] p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[rgb(var(--foreground))]">Settings</h1>
          <p className="text-[rgb(var(--muted-foreground))]">Manage your application preferences</p>
        </div>
        <SkeletonSettings sectionCount={3} />
      </div>
    </div>
  ),
};

/** Profile settings loading */
export const ProfileSettingsLoading: Story = {
  render: () => (
    <div className="max-w-2xl bg-[rgb(var(--background))] p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-[rgb(var(--foreground))]">Profile Settings</h2>
      </div>
      <SkeletonSettings sectionCount={2} fieldsPerSection={3} />
    </div>
  ),
};

/** Appearance settings loading */
export const AppearanceSettingsLoading: Story = {
  render: () => (
    <div className="max-w-2xl bg-[rgb(var(--background))] p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-[rgb(var(--foreground))]">Appearance</h2>
      </div>
      <SkeletonSettings sectionCount={2} fieldsPerSection={2} />
    </div>
  ),
};

/** Account settings with many sections */
export const AccountSettingsLoading: Story = {
  render: () => (
    <div className="max-w-2xl bg-[rgb(var(--background))] p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-[rgb(var(--foreground))]">Account</h2>
      </div>
      <SkeletonSettings sectionCount={4} fieldsPerSection={2} />
    </div>
  ),
};

/** In a scrollable container */
export const InScrollableContainer: Story = {
  render: () => (
    <div className="h-[300px] overflow-y-auto rounded-lg border border-[rgb(var(--border))] p-4">
      <SkeletonSettings sectionCount={5} />
    </div>
  ),
};

/** Mobile view */
export const MobileView: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
  render: () => (
    <div className="p-4">
      <SkeletonSettings size="sm" />
    </div>
  ),
};

// =============================================================================
// Accessibility Demos
// =============================================================================

/** Accessibility demonstration */
export const AccessibilityDemo: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="p-4 rounded-lg bg-[rgb(var(--muted))]">
        <h3 className="font-medium text-[rgb(var(--foreground))] mb-2">Accessibility Features</h3>
        <ul className="list-disc list-inside text-sm text-[rgb(var(--muted-foreground))] space-y-1">
          <li>aria-hidden=&quot;true&quot; - Hidden from screen readers</li>
          <li>role=&quot;presentation&quot; - Indicates decorative content</li>
          <li>motion-safe:animate-pulse - Respects prefers-reduced-motion</li>
          <li>Not focusable by keyboard navigation</li>
          <li>Data attributes for testing (data-testid, data-section-count, etc.)</li>
        </ul>
      </div>
      <SkeletonSettings data-testid="a11y-skeleton-settings" />
    </div>
  ),
};

/** Reduced motion demo */
export const ReducedMotionDemo: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="p-4 rounded-lg bg-[rgb(var(--muted))]">
        <h3 className="font-medium text-[rgb(var(--foreground))] mb-2">Reduced Motion</h3>
        <p className="text-sm text-[rgb(var(--muted-foreground))]">
          The pulse animation uses `motion-safe:animate-pulse` which respects the user&apos;s
          `prefers-reduced-motion` setting. Enable reduced motion in your OS settings to see the
          animation stop.
        </p>
      </div>
      <SkeletonSettings sectionCount={1} />
    </div>
  ),
};

// =============================================================================
// Ref Forwarding and Data Attributes
// =============================================================================

/** Ref forwarding demo */
export const RefForwarding: Story = {
  render: function RefForwardingDemo() {
    const ref = useRef<HTMLDivElement>(null);

    const handleClick = () => {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        alert(
          `Container dimensions: ${Math.round(rect.width)}px x ${Math.round(rect.height)}px\n` +
            `Sections: ${ref.current.dataset.sectionCount}\n` +
            `Fields per section: ${ref.current.dataset.fieldsPerSection}`
        );
      }
    };

    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={handleClick}
          className="px-4 py-2 rounded-md bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))]"
        >
          Get Container Info
        </button>
        <SkeletonSettings ref={ref} data-testid="ref-demo" />
      </div>
    );
  },
};

/** Data attributes demo */
export const DataAttributes: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="p-4 rounded-lg bg-[rgb(var(--muted))]">
        <h3 className="font-medium text-[rgb(var(--foreground))] mb-2">Data Attributes</h3>
        <p className="text-sm text-[rgb(var(--muted-foreground))]">
          Inspect the element to see data attributes: data-testid, data-section-count,
          data-fields-per-section, data-size, data-show-descriptions
        </p>
      </div>
      <SkeletonSettings
        data-testid="data-attrs-demo"
        sectionCount={2}
        fieldsPerSection={3}
        size="md"
        showDescriptions={true}
      />
    </div>
  ),
};

// =============================================================================
// Real-World Examples
// =============================================================================

/** Loading transition demo */
export const LoadingTransitionDemo: Story = {
  render: function LoadingTransition() {
    const [isLoading, setIsLoading] = useState(true);

    return (
      <div className="space-y-4 max-w-2xl">
        <button
          type="button"
          onClick={() => setIsLoading(!isLoading)}
          className="px-4 py-2 rounded-md bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))]"
        >
          {isLoading ? 'Show Content' : 'Show Loading'}
        </button>

        {isLoading ? (
          <SkeletonSettings sectionCount={2} fieldsPerSection={2} />
        ) : (
          <div className="space-y-6">
            <div className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] overflow-hidden">
              <div className="border-b border-[rgb(var(--border))] bg-[rgb(var(--muted))]/50 px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-[rgb(var(--primary))]" />
                  <h3 className="font-medium text-[rgb(var(--foreground))]">General</h3>
                </div>
                <p className="text-sm text-[rgb(var(--muted-foreground))]">
                  Basic application settings
                </p>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="text-sm text-[rgb(var(--foreground))]">Username</label>
                  <input
                    type="text"
                    defaultValue="john.doe"
                    className="mt-1.5 w-full h-10 px-3 rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--input))]"
                  />
                </div>
                <div>
                  <label className="text-sm text-[rgb(var(--foreground))]">Email</label>
                  <input
                    type="email"
                    defaultValue="john@example.com"
                    className="mt-1.5 w-full h-10 px-3 rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--input))]"
                  />
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] overflow-hidden">
              <div className="border-b border-[rgb(var(--border))] bg-[rgb(var(--muted))]/50 px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-[rgb(var(--primary))]" />
                  <h3 className="font-medium text-[rgb(var(--foreground))]">Notifications</h3>
                </div>
                <p className="text-sm text-[rgb(var(--muted-foreground))]">
                  Notification preferences
                </p>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="text-sm text-[rgb(var(--foreground))]">
                    Email Notifications
                  </label>
                  <select className="mt-1.5 w-full h-10 px-3 rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--input))]">
                    <option>All</option>
                    <option>Important only</option>
                    <option>None</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-[rgb(var(--foreground))]">
                    Push Notifications
                  </label>
                  <select className="mt-1.5 w-full h-10 px-3 rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--input))]">
                    <option>Enabled</option>
                    <option>Disabled</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  },
};

/** Full settings page loading */
export const FullSettingsPageLoading: Story = {
  render: () => (
    <div className="min-h-[600px] bg-[rgb(var(--background))]">
      {/* Header */}
      <div className="border-b border-[rgb(var(--border))] bg-[rgb(var(--card))] px-6 py-4">
        <h1 className="text-2xl font-bold text-[rgb(var(--foreground))]">Settings</h1>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-48 border-r border-[rgb(var(--border))] p-4">
          <div className="space-y-2">
            <div className="px-3 py-2 rounded-md bg-[rgb(var(--accent))] text-[rgb(var(--foreground))]">
              General
            </div>
            <div className="px-3 py-2 rounded-md text-[rgb(var(--muted-foreground))]">
              Appearance
            </div>
            <div className="px-3 py-2 rounded-md text-[rgb(var(--muted-foreground))]">
              Notifications
            </div>
            <div className="px-3 py-2 rounded-md text-[rgb(var(--muted-foreground))]">Security</div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6">
          <div className="max-w-2xl">
            <SkeletonSettings sectionCount={3} fieldsPerSection={3} />
          </div>
        </div>
      </div>
    </div>
  ),
};

/** Tabbed settings loading */
export const TabbedSettingsLoading: Story = {
  render: function TabbedSettings() {
    const [activeTab, setActiveTab] = useState('general');

    return (
      <div className="max-w-2xl">
        {/* Tabs */}
        <div className="flex border-b border-[rgb(var(--border))] mb-6">
          {['general', 'appearance', 'notifications'].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px capitalize ${
                activeTab === tab
                  ? 'border-[rgb(var(--primary))] text-[rgb(var(--foreground))]'
                  : 'border-transparent text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <SkeletonSettings
          sectionCount={activeTab === 'general' ? 2 : activeTab === 'appearance' ? 1 : 3}
          fieldsPerSection={activeTab === 'notifications' ? 3 : 2}
        />
      </div>
    );
  },
};

/** Comparison with different configurations */
export const ConfigurationComparison: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="mb-2 font-medium text-[rgb(var(--foreground))]">
          Compact (1 section, 1 field, no description)
        </h3>
        <div className="max-w-md">
          <SkeletonSettings
            size="sm"
            sectionCount={1}
            fieldsPerSection={1}
            showDescriptions={false}
          />
        </div>
      </div>
      <div>
        <h3 className="mb-2 font-medium text-[rgb(var(--foreground))]">
          Standard (2 sections, 2 fields)
        </h3>
        <div className="max-w-md">
          <SkeletonSettings size="md" sectionCount={2} fieldsPerSection={2} />
        </div>
      </div>
      <div>
        <h3 className="mb-2 font-medium text-[rgb(var(--foreground))]">
          Extensive (3 sections, 4 fields)
        </h3>
        <div className="max-w-md">
          <SkeletonSettings size="lg" sectionCount={3} fieldsPerSection={4} />
        </div>
      </div>
    </div>
  ),
};

// =============================================================================
// Constants Reference
// =============================================================================

/** Constants and utility functions reference */
export const ConstantsReference: Story = {
  render: () => (
    <div className="space-y-6 max-w-3xl">
      <div className="p-4 rounded-lg bg-[rgb(var(--muted))]">
        <h3 className="font-medium text-[rgb(var(--foreground))] mb-4">Exported Constants</h3>
        <div className="space-y-4 text-sm font-mono">
          <div>
            <p className="text-[rgb(var(--muted-foreground))]">DEFAULT_SECTION_COUNT:</p>
            <p className="text-[rgb(var(--foreground))]">{DEFAULT_SECTION_COUNT}</p>
          </div>
          <div>
            <p className="text-[rgb(var(--muted-foreground))]">DEFAULT_FIELDS_PER_SECTION:</p>
            <p className="text-[rgb(var(--foreground))]">{DEFAULT_FIELDS_PER_SECTION}</p>
          </div>
          <div>
            <p className="text-[rgb(var(--muted-foreground))]">SKELETON_SETTINGS_BASE_CLASSES:</p>
            <p className="text-[rgb(var(--foreground))]">{SKELETON_SETTINGS_BASE_CLASSES}</p>
          </div>
          <div>
            <p className="text-[rgb(var(--muted-foreground))]">SKELETON_SECTION_CARD_CLASSES:</p>
            <p className="text-[rgb(var(--foreground))]">{SKELETON_SECTION_CARD_CLASSES}</p>
          </div>
        </div>
      </div>

      <div className="p-4 rounded-lg bg-[rgb(var(--muted))]">
        <h3 className="font-medium text-[rgb(var(--foreground))] mb-4">Size-Specific Classes</h3>
        <div className="space-y-4 text-sm font-mono">
          <div>
            <p className="text-[rgb(var(--muted-foreground))] mb-1">
              SKELETON_SETTINGS_GAP_CLASSES:
            </p>
            <pre className="text-[rgb(var(--foreground))] bg-[rgb(var(--background))] p-2 rounded">
              {JSON.stringify(SKELETON_SETTINGS_GAP_CLASSES, null, 2)}
            </pre>
          </div>
          <div>
            <p className="text-[rgb(var(--muted-foreground))] mb-1">
              SKELETON_SECTION_HEADER_PADDING_CLASSES:
            </p>
            <pre className="text-[rgb(var(--foreground))] bg-[rgb(var(--background))] p-2 rounded">
              {JSON.stringify(SKELETON_SECTION_HEADER_PADDING_CLASSES, null, 2)}
            </pre>
          </div>
          <div>
            <p className="text-[rgb(var(--muted-foreground))] mb-1">
              SKELETON_SECTION_HEADER_TITLE_CLASSES:
            </p>
            <pre className="text-[rgb(var(--foreground))] bg-[rgb(var(--background))] p-2 rounded">
              {JSON.stringify(SKELETON_SECTION_HEADER_TITLE_CLASSES, null, 2)}
            </pre>
          </div>
          <div>
            <p className="text-[rgb(var(--muted-foreground))] mb-1">
              SKELETON_SECTION_HEADER_DESCRIPTION_CLASSES:
            </p>
            <pre className="text-[rgb(var(--foreground))] bg-[rgb(var(--background))] p-2 rounded">
              {JSON.stringify(SKELETON_SECTION_HEADER_DESCRIPTION_CLASSES, null, 2)}
            </pre>
          </div>
          <div>
            <p className="text-[rgb(var(--muted-foreground))] mb-1">
              SKELETON_SECTION_CONTENT_PADDING_CLASSES:
            </p>
            <pre className="text-[rgb(var(--foreground))] bg-[rgb(var(--background))] p-2 rounded">
              {JSON.stringify(SKELETON_SECTION_CONTENT_PADDING_CLASSES, null, 2)}
            </pre>
          </div>
          <div>
            <p className="text-[rgb(var(--muted-foreground))] mb-1">
              SKELETON_SECTION_CONTENT_GAP_CLASSES:
            </p>
            <pre className="text-[rgb(var(--foreground))] bg-[rgb(var(--background))] p-2 rounded">
              {JSON.stringify(SKELETON_SECTION_CONTENT_GAP_CLASSES, null, 2)}
            </pre>
          </div>
          <div>
            <p className="text-[rgb(var(--muted-foreground))] mb-1">
              SKELETON_FIELD_LABEL_CLASSES:
            </p>
            <pre className="text-[rgb(var(--foreground))] bg-[rgb(var(--background))] p-2 rounded">
              {JSON.stringify(SKELETON_FIELD_LABEL_CLASSES, null, 2)}
            </pre>
          </div>
          <div>
            <p className="text-[rgb(var(--muted-foreground))] mb-1">
              SKELETON_FIELD_INPUT_CLASSES:
            </p>
            <pre className="text-[rgb(var(--foreground))] bg-[rgb(var(--background))] p-2 rounded">
              {JSON.stringify(SKELETON_FIELD_INPUT_CLASSES, null, 2)}
            </pre>
          </div>
          <div>
            <p className="text-[rgb(var(--muted-foreground))] mb-1">SKELETON_FIELD_GAP_CLASSES:</p>
            <pre className="text-[rgb(var(--foreground))] bg-[rgb(var(--background))] p-2 rounded">
              {JSON.stringify(SKELETON_FIELD_GAP_CLASSES, null, 2)}
            </pre>
          </div>
          <div>
            <p className="text-[rgb(var(--muted-foreground))] mb-1">
              SKELETON_SECTION_HEADER_ICON_CLASSES:
            </p>
            <pre className="text-[rgb(var(--foreground))] bg-[rgb(var(--background))] p-2 rounded">
              {JSON.stringify(SKELETON_SECTION_HEADER_ICON_CLASSES, null, 2)}
            </pre>
          </div>
        </div>
      </div>

      <div className="p-4 rounded-lg bg-[rgb(var(--muted))]">
        <h3 className="font-medium text-[rgb(var(--foreground))] mb-4">Utility Functions</h3>
        <div className="space-y-4 text-sm font-mono">
          <div>
            <p className="text-[rgb(var(--muted-foreground))]">getBaseSize(&apos;lg&apos;):</p>
            <p className="text-[rgb(var(--foreground))]">{getBaseSize('lg')}</p>
          </div>
          <div>
            <p className="text-[rgb(var(--muted-foreground))]">
              getBaseSize({'{ base: "sm", md: "md" }'}):
            </p>
            <p className="text-[rgb(var(--foreground))]">{getBaseSize({ base: 'sm', md: 'md' })}</p>
          </div>
          <div>
            <p className="text-[rgb(var(--muted-foreground))]">
              getIconDimensions(&apos;md&apos;):
            </p>
            <p className="text-[rgb(var(--foreground))]">
              {JSON.stringify(getIconDimensions('md'))}
            </p>
          </div>
          <div>
            <p className="text-[rgb(var(--muted-foreground))]">
              getResponsiveSizeClasses(&apos;md&apos;, SKELETON_SETTINGS_GAP_CLASSES):
            </p>
            <p className="text-[rgb(var(--foreground))]">
              {getResponsiveSizeClasses('md', SKELETON_SETTINGS_GAP_CLASSES)}
            </p>
          </div>
          <div>
            <p className="text-[rgb(var(--muted-foreground))]">
              getResponsiveSizeClasses({'{ base: "sm", lg: "lg" }'}, SKELETON_SETTINGS_GAP_CLASSES):
            </p>
            <p className="text-[rgb(var(--foreground))]">
              {getResponsiveSizeClasses({ base: 'sm', lg: 'lg' }, SKELETON_SETTINGS_GAP_CLASSES)}
            </p>
          </div>
        </div>
      </div>
    </div>
  ),
};
