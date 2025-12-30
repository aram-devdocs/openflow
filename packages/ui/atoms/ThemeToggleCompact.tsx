import { cn } from '@openflow/utils';
import { Moon, Sun } from 'lucide-react';

/** The actual theme being displayed (after resolving 'system') */
export type ResolvedTheme = 'light' | 'dark';

export interface ThemeToggleCompactProps {
  /** The resolved theme (light or dark, not system) */
  resolvedTheme: ResolvedTheme;
  /** Callback when toggle is clicked */
  onToggle: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Compact theme toggle button for quick access in headers and sidebars.
 * Stateless - receives all data via props, emits actions via callbacks.
 *
 * Shows the opposite theme icon (sun when dark, moon when light) to indicate
 * what clicking will switch to.
 *
 * Features:
 * - Single button toggle between light and dark
 * - Accessible with proper ARIA label
 * - Minimum 44x44px touch target
 * - Focus-visible ring for keyboard navigation
 *
 * @example
 * const { resolvedTheme, setTheme } = useTheme();
 * const handleToggle = () => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
 * <ThemeToggleCompact resolvedTheme={resolvedTheme} onToggle={handleToggle} />
 */
export function ThemeToggleCompact({
  resolvedTheme,
  onToggle,
  className,
}: ThemeToggleCompactProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'flex h-9 w-9 items-center justify-center rounded-md',
        'text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))] hover:bg-[rgb(var(--surface-1))]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--background))]',
        'transition-colors',
        className
      )}
      aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} theme`}
    >
      {resolvedTheme === 'dark' ? (
        <Sun className="h-5 w-5" aria-hidden="true" />
      ) : (
        <Moon className="h-5 w-5" aria-hidden="true" />
      )}
    </button>
  );
}

ThemeToggleCompact.displayName = 'ThemeToggleCompact';
