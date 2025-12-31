/**
 * Pages - Complete page components
 *
 * These are top-level stateless components that compose the entire page view.
 * They receive all required data and callbacks via props, making them fully
 * testable in Storybook with mocked data representing different page states.
 *
 * Each Page component:
 * - Composes templates, organisms, molecules, and atoms
 * - Receives complete data via props (no direct data fetching)
 * - Emits user actions via callback props
 * - Can be rendered in Storybook with full e2e mocking
 *
 * Examples: DashboardPage, TaskPage, ArchivePage, SettingsPage
 */

// Page components
export {
  DashboardPage,
  type DashboardPageProps,
  type DashboardPageSidebarProps,
  type DashboardPageHeaderProps,
  type DashboardPageContentProps,
  type DashboardPageCommandPaletteProps,
  type DashboardPageCreateProjectDialogProps,
  type DashboardPageCreateTaskDialogProps,
  type DashboardPageNewChatDialogProps,
} from './DashboardPage';

export {
  ArchivePage,
  type ArchivePageProps,
  type ArchivePageHeaderProps,
  type ArchivePageTabBarProps,
  type ArchivePageTasksProps,
  type ArchivePageChatsProps,
  type ArchivePageProjectsProps,
  type ArchivePageHelpersProps,
  type ArchivePageConfirmDialogProps,
  // Note: ArchiveTab is already exported from ../organisms/ArchivePageComponents
} from './ArchivePage';

export {
  TaskPage,
  type TaskPageProps,
  type TaskPageHeaderProps,
  type TaskPageTab,
  type TaskPageTabsProps,
  type TaskPageStepsPanelProps,
  type TaskPageMainPanelProps,
  type TaskPageArtifactsTabProps,
  type TaskPageChangesTabProps,
  type TaskPageCommitsTabProps,
  type TaskPageAddStepDialogProps,
  type TaskPageArtifactPreviewDialogProps,
  type TaskPageMoreMenuProps,
  type TaskPageConfirmDialogProps,
} from './TaskPage';

export {
  ChatPage,
  type ChatPageProps,
  type ChatPageHeaderProps,
  type ChatPageContentProps,
  type ChatPageInputAreaProps,
  type ChatPagePermissionDialogProps,
} from './ChatPage';

export {
  ProjectsListPage,
  type ProjectsListPageProps,
  type ProjectsListPageHeaderProps,
  type ProjectsListPageContentProps,
  type ProjectsListPageCreateDialogProps,
} from './ProjectsListPage';

export {
  ProjectDetailPage,
  type ProjectDetailPageProps,
  type ProjectDetailPageSidebarProps,
  type ProjectDetailPageHeaderProps,
  type ProjectDetailPageInfoBarProps,
  type ProjectDetailPageContentProps,
  type ProjectDetailPageCreateTaskDialogProps,
} from './ProjectDetailPage';

export {
  SettingsPage,
  type SettingsPageProps,
  type SettingsPageAppearanceProps,
  type SettingsPageBehaviorProps,
  type SettingsPageAboutProps,
  type SettingsPageSaveProps,
} from './SettingsPage';

export {
  ProfilesSettingsPage,
  type ProfilesSettingsPageProps,
  type ProfilesSettingsPageContentProps,
  type ProfilesSettingsPageFormDialogProps,
} from './ProfilesSettingsPage';

export {
  ProjectsSettingsPage,
  type ProjectsSettingsPageProps,
  type ProjectSettingsPageSelectorOption,
  type ProjectsSettingsPageSelectorProps,
  type ProjectsSettingsPageFormProps,
} from './ProjectsSettingsPage';
