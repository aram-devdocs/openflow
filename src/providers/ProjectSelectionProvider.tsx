/**
 * ProjectSelectionProvider
 *
 * Provides project selection context to the application.
 * This provider lives in src/ because it needs to import from hooks package.
 */
import { ProjectSelectionContext, useProjectSelectionProvider } from '@openflow/hooks';
import type { ReactNode } from 'react';

export interface ProjectSelectionProviderProps {
  children: ReactNode;
}

/**
 * ProjectSelectionProvider manages project selection state across the application.
 * Wraps your app to enable shared project selection with localStorage persistence.
 *
 * Features:
 * - Selected project ID persisted to localStorage
 * - Automatically restored on app load
 * - Single source of truth for project selection across all routes
 *
 * @example
 * <ProjectSelectionProvider>
 *   <App />
 * </ProjectSelectionProvider>
 *
 * // Later, in a component:
 * const { selectedProjectId, setSelectedProjectId } = useProjectSelection();
 * setSelectedProjectId('project-123');
 */
export function ProjectSelectionProvider({ children }: ProjectSelectionProviderProps) {
  const projectSelectionValue = useProjectSelectionProvider();

  return (
    <ProjectSelectionContext.Provider value={projectSelectionValue}>
      {children}
    </ProjectSelectionContext.Provider>
  );
}

ProjectSelectionProvider.displayName = 'ProjectSelectionProvider';
