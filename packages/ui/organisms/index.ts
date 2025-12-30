/**
 * Organisms - Complex UI components with business context
 *
 * These are larger components that combine molecules and atoms
 * to form distinct sections of the UI with specific purposes.
 * Examples: TaskCard, TaskList, ChatPanel, Sidebar, Header
 */

export { TaskCard, type TaskCardProps } from './TaskCard';
export { TaskList, type TaskListProps } from './TaskList';
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
