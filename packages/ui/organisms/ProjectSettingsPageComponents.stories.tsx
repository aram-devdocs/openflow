import type { Project } from '@openflow/generated';
import type { Meta, StoryObj } from '@storybook/react';
import { FolderGit2 } from 'lucide-react';
import {
  BasicInfoSection,
  // Constants
  PROJECT_SETTINGS_SIZE_CLASSES,
  ProjectSettingsContent,
  ProjectSettingsEmptyState,
  ProjectSettingsErrorState,
  ProjectSettingsForm,
  type ProjectSettingsFormData,
  ProjectSettingsLayout,
  ProjectSettingsLoadingSkeleton,
  ProjectSettingsSelector,
  RulesSection,
  SECTION_DESCRIPTIONS,
  SECTION_ICONS,
  SECTION_TITLES,
  SaveFooter,
  ScriptsSection,
  SettingsSection,
  VerificationSection,
  WorkflowsSection,
  buildSectionAccessibleLabel,
  buildSelectorAnnouncement,
  buildStatusAnnouncement,
  // Utility functions
  getBaseSize,
  getResponsiveSizeClasses,
} from './ProjectSettingsPageComponents';

const meta: Meta = {
  title: 'Organisms/ProjectSettingsPageComponents',
  parameters: {
    layout: 'padded',
    a11y: {
      config: {
        rules: [
          { id: 'color-contrast', enabled: true },
          { id: 'label', enabled: true },
          { id: 'landmark-one-main', enabled: false },
          { id: 'region', enabled: false },
        ],
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="min-h-[400px] bg-[rgb(var(--background))]">
        <Story />
      </div>
    ),
  ],
};

export default meta;

// ============================================================================
// Mock Data
// ============================================================================

const mockOptions = [
  { value: 'proj-1', label: 'OpenFlow' },
  { value: 'proj-2', label: 'MyApp' },
];

const mockFormData: ProjectSettingsFormData = {
  name: 'OpenFlow',
  icon: '🚀',
  baseBranch: 'main',
  workflowsFolder: '.workflows',
  setupScript: 'pnpm install',
  devScript: 'pnpm dev',
  cleanupScript: '',
  ruleFolders: '[".openflow/rules"]',
  alwaysIncludedRules: '["CLAUDE.md"]',
  verificationConfig: '{"typecheck": "pnpm typecheck", "lint": "pnpm lint"}',
};

const mockProject: Project = {
  id: 'proj-1',
  name: 'OpenFlow',
  icon: '🚀',
  gitRepoPath: '/Users/dev/openflow',
  baseBranch: 'main',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  setupScript: 'pnpm install',
  devScript: 'pnpm dev',
  cleanupScript: undefined,
  workflowsFolder: '.workflows',
  ruleFolders: '[".openflow/rules"]',
  alwaysIncludedRules: '["CLAUDE.md"]',
  verificationConfig: '{"typecheck": "pnpm typecheck", "lint": "pnpm lint"}',
};

const mockProjects: Project[] = [
  mockProject,
  {
    ...mockProject,
    id: 'proj-2',
    name: 'MyApp',
    icon: '📱',
    gitRepoPath: '/Users/dev/myapp',
  },
];

// ============================================================================
// ProjectSettingsLayout Stories
// ============================================================================

export const Layout: StoryObj<typeof ProjectSettingsLayout> = {
  render: () => (
    <ProjectSettingsLayout>
      <div className="p-8 text-center text-[rgb(var(--muted-foreground))]">Settings content</div>
    </ProjectSettingsLayout>
  ),
};

export const LayoutWithSize: StoryObj<typeof ProjectSettingsLayout> = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-medium mb-2">Small</h3>
        <ProjectSettingsLayout size="sm" data-testid="layout-sm">
          <div className="p-4 text-sm text-[rgb(var(--muted-foreground))]">Small layout</div>
        </ProjectSettingsLayout>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Medium (default)</h3>
        <ProjectSettingsLayout size="md" data-testid="layout-md">
          <div className="p-6 text-[rgb(var(--muted-foreground))]">Medium layout</div>
        </ProjectSettingsLayout>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Large</h3>
        <ProjectSettingsLayout size="lg" data-testid="layout-lg">
          <div className="p-8 text-[rgb(var(--muted-foreground))]">Large layout</div>
        </ProjectSettingsLayout>
      </div>
    </div>
  ),
};

export const LayoutResponsive: StoryObj<typeof ProjectSettingsLayout> = {
  render: () => (
    <ProjectSettingsLayout
      size={{ base: 'sm', md: 'md', lg: 'lg' }}
      aria-label="Responsive project settings"
      data-testid="layout-responsive"
    >
      <div className="p-4 sm:p-6 lg:p-8 text-[rgb(var(--muted-foreground))]">
        Responsive sizing (resize browser to see changes)
      </div>
    </ProjectSettingsLayout>
  ),
};

// ============================================================================
// ProjectSettingsLoadingSkeleton Stories
// ============================================================================

export const Loading: StoryObj<typeof ProjectSettingsLoadingSkeleton> = {
  render: () => <ProjectSettingsLoadingSkeleton />,
};

export const LoadingCustomSections: StoryObj<typeof ProjectSettingsLoadingSkeleton> = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-medium mb-2">2 sections, 2 fields each</h3>
        <ProjectSettingsLoadingSkeleton
          sectionCount={2}
          fieldsPerSection={2}
          data-testid="skeleton-2x2"
        />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">6 sections, 4 fields each</h3>
        <ProjectSettingsLoadingSkeleton
          sectionCount={6}
          fieldsPerSection={4}
          data-testid="skeleton-6x4"
        />
      </div>
    </div>
  ),
};

// ============================================================================
// ProjectSettingsEmptyState Stories
// ============================================================================

export const EmptyState: StoryObj<typeof ProjectSettingsEmptyState> = {
  render: () => <ProjectSettingsEmptyState />,
};

export const EmptyStateAllSizes: StoryObj<typeof ProjectSettingsEmptyState> = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-medium mb-2">Small</h3>
        <ProjectSettingsEmptyState size="sm" data-testid="empty-sm" />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Medium</h3>
        <ProjectSettingsEmptyState size="md" data-testid="empty-md" />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Large</h3>
        <ProjectSettingsEmptyState size="lg" data-testid="empty-lg" />
      </div>
    </div>
  ),
};

// ============================================================================
// ProjectSettingsErrorState Stories
// ============================================================================

export const ErrorState: StoryObj<typeof ProjectSettingsErrorState> = {
  render: () => (
    <ProjectSettingsErrorState
      error="Failed to load project settings. Please check your connection and try again."
      onRetry={() => console.log('Retry clicked')}
    />
  ),
};

export const ErrorStateWithoutRetry: StoryObj<typeof ProjectSettingsErrorState> = {
  render: () => (
    <ProjectSettingsErrorState error="Permission denied. You do not have access to these settings." />
  ),
};

export const ErrorStateAllSizes: StoryObj<typeof ProjectSettingsErrorState> = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-medium mb-2">Small</h3>
        <ProjectSettingsErrorState
          size="sm"
          error="Connection failed"
          onRetry={() => {}}
          data-testid="error-sm"
        />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Medium</h3>
        <ProjectSettingsErrorState
          size="md"
          error="Unable to load settings"
          onRetry={() => {}}
          data-testid="error-md"
        />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Large</h3>
        <ProjectSettingsErrorState
          size="lg"
          error="Server error occurred"
          onRetry={() => {}}
          data-testid="error-lg"
        />
      </div>
    </div>
  ),
};

// ============================================================================
// ProjectSettingsSelector Stories
// ============================================================================

export const Selector: StoryObj<typeof ProjectSettingsSelector> = {
  render: () => (
    <ProjectSettingsSelector
      options={mockOptions}
      selectedProjectId="proj-1"
      onSelect={(id: string) => console.log('Project changed:', id)}
      hasChanges={false}
      saveSuccess={false}
    />
  ),
};

export const SelectorWithChanges: StoryObj<typeof ProjectSettingsSelector> = {
  render: () => (
    <ProjectSettingsSelector
      options={mockOptions}
      selectedProjectId="proj-1"
      onSelect={(id: string) => console.log('Project changed:', id)}
      hasChanges={true}
      saveSuccess={false}
    />
  ),
};

export const SelectorWithSuccess: StoryObj<typeof ProjectSettingsSelector> = {
  render: () => (
    <ProjectSettingsSelector
      options={mockOptions}
      selectedProjectId="proj-1"
      onSelect={(id: string) => console.log('Project changed:', id)}
      hasChanges={false}
      saveSuccess={true}
    />
  ),
};

export const SelectorAllSizes: StoryObj<typeof ProjectSettingsSelector> = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-medium mb-2">Small with changes</h3>
        <ProjectSettingsSelector
          options={mockOptions}
          selectedProjectId="proj-1"
          onSelect={() => {}}
          hasChanges={true}
          saveSuccess={false}
          size="sm"
          data-testid="selector-sm"
        />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Medium with success</h3>
        <ProjectSettingsSelector
          options={mockOptions}
          selectedProjectId="proj-1"
          onSelect={() => {}}
          hasChanges={false}
          saveSuccess={true}
          size="md"
          data-testid="selector-md"
        />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Large (no status)</h3>
        <ProjectSettingsSelector
          options={mockOptions}
          selectedProjectId="proj-2"
          onSelect={() => {}}
          hasChanges={false}
          saveSuccess={false}
          size="lg"
          data-testid="selector-lg"
        />
      </div>
    </div>
  ),
};

// ============================================================================
// SettingsSection Stories
// ============================================================================

export const Section: StoryObj<typeof SettingsSection> = {
  render: () => (
    <SettingsSection
      title="General Settings"
      icon={FolderGit2}
      description="Configure basic project settings"
    >
      <div className="p-4 text-[rgb(var(--muted-foreground))]">Section content</div>
    </SettingsSection>
  ),
};

export const SectionAllIcons: StoryObj<typeof SettingsSection> = {
  render: () => (
    <div className="space-y-6">
      {Object.entries(SECTION_TITLES).map(([key, title]) => (
        <SettingsSection
          key={key}
          title={title}
          icon={SECTION_ICONS[key as keyof typeof SECTION_ICONS]}
          description={SECTION_DESCRIPTIONS[key as keyof typeof SECTION_DESCRIPTIONS]}
          data-testid={`section-${key}`}
        >
          <div className="p-4 text-[rgb(var(--muted-foreground))]">{title} content</div>
        </SettingsSection>
      ))}
    </div>
  ),
};

// ============================================================================
// BasicInfoSection Stories
// ============================================================================

export const BasicInfo: StoryObj<typeof BasicInfoSection> = {
  render: () => (
    <BasicInfoSection
      formData={mockFormData}
      gitRepoPath="/Users/dev/openflow"
      onFormChange={() => () => {}}
    />
  ),
};

// ============================================================================
// ScriptsSection Stories
// ============================================================================

export const Scripts: StoryObj<typeof ScriptsSection> = {
  render: () => <ScriptsSection formData={mockFormData} onFormChange={() => () => {}} />,
};

// ============================================================================
// WorkflowsSection Stories
// ============================================================================

export const Workflows: StoryObj<typeof WorkflowsSection> = {
  render: () => <WorkflowsSection formData={mockFormData} onFormChange={() => () => {}} />,
};

// ============================================================================
// RulesSection Stories
// ============================================================================

export const Rules: StoryObj<typeof RulesSection> = {
  render: () => <RulesSection formData={mockFormData} onFormChange={() => () => {}} />,
};

// ============================================================================
// VerificationSection Stories
// ============================================================================

export const Verification: StoryObj<typeof VerificationSection> = {
  render: () => <VerificationSection formData={mockFormData} onFormChange={() => () => {}} />,
};

// ============================================================================
// SaveFooter Stories
// ============================================================================

export const Footer: StoryObj<typeof SaveFooter> = {
  render: () => (
    <SaveFooter
      onSave={() => console.log('Save')}
      isSaving={false}
      hasChanges={true}
      saveError={null}
    />
  ),
};

export const FooterNoChanges: StoryObj<typeof SaveFooter> = {
  render: () => (
    <SaveFooter
      onSave={() => console.log('Save')}
      isSaving={false}
      hasChanges={false}
      saveError={null}
    />
  ),
};

export const FooterSaving: StoryObj<typeof SaveFooter> = {
  render: () => (
    <SaveFooter
      onSave={() => console.log('Save')}
      isSaving={true}
      hasChanges={true}
      saveError={null}
    />
  ),
};

export const FooterWithError: StoryObj<typeof SaveFooter> = {
  render: () => (
    <SaveFooter
      onSave={() => console.log('Save')}
      isSaving={false}
      hasChanges={true}
      saveError="Failed to save project settings"
    />
  ),
};

export const FooterAllSizes: StoryObj<typeof SaveFooter> = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-medium mb-2">Small</h3>
        <SaveFooter
          onSave={() => {}}
          isSaving={false}
          hasChanges={true}
          saveError={null}
          size="sm"
          data-testid="footer-sm"
        />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Medium (saving)</h3>
        <SaveFooter
          onSave={() => {}}
          isSaving={true}
          hasChanges={true}
          saveError={null}
          size="md"
          data-testid="footer-md"
        />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Large (with error)</h3>
        <SaveFooter
          onSave={() => {}}
          isSaving={false}
          hasChanges={true}
          saveError="Unable to save"
          size="lg"
          data-testid="footer-lg"
        />
      </div>
    </div>
  ),
};

// ============================================================================
// ProjectSettingsForm Stories
// ============================================================================

export const Form: StoryObj<typeof ProjectSettingsForm> = {
  render: () => (
    <ProjectSettingsForm
      project={mockProject}
      formData={mockFormData}
      onFormChange={() => () => {}}
      isSaving={false}
      hasChanges={true}
      saveError={null}
      onSave={() => console.log('Save')}
    />
  ),
};

export const FormSaving: StoryObj<typeof ProjectSettingsForm> = {
  render: () => (
    <ProjectSettingsForm
      project={mockProject}
      formData={mockFormData}
      onFormChange={() => () => {}}
      isSaving={true}
      hasChanges={true}
      saveError={null}
      onSave={() => {}}
      data-testid="form-saving"
    />
  ),
};

export const FormWithError: StoryObj<typeof ProjectSettingsForm> = {
  render: () => (
    <ProjectSettingsForm
      project={mockProject}
      formData={mockFormData}
      onFormChange={() => () => {}}
      isSaving={false}
      hasChanges={true}
      saveError="Failed to save settings"
      onSave={() => {}}
      data-testid="form-error"
    />
  ),
};

// ============================================================================
// ProjectSettingsContent Stories
// ============================================================================

export const ContentLoading: StoryObj<typeof ProjectSettingsContent> = {
  render: () => (
    <ProjectSettingsContent
      project={null}
      projects={[]}
      formData={mockFormData}
      onFormChange={() => () => {}}
      onProjectSelect={() => {}}
      isLoading={true}
      isSaving={false}
      hasChanges={false}
      saveError={null}
      saveSuccess={false}
      onSave={() => {}}
      data-testid="content-loading"
    />
  ),
};

export const ContentError: StoryObj<typeof ProjectSettingsContent> = {
  render: () => (
    <ProjectSettingsContent
      project={null}
      projects={[]}
      formData={mockFormData}
      onFormChange={() => () => {}}
      onProjectSelect={() => {}}
      isLoading={false}
      isSaving={false}
      hasChanges={false}
      saveError={null}
      saveSuccess={false}
      onSave={() => {}}
      error="Failed to load project settings"
      onRetry={() => console.log('Retry')}
      data-testid="content-error"
    />
  ),
};

export const ContentEmpty: StoryObj<typeof ProjectSettingsContent> = {
  render: () => (
    <ProjectSettingsContent
      project={null}
      projects={[]}
      formData={mockFormData}
      onFormChange={() => () => {}}
      onProjectSelect={() => {}}
      isLoading={false}
      isSaving={false}
      hasChanges={false}
      saveError={null}
      saveSuccess={false}
      onSave={() => {}}
      data-testid="content-empty"
    />
  ),
};

export const ContentWithProject: StoryObj<typeof ProjectSettingsContent> = {
  render: () => (
    <ProjectSettingsContent
      project={mockProject}
      projects={mockProjects}
      formData={mockFormData}
      onFormChange={() => () => {}}
      onProjectSelect={(id) => console.log('Selected:', id)}
      isLoading={false}
      isSaving={false}
      hasChanges={true}
      saveError={null}
      saveSuccess={false}
      onSave={() => console.log('Save')}
      data-testid="content-with-project"
    />
  ),
};

export const ContentSaveSuccess: StoryObj<typeof ProjectSettingsContent> = {
  render: () => (
    <ProjectSettingsContent
      project={mockProject}
      projects={mockProjects}
      formData={mockFormData}
      onFormChange={() => () => {}}
      onProjectSelect={() => {}}
      isLoading={false}
      isSaving={false}
      hasChanges={false}
      saveError={null}
      saveSuccess={true}
      onSave={() => {}}
      data-testid="content-success"
    />
  ),
};

// ============================================================================
// Accessibility Demos
// ============================================================================

export const A11yKeyboardNavigation: StoryObj = {
  name: 'Accessibility: Keyboard Navigation',
  render: () => (
    <div className="space-y-6">
      <div className="p-4 bg-[rgb(var(--muted))] rounded-lg">
        <h3 className="font-medium mb-2">Keyboard Navigation Test</h3>
        <ul className="text-sm text-[rgb(var(--muted-foreground))] space-y-1">
          <li>• Tab through form fields</li>
          <li>• Use Arrow keys in dropdowns</li>
          <li>• Enter to submit form</li>
          <li>• Escape to cancel operations</li>
        </ul>
      </div>
      <ProjectSettingsContent
        project={mockProject}
        projects={mockProjects}
        formData={mockFormData}
        onFormChange={() => () => {}}
        onProjectSelect={() => {}}
        isLoading={false}
        isSaving={false}
        hasChanges={true}
        saveError={null}
        saveSuccess={false}
        onSave={() => {}}
        data-testid="a11y-keyboard"
      />
    </div>
  ),
};

export const A11yScreenReaderAnnouncements: StoryObj = {
  name: 'Accessibility: Screen Reader',
  render: () => (
    <div className="space-y-6">
      <div className="p-4 bg-[rgb(var(--muted))] rounded-lg">
        <h3 className="font-medium mb-2">Screen Reader Announcements</h3>
        <ul className="text-sm text-[rgb(var(--muted-foreground))] space-y-1">
          <li>• VisuallyHidden provides status announcements</li>
          <li>• ARIA labels describe interactive elements</li>
          <li>• Role attributes indicate element purpose</li>
          <li>• Live regions announce dynamic changes</li>
        </ul>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h4 className="text-sm font-medium mb-2">Loading state (aria-busy)</h4>
          <ProjectSettingsLoadingSkeleton data-testid="sr-loading" />
        </div>
        <div>
          <h4 className="text-sm font-medium mb-2">Error state (role=alert)</h4>
          <ProjectSettingsErrorState error="Test error for screen reader" data-testid="sr-error" />
        </div>
      </div>
    </div>
  ),
};

export const A11yTouchTargets: StoryObj = {
  name: 'Accessibility: Touch Targets',
  render: () => (
    <div className="space-y-6">
      <div className="p-4 bg-[rgb(var(--muted))] rounded-lg">
        <h3 className="font-medium mb-2">Touch Target Compliance (WCAG 2.5.5)</h3>
        <p className="text-sm text-[rgb(var(--muted-foreground))]">
          All interactive elements have minimum 44×44px touch targets on mobile.
        </p>
      </div>
      <SaveFooter
        onSave={() => {}}
        isSaving={false}
        hasChanges={true}
        saveError={null}
        data-testid="touch-footer"
      />
    </div>
  ),
};

// ============================================================================
// Utility Function Demos
// ============================================================================

export const UtilityGetBaseSize: StoryObj = {
  name: 'Utility: getBaseSize',
  render: () => (
    <div className="space-y-4">
      <h3 className="font-medium">getBaseSize() examples</h3>
      <div className="space-y-2 text-sm font-mono">
        <div>getBaseSize(undefined) = &quot;{getBaseSize(undefined)}&quot;</div>
        <div>getBaseSize(&quot;sm&quot;) = &quot;{getBaseSize('sm')}&quot;</div>
        <div>getBaseSize(&quot;lg&quot;) = &quot;{getBaseSize('lg')}&quot;</div>
        <div>
          getBaseSize({'{ base: "sm", md: "md" }'}) = &quot;
          {getBaseSize({ base: 'sm', md: 'md' })}&quot;
        </div>
      </div>
    </div>
  ),
};

export const UtilityGetResponsiveSizeClasses: StoryObj = {
  name: 'Utility: getResponsiveSizeClasses',
  render: () => (
    <div className="space-y-4">
      <h3 className="font-medium">getResponsiveSizeClasses() examples</h3>
      <div className="space-y-2 text-sm font-mono">
        <div>
          Fixed &quot;sm&quot;: {getResponsiveSizeClasses('sm', PROJECT_SETTINGS_SIZE_CLASSES)}
        </div>
        <div>
          Fixed &quot;lg&quot;: {getResponsiveSizeClasses('lg', PROJECT_SETTINGS_SIZE_CLASSES)}
        </div>
        <div>
          Responsive:{' '}
          {getResponsiveSizeClasses(
            { base: 'sm', md: 'md', lg: 'lg' },
            PROJECT_SETTINGS_SIZE_CLASSES
          )}
        </div>
      </div>
    </div>
  ),
};

export const UtilityBuildSectionAccessibleLabel: StoryObj = {
  name: 'Utility: buildSectionAccessibleLabel',
  render: () => (
    <div className="space-y-4">
      <h3 className="font-medium">buildSectionAccessibleLabel() examples</h3>
      <div className="space-y-2 text-sm font-mono">
        {Object.entries(SECTION_TITLES).map(([key, title]) => (
          <div key={key}>
            {key}: &quot;
            {buildSectionAccessibleLabel(
              title,
              SECTION_DESCRIPTIONS[key as keyof typeof SECTION_DESCRIPTIONS]
            )}
            &quot;
          </div>
        ))}
      </div>
    </div>
  ),
};

export const UtilityBuildStatusAnnouncement: StoryObj = {
  name: 'Utility: buildStatusAnnouncement',
  render: () => (
    <div className="space-y-4">
      <h3 className="font-medium">buildStatusAnnouncement() examples</h3>
      <div className="space-y-2 text-sm font-mono">
        <div>No changes: &quot;{buildStatusAnnouncement(false, false, false)}&quot;</div>
        <div>Has changes: &quot;{buildStatusAnnouncement(true, false, false)}&quot;</div>
        <div>Save success: &quot;{buildStatusAnnouncement(false, true, false)}&quot;</div>
        <div>Saving: &quot;{buildStatusAnnouncement(true, false, true)}&quot;</div>
      </div>
    </div>
  ),
};

export const UtilityBuildSelectorAnnouncement: StoryObj = {
  name: 'Utility: buildSelectorAnnouncement',
  render: () => (
    <div className="space-y-4">
      <h3 className="font-medium">buildSelectorAnnouncement() examples</h3>
      <div className="space-y-2 text-sm font-mono">
        <div>No project: &quot;{buildSelectorAnnouncement(null, false, false)}&quot;</div>
        <div>Selected only: &quot;{buildSelectorAnnouncement('OpenFlow', false, false)}&quot;</div>
        <div>With changes: &quot;{buildSelectorAnnouncement('OpenFlow', true, false)}&quot;</div>
        <div>With success: &quot;{buildSelectorAnnouncement('OpenFlow', false, true)}&quot;</div>
        <div>All states: &quot;{buildSelectorAnnouncement('OpenFlow', true, true)}&quot;</div>
      </div>
    </div>
  ),
};
