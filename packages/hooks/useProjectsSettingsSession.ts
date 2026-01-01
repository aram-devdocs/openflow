/**
 * useProjectsSettingsSession - Hook for managing Project Settings page state
 *
 * This hook encapsulates all the state management, data fetching, and
 * callbacks for the Project Settings page, keeping the route component pure.
 *
 * Features:
 * - Full logging at DEBUG/INFO/WARN/ERROR levels
 * - Toast notifications for user feedback on save actions
 * - Proper error handling with form validation
 * - Keyboard shortcuts (Cmd+S to save)
 */

import type { Project, UpdateProjectRequest } from '@openflow/generated';
import { createLogger } from '@openflow/utils';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useKeyboardShortcuts } from './useKeyboardShortcuts';
import { useProject, useProjects, useUpdateProject } from './useProjects';
import { useToast } from './useToast';

// ============================================================================
// Logger
// ============================================================================

const logger = createLogger('useProjectsSettingsSession');

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
  /**
   * Callback for showing success messages
   * @deprecated Use built-in toast notifications instead. This prop is maintained for backward compatibility.
   */
  onSuccess?: (title: string, message: string) => void;
  /**
   * Callback for showing error messages
   * @deprecated Use built-in toast notifications instead. This prop is maintained for backward compatibility.
   */
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
 * - Logging at DEBUG/INFO/WARN/ERROR levels
 * - Toast notifications for save feedback
 *
 * @example
 * ```tsx
 * function ProjectSettingsPage() {
 *   const session = useProjectsSettingsSession();
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
  // Toast notifications
  const toast = useToast();

  // Track initialization for logging
  const initializedRef = useRef(false);

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

  // Log hook initialization once
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      logger.debug('Hook initialized');
    }
  }, []);

  // Auto-select first project if none selected
  useEffect(() => {
    const firstProject = projects[0];
    if (!selectedProjectId && firstProject) {
      logger.debug('Auto-selecting first project', {
        projectId: firstProject.id,
        projectName: firstProject.name,
      });
      setSelectedProjectId(firstProject.id);
    }
  }, [selectedProjectId, projects]);

  // Update form data when selected project changes
  useEffect(() => {
    if (selectedProject) {
      logger.debug('Loading project settings into form', {
        projectId: selectedProject.id,
        projectName: selectedProject.name,
      });
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
        if (hasChanges) {
          logger.info('Keyboard shortcut triggered: Cmd+S (save settings)', {
            projectId: selectedProjectId,
          });
          handleSave();
        } else {
          logger.debug('Keyboard shortcut Cmd+S ignored: no changes to save');
        }
      },
    },
  ]);

  // ============================================================================
  // Form Actions
  // ============================================================================

  const handleFormChange = useCallback(
    (field: keyof ProjectSettingsFormData) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        logger.debug('Form field changed', { field, newValueLength: e.target.value.length });
        setFormData((prev) => (prev ? { ...prev, [field]: e.target.value } : null));
        setHasChanges(true);
        setSaveSuccess(false);
      },
    []
  );

  const handleProjectSelect = useCallback(
    (projectId: string) => {
      const project = projects.find((p) => p.id === projectId);
      logger.debug('Project selected', {
        projectId,
        projectName: project?.name ?? 'unknown',
      });
      setSelectedProjectId(projectId);
      setHasChanges(false);
      setSaveError(null);
      setSaveSuccess(false);
    },
    [projects]
  );

  const handleSave = useCallback(() => {
    if (!selectedProjectId || !formData) {
      logger.warn('Save attempted with missing data', {
        hasProjectId: !!selectedProjectId,
        hasFormData: !!formData,
      });
      return;
    }

    // Validate required fields
    if (!formData.name.trim()) {
      logger.warn('Validation failed: project name is required');
      setSaveError('Project name is required');
      toast.error('Validation Error', 'Project name is required');
      return;
    }

    logger.debug('Saving project settings', {
      projectId: selectedProjectId,
      projectName: formData.name,
    });

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
      { id: selectedProjectId, request, name: formData.name },
      {
        onSuccess: () => {
          logger.info('Project settings saved successfully', {
            projectId: selectedProjectId,
            projectName: formData.name,
          });
          setHasChanges(false);
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 3000);

          // Show toast notification
          toast.success('Settings saved', 'Project settings have been updated.');

          // Call deprecated callback for backward compatibility
          onSuccess?.('Settings saved', 'Project settings have been updated.');
        },
        onError: (error) => {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          logger.error('Failed to save project settings', {
            projectId: selectedProjectId,
            projectName: formData.name,
            error: errorMessage,
          });
          setSaveError(errorMessage);

          // Show toast notification
          toast.error('Failed to save settings', errorMessage);

          // Call deprecated callback for backward compatibility
          onError?.('Failed to save', errorMessage);
        },
      }
    );
  }, [selectedProjectId, formData, updateProject, toast, onSuccess, onError]);

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
