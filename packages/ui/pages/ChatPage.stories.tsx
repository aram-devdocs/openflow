/**
 * Storybook stories for ChatPage
 *
 * Demonstrates the complete standalone chat page in various states:
 * - Loading state
 * - Not found state
 * - Ready state with messages
 * - Processing state
 * - Raw output view
 * - Permission dialog
 * - Mobile viewport
 */

import type { Chat, Project } from '@openflow/generated';
import { ChatRole, MessageRole } from '@openflow/generated';
import type { Meta, StoryObj } from '@storybook/react';
import type { DisplayItem } from '../organisms/ChatBubbles';
import type { ChatMessageData } from '../organisms/ChatPageComponents';
import type { PermissionRequest } from '../organisms/PermissionDialog';
import { ChatPage, type ChatPageProps } from './ChatPage';

const meta: Meta<typeof ChatPage> = {
  title: 'Pages/ChatPage',
  component: ChatPage,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="h-screen w-screen">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ChatPage>;

// ============================================================================
// Mock Data
// ============================================================================

const mockProject: Project = {
  id: 'project-1',
  name: 'OpenFlow',
  gitRepoPath: '/Users/dev/openflow',
  baseBranch: 'main',
  setupScript: 'pnpm install',
  devScript: 'pnpm dev',
  workflowsFolder: '.openflow/workflows',
  icon: 'folder',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockChat: Chat = {
  id: 'chat-1',
  projectId: 'project-1',
  title: 'Feature Discussion - Auth Flow',
  chatRole: ChatRole.Main,
  baseBranch: 'main',
  branch: 'openflow/chat-1/main',
  worktreeDeleted: false,
  isPlanContainer: false,
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-15T14:30:00Z',
};

const mockMessages: ChatMessageData[] = [
  {
    id: 'msg-1',
    role: MessageRole.User,
    content: 'Can you help me implement OAuth authentication for the application?',
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'msg-2',
    role: MessageRole.Assistant,
    content: `I'd be happy to help you implement OAuth authentication. Here's what we need to do:

## Step 1: Install Dependencies

First, let's install the required packages:

\`\`\`bash
npm install next-auth @auth/core
\`\`\`

## Step 2: Configure OAuth Providers

We'll set up Google and GitHub as OAuth providers. Create an \`auth.ts\` file:

\`\`\`typescript
import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import GitHub from "next-auth/providers/github"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google, GitHub],
})
\`\`\`

Would you like me to implement this now?`,
    createdAt: '2024-01-15T10:01:00Z',
  },
  {
    id: 'msg-3',
    role: MessageRole.User,
    content: 'Yes, please implement it. Also add a sign-in button component.',
    createdAt: '2024-01-15T10:02:00Z',
  },
];

const mockDisplayItems: DisplayItem[] = [
  {
    type: 'text',
    content:
      "I'll implement the OAuth configuration and create a SignInButton component. Let me start by creating the auth configuration file...",
  },
  {
    type: 'tool',
    tool: {
      name: 'Write',
      input: { path: 'src/auth.ts' },
    },
  },
];

const mockPermissionRequest: PermissionRequest = {
  processId: 'process-1',
  toolName: 'Bash',
  description: 'Install OAuth dependencies: npm install next-auth @auth/core',
};

// ============================================================================
// Helper functions
// ============================================================================

const noop = () => {};
const noopString = (_s: string) => {};
const noopKeyEvent = (_e: React.KeyboardEvent<HTMLTextAreaElement>) => {};

// ============================================================================
// Default Props Factory
// ============================================================================

// Default sub-props extracted for reuse without non-null assertions
const defaultHeader = {
  title: mockChat.title,
  projectName: mockProject.name,
  showRawOutput: false,
  onToggleRawOutput: noop,
  onBack: noop,
};

const defaultContent = {
  hasContent: true,
  isProcessing: false,
  messages: mockMessages,
  displayItems: [] as DisplayItem[],
  activeProcessId: null,
  isRunning: false,
  showRawOutput: false,
  rawOutput: [] as string[],
};

const defaultInputArea = {
  inputValue: '',
  isProcessing: false,
  onInputChange: noopString,
  onKeyDown: noopKeyEvent,
  onSend: noop,
  onStop: noop,
};

const defaultPermissionDialog = {
  request: null,
  onApprove: noop,
  onDeny: noop,
};

function createDefaultProps(overrides?: Partial<ChatPageProps>): ChatPageProps {
  return {
    state: 'ready',
    chat: mockChat,
    project: mockProject,
    header: defaultHeader,
    content: defaultContent,
    inputArea: defaultInputArea,
    permissionDialog: defaultPermissionDialog,
    ...overrides,
  };
}

// ============================================================================
// Stories
// ============================================================================

/**
 * Default chat page with messages
 */
export const Default: Story = {
  args: createDefaultProps(),
};

/**
 * Loading state
 */
export const Loading: Story = {
  args: {
    state: 'loading',
  },
};

/**
 * Not found state
 */
export const NotFound: Story = {
  args: {
    state: 'not-found',
    onNotFoundBack: noop,
  },
};

/**
 * Empty chat (no messages yet)
 */
export const EmptyChat: Story = {
  args: createDefaultProps({
    content: {
      ...defaultContent,
      hasContent: false,
      messages: [],
    },
  }),
};

/**
 * Processing state (assistant is responding)
 */
export const Processing: Story = {
  args: createDefaultProps({
    content: {
      ...defaultContent,
      isProcessing: true,
      isRunning: true,
      displayItems: mockDisplayItems,
      activeProcessId: 'process-1',
    },
    inputArea: {
      ...defaultInputArea,
      isProcessing: true,
    },
  }),
};

/**
 * With input text
 */
export const WithInputText: Story = {
  args: createDefaultProps({
    inputArea: {
      ...defaultInputArea,
      inputValue: 'Can you also add session management?',
    },
  }),
};

/**
 * Raw output view
 */
export const RawOutputView: Story = {
  args: createDefaultProps({
    header: {
      ...defaultHeader,
      showRawOutput: true,
    },
    content: {
      ...defaultContent,
      showRawOutput: true,
      rawOutput: [
        '$ claude "implement OAuth authentication"',
        '',
        'Reading project context...',
        'Analyzing existing authentication code...',
        'Creating auth.ts...',
        'Writing configuration...',
        '',
        '> Write: src/auth.ts',
        '> Write: src/components/SignInButton.tsx',
        '',
        'Done! Created 2 files.',
      ],
    },
  }),
};

/**
 * Permission dialog open
 */
export const PermissionDialogOpen: Story = {
  args: createDefaultProps({
    permissionDialog: {
      request: mockPermissionRequest,
      onApprove: noop,
      onDeny: noop,
    },
  }),
};

/**
 * Permission dialog with file write
 */
export const PermissionDialogFileWrite: Story = {
  args: createDefaultProps({
    permissionDialog: {
      request: {
        processId: 'process-2',
        toolName: 'Write',
        filePath: '/src/auth.ts',
        description: 'Create authentication configuration file',
      },
      onApprove: noop,
      onDeny: noop,
    },
  }),
};

/**
 * Long conversation
 */
export const LongConversation: Story = {
  args: createDefaultProps({
    content: {
      ...defaultContent,
      messages: [
        ...mockMessages,
        {
          id: 'msg-4',
          role: MessageRole.Assistant,
          content: `I've created the OAuth configuration. Here's what was added:

1. \`src/auth.ts\` - NextAuth configuration with Google and GitHub providers
2. \`src/components/SignInButton.tsx\` - Reusable sign-in button component
3. \`src/app/api/auth/[...nextauth]/route.ts\` - API route handlers

The implementation includes:
- Secure session management
- CSRF protection
- Redirect URLs configuration
- Environment variable setup

Would you like me to add email/password authentication as well?`,
          createdAt: '2024-01-15T10:05:00Z',
        },
        {
          id: 'msg-5',
          role: MessageRole.User,
          content: 'Yes, please add email/password authentication with password hashing.',
          createdAt: '2024-01-15T10:06:00Z',
        },
        {
          id: 'msg-6',
          role: MessageRole.Assistant,
          content: `I'll add email/password authentication with bcrypt for password hashing. Here's the plan:

## Implementation Steps

1. Install bcrypt: \`npm install bcrypt @types/bcrypt\`
2. Add CredentialsProvider to auth config
3. Create user model with hashed passwords
4. Add registration endpoint
5. Update SignInButton with email form option

Let me implement this now...`,
          createdAt: '2024-01-15T10:07:00Z',
        },
      ],
    },
  }),
};

/**
 * Without project name
 */
export const WithoutProjectName: Story = {
  args: createDefaultProps({
    header: {
      ...defaultHeader,
      projectName: undefined,
    },
  }),
};

/**
 * Untitled chat
 */
export const UntitledChat: Story = {
  args: createDefaultProps({
    chat: {
      ...mockChat,
      title: undefined,
    },
    header: {
      ...defaultHeader,
      title: undefined,
    },
  }),
};

/**
 * Streaming response with tool use
 */
export const StreamingResponse: Story = {
  args: createDefaultProps({
    content: {
      ...defaultContent,
      isProcessing: true,
      isRunning: true,
      displayItems: [
        {
          type: 'text',
          content:
            "I'm analyzing your codebase to understand the current authentication setup. Looking at the existing files, I see you have a basic Express server. I'll add the OAuth configuration that integrates seamlessly with your current architecture.\n\nFirst, let me create the configuration file...",
        },
        {
          type: 'tool',
          tool: {
            name: 'Write',
            input: { path: 'src/auth.ts' },
          },
        },
      ],
      activeProcessId: 'process-1',
    },
    inputArea: {
      ...defaultInputArea,
      isProcessing: true,
    },
  }),
};

/**
 * Mobile viewport
 */
export const Mobile: Story = {
  args: createDefaultProps(),
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

/**
 * Mobile viewport with keyboard visible (input focused)
 */
export const MobileWithKeyboard: Story = {
  args: createDefaultProps({
    inputArea: {
      ...defaultInputArea,
      inputValue: 'Add password reset flow',
    },
  }),
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};
