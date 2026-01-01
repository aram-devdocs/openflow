import {
  Box,
  List,
  ListItem,
  type ResponsiveValue,
  Text,
  VisuallyHidden,
} from '@openflow/primitives';
import { cn } from '@openflow/utils';
import { Check, ChevronDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  type HTMLAttributes,
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import { Icon } from '../atoms/Icon';

// ============================================================================
// Types
// ============================================================================

export type DropdownSize = 'sm' | 'md' | 'lg';

export interface DropdownOption {
  /** Unique value for the option */
  value: string;
  /** Display label for the option */
  label: string;
  /** Optional icon to display before the label */
  icon?: LucideIcon;
  /** Whether the option is disabled */
  disabled?: boolean;
}

export interface DropdownProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'role'> {
  /** Array of options to display */
  options: DropdownOption[];
  /** Currently selected value */
  value?: string | undefined;
  /** Callback when selection changes */
  onChange?: (value: string) => void;
  /** Placeholder text when no value is selected */
  placeholder?: string;
  /** Whether the dropdown is disabled */
  disabled?: boolean;
  /** Error state styling */
  error?: boolean;
  /** Size of the dropdown trigger - responsive value supported */
  size?: ResponsiveValue<DropdownSize>;
  /** Accessible label for the dropdown */
  'aria-label'?: string;
  /** ID of element that describes the dropdown */
  'aria-describedby'?: string;
  /** Accessible label for when dropdown opens (default: "Options list opened") */
  openedLabel?: string;
  /** Accessible label for when dropdown closes (default: "Options list closed") */
  closedLabel?: string;
  /** Accessible label for empty state (default: "No options available") */
  emptyLabel?: string;
  /** Data attributes for testing */
  'data-testid'?: string;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Breakpoint order for responsive class generation
 */
const BREAKPOINT_ORDER = ['base', 'sm', 'md', 'lg', 'xl', '2xl'] as const;
type Breakpoint = (typeof BREAKPOINT_ORDER)[number];

/**
 * Default accessible labels
 */
export const DEFAULT_OPENED_LABEL = 'Options list opened';
export const DEFAULT_CLOSED_LABEL = 'Options list closed';
export const DEFAULT_EMPTY_LABEL = 'No options available';
export const DEFAULT_PLACEHOLDER = 'Select...';

/**
 * Size classes for dropdown trigger
 */
export const DROPDOWN_SIZE_CLASSES: Record<DropdownSize, string> = {
  sm: 'min-h-[36px] px-2 py-1 text-xs sm:min-h-[36px]',
  md: 'min-h-[44px] px-3 py-2 text-sm',
  lg: 'min-h-[48px] px-4 py-2.5 text-base',
};

/**
 * Base classes for dropdown trigger button
 */
export const DROPDOWN_TRIGGER_CLASSES = [
  // Layout
  'flex w-full items-center justify-between gap-2',
  'rounded-md border',
  // Motion
  'motion-safe:transition-colors motion-safe:duration-150',
  // Colors
  'border-[rgb(var(--border))] bg-[rgb(var(--background))]',
  'text-[rgb(var(--foreground))]',
].join(' ');

/**
 * Classes for dropdown trigger hover state
 */
export const DROPDOWN_TRIGGER_HOVER_CLASSES = 'hover:border-[rgb(var(--ring))]';

/**
 * Classes for dropdown trigger focus state
 */
export const DROPDOWN_TRIGGER_FOCUS_CLASSES = [
  'focus-visible:outline-none',
  'focus-visible:ring-2',
  'focus-visible:ring-[rgb(var(--ring))]',
  'focus-visible:ring-offset-2',
  'focus-visible:ring-offset-[rgb(var(--background))]',
].join(' ');

/**
 * Classes for dropdown trigger disabled state
 */
export const DROPDOWN_TRIGGER_DISABLED_CLASSES = 'cursor-not-allowed opacity-50';

/**
 * Classes for dropdown trigger error state
 */
export const DROPDOWN_TRIGGER_ERROR_CLASSES = 'border-[rgb(var(--destructive))]';

/**
 * Classes for dropdown trigger open state
 */
export const DROPDOWN_TRIGGER_OPEN_CLASSES = 'border-[rgb(var(--ring))]';

/**
 * Base classes for dropdown listbox
 */
export const DROPDOWN_LISTBOX_CLASSES = [
  'absolute z-50 mt-1 w-full overflow-auto scrollbar-thin',
  'rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--popover))]',
  'py-1 shadow-md',
  'max-h-60',
  'focus:outline-none',
].join(' ');

/**
 * Base classes for dropdown option
 */
export const DROPDOWN_OPTION_BASE_CLASSES = [
  // Touch target: min-height 44px for accessibility
  'flex cursor-pointer items-center gap-2 px-3 py-3 text-sm min-h-[44px]',
  'motion-safe:transition-colors motion-safe:duration-75',
].join(' ');

/**
 * Classes for highlighted option
 */
export const DROPDOWN_OPTION_HIGHLIGHTED_CLASSES =
  'bg-[rgb(var(--accent))] text-[rgb(var(--accent-foreground))]';

/**
 * Classes for selected option
 */
export const DROPDOWN_OPTION_SELECTED_CLASSES = 'font-medium';

/**
 * Classes for disabled option
 */
export const DROPDOWN_OPTION_DISABLED_CLASSES =
  'cursor-not-allowed text-[rgb(var(--muted-foreground))] opacity-50';

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate responsive size classes from DropdownSize value
 */
export function getResponsiveSizeClasses(size: ResponsiveValue<DropdownSize> | undefined): string {
  if (size === undefined) {
    return DROPDOWN_SIZE_CLASSES.md;
  }

  if (typeof size === 'string') {
    return DROPDOWN_SIZE_CLASSES[size];
  }

  if (typeof size === 'object' && size !== null) {
    const classes: string[] = [];
    for (const breakpoint of BREAKPOINT_ORDER) {
      const breakpointValue = (size as Partial<Record<Breakpoint, DropdownSize>>)[breakpoint];
      if (breakpointValue !== undefined) {
        const sizeClass = DROPDOWN_SIZE_CLASSES[breakpointValue];
        // Parse individual properties and apply breakpoint prefix
        const parts = sizeClass.split(' ');
        for (const part of parts) {
          // Skip sm: prefix parts (mobile-first handled separately)
          if (part.startsWith('sm:')) continue;

          if (breakpoint === 'base') {
            classes.push(part);
          } else {
            classes.push(`${breakpoint}:${part}`);
          }
        }
      }
    }
    return classes.join(' ');
  }

  return DROPDOWN_SIZE_CLASSES.md;
}

/**
 * Generate ID for an option element
 */
export function getOptionId(listboxId: string, value: string): string {
  return `${listboxId}-option-${value}`;
}

// ============================================================================
// Dropdown Component
// ============================================================================

/**
 * Dropdown component for selecting from a list of options.
 * Stateless - receives all data via props, emits actions via callbacks.
 *
 * Accessibility features:
 * - role="combobox" on trigger with proper ARIA attributes
 * - role="listbox" on options list, role="option" on options
 * - aria-activedescendant for highlighted option tracking
 * - Arrow key navigation (Up/Down to navigate, Home/End to jump)
 * - Enter/Space to select, Escape to close
 * - Tab closes dropdown and moves focus
 * - Screen reader announcements for open/close state
 * - Touch target ≥44px for mobile accessibility (WCAG 2.5.5)
 * - Focus ring visible on all backgrounds with ring-offset
 *
 * @example
 * <Dropdown
 *   options={[
 *     { value: 'option1', label: 'Option 1' },
 *     { value: 'option2', label: 'Option 2' },
 *   ]}
 *   value={selectedValue}
 *   onChange={setSelectedValue}
 *   placeholder="Select an option"
 * />
 *
 * @example
 * // Responsive size
 * <Dropdown
 *   options={options}
 *   value={value}
 *   onChange={setValue}
 *   size={{ base: 'md', lg: 'lg' }}
 * />
 *
 * @example
 * // With icons
 * <Dropdown
 *   options={[
 *     { value: 'search', label: 'Search', icon: SearchIcon },
 *     { value: 'filter', label: 'Filter', icon: FilterIcon },
 *   ]}
 *   value="search"
 *   onChange={handleChange}
 * />
 */
export const Dropdown = forwardRef<HTMLDivElement, DropdownProps>(function Dropdown(
  {
    options,
    value,
    onChange,
    placeholder = DEFAULT_PLACEHOLDER,
    disabled = false,
    error = false,
    size = 'md',
    className,
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedBy,
    openedLabel = DEFAULT_OPENED_LABEL,
    closedLabel = DEFAULT_CLOSED_LABEL,
    emptyLabel = DEFAULT_EMPTY_LABEL,
    'data-testid': dataTestId,
    ...props
  },
  ref
) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [announcement, setAnnouncement] = useState<string>('');
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const id = useId();
  const listboxId = `${id}-listbox`;

  // Find the selected option
  const selectedOption = options.find((opt) => opt.value === value);

  // Get enabled options for keyboard navigation
  const enabledOptions = options.filter((opt) => !opt.disabled);

  // Get the highlighted option for aria-activedescendant
  const highlightedOption = highlightedIndex >= 0 ? enabledOptions[highlightedIndex] : undefined;
  const activeDescendantId = highlightedOption
    ? getOptionId(listboxId, highlightedOption.value)
    : undefined;

  const openDropdown = useCallback(() => {
    if (disabled) return;
    setIsOpen(true);
    // Highlight current selection or first enabled option
    const currentIndex = enabledOptions.findIndex((opt) => opt.value === value);
    setHighlightedIndex(currentIndex >= 0 ? currentIndex : 0);
    setAnnouncement(openedLabel);
  }, [disabled, enabledOptions, value, openedLabel]);

  const closeDropdown = useCallback(() => {
    setIsOpen(false);
    setHighlightedIndex(-1);
    setAnnouncement(closedLabel);
  }, [closedLabel]);

  const selectOption = useCallback(
    (optionValue: string) => {
      const option = options.find((opt) => opt.value === optionValue);
      onChange?.(optionValue);
      closeDropdown();
      triggerRef.current?.focus();
      // Announce selection
      if (option) {
        setAnnouncement(`${option.label} selected`);
      }
    },
    [onChange, closeDropdown, options]
  );

  // Handle click outside to close
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        listRef.current &&
        !listRef.current.contains(target)
      ) {
        closeDropdown();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, closeDropdown]);

  // Scroll highlighted option into view
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && listRef.current && highlightedOption) {
      const highlightedElement = listRef.current.querySelector(
        `#${getOptionId(listboxId, highlightedOption.value)}`
      );
      highlightedElement?.scrollIntoView({ block: 'nearest' });
    }
  }, [isOpen, highlightedIndex, highlightedOption, listboxId]);

  // Clear announcement after it's read
  useEffect(() => {
    if (announcement) {
      const timer = setTimeout(() => setAnnouncement(''), 1000);
      return () => clearTimeout(timer);
    }
  }, [announcement]);

  const handleTriggerKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'Enter':
      case ' ':
      case 'ArrowDown':
        event.preventDefault();
        openDropdown();
        break;
      case 'ArrowUp':
        event.preventDefault();
        openDropdown();
        break;
      case 'Escape':
        event.preventDefault();
        closeDropdown();
        break;
    }
  };

  const handleListKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setHighlightedIndex((prev) => (prev < enabledOptions.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : enabledOptions.length - 1));
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (highlightedIndex >= 0 && enabledOptions[highlightedIndex]) {
          selectOption(enabledOptions[highlightedIndex].value);
        }
        break;
      case 'Escape':
        event.preventDefault();
        closeDropdown();
        triggerRef.current?.focus();
        break;
      case 'Tab':
        closeDropdown();
        break;
      case 'Home':
        event.preventDefault();
        setHighlightedIndex(0);
        break;
      case 'End':
        event.preventDefault();
        setHighlightedIndex(enabledOptions.length - 1);
        break;
    }
  };

  const sizeClasses = getResponsiveSizeClasses(size);

  return (
    <Box ref={ref} className="relative" data-testid={dataTestId} {...props}>
      {/* Screen reader announcements */}
      <VisuallyHidden>
        <Text as="span" role="status" aria-live="polite" aria-atomic="true">
          {announcement}
        </Text>
      </VisuallyHidden>

      {/* Trigger button */}
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        aria-activedescendant={isOpen ? activeDescendantId : undefined}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        disabled={disabled}
        onClick={() => (isOpen ? closeDropdown() : openDropdown())}
        onKeyDown={handleTriggerKeyDown}
        data-testid={dataTestId ? `${dataTestId}-trigger` : undefined}
        data-state={isOpen ? 'open' : 'closed'}
        className={cn(
          // Base styles
          DROPDOWN_TRIGGER_CLASSES,
          // Size
          sizeClasses,
          // Hover (only when not disabled)
          !disabled && DROPDOWN_TRIGGER_HOVER_CLASSES,
          // Focus
          DROPDOWN_TRIGGER_FOCUS_CLASSES,
          // Disabled
          disabled && DROPDOWN_TRIGGER_DISABLED_CLASSES,
          // Error
          error && DROPDOWN_TRIGGER_ERROR_CLASSES,
          // Open state
          isOpen && DROPDOWN_TRIGGER_OPEN_CLASSES,
          className
        )}
      >
        <Text
          as="span"
          className={cn(
            'flex items-center gap-2 truncate',
            !selectedOption && 'text-[rgb(var(--muted-foreground))]'
          )}
        >
          {selectedOption?.icon && <Icon icon={selectedOption.icon} size="sm" />}
          {selectedOption?.label ?? placeholder}
        </Text>
        <Icon
          icon={ChevronDown}
          size="sm"
          className={cn(
            'shrink-0 text-[rgb(var(--muted-foreground))] motion-safe:transition-transform motion-safe:duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* Options list */}
      {isOpen && (
        <List
          ref={listRef}
          id={listboxId}
          role="listbox"
          tabIndex={-1}
          aria-label={ariaLabel}
          onKeyDown={handleListKeyDown}
          data-testid={dataTestId ? `${dataTestId}-listbox` : undefined}
          className={DROPDOWN_LISTBOX_CLASSES}
        >
          {options.length === 0 ? (
            <ListItem
              className="px-3 py-2 text-sm text-[rgb(var(--muted-foreground))]"
              role="presentation"
            >
              {emptyLabel}
            </ListItem>
          ) : (
            options.map((option) => {
              const isSelected = option.value === value;
              const enabledIndex = enabledOptions.findIndex((opt) => opt.value === option.value);
              const isHighlighted = enabledIndex === highlightedIndex;
              const optionId = getOptionId(listboxId, option.value);

              return (
                // biome-ignore lint/a11y/useSemanticElements: Standard accessible option pattern
                // biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: Required for accessible listbox
                // biome-ignore lint/a11y/useFocusableInteractive: Focus managed by parent listbox via aria-activedescendant
                // biome-ignore lint/a11y/useKeyWithClickEvents: Keyboard handled by parent listbox
                <ListItem
                  key={option.value}
                  id={optionId}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={option.disabled}
                  data-testid={dataTestId ? `${dataTestId}-option-${option.value}` : undefined}
                  data-value={option.value}
                  data-highlighted={isHighlighted ? 'true' : undefined}
                  onClick={() => {
                    if (!option.disabled) {
                      selectOption(option.value);
                    }
                  }}
                  onMouseEnter={() => {
                    if (!option.disabled) {
                      setHighlightedIndex(enabledIndex);
                    }
                  }}
                  className={cn(
                    DROPDOWN_OPTION_BASE_CLASSES,
                    // Highlighted state
                    isHighlighted && !option.disabled && DROPDOWN_OPTION_HIGHLIGHTED_CLASSES,
                    // Selected state
                    isSelected && DROPDOWN_OPTION_SELECTED_CLASSES,
                    // Disabled state
                    option.disabled && DROPDOWN_OPTION_DISABLED_CLASSES
                  )}
                >
                  {option.icon && <Icon icon={option.icon} size="sm" />}
                  <Text as="span" className="flex-1 truncate">
                    {option.label}
                  </Text>
                  {isSelected && (
                    <Icon icon={Check} size="sm" className="text-[rgb(var(--primary))]" />
                  )}
                </ListItem>
              );
            })
          )}
        </List>
      )}
    </Box>
  );
});

Dropdown.displayName = 'Dropdown';
