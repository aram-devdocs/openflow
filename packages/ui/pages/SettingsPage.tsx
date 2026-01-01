/**
 * SettingsPage - Stateless Page Component for General Settings
 *
 * This is a top-level stateless component that composes the general settings view.
 * It receives all required data and callbacks via props, making it fully
 * testable in Storybook with mocked data representing different page states.
 *
 * Accessibility Features:
 * - Proper page landmark structure with region role
 * - Screen reader announcements for loading, error, and save states
 * - Focus management with forwardRef support
 * - Responsive layout for all screen sizes
 * - WCAG 2.5.5 touch targets (≥44px) on interactive elements
 * - Proper ARIA attributes for form sections
 * - Form accessibility with proper label associations
 *
 * Note: This component is designed to work either standalone (with full layout)
 * or as a child of a settings layout route that provides navigation.
 *
 * The component composes:
 * - SkeletonSettings (loading state)
 * - Settings cards (Appearance, Behavior, About)
 * - Badge indicators for save states
 * - ThemeToggle for theme selection
 *
 * @module pages/SettingsPage
 */

import {
  Box,
  Heading,
  Paragraph,
  type ResponsiveValue,
  Text,
  VisuallyHidden,
} from '@openflow/primitives';
import { cn } from '@openflow/utils';
import { AlertCircle, HardDrive, Info, Moon, Save } from 'lucide-react';
import { forwardRef, useId } from 'react';
import { Badge } from '../atoms/Badge';
import { Button } from '../atoms/Button';
import { Checkbox } from '../atoms/Checkbox';
import { Icon } from '../atoms/Icon';
import type { Theme } from '../atoms/ThemeToggle';
import { ThemeToggle } from '../atoms/ThemeToggle';
import { Card, CardContent, CardHeader } from '../molecules/Card';
import { FormField } from '../molecules/FormField';
import { SkeletonSettings } from '../molecules/SkeletonSettings';

// ============================================================================
// Types
// ============================================================================

/** Size variants for responsive layout */
export type SettingsPageSize = 'sm' | 'md' | 'lg';

/** Breakpoints supported for responsive sizing */
export type SettingsPageBreakpoint = 'base' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

/** Props for the appearance section */
export interface SettingsPageAppearanceProps {
  /** Current theme */
  theme: Theme;
  /** Callback when theme changes */
  onThemeChange: (theme: Theme) => void;
}

/** Props for the behavior section */
export interface SettingsPageBehaviorProps {
  /** Whether auto-save is enabled */
  autoSave: boolean;
  /** Callback when auto-save changes */
  onAutoSaveChange: (checked: boolean) => void;
}

/** Props for the about section */
export interface SettingsPageAboutProps {
  /** Application version */
  version: string;
  /** Build type (Development, Production, etc.) */
  build: string;
}

/** Props for the save action */
export interface SettingsPageSaveProps {
  /** Whether there are unsaved changes */
  hasChanges: boolean;
  /** Whether save was successful (for success badge) */
  saveSuccess: boolean;
  /** Whether save is in progress */
  isSaving: boolean;
  /** Callback to save changes */
  onSave: () => void;
}

/** Error state props for the page */
export interface SettingsPageErrorProps {
  /** The error that occurred */
  error: string;
  /** Callback to retry the failed operation */
  onRetry?: () => void;
}

/** Props for SettingsPageSkeleton */
export interface SettingsPageSkeletonProps {
  /** Number of skeleton sections to show */
  sectionCount?: number;
  /** Number of fields per section */
  fieldsPerSection?: number;
  /** Responsive sizing */
  size?: ResponsiveValue<SettingsPageSize>;
  /** Data attributes for testing */
  'data-testid'?: string;
}

/** Props for SettingsPageError */
export interface SettingsPageErrorStateProps {
  /** The error message that occurred */
  error: string;
  /** Retry handler */
  onRetry?: () => void;
  /** Responsive sizing */
  size?: ResponsiveValue<SettingsPageSize>;
  /** Data attributes for testing */
  'data-testid'?: string;
}

/**
 * Complete props for the SettingsPage component.
 *
 * This interface defines all data and callbacks needed to render the general settings.
 * The route component is responsible for providing these props from hooks.
 */
export interface SettingsPageProps {
  /** Page state: 'loading' | 'error' | 'ready' */
  state?: 'loading' | 'error' | 'ready';

  /** Whether data is loading (deprecated: use state='loading' instead) */
  isLoading?: boolean;

  /** Appearance section props */
  appearance: SettingsPageAppearanceProps;

  /** Behavior section props */
  behavior: SettingsPageBehaviorProps;

  /** About section props */
  about: SettingsPageAboutProps;

  /** Save action props */
  save: SettingsPageSaveProps;

  /** Error state props (required when state is 'error') */
  error?: SettingsPageErrorProps;

  /** Responsive sizing */
  size?: ResponsiveValue<SettingsPageSize>;

  /** Custom aria-label for the page */
  'aria-label'?: string;

  /** Data attributes for testing */
  'data-testid'?: string;
}

// ============================================================================
// Constants
// ============================================================================

/** Default skeleton section count */
export const DEFAULT_SKELETON_SECTION_COUNT = 3;

/** Default fields per skeleton section */
export const DEFAULT_SKELETON_FIELDS_PER_SECTION = 2;

/** Default page size */
export const DEFAULT_PAGE_SIZE: SettingsPageSize = 'md';

/** Default page label */
export const DEFAULT_PAGE_LABEL = 'General Settings';

/** Default error title */
export const DEFAULT_ERROR_TITLE = 'Failed to load settings';

/** Default error description */
export const DEFAULT_ERROR_DESCRIPTION = 'Something went wrong while loading your settings.';

/** Default retry button label */
export const DEFAULT_RETRY_LABEL = 'Try Again';

/** Screen reader announcement for loading state */
export const SR_LOADING = 'Loading settings. Please wait.';

/** Screen reader announcement for error state */
export const SR_ERROR_PREFIX = 'Error loading settings:';

/** Screen reader announcement for content loaded */
export const SR_LOADED = 'Settings loaded.';

/** Screen reader announcement for saving */
export const SR_SAVING = 'Saving settings. Please wait.';

/** Screen reader announcement for save success */
export const SR_SAVE_SUCCESS = 'Settings saved successfully.';

/** Screen reader announcement for unsaved changes */
export const SR_UNSAVED_CHANGES = 'You have unsaved changes.';

/** Screen reader announcement for theme section */
export const SR_THEME_SECTION = 'Appearance settings. Choose your preferred theme.';

/** Screen reader announcement for behavior section */
export const SR_BEHAVIOR_SECTION = 'Behavior settings. Configure application behavior.';

/** Screen reader announcement for about section */
export const SR_ABOUT_SECTION = 'About this application.';

/** Page container base classes */
export const SETTINGS_PAGE_BASE_CLASSES = 'relative flex flex-col h-full w-full';

/** Content container classes */
export const SETTINGS_PAGE_CONTENT_CLASSES = 'space-y-6';

/** Status badge container classes */
export const SETTINGS_PAGE_STATUS_CLASSES = 'flex items-center gap-2';

/** Error container classes */
export const SETTINGS_PAGE_ERROR_CLASSES = [
  'flex flex-col items-center justify-center gap-4 p-6',
  'text-center min-h-[300px]',
].join(' ');

/** Skeleton container classes */
export const SETTINGS_PAGE_SKELETON_CLASSES = 'flex flex-col h-full';

/** Card header base classes */
export const SETTINGS_PAGE_CARD_HEADER_CLASSES =
  'border-b border-[rgb(var(--border))] bg-[rgb(var(--muted))]/50 px-4 py-3';

/** Card header title container classes */
export const SETTINGS_PAGE_HEADER_TITLE_CONTAINER_CLASSES = 'flex items-center gap-2';

/** Card header icon classes */
export const SETTINGS_PAGE_HEADER_ICON_CLASSES = 'h-4 w-4 text-[rgb(var(--primary))]';

/** Card header title classes */
export const SETTINGS_PAGE_HEADER_TITLE_CLASSES = 'font-medium text-[rgb(var(--foreground))]';

/** Card header description classes */
export const SETTINGS_PAGE_HEADER_DESCRIPTION_CLASSES =
  'mt-0.5 text-xs text-[rgb(var(--muted-foreground))]';

/** Card content classes */
export const SETTINGS_PAGE_CARD_CONTENT_CLASSES = 'p-4';

/** Helper text classes */
export const SETTINGS_PAGE_HELPER_TEXT_CLASSES = 'mt-2 text-xs text-[rgb(var(--muted-foreground))]';

/** About row classes */
export const SETTINGS_PAGE_ABOUT_ROW_CLASSES = 'flex justify-between';

/** About label classes */
export const SETTINGS_PAGE_ABOUT_LABEL_CLASSES = 'text-[rgb(var(--muted-foreground))]';

/** About value classes */
export const SETTINGS_PAGE_ABOUT_VALUE_CLASSES = 'text-[rgb(var(--foreground))]';

/** Footer classes */
export const SETTINGS_PAGE_FOOTER_CLASSES =
  'flex items-center gap-4 border-t border-[rgb(var(--border))] pt-6';

/** Error icon classes */
export const SETTINGS_PAGE_ERROR_ICON_CLASSES = 'h-12 w-12 text-[rgb(var(--destructive))]';

/** Error title classes */
export const SETTINGS_PAGE_ERROR_TITLE_CLASSES =
  'text-lg font-semibold text-[rgb(var(--foreground))]';

/** Error description classes */
export const SETTINGS_PAGE_ERROR_DESCRIPTION_CLASSES =
  'text-sm text-[rgb(var(--muted-foreground))] max-w-md';

/** Size-based container padding */
export const PAGE_SIZE_PADDING: Record<SettingsPageSize, string> = {
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

/** Size-based gap classes */
export const PAGE_SIZE_GAP: Record<SettingsPageSize, string> = {
  sm: 'gap-3',
  md: 'gap-4',
  lg: 'gap-6',
};

/** Size-based space-y classes */
export const PAGE_SIZE_SPACE_Y: Record<SettingsPageSize, string> = {
  sm: 'space-y-4',
  md: 'space-y-6',
  lg: 'space-y-8',
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Resolves a ResponsiveValue to its base size
 */
export function getBaseSize(size: ResponsiveValue<SettingsPageSize> | undefined): SettingsPageSize {
  if (!size) return DEFAULT_PAGE_SIZE;
  if (typeof size === 'string') return size;
  return size.base ?? DEFAULT_PAGE_SIZE;
}

/**
 * Generates responsive Tailwind classes for the size prop
 */
export function getResponsiveSizeClasses(
  size: ResponsiveValue<SettingsPageSize> | undefined,
  classMap: Record<SettingsPageSize, string>
): string {
  if (!size) return classMap[DEFAULT_PAGE_SIZE];

  if (typeof size === 'string') {
    return classMap[size];
  }

  const classes: string[] = [];
  const breakpointPrefixes: Record<Exclude<SettingsPageBreakpoint, 'base'>, string> = {
    sm: 'sm:',
    md: 'md:',
    lg: 'lg:',
    xl: 'xl:',
    '2xl': '2xl:',
  };

  // Base size
  if (size.base) {
    classes.push(classMap[size.base]);
  } else {
    classes.push(classMap[DEFAULT_PAGE_SIZE]);
  }

  // Responsive overrides
  for (const [breakpoint, prefix] of Object.entries(breakpointPrefixes)) {
    const bp = breakpoint as Exclude<SettingsPageBreakpoint, 'base'>;
    if (size[bp]) {
      const sizeClasses = classMap[size[bp] as SettingsPageSize];
      const prefixedClasses = sizeClasses
        .split(' ')
        .map((cls) => `${prefix}${cls}`)
        .join(' ');
      classes.push(prefixedClasses);
    }
  }

  return classes.join(' ');
}

/**
 * Build screen reader announcement for save state
 */
export function buildSaveAnnouncement(
  hasChanges: boolean,
  saveSuccess: boolean,
  isSaving: boolean
): string {
  if (isSaving) {
    return SR_SAVING;
  }
  if (saveSuccess) {
    return SR_SAVE_SUCCESS;
  }
  if (hasChanges) {
    return SR_UNSAVED_CHANGES;
  }
  return '';
}

/**
 * Build accessible label for the page
 */
export function buildPageAccessibleLabel(state: SettingsPageProps['state']): string {
  switch (state) {
    case 'loading':
      return 'General Settings - Loading';
    case 'error':
      return 'General Settings - Error loading content';
    default:
      return 'General Settings';
  }
}

/**
 * Build screen reader announcement for loaded state
 */
export function buildLoadedAnnouncement(hasChanges: boolean, saveSuccess: boolean): string {
  const parts: string[] = [SR_LOADED];

  if (saveSuccess) {
    parts.push(SR_SAVE_SUCCESS);
  } else if (hasChanges) {
    parts.push(SR_UNSAVED_CHANGES);
  }

  return parts.join(' ');
}

// ============================================================================
// Sub-Components
// ============================================================================

/**
 * Loading skeleton for the settings page
 */
export const SettingsPageSkeleton = forwardRef<HTMLDivElement, SettingsPageSkeletonProps>(
  function SettingsPageSkeleton(
    {
      sectionCount = DEFAULT_SKELETON_SECTION_COUNT,
      fieldsPerSection = DEFAULT_SKELETON_FIELDS_PER_SECTION,
      size,
      'data-testid': testId,
    },
    ref
  ) {
    return (
      <Box
        ref={ref}
        className={SETTINGS_PAGE_SKELETON_CLASSES}
        aria-hidden="true"
        role="presentation"
        data-testid={testId ?? 'settings-page-skeleton'}
      >
        {/* Screen reader loading announcement */}
        <VisuallyHidden>
          <Box role="status" aria-live="polite">
            {SR_LOADING}
          </Box>
        </VisuallyHidden>

        <SkeletonSettings
          sectionCount={sectionCount}
          fieldsPerSection={fieldsPerSection}
          size={getBaseSize(size)}
        />
      </Box>
    );
  }
);

/**
 * Error state for the settings page
 */
export const SettingsPageError = forwardRef<HTMLDivElement, SettingsPageErrorStateProps>(
  function SettingsPageError({ error, onRetry, size, 'data-testid': testId }, ref) {
    return (
      <Box
        ref={ref}
        className={cn(
          SETTINGS_PAGE_ERROR_CLASSES,
          getResponsiveSizeClasses(size, PAGE_SIZE_PADDING)
        )}
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        data-testid={testId ?? 'settings-page-error'}
      >
        {/* Error icon */}
        <Icon icon={AlertCircle} className={SETTINGS_PAGE_ERROR_ICON_CLASSES} aria-hidden="true" />

        {/* Error content */}
        <Box className="flex flex-col items-center gap-2">
          <Heading level={2} className={SETTINGS_PAGE_ERROR_TITLE_CLASSES}>
            {DEFAULT_ERROR_TITLE}
          </Heading>
          <Paragraph className={SETTINGS_PAGE_ERROR_DESCRIPTION_CLASSES}>
            {error || DEFAULT_ERROR_DESCRIPTION}
          </Paragraph>
        </Box>

        {/* Retry button */}
        {onRetry && (
          <Button
            variant="primary"
            onClick={onRetry}
            className="min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0"
          >
            {DEFAULT_RETRY_LABEL}
          </Button>
        )}

        {/* Screen reader announcement */}
        <VisuallyHidden>
          <Box role="status" aria-live="assertive">
            {SR_ERROR_PREFIX} {error || DEFAULT_ERROR_DESCRIPTION}
          </Box>
        </VisuallyHidden>
      </Box>
    );
  }
);

// ============================================================================
// Main Component
// ============================================================================

/**
 * SettingsPage - Complete stateless general settings page component.
 *
 * This component receives all data and callbacks via props. It is purely
 * presentational, making it fully testable in Storybook with mocked data.
 *
 * Features:
 * - Page-level loading skeleton
 * - Error state with retry button
 * - Proper heading hierarchy (h2, h3)
 * - Screen reader announcements for state changes
 * - forwardRef support for focus management
 * - Responsive layout for all screen sizes
 * - Form accessibility with proper labeling
 *
 * @example
 * ```tsx
 * // In route component
 * function GeneralSettingsRoute() {
 *   const { theme, setTheme } = useTheme();
 *   const { data: settings, isLoading, error } = useAllSettings();
 *   const setSetting = useSetSetting();
 *
 *   const [autoSave, setAutoSave] = useState(true);
 *   const [hasChanges, setHasChanges] = useState(false);
 *   const [saveSuccess, setSaveSuccess] = useState(false);
 *
 *   if (isLoading) {
 *     return <SettingsPage state="loading" {...defaultProps} />;
 *   }
 *
 *   if (error) {
 *     return (
 *       <SettingsPage
 *         state="error"
 *         error={{ error: error.message, onRetry: refetch }}
 *         {...defaultProps}
 *       />
 *     );
 *   }
 *
 *   const handleSave = async () => {
 *     await setSetting.mutateAsync({ key: 'autoSave', value: String(autoSave) });
 *     setHasChanges(false);
 *     setSaveSuccess(true);
 *   };
 *
 *   return (
 *     <SettingsPage
 *       state="ready"
 *       appearance={{ theme, onThemeChange: setTheme }}
 *       behavior={{
 *         autoSave,
 *         onAutoSaveChange: (checked) => {
 *           setAutoSave(checked);
 *           setHasChanges(true);
 *         },
 *       }}
 *       about={{ version: '0.1.0', build: 'Development' }}
 *       save={{
 *         hasChanges,
 *         saveSuccess,
 *         isSaving: setSetting.isPending,
 *         onSave: handleSave,
 *       }}
 *     />
 *   );
 * }
 * ```
 */
export const SettingsPage = forwardRef<HTMLDivElement, SettingsPageProps>(function SettingsPage(
  {
    state: stateProp,
    isLoading,
    appearance,
    behavior,
    about,
    save,
    error,
    size,
    'aria-label': ariaLabel,
    'data-testid': testId,
  },
  ref
) {
  // Generate unique IDs for form elements
  const autoSaveId = useId();
  const appearanceSectionId = useId();
  const behaviorSectionId = useId();
  const aboutSectionId = useId();

  // Determine state from props (backwards compatibility with isLoading)
  const state = stateProp ?? (isLoading ? 'loading' : 'ready');

  // Generate accessible label
  const computedAriaLabel = ariaLabel ?? buildPageAccessibleLabel(state);
  const baseSize = getBaseSize(size);

  // Loading state
  if (state === 'loading') {
    return (
      <Box
        ref={ref}
        className={SETTINGS_PAGE_BASE_CLASSES}
        aria-label={computedAriaLabel}
        aria-busy="true"
        data-testid={testId ?? 'settings-page'}
        data-state="loading"
        data-size={baseSize}
      >
        <SettingsPageSkeleton size={size} />
      </Box>
    );
  }

  // Error state
  if (state === 'error' && error) {
    return (
      <Box
        ref={ref}
        className={SETTINGS_PAGE_BASE_CLASSES}
        aria-label={computedAriaLabel}
        data-testid={testId ?? 'settings-page'}
        data-state="error"
        data-size={baseSize}
      >
        <SettingsPageError error={error.error} onRetry={error.onRetry} size={size} />
      </Box>
    );
  }

  // Ready state
  return (
    <Box
      ref={ref}
      className={SETTINGS_PAGE_BASE_CLASSES}
      aria-label={computedAriaLabel}
      data-testid={testId ?? 'settings-page'}
      data-state="ready"
      data-size={baseSize}
      data-has-changes={save.hasChanges || undefined}
      data-save-success={save.saveSuccess || undefined}
      data-saving={save.isSaving || undefined}
    >
      {/* Screen reader announcements */}
      <VisuallyHidden>
        <Box role="status" aria-live="polite" aria-atomic="true">
          {buildLoadedAnnouncement(save.hasChanges, save.saveSuccess)}
        </Box>
      </VisuallyHidden>

      {/* Saving state announcement */}
      {save.isSaving && (
        <VisuallyHidden>
          <Box role="status" aria-live="polite">
            {SR_SAVING}
          </Box>
        </VisuallyHidden>
      )}

      <Box
        className={cn(
          SETTINGS_PAGE_CONTENT_CLASSES,
          getResponsiveSizeClasses(size, PAGE_SIZE_SPACE_Y)
        )}
      >
        {/* Status badges */}
        {(save.hasChanges || save.saveSuccess) && (
          <Box className={SETTINGS_PAGE_STATUS_CLASSES} role="status" aria-live="polite">
            {save.hasChanges && (
              <Badge variant="warning" aria-label="Warning: Unsaved changes">
                Unsaved changes
              </Badge>
            )}
            {save.saveSuccess && (
              <Badge variant="success" aria-label="Success: Saved successfully">
                Saved successfully
              </Badge>
            )}
          </Box>
        )}

        {/* Appearance Section */}
        <Card className="overflow-hidden" role="region" aria-labelledby={appearanceSectionId}>
          <CardHeader className={SETTINGS_PAGE_CARD_HEADER_CLASSES}>
            <Box className={SETTINGS_PAGE_HEADER_TITLE_CONTAINER_CLASSES}>
              <Icon icon={Moon} className={SETTINGS_PAGE_HEADER_ICON_CLASSES} aria-hidden="true" />
              <Heading
                id={appearanceSectionId}
                level={2}
                className={SETTINGS_PAGE_HEADER_TITLE_CLASSES}
              >
                Appearance
              </Heading>
            </Box>
            <Paragraph className={SETTINGS_PAGE_HEADER_DESCRIPTION_CLASSES}>
              Customize how OpenFlow looks
            </Paragraph>
          </CardHeader>
          <CardContent className={SETTINGS_PAGE_CARD_CONTENT_CLASSES}>
            <FormField label="Theme">
              <ThemeToggle theme={appearance.theme} onThemeChange={appearance.onThemeChange} />
            </FormField>
            <Paragraph className={SETTINGS_PAGE_HELPER_TEXT_CLASSES}>
              Theme changes are applied immediately and persisted automatically.
            </Paragraph>
          </CardContent>
        </Card>

        {/* Behavior Section */}
        <Card className="overflow-hidden" role="region" aria-labelledby={behaviorSectionId}>
          <CardHeader className={SETTINGS_PAGE_CARD_HEADER_CLASSES}>
            <Box className={SETTINGS_PAGE_HEADER_TITLE_CONTAINER_CLASSES}>
              <Icon
                icon={HardDrive}
                className={SETTINGS_PAGE_HEADER_ICON_CLASSES}
                aria-hidden="true"
              />
              <Heading
                id={behaviorSectionId}
                level={2}
                className={SETTINGS_PAGE_HEADER_TITLE_CLASSES}
              >
                Behavior
              </Heading>
            </Box>
            <Paragraph className={SETTINGS_PAGE_HEADER_DESCRIPTION_CLASSES}>
              Configure application behavior
            </Paragraph>
          </CardHeader>
          <CardContent className={SETTINGS_PAGE_CARD_CONTENT_CLASSES}>
            <Box className="flex items-start gap-3">
              <Checkbox
                id={autoSaveId}
                checked={behavior.autoSave}
                onCheckedChange={behavior.onAutoSaveChange}
                className="mt-0.5"
                aria-describedby={`${autoSaveId}-description`}
              />
              <Box>
                <Text
                  as="label"
                  htmlFor={autoSaveId}
                  className="text-sm font-medium text-[rgb(var(--foreground))] cursor-pointer"
                >
                  Auto-save task descriptions
                </Text>
                <Paragraph
                  id={`${autoSaveId}-description`}
                  className="text-xs text-[rgb(var(--muted-foreground))]"
                >
                  Automatically save changes as you type
                </Paragraph>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* About Section */}
        <Card className="overflow-hidden" role="region" aria-labelledby={aboutSectionId}>
          <CardHeader className={SETTINGS_PAGE_CARD_HEADER_CLASSES}>
            <Box className={SETTINGS_PAGE_HEADER_TITLE_CONTAINER_CLASSES}>
              <Icon icon={Info} className={SETTINGS_PAGE_HEADER_ICON_CLASSES} aria-hidden="true" />
              <Heading id={aboutSectionId} level={2} className={SETTINGS_PAGE_HEADER_TITLE_CLASSES}>
                About
              </Heading>
            </Box>
          </CardHeader>
          <CardContent className={SETTINGS_PAGE_CARD_CONTENT_CLASSES}>
            <Box as="dl" className="space-y-2 text-sm">
              <Box className={SETTINGS_PAGE_ABOUT_ROW_CLASSES}>
                <Text as="dt" className={SETTINGS_PAGE_ABOUT_LABEL_CLASSES}>
                  Version
                </Text>
                <Text as="dd" className={SETTINGS_PAGE_ABOUT_VALUE_CLASSES}>
                  {about.version}
                </Text>
              </Box>
              <Box className={SETTINGS_PAGE_ABOUT_ROW_CLASSES}>
                <Text as="dt" className={SETTINGS_PAGE_ABOUT_LABEL_CLASSES}>
                  Build
                </Text>
                <Text as="dd" className={SETTINGS_PAGE_ABOUT_VALUE_CLASSES}>
                  {about.build}
                </Text>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Save button */}
        <Box className={SETTINGS_PAGE_FOOTER_CLASSES}>
          <Button
            variant="primary"
            onClick={save.onSave}
            loading={save.isSaving}
            disabled={!save.hasChanges}
            icon={<Save aria-hidden="true" />}
            className="min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0"
            aria-describedby={save.hasChanges ? undefined : 'save-disabled-hint'}
          >
            Save Changes
          </Button>
          {!save.hasChanges && (
            <VisuallyHidden>
              <Text as="span" id="save-disabled-hint">
                No changes to save. Make changes to settings first.
              </Text>
            </VisuallyHidden>
          )}
        </Box>
      </Box>
    </Box>
  );
});

SettingsPage.displayName = 'SettingsPage';
