/**
 * ChatPage - Stateless Page Component for the Standalone Chat
 *
 * This is a top-level stateless component that composes the entire chat view.
 * It receives all required data and callbacks via props, making it fully
 * testable in Storybook with mocked data representing different page states.
 *
 * The component composes:
 * - ChatPageLayout (page structure)
 * - ChatHeader (title, project name, view toggle)
 * - ChatContent (empty state or message list)
 * - ChatInputArea (message input and send/stop buttons)
 * - ChatPermissionDialog (permission requests from Claude)
 */

import type { Chat, Project } from '@openflow/generated';
import type { RefObject } from 'react';
import type { DisplayItem } from '../organisms/ChatBubbles';
import {
  ChatContent,
  ChatHeader,
  ChatInputArea,
  ChatLoadingSkeleton,
  type ChatMessageData,
  ChatNotFound,
  ChatPageLayout,
  ChatPermissionDialog,
} from '../organisms/ChatPageComponents';
import type { PermissionRequest } from '../organisms/PermissionDialog';

// ============================================================================
// Types
// ============================================================================

/** Props for the header section */
export interface ChatPageHeaderProps {
  /** Chat title */
  title?: string;
  /** Project name */
  projectName?: string;
  /** Whether raw output is shown */
  showRawOutput: boolean;
  /** Callback to toggle raw output */
  onToggleRawOutput: () => void;
  /** Callback when back button is clicked */
  onBack: () => void;
}

/** Props for the content section */
export interface ChatPageContentProps {
  /** Whether there is content to display */
  hasContent: boolean;
  /** Whether processing is in progress */
  isProcessing: boolean;
  /** Array of persisted messages */
  messages: ChatMessageData[];
  /** Display items for streaming response */
  displayItems: DisplayItem[];
  /** Active process ID (for streaming) */
  activeProcessId: string | null;
  /** Whether Claude is currently responding */
  isRunning: boolean;
  /** Whether to show raw output */
  showRawOutput: boolean;
  /** Raw output lines */
  rawOutput: string[];
  /** Ref for scroll anchor */
  scrollRef?: RefObject<HTMLDivElement>;
}

/** Props for the input area section */
export interface ChatPageInputAreaProps {
  /** Current input value */
  inputValue: string;
  /** Whether a process is running */
  isProcessing: boolean;
  /** Ref for the textarea */
  textareaRef?: RefObject<HTMLTextAreaElement>;
  /** Callback when input changes */
  onInputChange: (value: string) => void;
  /** Callback for key events */
  onKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  /** Callback to send message */
  onSend: () => void;
  /** Callback to stop process */
  onStop: () => void;
}

/** Props for the permission dialog */
export interface ChatPagePermissionDialogProps {
  /** Permission request data */
  request: PermissionRequest | null;
  /** Callback when approved */
  onApprove: () => void;
  /** Callback when denied */
  onDeny: () => void;
}

/**
 * Complete props for the ChatPage component.
 *
 * This interface defines all data and callbacks needed to render the chat page.
 * The route component is responsible for providing these props from hooks.
 */
export interface ChatPageProps {
  /** Page state: 'loading' | 'not-found' | 'ready' */
  state: 'loading' | 'not-found' | 'ready';

  /** Callback for not-found back button (only needed when state is 'not-found') */
  onNotFoundBack?: () => void;

  // The following props are only required when state is 'ready'

  /** The chat being displayed */
  chat?: Chat;

  /** The project associated with the chat */
  project?: Project;

  /** Header props */
  header?: ChatPageHeaderProps;

  /** Content props */
  content?: ChatPageContentProps;

  /** Input area props */
  inputArea?: ChatPageInputAreaProps;

  /** Permission dialog props */
  permissionDialog?: ChatPagePermissionDialogProps;
}

// ============================================================================
// Component
// ============================================================================

/**
 * ChatPage - Complete stateless chat page component.
 *
 * This component receives all data and callbacks via props. It is purely
 * presentational, making it fully testable in Storybook with mocked data.
 *
 * @example
 * ```tsx
 * // In route component
 * function StandaloneChatRoute() {
 *   const { chatId } = Route.useParams();
 *   const navigate = useNavigate();
 *   const toast = useToast();
 *
 *   const session = useChatSession({
 *     chatId,
 *     onError: (title, message) => toast.error(title, message),
 *   });
 *
 *   // Loading state
 *   if (session.isLoadingChat) {
 *     return <ChatPage state="loading" />;
 *   }
 *
 *   // Not found state
 *   if (!session.chat) {
 *     return (
 *       <ChatPage
 *         state="not-found"
 *         onNotFoundBack={() => navigate({ to: '/' })}
 *       />
 *     );
 *   }
 *
 *   // Ready state
 *   return (
 *     <ChatPage
 *       state="ready"
 *       chat={session.chat}
 *       project={session.project}
 *       header={{
 *         title: session.chat.title,
 *         projectName: session.project?.name,
 *         showRawOutput: session.showRawOutput,
 *         onToggleRawOutput: session.toggleRawOutput,
 *         onBack: () => navigate({ to: '/' }),
 *       }}
 *       content={{
 *         hasContent: session.hasContent,
 *         isProcessing: session.isProcessing,
 *         messages: session.messages,
 *         displayItems: session.displayItems,
 *         activeProcessId: session.activeProcessId,
 *         isRunning: session.isRunning,
 *         showRawOutput: session.showRawOutput,
 *         rawOutput: session.rawOutput,
 *         scrollRef: session.messagesEndRef,
 *       }}
 *       inputArea={{
 *         inputValue: session.inputValue,
 *         isProcessing: session.isProcessing,
 *         textareaRef: session.textareaRef,
 *         onInputChange: session.setInputValue,
 *         onKeyDown: session.handleKeyDown,
 *         onSend: session.handleSend,
 *         onStop: session.handleStopProcess,
 *       }}
 *       permissionDialog={{
 *         request: session.permissionRequest,
 *         onApprove: session.handleApprovePermission,
 *         onDeny: session.handleDenyPermission,
 *       }}
 *     />
 *   );
 * }
 * ```
 */
export function ChatPage({
  state,
  onNotFoundBack,
  header,
  content,
  inputArea,
  permissionDialog,
}: ChatPageProps) {
  // Loading state
  if (state === 'loading') {
    return <ChatLoadingSkeleton />;
  }

  // Not found state
  if (state === 'not-found') {
    return <ChatNotFound onBack={onNotFoundBack ?? (() => {})} />;
  }

  // Ready state - all props should be defined
  if (!header || !content || !inputArea) {
    // Fallback if props are missing in ready state (shouldn't happen in practice)
    return <ChatNotFound onBack={onNotFoundBack ?? (() => {})} />;
  }

  return (
    <ChatPageLayout
      permissionDialog={
        permissionDialog && (
          <ChatPermissionDialog
            request={permissionDialog.request}
            onApprove={permissionDialog.onApprove}
            onDeny={permissionDialog.onDeny}
          />
        )
      }
      header={
        <ChatHeader
          title={header.title}
          projectName={header.projectName}
          showRawOutput={header.showRawOutput}
          onToggleRawOutput={header.onToggleRawOutput}
          onBack={header.onBack}
        />
      }
      inputArea={
        <ChatInputArea
          inputValue={inputArea.inputValue}
          isProcessing={inputArea.isProcessing}
          textareaRef={inputArea.textareaRef}
          onInputChange={inputArea.onInputChange}
          onKeyDown={inputArea.onKeyDown}
          onSend={inputArea.onSend}
          onStop={inputArea.onStop}
        />
      }
    >
      <ChatContent
        hasContent={content.hasContent}
        isProcessing={content.isProcessing}
        messages={content.messages}
        displayItems={content.displayItems}
        activeProcessId={content.activeProcessId}
        isRunning={content.isRunning}
        showRawOutput={content.showRawOutput}
        rawOutput={content.rawOutput}
        scrollRef={content.scrollRef}
      />
    </ChatPageLayout>
  );
}

ChatPage.displayName = 'ChatPage';
