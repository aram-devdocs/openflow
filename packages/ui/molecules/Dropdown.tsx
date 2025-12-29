import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@openflow/utils';
import { Icon } from '../atoms/Icon';
import type { LucideIcon } from 'lucide-react';

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

export interface DropdownProps {
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
  /** Additional class name for the trigger button */
  className?: string;
  /** Accessible label for the dropdown */
  'aria-label'?: string;
}

/**
 * Dropdown component for selecting from a list of options.
 * Stateless - receives all data via props, emits actions via callbacks.
 *
 * Features keyboard navigation with Arrow keys, Enter, Escape, and Tab.
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
 * <Dropdown
 *   options={[
 *     { value: 'search', label: 'Search', icon: SearchIcon },
 *     { value: 'filter', label: 'Filter', icon: FilterIcon },
 *   ]}
 *   value="search"
 *   onChange={handleChange}
 * />
 */
export function Dropdown({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  disabled = false,
  error = false,
  className,
  'aria-label': ariaLabel,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const id = useId();
  const listboxId = `${id}-listbox`;

  // Find the selected option
  const selectedOption = options.find((opt) => opt.value === value);

  // Get enabled options for keyboard navigation
  const enabledOptions = options.filter((opt) => !opt.disabled);

  const openDropdown = useCallback(() => {
    if (disabled) return;
    setIsOpen(true);
    // Highlight current selection or first enabled option
    const currentIndex = enabledOptions.findIndex((opt) => opt.value === value);
    setHighlightedIndex(currentIndex >= 0 ? currentIndex : 0);
  }, [disabled, enabledOptions, value]);

  const closeDropdown = useCallback(() => {
    setIsOpen(false);
    setHighlightedIndex(-1);
  }, []);

  const selectOption = useCallback(
    (optionValue: string) => {
      onChange?.(optionValue);
      closeDropdown();
      triggerRef.current?.focus();
    },
    [onChange, closeDropdown]
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
    if (isOpen && highlightedIndex >= 0 && listRef.current) {
      const highlightedElement = listRef.current.querySelector(
        `[data-index="${highlightedIndex}"]`
      );
      highlightedElement?.scrollIntoView({ block: 'nearest' });
    }
  }, [isOpen, highlightedIndex]);

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
        setHighlightedIndex((prev) =>
          prev < enabledOptions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        event.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : enabledOptions.length - 1
        );
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

  return (
    <div className="relative">
      {/* Trigger button */}
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => (isOpen ? closeDropdown() : openDropdown())}
        onKeyDown={handleTriggerKeyDown}
        className={cn(
          // Base styles
          'flex w-full items-center justify-between gap-2',
          'rounded-md border px-3 py-2 text-sm',
          'transition-colors duration-150',
          // Default styles
          'border-[rgb(var(--border))] bg-[rgb(var(--background))]',
          'text-[rgb(var(--foreground))]',
          // Hover
          !disabled && 'hover:border-[rgb(var(--ring))]',
          // Focus
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--background))]',
          // Disabled
          disabled && 'cursor-not-allowed opacity-50',
          // Error
          error && 'border-[rgb(var(--destructive))]',
          // Open state
          isOpen && 'border-[rgb(var(--ring))]',
          className
        )}
      >
        <span
          className={cn(
            'flex items-center gap-2 truncate',
            !selectedOption && 'text-[rgb(var(--muted-foreground))]'
          )}
        >
          {selectedOption?.icon && (
            <Icon icon={selectedOption.icon} size="sm" />
          )}
          {selectedOption?.label ?? placeholder}
        </span>
        <Icon
          icon={ChevronDown}
          size="sm"
          className={cn(
            'shrink-0 text-[rgb(var(--muted-foreground))] transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* Options list */}
      {isOpen && (
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          tabIndex={-1}
          onKeyDown={handleListKeyDown}
          className={cn(
            'absolute z-50 mt-1 w-full overflow-auto',
            'rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--popover))]',
            'py-1 shadow-md',
            'max-h-60',
            'focus:outline-none'
          )}
        >
          {options.length === 0 ? (
            <li className="px-3 py-2 text-sm text-[rgb(var(--muted-foreground))]">
              No options available
            </li>
          ) : (
            options.map((option) => {
              const isSelected = option.value === value;
              const enabledIndex = enabledOptions.findIndex(
                (opt) => opt.value === option.value
              );
              const isHighlighted = enabledIndex === highlightedIndex;

              return (
                <li
                  key={option.value}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={option.disabled}
                  data-index={enabledIndex}
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
                    'flex cursor-pointer items-center gap-2 px-3 py-2 text-sm',
                    'transition-colors duration-75',
                    // Highlighted state
                    isHighlighted &&
                      !option.disabled &&
                      'bg-[rgb(var(--accent))] text-[rgb(var(--accent-foreground))]',
                    // Selected state
                    isSelected && 'font-medium',
                    // Disabled state
                    option.disabled &&
                      'cursor-not-allowed text-[rgb(var(--muted-foreground))] opacity-50'
                  )}
                >
                  {option.icon && <Icon icon={option.icon} size="sm" />}
                  <span className="flex-1 truncate">{option.label}</span>
                  {isSelected && (
                    <Icon
                      icon={Check}
                      size="sm"
                      className="text-[rgb(var(--primary))]"
                    />
                  )}
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}

Dropdown.displayName = 'Dropdown';
