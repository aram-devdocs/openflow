/**
 * Unit tests for FormField molecule
 *
 * Tests cover:
 * - Spacing classes generation
 * - Responsive spacing
 * - Base spacing extraction
 * - Constants validation
 * - Component behavior documentation
 */

import { describe, expect, it } from 'vitest';
import {
  ERROR_TEXT_CLASSES,
  FORM_FIELD_BASE_CLASSES,
  FORM_FIELD_SPACING_CLASSES,
  type FormFieldSpacing,
  HELPER_TEXT_CLASSES,
  getBaseSpacing,
  getResponsiveSpacingClasses,
} from '../../../packages/ui/molecules/FormField';

// =============================================================================
// Constants Tests
// =============================================================================

describe('FORM_FIELD_BASE_CLASSES', () => {
  it('includes flex container class', () => {
    expect(FORM_FIELD_BASE_CLASSES).toContain('flex');
  });

  it('includes flex-col for vertical layout', () => {
    expect(FORM_FIELD_BASE_CLASSES).toContain('flex-col');
  });

  it('has exactly 2 base classes', () => {
    expect(FORM_FIELD_BASE_CLASSES).toHaveLength(2);
  });
});

describe('FORM_FIELD_SPACING_CLASSES', () => {
  it('defines sm spacing', () => {
    expect(FORM_FIELD_SPACING_CLASSES.sm).toBe('gap-1');
  });

  it('defines md spacing', () => {
    expect(FORM_FIELD_SPACING_CLASSES.md).toBe('gap-1.5');
  });

  it('defines lg spacing', () => {
    expect(FORM_FIELD_SPACING_CLASSES.lg).toBe('gap-2');
  });

  it('has all 3 spacing sizes', () => {
    expect(Object.keys(FORM_FIELD_SPACING_CLASSES)).toHaveLength(3);
  });

  it('spacing values increase progressively', () => {
    // gap-1 (0.25rem) < gap-1.5 (0.375rem) < gap-2 (0.5rem)
    const smValue = Number.parseFloat(FORM_FIELD_SPACING_CLASSES.sm.replace('gap-', ''));
    const mdValue = Number.parseFloat(FORM_FIELD_SPACING_CLASSES.md.replace('gap-', ''));
    const lgValue = Number.parseFloat(FORM_FIELD_SPACING_CLASSES.lg.replace('gap-', ''));

    expect(smValue).toBeLessThan(mdValue);
    expect(mdValue).toBeLessThan(lgValue);
  });
});

describe('HELPER_TEXT_CLASSES', () => {
  it('includes text-xs for small size', () => {
    expect(HELPER_TEXT_CLASSES).toContain('text-xs');
  });

  it('includes muted foreground color', () => {
    expect(HELPER_TEXT_CLASSES).toContain('text-[rgb(var(--muted-foreground))]');
  });

  it('has exactly 2 classes', () => {
    expect(HELPER_TEXT_CLASSES).toHaveLength(2);
  });
});

describe('ERROR_TEXT_CLASSES', () => {
  it('includes text-xs for small size', () => {
    expect(ERROR_TEXT_CLASSES).toContain('text-xs');
  });

  it('includes destructive color', () => {
    expect(ERROR_TEXT_CLASSES).toContain('text-[rgb(var(--destructive))]');
  });

  it('has exactly 2 classes', () => {
    expect(ERROR_TEXT_CLASSES).toHaveLength(2);
  });
});

// =============================================================================
// getBaseSpacing Tests
// =============================================================================

describe('getBaseSpacing', () => {
  describe('string values', () => {
    it('returns sm when passed "sm"', () => {
      expect(getBaseSpacing('sm')).toBe('sm');
    });

    it('returns md when passed "md"', () => {
      expect(getBaseSpacing('md')).toBe('md');
    });

    it('returns lg when passed "lg"', () => {
      expect(getBaseSpacing('lg')).toBe('lg');
    });
  });

  describe('responsive objects', () => {
    it('returns base value from responsive object', () => {
      expect(getBaseSpacing({ base: 'md', lg: 'lg' })).toBe('md');
    });

    it('returns sm as default when base is not specified', () => {
      expect(getBaseSpacing({ md: 'md', lg: 'lg' })).toBe('sm');
    });

    it('handles empty object', () => {
      expect(getBaseSpacing({} as Record<string, FormFieldSpacing>)).toBe('sm');
    });
  });

  describe('edge cases', () => {
    it('handles null value by returning default', () => {
      expect(getBaseSpacing(null as unknown as FormFieldSpacing)).toBe('sm');
    });

    it('handles undefined value by returning default', () => {
      expect(getBaseSpacing(undefined as unknown as FormFieldSpacing)).toBe('sm');
    });
  });
});

// =============================================================================
// getResponsiveSpacingClasses Tests
// =============================================================================

describe('getResponsiveSpacingClasses', () => {
  describe('string values', () => {
    it('returns sm gap class for "sm"', () => {
      const classes = getResponsiveSpacingClasses('sm');
      expect(classes).toContain('gap-1');
    });

    it('returns md gap class for "md"', () => {
      const classes = getResponsiveSpacingClasses('md');
      expect(classes).toContain('gap-1.5');
    });

    it('returns lg gap class for "lg"', () => {
      const classes = getResponsiveSpacingClasses('lg');
      expect(classes).toContain('gap-2');
    });
  });

  describe('responsive objects', () => {
    it('generates base class without prefix', () => {
      const classes = getResponsiveSpacingClasses({ base: 'sm' });
      expect(classes).toContain('gap-1');
      expect(classes.some((c) => c.startsWith('base:'))).toBe(false);
    });

    it('generates prefixed class for md breakpoint', () => {
      const classes = getResponsiveSpacingClasses({ base: 'sm', md: 'lg' });
      expect(classes).toContain('gap-1');
      expect(classes).toContain('md:gap-2');
    });

    it('generates prefixed class for lg breakpoint', () => {
      const classes = getResponsiveSpacingClasses({ lg: 'lg' });
      expect(classes).toContain('lg:gap-2');
    });

    it('handles multiple breakpoints', () => {
      const classes = getResponsiveSpacingClasses({
        base: 'sm',
        sm: 'sm',
        md: 'md',
        lg: 'lg',
      });
      expect(classes).toContain('gap-1');
      expect(classes).toContain('sm:gap-1');
      expect(classes).toContain('md:gap-1.5');
      expect(classes).toContain('lg:gap-2');
    });

    it('handles xl and 2xl breakpoints', () => {
      const classes = getResponsiveSpacingClasses({
        xl: 'md',
        '2xl': 'lg',
      });
      expect(classes).toContain('xl:gap-1.5');
      expect(classes).toContain('2xl:gap-2');
    });
  });

  describe('breakpoint order', () => {
    it('maintains correct breakpoint order', () => {
      const classes = getResponsiveSpacingClasses({
        '2xl': 'lg',
        base: 'sm',
        md: 'md',
        xl: 'lg',
        sm: 'sm',
        lg: 'md',
      });

      // Find indices of different breakpoint classes
      const baseIndex = classes.findIndex((c) => c === 'gap-1');
      const smIndex = classes.findIndex((c) => c === 'sm:gap-1');
      const mdIndex = classes.findIndex((c) => c === 'md:gap-1.5');
      const lgIndex = classes.findIndex((c) => c === 'lg:gap-1.5');
      const xlIndex = classes.findIndex((c) => c === 'xl:gap-2');
      const xxlIndex = classes.findIndex((c) => c === '2xl:gap-2');

      // Verify order (base -> sm -> md -> lg -> xl -> 2xl)
      expect(baseIndex).toBeLessThan(smIndex);
      expect(smIndex).toBeLessThan(mdIndex);
      expect(mdIndex).toBeLessThan(lgIndex);
      expect(lgIndex).toBeLessThan(xlIndex);
      expect(xlIndex).toBeLessThan(xxlIndex);
    });
  });

  describe('edge cases', () => {
    it('handles empty object', () => {
      const classes = getResponsiveSpacingClasses({});
      expect(classes).toHaveLength(0);
    });

    it('handles object with only non-base breakpoints', () => {
      const classes = getResponsiveSpacingClasses({ md: 'md' });
      expect(classes).toHaveLength(1);
      expect(classes[0]).toBe('md:gap-1.5');
    });
  });
});

// =============================================================================
// Component Behavior Documentation Tests
// =============================================================================

describe('FormField component behavior', () => {
  describe('ID generation', () => {
    it('documents that IDs are generated with consistent patterns', () => {
      // Given a field ID of "email", the component generates:
      // - Error ID: "email-error"
      // - Helper ID: "email-helper"
      const fieldId = 'email';
      const expectedErrorId = `${fieldId}-error`;
      const expectedHelperId = `${fieldId}-helper`;

      expect(expectedErrorId).toBe('email-error');
      expect(expectedHelperId).toBe('email-helper');
    });
  });

  describe('accessibility attributes', () => {
    it('documents data attributes for state', () => {
      // Component sets data-error="true" when error is present
      // Component sets data-disabled="true" when disabled
      const errorState = { 'data-error': 'true' };
      const disabledState = { 'data-disabled': 'true' };

      expect(errorState['data-error']).toBe('true');
      expect(disabledState['data-disabled']).toBe('true');
    });

    it('documents error message ARIA attributes', () => {
      // Error messages have:
      // - role="alert" for immediate announcement
      // - aria-live="assertive" for screen reader priority
      // - aria-atomic="true" to read entire message
      const errorAriaAttrs = {
        role: 'alert',
        'aria-live': 'assertive',
        'aria-atomic': 'true',
      };

      expect(errorAriaAttrs.role).toBe('alert');
      expect(errorAriaAttrs['aria-live']).toBe('assertive');
      expect(errorAriaAttrs['aria-atomic']).toBe('true');
    });
  });

  describe('helper vs error text behavior', () => {
    it('documents that error hides helper text', () => {
      // When error is present, helperText is hidden
      // Error message takes precedence
      const hasError = true;
      const helperText = 'Some help';
      const shouldShowHelper = helperText && !hasError;

      expect(shouldShowHelper).toBe(false);
    });

    it('documents that helper shows when no error', () => {
      const hasError = false;
      const helperText = 'Some help';
      const shouldShowHelper = helperText && !hasError;

      expect(shouldShowHelper).toBe(true);
    });
  });
});

// =============================================================================
// Spacing Consistency Tests
// =============================================================================

describe('spacing consistency', () => {
  it('all spacing classes use Tailwind gap utility', () => {
    for (const size of Object.keys(FORM_FIELD_SPACING_CLASSES) as FormFieldSpacing[]) {
      expect(FORM_FIELD_SPACING_CLASSES[size]).toMatch(/^gap-/);
    }
  });

  it('all spacing values are valid Tailwind classes', () => {
    const validGapClasses = ['gap-1', 'gap-1.5', 'gap-2', 'gap-2.5', 'gap-3', 'gap-4'];

    for (const size of Object.keys(FORM_FIELD_SPACING_CLASSES) as FormFieldSpacing[]) {
      expect(validGapClasses).toContain(FORM_FIELD_SPACING_CLASSES[size]);
    }
  });
});

// =============================================================================
// Type Safety Tests
// =============================================================================

describe('type safety', () => {
  it('FormFieldSpacing accepts valid values', () => {
    const validSpacings: FormFieldSpacing[] = ['sm', 'md', 'lg'];
    expect(validSpacings).toHaveLength(3);
  });

  it('getBaseSpacing handles all valid spacing values', () => {
    const spacings: FormFieldSpacing[] = ['sm', 'md', 'lg'];
    for (const spacing of spacings) {
      expect(getBaseSpacing(spacing)).toBe(spacing);
    }
  });
});

// =============================================================================
// Integration Pattern Tests
// =============================================================================

describe('integration patterns', () => {
  describe('aria-describedby pattern', () => {
    it('documents ID pattern for helper text linking', () => {
      // Consumer should link input to helper like:
      // <Input aria-describedby="fieldId-helper" />
      const fieldId = 'password';
      const helperIdPattern = `${fieldId}-helper`;
      expect(helperIdPattern).toBe('password-helper');
    });

    it('documents ID pattern for error text linking', () => {
      // Consumer should link input to error like:
      // <Input aria-describedby="fieldId-error" />
      const fieldId = 'email';
      const errorIdPattern = `${fieldId}-error`;
      expect(errorIdPattern).toBe('email-error');
    });
  });

  describe('Label atom usage', () => {
    it('documents that Label atom handles required indicator', () => {
      // The Label atom (imported from atoms) handles:
      // - Required asterisk (*) display
      // - VisuallyHidden "(required)" text
      // FormField just passes `required` prop to Label
      const labelProps = { required: true, disabled: false, htmlFor: 'field' };
      expect(labelProps.required).toBe(true);
    });
  });
});

// =============================================================================
// Default Values Documentation
// =============================================================================

describe('default values', () => {
  it('documents default spacing is sm', () => {
    // Default spacing prop value is 'sm'
    const defaultSpacing: FormFieldSpacing = 'sm';
    expect(getBaseSpacing(defaultSpacing)).toBe('sm');
  });

  it('documents default labelSize is sm', () => {
    // Default labelSize prop value is 'sm'
    // This is handled in the component, here we just document it
    const defaultLabelSize = 'sm';
    expect(defaultLabelSize).toBe('sm');
  });
});

// =============================================================================
// Responsive Breakpoint Coverage
// =============================================================================

describe('responsive breakpoint coverage', () => {
  const breakpoints = ['base', 'sm', 'md', 'lg', 'xl', '2xl'] as const;

  it('supports all Tailwind breakpoints', () => {
    // Create a responsive object with all breakpoints
    const responsiveSpacing: Record<string, FormFieldSpacing> = {};
    for (const bp of breakpoints) {
      responsiveSpacing[bp] = 'md';
    }

    const classes = getResponsiveSpacingClasses(responsiveSpacing);

    // Should have classes for all breakpoints
    expect(classes).toContain('gap-1.5'); // base
    expect(classes).toContain('sm:gap-1.5');
    expect(classes).toContain('md:gap-1.5');
    expect(classes).toContain('lg:gap-1.5');
    expect(classes).toContain('xl:gap-1.5');
    expect(classes).toContain('2xl:gap-1.5');
  });

  it('generates correct class count for all breakpoints', () => {
    const responsiveSpacing: Record<string, FormFieldSpacing> = {};
    for (const bp of breakpoints) {
      responsiveSpacing[bp] = 'sm';
    }

    const classes = getResponsiveSpacingClasses(responsiveSpacing);
    expect(classes).toHaveLength(6);
  });
});
