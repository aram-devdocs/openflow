import { cn } from '@openflow/utils';
import { Skeleton } from '../atoms/Skeleton';

export interface SkeletonChatProps {
  /** Number of skeleton messages to render */
  messageCount?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * SkeletonChat component for ChatPanel loading placeholders.
 * Renders alternating message bubbles to simulate a chat loading state.
 *
 * Layout matches ChatPanel message structure:
 * - Alternating left (assistant) and right (user) messages
 * - Avatar on message start side
 * - Variable width message bubbles
 *
 * @example
 * // Default 3 messages
 * <SkeletonChat />
 *
 * @example
 * // Custom message count
 * <SkeletonChat messageCount={5} />
 */
export function SkeletonChat({ messageCount = 3, className }: SkeletonChatProps) {
  return (
    <div className={cn('flex flex-col gap-4 p-4', className)} aria-hidden="true">
      {Array.from({ length: messageCount }).map((_, i) => {
        const isUser = i % 2 !== 0;
        return (
          <div
            key={`skeleton-chat-message-${i}`}
            className={cn('flex gap-3', isUser ? 'justify-end' : 'justify-start')}
          >
            {!isUser && <Skeleton variant="circular" width={32} height={32} />}
            <div
              className={cn(
                'max-w-[70%] space-y-2 rounded-lg p-3',
                isUser ? 'bg-[rgb(var(--primary))]/10' : 'bg-[rgb(var(--muted))]'
              )}
            >
              <Skeleton variant="text" className={cn('h-4', isUser ? 'w-32' : 'w-48')} />
              <Skeleton variant="text" className={cn('h-4', isUser ? 'w-24' : 'w-32')} />
              {!isUser && <Skeleton variant="text" className="h-4 w-40" />}
            </div>
            {isUser && <Skeleton variant="circular" width={32} height={32} />}
          </div>
        );
      })}
    </div>
  );
}

SkeletonChat.displayName = 'SkeletonChat';
