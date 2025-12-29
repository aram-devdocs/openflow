import type { SearchResult, SearchResultType } from '@openflow/generated';
import { cn } from '@openflow/utils';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight,
  CheckSquare,
  Clock,
  Command,
  Folder,
  MessageSquare,
  Search,
  X,
} from 'lucide-react';
import { type KeyboardEvent, useEffect, useRef, useState } from 'react';
import { Button } from '../atoms/Button';
import { Icon } from '../atoms/Icon';
import { Input } from '../atoms/Input';
import { Spinner } from '../atoms/Spinner';

/** An action item that can be executed from the command palette */
export interface CommandAction {
  id: string;
  label: string;
  shortcut?: string;
  icon?: LucideIcon;
  onSelect: () => void;
}

/** A recent item for quick access */
export interface RecentItem {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle?: string;
  icon?: string;
}

export interface CommandPaletteProps {
  /** Whether the command palette is open */
  isOpen: boolean;
  /** Callback when the palette should close */
  onClose: () => void;
  /** Callback when search query changes */
  onSearch: (query: string) => void;
  /** Current search query */
  query?: string;
  /** Search results to display */
  searchResults?: SearchResult[];
  /** Whether search is loading */
  isSearching?: boolean;
  /** Recent items for quick access */
  recentItems?: RecentItem[];
  /** Available actions/commands */
  actions?: CommandAction[];
  /** Callback when a search result is selected */
  onSelectResult?: (result: SearchResult) => void;
  /** Callback when a recent item is selected */
  onSelectRecent?: (item: RecentItem) => void;
  /** Placeholder text for the search input */
  placeholder?: string;
  /** Additional class name */
  className?: string;
}

const resultTypeIcons: Record<SearchResultType, LucideIcon> = {
  task: CheckSquare,
  project: Folder,
  chat: MessageSquare,
  message: MessageSquare,
};

const resultTypeLabels: Record<SearchResultType, string> = {
  task: 'Task',
  project: 'Project',
  chat: 'Chat',
  message: 'Message',
};

/**
 * CommandPalette component for quick search and navigation (Cmd+K).
 * Stateless - receives all data via props, emits actions via callbacks.
 *
 * Features:
 * - Search input with keyboard navigation
 * - Result groups (tasks, projects, actions)
 * - Recent items section
 * - Accessible with ARIA attributes
 *
 * @example
 * <CommandPalette
 *   isOpen={isOpen}
 *   onClose={handleClose}
 *   onSearch={handleSearch}
 *   searchResults={results}
 *   recentItems={recentItems}
 *   onSelectResult={handleSelectResult}
 * />
 */
export function CommandPalette({
  isOpen,
  onClose,
  onSearch,
  query = '',
  searchResults = [],
  isSearching = false,
  recentItems = [],
  actions = [],
  onSelectResult,
  onSelectRecent,
  placeholder = 'Search tasks, projects, or type a command...',
  className,
}: CommandPaletteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Calculate total selectable items
  const showRecent = !query && recentItems.length > 0;
  const showActions = !query && actions.length > 0;
  const showResults = query && searchResults.length > 0;

  const totalItems = showRecent
    ? recentItems.length + actions.length
    : showActions
      ? actions.length
      : showResults
        ? searchResults.length
        : 0;

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchResults, query]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        onClose();
        break;
      case 'ArrowDown':
        event.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, totalItems - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        event.preventDefault();
        handleSelect(selectedIndex);
        break;
    }
  };

  // Handle selection
  const handleSelect = (index: number) => {
    if (showRecent && index < recentItems.length) {
      const item = recentItems[index];
      if (item) {
        onSelectRecent?.(item);
        onClose();
      }
    } else if (showRecent && index >= recentItems.length) {
      const actionIndex = index - recentItems.length;
      const action = actions[actionIndex];
      if (action) {
        action.onSelect();
        onClose();
      }
    } else if (showActions && index < actions.length) {
      const action = actions[index];
      if (action) {
        action.onSelect();
        onClose();
      }
    } else if (showResults && index < searchResults.length) {
      const result = searchResults[index];
      if (result) {
        onSelectResult?.(result);
        onClose();
      }
    }
  };

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.querySelector('[data-selected="true"]');
      selectedElement?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  // Handle backdrop click
  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const getItemIcon = (type: SearchResultType) => {
    return resultTypeIcons[type] || CheckSquare;
  };

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />

      {/* Command palette panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        onKeyDown={handleKeyDown}
        className={cn(
          'relative z-50 flex w-full max-w-xl flex-col',
          'rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))]',
          'shadow-2xl',
          'mx-4',
          'max-h-[60vh]',
          'animate-in fade-in-0 zoom-in-95 slide-in-from-top-2',
          className
        )}
      >
        {/* Search input */}
        <div className="flex items-center gap-2 border-b border-[rgb(var(--border))] px-3">
          <Icon icon={Search} size="sm" className="text-[rgb(var(--muted-foreground))]" />
          <Input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={placeholder}
            className="flex-1 border-0 bg-transparent px-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            aria-label="Search"
            autoComplete="off"
          />
          {isSearching && <Spinner size="sm" />}
          <div className="flex items-center gap-1 text-xs text-[rgb(var(--muted-foreground))]">
            <kbd className="rounded bg-[rgb(var(--muted))] px-1.5 py-0.5 font-mono text-[10px]">
              esc
            </kbd>
            <span>to close</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0"
            aria-label="Close"
          >
            <Icon icon={X} size="sm" />
          </Button>
        </div>

        {/* Results list */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-2">
          {/* Empty state when searching */}
          {query && !isSearching && searchResults.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Search className="mb-2 h-8 w-8 text-[rgb(var(--muted-foreground))]" />
              <p className="text-sm text-[rgb(var(--muted-foreground))]">
                No results found for "{query}"
              </p>
              <p className="mt-1 text-xs text-[rgb(var(--muted-foreground))]">
                Try searching for something else
              </p>
            </div>
          )}

          {/* Recent items section */}
          {showRecent && (
            <div className="mb-2">
              <div className="mb-1 flex items-center gap-1 px-2 text-xs font-medium text-[rgb(var(--muted-foreground))]">
                <Clock className="h-3 w-3" />
                <span>Recent</span>
              </div>
              {recentItems.map((item, index) => {
                const ItemIcon = getItemIcon(item.type);
                const isSelected = index === selectedIndex;
                return (
                  <button
                    key={item.id}
                    type="button"
                    data-selected={isSelected}
                    onClick={() => {
                      onSelectRecent?.(item);
                      onClose();
                    }}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-md px-2 py-2 text-left',
                      'transition-colors duration-75',
                      isSelected
                        ? 'bg-[rgb(var(--accent))] text-[rgb(var(--accent-foreground))]'
                        : 'text-[rgb(var(--foreground))] hover:bg-[rgb(var(--accent))]'
                    )}
                  >
                    <Icon
                      icon={ItemIcon}
                      size="sm"
                      className="text-[rgb(var(--muted-foreground))]"
                    />
                    <div className="flex-1 truncate">
                      <div className="truncate text-sm font-medium">{item.title}</div>
                      {item.subtitle && (
                        <div className="truncate text-xs text-[rgb(var(--muted-foreground))]">
                          {item.subtitle}
                        </div>
                      )}
                    </div>
                    <span className="shrink-0 text-xs text-[rgb(var(--muted-foreground))]">
                      {resultTypeLabels[item.type]}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Actions section */}
          {showActions && (
            <div className="mb-2">
              <div className="mb-1 flex items-center gap-1 px-2 text-xs font-medium text-[rgb(var(--muted-foreground))]">
                <Command className="h-3 w-3" />
                <span>Actions</span>
              </div>
              {actions.map((action, index) => {
                const actualIndex = showRecent ? recentItems.length + index : index;
                const isSelected = actualIndex === selectedIndex;
                const ActionIcon = action.icon || ArrowRight;
                return (
                  <button
                    key={action.id}
                    type="button"
                    data-selected={isSelected}
                    onClick={() => {
                      action.onSelect();
                      onClose();
                    }}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-md px-2 py-2 text-left',
                      'transition-colors duration-75',
                      isSelected
                        ? 'bg-[rgb(var(--accent))] text-[rgb(var(--accent-foreground))]'
                        : 'text-[rgb(var(--foreground))] hover:bg-[rgb(var(--accent))]'
                    )}
                  >
                    <Icon
                      icon={ActionIcon}
                      size="sm"
                      className="text-[rgb(var(--muted-foreground))]"
                    />
                    <span className="flex-1 text-sm">{action.label}</span>
                    {action.shortcut && (
                      <kbd className="shrink-0 rounded bg-[rgb(var(--muted))] px-1.5 py-0.5 font-mono text-[10px] text-[rgb(var(--muted-foreground))]">
                        {action.shortcut}
                      </kbd>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Search results */}
          {showResults && (
            <div>
              <div className="mb-1 flex items-center gap-1 px-2 text-xs font-medium text-[rgb(var(--muted-foreground))]">
                <Search className="h-3 w-3" />
                <span>Results</span>
                <span className="ml-auto">{searchResults.length} found</span>
              </div>
              {searchResults.map((result, index) => {
                const ResultIcon = getItemIcon(result.resultType);
                const isSelected = index === selectedIndex;
                return (
                  <button
                    key={result.id}
                    type="button"
                    data-selected={isSelected}
                    onClick={() => {
                      onSelectResult?.(result);
                      onClose();
                    }}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-md px-2 py-2 text-left',
                      'transition-colors duration-75',
                      isSelected
                        ? 'bg-[rgb(var(--accent))] text-[rgb(var(--accent-foreground))]'
                        : 'text-[rgb(var(--foreground))] hover:bg-[rgb(var(--accent))]'
                    )}
                  >
                    <Icon
                      icon={ResultIcon}
                      size="sm"
                      className="text-[rgb(var(--muted-foreground))]"
                    />
                    <div className="flex-1 truncate">
                      <div className="truncate text-sm font-medium">{result.title}</div>
                      {result.subtitle && (
                        <div className="truncate text-xs text-[rgb(var(--muted-foreground))]">
                          {result.subtitle}
                        </div>
                      )}
                    </div>
                    <span className="shrink-0 text-xs text-[rgb(var(--muted-foreground))]">
                      {resultTypeLabels[result.resultType]}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Empty state when no query and no recent items */}
          {!query && recentItems.length === 0 && actions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Command className="mb-2 h-8 w-8 text-[rgb(var(--muted-foreground))]" />
              <p className="text-sm text-[rgb(var(--muted-foreground))]">Start typing to search</p>
              <p className="mt-1 text-xs text-[rgb(var(--muted-foreground))]">
                Find tasks, projects, and more
              </p>
            </div>
          )}
        </div>

        {/* Footer with keyboard hints */}
        <div className="flex items-center gap-4 border-t border-[rgb(var(--border))] px-3 py-2 text-xs text-[rgb(var(--muted-foreground))]">
          <div className="flex items-center gap-1">
            <kbd className="rounded bg-[rgb(var(--muted))] px-1.5 py-0.5 font-mono text-[10px]">
              ↑
            </kbd>
            <kbd className="rounded bg-[rgb(var(--muted))] px-1.5 py-0.5 font-mono text-[10px]">
              ↓
            </kbd>
            <span>to navigate</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="rounded bg-[rgb(var(--muted))] px-1.5 py-0.5 font-mono text-[10px]">
              ↵
            </kbd>
            <span>to select</span>
          </div>
        </div>
      </div>
    </div>
  );
}

CommandPalette.displayName = 'CommandPalette';
