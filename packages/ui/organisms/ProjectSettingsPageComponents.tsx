/**
 * ProjectSettingsPageComponents - Stateless UI components for the Project Settings page
 *
 * These components are pure functions of their props, receiving data and callbacks
 * from the useProjectsSettingsSession hook. They render UI and call callbacks on user interaction.
 */

import type { Project } from '@openflow/generated';
import {
  FileCode,
  FolderGit2,
  GitBranch,
  type LucideIcon,
  Save,
  Settings,
  Terminal,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { Badge } from '../atoms/Badge';
import { Button } from '../atoms/Button';
import { Input } from '../atoms/Input';
import { Textarea } from '../atoms/Textarea';
import { Card } from '../molecules/Card';
import { Dropdown } from '../molecules/Dropdown';
import { FormField } from '../molecules/FormField';
import { SkeletonSettings } from '../molecules/SkeletonSettings';

// ============================================================================
// Types
// ============================================================================

/** Form data for editing project settings */
export interface ProjectSettingsFormData {
  name: string;
  icon: string;
  baseBranch: string;
  setupScript: string;
  devScript: string;
  cleanupScript: string;
  workflowsFolder: string;
  ruleFolders: string;
  alwaysIncludedRules: string;
  verificationConfig: string;
}

/** Props for ProjectSettingsLayout component */
export interface ProjectSettingsLayoutProps {
  /** Main content */
  children: ReactNode;
}

/** Props for ProjectSettingsLoadingSkeleton component */
export interface ProjectSettingsLoadingSkeletonProps {
  /** Number of sections to show */
  sectionCount?: number;
  /** Fields per section */
  fieldsPerSection?: number;
}

/** Props for ProjectSettingsEmptyState component */
export type ProjectSettingsEmptyStateProps = Record<string, never>;

/** Props for ProjectSettingsSelector component */
export interface ProjectSettingsSelectorProps {
  /** Dropdown options */
  options: Array<{
    value: string;
    label: string;
  }>;
  /** Selected project ID */
  selectedProjectId: string | null;
  /** Callback when project is selected */
  onSelect: (projectId: string) => void;
  /** Whether there are unsaved changes */
  hasChanges: boolean;
  /** Whether save was successful */
  saveSuccess: boolean;
}

/** Props for SettingsSection component */
export interface SettingsSectionProps {
  /** Section title */
  title: string;
  /** Section icon */
  icon: LucideIcon;
  /** Section description */
  description: string;
  /** Section content */
  children: ReactNode;
}

/** Props for BasicInfoSection component */
export interface BasicInfoSectionProps {
  /** Form data */
  formData: ProjectSettingsFormData;
  /** Repository path (read-only) */
  gitRepoPath: string;
  /** Form change handler */
  onFormChange: (
    field: keyof ProjectSettingsFormData
  ) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

/** Props for ScriptsSection component */
export interface ScriptsSectionProps {
  /** Form data */
  formData: ProjectSettingsFormData;
  /** Form change handler */
  onFormChange: (
    field: keyof ProjectSettingsFormData
  ) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

/** Props for WorkflowsSection component */
export interface WorkflowsSectionProps {
  /** Form data */
  formData: ProjectSettingsFormData;
  /** Form change handler */
  onFormChange: (
    field: keyof ProjectSettingsFormData
  ) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

/** Props for RulesSection component */
export interface RulesSectionProps {
  /** Form data */
  formData: ProjectSettingsFormData;
  /** Form change handler */
  onFormChange: (
    field: keyof ProjectSettingsFormData
  ) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

/** Props for VerificationSection component */
export interface VerificationSectionProps {
  /** Form data */
  formData: ProjectSettingsFormData;
  /** Form change handler */
  onFormChange: (
    field: keyof ProjectSettingsFormData
  ) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

/** Props for SaveFooter component */
export interface SaveFooterProps {
  /** Whether save is pending */
  isSaving: boolean;
  /** Whether there are unsaved changes */
  hasChanges: boolean;
  /** Save error message */
  saveError: string | null;
  /** Callback when save button is clicked */
  onSave: () => void;
}

/** Props for ProjectSettingsForm component */
export interface ProjectSettingsFormProps {
  /** Selected project */
  project: Project;
  /** Form data */
  formData: ProjectSettingsFormData;
  /** Form change handler */
  onFormChange: (
    field: keyof ProjectSettingsFormData
  ) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  /** Whether save is pending */
  isSaving: boolean;
  /** Whether there are unsaved changes */
  hasChanges: boolean;
  /** Save error message */
  saveError: string | null;
  /** Callback when save button is clicked */
  onSave: () => void;
}

// ============================================================================
// Layout Components
// ============================================================================

/**
 * ProjectSettingsLayout - Main layout wrapper for the settings page
 */
export function ProjectSettingsLayout({ children }: ProjectSettingsLayoutProps) {
  return <div className="space-y-6">{children}</div>;
}

// ============================================================================
// State Components
// ============================================================================

/**
 * ProjectSettingsLoadingSkeleton - Loading state for project settings
 */
export function ProjectSettingsLoadingSkeleton({
  sectionCount = 4,
  fieldsPerSection = 3,
}: ProjectSettingsLoadingSkeletonProps) {
  return <SkeletonSettings sectionCount={sectionCount} fieldsPerSection={fieldsPerSection} />;
}

/**
 * ProjectSettingsEmptyState - Empty state when no projects exist
 */
export function ProjectSettingsEmptyState(_props: ProjectSettingsEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[rgb(var(--border))] py-12">
      <FolderGit2 className="mb-4 h-12 w-12 text-[rgb(var(--muted-foreground))]" />
      <h3 className="text-lg font-medium text-[rgb(var(--foreground))]">No projects</h3>
      <p className="mt-1 text-sm text-[rgb(var(--muted-foreground))]">
        Create a project first to configure its settings.
      </p>
    </div>
  );
}

// ============================================================================
// Header Components
// ============================================================================

/**
 * ProjectSettingsSelector - Project dropdown with status badges
 */
export function ProjectSettingsSelector({
  options,
  selectedProjectId,
  onSelect,
  hasChanges,
  saveSuccess,
}: ProjectSettingsSelectorProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="w-64">
        <Dropdown
          options={options}
          value={selectedProjectId ?? ''}
          onChange={onSelect}
          placeholder="Select a project"
        />
      </div>

      {hasChanges && <Badge variant="warning">Unsaved changes</Badge>}

      {saveSuccess && <Badge variant="success">Saved successfully</Badge>}
    </div>
  );
}

// ============================================================================
// Settings Section Components
// ============================================================================

/**
 * SettingsSection - Card wrapper for grouped settings
 */
export function SettingsSection({
  title,
  icon: IconComponent,
  description,
  children,
}: SettingsSectionProps) {
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-[rgb(var(--border))] bg-[rgb(var(--muted))]/50 px-4 py-3">
        <div className="flex items-center gap-2">
          <IconComponent className="h-4 w-4 text-[rgb(var(--primary))]" />
          <h3 className="font-medium text-[rgb(var(--foreground))]">{title}</h3>
        </div>
        <p className="mt-0.5 text-xs text-[rgb(var(--muted-foreground))]">{description}</p>
      </div>
      <div className="space-y-4 p-4">{children}</div>
    </Card>
  );
}

/**
 * BasicInfoSection - Basic project information settings
 */
export function BasicInfoSection({ formData, gitRepoPath, onFormChange }: BasicInfoSectionProps) {
  return (
    <SettingsSection
      title="Basic Information"
      icon={FolderGit2}
      description="General project details"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Project Name">
          <Input value={formData.name} onChange={onFormChange('name')} placeholder="My Project" />
        </FormField>

        <FormField label="Icon">
          <Input
            value={formData.icon}
            onChange={onFormChange('icon')}
            placeholder="folder or emoji"
          />
        </FormField>
      </div>

      <FormField label="Repository Path">
        <Input value={gitRepoPath} disabled className="opacity-60" />
      </FormField>

      <FormField label="Base Branch">
        <Input
          value={formData.baseBranch}
          onChange={onFormChange('baseBranch')}
          placeholder="main"
        />
      </FormField>
    </SettingsSection>
  );
}

/**
 * ScriptsSection - Script configuration settings
 */
export function ScriptsSection({ formData, onFormChange }: ScriptsSectionProps) {
  return (
    <SettingsSection
      title="Scripts"
      icon={Terminal}
      description="Commands to run during task lifecycle"
    >
      <FormField label="Setup Script" helperText="Runs when a new chat worktree is created">
        <Textarea
          value={formData.setupScript}
          onChange={onFormChange('setupScript')}
          placeholder="pnpm install"
          rows={2}
        />
      </FormField>

      <FormField label="Dev Script" helperText="Starts the development server">
        <Textarea
          value={formData.devScript}
          onChange={onFormChange('devScript')}
          placeholder="pnpm dev"
          rows={2}
        />
      </FormField>

      <FormField label="Cleanup Script" helperText="Runs before deleting a worktree">
        <Textarea
          value={formData.cleanupScript}
          onChange={onFormChange('cleanupScript')}
          placeholder="rm -rf node_modules"
          rows={2}
        />
      </FormField>
    </SettingsSection>
  );
}

/**
 * WorkflowsSection - Workflow template configuration
 */
export function WorkflowsSection({ formData, onFormChange }: WorkflowsSectionProps) {
  return (
    <SettingsSection
      title="Workflows"
      icon={GitBranch}
      description="Workflow template configuration"
    >
      <FormField label="Workflows Folder" helperText="Path to custom workflow templates">
        <Input
          value={formData.workflowsFolder}
          onChange={onFormChange('workflowsFolder')}
          placeholder=".openflow/workflows"
        />
      </FormField>
    </SettingsSection>
  );
}

/**
 * RulesSection - Rules and context configuration
 */
export function RulesSection({ formData, onFormChange }: RulesSectionProps) {
  return (
    <SettingsSection
      title="Rules & Context"
      icon={FileCode}
      description="AI context and instruction files"
    >
      <FormField label="Rule Folders (JSON array)" helperText="Folders containing rule files">
        <Input
          value={formData.ruleFolders}
          onChange={onFormChange('ruleFolders')}
          placeholder='[".openflow/rules"]'
        />
      </FormField>

      <FormField
        label="Always Included Rules (JSON array)"
        helperText="Rule files always included in context"
      >
        <Input
          value={formData.alwaysIncludedRules}
          onChange={onFormChange('alwaysIncludedRules')}
          placeholder='["CLAUDE.md"]'
        />
      </FormField>
    </SettingsSection>
  );
}

/**
 * VerificationSection - Verification configuration
 */
export function VerificationSection({ formData, onFormChange }: VerificationSectionProps) {
  return (
    <SettingsSection
      title="Verification"
      icon={Settings}
      description="Automated verification commands"
    >
      <FormField
        label="Verification Config (JSON object)"
        helperText="Commands to verify code quality"
      >
        <Textarea
          value={formData.verificationConfig}
          onChange={onFormChange('verificationConfig')}
          placeholder='{"typecheck": "pnpm typecheck", "lint": "pnpm lint"}'
          rows={3}
        />
      </FormField>
    </SettingsSection>
  );
}

// ============================================================================
// Footer Components
// ============================================================================

/**
 * SaveFooter - Save button with error display
 */
export function SaveFooter({ isSaving, hasChanges, saveError, onSave }: SaveFooterProps) {
  return (
    <div className="flex items-center gap-4 border-t border-[rgb(var(--border))] pt-6">
      <Button
        variant="primary"
        onClick={onSave}
        loading={isSaving}
        loadingText="Saving..."
        disabled={!hasChanges}
      >
        <Save className="mr-2 h-4 w-4" />
        Save Changes
      </Button>

      {saveError && <span className="text-sm text-error">{saveError}</span>}
    </div>
  );
}

// ============================================================================
// Composite Components
// ============================================================================

/**
 * ProjectSettingsForm - Complete settings form with all sections
 */
export function ProjectSettingsForm({
  project,
  formData,
  onFormChange,
  isSaving,
  hasChanges,
  saveError,
  onSave,
}: ProjectSettingsFormProps) {
  return (
    <div className="space-y-6">
      <BasicInfoSection
        formData={formData}
        gitRepoPath={project.gitRepoPath}
        onFormChange={onFormChange}
      />
      <ScriptsSection formData={formData} onFormChange={onFormChange} />
      <WorkflowsSection formData={formData} onFormChange={onFormChange} />
      <RulesSection formData={formData} onFormChange={onFormChange} />
      <VerificationSection formData={formData} onFormChange={onFormChange} />
      <SaveFooter
        isSaving={isSaving}
        hasChanges={hasChanges}
        saveError={saveError}
        onSave={onSave}
      />
    </div>
  );
}
