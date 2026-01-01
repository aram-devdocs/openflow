import type { Project } from '@openflow/generated';
import type { Meta, StoryObj } from '@storybook/react';
import {
  CARD_PADDING_CLASSES,
  // Constants for accessibility documentation
  DEFAULT_CREATE_PROJECT_LABEL,
  DEFAULT_EMPTY_DESCRIPTION,
  DEFAULT_EMPTY_TITLE,
  DEFAULT_ERROR_RETRY_LABEL,
  DEFAULT_ERROR_TITLE,
  DEFAULT_GRID_LABEL,
  DEFAULT_NEW_PROJECT_LABEL,
  DEFAULT_PAGE_TITLE,
  DEFAULT_SKELETON_COUNT,
  GRID_GAP_CLASSES,
  ProjectCard,
  ProjectsGrid,
  ProjectsListContent,
  ProjectsListEmptyState,
  ProjectsListErrorState,
  ProjectsListHeader,
  ProjectsListLayout,
  ProjectsListLoadingSkeleton,
  SR_EMPTY,
  SR_ERROR,
  SR_LOADING,
  SR_PROJECT_CARD_LABEL,
  SR_SETTINGS_LABEL,
  // Utility functions
  buildProjectCardAccessibleLabel,
  buildProjectCountAnnouncement,
  buildSettingsAccessibleLabel,
  getBaseSize,
  getResponsiveSizeClasses,
} from './ProjectsListPageComponents';

// ============================================================================
// Meta
// ============================================================================

const meta: Meta = {
  title: 'Organisms/ProjectsListPageComponents',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
Projects list page components with comprehensive accessibility support.

## Accessibility Features

- **Semantic HTML**: Uses primitives (Heading, Text, VisuallyHidden, Flex) for proper structure
- **ARIA attributes**: role="status", role="alert", aria-live, aria-busy for state announcements
- **Keyboard navigation**: Focus rings with ring-offset for visibility
- **Touch targets**: Minimum 44px height for WCAG 2.5.5 compliance
- **Screen reader support**: VisuallyHidden announcements for state changes
- **List semantics**: Proper role="list" and role="listitem" for project grid

## Responsive Sizing

All components support responsive sizing via the \`size\` prop:
- String: \`'sm' | 'md' | 'lg'\`
- Responsive object: \`{ base: 'sm', md: 'md', lg: 'lg' }\`
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

const mockProjects: Project[] = [
  {
    id: 'proj-1',
    name: 'OpenFlow',
    icon: '🚀',
    gitRepoPath: '/Users/dev/openflow',
    baseBranch: 'main',
    setupScript: 'pnpm install',
    devScript: 'pnpm dev',
    workflowsFolder: '.workflows',
    createdAt: '2024-01-10T10:00:00Z',
    updatedAt: '2024-01-10T10:00:00Z',
  },
  {
    id: 'proj-2',
    name: 'MyApp',
    icon: '📱',
    gitRepoPath: '/Users/dev/myapp',
    baseBranch: 'develop',
    setupScript: 'npm install',
    devScript: 'npm run dev',
    workflowsFolder: '.workflows',
    createdAt: '2024-01-11T10:00:00Z',
    updatedAt: '2024-01-11T10:00:00Z',
  },
  {
    id: 'proj-3',
    name: 'Backend API',
    icon: '🔧',
    gitRepoPath: '/Users/dev/backend',
    baseBranch: 'main',
    setupScript: '',
    devScript: '',
    workflowsFolder: '.workflows',
    createdAt: '2024-01-12T10:00:00Z',
    updatedAt: '2024-01-12T10:00:00Z',
  },
  {
    id: 'proj-4',
    name: 'Mobile App',
    icon: '📲',
    gitRepoPath: '/Users/dev/mobile',
    baseBranch: 'main',
    setupScript: 'yarn install',
    devScript: 'yarn start',
    workflowsFolder: '.workflows',
    createdAt: '2024-01-13T10:00:00Z',
    updatedAt: '2024-01-13T10:00:00Z',
  },
  {
    id: 'proj-5',
    name: 'Data Pipeline',
    icon: '🔄',
    gitRepoPath: '/Users/dev/pipeline',
    baseBranch: 'main',
    setupScript: 'pip install -r requirements.txt',
    devScript: 'python main.py',
    workflowsFolder: '.workflows',
    createdAt: '2024-01-14T10:00:00Z',
    updatedAt: '2024-01-14T10:00:00Z',
  },
  {
    id: 'proj-6',
    name: 'Documentation',
    icon: '📚',
    gitRepoPath: '/Users/dev/docs',
    baseBranch: 'main',
    setupScript: 'npm install',
    devScript: 'npm run docs',
    workflowsFolder: '.workflows',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
];

const manyProjects: Project[] = Array.from({ length: 12 }, (_, i) => ({
  id: `proj-${i + 1}`,
  name: `Project ${i + 1}`,
  icon: ['🚀', '📱', '🔧', '📲', '🔄', '📚'][i % 6] ?? '📁',
  gitRepoPath: `/Users/dev/project-${i + 1}`,
  baseBranch: 'main',
  setupScript: 'npm install',
  devScript: 'npm run dev',
  workflowsFolder: '.workflows',
  createdAt: new Date(2024, 0, i + 1).toISOString(),
  updatedAt: new Date(2024, 0, i + 1).toISOString(),
}));

// ============================================================================
// ProjectsListLayout Stories
// ============================================================================

export const Layout: StoryObj<typeof ProjectsListLayout> = {
  name: 'ProjectsListLayout',
  render: () => (
    <ProjectsListLayout projectCount={3} onSearch={() => console.log('Search')}>
      <div className="p-8 text-center text-[rgb(var(--muted-foreground))]">Projects content</div>
    </ProjectsListLayout>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Main layout wrapper combining header and content areas.',
      },
    },
  },
};

export const LayoutWithManyProjects: StoryObj<typeof ProjectsListLayout> = {
  name: 'ProjectsListLayout - Many Projects',
  render: () => (
    <ProjectsListLayout projectCount={42} onSearch={() => console.log('Search')}>
      <div className="p-8 text-center text-[rgb(var(--muted-foreground))]">
        42 projects would be displayed here
      </div>
    </ProjectsListLayout>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Layout with a large project count.',
      },
    },
  },
};

// ============================================================================
// ProjectsListHeader Stories
// ============================================================================

export const Header: StoryObj<typeof ProjectsListHeader> = {
  name: 'ProjectsListHeader',
  render: () => (
    <div className="p-4">
      <ProjectsListHeader
        onCreateProject={() => console.log('Create project')}
        data-testid="header-default"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Header with title and create button.',
      },
    },
  },
};

export const HeaderSizes: StoryObj<typeof ProjectsListHeader> = {
  name: 'ProjectsListHeader - Sizes',
  render: () => (
    <div className="space-y-6 p-4">
      <div>
        <h3 className="text-sm font-medium mb-2">Small</h3>
        <ProjectsListHeader onCreateProject={() => {}} size="sm" data-testid="header-sm" />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Medium (default)</h3>
        <ProjectsListHeader onCreateProject={() => {}} size="md" data-testid="header-md" />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Large</h3>
        <ProjectsListHeader onCreateProject={() => {}} size="lg" data-testid="header-lg" />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Header at different sizes affects title and button sizing.',
      },
    },
  },
};

export const HeaderResponsive: StoryObj<typeof ProjectsListHeader> = {
  name: 'ProjectsListHeader - Responsive',
  render: () => (
    <div className="p-4">
      <ProjectsListHeader
        onCreateProject={() => {}}
        size={{ base: 'sm', md: 'md', lg: 'lg' }}
        data-testid="header-responsive"
      />
      <p className="mt-4 text-sm text-muted-foreground">
        Resize the viewport to see the header change size at different breakpoints.
      </p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Header can use responsive sizing with breakpoint-specific values.',
      },
    },
  },
};

export const HeaderAccessibility: StoryObj<typeof ProjectsListHeader> = {
  name: 'ProjectsListHeader - Accessibility',
  render: () => (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold">Accessibility Features</h2>
      <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
        <li>h1 heading for page title using Heading primitive</li>
        <li>Button has aria-label for screen readers</li>
        <li>Icon is aria-hidden="true"</li>
        <li>data-testid and data-size for testing</li>
      </ul>
      <div className="text-sm">
        <strong>Default labels:</strong>
        <p className="text-muted-foreground mt-1">Title: "{DEFAULT_PAGE_TITLE}"</p>
        <p className="text-muted-foreground">Button: "{DEFAULT_NEW_PROJECT_LABEL}"</p>
      </div>
      <ProjectsListHeader onCreateProject={() => {}} data-testid="header-a11y" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Header includes proper heading hierarchy and accessible button.',
      },
    },
  },
};

// ============================================================================
// ProjectsListLoadingSkeleton Stories
// ============================================================================

export const Loading: StoryObj<typeof ProjectsListLoadingSkeleton> = {
  name: 'ProjectsListLoadingSkeleton',
  render: () => <ProjectsListLoadingSkeleton count={6} data-testid="loading-default" />,
  parameters: {
    docs: {
      description: {
        story: 'Loading skeleton shown while projects are loading.',
      },
    },
  },
};

export const LoadingDefaultCount: StoryObj<typeof ProjectsListLoadingSkeleton> = {
  name: 'ProjectsListLoadingSkeleton - Default Count',
  render: () => (
    <div className="p-4">
      <p className="text-sm text-muted-foreground mb-4">
        Default skeleton count: {DEFAULT_SKELETON_COUNT} cards
      </p>
      <ProjectsListLoadingSkeleton data-testid="loading-default-count" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: `Default loading skeleton shows ${DEFAULT_SKELETON_COUNT} placeholder cards.`,
      },
    },
  },
};

export const LoadingCustomCount: StoryObj<typeof ProjectsListLoadingSkeleton> = {
  name: 'ProjectsListLoadingSkeleton - Custom Count',
  render: () => (
    <div className="space-y-8 p-4">
      <div>
        <h3 className="text-sm font-medium mb-2">3 Skeletons</h3>
        <ProjectsListLoadingSkeleton count={3} />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">12 Skeletons</h3>
        <ProjectsListLoadingSkeleton count={12} />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Skeleton count can be customized via the count prop.',
      },
    },
  },
};

export const LoadingSizes: StoryObj<typeof ProjectsListLoadingSkeleton> = {
  name: 'ProjectsListLoadingSkeleton - Sizes',
  render: () => (
    <div className="space-y-8 p-4">
      <div>
        <h3 className="text-sm font-medium mb-2">Small</h3>
        <ProjectsListLoadingSkeleton count={4} size="sm" data-testid="loading-sm" />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Large</h3>
        <ProjectsListLoadingSkeleton count={4} size="lg" data-testid="loading-lg" />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Loading skeleton at different sizes.',
      },
    },
  },
};

export const LoadingAccessibility: StoryObj<typeof ProjectsListLoadingSkeleton> = {
  name: 'ProjectsListLoadingSkeleton - Accessibility',
  render: () => (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold">Accessibility Features</h2>
      <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
        <li>role="status" announces loading state</li>
        <li>aria-busy="true" indicates ongoing operation</li>
        <li>aria-label provides loading message</li>
        <li>VisuallyHidden provides screen reader announcement</li>
        <li>aria-hidden="true" on visual skeleton elements</li>
      </ul>
      <div className="text-sm">
        <strong>Screen reader announcement:</strong>
        <p className="text-muted-foreground mt-1 font-mono text-xs bg-muted p-2 rounded">
          "{SR_LOADING}"
        </p>
      </div>
      <ProjectsListLoadingSkeleton count={4} data-testid="loading-a11y" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Loading skeleton uses ARIA attributes to announce loading state.',
      },
    },
  },
};

// ============================================================================
// ProjectsListEmptyState Stories
// ============================================================================

export const EmptyState: StoryObj<typeof ProjectsListEmptyState> = {
  name: 'ProjectsListEmptyState',
  render: () => (
    <div className="h-96 flex">
      <ProjectsListEmptyState
        onCreateProject={() => console.log('Create project')}
        data-testid="empty-default"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Empty state shown when no projects exist.',
      },
    },
  },
};

export const EmptyStateSizes: StoryObj<typeof ProjectsListEmptyState> = {
  name: 'ProjectsListEmptyState - Sizes',
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-medium mb-2">Small</h3>
        <div className="h-64 border rounded-lg flex">
          <ProjectsListEmptyState onCreateProject={() => {}} size="sm" />
        </div>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Medium (default)</h3>
        <div className="h-64 border rounded-lg flex">
          <ProjectsListEmptyState onCreateProject={() => {}} size="md" />
        </div>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Large</h3>
        <div className="h-64 border rounded-lg flex">
          <ProjectsListEmptyState onCreateProject={() => {}} size="lg" />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Empty state at different sizes.',
      },
    },
  },
};

export const EmptyStateAccessibility: StoryObj<typeof ProjectsListEmptyState> = {
  name: 'ProjectsListEmptyState - Accessibility',
  render: () => (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold">Accessibility Features</h2>
      <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
        <li>role="region" with aria-label for landmark navigation</li>
        <li>VisuallyHidden announcement for screen readers</li>
        <li>Button has minimum 44px touch target</li>
        <li>Focus ring with ring-offset for visibility</li>
      </ul>
      <div className="text-sm">
        <strong>Default text:</strong>
        <p className="text-muted-foreground mt-1">Title: "{DEFAULT_EMPTY_TITLE}"</p>
        <p className="text-muted-foreground">Description: "{DEFAULT_EMPTY_DESCRIPTION}"</p>
        <p className="text-muted-foreground">Button: "{DEFAULT_CREATE_PROJECT_LABEL}"</p>
        <p className="text-muted-foreground mt-2">Screen reader: "{SR_EMPTY}"</p>
      </div>
      <div className="h-64 border rounded-lg flex">
        <ProjectsListEmptyState onCreateProject={() => {}} data-testid="empty-a11y" />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Empty state includes comprehensive accessibility support.',
      },
    },
  },
};

// ============================================================================
// ProjectsListErrorState Stories
// ============================================================================

export const ErrorState: StoryObj<typeof ProjectsListErrorState> = {
  name: 'ProjectsListErrorState',
  render: () => (
    <div className="h-96 flex">
      <ProjectsListErrorState
        message="Unable to connect to the server. Please check your internet connection."
        onRetry={() => console.log('Retry clicked')}
        data-testid="error-default"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Error state shown when project loading fails.',
      },
    },
  },
};

export const ErrorStateWithoutRetry: StoryObj<typeof ProjectsListErrorState> = {
  name: 'ProjectsListErrorState - Without Retry',
  render: () => (
    <div className="h-96 flex">
      <ProjectsListErrorState
        message="This error cannot be recovered automatically."
        data-testid="error-no-retry"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Error state without retry button for non-recoverable errors.',
      },
    },
  },
};

export const ErrorStateWithoutMessage: StoryObj<typeof ProjectsListErrorState> = {
  name: 'ProjectsListErrorState - Without Message',
  render: () => (
    <div className="h-96 flex">
      <ProjectsListErrorState onRetry={() => console.log('Retry')} data-testid="error-no-msg" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Error state showing only title and retry button.',
      },
    },
  },
};

export const ErrorStateCustomLabels: StoryObj<typeof ProjectsListErrorState> = {
  name: 'ProjectsListErrorState - Custom Labels',
  render: () => (
    <div className="h-96 flex">
      <ProjectsListErrorState
        errorTitle="Connection Lost"
        message="Your session has expired."
        retryLabel="Reconnect"
        onRetry={() => console.log('Reconnect clicked')}
        data-testid="error-custom"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Error state with customized title and retry button label.',
      },
    },
  },
};

export const ErrorStateSizes: StoryObj<typeof ProjectsListErrorState> = {
  name: 'ProjectsListErrorState - Sizes',
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-medium mb-2">Small</h3>
        <div className="h-48 border rounded-lg flex">
          <ProjectsListErrorState message="Error occurred" onRetry={() => {}} size="sm" />
        </div>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Large</h3>
        <div className="h-48 border rounded-lg flex">
          <ProjectsListErrorState message="Error occurred" onRetry={() => {}} size="lg" />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Error state at different sizes.',
      },
    },
  },
};

export const ErrorStateAccessibility: StoryObj<typeof ProjectsListErrorState> = {
  name: 'ProjectsListErrorState - Accessibility',
  render: () => (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold">Accessibility Features</h2>
      <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
        <li>role="alert" for immediate announcement</li>
        <li>aria-live="assertive" for high-priority announcement</li>
        <li>VisuallyHidden provides error announcement</li>
        <li>Retry button has aria-label</li>
        <li>Icon is aria-hidden="true"</li>
      </ul>
      <div className="text-sm">
        <strong>Default labels:</strong>
        <p className="text-muted-foreground mt-1">Title: "{DEFAULT_ERROR_TITLE}"</p>
        <p className="text-muted-foreground">Button: "{DEFAULT_ERROR_RETRY_LABEL}"</p>
        <p className="text-muted-foreground mt-2">Screen reader: "{SR_ERROR}"</p>
      </div>
      <div className="h-64 border rounded-lg flex">
        <ProjectsListErrorState
          message="Example error message"
          onRetry={() => {}}
          data-testid="error-a11y"
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Error state uses role="alert" and aria-live="assertive" for immediate screen reader announcement.',
      },
    },
  },
};

// ============================================================================
// ProjectCard Stories
// ============================================================================

export const Card: StoryObj<typeof ProjectCard> = {
  name: 'ProjectCard',
  render: () => (
    <div className="w-80 p-4">
      <ProjectCard
        projectId="proj-1"
        name="OpenFlow"
        path="/Users/dev/openflow"
        icon="🚀"
        onSelect={() => console.log('Select')}
        onSettings={() => console.log('Settings')}
        data-testid="card-default"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Individual project card with icon, name, path, and actions.',
      },
    },
  },
};

export const CardWithFolderIcon: StoryObj<typeof ProjectCard> = {
  name: 'ProjectCard - Folder Icon',
  render: () => (
    <div className="w-80 p-4">
      <ProjectCard
        projectId="proj-folder"
        name="Generic Project"
        path="/Users/dev/generic"
        icon="folder"
        onSelect={() => console.log('Select')}
        onSettings={() => console.log('Settings')}
        data-testid="card-folder"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Card with "folder" icon shows a FolderGit2 lucide icon instead of emoji.',
      },
    },
  },
};

export const CardWithLongPath: StoryObj<typeof ProjectCard> = {
  name: 'ProjectCard - Long Path',
  render: () => (
    <div className="w-80 p-4">
      <ProjectCard
        projectId="proj-long"
        name="Very Long Project Name That Might Overflow"
        path="/Users/developer/projects/very/long/nested/path/to/project"
        icon="📦"
        onSelect={() => console.log('Select')}
        onSettings={() => console.log('Settings')}
        data-testid="card-long"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Card with long name and path demonstrates text truncation.',
      },
    },
  },
};

export const CardSizes: StoryObj<typeof ProjectCard> = {
  name: 'ProjectCard - Sizes',
  render: () => (
    <div className="space-y-6 p-4">
      <div>
        <h3 className="text-sm font-medium mb-2">Small</h3>
        <div className="w-72">
          <ProjectCard
            name="Small Card"
            path="/Users/dev/small"
            icon="🔧"
            onSelect={() => {}}
            onSettings={() => {}}
            size="sm"
            data-testid="card-sm"
          />
        </div>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Medium (default)</h3>
        <div className="w-80">
          <ProjectCard
            name="Medium Card"
            path="/Users/dev/medium"
            icon="📱"
            onSelect={() => {}}
            onSettings={() => {}}
            size="md"
            data-testid="card-md"
          />
        </div>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Large</h3>
        <div className="w-96">
          <ProjectCard
            name="Large Card"
            path="/Users/dev/large"
            icon="🚀"
            onSelect={() => {}}
            onSettings={() => {}}
            size="lg"
            data-testid="card-lg"
          />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'ProjectCard supports three sizes: sm, md (default), and lg.',
      },
    },
  },
};

export const CardResponsive: StoryObj<typeof ProjectCard> = {
  name: 'ProjectCard - Responsive',
  render: () => (
    <div className="p-4">
      <div className="max-w-md">
        <ProjectCard
          name="Responsive Card"
          path="/Users/dev/responsive"
          icon="📱"
          onSelect={() => {}}
          onSettings={() => {}}
          size={{ base: 'sm', md: 'md', lg: 'lg' }}
          data-testid="card-responsive"
        />
      </div>
      <p className="mt-4 text-sm text-muted-foreground">
        Resize the viewport to see the card change size at different breakpoints.
      </p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'ProjectCard can use responsive sizing with breakpoint-specific values.',
      },
    },
  },
};

export const CardAccessibility: StoryObj<typeof ProjectCard> = {
  name: 'ProjectCard - Accessibility',
  render: () => (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold">Accessibility Features</h2>
      <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
        <li>Button element for keyboard navigation</li>
        <li>aria-label combines name and path for screen readers</li>
        <li>Settings button has descriptive aria-label</li>
        <li>Minimum 44px touch targets (WCAG 2.5.5)</li>
        <li>Focus ring with ring-offset for visibility</li>
        <li>Icons are aria-hidden="true"</li>
      </ul>
      <div className="text-sm">
        <strong>Screen reader labels:</strong>
        <p className="text-muted-foreground mt-1 font-mono text-xs bg-muted p-2 rounded">
          Card: "{buildProjectCardAccessibleLabel('OpenFlow', '/Users/dev/openflow')}"
        </p>
        <p className="text-muted-foreground mt-1 font-mono text-xs bg-muted p-2 rounded">
          Settings: "{buildSettingsAccessibleLabel('OpenFlow')}"
        </p>
        <p className="text-muted-foreground mt-2">Template patterns:</p>
        <p className="text-muted-foreground text-xs">Card: "{SR_PROJECT_CARD_LABEL}"</p>
        <p className="text-muted-foreground text-xs">Settings: "{SR_SETTINGS_LABEL}"</p>
      </div>
      <div className="w-80">
        <ProjectCard
          name="OpenFlow"
          path="/Users/dev/openflow"
          icon="🚀"
          onSelect={() => {}}
          onSettings={() => {}}
          data-testid="card-a11y"
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'ProjectCard includes comprehensive accessibility for screen readers and keyboard.',
      },
    },
  },
};

export const CardHoverStates: StoryObj<typeof ProjectCard> = {
  name: 'ProjectCard - Hover States',
  render: () => (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold">Hover Interactions</h2>
      <p className="text-sm text-muted-foreground">
        Hover over the card to see the settings button and chevron indicator appear.
      </p>
      <div className="w-80">
        <ProjectCard
          name="Hover Me"
          path="/Users/dev/project"
          icon="🎯"
          onSelect={() => console.log('Selected!')}
          onSettings={() => console.log('Settings clicked!')}
          data-testid="card-hover"
        />
      </div>
      <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
        <li>Settings button appears on hover/focus</li>
        <li>Chevron indicator appears on hover</li>
        <li>Border color changes on hover</li>
        <li>Background subtly changes on hover</li>
      </ul>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Card hover states reveal additional interactive elements.',
      },
    },
  },
};

// ============================================================================
// ProjectsGrid Stories
// ============================================================================

export const Grid: StoryObj<typeof ProjectsGrid> = {
  name: 'ProjectsGrid',
  render: () => (
    <div className="p-4">
      <ProjectsGrid
        projects={mockProjects}
        onSelectProject={(id: string) => console.log('Project selected:', id)}
        onProjectSettings={(id: string) => console.log('Project settings:', id)}
        onDeleteProject={(id: string, name: string) => console.log('Delete project:', id, name)}
        data-testid="grid-default"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Responsive grid of project cards.',
      },
    },
  },
};

export const GridManyProjects: StoryObj<typeof ProjectsGrid> = {
  name: 'ProjectsGrid - Many Projects',
  render: () => (
    <div className="p-4">
      <ProjectsGrid
        projects={manyProjects}
        onSelectProject={(id: string) => console.log('Project selected:', id)}
        onProjectSettings={(id: string) => console.log('Project settings:', id)}
        onDeleteProject={(id: string, name: string) => console.log('Delete project:', id, name)}
        data-testid="grid-many"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Grid with many projects demonstrates responsive column behavior.',
      },
    },
  },
};

export const GridSingleProject: StoryObj<typeof ProjectsGrid> = {
  name: 'ProjectsGrid - Single Project',
  render: () => (
    <div className="p-4">
      <ProjectsGrid
        projects={mockProjects.slice(0, 1)}
        onSelectProject={(id: string) => console.log('Project selected:', id)}
        onProjectSettings={(id: string) => console.log('Project settings:', id)}
        onDeleteProject={(id: string, name: string) => console.log('Delete project:', id, name)}
        data-testid="grid-single"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Grid with a single project.',
      },
    },
  },
};

export const GridSizes: StoryObj<typeof ProjectsGrid> = {
  name: 'ProjectsGrid - Sizes',
  render: () => (
    <div className="space-y-8 p-4">
      <div>
        <h3 className="text-sm font-medium mb-2">Small</h3>
        <ProjectsGrid
          projects={mockProjects.slice(0, 3)}
          onSelectProject={() => {}}
          onProjectSettings={() => {}}
          onDeleteProject={() => {}}
          size="sm"
          data-testid="grid-sm"
        />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Large</h3>
        <ProjectsGrid
          projects={mockProjects.slice(0, 3)}
          onSelectProject={() => {}}
          onProjectSettings={() => {}}
          onDeleteProject={() => {}}
          size="lg"
          data-testid="grid-lg"
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Grid at different sizes affects gap and card sizing.',
      },
    },
  },
};

export const GridAccessibility: StoryObj<typeof ProjectsGrid> = {
  name: 'ProjectsGrid - Accessibility',
  render: () => (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold">Accessibility Features</h2>
      <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
        <li>role="region" with aria-labelledby heading</li>
        <li>VisuallyHidden heading for screen readers</li>
        <li>role="list" for proper list semantics</li>
        <li>role="listitem" for each project card</li>
        <li>Project count announcement via aria-live="polite"</li>
      </ul>
      <div className="text-sm">
        <strong>Screen reader announcements:</strong>
        <p className="text-muted-foreground mt-1 font-mono text-xs bg-muted p-2 rounded">
          "{buildProjectCountAnnouncement(mockProjects.length)}"
        </p>
        <p className="text-muted-foreground mt-2">Default grid label: "{DEFAULT_GRID_LABEL}"</p>
      </div>
      <ProjectsGrid
        projects={mockProjects.slice(0, 3)}
        onSelectProject={() => {}}
        onProjectSettings={() => {}}
        onDeleteProject={() => {}}
        gridLabel="Custom grid region label"
        data-testid="grid-a11y"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Grid includes proper list semantics and screen reader announcements.',
      },
    },
  },
};

// ============================================================================
// ProjectsListContent Stories
// ============================================================================

export const ContentWithProjects: StoryObj<typeof ProjectsListContent> = {
  name: 'ProjectsListContent - With Projects',
  render: () => (
    <ProjectsListContent
      projects={mockProjects}
      isLoading={false}
      onSelectProject={(id: string) => console.log('Project selected:', id)}
      onProjectSettings={(id: string) => console.log('Project settings:', id)}
      onDeleteProject={(id: string, name: string) => console.log('Delete project:', id, name)}
      onCreateProject={() => console.log('Create')}
      data-testid="content-loaded"
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Content with projects loaded and displayed.',
      },
    },
  },
};

export const ContentEmpty: StoryObj<typeof ProjectsListContent> = {
  name: 'ProjectsListContent - Empty',
  render: () => (
    <div className="h-96 flex">
      <ProjectsListContent
        projects={[]}
        isLoading={false}
        onSelectProject={() => {}}
        onProjectSettings={() => {}}
        onDeleteProject={() => {}}
        onCreateProject={() => console.log('Create')}
        data-testid="content-empty"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Content shows empty state when no projects exist.',
      },
    },
  },
};

export const ContentLoading: StoryObj<typeof ProjectsListContent> = {
  name: 'ProjectsListContent - Loading',
  render: () => (
    <ProjectsListContent
      projects={[]}
      isLoading={true}
      onSelectProject={() => {}}
      onProjectSettings={() => {}}
      onDeleteProject={() => {}}
      onCreateProject={() => {}}
      data-testid="content-loading"
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Content shows loading skeleton while projects are loading.',
      },
    },
  },
};

export const ContentError: StoryObj<typeof ProjectsListContent> = {
  name: 'ProjectsListContent - Error',
  render: () => (
    <div className="h-96 flex">
      <ProjectsListContent
        projects={[]}
        isLoading={false}
        onSelectProject={() => {}}
        onProjectSettings={() => {}}
        onDeleteProject={() => {}}
        onCreateProject={() => {}}
        error="Failed to load projects. Please try again."
        onRetry={() => console.log('Retry clicked')}
        data-testid="content-error"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Content shows error state when loading fails.',
      },
    },
  },
};

export const ContentAllStates: StoryObj<typeof ProjectsListContent> = {
  name: 'ProjectsListContent - All States',
  render: () => (
    <div className="grid grid-cols-2 gap-4 p-4">
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-muted px-3 py-2 text-sm font-medium">Empty (No Projects)</div>
        <div className="h-64 flex">
          <ProjectsListContent
            projects={[]}
            isLoading={false}
            onSelectProject={() => {}}
            onProjectSettings={() => {}}
            onDeleteProject={() => {}}
            onCreateProject={() => {}}
          />
        </div>
      </div>
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-muted px-3 py-2 text-sm font-medium">Loading</div>
        <div className="h-64 overflow-hidden">
          <ProjectsListContent
            projects={[]}
            isLoading={true}
            onSelectProject={() => {}}
            onProjectSettings={() => {}}
            onDeleteProject={() => {}}
            onCreateProject={() => {}}
          />
        </div>
      </div>
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-muted px-3 py-2 text-sm font-medium">Error</div>
        <div className="h-64 flex">
          <ProjectsListContent
            projects={[]}
            isLoading={false}
            onSelectProject={() => {}}
            onProjectSettings={() => {}}
            onDeleteProject={() => {}}
            onCreateProject={() => {}}
            error="Connection failed"
            onRetry={() => {}}
          />
        </div>
      </div>
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-muted px-3 py-2 text-sm font-medium">Loaded</div>
        <div className="h-64 overflow-auto">
          <ProjectsListContent
            projects={mockProjects}
            isLoading={false}
            onSelectProject={() => {}}
            onProjectSettings={() => {}}
            onDeleteProject={() => {}}
            onCreateProject={() => {}}
          />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Overview of all ProjectsListContent states side by side.',
      },
    },
  },
};

export const ContentSizes: StoryObj<typeof ProjectsListContent> = {
  name: 'ProjectsListContent - Sizes',
  render: () => (
    <div className="space-y-8 p-4">
      <div>
        <h3 className="text-sm font-medium mb-2">Small</h3>
        <ProjectsListContent
          projects={mockProjects.slice(0, 3)}
          isLoading={false}
          onSelectProject={() => {}}
          onProjectSettings={() => {}}
          onDeleteProject={() => {}}
          onCreateProject={() => {}}
          size="sm"
        />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Large</h3>
        <ProjectsListContent
          projects={mockProjects.slice(0, 3)}
          isLoading={false}
          onSelectProject={() => {}}
          onProjectSettings={() => {}}
          onDeleteProject={() => {}}
          onCreateProject={() => {}}
          size="lg"
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Content at different sizes.',
      },
    },
  },
};

// ============================================================================
// Utility Functions Stories
// ============================================================================

export const UtilityFunctions: StoryObj = {
  name: 'Utility Functions',
  render: () => (
    <div className="p-4 space-y-6">
      <h2 className="text-lg font-semibold">Exported Utility Functions</h2>

      <div className="space-y-4">
        <div className="border rounded-lg p-4">
          <h3 className="font-medium mb-2">getBaseSize()</h3>
          <p className="text-sm text-muted-foreground mb-2">
            Extracts base size from a responsive value.
          </p>
          <pre className="text-xs bg-muted p-2 rounded">
            {`getBaseSize('lg') → '${getBaseSize('lg')}'
getBaseSize({ base: 'sm', md: 'lg' }) → '${getBaseSize({ base: 'sm', md: 'lg' })}'`}
          </pre>
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="font-medium mb-2">getResponsiveSizeClasses()</h3>
          <p className="text-sm text-muted-foreground mb-2">
            Generates responsive Tailwind classes from size values.
          </p>
          <pre className="text-xs bg-muted p-2 rounded whitespace-pre-wrap">
            {`getResponsiveSizeClasses('md', CARD_PADDING_CLASSES)
→ '${getResponsiveSizeClasses('md', CARD_PADDING_CLASSES)}'

getResponsiveSizeClasses({ base: 'sm', lg: 'lg' }, GRID_GAP_CLASSES)
→ '${getResponsiveSizeClasses({ base: 'sm', lg: 'lg' }, GRID_GAP_CLASSES)}'`}
          </pre>
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="font-medium mb-2">buildProjectCardAccessibleLabel()</h3>
          <p className="text-sm text-muted-foreground mb-2">
            Builds accessible label for project card.
          </p>
          <pre className="text-xs bg-muted p-2 rounded">
            {`buildProjectCardAccessibleLabel('OpenFlow', '/dev/openflow')
→ '${buildProjectCardAccessibleLabel('OpenFlow', '/dev/openflow')}'`}
          </pre>
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="font-medium mb-2">buildSettingsAccessibleLabel()</h3>
          <p className="text-sm text-muted-foreground mb-2">
            Builds accessible label for settings button.
          </p>
          <pre className="text-xs bg-muted p-2 rounded">
            {`buildSettingsAccessibleLabel('OpenFlow')
→ '${buildSettingsAccessibleLabel('OpenFlow')}'`}
          </pre>
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="font-medium mb-2">buildProjectCountAnnouncement()</h3>
          <p className="text-sm text-muted-foreground mb-2">
            Builds screen reader announcement for project count.
          </p>
          <pre className="text-xs bg-muted p-2 rounded">
            {`buildProjectCountAnnouncement(1) → '${buildProjectCountAnnouncement(1)}'
buildProjectCountAnnouncement(5) → '${buildProjectCountAnnouncement(5)}'`}
          </pre>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Utility functions exported for use in consuming components.',
      },
    },
  },
};

// ============================================================================
// Accessibility Overview Story
// ============================================================================

export const AccessibilityOverview: StoryObj = {
  name: 'Accessibility Overview',
  render: () => (
    <div className="p-6 space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold mb-4">Accessibility Features</h1>
        <p className="text-muted-foreground">
          Projects list components include comprehensive accessibility support following WCAG 2.1 AA
          guidelines.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Semantic Structure</h2>
        <ul className="list-disc list-inside space-y-2 text-sm">
          <li>
            <strong>Primitives:</strong> Uses Heading, Text, VisuallyHidden, Flex from
            @openflow/primitives
          </li>
          <li>
            <strong>Landmarks:</strong> role="region" with aria-labelledby for navigation
          </li>
          <li>
            <strong>Lists:</strong> role="list" and role="listitem" for project grid
          </li>
        </ul>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">ARIA Attributes</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="border rounded p-3">
            <strong className="block mb-1">Loading States</strong>
            <code className="text-xs">role="status" aria-busy="true"</code>
          </div>
          <div className="border rounded p-3">
            <strong className="block mb-1">Error States</strong>
            <code className="text-xs">role="alert" aria-live="assertive"</code>
          </div>
          <div className="border rounded p-3">
            <strong className="block mb-1">Empty States</strong>
            <code className="text-xs">role="region" aria-label="..."</code>
          </div>
          <div className="border rounded p-3">
            <strong className="block mb-1">Project Announcements</strong>
            <code className="text-xs">aria-live="polite"</code>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Touch Targets (WCAG 2.5.5)</h2>
        <p className="text-sm text-muted-foreground">
          All interactive elements have minimum 44px touch targets for mobile accessibility.
        </p>
        <div className="flex gap-4 items-center">
          <div className="w-11 h-11 border-2 border-dashed border-muted-foreground flex items-center justify-center text-xs">
            44px
          </div>
          <span className="text-sm">Minimum touch target size</span>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Focus Management</h2>
        <ul className="list-disc list-inside space-y-2 text-sm">
          <li>Focus rings with ring-offset for visibility against backgrounds</li>
          <li>Keyboard navigation support for all interactive elements</li>
          <li>Tab order follows visual layout</li>
        </ul>
        <div className="p-4 bg-muted rounded">
          <p className="text-sm mb-2">Example focus style:</p>
          <button
            type="button"
            className="px-4 py-2 bg-primary text-primary-foreground rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Focus me
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Screen Reader Support</h2>
        <ul className="list-disc list-inside space-y-2 text-sm">
          <li>VisuallyHidden components for screen reader announcements</li>
          <li>Descriptive aria-labels on all interactive elements</li>
          <li>Status announcements via aria-live regions</li>
        </ul>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Color & Contrast</h2>
        <ul className="list-disc list-inside space-y-2 text-sm">
          <li>All text meets WCAG AA contrast requirements</li>
          <li>Focus indicators visible against all backgrounds</li>
          <li>Error states use high-contrast colors</li>
        </ul>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Overview of all accessibility features implemented in ProjectsListPageComponents.',
      },
    },
  },
};
