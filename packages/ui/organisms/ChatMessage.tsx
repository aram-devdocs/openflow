import type { Message, MessageRole } from '@openflow/generated';
import { cn } from '@openflow/utils';
import { formatCompact } from '@openflow/utils';
import { Bot, Settings, User, Wrench } from 'lucide-react';
import { Icon } from '../atoms/Icon';
import { Spinner } from '../atoms/Spinner';

export interface ChatMessageProps {
  /** Message data to display */
  message: Message;
  /** Whether the message content is currently streaming */
  isStreaming?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/** Parse tool calls from JSON string */
function parseToolCalls(toolCallsJson?: string): ToolCall[] {
  if (!toolCallsJson) return [];
  try {
    return JSON.parse(toolCallsJson) as ToolCall[];
  } catch {
    return [];
  }
}

/** Tool call type */
interface ToolCall {
  id?: string;
  name: string;
  arguments?: Record<string, unknown>;
}

/** Role configuration for display */
const roleConfig: Record<MessageRole, { label: string; icon: typeof User }> = {
  user: { label: 'You', icon: User },
  assistant: { label: 'Assistant', icon: Bot },
  system: { label: 'System', icon: Settings },
};

/** Role-based styling */
const roleStyles: Record<MessageRole, string> = {
  user: 'bg-primary/10 border-primary/20',
  assistant: 'bg-muted border-border',
  system: 'bg-warning/10 border-warning/20',
};

/** Role icon background styles */
const iconBgStyles: Record<MessageRole, string> = {
  user: 'bg-primary text-primary-foreground',
  assistant: 'bg-accent text-accent-foreground',
  system: 'bg-warning/20 text-warning',
};

/**
 * ChatMessage component for displaying a single message in a chat conversation.
 * Stateless - receives all data via props, no hooks or data fetching.
 *
 * Features:
 * - Role-based styling (user, assistant, system)
 * - Markdown content display
 * - Tool calls visualization
 * - Streaming indicator when content is being generated
 * - Timestamp display
 *
 * @example
 * <ChatMessage message={message} />
 *
 * @example
 * <ChatMessage message={message} isStreaming={true} />
 */
export function ChatMessage({ message, isStreaming = false, className }: ChatMessageProps) {
  const { role, content, toolCalls, createdAt } = message;
  const config = roleConfig[role];
  const parsedToolCalls = parseToolCalls(toolCalls);
  const hasToolCalls = parsedToolCalls.length > 0;

  // Check if message is streaming (from prop or message field)
  const showStreaming = isStreaming || message.isStreaming;

  return (
    <div className={cn('group flex gap-3 rounded-lg border p-4', roleStyles[role], className)}>
      {/* Avatar */}
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          iconBgStyles[role]
        )}
        aria-hidden="true"
      >
        <Icon icon={config.icon} size="sm" />
      </div>

      {/* Content area */}
      <div className="min-w-0 flex-1 space-y-2">
        {/* Header: Role label and timestamp */}
        <div className="flex items-center gap-2">
          <span className="font-medium text-[rgb(var(--foreground))]">{config.label}</span>
          {createdAt && (
            <span className="text-xs text-[rgb(var(--muted-foreground))]">
              {formatCompact(createdAt)}
            </span>
          )}
          {showStreaming && (
            <span className="flex items-center gap-1 text-xs text-[rgb(var(--muted-foreground))]">
              <Spinner size="sm" />
              <span>Generating...</span>
            </span>
          )}
        </div>

        {/* Message content */}
        <div
          className={cn(
            'prose prose-sm max-w-none dark:prose-invert',
            'prose-p:my-2 prose-p:leading-relaxed',
            'prose-pre:bg-[rgb(var(--muted))] prose-pre:border prose-pre:border-[rgb(var(--border))]',
            'prose-code:text-[rgb(var(--primary))] prose-code:before:content-none prose-code:after:content-none',
            'text-[rgb(var(--foreground))]'
          )}
        >
          {/* Render content as text - markdown rendering would be added later */}
          {content ? (
            <div className="whitespace-pre-wrap">{content}</div>
          ) : showStreaming ? (
            <span className="animate-pulse text-[rgb(var(--muted-foreground))]">Thinking...</span>
          ) : null}
        </div>

        {/* Tool calls section */}
        {hasToolCalls && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-[rgb(var(--muted-foreground))]">
              <Icon icon={Wrench} size="xs" />
              <span>Tool Calls</span>
            </div>
            <div className="space-y-1.5">
              {parsedToolCalls.map((toolCall, index) => (
                <ToolCallItem key={toolCall.id ?? `tool-${index}`} toolCall={toolCall} />
              ))}
            </div>
          </div>
        )}

        {/* Model info (optional, for assistant messages) */}
        {role === 'assistant' && message.model && (
          <div className="text-xs text-[rgb(var(--muted-foreground))]">
            Model: {message.model}
            {message.tokensUsed && ` · ${message.tokensUsed} tokens`}
          </div>
        )}
      </div>
    </div>
  );
}

ChatMessage.displayName = 'ChatMessage';

/** Tool call display component */
interface ToolCallItemProps {
  toolCall: ToolCall;
}

function ToolCallItem({ toolCall }: ToolCallItemProps) {
  return (
    <div
      className={cn(
        'rounded border bg-[rgb(var(--muted))]/50 px-3 py-2',
        'border-[rgb(var(--border))]'
      )}
    >
      <div className="flex items-center gap-2">
        <code className="text-xs font-medium text-[rgb(var(--primary))]">{toolCall.name}</code>
      </div>
      {toolCall.arguments && Object.keys(toolCall.arguments).length > 0 && (
        <pre className="mt-1.5 overflow-x-auto text-xs text-[rgb(var(--muted-foreground))]">
          {JSON.stringify(toolCall.arguments, null, 2)}
        </pre>
      )}
    </div>
  );
}

ToolCallItem.displayName = 'ToolCallItem';
