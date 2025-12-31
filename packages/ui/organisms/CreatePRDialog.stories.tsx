import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Button } from '../atoms/Button';
import { CreatePRDialog } from './CreatePRDialog';

const meta: Meta<typeof CreatePRDialog> = {
  title: 'Organisms/CreatePRDialog',
  component: CreatePRDialog,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof CreatePRDialog>;

// Interactive wrapper for stories
function InteractiveDialog(props: Partial<React.ComponentProps<typeof CreatePRDialog>>) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div>
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
        {...props}
      />
    </div>
  );
}

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
      defaultBody="## Summary\n\n- Added login/logout functionality\n- Implemented JWT token handling\n- Created protected routes\n\n## Test Plan\n\n- [x] Unit tests pass\n- [ ] Manual testing"
      defaultBase="main"
    />
  ),
};

/**
 * In submitting/loading state.
 */
export const Submitting: Story = {
  render: () => (
    <InteractiveDialog defaultTitle="Add user authentication feature" isSubmitting={true} />
  ),
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

/**
 * With a long title (edge case).
 */
export const LongTitle: Story = {
  render: () => (
    <InteractiveDialog defaultTitle="Implement comprehensive user authentication system with OAuth 2.0 support including Google, GitHub, and Microsoft providers with role-based access control" />
  ),
};

/**
 * Draft PR selected.
 */
export const DraftPR: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(true);

    return (
      <div>
        <Button onClick={() => setIsOpen(true)}>Open Dialog</Button>
        <CreatePRDialog
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onCreate={(data) => {
            console.log('Create PR:', data);
            setIsOpen(false);
          }}
          defaultTitle="WIP: Refactoring database layer"
          ghCliInstalled={true}
          ghAuthenticated={true}
        />
      </div>
    );
  },
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
