import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Dialog, DialogContent, DialogFooter, DialogHeader } from './Dialog';
import { Button } from '../atoms/Button';
import { Input } from '../atoms/Input';
import { Textarea } from '../atoms/Textarea';
import { AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { Icon } from '../atoms/Icon';

const meta: Meta<typeof Dialog> = {
  title: 'Molecules/Dialog',
  component: Dialog,
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
      description: 'Dialog title displayed in the header',
    },
    showCloseButton: {
      control: 'boolean',
      description: 'Whether to show the close button',
    },
    closeOnBackdropClick: {
      control: 'boolean',
      description: 'Whether clicking the backdrop closes the dialog',
    },
    closeOnEscape: {
      control: 'boolean',
      description: 'Whether pressing Escape closes the dialog',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl', 'full'],
      description: 'Size of the dialog',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Dialog>;

/** Default dialog with title and content */
export const Default: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setIsOpen(true)}>Open Dialog</Button>
        <Dialog
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="Dialog Title"
        >
          <DialogContent>
            <p className="text-[rgb(var(--muted-foreground))]">
              This is a simple dialog with a title and some content. Click
              outside or press Escape to close.
            </p>
          </DialogContent>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsOpen(false)}>Confirm</Button>
          </DialogFooter>
        </Dialog>
      </>
    );
  },
};

/** Confirmation dialog for destructive actions */
export const ConfirmationDialog: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <>
        <Button variant="destructive" onClick={() => setIsOpen(true)}>
          Delete Item
        </Button>
        <Dialog
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="Delete Item"
          size="sm"
        >
          <DialogContent>
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-[rgb(var(--destructive))]/10 p-2">
                <Icon
                  icon={AlertTriangle}
                  size="md"
                  className="text-[rgb(var(--destructive))]"
                />
              </div>
              <div>
                <p className="text-sm text-[rgb(var(--foreground))]">
                  Are you sure you want to delete this item?
                </p>
                <p className="mt-1 text-sm text-[rgb(var(--muted-foreground))]">
                  This action cannot be undone.
                </p>
              </div>
            </div>
          </DialogContent>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => setIsOpen(false)}>
              Delete
            </Button>
          </DialogFooter>
        </Dialog>
      </>
    );
  },
};

/** Form dialog for data input */
export const FormDialog: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setIsOpen(true)}>Create New Task</Button>
        <Dialog
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="Create New Task"
          size="md"
        >
          <DialogContent>
            <form className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="task-title"
                  className="text-sm font-medium text-[rgb(var(--foreground))]"
                >
                  Title
                </label>
                <Input id="task-title" placeholder="Enter task title" />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="task-description"
                  className="text-sm font-medium text-[rgb(var(--foreground))]"
                >
                  Description
                </label>
                <Textarea
                  id="task-description"
                  placeholder="Enter task description"
                  rows={4}
                />
              </div>
            </form>
          </DialogContent>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsOpen(false)}>Create Task</Button>
          </DialogFooter>
        </Dialog>
      </>
    );
  },
};

/** Info dialog without actions */
export const InfoDialog: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <>
        <Button variant="secondary" onClick={() => setIsOpen(true)}>
          Show Info
        </Button>
        <Dialog
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="Information"
          size="sm"
        >
          <DialogContent>
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-[rgb(var(--primary))]/10 p-2">
                <Icon
                  icon={Info}
                  size="md"
                  className="text-[rgb(var(--primary))]"
                />
              </div>
              <div>
                <p className="text-sm text-[rgb(var(--foreground))]">
                  This is an informational message.
                </p>
                <p className="mt-1 text-sm text-[rgb(var(--muted-foreground))]">
                  You can close this dialog by clicking outside, pressing
                  Escape, or clicking the X button.
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  },
};

/** Success dialog */
export const SuccessDialog: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setIsOpen(true)}>Show Success</Button>
        <Dialog
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="Success!"
          size="sm"
        >
          <DialogContent>
            <div className="flex flex-col items-center text-center">
              <div className="rounded-full bg-green-500/10 p-3">
                <Icon
                  icon={CheckCircle}
                  size="lg"
                  className="text-green-500"
                />
              </div>
              <p className="mt-3 text-sm text-[rgb(var(--foreground))]">
                Your action was completed successfully!
              </p>
            </div>
          </DialogContent>
          <DialogFooter>
            <Button onClick={() => setIsOpen(false)}>Done</Button>
          </DialogFooter>
        </Dialog>
      </>
    );
  },
};

/** Dialog with custom header */
export const CustomHeader: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setIsOpen(true)}>Open Custom Dialog</Button>
        <Dialog
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          showCloseButton={false}
        >
          <DialogHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[rgb(var(--foreground))]">
                Custom Header
              </h2>
              <span className="rounded-full bg-[rgb(var(--primary))]/10 px-2 py-1 text-xs text-[rgb(var(--primary))]">
                Beta
              </span>
            </div>
            <p className="text-sm text-[rgb(var(--muted-foreground))]">
              This dialog has a custom header with additional elements
            </p>
          </DialogHeader>
          <DialogContent>
            <p className="text-sm text-[rgb(var(--muted-foreground))]">
              When you need more control over the header, use the DialogHeader
              component instead of the title prop.
            </p>
          </DialogContent>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </Dialog>
      </>
    );
  },
};

/** Different dialog sizes */
export const Sizes: Story = {
  render: () => {
    const [openSize, setOpenSize] = useState<string | null>(null);

    const sizes = ['sm', 'md', 'lg', 'xl'] as const;

    return (
      <div className="flex flex-wrap gap-2">
        {sizes.map((size) => (
          <Button key={size} onClick={() => setOpenSize(size)}>
            Size: {size.toUpperCase()}
          </Button>
        ))}
        {sizes.map((size) => (
          <Dialog
            key={size}
            isOpen={openSize === size}
            onClose={() => setOpenSize(null)}
            title={`${size.toUpperCase()} Dialog`}
            size={size}
          >
            <DialogContent>
              <p className="text-sm text-[rgb(var(--muted-foreground))]">
                This is a {size.toUpperCase()} size dialog. The content area
                adjusts to fit the dialog width.
              </p>
            </DialogContent>
            <DialogFooter>
              <Button onClick={() => setOpenSize(null)}>Close</Button>
            </DialogFooter>
          </Dialog>
        ))}
      </div>
    );
  },
};

/** Dialog without close button */
export const NoCloseButton: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setIsOpen(true)}>Open Dialog</Button>
        <Dialog
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="No Close Button"
          showCloseButton={false}
          closeOnBackdropClick={false}
        >
          <DialogContent>
            <p className="text-sm text-[rgb(var(--muted-foreground))]">
              This dialog has no close button and doesn&apos;t close when
              clicking the backdrop. You must use the action buttons.
            </p>
          </DialogContent>
          <DialogFooter>
            <Button onClick={() => setIsOpen(false)}>Acknowledge</Button>
          </DialogFooter>
        </Dialog>
      </>
    );
  },
};

/** Dialog with long scrollable content */
export const ScrollableContent: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setIsOpen(true)}>Open Scrollable Dialog</Button>
        <Dialog
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="Terms of Service"
          size="md"
        >
          <DialogContent className="max-h-[300px]">
            <div className="space-y-4 text-sm text-[rgb(var(--muted-foreground))]">
              {Array.from({ length: 10 }, (_, i) => (
                <p key={i}>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed
                  do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                  Ut enim ad minim veniam, quis nostrud exercitation ullamco
                  laboris nisi ut aliquip ex ea commodo consequat.
                </p>
              ))}
            </div>
          </DialogContent>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsOpen(false)}>
              Decline
            </Button>
            <Button onClick={() => setIsOpen(false)}>Accept</Button>
          </DialogFooter>
        </Dialog>
      </>
    );
  },
};

/** All dialog states showcase */
export const AllStates: Story = {
  render: () => {
    const [activeDialog, setActiveDialog] = useState<string | null>(null);

    const dialogs = [
      { id: 'default', label: 'Default', title: 'Default Dialog', size: 'md' as const },
      { id: 'small', label: 'Small', title: 'Small Dialog', size: 'sm' as const },
      { id: 'large', label: 'Large', title: 'Large Dialog', size: 'lg' as const },
      { id: 'no-close', label: 'No Close', title: 'No Close Button', size: 'md' as const },
    ];

    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-[rgb(var(--muted-foreground))]">
          Click the buttons below to see different dialog configurations:
        </p>
        <div className="flex flex-wrap gap-2">
          {dialogs.map((dialog) => (
            <Button key={dialog.id} onClick={() => setActiveDialog(dialog.id)}>
              {dialog.label}
            </Button>
          ))}
        </div>
        {dialogs.map((dialog) => (
          <Dialog
            key={dialog.id}
            isOpen={activeDialog === dialog.id}
            onClose={() => setActiveDialog(null)}
            title={dialog.title}
            size={dialog.size}
            showCloseButton={dialog.id !== 'no-close'}
            closeOnBackdropClick={dialog.id !== 'no-close'}
          >
            <DialogContent>
              <p className="text-sm text-[rgb(var(--muted-foreground))]">
                This is the {dialog.label.toLowerCase()} dialog variant.
              </p>
            </DialogContent>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setActiveDialog(null)}>
                Cancel
              </Button>
              <Button onClick={() => setActiveDialog(null)}>Confirm</Button>
            </DialogFooter>
          </Dialog>
        ))}
      </div>
    );
  },
};

/** Keyboard navigation demo */
export const KeyboardNavigation: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <div className="space-y-4">
        <Button onClick={() => setIsOpen(true)}>Open Dialog</Button>
        <Dialog
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="Keyboard Navigation"
        >
          <DialogContent>
            <p className="text-sm text-[rgb(var(--muted-foreground))]">
              This dialog supports keyboard navigation. Try these:
            </p>
            <ul className="mt-2 list-inside list-disc text-sm text-[rgb(var(--muted-foreground))]">
              <li>Press Escape to close</li>
              <li>Press Tab to move between focusable elements</li>
              <li>Focus is trapped within the dialog</li>
            </ul>
          </DialogContent>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsOpen(false)}>Confirm</Button>
          </DialogFooter>
        </Dialog>
        <div className="text-xs text-[rgb(var(--muted-foreground))]">
          <p>Keyboard shortcuts:</p>
          <ul className="list-inside list-disc">
            <li>Escape: Close dialog</li>
            <li>Tab: Move focus forward</li>
            <li>Shift+Tab: Move focus backward</li>
            <li>Enter/Space: Activate focused button</li>
          </ul>
        </div>
      </div>
    );
  },
};
