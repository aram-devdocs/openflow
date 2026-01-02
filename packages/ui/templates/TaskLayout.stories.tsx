import type {
  Chat,
  Commit,
  FileDiff as FileDiffType,
  Message,
  Task,
  TaskStatus as TaskStatusType,
  WorkflowStep,
} from '@openflow/generated';
import { ChatRole, MessageRole, TaskStatus, WorkflowStepStatus } from '@openflow/generated';
import type { Meta, StoryObj } from '@storybook/react';
import { FileDiff, GitCommit, ListTodo, Send } from 'lucide-react';
import { useRef, useState } from 'react';
import { Button } from '../atoms/Button';
import { Icon } from '../atoms/Icon';
import type { Tab } from '../molecules/Tabs';
import { CommitList } from '../organisms/CommitList';
import { DiffViewer } from '../organisms/DiffViewer';
import { StepsPanel } from '../organisms/StepsPanel';
import {
  DEFAULT_BACK_LABEL,
  DEFAULT_CREATE_PR_LABEL,
  DEFAULT_EDIT_TITLE_LABEL,
  // Default Labels
  DEFAULT_HEADER_LABEL,
  DEFAULT_MAIN_LABEL,
  DEFAULT_MORE_ACTIONS_LABEL,
  DEFAULT_STEPS_PANEL_LABEL,
  DEFAULT_STEPS_PANEL_WIDTH,
  // Screen Reader Announcements
  SR_LOADING,
  SR_STATUS_CHANGED,
  SR_STEPS_COLLAPSED,
  SR_STEPS_EXPANDED,
  SR_TAB_CHANGED,
  SR_TITLE_EDITING,
  SR_TITLE_SAVED,
  // CSS Class Constants
  STATUS_OPTIONS,
  TASK_LAYOUT_BRANCH_CLASSES,
  TASK_LAYOUT_CONTAINER_CLASSES,
  TASK_LAYOUT_DESKTOP_STEPS_PANEL_CLASSES,
  TASK_LAYOUT_EDIT_TITLE_BUTTON_CLASSES,
  TASK_LAYOUT_HEADER_CLASSES,
  TASK_LAYOUT_HEADER_LEFT_CLASSES,
  TASK_LAYOUT_HEADER_RIGHT_CLASSES,
  TASK_LAYOUT_HEADER_ROW_CLASSES,
  TASK_LAYOUT_ICON_BUTTON_CLASSES,
  TASK_LAYOUT_MAIN_CLASSES,
  TASK_LAYOUT_MAIN_PANEL_CLASSES,
  TASK_LAYOUT_MOBILE_STEPS_PANEL_CLASSES,
  TASK_LAYOUT_MOBILE_STEPS_TOGGLE_CLASSES,
  TASK_LAYOUT_SIZE_CLASSES,
  TASK_LAYOUT_TABS_CLASSES,
  TASK_LAYOUT_TAB_CONTENT_CLASSES,
  TASK_LAYOUT_TITLE_CLASSES,
  TASK_LAYOUT_TITLE_INPUT_CLASSES,
  TaskLayout,
  TaskLayoutSkeleton,
  buildStatusChangeAnnouncement,
  buildStepsPanelAnnouncement,
  buildTabChangeAnnouncement,
  buildTaskHeaderAccessibleLabel,
  // Utility Functions
  getBaseSize,
  getCurrentBranch,
  getMainPanelId,
  getResponsiveSizeClasses,
  getStepsPanelId,
} from './TaskLayout';

const meta: Meta<typeof TaskLayout> = {
  title: 'Templates/TaskLayout',
  component: TaskLayout,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
TaskLayout is the task detail page layout template providing the structure for:
- Task header with title, status, and actions
- Branch indicator and Create PR button
- Tabs for switching between Steps, Changes, and Commits views
- Split pane layout with steps panel on left and main panel on right
- Collapsible mobile steps panel

## Accessibility Features
- **Landmark structure** - Uses proper semantic landmarks (header, main, region)
- **Screen reader announcements** - State changes (tab, status, steps panel) announced via aria-live
- **Focus management** - Title input focus, keyboard navigation
- **Touch targets** - All interactive elements have minimum 44px touch targets on mobile (WCAG 2.5.5)
- **Focus rings** - Visible focus indicators with ring-offset for all backgrounds
- **Reduced motion** - Respects prefers-reduced-motion for transitions
- **Keyboard navigation** - Tab, Enter, Escape for title editing; tabs use Tabs component navigation
        `,
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="h-screen w-screen bg-[rgb(var(--background))]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof TaskLayout>;
type SkeletonStory = StoryObj<typeof TaskLayoutSkeleton>;

// ============================================================================
// Mock Data
// ============================================================================

const mockTask: Task = {
  id: 'task-1',
  projectId: 'project-1',
  title: 'Implement user authentication',
  description: 'Add login, logout, and session management',
  status: TaskStatus.Inprogress,
  actionsRequiredCount: 2,
  autoStartNextStep: false,
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-15T14:30:00Z',
};

const mockChats: Chat[] = [
  {
    id: 'chat-1',
    taskId: 'task-1',
    projectId: 'project-1',
    title: 'Implementation',
    chatRole: ChatRole.Main,
    baseBranch: 'main',
    branch: 'openflow/task-1/main',
    worktreeDeleted: false,
    isPlanContainer: false,
    workflowStepIndex: 0,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T14:30:00Z',
  },
  {
    id: 'chat-2',
    taskId: 'task-1',
    projectId: 'project-1',
    title: 'Review',
    chatRole: ChatRole.Review,
    baseBranch: 'main',
    branch: 'openflow/task-1/review',
    worktreeDeleted: false,
    isPlanContainer: false,
    workflowStepIndex: 1,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T14:30:00Z',
  },
];

const mockSteps: WorkflowStep[] = [
  {
    index: 0,
    name: 'Requirements Analysis',
    description: 'Analyze and document the requirements for the feature',
    status: WorkflowStepStatus.Completed,
    chatId: 'chat-1',
  },
  {
    index: 1,
    name: 'Technical Design',
    description: 'Create technical design document with architecture decisions',
    status: WorkflowStepStatus.Completed,
  },
  {
    index: 2,
    name: 'Implementation',
    description: 'Implement the authentication feature with login/logout',
    status: WorkflowStepStatus.InProgress,
    chatId: 'chat-1',
  },
  {
    index: 3,
    name: 'Testing',
    description: 'Write and run unit and integration tests',
    status: WorkflowStepStatus.Pending,
  },
  {
    index: 4,
    name: 'Code Review',
    description: 'Review code changes and address feedback',
    status: WorkflowStepStatus.Pending,
  },
];

const mockMessages: Message[] = [
  {
    id: 'msg-1',
    chatId: 'chat-1',
    role: MessageRole.User,
    content: 'Please implement the login functionality using JWT tokens.',
    isStreaming: false,
    createdAt: '2024-01-15T10:05:00Z',
  },
  {
    id: 'msg-2',
    chatId: 'chat-1',
    role: MessageRole.Assistant,
    content:
      "I'll implement JWT-based authentication. Let me start by creating the authentication service and login endpoint.\n\n```typescript\n// auth.service.ts\nimport jwt from 'jsonwebtoken';\n\nexport class AuthService {\n  async login(email: string, password: string) {\n    // Implementation\n  }\n}\n```",
    isStreaming: false,
    createdAt: '2024-01-15T10:06:00Z',
  },
  {
    id: 'msg-3',
    chatId: 'chat-1',
    role: MessageRole.User,
    content: 'Looks good! Can you also add refresh token support?',
    isStreaming: false,
    createdAt: '2024-01-15T10:10:00Z',
  },
];

const mockDiffs: FileDiffType[] = [
  {
    path: 'src/services/auth.service.ts',
    hunks: [
      {
        oldStart: 1,
        oldLines: 0,
        newStart: 1,
        newLines: 25,
        content:
          "+import jwt from 'jsonwebtoken';\n+\n+export class AuthService {\n+  async login(email: string, password: string) {\n+    // Validate credentials\n+    const user = await this.findUser(email);\n+    if (!user || !await this.verifyPassword(password, user.passwordHash)) {\n+      throw new Error('Invalid credentials');\n+    }\n+    \n+    // Generate tokens\n+    const accessToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!);\n+    const refreshToken = jwt.sign({ userId: user.id }, process.env.JWT_REFRESH_SECRET!);\n+    \n+    return { accessToken, refreshToken };\n+  }\n+}",
      },
    ],
    additions: 25,
    deletions: 0,
    isBinary: false,
    isNew: true,
    isDeleted: false,
    isRenamed: false,
  },
  {
    path: 'src/routes/auth.routes.ts',
    hunks: [
      {
        oldStart: 1,
        oldLines: 5,
        newStart: 1,
        newLines: 15,
        content:
          " import { Router } from 'express';\n+import { AuthService } from '../services/auth.service';\n \n const router = Router();\n+const authService = new AuthService();\n \n-// TODO: Add auth routes\n+router.post('/login', async (req, res) => {\n+  const { email, password } = req.body;\n+  const tokens = await authService.login(email, password);\n+  res.json(tokens);\n+});\n+\n+router.post('/refresh', async (req, res) => {\n+  // Refresh token logic\n+});\n \n export default router;",
      },
    ],
    additions: 12,
    deletions: 1,
    isBinary: false,
    isNew: false,
    isDeleted: false,
    isRenamed: false,
  },
];

const mockCommits: Commit[] = [
  {
    hash: 'abc123def456789012345678901234567890abcd',
    shortHash: 'abc123d',
    message: 'feat: add JWT authentication service',
    author: 'John Doe',
    authorEmail: 'john@example.com',
    date: '2024-01-15T14:30:00Z',
    filesChanged: 2,
    additions: 37,
    deletions: 1,
  },
  {
    hash: 'def456789012345678901234567890abcdef123',
    shortHash: 'def4567',
    message: 'feat: add login and refresh endpoints',
    author: 'John Doe',
    authorEmail: 'john@example.com',
    date: '2024-01-15T14:00:00Z',
    filesChanged: 1,
    additions: 15,
    deletions: 0,
  },
  {
    hash: '789012345678901234567890abcdef123456789',
    shortHash: '7890123',
    message: 'chore: initial project setup',
    author: 'John Doe',
    authorEmail: 'john@example.com',
    date: '2024-01-15T10:00:00Z',
    filesChanged: 5,
    additions: 120,
    deletions: 0,
  },
];

const defaultTabs: Tab[] = [
  { id: 'steps', label: 'Steps', icon: ListTodo },
  { id: 'changes', label: 'Changes', icon: FileDiff, badge: 2 },
  { id: 'commits', label: 'Commits', icon: GitCommit, badge: 3 },
];

// ============================================================================
// Helper Components
// ============================================================================

/** Simple chat input component for stories */
function SimpleChatInput({ onSend }: { onSend?: (message: string) => void }) {
  return (
    <div className="flex items-center gap-2 border-t border-[rgb(var(--border))] p-4 bg-[rgb(var(--background))]">
      <input
        type="text"
        placeholder="Type a message..."
        className="flex-1 rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--background))] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))] focus:ring-offset-2 focus:ring-offset-[rgb(var(--background))]"
        aria-label="Message input"
      />
      <Button
        variant="primary"
        size="sm"
        onClick={() => onSend?.('message')}
        aria-label="Send message"
      >
        <Icon icon={Send} size="sm" aria-hidden={true} />
      </Button>
    </div>
  );
}

/** Simple chat display for stories */
function SimpleChatDisplay({ messages }: { messages: Message[] }) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4" role="log" aria-label="Chat messages">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[80%] rounded-lg px-4 py-2 ${
              msg.role === 'user'
                ? 'bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))]'
                : 'bg-[rgb(var(--muted))] text-[rgb(var(--foreground))]'
            }`}
          >
            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// Noop action handlers for stories
const noopVoid = () => {};
const noopString = (_value: string) => {};
const noopStatus = (_status: TaskStatusType) => {};

// ============================================================================
// Basic Examples
// ============================================================================

/**
 * Default view showing the Steps tab with workflow steps and chat panel
 */
export const Default: Story = {
  args: {
    task: mockTask,
    chats: mockChats,
    tabs: defaultTabs,
    activeTab: 'steps',
    stepsPanel: (
      <StepsPanel
        steps={mockSteps}
        activeStepIndex={2}
        onStartStep={(index) => console.log('Start step', index)}
        onToggleStep={(index, completed) => console.log('Toggle step', index, completed)}
        onSelectStep={(index) => console.log('Select step', index)}
        onAddStep={() => console.log('Add step')}
        autoStart={false}
        onAutoStartChange={(enabled) => console.log('Auto-start', enabled)}
      />
    ),
    mainPanel: (
      <div className="flex h-full flex-col">
        <SimpleChatDisplay messages={mockMessages} />
        <SimpleChatInput onSend={(msg) => console.log('Send', msg)} />
      </div>
    ),
    onTabChange: (tab) => console.log('Tab change:', tab),
    onStatusChange: (status) => console.log('Status change:', status),
    onTitleEditToggle: () => console.log('Toggle title edit'),
    onCreatePR: () => console.log('Create PR'),
    onMoreActions: () => console.log('More actions'),
    onBack: () => console.log('Back'),
    'data-testid': 'task-layout',
  },
};

/**
 * Changes tab showing file diffs
 */
export const ChangesTab: Story = {
  args: {
    ...Default.args,
    activeTab: 'changes',
    tabContent: <DiffViewer diffs={mockDiffs} defaultExpanded showLineNumbers />,
  },
};

/**
 * Commits tab showing git history
 */
export const CommitsTab: Story = {
  args: {
    ...Default.args,
    activeTab: 'commits',
    tabContent: (
      <CommitList commits={mockCommits} onViewCommit={(hash) => console.log('View commit', hash)} />
    ),
  },
};

// ============================================================================
// Task Status Variants
// ============================================================================

/**
 * Task in To Do status
 */
export const TodoStatus: Story = {
  args: {
    ...Default.args,
    task: {
      ...mockTask,
      status: TaskStatus.Todo,
      actionsRequiredCount: 0,
    },
    chats: [],
  },
};

/**
 * Task in Review status with no branch yet
 */
export const InReviewStatus: Story = {
  args: {
    ...Default.args,
    task: {
      ...mockTask,
      status: TaskStatus.Inreview,
      actionsRequiredCount: 1,
    },
  },
};

/**
 * Completed task
 */
export const DoneStatus: Story = {
  args: {
    ...Default.args,
    task: {
      ...mockTask,
      status: TaskStatus.Done,
      actionsRequiredCount: 0,
    },
  },
};

/**
 * Cancelled task
 */
export const CancelledStatus: Story = {
  args: {
    ...Default.args,
    task: {
      ...mockTask,
      status: TaskStatus.Cancelled,
      actionsRequiredCount: 0,
    },
  },
};

// ============================================================================
// Size Variants
// ============================================================================

/**
 * Small size variant (280px steps panel)
 */
export const SizeSmall: Story = {
  args: {
    ...Default.args,
    size: 'sm',
  },
};

/**
 * Medium size variant (320px steps panel) - default
 */
export const SizeMedium: Story = {
  args: {
    ...Default.args,
    size: 'md',
  },
};

/**
 * Large size variant (360px steps panel)
 */
export const SizeLarge: Story = {
  args: {
    ...Default.args,
    size: 'lg',
  },
};

/**
 * Responsive sizing that changes at breakpoints
 */
export const ResponsiveSizing: Story = {
  args: {
    ...Default.args,
    size: { base: 'sm', lg: 'md', xl: 'lg' },
  },
  parameters: {
    docs: {
      description: {
        story: 'Panel size changes at different breakpoints: sm at base, md at lg, lg at xl.',
      },
    },
  },
};

// ============================================================================
// Title Editing
// ============================================================================

/**
 * Task with title editing enabled
 */
export const EditingTitle: Story = {
  args: {
    ...Default.args,
    isTitleEditing: true,
    titleInputValue: 'Implement user authentication',
    onTitleInputChange: (value) => console.log('Title input:', value),
    onTitleEditSubmit: () => console.log('Submit title'),
    onTitleEditCancel: () => console.log('Cancel title edit'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Press Enter to save, Escape to cancel. Screen readers announce editing mode.',
      },
    },
  },
};

/**
 * Interactive title editing demo
 */
export const InteractiveTitleEditing: Story = {
  render: () => {
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState('Implement user authentication');
    const [inputValue, setInputValue] = useState(title);

    return (
      <TaskLayout
        task={{ ...mockTask, title }}
        chats={mockChats}
        tabs={defaultTabs}
        activeTab="steps"
        stepsPanel={<StepsPanel steps={mockSteps} activeStepIndex={2} />}
        mainPanel={
          <div className="flex h-full items-center justify-center">
            <p className="text-[rgb(var(--muted-foreground))]">
              Click the edit button next to the title to edit
            </p>
          </div>
        }
        onTabChange={noopString}
        isTitleEditing={isEditing}
        titleInputValue={inputValue}
        onTitleInputChange={setInputValue}
        onTitleEditToggle={() => {
          setIsEditing(!isEditing);
          setInputValue(title);
        }}
        onTitleEditSubmit={() => {
          setTitle(inputValue);
          setIsEditing(false);
        }}
        onTitleEditCancel={() => {
          setInputValue(title);
          setIsEditing(false);
        }}
        data-testid="task-layout"
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Click the pencil icon to edit the title. Press Enter to save or Escape to cancel.',
      },
    },
  },
};

// ============================================================================
// Loading States
// ============================================================================

/**
 * Loading state with overlay
 */
export const Loading: Story = {
  args: {
    ...Default.args,
    isLoading: true,
  },
};

/**
 * Skeleton loading state
 */
export const SkeletonLoading: SkeletonStory = {
  render: (args) => <TaskLayoutSkeleton {...args} />,
  args: {
    size: 'md',
    'data-testid': 'task-layout-skeleton',
  },
};

/**
 * Skeleton loading - small size
 */
export const SkeletonSmall: SkeletonStory = {
  render: (args) => <TaskLayoutSkeleton {...args} />,
  args: {
    size: 'sm',
    loadingLabel: 'Loading task details...',
  },
};

/**
 * Skeleton loading - large size
 */
export const SkeletonLarge: SkeletonStory = {
  render: (args) => <TaskLayoutSkeleton {...args} />,
  args: {
    size: 'lg',
    loadingLabel: 'Loading task details...',
  },
};

// ============================================================================
// Branch & PR Variants
// ============================================================================

/**
 * Task with long title (truncation test)
 */
export const LongTitle: Story = {
  args: {
    ...Default.args,
    task: {
      ...mockTask,
      title:
        'Implement comprehensive user authentication system with OAuth2, SAML, and custom JWT token support for enterprise customers',
    },
  },
};

/**
 * Task without branch (no PR button)
 */
export const NoBranch: Story = {
  args: {
    ...Default.args,
    chats: mockChats.map((chat) => ({ ...chat, branch: undefined })),
  },
};

/**
 * Task with many actions required
 */
export const ManyActionsRequired: Story = {
  args: {
    ...Default.args,
    task: {
      ...mockTask,
      actionsRequiredCount: 15,
    },
  },
};

// ============================================================================
// Read-Only & Minimal Variants
// ============================================================================

/**
 * Read-only view (no callbacks)
 */
export const ReadOnly: Story = {
  args: {
    task: mockTask,
    chats: mockChats,
    tabs: defaultTabs,
    activeTab: 'steps',
    stepsPanel: <StepsPanel steps={mockSteps} activeStepIndex={2} disabled />,
    mainPanel: (
      <div className="flex h-full flex-col">
        <SimpleChatDisplay messages={mockMessages} />
      </div>
    ),
    onTabChange: noopString,
    // No onStatusChange, onTitleEditToggle, onCreatePR, etc.
  },
};

/**
 * Minimal configuration - only required props
 */
export const Minimal: Story = {
  args: {
    task: mockTask,
    chats: [],
    tabs: defaultTabs,
    activeTab: 'steps',
    stepsPanel: <div className="p-4">Steps content</div>,
    mainPanel: <div className="p-4">Main content</div>,
    onTabChange: noopString,
  },
};

// ============================================================================
// Panel Width Variants
// ============================================================================

/**
 * Custom steps panel width
 */
export const WideStepsPanel: Story = {
  args: {
    ...Default.args,
    stepsPanelWidth: '400px',
  },
};

/**
 * Narrow steps panel
 */
export const NarrowStepsPanel: Story = {
  args: {
    ...Default.args,
    stepsPanelWidth: '250px',
  },
};

// ============================================================================
// Interactive Examples
// ============================================================================

/**
 * Interactive tab switching demo
 */
export const InteractiveTabSwitching: Story = {
  render: () => {
    const [activeTab, setActiveTab] = useState('steps');

    return (
      <TaskLayout
        task={mockTask}
        chats={mockChats}
        tabs={defaultTabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        stepsPanel={
          <StepsPanel
            steps={mockSteps}
            activeStepIndex={2}
            onStartStep={(index) => console.log('Start step', index)}
          />
        }
        mainPanel={
          <div className="flex h-full flex-col">
            <SimpleChatDisplay messages={mockMessages} />
            <SimpleChatInput onSend={(msg) => console.log('Send', msg)} />
          </div>
        }
        tabContent={
          activeTab === 'changes' ? (
            <DiffViewer diffs={mockDiffs} defaultExpanded showLineNumbers />
          ) : activeTab === 'commits' ? (
            <CommitList commits={mockCommits} />
          ) : undefined
        }
        data-testid="task-layout"
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Click tabs to switch between views. Screen reader announces tab changes.',
      },
    },
  },
};

/**
 * Interactive status change demo
 */
export const InteractiveStatusChange: Story = {
  render: () => {
    const [task, setTask] = useState(mockTask);

    return (
      <TaskLayout
        task={task}
        chats={mockChats}
        tabs={defaultTabs}
        activeTab="steps"
        onTabChange={noopString}
        onStatusChange={(status) => {
          setTask({ ...task, status });
        }}
        stepsPanel={<StepsPanel steps={mockSteps} activeStepIndex={2} />}
        mainPanel={
          <div className="flex h-full items-center justify-center">
            <p className="text-[rgb(var(--muted-foreground))]">
              Use the status dropdown in the header to change task status
            </p>
          </div>
        }
        data-testid="task-layout"
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Use the status dropdown to change task status. Screen reader announces status changes.',
      },
    },
  },
};

// ============================================================================
// Custom Labels
// ============================================================================

/**
 * Layout with custom accessible labels
 */
export const CustomLabels: Story = {
  args: {
    ...Default.args,
    headerLabel: 'Task details header',
    mainLabel: 'Task details content',
    stepsPanelLabel: 'Task workflow steps',
  },
  parameters: {
    docs: {
      description: {
        story:
          'All landmark regions can have custom aria-labels for better screen reader experience.',
      },
    },
  },
};

// ============================================================================
// Accessibility Demos
// ============================================================================

/**
 * Demo: Keyboard navigation through the layout
 */
export const KeyboardNavigationDemo: Story = {
  args: {
    ...Default.args,
  },
  parameters: {
    docs: {
      description: {
        story: `
### Keyboard Navigation

1. **Tab** - Navigate through interactive elements
2. **Title Edit** - Click edit button, Enter to save, Escape to cancel
3. **Tabs** - Arrow keys to navigate between tabs
4. **Status Dropdown** - Arrow keys to select status
5. **Mobile Steps** - Collapsible panel on mobile with button toggle
        `,
      },
    },
  },
};

/**
 * Demo: Screen reader announcements
 */
export const ScreenReaderDemo: Story = {
  render: () => {
    const [activeTab, setActiveTab] = useState('steps');
    const [task, setTask] = useState(mockTask);

    return (
      <TaskLayout
        task={task}
        chats={mockChats}
        tabs={defaultTabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onStatusChange={(status) => setTask({ ...task, status })}
        stepsPanel={<StepsPanel steps={mockSteps} activeStepIndex={2} />}
        mainPanel={
          <div className="p-6">
            <h2 className="mb-4 text-xl font-bold">Screen Reader Demo</h2>
            <p className="mb-4 text-[rgb(var(--muted-foreground))]">
              Change tabs or status to hear announcements via screen reader.
            </p>
            <div className="mb-4 flex gap-4">
              <button
                type="button"
                onClick={() => setActiveTab('steps')}
                className="rounded bg-[rgb(var(--primary))] px-4 py-2 text-white"
              >
                Go to Steps
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('changes')}
                className="rounded bg-[rgb(var(--primary))] px-4 py-2 text-white"
              >
                Go to Changes
              </button>
            </div>
            <p className="text-sm text-[rgb(var(--muted-foreground))]">
              Announcements: "{buildTabChangeAnnouncement('Steps')}", "
              {buildStatusChangeAnnouncement(TaskStatus.Done)}"
            </p>
          </div>
        }
        tabContent={
          activeTab === 'changes' ? (
            <DiffViewer diffs={mockDiffs} defaultExpanded showLineNumbers />
          ) : undefined
        }
        data-testid="task-layout"
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'State changes are announced via aria-live regions. Change tabs or status to trigger announcements.',
      },
    },
  },
};

/**
 * Demo: Focus ring visibility
 */
export const FocusRingDemo: Story = {
  args: {
    ...Default.args,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Tab through the interface to see focus rings. All interactive elements have visible focus indicators with ring-offset.',
      },
    },
  },
};

/**
 * Demo: Touch targets (mobile)
 */
export const TouchTargetDemo: Story = {
  args: {
    ...Default.args,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story:
          'On mobile, all interactive elements have minimum 44px touch targets (WCAG 2.5.5). Test by tapping buttons on a mobile device.',
      },
    },
  },
};

/**
 * Demo: Mobile steps panel collapse
 */
export const MobileStepsPanelDemo: Story = {
  args: {
    ...Default.args,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story:
          'On mobile viewports, the steps panel collapses into an expandable section. Tap to toggle. Screen reader announces state changes.',
      },
    },
  },
};

// ============================================================================
// Ref Forwarding & Data Attributes
// ============================================================================

/**
 * Demo: Ref forwarding for programmatic access
 */
export const RefForwarding: Story = {
  render: () => {
    const layoutRef = useRef<HTMLDivElement>(null);

    return (
      <TaskLayout
        ref={layoutRef}
        task={mockTask}
        chats={mockChats}
        tabs={defaultTabs}
        activeTab="steps"
        onTabChange={noopString}
        stepsPanel={<StepsPanel steps={mockSteps} activeStepIndex={2} />}
        mainPanel={
          <div className="p-6">
            <h1 className="mb-4 text-2xl font-bold">Ref Forwarding Demo</h1>
            <button
              type="button"
              onClick={() => {
                if (layoutRef.current) {
                  console.log('Layout dimensions:', layoutRef.current.getBoundingClientRect());
                }
              }}
              className="rounded bg-[rgb(var(--primary))] px-4 py-2 text-white"
            >
              Log Layout Dimensions
            </button>
          </div>
        }
        data-testid="task-layout"
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Use ref forwarding for programmatic access to the layout container.',
      },
    },
  },
};

/**
 * Demo: Data attributes for testing
 */
export const DataAttributes: Story = {
  args: {
    ...Default.args,
    'data-testid': 'task-layout',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Open browser DevTools to inspect data-testid, data-task-id, data-task-status, data-size, and data-loading attributes.',
      },
    },
  },
};

// ============================================================================
// Real-World Examples
// ============================================================================

/**
 * New task (just created)
 */
export const NewTaskLayout: Story = {
  args: {
    task: {
      ...mockTask,
      id: 'task-new',
      title: 'New Feature Implementation',
      status: TaskStatus.Todo,
      actionsRequiredCount: 0,
    },
    chats: [],
    tabs: defaultTabs,
    activeTab: 'steps',
    stepsPanel: (
      <StepsPanel
        steps={mockSteps.map((step) => ({ ...step, status: WorkflowStepStatus.Pending }))}
        activeStepIndex={-1}
        onStartStep={(index) => console.log('Start step', index)}
        onAddStep={() => console.log('Add step')}
      />
    ),
    mainPanel: (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <p className="text-[rgb(var(--muted-foreground))]">
          Start the first step to begin working on this task
        </p>
        <Button variant="primary" onClick={() => console.log('Start first step')}>
          Start First Step
        </Button>
      </div>
    ),
    onTabChange: noopString,
    onStatusChange: noopStatus,
    onBack: noopVoid,
    'data-testid': 'task-layout',
  },
};

/**
 * Task in progress with active chat
 */
export const ActiveTaskLayout: Story = {
  args: {
    ...Default.args,
  },
};

/**
 * Completed task with all steps done
 */
export const CompletedTaskLayout: Story = {
  args: {
    task: {
      ...mockTask,
      status: TaskStatus.Done,
      actionsRequiredCount: 0,
    },
    chats: mockChats,
    tabs: defaultTabs,
    activeTab: 'commits',
    stepsPanel: (
      <StepsPanel
        steps={mockSteps.map((step) => ({ ...step, status: WorkflowStepStatus.Completed }))}
        activeStepIndex={-1}
        disabled
      />
    ),
    mainPanel: (
      <div className="flex h-full flex-col items-center justify-center">
        <p className="text-[rgb(var(--muted-foreground))]">Task completed successfully!</p>
      </div>
    ),
    tabContent: (
      <CommitList commits={mockCommits} onViewCommit={(hash) => console.log('View commit', hash)} />
    ),
    onTabChange: noopString,
    onBack: noopVoid,
    'data-testid': 'task-layout',
  },
};

// ============================================================================
// Constants Reference
// ============================================================================

/**
 * Reference: All exported constants
 */
export const ConstantsReference: Story = {
  render: () => (
    <div className="p-6 font-mono text-sm overflow-auto h-full">
      <h2 className="mb-4 text-lg font-bold">Exported Constants</h2>

      <h3 className="mb-2 mt-6 font-semibold">Default Labels</h3>
      <ul className="list-disc pl-6 space-y-1">
        <li>DEFAULT_HEADER_LABEL: "{DEFAULT_HEADER_LABEL}"</li>
        <li>DEFAULT_MAIN_LABEL: "{DEFAULT_MAIN_LABEL}"</li>
        <li>DEFAULT_STEPS_PANEL_LABEL: "{DEFAULT_STEPS_PANEL_LABEL}"</li>
        <li>DEFAULT_STEPS_PANEL_WIDTH: "{DEFAULT_STEPS_PANEL_WIDTH}"</li>
        <li>DEFAULT_BACK_LABEL: "{DEFAULT_BACK_LABEL}"</li>
        <li>DEFAULT_EDIT_TITLE_LABEL: "{DEFAULT_EDIT_TITLE_LABEL}"</li>
        <li>DEFAULT_MORE_ACTIONS_LABEL: "{DEFAULT_MORE_ACTIONS_LABEL}"</li>
        <li>DEFAULT_CREATE_PR_LABEL: "{DEFAULT_CREATE_PR_LABEL}"</li>
      </ul>

      <h3 className="mb-2 mt-6 font-semibold">Screen Reader Announcements</h3>
      <ul className="list-disc pl-6 space-y-1">
        <li>SR_LOADING: "{SR_LOADING}"</li>
        <li>SR_STEPS_EXPANDED: "{SR_STEPS_EXPANDED}"</li>
        <li>SR_STEPS_COLLAPSED: "{SR_STEPS_COLLAPSED}"</li>
        <li>SR_TAB_CHANGED: "{SR_TAB_CHANGED}"</li>
        <li>SR_TITLE_EDITING: "{SR_TITLE_EDITING}"</li>
        <li>SR_TITLE_SAVED: "{SR_TITLE_SAVED}"</li>
        <li>SR_STATUS_CHANGED: "{SR_STATUS_CHANGED}"</li>
      </ul>

      <h3 className="mb-2 mt-6 font-semibold">Status Options</h3>
      <ul className="list-disc pl-6 space-y-1">
        {STATUS_OPTIONS.map((opt) => (
          <li key={opt.value}>
            {opt.value}: "{opt.label}"
          </li>
        ))}
      </ul>

      <h3 className="mb-2 mt-6 font-semibold">CSS Class Constants</h3>
      <ul className="list-disc pl-6 space-y-1 text-xs">
        <li>TASK_LAYOUT_CONTAINER_CLASSES: "{TASK_LAYOUT_CONTAINER_CLASSES}"</li>
        <li>TASK_LAYOUT_HEADER_CLASSES: "{TASK_LAYOUT_HEADER_CLASSES}"</li>
        <li>TASK_LAYOUT_HEADER_ROW_CLASSES: "{TASK_LAYOUT_HEADER_ROW_CLASSES}"</li>
        <li>TASK_LAYOUT_HEADER_LEFT_CLASSES: "{TASK_LAYOUT_HEADER_LEFT_CLASSES}"</li>
        <li>TASK_LAYOUT_HEADER_RIGHT_CLASSES: "{TASK_LAYOUT_HEADER_RIGHT_CLASSES}"</li>
        <li>TASK_LAYOUT_TITLE_CLASSES: "{TASK_LAYOUT_TITLE_CLASSES}"</li>
        <li>TASK_LAYOUT_TITLE_INPUT_CLASSES: "{TASK_LAYOUT_TITLE_INPUT_CLASSES}"</li>
        <li>TASK_LAYOUT_EDIT_TITLE_BUTTON_CLASSES: "{TASK_LAYOUT_EDIT_TITLE_BUTTON_CLASSES}"</li>
        <li>TASK_LAYOUT_BRANCH_CLASSES: "{TASK_LAYOUT_BRANCH_CLASSES}"</li>
        <li>TASK_LAYOUT_TABS_CLASSES: "{TASK_LAYOUT_TABS_CLASSES}"</li>
        <li>TASK_LAYOUT_MAIN_CLASSES: "{TASK_LAYOUT_MAIN_CLASSES}"</li>
        <li>
          TASK_LAYOUT_MOBILE_STEPS_TOGGLE_CLASSES: "{TASK_LAYOUT_MOBILE_STEPS_TOGGLE_CLASSES}"
        </li>
        <li>TASK_LAYOUT_MOBILE_STEPS_PANEL_CLASSES: "{TASK_LAYOUT_MOBILE_STEPS_PANEL_CLASSES}"</li>
        <li>
          TASK_LAYOUT_DESKTOP_STEPS_PANEL_CLASSES: "{TASK_LAYOUT_DESKTOP_STEPS_PANEL_CLASSES}"
        </li>
        <li>TASK_LAYOUT_MAIN_PANEL_CLASSES: "{TASK_LAYOUT_MAIN_PANEL_CLASSES}"</li>
        <li>TASK_LAYOUT_TAB_CONTENT_CLASSES: "{TASK_LAYOUT_TAB_CONTENT_CLASSES}"</li>
        <li>TASK_LAYOUT_ICON_BUTTON_CLASSES: "{TASK_LAYOUT_ICON_BUTTON_CLASSES}"</li>
      </ul>

      <h3 className="mb-2 mt-6 font-semibold">Size Classes</h3>
      <ul className="list-disc pl-6 space-y-1">
        <li>
          TASK_LAYOUT_SIZE_CLASSES.sm.headerPadding: "{TASK_LAYOUT_SIZE_CLASSES.sm.headerPadding}"
        </li>
        <li>
          TASK_LAYOUT_SIZE_CLASSES.md.headerPadding: "{TASK_LAYOUT_SIZE_CLASSES.md.headerPadding}"
        </li>
        <li>
          TASK_LAYOUT_SIZE_CLASSES.lg.headerPadding: "{TASK_LAYOUT_SIZE_CLASSES.lg.headerPadding}"
        </li>
        <li>
          TASK_LAYOUT_SIZE_CLASSES.sm.stepsPanelWidth: "
          {TASK_LAYOUT_SIZE_CLASSES.sm.stepsPanelWidth}"
        </li>
        <li>
          TASK_LAYOUT_SIZE_CLASSES.md.stepsPanelWidth: "
          {TASK_LAYOUT_SIZE_CLASSES.md.stepsPanelWidth}"
        </li>
        <li>
          TASK_LAYOUT_SIZE_CLASSES.lg.stepsPanelWidth: "
          {TASK_LAYOUT_SIZE_CLASSES.lg.stepsPanelWidth}"
        </li>
      </ul>

      <h3 className="mb-2 mt-6 font-semibold">Utility Functions</h3>
      <ul className="list-disc pl-6 space-y-1">
        <li>getBaseSize(undefined) → "{getBaseSize(undefined)}"</li>
        <li>getBaseSize('lg') → "{getBaseSize('lg')}"</li>
        <li>
          getBaseSize({'{base: "sm", lg: "lg"}'}) → "{getBaseSize({ base: 'sm', lg: 'lg' })}"
        </li>
        <li>
          getResponsiveSizeClasses('md', 'headerPadding') → "
          {getResponsiveSizeClasses('md', 'headerPadding')}"
        </li>
        <li>
          getResponsiveSizeClasses('lg', 'stepsPanelWidth') → "
          {getResponsiveSizeClasses('lg', 'stepsPanelWidth')}"
        </li>
        <li>getCurrentBranch(mockChats) → "{getCurrentBranch(mockChats)}"</li>
        <li>getCurrentBranch([]) → "{getCurrentBranch([]) ?? 'null'}"</li>
        <li>
          buildTaskHeaderAccessibleLabel('Task', 'inprogress' as TaskStatusType, 2) → "
          {buildTaskHeaderAccessibleLabel('Task', TaskStatus.Inprogress, 2)}"
        </li>
        <li>buildStepsPanelAnnouncement(true) → "{buildStepsPanelAnnouncement(true)}"</li>
        <li>buildStepsPanelAnnouncement(false) → "{buildStepsPanelAnnouncement(false)}"</li>
        <li>buildTabChangeAnnouncement('Steps') → "{buildTabChangeAnnouncement('Steps')}"</li>
        <li>
          buildStatusChangeAnnouncement('done' as TaskStatusType) → "
          {buildStatusChangeAnnouncement(TaskStatus.Done)}"
        </li>
        <li>getStepsPanelId('prefix') → "{getStepsPanelId('prefix')}"</li>
        <li>getMainPanelId('prefix') → "{getMainPanelId('prefix')}"</li>
      </ul>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Reference of all exported constants and utility functions for testing and reuse.',
      },
    },
  },
};

/**
 * Type exports reference (documentation only)
 */
export const TypeExports: Story = {
  render: () => (
    <div className="p-6 font-mono text-sm">
      <h2 className="mb-4 text-lg font-bold">Type Exports</h2>
      <p className="mb-4 text-[rgb(var(--muted-foreground))]">
        The following types are exported from TaskLayout:
      </p>
      <ul className="list-disc pl-6 space-y-2">
        <li>
          <strong>TaskLayoutSize</strong> = 'sm' | 'md' | 'lg'
        </li>
        <li>
          <strong>TaskLayoutBreakpoint</strong> = 'base' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
        </li>
        <li>
          <strong>TaskLayoutProps</strong> - Main component props interface
        </li>
        <li>
          <strong>TaskLayoutSkeletonProps</strong> - Skeleton loading component props
        </li>
      </ul>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Reference of all exported TypeScript types for use in consuming components.',
      },
    },
  },
};
