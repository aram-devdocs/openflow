import { cn } from '@openflow/utils';
import { Monitor, Moon, Sun } from 'lucide-react';

/** Available theme options */
export type Theme = 'light' | 'dark' | 'system';

export interface ThemeToggleProps {
  /** Current theme value */
  theme: Theme;
  /** Callback when theme changes */
  onThemeChange: (theme: Theme) => void;
  /** Additional CSS classes */
  className?: string;
}

const themeOptions: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
];

/**
 * ThemeToggle component for selecting between light, dark, and system themes.
 * Stateless - receives all data via props, emits actions via callbacks.
 *
 * Features:
 * - Three theme options (light, dark, system)
 * - ARIA radiogroup pattern for accessibility
 * - Keyboard navigation support
 * - Responsive labels (icons only on mobile, labels on larger screens)
 *
 * @example
 * const { theme, setTheme } = useTheme();
 * <ThemeToggle theme={theme} onThemeChange={setTheme} />
 */
export function ThemeToggle({ theme, onThemeChange, className }: ThemeToggleProps) {
  return (
    <div
      className={cn('flex gap-1 rounded-lg bg-[rgb(var(--surface-1))] p-1', className)}
      role="radiogroup"
      aria-label="Theme selection"
    >
      {themeOptions.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={theme === value}
          onClick={() => onThemeChange(value)}
          className={cn(
            'flex items-center gap-2 rounded-md px-3 py-2 text-sm motion-safe:transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--background))]',
            theme === value
              ? 'bg-[rgb(var(--background))] text-[rgb(var(--foreground))] shadow-sm'
              : 'text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))]'
          )}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only sm:not-sr-only">{label}</span>
        </button>
      ))}
    </div>
  );
}

ThemeToggle.displayName = 'ThemeToggle';
