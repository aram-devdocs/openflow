import type { Meta, StoryObj } from '@storybook/react';
import { Toast } from './Toast';

const meta: Meta<typeof Toast> = {
  title: 'Atoms/Toast',
  component: Toast,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['success', 'error', 'warning', 'info'],
      description: 'Visual style variant',
    },
    title: {
      control: 'text',
      description: 'Title text',
    },
    description: {
      control: 'text',
      description: 'Optional description text',
    },
    onDismiss: { action: 'dismissed' },
  },
};

export default meta;
type Story = StoryObj<typeof Toast>;

/** Default info toast */
export const Default: Story = {
  args: {
    id: '1',
    variant: 'info',
    title: 'Information',
    description: 'This is an informational message.',
  },
};

/** Success toast - operation completed */
export const Success: Story = {
  args: {
    id: '2',
    variant: 'success',
    title: 'Project created',
    description: 'Your project has been successfully created.',
  },
};

/** Error toast - operation failed */
export const ErrorToast: Story = {
  args: {
    id: '3',
    variant: 'error',
    title: 'Failed to save',
    description: 'An error occurred while saving your changes.',
  },
};

/** Warning toast - caution */
export const Warning: Story = {
  args: {
    id: '4',
    variant: 'warning',
    title: 'Unsaved changes',
    description: 'You have unsaved changes that may be lost.',
  },
};

/** Info toast - informational */
export const Info: Story = {
  args: {
    id: '5',
    variant: 'info',
    title: 'New update available',
    description: 'Version 2.0 is ready to install.',
  },
};

/** Toast with action button */
export const WithAction: Story = {
  args: {
    id: '6',
    variant: 'error',
    title: 'Failed to save',
    description: 'Would you like to retry?',
    action: {
      label: 'Retry',
      onClick: () => console.log('Retry clicked'),
    },
  },
};

/** Toast without dismiss button */
export const NoDismiss: Story = {
  args: {
    id: '7',
    variant: 'success',
    title: 'Auto-dismissing',
    description: 'This toast will dismiss automatically.',
    onDismiss: undefined,
  },
};

/** Toast without description */
export const TitleOnly: Story = {
  args: {
    id: '8',
    variant: 'info',
    title: 'Brief notification',
  },
};

/** Toast with long content */
export const LongContent: Story = {
  args: {
    id: '9',
    variant: 'warning',
    title: 'Multiple files affected',
    description:
      'This operation will affect 15 files across 3 directories. Please review the changes carefully before proceeding.',
  },
};

/** All variants displayed together */
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Toast
        id="1"
        variant="success"
        title="Success"
        description="Operation completed successfully."
        onDismiss={() => {}}
      />
      <Toast
        id="2"
        variant="error"
        title="Error"
        description="An error occurred during the operation."
        onDismiss={() => {}}
      />
      <Toast
        id="3"
        variant="warning"
        title="Warning"
        description="Please proceed with caution."
        onDismiss={() => {}}
      />
      <Toast
        id="4"
        variant="info"
        title="Info"
        description="Here is some useful information."
        onDismiss={() => {}}
      />
    </div>
  ),
};

/** Interactive demo with action */
export const InteractiveDemo: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Toast
        id="1"
        variant="error"
        title="Connection lost"
        description="Unable to connect to the server."
        action={{
          label: 'Reconnect',
          onClick: () => alert('Attempting to reconnect...'),
        }}
        onDismiss={(id) => alert(`Dismissed toast ${id}`)}
      />
      <Toast
        id="2"
        variant="success"
        title="File uploaded"
        description="document.pdf was uploaded successfully."
        action={{
          label: 'View file',
          onClick: () => alert('Opening file...'),
        }}
        onDismiss={(id) => alert(`Dismissed toast ${id}`)}
      />
    </div>
  ),
};
