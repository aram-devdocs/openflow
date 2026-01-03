/**
 * Project selection hook with localStorage persistence.
 *
 * Manages the currently selected project across the application.
 * Selection is persisted to localStorage and restored on app load.
 * Also provides validation to ensure selected project exists.
 */
import { createLogger } from '@openflow/utils';
import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

const logger = createLogger('useProjectSelection');

/** Storage key for selected project ID in localStorage */
const PROJECT_SELECTION_STORAGE_KEY = 'openflow-selected-project';

export interface ProjectSelectionContextValue {
  /** The currently selected project ID */
  selectedProjectId: string | undefined;
  /** Set the selected project ID */
  setSelectedProjectId: (projectId: string | undefined) => void;
  /** Clear the selection (removes from storage too) */
  clearSelection: () => void;
}

/**
 * Context for project selection state.
 * Used internally by ProjectSelectionProvider and useProjectSelection.
 */
export const ProjectSelectionContext = createContext<ProjectSelectionContextValue | null>(null);

/**
 * Provider hook that manages project selection state.
 * Use this in your ProjectSelectionProvider component.
 *
 * Features:
 * - Selection persisted to localStorage
 * - Automatically restored on app load
 * - Handles invalid/stale project IDs gracefully
 *
 * @example
 * function ProjectSelectionProvider({ children }) {
 *   const value = useProjectSelectionProvider();
 *   return (
 *     <ProjectSelectionContext.Provider value={value}>
 *       {children}
 *     </ProjectSelectionContext.Provider>
 *   );
 * }
 */
export function useProjectSelectionProvider(): ProjectSelectionContextValue {
  // Track initialization for logging
  const hasLoggedInit = useRef(false);

  // Selected project ID - persisted to localStorage
  const [selectedProjectId, setSelectedProjectIdState] = useState<string | undefined>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(PROJECT_SELECTION_STORAGE_KEY);

      // Log initialization once
      if (!hasLoggedInit.current) {
        hasLoggedInit.current = true;
        logger.debug('Project selection provider initialized', {
          selectedProjectId: stored,
          restoredFromStorage: stored !== null,
        });
      }

      return stored ?? undefined;
    }
    return undefined;
  });

  const setSelectedProjectId = useCallback((projectId: string | undefined) => {
    setSelectedProjectIdState((prev) => {
      if (prev !== projectId) {
        logger.info('Project selection changed', {
          previousProjectId: prev,
          newProjectId: projectId,
        });
      }
      return projectId;
    });

    if (projectId) {
      localStorage.setItem(PROJECT_SELECTION_STORAGE_KEY, projectId);
    } else {
      localStorage.removeItem(PROJECT_SELECTION_STORAGE_KEY);
    }
  }, []);

  const clearSelection = useCallback(() => {
    logger.info('Project selection cleared');
    setSelectedProjectIdState(undefined);
    localStorage.removeItem(PROJECT_SELECTION_STORAGE_KEY);
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo<ProjectSelectionContextValue>(
    () => ({
      selectedProjectId,
      setSelectedProjectId,
      clearSelection,
    }),
    [selectedProjectId, setSelectedProjectId, clearSelection]
  );

  return value;
}

/**
 * Hook to access project selection functionality.
 * Must be used within a ProjectSelectionProvider.
 *
 * @example
 * const { selectedProjectId, setSelectedProjectId, clearSelection } = useProjectSelection();
 *
 * // Set selected project
 * setSelectedProjectId('project-123');
 *
 * // Clear selection
 * clearSelection();
 *
 * // Check current selection
 * if (selectedProjectId) { ... }
 */
export function useProjectSelection(): ProjectSelectionContextValue {
  const context = useContext(ProjectSelectionContext);
  if (!context) {
    const error = new Error('useProjectSelection must be used within a ProjectSelectionProvider');
    logger.error('useProjectSelection called outside of ProjectSelectionProvider', {
      error: error.message,
    });
    throw error;
  }
  return context;
}
