/**
 * Organisms - Complex UI components with business context
 *
 * These are larger components that combine molecules and atoms
 * to form distinct sections of the UI with specific purposes.
 * Examples: TaskCard, TaskList, ChatPanel, Sidebar, Header
 */

export { TaskCard, type TaskCardProps } from './TaskCard';
export { TaskList, type TaskListProps } from './TaskList';
export { ChatCard, type ChatCardProps } from './ChatCard';
export { ChatsList, type ChatsListProps, type ChatFilter } from './ChatsList';
export { ProjectSelector, type ProjectSelectorProps } from './ProjectSelector';
export { ChatMessage, type ChatMessageProps } from './ChatMessage';
export { ChatPanel, type ChatPanelProps } from './ChatPanel';
export {
  ClaudeEventRenderer,
  type ClaudeEventRendererProps,
  type ClaudeEvent,
  type ClaudeSystemEvent,
  type ClaudeAssistantEvent,
  type ClaudeUserEvent,
  type ClaudeResultEvent,
} from './ClaudeEventRenderer';
export { StepsPanel, type StepsPanelProps } from './StepsPanel';
export { DiffViewer, type DiffViewerProps } from './DiffViewer';
export { CommitList, type CommitListProps } from './CommitList';
export {
  CommandPalette,
  type CommandPaletteProps,
  type CommandAction,
  type RecentItem,
} from './CommandPalette';
export { Sidebar, type SidebarProps, type StatusFilter } from './Sidebar';
export { Header, type HeaderProps } from './Header';
export { NewChatDialog, type NewChatDialogProps } from './NewChatDialog';
export {
  PermissionDialog,
  type PermissionDialogProps,
  type PermissionRequest,
} from './PermissionDialog';
export { ErrorBoundary, type ErrorBoundaryProps } from './ErrorBoundary';
export { RouteError, type RouteErrorProps } from './RouteError';
export {
  KeyboardShortcutsDialog,
  type KeyboardShortcutsDialogProps,
  type ShortcutGroup,
  defaultShortcutGroups,
} from './KeyboardShortcutsDialog';
export { Drawer, type DrawerProps } from './Drawer';
export { WorkflowSelector, type WorkflowSelectorProps } from './WorkflowSelector';
export { WorkflowPreview, type WorkflowPreviewProps } from './WorkflowPreview';
export { ArtifactsPanel, type ArtifactsPanelProps, type ArtifactFile } from './ArtifactsPanel';
export { ArtifactPreviewDialog, type ArtifactPreviewDialogProps } from './ArtifactPreviewDialog';
export { ConfirmDialog, type ConfirmDialogProps } from './ConfirmDialog';
export { CreatePRDialog, type CreatePRDialogProps } from './CreatePRDialog';
export {
  UserMessageBubble,
  type UserMessageBubbleProps,
  AssistantMessageBubble,
  type AssistantMessageBubbleProps,
  StreamingResponse,
  type StreamingResponseProps,
  ToolCallCard,
  type ToolCallCardProps,
  RawOutputSection,
  type RawOutputSectionProps,
  type ToolInfo,
  type DisplayItem,
  type ClaudeEventForUI,
} from './ChatBubbles';
export {
  ChatPageLayout,
  type ChatPageLayoutProps,
  ChatLoadingSkeleton,
  type ChatLoadingSkeletonProps,
  ChatNotFound,
  type ChatNotFoundProps,
  ChatHeader,
  type ChatHeaderProps,
  ChatEmptyState,
  type ChatEmptyStateProps,
  ChatMessageList,
  type ChatMessageListProps,
  type ChatMessageData,
  ChatInputArea,
  type ChatInputAreaProps,
  ChatPermissionDialog,
  type ChatPermissionDialogProps,
  ChatContent,
  type ChatContentProps,
} from './ChatPageComponents';
export {
  TaskNotFound,
  type TaskNotFoundProps,
  TaskOutputPanel,
  type TaskOutputPanelProps,
  TaskMainPanel,
  type TaskMainPanelProps,
  TaskStepsPanel,
  type TaskStepsPanelProps,
  AddStepDialog,
  type AddStepDialogProps,
  TaskArtifactsTab,
  type TaskArtifactsTabProps,
  TaskChangesTab,
  type TaskChangesTabProps,
  TaskCommitsTab,
  type TaskCommitsTabProps,
} from './TaskPageComponents';
export {
  StatCard,
  type StatCardProps,
  StatusBadge,
  type StatusBadgeProps,
  DashboardLayout,
  type DashboardLayoutProps,
  DashboardSidebar,
  type DashboardSidebarProps,
  DashboardHeader,
  type DashboardHeaderProps,
  DashboardEmptyState,
  type DashboardEmptyStateProps,
  DashboardLoadingSkeleton,
  type DashboardLoadingSkeletonProps,
  DashboardStatsGrid,
  type DashboardStatsGridProps,
  RecentTasksList,
  type RecentTasksListProps,
  DashboardContent,
  type DashboardContentProps,
  CreateProjectDialog,
  type CreateProjectDialogProps,
  CreateTaskDialog,
  type CreateTaskDialogProps,
  DashboardCommandPalette,
  type DashboardCommandPaletteProps,
  DashboardNewChatDialog,
  type DashboardNewChatDialogProps,
  buildCommandActions,
  buildRecentItems,
  buildHeaderSubtitle,
} from './DashboardPageComponents';
export {
  type ArchiveTab,
  ArchiveLayout,
  type ArchiveLayoutProps,
  ArchiveHeader,
  type ArchiveHeaderProps,
  ArchiveTabBar,
  type ArchiveTabBarProps,
  ArchivedTaskItem,
  type ArchivedTaskItemProps,
  ArchivedChatItem,
  type ArchivedChatItemProps,
  ArchivedProjectItem,
  type ArchivedProjectItemProps,
  ArchiveContent,
  type ArchiveContentProps,
} from './ArchivePageComponents';
export {
  type ProfileFormData,
  ProfilesPageLayout,
  type ProfilesPageLayoutProps,
  ProfilesLoadingSkeleton,
  type ProfilesLoadingSkeletonProps,
  ProfilesEmptyState,
  type ProfilesEmptyStateProps,
  ProfilesList,
  type ProfilesListProps,
  ProfileCard,
  type ProfileCardProps,
  ProfileFormDialog,
  type ProfileFormDialogProps,
  ProfilesConfirmDialog,
  type ProfilesConfirmDialogProps,
  ProfilesContent,
  type ProfilesContentProps,
} from './ProfilesPageComponents';
export {
  type ProjectSettingsFormData,
  ProjectSettingsLayout,
  type ProjectSettingsLayoutProps,
  ProjectSettingsLoadingSkeleton,
  type ProjectSettingsLoadingSkeletonProps,
  ProjectSettingsEmptyState,
  type ProjectSettingsEmptyStateProps,
  ProjectSettingsSelector,
  type ProjectSettingsSelectorProps,
  SettingsSection,
  type SettingsSectionProps,
  BasicInfoSection,
  type BasicInfoSectionProps,
  ScriptsSection,
  type ScriptsSectionProps,
  WorkflowsSection,
  type WorkflowsSectionProps,
  RulesSection,
  type RulesSectionProps,
  VerificationSection,
  type VerificationSectionProps,
  SaveFooter,
  type SaveFooterProps,
  ProjectSettingsForm,
  type ProjectSettingsFormProps,
} from './ProjectSettingsPageComponents';
export {
  ProjectDetailLayout,
  type ProjectDetailLayoutProps,
  ProjectDetailSidebar,
  type ProjectDetailSidebarProps,
  ProjectDetailHeader,
  type ProjectDetailHeaderProps,
  ProjectDetailLoadingSkeleton,
  type ProjectDetailLoadingSkeletonProps,
  ProjectNotFound,
  type ProjectNotFoundProps,
  ProjectDetailInfoBar,
  type ProjectDetailInfoBarProps,
  ProjectDetailContent,
  type ProjectDetailContentProps,
  ProjectCreateTaskDialog,
  type ProjectCreateTaskDialogProps,
} from './ProjectDetailPageComponents';
export {
  ProjectsListLayout,
  type ProjectsListLayoutProps,
  ProjectsListHeader,
  type ProjectsListHeaderProps,
  ProjectsListLoadingSkeleton,
  type ProjectsListLoadingSkeletonProps,
  ProjectsListEmptyState,
  type ProjectsListEmptyStateProps,
  ProjectCard,
  type ProjectCardProps,
  ProjectsGrid,
  type ProjectsGridProps,
  ProjectsListContent,
  type ProjectsListContentProps,
  ProjectsListCreateDialog,
  type ProjectsListCreateDialogProps,
  ProjectsListConfirmDialog,
  type ProjectsListConfirmDialogProps,
} from './ProjectsListPageComponents';
export {
  type StatusFilter as TasksStatusFilter,
  type StatusFilterOption as TasksStatusFilterOption,
  TasksFilterBar,
  type TasksFilterBarProps,
  TasksListLoading,
  type TasksListLoadingProps,
  TasksListEmpty,
  type TasksListEmptyProps,
  TasksListContent,
  type TasksListContentProps,
  TasksListLayout,
  type TasksListLayoutProps,
} from './TasksListPageComponents';
export {
  Terminal,
  type TerminalProps,
  type TerminalTheme,
  type TerminalInstance,
  defaultDarkTheme,
  defaultLightTheme,
} from './Terminal';
export { TerminalPanel, type TerminalPanelProps } from './TerminalPanel';
