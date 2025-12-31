import type { Meta, StoryObj } from '@storybook/react';
import { FolderGit2 } from 'lucide-react';
import {
  BasicInfoSection,
  ProjectSettingsEmptyState,
  type ProjectSettingsFormData,
  ProjectSettingsLayout,
  ProjectSettingsLoadingSkeleton,
  ProjectSettingsSelector,
  SaveFooter,
  ScriptsSection,
  SettingsSection,
} from './ProjectSettingsPageComponents';

const meta: Meta = {
  title: 'Organisms/ProjectSettingsPageComponents',
  parameters: {
    layout: 'padded',
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

// ============================================================================
// ProjectSettingsLoadingSkeleton Stories
// ============================================================================

export const Loading: StoryObj<typeof ProjectSettingsLoadingSkeleton> = {
  render: () => <ProjectSettingsLoadingSkeleton />,
};

// ============================================================================
// ProjectSettingsEmptyState Stories
// ============================================================================

export const EmptyState: StoryObj<typeof ProjectSettingsEmptyState> = {
  render: () => <ProjectSettingsEmptyState />,
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
