import type { SearchResult, SearchResultType } from '@openflow/generated';
import { Box, Text, VisuallyHidden } from '@openflow/primitives';
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
import {
  type ForwardedRef,
  type KeyboardEvent,
  forwardRef,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import { Button } from '../atoms/Button';
import { Icon } from '../atoms/Icon';
import { Input } from '../atoms/Input';
import { Skeleton } from '../atoms/Skeleton';
import { Spinner } from '../atoms/Spinner';
import { EmptyState } from '../molecules/EmptyState';

// =============================================================================
// Types
// =============================================================================

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

/** Size variants for the command palette */
export type CommandPaletteSize = 'sm' | 'md' | 'lg';

/** Breakpoints for responsive sizing */
export type CommandPaletteBreakpoint = 'base' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

/** Responsive value type */
export type ResponsiveValue<T> = T | Partial<Record<CommandPaletteBreakpoint, T>>;

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
  /** Responsive size variant */
  size?: ResponsiveValue<CommandPaletteSize>;
  /** Additional class name */
  className?: string;
  /** Custom aria-label for the dialog */
  'aria-label'?: string;
  /** Test ID for automated testing */
  'data-testid'?: string;
}

/** Props for the skeleton loading state */
export interface CommandPaletteSkeletonProps {
  /** Number of skeleton items to show */
  count?: number;
  /** Test ID for automated testing */
  'data-testid'?: string;
}

// =============================================================================
// Constants
// =============================================================================

// Default values
export const DEFAULT_PLACEHOLDER = 'Search tasks, projects, or type a command...';
export const DEFAULT_SKELETON_COUNT = 5;

// Default labels for accessibility
export const DEFAULT_DIALOG_LABEL = 'Command palette';
export const DEFAULT_SEARCH_LABEL = 'Search commands and items';
export const DEFAULT_CLOSE_LABEL = 'Close command palette';
export const DEFAULT_RECENT_LABEL = 'Recent items';
export const DEFAULT_ACTIONS_LABEL = 'Available actions';
export const DEFAULT_RESULTS_LABEL = 'Search results';
export const DEFAULT_NO_RESULTS_TITLE = 'No results found';
export const DEFAULT_EMPTY_TITLE = 'Start typing to search';
export const DEFAULT_EMPTY_DESCRIPTION = 'Find tasks, projects, and more';

// Screen reader announcements
export const SR_PALETTE_OPENED =
  'Command palette opened. Type to search or use arrow keys to navigate.';
export const SR_RESULTS_COUNT = (count: number) => `${count} result${count !== 1 ? 's' : ''} found`;
export const SR_NO_RESULTS = 'No results found for your search';
export const SR_SEARCHING = 'Searching...';
export const SR_ITEM_SELECTED = (label: string, type: string) => `${type}: ${label}`;

// Result type configuration
export const RESULT_TYPE_ICONS: Record<SearchResultType, LucideIcon> = {
  task: CheckSquare,
  project: Folder,
  chat: MessageSquare,
  message: MessageSquare,
};

export const RESULT_TYPE_LABELS: Record<SearchResultType, string> = {
  task: 'Task',
  project: 'Project',
  chat: 'Chat',
  message: 'Message',
};

// Size class mappings
export const COMMAND_PALETTE_SIZE_CLASSES: Record<CommandPaletteSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-2xl',
};

export const COMMAND_PALETTE_INPUT_SIZE_CLASSES: Record<CommandPaletteSize, string> = {
  sm: 'py-2',
  md: 'py-3',
  lg: 'py-4',
};

export const COMMAND_PALETTE_ITEM_SIZE_CLASSES: Record<CommandPaletteSize, string> = {
  sm: 'py-1.5 px-2 gap-2',
  md: 'py-2 px-3 gap-3',
  lg: 'py-3 px-4 gap-4',
};

export const COMMAND_PALETTE_ICON_SIZE_MAP: Record<CommandPaletteSize, 'xs' | 'sm' | 'md'> = {
  sm: 'xs',
  md: 'sm',
  lg: 'md',
};

// Base classes
export const COMMAND_PALETTE_BACKDROP_CLASSES =
  'fixed inset-0 z-50 flex items-start justify-center pt-[15vh]';

export const COMMAND_PALETTE_OVERLAY_CLASSES =
  'fixed inset-0 bg-black/50 backdrop-blur-sm motion-safe:animate-in motion-safe:fade-in-0';

export const COMMAND_PALETTE_PANEL_CLASSES =
  'relative z-50 flex w-full flex-col rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] shadow-2xl mx-4 max-h-[60vh] motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:slide-in-from-top-2';

export const COMMAND_PALETTE_INPUT_CONTAINER_CLASSES =
  'flex items-center gap-2 border-b border-[rgb(var(--border))] px-3';

export const COMMAND_PALETTE_INPUT_CLASSES =
  'flex-1 border-0 bg-transparent px-0 focus-visible:ring-0 focus-visible:ring-offset-0';

export const COMMAND_PALETTE_LIST_CLASSES = 'flex-1 overflow-y-auto scrollbar-thin p-2';

export const COMMAND_PALETTE_SECTION_HEADER_CLASSES =
  'mb-1 flex items-center gap-1 px-2 text-xs font-medium text-[rgb(var(--muted-foreground))]';

export const COMMAND_PALETTE_ITEM_BASE_CLASSES =
  'flex w-full items-center rounded-md text-left motion-safe:transition-colors motion-safe:duration-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[rgb(var(--ring))] min-h-[44px]';

export const COMMAND_PALETTE_ITEM_SELECTED_CLASSES =
  'bg-[rgb(var(--accent))] text-[rgb(var(--accent-foreground))]';

export const COMMAND_PALETTE_ITEM_UNSELECTED_CLASSES =
  'text-[rgb(var(--foreground))] hover:bg-[rgb(var(--accent))]';

export const COMMAND_PALETTE_KBD_CLASSES =
  'shrink-0 rounded bg-[rgb(var(--muted))] px-1.5 py-0.5 font-mono text-[10px] text-[rgb(var(--muted-foreground))]';

export const COMMAND_PALETTE_FOOTER_CLASSES =
  'flex items-center gap-4 border-t border-[rgb(var(--border))] px-3 py-2 text-xs text-[rgb(var(--muted-foreground))]';

export const COMMAND_PALETTE_CLOSE_BUTTON_CLASSES =
  'h-8 w-8 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 p-0';

export const COMMAND_PALETTE_SKELETON_CLASSES = 'flex items-center gap-3 px-3 py-2';

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Get the base size value from a responsive value
 */
export function getBaseSize(size: ResponsiveValue<CommandPaletteSize>): CommandPaletteSize {
  if (typeof size === 'string') {
    return size;
  }
  return size.base ?? 'md';
}

/**
 * Get responsive size classes from a responsive value
 */
export function getResponsiveSizeClasses(
  size: ResponsiveValue<CommandPaletteSize>,
  classMap: Record<CommandPaletteSize, string>
): string {
  if (typeof size === 'string') {
    return classMap[size];
  }

  const classes: string[] = [];
  const breakpointOrder: CommandPaletteBreakpoint[] = ['base', 'sm', 'md', 'lg', 'xl', '2xl'];

  for (const breakpoint of breakpointOrder) {
    const sizeValue = size[breakpoint];
    if (sizeValue) {
      const sizeClass = classMap[sizeValue];
      if (breakpoint === 'base') {
        classes.push(sizeClass);
      } else {
        // Add breakpoint prefix to each class
        const prefixedClasses = sizeClass.split(' ').map((c) => `${breakpoint}:${c}`);
        classes.push(...prefixedClasses);
      }
    }
  }

  return classes.join(' ');
}

/**
 * Get the icon for a search result type
 */
export function getItemIcon(type: SearchResultType): LucideIcon {
  return RESULT_TYPE_ICONS[type] || CheckSquare;
}

/**
 * Get the label for a search result type
 */
export function getItemTypeLabel(type: SearchResultType): string {
  return RESULT_TYPE_LABELS[type] || 'Item';
}

/**
 * Generate a unique option ID for aria-activedescendant
 */
export function getOptionId(baseId: string, section: string, index: number): string {
  return `${baseId}-${section}-${index}`;
}

/**
 * Get screen reader announcement for current selection
 */
export function getSelectionAnnouncement(label: string, type: string, shortcut?: string): string {
  let announcement = `${type}: ${label}`;
  if (shortcut) {
    announcement += `. Keyboard shortcut: ${shortcut}`;
  }
  return announcement;
}

/**
 * Get screen reader announcement for results count
 */
export function getResultsAnnouncement(count: number, isSearching: boolean, query: string): string {
  if (isSearching) {
    return SR_SEARCHING;
  }
  if (query && count === 0) {
    return SR_NO_RESULTS;
  }
  if (count > 0) {
    return SR_RESULTS_COUNT(count);
  }
  return '';
}

// =============================================================================
// Skeleton Component
// =============================================================================

/**
 * Loading skeleton for the command palette
 */
export function CommandPaletteSkeleton({
  count = DEFAULT_SKELETON_COUNT,
  'data-testid': testId,
}: CommandPaletteSkeletonProps) {
  return (
    <Box aria-hidden={true} role="presentation" data-testid={testId}>
      {Array.from({ length: count }).map((_, index) => (
        <Box key={`skeleton-${index}`} className={COMMAND_PALETTE_SKELETON_CLASSES}>
          <Skeleton variant="circular" width={24} height={24} />
          <Box className="flex-1 space-y-1">
            <Skeleton variant="text" width="60%" height={16} />
            <Skeleton variant="text" width="40%" height={12} />
          </Box>
        </Box>
      ))}
    </Box>
  );
}

CommandPaletteSkeleton.displayName = 'CommandPaletteSkeleton';

// =============================================================================
// Main Component
// =============================================================================

/**
 * CommandPalette component for quick search and navigation (Cmd+K).
 * Stateless - receives all data via props, emits actions via callbacks.
 *
 * Features:
 * - ARIA combobox pattern with listbox results
 * - Full keyboard navigation (Up/Down/Home/End/Enter/Escape)
 * - aria-activedescendant for highlighted item tracking
 * - Screen reader announcements for state changes
 * - Focus trap within dialog
 * - Responsive sizing with touch targets
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
export const CommandPalette = forwardRef(function CommandPalette(
  {
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
    placeholder = DEFAULT_PLACEHOLDER,
    size = 'md',
    className,
    'aria-label': ariaLabel = DEFAULT_DIALOG_LABEL,
    'data-testid': testId,
  }: CommandPaletteProps,
  ref: ForwardedRef<HTMLDivElement>
) {
  const uniqueId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [announcement, setAnnouncement] = useState('');

  // IDs for ARIA
  const inputId = `${uniqueId}-input`;
  const listboxId = `${uniqueId}-listbox`;
  const labelId = `${uniqueId}-label`;

  // Calculate total selectable items and sections
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

  // Size calculations
  const baseSize = getBaseSize(size);

  // Get active descendant ID
  const getActiveDescendantId = (): string | undefined => {
    if (totalItems === 0) return undefined;

    if (showRecent && selectedIndex < recentItems.length) {
      return getOptionId(uniqueId, 'recent', selectedIndex);
    }
    if (showRecent && selectedIndex >= recentItems.length) {
      return getOptionId(uniqueId, 'action', selectedIndex - recentItems.length);
    }
    if (showActions && selectedIndex < actions.length) {
      return getOptionId(uniqueId, 'action', selectedIndex);
    }
    if (showResults) {
      return getOptionId(uniqueId, 'result', selectedIndex);
    }
    return undefined;
  };

  // Reset selection when results change
  // biome-ignore lint/correctness/useExhaustiveDependencies: Intentionally reset selection when result counts change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, searchResults.length, recentItems.length, actions.length]);

  // Store previous active element and focus input when opened
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
      setAnnouncement(SR_PALETTE_OPENED);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Return focus on close
  useEffect(() => {
    if (!isOpen && previousActiveElement.current) {
      previousActiveElement.current.focus();
    }
  }, [isOpen]);

  // Announce results count changes
  useEffect(() => {
    const message = getResultsAnnouncement(searchResults.length, isSearching, query);
    if (message) {
      setAnnouncement(message);
    }
  }, [searchResults.length, isSearching, query]);

  // Handle keyboard navigation
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        event.stopPropagation();
        onClose();
        break;
      case 'ArrowDown':
        event.preventDefault();
        setSelectedIndex((prev) => {
          const next = Math.min(prev + 1, totalItems - 1);
          announceCurrentItem(next);
          return next;
        });
        break;
      case 'ArrowUp':
        event.preventDefault();
        setSelectedIndex((prev) => {
          const next = Math.max(prev - 1, 0);
          announceCurrentItem(next);
          return next;
        });
        break;
      case 'Home':
        event.preventDefault();
        setSelectedIndex(0);
        announceCurrentItem(0);
        break;
      case 'End':
        event.preventDefault();
        if (totalItems > 0) {
          setSelectedIndex(totalItems - 1);
          announceCurrentItem(totalItems - 1);
        }
        break;
      case 'Enter':
        event.preventDefault();
        handleSelect(selectedIndex);
        break;
      case 'Tab':
        // Prevent focus from leaving the dialog
        event.preventDefault();
        break;
    }
  };

  // Announce current item for screen readers
  const announceCurrentItem = (index: number) => {
    let label = '';
    let type = '';
    let shortcut: string | undefined;

    if (showRecent && index < recentItems.length) {
      const item = recentItems[index];
      if (item) {
        label = item.title;
        type = getItemTypeLabel(item.type);
      }
    } else if (showRecent && index >= recentItems.length) {
      const actionIndex = index - recentItems.length;
      const action = actions[actionIndex];
      if (action) {
        label = action.label;
        type = 'Action';
        shortcut = action.shortcut;
      }
    } else if (showActions && index < actions.length) {
      const action = actions[index];
      if (action) {
        label = action.label;
        type = 'Action';
        shortcut = action.shortcut;
      }
    } else if (showResults && index < searchResults.length) {
      const result = searchResults[index];
      if (result) {
        label = result.title;
        type = getItemTypeLabel(result.resultType);
      }
    }

    if (label) {
      setAnnouncement(getSelectionAnnouncement(label, type, shortcut));
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
    const selectedElement = listRef.current?.querySelector('[data-selected="true"]');
    selectedElement?.scrollIntoView({ block: 'nearest' });
  });

  // Handle backdrop click
  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <Box
      ref={ref}
      role="presentation"
      className={COMMAND_PALETTE_BACKDROP_CLASSES}
      onClick={handleBackdropClick}
      data-testid={testId}
      data-state={isOpen ? 'open' : 'closed'}
    >
      {/* Backdrop */}
      <Box className={COMMAND_PALETTE_OVERLAY_CLASSES} aria-hidden={true} />

      {/* Screen reader announcements */}
      <VisuallyHidden>
        <Box role="status" aria-live="polite" aria-atomic="true">
          {announcement}
        </Box>
      </VisuallyHidden>

      {/* Command palette panel */}
      <Box
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelId}
        onKeyDown={handleKeyDown}
        className={cn(
          COMMAND_PALETTE_PANEL_CLASSES,
          getResponsiveSizeClasses(size, COMMAND_PALETTE_SIZE_CLASSES),
          className
        )}
      >
        {/* Hidden label for the dialog */}
        <VisuallyHidden>
          <Text as="span" id={labelId}>
            {ariaLabel}
          </Text>
        </VisuallyHidden>

        {/* Search input */}
        <Box className={COMMAND_PALETTE_INPUT_CONTAINER_CLASSES}>
          <Icon
            icon={Search}
            size={COMMAND_PALETTE_ICON_SIZE_MAP[baseSize]}
            className="text-[rgb(var(--muted-foreground))]"
            aria-hidden={true}
          />
          <Input
            ref={inputRef}
            id={inputId}
            type="text"
            role="combobox"
            aria-expanded={totalItems > 0}
            aria-controls={listboxId}
            aria-activedescendant={getActiveDescendantId()}
            aria-autocomplete="list"
            aria-label={DEFAULT_SEARCH_LABEL}
            value={query}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={placeholder}
            className={cn(
              COMMAND_PALETTE_INPUT_CLASSES,
              COMMAND_PALETTE_INPUT_SIZE_CLASSES[baseSize]
            )}
            autoComplete="off"
            data-testid={testId ? `${testId}-input` : undefined}
          />
          {isSearching && (
            <Spinner
              size={COMMAND_PALETTE_ICON_SIZE_MAP[baseSize]}
              announce={false}
              aria-label={SR_SEARCHING}
            />
          )}
          <Box className="flex items-center gap-1 text-xs text-[rgb(var(--muted-foreground))]">
            <Box as="kbd" className={COMMAND_PALETTE_KBD_CLASSES} aria-hidden={true}>
              esc
            </Box>
            <Text as="span" size="xs" color="muted-foreground">
              to close
            </Text>
          </Box>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className={COMMAND_PALETTE_CLOSE_BUTTON_CLASSES}
            aria-label={DEFAULT_CLOSE_LABEL}
            data-testid={testId ? `${testId}-close` : undefined}
          >
            <Icon icon={X} size="sm" aria-hidden={true} />
          </Button>
        </Box>

        {/* Results list */}
        <Box
          ref={listRef}
          id={listboxId}
          role="listbox"
          aria-label={
            query
              ? DEFAULT_RESULTS_LABEL
              : showRecent
                ? DEFAULT_RECENT_LABEL
                : DEFAULT_ACTIONS_LABEL
          }
          className={COMMAND_PALETTE_LIST_CLASSES}
          data-testid={testId ? `${testId}-list` : undefined}
        >
          {/* Empty state when searching */}
          {query && !isSearching && searchResults.length === 0 && (
            <EmptyState
              icon={Search}
              title={`${DEFAULT_NO_RESULTS_TITLE} for "${query}"`}
              description="Try searching for something else"
              size="md"
              data-testid={testId ? `${testId}-empty-search` : undefined}
            />
          )}

          {/* Recent items section */}
          {showRecent && (
            <Box className="mb-2" role="group" aria-label={DEFAULT_RECENT_LABEL}>
              <Box className={COMMAND_PALETTE_SECTION_HEADER_CLASSES}>
                <Clock className="h-3 w-3" aria-hidden={true} />
                <Text as="span" size="xs" weight="medium">
                  Recent
                </Text>
              </Box>
              {recentItems.map((item, index) => {
                const ItemIcon = getItemIcon(item.type);
                const isSelected = index === selectedIndex;
                const optionId = getOptionId(uniqueId, 'recent', index);
                return (
                  <Box
                    as="button"
                    key={item.id}
                    id={optionId}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    data-selected={isSelected}
                    onClick={() => {
                      onSelectRecent?.(item);
                      onClose();
                    }}
                    className={cn(
                      COMMAND_PALETTE_ITEM_BASE_CLASSES,
                      COMMAND_PALETTE_ITEM_SIZE_CLASSES[baseSize],
                      isSelected
                        ? COMMAND_PALETTE_ITEM_SELECTED_CLASSES
                        : COMMAND_PALETTE_ITEM_UNSELECTED_CLASSES
                    )}
                  >
                    <Icon
                      icon={ItemIcon}
                      size={COMMAND_PALETTE_ICON_SIZE_MAP[baseSize]}
                      className="text-[rgb(var(--muted-foreground))]"
                      aria-hidden={true}
                    />
                    <Box className="flex-1 truncate">
                      <Text as="span" size="sm" weight="medium" truncate className="block">
                        {item.title}
                      </Text>
                      {item.subtitle && (
                        <Text
                          as="span"
                          size="xs"
                          color="muted-foreground"
                          truncate
                          className="block"
                        >
                          {item.subtitle}
                        </Text>
                      )}
                    </Box>
                    <Text as="span" size="xs" color="muted-foreground" className="shrink-0">
                      {getItemTypeLabel(item.type)}
                    </Text>
                  </Box>
                );
              })}
            </Box>
          )}

          {/* Actions section */}
          {showActions && (
            <Box className="mb-2" role="group" aria-label={DEFAULT_ACTIONS_LABEL}>
              <Box className={COMMAND_PALETTE_SECTION_HEADER_CLASSES}>
                <Command className="h-3 w-3" aria-hidden={true} />
                <Text as="span" size="xs" weight="medium">
                  Actions
                </Text>
              </Box>
              {actions.map((action, index) => {
                const actualIndex = showRecent ? recentItems.length + index : index;
                const isSelected = actualIndex === selectedIndex;
                const ActionIcon = action.icon || ArrowRight;
                const optionId = getOptionId(uniqueId, 'action', index);
                return (
                  <Box
                    as="button"
                    key={action.id}
                    id={optionId}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    data-selected={isSelected}
                    onClick={() => {
                      action.onSelect();
                      onClose();
                    }}
                    className={cn(
                      COMMAND_PALETTE_ITEM_BASE_CLASSES,
                      COMMAND_PALETTE_ITEM_SIZE_CLASSES[baseSize],
                      isSelected
                        ? COMMAND_PALETTE_ITEM_SELECTED_CLASSES
                        : COMMAND_PALETTE_ITEM_UNSELECTED_CLASSES
                    )}
                  >
                    <Icon
                      icon={ActionIcon}
                      size={COMMAND_PALETTE_ICON_SIZE_MAP[baseSize]}
                      className="text-[rgb(var(--muted-foreground))]"
                      aria-hidden={true}
                    />
                    <Text as="span" size="sm" className="flex-1">
                      {action.label}
                    </Text>
                    {action.shortcut && (
                      <Box
                        as="kbd"
                        className={COMMAND_PALETTE_KBD_CLASSES}
                        aria-label={`Keyboard shortcut: ${action.shortcut}`}
                      >
                        {action.shortcut}
                      </Box>
                    )}
                  </Box>
                );
              })}
            </Box>
          )}

          {/* Search results */}
          {showResults && (
            <Box role="group" aria-label={DEFAULT_RESULTS_LABEL}>
              <Box className={COMMAND_PALETTE_SECTION_HEADER_CLASSES}>
                <Search className="h-3 w-3" aria-hidden={true} />
                <Text as="span" size="xs" weight="medium">
                  Results
                </Text>
                <Text as="span" size="xs" color="muted-foreground" className="ml-auto">
                  {searchResults.length} found
                </Text>
              </Box>
              {searchResults.map((result, index) => {
                const ResultIcon = getItemIcon(result.resultType);
                const isSelected = index === selectedIndex;
                const optionId = getOptionId(uniqueId, 'result', index);
                return (
                  <Box
                    as="button"
                    key={result.id}
                    id={optionId}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    data-selected={isSelected}
                    onClick={() => {
                      onSelectResult?.(result);
                      onClose();
                    }}
                    className={cn(
                      COMMAND_PALETTE_ITEM_BASE_CLASSES,
                      COMMAND_PALETTE_ITEM_SIZE_CLASSES[baseSize],
                      isSelected
                        ? COMMAND_PALETTE_ITEM_SELECTED_CLASSES
                        : COMMAND_PALETTE_ITEM_UNSELECTED_CLASSES
                    )}
                  >
                    <Icon
                      icon={ResultIcon}
                      size={COMMAND_PALETTE_ICON_SIZE_MAP[baseSize]}
                      className="text-[rgb(var(--muted-foreground))]"
                      aria-hidden={true}
                    />
                    <Box className="flex-1 truncate">
                      <Text as="span" size="sm" weight="medium" truncate className="block">
                        {result.title}
                      </Text>
                      {result.subtitle && (
                        <Text
                          as="span"
                          size="xs"
                          color="muted-foreground"
                          truncate
                          className="block"
                        >
                          {result.subtitle}
                        </Text>
                      )}
                    </Box>
                    <Text as="span" size="xs" color="muted-foreground" className="shrink-0">
                      {getItemTypeLabel(result.resultType)}
                    </Text>
                  </Box>
                );
              })}
            </Box>
          )}

          {/* Empty state when no query and no recent items */}
          {!query && recentItems.length === 0 && actions.length === 0 && (
            <EmptyState
              icon={Command}
              title={DEFAULT_EMPTY_TITLE}
              description={DEFAULT_EMPTY_DESCRIPTION}
              size="md"
              data-testid={testId ? `${testId}-empty` : undefined}
            />
          )}
        </Box>

        {/* Footer with keyboard hints */}
        <Box className={COMMAND_PALETTE_FOOTER_CLASSES} aria-hidden={true}>
          <Box className="flex items-center gap-1">
            <Box as="kbd" className={COMMAND_PALETTE_KBD_CLASSES}>
              ↑
            </Box>
            <Box as="kbd" className={COMMAND_PALETTE_KBD_CLASSES}>
              ↓
            </Box>
            <Text as="span" size="xs" color="muted-foreground">
              to navigate
            </Text>
          </Box>
          <Box className="flex items-center gap-1">
            <Box as="kbd" className={COMMAND_PALETTE_KBD_CLASSES}>
              ↵
            </Box>
            <Text as="span" size="xs" color="muted-foreground">
              to select
            </Text>
          </Box>
          <Box className="flex items-center gap-1">
            <Box as="kbd" className={COMMAND_PALETTE_KBD_CLASSES}>
              Home
            </Box>
            <Box as="kbd" className={COMMAND_PALETTE_KBD_CLASSES}>
              End
            </Box>
            <Text as="span" size="xs" color="muted-foreground">
              to jump
            </Text>
          </Box>
        </Box>
      </Box>
    </Box>
  );
});

CommandPalette.displayName = 'CommandPalette';
