/**
 * ArchivePageComponents Stories
 *
 * Comprehensive Storybook stories demonstrating:
 * - All component variants and states
 * - Loading, empty, and error states
 * - Accessibility features (ARIA, keyboard navigation, screen reader)
 * - Responsive sizing
 * - Real-world usage examples
 */

import type { Chat, Project, Task } from '@openflow/generated';
import { ChatRole, TaskStatus } from '@openflow/generated';
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import {
  ARCHIVE_ITEM_BASE_CLASSES,
  ARCHIVE_ITEM_SIZE_CLASSES,
  ARCHIVE_LAYOUT_CLASSES,
  // Constants
  ARCHIVE_TABS,
  ARCHIVE_TAB_BAR_CLASSES,
  ARCHIVE_TAB_BASE_CLASSES,
  ARCHIVE_TAB_CONTAINER_CLASSES,
  ArchiveContent,
  ArchiveHeader,
  ArchiveLayout,
  type ArchiveTab,
  ArchiveTabBar,
  ArchivedChatItem,
  ArchivedProjectItem,
  ArchivedTaskItem,
  DEFAULT_BACK_LABEL,
  DEFAULT_ITEM_SIZE,
  getArchiveSubtitle,
  getBaseSize,
  getEntityName,
  getResponsiveSizeClasses,
  getRestoreAnnouncement,
  getSelectedAnnouncement,
  getTabChangeAnnouncement,
  // Utility functions
  getTabLabel,
} from './ArchivePageComponents';

const meta: Meta = {
  title: 'Organisms/ArchivePageComponents',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
Archive page components for displaying and managing archived tasks, chats, and projects.

## Features
- **ARIA tablist pattern** for accessible tab navigation
- **Proper list semantics** with role="list" and role="listitem"
- **Screen reader announcements** for state changes
- **Touch targets ≥44px** for all interactive elements (WCAG 2.5.5)
- **Focus ring with offset** for visibility on all backgrounds
- **motion-safe transitions** for reduced motion support
- **Loading, empty, and error states** with accessibility
- **forwardRef support** for all item components

## Keyboard Navigation
- **Arrow Left/Right**: Navigate between tabs
- **Home**: Jump to first tab
- **End**: Jump to last tab
- **Tab**: Move between focusable elements
- **Enter/Space**: Activate tab or button
        `,
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-[rgb(var(--background))]">
        <Story />
      </div>
    ),
  ],
};

export default meta;

// ============================================================================
// Mock Data
// ============================================================================

const mockTask: Task = {
  id: 'task-1',
  projectId: 'proj-1',
  title: 'Implement user authentication',
  description: 'Add OAuth2 support for user login',
  status: TaskStatus.Todo,
  actionsRequiredCount: 0,
  autoStartNextStep: false,
  archivedAt: '2024-01-15T10:00:00Z',
  createdAt: '2024-01-10T10:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z',
};

const mockTask2: Task = {
  id: 'task-2',
  projectId: 'proj-1',
  title: 'Add dark mode support',
  description: 'Implement theme switching',
  status: TaskStatus.Done,
  actionsRequiredCount: 0,
  autoStartNextStep: false,
  archivedAt: '2024-01-14T09:30:00Z',
  createdAt: '2024-01-08T10:00:00Z',
  updatedAt: '2024-01-14T09:30:00Z',
};

const mockTask3: Task = {
  id: 'task-3',
  projectId: 'proj-2',
  title: 'Refactor API endpoints',
  description: 'Improve REST API structure',
  status: TaskStatus.Inprogress,
  actionsRequiredCount: 2,
  autoStartNextStep: true,
  archivedAt: '2024-01-13T14:00:00Z',
  createdAt: '2024-01-05T10:00:00Z',
  updatedAt: '2024-01-13T14:00:00Z',
};

const mockChat: Chat = {
  id: 'chat-1',
  projectId: 'proj-1',
  title: 'Authentication discussion',
  taskId: 'task-1',
  chatRole: ChatRole.Main,
  baseBranch: 'main',
  worktreeDeleted: false,
  isPlanContainer: false,
  archivedAt: '2024-01-15T10:00:00Z',
  createdAt: '2024-01-10T10:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z',
};

const mockChat2: Chat = {
  id: 'chat-2',
  projectId: 'proj-1',
  title: 'Code review session',
  taskId: undefined,
  chatRole: ChatRole.Review,
  baseBranch: 'develop',
  worktreeDeleted: false,
  isPlanContainer: true,
  archivedAt: '2024-01-14T11:00:00Z',
  createdAt: '2024-01-09T10:00:00Z',
  updatedAt: '2024-01-14T11:00:00Z',
};

const mockProject: Project = {
  id: 'proj-1',
  name: 'OpenFlow',
  icon: '📦',
  gitRepoPath: '/Users/dev/projects/openflow',
  baseBranch: 'main',
  workflowsFolder: '.workflows',
  setupScript: '',
  devScript: '',
  archivedAt: '2024-01-15T10:00:00Z',
  createdAt: '2024-01-10T10:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z',
};

const mockProject2: Project = {
  id: 'proj-2',
  name: 'AI Assistant',
  icon: '🤖',
  gitRepoPath: '/Users/dev/projects/ai-assistant',
  baseBranch: 'main',
  workflowsFolder: '.workflows',
  setupScript: 'npm install',
  devScript: 'npm run dev',
  archivedAt: '2024-01-12T16:00:00Z',
  createdAt: '2024-01-01T10:00:00Z',
  updatedAt: '2024-01-12T16:00:00Z',
};

// Helper functions
const getProjectName = (projectId: string) => {
  const projects: Record<string, string> = {
    'proj-1': 'OpenFlow',
    'proj-2': 'AI Assistant',
  };
  return projects[projectId] || 'Unknown Project';
};

const getTaskTitle = (taskId: string | null | undefined) => {
  if (!taskId) return null;
  const tasks: Record<string, string> = {
    'task-1': 'Implement user authentication',
    'task-2': 'Add dark mode support',
    'task-3': 'Refactor API endpoints',
  };
  return tasks[taskId] || null;
};

const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return 'Unknown';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

// ============================================================================
// Layout Stories
// ============================================================================

export const Layout: StoryObj<typeof ArchiveLayout> = {
  render: () => (
    <ArchiveLayout
      header={
        <div className="h-14 bg-[rgb(var(--card))] border-b border-[rgb(var(--border))] flex items-center px-6">
          <span className="font-semibold">Archive Header</span>
        </div>
      }
    >
      <div className="p-8 text-center text-[rgb(var(--muted-foreground))]">
        Archive content area
      </div>
    </ArchiveLayout>
  ),
};

// ============================================================================
// Header Stories
// ============================================================================

export const Header: StoryObj<typeof ArchiveHeader> = {
  render: () => (
    <ArchiveHeader archivedCount={15} activeTab="tasks" onSearch={() => console.log('Search')} />
  ),
};

export const HeaderWithSingleItem: StoryObj<typeof ArchiveHeader> = {
  render: () => (
    <ArchiveHeader archivedCount={1} activeTab="tasks" onSearch={() => console.log('Search')} />
  ),
};

export const HeaderWithChats: StoryObj<typeof ArchiveHeader> = {
  render: () => (
    <ArchiveHeader archivedCount={8} activeTab="chats" onSearch={() => console.log('Search')} />
  ),
};

export const HeaderWithProjects: StoryObj<typeof ArchiveHeader> = {
  render: () => (
    <ArchiveHeader archivedCount={3} activeTab="projects" onSearch={() => console.log('Search')} />
  ),
};

// ============================================================================
// TabBar Stories
// ============================================================================

export const TabBar: StoryObj<typeof ArchiveTabBar> = {
  render: () => (
    <ArchiveTabBar
      activeTab="tasks"
      onTabChange={(tab) => console.log('Tab:', tab)}
      taskCount={5}
      chatCount={3}
      projectCount={2}
      onBack={() => console.log('Back')}
      data-testid="archive-tabbar"
    />
  ),
};

export const TabBarChatsActive: StoryObj<typeof ArchiveTabBar> = {
  render: () => (
    <ArchiveTabBar
      activeTab="chats"
      onTabChange={(tab) => console.log('Tab:', tab)}
      taskCount={5}
      chatCount={3}
      projectCount={2}
      onBack={() => console.log('Back')}
    />
  ),
};

export const TabBarProjectsActive: StoryObj<typeof ArchiveTabBar> = {
  render: () => (
    <ArchiveTabBar
      activeTab="projects"
      onTabChange={(tab) => console.log('Tab:', tab)}
      taskCount={5}
      chatCount={3}
      projectCount={2}
      onBack={() => console.log('Back')}
    />
  ),
};

export const TabBarInteractive: StoryObj<typeof ArchiveTabBar> = {
  render: () => {
    const [activeTab, setActiveTab] = useState<ArchiveTab>('tasks');
    return (
      <ArchiveTabBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        taskCount={5}
        chatCount={3}
        projectCount={2}
        onBack={() => console.log('Back')}
        data-testid="interactive-tabbar"
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Interactive tab bar with keyboard navigation. Try using Arrow Left/Right, Home, and End keys.',
      },
    },
  },
};

// ============================================================================
// Item Stories
// ============================================================================

export const TaskItem: StoryObj<typeof ArchivedTaskItem> = {
  render: () => (
    <div className="p-4">
      <ArchivedTaskItem
        task={mockTask}
        isSelected={false}
        isRestoring={false}
        projectName="OpenFlow"
        archivedDate="Jan 15, 2024"
        onSelect={() => console.log('Select')}
        onRestore={() => console.log('Restore')}
        onDelete={() => console.log('Delete')}
        data-testid="task-item"
      />
    </div>
  ),
};

export const TaskItemSelected: StoryObj<typeof ArchivedTaskItem> = {
  render: () => (
    <div className="p-4">
      <ArchivedTaskItem
        task={mockTask}
        isSelected={true}
        isRestoring={false}
        projectName="OpenFlow"
        archivedDate="Jan 15, 2024"
        onSelect={() => console.log('Select')}
        onRestore={() => console.log('Restore')}
        onDelete={() => console.log('Delete')}
      />
    </div>
  ),
};

export const TaskItemRestoring: StoryObj<typeof ArchivedTaskItem> = {
  render: () => (
    <div className="p-4">
      <ArchivedTaskItem
        task={mockTask}
        isSelected={true}
        isRestoring={true}
        projectName="OpenFlow"
        archivedDate="Jan 15, 2024"
        onSelect={() => console.log('Select')}
        onRestore={() => console.log('Restore')}
        onDelete={() => console.log('Delete')}
      />
    </div>
  ),
};

export const ChatItem: StoryObj<typeof ArchivedChatItem> = {
  render: () => (
    <div className="p-4">
      <ArchivedChatItem
        chat={mockChat}
        isSelected={false}
        isRestoring={false}
        projectName="OpenFlow"
        taskTitle="Implement user authentication"
        archivedDate="Jan 15, 2024"
        onSelect={() => console.log('Select')}
        onRestore={() => console.log('Restore')}
        onDelete={() => console.log('Delete')}
        data-testid="chat-item"
      />
    </div>
  ),
};

export const ChatItemWithoutTask: StoryObj<typeof ArchivedChatItem> = {
  render: () => (
    <div className="p-4">
      <ArchivedChatItem
        chat={mockChat2}
        isSelected={false}
        isRestoring={false}
        projectName="OpenFlow"
        taskTitle={null}
        archivedDate="Jan 14, 2024"
        onSelect={() => console.log('Select')}
        onRestore={() => console.log('Restore')}
        onDelete={() => console.log('Delete')}
      />
    </div>
  ),
};

export const ProjectItem: StoryObj<typeof ArchivedProjectItem> = {
  render: () => (
    <div className="p-4">
      <ArchivedProjectItem
        project={mockProject}
        isSelected={false}
        isRestoring={false}
        archivedDate="Jan 15, 2024"
        onSelect={() => console.log('Select')}
        onRestore={() => console.log('Restore')}
        onDelete={() => console.log('Delete')}
        data-testid="project-item"
      />
    </div>
  ),
};

export const ProjectItemWithLongPath: StoryObj<typeof ArchivedProjectItem> = {
  render: () => (
    <div className="p-4">
      <ArchivedProjectItem
        project={{
          ...mockProject,
          gitRepoPath:
            '/Users/developer/Documents/work/clients/acme-corp/projects/openflow-enterprise',
        }}
        isSelected={false}
        isRestoring={false}
        archivedDate="Jan 15, 2024"
        onSelect={() => console.log('Select')}
        onRestore={() => console.log('Restore')}
        onDelete={() => console.log('Delete')}
      />
    </div>
  ),
};

// ============================================================================
// Content Stories
// ============================================================================

export const ContentWithTasks: StoryObj<typeof ArchiveContent> = {
  render: () => (
    <div className="h-[600px]">
      <ArchiveContent
        activeTab="tasks"
        isLoading={false}
        archivedTasks={[mockTask, mockTask2, mockTask3]}
        selectedTask={null}
        isRestoringTask={false}
        archivedChats={[mockChat, mockChat2]}
        selectedChat={null}
        isRestoringChat={false}
        archivedProjects={[mockProject, mockProject2]}
        selectedProject={null}
        isRestoringProject={false}
        getProjectName={getProjectName}
        getTaskTitle={getTaskTitle}
        formatDate={formatDate}
        onSelectTask={() => {}}
        onSelectChat={() => {}}
        onSelectProject={() => {}}
        onRestoreTask={() => console.log('Restore task')}
        onRestoreChat={() => console.log('Restore chat')}
        onRestoreProject={() => console.log('Restore project')}
        onDeleteTask={() => console.log('Delete task')}
        onDeleteChat={() => console.log('Delete chat')}
        onDeleteProject={() => console.log('Delete project')}
        data-testid="archive-content"
      />
    </div>
  ),
};

export const ContentWithChats: StoryObj<typeof ArchiveContent> = {
  render: () => (
    <div className="h-[600px]">
      <ArchiveContent
        activeTab="chats"
        isLoading={false}
        archivedTasks={[mockTask]}
        selectedTask={null}
        isRestoringTask={false}
        archivedChats={[mockChat, mockChat2]}
        selectedChat={null}
        isRestoringChat={false}
        archivedProjects={[mockProject]}
        selectedProject={null}
        isRestoringProject={false}
        getProjectName={getProjectName}
        getTaskTitle={getTaskTitle}
        formatDate={formatDate}
        onSelectTask={() => {}}
        onSelectChat={() => {}}
        onSelectProject={() => {}}
        onRestoreTask={() => {}}
        onRestoreChat={() => {}}
        onRestoreProject={() => {}}
        onDeleteTask={() => {}}
        onDeleteChat={() => {}}
        onDeleteProject={() => {}}
      />
    </div>
  ),
};

export const ContentWithProjects: StoryObj<typeof ArchiveContent> = {
  render: () => (
    <div className="h-[600px]">
      <ArchiveContent
        activeTab="projects"
        isLoading={false}
        archivedTasks={[mockTask]}
        selectedTask={null}
        isRestoringTask={false}
        archivedChats={[mockChat]}
        selectedChat={null}
        isRestoringChat={false}
        archivedProjects={[mockProject, mockProject2]}
        selectedProject={null}
        isRestoringProject={false}
        getProjectName={getProjectName}
        getTaskTitle={getTaskTitle}
        formatDate={formatDate}
        onSelectTask={() => {}}
        onSelectChat={() => {}}
        onSelectProject={() => {}}
        onRestoreTask={() => {}}
        onRestoreChat={() => {}}
        onRestoreProject={() => {}}
        onDeleteTask={() => {}}
        onDeleteChat={() => {}}
        onDeleteProject={() => {}}
      />
    </div>
  ),
};

export const ContentEmpty: StoryObj<typeof ArchiveContent> = {
  render: () => (
    <div className="h-[600px]">
      <ArchiveContent
        activeTab="tasks"
        isLoading={false}
        archivedTasks={[]}
        selectedTask={null}
        isRestoringTask={false}
        archivedChats={[]}
        selectedChat={null}
        isRestoringChat={false}
        archivedProjects={[]}
        selectedProject={null}
        isRestoringProject={false}
        getProjectName={() => ''}
        getTaskTitle={() => null}
        formatDate={() => ''}
        onSelectTask={() => {}}
        onSelectChat={() => {}}
        onSelectProject={() => {}}
        onRestoreTask={() => {}}
        onRestoreChat={() => {}}
        onRestoreProject={() => {}}
        onDeleteTask={() => {}}
        onDeleteChat={() => {}}
        onDeleteProject={() => {}}
      />
    </div>
  ),
};

export const ContentLoading: StoryObj<typeof ArchiveContent> = {
  render: () => (
    <div className="h-[600px]">
      <ArchiveContent
        activeTab="tasks"
        isLoading={true}
        archivedTasks={[]}
        selectedTask={null}
        isRestoringTask={false}
        archivedChats={[]}
        selectedChat={null}
        isRestoringChat={false}
        archivedProjects={[]}
        selectedProject={null}
        isRestoringProject={false}
        getProjectName={() => ''}
        getTaskTitle={() => null}
        formatDate={() => ''}
        onSelectTask={() => {}}
        onSelectChat={() => {}}
        onSelectProject={() => {}}
        onRestoreTask={() => {}}
        onRestoreChat={() => {}}
        onRestoreProject={() => {}}
        onDeleteTask={() => {}}
        onDeleteChat={() => {}}
        onDeleteProject={() => {}}
      />
    </div>
  ),
};

export const ContentError: StoryObj<typeof ArchiveContent> = {
  render: () => (
    <div className="h-[600px]">
      <ArchiveContent
        activeTab="tasks"
        isLoading={false}
        error={new Error('Failed to connect to the server. Please check your connection.')}
        onRetry={() => console.log('Retry')}
        archivedTasks={[]}
        selectedTask={null}
        isRestoringTask={false}
        archivedChats={[]}
        selectedChat={null}
        isRestoringChat={false}
        archivedProjects={[]}
        selectedProject={null}
        isRestoringProject={false}
        getProjectName={() => ''}
        getTaskTitle={() => null}
        formatDate={() => ''}
        onSelectTask={() => {}}
        onSelectChat={() => {}}
        onSelectProject={() => {}}
        onRestoreTask={() => {}}
        onRestoreChat={() => {}}
        onRestoreProject={() => {}}
        onDeleteTask={() => {}}
        onDeleteChat={() => {}}
        onDeleteProject={() => {}}
      />
    </div>
  ),
};

// ============================================================================
// Interactive Stories
// ============================================================================

export const FullPageInteractive: StoryObj = {
  render: () => {
    const [activeTab, setActiveTab] = useState<ArchiveTab>('tasks');
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);

    return (
      <ArchiveLayout
        header={
          <ArchiveHeader
            archivedCount={activeTab === 'tasks' ? 3 : activeTab === 'chats' ? 2 : 2}
            activeTab={activeTab}
            onSearch={() => console.log('Search')}
          />
        }
      >
        <ArchiveTabBar
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            setSelectedTask(null);
            setSelectedChat(null);
            setSelectedProject(null);
          }}
          taskCount={3}
          chatCount={2}
          projectCount={2}
          onBack={() => console.log('Back to Dashboard')}
        />
        <ArchiveContent
          activeTab={activeTab}
          isLoading={false}
          archivedTasks={[mockTask, mockTask2, mockTask3]}
          selectedTask={selectedTask}
          isRestoringTask={false}
          archivedChats={[mockChat, mockChat2]}
          selectedChat={selectedChat}
          isRestoringChat={false}
          archivedProjects={[mockProject, mockProject2]}
          selectedProject={selectedProject}
          isRestoringProject={false}
          getProjectName={getProjectName}
          getTaskTitle={getTaskTitle}
          formatDate={formatDate}
          onSelectTask={setSelectedTask}
          onSelectChat={setSelectedChat}
          onSelectProject={setSelectedProject}
          onRestoreTask={(task) => console.log('Restore task:', task.title)}
          onRestoreChat={(chat) => console.log('Restore chat:', chat.title)}
          onRestoreProject={(project) => console.log('Restore project:', project.name)}
          onDeleteTask={(task) => console.log('Delete task:', task.title)}
          onDeleteChat={(chat) => console.log('Delete chat:', chat.title)}
          onDeleteProject={(project) => console.log('Delete project:', project.name)}
        />
      </ArchiveLayout>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Full interactive archive page with tab switching and item selection.',
      },
    },
  },
};

// ============================================================================
// Accessibility Stories
// ============================================================================

export const KeyboardNavigationDemo: StoryObj = {
  render: () => {
    const [activeTab, setActiveTab] = useState<ArchiveTab>('tasks');
    return (
      <div className="p-4 space-y-4">
        <div className="text-sm text-[rgb(var(--muted-foreground))]">
          <h3 className="font-semibold mb-2">Keyboard Navigation:</h3>
          <ul className="list-disc pl-4 space-y-1">
            <li>Tab to focus the tab bar</li>
            <li>Arrow Left/Right to navigate between tabs</li>
            <li>Home/End to jump to first/last tab</li>
            <li>Tab to focus archive items</li>
            <li>Enter/Space to select or activate buttons</li>
          </ul>
        </div>
        <ArchiveTabBar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          taskCount={3}
          chatCount={2}
          projectCount={1}
          onBack={() => {}}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates keyboard navigation within the tab bar using ARIA tablist pattern.',
      },
    },
  },
};

export const ScreenReaderAccessibility: StoryObj = {
  render: () => (
    <div className="p-4 space-y-4">
      <div className="text-sm text-[rgb(var(--muted-foreground))]">
        <h3 className="font-semibold mb-2">Screen Reader Features:</h3>
        <ul className="list-disc pl-4 space-y-1">
          <li>Tab change announcements</li>
          <li>Selection state announcements</li>
          <li>Accessible button labels include entity type and title</li>
          <li>Lists have proper aria-label</li>
          <li>Error states use role="alert"</li>
        </ul>
      </div>
      <div className="space-y-2">
        <ArchivedTaskItem
          task={mockTask}
          isSelected={true}
          isRestoring={false}
          projectName="OpenFlow"
          archivedDate="Jan 15, 2024"
          onSelect={() => {}}
          onRestore={() => {}}
          onDelete={() => {}}
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates screen reader accessibility features including announcements and ARIA labels.',
      },
    },
  },
};

export const TouchTargetAccessibility: StoryObj = {
  render: () => (
    <div className="p-4 space-y-4">
      <div className="text-sm text-[rgb(var(--muted-foreground))]">
        <h3 className="font-semibold mb-2">Touch Target Requirements (WCAG 2.5.5):</h3>
        <p>
          All interactive elements have a minimum touch target of 44x44 pixels on mobile devices.
        </p>
      </div>
      <ArchiveTabBar
        activeTab="tasks"
        onTabChange={() => {}}
        taskCount={3}
        chatCount={2}
        projectCount={1}
        onBack={() => {}}
      />
      <ArchivedTaskItem
        task={mockTask}
        isSelected={false}
        isRestoring={false}
        projectName="OpenFlow"
        archivedDate="Jan 15, 2024"
        onSelect={() => {}}
        onRestore={() => {}}
        onDelete={() => {}}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All interactive elements meet WCAG 2.5.5 touch target size requirements (≥44px).',
      },
    },
  },
};

export const FocusRingVisibility: StoryObj = {
  render: () => (
    <div className="p-4 space-y-4">
      <div className="text-sm text-[rgb(var(--muted-foreground))]">
        <h3 className="font-semibold mb-2">Focus Ring Visibility:</h3>
        <p>
          Focus rings use ring-offset to ensure visibility on all backgrounds. Tab through the
          elements to see the focus rings.
        </p>
      </div>
      <ArchiveTabBar
        activeTab="tasks"
        onTabChange={() => {}}
        taskCount={3}
        chatCount={2}
        projectCount={1}
        onBack={() => {}}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates focus ring visibility with ring-offset for all backgrounds.',
      },
    },
  },
};

// ============================================================================
// Constants Reference Story
// ============================================================================

export const ConstantsReference: StoryObj = {
  render: () => (
    <div className="p-4 space-y-6 text-sm">
      <h2 className="text-lg font-semibold">Exported Constants</h2>

      <section>
        <h3 className="font-medium mb-2">ARCHIVE_TABS</h3>
        <pre className="bg-[rgb(var(--muted))] p-2 rounded text-xs overflow-auto">
          {JSON.stringify(ARCHIVE_TABS, null, 2)}
        </pre>
      </section>

      <section>
        <h3 className="font-medium mb-2">DEFAULT_ITEM_SIZE</h3>
        <code className="bg-[rgb(var(--muted))] px-2 py-1 rounded">{DEFAULT_ITEM_SIZE}</code>
      </section>

      <section>
        <h3 className="font-medium mb-2">DEFAULT_BACK_LABEL</h3>
        <code className="bg-[rgb(var(--muted))] px-2 py-1 rounded">{DEFAULT_BACK_LABEL}</code>
      </section>

      <section>
        <h3 className="font-medium mb-2">ARCHIVE_ITEM_SIZE_CLASSES</h3>
        <pre className="bg-[rgb(var(--muted))] p-2 rounded text-xs overflow-auto">
          {JSON.stringify(ARCHIVE_ITEM_SIZE_CLASSES, null, 2)}
        </pre>
      </section>

      <section>
        <h3 className="font-medium mb-2">CSS Class Constants</h3>
        <div className="space-y-2">
          <div>
            <code className="text-xs">ARCHIVE_LAYOUT_CLASSES:</code>
            <pre className="bg-[rgb(var(--muted))] p-2 rounded text-xs mt-1">
              {ARCHIVE_LAYOUT_CLASSES}
            </pre>
          </div>
          <div>
            <code className="text-xs">ARCHIVE_TAB_BAR_CLASSES:</code>
            <pre className="bg-[rgb(var(--muted))] p-2 rounded text-xs mt-1">
              {ARCHIVE_TAB_BAR_CLASSES}
            </pre>
          </div>
          <div>
            <code className="text-xs">ARCHIVE_TAB_CONTAINER_CLASSES:</code>
            <pre className="bg-[rgb(var(--muted))] p-2 rounded text-xs mt-1">
              {ARCHIVE_TAB_CONTAINER_CLASSES}
            </pre>
          </div>
          <div>
            <code className="text-xs">ARCHIVE_TAB_BASE_CLASSES:</code>
            <pre className="bg-[rgb(var(--muted))] p-2 rounded text-xs mt-1 whitespace-pre-wrap">
              {ARCHIVE_TAB_BASE_CLASSES}
            </pre>
          </div>
          <div>
            <code className="text-xs">ARCHIVE_ITEM_BASE_CLASSES:</code>
            <pre className="bg-[rgb(var(--muted))] p-2 rounded text-xs mt-1 whitespace-pre-wrap">
              {ARCHIVE_ITEM_BASE_CLASSES}
            </pre>
          </div>
        </div>
      </section>

      <section>
        <h3 className="font-medium mb-2">Utility Functions</h3>
        <div className="space-y-2 text-xs">
          <div>
            <code>getTabLabel('tasks')</code> → <code>"{getTabLabel('tasks')}"</code>
          </div>
          <div>
            <code>getEntityName('tasks', 1)</code> → <code>"{getEntityName('tasks', 1)}"</code>
          </div>
          <div>
            <code>getEntityName('tasks', 5)</code> → <code>"{getEntityName('tasks', 5)}"</code>
          </div>
          <div>
            <code>getArchiveSubtitle(5, 'tasks')</code> →{' '}
            <code>"{getArchiveSubtitle(5, 'tasks')}"</code>
          </div>
          <div>
            <code>getBaseSize(undefined)</code> → <code>"{getBaseSize(undefined)}"</code>
          </div>
          <div>
            <code>getBaseSize('sm')</code> → <code>"{getBaseSize('sm')}"</code>
          </div>
          <div>
            <code>getBaseSize({'{base: "lg"}'} as any)</code> →{' '}
            <code>"{getBaseSize({ base: 'lg' })}"</code>
          </div>
          <div>
            <code>getResponsiveSizeClasses('md')</code> →{' '}
            <code>"{getResponsiveSizeClasses('md')}"</code>
          </div>
          <div>
            <code>getTabChangeAnnouncement('chats', 3)</code> →{' '}
            <code>"{getTabChangeAnnouncement('chats', 3)}"</code>
          </div>
          <div>
            <code>getRestoreAnnouncement('task', 'My Task')</code> →{' '}
            <code>"{getRestoreAnnouncement('task', 'My Task')}"</code>
          </div>
          <div>
            <code>getSelectedAnnouncement('task', 'My Task', true)</code> →{' '}
            <code>"{getSelectedAnnouncement('task', 'My Task', true)}"</code>
          </div>
        </div>
      </section>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Reference for all exported constants and utility functions.',
      },
    },
  },
};

// ============================================================================
// Real-World Examples
// ============================================================================

export const ArchivePageLoading: StoryObj = {
  render: () => (
    <ArchiveLayout
      header={<ArchiveHeader archivedCount={0} activeTab="tasks" onSearch={() => {}} />}
    >
      <ArchiveTabBar
        activeTab="tasks"
        onTabChange={() => {}}
        taskCount={0}
        chatCount={0}
        projectCount={0}
        onBack={() => {}}
      />
      <ArchiveContent
        activeTab="tasks"
        isLoading={true}
        archivedTasks={[]}
        selectedTask={null}
        isRestoringTask={false}
        archivedChats={[]}
        selectedChat={null}
        isRestoringChat={false}
        archivedProjects={[]}
        selectedProject={null}
        isRestoringProject={false}
        getProjectName={() => ''}
        getTaskTitle={() => null}
        formatDate={() => ''}
        onSelectTask={() => {}}
        onSelectChat={() => {}}
        onSelectProject={() => {}}
        onRestoreTask={() => {}}
        onRestoreChat={() => {}}
        onRestoreProject={() => {}}
        onDeleteTask={() => {}}
        onDeleteChat={() => {}}
        onDeleteProject={() => {}}
      />
    </ArchiveLayout>
  ),
};

export const ArchivePageError: StoryObj = {
  render: () => (
    <ArchiveLayout
      header={<ArchiveHeader archivedCount={0} activeTab="tasks" onSearch={() => {}} />}
    >
      <ArchiveTabBar
        activeTab="tasks"
        onTabChange={() => {}}
        taskCount={0}
        chatCount={0}
        projectCount={0}
        onBack={() => {}}
      />
      <ArchiveContent
        activeTab="tasks"
        isLoading={false}
        error={new Error('Network error: Unable to load archived items')}
        onRetry={() => console.log('Retry clicked')}
        archivedTasks={[]}
        selectedTask={null}
        isRestoringTask={false}
        archivedChats={[]}
        selectedChat={null}
        isRestoringChat={false}
        archivedProjects={[]}
        selectedProject={null}
        isRestoringProject={false}
        getProjectName={() => ''}
        getTaskTitle={() => null}
        formatDate={() => ''}
        onSelectTask={() => {}}
        onSelectChat={() => {}}
        onSelectProject={() => {}}
        onRestoreTask={() => {}}
        onRestoreChat={() => {}}
        onRestoreProject={() => {}}
        onDeleteTask={() => {}}
        onDeleteChat={() => {}}
        onDeleteProject={() => {}}
      />
    </ArchiveLayout>
  ),
};

export const ArchivePageEmpty: StoryObj = {
  render: () => (
    <ArchiveLayout
      header={<ArchiveHeader archivedCount={0} activeTab="tasks" onSearch={() => {}} />}
    >
      <ArchiveTabBar
        activeTab="tasks"
        onTabChange={() => {}}
        taskCount={0}
        chatCount={0}
        projectCount={0}
        onBack={() => {}}
      />
      <ArchiveContent
        activeTab="tasks"
        isLoading={false}
        archivedTasks={[]}
        selectedTask={null}
        isRestoringTask={false}
        archivedChats={[]}
        selectedChat={null}
        isRestoringChat={false}
        archivedProjects={[]}
        selectedProject={null}
        isRestoringProject={false}
        getProjectName={() => ''}
        getTaskTitle={() => null}
        formatDate={() => ''}
        onSelectTask={() => {}}
        onSelectChat={() => {}}
        onSelectProject={() => {}}
        onRestoreTask={() => {}}
        onRestoreChat={() => {}}
        onRestoreProject={() => {}}
        onDeleteTask={() => {}}
        onDeleteChat={() => {}}
        onDeleteProject={() => {}}
      />
    </ArchiveLayout>
  ),
};
