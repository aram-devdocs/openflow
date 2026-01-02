/**
 * Storybook stories for ProjectsListPage
 *
 * Demonstrates the complete projects list page in various states:
 * - Default with projects
 * - Loading state with skeleton grid
 * - Empty state
 * - Error state with retry
 * - With create dialog open
 * - With confirm dialog open
 * - Mobile/tablet viewports
 * - Accessibility demos (screen reader, keyboard, focus ring)
 *
 * @module pages/ProjectsListPage.stories
 */

import type { Project } from '@openflow/generated';
import type { Meta, StoryObj } from '@storybook/react';
import {
  DEFAULT_ERROR_DESCRIPTION,
  DEFAULT_ERROR_TITLE,
  DEFAULT_PAGE_LABEL,
  DEFAULT_PAGE_SIZE,
  DEFAULT_RETRY_LABEL,
  DEFAULT_SKELETON_PROJECT_COUNT,
  PAGE_SIZE_GAP,
  PAGE_SIZE_PADDING,
  PROJECTS_LIST_PAGE_BASE_CLASSES,
  PROJECTS_LIST_PAGE_ERROR_CLASSES,
  PROJECTS_LIST_PAGE_SKELETON_CARD_CLASSES,
  PROJECTS_LIST_PAGE_SKELETON_CLASSES,
  PROJECTS_LIST_PAGE_SKELETON_GRID_CLASSES,
  PROJECTS_LIST_PAGE_SKELETON_HEADER_CLASSES,
  ProjectsListPage,
  ProjectsListPageError,
  type ProjectsListPageProps,
  ProjectsListPageSkeleton,
  SKELETON_ICON_DIMENSIONS,
  SR_EMPTY,
  SR_ERROR_PREFIX,
  SR_LOADED_PREFIX,
  SR_LOADING,
  buildLoadedAnnouncement,
  buildPageAccessibleLabel,
  getBaseSize,
  getResponsiveSizeClasses,
  getSkeletonIconDimensions,
} from './ProjectsListPage';

const meta: Meta<typeof ProjectsListPage> = {
  title: 'Pages/ProjectsListPage',
  component: ProjectsListPage,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
ProjectsListPage is a stateless page component that displays a list of projects.

## Accessibility Features
- **Screen reader announcements**: Loading, error, and loaded states are announced
- **Proper heading hierarchy**: h1 for page title via ProjectsListHeader
- **Focus management**: forwardRef support for programmatic focus
- **Touch targets**: ≥44px for all interactive elements (WCAG 2.5.5)
- **Responsive layout**: Adapts from 1-column mobile to 3-column desktop

## States
- \`loading\`: Shows skeleton grid
- \`error\`: Shows error message with retry button
- \`ready\`: Shows project grid (or empty state if no projects)

## Usage
\`\`\`tsx
<ProjectsListPage
  state="ready"
  projectCount={projects.length}
  onSearch={handleSearch}
  header={{ onCreateProject: handleOpen }}
  content={{ isLoading: false, projects, ... }}
  createDialog={{ isOpen: false, ... }}
  confirmDialog={{ isOpen: false, ... }}
/>
\`\`\`
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
type Story = StoryObj<typeof ProjectsListPage>;

// ============================================================================
// Mock Data
// ============================================================================

const mockProjects: Project[] = [
  {
    id: 'project-1',
    name: 'OpenFlow',
    gitRepoPath: '/Users/dev/openflow',
    baseBranch: 'main',
    setupScript: 'pnpm install',
    devScript: 'pnpm dev',
    workflowsFolder: '.openflow/workflows',
    icon: 'folder',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'project-2',
    name: 'Auth Service',
    gitRepoPath: '/Users/dev/auth-service',
    baseBranch: 'main',
    setupScript: 'npm install',
    devScript: 'npm run dev',
    workflowsFolder: '.openflow/workflows',
    icon: 'lock',
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-14T09:00:00Z',
  },
  {
    id: 'project-3',
    name: 'API Gateway',
    gitRepoPath: '/Users/dev/api-gateway',
    baseBranch: 'develop',
    setupScript: 'cargo build',
    devScript: 'cargo watch -x run',
    workflowsFolder: '.openflow/workflows',
    icon: 'server',
    createdAt: '2024-01-03T00:00:00Z',
    updatedAt: '2024-01-13T16:00:00Z',
  },
  {
    id: 'project-4',
    name: 'Web Dashboard',
    gitRepoPath: '/Users/dev/web-dashboard',
    baseBranch: 'main',
    setupScript: 'yarn install',
    devScript: 'yarn dev',
    workflowsFolder: '.openflow/workflows',
    icon: 'layout',
    createdAt: '2024-01-04T00:00:00Z',
    updatedAt: '2024-01-12T14:00:00Z',
  },
];

// ============================================================================
// Helper functions
// ============================================================================

const noop = () => {};
const noopString = (_s: string) => {};
const noopAsync = async () => {};
const noopDelete = (_id: string, _name: string) => {};

// ============================================================================
// Default Props Factory
// ============================================================================

function createDefaultProps(overrides?: Partial<ProjectsListPageProps>): ProjectsListPageProps {
  return {
    state: 'ready',
    projectCount: mockProjects.length,
    onSearch: noop,
    header: {
      onCreateProject: noop,
    },
    content: {
      isLoading: false,
      projects: mockProjects,
      onCreateProject: noop,
      onSelectProject: noopString,
      onProjectSettings: noopString,
      onDeleteProject: noopDelete,
    },
    createDialog: {
      isOpen: false,
      onClose: noop,
      projectName: '',
      onProjectNameChange: noopString,
      projectPath: '',
      onProjectPathChange: noopString,
      onBrowseFolder: noopAsync,
      onCreate: noop,
      isPending: false,
      error: null,
    },
    confirmDialog: {
      isOpen: false,
      onClose: noop,
      onConfirm: noop,
      title: '',
      description: '',
    },
    ...overrides,
  };
}

// ============================================================================
// Basic Examples
// ============================================================================

/**
 * Default projects list with multiple projects.
 * Shows the standard ready state with a grid of project cards.
 */
export const Default: Story = {
  args: createDefaultProps(),
};

/**
 * Loading state with skeleton grid.
 * Screen reader announces "Loading projects. Please wait."
 */
export const Loading: Story = {
  args: {
    state: 'loading',
    projectCount: 0,
  },
};

/**
 * Empty state (no projects).
 * Shows empty state UI with call-to-action to create first project.
 */
export const Empty: Story = {
  args: (() => {
    const defaults = createDefaultProps();
    return {
      ...defaults,
      content: {
        ...defaults.content!,
        projects: [],
      },
      projectCount: 0,
    } as ProjectsListPageProps;
  })(),
};

/**
 * Error state with retry button.
 * Screen reader announces "Error loading projects: [message]"
 */
export const ErrorState: Story = {
  args: {
    state: 'error',
    error: new globalThis.Error(
      'Network connection failed. Please check your internet connection and try again.'
    ),
    onRetry: () => alert('Retry clicked'),
  },
};

/**
 * Single project.
 */
export const SingleProject: Story = {
  args: (() => {
    const defaults = createDefaultProps();
    return {
      ...defaults,
      content: {
        ...defaults.content!,
        projects: mockProjects[0] ? [mockProjects[0]] : [],
      },
      projectCount: 1,
    } as ProjectsListPageProps;
  })(),
};

/**
 * Many projects (scrollable grid).
 */
export const ManyProjects: Story = {
  args: (() => {
    const manyProjects: Project[] = [
      ...mockProjects,
      ...Array.from({ length: 12 }, (_, i) => ({
        id: `project-extra-${i}`,
        name: `Project ${i + 5}`,
        gitRepoPath: `/Users/dev/project-${i + 5}`,
        baseBranch: 'main',
        setupScript: 'npm install',
        devScript: 'npm run dev',
        workflowsFolder: '.openflow/workflows',
        icon: 'folder',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      })),
    ];
    const defaults = createDefaultProps();
    return {
      ...defaults,
      content: {
        ...defaults.content!,
        projects: manyProjects,
      },
      projectCount: manyProjects.length,
    } as ProjectsListPageProps;
  })(),
};

// ============================================================================
// Dialog States
// ============================================================================

/**
 * Create dialog open.
 */
export const CreateDialogOpen: Story = {
  args: (() => {
    const defaults = createDefaultProps();
    return {
      ...defaults,
      createDialog: {
        ...defaults.createDialog!,
        isOpen: true,
      },
    } as ProjectsListPageProps;
  })(),
};

/**
 * Create dialog with values.
 */
export const CreateDialogFilled: Story = {
  args: (() => {
    const defaults = createDefaultProps();
    return {
      ...defaults,
      createDialog: {
        ...defaults.createDialog!,
        isOpen: true,
        projectName: 'New Feature App',
        projectPath: '/Users/dev/new-feature-app',
      },
    } as ProjectsListPageProps;
  })(),
};

/**
 * Create dialog pending.
 */
export const CreateDialogPending: Story = {
  args: (() => {
    const defaults = createDefaultProps();
    return {
      ...defaults,
      createDialog: {
        ...defaults.createDialog!,
        isOpen: true,
        projectName: 'New Feature App',
        projectPath: '/Users/dev/new-feature-app',
        isPending: true,
      },
    } as ProjectsListPageProps;
  })(),
};

/**
 * Create dialog with error.
 */
export const CreateDialogError: Story = {
  args: (() => {
    const defaults = createDefaultProps();
    return {
      ...defaults,
      createDialog: {
        ...defaults.createDialog!,
        isOpen: true,
        projectName: 'New Feature App',
        projectPath: '/invalid/path',
        error: 'The specified path is not a valid git repository',
      },
    } as ProjectsListPageProps;
  })(),
};

/**
 * Delete confirmation dialog open.
 */
export const ConfirmDeleteOpen: Story = {
  args: createDefaultProps({
    confirmDialog: {
      isOpen: true,
      onClose: noop,
      onConfirm: noop,
      title: 'Delete Project',
      description:
        'Are you sure you want to delete "OpenFlow"? This will archive all associated tasks and chats.',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      variant: 'destructive',
    },
  }),
};

/**
 * Delete confirmation dialog loading.
 */
export const ConfirmDeleteLoading: Story = {
  args: createDefaultProps({
    confirmDialog: {
      isOpen: true,
      onClose: noop,
      onConfirm: noop,
      title: 'Delete Project',
      description:
        'Are you sure you want to delete "OpenFlow"? This will archive all associated tasks and chats.',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      variant: 'destructive',
      loading: true,
    },
  }),
};

// ============================================================================
// Size Variants
// ============================================================================

/**
 * Small size variant.
 */
export const SizeSmall: Story = {
  args: createDefaultProps({
    size: 'sm',
  }),
};

/**
 * Large size variant.
 */
export const SizeLarge: Story = {
  args: createDefaultProps({
    size: 'lg',
  }),
};

/**
 * Responsive sizing (sm -> md -> lg at breakpoints).
 */
export const ResponsiveSizing: Story = {
  args: createDefaultProps({
    size: { base: 'sm', md: 'md', lg: 'lg' },
  }),
  parameters: {
    docs: {
      description: {
        story: 'Resize the viewport to see the size change from sm to md to lg.',
      },
    },
  },
};

// ============================================================================
// Viewport Tests
// ============================================================================

/**
 * Mobile viewport (320px).
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
 * Tablet viewport (768px).
 */
export const Tablet: Story = {
  args: createDefaultProps(),
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
};

// ============================================================================
// Sub-Component Stories
// ============================================================================

/**
 * Skeleton component standalone.
 */
export const SkeletonDemo: Story = {
  render: () => (
    <div className="h-screen">
      <ProjectsListPageSkeleton projectCount={6} />
    </div>
  ),
};

/**
 * Skeleton with different counts.
 */
export const SkeletonVariants: Story = {
  render: () => (
    <div className="grid gap-6 p-4">
      <div>
        <h3 className="mb-2 text-lg font-semibold">3 Projects</h3>
        <div className="h-[400px] border rounded-lg overflow-hidden">
          <ProjectsListPageSkeleton projectCount={3} />
        </div>
      </div>
      <div>
        <h3 className="mb-2 text-lg font-semibold">9 Projects</h3>
        <div className="h-[600px] border rounded-lg overflow-hidden">
          <ProjectsListPageSkeleton projectCount={9} />
        </div>
      </div>
    </div>
  ),
};

/**
 * Error component standalone.
 */
export const ErrorDemo: Story = {
  render: () => (
    <div className="h-[400px] flex items-center justify-center">
      <ProjectsListPageError
        error={new Error('Failed to fetch projects from server')}
        onRetry={() => alert('Retry clicked')}
      />
    </div>
  ),
};

// ============================================================================
// Accessibility Demos
// ============================================================================

/**
 * Keyboard navigation demo.
 * Tab through interactive elements to see focus rings.
 */
export const KeyboardNavigation: Story = {
  args: createDefaultProps(),
  parameters: {
    docs: {
      description: {
        story: `
**Keyboard navigation test:**
1. Press Tab to move through interactive elements
2. All buttons and project cards should receive visible focus rings
3. Enter/Space activates buttons and selects projects
4. Escape closes dialogs
        `,
      },
    },
  },
};

/**
 * Screen reader demo showing announcements.
 */
export const ScreenReaderDemo: Story = {
  render: () => (
    <div className="space-y-8 p-6">
      <div className="border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4">Loading State</h3>
        <p className="text-sm text-muted-foreground mb-2">
          Screen reader announces: "{SR_LOADING}"
        </p>
        <div className="h-[300px] border rounded overflow-hidden">
          <ProjectsListPage state="loading" />
        </div>
      </div>

      <div className="border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4">Loaded State (4 projects)</h3>
        <p className="text-sm text-muted-foreground mb-2">
          Screen reader announces: "{buildLoadedAnnouncement(4)}"
        </p>
        <div className="h-[300px] border rounded overflow-hidden">
          <ProjectsListPage {...createDefaultProps()} />
        </div>
      </div>

      <div className="border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4">Empty State</h3>
        <p className="text-sm text-muted-foreground mb-2">Screen reader announces: "{SR_EMPTY}"</p>
        <div className="h-[300px] border rounded overflow-hidden">
          <ProjectsListPage
            {...(() => {
              const defaults = createDefaultProps();
              return {
                ...defaults,
                content: { ...defaults.content!, projects: [] },
                projectCount: 0,
              } as ProjectsListPageProps;
            })()}
          />
        </div>
      </div>

      <div className="border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4">Error State</h3>
        <p className="text-sm text-muted-foreground mb-2">
          Screen reader announces: "{SR_ERROR_PREFIX} Connection failed"
        </p>
        <div className="h-[300px] border rounded overflow-hidden">
          <ProjectsListPage state="error" error={new Error('Connection failed')} onRetry={noop} />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Shows the screen reader announcements for each page state.',
      },
    },
  },
};

/**
 * Focus ring visibility demo.
 */
export const FocusRingVisibility: Story = {
  args: createDefaultProps(),
  parameters: {
    docs: {
      description: {
        story: `
**Focus ring visibility test:**
1. Tab to the "Create Project" button - should show a visible focus ring
2. Focus rings use ring-offset for visibility on all backgrounds
3. Focus should be clearly visible against both light and dark themes
        `,
      },
    },
  },
};

/**
 * Touch target accessibility demo.
 */
export const TouchTargetAccessibility: Story = {
  args: createDefaultProps(),
  parameters: {
    docs: {
      description: {
        story: `
**Touch target test (WCAG 2.5.5):**
- All buttons have min-h-[44px] min-w-[44px]
- Project cards have adequate touch areas
- Error retry button meets 44px minimum
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
export const RefForwardingDemo: Story = {
  render: () => {
    const ref = { current: null as HTMLDivElement | null };

    return (
      <div className="h-screen">
        <div className="p-4 border-b flex gap-2">
          <button
            type="button"
            onClick={() => {
              if (ref.current) {
                console.log('Page element:', ref.current);
                console.log('data-state:', ref.current.dataset.state);
                console.log('data-project-count:', ref.current.dataset.projectCount);
                alert(`Ref works! State: ${ref.current.dataset.state}`);
              }
            }}
            className="px-4 py-2 bg-primary text-primary-foreground rounded"
          >
            Check Ref
          </button>
        </div>
        <ProjectsListPage
          ref={(el) => {
            ref.current = el;
          }}
          {...createDefaultProps()}
        />
      </div>
    );
  },
};

/**
 * Data attributes demo.
 */
export const DataAttributesDemo: Story = {
  render: () => (
    <div className="space-y-6 p-6">
      <div className="border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Loading State</h3>
        <code className="text-sm bg-muted p-2 rounded block mb-4">
          data-state="loading" aria-busy={true}
        </code>
        <div className="h-[200px] border rounded overflow-hidden">
          <ProjectsListPage state="loading" data-testid="loading-demo" />
        </div>
      </div>

      <div className="border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Ready State</h3>
        <code className="text-sm bg-muted p-2 rounded block mb-4">
          data-state="ready" data-project-count="4"
        </code>
        <div className="h-[200px] border rounded overflow-hidden">
          <ProjectsListPage {...createDefaultProps()} data-testid="ready-demo" />
        </div>
      </div>

      <div className="border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Empty State</h3>
        <code className="text-sm bg-muted p-2 rounded block mb-4">
          data-state="empty" data-project-count="0"
        </code>
        <div className="h-[200px] border rounded overflow-hidden">
          <ProjectsListPage
            {...(() => {
              const defaults = createDefaultProps();
              return {
                ...defaults,
                content: { ...defaults.content!, projects: [] },
                projectCount: 0,
              } as ProjectsListPageProps;
            })()}
            data-testid="empty-demo"
          />
        </div>
      </div>

      <div className="border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Error State</h3>
        <code className="text-sm bg-muted p-2 rounded block mb-4">data-state="error"</code>
        <div className="h-[200px] border rounded overflow-hidden">
          <ProjectsListPage
            state="error"
            error={new Error('Test error')}
            onRetry={noop}
            data-testid="error-demo"
          />
        </div>
      </div>
    </div>
  ),
};

// ============================================================================
// Real-World Examples
// ============================================================================

/**
 * First-time user experience (empty).
 */
export const FirstTimeUser: Story = {
  args: (() => {
    const defaults = createDefaultProps();
    return {
      ...defaults,
      content: {
        ...defaults.content!,
        projects: [],
      },
      projectCount: 0,
    } as ProjectsListPageProps;
  })(),
  parameters: {
    docs: {
      description: {
        story: 'What a new user sees when they first open the app with no projects.',
      },
    },
  },
};

/**
 * Power user with many projects.
 */
export const PowerUser: Story = {
  args: (() => {
    const manyProjects: Project[] = Array.from({ length: 20 }, (_, i) => ({
      id: `project-${i + 1}`,
      name: `Project ${i + 1}`,
      gitRepoPath: `/Users/dev/project-${i + 1}`,
      baseBranch: 'main',
      setupScript: 'pnpm install',
      devScript: 'pnpm dev',
      workflowsFolder: '.openflow/workflows',
      icon: ['folder', 'code', 'server', 'layout', 'lock'][i % 5] ?? 'folder',
      createdAt: new Date(2024, 0, i + 1).toISOString(),
      updatedAt: new Date(2024, 0, i + 1).toISOString(),
    }));
    const defaults = createDefaultProps();
    return {
      ...defaults,
      content: {
        ...defaults.content!,
        projects: manyProjects,
      },
      projectCount: manyProjects.length,
    } as ProjectsListPageProps;
  })(),
  parameters: {
    docs: {
      description: {
        story: 'A power user with many projects - shows scrollable grid behavior.',
      },
    },
  },
};

/**
 * Network error scenario.
 */
export const NetworkError: Story = {
  args: {
    state: 'error',
    error: new Error(
      'Network request failed: Unable to reach server. Please check your connection and try again.'
    ),
    onRetry: () => console.log('Retrying...'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Error state when network request fails.',
      },
    },
  },
};

/**
 * Loading after initial render (content loading).
 */
export const ContentLoading: Story = {
  args: (() => {
    const defaults = createDefaultProps();
    return {
      ...defaults,
      content: {
        ...defaults.content!,
        isLoading: true,
        projects: [],
      },
      projectCount: 0,
    } as ProjectsListPageProps;
  })(),
  parameters: {
    docs: {
      description: {
        story: 'Content area loading state (different from initial page loading).',
      },
    },
  },
};

// ============================================================================
// Constants Reference
// ============================================================================

/**
 * Reference story showing all exported constants and utilities.
 */
export const ConstantsReference: Story = {
  render: () => (
    <div className="p-6 space-y-6 max-w-3xl">
      <h2 className="text-2xl font-bold">ProjectsListPage Constants & Utilities</h2>

      <section className="space-y-2">
        <h3 className="text-lg font-semibold">Default Values</h3>
        <table className="w-full text-sm">
          <tbody>
            <tr className="border-b">
              <td className="py-2 font-mono">DEFAULT_SKELETON_PROJECT_COUNT</td>
              <td className="py-2">{DEFAULT_SKELETON_PROJECT_COUNT}</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 font-mono">DEFAULT_PAGE_SIZE</td>
              <td className="py-2">"{DEFAULT_PAGE_SIZE}"</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 font-mono">DEFAULT_PAGE_LABEL</td>
              <td className="py-2">"{DEFAULT_PAGE_LABEL}"</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 font-mono">DEFAULT_ERROR_TITLE</td>
              <td className="py-2">"{DEFAULT_ERROR_TITLE}"</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 font-mono">DEFAULT_ERROR_DESCRIPTION</td>
              <td className="py-2">"{DEFAULT_ERROR_DESCRIPTION}"</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 font-mono">DEFAULT_RETRY_LABEL</td>
              <td className="py-2">"{DEFAULT_RETRY_LABEL}"</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="space-y-2">
        <h3 className="text-lg font-semibold">Screen Reader Announcements</h3>
        <table className="w-full text-sm">
          <tbody>
            <tr className="border-b">
              <td className="py-2 font-mono">SR_LOADING</td>
              <td className="py-2">"{SR_LOADING}"</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 font-mono">SR_ERROR_PREFIX</td>
              <td className="py-2">"{SR_ERROR_PREFIX}"</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 font-mono">SR_EMPTY</td>
              <td className="py-2">"{SR_EMPTY}"</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 font-mono">SR_LOADED_PREFIX</td>
              <td className="py-2">"{SR_LOADED_PREFIX}"</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="space-y-2">
        <h3 className="text-lg font-semibold">CSS Class Constants</h3>
        <table className="w-full text-sm">
          <tbody>
            <tr className="border-b">
              <td className="py-2 font-mono">PROJECTS_LIST_PAGE_BASE_CLASSES</td>
              <td className="py-2 text-xs">{PROJECTS_LIST_PAGE_BASE_CLASSES}</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 font-mono">PROJECTS_LIST_PAGE_ERROR_CLASSES</td>
              <td className="py-2 text-xs">{PROJECTS_LIST_PAGE_ERROR_CLASSES}</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 font-mono">PROJECTS_LIST_PAGE_SKELETON_CLASSES</td>
              <td className="py-2 text-xs">{PROJECTS_LIST_PAGE_SKELETON_CLASSES}</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 font-mono">PROJECTS_LIST_PAGE_SKELETON_HEADER_CLASSES</td>
              <td className="py-2 text-xs">{PROJECTS_LIST_PAGE_SKELETON_HEADER_CLASSES}</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 font-mono">PROJECTS_LIST_PAGE_SKELETON_GRID_CLASSES</td>
              <td className="py-2 text-xs">{PROJECTS_LIST_PAGE_SKELETON_GRID_CLASSES}</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 font-mono">PROJECTS_LIST_PAGE_SKELETON_CARD_CLASSES</td>
              <td className="py-2 text-xs">{PROJECTS_LIST_PAGE_SKELETON_CARD_CLASSES}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="space-y-2">
        <h3 className="text-lg font-semibold">Size Mappings</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-2 text-left">Size</th>
              <th className="py-2 text-left">Padding</th>
              <th className="py-2 text-left">Gap</th>
              <th className="py-2 text-left">Icon Size</th>
            </tr>
          </thead>
          <tbody>
            {(['sm', 'md', 'lg'] as const).map((size) => (
              <tr key={size} className="border-b">
                <td className="py-2">{size}</td>
                <td className="py-2 font-mono text-xs">{PAGE_SIZE_PADDING[size]}</td>
                <td className="py-2 font-mono text-xs">{PAGE_SIZE_GAP[size]}</td>
                <td className="py-2">{SKELETON_ICON_DIMENSIONS[size]}px</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="space-y-2">
        <h3 className="text-lg font-semibold">Utility Functions</h3>
        <div className="space-y-4">
          <div className="p-3 bg-muted rounded">
            <h4 className="font-mono text-sm">getBaseSize(size)</h4>
            <p className="text-sm text-muted-foreground">Resolves ResponsiveValue to base size</p>
            <code className="text-xs">
              getBaseSize({'{ base: "sm", md: "lg" }'}) = "{getBaseSize({ base: 'sm', md: 'lg' })}"
            </code>
          </div>
          <div className="p-3 bg-muted rounded">
            <h4 className="font-mono text-sm">getResponsiveSizeClasses(size, classMap)</h4>
            <p className="text-sm text-muted-foreground">Generates responsive Tailwind classes</p>
            <code className="text-xs block">
              getResponsiveSizeClasses("md", PAGE_SIZE_PADDING) = "
              {getResponsiveSizeClasses('md', PAGE_SIZE_PADDING)}"
            </code>
          </div>
          <div className="p-3 bg-muted rounded">
            <h4 className="font-mono text-sm">getSkeletonIconDimensions(size)</h4>
            <p className="text-sm text-muted-foreground">Gets icon pixel size for skeleton</p>
            <code className="text-xs">
              getSkeletonIconDimensions("lg") = {getSkeletonIconDimensions('lg')}px
            </code>
          </div>
          <div className="p-3 bg-muted rounded">
            <h4 className="font-mono text-sm">buildLoadedAnnouncement(count)</h4>
            <p className="text-sm text-muted-foreground">Builds SR announcement for loaded state</p>
            <code className="text-xs block">
              buildLoadedAnnouncement(4) = "{buildLoadedAnnouncement(4)}"
            </code>
            <code className="text-xs block">
              buildLoadedAnnouncement(0) = "{buildLoadedAnnouncement(0)}"
            </code>
          </div>
          <div className="p-3 bg-muted rounded">
            <h4 className="font-mono text-sm">buildPageAccessibleLabel(state, count)</h4>
            <p className="text-sm text-muted-foreground">Builds aria-label for page</p>
            <code className="text-xs block">
              buildPageAccessibleLabel("ready", 4) = "{buildPageAccessibleLabel('ready', 4)}"
            </code>
            <code className="text-xs block">
              buildPageAccessibleLabel("loading") = "{buildPageAccessibleLabel('loading')}"
            </code>
          </div>
        </div>
      </section>
    </div>
  ),
};
