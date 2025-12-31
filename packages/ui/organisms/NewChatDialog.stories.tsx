import type { ExecutorProfile, Project } from '@openflow/generated';
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Button } from '../atoms/Button';
import { NewChatDialog } from './NewChatDialog';

const meta: Meta<typeof NewChatDialog> = {
  title: 'Organisms/NewChatDialog',
  component: NewChatDialog,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof NewChatDialog>;

// Mock data
const mockProjects: Project[] = [
  {
    id: 'project-1',
    name: 'OpenFlow',
    gitRepoPath: '/Users/dev/openflow',
    baseBranch: 'main',
    setupScript: 'pnpm install',
    devScript: 'pnpm dev',
    icon: 'folder-code',
    workflowsFolder: '.openflow/workflows',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'project-2',
    name: 'My App',
    gitRepoPath: '/Users/dev/my-app',
    baseBranch: 'main',
    setupScript: 'npm install',
    devScript: 'npm run dev',
    icon: 'folder-git',
    workflowsFolder: '.openflow/workflows',
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
  },
  {
    id: 'project-3',
    name: 'Backend API',
    gitRepoPath: '/Users/dev/backend',
    baseBranch: 'develop',
    setupScript: 'cargo build',
    devScript: 'cargo run',
    icon: 'folder',
    workflowsFolder: '.openflow/workflows',
    createdAt: '2024-01-03T00:00:00Z',
    updatedAt: '2024-01-03T00:00:00Z',
  },
];

const mockExecutorProfiles: ExecutorProfile[] = [
  {
    id: 'claude-code',
    name: 'Claude Code',
    description: 'Anthropic Claude Code CLI',
    command: 'claude',
    isDefault: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'gemini-cli',
    name: 'Gemini CLI',
    description: 'Google Gemini CLI',
    command: 'gemini',
    isDefault: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'codex-cli',
    name: 'Codex CLI',
    description: 'OpenAI Codex CLI',
    command: 'codex',
    isDefault: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

// Interactive wrapper for stories
function InteractiveDialog(props: Partial<React.ComponentProps<typeof NewChatDialog>>) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div>
      <Button onClick={() => setIsOpen(true)}>Open Dialog</Button>
      <NewChatDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        projects={mockProjects}
        executorProfiles={mockExecutorProfiles}
        onCreate={(data) => {
          console.log('Create chat:', data);
          setIsOpen(false);
        }}
        onNewProject={() => console.log('New project requested')}
        {...props}
      />
    </div>
  );
}

/**
 * Default state with project selection required.
 */
export const Default: Story = {
  render: () => <InteractiveDialog />,
};

/**
 * With a pre-selected project (project selector hidden).
 */
export const WithPreselectedProject: Story = {
  render: () => <InteractiveDialog selectedProjectId="project-1" />,
};

/**
 * In submitting/loading state.
 */
export const Submitting: Story = {
  render: () => <InteractiveDialog isSubmitting />,
};

/**
 * With no executor profiles configured.
 */
export const NoExecutorProfiles: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(true);
    return (
      <div>
        <Button onClick={() => setIsOpen(true)}>Open Dialog</Button>
        <NewChatDialog
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          projects={mockProjects}
          executorProfiles={[]}
          selectedProjectId="project-1"
          onCreate={(data) => {
            console.log('Create chat:', data);
            setIsOpen(false);
          }}
        />
      </div>
    );
  },
};

/**
 * With a single project (still shows project info).
 */
const firstProject = mockProjects[0] as Project;

export const SingleProject: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(true);
    return (
      <div>
        <Button onClick={() => setIsOpen(true)}>Open Dialog</Button>
        <NewChatDialog
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          projects={[firstProject]}
          executorProfiles={mockExecutorProfiles}
          selectedProjectId="project-1"
          onCreate={(data) => {
            console.log('Create chat:', data);
            setIsOpen(false);
          }}
        />
      </div>
    );
  },
};

/**
 * With no projects available.
 */
export const NoProjects: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(true);
    return (
      <div>
        <Button onClick={() => setIsOpen(true)}>Open Dialog</Button>
        <NewChatDialog
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          projects={[]}
          executorProfiles={mockExecutorProfiles}
          onCreate={(data) => {
            console.log('Create chat:', data);
            setIsOpen(false);
          }}
          onNewProject={() => console.log('New project requested')}
        />
      </div>
    );
  },
};
