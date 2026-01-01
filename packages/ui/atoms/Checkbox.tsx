import {
  BREAKPOINT_ORDER,
  Box,
  type ResponsiveValue,
  Text,
  VisuallyHidden,
} from '@openflow/primitives';
import { cn } from '@openflow/utils';
import { Check, Minus } from 'lucide-react';
import { type InputHTMLAttributes, forwardRef, useEffect, useId, useRef, useState } from 'react';

import type { Breakpoint } from '@openflow/primitives/types';

export type CheckboxSize = 'sm' | 'md' | 'lg';

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  /** Whether the checkbox is checked */
  checked?: boolean;
  /** Indeterminate state (partially checked) */
  indeterminate?: boolean;
  /** Size of the checkbox - supports responsive values */
  size?: ResponsiveValue<CheckboxSize>;
  /** Error state for form validation */
  error?: boolean;
  /** Callback when checked state changes (alternative to onChange) */
  onCheckedChange?: (checked: boolean) => void;
  /** Message announced to screen readers when state changes (default: automatic) */
  'aria-describedby'?: string;
  /** Data test id for testing */
  'data-testid'?: string;
}

/**
 * Size to Tailwind classes mapping.
 * Touch targets: 44px minimum on touch devices for WCAG 2.5.5 compliance.
 */
const sizeClasses: Record<CheckboxSize, { wrapper: string; checkbox: string; icon: string }> = {
  sm: {
    wrapper: 'min-h-[44px] min-w-[44px] sm:min-h-5 sm:min-w-5',
    checkbox: 'h-3.5 w-3.5',
    icon: 'h-3.5 w-3.5 stroke-[3]',
  },
  md: {
    wrapper: 'min-h-[44px] min-w-[44px] sm:min-h-6 sm:min-w-6',
    checkbox: 'h-4 w-4',
    icon: 'h-4 w-4 stroke-[3]',
  },
  lg: {
    wrapper: 'min-h-[44px] min-w-[44px]',
    checkbox: 'h-5 w-5',
    icon: 'h-5 w-5 stroke-[2.5]',
  },
};

/**
 * Get size classes for the given size prop.
 * Uses BREAKPOINT_ORDER from @openflow/primitives.
 */
function getSizeClasses(size: ResponsiveValue<CheckboxSize>): {
  wrapper: string[];
  checkbox: string[];
  icon: string[];
} {
  const wrapper: string[] = [];
  const checkbox: string[] = [];
  const icon: string[] = [];

  if (typeof size === 'string') {
    const classes = sizeClasses[size];
    wrapper.push(classes.wrapper);
    checkbox.push(classes.checkbox);
    icon.push(classes.icon);
  } else if (typeof size === 'object' && size !== null) {
    for (const breakpoint of BREAKPOINT_ORDER) {
      const breakpointValue = (size as Partial<Record<Breakpoint, CheckboxSize>>)[breakpoint];
      if (breakpointValue !== undefined) {
        const classes = sizeClasses[breakpointValue];
        if (breakpoint === 'base') {
          wrapper.push(...classes.wrapper.split(' '));
          checkbox.push(...classes.checkbox.split(' '));
          icon.push(...classes.icon.split(' '));
        } else {
          wrapper.push(...classes.wrapper.split(' ').map((c) => `${breakpoint}:${c}`));
          checkbox.push(...classes.checkbox.split(' ').map((c) => `${breakpoint}:${c}`));
          icon.push(...classes.icon.split(' ').map((c) => `${breakpoint}:${c}`));
        }
      }
    }
  }

  return { wrapper, checkbox, icon };
}

/**
 * Checkbox component with accessibility, responsive sizing, and custom styling.
 *
 * Built on @openflow/primitives for accessibility and responsiveness:
 * - Uses VisuallyHidden for screen reader state announcements
 * - Touch target meets WCAG 2.5.5 (≥44px on touch devices)
 * - Focus ring visible on all backgrounds
 * - Indeterminate state support
 * - Error state styling for form validation
 *
 * Accessibility:
 * - Native `<input type="checkbox">` for full keyboard support
 * - Focus ring uses ring-offset for visibility on all backgrounds
 * - Indeterminate state properly conveyed via DOM property
 * - Error state uses `aria-invalid` for screen readers
 * - Screen reader announces state changes
 *
 * For proper label association, use with a `<label>` element or `aria-label`:
 *
 * @example
 * // With label element (recommended for forms)
 * <label className="flex items-center gap-2">
 *   <Checkbox checked={isChecked} onChange={handleChange} />
 *   <span>I agree to the terms</span>
 * </label>
 *
 * @example
 * // With aria-label (for icon-only checkboxes)
 * <Checkbox checked={isChecked} aria-label="Select item" />
 *
 * @example
 * // With htmlFor association
 * <Checkbox id="terms" checked={isChecked} onChange={handleChange} />
 * <label htmlFor="terms">I agree to the terms</label>
 *
 * @example
 * // Indeterminate state (for "select all" pattern)
 * <Checkbox indeterminate aria-label="Select all items" />
 *
 * @example
 * // With error state
 * <Checkbox error aria-describedby="error-message" />
 * <span id="error-message">This field is required</span>
 *
 * @example
 * // Responsive sizing
 * <Checkbox size={{ base: 'md', lg: 'lg' }} />
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  {
    className,
    checked,
    indeterminate,
    disabled,
    size = 'md',
    error = false,
    onCheckedChange,
    onChange,
    'data-testid': dataTestId,
    'aria-describedby': ariaDescribedBy,
    ...props
  },
  ref
) {
  // Generate unique ID for screen reader announcement
  const uniqueId = useId();
  const announcementId = `checkbox-state-${uniqueId}`;

  // Track previous state to only announce on changes
  const prevStateRef = useRef<{ checked?: boolean; indeterminate?: boolean } | null>(null);
  const [announcement, setAnnouncement] = useState('');

  // Get responsive size classes
  const {
    wrapper: wrapperClasses,
    checkbox: checkboxClasses,
    icon: iconClasses,
  } = getSizeClasses(size);

  // Only announce when state actually changes (not on every render)
  useEffect(() => {
    const prevState = prevStateRef.current;

    // Skip initial render (no previous state)
    if (prevState === null) {
      prevStateRef.current = { checked, indeterminate };
      return;
    }

    // Check if state actually changed
    if (prevState.checked !== checked || prevState.indeterminate !== indeterminate) {
      // Determine current state for screen reader announcement
      const stateAnnouncement = indeterminate
        ? 'Partially checked'
        : checked
          ? 'Checked'
          : 'Not checked';

      setAnnouncement(stateAnnouncement);

      // Clear announcement after a short delay to allow re-announcing if state changes again
      const timer = setTimeout(() => setAnnouncement(''), 100);
      prevStateRef.current = { checked, indeterminate };

      return () => clearTimeout(timer);
    }
  }, [checked, indeterminate]);

  return (
    // Touch target wrapper: 44x44px minimum for accessibility (WCAG 2.5.5)
    <Box
      as="span"
      className={cn(
        'relative inline-flex items-center justify-center',
        ...wrapperClasses,
        className
      )}
      data-testid={dataTestId}
    >
      {/* Screen reader state announcement - only announces on state changes */}
      <VisuallyHidden>
        <Text as="span" id={announcementId} aria-live="polite" aria-atomic="true">
          {announcement}
        </Text>
      </VisuallyHidden>

      <Box as="span" className="relative inline-flex items-center">
        <input
          type="checkbox"
          ref={(element) => {
            // Handle both the forwarded ref and indeterminate state
            if (typeof ref === 'function') {
              ref(element);
            } else if (ref) {
              ref.current = element;
            }
            if (element) {
              element.indeterminate = indeterminate ?? false;
            }
          }}
          checked={checked}
          disabled={disabled}
          aria-invalid={error || undefined}
          aria-describedby={ariaDescribedBy}
          onChange={(e) => {
            onChange?.(e);
            onCheckedChange?.(e.target.checked);
          }}
          className={cn(
            'peer shrink-0 cursor-pointer appearance-none rounded',
            'border',
            error ? 'border-[rgb(var(--destructive))]' : 'border-[rgb(var(--input))]',
            'bg-[rgb(var(--background))]',
            'motion-safe:transition-colors motion-safe:duration-150',
            // Focus state with ring-offset for visibility on all backgrounds
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--background))]',
            // Checked state
            error
              ? 'checked:border-[rgb(var(--destructive))] checked:bg-[rgb(var(--destructive))]'
              : 'checked:border-[rgb(var(--primary))] checked:bg-[rgb(var(--primary))]',
            // Indeterminate state
            error
              ? 'indeterminate:border-[rgb(var(--destructive))] indeterminate:bg-[rgb(var(--destructive))]'
              : 'indeterminate:border-[rgb(var(--primary))] indeterminate:bg-[rgb(var(--primary))]',
            // Disabled state
            disabled && 'cursor-not-allowed opacity-50',
            // Size classes
            ...checkboxClasses
          )}
          {...props}
        />
        {/* Custom check icon overlay */}
        <Check
          className={cn(
            'pointer-events-none absolute left-0',
            'text-[rgb(var(--primary-foreground))]',
            'opacity-0 motion-safe:transition-opacity motion-safe:duration-150',
            'peer-checked:opacity-100',
            'peer-indeterminate:hidden',
            ...iconClasses
          )}
          aria-hidden={true}
        />
        {/* Indeterminate dash overlay using Minus icon for consistency */}
        <Minus
          className={cn(
            'pointer-events-none absolute left-0',
            'text-[rgb(var(--primary-foreground))]',
            'opacity-0 motion-safe:transition-opacity motion-safe:duration-150',
            'peer-indeterminate:opacity-100',
            'peer-checked:hidden',
            ...iconClasses
          )}
          aria-hidden={true}
        />
      </Box>
    </Box>
  );
});

Checkbox.displayName = 'Checkbox';
