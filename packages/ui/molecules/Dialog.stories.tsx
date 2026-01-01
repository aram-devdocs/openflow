import type { Meta, StoryObj } from '@storybook/react';
import { AlertTriangle, CheckCircle, Info, Settings, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { Button } from '../atoms/Button';
import { Icon } from '../atoms/Icon';
import { Input } from '../atoms/Input';
import { Label } from '../atoms/Label';
import { Textarea } from '../atoms/Textarea';
import {
  DEFAULT_CLOSE_LABEL,
  DIALOG_BACKDROP_CLASSES,
  DIALOG_CONTENT_CLASSES,
  DIALOG_FOOTER_CLASSES,
  DIALOG_HEADER_CLASSES,
  DIALOG_PANEL_CLASSES,
  DIALOG_SIZE_CLASSES,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  getDialogPaddingClasses,
  getResponsiveSizeClasses,
} from './Dialog';

const meta: Meta<typeof Dialog> = {
  title: 'Molecules/Dialog',
  component: Dialog,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Dialog component for modal overlays with comprehensive accessibility support.

## Accessibility Features
- **Focus trap**: Focus is trapped within the dialog when open
- **Focus restoration**: Focus returns to trigger element on close
- **Escape key**: Closes dialog (configurable)
- **aria-modal**: Prevents screen reader interaction with background
- **aria-labelledby**: Points to dialog title
- **aria-describedby**: Optional description linking
- **Screen reader announcements**: Dialog open/close announced via VisuallyHidden
- **Body scroll lock**: Prevents background scrolling when open
- **Touch targets**: Close button meets WCAG 2.5.5 (≥44px)

## Responsive Features
- **Responsive size**: Supports breakpoint-aware sizes
- **Responsive padding**: Header, content, and footer support responsive padding
- **Mobile-first**: Full-width on mobile with max-width constraints
- **Max height constraints**: Prevents overflow on small screens

## Exported Constants
- \`DEFAULT_CLOSE_LABEL\`: Default accessible label for close button
- \`DIALOG_SIZE_CLASSES\`: Size class mappings
- \`DIALOG_PANEL_CLASSES\`: Base panel classes
- \`DIALOG_BACKDROP_CLASSES\`: Backdrop classes
- \`DIALOG_HEADER_CLASSES\`: Header classes
- \`DIALOG_CONTENT_CLASSES\`: Content classes
- \`DIALOG_FOOTER_CLASSES\`: Footer classes

## Exported Functions
- \`getResponsiveSizeClasses(size)\`: Generate responsive size classes
- \`getDialogPaddingClasses(padding, default)\`: Generate responsive padding classes
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
      description: 'Dialog title displayed in the header (sets aria-labelledby)',
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
      description: 'Size of the dialog (supports responsive values)',
    },
    closeLabel: {
      control: 'text',
      description: 'Accessible label for close button',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Dialog>;

// ============================================================================
// Basic Examples
// ============================================================================

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
          data-testid="default-dialog"
        >
          <DialogContent>
            <p className="text-[rgb(var(--muted-foreground))]">
              This is a simple dialog with a title and some content. Click outside or press Escape
              to close.
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
          data-testid="confirm-dialog"
        >
          <DialogContent>
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-[rgb(var(--destructive))]/10 p-2">
                <Icon icon={AlertTriangle} size="md" className="text-[rgb(var(--destructive))]" />
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
          descriptionId="task-form-description"
          data-testid="form-dialog"
        >
          <DialogContent>
            <p id="task-form-description" className="sr-only">
              Fill out the form below to create a new task
            </p>
            <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="task-title">Title</Label>
                <Input id="task-title" placeholder="Enter task title" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-description">Description</Label>
                <Textarea id="task-description" placeholder="Enter task description" rows={4} />
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

// ============================================================================
// Size Variants
// ============================================================================

/** Different dialog sizes */
export const Sizes: Story = {
  render: () => {
    const [openSize, setOpenSize] = useState<string | null>(null);

    const sizes = ['sm', 'md', 'lg', 'xl', 'full'] as const;

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
            data-testid={`size-${size}-dialog`}
          >
            <DialogContent>
              <p className="text-sm text-[rgb(var(--muted-foreground))]">
                This is a {size.toUpperCase()} size dialog. The content area adjusts to fit the
                dialog width.
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

/** Responsive size - full on mobile, large on desktop */
export const ResponsiveSize: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setIsOpen(true)}>Open Responsive Dialog</Button>
        <Dialog
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="Responsive Dialog"
          size={{ base: 'full', md: 'lg' }}
          data-testid="responsive-dialog"
        >
          <DialogContent>
            <p className="text-sm text-[rgb(var(--muted-foreground))]">
              This dialog uses responsive sizing:
            </p>
            <ul className="mt-2 list-inside list-disc text-sm text-[rgb(var(--muted-foreground))]">
              <li>
                <strong>Mobile (base):</strong> Full width
              </li>
              <li>
                <strong>Tablet and up (md):</strong> Large size
              </li>
            </ul>
            <p className="mt-2 text-sm text-[rgb(var(--muted-foreground))]">
              Resize your browser window to see the size change.
            </p>
          </DialogContent>
          <DialogFooter>
            <Button onClick={() => setIsOpen(false)}>Close</Button>
          </DialogFooter>
        </Dialog>
      </>
    );
  },
};

// ============================================================================
// Padding Variants
// ============================================================================

/** Responsive padding in dialog sections */
export const ResponsivePadding: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setIsOpen(true)}>Open Padded Dialog</Button>
        <Dialog
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          showCloseButton={false}
          size="lg"
          data-testid="padding-dialog"
        >
          <DialogHeader p={{ base: '3', md: '6' }}>
            <h2 className="text-lg font-semibold">Responsive Padding</h2>
            <p className="text-sm text-[rgb(var(--muted-foreground))]">
              Each section has responsive padding
            </p>
          </DialogHeader>
          <DialogContent p={{ base: '3', md: '6' }}>
            <p className="text-sm text-[rgb(var(--muted-foreground))]">
              The header, content, and footer all support the <code>p</code> prop for responsive
              padding. This example uses:
            </p>
            <ul className="mt-2 list-inside list-disc text-sm text-[rgb(var(--muted-foreground))]">
              <li>
                <code>{'p={{ base: "3", md: "6" }}'}</code>
              </li>
            </ul>
          </DialogContent>
          <DialogFooter p={{ base: '3', md: '6' }}>
            <Button onClick={() => setIsOpen(false)}>Close</Button>
          </DialogFooter>
        </Dialog>
      </>
    );
  },
};

/** Compact padding for dense UIs */
export const CompactPadding: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setIsOpen(true)}>Open Compact Dialog</Button>
        <Dialog
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="Compact Dialog"
          size="sm"
          data-testid="compact-dialog"
        >
          <DialogContent p="2">
            <p className="text-sm text-[rgb(var(--muted-foreground))]">
              This dialog uses compact padding (<code>p="2"</code>) for a denser layout.
            </p>
          </DialogContent>
          <DialogFooter p="2">
            <Button size="sm" variant="ghost" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={() => setIsOpen(false)}>
              OK
            </Button>
          </DialogFooter>
        </Dialog>
      </>
    );
  },
};

// ============================================================================
// Custom Header Examples
// ============================================================================

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
          data-testid="custom-header-dialog"
        >
          <DialogHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[rgb(var(--foreground))]">Custom Header</h2>
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
              When you need more control over the header, use the DialogHeader component instead of
              the title prop.
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

/** Dialog with icon in header */
export const HeaderWithIcon: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setIsOpen(true)}>Open Settings</Button>
        <Dialog
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          showCloseButton={false}
          data-testid="icon-header-dialog"
        >
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-[rgb(var(--primary))]/10 p-2">
                <Icon icon={Settings} size="md" className="text-[rgb(var(--primary))]" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Settings</h2>
                <p className="text-sm text-[rgb(var(--muted-foreground))]">
                  Configure your preferences
                </p>
              </div>
            </div>
          </DialogHeader>
          <DialogContent>
            <p className="text-sm text-[rgb(var(--muted-foreground))]">Settings content here...</p>
          </DialogContent>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsOpen(false)}>Save Changes</Button>
          </DialogFooter>
        </Dialog>
      </>
    );
  },
};

// ============================================================================
// Content Variations
// ============================================================================

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
          data-testid="info-dialog"
        >
          <DialogContent>
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-[rgb(var(--primary))]/10 p-2">
                <Icon icon={Info} size="md" className="text-[rgb(var(--primary))]" />
              </div>
              <div>
                <p className="text-sm text-[rgb(var(--foreground))]">
                  This is an informational message.
                </p>
                <p className="mt-1 text-sm text-[rgb(var(--muted-foreground))]">
                  You can close this dialog by clicking outside, pressing Escape, or clicking the X
                  button.
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
          data-testid="success-dialog"
        >
          <DialogContent>
            <div className="flex flex-col items-center text-center">
              <div className="rounded-full bg-green-500/10 p-3">
                <Icon icon={CheckCircle} size="lg" className="text-green-500" />
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
          data-testid="scroll-dialog"
        >
          <DialogContent className="max-h-[300px]">
            <div className="space-y-4 text-sm text-[rgb(var(--muted-foreground))]">
              {Array.from({ length: 10 }, (_, paragraphIndex) => (
                <p key={`terms-paragraph-${paragraphIndex}`}>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
                  incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
                  exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
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

// ============================================================================
// Close Behavior
// ============================================================================

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
          data-testid="no-close-dialog"
        >
          <DialogContent>
            <p className="text-sm text-[rgb(var(--muted-foreground))]">
              This dialog has no close button and doesn&apos;t close when clicking the backdrop. You
              must use the action buttons or press Escape.
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

/** Modal dialog - cannot be dismissed except via actions */
export const ModalDialog: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setIsOpen(true)}>Open Modal Dialog</Button>
        <Dialog
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="Required Action"
          showCloseButton={false}
          closeOnBackdropClick={false}
          closeOnEscape={false}
          data-testid="modal-dialog"
        >
          <DialogContent>
            <p className="text-sm text-[rgb(var(--muted-foreground))]">
              This is a true modal dialog. It cannot be dismissed by:
            </p>
            <ul className="mt-2 list-inside list-disc text-sm text-[rgb(var(--muted-foreground))]">
              <li>Clicking outside</li>
              <li>Pressing Escape</li>
              <li>Close button (hidden)</li>
            </ul>
            <p className="mt-2 text-sm text-[rgb(var(--muted-foreground))]">
              You must click an action button to continue.
            </p>
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

/** Custom close label */
export const CustomCloseLabel: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setIsOpen(true)}>Open Dialog</Button>
        <Dialog
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="Custom Close Label"
          closeLabel="Dismiss this notification"
          data-testid="custom-close-dialog"
        >
          <DialogContent>
            <p className="text-sm text-[rgb(var(--muted-foreground))]">
              The close button has a custom aria-label: &quot;Dismiss this notification&quot;. This
              is more descriptive for screen reader users.
            </p>
          </DialogContent>
        </Dialog>
      </>
    );
  },
};

// ============================================================================
// Accessibility Demos
// ============================================================================

/** Focus trap demonstration */
export const FocusTrap: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <div className="space-y-4">
        <Button onClick={() => setIsOpen(true)}>Open Dialog</Button>
        <Dialog isOpen={isOpen} onClose={() => setIsOpen(false)} title="Focus Trap Demo">
          <DialogContent>
            <p className="text-sm text-[rgb(var(--muted-foreground))]">
              Try pressing Tab repeatedly. Focus will cycle through these elements:
            </p>
            <div className="mt-4 space-y-2">
              <Input placeholder="First input" />
              <Input placeholder="Second input" />
              <Input placeholder="Third input" />
            </div>
            <p className="mt-4 text-sm text-[rgb(var(--muted-foreground))]">
              Focus is trapped within the dialog. It will wrap from the last element back to the
              first.
            </p>
          </DialogContent>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsOpen(false)}>Confirm</Button>
          </DialogFooter>
        </Dialog>
        <div className="text-xs text-[rgb(var(--muted-foreground))]">
          <p>Focus trap behavior:</p>
          <ul className="list-inside list-disc">
            <li>Tab: Move focus forward, wrap at end</li>
            <li>Shift+Tab: Move focus backward, wrap at start</li>
            <li>Focus cannot escape dialog while open</li>
          </ul>
        </div>
      </div>
    );
  },
};

/** Focus restoration demonstration */
export const FocusRestoration: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);

    return (
      <div className="space-y-4">
        <p className="text-sm text-[rgb(var(--muted-foreground))]">
          When the dialog closes, focus returns to the trigger button.
        </p>
        <Button ref={buttonRef} onClick={() => setIsOpen(true)}>
          Open Dialog (Watch Focus)
        </Button>
        <Dialog isOpen={isOpen} onClose={() => setIsOpen(false)} title="Focus Restoration">
          <DialogContent>
            <p className="text-sm text-[rgb(var(--muted-foreground))]">
              Close this dialog (via Escape, backdrop click, or button). Focus will return to the
              &quot;Open Dialog&quot; button.
            </p>
          </DialogContent>
          <DialogFooter>
            <Button onClick={() => setIsOpen(false)}>Close</Button>
          </DialogFooter>
        </Dialog>
        <div className="text-xs text-[rgb(var(--muted-foreground))]">
          This behavior is crucial for keyboard users who need to continue navigating from where
          they left off.
        </div>
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
        <Dialog isOpen={isOpen} onClose={() => setIsOpen(false)} title="Keyboard Navigation">
          <DialogContent>
            <p className="text-sm text-[rgb(var(--muted-foreground))]">
              This dialog supports full keyboard navigation:
            </p>
            <ul className="mt-2 list-inside list-disc text-sm text-[rgb(var(--muted-foreground))]">
              <li>
                <kbd className="rounded border px-1">Escape</kbd> - Close dialog
              </li>
              <li>
                <kbd className="rounded border px-1">Tab</kbd> - Move focus forward
              </li>
              <li>
                <kbd className="rounded border px-1">Shift</kbd> +{' '}
                <kbd className="rounded border px-1">Tab</kbd> - Move focus backward
              </li>
              <li>
                <kbd className="rounded border px-1">Enter</kbd> /{' '}
                <kbd className="rounded border px-1">Space</kbd> - Activate focused button
              </li>
            </ul>
          </DialogContent>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsOpen(false)}>Confirm</Button>
          </DialogFooter>
        </Dialog>
      </div>
    );
  },
};

/** Touch target accessibility */
export const TouchTargetAccessibility: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <div className="space-y-4">
        <p className="text-sm text-[rgb(var(--muted-foreground))]">
          The close button meets WCAG 2.5.5 Touch Target Size requirements (≥44×44px).
        </p>
        <Button onClick={() => setIsOpen(true)}>Open Dialog</Button>
        <Dialog isOpen={isOpen} onClose={() => setIsOpen(false)} title="Touch Targets">
          <DialogContent>
            <p className="text-sm text-[rgb(var(--muted-foreground))]">
              Notice the close button (X) in the header - it has a minimum touch target of 44×44
              pixels, making it easy to tap on mobile devices.
            </p>
          </DialogContent>
          <DialogFooter>
            <Button onClick={() => setIsOpen(false)}>Close</Button>
          </DialogFooter>
        </Dialog>
      </div>
    );
  },
};

/** Screen reader accessibility */
export const ScreenReaderAccessibility: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <div className="space-y-4">
        <p className="text-sm text-[rgb(var(--muted-foreground))]">
          Enable a screen reader to hear the accessibility features in action.
        </p>
        <Button onClick={() => setIsOpen(true)}>Open Dialog</Button>
        <Dialog
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="Screen Reader Demo"
          descriptionId="sr-description"
          data-testid="sr-dialog"
        >
          <DialogContent>
            <p id="sr-description" className="text-sm text-[rgb(var(--muted-foreground))]">
              This dialog demonstrates screen reader accessibility features:
            </p>
            <ul className="mt-2 list-inside list-disc text-sm text-[rgb(var(--muted-foreground))]">
              <li>
                <strong>aria-labelledby:</strong> Points to dialog title
              </li>
              <li>
                <strong>aria-describedby:</strong> Points to this description
              </li>
              <li>
                <strong>aria-modal=&quot;true&quot;:</strong> Indicates modal behavior
              </li>
              <li>
                <strong>role=&quot;dialog&quot;:</strong> Proper dialog semantics
              </li>
              <li>
                <strong>VisuallyHidden announcement:</strong> &quot;Dialog opened: Screen Reader
                Demo&quot;
              </li>
            </ul>
          </DialogContent>
          <DialogFooter>
            <Button onClick={() => setIsOpen(false)}>Close</Button>
          </DialogFooter>
        </Dialog>
      </div>
    );
  },
};

/** Reduced motion support */
export const ReducedMotion: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <div className="space-y-4">
        <p className="text-sm text-[rgb(var(--muted-foreground))]">
          The dialog respects <code>prefers-reduced-motion</code>. Enable reduced motion in your OS
          settings to disable animations.
        </p>
        <Button onClick={() => setIsOpen(true)}>Open Dialog</Button>
        <Dialog isOpen={isOpen} onClose={() => setIsOpen(false)} title="Reduced Motion Support">
          <DialogContent>
            <p className="text-sm text-[rgb(var(--muted-foreground))]">
              This dialog uses <code>motion-safe:</code> Tailwind variants for animations. Users who
              prefer reduced motion will see no animation.
            </p>
          </DialogContent>
          <DialogFooter>
            <Button onClick={() => setIsOpen(false)}>Close</Button>
          </DialogFooter>
        </Dialog>
      </div>
    );
  },
};

/** Reduced transparency support */
export const ReducedTransparency: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <div className="space-y-4">
        <p className="text-sm text-[rgb(var(--muted-foreground))]">
          The backdrop respects <code>prefers-reduced-transparency</code>. Enable reduced
          transparency in your OS settings for a more opaque backdrop.
        </p>
        <Button onClick={() => setIsOpen(true)}>Open Dialog</Button>
        <Dialog isOpen={isOpen} onClose={() => setIsOpen(false)} title="Reduced Transparency">
          <DialogContent>
            <p className="text-sm text-[rgb(var(--muted-foreground))]">
              The backdrop uses 60% opacity by default, but increases to 80% for users who prefer
              reduced transparency.
            </p>
          </DialogContent>
          <DialogFooter>
            <Button onClick={() => setIsOpen(false)}>Close</Button>
          </DialogFooter>
        </Dialog>
      </div>
    );
  },
};

// ============================================================================
// Ref Forwarding & Testing
// ============================================================================

/** Ref forwarding demonstration */
export const RefForwarding: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    const dialogRef = useRef<HTMLDivElement>(null);
    const headerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const footerRef = useRef<HTMLDivElement>(null);

    const logRefs = () => {
      console.log('Dialog ref:', dialogRef.current);
      console.log('Header ref:', headerRef.current);
      console.log('Content ref:', contentRef.current);
      console.log('Footer ref:', footerRef.current);
    };

    return (
      <div className="space-y-4">
        <Button onClick={() => setIsOpen(true)}>Open Dialog</Button>
        <Dialog
          ref={dialogRef}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          showCloseButton={false}
        >
          <DialogHeader ref={headerRef}>
            <h2 className="text-lg font-semibold">Ref Forwarding</h2>
          </DialogHeader>
          <DialogContent ref={contentRef}>
            <p className="text-sm text-[rgb(var(--muted-foreground))]">
              All Dialog components support ref forwarding for direct DOM access.
            </p>
          </DialogContent>
          <DialogFooter ref={footerRef}>
            <Button variant="ghost" onClick={logRefs}>
              Log Refs to Console
            </Button>
            <Button onClick={() => setIsOpen(false)}>Close</Button>
          </DialogFooter>
        </Dialog>
      </div>
    );
  },
};

/** Data attributes for testing */
export const DataTestId: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <div className="space-y-4">
        <p className="text-sm text-[rgb(var(--muted-foreground))]">
          Dialog components support <code>data-testid</code> attributes for testing:
        </p>
        <Button onClick={() => setIsOpen(true)}>Open Dialog</Button>
        <Dialog
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="Testing Attributes"
          data-testid="test-dialog"
        >
          <DialogContent data-testid="test-dialog-content">
            <p className="text-sm text-[rgb(var(--muted-foreground))]">
              Check the DOM to see the data-testid attributes:
            </p>
            <ul className="mt-2 list-inside list-disc text-xs text-[rgb(var(--muted-foreground))]">
              <li>
                <code>data-testid=&quot;test-dialog-container&quot;</code> (outer container)
              </li>
              <li>
                <code>data-testid=&quot;test-dialog-backdrop&quot;</code> (backdrop)
              </li>
              <li>
                <code>data-testid=&quot;test-dialog&quot;</code> (dialog panel)
              </li>
              <li>
                <code>data-testid=&quot;test-dialog-header&quot;</code> (header)
              </li>
              <li>
                <code>data-testid=&quot;test-dialog-close-button&quot;</code> (close button)
              </li>
              <li>
                <code>data-testid=&quot;test-dialog-content&quot;</code> (content)
              </li>
              <li>
                <code>data-testid=&quot;test-dialog-footer&quot;</code> (footer)
              </li>
            </ul>
          </DialogContent>
          <DialogFooter data-testid="test-dialog-footer">
            <Button onClick={() => setIsOpen(false)}>Close</Button>
          </DialogFooter>
        </Dialog>
      </div>
    );
  },
};

// ============================================================================
// Real-World Examples
// ============================================================================

/** File upload dialog */
export const FileUploadDialog: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setIsOpen(true)}>
          <Icon icon={Upload} size="sm" className="mr-2" />
          Upload File
        </Button>
        <Dialog
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="Upload File"
          size="md"
          data-testid="upload-dialog"
        >
          <DialogContent>
            <div className="rounded-lg border-2 border-dashed border-[rgb(var(--border))] p-8 text-center">
              <Icon
                icon={Upload}
                size="lg"
                className="mx-auto mb-4 text-[rgb(var(--muted-foreground))]"
              />
              <p className="text-sm font-medium">Drag and drop your file here</p>
              <p className="mt-1 text-xs text-[rgb(var(--muted-foreground))]">or click to browse</p>
              <Button variant="secondary" className="mt-4">
                Browse Files
              </Button>
            </div>
            <p className="mt-4 text-xs text-[rgb(var(--muted-foreground))]">
              Supported formats: PDF, DOC, DOCX, TXT (max 10MB)
            </p>
          </DialogContent>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button disabled>Upload</Button>
          </DialogFooter>
        </Dialog>
      </>
    );
  },
};

/** Nested dialog example (not recommended but supported) */
export const NestedDialogs: Story = {
  render: () => {
    const [isOuterOpen, setIsOuterOpen] = useState(false);
    const [isInnerOpen, setIsInnerOpen] = useState(false);

    return (
      <div className="space-y-4">
        <p className="text-sm text-[rgb(var(--muted-foreground))]">
          Nested dialogs are supported but not recommended for UX reasons.
        </p>
        <Button onClick={() => setIsOuterOpen(true)}>Open Outer Dialog</Button>
        <Dialog
          isOpen={isOuterOpen}
          onClose={() => setIsOuterOpen(false)}
          title="Outer Dialog"
          size="lg"
        >
          <DialogContent>
            <p className="text-sm text-[rgb(var(--muted-foreground))]">
              This is the outer dialog. Click below to open a nested dialog.
            </p>
            <Button className="mt-4" onClick={() => setIsInnerOpen(true)}>
              Open Inner Dialog
            </Button>
          </DialogContent>
          <DialogFooter>
            <Button onClick={() => setIsOuterOpen(false)}>Close</Button>
          </DialogFooter>
        </Dialog>
        <Dialog isOpen={isInnerOpen} onClose={() => setIsInnerOpen(false)} title="Inner Dialog">
          <DialogContent>
            <p className="text-sm text-[rgb(var(--muted-foreground))]">
              This is the inner (nested) dialog.
            </p>
          </DialogContent>
          <DialogFooter>
            <Button onClick={() => setIsInnerOpen(false)}>Close</Button>
          </DialogFooter>
        </Dialog>
      </div>
    );
  },
};

// ============================================================================
// Constants & Utilities Reference
// ============================================================================

/** Shows all exported constants and utilities */
export const ConstantsReference: Story = {
  render: () => (
    <div className="max-w-2xl space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Constants</h3>
        <dl className="mt-2 space-y-2 text-sm">
          <div>
            <dt className="font-medium">DEFAULT_CLOSE_LABEL</dt>
            <dd className="text-[rgb(var(--muted-foreground))]">
              <code>&quot;{DEFAULT_CLOSE_LABEL}&quot;</code>
            </dd>
          </div>
          <div>
            <dt className="font-medium">DIALOG_SIZE_CLASSES</dt>
            <dd className="text-[rgb(var(--muted-foreground))]">
              <pre className="mt-1 overflow-auto rounded bg-[rgb(var(--muted))]/20 p-2 text-xs">
                {JSON.stringify(DIALOG_SIZE_CLASSES, null, 2)}
              </pre>
            </dd>
          </div>
          <div>
            <dt className="font-medium">DIALOG_PANEL_CLASSES</dt>
            <dd className="text-[rgb(var(--muted-foreground))]">
              <pre className="mt-1 overflow-auto rounded bg-[rgb(var(--muted))]/20 p-2 text-xs">
                {DIALOG_PANEL_CLASSES}
              </pre>
            </dd>
          </div>
          <div>
            <dt className="font-medium">DIALOG_BACKDROP_CLASSES</dt>
            <dd className="text-[rgb(var(--muted-foreground))]">
              <pre className="mt-1 overflow-auto rounded bg-[rgb(var(--muted))]/20 p-2 text-xs">
                {DIALOG_BACKDROP_CLASSES}
              </pre>
            </dd>
          </div>
          <div>
            <dt className="font-medium">DIALOG_HEADER_CLASSES</dt>
            <dd className="text-[rgb(var(--muted-foreground))]">
              <pre className="mt-1 overflow-auto rounded bg-[rgb(var(--muted))]/20 p-2 text-xs">
                {DIALOG_HEADER_CLASSES}
              </pre>
            </dd>
          </div>
          <div>
            <dt className="font-medium">DIALOG_CONTENT_CLASSES</dt>
            <dd className="text-[rgb(var(--muted-foreground))]">
              <pre className="mt-1 overflow-auto rounded bg-[rgb(var(--muted))]/20 p-2 text-xs">
                {DIALOG_CONTENT_CLASSES}
              </pre>
            </dd>
          </div>
          <div>
            <dt className="font-medium">DIALOG_FOOTER_CLASSES</dt>
            <dd className="text-[rgb(var(--muted-foreground))]">
              <pre className="mt-1 overflow-auto rounded bg-[rgb(var(--muted))]/20 p-2 text-xs">
                {DIALOG_FOOTER_CLASSES}
              </pre>
            </dd>
          </div>
        </dl>
      </div>
      <div>
        <h3 className="text-lg font-semibold">Utility Functions</h3>
        <dl className="mt-2 space-y-2 text-sm">
          <div>
            <dt className="font-medium">getResponsiveSizeClasses(size)</dt>
            <dd className="text-[rgb(var(--muted-foreground))]">
              <p className="mt-1">Examples:</p>
              <pre className="mt-1 overflow-auto rounded bg-[rgb(var(--muted))]/20 p-2 text-xs">
                {`getResponsiveSizeClasses('sm') → "${getResponsiveSizeClasses('sm')}"
getResponsiveSizeClasses('lg') → "${getResponsiveSizeClasses('lg')}"
getResponsiveSizeClasses({ base: 'sm', md: 'lg' }) → "${getResponsiveSizeClasses({ base: 'sm', md: 'lg' })}"`}
              </pre>
            </dd>
          </div>
          <div>
            <dt className="font-medium">getDialogPaddingClasses(padding, default)</dt>
            <dd className="text-[rgb(var(--muted-foreground))]">
              <p className="mt-1">Examples:</p>
              <pre className="mt-1 overflow-auto rounded bg-[rgb(var(--muted))]/20 p-2 text-xs">
                {`getDialogPaddingClasses('4', 'p-4') → "${getDialogPaddingClasses('4', 'p-4')}"
getDialogPaddingClasses({ base: '2', md: '6' }, 'p-4') → "${getDialogPaddingClasses({ base: '2', md: '6' }, 'p-4')}"`}
              </pre>
            </dd>
          </div>
        </dl>
      </div>
    </div>
  ),
};
