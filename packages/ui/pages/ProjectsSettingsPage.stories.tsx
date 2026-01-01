/**
 * Storybook stories for ProjectsSettingsPage
 *
 * Demonstrates the project settings page in various states:
 * - Loading state
 * - Empty state (no projects)
 * - Error state with retry
 * - Loading project state
 * - Ready state with form
 * - Unsaved changes
 * - Saving state
 * - Error state
 *
 * Also includes:
 * - Responsive sizing demos
 * - Accessibility demos (keyboard navigation, screen reader, focus ring)
 * - Sub-components (skeleton and error)
 * - Ref forwarding demos
 * - Data attributes demos
 * - Constants reference
 */

import type { Project } from '@openflow/generated';
import type { Meta, StoryObj } from '@storybook/react';
import { useRef } from 'react';
import { Button } from '../atoms/Button';
import type { ProjectSettingsFormData } from '../organisms/ProjectSettingsPageComponents';
import {
  DEFAULT_ERROR_TITLE,
  DEFAULT_PAGE_LABEL,
  DEFAULT_PAGE_SIZE,
  DEFAULT_RETRY_LABEL,
  DEFAULT_SKELETON_FIELDS_PER_SECTION,
  // Constants
  DEFAULT_SKELETON_SECTION_COUNT,
  PAGE_SIZE_GAP,
  PAGE_SIZE_PADDING,
  PROJECTS_SETTINGS_PAGE_BASE_CLASSES,
  PROJECTS_SETTINGS_PAGE_ERROR_CLASSES,
  PROJECTS_SETTINGS_PAGE_SKELETON_CLASSES,
  ProjectsSettingsPage,
  ProjectsSettingsPageError,
  type ProjectsSettingsPageProps,
  ProjectsSettingsPageSkeleton,
  SR_EMPTY,
  SR_ERROR_PREFIX,
  SR_LOADED_PREFIX,
  SR_LOADING,
  SR_LOADING_PROJECT,
  SR_PROJECT_SELECTED,
} from './ProjectsSettingsPage';

const meta: Meta<typeof ProjectsSettingsPage> = {
  title: 'Pages/ProjectsSettingsPage',
  component: ProjectsSettingsPage,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="max-w-3xl mx-auto p-6">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ProjectsSettingsPage>;

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
    cleanupScript: 'pnpm clean',
    workflowsFolder: '.openflow/workflows',
    icon: 'folder',
    ruleFolders: '[".openflow/rules"]',
    alwaysIncludedRules: '["CLAUDE.md"]',
    verificationConfig: '{"typecheck": "pnpm typecheck", "lint": "pnpm lint"}',
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
    workflowsFolder: '.workflows',
    icon: 'lock',
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-14T09:00:00Z',
  },
];

const mockFormData: ProjectSettingsFormData = {
  name: 'OpenFlow',
  icon: 'folder',
  baseBranch: 'main',
  workflowsFolder: '.openflow/workflows',
  setupScript: 'pnpm install',
  devScript: 'pnpm dev',
  cleanupScript: 'pnpm clean',
  ruleFolders: '[".openflow/rules"]',
  alwaysIncludedRules: '["CLAUDE.md"]',
  verificationConfig: '{"typecheck": "pnpm typecheck", "lint": "pnpm lint"}',
};

const mockSelectorOptions = mockProjects.map((p) => ({
  value: p.id,
  label: p.name,
}));

// ============================================================================
// Helper functions
// ============================================================================

const noop = () => {};
const noopString = (_s: string) => {};
const noopFormChange =
  (_field: keyof ProjectSettingsFormData) =>
  (_e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {};

// ============================================================================
// Default Props Factory
// ============================================================================

// Default sub-props extracted for reuse without non-null assertions
const defaultSelector = {
  options: mockSelectorOptions,
  selectedProjectId: 'project-1',
  onSelect: noopString,
  hasChanges: false,
  saveSuccess: false,
};

const defaultForm = {
  formData: mockFormData,
  onFormChange: noopFormChange,
  isSaving: false,
  hasChanges: false,
  saveError: null as string | null,
  onSave: noop,
};

function createDefaultProps(
  overrides?: Partial<ProjectsSettingsPageProps>
): ProjectsSettingsPageProps {
  return {
    state: 'ready',
    selector: defaultSelector,
    project: mockProjects[0],
    form: defaultForm,
    ...overrides,
  };
}

// ============================================================================
// Basic Examples
// ============================================================================

/**
 * Default project settings page in ready state
 */
export const Default: Story = {
  args: createDefaultProps(),
};

/**
 * Loading projects state - shows skeleton
 */
export const Loading: Story = {
  args: {
    state: 'loading',
  },
};

/**
 * Empty state - no projects available
 */
export const Empty: Story = {
  args: {
    state: 'empty',
  },
};

/**
 * Error state with retry button
 */
export const ErrorState: Story = {
  args: {
    state: 'error',
    error: {
      error: 'Failed to load project settings. Network connection timed out.',
      onRetry: () => console.log('Retry clicked'),
    },
  },
};

/**
 * Loading selected project state
 */
export const LoadingProject: Story = {
  args: {
    state: 'loading-project',
    selector: {
      options: mockSelectorOptions,
      selectedProjectId: 'project-1',
      onSelect: noopString,
      hasChanges: false,
      saveSuccess: false,
    },
  },
};

// ============================================================================
// Form States
// ============================================================================

/**
 * With unsaved changes
 */
export const UnsavedChanges: Story = {
  args: createDefaultProps({
    selector: {
      ...defaultSelector,
      hasChanges: true,
    },
    form: {
      ...defaultForm,
      formData: {
        ...mockFormData,
        name: 'OpenFlow Updated',
      },
      hasChanges: true,
    },
  }),
};

/**
 * Save success state
 */
export const SaveSuccess: Story = {
  args: createDefaultProps({
    selector: {
      ...defaultSelector,
      saveSuccess: true,
    },
  }),
};

/**
 * Saving in progress
 */
export const Saving: Story = {
  args: createDefaultProps({
    selector: {
      ...defaultSelector,
      hasChanges: true,
    },
    form: {
      ...defaultForm,
      hasChanges: true,
      isSaving: true,
    },
  }),
};

/**
 * Save error state
 */
export const SaveError: Story = {
  args: createDefaultProps({
    selector: {
      ...defaultSelector,
      hasChanges: true,
    },
    form: {
      ...defaultForm,
      hasChanges: true,
      saveError: 'Failed to save project settings. Please try again.',
    },
  }),
};

// ============================================================================
// Size Variants
// ============================================================================

/**
 * Small size variant
 */
export const SizeSmall: Story = {
  args: createDefaultProps({
    size: 'sm',
  }),
};

/**
 * Medium size variant (default)
 */
export const SizeMedium: Story = {
  args: createDefaultProps({
    size: 'md',
  }),
};

/**
 * Large size variant
 */
export const SizeLarge: Story = {
  args: createDefaultProps({
    size: 'lg',
  }),
};

/**
 * Responsive sizing (changes based on viewport)
 */
export const ResponsiveSizing: Story = {
  args: createDefaultProps({
    size: { base: 'sm', md: 'md', lg: 'lg' },
  }),
};

// ============================================================================
// Content Variations
// ============================================================================

/**
 * Different project selected
 */
export const DifferentProject: Story = {
  args: createDefaultProps({
    selector: {
      ...defaultSelector,
      selectedProjectId: 'project-2',
    },
    project: mockProjects[1],
    form: {
      ...defaultForm,
      formData: {
        name: 'Auth Service',
        icon: 'lock',
        baseBranch: 'main',
        workflowsFolder: '.workflows',
        setupScript: 'npm install',
        devScript: 'npm run dev',
        cleanupScript: '',
        ruleFolders: '',
        alwaysIncludedRules: '',
        verificationConfig: '',
      },
    },
  }),
};

/**
 * Single project
 */
export const SingleProject: Story = {
  args: createDefaultProps({
    selector: {
      options: mockSelectorOptions[0] ? [mockSelectorOptions[0]] : [],
      selectedProjectId: 'project-1',
      onSelect: noopString,
      hasChanges: false,
      saveSuccess: false,
    },
  }),
};

/**
 * Many projects in selector
 */
export const ManyProjects: Story = {
  args: createDefaultProps({
    selector: {
      options: [
        ...mockSelectorOptions,
        ...Array.from({ length: 10 }, (_, i) => ({
          value: `project-extra-${i}`,
          label: `Project ${i + 3}`,
        })),
      ],
      selectedProjectId: 'project-1',
      onSelect: noopString,
      hasChanges: false,
      saveSuccess: false,
    },
  }),
};

/**
 * Minimal project config
 */
export const MinimalConfig: Story = {
  args: createDefaultProps({
    form: {
      ...defaultForm,
      formData: {
        name: 'Simple Project',
        icon: '',
        baseBranch: 'main',
        workflowsFolder: '.workflows',
        setupScript: '',
        devScript: '',
        cleanupScript: '',
        ruleFolders: '',
        alwaysIncludedRules: '',
        verificationConfig: '',
      },
    },
  }),
};

/**
 * Full project config
 */
export const FullConfig: Story = {
  args: createDefaultProps({
    form: {
      ...defaultForm,
      formData: {
        name: 'Enterprise App',
        icon: 'building',
        baseBranch: 'develop',
        workflowsFolder: '.openflow/workflows',
        setupScript: 'pnpm install && pnpm prisma generate && pnpm db:migrate',
        devScript: 'pnpm dev',
        cleanupScript: 'pnpm clean && rm -rf node_modules/.cache',
        ruleFolders: '[".openflow/rules", ".openflow/guidelines"]',
        alwaysIncludedRules: '["CLAUDE.md", "SECURITY.md", "ARCHITECTURE.md"]',
        verificationConfig:
          '{"typecheck": "pnpm typecheck", "lint": "pnpm lint", "test": "pnpm test", "build": "pnpm build"}',
      },
    },
  }),
};

// ============================================================================
// Sub-Components
// ============================================================================

/**
 * Skeleton component standalone
 */
export const SkeletonDemo: StoryObj<typeof ProjectsSettingsPageSkeleton> = {
  render: () => (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-lg font-bold mb-4">Skeleton Component</h2>
      <ProjectsSettingsPageSkeleton />
    </div>
  ),
};

/**
 * Skeleton with custom section count
 */
export const SkeletonCustomCount: StoryObj<typeof ProjectsSettingsPageSkeleton> = {
  render: () => (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-lg font-bold mb-4">Skeleton with 2 Sections</h2>
      <ProjectsSettingsPageSkeleton sectionCount={2} fieldsPerSection={2} />
    </div>
  ),
};

/**
 * Error component standalone
 */
export const ErrorDemo: StoryObj<typeof ProjectsSettingsPageError> = {
  render: () => (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-lg font-bold mb-4">Error Component</h2>
      <ProjectsSettingsPageError
        error="Failed to load project settings. Please check your network connection."
        onRetry={() => console.log('Retry clicked')}
      />
    </div>
  ),
};

// ============================================================================
// Accessibility Demos
// ============================================================================

/**
 * Focus ring visibility demo
 */
export const FocusRingVisibility: Story = {
  args: createDefaultProps({
    selector: {
      ...defaultSelector,
      hasChanges: true,
    },
    form: {
      ...defaultForm,
      hasChanges: true,
    },
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Tab through the form to see focus rings on all interactive elements. Focus rings have ring-offset for visibility on all backgrounds.',
      },
    },
  },
};

/**
 * Screen reader accessibility demo
 */
export const ScreenReaderAccessibility: Story = {
  args: createDefaultProps(),
  parameters: {
    docs: {
      description: {
        story: `
          Screen reader features:
          - Page container has aria-label for context
          - VisuallyHidden announcements for state changes
          - Form sections have aria-labelledby for heading association
          - Badges have aria-label for status context
          - Save button announces loading state with aria-busy
        `,
      },
    },
  },
};

/**
 * Keyboard navigation demo
 */
export const KeyboardNavigation: Story = {
  args: createDefaultProps({
    selector: {
      ...defaultSelector,
      hasChanges: true,
    },
    form: {
      ...defaultForm,
      hasChanges: true,
    },
  }),
  parameters: {
    docs: {
      description: {
        story: `
          Keyboard navigation:
          - Tab to move between form fields
          - Dropdown uses arrow keys for navigation
          - Enter/Space to activate buttons
          - All form controls are keyboard accessible
        `,
      },
    },
  },
};

/**
 * Touch target accessibility demo
 */
export const TouchTargetAccessibility: Story = {
  args: createDefaultProps({
    selector: {
      ...defaultSelector,
      hasChanges: true,
    },
    form: {
      ...defaultForm,
      hasChanges: true,
    },
    size: 'sm',
  }),
  parameters: {
    docs: {
      description: {
        story:
          'All interactive elements meet WCAG 2.5.5 minimum touch target size of 44x44px on mobile devices.',
      },
    },
  },
};

// ============================================================================
// Ref Forwarding & Data Attributes
// ============================================================================

/**
 * Ref forwarding demo
 */
export const RefForwardingDemo: StoryObj<typeof ProjectsSettingsPage> = {
  render: function RefDemo() {
    const pageRef = useRef<HTMLDivElement>(null);

    const handleFocus = () => {
      pageRef.current?.focus();
      console.log('Page element:', pageRef.current);
    };

    return (
      <div className="space-y-4">
        <Button onClick={handleFocus}>Focus Page Container</Button>
        <ProjectsSettingsPage ref={pageRef} {...createDefaultProps()} />
      </div>
    );
  },
};

/**
 * Data attributes demo
 */
export const DataAttributesDemo: Story = {
  args: createDefaultProps({
    'data-testid': 'my-projects-settings',
    selector: {
      ...defaultSelector,
      hasChanges: true,
    },
    form: {
      ...defaultForm,
      hasChanges: true,
    },
  }),
  parameters: {
    docs: {
      description: {
        story: `
          Data attributes available:
          - data-testid: Custom test ID for automation
          - data-state: Current page state (loading, empty, error, loading-project, ready)
          - data-size: Current size variant
          - data-project-id: Selected project ID
          - data-has-changes: Whether there are unsaved changes
          - data-save-success: Whether save was successful
        `,
      },
    },
  },
};

// ============================================================================
// Real-World Examples
// ============================================================================

/**
 * Settings route simulation - loading then ready
 */
export const SettingsRouteSimulation: StoryObj<typeof ProjectsSettingsPage> = {
  render: function SettingsRoute() {
    const [state, setState] = React.useState<ProjectsSettingsPageProps['state']>('loading');

    React.useEffect(() => {
      const timer = setTimeout(() => {
        setState('ready');
      }, 2000);
      return () => clearTimeout(timer);
    }, []);

    if (state === 'loading') {
      return <ProjectsSettingsPage state="loading" />;
    }

    return <ProjectsSettingsPage {...createDefaultProps({ state })} />;
  },
};

// Need to import React for the simulation
import React from 'react';

/**
 * Interactive form with state management
 */
export const InteractiveFormDemo: StoryObj<typeof ProjectsSettingsPage> = {
  render: function InteractiveDemo() {
    const [formData, setFormData] = React.useState<ProjectSettingsFormData>(mockFormData);
    const [hasChanges, setHasChanges] = React.useState(false);
    const [isSaving, setIsSaving] = React.useState(false);
    const [saveSuccess, setSaveSuccess] = React.useState(false);

    const handleFormChange =
      (field: keyof ProjectSettingsFormData) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData((prev) => ({ ...prev, [field]: e.target.value }));
        setHasChanges(true);
        setSaveSuccess(false);
      };

    const handleSave = () => {
      setIsSaving(true);
      setTimeout(() => {
        setIsSaving(false);
        setHasChanges(false);
        setSaveSuccess(true);
      }, 1000);
    };

    return (
      <ProjectsSettingsPage
        state="ready"
        selector={{
          ...defaultSelector,
          hasChanges,
          saveSuccess,
        }}
        project={mockProjects[0]}
        form={{
          formData,
          onFormChange: handleFormChange,
          isSaving,
          hasChanges,
          saveError: null,
          onSave: handleSave,
        }}
      />
    );
  },
};

// ============================================================================
// Constants Reference
// ============================================================================

/**
 * Constants reference for developers
 */
export const ConstantsReference: Story = {
  render: () => (
    <div className="space-y-6 p-4">
      <h2 className="text-xl font-bold">Constants Reference</h2>

      <section>
        <h3 className="text-lg font-semibold mb-2">Default Values</h3>
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <dt className="font-mono">DEFAULT_SKELETON_SECTION_COUNT</dt>
          <dd>{DEFAULT_SKELETON_SECTION_COUNT}</dd>
          <dt className="font-mono">DEFAULT_SKELETON_FIELDS_PER_SECTION</dt>
          <dd>{DEFAULT_SKELETON_FIELDS_PER_SECTION}</dd>
          <dt className="font-mono">DEFAULT_PAGE_SIZE</dt>
          <dd>"{DEFAULT_PAGE_SIZE}"</dd>
          <dt className="font-mono">DEFAULT_PAGE_LABEL</dt>
          <dd>"{DEFAULT_PAGE_LABEL}"</dd>
          <dt className="font-mono">DEFAULT_ERROR_TITLE</dt>
          <dd>"{DEFAULT_ERROR_TITLE}"</dd>
          <dt className="font-mono">DEFAULT_RETRY_LABEL</dt>
          <dd>"{DEFAULT_RETRY_LABEL}"</dd>
        </dl>
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-2">Screen Reader Texts</h3>
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <dt className="font-mono">SR_LOADING</dt>
          <dd>"{SR_LOADING}"</dd>
          <dt className="font-mono">SR_LOADING_PROJECT</dt>
          <dd>"{SR_LOADING_PROJECT}"</dd>
          <dt className="font-mono">SR_ERROR_PREFIX</dt>
          <dd>"{SR_ERROR_PREFIX}"</dd>
          <dt className="font-mono">SR_EMPTY</dt>
          <dd>"{SR_EMPTY}"</dd>
          <dt className="font-mono">SR_LOADED_PREFIX</dt>
          <dd>"{SR_LOADED_PREFIX}"</dd>
          <dt className="font-mono">SR_PROJECT_SELECTED</dt>
          <dd>"{SR_PROJECT_SELECTED}"</dd>
        </dl>
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-2">CSS Classes</h3>
        <dl className="space-y-1 text-sm">
          <dt className="font-mono">PROJECTS_SETTINGS_PAGE_BASE_CLASSES</dt>
          <dd className="text-muted-foreground">"{PROJECTS_SETTINGS_PAGE_BASE_CLASSES}"</dd>
          <dt className="font-mono">PROJECTS_SETTINGS_PAGE_ERROR_CLASSES</dt>
          <dd className="text-muted-foreground">"{PROJECTS_SETTINGS_PAGE_ERROR_CLASSES}"</dd>
          <dt className="font-mono">PROJECTS_SETTINGS_PAGE_SKELETON_CLASSES</dt>
          <dd className="text-muted-foreground">"{PROJECTS_SETTINGS_PAGE_SKELETON_CLASSES}"</dd>
        </dl>
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-2">Size Mappings</h3>
        <dl className="space-y-1 text-sm">
          <dt className="font-mono">PAGE_SIZE_PADDING</dt>
          <dd className="text-muted-foreground">{JSON.stringify(PAGE_SIZE_PADDING)}</dd>
          <dt className="font-mono">PAGE_SIZE_GAP</dt>
          <dd className="text-muted-foreground">{JSON.stringify(PAGE_SIZE_GAP)}</dd>
        </dl>
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-2">Utility Functions</h3>
        <ul className="list-disc list-inside text-sm space-y-1">
          <li>
            <code>getBaseSize(size)</code> - Resolves ResponsiveValue to base size
          </li>
          <li>
            <code>getResponsiveSizeClasses(size, classMap)</code> - Generates responsive classes
          </li>
          <li>
            <code>buildLoadedAnnouncement(projectName, hasChanges, saveSuccess)</code> - Screen
            reader text
          </li>
          <li>
            <code>buildPageAccessibleLabel(state)</code> - Accessible page label
          </li>
        </ul>
      </section>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Reference for all exported constants, CSS classes, and utility functions.',
      },
    },
  },
};
