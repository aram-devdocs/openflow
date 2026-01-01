import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { createRef } from 'react';
import {
  DEFAULT_HOME_BUTTON_LABEL,
  DEFAULT_RETRY_BUTTON_LABEL,
  DEFAULT_ROUTE_ERROR_ARIA_LABEL,
  DEFAULT_ROUTE_ERROR_DESCRIPTION,
  // Constants
  DEFAULT_ROUTE_ERROR_TITLE,
  ROUTE_ERROR_BUTTON_CONTAINER_BASE_CLASSES,
  ROUTE_ERROR_BUTTON_GAP_CLASSES,
  ROUTE_ERROR_BUTTON_SIZE_MAP,
  ROUTE_ERROR_CONTAINER_BASE_CLASSES,
  ROUTE_ERROR_CONTAINER_SIZE_CLASSES,
  ROUTE_ERROR_CONTENT_CLASSES,
  ROUTE_ERROR_CONTENT_MAX_WIDTH_CLASSES,
  ROUTE_ERROR_DESCRIPTION_SIZE_MAP,
  ROUTE_ERROR_DETAILS_PRE_CLASSES,
  ROUTE_ERROR_DETAILS_SIZE_CLASSES,
  ROUTE_ERROR_DETAILS_SUMMARY_CLASSES,
  ROUTE_ERROR_HEADING_LEVEL_MAP,
  ROUTE_ERROR_HEADING_SIZE_MAP,
  ROUTE_ERROR_ICON_CONTAINER_BASE_CLASSES,
  ROUTE_ERROR_ICON_CONTAINER_SIZE_CLASSES,
  ROUTE_ERROR_ICON_SIZE_MAP,
  ROUTE_ERROR_LOGGER_CONTEXT,
  RouteError,
  SR_ERROR_PREFIX,
  SR_NAVIGATING_HOME,
  SR_RETRYING,
  TECHNICAL_DETAILS_LABEL,
  buildHomeButtonAriaLabel as _buildHomeButtonAriaLabel,
  buildRetryButtonAriaLabel as _buildRetryButtonAriaLabel,
  buildRouteErrorAnnouncement as _buildRouteErrorAnnouncement,
  formatRouteErrorForLogging as _formatRouteErrorForLogging,
  // Utility functions - prefixed with _ as they're exported for reference but not used in stories
  getRouteErrorBaseSize as _getRouteErrorBaseSize,
  getRouteErrorResponsiveSizeClasses as _getRouteErrorResponsiveSizeClasses,
} from './RouteError';

// Re-export for documentation purposes (these are tested in unit tests)
void _getRouteErrorBaseSize;
void _getRouteErrorResponsiveSizeClasses;
void _formatRouteErrorForLogging;
void _buildRouteErrorAnnouncement;
void _buildRetryButtonAriaLabel;
void _buildHomeButtonAriaLabel;

const meta: Meta<typeof RouteError> = {
  title: 'Organisms/RouteError',
  component: RouteError,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
Full-page error component for route-level errors. Displays a user-friendly error message with retry and navigation options.

## Features
- **Logger Integration**: Errors are logged via centralized logger on mount
- **Accessibility**: role="alert", aria-live, aria-labelledby/describedby
- **Screen Reader Announcements**: Announces errors and action states
- **Responsive Sizing**: sm, md, lg sizes with breakpoint support
- **Touch Targets**: 44px minimum on mobile (WCAG 2.5.5)
- **Technical Details**: Collapsible error stack trace
- **Customizable**: Custom titles, descriptions, and button labels

## Keyboard Navigation
- Tab: Navigate between interactive elements
- Enter/Space: Activate buttons
- Details element: Native keyboard support for expand/collapse
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    error: {
      control: false,
      description: 'The error that occurred',
    },
    onRetry: {
      action: 'retry',
      description: 'Callback to retry/reload the current route',
    },
    onGoHome: {
      action: 'go-home',
      description: 'Callback to navigate to home page',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size variant - supports responsive values',
    },
    title: {
      control: 'text',
      description: 'Custom error title',
    },
    description: {
      control: 'text',
      description: 'Custom error description',
    },
    retryLabel: {
      control: 'text',
      description: 'Custom retry button label',
    },
    homeLabel: {
      control: 'text',
      description: 'Custom home button label',
    },
    showTechnicalDetails: {
      control: 'boolean',
      description: 'Whether to show collapsible technical details',
    },
    'aria-label': {
      control: 'text',
      description: 'Accessible label for the error region',
    },
    'data-testid': {
      control: 'text',
      description: 'Test ID for automation',
    },
  },
};

export default meta;
type Story = StoryObj<typeof RouteError>;

// ============================================================================
// Basic Examples
// ============================================================================

/** Default route error with all options */
export const Default: Story = {
  args: {
    error: new Error('Failed to load the requested page. The server returned a 500 error.'),
    onRetry: fn(),
    onGoHome: fn(),
  },
};

/** Error with stack trace - expand Technical Details to see */
export const WithStackTrace: Story = {
  render: (args) => {
    const error = new Error('Cannot read property "id" of undefined');
    error.stack = `TypeError: Cannot read property 'id' of undefined
    at TaskDetailPage (src/pages/TaskDetail.tsx:42:15)
    at renderWithHooks (node_modules/react-dom/cjs/react-dom.development.js:14985:18)
    at mountIndeterminateComponent (node_modules/react-dom/cjs/react-dom.development.js:17811:13)
    at beginWork (node_modules/react-dom/cjs/react-dom.development.js:19049:16)
    at HTMLUnknownElement.callCallback (node_modules/react-dom/cjs/react-dom.development.js:3945:14)`;

    return <RouteError {...args} error={error} onRetry={fn()} onGoHome={fn()} />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Expand "Technical Details" to see the full error stack trace.',
      },
    },
  },
};

/** Network error scenario */
export const NetworkError: Story = {
  args: {
    error: new Error(
      'Network request failed. Please check your internet connection and try again.'
    ),
    title: 'Connection Lost',
    description: 'Unable to reach the server. Please check your network connection.',
    onRetry: fn(),
    onGoHome: fn(),
  },
};

/** 404 Not Found style error */
export const NotFoundError: Story = {
  args: {
    error: new Error(
      'The requested resource could not be found. It may have been moved or deleted.'
    ),
    title: 'Page Not Found',
    description: "The page you're looking for doesn't exist or has been moved.",
    onRetry: fn(),
    onGoHome: fn(),
  },
};

/** Authentication/session error */
export const AuthenticationError: Story = {
  args: {
    error: new Error('Your session has expired. Please sign in again to continue.'),
    title: 'Session Expired',
    description: 'Your login session has ended. Please sign in again to continue.',
    retryLabel: 'Sign In',
    onRetry: fn(),
    onGoHome: fn(),
  },
};

/** Permission denied error */
export const PermissionDenied: Story = {
  args: {
    error: new Error(
      'You do not have permission to access this resource. Please contact your administrator.'
    ),
    title: 'Access Denied',
    description: "You don't have permission to view this page.",
    onGoHome: fn(),
  },
};

// ============================================================================
// Button Variations
// ============================================================================

/** Without retry button */
export const WithoutRetry: Story = {
  args: {
    error: new Error('This operation cannot be retried automatically.'),
    onGoHome: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'When onRetry is not provided, only the home button is shown.',
      },
    },
  },
};

/** Without home button */
export const WithoutHome: Story = {
  args: {
    error: new Error('An error occurred while processing your request.'),
    onRetry: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'When onGoHome is not provided, only the retry button is shown.',
      },
    },
  },
};

/** Minimal - no action buttons */
export const Minimal: Story = {
  args: {
    error: new Error('An unexpected error occurred.'),
  },
  parameters: {
    docs: {
      description: {
        story: 'When neither callback is provided, no action buttons are shown.',
      },
    },
  },
};

/** Without technical details */
export const WithoutTechnicalDetails: Story = {
  args: {
    error: new Error('Failed to load data'),
    showTechnicalDetails: false,
    onRetry: fn(),
    onGoHome: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Technical details can be hidden for production environments.',
      },
    },
  },
};

// ============================================================================
// Size Variants
// ============================================================================

/** Small size - compact error display */
export const SizeSmall: Story = {
  args: {
    error: new Error('Page load failed'),
    size: 'sm',
    onRetry: fn(),
    onGoHome: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Small size for compact layouts with 60vh min-height.',
      },
    },
  },
};

/** Medium size - default */
export const SizeMedium: Story = {
  args: {
    error: new Error('Page load failed'),
    size: 'md',
    onRetry: fn(),
    onGoHome: fn(),
  },
};

/** Large size - fullscreen error */
export const SizeLarge: Story = {
  args: {
    error: new Error('Page load failed'),
    size: 'lg',
    onRetry: fn(),
    onGoHome: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Large size for full-screen error states with min-h-screen.',
      },
    },
  },
};

/** All sizes comparison */
export const AllSizes: Story = {
  render: () => (
    <div className="space-y-4 p-4">
      <h2 className="text-lg font-semibold text-[rgb(var(--foreground))]">Size Comparison</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(['sm', 'md', 'lg'] as const).map((size) => (
          <div key={size} className="border border-[rgb(var(--border))] rounded-lg overflow-hidden">
            <div className="bg-[rgb(var(--surface-1))] px-3 py-2 border-b border-[rgb(var(--border))]">
              <span className="text-sm font-medium text-[rgb(var(--foreground))]">
                Size: {size}
              </span>
            </div>
            <div className="h-[300px] overflow-hidden">
              <RouteError
                error={new Error(`Error in ${size} size`)}
                size={size}
                onRetry={() => {}}
                onGoHome={() => {}}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};

/** Responsive sizing - changes based on breakpoint */
export const ResponsiveSizing: Story = {
  args: {
    error: new Error('Resize window to see size changes'),
    size: { base: 'sm', md: 'md', lg: 'lg' },
    onRetry: fn(),
    onGoHome: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Size adapts to viewport: sm on mobile, md on tablet, lg on desktop.',
      },
    },
  },
};

// ============================================================================
// Content Variations
// ============================================================================

/** Custom labels */
export const CustomLabels: Story = {
  args: {
    error: new Error('Database connection failed'),
    title: 'Database Unavailable',
    description: "We couldn't connect to the database. Our team has been notified.",
    retryLabel: 'Reconnect',
    homeLabel: 'Return to Dashboard',
    onRetry: fn(),
    onGoHome: fn(),
  },
};

/** Long error message */
export const LongErrorMessage: Story = {
  args: {
    error: new Error(
      'A critical error occurred while attempting to process your request. The server encountered an unexpected condition that prevented it from fulfilling the request. This may be due to a temporary overload or maintenance of the server. Please wait a few minutes and try again, or contact support if the problem persists.'
    ),
    onRetry: fn(),
    onGoHome: fn(),
  },
};

/** Internationalized content */
export const InternationalizedContent: Story = {
  args: {
    error: new Error('Fehler beim Laden der Seite'),
    title: 'Etwas ist schief gelaufen',
    description: 'Bitte versuchen Sie es erneut oder kehren Sie zur Startseite zuruck.',
    retryLabel: 'Erneut versuchen',
    homeLabel: 'Zur Startseite',
    'aria-label': 'Seitenfehler',
    onRetry: fn(),
    onGoHome: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'All text content is customizable for internationalization.',
      },
    },
  },
};

// ============================================================================
// Accessibility Demos
// ============================================================================

/** Screen reader accessibility demo */
export const ScreenReaderAccessibility: Story = {
  render: () => (
    <div className="space-y-4 p-4">
      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
          Screen Reader Features
        </h2>
        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
          <li>role="alert" announces error immediately when component mounts</li>
          <li>aria-live="polite" announces button actions (retrying, navigating)</li>
          <li>aria-labelledby points to the error title</li>
          <li>aria-describedby points to the error description</li>
          <li>Button labels update based on loading state</li>
          <li>Technical details summary has descriptive aria-label</li>
        </ul>
      </div>
      <RouteError
        error={new Error('Test error for screen reader demo')}
        onRetry={() => {}}
        onGoHome={() => {}}
        data-testid="sr-demo-error"
      />
    </div>
  ),
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: 'Enable a screen reader to test the accessibility announcements.',
      },
    },
  },
};

/** Keyboard navigation demo */
export const KeyboardNavigation: Story = {
  render: () => (
    <div className="space-y-4 p-4">
      <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">
          Keyboard Navigation
        </h2>
        <ul className="text-sm text-green-700 dark:text-green-300 space-y-1 list-disc list-inside">
          <li>Tab: Move between Retry button, Home button, and Technical Details</li>
          <li>Enter/Space: Activate focused button</li>
          <li>Enter on summary: Toggle technical details open/close</li>
          <li>Tab into pre element: Scroll through error stack with arrow keys</li>
        </ul>
      </div>
      <div className="border border-[rgb(var(--border))] rounded-lg overflow-hidden">
        <RouteError
          error={new Error('Tab through the error component')}
          onRetry={() => console.log('Retry clicked')}
          onGoHome={() => console.log('Home clicked')}
        />
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: 'Use Tab key to navigate through all interactive elements.',
      },
    },
  },
};

/** Touch target accessibility */
export const TouchTargetAccessibility: Story = {
  render: () => (
    <div className="space-y-4 p-4">
      <div className="bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-purple-800 dark:text-purple-200 mb-2">
          Touch Target Compliance (WCAG 2.5.5)
        </h2>
        <p className="text-sm text-purple-700 dark:text-purple-300">
          On mobile viewports (&lt;640px), buttons have minimum 44x44px touch targets. Resize to
          mobile to test.
        </p>
      </div>
      <div className="border border-[rgb(var(--border))] rounded-lg overflow-hidden h-[400px]">
        <RouteError
          error={new Error('Touch target demo')}
          size="sm"
          onRetry={() => {}}
          onGoHome={() => {}}
        />
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

/** Focus ring visibility */
export const FocusRingVisibility: Story = {
  render: () => (
    <div className="space-y-4 p-4">
      <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-amber-800 dark:text-amber-200 mb-2">
          Focus Ring Visibility
        </h2>
        <p className="text-sm text-amber-700 dark:text-amber-300">
          All interactive elements have visible focus rings with ring-offset for contrast. Tab
          through to see focus indicators.
        </p>
      </div>
      <div className="border border-[rgb(var(--border))] rounded-lg overflow-hidden h-[400px]">
        <RouteError
          error={new Error('Focus ring demo - Tab through elements')}
          onRetry={() => {}}
          onGoHome={() => {}}
        />
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: 'Tab through the component to see focus rings on buttons and technical details.',
      },
    },
  },
};

/** Reduced motion */
export const ReducedMotion: Story = {
  render: () => (
    <div className="space-y-4 p-4">
      <div className="bg-cyan-50 dark:bg-cyan-950 border border-cyan-200 dark:border-cyan-800 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-cyan-800 dark:text-cyan-200 mb-2">
          Reduced Motion Support
        </h2>
        <p className="text-sm text-cyan-700 dark:text-cyan-300">
          Transitions use motion-safe: prefix to respect prefers-reduced-motion. Enable reduced
          motion in system settings to test.
        </p>
      </div>
      <div className="border border-[rgb(var(--border))] rounded-lg overflow-hidden h-[400px]">
        <RouteError
          error={new Error('Reduced motion demo')}
          onRetry={() => {}}
          onGoHome={() => {}}
        />
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};

// ============================================================================
// Ref Forwarding & Data Attributes
// ============================================================================

/** Ref forwarding demo */
export const RefForwarding: Story = {
  render: () => {
    const ref = createRef<HTMLDivElement>();

    const handleFocusContainer = () => {
      ref.current?.focus();
    };

    return (
      <div className="space-y-4 p-4">
        <button
          type="button"
          onClick={handleFocusContainer}
          className="px-4 py-2 bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))] rounded-md"
        >
          Focus Container via Ref
        </button>
        <div className="border border-[rgb(var(--border))] rounded-lg overflow-hidden h-[400px]">
          <RouteError
            ref={ref}
            error={new Error('Ref forwarding demo')}
            onRetry={() => {}}
            onGoHome={() => {}}
          />
        </div>
      </div>
    );
  },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: 'forwardRef allows programmatic focus of the error container.',
      },
    },
  },
};

/** Data attributes demo */
export const DataAttributes: Story = {
  args: {
    error: new Error('Data attributes demo'),
    'data-testid': 'custom-route-error',
    onRetry: fn(),
    onGoHome: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: `
Inspect the DOM to see data attributes:
- data-testid: For test automation
- data-size: Current size value
- data-has-retry: Whether retry callback is provided
- data-has-home: Whether home callback is provided
        `,
      },
    },
  },
};

// ============================================================================
// Real-World Examples
// ============================================================================

/** API error in task detail page */
export const TaskDetailError: Story = {
  args: {
    error: new Error('Failed to load task: Task not found or may have been deleted'),
    title: 'Task Not Found',
    description: "The task you're looking for doesn't exist or has been removed.",
    retryLabel: 'Refresh',
    homeLabel: 'Back to Tasks',
    onRetry: fn(),
    onGoHome: fn(),
  },
};

/** Project loading error */
export const ProjectLoadError: Story = {
  args: {
    error: new Error('Failed to initialize project workspace. Git worktree creation failed.'),
    title: 'Project Initialization Failed',
    description:
      'There was a problem setting up the project workspace. Try again or select a different project.',
    onRetry: fn(),
    onGoHome: fn(),
  },
};

/** Server error (500) */
export const ServerError: Story = {
  render: () => {
    const error = new Error('Internal Server Error');
    error.stack = `Error: Internal Server Error
    at fetch (src/queries/projects.ts:45:11)
    at async ProjectsLoader (src/routes/projects.tsx:22:20)`;

    return (
      <RouteError
        error={error}
        title="Server Error"
        description="Our servers encountered an unexpected error. We've been notified and are working on it."
        onRetry={() => {}}
        onGoHome={() => {}}
      />
    );
  },
};

/** Rate limited error */
export const RateLimitError: Story = {
  args: {
    error: new Error('Rate limit exceeded. Too many requests.'),
    title: 'Too Many Requests',
    description: "You've made too many requests. Please wait a moment before trying again.",
    retryLabel: 'Try Again in 30s',
    onGoHome: fn(),
  },
};

/** Embedded in layout */
export const InLayoutContext: Story = {
  render: () => (
    <div className="flex h-screen">
      <aside className="w-64 bg-[rgb(var(--surface-1))] border-r border-[rgb(var(--border))] p-4">
        <h2 className="font-semibold text-[rgb(var(--foreground))]">Sidebar</h2>
        <p className="text-sm text-[rgb(var(--muted-foreground))]">Navigation here</p>
      </aside>
      <main className="flex-1">
        <RouteError
          error={new Error('Main content failed to load')}
          size={{ base: 'sm', lg: 'md' }}
          onRetry={() => {}}
          onGoHome={() => {}}
        />
      </main>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'RouteError as the main content area within an app layout.',
      },
    },
  },
};

// ============================================================================
// Error Types Showcase
// ============================================================================

/** All error types showcase */
export const ErrorTypesShowcase: Story = {
  render: () => (
    <div className="space-y-8 p-4">
      <div>
        <h2 className="mb-4 text-lg font-semibold text-[rgb(var(--foreground))]">
          RouteError Component Variants
        </h2>
        <p className="mb-8 text-sm text-[rgb(var(--muted-foreground))]">
          The RouteError component handles full-page error states. Scroll down to see different
          configurations.
        </p>
      </div>

      <div className="rounded-lg border border-[rgb(var(--border))]">
        <div className="border-b border-[rgb(var(--border))] bg-[rgb(var(--surface-1))] px-4 py-2">
          <span className="text-sm font-medium text-[rgb(var(--foreground))]">
            With Both Actions
          </span>
        </div>
        <div className="h-[400px] overflow-hidden">
          <RouteError
            error={new Error('Standard error with both retry and home options.')}
            onRetry={() => {}}
            onGoHome={() => {}}
          />
        </div>
      </div>

      <div className="rounded-lg border border-[rgb(var(--border))]">
        <div className="border-b border-[rgb(var(--border))] bg-[rgb(var(--surface-1))] px-4 py-2">
          <span className="text-sm font-medium text-[rgb(var(--foreground))]">Retry Only</span>
        </div>
        <div className="h-[400px] overflow-hidden">
          <RouteError error={new Error('Error with retry only.')} onRetry={() => {}} />
        </div>
      </div>

      <div className="rounded-lg border border-[rgb(var(--border))]">
        <div className="border-b border-[rgb(var(--border))] bg-[rgb(var(--surface-1))] px-4 py-2">
          <span className="text-sm font-medium text-[rgb(var(--foreground))]">Home Only</span>
        </div>
        <div className="h-[400px] overflow-hidden">
          <RouteError error={new Error('Error with home navigation only.')} onGoHome={() => {}} />
        </div>
      </div>

      <div className="rounded-lg border border-[rgb(var(--border))]">
        <div className="border-b border-[rgb(var(--border))] bg-[rgb(var(--surface-1))] px-4 py-2">
          <span className="text-sm font-medium text-[rgb(var(--foreground))]">No Actions</span>
        </div>
        <div className="h-[400px] overflow-hidden">
          <RouteError error={new Error('Error with no action buttons.')} />
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};

// ============================================================================
// Constants Reference
// ============================================================================

/** Constants reference - for documentation */
export const ConstantsReference: Story = {
  render: () => (
    <div className="space-y-6 p-6 max-w-4xl">
      <h2 className="text-xl font-bold text-[rgb(var(--foreground))]">Exported Constants</h2>

      <div className="space-y-4">
        <div className="rounded-lg border border-[rgb(var(--border))] p-4">
          <h3 className="font-semibold text-[rgb(var(--foreground))] mb-2">Default Labels</h3>
          <pre className="text-xs bg-[rgb(var(--surface-1))] p-3 rounded overflow-auto">
            {JSON.stringify(
              {
                DEFAULT_ROUTE_ERROR_TITLE,
                DEFAULT_ROUTE_ERROR_DESCRIPTION,
                DEFAULT_RETRY_BUTTON_LABEL,
                DEFAULT_HOME_BUTTON_LABEL,
                DEFAULT_ROUTE_ERROR_ARIA_LABEL,
                TECHNICAL_DETAILS_LABEL,
              },
              null,
              2
            )}
          </pre>
        </div>

        <div className="rounded-lg border border-[rgb(var(--border))] p-4">
          <h3 className="font-semibold text-[rgb(var(--foreground))] mb-2">Screen Reader Text</h3>
          <pre className="text-xs bg-[rgb(var(--surface-1))] p-3 rounded overflow-auto">
            {JSON.stringify(
              {
                SR_ERROR_PREFIX,
                SR_RETRYING,
                SR_NAVIGATING_HOME,
              },
              null,
              2
            )}
          </pre>
        </div>

        <div className="rounded-lg border border-[rgb(var(--border))] p-4">
          <h3 className="font-semibold text-[rgb(var(--foreground))] mb-2">Size Classes</h3>
          <pre className="text-xs bg-[rgb(var(--surface-1))] p-3 rounded overflow-auto">
            {JSON.stringify(
              {
                ROUTE_ERROR_CONTAINER_SIZE_CLASSES,
                ROUTE_ERROR_ICON_CONTAINER_SIZE_CLASSES,
                ROUTE_ERROR_BUTTON_GAP_CLASSES,
                ROUTE_ERROR_DETAILS_SIZE_CLASSES,
                ROUTE_ERROR_CONTENT_MAX_WIDTH_CLASSES,
              },
              null,
              2
            )}
          </pre>
        </div>

        <div className="rounded-lg border border-[rgb(var(--border))] p-4">
          <h3 className="font-semibold text-[rgb(var(--foreground))] mb-2">Size Mappings</h3>
          <pre className="text-xs bg-[rgb(var(--surface-1))] p-3 rounded overflow-auto">
            {JSON.stringify(
              {
                ROUTE_ERROR_ICON_SIZE_MAP,
                ROUTE_ERROR_HEADING_LEVEL_MAP,
                ROUTE_ERROR_HEADING_SIZE_MAP,
                ROUTE_ERROR_DESCRIPTION_SIZE_MAP,
                ROUTE_ERROR_BUTTON_SIZE_MAP,
              },
              null,
              2
            )}
          </pre>
        </div>

        <div className="rounded-lg border border-[rgb(var(--border))] p-4">
          <h3 className="font-semibold text-[rgb(var(--foreground))] mb-2">Base Classes</h3>
          <pre className="text-xs bg-[rgb(var(--surface-1))] p-3 rounded overflow-auto">
            {JSON.stringify(
              {
                ROUTE_ERROR_CONTAINER_BASE_CLASSES,
                ROUTE_ERROR_ICON_CONTAINER_BASE_CLASSES,
                ROUTE_ERROR_CONTENT_CLASSES,
                ROUTE_ERROR_BUTTON_CONTAINER_BASE_CLASSES,
                ROUTE_ERROR_DETAILS_SUMMARY_CLASSES,
                ROUTE_ERROR_DETAILS_PRE_CLASSES,
                ROUTE_ERROR_LOGGER_CONTEXT,
              },
              null,
              2
            )}
          </pre>
        </div>
      </div>

      <h2 className="text-xl font-bold text-[rgb(var(--foreground))] mt-8">Utility Functions</h2>

      <div className="space-y-4">
        <div className="rounded-lg border border-[rgb(var(--border))] p-4">
          <h3 className="font-semibold text-[rgb(var(--foreground))] mb-2">
            getRouteErrorBaseSize
          </h3>
          <pre className="text-xs bg-[rgb(var(--surface-1))] p-3 rounded overflow-auto">
            {`// Get base size from responsive value
getRouteErrorBaseSize('md') // returns 'md'
getRouteErrorBaseSize({ base: 'sm', md: 'lg' }) // returns 'sm'`}
          </pre>
        </div>

        <div className="rounded-lg border border-[rgb(var(--border))] p-4">
          <h3 className="font-semibold text-[rgb(var(--foreground))] mb-2">
            getRouteErrorResponsiveSizeClasses
          </h3>
          <pre className="text-xs bg-[rgb(var(--surface-1))] p-3 rounded overflow-auto">
            {`// Get responsive Tailwind classes
getRouteErrorResponsiveSizeClasses('md', ROUTE_ERROR_CONTAINER_SIZE_CLASSES)
// returns 'min-h-[80vh] gap-6 p-6'

getRouteErrorResponsiveSizeClasses(
  { base: 'sm', md: 'lg' },
  ROUTE_ERROR_CONTAINER_SIZE_CLASSES
)
// returns 'min-h-[60vh] gap-4 p-4 md:min-h-screen md:gap-8 md:p-8'`}
          </pre>
        </div>

        <div className="rounded-lg border border-[rgb(var(--border))] p-4">
          <h3 className="font-semibold text-[rgb(var(--foreground))] mb-2">
            formatRouteErrorForLogging
          </h3>
          <pre className="text-xs bg-[rgb(var(--surface-1))] p-3 rounded overflow-auto">
            {`// Format error for structured logging
formatRouteErrorForLogging(error)
// returns { errorName, errorMessage, errorStack, timestamp, cause? }`}
          </pre>
        </div>

        <div className="rounded-lg border border-[rgb(var(--border))] p-4">
          <h3 className="font-semibold text-[rgb(var(--foreground))] mb-2">
            buildRouteErrorAnnouncement
          </h3>
          <pre className="text-xs bg-[rgb(var(--surface-1))] p-3 rounded overflow-auto">
            {`// Build screen reader announcement
buildRouteErrorAnnouncement(error, 'Something went wrong')
// returns 'Page error: Something went wrong. [error.message]'`}
          </pre>
        </div>

        <div className="rounded-lg border border-[rgb(var(--border))] p-4">
          <h3 className="font-semibold text-[rgb(var(--foreground))] mb-2">
            Button Label Builders
          </h3>
          <pre className="text-xs bg-[rgb(var(--surface-1))] p-3 rounded overflow-auto">
            {`// Build accessible button labels based on state
buildRetryButtonAriaLabel('Try Again', false) // 'Try Again'
buildRetryButtonAriaLabel('Try Again', true) // 'Retrying page load...'

buildHomeButtonAriaLabel('Go Home', false) // 'Go Home'
buildHomeButtonAriaLabel('Go Home', true) // 'Navigating to home page...'`}
          </pre>
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: 'Reference for all exported constants and utility functions.',
      },
    },
  },
};
