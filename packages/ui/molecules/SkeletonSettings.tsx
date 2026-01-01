/**
 * SkeletonSettings Molecule - Loading placeholder for settings page layouts
 *
 * Provides visual loading indication while settings content is being fetched.
 * Matches the settings Card section layout with form fields.
 *
 * Features:
 * - Uses Skeleton atom for consistent loading placeholders
 * - Responsive sizing support via ResponsiveValue
 * - Properly hidden from screen readers (aria-hidden={true})
 * - forwardRef support for ref forwarding
 * - data-testid support for testing
 */

import { Box, type Breakpoint, type ResponsiveValue } from '@openflow/primitives';
import { cn } from '@openflow/utils';
import { type HTMLAttributes, forwardRef } from 'react';
import { Skeleton } from '../atoms/Skeleton';

/** Skeleton settings size variants */
export type SkeletonSettingsSize = 'sm' | 'md' | 'lg';

/** Breakpoint names for responsive values - re-exported for convenience */
export type SkeletonSettingsBreakpoint = Breakpoint;

/**
 * SkeletonSettings component props
 */
export interface SkeletonSettingsProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /**
   * Size variant for the skeleton settings
   * - 'sm': Compact spacing (12px section padding, 12px content padding)
   * - 'md': Standard spacing (16px padding) - default
   * - 'lg': Larger spacing (20px padding, larger elements)
   */
  size?: ResponsiveValue<SkeletonSettingsSize>;
  /** Number of settings sections to render */
  sectionCount?: number;
  /** Number of fields per section */
  fieldsPerSection?: number;
  /** Whether to show section descriptions */
  showDescriptions?: boolean;
  /** Data attribute for testing */
  'data-testid'?: string;
}

/** Default number of sections to display */
export const DEFAULT_SECTION_COUNT = 2;

/** Default number of fields per section */
export const DEFAULT_FIELDS_PER_SECTION = 2;

/** Base classes for the skeleton settings container */
export const SKELETON_SETTINGS_BASE_CLASSES = 'flex flex-col';

/** Size-specific classes for container gap between sections */
export const SKELETON_SETTINGS_GAP_CLASSES: Record<SkeletonSettingsSize, string> = {
  sm: 'gap-4',
  md: 'gap-6',
  lg: 'gap-8',
};

/** Size-specific classes for section card */
export const SKELETON_SECTION_CARD_CLASSES =
  'rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] overflow-hidden';

/** Size-specific classes for section header padding */
export const SKELETON_SECTION_HEADER_PADDING_CLASSES: Record<SkeletonSettingsSize, string> = {
  sm: 'px-3 py-2',
  md: 'px-4 py-3',
  lg: 'px-5 py-4',
};

/** Size-specific classes for section header icon */
export const SKELETON_SECTION_HEADER_ICON_CLASSES: Record<
  SkeletonSettingsSize,
  { width: number; height: number }
> = {
  sm: { width: 14, height: 14 },
  md: { width: 16, height: 16 },
  lg: { width: 20, height: 20 },
};

/** Size-specific classes for section header title */
export const SKELETON_SECTION_HEADER_TITLE_CLASSES: Record<SkeletonSettingsSize, string> = {
  sm: 'h-4 w-28',
  md: 'h-5 w-32',
  lg: 'h-6 w-40',
};

/** Size-specific classes for section header description */
export const SKELETON_SECTION_HEADER_DESCRIPTION_CLASSES: Record<SkeletonSettingsSize, string> = {
  sm: 'mt-0.5 h-2.5 w-40',
  md: 'mt-1 h-3 w-48',
  lg: 'mt-1.5 h-3.5 w-56',
};

/** Size-specific classes for section content padding */
export const SKELETON_SECTION_CONTENT_PADDING_CLASSES: Record<SkeletonSettingsSize, string> = {
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
};

/** Size-specific classes for section content gap between fields */
export const SKELETON_SECTION_CONTENT_GAP_CLASSES: Record<SkeletonSettingsSize, string> = {
  sm: 'gap-3',
  md: 'gap-4',
  lg: 'gap-5',
};

/** Size-specific classes for field label */
export const SKELETON_FIELD_LABEL_CLASSES: Record<SkeletonSettingsSize, string> = {
  sm: 'h-3 w-20',
  md: 'h-4 w-24',
  lg: 'h-5 w-28',
};

/** Size-specific classes for field input */
export const SKELETON_FIELD_INPUT_CLASSES: Record<SkeletonSettingsSize, string> = {
  sm: 'h-8',
  md: 'h-10',
  lg: 'h-12',
};

/** Size-specific classes for field gap between label and input */
export const SKELETON_FIELD_GAP_CLASSES: Record<SkeletonSettingsSize, string> = {
  sm: 'gap-1',
  md: 'gap-1.5',
  lg: 'gap-2',
};

/** Breakpoint order for responsive values */
const BREAKPOINT_ORDER: Breakpoint[] = ['base', 'sm', 'md', 'lg', 'xl', '2xl'];

/** Type for responsive size object */
type ResponsiveSizeObject = Partial<Record<Breakpoint, SkeletonSettingsSize>>;

/**
 * Check if value is a responsive object (not a string size)
 */
function isResponsiveObject(
  value: ResponsiveValue<SkeletonSettingsSize>
): value is ResponsiveSizeObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Get base size from responsive value
 */
export function getBaseSize(size: ResponsiveValue<SkeletonSettingsSize>): SkeletonSettingsSize {
  if (!isResponsiveObject(size)) {
    return size;
  }
  return size.base ?? 'md';
}

/**
 * Get responsive size classes for a given class map
 */
export function getResponsiveSizeClasses(
  size: ResponsiveValue<SkeletonSettingsSize>,
  classMap: Record<SkeletonSettingsSize, string>
): string {
  if (!isResponsiveObject(size)) {
    return classMap[size];
  }

  const classes: string[] = [];

  for (const bp of BREAKPOINT_ORDER) {
    const sizeValue = size[bp];
    if (sizeValue !== undefined) {
      const sizeClasses = classMap[sizeValue];
      if (bp === 'base') {
        // Base classes without breakpoint prefix
        classes.push(sizeClasses);
      } else {
        // Add breakpoint prefix to each class
        const prefixedClasses = sizeClasses
          .split(' ')
          .map((c) => `${bp}:${c}`)
          .join(' ');
        classes.push(prefixedClasses);
      }
    }
  }

  return classes.join(' ');
}

/**
 * Get icon dimensions based on size (uses base size for responsive objects)
 */
export function getIconDimensions(size: ResponsiveValue<SkeletonSettingsSize>): {
  width: number;
  height: number;
} {
  const baseSize = getBaseSize(size);
  return SKELETON_SECTION_HEADER_ICON_CLASSES[baseSize];
}

/**
 * SkeletonSettings - Loading placeholder for settings page layouts
 *
 * Provides visual loading indication while settings content is being fetched.
 * Matches the settings Card section layout with form fields.
 *
 * @example
 * // Default 2 sections with 2 fields each
 * <SkeletonSettings />
 *
 * @example
 * // Custom counts
 * <SkeletonSettings sectionCount={3} fieldsPerSection={3} />
 *
 * @example
 * // Small size
 * <SkeletonSettings size="sm" />
 *
 * @example
 * // Responsive sizing
 * <SkeletonSettings size={{ base: 'sm', md: 'md', lg: 'lg' }} />
 */
export const SkeletonSettings = forwardRef<HTMLDivElement, SkeletonSettingsProps>(
  function SkeletonSettings(
    {
      className,
      size = 'md',
      sectionCount = DEFAULT_SECTION_COUNT,
      fieldsPerSection = DEFAULT_FIELDS_PER_SECTION,
      showDescriptions = true,
      'data-testid': dataTestId,
      ...props
    },
    ref
  ) {
    const gapClasses = getResponsiveSizeClasses(size, SKELETON_SETTINGS_GAP_CLASSES);
    const headerPaddingClasses = getResponsiveSizeClasses(
      size,
      SKELETON_SECTION_HEADER_PADDING_CLASSES
    );
    const headerTitleClasses = getResponsiveSizeClasses(
      size,
      SKELETON_SECTION_HEADER_TITLE_CLASSES
    );
    const headerDescriptionClasses = getResponsiveSizeClasses(
      size,
      SKELETON_SECTION_HEADER_DESCRIPTION_CLASSES
    );
    const contentPaddingClasses = getResponsiveSizeClasses(
      size,
      SKELETON_SECTION_CONTENT_PADDING_CLASSES
    );
    const contentGapClasses = getResponsiveSizeClasses(size, SKELETON_SECTION_CONTENT_GAP_CLASSES);
    const fieldLabelClasses = getResponsiveSizeClasses(size, SKELETON_FIELD_LABEL_CLASSES);
    const fieldInputClasses = getResponsiveSizeClasses(size, SKELETON_FIELD_INPUT_CLASSES);
    const fieldGapClasses = getResponsiveSizeClasses(size, SKELETON_FIELD_GAP_CLASSES);
    const iconDimensions = getIconDimensions(size);

    return (
      <Box
        ref={ref}
        className={cn(SKELETON_SETTINGS_BASE_CLASSES, gapClasses, className)}
        aria-hidden={true}
        role="presentation"
        data-testid={dataTestId}
        data-section-count={sectionCount}
        data-fields-per-section={fieldsPerSection}
        data-size={typeof size === 'string' ? size : 'responsive'}
        data-show-descriptions={showDescriptions}
        {...props}
      >
        {Array.from({ length: sectionCount }).map((_, sectionIndex) => (
          <Box
            key={`skeleton-section-${sectionIndex}`}
            className={SKELETON_SECTION_CARD_CLASSES}
            data-testid={dataTestId ? `${dataTestId}-section-${sectionIndex}` : undefined}
          >
            {/* Section header */}
            <Box
              className={cn(
                'border-b border-[rgb(var(--border))] bg-[rgb(var(--muted))]/50',
                headerPaddingClasses
              )}
              data-testid={dataTestId ? `${dataTestId}-section-${sectionIndex}-header` : undefined}
            >
              <Box className="flex items-center gap-2">
                <Skeleton
                  variant="circular"
                  width={iconDimensions.width}
                  height={iconDimensions.height}
                  data-testid={
                    dataTestId ? `${dataTestId}-section-${sectionIndex}-icon` : undefined
                  }
                />
                <Skeleton
                  variant="text"
                  className={headerTitleClasses}
                  data-testid={
                    dataTestId ? `${dataTestId}-section-${sectionIndex}-title` : undefined
                  }
                />
              </Box>
              {showDescriptions && (
                <Skeleton
                  variant="text"
                  className={headerDescriptionClasses}
                  data-testid={
                    dataTestId ? `${dataTestId}-section-${sectionIndex}-description` : undefined
                  }
                />
              )}
            </Box>

            {/* Section content */}
            <Box
              className={cn('flex flex-col', contentPaddingClasses, contentGapClasses)}
              data-testid={dataTestId ? `${dataTestId}-section-${sectionIndex}-content` : undefined}
            >
              {Array.from({ length: fieldsPerSection }).map((_, fieldIndex) => (
                <Box
                  key={`skeleton-field-${sectionIndex}-${fieldIndex}`}
                  className={cn('flex flex-col', fieldGapClasses)}
                  data-testid={
                    dataTestId
                      ? `${dataTestId}-section-${sectionIndex}-field-${fieldIndex}`
                      : undefined
                  }
                >
                  <Skeleton
                    variant="text"
                    className={fieldLabelClasses}
                    data-testid={
                      dataTestId
                        ? `${dataTestId}-section-${sectionIndex}-field-${fieldIndex}-label`
                        : undefined
                    }
                  />
                  <Skeleton
                    className={cn(fieldInputClasses, 'w-full rounded-md')}
                    data-testid={
                      dataTestId
                        ? `${dataTestId}-section-${sectionIndex}-field-${fieldIndex}-input`
                        : undefined
                    }
                  />
                </Box>
              ))}
            </Box>
          </Box>
        ))}
      </Box>
    );
  }
);

SkeletonSettings.displayName = 'SkeletonSettings';
