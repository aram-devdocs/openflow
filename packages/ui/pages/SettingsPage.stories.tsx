/**
 * Storybook stories for SettingsPage
 *
 * Demonstrates the general settings page in various states:
 * - Default state
 * - Loading state (skeleton)
 * - Error state with retry
 * - With unsaved changes
 * - Save success state
 * - Saving in progress
 * - Different themes
 * - Responsive sizes
 * - Accessibility demos
 */

import type { Meta, StoryObj } from '@storybook/react';
import { useRef, useState } from 'react';
import type { Theme } from '../atoms/ThemeToggle';
import {
  DEFAULT_ERROR_DESCRIPTION,
  DEFAULT_ERROR_TITLE,
  DEFAULT_PAGE_LABEL,
  DEFAULT_PAGE_SIZE,
  DEFAULT_RETRY_LABEL,
  DEFAULT_SKELETON_FIELDS_PER_SECTION,
  DEFAULT_SKELETON_SECTION_COUNT,
  PAGE_SIZE_GAP,
  PAGE_SIZE_PADDING,
  PAGE_SIZE_SPACE_Y,
  SETTINGS_PAGE_BASE_CLASSES,
  SETTINGS_PAGE_CONTENT_CLASSES,
  SETTINGS_PAGE_ERROR_CLASSES,
  SETTINGS_PAGE_SKELETON_CLASSES,
  SR_ERROR_PREFIX,
  SR_LOADED,
  SR_LOADING,
  SR_SAVE_SUCCESS,
  SR_SAVING,
  SR_UNSAVED_CHANGES,
  SettingsPage,
  SettingsPageError,
  type SettingsPageProps,
  SettingsPageSkeleton,
} from './SettingsPage';

const meta: Meta<typeof SettingsPage> = {
  title: 'Pages/SettingsPage',
  component: SettingsPage,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'General settings page with appearance, behavior, and about sections. Features loading skeleton, error state, and form accessibility.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="max-w-2xl mx-auto p-6">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof SettingsPage>;

// ============================================================================
// Helper functions
// ============================================================================

const noop = () => {};
const noopTheme = (_theme: Theme) => {};
const noopBoolean = (_b: boolean) => {};

// ============================================================================
// Default Props Factory
// ============================================================================

function createDefaultProps(overrides?: Partial<SettingsPageProps>): SettingsPageProps {
  return {
    state: 'ready',
    appearance: {
      theme: 'system' as Theme,
      onThemeChange: noopTheme,
    },
    behavior: {
      autoSave: true,
      onAutoSaveChange: noopBoolean,
    },
    about: {
      version: '0.1.0',
      build: 'Development',
    },
    save: {
      hasChanges: false,
      saveSuccess: false,
      isSaving: false,
      onSave: noop,
    },
    ...overrides,
  };
}

// ============================================================================
// Basic Examples
// ============================================================================

/**
 * Default settings page with all sections
 */
export const Default: Story = {
  args: createDefaultProps(),
};

/**
 * Loading state showing skeleton
 */
export const Loading: Story = {
  args: createDefaultProps({
    state: 'loading',
  }),
};

/**
 * Loading state with isLoading prop (backwards compatibility)
 */
export const LoadingLegacy: Story = {
  args: createDefaultProps({
    isLoading: true,
  }),
};

/**
 * Error state with retry button
 */
export const ErrorState: Story = {
  args: createDefaultProps({
    state: 'error',
    error: {
      error: 'Failed to fetch settings from the server. Please check your connection.',
      onRetry: () => alert('Retry clicked'),
    },
  }),
};

/**
 * Error state without retry
 */
export const ErrorNoRetry: Story = {
  args: createDefaultProps({
    state: 'error',
    error: {
      error: 'Settings are unavailable in offline mode.',
    },
  }),
};

// ============================================================================
// Save States
// ============================================================================

/**
 * With unsaved changes
 */
export const UnsavedChanges: Story = {
  args: createDefaultProps({
    behavior: {
      autoSave: false,
      onAutoSaveChange: noopBoolean,
    },
    save: {
      hasChanges: true,
      saveSuccess: false,
      isSaving: false,
      onSave: noop,
    },
  }),
};

/**
 * Save success state
 */
export const SaveSuccess: Story = {
  args: createDefaultProps({
    save: {
      hasChanges: false,
      saveSuccess: true,
      isSaving: false,
      onSave: noop,
    },
  }),
};

/**
 * Saving in progress
 */
export const Saving: Story = {
  args: createDefaultProps({
    save: {
      hasChanges: true,
      saveSuccess: false,
      isSaving: true,
      onSave: noop,
    },
  }),
};

// ============================================================================
// Theme Variants
// ============================================================================

/**
 * Light theme selected
 */
export const LightTheme: Story = {
  args: createDefaultProps({
    appearance: {
      theme: 'light' as Theme,
      onThemeChange: noopTheme,
    },
  }),
};

/**
 * Dark theme selected
 */
export const DarkTheme: Story = {
  args: createDefaultProps({
    appearance: {
      theme: 'dark' as Theme,
      onThemeChange: noopTheme,
    },
  }),
};

/**
 * System theme selected (default)
 */
export const SystemTheme: Story = {
  args: createDefaultProps({
    appearance: {
      theme: 'system' as Theme,
      onThemeChange: noopTheme,
    },
  }),
};

// ============================================================================
// Behavior Variants
// ============================================================================

/**
 * Auto-save disabled
 */
export const AutoSaveDisabled: Story = {
  args: createDefaultProps({
    behavior: {
      autoSave: false,
      onAutoSaveChange: noopBoolean,
    },
  }),
};

// ============================================================================
// About Variants
// ============================================================================

/**
 * Production build info
 */
export const ProductionBuild: Story = {
  args: createDefaultProps({
    about: {
      version: '1.2.3',
      build: 'Production',
    },
  }),
};

/**
 * Beta version
 */
export const BetaVersion: Story = {
  args: createDefaultProps({
    about: {
      version: '2.0.0-beta.1',
      build: 'Beta',
    },
  }),
};

// ============================================================================
// Size Variants
// ============================================================================

/**
 * Small size
 */
export const SizeSmall: Story = {
  args: createDefaultProps({
    size: 'sm',
  }),
};

/**
 * Medium size (default)
 */
export const SizeMedium: Story = {
  args: createDefaultProps({
    size: 'md',
  }),
};

/**
 * Large size
 */
export const SizeLarge: Story = {
  args: createDefaultProps({
    size: 'lg',
  }),
};

/**
 * All sizes comparison
 */
export const AllSizes: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="mb-2 font-medium">Small</h3>
        <SettingsPage {...createDefaultProps({ size: 'sm' })} />
      </div>
      <div>
        <h3 className="mb-2 font-medium">Medium</h3>
        <SettingsPage {...createDefaultProps({ size: 'md' })} />
      </div>
      <div>
        <h3 className="mb-2 font-medium">Large</h3>
        <SettingsPage {...createDefaultProps({ size: 'lg' })} />
      </div>
    </div>
  ),
};

/**
 * Responsive sizing
 */
export const ResponsiveSizing: Story = {
  args: createDefaultProps({
    size: { base: 'sm', md: 'md', lg: 'lg' },
  }),
  parameters: {
    docs: {
      description: {
        story: 'Resize the viewport to see size changes at different breakpoints.',
      },
    },
  },
};

// ============================================================================
// Sub-Components
// ============================================================================

/**
 * Skeleton component standalone
 */
export const SkeletonDemo: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="mb-2 font-medium">Default (3 sections, 2 fields)</h3>
        <SettingsPageSkeleton />
      </div>
      <div>
        <h3 className="mb-2 font-medium">Custom (2 sections, 3 fields)</h3>
        <SettingsPageSkeleton sectionCount={2} fieldsPerSection={3} />
      </div>
      <div>
        <h3 className="mb-2 font-medium">Large Size</h3>
        <SettingsPageSkeleton size="lg" />
      </div>
    </div>
  ),
};

/**
 * Error component standalone
 */
export const ErrorDemo: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="mb-2 font-medium">With Retry Button</h3>
        <SettingsPageError
          error="Connection failed. Please try again."
          onRetry={() => alert('Retry clicked')}
        />
      </div>
      <div>
        <h3 className="mb-2 font-medium">Without Retry Button</h3>
        <SettingsPageError error="Settings are unavailable." />
      </div>
    </div>
  ),
};

// ============================================================================
// Interactive Examples
// ============================================================================

/**
 * Interactive settings demo
 */
export const InteractiveDemo: Story = {
  render: function Render() {
    const [theme, setTheme] = useState<Theme>('system');
    const [autoSave, setAutoSave] = useState(true);
    const [hasChanges, setHasChanges] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const handleThemeChange = (newTheme: Theme) => {
      setTheme(newTheme);
      setHasChanges(true);
      setSaveSuccess(false);
    };

    const handleAutoSaveChange = (checked: boolean) => {
      setAutoSave(checked);
      setHasChanges(true);
      setSaveSuccess(false);
    };

    const handleSave = async () => {
      setIsSaving(true);
      // Simulate async save
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setIsSaving(false);
      setHasChanges(false);
      setSaveSuccess(true);
      // Clear success after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    };

    return (
      <SettingsPage
        appearance={{ theme, onThemeChange: handleThemeChange }}
        behavior={{ autoSave, onAutoSaveChange: handleAutoSaveChange }}
        about={{ version: '0.1.0', build: 'Development' }}
        save={{ hasChanges, saveSuccess, isSaving, onSave: handleSave }}
      />
    );
  },
};

/**
 * Full page flow demo
 */
export const FullPageFlowDemo: Story = {
  render: function Render() {
    const [state, setState] = useState<'loading' | 'error' | 'ready'>('loading');
    const [theme, setTheme] = useState<Theme>('system');
    const [autoSave, setAutoSave] = useState(true);
    const [hasChanges, setHasChanges] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Simulate initial load
    useState(() => {
      setTimeout(() => setState('ready'), 2000);
    });

    const handleRetry = () => {
      setState('loading');
      setTimeout(() => setState('ready'), 2000);
    };

    const handleSave = async () => {
      setIsSaving(true);
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setIsSaving(false);
      setHasChanges(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    };

    return (
      <div>
        <div className="mb-4 flex gap-2">
          <button
            type="button"
            onClick={() => setState('loading')}
            className="rounded bg-blue-500 px-3 py-1 text-sm text-white"
          >
            Show Loading
          </button>
          <button
            type="button"
            onClick={() => setState('error')}
            className="rounded bg-red-500 px-3 py-1 text-sm text-white"
          >
            Show Error
          </button>
          <button
            type="button"
            onClick={() => setState('ready')}
            className="rounded bg-green-500 px-3 py-1 text-sm text-white"
          >
            Show Ready
          </button>
        </div>
        <SettingsPage
          state={state}
          appearance={{
            theme,
            onThemeChange: (t) => {
              setTheme(t);
              setHasChanges(true);
              setSaveSuccess(false);
            },
          }}
          behavior={{
            autoSave,
            onAutoSaveChange: (checked) => {
              setAutoSave(checked);
              setHasChanges(true);
              setSaveSuccess(false);
            },
          }}
          about={{ version: '0.1.0', build: 'Development' }}
          save={{ hasChanges, saveSuccess, isSaving, onSave: handleSave }}
          error={{
            error: 'Failed to load settings. Please try again.',
            onRetry: handleRetry,
          }}
        />
      </div>
    );
  },
};

// ============================================================================
// Accessibility Demos
// ============================================================================

/**
 * Keyboard navigation demo
 */
export const KeyboardNavigationDemo: Story = {
  args: createDefaultProps({
    save: {
      hasChanges: true,
      saveSuccess: false,
      isSaving: false,
      onSave: () => alert('Save clicked'),
    },
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Use Tab to navigate between interactive elements. Theme toggle uses arrow keys. Checkbox toggles with Space. Save button activates with Enter/Space.',
      },
    },
  },
};

/**
 * Screen reader accessibility demo
 */
export const ScreenReaderDemo: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="mb-2 font-medium">Screen Reader Announcements</h3>
        <ul className="mb-4 list-inside list-disc text-sm text-[rgb(var(--muted-foreground))]">
          <li>Loading: "{SR_LOADING}"</li>
          <li>Loaded: "{SR_LOADED}"</li>
          <li>Saving: "{SR_SAVING}"</li>
          <li>Saved: "{SR_SAVE_SUCCESS}"</li>
          <li>Unsaved: "{SR_UNSAVED_CHANGES}"</li>
          <li>Error: "{SR_ERROR_PREFIX} [message]"</li>
        </ul>
      </div>

      <div>
        <h3 className="mb-2 font-medium">Loading State</h3>
        <SettingsPage {...createDefaultProps({ state: 'loading' })} />
      </div>

      <div>
        <h3 className="mb-2 font-medium">Ready State with Changes</h3>
        <SettingsPage
          {...createDefaultProps({
            save: {
              hasChanges: true,
              saveSuccess: false,
              isSaving: false,
              onSave: noop,
            },
          })}
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Each state has appropriate screen reader announcements using aria-live regions. Sections have proper heading hierarchy (h2) and region roles.',
      },
    },
  },
};

/**
 * Focus ring visibility demo
 */
export const FocusRingDemo: Story = {
  args: createDefaultProps({
    save: {
      hasChanges: true,
      saveSuccess: false,
      isSaving: false,
      onSave: noop,
    },
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Tab through the page to see focus rings on all interactive elements. Focus rings have ring-offset for visibility on all backgrounds.',
      },
    },
  },
};

/**
 * Touch target accessibility demo
 */
export const TouchTargetDemo: Story = {
  render: () => (
    <div className="space-y-4">
      <p className="text-sm text-[rgb(var(--muted-foreground))]">
        All interactive elements meet WCAG 2.5.5 minimum touch target size of 44x44px on mobile. On
        larger screens, the size constraint is relaxed.
      </p>
      <SettingsPage
        {...createDefaultProps({
          save: {
            hasChanges: true,
            saveSuccess: false,
            isSaving: false,
            onSave: () => alert('Save clicked'),
          },
        })}
      />
    </div>
  ),
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story:
          'Buttons and interactive elements have minimum 44x44px touch targets on mobile for WCAG 2.5.5 compliance.',
      },
    },
  },
};

// ============================================================================
// Ref Forwarding & Data Attributes
// ============================================================================

/**
 * Ref forwarding demo
 */
export const RefForwardingDemo: Story = {
  render: function Render() {
    const ref = useRef<HTMLDivElement>(null);

    return (
      <div className="space-y-4">
        <button
          onClick={() => {
            if (ref.current) {
              const dataState = ref.current.getAttribute('data-state');
              const dataSize = ref.current.getAttribute('data-size');
              alert(`State: ${dataState}, Size: ${dataSize}`);
            }
          }}
          className="rounded bg-blue-500 px-3 py-1 text-sm text-white"
        >
          Get Ref Data
        </button>
        <SettingsPage ref={ref} {...createDefaultProps()} />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'forwardRef support allows programmatic access to the container element.',
      },
    },
  },
};

/**
 * Data attributes demo
 */
export const DataAttributesDemo: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="mb-2 font-medium">Ready State</h3>
        <code className="block mb-2 text-xs">data-state="ready" data-size="md"</code>
        <SettingsPage {...createDefaultProps()} />
      </div>

      <div>
        <h3 className="mb-2 font-medium">With Unsaved Changes</h3>
        <code className="block mb-2 text-xs">data-has-changes="true"</code>
        <SettingsPage
          {...createDefaultProps({
            save: {
              hasChanges: true,
              saveSuccess: false,
              isSaving: false,
              onSave: noop,
            },
          })}
        />
      </div>

      <div>
        <h3 className="mb-2 font-medium">Save Success</h3>
        <code className="block mb-2 text-xs">data-save-success="true"</code>
        <SettingsPage
          {...createDefaultProps({
            save: {
              hasChanges: false,
              saveSuccess: true,
              isSaving: false,
              onSave: noop,
            },
          })}
        />
      </div>

      <div>
        <h3 className="mb-2 font-medium">Saving</h3>
        <code className="block mb-2 text-xs">data-saving="true"</code>
        <SettingsPage
          {...createDefaultProps({
            save: {
              hasChanges: true,
              saveSuccess: false,
              isSaving: true,
              onSave: noop,
            },
          })}
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Data attributes for testing and CSS targeting: data-state, data-size, data-has-changes, data-save-success, data-saving.',
      },
    },
  },
};

// ============================================================================
// Constants Reference
// ============================================================================

/**
 * Constants reference for testing
 */
export const ConstantsReference: Story = {
  render: () => (
    <div className="space-y-6 text-sm">
      <div>
        <h3 className="font-medium mb-2">Default Values</h3>
        <dl className="space-y-1">
          <div className="flex gap-2">
            <dt className="text-[rgb(var(--muted-foreground))]">Page Size:</dt>
            <dd className="font-mono">{DEFAULT_PAGE_SIZE}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-[rgb(var(--muted-foreground))]">Page Label:</dt>
            <dd className="font-mono">{DEFAULT_PAGE_LABEL}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-[rgb(var(--muted-foreground))]">Skeleton Sections:</dt>
            <dd className="font-mono">{DEFAULT_SKELETON_SECTION_COUNT}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-[rgb(var(--muted-foreground))]">Skeleton Fields:</dt>
            <dd className="font-mono">{DEFAULT_SKELETON_FIELDS_PER_SECTION}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-[rgb(var(--muted-foreground))]">Error Title:</dt>
            <dd className="font-mono">{DEFAULT_ERROR_TITLE}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-[rgb(var(--muted-foreground))]">Error Description:</dt>
            <dd className="font-mono">{DEFAULT_ERROR_DESCRIPTION}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-[rgb(var(--muted-foreground))]">Retry Label:</dt>
            <dd className="font-mono">{DEFAULT_RETRY_LABEL}</dd>
          </div>
        </dl>
      </div>

      <div>
        <h3 className="font-medium mb-2">Screen Reader Text</h3>
        <dl className="space-y-1">
          <div className="flex gap-2">
            <dt className="text-[rgb(var(--muted-foreground))]">Loading:</dt>
            <dd className="font-mono">{SR_LOADING}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-[rgb(var(--muted-foreground))]">Loaded:</dt>
            <dd className="font-mono">{SR_LOADED}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-[rgb(var(--muted-foreground))]">Saving:</dt>
            <dd className="font-mono">{SR_SAVING}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-[rgb(var(--muted-foreground))]">Save Success:</dt>
            <dd className="font-mono">{SR_SAVE_SUCCESS}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-[rgb(var(--muted-foreground))]">Unsaved Changes:</dt>
            <dd className="font-mono">{SR_UNSAVED_CHANGES}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-[rgb(var(--muted-foreground))]">Error Prefix:</dt>
            <dd className="font-mono">{SR_ERROR_PREFIX}</dd>
          </div>
        </dl>
      </div>

      <div>
        <h3 className="font-medium mb-2">CSS Classes (Sample)</h3>
        <dl className="space-y-1 font-mono text-xs">
          <div>
            <dt className="text-[rgb(var(--muted-foreground))]">Base:</dt>
            <dd className="break-all">{SETTINGS_PAGE_BASE_CLASSES}</dd>
          </div>
          <div>
            <dt className="text-[rgb(var(--muted-foreground))]">Content:</dt>
            <dd className="break-all">{SETTINGS_PAGE_CONTENT_CLASSES}</dd>
          </div>
          <div>
            <dt className="text-[rgb(var(--muted-foreground))]">Error:</dt>
            <dd className="break-all">{SETTINGS_PAGE_ERROR_CLASSES}</dd>
          </div>
          <div>
            <dt className="text-[rgb(var(--muted-foreground))]">Skeleton:</dt>
            <dd className="break-all">{SETTINGS_PAGE_SKELETON_CLASSES}</dd>
          </div>
        </dl>
      </div>

      <div>
        <h3 className="font-medium mb-2">Size Maps</h3>
        <dl className="space-y-1 font-mono text-xs">
          <div>
            <dt className="text-[rgb(var(--muted-foreground))]">Padding:</dt>
            <dd>{JSON.stringify(PAGE_SIZE_PADDING)}</dd>
          </div>
          <div>
            <dt className="text-[rgb(var(--muted-foreground))]">Gap:</dt>
            <dd>{JSON.stringify(PAGE_SIZE_GAP)}</dd>
          </div>
          <div>
            <dt className="text-[rgb(var(--muted-foreground))]">Space-Y:</dt>
            <dd>{JSON.stringify(PAGE_SIZE_SPACE_Y)}</dd>
          </div>
        </dl>
      </div>
    </div>
  ),
};
