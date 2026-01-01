/**
 * Storybook stories for ChatPage
 *
 * Demonstrates the complete standalone chat page in various states:
 * - Loading state with skeleton
 * - Error state with retry
 * - Not found state
 * - Ready state with messages
 * - Processing state
 * - Raw output view
 * - Permission dialog
 * - Mobile viewport
 * - Accessibility demos (screen reader, keyboard navigation, focus management)
 *
 * @module pages/ChatPage.stories
 */

import type { Chat, Project } from '@openflow/generated';
import { ChatRole, MessageRole } from '@openflow/generated';
import type { Meta, StoryObj } from '@storybook/react';
import type { DisplayItem } from '../organisms/ChatBubbles';
import type { ChatMessageData } from '../organisms/ChatPageComponents';
import type { PermissionRequest } from '../organisms/PermissionDialog';
import {
  CHAT_PAGE_BASE_CLASSES,
  CHAT_PAGE_ERROR_CLASSES,
  CHAT_PAGE_NOT_FOUND_CLASSES,
  CHAT_PAGE_SKELETON_CLASSES,
  CHAT_PAGE_SKELETON_CONTENT_CLASSES,
  CHAT_PAGE_SKELETON_HEADER_CLASSES,
  CHAT_PAGE_SKELETON_INPUT_CLASSES,
  CHAT_PAGE_SKELETON_MESSAGE_CLASSES,
  ChatPage,
  ChatPageError,
  ChatPageNotFound,
  type ChatPageProps,
  ChatPageSkeleton,
  DEFAULT_BACK_LABEL,
  DEFAULT_ERROR_DESCRIPTION,
  DEFAULT_ERROR_TITLE,
  DEFAULT_NOT_FOUND_DESCRIPTION,
  DEFAULT_NOT_FOUND_TITLE,
  DEFAULT_PAGE_LABEL,
  DEFAULT_PAGE_SIZE,
  DEFAULT_RETRY_LABEL,
  // Constants
  DEFAULT_SKELETON_MESSAGE_COUNT,
  PAGE_SIZE_GAP,
  PAGE_SIZE_PADDING,
  SKELETON_AVATAR_DIMENSIONS,
  SR_EMPTY,
  SR_ERROR_PREFIX,
  SR_LOADING,
  SR_NOT_FOUND,
  SR_PROCESSING,
  SR_READY_PREFIX,
  buildLoadedAnnouncement,
} from './ChatPage';

const meta: Meta<typeof ChatPage> = {
  title: 'Pages/ChatPage',
  component: ChatPage,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
ChatPage is a stateless page component for standalone chat functionality.

## Accessibility Features
- **Screen Reader Announcements**: Loading, error, not-found, and ready states are announced
- **Proper Heading Hierarchy**: h1 for page title via ChatHeader
- **Focus Management**: forwardRef support for programmatic focus
- **Touch Targets**: ≥44px for all interactive elements (WCAG 2.5.5)
- **ARIA Attributes**: Proper roles, labels, and live regions

## State Management
- \`loading\`: Shows ChatPageSkeleton with alternating message bubbles
- \`error\`: Shows ChatPageError with retry button
- \`not-found\`: Shows ChatPageNotFound with back button
- \`ready\`: Shows full chat interface with messages and input

## Constants & Utilities
The component exports numerous constants and utility functions for testing and customization.
        `,
      },
    },
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
// Basic State Stories
// ============================================================================

/**
 * Default chat page with messages
 */
export const Default: Story = {
  args: createDefaultProps(),
};

/**
 * Loading state - shows skeleton with alternating message bubbles
 */
export const Loading: Story = {
  args: {
    state: 'loading',
  },
};

/**
 * Error state with retry button
 */
export const ErrorState: Story = {
  args: {
    state: 'error',
    error: new globalThis.Error('Failed to fetch chat data from server'),
    onRetry: noop,
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

// ============================================================================
// Processing & Streaming Stories
// ============================================================================

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

// ============================================================================
// Input & Content Variations
// ============================================================================

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

// ============================================================================
// Permission Dialog Stories
// ============================================================================

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

// ============================================================================
// Content Variations
// ============================================================================

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

// ============================================================================
// Skeleton Component Stories
// ============================================================================

/**
 * Skeleton component standalone - default message count
 */
export const SkeletonDefault: Story = {
  render: () => (
    <div className="h-screen">
      <ChatPageSkeleton />
    </div>
  ),
};

/**
 * Skeleton with fewer messages
 */
export const SkeletonFewMessages: Story = {
  render: () => (
    <div className="h-screen">
      <ChatPageSkeleton messageCount={2} />
    </div>
  ),
};

/**
 * Skeleton with many messages
 */
export const SkeletonManyMessages: Story = {
  render: () => (
    <div className="h-screen">
      <ChatPageSkeleton messageCount={8} />
    </div>
  ),
};

/**
 * Skeleton size variants
 */
export const SkeletonSizeVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      <div>
        <h3 className="text-sm font-medium mb-2">Small</h3>
        <div className="h-[400px] border rounded">
          <ChatPageSkeleton size="sm" messageCount={2} />
        </div>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Medium (default)</h3>
        <div className="h-[400px] border rounded">
          <ChatPageSkeleton size="md" messageCount={2} />
        </div>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Large</h3>
        <div className="h-[400px] border rounded">
          <ChatPageSkeleton size="lg" messageCount={2} />
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};

// ============================================================================
// Error Component Stories
// ============================================================================

/**
 * Error component standalone
 */
export const ErrorComponentStandalone: Story = {
  render: () => (
    <div className="h-screen flex items-center justify-center">
      <ChatPageError error={new Error('Network request failed')} onRetry={noop} />
    </div>
  ),
};

/**
 * Error with long message
 */
export const ErrorLongMessage: Story = {
  render: () => (
    <div className="h-screen flex items-center justify-center">
      <ChatPageError
        error={
          new Error(
            'The server encountered an unexpected condition that prevented it from fulfilling the request. Please try again later or contact support if the problem persists.'
          )
        }
        onRetry={noop}
      />
    </div>
  ),
};

// ============================================================================
// Not Found Component Stories
// ============================================================================

/**
 * Not found component standalone
 */
export const NotFoundComponentStandalone: Story = {
  render: () => (
    <div className="h-screen">
      <ChatPageNotFound onBack={noop} />
    </div>
  ),
};

// ============================================================================
// Responsive Stories
// ============================================================================

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

/**
 * Mobile loading state
 */
export const MobileLoading: Story = {
  args: {
    state: 'loading',
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

/**
 * Mobile error state
 */
export const MobileError: Story = {
  args: {
    state: 'error',
    error: new Error('Connection failed'),
    onRetry: noop,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

/**
 * Tablet viewport
 */
export const Tablet: Story = {
  args: createDefaultProps(),
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
};

/**
 * Responsive sizing demo
 */
export const ResponsiveSizing: Story = {
  args: createDefaultProps({
    size: { base: 'sm', md: 'md', lg: 'lg' },
  }),
};

// ============================================================================
// Accessibility Stories
// ============================================================================

/**
 * Screen reader accessibility demo - shows various announcements
 */
export const ScreenReaderAccessibility: Story = {
  render: () => (
    <div className="p-6 space-y-8">
      <div>
        <h2 className="text-lg font-semibold mb-4">Screen Reader Announcements</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Each page state announces relevant information to screen readers:
        </p>
        <div className="space-y-4">
          <div className="p-4 border rounded">
            <h3 className="font-medium">Loading State</h3>
            <p className="text-sm text-muted-foreground">Announces: "{SR_LOADING}"</p>
          </div>
          <div className="p-4 border rounded">
            <h3 className="font-medium">Error State</h3>
            <p className="text-sm text-muted-foreground">
              Announces: "{SR_ERROR_PREFIX} [error message]"
            </p>
          </div>
          <div className="p-4 border rounded">
            <h3 className="font-medium">Not Found State</h3>
            <p className="text-sm text-muted-foreground">Announces: "{SR_NOT_FOUND}"</p>
          </div>
          <div className="p-4 border rounded">
            <h3 className="font-medium">Empty Chat</h3>
            <p className="text-sm text-muted-foreground">
              Announces: "{SR_READY_PREFIX} {SR_EMPTY}"
            </p>
          </div>
          <div className="p-4 border rounded">
            <h3 className="font-medium">Ready with Messages</h3>
            <p className="text-sm text-muted-foreground">
              Announces: "{buildLoadedAnnouncement('Auth Flow', 3, false)}"
            </p>
          </div>
          <div className="p-4 border rounded">
            <h3 className="font-medium">Processing</h3>
            <p className="text-sm text-muted-foreground">
              Announces: "{buildLoadedAnnouncement('Auth Flow', 3, true)}"
            </p>
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};

/**
 * Keyboard navigation demo
 */
export const KeyboardNavigation: Story = {
  args: createDefaultProps(),
  parameters: {
    docs: {
      description: {
        story: `
**Keyboard Navigation:**
- \`Tab\`: Move focus between interactive elements
- \`Shift+Tab\`: Move focus backwards
- \`Enter\`/\`Space\`: Activate buttons
- \`Escape\`: Close dialogs

**Focus Order:**
1. Back button
2. Raw output toggle
3. Message content (if scrollable)
4. Input textarea
5. Send/Stop button
        `,
      },
    },
  },
};

/**
 * Focus ring visibility demo
 */
export const FocusRingVisibility: Story = {
  render: () => (
    <div className="p-6 space-y-8">
      <div>
        <h2 className="text-lg font-semibold mb-4">Focus Ring Visibility</h2>
        <p className="text-sm text-muted-foreground mb-4">
          All interactive elements show visible focus rings when focused via keyboard. Focus rings
          use ring-offset for visibility on all backgrounds.
        </p>
        <div className="p-4 border rounded bg-background">
          <p className="text-sm mb-4">Tab through this section to see focus rings:</p>
          <div className="flex gap-4">
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded min-h-[44px] min-w-[44px] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              Button 1
            </button>
            <button className="px-4 py-2 bg-secondary text-secondary-foreground rounded min-h-[44px] min-w-[44px] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              Button 2
            </button>
            <button className="px-4 py-2 bg-destructive text-destructive-foreground rounded min-h-[44px] min-w-[44px] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              Button 3
            </button>
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};

/**
 * Touch target accessibility demo
 */
export const TouchTargetAccessibility: Story = {
  render: () => (
    <div className="p-6 space-y-8">
      <div>
        <h2 className="text-lg font-semibold mb-4">Touch Target Sizes (WCAG 2.5.5)</h2>
        <p className="text-sm text-muted-foreground mb-4">
          All interactive elements have minimum touch targets of 44×44 pixels.
        </p>
        <div className="space-y-4">
          <div className="p-4 border rounded">
            <h3 className="font-medium mb-2">Error State Button</h3>
            <ChatPageError error={new Error('Test error')} onRetry={noop} />
            <p className="text-sm text-muted-foreground mt-2">
              Retry button has min-h-[44px] min-w-[44px]
            </p>
          </div>
          <div className="p-4 border rounded">
            <h3 className="font-medium mb-2">Not Found State Button</h3>
            <div className="h-[300px]">
              <ChatPageNotFound onBack={noop} />
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Back button has min-h-[44px] min-w-[44px]
            </p>
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};

// ============================================================================
// Ref Forwarding & Data Attributes Stories
// ============================================================================

/**
 * Ref forwarding demo
 */
export const RefForwarding: Story = {
  render: () => {
    const handleFocus = () => {
      const element = document.querySelector('[data-testid="chat-page"]');
      if (element instanceof HTMLElement) {
        element.style.outline = '2px solid blue';
        setTimeout(() => {
          element.style.outline = '';
        }, 1000);
      }
    };

    return (
      <div className="space-y-4">
        <button
          onClick={handleFocus}
          className="px-4 py-2 bg-primary text-primary-foreground rounded"
        >
          Highlight ChatPage (simulates ref.focus)
        </button>
        <div className="h-[500px] border rounded">
          <ChatPage {...createDefaultProps()} />
        </div>
      </div>
    );
  },
  parameters: {
    layout: 'padded',
  },
};

/**
 * Data attributes demo
 */
export const DataAttributes: Story = {
  render: () => (
    <div className="p-6 space-y-8">
      <div>
        <h2 className="text-lg font-semibold mb-4">Data Attributes for Testing</h2>
        <p className="text-sm text-muted-foreground mb-4">
          ChatPage exposes data attributes for automated testing:
        </p>
        <div className="space-y-2 font-mono text-sm">
          <div className="p-2 bg-muted rounded">
            <code>data-testid="chat-page"</code> - Main container
          </div>
          <div className="p-2 bg-muted rounded">
            <code>data-state="loading|error|not-found|ready|empty"</code> - Current state
          </div>
          <div className="p-2 bg-muted rounded">
            <code>data-processing="true"</code> - Present when processing
          </div>
          <div className="p-2 bg-muted rounded">
            <code>data-message-count="N"</code> - Number of messages
          </div>
          <div className="p-2 bg-muted rounded">
            <code>data-testid="chat-page-skeleton"</code> - Skeleton component
          </div>
          <div className="p-2 bg-muted rounded">
            <code>data-testid="chat-page-error"</code> - Error component
          </div>
          <div className="p-2 bg-muted rounded">
            <code>data-testid="chat-page-not-found"</code> - Not found component
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};

// ============================================================================
// Constants Reference
// ============================================================================

/**
 * Constants reference for developers
 */
export const ConstantsReference: Story = {
  render: () => (
    <div className="p-6 space-y-8 max-w-4xl">
      <div>
        <h2 className="text-lg font-semibold mb-4">Exported Constants</h2>

        <h3 className="font-medium mt-6 mb-2">Default Values</h3>
        <div className="font-mono text-sm space-y-1 bg-muted p-4 rounded">
          <div>DEFAULT_SKELETON_MESSAGE_COUNT = {DEFAULT_SKELETON_MESSAGE_COUNT}</div>
          <div>DEFAULT_PAGE_SIZE = "{DEFAULT_PAGE_SIZE}"</div>
          <div>DEFAULT_PAGE_LABEL = "{DEFAULT_PAGE_LABEL}"</div>
        </div>

        <h3 className="font-medium mt-6 mb-2">Error State Labels</h3>
        <div className="font-mono text-sm space-y-1 bg-muted p-4 rounded">
          <div>DEFAULT_ERROR_TITLE = "{DEFAULT_ERROR_TITLE}"</div>
          <div>DEFAULT_ERROR_DESCRIPTION = "{DEFAULT_ERROR_DESCRIPTION}"</div>
          <div>DEFAULT_RETRY_LABEL = "{DEFAULT_RETRY_LABEL}"</div>
        </div>

        <h3 className="font-medium mt-6 mb-2">Not Found State Labels</h3>
        <div className="font-mono text-sm space-y-1 bg-muted p-4 rounded">
          <div>DEFAULT_NOT_FOUND_TITLE = "{DEFAULT_NOT_FOUND_TITLE}"</div>
          <div>DEFAULT_NOT_FOUND_DESCRIPTION = "{DEFAULT_NOT_FOUND_DESCRIPTION}"</div>
          <div>DEFAULT_BACK_LABEL = "{DEFAULT_BACK_LABEL}"</div>
        </div>

        <h3 className="font-medium mt-6 mb-2">Screen Reader Announcements</h3>
        <div className="font-mono text-sm space-y-1 bg-muted p-4 rounded">
          <div>SR_LOADING = "{SR_LOADING}"</div>
          <div>SR_NOT_FOUND = "{SR_NOT_FOUND}"</div>
          <div>SR_ERROR_PREFIX = "{SR_ERROR_PREFIX}"</div>
          <div>SR_EMPTY = "{SR_EMPTY}"</div>
          <div>SR_READY_PREFIX = "{SR_READY_PREFIX}"</div>
          <div>SR_PROCESSING = "{SR_PROCESSING}"</div>
        </div>

        <h3 className="font-medium mt-6 mb-2">CSS Class Constants</h3>
        <div className="font-mono text-sm space-y-1 bg-muted p-4 rounded overflow-x-auto">
          <div>CHAT_PAGE_BASE_CLASSES = "{CHAT_PAGE_BASE_CLASSES}"</div>
          <div>CHAT_PAGE_ERROR_CLASSES = "{CHAT_PAGE_ERROR_CLASSES}"</div>
          <div>CHAT_PAGE_NOT_FOUND_CLASSES = "{CHAT_PAGE_NOT_FOUND_CLASSES}"</div>
          <div>CHAT_PAGE_SKELETON_CLASSES = "{CHAT_PAGE_SKELETON_CLASSES}"</div>
          <div>CHAT_PAGE_SKELETON_HEADER_CLASSES = "{CHAT_PAGE_SKELETON_HEADER_CLASSES}"</div>
          <div>CHAT_PAGE_SKELETON_CONTENT_CLASSES = "{CHAT_PAGE_SKELETON_CONTENT_CLASSES}"</div>
          <div>CHAT_PAGE_SKELETON_INPUT_CLASSES = "{CHAT_PAGE_SKELETON_INPUT_CLASSES}"</div>
          <div>CHAT_PAGE_SKELETON_MESSAGE_CLASSES = "{CHAT_PAGE_SKELETON_MESSAGE_CLASSES}"</div>
        </div>

        <h3 className="font-medium mt-6 mb-2">Size Mappings</h3>
        <div className="font-mono text-sm space-y-1 bg-muted p-4 rounded">
          <div>PAGE_SIZE_PADDING = {JSON.stringify(PAGE_SIZE_PADDING)}</div>
          <div>PAGE_SIZE_GAP = {JSON.stringify(PAGE_SIZE_GAP)}</div>
          <div>SKELETON_AVATAR_DIMENSIONS = {JSON.stringify(SKELETON_AVATAR_DIMENSIONS)}</div>
        </div>

        <h3 className="font-medium mt-6 mb-2">Utility Functions</h3>
        <div className="font-mono text-sm space-y-1 bg-muted p-4 rounded">
          <div>getBaseSize(size) - Resolves ResponsiveValue to base size</div>
          <div>getResponsiveSizeClasses(size, classMap) - Generates responsive classes</div>
          <div>getSkeletonAvatarDimensions(size) - Gets avatar size in pixels</div>
          <div>buildLoadedAnnouncement(title, count, processing) - Builds SR announcement</div>
          <div>buildPageAccessibleLabel(title, state) - Builds aria-label</div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};
