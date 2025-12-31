import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { PermissionDialog, type PermissionRequest } from './PermissionDialog';

const meta: Meta<typeof PermissionDialog> = {
  title: 'Organisms/PermissionDialog',
  component: PermissionDialog,
  parameters: {
    layout: 'fullscreen',
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
  },
  args: {
    onApprove: fn(),
    onDeny: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof PermissionDialog>;

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

/** Default permission dialog for write access */
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
