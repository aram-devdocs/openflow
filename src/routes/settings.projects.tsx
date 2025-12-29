/**
 * Project Settings Route
 *
 * Manages project-specific configurations.
 * Users can:
 * - Edit project details (name, icon)
 * - Configure scripts (setup, dev, cleanup)
 * - Manage workflow settings
 * - Set verification configuration
 *
 * Follows the orchestration pattern: connects hooks to UI components.
 */

import { useState, useCallback, useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import {
  FolderGit2,
  Save,
  Terminal,
  GitBranch,
  FileCode,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import {
  Button,
  FormField,
  Input,
  Textarea,
  Card,
  Dropdown,
  Badge,
} from '@openflow/ui';
import {
  useProjects,
  useProject,
  useUpdateProject,
  useKeyboardShortcuts,
} from '@openflow/hooks';
import type { Project, UpdateProjectRequest } from '@openflow/generated';

export const Route = createFileRoute('/settings/projects')({
  component: ProjectSettingsPage,
});

function ProjectSettingsPage() {
  // UI state
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Data fetching
  const { data: projects = [], isLoading: isLoadingProjects } = useProjects();
  const { data: selectedProject, isLoading: isLoadingProject } = useProject(
    selectedProjectId ?? ''
  );
  const updateProject = useUpdateProject();

  // Auto-select first project if none selected
  useEffect(() => {
    const firstProject = projects[0];
    if (!selectedProjectId && firstProject) {
      setSelectedProjectId(firstProject.id);
    }
  }, [selectedProjectId, projects]);

  // Update form data when selected project changes
  useEffect(() => {
    if (selectedProject) {
      setFormData(projectToFormData(selectedProject));
      setHasChanges(false);
      setSaveError(null);
      setSaveSuccess(false);
    }
  }, [selectedProject]);

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 's',
      meta: true,
      action: () => {
        if (hasChanges) handleSave();
      },
    },
  ]);

  // Form handlers
  const handleFormChange = useCallback(
    (field: keyof FormData) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData((prev) => (prev ? { ...prev, [field]: e.target.value } : null));
        setHasChanges(true);
        setSaveSuccess(false);
      },
    []
  );

  const handleProjectSelect = useCallback((projectId: string) => {
    setSelectedProjectId(projectId);
    setHasChanges(false);
    setSaveError(null);
    setSaveSuccess(false);
  }, []);

  const handleSave = useCallback(() => {
    if (!selectedProjectId || !formData) return;
    setSaveError(null);
    setSaveSuccess(false);

    const request: UpdateProjectRequest = {
      ...(formData.name.trim() && { name: formData.name.trim() }),
      ...(formData.icon.trim() && { icon: formData.icon.trim() }),
      ...(formData.baseBranch.trim() && { baseBranch: formData.baseBranch.trim() }),
      ...(formData.setupScript.trim() && { setupScript: formData.setupScript.trim() }),
      ...(formData.devScript.trim() && { devScript: formData.devScript.trim() }),
      ...(formData.cleanupScript.trim() && { cleanupScript: formData.cleanupScript.trim() }),
      ...(formData.workflowsFolder.trim() && { workflowsFolder: formData.workflowsFolder.trim() }),
      ...(formData.ruleFolders.trim() && { ruleFolders: formData.ruleFolders.trim() }),
      ...(formData.alwaysIncludedRules.trim() && { alwaysIncludedRules: formData.alwaysIncludedRules.trim() }),
      ...(formData.verificationConfig.trim() && { verificationConfig: formData.verificationConfig.trim() }),
    };

    updateProject.mutate(
      { id: selectedProjectId, request },
      {
        onSuccess: () => {
          setHasChanges(false);
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 3000);
        },
        onError: (error) => {
          setSaveError(error.message);
        },
      }
    );
  }, [selectedProjectId, formData, updateProject]);

  // Loading states
  if (isLoadingProjects) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-[rgb(var(--muted-foreground))]">
          Loading projects...
        </div>
      </div>
    );
  }

  // Empty state
  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[rgb(var(--border))] py-12">
        <FolderGit2 className="mb-4 h-12 w-12 text-[rgb(var(--muted-foreground))]" />
        <h3 className="text-lg font-medium text-[rgb(var(--foreground))]">
          No projects
        </h3>
        <p className="mt-1 text-sm text-[rgb(var(--muted-foreground))]">
          Create a project first to configure its settings.
        </p>
      </div>
    );
  }

  // Dropdown options for project selection
  const projectOptions = projects.map((p) => ({
    value: p.id,
    label: p.name,
    ...(p.icon === 'folder' && { icon: FolderGit2 }),
  }));

  return (
    <div className="space-y-6">
      {/* Project selector */}
      <div className="flex items-center gap-4">
        <div className="w-64">
          <Dropdown
            options={projectOptions}
            value={selectedProjectId ?? ''}
            onChange={handleProjectSelect}
            placeholder="Select a project"
          />
        </div>

        {hasChanges && (
          <Badge variant="warning">Unsaved changes</Badge>
        )}

        {saveSuccess && (
          <Badge variant="success">Saved successfully</Badge>
        )}
      </div>

      {/* Loading project state */}
      {isLoadingProject && selectedProjectId && (
        <div className="flex items-center justify-center py-8">
          <div className="text-sm text-[rgb(var(--muted-foreground))]">
            Loading project settings...
          </div>
        </div>
      )}

      {/* Project settings form */}
      {selectedProject && formData && (
        <div className="space-y-6">
          {/* Basic Info */}
          <SettingsSection
            title="Basic Information"
            icon={FolderGit2}
            description="General project details"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Project Name">
                <Input
                  value={formData.name}
                  onChange={handleFormChange('name')}
                  placeholder="My Project"
                />
              </FormField>

              <FormField label="Icon">
                <Input
                  value={formData.icon}
                  onChange={handleFormChange('icon')}
                  placeholder="folder or emoji"
                />
              </FormField>
            </div>

            <FormField label="Repository Path">
              <Input
                value={selectedProject.gitRepoPath}
                disabled
                className="opacity-60"
              />
            </FormField>

            <FormField label="Base Branch">
              <Input
                value={formData.baseBranch}
                onChange={handleFormChange('baseBranch')}
                placeholder="main"
              />
            </FormField>
          </SettingsSection>

          {/* Scripts */}
          <SettingsSection
            title="Scripts"
            icon={Terminal}
            description="Commands to run during task lifecycle"
          >
            <FormField label="Setup Script" helperText="Runs when a new chat worktree is created">
              <Textarea
                value={formData.setupScript}
                onChange={handleFormChange('setupScript')}
                placeholder="pnpm install"
                rows={2}
              />
            </FormField>

            <FormField label="Dev Script" helperText="Starts the development server">
              <Textarea
                value={formData.devScript}
                onChange={handleFormChange('devScript')}
                placeholder="pnpm dev"
                rows={2}
              />
            </FormField>

            <FormField label="Cleanup Script" helperText="Runs before deleting a worktree">
              <Textarea
                value={formData.cleanupScript}
                onChange={handleFormChange('cleanupScript')}
                placeholder="rm -rf node_modules"
                rows={2}
              />
            </FormField>
          </SettingsSection>

          {/* Workflows */}
          <SettingsSection
            title="Workflows"
            icon={GitBranch}
            description="Workflow template configuration"
          >
            <FormField label="Workflows Folder" helperText="Path to custom workflow templates">
              <Input
                value={formData.workflowsFolder}
                onChange={handleFormChange('workflowsFolder')}
                placeholder=".openflow/workflows"
              />
            </FormField>
          </SettingsSection>

          {/* Rules */}
          <SettingsSection
            title="Rules & Context"
            icon={FileCode}
            description="AI context and instruction files"
          >
            <FormField label="Rule Folders (JSON array)" helperText="Folders containing rule files">
              <Input
                value={formData.ruleFolders}
                onChange={handleFormChange('ruleFolders')}
                placeholder='[".openflow/rules"]'
              />
            </FormField>

            <FormField
              label="Always Included Rules (JSON array)"
              helperText="Rule files always included in context"
            >
              <Input
                value={formData.alwaysIncludedRules}
                onChange={handleFormChange('alwaysIncludedRules')}
                placeholder='["CLAUDE.md"]'
              />
            </FormField>
          </SettingsSection>

          {/* Verification */}
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
                onChange={handleFormChange('verificationConfig')}
                placeholder='{"typecheck": "pnpm typecheck", "lint": "pnpm lint"}'
                rows={3}
              />
            </FormField>
          </SettingsSection>

          {/* Save button */}
          <div className="flex items-center gap-4 border-t border-[rgb(var(--border))] pt-6">
            <Button
              variant="primary"
              onClick={handleSave}
              loading={updateProject.isPending}
              disabled={!hasChanges}
            >
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>

            {saveError && (
              <span className="text-sm text-red-400">{saveError}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Form data type
interface FormData {
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

function projectToFormData(project: Project): FormData {
  return {
    name: project.name,
    icon: project.icon,
    baseBranch: project.baseBranch,
    setupScript: project.setupScript,
    devScript: project.devScript,
    cleanupScript: project.cleanupScript ?? '',
    workflowsFolder: project.workflowsFolder,
    ruleFolders: project.ruleFolders ?? '',
    alwaysIncludedRules: project.alwaysIncludedRules ?? '',
    verificationConfig: project.verificationConfig ?? '',
  };
}

// Settings section component
interface SettingsSectionProps {
  title: string;
  icon: LucideIcon;
  description: string;
  children: React.ReactNode;
}

function SettingsSection({
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
        <p className="mt-0.5 text-xs text-[rgb(var(--muted-foreground))]">
          {description}
        </p>
      </div>
      <div className="space-y-4 p-4">{children}</div>
    </Card>
  );
}
