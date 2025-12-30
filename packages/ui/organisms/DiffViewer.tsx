import type { DiffHunk, FileDiff } from '@openflow/generated';
import { cn } from '@openflow/utils';
import {
  ArrowRight,
  ChevronDown,
  ChevronRight,
  File,
  FileEdit,
  FileMinus,
  FilePlus,
} from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { Badge } from '../atoms/Badge';
import { Icon } from '../atoms/Icon';

export interface DiffViewerProps {
  /** Array of file diffs to display */
  diffs: FileDiff[];
  /** Set of expanded file paths (controls which files are open) */
  expandedFiles?: Set<string>;
  /** Callback when a file is expanded or collapsed */
  onFileToggle?: (path: string) => void;
  /** Whether all files should be expanded by default (when expandedFiles is not provided) */
  defaultExpanded?: boolean;
  /** Whether to show line numbers */
  showLineNumbers?: boolean;
  /** Maximum height for the diff content area (enables scrolling) */
  maxHeight?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Get the appropriate icon for a file based on its diff status
 */
function getFileIcon(diff: FileDiff) {
  if (diff.isNew) return FilePlus;
  if (diff.isDeleted) return FileMinus;
  return FileEdit;
}

/**
 * Get the color class for a file icon based on its diff status
 */
function getFileIconColor(diff: FileDiff): string {
  if (diff.isNew) return 'text-[rgb(var(--success))]';
  if (diff.isDeleted) return 'text-[rgb(var(--destructive))]';
  return 'text-[rgb(var(--warning))]';
}

/**
 * Parse a diff hunk content into individual lines with metadata
 */
interface DiffLine {
  type: 'context' | 'addition' | 'deletion' | 'header';
  content: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

function parseDiffHunk(hunk: DiffHunk): DiffLine[] {
  const lines: DiffLine[] = [];
  const contentLines = hunk.content.split('\n');

  let oldLine = hunk.oldStart;
  let newLine = hunk.newStart;

  for (const line of contentLines) {
    if (line.startsWith('@@')) {
      lines.push({ type: 'header', content: line });
      continue;
    }

    if (line.startsWith('+')) {
      lines.push({
        type: 'addition',
        content: line.substring(1),
        newLineNumber: newLine,
      });
      newLine++;
    } else if (line.startsWith('-')) {
      lines.push({
        type: 'deletion',
        content: line.substring(1),
        oldLineNumber: oldLine,
      });
      oldLine++;
    } else if (line.startsWith(' ') || line === '') {
      // Context line (or empty line at end)
      const content = line.startsWith(' ') ? line.substring(1) : line;
      if (line !== '' || lines.length > 0) {
        lines.push({
          type: 'context',
          content,
          oldLineNumber: oldLine,
          newLineNumber: newLine,
        });
        oldLine++;
        newLine++;
      }
    }
  }

  return lines;
}

/**
 * Render a single diff line
 */
function DiffLineComponent({
  line,
  showLineNumbers,
}: {
  line: DiffLine;
  showLineNumbers: boolean;
}) {
  if (line.type === 'header') {
    return (
      <div className="bg-[rgb(var(--muted))] px-4 py-1 text-xs text-[rgb(var(--muted-foreground))] font-mono">
        {line.content}
      </div>
    );
  }

  const bgClass =
    line.type === 'addition' ? 'bg-addition/10' : line.type === 'deletion' ? 'bg-deletion/10' : '';

  const textClass =
    line.type === 'addition'
      ? 'text-addition'
      : line.type === 'deletion'
        ? 'text-deletion'
        : 'text-foreground';

  const prefix = line.type === 'addition' ? '+' : line.type === 'deletion' ? '-' : ' ';

  return (
    <div
      className={cn('flex font-mono text-xs leading-6 hover:bg-[rgb(var(--accent))]/50', bgClass)}
    >
      {showLineNumbers && (
        <>
          <span className="w-12 flex-shrink-0 select-none px-2 text-right text-[rgb(var(--muted-foreground))] border-r border-[rgb(var(--border))]">
            {line.type !== 'addition' ? line.oldLineNumber : ''}
          </span>
          <span className="w-12 flex-shrink-0 select-none px-2 text-right text-[rgb(var(--muted-foreground))] border-r border-[rgb(var(--border))]">
            {line.type !== 'deletion' ? line.newLineNumber : ''}
          </span>
        </>
      )}
      <span className={cn('w-6 flex-shrink-0 select-none text-center', textClass)}>{prefix}</span>
      <pre className={cn('flex-1 whitespace-pre-wrap break-all px-2', textClass)}>
        {line.content || ' '}
      </pre>
    </div>
  );
}

/**
 * Render a single file's diff content
 */
function FileDiffContent({
  diff,
  showLineNumbers,
}: {
  diff: FileDiff;
  showLineNumbers: boolean;
}) {
  const allLines = useMemo(() => {
    return diff.hunks.flatMap((hunk) => parseDiffHunk(hunk));
  }, [diff.hunks]);

  if (diff.isBinary) {
    return (
      <div className="px-4 py-3 text-sm text-[rgb(var(--muted-foreground))] italic">
        Binary file - diff not available
      </div>
    );
  }

  if (allLines.length === 0) {
    return (
      <div className="px-4 py-3 text-sm text-[rgb(var(--muted-foreground))] italic">No changes</div>
    );
  }

  // Create lines with stable keys based on line number and type
  const linesWithKeys = allLines.map((line, idx) => ({
    ...line,
    // Use line numbers when available, fallback to index for headers
    key:
      line.type === 'header'
        ? `header-${idx}`
        : `${line.type}-${line.oldLineNumber ?? 'new'}-${line.newLineNumber ?? 'old'}-${idx}`,
  }));

  return (
    <div className="overflow-x-auto">
      {linesWithKeys.map((line) => (
        <DiffLineComponent key={line.key} line={line} showLineNumbers={showLineNumbers} />
      ))}
    </div>
  );
}

/**
 * DiffViewer component for displaying git diffs.
 * Stateless - receives all data via props, emits actions via callbacks.
 *
 * Features:
 * - File-by-file diff display with collapsible sections
 * - Line numbers for old and new file versions
 * - Syntax highlighting for additions, deletions, and context
 * - File status indicators (new, deleted, renamed, modified)
 * - Change statistics (additions/deletions count)
 *
 * @example
 * <DiffViewer
 *   diffs={fileDiffs}
 *   expandedFiles={expandedSet}
 *   onFileToggle={handleToggle}
 * />
 *
 * @example
 * <DiffViewer
 *   diffs={fileDiffs}
 *   defaultExpanded
 *   showLineNumbers
 * />
 */
export function DiffViewer({
  diffs,
  expandedFiles,
  onFileToggle,
  defaultExpanded = false,
  showLineNumbers = true,
  maxHeight,
  className,
}: DiffViewerProps) {
  // If no expandedFiles provided, track internally based on defaultExpanded
  const isExpanded = useCallback(
    (path: string) => {
      if (expandedFiles !== undefined) {
        return expandedFiles.has(path);
      }
      return defaultExpanded;
    },
    [expandedFiles, defaultExpanded]
  );

  const handleToggle = useCallback(
    (path: string) => {
      onFileToggle?.(path);
    },
    [onFileToggle]
  );

  // Calculate totals
  const totals = useMemo(() => {
    return diffs.reduce(
      (acc, diff) => ({
        additions: acc.additions + diff.additions,
        deletions: acc.deletions + diff.deletions,
        files: acc.files + 1,
      }),
      { additions: 0, deletions: 0, files: 0 }
    );
  }, [diffs]);

  if (diffs.length === 0) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center py-12',
          'text-[rgb(var(--muted-foreground))]',
          className
        )}
      >
        <Icon icon={File} size="lg" className="mb-3 opacity-50" />
        <p className="text-sm">No changes to display</p>
      </div>
    );
  }

  return (
    <div
      className={cn('flex flex-col', 'bg-[rgb(var(--background))]', className)}
      style={{ maxHeight }}
    >
      {/* Summary header */}
      <div className="flex items-center justify-between border-b border-[rgb(var(--border))] px-4 py-2">
        <span className="text-sm text-[rgb(var(--foreground))]">
          {totals.files} {totals.files === 1 ? 'file' : 'files'} changed
        </span>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-addition">+{totals.additions}</span>
          <span className="text-deletion">-{totals.deletions}</span>
        </div>
      </div>

      {/* File list */}
      <div className="flex-1 overflow-y-auto scrollbar-thin divide-y divide-[rgb(var(--border))]">
        {diffs.map((diff) => {
          const expanded = isExpanded(diff.path);
          const FileIcon = getFileIcon(diff);
          const iconColor = getFileIconColor(diff);

          return (
            <div key={diff.path} className="flex flex-col">
              {/* File header */}
              <button
                type="button"
                className={cn(
                  'flex items-center gap-2 px-4 py-2',
                  'hover:bg-[rgb(var(--muted))]',
                  'transition-colors duration-150',
                  'text-left w-full',
                  expanded && 'bg-[rgb(var(--muted))]/50'
                )}
                onClick={() => handleToggle(diff.path)}
                aria-expanded={expanded}
                aria-label={`${expanded ? 'Collapse' : 'Expand'} ${diff.path}`}
              >
                {/* Expand/collapse chevron */}
                <Icon
                  icon={expanded ? ChevronDown : ChevronRight}
                  size="sm"
                  className="text-[rgb(var(--muted-foreground))] flex-shrink-0"
                />

                {/* File icon */}
                <Icon icon={FileIcon} size="sm" className={cn('flex-shrink-0', iconColor)} />

                {/* File path */}
                <span className="flex-1 min-w-0 text-sm font-mono truncate text-[rgb(var(--foreground))]">
                  {diff.isRenamed && diff.oldPath ? (
                    <>
                      <span className="text-[rgb(var(--muted-foreground))]">{diff.oldPath}</span>
                      <Icon
                        icon={ArrowRight}
                        size="sm"
                        className="inline mx-1 text-[rgb(var(--muted-foreground))]"
                      />
                      {diff.path}
                    </>
                  ) : (
                    diff.path
                  )}
                </span>

                {/* Status badge */}
                {diff.isNew && (
                  <Badge variant="success" className="flex-shrink-0">
                    new
                  </Badge>
                )}
                {diff.isDeleted && (
                  <Badge variant="error" className="flex-shrink-0">
                    deleted
                  </Badge>
                )}
                {diff.isRenamed && (
                  <Badge variant="warning" className="flex-shrink-0">
                    renamed
                  </Badge>
                )}
                {diff.isBinary && (
                  <Badge variant="default" className="flex-shrink-0">
                    binary
                  </Badge>
                )}

                {/* Change stats */}
                <div className="flex items-center gap-2 text-xs flex-shrink-0">
                  {diff.additions > 0 && <span className="text-addition">+{diff.additions}</span>}
                  {diff.deletions > 0 && <span className="text-deletion">-{diff.deletions}</span>}
                </div>
              </button>

              {/* Diff content */}
              {expanded && (
                <div className="border-t border-[rgb(var(--border))] bg-[rgb(var(--background))]">
                  <FileDiffContent diff={diff} showLineNumbers={showLineNumbers} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

DiffViewer.displayName = 'DiffViewer';
