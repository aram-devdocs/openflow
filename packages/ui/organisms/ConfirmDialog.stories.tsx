import type { Meta, StoryObj } from '@storybook/react';
import { Archive, Download, LogOut, RefreshCw, Save, Trash2, XCircle } from 'lucide-react';
import { useRef, useState } from 'react';
import { Button } from '../atoms/Button';
import {
  BUTTON_RESPONSIVE_CLASSES,
  CONFIRM_DIALOG_CONTENT_CLASSES,
  ConfirmDialog,
  DEFAULT_CANCEL_LABEL,
  DEFAULT_CONFIRM_LABEL,
  DESCRIPTION_SIZE_CLASSES,
  FOOTER_LAYOUT_CLASSES,
  ICON_CONTAINER_BASE_CLASSES,
  ICON_CONTAINER_SIZE_CLASSES,
  ICON_SIZE_MAP,
  SIZE_TO_DIALOG_SIZE,
  SR_DESTRUCTIVE_WARNING,
  SR_PROCESSING,
  SR_WARNING_NOTICE,
  VARIANT_CONFIG,
  buildDialogAnnouncement,
  getBaseSize,
  getConfirmAccessibleLabel,
  getDialogSize,
  getResponsiveSizeClasses,
} from './ConfirmDialog';

const meta: Meta<typeof ConfirmDialog> = {
  title: 'Organisms/ConfirmDialog',
  component: ConfirmDialog,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
A confirmation dialog for destructive and important actions.

## Features

- **Accessibility**: Full screen reader support with variant-specific announcements
- **Responsive**: Stacks buttons vertically on mobile, horizontally on desktop
- **Loading States**: Visual and screen reader feedback during async operations
- **Variants**: Default, destructive, and warning with appropriate styling
- **Button Order**: Cancel first (left/top) following platform conventions

## Accessibility

- Inherits Dialog focus trap, escape key handling, and ARIA attributes
- Screen reader announcements for destructive/warning variants
- Loading state announced to screen readers
- Confirm button has enhanced accessible label for destructive actions
- Touch targets ≥44px via Dialog molecule

## Usage

\`\`\`tsx
<ConfirmDialog
  isOpen={isOpen}
  onClose={handleClose}
  onConfirm={handleDelete}
  title="Delete Task"
  description="Are you sure? This cannot be undone."
  confirmLabel="Delete"
  variant="destructive"
/>
\`\`\`
        `,
      },
    },
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
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size of the dialog',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ConfirmDialog>;

// ============================================================================
// Interactive Demo Wrapper
// ============================================================================

interface ConfirmDialogDemoProps
  extends Omit<React.ComponentProps<typeof ConfirmDialog>, 'isOpen' | 'onClose' | 'onConfirm'> {
  triggerLabel?: string;
  triggerVariant?: 'primary' | 'secondary' | 'destructive' | 'ghost';
  simulateLoading?: boolean;
  loadingDuration?: number;
}

function ConfirmDialogDemo({
  triggerLabel = 'Open Dialog',
  triggerVariant = 'primary',
  simulateLoading,
  loadingDuration = 1500,
  ...dialogProps
}: ConfirmDialogDemoProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (simulateLoading) {
      setLoading(true);
      await new Promise((r) => setTimeout(r, loadingDuration));
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

// ============================================================================
// Basic Examples
// ============================================================================

/** Default confirmation dialog */
export const Default: Story = {
  render: () => (
    <ConfirmDialogDemo
      title="Confirm Action"
      description="Are you sure you want to proceed? This action may have consequences."
      confirmLabel="Confirm"
      variant="default"
      data-testid="confirm-dialog"
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
      data-testid="delete-dialog"
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
      data-testid="archive-dialog"
    />
  ),
};

// ============================================================================
// Loading States
// ============================================================================

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
      data-testid="loading-dialog"
    />
  ),
};

/** Long loading duration */
export const LongLoading: Story = {
  render: () => (
    <ConfirmDialogDemo
      triggerLabel="Start Long Process"
      triggerVariant="primary"
      title="Process Data"
      description="This will process all your data. This may take a while."
      confirmLabel="Start Processing"
      variant="default"
      simulateLoading
      loadingDuration={5000}
      icon={RefreshCw}
    />
  ),
};

// ============================================================================
// Custom Icons
// ============================================================================

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
      data-testid="logout-dialog"
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
      data-testid="clear-all-dialog"
    />
  ),
};

/** Cancel operation */
export const CancelOperation: Story = {
  render: () => (
    <ConfirmDialogDemo
      triggerLabel="Cancel Download"
      triggerVariant="secondary"
      title="Cancel Download?"
      description="The download is 75% complete. Are you sure you want to cancel?"
      confirmLabel="Yes, Cancel"
      cancelLabel="Keep Downloading"
      variant="warning"
      icon={XCircle}
    />
  ),
};

// ============================================================================
// Size Variants
// ============================================================================

/** Small size */
export const SizeSmall: Story = {
  render: () => (
    <ConfirmDialogDemo
      triggerLabel="Small Dialog"
      title="Confirm"
      description="Are you sure?"
      confirmLabel="Yes"
      size="sm"
    />
  ),
};

/** Medium size */
export const SizeMedium: Story = {
  render: () => (
    <ConfirmDialogDemo
      triggerLabel="Medium Dialog"
      title="Confirm Action"
      description="Are you sure you want to proceed with this action? Please review carefully."
      confirmLabel="Confirm"
      size="md"
    />
  ),
};

/** Large size */
export const SizeLarge: Story = {
  render: () => (
    <ConfirmDialogDemo
      triggerLabel="Large Dialog"
      title="Important Confirmation"
      description="This is a significant action that requires your careful attention. Please read the following information thoroughly before proceeding."
      confirmLabel="I Understand, Proceed"
      size="lg"
    />
  ),
};

/** All sizes comparison */
export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <ConfirmDialogDemo
        triggerLabel="Small"
        title="Small Dialog"
        description="Compact confirmation."
        confirmLabel="OK"
        size="sm"
      />
      <ConfirmDialogDemo
        triggerLabel="Medium"
        title="Medium Dialog"
        description="Standard confirmation dialog."
        confirmLabel="Confirm"
        size="md"
      />
      <ConfirmDialogDemo
        triggerLabel="Large"
        title="Large Dialog"
        description="Larger confirmation for important actions."
        confirmLabel="Proceed"
        size="lg"
      />
    </div>
  ),
};

/** Responsive sizing */
export const ResponsiveSizing: Story = {
  render: () => (
    <ConfirmDialogDemo
      triggerLabel="Responsive Dialog"
      title="Responsive Confirmation"
      description="This dialog adapts its size based on screen width. Resize the viewport to see it change."
      confirmLabel="Confirm"
      size={{ base: 'sm', md: 'md', lg: 'lg' }}
    />
  ),
};

// ============================================================================
// All Variants
// ============================================================================

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

// ============================================================================
// Accessibility Demos
// ============================================================================

/** Screen reader accessibility - destructive warning announced */
export const ScreenReaderAccessibility: Story = {
  render: () => (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        The destructive variant announces "Warning: This is a destructive action." to screen readers
        when the dialog opens. The confirm button also has an enhanced accessible label.
      </p>
      <ConfirmDialogDemo
        triggerLabel="Open Destructive Dialog"
        triggerVariant="destructive"
        title="Delete Account"
        description="This will permanently delete your account and all data."
        confirmLabel="Delete Account"
        variant="destructive"
        data-testid="sr-demo"
      />
    </div>
  ),
};

/** Keyboard navigation */
export const KeyboardNavigation: Story = {
  render: () => (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Use Tab to navigate between buttons, Enter/Space to activate, Escape to close. Focus is
        trapped within the dialog when open.
      </p>
      <ConfirmDialogDemo
        triggerLabel="Open and Navigate with Keyboard"
        title="Keyboard Test"
        description="Try navigating with Tab, Enter, Space, and Escape keys."
        confirmLabel="Confirm"
      />
    </div>
  ),
};

/** Focus ring visibility */
export const FocusRingVisibility: Story = {
  render: () => (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Tab through elements to see the visible focus rings. Focus rings use ring-offset for
        visibility on all backgrounds.
      </p>
      <ConfirmDialogDemo
        triggerLabel="Check Focus Rings"
        title="Focus Ring Test"
        description="Press Tab to cycle through focusable elements."
        confirmLabel="Confirm"
        cancelLabel="Cancel"
      />
    </div>
  ),
};

/** Touch target accessibility (WCAG 2.5.5) */
export const TouchTargetAccessibility: Story = {
  render: () => (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        All buttons meet the WCAG 2.5.5 minimum touch target size of 44×44 pixels via the Dialog
        molecule.
      </p>
      <ConfirmDialogDemo
        triggerLabel="Check Touch Targets"
        title="Touch Target Test"
        description="All buttons have minimum 44×44px touch targets."
        confirmLabel="Confirm"
        cancelLabel="Cancel"
      />
    </div>
  ),
};

/** Custom aria labels */
export const CustomAriaLabels: Story = {
  render: () => (
    <ConfirmDialogDemo
      triggerLabel="Open with Custom ARIA"
      title="Save Changes"
      description="You have unsaved changes. Would you like to save them?"
      confirmLabel="Save"
      cancelLabel="Discard"
      confirmAriaLabel="Save all pending changes to the document"
      cancelAriaLabel="Discard unsaved changes and close"
      icon={Save}
    />
  ),
};

// ============================================================================
// Ref Forwarding
// ============================================================================

/** Ref forwarding demo */
export const RefForwarding: Story = {
  render: () => {
    const RefDemo = () => {
      const [isOpen, setIsOpen] = useState(false);
      const dialogRef = useRef<HTMLDivElement>(null);

      const handleOpen = () => {
        setIsOpen(true);
        setTimeout(() => {
          if (dialogRef.current) {
            console.log('Dialog ref:', dialogRef.current);
          }
        }, 100);
      };

      return (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            The dialog forwards its ref for programmatic access.
          </p>
          <Button onClick={handleOpen}>Open Dialog with Ref</Button>
          <ConfirmDialog
            ref={dialogRef}
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            onConfirm={() => setIsOpen(false)}
            title="Ref Forwarding"
            description="Check the console to see the ref was captured."
            confirmLabel="OK"
            data-testid="ref-dialog"
          />
        </div>
      );
    };

    return <RefDemo />;
  },
};

// ============================================================================
// Data Attributes
// ============================================================================

/** Data-testid support */
export const DataTestId: Story = {
  render: () => (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        The dialog supports data-testid with nested IDs for all sub-elements: -content, -body,
        -icon, -description, -footer, -cancel, -confirm
      </p>
      <ConfirmDialogDemo
        triggerLabel="Open with Test IDs"
        title="Test ID Demo"
        description="Inspect the DOM to see data-testid attributes."
        confirmLabel="Confirm"
        data-testid="my-dialog"
      />
    </div>
  ),
};

// ============================================================================
// Real-World Examples
// ============================================================================

/** Form submission confirmation */
export const FormSubmission: Story = {
  render: () => (
    <ConfirmDialogDemo
      triggerLabel="Submit Form"
      title="Submit Form?"
      description="Once submitted, you won't be able to make changes. Please review your information."
      confirmLabel="Submit"
      cancelLabel="Review"
      variant="default"
      simulateLoading
    />
  ),
};

/** File download confirmation */
export const FileDownload: Story = {
  render: () => (
    <ConfirmDialogDemo
      triggerLabel="Download Files"
      title="Download All Files?"
      description="This will download 156 files (2.3 GB total). Make sure you have enough disk space."
      confirmLabel="Start Download"
      cancelLabel="Cancel"
      variant="default"
      icon={Download}
      simulateLoading
    />
  ),
};

/** Batch delete confirmation */
export const BatchDelete: Story = {
  render: () => (
    <ConfirmDialogDemo
      triggerLabel="Delete Selected (23)"
      triggerVariant="destructive"
      title="Delete 23 Items?"
      description="You are about to delete 23 selected items. This action cannot be undone. All associated data will be permanently removed."
      confirmLabel="Delete 23 Items"
      cancelLabel="Keep Items"
      variant="destructive"
      simulateLoading
    />
  ),
};

/** Unsaved changes warning */
export const UnsavedChanges: Story = {
  render: () => (
    <ConfirmDialogDemo
      triggerLabel="Close Editor"
      triggerVariant="ghost"
      title="Unsaved Changes"
      description="You have unsaved changes. Are you sure you want to leave? Your changes will be lost."
      confirmLabel="Leave Without Saving"
      cancelLabel="Stay on Page"
      variant="warning"
    />
  ),
};

// ============================================================================
// Constants Reference
// ============================================================================

/** Constants and utilities reference */
export const ConstantsReference: Story = {
  render: () => (
    <div className="space-y-6 text-sm">
      <h3 className="font-semibold">Exported Constants</h3>

      <div className="space-y-2">
        <h4 className="font-medium">Default Labels</h4>
        <pre className="rounded bg-muted p-2 text-xs">
          {`DEFAULT_CONFIRM_LABEL = "${DEFAULT_CONFIRM_LABEL}"
DEFAULT_CANCEL_LABEL = "${DEFAULT_CANCEL_LABEL}"`}
        </pre>
      </div>

      <div className="space-y-2">
        <h4 className="font-medium">Screen Reader Announcements</h4>
        <pre className="rounded bg-muted p-2 text-xs">
          {`SR_DESTRUCTIVE_WARNING = "${SR_DESTRUCTIVE_WARNING}"
SR_WARNING_NOTICE = "${SR_WARNING_NOTICE}"
SR_PROCESSING = "${SR_PROCESSING}"`}
        </pre>
      </div>

      <div className="space-y-2">
        <h4 className="font-medium">VARIANT_CONFIG</h4>
        <pre className="rounded bg-muted p-2 text-xs overflow-auto max-h-48">
          {JSON.stringify(
            Object.fromEntries(
              Object.entries(VARIANT_CONFIG).map(([k, v]) => [
                k,
                { ...v, icon: v.icon.displayName || 'Icon' },
              ])
            ),
            null,
            2
          )}
        </pre>
      </div>

      <div className="space-y-2">
        <h4 className="font-medium">Size Mappings</h4>
        <pre className="rounded bg-muted p-2 text-xs">
          {`SIZE_TO_DIALOG_SIZE = ${JSON.stringify(SIZE_TO_DIALOG_SIZE, null, 2)}
ICON_SIZE_MAP = ${JSON.stringify(ICON_SIZE_MAP, null, 2)}
DESCRIPTION_SIZE_CLASSES = ${JSON.stringify(DESCRIPTION_SIZE_CLASSES, null, 2)}`}
        </pre>
      </div>

      <div className="space-y-2">
        <h4 className="font-medium">Icon Container Classes</h4>
        <pre className="rounded bg-muted p-2 text-xs">
          {`ICON_CONTAINER_BASE_CLASSES = "${ICON_CONTAINER_BASE_CLASSES}"
ICON_CONTAINER_SIZE_CLASSES = ${JSON.stringify(ICON_CONTAINER_SIZE_CLASSES, null, 2)}`}
        </pre>
      </div>

      <div className="space-y-2">
        <h4 className="font-medium">Layout Classes</h4>
        <pre className="rounded bg-muted p-2 text-xs">
          {`CONFIRM_DIALOG_CONTENT_CLASSES = "${CONFIRM_DIALOG_CONTENT_CLASSES}"
FOOTER_LAYOUT_CLASSES = "${FOOTER_LAYOUT_CLASSES}"
BUTTON_RESPONSIVE_CLASSES = "${BUTTON_RESPONSIVE_CLASSES}"`}
        </pre>
      </div>

      <h3 className="font-semibold pt-4">Utility Functions</h3>

      <div className="space-y-2">
        <h4 className="font-medium">getBaseSize()</h4>
        <pre className="rounded bg-muted p-2 text-xs">
          {`getBaseSize('md') = "${getBaseSize('md')}"
getBaseSize({ base: 'sm', md: 'lg' }) = "${getBaseSize({ base: 'sm', md: 'lg' })}"`}
        </pre>
      </div>

      <div className="space-y-2">
        <h4 className="font-medium">getResponsiveSizeClasses()</h4>
        <pre className="rounded bg-muted p-2 text-xs">
          {`getResponsiveSizeClasses('md') = "${getResponsiveSizeClasses('md')}"
getResponsiveSizeClasses({ base: 'sm', md: 'lg' }) = "${getResponsiveSizeClasses({ base: 'sm', md: 'lg' })}"`}
        </pre>
      </div>

      <div className="space-y-2">
        <h4 className="font-medium">getDialogSize()</h4>
        <pre className="rounded bg-muted p-2 text-xs">
          {`getDialogSize('md') = "${getDialogSize('md')}"
getDialogSize({ base: 'sm', md: 'lg' }) = ${JSON.stringify(getDialogSize({ base: 'sm', md: 'lg' }))}`}
        </pre>
      </div>

      <div className="space-y-2">
        <h4 className="font-medium">getConfirmAccessibleLabel()</h4>
        <pre className="rounded bg-muted p-2 text-xs">
          {`getConfirmAccessibleLabel('Delete', 'default') = "${getConfirmAccessibleLabel('Delete', 'default')}"
getConfirmAccessibleLabel('Delete', 'destructive') = "${getConfirmAccessibleLabel('Delete', 'destructive')}"
getConfirmAccessibleLabel('Delete', 'destructive', 'Remove permanently') = "${getConfirmAccessibleLabel('Delete', 'destructive', 'Remove permanently')}"`}
        </pre>
      </div>

      <div className="space-y-2">
        <h4 className="font-medium">buildDialogAnnouncement()</h4>
        <pre className="rounded bg-muted p-2 text-xs whitespace-pre-wrap">
          {`buildDialogAnnouncement('Delete', 'Are you sure?', 'destructive') =
"${buildDialogAnnouncement('Delete', 'Are you sure?', 'destructive')}"`}
        </pre>
      </div>
    </div>
  ),
};
