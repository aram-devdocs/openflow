import type { Project } from '@openflow/generated';
import type { Meta, StoryObj } from '@storybook/react';
import { useRef, useState } from 'react';
import {
  // Default labels (used in ConstantsReference story)
  DEFAULT_ARIA_LABEL,
  DEFAULT_EMPTY_MESSAGE,
  DEFAULT_NEW_PROJECT_ACTION,
  DEFAULT_NEW_PROJECT_LABEL,
  DEFAULT_PLACEHOLDER,
  DEFAULT_SELECTED_INDICATOR,
  // Size constants (used in ConstantsReference story)
  ICON_SIZE_MAP,
  // Icon map (used in ConstantsReference story)
  PROJECT_ICON_MAP,
  // Components
  ProjectSelector,
  ProjectSelectorSkeleton,
  SELECTOR_SIZE_CLASSES,
  // Screen reader constants (used in ConstantsReference story)
  SR_DROPDOWN_CLOSED,
  SR_DROPDOWN_OPENED,
  SR_NEW_PROJECT_HIGHLIGHTED,
  SR_OPTION_COUNT_TEMPLATE,
  SR_OPTION_HIGHLIGHTED,
  SR_PROJECT_SELECTED,
} from './ProjectSelector';

const meta: Meta<typeof ProjectSelector> = {
  title: 'Organisms/ProjectSelector',
  component: ProjectSelector,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
A combobox for selecting projects with full accessibility support.

## Features
- **ARIA Combobox Pattern**: Uses role="combobox" on trigger and role="listbox" on options
- **Keyboard Navigation**: Arrow keys, Home, End, Enter, Escape
- **Screen Reader Announcements**: Live region announces state changes
- **Touch Target Compliance**: 44px minimum height on md size (WCAG 2.5.5)
- **Responsive Sizing**: sm, md, lg variants with breakpoint support
- **Loading Skeleton**: Dedicated skeleton component for loading states

## Accessibility
- aria-expanded reflects dropdown state
- aria-activedescendant tracks highlighted option
- aria-selected marks the current selection
- aria-label on each option for context
- motion-safe: prefix on animations for reduced motion
        `,
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-64">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    onSelectProject: { action: 'project selected' },
    onNewProject: { action: 'new project clicked' },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size variant (supports responsive values)',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ProjectSelector>;

// Named mock project for reuse
const openflowProject: Project = {
  id: 'proj-1',
  name: 'OpenFlow',
  gitRepoPath: '/Users/dev/openflow',
  baseBranch: 'main',
  setupScript: 'pnpm install',
  devScript: 'pnpm dev',
  icon: 'folder-git',
  workflowsFolder: '.openflow/workflows',
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-20T15:30:00Z',
};

// Mock project data
const mockProjects: Project[] = [
  openflowProject,
  {
    id: 'proj-2',
    name: 'My API Backend',
    gitRepoPath: '/Users/dev/my-api',
    baseBranch: 'main',
    setupScript: 'cargo build',
    devScript: 'cargo watch -x run',
    icon: 'folder-code',
    workflowsFolder: '.openflow/workflows',
    createdAt: '2024-01-10T08:00:00Z',
    updatedAt: '2024-01-18T12:00:00Z',
  },
  {
    id: 'proj-3',
    name: 'Dashboard UI',
    gitRepoPath: '/Users/dev/dashboard',
    baseBranch: 'develop',
    setupScript: 'npm install',
    devScript: 'npm run dev',
    icon: 'folder-kanban',
    workflowsFolder: '.openflow/workflows',
    createdAt: '2024-01-05T14:00:00Z',
    updatedAt: '2024-01-19T09:00:00Z',
  },
  {
    id: 'proj-4',
    name: 'Data Pipeline',
    gitRepoPath: '/Users/dev/data-pipeline',
    baseBranch: 'main',
    setupScript: 'pip install -r requirements.txt',
    devScript: 'python main.py',
    icon: 'folder',
    workflowsFolder: '.openflow/workflows',
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-17T16:00:00Z',
  },
];

// ============================================================================
// Basic Examples
// ============================================================================

/**
 * Default state with a selected project.
 */
export const Default: Story = {
  args: {
    projects: mockProjects,
    selectedProjectId: 'proj-1',
  },
};

/**
 * No project selected - shows placeholder.
 */
export const NoSelection: Story = {
  args: {
    projects: mockProjects,
    selectedProjectId: undefined,
  },
};

/**
 * Empty state with no projects.
 */
export const EmptyProjects: Story = {
  args: {
    projects: [],
    selectedProjectId: undefined,
  },
};

/**
 * Single project in the list.
 */
export const SingleProject: Story = {
  args: {
    projects: [openflowProject],
    selectedProjectId: 'proj-1',
  },
};

/**
 * Disabled state.
 */
export const Disabled: Story = {
  args: {
    projects: mockProjects,
    selectedProjectId: 'proj-1',
    disabled: true,
  },
};

/**
 * Custom placeholder text.
 */
export const CustomPlaceholder: Story = {
  args: {
    projects: mockProjects,
    selectedProjectId: undefined,
    placeholder: 'Choose a project to work on...',
  },
};

// ============================================================================
// Size Variants
// ============================================================================

/**
 * Small size variant.
 */
export const SizeSmall: Story = {
  args: {
    projects: mockProjects,
    selectedProjectId: 'proj-1',
    size: 'sm',
  },
};

/**
 * Medium size variant (default).
 */
export const SizeMedium: Story = {
  args: {
    projects: mockProjects,
    selectedProjectId: 'proj-1',
    size: 'md',
  },
};

/**
 * Large size variant.
 */
export const SizeLarge: Story = {
  args: {
    projects: mockProjects,
    selectedProjectId: 'proj-1',
    size: 'lg',
  },
};

/**
 * All sizes comparison.
 */
export const AllSizes: Story = {
  render: () => (
    <div className="flex w-72 flex-col gap-4">
      <div>
        <p className="mb-1 text-xs text-muted-foreground">Small</p>
        <ProjectSelector projects={mockProjects} selectedProjectId="proj-1" size="sm" />
      </div>
      <div>
        <p className="mb-1 text-xs text-muted-foreground">Medium (default)</p>
        <ProjectSelector projects={mockProjects} selectedProjectId="proj-1" size="md" />
      </div>
      <div>
        <p className="mb-1 text-xs text-muted-foreground">Large</p>
        <ProjectSelector projects={mockProjects} selectedProjectId="proj-1" size="lg" />
      </div>
    </div>
  ),
};

/**
 * Responsive sizing - small on mobile, medium on tablet, large on desktop.
 */
export const ResponsiveSizing: Story = {
  args: {
    projects: mockProjects,
    selectedProjectId: 'proj-1',
    size: { base: 'sm', md: 'md', lg: 'lg' },
  },
  parameters: {
    docs: {
      description: {
        story: 'Resize the viewport to see the selector change size at different breakpoints.',
      },
    },
  },
};

// ============================================================================
// Content Variations
// ============================================================================

/**
 * Many projects with scrolling.
 */
export const ManyProjects: Story = {
  args: {
    projects: [
      ...mockProjects,
      {
        id: 'proj-5',
        name: 'Mobile App',
        gitRepoPath: '/Users/dev/mobile-app',
        baseBranch: 'main',
        setupScript: 'flutter pub get',
        devScript: 'flutter run',
        icon: 'folder',
        workflowsFolder: '.openflow/workflows',
        createdAt: '2024-01-01T10:00:00Z',
        updatedAt: '2024-01-17T16:00:00Z',
      },
      {
        id: 'proj-6',
        name: 'ML Models',
        gitRepoPath: '/Users/dev/ml-models',
        baseBranch: 'main',
        setupScript: 'conda env create',
        devScript: 'jupyter notebook',
        icon: 'folder-code',
        workflowsFolder: '.openflow/workflows',
        createdAt: '2024-01-01T10:00:00Z',
        updatedAt: '2024-01-17T16:00:00Z',
      },
      {
        id: 'proj-7',
        name: 'Infrastructure',
        gitRepoPath: '/Users/dev/infra',
        baseBranch: 'main',
        setupScript: 'terraform init',
        devScript: 'terraform plan',
        icon: 'folder-git',
        workflowsFolder: '.openflow/workflows',
        createdAt: '2024-01-01T10:00:00Z',
        updatedAt: '2024-01-17T16:00:00Z',
      },
      {
        id: 'proj-8',
        name: 'Documentation Site',
        gitRepoPath: '/Users/dev/docs',
        baseBranch: 'main',
        setupScript: 'pnpm install',
        devScript: 'pnpm docs:dev',
        icon: 'folder-open',
        workflowsFolder: '.openflow/workflows',
        createdAt: '2024-01-01T10:00:00Z',
        updatedAt: '2024-01-17T16:00:00Z',
      },
    ],
    selectedProjectId: 'proj-2',
  },
};

/**
 * Project with long name (tests truncation).
 */
export const LongProjectName: Story = {
  args: {
    projects: [
      {
        id: 'proj-long',
        name: 'A Very Long Project Name That Should Be Truncated In The Display',
        gitRepoPath: '/Users/dev/long-project',
        baseBranch: 'main',
        setupScript: 'pnpm install',
        devScript: 'pnpm dev',
        icon: 'folder-git',
        workflowsFolder: '.openflow/workflows',
        createdAt: '2024-01-01T10:00:00Z',
        updatedAt: '2024-01-17T16:00:00Z',
      },
      ...mockProjects,
    ],
    selectedProjectId: 'proj-long',
  },
};

/**
 * Different icon types.
 */
export const DifferentIcons: Story = {
  args: {
    projects: [
      {
        ...openflowProject,
        id: 'icon-1',
        name: 'Default Folder',
        icon: 'folder',
      },
      {
        ...openflowProject,
        id: 'icon-2',
        name: 'Git Repository',
        icon: 'folder-git',
      },
      {
        ...openflowProject,
        id: 'icon-3',
        name: 'Code Project',
        icon: 'folder-code',
      },
      {
        ...openflowProject,
        id: 'icon-4',
        name: 'Kanban Board',
        icon: 'folder-kanban',
      },
      {
        ...openflowProject,
        id: 'icon-5',
        name: 'Open Folder',
        icon: 'folder-open',
      },
      {
        ...openflowProject,
        id: 'icon-6',
        name: 'Unknown Icon (fallback)',
        icon: 'unknown-icon-name',
      },
    ],
    selectedProjectId: 'icon-2',
  },
};

// ============================================================================
// Interactive Examples
// ============================================================================

/**
 * Interactive demo with state management.
 */
export const Interactive: Story = {
  render: () => {
    const [selectedId, setSelectedId] = useState<string | undefined>('proj-1');
    const [projects, setProjects] = useState(mockProjects);

    const handleNewProject = () => {
      const newProject: Project = {
        id: `proj-${Date.now()}`,
        name: `New Project ${projects.length + 1}`,
        gitRepoPath: '/Users/dev/new-project',
        baseBranch: 'main',
        setupScript: '',
        devScript: '',
        icon: 'folder',
        workflowsFolder: '.openflow/workflows',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setProjects([...projects, newProject]);
      setSelectedId(newProject.id);
    };

    return (
      <div className="w-72 space-y-4">
        <ProjectSelector
          projects={projects}
          selectedProjectId={selectedId}
          onSelectProject={setSelectedId}
          onNewProject={handleNewProject}
        />
        <p className="text-sm text-muted-foreground">
          Selected: {projects.find((p) => p.id === selectedId)?.name ?? 'None'}
        </p>
      </div>
    );
  },
};

// ============================================================================
// Skeleton / Loading States
// ============================================================================

/**
 * Loading skeleton.
 */
export const Skeleton: Story = {
  render: () => <ProjectSelectorSkeleton />,
};

/**
 * Skeleton sizes.
 */
export const SkeletonSizes: Story = {
  render: () => (
    <div className="flex w-72 flex-col gap-4">
      <div>
        <p className="mb-1 text-xs text-muted-foreground">Small</p>
        <ProjectSelectorSkeleton size="sm" />
      </div>
      <div>
        <p className="mb-1 text-xs text-muted-foreground">Medium</p>
        <ProjectSelectorSkeleton size="md" />
      </div>
      <div>
        <p className="mb-1 text-xs text-muted-foreground">Large</p>
        <ProjectSelectorSkeleton size="lg" />
      </div>
    </div>
  ),
};

/**
 * Loading to loaded transition demo.
 */
export const LoadingTransition: Story = {
  render: () => {
    const [isLoading, setIsLoading] = useState(true);

    return (
      <div className="w-72 space-y-4">
        <button
          type="button"
          onClick={() => setIsLoading(!isLoading)}
          className="text-sm text-primary underline"
        >
          Toggle loading: {isLoading ? 'Loading' : 'Loaded'}
        </button>
        {isLoading ? (
          <ProjectSelectorSkeleton />
        ) : (
          <ProjectSelector projects={mockProjects} selectedProjectId="proj-1" />
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
 *
 * Instructions:
 * 1. Tab to focus the selector
 * 2. Press Enter/Space/ArrowDown to open
 * 3. Use Arrow keys to navigate
 * 4. Home/End to jump to first/last
 * 5. Enter/Space to select
 * 6. Escape to close
 */
export const KeyboardNavigation: Story = {
  args: {
    projects: mockProjects,
    selectedProjectId: 'proj-2',
  },
  parameters: {
    docs: {
      description: {
        story: `
**Keyboard Navigation:**
- **Tab**: Focus the selector
- **Enter/Space/ArrowDown**: Open dropdown
- **ArrowUp/ArrowDown**: Navigate options
- **Home/End**: Jump to first/last option
- **Enter/Space**: Select highlighted option
- **Escape**: Close dropdown
- **Tab**: Close and move focus
        `,
      },
    },
  },
};

/**
 * Screen reader accessibility demo.
 *
 * The component announces:
 * - Dropdown open/close state
 * - Number of available options
 * - Currently highlighted option
 * - Selection changes
 */
export const ScreenReaderAccessibility: Story = {
  args: {
    projects: mockProjects,
    selectedProjectId: 'proj-1',
    'aria-label': 'Select your active project',
  },
  parameters: {
    docs: {
      description: {
        story: `
**Screen Reader Announcements:**
- "Project selector opened. 4 projects available"
- "OpenFlow, Option 1 of 5" (on navigate)
- "New Project button, 5 of 5" (on new project option)
- "Selected OpenFlow" (on selection)
- "Project selector closed" (on close)
        `,
      },
    },
  },
};

/**
 * Touch target accessibility (WCAG 2.5.5).
 * The md and lg sizes meet the 44px minimum touch target requirement.
 */
export const TouchTargetAccessibility: Story = {
  render: () => (
    <div className="flex w-72 flex-col gap-4">
      <div>
        <p className="mb-1 text-xs text-muted-foreground">Small (36px) - below WCAG minimum</p>
        <ProjectSelector projects={mockProjects} selectedProjectId="proj-1" size="sm" />
      </div>
      <div>
        <p className="mb-1 text-xs text-muted-foreground">Medium (44px) - meets WCAG 2.5.5</p>
        <ProjectSelector projects={mockProjects} selectedProjectId="proj-1" size="md" />
      </div>
      <div>
        <p className="mb-1 text-xs text-muted-foreground">Large (48px) - exceeds WCAG 2.5.5</p>
        <ProjectSelector projects={mockProjects} selectedProjectId="proj-1" size="lg" />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'WCAG 2.5.5 requires 44x44px minimum touch targets. The md and lg sizes comply.',
      },
    },
  },
};

/**
 * Focus ring visibility demo.
 */
export const FocusRingVisibility: Story = {
  render: () => (
    <div className="flex w-72 flex-col gap-6">
      <div className="rounded-lg bg-background p-4">
        <p className="mb-2 text-xs text-muted-foreground">Light background</p>
        <ProjectSelector projects={mockProjects} selectedProjectId="proj-1" />
      </div>
      <div className="rounded-lg bg-foreground p-4">
        <p className="mb-2 text-xs text-background">Dark background</p>
        <ProjectSelector projects={mockProjects} selectedProjectId="proj-1" />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Focus ring uses ring-offset to ensure visibility on both light and dark backgrounds.',
      },
    },
  },
};

/**
 * Reduced motion demo.
 * Animations are wrapped in motion-safe: for users who prefer reduced motion.
 */
export const ReducedMotion: Story = {
  args: {
    projects: mockProjects,
    selectedProjectId: 'proj-1',
  },
  parameters: {
    docs: {
      description: {
        story: `
All animations use the \`motion-safe:\` prefix, respecting the user's
\`prefers-reduced-motion\` system preference. Animations include:
- Dropdown fade/zoom animation
- Chevron rotation
- Option hover transition
        `,
      },
    },
  },
};

// ============================================================================
// Ref Forwarding & Data Attributes
// ============================================================================

/**
 * Ref forwarding demo.
 */
export const RefForwarding: Story = {
  render: () => {
    const ref = useRef<HTMLDivElement>(null);

    return (
      <div className="w-72 space-y-4">
        <ProjectSelector ref={ref} projects={mockProjects} selectedProjectId="proj-1" />
        <button
          type="button"
          onClick={() => {
            const el = ref.current;
            if (el) {
              alert(`Container: ${el.tagName}, data-state: ${el.dataset.state}`);
            }
          }}
          className="text-sm text-primary underline"
        >
          Get ref info
        </button>
      </div>
    );
  },
};

/**
 * Custom data-testid for automated testing.
 */
export const DataTestId: Story = {
  args: {
    projects: mockProjects,
    selectedProjectId: 'proj-1',
    'data-testid': 'project-picker',
  },
  parameters: {
    docs: {
      description: {
        story: `
Uses custom test IDs for e2e testing:
- \`data-testid="project-picker"\` on container
- \`data-testid="project-picker-trigger"\` on trigger button
- \`data-testid="project-picker-listbox"\` on options list
- \`data-testid="project-picker-option-{id}"\` on each option
- \`data-testid="project-picker-new-project"\` on new project button
        `,
      },
    },
  },
};

// ============================================================================
// Real-World Examples
// ============================================================================

/**
 * Sidebar project selector.
 */
export const SidebarUsage: Story = {
  render: () => (
    <div className="flex w-60 flex-col gap-4 rounded-lg border bg-card p-4">
      <p className="text-xs font-medium uppercase text-muted-foreground">Active Project</p>
      <ProjectSelector projects={mockProjects} selectedProjectId="proj-1" size="sm" />
    </div>
  ),
};

/**
 * Header project selector.
 */
export const HeaderUsage: Story = {
  render: () => (
    <div className="flex w-full max-w-md items-center justify-between gap-4 rounded-lg border bg-card p-3">
      <span className="text-lg font-semibold">OpenFlow</span>
      <div className="w-48">
        <ProjectSelector projects={mockProjects} selectedProjectId="proj-1" size="sm" />
      </div>
    </div>
  ),
  decorators: [
    (Story) => (
      <div className="w-full max-w-md">
        <Story />
      </div>
    ),
  ],
};

/**
 * Dialog/form project selector.
 */
export const FormUsage: Story = {
  render: () => (
    <div className="w-80 space-y-4 rounded-lg border bg-card p-6">
      <div>
        <h3 className="text-lg font-semibold">Create Task</h3>
        <p className="text-sm text-muted-foreground">Create a new task for your project</p>
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="project" className="text-sm font-medium">
            Project
          </label>
          <ProjectSelector
            projects={mockProjects}
            selectedProjectId="proj-1"
            aria-describedby="project-desc"
          />
          <p id="project-desc" className="text-xs text-muted-foreground">
            Select the project for this task
          </p>
        </div>
        <div className="space-y-2">
          <label htmlFor="title" className="text-sm font-medium">
            Task Title
          </label>
          <input
            id="title"
            type="text"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            placeholder="Enter task title"
          />
        </div>
      </div>
    </div>
  ),
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};

// ============================================================================
// Constants Reference
// ============================================================================

/**
 * Reference for exported constants and utilities.
 */
export const ConstantsReference: Story = {
  render: () => (
    <div className="max-h-[600px] w-[600px] overflow-auto rounded-lg border bg-card p-4">
      <h3 className="mb-4 text-lg font-semibold">Exported Constants & Utilities</h3>

      <div className="space-y-6 text-sm">
        <section>
          <h4 className="mb-2 font-medium text-primary">Default Labels</h4>
          <ul className="space-y-1 font-mono text-xs">
            <li>DEFAULT_PLACEHOLDER: "{DEFAULT_PLACEHOLDER}"</li>
            <li>DEFAULT_ARIA_LABEL: "{DEFAULT_ARIA_LABEL}"</li>
            <li>DEFAULT_NEW_PROJECT_LABEL: "{DEFAULT_NEW_PROJECT_LABEL}"</li>
            <li>DEFAULT_EMPTY_MESSAGE: "{DEFAULT_EMPTY_MESSAGE}"</li>
            <li>DEFAULT_SELECTED_INDICATOR: "{DEFAULT_SELECTED_INDICATOR}"</li>
            <li>DEFAULT_NEW_PROJECT_ACTION: "{DEFAULT_NEW_PROJECT_ACTION}"</li>
          </ul>
        </section>

        <section>
          <h4 className="mb-2 font-medium text-primary">Screen Reader Announcements</h4>
          <ul className="space-y-1 font-mono text-xs">
            <li>SR_DROPDOWN_OPENED: "{SR_DROPDOWN_OPENED}"</li>
            <li>SR_DROPDOWN_CLOSED: "{SR_DROPDOWN_CLOSED}"</li>
            <li>SR_PROJECT_SELECTED: "{SR_PROJECT_SELECTED}"</li>
            <li>SR_OPTION_HIGHLIGHTED: "{SR_OPTION_HIGHLIGHTED}"</li>
            <li>SR_OPTION_COUNT_TEMPLATE: "{SR_OPTION_COUNT_TEMPLATE}"</li>
            <li>SR_NEW_PROJECT_HIGHLIGHTED: "{SR_NEW_PROJECT_HIGHLIGHTED}"</li>
          </ul>
        </section>

        <section>
          <h4 className="mb-2 font-medium text-primary">Size Classes</h4>
          <ul className="space-y-1 font-mono text-xs">
            <li>SELECTOR_SIZE_CLASSES.sm: "{SELECTOR_SIZE_CLASSES.sm}"</li>
            <li>SELECTOR_SIZE_CLASSES.md: "{SELECTOR_SIZE_CLASSES.md}"</li>
            <li>SELECTOR_SIZE_CLASSES.lg: "{SELECTOR_SIZE_CLASSES.lg}"</li>
          </ul>
        </section>

        <section>
          <h4 className="mb-2 font-medium text-primary">Icon Size Map</h4>
          <ul className="space-y-1 font-mono text-xs">
            <li>ICON_SIZE_MAP.sm: "{ICON_SIZE_MAP.sm}"</li>
            <li>ICON_SIZE_MAP.md: "{ICON_SIZE_MAP.md}"</li>
            <li>ICON_SIZE_MAP.lg: "{ICON_SIZE_MAP.lg}"</li>
          </ul>
        </section>

        <section>
          <h4 className="mb-2 font-medium text-primary">Utility Functions</h4>
          <ul className="space-y-1 font-mono text-xs">
            <li>getProjectIcon(iconName) → LucideIcon</li>
            <li>getBaseSize(size) → ProjectSelectorSize</li>
            <li>getResponsiveSizeClasses(size, classMap) → string</li>
            <li>getOptionId(listboxId, index) → string</li>
            <li>buildSelectionAnnouncement(name) → string</li>
            <li>buildHighlightAnnouncement(name, index, total, isNew) → string</li>
            <li>buildProjectAccessibleLabel(project, isSelected) → string</li>
            <li>buildCountAnnouncement(count) → string</li>
          </ul>
        </section>

        <section>
          <h4 className="mb-2 font-medium text-primary">Project Icon Map Keys</h4>
          <ul className="space-y-1 font-mono text-xs">
            {Object.keys(PROJECT_ICON_MAP).map((key) => (
              <li key={key}>"{key}"</li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  ),
  decorators: [(Story) => <Story />],
};
