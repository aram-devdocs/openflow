import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Button } from '../atoms/Button';
import {
  CreatePRDialog,
  DEFAULT_BASE_PLACEHOLDER,
  DEFAULT_BODY_PLACEHOLDER,
  DEFAULT_CANCEL_LABEL,
  DEFAULT_CREATE_LABEL,
  // Constants - used in Constants Reference story
  DEFAULT_DIALOG_TITLE,
  DEFAULT_LOADING_TEXT,
  DEFAULT_TITLE_PLACEHOLDER,
  GH_NOT_AUTHENTICATED_TITLE,
  GH_NOT_INSTALLED_TITLE,
  MAX_TITLE_LENGTH,
  SIZE_TO_DIALOG_SIZE,
  SR_DIALOG_OPENED,
  SR_GH_NOT_INSTALLED,
  SR_NOT_AUTHENTICATED,
  SR_SUBMITTING,
} from './CreatePRDialog';

const meta: Meta<typeof CreatePRDialog> = {
  title: 'Organisms/CreatePRDialog',
  component: CreatePRDialog,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
A dialog for creating GitHub Pull Requests with form validation, accessibility features, and GitHub CLI status indicators.

## Features

- **Form Fields**: Title (required), Description (optional), Base Branch (optional), Draft toggle
- **GitHub CLI Status**: Warnings for missing installation or authentication
- **Keyboard Shortcuts**: Cmd+Enter to submit
- **Responsive Design**: Mobile-first with stacked buttons on small screens
- **Accessibility**: Screen reader announcements, proper form labeling, focus management

## Accessibility

- Proper \`<label>\` associations with \`htmlFor\`/\`id\`
- Error messages linked via \`aria-describedby\`
- Screen reader announcements for state changes
- Focus trapped in dialog when open
- Touch targets ≥44px on mobile (WCAG 2.5.5)
- Warning regions with \`role="alert"\`

## Keyboard Navigation

- **Tab/Shift+Tab**: Navigate between form fields
- **Enter**: Submit (in input fields, not textarea)
- **Cmd+Enter**: Submit from anywhere
- **Escape**: Close dialog (unless submitting)
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof CreatePRDialog>;

// ============================================================================
// Interactive Wrapper
// ============================================================================

function InteractiveDialog(
  props: Partial<React.ComponentProps<typeof CreatePRDialog>> & { submitDelay?: number }
) {
  const [isOpen, setIsOpen] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = (data: {
    title: string;
    body: string;
    base?: string;
    draft?: boolean;
  }) => {
    console.log('Create PR:', data);
    setIsSubmitting(true);
    setError(null);

    // Simulate API call
    setTimeout(() => {
      if (props.submitDelay && props.submitDelay > 2000) {
        setError('Failed to create pull request: network error');
        setIsSubmitting(false);
      } else {
        setIsSubmitting(false);
        setIsOpen(false);
      }
    }, props.submitDelay ?? 1500);
  };

  return (
    <div className="min-h-[200px]">
      <Button onClick={() => setIsOpen(true)}>Open Dialog</Button>
      <CreatePRDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onCreate={handleCreate}
        ghCliInstalled={true}
        ghAuthenticated={true}
        isSubmitting={isSubmitting}
        error={error ?? props.error}
        {...props}
      />
    </div>
  );
}

// ============================================================================
// Basic Stories
// ============================================================================

/**
 * Default state with empty form.
 */
export const Default: Story = {
  render: () => <InteractiveDialog />,
};

/**
 * With pre-filled title from task.
 */
export const WithDefaultTitle: Story = {
  render: () => (
    <InteractiveDialog
      defaultTitle="Add user authentication feature"
      defaultBody={`## Summary

- Added login/logout functionality
- Implemented JWT token handling
- Created protected routes

## Test Plan

- [x] Unit tests pass
- [ ] Manual testing completed`}
      defaultBase="main"
    />
  ),
};

/**
 * In submitting/loading state.
 */
export const Submitting: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(true);

    return (
      <div className="min-h-[200px]">
        <Button onClick={() => setIsOpen(true)}>Open Dialog</Button>
        <CreatePRDialog
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onCreate={() => {}}
          defaultTitle="Add user authentication feature"
          isSubmitting={true}
          ghCliInstalled={true}
          ghAuthenticated={true}
        />
      </div>
    );
  },
};

/**
 * With an error message.
 */
export const WithError: Story = {
  render: () => (
    <InteractiveDialog
      defaultTitle="Add user authentication feature"
      error="Failed to create pull request: remote rejected push (branch is protected)"
    />
  ),
};

// ============================================================================
// GitHub CLI States
// ============================================================================

/**
 * GitHub CLI not installed.
 */
export const GhCliNotInstalled: Story = {
  render: () => <InteractiveDialog ghCliInstalled={false} ghAuthenticated={false} />,
};

/**
 * GitHub CLI installed but not authenticated.
 */
export const GhNotAuthenticated: Story = {
  render: () => <InteractiveDialog ghCliInstalled={true} ghAuthenticated={false} />,
};

// ============================================================================
// Size Variants
// ============================================================================

/**
 * Small size dialog.
 */
export const SizeSmall: Story = {
  render: () => <InteractiveDialog defaultTitle="Quick fix" size="sm" />,
};

/**
 * Medium size dialog (default).
 */
export const SizeMedium: Story = {
  render: () => <InteractiveDialog defaultTitle="Feature implementation" size="md" />,
};

/**
 * Large size dialog.
 */
export const SizeLarge: Story = {
  render: () => <InteractiveDialog defaultTitle="Major refactoring" size="lg" />,
};

/**
 * Responsive sizing - small on mobile, large on desktop.
 */
export const ResponsiveSizing: Story = {
  render: () => (
    <InteractiveDialog defaultTitle="Responsive PR" size={{ base: 'sm', md: 'md', lg: 'lg' }} />
  ),
};

// ============================================================================
// Edge Cases
// ============================================================================

/**
 * With a very long title (edge case).
 */
export const LongTitle: Story = {
  render: () => (
    <InteractiveDialog defaultTitle="Implement comprehensive user authentication system with OAuth 2.0 support including Google, GitHub, and Microsoft providers with role-based access control and multi-factor authentication support for enterprise customers" />
  ),
};

/**
 * With very long description.
 */
export const LongDescription: Story = {
  render: () => (
    <InteractiveDialog
      defaultTitle="Refactor database layer"
      defaultBody={`## Summary

This is a major refactoring of the database layer that includes:

1. Migration from raw SQL to ORM (Prisma)
2. Implementation of repository pattern
3. Adding connection pooling
4. Implementing retry logic for transient failures
5. Adding query logging and performance monitoring

### Database Changes

- Added new indexes for frequently queried columns
- Optimized complex queries using CTEs
- Implemented soft delete for all entities
- Added audit logging for all mutations

### Code Changes

- Refactored 50+ files
- Added 200+ unit tests
- Updated integration tests
- Added E2E tests for critical paths

## Breaking Changes

- Changed return types for several repository methods
- Removed deprecated methods
- Updated error handling to use custom error types

## Migration Guide

1. Update all imports from \`@/db\` to \`@/repository\`
2. Replace direct SQL calls with repository methods
3. Update error handling to catch new error types

## Test Plan

- [x] Unit tests pass (coverage > 80%)
- [x] Integration tests pass
- [x] E2E tests pass
- [ ] Load testing completed
- [ ] Security review completed
`}
    />
  ),
};

/**
 * Draft PR selected.
 */
export const DraftPR: Story = {
  render: () => <InteractiveDialog defaultTitle="WIP: Refactoring database layer" />,
};

/**
 * With custom base branch.
 */
export const CustomBaseBranch: Story = {
  render: () => (
    <InteractiveDialog defaultTitle="Hotfix: Fix login redirect" defaultBase="develop" />
  ),
};

/**
 * Minimal PR (just title, no description).
 */
export const MinimalPR: Story = {
  render: () => <InteractiveDialog defaultTitle="Fix typo in README" />,
};

// ============================================================================
// Accessibility Demos
// ============================================================================

/**
 * Demo showing focus management - dialog receives focus when opened.
 */
export const FocusManagement: Story = {
  name: 'Accessibility: Focus Management',
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="space-y-4">
        <p className="text-sm text-[rgb(var(--muted-foreground))]">
          Click the button and observe how focus moves to the dialog. Press Escape to close, and
          focus returns to the trigger button.
        </p>
        <Button onClick={() => setIsOpen(true)}>Open Dialog</Button>
        <CreatePRDialog
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onCreate={(data) => {
            console.log('Create PR:', data);
            setIsOpen(false);
          }}
          ghCliInstalled={true}
          ghAuthenticated={true}
        />
      </div>
    );
  },
};

/**
 * Demo showing screen reader announcements.
 */
export const ScreenReaderAccessibility: Story = {
  name: 'Accessibility: Screen Reader',
  render: () => (
    <div className="space-y-4">
      <div className="rounded-lg border border-[rgb(var(--border))] p-4">
        <h3 className="font-medium mb-2">Screen Reader Announcements</h3>
        <ul className="text-sm space-y-1 text-[rgb(var(--muted-foreground))]">
          <li>- Dialog opened: &quot;{SR_DIALOG_OPENED}&quot;</li>
          <li>- Submitting: &quot;{SR_SUBMITTING}&quot;</li>
          <li>- GitHub CLI missing: &quot;{SR_GH_NOT_INSTALLED}&quot;</li>
          <li>- Not authenticated: &quot;{SR_NOT_AUTHENTICATED}&quot;</li>
        </ul>
      </div>
      <InteractiveDialog />
    </div>
  ),
};

/**
 * Demo showing keyboard navigation.
 */
export const KeyboardNavigation: Story = {
  name: 'Accessibility: Keyboard Navigation',
  render: () => (
    <div className="space-y-4">
      <div className="rounded-lg border border-[rgb(var(--border))] p-4">
        <h3 className="font-medium mb-2">Keyboard Shortcuts</h3>
        <ul className="text-sm space-y-1 text-[rgb(var(--muted-foreground))]">
          <li>
            <kbd className="px-1.5 py-0.5 rounded bg-[rgb(var(--muted))] font-mono text-xs">
              Tab
            </kbd>{' '}
            - Move to next field
          </li>
          <li>
            <kbd className="px-1.5 py-0.5 rounded bg-[rgb(var(--muted))] font-mono text-xs">
              Shift+Tab
            </kbd>{' '}
            - Move to previous field
          </li>
          <li>
            <kbd className="px-1.5 py-0.5 rounded bg-[rgb(var(--muted))] font-mono text-xs">
              Cmd+Enter
            </kbd>{' '}
            - Submit form
          </li>
          <li>
            <kbd className="px-1.5 py-0.5 rounded bg-[rgb(var(--muted))] font-mono text-xs">
              Escape
            </kbd>{' '}
            - Close dialog
          </li>
        </ul>
      </div>
      <InteractiveDialog defaultTitle="Test keyboard navigation" />
    </div>
  ),
};

/**
 * Demo showing form validation and error states.
 */
export const FormValidation: Story = {
  name: 'Accessibility: Form Validation',
  render: () => (
    <div className="space-y-4">
      <div className="rounded-lg border border-[rgb(var(--border))] p-4">
        <h3 className="font-medium mb-2">Form Validation</h3>
        <ul className="text-sm space-y-1 text-[rgb(var(--muted-foreground))]">
          <li>- Title is required (Create button disabled without it)</li>
          <li>- GitHub CLI must be installed</li>
          <li>- User must be authenticated with GitHub</li>
          <li>- Error messages have role=&quot;alert&quot;</li>
        </ul>
      </div>
      <InteractiveDialog />
    </div>
  ),
};

// ============================================================================
// Ref and Test ID Demos
// ============================================================================

/**
 * Demo showing forwardRef support.
 */
export const RefForwarding: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(true);

    return (
      <div className="space-y-4">
        <Button onClick={() => setIsOpen(true)}>Open Dialog</Button>
        <CreatePRDialog
          ref={(el) => {
            if (el) console.log('Dialog ref:', el);
          }}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onCreate={() => setIsOpen(false)}
          defaultTitle="Ref forwarding test"
          ghCliInstalled={true}
          ghAuthenticated={true}
        />
      </div>
    );
  },
};

/**
 * Demo showing data-testid support.
 */
export const DataTestId: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="rounded-lg border border-[rgb(var(--border))] p-4">
        <h3 className="font-medium mb-2">Test IDs Available</h3>
        <ul className="text-sm space-y-1 text-[rgb(var(--muted-foreground))] font-mono">
          <li>- pr-dialog</li>
          <li>- pr-dialog-content</li>
          <li>- pr-dialog-gh-warning</li>
          <li>- pr-dialog-info</li>
          <li>- pr-dialog-title-field</li>
          <li>- pr-dialog-title-input</li>
          <li>- pr-dialog-body-field</li>
          <li>- pr-dialog-body-input</li>
          <li>- pr-dialog-base-field</li>
          <li>- pr-dialog-base-input</li>
          <li>- pr-dialog-draft-field</li>
          <li>- pr-dialog-draft-checkbox</li>
          <li>- pr-dialog-error</li>
          <li>- pr-dialog-footer</li>
          <li>- pr-dialog-cancel</li>
          <li>- pr-dialog-submit</li>
        </ul>
      </div>
      <InteractiveDialog data-testid="pr-dialog" />
    </div>
  ),
};

// ============================================================================
// Real-World Examples
// ============================================================================

/**
 * Feature branch PR.
 */
export const FeatureBranchPR: Story = {
  render: () => (
    <InteractiveDialog
      defaultTitle="feat: Add user settings page"
      defaultBody={`## Summary

Implemented user settings page with the following sections:
- Profile settings (name, avatar, bio)
- Account settings (email, password)
- Notification preferences
- Theme preferences

## Changes

- Added \`/settings\` route
- Created \`UserSettingsPage\` component
- Added settings mutations to API
- Updated navigation sidebar

## Screenshots

![Settings Page](https://example.com/settings-screenshot.png)

## Test Plan

- [x] Unit tests for components
- [x] Integration tests for API
- [ ] Manual QA testing
`}
      defaultBase="main"
    />
  ),
};

/**
 * Bugfix PR.
 */
export const BugfixPR: Story = {
  render: () => (
    <InteractiveDialog
      defaultTitle="fix: Resolve login redirect loop on expired sessions"
      defaultBody={`## Problem

Users were experiencing infinite redirect loops when their session expired while on a protected route.

## Solution

Added session expiration check in the auth middleware that:
1. Detects expired sessions before redirect
2. Clears the invalid session cookie
3. Redirects to login with a return URL

## Root Cause

The session middleware was checking for session existence but not validity, causing the redirect loop.

Fixes #1234
`}
      defaultBase="main"
    />
  ),
};

/**
 * Hotfix PR with urgency.
 */
export const HotfixPR: Story = {
  render: () => (
    <InteractiveDialog
      defaultTitle="hotfix: Fix production payment processing error"
      defaultBody={`## URGENT

Production payment processing is failing due to API version mismatch.

## Fix

Updated Stripe API version in environment config.

## Testing

- [x] Tested in staging
- [x] Verified with test transaction

## Rollback Plan

Revert this commit if issues persist.
`}
      defaultBase="production"
    />
  ),
};

// ============================================================================
// Constants Reference
// ============================================================================

/**
 * Reference showing all exported constants.
 */
export const ConstantsReference: Story = {
  render: () => (
    <div className="max-w-2xl space-y-6 p-4">
      <h2 className="text-xl font-bold">CreatePRDialog Constants Reference</h2>

      <section>
        <h3 className="font-semibold mb-2">Default Labels</h3>
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <dt className="font-mono text-[rgb(var(--muted-foreground))]">DEFAULT_DIALOG_TITLE</dt>
          <dd>&quot;{DEFAULT_DIALOG_TITLE}&quot;</dd>
          <dt className="font-mono text-[rgb(var(--muted-foreground))]">DEFAULT_CREATE_LABEL</dt>
          <dd>&quot;{DEFAULT_CREATE_LABEL}&quot;</dd>
          <dt className="font-mono text-[rgb(var(--muted-foreground))]">DEFAULT_CANCEL_LABEL</dt>
          <dd>&quot;{DEFAULT_CANCEL_LABEL}&quot;</dd>
          <dt className="font-mono text-[rgb(var(--muted-foreground))]">DEFAULT_LOADING_TEXT</dt>
          <dd>&quot;{DEFAULT_LOADING_TEXT}&quot;</dd>
        </dl>
      </section>

      <section>
        <h3 className="font-semibold mb-2">Placeholders</h3>
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <dt className="font-mono text-[rgb(var(--muted-foreground))]">
            DEFAULT_TITLE_PLACEHOLDER
          </dt>
          <dd>&quot;{DEFAULT_TITLE_PLACEHOLDER}&quot;</dd>
          <dt className="font-mono text-[rgb(var(--muted-foreground))]">
            DEFAULT_BODY_PLACEHOLDER
          </dt>
          <dd className="truncate">&quot;{DEFAULT_BODY_PLACEHOLDER}&quot;</dd>
          <dt className="font-mono text-[rgb(var(--muted-foreground))]">
            DEFAULT_BASE_PLACEHOLDER
          </dt>
          <dd>&quot;{DEFAULT_BASE_PLACEHOLDER}&quot;</dd>
        </dl>
      </section>

      <section>
        <h3 className="font-semibold mb-2">Validation</h3>
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <dt className="font-mono text-[rgb(var(--muted-foreground))]">MAX_TITLE_LENGTH</dt>
          <dd>{MAX_TITLE_LENGTH}</dd>
        </dl>
      </section>

      <section>
        <h3 className="font-semibold mb-2">GitHub CLI Messages</h3>
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <dt className="font-mono text-[rgb(var(--muted-foreground))]">GH_NOT_INSTALLED_TITLE</dt>
          <dd>&quot;{GH_NOT_INSTALLED_TITLE}&quot;</dd>
          <dt className="font-mono text-[rgb(var(--muted-foreground))]">
            GH_NOT_AUTHENTICATED_TITLE
          </dt>
          <dd>&quot;{GH_NOT_AUTHENTICATED_TITLE}&quot;</dd>
        </dl>
      </section>

      <section>
        <h3 className="font-semibold mb-2">Size Mappings</h3>
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <dt className="font-mono text-[rgb(var(--muted-foreground))]">SIZE_TO_DIALOG_SIZE.sm</dt>
          <dd>&quot;{SIZE_TO_DIALOG_SIZE.sm}&quot;</dd>
          <dt className="font-mono text-[rgb(var(--muted-foreground))]">SIZE_TO_DIALOG_SIZE.md</dt>
          <dd>&quot;{SIZE_TO_DIALOG_SIZE.md}&quot;</dd>
          <dt className="font-mono text-[rgb(var(--muted-foreground))]">SIZE_TO_DIALOG_SIZE.lg</dt>
          <dd>&quot;{SIZE_TO_DIALOG_SIZE.lg}&quot;</dd>
        </dl>
      </section>

      <section>
        <h3 className="font-semibold mb-2">Utility Functions</h3>
        <ul className="text-sm space-y-1 text-[rgb(var(--muted-foreground))]">
          <li>
            <code>getBaseSize(size)</code> - Extract base size from responsive value
          </li>
          <li>
            <code>getResponsiveFormGapClasses(size)</code> - Generate responsive gap classes
          </li>
          <li>
            <code>getDialogSize(size)</code> - Map to Dialog molecule size
          </li>
          <li>
            <code>buildGhWarningAnnouncement(installed, authenticated)</code> - Build SR
            announcement
          </li>
          <li>
            <code>getValidationState(title, installed, authenticated)</code> - Get form validation
            state
          </li>
        </ul>
      </section>
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};
