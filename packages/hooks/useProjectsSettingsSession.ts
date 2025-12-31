/**
 * useProjectsSettingsSession - Hook for managing Project Settings page state
 *
 * This hook encapsulates all the state management, data fetching, and
 * callbacks for the Project Settings page, keeping the route component pure.
 */

import type { Project, UpdateProjectRequest } from '@openflow/generated';
import { useCallback, useEffect, useState } from 'react';

import { useKeyboardShortcuts } from './useKeyboardShortcuts';
import { useProject, useProjects, useUpdateProject } from './useProjects';

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

export interface UseProjectsSettingsSessionOptions {
  /** Callback for showing success messages */
  onSuccess?: (title: string, message: string) => void;
  /** Callback for showing error messages */
  onError?: (title: string, message: string) => void;
}

export interface ProjectsSettingsSessionState {
  // Data
  projects: Project[];
  selectedProject: Project | undefined;
  isLoadingProjects: boolean;
  isLoadingProject: boolean;

  // Form state
  selectedProjectId: string | null;
  formData: ProjectSettingsFormData | null;
  hasChanges: boolean;
  saveError: string | null;
  saveSuccess: boolean;

  // Pending states
  isSaving: boolean;

  // Project dropdown options
  projectOptions: Array<{
    value: string;
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
  }>;

  // Actions
  handleProjectSelect: (projectId: string) => void;
  handleFormChange: (
    field: keyof ProjectSettingsFormData
  ) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSave: () => void;
}

// ============================================================================
// Helper Functions
// ============================================================================

function projectToFormData(project: Project): ProjectSettingsFormData {
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

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * useProjectsSettingsSession hook for managing Project Settings page state.
 *
 * Encapsulates:
 * - Data fetching (projects list, selected project)
 * - UI state (form data, save status)
 * - All user interaction callbacks
 *
 * @example
 * ```tsx
 * function ProjectSettingsPage() {
 *   const session = useProjectsSettingsSession({
 *     onSuccess: (title, message) => toast.success(title, message),
 *   });
 *
 *   if (session.isLoadingProjects) {
 *     return <SkeletonSettings />;
 *   }
 *
 *   return (
 *     <ProjectSettingsLayout
 *       projects={session.projects}
 *       selectedProjectId={session.selectedProjectId}
 *       onProjectSelect={session.handleProjectSelect}
 *     >
 *       <ProjectSettingsForm
 *         project={session.selectedProject}
 *         formData={session.formData}
 *         onChange={session.handleFormChange}
 *         onSave={session.handleSave}
 *       />
 *     </ProjectSettingsLayout>
 *   );
 * }
 * ```
 */
export function useProjectsSettingsSession({
  onSuccess,
  onError,
}: UseProjectsSettingsSessionOptions = {}): ProjectsSettingsSessionState {
  // UI state
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProjectSettingsFormData | null>(null);
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

  // ============================================================================
  // Form Actions
  // ============================================================================

  const handleFormChange = useCallback(
    (field: keyof ProjectSettingsFormData) =>
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
      ...(formData.alwaysIncludedRules.trim() && {
        alwaysIncludedRules: formData.alwaysIncludedRules.trim(),
      }),
      ...(formData.verificationConfig.trim() && {
        verificationConfig: formData.verificationConfig.trim(),
      }),
    };

    updateProject.mutate(
      { id: selectedProjectId, request },
      {
        onSuccess: () => {
          setHasChanges(false);
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 3000);
          onSuccess?.('Settings saved', 'Project settings have been updated.');
        },
        onError: (error) => {
          setSaveError(error.message);
          onError?.('Failed to save', error.message);
        },
      }
    );
  }, [selectedProjectId, formData, updateProject, onSuccess, onError]);

  // Build project dropdown options
  const projectOptions = projects.map((p) => ({
    value: p.id,
    label: p.name,
  }));

  return {
    // Data
    projects,
    selectedProject,
    isLoadingProjects,
    isLoadingProject,

    // Form state
    selectedProjectId,
    formData,
    hasChanges,
    saveError,
    saveSuccess,

    // Pending states
    isSaving: updateProject.isPending,

    // Project dropdown options
    projectOptions,

    // Actions
    handleProjectSelect,
    handleFormChange,
    handleSave,
  };
}
