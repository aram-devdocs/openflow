import type { Meta, StoryObj } from '@storybook/react';
import { Archive, LogOut, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../atoms/Button';
import { ConfirmDialog } from './ConfirmDialog';

const meta: Meta<typeof ConfirmDialog> = {
  title: 'Organisms/ConfirmDialog',
  component: ConfirmDialog,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    isOpen: {
      control: 'boolean',
      description: 'Whether the dialog is open',
    },
    title: {
      control: 'text',
      description: 'Dialog title',
    },
    description: {
      control: 'text',
      description: 'Description of the action and its consequences',
    },
    confirmLabel: {
      control: 'text',
      description: 'Text for the confirm button',
    },
    cancelLabel: {
      control: 'text',
      description: 'Text for the cancel button',
    },
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'warning'],
      description: 'Visual variant for the dialog',
    },
    loading: {
      control: 'boolean',
      description: 'Whether the confirm action is in progress',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ConfirmDialog>;

/** Interactive wrapper for demo purposes */
function ConfirmDialogDemo(
  props: Omit<React.ComponentProps<typeof ConfirmDialog>, 'isOpen' | 'onClose' | 'onConfirm'> & {
    triggerLabel?: string;
    triggerVariant?: 'primary' | 'secondary' | 'destructive' | 'ghost';
    simulateLoading?: boolean;
  }
) {
  const {
    triggerLabel = 'Open Dialog',
    triggerVariant = 'primary',
    simulateLoading,
    ...dialogProps
  } = props;
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (simulateLoading) {
      setLoading(true);
      await new Promise((r) => setTimeout(r, 1500));
      setLoading(false);
    }
    setIsOpen(false);
  };

  return (
    <>
      <Button variant={triggerVariant} onClick={() => setIsOpen(true)}>
        {triggerLabel}
      </Button>
      <ConfirmDialog
        {...dialogProps}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onConfirm={handleConfirm}
        loading={loading}
      />
    </>
  );
}

/** Default confirmation dialog */
export const Default: Story = {
  render: () => (
    <ConfirmDialogDemo
      title="Confirm Action"
      description="Are you sure you want to proceed? This action may have consequences."
      confirmLabel="Confirm"
      variant="default"
    />
  ),
};

/** Destructive delete confirmation */
export const DeleteConfirmation: Story = {
  render: () => (
    <ConfirmDialogDemo
      triggerLabel="Delete Task"
      triggerVariant="destructive"
      title="Delete Task"
      description="Are you sure you want to delete this task? This action cannot be undone and all associated data will be permanently removed."
      confirmLabel="Delete"
      variant="destructive"
    />
  ),
};

/** Warning archive confirmation */
export const ArchiveConfirmation: Story = {
  render: () => (
    <ConfirmDialogDemo
      triggerLabel="Archive Task"
      triggerVariant="secondary"
      title="Archive Task"
      description="Archive this task? You can restore it later from the archive."
      confirmLabel="Archive"
      variant="warning"
      icon={Archive}
    />
  ),
};

/** With loading state */
export const WithLoading: Story = {
  render: () => (
    <ConfirmDialogDemo
      triggerLabel="Delete with Loading"
      triggerVariant="destructive"
      title="Delete Project"
      description="Deleting this project will remove all associated tasks and files. This action cannot be undone."
      confirmLabel="Delete Project"
      variant="destructive"
      simulateLoading
    />
  ),
};

/** Logout confirmation */
export const LogoutConfirmation: Story = {
  render: () => (
    <ConfirmDialogDemo
      triggerLabel="Sign Out"
      triggerVariant="ghost"
      title="Sign Out"
      description="Are you sure you want to sign out? Any unsaved changes will be lost."
      confirmLabel="Sign Out"
      cancelLabel="Stay Signed In"
      variant="default"
      icon={LogOut}
    />
  ),
};

/** Custom icon and labels */
export const CustomIconAndLabels: Story = {
  render: () => (
    <ConfirmDialogDemo
      triggerLabel="Clear All"
      triggerVariant="secondary"
      title="Clear All Data"
      description="This will remove all your tasks, projects, and settings. Make sure you have exported any data you want to keep."
      confirmLabel="Yes, Clear Everything"
      cancelLabel="No, Keep My Data"
      variant="destructive"
      icon={Trash2}
    />
  ),
};

/** All variants comparison */
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <ConfirmDialogDemo
        triggerLabel="Default"
        triggerVariant="primary"
        title="Default Variant"
        description="This is the default confirmation dialog style."
        confirmLabel="Confirm"
        variant="default"
      />
      <ConfirmDialogDemo
        triggerLabel="Warning"
        triggerVariant="secondary"
        title="Warning Variant"
        description="This is the warning confirmation dialog style."
        confirmLabel="Proceed"
        variant="warning"
      />
      <ConfirmDialogDemo
        triggerLabel="Destructive"
        triggerVariant="destructive"
        title="Destructive Variant"
        description="This is the destructive confirmation dialog style."
        confirmLabel="Delete"
        variant="destructive"
      />
    </div>
  ),
};
