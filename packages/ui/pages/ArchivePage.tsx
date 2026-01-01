/**
 * ArchivePage - Stateless Page Component for the Archive
 *
 * This is a top-level stateless component that composes the entire archive view.
 * It receives all required data and callbacks via props, making it fully
 * testable in Storybook with mocked data representing different page states.
 *
 * Accessibility Features:
 * - Proper page landmark structure with main and region roles
 * - h1 heading for page title with proper hierarchy
 * - Screen reader announcements for loading, error, and empty states
 * - Focus management with forwardRef support
 * - Responsive layout for all screen sizes
 * - Error boundary integration for graceful error handling
 *
 * @module pages/ArchivePage
 */

import type { Chat, Project, Task } from '@openflow/generated';
import {
  Box,
  Flex,
  Heading,
  type ResponsiveValue,
  Text,
  VisuallyHidden,
} from '@openflow/primitives';
import { cn } from '@openflow/utils';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { forwardRef, useId } from 'react';
import { Button } from '../atoms/Button';
import { Icon } from '../atoms/Icon';
import { Skeleton } from '../atoms/Skeleton';
import { SkeletonArchiveList } from '../molecules/SkeletonArchiveList';
import {
  ArchiveContent,
  ArchiveHeader,
  ArchiveLayout,
  ArchiveTabBar,
  ConfirmDialog,
} from '../organisms';

// Re-use the ArchiveTab type from organisms to avoid duplication
import type { ArchiveTab } from '../organisms/ArchivePageComponents';

// ============================================================================
// Types
// ============================================================================

/** Size variants for responsive layout */
export type ArchivePageSize = 'sm' | 'md' | 'lg';

/** Breakpoints supported for responsive sizing */
export type ArchivePageBreakpoint = 'base' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

/** Props for the header section */
export interface ArchivePageHeaderProps {
  /** Count of items in the active tab */
  archivedCount: number;
  /** Currently active tab */
  activeTab: ArchiveTab;
  /** Callback for search action */
  onSearch: () => void;
}

/** Props for the tab bar section */
export interface ArchivePageTabBarProps {
  /** Currently active tab */
  activeTab: ArchiveTab;
  /** Callback when tab changes */
  onTabChange: (tab: ArchiveTab) => void;
  /** Count of archived tasks */
  taskCount: number;
  /** Count of archived chats */
  chatCount: number;
  /** Count of archived projects */
  projectCount: number;
  /** Callback for back button */
  onBack: () => void;
}

/** Props for the content section - tasks */
export interface ArchivePageTasksProps {
  /** Archived tasks list */
  archivedTasks: Task[];
  /** Currently selected task */
  selectedTask: Task | null;
  /** Whether a task restore is in progress */
  isRestoringTask: boolean;
  /** Callback when task is selected */
  onSelectTask: (task: Task) => void;
  /** Callback to restore a task */
  onRestoreTask: (task: Task) => void;
  /** Callback to delete a task */
  onDeleteTask: (task: Task) => void;
}

/** Props for the content section - chats */
export interface ArchivePageChatsProps {
  /** Archived chats list */
  archivedChats: Chat[];
  /** Currently selected chat */
  selectedChat: Chat | null;
  /** Whether a chat restore is in progress */
  isRestoringChat: boolean;
  /** Callback when chat is selected */
  onSelectChat: (chat: Chat) => void;
  /** Callback to restore a chat */
  onRestoreChat: (chat: Chat) => void;
  /** Callback to delete a chat */
  onDeleteChat: (chat: Chat) => void;
}

/** Props for the content section - projects */
export interface ArchivePageProjectsProps {
  /** Archived projects list */
  archivedProjects: Project[];
  /** Currently selected project */
  selectedProject: Project | null;
  /** Whether a project restore is in progress */
  isRestoringProject: boolean;
  /** Callback when project is selected */
  onSelectProject: (project: Project) => void;
  /** Callback to restore a project */
  onRestoreProject: (project: Project) => void;
  /** Callback to delete a project */
  onDeleteProject: (project: Project) => void;
}

/** Props for helper functions */
export interface ArchivePageHelpersProps {
  /** Get project name by ID */
  getProjectName: (projectId: string) => string;
  /** Get task title by ID */
  getTaskTitle: (taskId: string | null | undefined) => string | null;
  /** Format date string for display */
  formatDate: (dateString: string | null | undefined) => string;
}

/** Props for the confirm dialog */
export interface ArchivePageConfirmDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Callback to close the dialog */
  onClose: () => void;
  /** Callback when user confirms */
  onConfirm: () => void;
  /** Dialog title */
  title: string;
  /** Dialog description */
  description: string;
  /** Confirm button label */
  confirmLabel?: string;
  /** Cancel button label */
  cancelLabel?: string;
  /** Visual variant */
  variant?: 'default' | 'destructive' | 'warning';
  /** Whether confirm action is in progress */
  loading?: boolean;
}

/** Error state props for the page */
export interface ArchivePageErrorProps {
  /** The error that occurred */
  error: Error;
  /** Callback to retry the failed operation */
  onRetry: () => void;
}

/**
 * Complete props for the ArchivePage component.
 *
 * This interface defines all data and callbacks needed to render the archive.
 * The route component is responsible for providing these props from hooks.
 */
export interface ArchivePageProps {
  /** Whether data is loading */
  isLoading: boolean;

  /** Error state - if set, shows error UI instead of content */
  error?: Error | null;

  /** Retry handler for error state */
  onRetry?: () => void;

  /** Header props */
  header: ArchivePageHeaderProps;

  /** Tab bar props */
  tabBar: ArchivePageTabBarProps;

  /** Tasks section props */
  tasks: ArchivePageTasksProps;

  /** Chats section props */
  chats: ArchivePageChatsProps;

  /** Projects section props */
  projects: ArchivePageProjectsProps;

  /** Helper functions */
  helpers: ArchivePageHelpersProps;

  /** Confirm dialog props */
  confirmDialog: ArchivePageConfirmDialogProps;

  /** Responsive sizing */
  size?: ResponsiveValue<ArchivePageSize>;

  /** Custom aria-label for the page */
  'aria-label'?: string;

  /** Data attributes for testing */
  'data-testid'?: string;
}

/** Props for ArchivePageSkeleton */
export interface ArchivePageSkeletonProps {
  /** Number of skeleton items to show */
  itemCount?: number;
  /** Responsive sizing */
  size?: ResponsiveValue<ArchivePageSize>;
  /** Data attributes for testing */
  'data-testid'?: string;
}

/** Props for ArchivePageError */
export interface ArchivePageErrorStateProps {
  /** The error that occurred */
  error: Error;
  /** Retry handler */
  onRetry: () => void;
  /** Responsive sizing */
  size?: ResponsiveValue<ArchivePageSize>;
  /** Data attributes for testing */
  'data-testid'?: string;
}

// ============================================================================
// Constants
// ============================================================================

/** Default skeleton item count */
export const DEFAULT_SKELETON_COUNT = 5;

/** Default page size */
export const DEFAULT_PAGE_SIZE: ArchivePageSize = 'md';

/** Screen reader announcement for loading state */
export const SR_LOADING = 'Loading archive. Please wait.';

/** Screen reader announcement for error state */
export const SR_ERROR_PREFIX = 'Error loading archive:';

/** Screen reader announcement for empty state */
export const SR_EMPTY = 'No archived items to display.';

/** Screen reader announcement for content loaded */
export const SR_LOADED_PREFIX = 'Archive loaded.';

/** Default page label */
export const DEFAULT_PAGE_LABEL = 'Archive page';

/** Default error title */
export const DEFAULT_ERROR_TITLE = 'Failed to load archive';

/** Default error description */
export const DEFAULT_ERROR_DESCRIPTION = 'Something went wrong while loading the archive.';

/** Default retry button label */
export const DEFAULT_RETRY_LABEL = 'Try Again';

/** Page container base classes */
export const ARCHIVE_PAGE_BASE_CLASSES = 'relative flex flex-col h-full w-full';

/** Error container classes */
export const ARCHIVE_PAGE_ERROR_CLASSES = [
  'flex flex-col items-center justify-center gap-4 p-6',
  'text-center min-h-[300px]',
].join(' ');

/** Skeleton container classes */
export const ARCHIVE_PAGE_SKELETON_CLASSES = 'flex flex-col h-full';

/** Skeleton header classes */
export const ARCHIVE_PAGE_SKELETON_HEADER_CLASSES = 'border-b border-[rgb(var(--border))] p-4';

/** Skeleton tab bar classes */
export const ARCHIVE_PAGE_SKELETON_TAB_CLASSES = 'border-b border-[rgb(var(--border))] p-4';

/** Skeleton content classes */
export const ARCHIVE_PAGE_SKELETON_CONTENT_CLASSES = 'flex-1 p-6';

/** Size-based container padding */
export const PAGE_SIZE_PADDING: Record<ArchivePageSize, string> = {
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

/** Size-based gap classes */
export const PAGE_SIZE_GAP: Record<ArchivePageSize, string> = {
  sm: 'gap-3',
  md: 'gap-4',
  lg: 'gap-6',
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Resolves a ResponsiveValue to its base size
 */
export function getBaseSize(size: ResponsiveValue<ArchivePageSize> | undefined): ArchivePageSize {
  if (!size) return DEFAULT_PAGE_SIZE;
  if (typeof size === 'string') return size;
  return size.base ?? DEFAULT_PAGE_SIZE;
}

/**
 * Generates responsive Tailwind classes for the size prop
 */
export function getResponsiveSizeClasses(
  size: ResponsiveValue<ArchivePageSize> | undefined,
  classMap: Record<ArchivePageSize, string>
): string {
  if (!size) return classMap[DEFAULT_PAGE_SIZE];

  if (typeof size === 'string') {
    return classMap[size];
  }

  const classes: string[] = [];
  const breakpointPrefixes: Record<Exclude<ArchivePageBreakpoint, 'base'>, string> = {
    sm: 'sm:',
    md: 'md:',
    lg: 'lg:',
    xl: 'xl:',
    '2xl': '2xl:',
  };

  // Base size
  if (size.base) {
    classes.push(classMap[size.base]);
  } else {
    classes.push(classMap[DEFAULT_PAGE_SIZE]);
  }

  // Responsive overrides
  for (const [breakpoint, prefix] of Object.entries(breakpointPrefixes)) {
    const bp = breakpoint as Exclude<ArchivePageBreakpoint, 'base'>;
    if (size[bp]) {
      const sizeClasses = classMap[size[bp] as ArchivePageSize];
      const prefixedClasses = sizeClasses
        .split(' ')
        .map((cls) => `${prefix}${cls}`)
        .join(' ');
      classes.push(prefixedClasses);
    }
  }

  return classes.join(' ');
}

/**
 * Get total item count across all tabs
 */
export function getTotalItemCount(
  taskCount: number,
  chatCount: number,
  projectCount: number
): number {
  return taskCount + chatCount + projectCount;
}

/**
 * Build screen reader announcement for loaded state
 */
export function buildLoadedAnnouncement(activeTab: ArchiveTab, itemCount: number): string {
  const tabLabels: Record<ArchiveTab, string> = {
    tasks: 'tasks',
    chats: 'chats',
    projects: 'projects',
  };
  const tabLabel = tabLabels[activeTab];
  const entityLabel = itemCount === 1 ? tabLabel.slice(0, -1) : tabLabel;
  return `${SR_LOADED_PREFIX} Showing ${itemCount} archived ${entityLabel} in ${tabLabel} tab.`;
}

/**
 * Build accessible label for the page
 */
export function buildPageAccessibleLabel(
  activeTab: ArchiveTab,
  isLoading: boolean,
  hasError: boolean
): string {
  if (hasError) return 'Archive page - Error loading content';
  if (isLoading) return 'Archive page - Loading';
  const tabLabels: Record<ArchiveTab, string> = {
    tasks: 'Tasks',
    chats: 'Chats',
    projects: 'Projects',
  };
  return `Archive page - ${tabLabels[activeTab]} tab`;
}

// ============================================================================
// Sub-Components
// ============================================================================

/**
 * Loading skeleton for the archive page
 */
export const ArchivePageSkeleton = forwardRef<HTMLDivElement, ArchivePageSkeletonProps>(
  function ArchivePageSkeleton(
    { itemCount = DEFAULT_SKELETON_COUNT, size, 'data-testid': testId },
    ref
  ) {
    return (
      <Box
        ref={ref}
        className={ARCHIVE_PAGE_SKELETON_CLASSES}
        aria-hidden="true"
        role="presentation"
        data-testid={testId ?? 'archive-page-skeleton'}
      >
        {/* Screen reader loading announcement */}
        <VisuallyHidden>
          <Box role="status" aria-live="polite">
            {SR_LOADING}
          </Box>
        </VisuallyHidden>

        {/* Header skeleton */}
        <Box className={ARCHIVE_PAGE_SKELETON_HEADER_CLASSES}>
          <Flex direction="column" gap="2">
            <Skeleton width={120} height={28} variant="text" />
            <Skeleton width={180} height={16} variant="text" />
          </Flex>
        </Box>

        {/* Tab bar skeleton */}
        <Box className={ARCHIVE_PAGE_SKELETON_TAB_CLASSES}>
          <Flex justify="between" align="center">
            <Skeleton width={100} height={32} />
            <Flex gap="2">
              <Skeleton width={80} height={36} />
              <Skeleton width={80} height={36} />
              <Skeleton width={80} height={36} />
            </Flex>
          </Flex>
        </Box>

        {/* Content skeleton */}
        <Box className={ARCHIVE_PAGE_SKELETON_CONTENT_CLASSES}>
          <SkeletonArchiveList count={itemCount} size={size} />
        </Box>
      </Box>
    );
  }
);

/**
 * Error state for the archive page
 */
export const ArchivePageError = forwardRef<HTMLDivElement, ArchivePageErrorStateProps>(
  function ArchivePageError({ error, onRetry, size, 'data-testid': testId }, ref) {
    const headingId = useId();
    const descriptionId = useId();

    return (
      <Box
        ref={ref}
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        aria-labelledby={headingId}
        aria-describedby={descriptionId}
        className={cn(
          ARCHIVE_PAGE_ERROR_CLASSES,
          getResponsiveSizeClasses(size, PAGE_SIZE_PADDING)
        )}
        data-testid={testId ?? 'archive-page-error'}
      >
        {/* Screen reader announcement */}
        <VisuallyHidden>
          <Box role="status" aria-live="assertive">
            {SR_ERROR_PREFIX} {error.message}
          </Box>
        </VisuallyHidden>

        <Icon
          icon={AlertTriangle}
          size="xl"
          className="text-[rgb(var(--destructive))]"
          aria-hidden="true"
        />

        <Heading id={headingId} level={2} size="lg" className="text-[rgb(var(--foreground))]">
          {DEFAULT_ERROR_TITLE}
        </Heading>

        <Text id={descriptionId} color="muted-foreground" className="max-w-md">
          {error.message || DEFAULT_ERROR_DESCRIPTION}
        </Text>

        <Button
          onClick={onRetry}
          icon={<Icon icon={RefreshCw} size="sm" aria-hidden="true" />}
          className="min-h-[44px] min-w-[44px]"
        >
          {DEFAULT_RETRY_LABEL}
        </Button>
      </Box>
    );
  }
);

// ============================================================================
// Main Component
// ============================================================================

/**
 * ArchivePage - Complete stateless archive page component.
 *
 * This component receives all data and callbacks via props. It is purely
 * presentational, making it fully testable in Storybook with mocked data.
 *
 * Features:
 * - Page-level loading skeleton
 * - Error state with retry button
 * - Empty state handling (delegated to ArchiveContent)
 * - Proper heading hierarchy (h1 for title via Header component)
 * - Screen reader announcements for state changes
 * - forwardRef support for focus management
 * - Responsive layout for all screen sizes
 *
 * @example
 * ```tsx
 * // In route component
 * function ArchiveRoute() {
 *   const navigate = useNavigate();
 *   const session = useArchiveSession({ navigate });
 *
 *   return (
 *     <ArchivePage
 *       isLoading={session.isLoading}
 *       error={session.error}
 *       onRetry={session.refetch}
 *       header={{
 *         archivedCount: session.archivedCount,
 *         activeTab: session.activeTab,
 *         onSearch: session.handleSearch,
 *       }}
 *       tabBar={{
 *         activeTab: session.activeTab,
 *         onTabChange: session.setActiveTab,
 *         taskCount: session.archivedTasks.length,
 *         chatCount: session.archivedChats.length,
 *         projectCount: session.archivedProjects.length,
 *         onBack: session.handleBack,
 *       }}
 *       tasks={{
 *         archivedTasks: session.archivedTasks,
 *         selectedTask: session.selectedTask,
 *         isRestoringTask: session.isRestoringTask,
 *         onSelectTask: session.handleSelectTask,
 *         onRestoreTask: session.handleRestoreTask,
 *         onDeleteTask: session.handleDeleteTask,
 *       }}
 *       chats={{
 *         archivedChats: session.archivedChats,
 *         selectedChat: session.selectedChat,
 *         isRestoringChat: session.isRestoringChat,
 *         onSelectChat: session.handleSelectChat,
 *         onRestoreChat: session.handleRestoreChat,
 *         onDeleteChat: session.handleDeleteChat,
 *       }}
 *       projects={{
 *         archivedProjects: session.archivedProjects,
 *         selectedProject: session.selectedProject,
 *         isRestoringProject: session.isRestoringProject,
 *         onSelectProject: session.handleSelectProject,
 *         onRestoreProject: session.handleRestoreProject,
 *         onDeleteProject: session.handleDeleteProject,
 *       }}
 *       helpers={{
 *         getProjectName: session.getProjectName,
 *         getTaskTitle: session.getTaskTitle,
 *         formatDate: session.formatDate,
 *       }}
 *       confirmDialog={session.confirmDialogProps}
 *     />
 *   );
 * }
 * ```
 */
export const ArchivePage = forwardRef<HTMLDivElement, ArchivePageProps>(function ArchivePage(
  {
    isLoading,
    error,
    onRetry,
    header,
    tabBar,
    tasks,
    chats,
    projects,
    helpers,
    confirmDialog,
    size,
    'aria-label': ariaLabel,
    'data-testid': testId,
  },
  ref
) {
  // Reserved for future ARIA ID usage - useId ensures consistent IDs during SSR
  useId();
  const hasError = !!error;

  // Calculate current item count based on active tab
  const currentItemCount =
    header.activeTab === 'tasks'
      ? tasks.archivedTasks.length
      : header.activeTab === 'chats'
        ? chats.archivedChats.length
        : projects.archivedProjects.length;

  const totalItemCount = getTotalItemCount(tabBar.taskCount, tabBar.chatCount, tabBar.projectCount);

  const isEmpty = currentItemCount === 0;

  // Generate accessible label
  const computedAriaLabel =
    ariaLabel ?? buildPageAccessibleLabel(header.activeTab, isLoading, hasError);

  // Loading state - show skeleton
  if (isLoading) {
    return (
      <Box
        ref={ref}
        className={ARCHIVE_PAGE_BASE_CLASSES}
        aria-label={computedAriaLabel}
        aria-busy="true"
        data-testid={testId ?? 'archive-page'}
        data-state="loading"
      >
        <ArchivePageSkeleton size={size} />
      </Box>
    );
  }

  // Error state - show error UI
  if (hasError && error && onRetry) {
    return (
      <Box
        ref={ref}
        className={ARCHIVE_PAGE_BASE_CLASSES}
        aria-label={computedAriaLabel}
        data-testid={testId ?? 'archive-page'}
        data-state="error"
      >
        <ArchivePageError error={error} onRetry={onRetry} size={size} />
      </Box>
    );
  }

  // Normal state - show content
  return (
    <Box
      ref={ref}
      className={ARCHIVE_PAGE_BASE_CLASSES}
      aria-label={computedAriaLabel}
      data-testid={testId ?? 'archive-page'}
      data-state={isEmpty ? 'empty' : 'loaded'}
      data-active-tab={header.activeTab}
      data-total-items={totalItemCount}
    >
      {/* Screen reader announcements */}
      <VisuallyHidden>
        <Box role="status" aria-live="polite" aria-atomic="true">
          {isEmpty ? SR_EMPTY : buildLoadedAnnouncement(header.activeTab, currentItemCount)}
        </Box>
      </VisuallyHidden>

      <ArchiveLayout
        header={
          <ArchiveHeader
            archivedCount={header.archivedCount}
            activeTab={header.activeTab}
            onSearch={header.onSearch}
          />
        }
      >
        <ArchiveTabBar
          activeTab={tabBar.activeTab}
          onTabChange={tabBar.onTabChange}
          taskCount={tabBar.taskCount}
          chatCount={tabBar.chatCount}
          projectCount={tabBar.projectCount}
          onBack={tabBar.onBack}
        />
        <ArchiveContent
          activeTab={header.activeTab}
          isLoading={isLoading}
          archivedTasks={tasks.archivedTasks}
          selectedTask={tasks.selectedTask}
          isRestoringTask={tasks.isRestoringTask}
          archivedChats={chats.archivedChats}
          selectedChat={chats.selectedChat}
          isRestoringChat={chats.isRestoringChat}
          archivedProjects={projects.archivedProjects}
          selectedProject={projects.selectedProject}
          isRestoringProject={projects.isRestoringProject}
          getProjectName={helpers.getProjectName}
          getTaskTitle={helpers.getTaskTitle}
          formatDate={helpers.formatDate}
          onSelectTask={tasks.onSelectTask}
          onSelectChat={chats.onSelectChat}
          onSelectProject={projects.onSelectProject}
          onRestoreTask={tasks.onRestoreTask}
          onRestoreChat={chats.onRestoreChat}
          onRestoreProject={projects.onRestoreProject}
          onDeleteTask={tasks.onDeleteTask}
          onDeleteChat={chats.onDeleteChat}
          onDeleteProject={projects.onDeleteProject}
        />
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          onClose={confirmDialog.onClose}
          onConfirm={confirmDialog.onConfirm}
          title={confirmDialog.title}
          description={confirmDialog.description}
          confirmLabel={confirmDialog.confirmLabel}
          cancelLabel={confirmDialog.cancelLabel}
          variant={confirmDialog.variant}
          loading={confirmDialog.loading}
        />
      </ArchiveLayout>
    </Box>
  );
});
