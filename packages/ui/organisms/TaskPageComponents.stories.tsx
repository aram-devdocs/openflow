import type { Commit, ExecutorProfile, FileDiff, Message, WorkflowStep } from '@openflow/generated';
import { MessageRole, WorkflowStepStatus } from '@openflow/generated';
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import type { ArtifactFile } from './ArtifactsPanel';
import type { ClaudeEvent } from './ClaudeEventRenderer';
import {
  ADD_STEP_DIALOG_TITLE,
  AddStepDialog,
  DEFAULT_BACK_BUTTON_LABEL,
  DEFAULT_ERROR_MESSAGE,
  DEFAULT_ERROR_TITLE,
  DEFAULT_NOT_FOUND_DESCRIPTION,
  // Constants for reference
  DEFAULT_NOT_FOUND_TITLE,
  DEFAULT_RETRY_LABEL,
  OUTPUT_LABEL_COMPLETE,
  OUTPUT_LABEL_RUNNING,
  SR_LOADING_ANNOUNCEMENT,
  TaskArtifactsTab,
  TaskChangesTab,
  TaskCommitsTab,
  TaskMainPanel,
  TaskNotFound,
  TaskOutputPanel,
  TaskPageError,
  TaskPageSkeleton,
  TaskStepsPanel,
} from './TaskPageComponents';

const meta: Meta = {
  title: 'Organisms/TaskPageComponents',
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-background">
        <Story />
      </div>
    ),
  ],
};

export default meta;

// ============================================================================
// Mock Data
// ============================================================================

const mockClaudeEvents: ClaudeEvent[] = [
  {
    type: 'assistant',
    message: {
      content: [
        {
          type: 'text',
          text: "I'll help you implement this feature. Let me start by analyzing the codebase...\n\n",
        },
      ],
    },
  },
  {
    type: 'assistant',
    message: {
      content: [
        {
          type: 'tool_use',
          id: 'tool-1',
          name: 'read_file',
          input: { path: 'src/components/Button.tsx' },
        },
      ],
    },
  },
  {
    type: 'user',
    message: {
      content: [
        {
          type: 'tool_result',
          tool_use_id: 'tool-1',
          content: 'export function Button({ children, onClick }) { ... }',
        },
      ],
    },
  },
  {
    type: 'assistant',
    message: {
      content: [
        {
          type: 'text',
          text: '\n\nI found the Button component. Now let me make the changes...\n',
        },
      ],
    },
  },
];

const mockRawOutput = [
  '> claude: Starting analysis...',
  '> claude: Reading file src/components/Button.tsx',
  '> claude: File contents loaded',
  '> claude: Processing changes...',
];

const mockMessages: Message[] = [
  {
    id: '1',
    chatId: 'chat-1',
    role: MessageRole.User,
    content: 'Add a loading state to the button',
    isStreaming: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    chatId: 'chat-1',
    role: MessageRole.Assistant,
    content: "I'll add a loading state with a spinner to the Button component.",
    isStreaming: false,
    createdAt: new Date().toISOString(),
  },
];

const mockExecutorProfiles: ExecutorProfile[] = [
  {
    id: 'profile-1',
    name: 'Claude Code',
    command: 'claude',
    description: 'Claude AI coding assistant',
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const mockSteps: WorkflowStep[] = [
  {
    index: 0,
    name: 'Analyze Requirements',
    description: 'Understand the task requirements',
    status: WorkflowStepStatus.Completed,
  },
  {
    index: 1,
    name: 'Implement Solution',
    description: 'Write the code implementation',
    status: WorkflowStepStatus.Pending,
  },
  {
    index: 2,
    name: 'Write Tests',
    description: 'Add unit tests',
    status: WorkflowStepStatus.Pending,
  },
];

const mockArtifacts: ArtifactFile[] = [
  {
    name: 'Button.tsx',
    path: 'src/components/Button.tsx',
    size: 1024,
    modifiedAt: new Date().toISOString(),
    isDirectory: false,
  },
  {
    name: 'Button.test.tsx',
    path: 'src/components/Button.test.tsx',
    size: 2048,
    modifiedAt: new Date().toISOString(),
    isDirectory: false,
  },
];

const mockDiffs: FileDiff[] = [
  {
    path: 'src/components/Button.tsx',
    oldPath: 'src/components/Button.tsx',
    additions: 10,
    deletions: 2,
    isBinary: false,
    isNew: false,
    isDeleted: false,
    isRenamed: false,
    hunks: [
      {
        oldStart: 1,
        oldLines: 5,
        newStart: 1,
        newLines: 13,
        content: '@@ -1,5 +1,13 @@',
      },
    ],
  },
];

const mockCommits: Commit[] = [
  {
    hash: 'abc1234',
    shortHash: 'abc1234',
    message: 'Add loading state to Button',
    author: 'Claude',
    authorEmail: 'claude@anthropic.com',
    date: new Date().toISOString(),
    filesChanged: 2,
    additions: 15,
    deletions: 3,
  },
];

// ============================================================================
// TaskNotFound Stories
// ============================================================================

export const NotFound: StoryObj<typeof TaskNotFound> = {
  render: () => (
    <div className="h-96">
      <TaskNotFound onBack={() => console.log('Back')} />
    </div>
  ),
};

export const NotFoundCustomTitle: StoryObj<typeof TaskNotFound> = {
  render: () => (
    <div className="h-96">
      <TaskNotFound
        onBack={() => console.log('Back')}
        title="Task Deleted"
        description="This task has been permanently deleted and cannot be recovered."
      />
    </div>
  ),
};

export const NotFoundSmallSize: StoryObj<typeof TaskNotFound> = {
  render: () => (
    <div className="h-96">
      <TaskNotFound onBack={() => console.log('Back')} size="sm" />
    </div>
  ),
};

export const NotFoundLargeSize: StoryObj<typeof TaskNotFound> = {
  render: () => (
    <div className="h-96">
      <TaskNotFound onBack={() => console.log('Back')} size="lg" />
    </div>
  ),
};

export const NotFoundResponsive: StoryObj<typeof TaskNotFound> = {
  render: () => (
    <div className="h-96">
      <TaskNotFound onBack={() => console.log('Back')} size={{ base: 'sm', md: 'md', lg: 'lg' }} />
    </div>
  ),
};

// ============================================================================
// TaskPageError Stories
// ============================================================================

export const ErrorState: StoryObj<typeof TaskPageError> = {
  render: () => (
    <div className="h-96">
      <TaskPageError onRetry={() => console.log('Retry')} />
    </div>
  ),
};

export const ErrorCustomMessage: StoryObj<typeof TaskPageError> = {
  render: () => (
    <div className="h-96">
      <TaskPageError
        message="Network connection lost. Please check your internet connection."
        onRetry={() => console.log('Retry')}
      />
    </div>
  ),
};

export const ErrorNoRetry: StoryObj<typeof TaskPageError> = {
  render: () => (
    <div className="h-96">
      <TaskPageError message="This error cannot be recovered from." />
    </div>
  ),
};

export const ErrorSmallSize: StoryObj<typeof TaskPageError> = {
  render: () => (
    <div className="h-96">
      <TaskPageError size="sm" onRetry={() => console.log('Retry')} />
    </div>
  ),
};

export const ErrorLargeSize: StoryObj<typeof TaskPageError> = {
  render: () => (
    <div className="h-96">
      <TaskPageError size="lg" onRetry={() => console.log('Retry')} />
    </div>
  ),
};

// ============================================================================
// TaskPageSkeleton Stories
// ============================================================================

export const LoadingSkeleton: StoryObj<typeof TaskPageSkeleton> = {
  render: () => (
    <div className="h-96">
      <TaskPageSkeleton />
    </div>
  ),
};

export const LoadingSkeletonNoSteps: StoryObj<typeof TaskPageSkeleton> = {
  render: () => (
    <div className="h-96">
      <TaskPageSkeleton showStepsPanel={false} />
    </div>
  ),
};

export const LoadingSkeletonNoTabs: StoryObj<typeof TaskPageSkeleton> = {
  render: () => (
    <div className="h-96">
      <TaskPageSkeleton showTabs={false} />
    </div>
  ),
};

export const LoadingSkeletonMinimal: StoryObj<typeof TaskPageSkeleton> = {
  render: () => (
    <div className="h-96">
      <TaskPageSkeleton showStepsPanel={false} showTabs={false} />
    </div>
  ),
};

export const LoadingSkeletonSmall: StoryObj<typeof TaskPageSkeleton> = {
  render: () => (
    <div className="h-96">
      <TaskPageSkeleton size="sm" />
    </div>
  ),
};

export const LoadingSkeletonLarge: StoryObj<typeof TaskPageSkeleton> = {
  render: () => (
    <div className="h-96">
      <TaskPageSkeleton size="lg" />
    </div>
  ),
};

// ============================================================================
// TaskOutputPanel Stories
// ============================================================================

export const OutputPanelStreaming: StoryObj<typeof TaskOutputPanel> = {
  render: () => (
    <div className="h-96">
      <TaskOutputPanel
        claudeEvents={mockClaudeEvents}
        rawOutput={mockRawOutput}
        isRunning={true}
        showRawOutput={false}
        onToggleRawOutput={() => console.log('Toggle raw')}
      />
    </div>
  ),
};

export const OutputPanelRaw: StoryObj<typeof TaskOutputPanel> = {
  render: () => (
    <div className="h-96">
      <TaskOutputPanel
        claudeEvents={mockClaudeEvents}
        rawOutput={mockRawOutput}
        isRunning={false}
        showRawOutput={true}
        onToggleRawOutput={() => console.log('Toggle raw')}
      />
    </div>
  ),
};

export const OutputPanelComplete: StoryObj<typeof TaskOutputPanel> = {
  render: () => (
    <div className="h-96">
      <TaskOutputPanel
        claudeEvents={mockClaudeEvents}
        rawOutput={mockRawOutput}
        isRunning={false}
        showRawOutput={false}
        onToggleRawOutput={() => console.log('Toggle raw')}
      />
    </div>
  ),
};

export const OutputPanelEmpty: StoryObj<typeof TaskOutputPanel> = {
  render: () => (
    <div className="h-96 flex items-center justify-center text-muted-foreground">
      <TaskOutputPanel
        claudeEvents={[]}
        rawOutput={[]}
        isRunning={false}
        showRawOutput={false}
        onToggleRawOutput={() => console.log('Toggle raw')}
      />
      <p>Empty output panel renders nothing</p>
    </div>
  ),
};

export const OutputPanelInteractive: StoryObj<typeof TaskOutputPanel> = {
  render: function Render() {
    const [showRaw, setShowRaw] = useState(false);
    return (
      <div className="h-96">
        <TaskOutputPanel
          claudeEvents={mockClaudeEvents}
          rawOutput={mockRawOutput}
          isRunning={false}
          showRawOutput={showRaw}
          onToggleRawOutput={() => setShowRaw(!showRaw)}
        />
      </div>
    );
  },
};

// ============================================================================
// AddStepDialog Stories
// ============================================================================

export const AddStep: StoryObj<typeof AddStepDialog> = {
  render: () => (
    <AddStepDialog
      isOpen={true}
      onClose={() => console.log('Close')}
      title="Implement validation"
      description="Add form validation with Zod schemas"
      onTitleChange={(value) => console.log('Title:', value)}
      onDescriptionChange={(value) => console.log('Description:', value)}
      onCreateStep={(startImmediately) => console.log('Create step:', startImmediately)}
      isCreating={false}
    />
  ),
};

export const AddStepEmpty: StoryObj<typeof AddStepDialog> = {
  render: () => (
    <AddStepDialog
      isOpen={true}
      onClose={() => console.log('Close')}
      title=""
      description=""
      onTitleChange={(value) => console.log('Title:', value)}
      onDescriptionChange={(value) => console.log('Description:', value)}
      onCreateStep={(startImmediately) => console.log('Create step:', startImmediately)}
      isCreating={false}
    />
  ),
};

export const AddStepCreating: StoryObj<typeof AddStepDialog> = {
  render: () => (
    <AddStepDialog
      isOpen={true}
      onClose={() => console.log('Close')}
      title="Implement validation"
      description="Add form validation with Zod schemas"
      onTitleChange={(value) => console.log('Title:', value)}
      onDescriptionChange={(value) => console.log('Description:', value)}
      onCreateStep={(startImmediately) => console.log('Create step:', startImmediately)}
      isCreating={true}
    />
  ),
};

export const AddStepWithError: StoryObj<typeof AddStepDialog> = {
  render: () => (
    <AddStepDialog
      isOpen={true}
      onClose={() => console.log('Close')}
      title=""
      description="Some description"
      onTitleChange={(value) => console.log('Title:', value)}
      onDescriptionChange={(value) => console.log('Description:', value)}
      onCreateStep={(startImmediately) => console.log('Create step:', startImmediately)}
      isCreating={false}
      titleError="Title is required"
    />
  ),
};

export const AddStepInteractive: StoryObj<typeof AddStepDialog> = {
  render: function Render() {
    const [isOpen, setIsOpen] = useState(true);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    const handleCreate = (startImmediately: boolean) => {
      setIsCreating(true);
      setTimeout(() => {
        setIsCreating(false);
        setIsOpen(false);
        console.log('Created step:', { title, description, startImmediately });
      }, 1500);
    };

    return (
      <>
        <button
          onClick={() => setIsOpen(true)}
          className="m-4 px-4 py-2 bg-primary text-primary-foreground rounded"
        >
          Open Dialog
        </button>
        <AddStepDialog
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title={title}
          description={description}
          onTitleChange={setTitle}
          onDescriptionChange={setDescription}
          onCreateStep={handleCreate}
          isCreating={isCreating}
        />
      </>
    );
  },
};

// ============================================================================
// TaskStepsPanel Stories
// ============================================================================

export const StepsPanel: StoryObj<typeof TaskStepsPanel> = {
  render: () => (
    <div className="w-72 h-96 border border-border">
      <TaskStepsPanel
        steps={mockSteps}
        activeStepIndex={1}
        onStartStep={(i) => console.log('Start step:', i)}
        onToggleStep={(i, c) => console.log('Toggle step:', i, c)}
        onSelectStep={(i) => console.log('Select step:', i)}
        onAddStep={() => console.log('Add step')}
        autoStart={true}
        onAutoStartChange={(v) => console.log('Auto start:', v)}
      />
    </div>
  ),
};

// ============================================================================
// Tab Panel Stories
// ============================================================================

export const ArtifactsTab: StoryObj<typeof TaskArtifactsTab> = {
  render: () => (
    <div className="h-96">
      <TaskArtifactsTab
        artifacts={mockArtifacts}
        loading={false}
        onOpenArtifact={(a) => console.log('Open:', a)}
        onPreviewArtifact={(a) => console.log('Preview:', a)}
      />
    </div>
  ),
};

export const ArtifactsTabLoading: StoryObj<typeof TaskArtifactsTab> = {
  render: () => (
    <div className="h-96">
      <TaskArtifactsTab
        artifacts={[]}
        loading={true}
        onOpenArtifact={(a) => console.log('Open:', a)}
        onPreviewArtifact={(a) => console.log('Preview:', a)}
      />
    </div>
  ),
};

export const ChangesTab: StoryObj<typeof TaskChangesTab> = {
  render: () => (
    <div className="h-96 overflow-auto">
      <TaskChangesTab
        diffs={mockDiffs}
        expandedFiles={new Set(['src/components/Button.tsx'])}
        onFileToggle={(p) => console.log('Toggle file:', p)}
      />
    </div>
  ),
};

export const CommitsTab: StoryObj<typeof TaskCommitsTab> = {
  render: () => (
    <div className="h-96 overflow-auto">
      <TaskCommitsTab
        commits={mockCommits}
        expandedCommits={new Set()}
        onCommitToggle={(h) => console.log('Toggle commit:', h)}
        onViewCommit={(h) => console.log('View commit:', h)}
      />
    </div>
  ),
};

// ============================================================================
// Accessibility Demos
// ============================================================================

export const AccessibilityDemo: StoryObj = {
  render: () => (
    <div className="space-y-8 p-4">
      <section>
        <h2 className="text-lg font-semibold mb-4">Not Found (role="alert")</h2>
        <div className="h-64 border border-border">
          <TaskNotFound onBack={() => {}} data-testid="not-found-demo" />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">Error State (aria-live="assertive")</h2>
        <div className="h-64 border border-border">
          <TaskPageError onRetry={() => {}} data-testid="error-demo" />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">Loading Skeleton (aria-busy={true})</h2>
        <div className="h-64 border border-border">
          <TaskPageSkeleton data-testid="skeleton-demo" />
        </div>
      </section>
    </div>
  ),
};

export const KeyboardNavigationDemo: StoryObj = {
  render: () => (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold">Keyboard Navigation</h2>
      <p className="text-muted-foreground text-sm">
        Tab through buttons to verify focus ring visibility and keyboard activation.
      </p>
      <div className="h-64 border border-border">
        <TaskNotFound onBack={() => console.log('Back clicked')} />
      </div>
    </div>
  ),
};

export const ScreenReaderDemo: StoryObj = {
  render: () => (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold">Screen Reader Announcements</h2>
      <p className="text-muted-foreground text-sm mb-4">
        Components include VisuallyHidden elements for screen reader announcements.
      </p>
      <ul className="list-disc list-inside text-sm space-y-2">
        <li>TaskNotFound: Announces "Task not found"</li>
        <li>TaskPageError: Announces "Error loading task" (assertive)</li>
        <li>TaskPageSkeleton: Announces "Loading task details"</li>
        <li>TaskOutputPanel: Announces toggle state changes</li>
        <li>AddStepDialog: Announces creating/error states</li>
      </ul>
    </div>
  ),
};

export const TouchTargetDemo: StoryObj = {
  render: () => (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold">Touch Target Compliance (WCAG 2.5.5)</h2>
      <p className="text-muted-foreground text-sm">
        All buttons have minimum 44x44px touch targets on mobile.
      </p>
      <div className="h-64 border border-border">
        <TaskPageError onRetry={() => console.log('Retry')} />
      </div>
    </div>
  ),
};

export const FocusRingDemo: StoryObj = {
  render: () => (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold">Focus Ring Visibility</h2>
      <p className="text-muted-foreground text-sm">
        Focus rings use ring-offset for visibility on all backgrounds.
      </p>
      <div className="h-64 border border-border">
        <TaskNotFound onBack={() => console.log('Back')} />
      </div>
    </div>
  ),
};

// ============================================================================
// Real-World Examples
// ============================================================================

export const FullTaskPageLoading: StoryObj = {
  render: () => (
    <div className="h-screen">
      <TaskPageSkeleton size={{ base: 'sm', md: 'md', lg: 'lg' }} />
    </div>
  ),
};

export const FullTaskPageError: StoryObj = {
  render: () => (
    <div className="h-screen">
      <TaskPageError
        message="Failed to connect to the server. The task data could not be loaded."
        onRetry={() => console.log('Retry')}
        size={{ base: 'sm', md: 'md', lg: 'lg' }}
      />
    </div>
  ),
};

export const FullTaskPageNotFound: StoryObj = {
  render: () => (
    <div className="h-screen">
      <TaskNotFound onBack={() => console.log('Back')} size={{ base: 'sm', md: 'md', lg: 'lg' }} />
    </div>
  ),
};

export const MainPanelWithChat: StoryObj<typeof TaskMainPanel> = {
  render: () => (
    <div className="h-96">
      <TaskMainPanel
        claudeEvents={mockClaudeEvents}
        rawOutput={mockRawOutput}
        isRunning={false}
        showRawOutput={false}
        onToggleRawOutput={() => console.log('Toggle')}
        messages={mockMessages}
        onSendMessage={(msg) => console.log('Send:', msg)}
        isProcessing={false}
        onStopProcess={() => console.log('Stop')}
        executorProfiles={mockExecutorProfiles}
        selectedExecutorProfileId="profile-1"
      />
    </div>
  ),
};

// ============================================================================
// Constants Reference
// ============================================================================

export const ConstantsReference: StoryObj = {
  render: () => (
    <div className="p-4 space-y-6">
      <h2 className="text-lg font-semibold">Exported Constants</h2>

      <section>
        <h3 className="font-medium mb-2">Label Constants</h3>
        <pre className="bg-muted p-4 rounded text-sm overflow-auto">
          {JSON.stringify(
            {
              DEFAULT_NOT_FOUND_TITLE,
              DEFAULT_NOT_FOUND_DESCRIPTION,
              DEFAULT_BACK_BUTTON_LABEL,
              DEFAULT_ERROR_TITLE,
              DEFAULT_ERROR_MESSAGE,
              DEFAULT_RETRY_LABEL,
              OUTPUT_LABEL_RUNNING,
              OUTPUT_LABEL_COMPLETE,
              ADD_STEP_DIALOG_TITLE,
            },
            null,
            2
          )}
        </pre>
      </section>

      <section>
        <h3 className="font-medium mb-2">Screen Reader Announcements</h3>
        <pre className="bg-muted p-4 rounded text-sm overflow-auto">
          {JSON.stringify(
            {
              SR_LOADING_ANNOUNCEMENT,
            },
            null,
            2
          )}
        </pre>
      </section>
    </div>
  ),
};

// ============================================================================
// Size Comparison
// ============================================================================

export const SizeComparison: StoryObj = {
  render: () => (
    <div className="space-y-8 p-4">
      <h2 className="text-lg font-semibold">Size Variants</h2>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <h3 className="font-medium mb-2">Small</h3>
          <div className="h-64 border border-border">
            <TaskNotFound onBack={() => {}} size="sm" />
          </div>
        </div>
        <div>
          <h3 className="font-medium mb-2">Medium (Default)</h3>
          <div className="h-64 border border-border">
            <TaskNotFound onBack={() => {}} size="md" />
          </div>
        </div>
        <div>
          <h3 className="font-medium mb-2">Large</h3>
          <div className="h-64 border border-border">
            <TaskNotFound onBack={() => {}} size="lg" />
          </div>
        </div>
      </div>
    </div>
  ),
};

// ============================================================================
// Data Attributes Demo
// ============================================================================

export const DataAttributesDemo: StoryObj = {
  render: () => (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold">Data Attributes for Testing</h2>
      <p className="text-muted-foreground text-sm mb-4">
        Components support data-testid and expose state via data attributes.
      </p>
      <ul className="list-disc list-inside text-sm space-y-2">
        <li>
          <code>data-testid</code> - Custom test ID
        </li>
        <li>
          <code>data-size</code> - Current size value
        </li>
        <li>
          <code>data-running</code> - Whether process is running (OutputPanel)
        </li>
        <li>
          <code>data-show-raw</code> - Whether showing raw output (OutputPanel)
        </li>
        <li>
          <code>data-step-count</code> - Number of steps (StepsPanel)
        </li>
        <li>
          <code>data-active-step</code> - Active step index (StepsPanel)
        </li>
        <li>
          <code>data-artifact-count</code> - Number of artifacts (ArtifactsTab)
        </li>
        <li>
          <code>data-loading</code> - Whether loading (ArtifactsTab)
        </li>
        <li>
          <code>data-diff-count</code> - Number of diffs (ChangesTab)
        </li>
        <li>
          <code>data-commit-count</code> - Number of commits (CommitsTab)
        </li>
      </ul>
      <div className="h-64 border border-border">
        <TaskPageSkeleton data-testid="skeleton-with-testid" />
      </div>
    </div>
  ),
};

// ============================================================================
// Ref Forwarding Demo
// ============================================================================

export const RefForwardingDemo: StoryObj = {
  render: function Render() {
    const handleClick = () => {
      const element = document.querySelector('[data-testid="ref-demo"]');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        console.log('Element found:', element);
      }
    };

    return (
      <div className="p-4 space-y-4">
        <h2 className="text-lg font-semibold">Ref Forwarding Support</h2>
        <p className="text-muted-foreground text-sm">
          All components support forwardRef for programmatic access.
        </p>
        <button
          onClick={handleClick}
          className="px-4 py-2 bg-primary text-primary-foreground rounded"
        >
          Find Element by data-testid
        </button>
        <div className="h-64 border border-border">
          <TaskNotFound onBack={() => console.log('Back')} data-testid="ref-demo" />
        </div>
      </div>
    );
  },
};
