/**
 * Chats List Page Route
 *
 * Displays all chats across tasks and standalone chats.
 * Users can:
 * - View all chats for the current project
 * - Filter by standalone vs task-linked
 * - Navigate to chat details
 * - Archive or delete chats via context menu
 *
 * Follows the orchestration pattern: connects hooks to UI components.
 */

import {
  useArchiveChat,
  useChatsByProject,
  useConfirmDialog,
  useDeleteChat,
  useNavigation,
  useProjects,
  useTasks,
  useToast,
} from '@openflow/hooks';
import {
  AppLayout,
  type ChatFilter,
  ChatsList,
  ConfirmDialog,
  EntityContextMenu,
  Header,
} from '@openflow/ui';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useCallback, useMemo, useState } from 'react';

export const Route = createFileRoute('/_app/chats/')({
  component: ChatsIndexPage,
});

function ChatsIndexPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const navigation = useNavigation();
  const { dialogProps, confirm } = useConfirmDialog();

  // UI state
  const [filter, setFilter] = useState<ChatFilter>('all');
  const [menuState, setMenuState] = useState<{
    isOpen: boolean;
    chatId: string | null;
    position: { x: number; y: number };
  }>({ isOpen: false, chatId: null, position: { x: 0, y: 0 } });

  // Data fetching
  const { data: projects = [] } = useProjects();
  const firstProjectId = projects[0]?.id ?? '';
  const { data: chats = [], isLoading } = useChatsByProject(firstProjectId);
  const { data: tasks = [] } = useTasks(firstProjectId);

  // Mutations
  const archiveChat = useArchiveChat();
  const deleteChat = useDeleteChat();

  // Build lookup maps
  const projectNames = useMemo(() => {
    const map: Record<string, string> = {};
    for (const project of projects) {
      map[project.id] = project.name;
    }
    return map;
  }, [projects]);

  const taskTitles = useMemo(() => {
    const map: Record<string, string> = {};
    for (const task of tasks) {
      map[task.id] = task.title;
    }
    return map;
  }, [tasks]);

  // Callbacks
  const handleSelectChat = useCallback(
    (chatId: string) => {
      navigate({ to: '/chats/$chatId', params: { chatId } });
    },
    [navigate]
  );

  const handleMoreClick = useCallback((chatId: string, event: React.MouseEvent) => {
    event.preventDefault();
    setMenuState({
      isOpen: true,
      chatId,
      position: { x: event.clientX, y: event.clientY },
    });
  }, []);

  const handleContextMenu = useCallback((chatId: string, event: React.MouseEvent) => {
    event.preventDefault();
    setMenuState({
      isOpen: true,
      chatId,
      position: { x: event.clientX, y: event.clientY },
    });
  }, []);

  const handleCloseMenu = useCallback(() => {
    setMenuState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const handleArchiveChat = useCallback(async () => {
    if (!menuState.chatId) return;
    handleCloseMenu();

    try {
      await archiveChat.mutateAsync(menuState.chatId);
      toast.success('Chat archived', 'The chat has been moved to the archive.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error('Failed to archive chat', message);
    }
  }, [menuState.chatId, archiveChat, handleCloseMenu, toast]);

  const handleDeleteChat = useCallback(() => {
    if (!menuState.chatId) return;

    const chat = chats.find((c) => c.id === menuState.chatId);
    if (!chat) return;

    handleCloseMenu();

    confirm({
      title: 'Delete Chat',
      description: `Are you sure you want to delete "${chat.title || 'Untitled Chat'}"? This will permanently delete all messages and cannot be undone.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      variant: 'destructive',
      onConfirm: async () => {
        try {
          await deleteChat.mutateAsync({
            id: chat.id,
            projectId: chat.projectId,
            taskId: chat.taskId,
          });
          toast.success('Chat deleted', 'The chat has been permanently deleted.');
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          toast.error('Failed to delete chat', message);
        }
      },
    });
  }, [menuState.chatId, chats, handleCloseMenu, confirm, deleteChat, toast]);

  const handleViewDetails = useCallback(() => {
    if (!menuState.chatId) return;
    handleCloseMenu();
    navigate({ to: '/chats/$chatId', params: { chatId: menuState.chatId } });
  }, [menuState.chatId, handleCloseMenu, navigate]);

  return (
    <AppLayout
      sidebarCollapsed={navigation.sidebarCollapsed}
      isMobileDrawerOpen={navigation.isMobileDrawerOpen}
      onMobileDrawerToggle={navigation.setMobileDrawerOpen}
      sidebar={null}
      header={
        <Header
          title="All Chats"
          subtitle={`${chats.length} chat${chats.length === 1 ? '' : 's'}`}
        />
      }
    >
      <div className="flex h-full flex-col">
        {/* Chat content */}
        <div className="flex-1 overflow-auto p-4 md:p-6">
          <div className="mx-auto max-w-3xl">
            <ChatsList
              chats={chats}
              projectNames={projectNames}
              taskTitles={taskTitles}
              filter={filter}
              onFilterChange={setFilter}
              onSelectChat={handleSelectChat}
              onMoreClick={handleMoreClick}
              onContextMenu={handleContextMenu}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>

      {/* Context menu */}
      <EntityContextMenu
        entityType="chat"
        isOpen={menuState.isOpen}
        position={menuState.position}
        onClose={handleCloseMenu}
        onViewDetails={handleViewDetails}
        onArchive={handleArchiveChat}
        onDelete={handleDeleteChat}
      />

      {/* Confirm dialog */}
      <ConfirmDialog {...dialogProps} />
    </AppLayout>
  );
}
