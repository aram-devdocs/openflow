import type { ExecutorProfile, Project } from '@openflow/generated';
import type { Meta, StoryObj } from '@storybook/react';
import { useRef, useState } from 'react';
import { Button } from '../atoms/Button';
import {
  BUTTON_RESPONSIVE_CLASSES,
  DEFAULT_AGENT_HELPER_CLASSES,
  DEFAULT_AGENT_LABEL,
  DEFAULT_AGENT_PLACEHOLDER,
  DEFAULT_CANCEL_LABEL,
  DEFAULT_CREATE_LABEL,
  // Constants (used in ConstantsReference story)
  DEFAULT_DIALOG_TITLE,
  DEFAULT_LOADING_TEXT,
  DEFAULT_NO_AGENTS_MESSAGE,
  DEFAULT_OPTIONAL_TEXT,
  DEFAULT_PROJECT_LABEL,
  DEFAULT_PROJECT_PLACEHOLDER,
  DEFAULT_TITLE_LABEL,
  DEFAULT_TITLE_PLACEHOLDER,
  FOOTER_LAYOUT_CLASSES,
  FORM_FIELD_CONTAINER_CLASSES,
  FORM_FIELD_GAP_CLASSES,
  LABEL_SIZE_MAP,
  MAX_TITLE_LENGTH,
  NO_AGENTS_CONTAINER_CLASSES,
  NewChatDialog,
  PROJECT_INFO_CONTAINER_CLASSES,
  SIZE_TO_DIALOG_SIZE,
  SR_DEFAULT_AGENT_MESSAGE,
  SR_DIALOG_OPENED,
  SR_SUBMITTING,
  SR_VALIDATION_ERROR,
} from './NewChatDialog';

const meta: Meta<typeof NewChatDialog> = {
  title: 'Organisms/NewChatDialog',
  component: NewChatDialog,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Dialog for creating a new standalone chat.
Stateless - receives all data via props, emits actions via callbacks.

## Accessibility Features
- Inherits Dialog focus trap, escape key handling, and ARIA attributes
- Form fields properly labeled with htmlFor associations
- Screen reader announcements for validation and submission states
- Keyboard navigation (Enter to submit when valid)
- Touch targets ≥44px via Dialog molecule
- Loading state announced to screen readers

## Responsive Layout
- Footer buttons stack vertically on mobile
- Form field gaps adjust by size
- Dialog size responds to breakpoints

## Form Behavior
- Project selection is required (validation error shown on submit attempt)
- Agent selection is optional (shows default if not selected)
- Title is optional
- Form resets when dialog opens
        `,
      },
    },
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

// ============================================================================
// Basic Examples
// ============================================================================

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

// ============================================================================
// Size Variants
// ============================================================================

/**
 * Small size dialog.
 */
export const SizeSmall: Story = {
  render: () => <InteractiveDialog size="sm" />,
};

/**
 * Medium size dialog (default).
 */
export const SizeMedium: Story = {
  render: () => <InteractiveDialog size="md" />,
};

/**
 * Large size dialog.
 */
export const SizeLarge: Story = {
  render: () => <InteractiveDialog size="lg" />,
};

/**
 * All sizes comparison.
 */
export const AllSizes: Story = {
  render: () => {
    const [openDialog, setOpenDialog] = useState<'sm' | 'md' | 'lg' | null>(null);

    return (
      <div className="flex flex-col gap-4">
        <Button onClick={() => setOpenDialog('sm')}>Open Small</Button>
        <Button onClick={() => setOpenDialog('md')}>Open Medium</Button>
        <Button onClick={() => setOpenDialog('lg')}>Open Large</Button>

        <NewChatDialog
          isOpen={openDialog === 'sm'}
          onClose={() => setOpenDialog(null)}
          projects={mockProjects}
          executorProfiles={mockExecutorProfiles}
          onCreate={(data) => {
            console.log('Create chat:', data);
            setOpenDialog(null);
          }}
          size="sm"
        />
        <NewChatDialog
          isOpen={openDialog === 'md'}
          onClose={() => setOpenDialog(null)}
          projects={mockProjects}
          executorProfiles={mockExecutorProfiles}
          onCreate={(data) => {
            console.log('Create chat:', data);
            setOpenDialog(null);
          }}
          size="md"
        />
        <NewChatDialog
          isOpen={openDialog === 'lg'}
          onClose={() => setOpenDialog(null)}
          projects={mockProjects}
          executorProfiles={mockExecutorProfiles}
          onCreate={(data) => {
            console.log('Create chat:', data);
            setOpenDialog(null);
          }}
          size="lg"
        />
      </div>
    );
  },
};

/**
 * Responsive sizing - small on mobile, large on desktop.
 */
export const ResponsiveSizing: Story = {
  render: () => <InteractiveDialog size={{ base: 'sm', md: 'md', lg: 'lg' }} />,
};

// ============================================================================
// Form States
// ============================================================================

/**
 * Shows validation error when trying to create without selecting a project.
 */
export const ValidationError: Story = {
  render: () => {
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
        />
        <p className="mt-4 text-sm text-muted-foreground">
          Click "Create Chat" without selecting a project to see the validation error.
        </p>
      </div>
    );
  },
};

/**
 * Interactive form state example.
 */
export const InteractiveForm: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(true);
    const [lastCreatedData, setLastCreatedData] = useState<{
      projectId: string;
      executorProfileId?: string;
      title?: string;
    } | null>(null);

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
            setLastCreatedData(data);
            setIsOpen(false);
          }}
          onNewProject={() => console.log('New project requested')}
        />
        {lastCreatedData && (
          <div className="mt-4 rounded border p-4">
            <h4 className="font-medium">Last created chat data:</h4>
            <pre className="mt-2 text-sm">{JSON.stringify(lastCreatedData, null, 2)}</pre>
          </div>
        )}
      </div>
    );
  },
};

// ============================================================================
// Accessibility Demos
// ============================================================================

/**
 * Keyboard navigation demo.
 */
export const KeyboardNavigation: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <InteractiveDialog data-testid="keyboard-demo" />
      <div className="rounded border border-border bg-muted p-4">
        <h4 className="font-medium">Keyboard Navigation:</h4>
        <ul className="mt-2 list-inside list-disc text-sm">
          <li>Tab/Shift+Tab - Navigate between form fields and buttons</li>
          <li>Enter - Submit form when valid (in title input field)</li>
          <li>Escape - Close dialog (when not submitting)</li>
          <li>Arrow keys - Navigate dropdown options</li>
          <li>Space/Enter - Select dropdown option</li>
        </ul>
      </div>
    </div>
  ),
};

/**
 * Screen reader accessibility demo.
 */
export const ScreenReaderAccessibility: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <InteractiveDialog data-testid="sr-demo" />
      <div className="rounded border border-border bg-muted p-4">
        <h4 className="font-medium">Screen Reader Announcements:</h4>
        <ul className="mt-2 list-inside list-disc text-sm">
          <li>Dialog opened: "{SR_DIALOG_OPENED}"</li>
          <li>Submitting: "{SR_SUBMITTING}"</li>
          <li>Validation error: "{SR_VALIDATION_ERROR}"</li>
          <li>Default agent hint: "{SR_DEFAULT_AGENT_MESSAGE}..."</li>
          <li>Form fields are properly labeled</li>
          <li>Required field indicator announced</li>
        </ul>
      </div>
    </div>
  ),
};

/**
 * Focus ring visibility demo.
 */
export const FocusRingVisibility: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <InteractiveDialog data-testid="focus-demo" />
      <div className="rounded border border-border bg-muted p-4">
        <h4 className="font-medium">Focus Ring Visibility:</h4>
        <p className="mt-2 text-sm">
          Tab through the dialog to see focus rings on all interactive elements. Focus rings use
          ring-offset for visibility on all backgrounds.
        </p>
      </div>
    </div>
  ),
};

/**
 * Touch target accessibility demo.
 */
export const TouchTargetAccessibility: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <InteractiveDialog size="md" />
      <div className="rounded border border-border bg-muted p-4">
        <h4 className="font-medium">Touch Target Accessibility (WCAG 2.5.5):</h4>
        <ul className="mt-2 list-inside list-disc text-sm">
          <li>All buttons meet 44px minimum touch target via Dialog molecule</li>
          <li>Form inputs have adequate touch targets</li>
          <li>Close button (X) in header meets 44px minimum</li>
        </ul>
      </div>
    </div>
  ),
};

// ============================================================================
// Ref Forwarding & Data Attributes
// ============================================================================

/**
 * Ref forwarding demo.
 */
export const RefForwarding: Story = {
  render: () => {
    const dialogRef = useRef<HTMLDivElement>(null);
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="flex flex-col gap-4">
        <Button onClick={() => setIsOpen(true)}>Open Dialog</Button>
        <Button
          variant="secondary"
          onClick={() => {
            console.log('Dialog ref:', dialogRef.current);
            alert(`Dialog ref available: ${dialogRef.current !== null}`);
          }}
        >
          Log Dialog Ref
        </Button>
        <NewChatDialog
          ref={dialogRef}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          projects={mockProjects}
          executorProfiles={mockExecutorProfiles}
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
 * Data-testid demo for testing.
 */
export const DataTestId: Story = {
  render: () => <InteractiveDialog data-testid="new-chat-dialog" />,
};

// ============================================================================
// Real-World Examples
// ============================================================================

/**
 * Dashboard new chat flow.
 */
export const DashboardNewChatFlow: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [chats, setChats] = useState<Array<{ id: string; projectId: string; title?: string }>>(
      []
    );

    const handleCreate = (data: {
      projectId: string;
      executorProfileId?: string;
      title?: string;
    }) => {
      setIsSubmitting(true);
      // Simulate API call
      setTimeout(() => {
        setChats((prev) => [
          ...prev,
          {
            id: `chat-${Date.now()}`,
            projectId: data.projectId,
            title: data.title,
          },
        ]);
        setIsSubmitting(false);
        setIsOpen(false);
      }, 1500);
    };

    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between rounded border p-4">
          <h3 className="font-medium">Your Chats ({chats.length})</h3>
          <Button onClick={() => setIsOpen(true)}>New Chat</Button>
        </div>

        {chats.length > 0 && (
          <ul className="space-y-2">
            {chats.map((chat) => (
              <li key={chat.id} className="rounded border p-3">
                <p className="font-medium">{chat.title || 'Untitled Chat'}</p>
                <p className="text-sm text-muted-foreground">
                  Project: {mockProjects.find((p) => p.id === chat.projectId)?.name}
                </p>
              </li>
            ))}
          </ul>
        )}

        <NewChatDialog
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          projects={mockProjects}
          executorProfiles={mockExecutorProfiles}
          isSubmitting={isSubmitting}
          onCreate={handleCreate}
          onNewProject={() => console.log('Navigate to create project')}
        />
      </div>
    );
  },
};

/**
 * Project context new chat (pre-selected project).
 */
export const ProjectContextNewChat: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    const currentProject = mockProjects[0];

    return (
      <div className="flex flex-col gap-4">
        <div className="rounded border p-4">
          <h3 className="font-medium">{currentProject?.name}</h3>
          <p className="text-sm text-muted-foreground">{currentProject?.gitRepoPath}</p>
          <Button className="mt-4" onClick={() => setIsOpen(true)}>
            New Chat in Project
          </Button>
        </div>

        <NewChatDialog
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          projects={mockProjects}
          executorProfiles={mockExecutorProfiles}
          selectedProjectId={currentProject?.id}
          onCreate={(data) => {
            console.log('Create chat in project:', data);
            setIsOpen(false);
          }}
        />
      </div>
    );
  },
};

/**
 * Mobile view simulation.
 */
export const MobileView: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  render: () => <InteractiveDialog size={{ base: 'sm', md: 'md' }} />,
};

/**
 * Tablet view simulation.
 */
export const TabletView: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
  render: () => <InteractiveDialog size={{ base: 'sm', md: 'md', lg: 'lg' }} />,
};

// ============================================================================
// Constants Reference
// ============================================================================

/**
 * All exported constants and utilities for reference.
 */
export const ConstantsReference: Story = {
  render: () => (
    <div className="max-h-[600px] max-w-3xl space-y-6 overflow-auto p-4">
      <section>
        <h3 className="mb-2 font-bold">Default Labels</h3>
        <pre className="overflow-auto rounded bg-muted p-2 text-xs">
          {JSON.stringify(
            {
              DEFAULT_DIALOG_TITLE,
              DEFAULT_CREATE_LABEL,
              DEFAULT_CANCEL_LABEL,
              DEFAULT_LOADING_TEXT,
              DEFAULT_PROJECT_LABEL,
              DEFAULT_AGENT_LABEL,
              DEFAULT_TITLE_LABEL,
              DEFAULT_OPTIONAL_TEXT,
              DEFAULT_PROJECT_PLACEHOLDER,
              DEFAULT_AGENT_PLACEHOLDER,
              DEFAULT_TITLE_PLACEHOLDER,
              DEFAULT_NO_AGENTS_MESSAGE,
              MAX_TITLE_LENGTH,
            },
            null,
            2
          )}
        </pre>
      </section>

      <section>
        <h3 className="mb-2 font-bold">Screen Reader Announcements</h3>
        <pre className="overflow-auto rounded bg-muted p-2 text-xs">
          {JSON.stringify(
            {
              SR_DIALOG_OPENED,
              SR_SUBMITTING,
              SR_VALIDATION_ERROR,
              SR_DEFAULT_AGENT_MESSAGE,
            },
            null,
            2
          )}
        </pre>
      </section>

      <section>
        <h3 className="mb-2 font-bold">Size Configuration</h3>
        <pre className="overflow-auto rounded bg-muted p-2 text-xs">
          {JSON.stringify(
            {
              SIZE_TO_DIALOG_SIZE,
              FORM_FIELD_GAP_CLASSES,
              LABEL_SIZE_MAP,
            },
            null,
            2
          )}
        </pre>
      </section>

      <section>
        <h3 className="mb-2 font-bold">Layout Classes</h3>
        <pre className="overflow-auto rounded bg-muted p-2 text-xs">
          {JSON.stringify(
            {
              FORM_FIELD_CONTAINER_CLASSES,
              PROJECT_INFO_CONTAINER_CLASSES,
              NO_AGENTS_CONTAINER_CLASSES,
              DEFAULT_AGENT_HELPER_CLASSES,
              FOOTER_LAYOUT_CLASSES,
              BUTTON_RESPONSIVE_CLASSES,
            },
            null,
            2
          )}
        </pre>
      </section>

      <section>
        <h3 className="mb-2 font-bold">Utility Functions</h3>
        <ul className="list-inside list-disc text-sm">
          <li>getBaseSize(size) - Get base size from responsive value</li>
          <li>getResponsiveFormGapClasses(size) - Generate responsive form gap classes</li>
          <li>getDialogSize(size) - Convert to DialogSize</li>
          <li>getValidationState(projectId) - Get form validation state</li>
          <li>getExecutorIcon(command) - Get icon for executor profile</li>
          <li>buildFormAccessibleLabel(...) - Build accessible form label</li>
        </ul>
      </section>
    </div>
  ),
};
