/**
 * Standalone Chat Page Route
 *
 * Displays a single standalone chat session with a unified conversation view.
 * Shows user messages and Claude's responses in chronological order.
 *
 * This route is pure composition - it only combines UI components and hooks.
 * All component definitions live in @openflow/ui, all logic in @openflow/hooks.
 */

import { useChatSession, useKeyboardShortcuts, useToast } from '@openflow/hooks';
import { ChatPage } from '@openflow/ui';
import { createFileRoute, useNavigate } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/chats/$chatId')({
  component: StandaloneChatRoute,
});

function StandaloneChatRoute() {
  const { chatId } = Route.useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const session = useChatSession({
    chatId,
    onError: (title, message) => toast.error(title, message),
  });

  useKeyboardShortcuts([
    { key: 't', meta: true, action: session.toggleViewMode },
    { key: 'Escape', action: () => navigate({ to: '/' }) },
  ]);

  // Loading state
  if (session.isLoadingChat) {
    return <ChatPage state="loading" />;
  }

  // Not found state
  if (!session.chat) {
    return <ChatPage state="not-found" onNotFoundBack={() => navigate({ to: '/' })} />;
  }

  // Ready state
  return (
    <ChatPage
      state="ready"
      chat={session.chat}
      project={session.project}
      header={{
        title: session.chat.title,
        projectName: session.project?.name,
        viewMode: session.viewMode,
        onToggleViewMode: session.toggleViewMode,
        onBack: () => navigate({ to: '/' }),
      }}
      content={{
        hasContent: session.hasContent,
        isProcessing: session.isProcessing,
        messages: session.messages,
        displayItems: session.displayItems,
        activeProcessId: session.activeProcessId,
        isRunning: session.isRunning,
        viewMode: session.viewMode,
        rawOutput: session.rawOutput,
        scrollRef: session.messagesEndRef,
        scrollContainerRef: session.scrollContainerRef,
      }}
      inputArea={{
        inputValue: session.inputValue,
        isProcessing: session.isProcessing,
        textareaRef: session.textareaRef,
        onInputChange: session.setInputValue,
        onKeyDown: session.handleKeyDown,
        onSend: session.handleSend,
        onStop: session.handleStopProcess,
      }}
      permissionDialog={{
        request: session.permissionRequest
          ? {
              processId: session.activeProcessId ?? '',
              toolName: session.permissionRequest.toolName,
              filePath: session.permissionRequest.filePath,
              description: session.permissionRequest.description ?? '',
            }
          : null,
        onApprove: session.handleApprovePermission,
        onDeny: session.handleDenyPermission,
      }}
    />
  );
}
