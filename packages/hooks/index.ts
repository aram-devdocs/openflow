/**
 * @openflow/hooks
 *
 * TanStack Query hooks for data fetching with caching.
 * These hooks wrap the query functions from @openflow/queries
 * with React Query for state management, caching, and invalidation.
 *
 * Also includes Zustand stores for UI-only state (viewStore).
 * UI state is separate from business state - business data comes from queries.
 *
 * Level 3 in dependency hierarchy - imports from queries, validation, generated, utils.
 */

export * from './useProjects';
export * from './useTasks';
export * from './useTaskExecution';
export * from './useAgentSession';
export * from './useChats';
export * from './useMessages';
export * from './useProcesses';
export * from './useDataSync';
export * from './useExecutorProfiles';
export * from './useEventSubscription';
export * from './useProcessLifecycle';
export * from './useToolStates';
export * from './useSettings';
export * from './useKeyboardShortcuts';
export * from './useKeyboardShortcutsDialog';
export * from './useWorkflows';
export * from './useTheme';
export * from './useToastMutation';
export * from './useArtifacts';
export * from './useConfirmDialog';
export * from './useChatSession';
export * from './useTaskSession';
export * from './useDashboardSession';
export * from './useArchiveSession';
export * from './useProfilesSession';
export * from './useProjectsSettingsSession';
export * from './useProjectDetailSession';
export * from './useProjectsListSession';
export * from './useNavigation';
export * from './useProjectSelection';
export * from './useToast';
export * from './useSearch';
export * from './useGit';
export * from './useTerminal';
export * from './useGitHub';
export * from './useGlobalShortcuts';
export * from './useSystem';

// Zustand stores for UI-only state
export * from './stores';
