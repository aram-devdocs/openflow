import type {
  Chat,
  Commit,
  FileDiff as FileDiffType,
  Message,
  Task,
  WorkflowStep,
} from '@openflow/generated';
import { ChatRole, MessageRole, TaskStatus, WorkflowStepStatus } from '@openflow/generated';
import type { Meta, StoryObj } from '@storybook/react';
import { FileDiff, GitCommit, ListTodo, Send } from 'lucide-react';
import { Button } from '../atoms/Button';
import { Icon } from '../atoms/Icon';
import type { Tab } from '../molecules/Tabs';
import { CommitList } from '../organisms/CommitList';
import { DiffViewer } from '../organisms/DiffViewer';
import { StepsPanel } from '../organisms/StepsPanel';
import { TaskLayout } from './TaskLayout';

const meta: Meta<typeof TaskLayout> = {
  title: 'Templates/TaskLayout',
  component: TaskLayout,
  parameters: {
    layout: 'fullscreen',
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

// Mock data
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

// Simple chat input component for stories
function SimpleChatInput({ onSend }: { onSend?: (message: string) => void }) {
  return (
    <div className="flex items-center gap-2 border-t border-[rgb(var(--border))] p-4 bg-[rgb(var(--background))]">
      <input
        type="text"
        placeholder="Type a message..."
        className="flex-1 rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--background))] px-3 py-2 text-sm"
      />
      <Button variant="primary" size="sm" onClick={() => onSend?.('message')}>
        <Icon icon={Send} size="sm" />
      </Button>
    </div>
  );
}

// Simple chat display for stories
function SimpleChatDisplay({ messages }: { messages: Message[] }) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
};

/**
 * Loading state
 */
export const Loading: Story = {
  args: {
    ...Default.args,
    isLoading: true,
  },
};

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
    onTabChange: (tab) => console.log('Tab change:', tab),
    // No onStatusChange, onTitleEditToggle, onCreatePR, etc.
  },
};

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
