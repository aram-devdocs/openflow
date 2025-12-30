import type { Meta, StoryObj } from '@storybook/react';
import { RouteError } from './RouteError';

const meta: Meta<typeof RouteError> = {
  title: 'Organisms/RouteError',
  component: RouteError,
  parameters: {
    layout: 'fullscreen',
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
  },
};

export default meta;
type Story = StoryObj<typeof RouteError>;

/** Default route error with all options */
export const Default: Story = {
  args: {
    error: new Error('Failed to load the requested page. The server returned a 500 error.'),
    onRetry: () => {},
    onGoHome: () => {},
  },
};

/** Error with stack trace */
export const WithStackTrace: Story = {
  render: () => {
    const error = new Error('Cannot read property "id" of undefined');
    error.stack = `TypeError: Cannot read property 'id' of undefined
    at TaskDetailPage (src/pages/TaskDetail.tsx:42:15)
    at renderWithHooks (node_modules/react-dom/cjs/react-dom.development.js:14985:18)
    at mountIndeterminateComponent (node_modules/react-dom/cjs/react-dom.development.js:17811:13)
    at beginWork (node_modules/react-dom/cjs/react-dom.development.js:19049:16)`;

    return <RouteError error={error} onRetry={() => {}} onGoHome={() => {}} />;
  },
};

/** Network error */
export const NetworkError: Story = {
  args: {
    error: new Error(
      'Network request failed. Please check your internet connection and try again.'
    ),
    onRetry: () => {},
    onGoHome: () => {},
  },
};

/** 404 Not Found style error */
export const NotFoundError: Story = {
  args: {
    error: new Error(
      'The requested resource could not be found. It may have been moved or deleted.'
    ),
    onRetry: () => {},
    onGoHome: () => {},
  },
};

/** Without retry button */
export const WithoutRetry: Story = {
  args: {
    error: new Error('This operation cannot be retried automatically.'),
    onGoHome: () => {},
  },
};

/** Without home button */
export const WithoutHome: Story = {
  args: {
    error: new Error('An error occurred while processing your request.'),
    onRetry: () => {},
  },
};

/** Minimal - no action buttons */
export const Minimal: Story = {
  args: {
    error: new Error('An unexpected error occurred.'),
  },
};

/** Long error message */
export const LongErrorMessage: Story = {
  args: {
    error: new Error(
      'A critical error occurred while attempting to process your request. The server encountered an unexpected condition that prevented it from fulfilling the request. This may be due to a temporary overload or maintenance of the server. Please wait a few minutes and try again, or contact support if the problem persists.'
    ),
    onRetry: () => {},
    onGoHome: () => {},
  },
};

/** Authentication error */
export const AuthenticationError: Story = {
  render: () => {
    const error = new Error('Your session has expired. Please sign in again to continue.');

    return <RouteError error={error} onRetry={() => {}} onGoHome={() => {}} />;
  },
};

/** Permission denied error */
export const PermissionDenied: Story = {
  args: {
    error: new Error(
      'You do not have permission to access this resource. Please contact your administrator.'
    ),
    onGoHome: () => {},
  },
};

/** All error types showcase */
export const ErrorTypesShowcase: Story = {
  render: () => (
    <div className="space-y-8 p-4">
      <div>
        <h2 className="mb-4 text-lg font-semibold text-[rgb(var(--foreground))]">
          RouteError Component Variants
        </h2>
        <p className="mb-8 text-sm text-[rgb(var(--muted-foreground))]">
          The RouteError component is used for full-page error states. Scroll down to see different
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
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};
