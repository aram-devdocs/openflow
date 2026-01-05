/**
 * ChatDiffPanel - Collapsible git diff panel for chat sessions
 *
 * Displays file changes at the end of a chat session in a collapsible panel.
 * Uses the DiffViewer component to render the actual diffs.
 *
 * Features:
 * - Collapsible panel with expand/collapse animation
 * - File count and change summary in header
 * - Integrates with DiffViewer for actual diff display
 * - Loading and error states
 * - Full accessibility support
 */

import type { FileDiff } from '@openflow/generated';
import { Box, Flex, Text, VisuallyHidden } from '@openflow/primitives';
import { cn } from '@openflow/utils';
import { ChevronDown, ChevronRight, GitBranch, RefreshCw } from 'lucide-react';
import { forwardRef, useCallback, useState } from 'react';
import { Button } from '../atoms/Button';
import { Icon } from '../atoms/Icon';
import { Skeleton } from '../atoms/Skeleton';
import { DiffViewer } from './DiffViewer';

// ============================================================================
// Types
// ============================================================================

export interface ChatDiffPanelProps {
  /** Array of file diffs to display */
  diffs: FileDiff[];
  /** Whether the panel is loading */
  isLoading?: boolean;
  /** Error message if loading failed */
  error?: string | null;
  /** Callback to retry loading */
  onRetry?: () => void;
  /** Whether the panel should start expanded */
  defaultExpanded?: boolean;
  /** Maximum height for the diff content */
  maxHeight?: string;
  /** Additional CSS classes */
  className?: string;
  /** Data attributes for testing */
  'data-testid'?: string;
}

// ============================================================================
// Constants
// ============================================================================

export const DEFAULT_MAX_HEIGHT = '400px';
export const DEFAULT_PANEL_TITLE = 'Files Changed';
export const DEFAULT_LOADING_TEXT = 'Loading changes...';
export const DEFAULT_ERROR_TITLE = 'Failed to load changes';
export const DEFAULT_RETRY_LABEL = 'Retry';
export const DEFAULT_NO_CHANGES_TEXT = 'No file changes';

/** Screen reader announcements */
export const SR_PANEL_EXPANDED = 'File changes panel expanded';
export const SR_PANEL_COLLAPSED = 'File changes panel collapsed';
export const SR_LOADING = 'Loading file changes';

/** CSS Classes */
export const CHAT_DIFF_PANEL_BASE_CLASSES = cn(
  'rounded-lg border border-[rgb(var(--border))]',
  'bg-[rgb(var(--card))] overflow-hidden',
  'motion-safe:transition-all motion-safe:duration-200'
);

export const CHAT_DIFF_PANEL_HEADER_CLASSES = cn(
  'flex items-center justify-between px-4 py-3',
  'cursor-pointer select-none',
  'hover:bg-[rgb(var(--muted))]/50',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))] focus-visible:ring-inset',
  'min-h-[44px]'
);

export const CHAT_DIFF_PANEL_CONTENT_CLASSES = cn(
  'border-t border-[rgb(var(--border))]',
  'overflow-hidden',
  'motion-safe:transition-all motion-safe:duration-200'
);

export const CHAT_DIFF_PANEL_LOADING_CLASSES = 'flex items-center justify-center py-8';

export const CHAT_DIFF_PANEL_ERROR_CLASSES = cn(
  'flex flex-col items-center justify-center gap-3 py-8',
  'text-center'
);

// ============================================================================
// Component
// ============================================================================

/**
 * ChatDiffPanel shows file changes at the end of a chat session.
 *
 * The panel is collapsible and shows a summary of changes in the header.
 * When expanded, it displays the full DiffViewer with file-by-file diffs.
 *
 * @example
 * // Display file changes
 * <ChatDiffPanel
 *   diffs={fileDiffs}
 *   defaultExpanded={false}
 * />
 *
 * @example
 * // With loading state
 * <ChatDiffPanel
 *   diffs={[]}
 *   isLoading={true}
 * />
 *
 * @example
 * // With error state
 * <ChatDiffPanel
 *   diffs={[]}
 *   error="Failed to load git diff"
 *   onRetry={() => refetch()}
 * />
 */
export const ChatDiffPanel = forwardRef<HTMLDivElement, ChatDiffPanelProps>(function ChatDiffPanel(
  {
    diffs,
    isLoading = false,
    error = null,
    onRetry,
    defaultExpanded = false,
    maxHeight = DEFAULT_MAX_HEIGHT,
    className,
    'data-testid': testId,
  },
  ref
) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());

  // Calculate totals
  const totals = diffs.reduce(
    (acc, diff) => ({
      files: acc.files + 1,
      additions: acc.additions + diff.additions,
      deletions: acc.deletions + diff.deletions,
    }),
    { files: 0, additions: 0, deletions: 0 }
  );

  // Toggle panel expansion
  const handleToggle = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  // Toggle individual file expansion
  const handleFileToggle = useCallback((path: string) => {
    setExpandedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleToggle();
      }
    },
    [handleToggle]
  );

  // Don't render if no diffs and not loading/error
  if (diffs.length === 0 && !isLoading && !error) {
    return null;
  }

  return (
    <Box
      ref={ref}
      className={cn(CHAT_DIFF_PANEL_BASE_CLASSES, className)}
      data-testid={testId}
      data-expanded={isExpanded}
      data-loading={isLoading}
      data-has-error={!!error}
    >
      {/* Screen reader announcements */}
      <VisuallyHidden>
        <Text as="span" aria-live="polite">
          {isExpanded ? SR_PANEL_EXPANDED : SR_PANEL_COLLAPSED}
        </Text>
      </VisuallyHidden>

      {/* Header */}
      <Box
        as="button"
        type="button"
        className={CHAT_DIFF_PANEL_HEADER_CLASSES}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        aria-expanded={isExpanded}
        aria-label={`${isExpanded ? 'Collapse' : 'Expand'} file changes. ${totals.files} files, ${totals.additions} additions, ${totals.deletions} deletions`}
      >
        <Flex align="center" gap="2">
          <Icon
            icon={isExpanded ? ChevronDown : ChevronRight}
            size="sm"
            className="text-[rgb(var(--muted-foreground))]"
            aria-hidden={true}
          />
          <Icon
            icon={GitBranch}
            size="sm"
            className="text-[rgb(var(--primary))]"
            aria-hidden={true}
          />
          <Text size="sm" weight="medium">
            {DEFAULT_PANEL_TITLE}
          </Text>
          {!isLoading && !error && totals.files > 0 && (
            <Text size="xs" color="muted-foreground">
              ({totals.files} {totals.files === 1 ? 'file' : 'files'})
            </Text>
          )}
        </Flex>

        {/* Stats */}
        {!isLoading && !error && totals.files > 0 && (
          <Flex align="center" gap="3" aria-hidden>
            <Text size="xs" className="text-addition">
              +{totals.additions}
            </Text>
            <Text size="xs" className="text-deletion">
              -{totals.deletions}
            </Text>
          </Flex>
        )}

        {/* Loading indicator in header */}
        {isLoading && (
          <Text size="xs" color="muted-foreground">
            {DEFAULT_LOADING_TEXT}
          </Text>
        )}
      </Box>

      {/* Content */}
      {isExpanded && (
        <Box className={CHAT_DIFF_PANEL_CONTENT_CLASSES} style={{ maxHeight }}>
          {isLoading ? (
            <Box className={CHAT_DIFF_PANEL_LOADING_CLASSES}>
              <Flex direction="column" align="center" gap="3">
                <Skeleton variant="circular" width={32} height={32} />
                <Skeleton variant="text" width={120} height={16} />
              </Flex>
            </Box>
          ) : error ? (
            <Box className={CHAT_DIFF_PANEL_ERROR_CLASSES}>
              <Text size="sm" color="destructive">
                {DEFAULT_ERROR_TITLE}
              </Text>
              <Text size="xs" color="muted-foreground">
                {error}
              </Text>
              {onRetry && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRetry();
                  }}
                  icon={<Icon icon={RefreshCw} size="xs" aria-hidden={true} />}
                >
                  {DEFAULT_RETRY_LABEL}
                </Button>
              )}
            </Box>
          ) : (
            <Box className="overflow-auto" style={{ maxHeight }}>
              <DiffViewer
                diffs={diffs}
                expandedFiles={expandedFiles}
                onFileToggle={handleFileToggle}
                showLineNumbers={true}
                size="sm"
              />
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
});

ChatDiffPanel.displayName = 'ChatDiffPanel';
