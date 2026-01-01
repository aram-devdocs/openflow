import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { useRef, useState } from 'react';
import { Button } from '../atoms/Button';
import {
  // Constants
  DEFAULT_APPROVE_LABEL,
  DEFAULT_CLOSE_LABEL,
  DEFAULT_DENY_LABEL,
  DEFAULT_TOOL_CONFIG,
  PERMISSION_DIALOG_BACKDROP_CLASSES,
  PERMISSION_DIALOG_BUTTON_CLASSES,
  PERMISSION_DIALOG_CLOSE_BUTTON_CLASSES,
  PERMISSION_DIALOG_CONTAINER_CLASSES,
  PERMISSION_DIALOG_CONTENT_CLASSES,
  PERMISSION_DIALOG_FILEPATH_CLASSES,
  PERMISSION_DIALOG_FOOTER_CLASSES,
  PERMISSION_DIALOG_HEADER_CLASSES,
  PERMISSION_DIALOG_PANEL_CLASSES,
  PERMISSION_DIALOG_SIZE_CLASSES,
  PERMISSION_DIALOG_TOOL_ICON_CLASSES,
  PERMISSION_DIALOG_WARNING_ICON_CLASSES,
  PermissionDialog,
  type PermissionRequest,
  SR_APPROVING,
  SR_DENYING,
  SR_DIALOG_OPENED,
  TOOL_CONFIG,
  buildAccessibleLabel,
  buildDialogAnnouncement,
  getActionDescription,
  // Utility functions
  getBaseSize,
  getResponsiveSizeClasses,
} from './PermissionDialog';

const meta: Meta<typeof PermissionDialog> = {
  title: 'Organisms/PermissionDialog',
  component: PermissionDialog,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
PermissionDialog is used to request explicit user permission before Claude performs sensitive actions like file writes, reads, or command execution.

## Accessibility Features

- **role="alertdialog"**: Indicates an urgent dialog requiring user attention
- **aria-modal="true"**: Prevents screen reader from accessing content behind dialog
- **Focus trap**: Tab/Shift+Tab cycles through focusable elements within the dialog
- **Focus management**: Focus is moved to dialog on open and restored on close
- **Escape key**: Closes (denies) the dialog (configurable)
- **Touch targets**: All buttons are ≥44px (WCAG 2.5.5)
- **Screen reader announcements**: Loading states and permission details announced
- **Clear permission explanation**: Action type and file path clearly described
- **Button order**: Deny first (safer default), then Allow

## Responsive Behavior

- Size prop supports responsive breakpoints: \`{ base: 'sm', md: 'md', lg: 'lg' }\`
- Footer buttons stack vertically on mobile, horizontal on desktop
- File paths wrap with word-break for long paths

## Constants and Utilities

\`\`\`typescript
import {
  // Default labels
  DEFAULT_APPROVE_LABEL,      // 'Allow'
  DEFAULT_DENY_LABEL,         // 'Deny'
  DEFAULT_CLOSE_LABEL,        // 'Close and deny permission'

  // Screen reader announcements
  SR_DIALOG_OPENED,           // 'Permission request dialog opened.'
  SR_APPROVING,               // 'Approving permission, please wait...'
  SR_DENYING,                 // 'Denying permission, please wait...'

  // Tool configuration
  TOOL_CONFIG,                // { write, read, bash } -> icons and actions
  DEFAULT_TOOL_CONFIG,        // Fallback for unknown tools

  // Class constants
  PERMISSION_DIALOG_SIZE_CLASSES,
  PERMISSION_DIALOG_PANEL_CLASSES,
  // ... and more

  // Utility functions
  getBaseSize,                // (size) => 'sm' | 'md' | 'lg'
  getResponsiveSizeClasses,   // (size) => 'max-w-md' | responsive classes
  getToolIcon,                // (toolName) => LucideIcon
  getActionDescription,       // (toolName) => 'write to' | 'read from' | etc.
  buildAccessibleLabel,       // (request) => full SR description
  buildDialogAnnouncement,    // (request, approving, denying) => SR announcement
} from './PermissionDialog';
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    request: {
      control: false,
      description: 'The permission request to display',
    },
    onApprove: {
      action: 'approved',
      description: 'Called when user approves the permission',
    },
    onDeny: {
      action: 'denied',
      description: 'Called when user denies the permission',
    },
    approving: {
      control: 'boolean',
      description: 'Whether the approve action is in progress',
    },
    denying: {
      control: 'boolean',
      description: 'Whether the deny action is in progress',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Responsive size of the dialog',
    },
    approveLabel: {
      control: 'text',
      description: 'Accessible label for approve button',
    },
    denyLabel: {
      control: 'text',
      description: 'Accessible label for deny button',
    },
    closeLabel: {
      control: 'text',
      description: 'Accessible label for close button',
    },
    closeOnEscape: {
      control: 'boolean',
      description: 'Whether pressing Escape closes/denies the dialog',
    },
    closeOnBackdropClick: {
      control: 'boolean',
      description: 'Whether clicking the backdrop closes/denies the dialog',
    },
  },
  args: {
    onApprove: fn(),
    onDeny: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof PermissionDialog>;

// ============================================================================
// Sample Permission Requests
// ============================================================================

/** Sample write permission request */
const writeRequest: PermissionRequest = {
  processId: 'proc-123',
  toolName: 'Write',
  filePath: '/src/components/Button.tsx',
  description: 'Allow Claude to write to Button.tsx? (y/n)',
};

/** Sample read permission request */
const readRequest: PermissionRequest = {
  processId: 'proc-456',
  toolName: 'Read',
  filePath: '/config/settings.json',
  description: 'Allow Claude to read from settings.json? (y/n)',
};

/** Sample bash permission request */
const bashRequest: PermissionRequest = {
  processId: 'proc-789',
  toolName: 'Bash',
  filePath: '/project/scripts',
  description: 'Allow Claude to execute command: npm install lodash? (y/n)',
};

/** Generic permission request without file path */
const genericRequest: PermissionRequest = {
  processId: 'proc-abc',
  toolName: 'CustomTool',
  description: 'Allow Claude to access external API? (y/n)',
};

// ============================================================================
// Basic Stories
// ============================================================================

/** Default permission dialog for write access */
export const Default: Story = {
  args: {
    request: writeRequest,
    'data-testid': 'permission-dialog',
  },
};

/** Permission dialog for write access */
export const WritePermission: Story = {
  args: {
    request: writeRequest,
  },
};

/** Permission dialog for read access */
export const ReadPermission: Story = {
  args: {
    request: readRequest,
  },
};

/** Permission dialog for bash command execution */
export const BashPermission: Story = {
  args: {
    request: bashRequest,
  },
};

/** Permission dialog for generic/custom tool access */
export const GenericPermission: Story = {
  args: {
    request: genericRequest,
  },
};

// ============================================================================
// Size Variants
// ============================================================================

/** Small size dialog */
export const SizeSmall: Story = {
  args: {
    request: writeRequest,
    size: 'sm',
  },
};

/** Medium size dialog (default) */
export const SizeMedium: Story = {
  args: {
    request: writeRequest,
    size: 'md',
  },
};

/** Large size dialog */
export const SizeLarge: Story = {
  args: {
    request: writeRequest,
    size: 'lg',
  },
};

/** All sizes comparison */
export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-col gap-4 p-4">
      <h2 className="text-lg font-semibold">Size Classes Reference:</h2>
      <pre className="rounded bg-muted p-2 text-xs">
        {JSON.stringify(PERMISSION_DIALOG_SIZE_CLASSES, null, 2)}
      </pre>
    </div>
  ),
};

/** Responsive sizing - changes size based on viewport */
export const ResponsiveSizing: Story = {
  args: {
    request: writeRequest,
    size: { base: 'sm', md: 'md', lg: 'lg' },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Dialog size changes based on viewport: small on mobile, medium on tablet, large on desktop.',
      },
    },
  },
};

// ============================================================================
// Loading States
// ============================================================================

/** Dialog with approving in progress */
export const ApprovingState: Story = {
  args: {
    request: writeRequest,
    approving: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows loading spinner on Allow button. Deny and close buttons are disabled.',
      },
    },
  },
};

/** Dialog with denying in progress */
export const DenyingState: Story = {
  args: {
    request: writeRequest,
    denying: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows loading spinner on Deny button. Allow and close buttons are disabled.',
      },
    },
  },
};

/** Interactive loading states */
export const InteractiveLoadingStates: Story = {
  render: function Render() {
    const [approving, setApproving] = useState(false);
    const [denying, setDenying] = useState(false);

    const handleApprove = () => {
      setApproving(true);
      setTimeout(() => setApproving(false), 2000);
    };

    const handleDeny = () => {
      setDenying(true);
      setTimeout(() => setDenying(false), 2000);
    };

    return (
      <PermissionDialog
        request={writeRequest}
        onApprove={handleApprove}
        onDeny={handleDeny}
        approving={approving}
        denying={denying}
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Click Allow or Deny to see loading state for 2 seconds.',
      },
    },
  },
};

// ============================================================================
// Content Variations
// ============================================================================

/** Permission with long file path */
export const LongFilePath: Story = {
  args: {
    request: {
      processId: 'proc-long',
      toolName: 'Write',
      filePath:
        '/very/long/path/to/some/deeply/nested/directory/structure/containing/the/file/ComponentWithVeryLongName.tsx',
      description: 'Allow Claude to write to this file? (y/n)',
    },
  },
};

/** Permission with long description */
export const LongDescription: Story = {
  args: {
    request: {
      processId: 'proc-desc',
      toolName: 'Bash',
      filePath: '/project',
      description:
        'Claude wants to execute a complex shell command that will modify multiple files, install dependencies, and run database migrations. This action may take several minutes to complete. Allow execution? (y/n)',
    },
  },
};

/** Permission without file path (API access) */
export const NoFilePath: Story = {
  args: {
    request: {
      processId: 'proc-api',
      toolName: 'WebFetch',
      description: 'Allow Claude to fetch data from https://api.example.com? (y/n)',
    },
  },
};

// ============================================================================
// Custom Labels
// ============================================================================

/** Custom button labels */
export const CustomLabels: Story = {
  args: {
    request: writeRequest,
    approveLabel: 'Yes, Allow This',
    denyLabel: 'No, Block This',
    closeLabel: 'Dismiss and deny',
  },
};

// ============================================================================
// Configuration Options
// ============================================================================

/** Escape key disabled */
export const EscapeKeyDisabled: Story = {
  args: {
    request: writeRequest,
    closeOnEscape: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Pressing Escape will NOT close the dialog. User must click a button.',
      },
    },
  },
};

/** Backdrop click disabled */
export const BackdropClickDisabled: Story = {
  args: {
    request: writeRequest,
    closeOnBackdropClick: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Clicking the backdrop will NOT close the dialog. User must click a button or press Escape.',
      },
    },
  },
};

// ============================================================================
// Accessibility Demos
// ============================================================================

/** Focus ring visibility demo */
export const FocusRingVisibility: Story = {
  args: {
    request: writeRequest,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Tab through the dialog to see focus rings. All interactive elements have visible focus indicators.',
      },
    },
  },
};

/** Touch target accessibility */
export const TouchTargetAccessibility: Story = {
  args: {
    request: writeRequest,
  },
  parameters: {
    docs: {
      description: {
        story: `All buttons meet WCAG 2.5.5 touch target requirements (≥44px). Close button uses \`${PERMISSION_DIALOG_CLOSE_BUTTON_CLASSES}\``,
      },
    },
  },
};

/** Screen reader accessibility demo */
export const ScreenReaderAccessibility: Story = {
  args: {
    request: writeRequest,
    'data-testid': 'permission-dialog',
  },
  parameters: {
    docs: {
      description: {
        story: `
Screen reader features:
- role="alertdialog" for urgent notifications
- aria-modal="true" to trap screen reader focus
- aria-labelledby points to title
- aria-describedby points to description
- Loading states announced with aria-live="assertive"
        `,
      },
    },
  },
};

/** Keyboard navigation demo */
export const KeyboardNavigation: Story = {
  args: {
    request: writeRequest,
  },
  parameters: {
    docs: {
      description: {
        story: `
Keyboard controls:
- **Tab**: Move focus forward through buttons
- **Shift + Tab**: Move focus backward
- **Enter/Space**: Activate focused button
- **Escape**: Close dialog (deny permission)
        `,
      },
    },
  },
};

/** Reduced motion demo */
export const ReducedMotionDemo: Story = {
  args: {
    request: writeRequest,
  },
  parameters: {
    docs: {
      description: {
        story: `
Enable "Reduce motion" in your OS settings to see the dialog appear without animations.
The dialog uses \`motion-safe:\` prefix on animations to respect user preferences.
        `,
      },
    },
  },
};

/** Reduced transparency demo */
export const ReducedTransparencyDemo: Story = {
  args: {
    request: writeRequest,
  },
  parameters: {
    docs: {
      description: {
        story: `
Enable "Reduce transparency" in your OS settings to see enhanced backdrop opacity.
Uses \`[@media(prefers-reduced-transparency:reduce)]:bg-black/80\` for better visibility.
        `,
      },
    },
  },
};

// ============================================================================
// Ref Forwarding
// ============================================================================

/** Ref forwarding demo */
export const RefForwarding: Story = {
  render: function Render() {
    const dialogRef = useRef<HTMLDivElement>(null);

    return (
      <div className="flex flex-col gap-4">
        <Button
          onClick={() => {
            if (dialogRef.current) {
              console.log('Dialog ref:', dialogRef.current);
              console.log('Dialog role:', dialogRef.current.getAttribute('role'));
              console.log('Dialog aria-modal:', dialogRef.current.getAttribute('aria-modal'));
            }
          }}
        >
          Log Dialog Ref Info
        </Button>
        <PermissionDialog
          ref={dialogRef}
          request={writeRequest}
          onApprove={() => {}}
          onDeny={() => {}}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'The dialog accepts a ref that points to the dialog panel element.',
      },
    },
  },
};

// ============================================================================
// Data Test ID
// ============================================================================

/** Data test ID demo */
export const DataTestId: Story = {
  args: {
    request: writeRequest,
    'data-testid': 'permission-dialog',
  },
  parameters: {
    docs: {
      description: {
        story: `
Data test IDs are added to key elements:
- \`permission-dialog-container\`: Outer container
- \`permission-dialog-backdrop\`: Backdrop overlay
- \`permission-dialog\`: Dialog panel
- \`permission-dialog-header\`: Header section
- \`permission-dialog-close\`: Close button
- \`permission-dialog-content\`: Content section
- \`permission-dialog-footer\`: Footer section
- \`permission-dialog-deny\`: Deny button
- \`permission-dialog-approve\`: Approve button
        `,
      },
    },
  },
};

// ============================================================================
// Real-World Examples
// ============================================================================

/** File edit permission flow */
export const FileEditPermissionFlow: Story = {
  render: function Render() {
    const [response, setResponse] = useState<string>('');
    const [approving, setApproving] = useState(false);
    const [denying, setDenying] = useState(false);

    const handleApprove = () => {
      setApproving(true);
      setTimeout(() => {
        setResponse('Permission granted. Writing to file...');
        setApproving(false);
      }, 1000);
    };

    const handleDeny = () => {
      setDenying(true);
      setTimeout(() => {
        setResponse('Permission denied. Operation cancelled.');
        setDenying(false);
      }, 500);
    };

    return (
      <div className="relative">
        <PermissionDialog
          request={{
            processId: 'proc-edit',
            toolName: 'Write',
            filePath: '/src/components/Header.tsx',
            description: 'Claude wants to update the Header component with new navigation links.',
          }}
          onApprove={handleApprove}
          onDeny={handleDeny}
          approving={approving}
          denying={denying}
        />
        {response && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 rounded bg-muted px-4 py-2 text-sm">
            {response}
          </div>
        )}
      </div>
    );
  },
};

/** Command execution permission */
export const CommandExecutionPermission: Story = {
  render: function Render() {
    const [response, setResponse] = useState<string>('');
    const [approving, setApproving] = useState(false);

    const handleApprove = () => {
      setApproving(true);
      setTimeout(() => {
        setResponse('Executing npm install... Done!');
        setApproving(false);
      }, 2000);
    };

    return (
      <div className="relative">
        <PermissionDialog
          request={{
            processId: 'proc-npm',
            toolName: 'Bash',
            filePath: '/project',
            description: 'npm install @tanstack/react-query',
          }}
          onApprove={handleApprove}
          onDeny={() => setResponse('Installation cancelled.')}
          approving={approving}
        />
        {response && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 rounded bg-muted px-4 py-2 text-sm font-mono">
            {response}
          </div>
        )}
      </div>
    );
  },
};

/** Multiple sequential permissions */
export const MultiplePermissions: Story = {
  render: function Render() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [responses, setResponses] = useState<string[]>([]);

    const permissions: PermissionRequest[] = [
      {
        processId: '1',
        toolName: 'Read',
        filePath: '/config/database.json',
        description: 'Read database configuration',
      },
      {
        processId: '2',
        toolName: 'Write',
        filePath: '/src/db/connection.ts',
        description: 'Update database connection module',
      },
      {
        processId: '3',
        toolName: 'Bash',
        description: 'npm run migrate',
      },
    ];

    const handleApprove = () => {
      const perm = permissions[currentIndex];
      if (perm) {
        setResponses([...responses, `Approved: ${perm.description}`]);
        setCurrentIndex(currentIndex + 1);
      }
    };

    const handleDeny = () => {
      const perm = permissions[currentIndex];
      if (perm) {
        setResponses([...responses, `Denied: ${perm.description}`]);
        setCurrentIndex(currentIndex + 1);
      }
    };

    if (currentIndex >= permissions.length) {
      return (
        <div className="flex h-screen items-center justify-center">
          <div className="rounded-lg border p-6">
            <h2 className="mb-4 text-lg font-semibold">Permission Log:</h2>
            <ul className="space-y-2">
              {responses.map((r, i) => (
                <li key={i} className="text-sm text-muted-foreground">
                  {r}
                </li>
              ))}
            </ul>
            <Button
              className="mt-4"
              onClick={() => {
                setCurrentIndex(0);
                setResponses([]);
              }}
            >
              Restart Demo
            </Button>
          </div>
        </div>
      );
    }

    const currentPermission = permissions[currentIndex];
    if (!currentPermission) {
      return <div className="flex h-screen items-center justify-center">No permissions</div>;
    }

    return (
      <PermissionDialog request={currentPermission} onApprove={handleApprove} onDeny={handleDeny} />
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Demo showing multiple sequential permission requests. Approve or deny each to proceed.',
      },
    },
  },
};

// ============================================================================
// Constants Reference
// ============================================================================

/** Constants reference */
export const ConstantsReference: Story = {
  render: () => (
    <div className="space-y-6 p-4">
      <section>
        <h2 className="mb-2 text-lg font-semibold">Default Labels</h2>
        <pre className="rounded bg-muted p-2 text-xs">
          {`DEFAULT_APPROVE_LABEL = "${DEFAULT_APPROVE_LABEL}"
DEFAULT_DENY_LABEL = "${DEFAULT_DENY_LABEL}"
DEFAULT_CLOSE_LABEL = "${DEFAULT_CLOSE_LABEL}"`}
        </pre>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Screen Reader Announcements</h2>
        <pre className="rounded bg-muted p-2 text-xs">
          {`SR_DIALOG_OPENED = "${SR_DIALOG_OPENED}"
SR_APPROVING = "${SR_APPROVING}"
SR_DENYING = "${SR_DENYING}"`}
        </pre>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Tool Configuration</h2>
        <pre className="rounded bg-muted p-2 text-xs">
          {`TOOL_CONFIG = ${JSON.stringify(
            Object.fromEntries(
              Object.entries(TOOL_CONFIG).map(([key, val]) => [
                key,
                { action: val.action, srPrefix: val.srPrefix },
              ])
            ),
            null,
            2
          )}

DEFAULT_TOOL_CONFIG = {
  action: "${DEFAULT_TOOL_CONFIG.action}",
  srPrefix: "${DEFAULT_TOOL_CONFIG.srPrefix}"
}`}
        </pre>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Size Classes</h2>
        <pre className="rounded bg-muted p-2 text-xs">
          {JSON.stringify(PERMISSION_DIALOG_SIZE_CLASSES, null, 2)}
        </pre>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">CSS Class Constants</h2>
        <pre className="rounded bg-muted p-2 text-xs">
          {`PERMISSION_DIALOG_CONTAINER_CLASSES = "${PERMISSION_DIALOG_CONTAINER_CLASSES}"

PERMISSION_DIALOG_BACKDROP_CLASSES = "${PERMISSION_DIALOG_BACKDROP_CLASSES}"

PERMISSION_DIALOG_PANEL_CLASSES = "${PERMISSION_DIALOG_PANEL_CLASSES}"

PERMISSION_DIALOG_HEADER_CLASSES = "${PERMISSION_DIALOG_HEADER_CLASSES}"

PERMISSION_DIALOG_WARNING_ICON_CLASSES = "${PERMISSION_DIALOG_WARNING_ICON_CLASSES}"

PERMISSION_DIALOG_CONTENT_CLASSES = "${PERMISSION_DIALOG_CONTENT_CLASSES}"

PERMISSION_DIALOG_TOOL_ICON_CLASSES = "${PERMISSION_DIALOG_TOOL_ICON_CLASSES}"

PERMISSION_DIALOG_FILEPATH_CLASSES = "${PERMISSION_DIALOG_FILEPATH_CLASSES}"

PERMISSION_DIALOG_FOOTER_CLASSES = "${PERMISSION_DIALOG_FOOTER_CLASSES}"

PERMISSION_DIALOG_BUTTON_CLASSES = "${PERMISSION_DIALOG_BUTTON_CLASSES}"

PERMISSION_DIALOG_CLOSE_BUTTON_CLASSES = "${PERMISSION_DIALOG_CLOSE_BUTTON_CLASSES}"`}
        </pre>
      </section>
    </div>
  ),
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: 'Reference for all exported constants from the PermissionDialog module.',
      },
    },
  },
};

/** Utility functions reference */
export const UtilityFunctionsReference: Story = {
  render: () => (
    <div className="space-y-6 p-4">
      <section>
        <h2 className="mb-2 text-lg font-semibold">getBaseSize(size)</h2>
        <pre className="rounded bg-muted p-2 text-xs">
          {`getBaseSize(undefined)     → "${getBaseSize(undefined)}"
getBaseSize('sm')          → "${getBaseSize('sm')}"
getBaseSize('md')          → "${getBaseSize('md')}"
getBaseSize('lg')          → "${getBaseSize('lg')}"
getBaseSize({ base: 'sm', md: 'lg' }) → "${getBaseSize({ base: 'sm', md: 'lg' })}"`}
        </pre>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">getResponsiveSizeClasses(size)</h2>
        <pre className="rounded bg-muted p-2 text-xs">
          {`getResponsiveSizeClasses(undefined) → "${getResponsiveSizeClasses(undefined)}"
getResponsiveSizeClasses('sm')      → "${getResponsiveSizeClasses('sm')}"
getResponsiveSizeClasses('md')      → "${getResponsiveSizeClasses('md')}"
getResponsiveSizeClasses('lg')      → "${getResponsiveSizeClasses('lg')}"
getResponsiveSizeClasses({ base: 'sm', md: 'md', lg: 'lg' }) → "${getResponsiveSizeClasses({ base: 'sm', md: 'md', lg: 'lg' })}"`}
        </pre>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">getToolIcon(toolName)</h2>
        <pre className="rounded bg-muted p-2 text-xs">
          {`getToolIcon('write')  → FileText icon
getToolIcon('read')   → FileText icon
getToolIcon('bash')   → Terminal icon
getToolIcon('other')  → Shield icon (default)`}
        </pre>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">getActionDescription(toolName)</h2>
        <pre className="rounded bg-muted p-2 text-xs">
          {`getActionDescription('write') → "${getActionDescription('write')}"
getActionDescription('read')  → "${getActionDescription('read')}"
getActionDescription('bash')  → "${getActionDescription('bash')}"
getActionDescription('other') → "${getActionDescription('other')}"`}
        </pre>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">buildAccessibleLabel(request)</h2>
        <pre className="rounded bg-muted p-2 text-xs">
          {`buildAccessibleLabel(writeRequest) →
"${buildAccessibleLabel(writeRequest)}"

buildAccessibleLabel(bashRequest) →
"${buildAccessibleLabel(bashRequest)}"`}
        </pre>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">
          buildDialogAnnouncement(request, approving, denying)
        </h2>
        <pre className="rounded bg-muted p-2 text-xs">
          {`buildDialogAnnouncement(writeRequest, false, false) →
"${buildDialogAnnouncement(writeRequest, false, false)}"

buildDialogAnnouncement(writeRequest, true, false) →
"${buildDialogAnnouncement(writeRequest, true, false)}"

buildDialogAnnouncement(writeRequest, false, true) →
"${buildDialogAnnouncement(writeRequest, false, true)}"`}
        </pre>
      </section>
    </div>
  ),
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: 'Reference for all exported utility functions from the PermissionDialog module.',
      },
    },
  },
};
