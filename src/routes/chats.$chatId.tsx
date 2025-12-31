/**
 * Standalone Chat Page Route
 *
 * Displays a single standalone chat session with a unified conversation view.
 * Shows user messages and Claude's responses in chronological order.
 *
 * This route is pure composition - it only combines UI components and hooks.
 * All component definitions live in @openflow/ui, all logic in @openflow/hooks.
 */

import { useChatSession, useKeyboardShortcuts } from '@openflow/hooks';
import {
  ChatContent,
  ChatHeader,
  ChatInputArea,
  ChatLoadingSkeleton,
  ChatNotFound,
  ChatPageLayout,
  ChatPermissionDialog,
  useToast,
} from '@openflow/ui';
import { createFileRoute, useNavigate } from '@tanstack/react-router';

export const Route = createFileRoute('/chats/$chatId')({
  component: StandaloneChatPage,
});

function StandaloneChatPage() {
  const { chatId } = Route.useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const session = useChatSession({
    chatId,
    onError: (title, message) => toast.error(title, message),
  });

  useKeyboardShortcuts([
    { key: 't', meta: true, action: session.toggleRawOutput },
    { key: 'Escape', action: () => navigate({ to: '/' }) },
  ]);

  if (session.isLoadingChat) {
    return <ChatLoadingSkeleton />;
  }

  if (!session.chat) {
    return <ChatNotFound onBack={() => navigate({ to: '/' })} />;
  }

  return (
    <ChatPageLayout
      permissionDialog={
        <ChatPermissionDialog
          request={session.permissionRequest}
          onApprove={session.handleApprovePermission}
          onDeny={session.handleDenyPermission}
        />
      }
      header={
        <ChatHeader
          title={session.chat.title}
          projectName={session.project?.name}
          showRawOutput={session.showRawOutput}
          onToggleRawOutput={session.toggleRawOutput}
          onBack={() => navigate({ to: '/' })}
        />
      }
      inputArea={
        <ChatInputArea
          inputValue={session.inputValue}
          isProcessing={session.isProcessing}
          textareaRef={session.textareaRef}
          onInputChange={session.setInputValue}
          onKeyDown={session.handleKeyDown}
          onSend={session.handleSend}
          onStop={session.handleStopProcess}
        />
      }
    >
      <ChatContent
        hasContent={session.hasContent}
        isProcessing={session.isProcessing}
        messages={session.messages}
        displayItems={session.displayItems}
        activeProcessId={session.activeProcessId}
        isRunning={session.isRunning}
        showRawOutput={session.showRawOutput}
        rawOutput={session.rawOutput}
        scrollRef={session.messagesEndRef}
      />
    </ChatPageLayout>
  );
}
