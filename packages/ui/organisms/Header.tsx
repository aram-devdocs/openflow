import { cn } from '@openflow/utils';
import { MessageSquarePlus, Search, TerminalSquare } from 'lucide-react';
import { Button } from '../atoms/Button';
import { Icon } from '../atoms/Icon';
import { ThemeToggleCompact } from '../atoms/ThemeToggleCompact';
import type { ResolvedTheme } from '../atoms/ThemeToggleCompact';

export interface HeaderProps {
  /** Callback when the search button is clicked (opens CommandPalette) */
  onSearch?: () => void;
  /** Callback when the new chat button is clicked */
  onNewChat?: () => void;
  /** Callback when the new terminal button is clicked */
  onNewTerminal?: () => void;
  /** Optional title to display in the header */
  title?: string;
  /** Optional subtitle to display below the title */
  subtitle?: string;
  /** Whether the search feature is available */
  searchEnabled?: boolean;
  /** Whether the new chat feature is available */
  newChatEnabled?: boolean;
  /** Whether the new terminal feature is available */
  newTerminalEnabled?: boolean;
  /** Current resolved theme for theme toggle */
  resolvedTheme?: ResolvedTheme;
  /** Callback when theme toggle is clicked */
  onThemeToggle?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Header component for top navigation.
 * Stateless - receives all data via props, emits actions via callbacks.
 *
 * Features:
 * - Search button that opens the CommandPalette (Cmd+K)
 * - New chat button for quick chat creation
 * - New terminal button for opening a terminal session
 * - Optional title and subtitle display
 * - Quick theme toggle
 *
 * @example
 * <Header
 *   title="My Project"
 *   subtitle="3 tasks in progress"
 *   onSearch={() => setCommandPaletteOpen(true)}
 *   onNewChat={() => createNewChat()}
 *   onNewTerminal={() => openTerminal()}
 *   resolvedTheme="dark"
 *   onThemeToggle={() => toggleTheme()}
 * />
 */
export function Header({
  onSearch,
  onNewChat,
  onNewTerminal,
  title,
  subtitle,
  searchEnabled = true,
  newChatEnabled = true,
  newTerminalEnabled = true,
  resolvedTheme,
  onThemeToggle,
  className,
}: HeaderProps) {
  return (
    <header
      aria-label="Application header"
      className={cn(
        'flex h-14 items-center justify-between border-b border-[rgb(var(--border))] bg-[rgb(var(--background))] px-4',
        className
      )}
    >
      {/* Left section: Title and subtitle */}
      <div className="flex flex-col justify-center">
        {title && <h1 className="text-sm font-semibold text-[rgb(var(--foreground))]">{title}</h1>}
        {subtitle && <p className="text-xs text-[rgb(var(--muted-foreground))]">{subtitle}</p>}
        {!title && !subtitle && (
          <span className="text-sm font-medium text-[rgb(var(--foreground))]">OpenFlow</span>
        )}
      </div>

      {/* Right section: Action buttons */}
      <div className="flex items-center gap-2">
        {/* Search button */}
        {searchEnabled && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onSearch}
            className="gap-2"
            aria-label="Search (Cmd+K)"
          >
            <Icon icon={Search} size="sm" />
            <span className="hidden sm:inline">Search</span>
            <kbd className="pointer-events-none hidden select-none items-center gap-1 rounded border border-[rgb(var(--border))] bg-[rgb(var(--muted))] px-1.5 py-0.5 text-[10px] font-medium text-[rgb(var(--muted-foreground))] sm:flex">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>
        )}

        {/* New chat button */}
        {newChatEnabled && (
          <Button variant="ghost" size="sm" onClick={onNewChat} aria-label="New Chat">
            <Icon icon={MessageSquarePlus} size="sm" />
            <span className="hidden sm:inline">New Chat</span>
          </Button>
        )}

        {/* New terminal button */}
        {newTerminalEnabled && (
          <Button variant="ghost" size="sm" onClick={onNewTerminal} aria-label="New Terminal">
            <Icon icon={TerminalSquare} size="sm" />
            <span className="hidden sm:inline">Terminal</span>
          </Button>
        )}

        {/* Theme toggle */}
        {resolvedTheme && onThemeToggle && (
          <ThemeToggleCompact resolvedTheme={resolvedTheme} onToggle={onThemeToggle} />
        )}
      </div>
    </header>
  );
}

Header.displayName = 'Header';
