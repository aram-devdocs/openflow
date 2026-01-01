/**
 * ChatPageComponents Storybook Stories
 *
 * Comprehensive stories demonstrating all chat page components with:
 * - All states (loading, empty, error, not found, with content)
 * - Accessibility features (screen reader, keyboard navigation, focus rings)
 * - Responsive behavior
 * - Real-world usage examples
 */

import { MessageRole } from '@openflow/generated';
import type { Meta, StoryObj } from '@storybook/react';
import { useRef, useState } from 'react';
import {
  ChatContent,
  ChatEmptyState,
  ChatErrorState,
  ChatHeader,
  ChatInputArea,
  ChatLoadingSkeleton,
  type ChatMessageData,
  ChatMessageList,
  ChatNotFound,
  ChatPageLayout,
  // Constants
  DEFAULT_BACK_LABEL,
  DEFAULT_EMPTY_TITLE,
  DEFAULT_ERROR_RETRY_LABEL,
  DEFAULT_ERROR_TITLE,
  DEFAULT_INPUT_PLACEHOLDER,
  DEFAULT_NOT_FOUND_TITLE,
  DEFAULT_SEND_LABEL,
  DEFAULT_STOP_LABEL,
  DEFAULT_TOGGLE_RAW_LABEL_HIDE,
  DEFAULT_TOGGLE_RAW_LABEL_SHOW,
  DEFAULT_UNTITLED_CHAT,
  SR_EMPTY,
  SR_LOADING,
  SR_NOT_FOUND,
  SR_PROCESSING,
  // Utility functions
  buildHeaderAccessibleLabel,
  getToggleButtonLabel,
} from './ChatPageComponents';

const meta: Meta = {
  title: 'Organisms/ChatPageComponents',
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="h-screen bg-[rgb(var(--background))]">
        <Story />
      </div>
    ),
  ],
};

export default meta;

// ============================================================================
// Mock Data
// ============================================================================

const mockMessages: ChatMessageData[] = [
  {
    id: 'msg-1',
    role: MessageRole.User,
    content: 'Can you help me implement a login form with validation?',
    createdAt: '2024-01-15T10:30:00Z',
  },
  {
    id: 'msg-2',
    role: MessageRole.Assistant,
    content:
      "I'll help you implement a login form. Let me start by creating the form component with proper validation.\n\nFirst, we'll need to:\n1. Create the form structure\n2. Add input validation\n3. Handle form submission\n4. Display error messages",
    createdAt: '2024-01-15T10:31:00Z',
  },
  {
    id: 'msg-3',
    role: MessageRole.User,
    content: 'Great! Please also add password strength validation.',
    createdAt: '2024-01-15T10:32:00Z',
  },
  {
    id: 'msg-4',
    role: MessageRole.Assistant,
    content:
      "Absolutely! I'll add password strength validation with the following requirements:\n- Minimum 8 characters\n- At least one uppercase letter\n- At least one lowercase letter\n- At least one number\n- At least one special character",
    createdAt: '2024-01-15T10:33:00Z',
  },
];

const shortMessages: ChatMessageData[] = [
  {
    id: 'msg-1',
    role: MessageRole.User,
    content: 'Hello!',
    createdAt: '2024-01-15T10:30:00Z',
  },
  {
    id: 'msg-2',
    role: MessageRole.Assistant,
    content: 'Hi! How can I help you today?',
    createdAt: '2024-01-15T10:30:30Z',
  },
];

// ============================================================================
// ChatPageLayout Stories
// ============================================================================

export const Layout: StoryObj<typeof ChatPageLayout> = {
  render: () => (
    <ChatPageLayout
      header={
        <div className="h-14 bg-[rgb(var(--card))] border-b border-[rgb(var(--border))] flex items-center px-4">
          Header Component
        </div>
      }
      inputArea={
        <div className="h-20 bg-[rgb(var(--card))] border-t border-[rgb(var(--border))] flex items-center px-4">
          Input Area Component
        </div>
      }
      data-testid="chat-layout"
    >
      <div className="p-4">Chat content goes here</div>
    </ChatPageLayout>
  ),
};

export const LayoutWithContent: StoryObj<typeof ChatPageLayout> = {
  render: () => (
    <ChatPageLayout
      header={
        <ChatHeader
          title="Feature Implementation"
          projectName="OpenFlow"
          showRawOutput={false}
          onToggleRawOutput={() => {}}
          onBack={() => {}}
        />
      }
      inputArea={
        <ChatInputArea
          inputValue=""
          isProcessing={false}
          onInputChange={() => {}}
          onKeyDown={() => {}}
          onSend={() => {}}
          onStop={() => {}}
        />
      }
    >
      <ChatMessageList
        messages={mockMessages}
        displayItems={[]}
        activeProcessId={null}
        isRunning={false}
        showRawOutput={false}
        rawOutput={[]}
      />
    </ChatPageLayout>
  ),
};

// ============================================================================
// ChatLoadingSkeleton Stories
// ============================================================================

export const Loading: StoryObj<typeof ChatLoadingSkeleton> = {
  render: () => <ChatLoadingSkeleton data-testid="loading-skeleton" />,
};

export const LoadingWithCustomClass: StoryObj<typeof ChatLoadingSkeleton> = {
  render: () => <ChatLoadingSkeleton className="bg-slate-50 dark:bg-slate-900" />,
};

// ============================================================================
// ChatNotFound Stories
// ============================================================================

export const NotFound: StoryObj<typeof ChatNotFound> = {
  render: () => <ChatNotFound onBack={() => console.log('Back clicked')} data-testid="not-found" />,
};

export const NotFoundCustomLabels: StoryObj<typeof ChatNotFound> = {
  render: () => (
    <ChatNotFound
      onBack={() => {}}
      title="Conversation Unavailable"
      description="This conversation may have been archived or deleted."
      backLabel="Return to Home"
    />
  ),
};

// ============================================================================
// ChatErrorState Stories
// ============================================================================

export const ErrorState: StoryObj<typeof ChatErrorState> = {
  render: () => (
    <ChatErrorState
      message="Unable to connect to the server. Please check your internet connection."
      onRetry={() => console.log('Retry clicked')}
      data-testid="error-state"
    />
  ),
};

export const ErrorStateNoRetry: StoryObj<typeof ChatErrorState> = {
  render: () => (
    <ChatErrorState title="Access Denied" message="You don't have permission to view this chat." />
  ),
};

export const ErrorStateCustomLabels: StoryObj<typeof ChatErrorState> = {
  render: () => (
    <ChatErrorState
      title="Connection Lost"
      message="The connection was interrupted."
      retryLabel="Try Again"
      onRetry={() => {}}
    />
  ),
};

// ============================================================================
// ChatHeader Stories
// ============================================================================

export const Header: StoryObj<typeof ChatHeader> = {
  render: () => (
    <ChatHeader
      title="Authentication Implementation"
      projectName="OpenFlow"
      showRawOutput={false}
      onToggleRawOutput={() => console.log('Toggle raw')}
      onBack={() => console.log('Back')}
      data-testid="chat-header"
    />
  ),
};

export const HeaderRawMode: StoryObj<typeof ChatHeader> = {
  render: () => (
    <ChatHeader
      title="Authentication Implementation"
      projectName="OpenFlow"
      showRawOutput={true}
      onToggleRawOutput={() => {}}
      onBack={() => {}}
    />
  ),
};

export const HeaderUntitled: StoryObj<typeof ChatHeader> = {
  render: () => <ChatHeader showRawOutput={false} onToggleRawOutput={() => {}} onBack={() => {}} />,
};

export const HeaderNoProject: StoryObj<typeof ChatHeader> = {
  render: () => (
    <ChatHeader
      title="Quick Question"
      showRawOutput={false}
      onToggleRawOutput={() => {}}
      onBack={() => {}}
    />
  ),
};

export const HeaderLongTitle: StoryObj<typeof ChatHeader> = {
  render: () => (
    <ChatHeader
      title="This is a very long chat title that should be truncated when it exceeds the available space"
      projectName="My Very Long Project Name That Should Also Be Truncated"
      showRawOutput={false}
      onToggleRawOutput={() => {}}
      onBack={() => {}}
    />
  ),
};

export const HeaderInteractive: StoryObj<typeof ChatHeader> = {
  render: function Interactive() {
    const [showRaw, setShowRaw] = useState(false);
    return (
      <ChatHeader
        title="Interactive Demo"
        projectName="OpenFlow"
        showRawOutput={showRaw}
        onToggleRawOutput={() => setShowRaw(!showRaw)}
        onBack={() => alert('Back clicked!')}
      />
    );
  },
};

// ============================================================================
// ChatEmptyState Stories
// ============================================================================

export const EmptyState: StoryObj<typeof ChatEmptyState> = {
  render: () => <ChatEmptyState data-testid="empty-state" />,
};

export const EmptyStateCustomLabels: StoryObj<typeof ChatEmptyState> = {
  render: () => (
    <ChatEmptyState
      title="No messages yet"
      description="Start by asking a question or describing what you'd like help with."
    />
  ),
};

// ============================================================================
// ChatMessageList Stories
// ============================================================================

export const MessageList: StoryObj<typeof ChatMessageList> = {
  render: () => (
    <div className="p-4 max-w-4xl mx-auto">
      <ChatMessageList
        messages={mockMessages}
        displayItems={[]}
        activeProcessId={null}
        isRunning={false}
        showRawOutput={false}
        rawOutput={[]}
        data-testid="message-list"
      />
    </div>
  ),
};

export const MessageListShort: StoryObj<typeof ChatMessageList> = {
  render: () => (
    <div className="p-4 max-w-4xl mx-auto">
      <ChatMessageList
        messages={shortMessages}
        displayItems={[]}
        activeProcessId={null}
        isRunning={false}
        showRawOutput={false}
        rawOutput={[]}
      />
    </div>
  ),
};

export const MessageListStreaming: StoryObj<typeof ChatMessageList> = {
  render: () => (
    <div className="p-4 max-w-4xl mx-auto">
      <ChatMessageList
        messages={shortMessages}
        displayItems={[
          { type: 'text', content: 'Let me analyze your code and find the best approach...' },
        ]}
        activeProcessId="proc-1"
        isRunning={true}
        showRawOutput={false}
        rawOutput={[]}
      />
    </div>
  ),
};

export const MessageListWithToolCall: StoryObj<typeof ChatMessageList> = {
  render: () => (
    <div className="p-4 max-w-4xl mx-auto">
      <ChatMessageList
        messages={shortMessages}
        displayItems={[
          { type: 'text', content: 'Let me check the file...' },
          { type: 'tool', tool: { name: 'Read', input: { file: 'src/components/Login.tsx' } } },
        ]}
        activeProcessId="proc-1"
        isRunning={true}
        showRawOutput={false}
        rawOutput={[]}
      />
    </div>
  ),
};

export const MessageListWithRawOutput: StoryObj<typeof ChatMessageList> = {
  render: () => (
    <div className="p-4 max-w-4xl mx-auto">
      <ChatMessageList
        messages={shortMessages}
        displayItems={[{ type: 'text', content: 'Processing...' }]}
        activeProcessId="proc-1"
        isRunning={true}
        showRawOutput={true}
        rawOutput={[
          '$ claude --json',
          '{"type":"system","message":"Starting..."}',
          '{"type":"assistant","content":"Processing your request"}',
        ]}
      />
    </div>
  ),
};

// ============================================================================
// ChatInputArea Stories
// ============================================================================

export const InputArea: StoryObj<typeof ChatInputArea> = {
  render: () => (
    <ChatInputArea
      inputValue=""
      isProcessing={false}
      onInputChange={(value) => console.log('Input:', value)}
      onKeyDown={() => {}}
      onSend={() => console.log('Send')}
      onStop={() => console.log('Stop')}
      data-testid="input-area"
    />
  ),
};

export const InputAreaWithText: StoryObj<typeof ChatInputArea> = {
  render: () => (
    <ChatInputArea
      inputValue="Help me with authentication"
      isProcessing={false}
      onInputChange={() => {}}
      onKeyDown={() => {}}
      onSend={() => {}}
      onStop={() => {}}
    />
  ),
};

export const InputAreaProcessing: StoryObj<typeof ChatInputArea> = {
  render: () => (
    <ChatInputArea
      inputValue=""
      isProcessing={true}
      onInputChange={() => {}}
      onKeyDown={() => {}}
      onSend={() => {}}
      onStop={() => console.log('Stop clicked')}
    />
  ),
};

export const InputAreaInteractive: StoryObj<typeof ChatInputArea> = {
  render: function Interactive() {
    const [value, setValue] = useState('');
    const [processing, setProcessing] = useState(false);

    const handleSend = () => {
      if (!value.trim()) return;
      setProcessing(true);
      setTimeout(() => setProcessing(false), 2000);
      setValue('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    };

    return (
      <ChatInputArea
        inputValue={value}
        isProcessing={processing}
        onInputChange={setValue}
        onKeyDown={handleKeyDown}
        onSend={handleSend}
        onStop={() => setProcessing(false)}
      />
    );
  },
};

export const InputAreaWithRef: StoryObj<typeof ChatInputArea> = {
  render: function WithRef() {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    return (
      <div>
        <button
          onClick={() => textareaRef.current?.focus()}
          className="mb-4 px-4 py-2 bg-blue-500 text-white rounded"
        >
          Focus Input
        </button>
        <ChatInputArea
          inputValue=""
          isProcessing={false}
          textareaRef={textareaRef}
          onInputChange={() => {}}
          onKeyDown={() => {}}
          onSend={() => {}}
          onStop={() => {}}
        />
      </div>
    );
  },
};

export const InputAreaCustomLabels: StoryObj<typeof ChatInputArea> = {
  render: () => (
    <ChatInputArea
      inputValue=""
      isProcessing={false}
      onInputChange={() => {}}
      onKeyDown={() => {}}
      onSend={() => {}}
      onStop={() => {}}
      placeholder="Ask Claude anything..."
      sendLabel="Submit"
      stopLabel="Cancel"
    />
  ),
};

// ============================================================================
// ChatContent Stories
// ============================================================================

export const ContentWithMessages: StoryObj<typeof ChatContent> = {
  render: () => (
    <div className="p-4 max-w-4xl mx-auto">
      <ChatContent
        hasContent={true}
        isProcessing={false}
        messages={mockMessages}
        displayItems={[]}
        activeProcessId={null}
        isRunning={false}
        showRawOutput={false}
        rawOutput={[]}
        data-testid="chat-content"
      />
    </div>
  ),
};

export const ContentEmpty: StoryObj<typeof ChatContent> = {
  render: () => (
    <div className="p-4 max-w-4xl mx-auto">
      <ChatContent
        hasContent={false}
        isProcessing={false}
        messages={[]}
        displayItems={[]}
        activeProcessId={null}
        isRunning={false}
        showRawOutput={false}
        rawOutput={[]}
      />
    </div>
  ),
};

export const ContentProcessing: StoryObj<typeof ChatContent> = {
  render: () => (
    <div className="p-4 max-w-4xl mx-auto">
      <ChatContent
        hasContent={true}
        isProcessing={true}
        messages={shortMessages}
        displayItems={[{ type: 'text', content: 'Thinking...' }]}
        activeProcessId="proc-1"
        isRunning={true}
        showRawOutput={false}
        rawOutput={[]}
      />
    </div>
  ),
};

// ============================================================================
// Complete Page Stories
// ============================================================================

export const CompleteChatPage: StoryObj = {
  render: function CompletePage() {
    const [value, setValue] = useState('');
    const [processing, setProcessing] = useState(false);
    const [showRaw, setShowRaw] = useState(false);

    return (
      <ChatPageLayout
        header={
          <ChatHeader
            title="Authentication Implementation"
            projectName="OpenFlow"
            showRawOutput={showRaw}
            onToggleRawOutput={() => setShowRaw(!showRaw)}
            onBack={() => {}}
          />
        }
        inputArea={
          <ChatInputArea
            inputValue={value}
            isProcessing={processing}
            onInputChange={setValue}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (value.trim()) {
                  setProcessing(true);
                  setTimeout(() => setProcessing(false), 2000);
                  setValue('');
                }
              }
            }}
            onSend={() => {
              if (value.trim()) {
                setProcessing(true);
                setTimeout(() => setProcessing(false), 2000);
                setValue('');
              }
            }}
            onStop={() => setProcessing(false)}
          />
        }
      >
        <ChatContent
          hasContent={true}
          isProcessing={processing}
          messages={mockMessages}
          displayItems={processing ? [{ type: 'text', content: 'Thinking...' }] : []}
          activeProcessId={processing ? 'proc-1' : null}
          isRunning={processing}
          showRawOutput={showRaw}
          rawOutput={showRaw ? ['{"status": "processing"}'] : []}
        />
      </ChatPageLayout>
    );
  },
};

export const CompleteChatPageEmpty: StoryObj = {
  render: () => (
    <ChatPageLayout
      header={
        <ChatHeader
          title="New Chat"
          projectName="My Project"
          showRawOutput={false}
          onToggleRawOutput={() => {}}
          onBack={() => {}}
        />
      }
      inputArea={
        <ChatInputArea
          inputValue=""
          isProcessing={false}
          onInputChange={() => {}}
          onKeyDown={() => {}}
          onSend={() => {}}
          onStop={() => {}}
        />
      }
    >
      <ChatContent
        hasContent={false}
        isProcessing={false}
        messages={[]}
        displayItems={[]}
        activeProcessId={null}
        isRunning={false}
        showRawOutput={false}
        rawOutput={[]}
      />
    </ChatPageLayout>
  ),
};

// ============================================================================
// Accessibility Stories
// ============================================================================

export const AccessibilityKeyboardNavigation: StoryObj = {
  render: () => (
    <div className="p-4 space-y-4">
      <p className="text-sm text-muted-foreground">
        Tab through the header buttons to verify focus rings are visible.
      </p>
      <ChatHeader
        title="Keyboard Navigation Demo"
        projectName="Test Project"
        showRawOutput={false}
        onToggleRawOutput={() => {}}
        onBack={() => {}}
      />
      <ChatInputArea
        inputValue=""
        isProcessing={false}
        onInputChange={() => {}}
        onKeyDown={() => {}}
        onSend={() => {}}
        onStop={() => {}}
      />
    </div>
  ),
};

export const AccessibilityScreenReader: StoryObj = {
  render: () => (
    <div className="space-y-8 p-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Loading State (role="status", aria-busy)</h3>
        <div className="h-48 overflow-hidden">
          <ChatLoadingSkeleton />
        </div>
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-2">Not Found State (role="status")</h3>
        <ChatNotFound onBack={() => {}} />
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-2">
          Error State (role="alert", aria-live="assertive")
        </h3>
        <ChatErrorState message="Connection failed" onRetry={() => {}} />
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-2">Empty State (role="status")</h3>
        <ChatEmptyState />
      </div>
    </div>
  ),
};

export const AccessibilityTouchTargets: StoryObj = {
  render: () => (
    <div className="p-4 space-y-4">
      <p className="text-sm text-muted-foreground">
        All interactive elements have minimum 44×44px touch targets (WCAG 2.5.5).
      </p>
      <ChatHeader
        title="Touch Target Demo"
        showRawOutput={false}
        onToggleRawOutput={() => {}}
        onBack={() => {}}
      />
      <ChatInputArea
        inputValue=""
        isProcessing={false}
        onInputChange={() => {}}
        onKeyDown={() => {}}
        onSend={() => {}}
        onStop={() => {}}
      />
      <ChatInputArea
        inputValue="With text"
        isProcessing={false}
        onInputChange={() => {}}
        onKeyDown={() => {}}
        onSend={() => {}}
        onStop={() => {}}
      />
      <ChatInputArea
        inputValue=""
        isProcessing={true}
        onInputChange={() => {}}
        onKeyDown={() => {}}
        onSend={() => {}}
        onStop={() => {}}
      />
    </div>
  ),
};

export const AccessibilityFocusRings: StoryObj = {
  render: () => (
    <div className="p-4 space-y-4">
      <p className="text-sm text-muted-foreground mb-4">
        Focus rings are visible with ring-offset for contrast on all backgrounds. Use Tab key to
        navigate through elements.
      </p>
      <div className="space-y-4">
        <ChatHeader
          title="Focus Ring Demo"
          projectName="Project"
          showRawOutput={false}
          onToggleRawOutput={() => {}}
          onBack={() => {}}
        />
        <ChatNotFound onBack={() => {}} />
        <ChatErrorState message="Error occurred" onRetry={() => {}} />
        <ChatInputArea
          inputValue=""
          isProcessing={false}
          onInputChange={() => {}}
          onKeyDown={() => {}}
          onSend={() => {}}
          onStop={() => {}}
        />
      </div>
    </div>
  ),
};

// ============================================================================
// Responsive Stories
// ============================================================================

export const ResponsiveMobile: StoryObj = {
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
  render: () => (
    <ChatPageLayout
      header={
        <ChatHeader
          title="Mobile View"
          projectName="Project"
          showRawOutput={false}
          onToggleRawOutput={() => {}}
          onBack={() => {}}
        />
      }
      inputArea={
        <ChatInputArea
          inputValue=""
          isProcessing={false}
          onInputChange={() => {}}
          onKeyDown={() => {}}
          onSend={() => {}}
          onStop={() => {}}
        />
      }
    >
      <ChatMessageList
        messages={shortMessages}
        displayItems={[]}
        activeProcessId={null}
        isRunning={false}
        showRawOutput={false}
        rawOutput={[]}
      />
    </ChatPageLayout>
  ),
};

export const ResponsiveTablet: StoryObj = {
  parameters: {
    viewport: { defaultViewport: 'tablet' },
  },
  render: () => (
    <ChatPageLayout
      header={
        <ChatHeader
          title="Tablet View"
          projectName="OpenFlow Project"
          showRawOutput={false}
          onToggleRawOutput={() => {}}
          onBack={() => {}}
        />
      }
      inputArea={
        <ChatInputArea
          inputValue=""
          isProcessing={false}
          onInputChange={() => {}}
          onKeyDown={() => {}}
          onSend={() => {}}
          onStop={() => {}}
        />
      }
    >
      <ChatMessageList
        messages={mockMessages}
        displayItems={[]}
        activeProcessId={null}
        isRunning={false}
        showRawOutput={false}
        rawOutput={[]}
      />
    </ChatPageLayout>
  ),
};

// ============================================================================
// Data Attribute Stories
// ============================================================================

export const DataAttributes: StoryObj = {
  render: () => (
    <div className="p-4 space-y-4">
      <p className="text-sm text-muted-foreground mb-4">
        All components support data-testid for testing. Inspect elements to see data attributes.
      </p>
      <ChatHeader
        title="Test Header"
        showRawOutput={false}
        onToggleRawOutput={() => {}}
        onBack={() => {}}
        data-testid="test-header"
      />
      <ChatInputArea
        inputValue="Hello"
        isProcessing={true}
        onInputChange={() => {}}
        onKeyDown={() => {}}
        onSend={() => {}}
        onStop={() => {}}
        data-testid="test-input"
      />
      <div className="p-2">
        <ChatMessageList
          messages={shortMessages}
          displayItems={[]}
          activeProcessId={null}
          isRunning={false}
          showRawOutput={false}
          rawOutput={[]}
          data-testid="test-messages"
        />
      </div>
    </div>
  ),
};

// ============================================================================
// Constants Reference Stories
// ============================================================================

export const ConstantsReference: StoryObj = {
  render: () => (
    <div className="p-4 space-y-6">
      <h2 className="text-xl font-bold">Exported Constants</h2>
      <div className="grid gap-4">
        <div>
          <h3 className="font-semibold">Default Labels</h3>
          <ul className="text-sm text-muted-foreground list-disc list-inside">
            <li>DEFAULT_BACK_LABEL: "{DEFAULT_BACK_LABEL}"</li>
            <li>DEFAULT_UNTITLED_CHAT: "{DEFAULT_UNTITLED_CHAT}"</li>
            <li>DEFAULT_TOGGLE_RAW_LABEL_SHOW: "{DEFAULT_TOGGLE_RAW_LABEL_SHOW}"</li>
            <li>DEFAULT_TOGGLE_RAW_LABEL_HIDE: "{DEFAULT_TOGGLE_RAW_LABEL_HIDE}"</li>
            <li>DEFAULT_EMPTY_TITLE: "{DEFAULT_EMPTY_TITLE}"</li>
            <li>DEFAULT_NOT_FOUND_TITLE: "{DEFAULT_NOT_FOUND_TITLE}"</li>
            <li>DEFAULT_ERROR_TITLE: "{DEFAULT_ERROR_TITLE}"</li>
            <li>DEFAULT_ERROR_RETRY_LABEL: "{DEFAULT_ERROR_RETRY_LABEL}"</li>
            <li>DEFAULT_SEND_LABEL: "{DEFAULT_SEND_LABEL}"</li>
            <li>DEFAULT_STOP_LABEL: "{DEFAULT_STOP_LABEL}"</li>
            <li>DEFAULT_INPUT_PLACEHOLDER: "{DEFAULT_INPUT_PLACEHOLDER}"</li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold">Screen Reader Announcements</h3>
          <ul className="text-sm text-muted-foreground list-disc list-inside">
            <li>SR_LOADING: "{SR_LOADING}"</li>
            <li>SR_NOT_FOUND: "{SR_NOT_FOUND}"</li>
            <li>SR_EMPTY: "{SR_EMPTY}"</li>
            <li>SR_PROCESSING: "{SR_PROCESSING}"</li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold">Utility Functions</h3>
          <ul className="text-sm text-muted-foreground list-disc list-inside">
            <li>
              buildHeaderAccessibleLabel("Title", "Project"): "
              {buildHeaderAccessibleLabel('Title', 'Project')}"
            </li>
            <li>getToggleButtonLabel(false): "{getToggleButtonLabel(false)}"</li>
            <li>getToggleButtonLabel(true): "{getToggleButtonLabel(true)}"</li>
          </ul>
        </div>
      </div>
    </div>
  ),
};

// ============================================================================
// Ref Forwarding Stories
// ============================================================================

export const RefForwarding: StoryObj = {
  render: function RefForwardingDemo() {
    const layoutRef = useRef<HTMLDivElement>(null);
    const headerRef = useRef<HTMLElement>(null);
    const inputRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    const showRefs = () => {
      console.log('Layout ref:', layoutRef.current);
      console.log('Header ref:', headerRef.current);
      console.log('Input ref:', inputRef.current);
      console.log('Content ref:', contentRef.current);
      alert('Check console for ref values');
    };

    return (
      <div className="h-screen flex flex-col">
        <button onClick={showRefs} className="p-2 bg-blue-500 text-white">
          Log Refs to Console
        </button>
        <ChatPageLayout
          ref={layoutRef}
          header={
            <ChatHeader
              ref={headerRef}
              title="Ref Demo"
              showRawOutput={false}
              onToggleRawOutput={() => {}}
              onBack={() => {}}
            />
          }
          inputArea={
            <ChatInputArea
              ref={inputRef}
              inputValue=""
              isProcessing={false}
              onInputChange={() => {}}
              onKeyDown={() => {}}
              onSend={() => {}}
              onStop={() => {}}
            />
          }
        >
          <ChatContent
            ref={contentRef}
            hasContent={true}
            isProcessing={false}
            messages={shortMessages}
            displayItems={[]}
            activeProcessId={null}
            isRunning={false}
            showRawOutput={false}
            rawOutput={[]}
          />
        </ChatPageLayout>
      </div>
    );
  },
};
