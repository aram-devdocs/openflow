/**
 * ProjectSettingsPageComponents - Stateless UI components for the Project Settings page
 *
 * These components are pure functions of their props, receiving data and callbacks
 * from the useProjectsSettingsSession hook. They render UI and call callbacks on user interaction.
 *
 * Accessibility features:
 * - All components use forwardRef for programmatic access
 * - ResponsiveValue<ProjectSettingsSize> for responsive sizing
 * - Proper ARIA attributes (role, aria-label, aria-labelledby, aria-describedby)
 * - Screen reader announcements via VisuallyHidden
 * - Touch targets ≥44px (WCAG 2.5.5)
 * - Focus management and keyboard navigation
 * - Loading, empty, and error states with proper semantics
 */

import type { Project } from '@openflow/generated';
import { Flex, Heading, type ResponsiveValue, Text, VisuallyHidden } from '@openflow/primitives';
import { cn } from '@openflow/utils';
import {
  AlertCircle,
  FileCode,
  FolderGit2,
  GitBranch,
  type LucideIcon,
  Save,
  Settings,
  Terminal,
} from 'lucide-react';
import { type HTMLAttributes, type ReactNode, forwardRef, useId } from 'react';
import { Badge } from '../atoms/Badge';
import { Button } from '../atoms/Button';
import { Icon } from '../atoms/Icon';
import { Input } from '../atoms/Input';
import { Textarea } from '../atoms/Textarea';
import { Card } from '../molecules/Card';
import { Dropdown } from '../molecules/Dropdown';
import { FormField } from '../molecules/FormField';
import { SkeletonSettings } from '../molecules/SkeletonSettings';

// ============================================================================
// Types
// ============================================================================

export type ProjectSettingsSize = 'sm' | 'md' | 'lg';
export type ProjectSettingsBreakpoint = 'base' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

/** Form data for editing project settings */
export interface ProjectSettingsFormData {
  name: string;
  icon: string;
  baseBranch: string;
  setupScript: string;
  devScript: string;
  cleanupScript: string;
  workflowsFolder: string;
  ruleFolders: string;
  alwaysIncludedRules: string;
  verificationConfig: string;
}

/** Props for ProjectSettingsLayout component */
export interface ProjectSettingsLayoutProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Main content */
  children: ReactNode;
  /** Accessible label for the region */
  'aria-label'?: string;
  /** Responsive size */
  size?: ResponsiveValue<ProjectSettingsSize>;
  /** Test ID for automated testing */
  'data-testid'?: string;
}

/** Props for ProjectSettingsLoadingSkeleton component */
export interface ProjectSettingsLoadingSkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /** Number of sections to show */
  sectionCount?: number;
  /** Fields per section */
  fieldsPerSection?: number;
  /** Responsive size */
  size?: ResponsiveValue<ProjectSettingsSize>;
  /** Test ID for automated testing */
  'data-testid'?: string;
}

/** Props for ProjectSettingsEmptyState component */
export interface ProjectSettingsEmptyStateProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Responsive size */
  size?: ResponsiveValue<ProjectSettingsSize>;
  /** Test ID for automated testing */
  'data-testid'?: string;
}

/** Props for ProjectSettingsErrorState component */
export interface ProjectSettingsErrorStateProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Error message to display */
  error: string;
  /** Callback for retry button click */
  onRetry?: () => void;
  /** Responsive size */
  size?: ResponsiveValue<ProjectSettingsSize>;
  /** Test ID for automated testing */
  'data-testid'?: string;
}

/** Props for ProjectSettingsSelector component */
export interface ProjectSettingsSelectorProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  /** Dropdown options */
  options: Array<{
    value: string;
    label: string;
  }>;
  /** Selected project ID */
  selectedProjectId: string | null;
  /** Callback when project is selected */
  onSelect: (projectId: string) => void;
  /** Whether there are unsaved changes */
  hasChanges: boolean;
  /** Whether save was successful */
  saveSuccess: boolean;
  /** Accessible label for the dropdown */
  dropdownLabel?: string;
  /** Responsive size */
  size?: ResponsiveValue<ProjectSettingsSize>;
  /** Test ID for automated testing */
  'data-testid'?: string;
}

/** Props for SettingsSection component */
export interface SettingsSectionProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /** Section title */
  title: string;
  /** Section icon */
  icon: LucideIcon;
  /** Section description */
  description: string;
  /** Section content */
  children: ReactNode;
  /** Responsive size */
  size?: ResponsiveValue<ProjectSettingsSize>;
  /** Test ID for automated testing */
  'data-testid'?: string;
}

/** Props for BasicInfoSection component */
export interface BasicInfoSectionProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /** Form data */
  formData: ProjectSettingsFormData;
  /** Repository path (read-only) */
  gitRepoPath: string;
  /** Form change handler */
  onFormChange: (
    field: keyof ProjectSettingsFormData
  ) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  /** Responsive size */
  size?: ResponsiveValue<ProjectSettingsSize>;
  /** Test ID for automated testing */
  'data-testid'?: string;
}

/** Props for ScriptsSection component */
export interface ScriptsSectionProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /** Form data */
  formData: ProjectSettingsFormData;
  /** Form change handler */
  onFormChange: (
    field: keyof ProjectSettingsFormData
  ) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  /** Responsive size */
  size?: ResponsiveValue<ProjectSettingsSize>;
  /** Test ID for automated testing */
  'data-testid'?: string;
}

/** Props for WorkflowsSection component */
export interface WorkflowsSectionProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /** Form data */
  formData: ProjectSettingsFormData;
  /** Form change handler */
  onFormChange: (
    field: keyof ProjectSettingsFormData
  ) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  /** Responsive size */
  size?: ResponsiveValue<ProjectSettingsSize>;
  /** Test ID for automated testing */
  'data-testid'?: string;
}

/** Props for RulesSection component */
export interface RulesSectionProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /** Form data */
  formData: ProjectSettingsFormData;
  /** Form change handler */
  onFormChange: (
    field: keyof ProjectSettingsFormData
  ) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  /** Responsive size */
  size?: ResponsiveValue<ProjectSettingsSize>;
  /** Test ID for automated testing */
  'data-testid'?: string;
}

/** Props for VerificationSection component */
export interface VerificationSectionProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /** Form data */
  formData: ProjectSettingsFormData;
  /** Form change handler */
  onFormChange: (
    field: keyof ProjectSettingsFormData
  ) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  /** Responsive size */
  size?: ResponsiveValue<ProjectSettingsSize>;
  /** Test ID for automated testing */
  'data-testid'?: string;
}

/** Props for SaveFooter component */
export interface SaveFooterProps extends HTMLAttributes<HTMLDivElement> {
  /** Whether save is pending */
  isSaving: boolean;
  /** Whether there are unsaved changes */
  hasChanges: boolean;
  /** Save error message */
  saveError: string | null;
  /** Callback when save button is clicked */
  onSave: () => void;
  /** Responsive size */
  size?: ResponsiveValue<ProjectSettingsSize>;
  /** Test ID for automated testing */
  'data-testid'?: string;
}

/** Props for ProjectSettingsForm component */
export interface ProjectSettingsFormProps
  extends Omit<HTMLAttributes<HTMLFormElement>, 'onSubmit'> {
  /** Selected project */
  project: Project;
  /** Form data */
  formData: ProjectSettingsFormData;
  /** Form change handler */
  onFormChange: (
    field: keyof ProjectSettingsFormData
  ) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  /** Whether save is pending */
  isSaving: boolean;
  /** Whether there are unsaved changes */
  hasChanges: boolean;
  /** Save error message */
  saveError: string | null;
  /** Callback when save button is clicked */
  onSave: () => void;
  /** Responsive size */
  size?: ResponsiveValue<ProjectSettingsSize>;
  /** Test ID for automated testing */
  'data-testid'?: string;
}

/** Props for ProjectSettingsContent component */
export interface ProjectSettingsContentProps extends HTMLAttributes<HTMLDivElement> {
  /** Selected project (null if none selected) */
  project: Project | null;
  /** Projects list for selector */
  projects: Project[];
  /** Form data */
  formData: ProjectSettingsFormData;
  /** Form change handler */
  onFormChange: (
    field: keyof ProjectSettingsFormData
  ) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  /** Callback when project is selected */
  onProjectSelect: (projectId: string) => void;
  /** Whether data is loading */
  isLoading?: boolean;
  /** Whether save is pending */
  isSaving: boolean;
  /** Whether there are unsaved changes */
  hasChanges: boolean;
  /** Save error message */
  saveError: string | null;
  /** Whether save was successful */
  saveSuccess: boolean;
  /** Callback when save button is clicked */
  onSave: () => void;
  /** Error message if any */
  error?: string | null;
  /** Callback for retry on error */
  onRetry?: () => void;
  /** Responsive size */
  size?: ResponsiveValue<ProjectSettingsSize>;
  /** Test ID for automated testing */
  'data-testid'?: string;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Breakpoint order for responsive class generation
 */
const BREAKPOINT_ORDER: readonly ProjectSettingsBreakpoint[] = [
  'base',
  'sm',
  'md',
  'lg',
  'xl',
  '2xl',
];

/**
 * Default skeleton section count
 */
export const DEFAULT_SKELETON_SECTION_COUNT = 4;

/**
 * Default fields per skeleton section
 */
export const DEFAULT_SKELETON_FIELDS_PER_SECTION = 3;

/**
 * Default label for page region
 */
export const DEFAULT_PAGE_LABEL = 'Project Settings';

/**
 * Default label for dropdown
 */
export const DEFAULT_DROPDOWN_LABEL = 'Select a project to configure';

/**
 * Default dropdown placeholder
 */
export const DEFAULT_DROPDOWN_PLACEHOLDER = 'Select a project';

/**
 * Default empty state title
 */
export const DEFAULT_EMPTY_TITLE = 'No projects';

/**
 * Default empty state description
 */
export const DEFAULT_EMPTY_DESCRIPTION = 'Create a project first to configure its settings.';

/**
 * Default error state title
 */
export const DEFAULT_ERROR_TITLE = 'Failed to load project settings';

/**
 * Default retry button label
 */
export const DEFAULT_RETRY_LABEL = 'Try again';

/**
 * Default save button label
 */
export const DEFAULT_SAVE_LABEL = 'Save Changes';

/**
 * Default saving button text
 */
export const DEFAULT_SAVING_TEXT = 'Saving...';

/**
 * Unsaved changes badge text
 */
export const UNSAVED_CHANGES_TEXT = 'Unsaved changes';

/**
 * Save success badge text
 */
export const SAVE_SUCCESS_TEXT = 'Saved successfully';

/**
 * Screen reader announcement for loading state
 */
export const SR_LOADING = 'Loading project settings...';

/**
 * Screen reader announcement for empty state
 */
export const SR_EMPTY = 'No projects available. Create one to configure settings.';

/**
 * Screen reader announcement for unsaved changes
 */
export const SR_UNSAVED_CHANGES = 'You have unsaved changes';

/**
 * Screen reader announcement for save success
 */
export const SR_SAVE_SUCCESS = 'Settings saved successfully';

/**
 * Screen reader announcement when saving
 */
export const SR_SAVING = 'Saving project settings...';

/**
 * Screen reader announcement for project selection change
 */
export const SR_PROJECT_SELECTED = 'Project selected:';

/**
 * Screen reader announcement for form section
 */
export const SR_FORM_LABEL = 'Project settings form';

/**
 * Section titles
 */
export const SECTION_TITLES = {
  basicInfo: 'Basic Information',
  scripts: 'Scripts',
  workflows: 'Workflows',
  rules: 'Rules & Context',
  verification: 'Verification',
} as const;

/**
 * Section descriptions
 */
export const SECTION_DESCRIPTIONS = {
  basicInfo: 'General project details',
  scripts: 'Commands to run during task lifecycle',
  workflows: 'Workflow template configuration',
  rules: 'AI context and instruction files',
  verification: 'Automated verification commands',
} as const;

/**
 * Section icons mapping
 */
export const SECTION_ICONS = {
  basicInfo: FolderGit2,
  scripts: Terminal,
  workflows: GitBranch,
  rules: FileCode,
  verification: Settings,
} as const;

/**
 * Size class mappings for layout
 */
export const PROJECT_SETTINGS_SIZE_CLASSES: Record<ProjectSettingsSize, string> = {
  sm: 'space-y-4',
  md: 'space-y-6',
  lg: 'space-y-8',
};

/**
 * Selector container gap classes
 */
export const SELECTOR_GAP_CLASSES: Record<ProjectSettingsSize, string> = {
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
};

/**
 * Selector dropdown width classes
 */
export const SELECTOR_DROPDOWN_WIDTH_CLASSES: Record<ProjectSettingsSize, string> = {
  sm: 'w-48',
  md: 'w-64',
  lg: 'w-80',
};

/**
 * Section header padding classes
 */
export const SECTION_HEADER_PADDING_CLASSES: Record<ProjectSettingsSize, string> = {
  sm: 'px-3 py-2',
  md: 'px-4 py-3',
  lg: 'px-5 py-4',
};

/**
 * Section content padding classes
 */
export const SECTION_CONTENT_PADDING_CLASSES: Record<ProjectSettingsSize, string> = {
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
};

/**
 * Section content gap classes
 */
export const SECTION_CONTENT_GAP_CLASSES: Record<ProjectSettingsSize, string> = {
  sm: 'space-y-3',
  md: 'space-y-4',
  lg: 'space-y-5',
};

/**
 * Footer padding classes
 */
export const FOOTER_PADDING_CLASSES: Record<ProjectSettingsSize, string> = {
  sm: 'pt-4',
  md: 'pt-6',
  lg: 'pt-8',
};

/**
 * Button size mapping
 */
export const BUTTON_SIZE_MAP: Record<ProjectSettingsSize, 'sm' | 'md' | 'lg'> = {
  sm: 'sm',
  md: 'md',
  lg: 'lg',
};

/**
 * Icon size mapping
 */
export const ICON_SIZE_MAP: Record<ProjectSettingsSize, 'xs' | 'sm' | 'md'> = {
  sm: 'xs',
  md: 'sm',
  lg: 'md',
};

/**
 * Badge size mapping
 */
export const BADGE_SIZE_MAP: Record<ProjectSettingsSize, 'sm' | 'md' | 'lg'> = {
  sm: 'sm',
  md: 'sm',
  lg: 'md',
};

/**
 * Layout base classes
 */
export const PROJECT_SETTINGS_LAYOUT_CLASSES = 'relative';

/**
 * Selector container classes
 */
export const SELECTOR_CONTAINER_CLASSES = 'flex items-center flex-wrap';

/**
 * Section card container classes
 */
export const SECTION_CARD_CLASSES = 'overflow-hidden';

/**
 * Section header container classes
 */
export const SECTION_HEADER_CLASSES =
  'border-b border-[rgb(var(--border))] bg-[rgb(var(--muted))]/50';

/**
 * Section header title container classes
 */
export const SECTION_HEADER_TITLE_CLASSES = 'flex items-center gap-2';

/**
 * Section header description classes
 */
export const SECTION_HEADER_DESC_CLASSES = 'mt-0.5 text-xs text-[rgb(var(--muted-foreground))]';

/**
 * Empty state container classes
 */
export const EMPTY_STATE_CLASSES = [
  'flex flex-col items-center justify-center',
  'rounded-lg border border-dashed border-[rgb(var(--border))]',
  'py-12 px-4 text-center',
].join(' ');

/**
 * Empty state icon container classes
 */
export const EMPTY_STATE_ICON_CLASSES = 'mb-4 h-12 w-12 text-[rgb(var(--muted-foreground))]';

/**
 * Error state container classes
 */
export const ERROR_STATE_CLASSES = [
  'flex flex-col items-center justify-center',
  'rounded-lg border border-dashed border-[rgb(var(--destructive))]/30',
  'py-12 px-4 text-center',
].join(' ');

/**
 * Error state icon container classes
 */
export const ERROR_STATE_ICON_CLASSES =
  'flex h-12 w-12 items-center justify-center rounded-full bg-[rgb(var(--destructive))]/10 mb-4';

/**
 * Footer container classes
 */
export const FOOTER_CONTAINER_CLASSES = [
  'flex items-center gap-4',
  'border-t border-[rgb(var(--border))]',
].join(' ');

/**
 * Save error text classes
 */
export const SAVE_ERROR_CLASSES = 'text-sm text-[rgb(var(--destructive))]';

/**
 * Form grid classes (for 2-column layout)
 */
export const FORM_GRID_CLASSES = 'grid gap-4 sm:grid-cols-2';

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get the base size from a responsive value
 */
export function getBaseSize(
  size: ResponsiveValue<ProjectSettingsSize> | undefined
): ProjectSettingsSize {
  if (size === undefined) {
    return 'md';
  }

  if (typeof size === 'string') {
    return size;
  }

  if (typeof size === 'object' && size !== null) {
    const sizeObj = size as Partial<Record<ProjectSettingsBreakpoint, ProjectSettingsSize>>;
    return sizeObj.base ?? 'md';
  }

  return 'md';
}

/**
 * Generate responsive size classes from ProjectSettingsSize value
 */
export function getResponsiveSizeClasses(
  size: ResponsiveValue<ProjectSettingsSize> | undefined,
  classMap: Record<ProjectSettingsSize, string>
): string {
  if (size === undefined) {
    return classMap.md;
  }

  if (typeof size === 'string') {
    return classMap[size];
  }

  if (typeof size === 'object' && size !== null) {
    const classes: string[] = [];
    const sizeObj = size as Partial<Record<ProjectSettingsBreakpoint, ProjectSettingsSize>>;

    for (const breakpoint of BREAKPOINT_ORDER) {
      const breakpointValue = sizeObj[breakpoint];
      if (breakpointValue !== undefined) {
        const sizeClass = classMap[breakpointValue];
        const classValues = sizeClass.split(' ');
        for (const classValue of classValues) {
          if (breakpoint === 'base') {
            classes.push(classValue);
          } else {
            classes.push(`${breakpoint}:${classValue}`);
          }
        }
      }
    }
    return classes.join(' ') || classMap.md;
  }

  return classMap.md;
}

/**
 * Build accessible label for a form section
 */
export function buildSectionAccessibleLabel(title: string, description: string): string {
  return `${title}. ${description}`;
}

/**
 * Build status announcement based on current state
 */
export function buildStatusAnnouncement(
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
 * Build selector accessibility announcement
 */
export function buildSelectorAnnouncement(
  projectName: string | null,
  hasChanges: boolean,
  saveSuccess: boolean
): string {
  const parts: string[] = [];

  if (projectName) {
    parts.push(`${SR_PROJECT_SELECTED} ${projectName}`);
  }

  if (hasChanges) {
    parts.push(SR_UNSAVED_CHANGES);
  }

  if (saveSuccess) {
    parts.push(SR_SAVE_SUCCESS);
  }

  return parts.join('. ');
}

// ============================================================================
// Layout Components
// ============================================================================

/**
 * ProjectSettingsLayout - Main layout wrapper for the settings page
 */
export const ProjectSettingsLayout = forwardRef<HTMLDivElement, ProjectSettingsLayoutProps>(
  function ProjectSettingsLayout(
    {
      children,
      size = 'md',
      'aria-label': ariaLabel = DEFAULT_PAGE_LABEL,
      'data-testid': dataTestId,
      className,
      ...props
    },
    ref
  ) {
    const baseSize = getBaseSize(size);
    const layoutClasses = getResponsiveSizeClasses(size, PROJECT_SETTINGS_SIZE_CLASSES);

    return (
      <div
        ref={ref}
        role="region"
        aria-label={ariaLabel}
        data-testid={dataTestId}
        data-size={baseSize}
        className={cn(PROJECT_SETTINGS_LAYOUT_CLASSES, layoutClasses, className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

ProjectSettingsLayout.displayName = 'ProjectSettingsLayout';

// ============================================================================
// State Components
// ============================================================================

/**
 * ProjectSettingsLoadingSkeleton - Loading state for project settings
 */
export const ProjectSettingsLoadingSkeleton = forwardRef<
  HTMLDivElement,
  ProjectSettingsLoadingSkeletonProps
>(function ProjectSettingsLoadingSkeleton(
  {
    sectionCount = DEFAULT_SKELETON_SECTION_COUNT,
    fieldsPerSection = DEFAULT_SKELETON_FIELDS_PER_SECTION,
    size = 'md',
    'data-testid': dataTestId,
    className,
    ...props
  },
  ref
) {
  const baseSize = getBaseSize(size);

  return (
    <div
      ref={ref}
      role="status"
      aria-label={SR_LOADING}
      aria-busy="true"
      data-testid={dataTestId}
      data-size={baseSize}
      data-section-count={sectionCount}
      data-fields-per-section={fieldsPerSection}
      className={className}
      {...props}
    >
      <VisuallyHidden>
        <span aria-live="polite">{SR_LOADING}</span>
      </VisuallyHidden>
      <SkeletonSettings
        sectionCount={sectionCount}
        fieldsPerSection={fieldsPerSection}
        size={baseSize}
        data-testid={dataTestId ? `${dataTestId}-skeleton` : undefined}
      />
    </div>
  );
});

ProjectSettingsLoadingSkeleton.displayName = 'ProjectSettingsLoadingSkeleton';

/**
 * ProjectSettingsEmptyState - Empty state when no projects exist
 */
export const ProjectSettingsEmptyState = forwardRef<HTMLDivElement, ProjectSettingsEmptyStateProps>(
  function ProjectSettingsEmptyState(
    { size = 'md', 'data-testid': dataTestId, className, ...props },
    ref
  ) {
    const baseSize = getBaseSize(size);

    return (
      <div
        ref={ref}
        role="status"
        aria-label={SR_EMPTY}
        data-testid={dataTestId}
        data-size={baseSize}
        className={cn(EMPTY_STATE_CLASSES, className)}
        {...props}
      >
        <VisuallyHidden>
          <span aria-live="polite">{SR_EMPTY}</span>
        </VisuallyHidden>
        <FolderGit2
          className={EMPTY_STATE_ICON_CLASSES}
          aria-hidden="true"
          data-testid={dataTestId ? `${dataTestId}-icon` : undefined}
        />
        <Heading level={3} size="lg" className="mb-1">
          {DEFAULT_EMPTY_TITLE}
        </Heading>
        <Text
          size="sm"
          color="muted-foreground"
          data-testid={dataTestId ? `${dataTestId}-description` : undefined}
        >
          {DEFAULT_EMPTY_DESCRIPTION}
        </Text>
      </div>
    );
  }
);

ProjectSettingsEmptyState.displayName = 'ProjectSettingsEmptyState';

/**
 * ProjectSettingsErrorState - Error state when loading fails
 */
export const ProjectSettingsErrorState = forwardRef<HTMLDivElement, ProjectSettingsErrorStateProps>(
  function ProjectSettingsErrorState(
    { error, onRetry, size = 'md', 'data-testid': dataTestId, className, ...props },
    ref
  ) {
    const baseSize = getBaseSize(size);

    return (
      <div
        ref={ref}
        role="alert"
        aria-live="assertive"
        data-testid={dataTestId}
        data-size={baseSize}
        className={cn(ERROR_STATE_CLASSES, className)}
        {...props}
      >
        <VisuallyHidden>
          <span>Error: {error}</span>
        </VisuallyHidden>
        <div
          className={ERROR_STATE_ICON_CLASSES}
          aria-hidden="true"
          data-testid={dataTestId ? `${dataTestId}-icon` : undefined}
        >
          <Icon icon={AlertCircle} size="lg" className="text-[rgb(var(--destructive))]" />
        </div>
        <Heading level={3} size="lg" className="mb-2">
          {DEFAULT_ERROR_TITLE}
        </Heading>
        <Text
          size="sm"
          color="muted-foreground"
          className="mb-4 max-w-md"
          data-testid={dataTestId ? `${dataTestId}-message` : undefined}
        >
          {error}
        </Text>
        {onRetry && (
          <Button
            variant="secondary"
            size={BUTTON_SIZE_MAP[baseSize]}
            onClick={onRetry}
            data-testid={dataTestId ? `${dataTestId}-retry` : undefined}
          >
            {DEFAULT_RETRY_LABEL}
          </Button>
        )}
      </div>
    );
  }
);

ProjectSettingsErrorState.displayName = 'ProjectSettingsErrorState';

// ============================================================================
// Header Components
// ============================================================================

/**
 * ProjectSettingsSelector - Project dropdown with status badges
 */
export const ProjectSettingsSelector = forwardRef<HTMLDivElement, ProjectSettingsSelectorProps>(
  function ProjectSettingsSelector(
    {
      options,
      selectedProjectId,
      onSelect,
      hasChanges,
      saveSuccess,
      dropdownLabel = DEFAULT_DROPDOWN_LABEL,
      size = 'md',
      'data-testid': dataTestId,
      className,
      ...props
    },
    ref
  ) {
    const baseSize = getBaseSize(size);
    const gapClasses = getResponsiveSizeClasses(size, SELECTOR_GAP_CLASSES);
    const widthClasses = getResponsiveSizeClasses(size, SELECTOR_DROPDOWN_WIDTH_CLASSES);
    const badgeSize = BADGE_SIZE_MAP[baseSize];

    // Find the selected project name for screen reader announcement
    const selectedProject = options.find((opt) => opt.value === selectedProjectId);
    const announcement = buildSelectorAnnouncement(
      selectedProject?.label ?? null,
      hasChanges,
      saveSuccess
    );

    return (
      <div
        ref={ref}
        data-testid={dataTestId}
        data-size={baseSize}
        data-has-changes={hasChanges || undefined}
        data-save-success={saveSuccess || undefined}
        className={cn(SELECTOR_CONTAINER_CLASSES, gapClasses, className)}
        {...props}
      >
        {/* Screen reader announcements */}
        <VisuallyHidden>
          <span role="status" aria-live="polite">
            {announcement}
          </span>
        </VisuallyHidden>

        {/* Dropdown */}
        <div
          className={widthClasses}
          data-testid={dataTestId ? `${dataTestId}-dropdown-container` : undefined}
        >
          <Dropdown
            options={options}
            value={selectedProjectId ?? ''}
            onChange={onSelect}
            placeholder={DEFAULT_DROPDOWN_PLACEHOLDER}
            size={baseSize}
            aria-label={dropdownLabel}
            data-testid={dataTestId ? `${dataTestId}-dropdown` : undefined}
          />
        </div>

        {/* Status badges */}
        {hasChanges && (
          <Badge
            variant="warning"
            size={badgeSize}
            aria-label={SR_UNSAVED_CHANGES}
            data-testid={dataTestId ? `${dataTestId}-unsaved-badge` : undefined}
          >
            {UNSAVED_CHANGES_TEXT}
          </Badge>
        )}

        {saveSuccess && (
          <Badge
            variant="success"
            size={badgeSize}
            aria-label={SR_SAVE_SUCCESS}
            data-testid={dataTestId ? `${dataTestId}-success-badge` : undefined}
          >
            {SAVE_SUCCESS_TEXT}
          </Badge>
        )}
      </div>
    );
  }
);

ProjectSettingsSelector.displayName = 'ProjectSettingsSelector';

// ============================================================================
// Settings Section Components
// ============================================================================

/**
 * SettingsSection - Card wrapper for grouped settings
 */
export const SettingsSection = forwardRef<HTMLElement, SettingsSectionProps>(
  function SettingsSection(
    {
      title,
      icon: IconComponent,
      description,
      children,
      size = 'md',
      'data-testid': dataTestId,
      className,
      ...props
    },
    ref
  ) {
    const baseSize = getBaseSize(size);
    const headerId = useId();
    const headerPaddingClasses = getResponsiveSizeClasses(size, SECTION_HEADER_PADDING_CLASSES);
    const contentPaddingClasses = getResponsiveSizeClasses(size, SECTION_CONTENT_PADDING_CLASSES);
    const contentGapClasses = getResponsiveSizeClasses(size, SECTION_CONTENT_GAP_CLASSES);
    const iconSize = ICON_SIZE_MAP[baseSize];
    const accessibleLabel = buildSectionAccessibleLabel(title, description);

    return (
      <section
        ref={ref}
        aria-labelledby={headerId}
        data-testid={dataTestId}
        data-size={baseSize}
        className={className}
        {...props}
      >
        <Card className={SECTION_CARD_CLASSES}>
          {/* Header */}
          <div
            className={cn(SECTION_HEADER_CLASSES, headerPaddingClasses)}
            data-testid={dataTestId ? `${dataTestId}-header` : undefined}
          >
            <Flex
              className={SECTION_HEADER_TITLE_CLASSES}
              data-testid={dataTestId ? `${dataTestId}-title-container` : undefined}
            >
              <Icon
                icon={IconComponent}
                size={iconSize}
                className="text-[rgb(var(--primary))]"
                aria-hidden="true"
              />
              <Heading
                id={headerId}
                level={3}
                size="base"
                weight="medium"
                aria-label={accessibleLabel}
              >
                {title}
              </Heading>
            </Flex>
            <Text
              size="xs"
              color="muted-foreground"
              className={SECTION_HEADER_DESC_CLASSES}
              data-testid={dataTestId ? `${dataTestId}-description` : undefined}
            >
              {description}
            </Text>
          </div>

          {/* Content */}
          <div
            className={cn(contentPaddingClasses, contentGapClasses)}
            data-testid={dataTestId ? `${dataTestId}-content` : undefined}
          >
            {children}
          </div>
        </Card>
      </section>
    );
  }
);

SettingsSection.displayName = 'SettingsSection';

/**
 * BasicInfoSection - Basic project information settings
 */
export const BasicInfoSection = forwardRef<HTMLElement, BasicInfoSectionProps>(
  function BasicInfoSection(
    {
      formData,
      gitRepoPath,
      onFormChange,
      size = 'md',
      'data-testid': dataTestId,
      className,
      ...props
    },
    ref
  ) {
    const baseSize = getBaseSize(size);

    return (
      <SettingsSection
        ref={ref}
        title={SECTION_TITLES.basicInfo}
        icon={SECTION_ICONS.basicInfo}
        description={SECTION_DESCRIPTIONS.basicInfo}
        size={size}
        data-testid={dataTestId}
        className={className}
        {...props}
      >
        <div
          className={FORM_GRID_CLASSES}
          data-testid={dataTestId ? `${dataTestId}-name-icon-row` : undefined}
        >
          <FormField
            label="Project Name"
            spacing={baseSize}
            data-testid={dataTestId ? `${dataTestId}-name-field` : undefined}
          >
            <Input
              value={formData.name}
              onChange={onFormChange('name')}
              placeholder="My Project"
              size={baseSize}
              data-testid={dataTestId ? `${dataTestId}-name-input` : undefined}
            />
          </FormField>

          <FormField
            label="Icon"
            spacing={baseSize}
            data-testid={dataTestId ? `${dataTestId}-icon-field` : undefined}
          >
            <Input
              value={formData.icon}
              onChange={onFormChange('icon')}
              placeholder="folder or emoji"
              size={baseSize}
              data-testid={dataTestId ? `${dataTestId}-icon-input` : undefined}
            />
          </FormField>
        </div>

        <FormField
          label="Repository Path"
          spacing={baseSize}
          helperText="Read-only path to the git repository"
          data-testid={dataTestId ? `${dataTestId}-path-field` : undefined}
        >
          <Input
            value={gitRepoPath}
            disabled
            className="opacity-60"
            size={baseSize}
            aria-readonly="true"
            data-testid={dataTestId ? `${dataTestId}-path-input` : undefined}
          />
        </FormField>

        <FormField
          label="Base Branch"
          spacing={baseSize}
          helperText="The main branch used for comparisons and PRs"
          data-testid={dataTestId ? `${dataTestId}-branch-field` : undefined}
        >
          <Input
            value={formData.baseBranch}
            onChange={onFormChange('baseBranch')}
            placeholder="main"
            size={baseSize}
            data-testid={dataTestId ? `${dataTestId}-branch-input` : undefined}
          />
        </FormField>
      </SettingsSection>
    );
  }
);

BasicInfoSection.displayName = 'BasicInfoSection';

/**
 * ScriptsSection - Script configuration settings
 */
export const ScriptsSection = forwardRef<HTMLElement, ScriptsSectionProps>(function ScriptsSection(
  { formData, onFormChange, size = 'md', 'data-testid': dataTestId, className, ...props },
  ref
) {
  const baseSize = getBaseSize(size);

  return (
    <SettingsSection
      ref={ref}
      title={SECTION_TITLES.scripts}
      icon={SECTION_ICONS.scripts}
      description={SECTION_DESCRIPTIONS.scripts}
      size={size}
      data-testid={dataTestId}
      className={className}
      {...props}
    >
      <FormField
        label="Setup Script"
        helperText="Runs when a new chat worktree is created"
        spacing={baseSize}
        data-testid={dataTestId ? `${dataTestId}-setup-field` : undefined}
      >
        <Textarea
          value={formData.setupScript}
          onChange={onFormChange('setupScript')}
          placeholder="pnpm install"
          rows={2}
          size={baseSize}
          data-testid={dataTestId ? `${dataTestId}-setup-input` : undefined}
        />
      </FormField>

      <FormField
        label="Dev Script"
        helperText="Starts the development server"
        spacing={baseSize}
        data-testid={dataTestId ? `${dataTestId}-dev-field` : undefined}
      >
        <Textarea
          value={formData.devScript}
          onChange={onFormChange('devScript')}
          placeholder="pnpm dev"
          rows={2}
          size={baseSize}
          data-testid={dataTestId ? `${dataTestId}-dev-input` : undefined}
        />
      </FormField>

      <FormField
        label="Cleanup Script"
        helperText="Runs before deleting a worktree"
        spacing={baseSize}
        data-testid={dataTestId ? `${dataTestId}-cleanup-field` : undefined}
      >
        <Textarea
          value={formData.cleanupScript}
          onChange={onFormChange('cleanupScript')}
          placeholder="rm -rf node_modules"
          rows={2}
          size={baseSize}
          data-testid={dataTestId ? `${dataTestId}-cleanup-input` : undefined}
        />
      </FormField>
    </SettingsSection>
  );
});

ScriptsSection.displayName = 'ScriptsSection';

/**
 * WorkflowsSection - Workflow template configuration
 */
export const WorkflowsSection = forwardRef<HTMLElement, WorkflowsSectionProps>(
  function WorkflowsSection(
    { formData, onFormChange, size = 'md', 'data-testid': dataTestId, className, ...props },
    ref
  ) {
    const baseSize = getBaseSize(size);

    return (
      <SettingsSection
        ref={ref}
        title={SECTION_TITLES.workflows}
        icon={SECTION_ICONS.workflows}
        description={SECTION_DESCRIPTIONS.workflows}
        size={size}
        data-testid={dataTestId}
        className={className}
        {...props}
      >
        <FormField
          label="Workflows Folder"
          helperText="Path to custom workflow templates"
          spacing={baseSize}
          data-testid={dataTestId ? `${dataTestId}-folder-field` : undefined}
        >
          <Input
            value={formData.workflowsFolder}
            onChange={onFormChange('workflowsFolder')}
            placeholder=".openflow/workflows"
            size={baseSize}
            data-testid={dataTestId ? `${dataTestId}-folder-input` : undefined}
          />
        </FormField>
      </SettingsSection>
    );
  }
);

WorkflowsSection.displayName = 'WorkflowsSection';

/**
 * RulesSection - Rules and context configuration
 */
export const RulesSection = forwardRef<HTMLElement, RulesSectionProps>(function RulesSection(
  { formData, onFormChange, size = 'md', 'data-testid': dataTestId, className, ...props },
  ref
) {
  const baseSize = getBaseSize(size);

  return (
    <SettingsSection
      ref={ref}
      title={SECTION_TITLES.rules}
      icon={SECTION_ICONS.rules}
      description={SECTION_DESCRIPTIONS.rules}
      size={size}
      data-testid={dataTestId}
      className={className}
      {...props}
    >
      <FormField
        label="Rule Folders (JSON array)"
        helperText="Folders containing rule files"
        spacing={baseSize}
        data-testid={dataTestId ? `${dataTestId}-folders-field` : undefined}
      >
        <Input
          value={formData.ruleFolders}
          onChange={onFormChange('ruleFolders')}
          placeholder='[".openflow/rules"]'
          size={baseSize}
          data-testid={dataTestId ? `${dataTestId}-folders-input` : undefined}
        />
      </FormField>

      <FormField
        label="Always Included Rules (JSON array)"
        helperText="Rule files always included in context"
        spacing={baseSize}
        data-testid={dataTestId ? `${dataTestId}-included-field` : undefined}
      >
        <Input
          value={formData.alwaysIncludedRules}
          onChange={onFormChange('alwaysIncludedRules')}
          placeholder='["CLAUDE.md"]'
          size={baseSize}
          data-testid={dataTestId ? `${dataTestId}-included-input` : undefined}
        />
      </FormField>
    </SettingsSection>
  );
});

RulesSection.displayName = 'RulesSection';

/**
 * VerificationSection - Verification configuration
 */
export const VerificationSection = forwardRef<HTMLElement, VerificationSectionProps>(
  function VerificationSection(
    { formData, onFormChange, size = 'md', 'data-testid': dataTestId, className, ...props },
    ref
  ) {
    const baseSize = getBaseSize(size);

    return (
      <SettingsSection
        ref={ref}
        title={SECTION_TITLES.verification}
        icon={SECTION_ICONS.verification}
        description={SECTION_DESCRIPTIONS.verification}
        size={size}
        data-testid={dataTestId}
        className={className}
        {...props}
      >
        <FormField
          label="Verification Config (JSON object)"
          helperText="Commands to verify code quality"
          spacing={baseSize}
          data-testid={dataTestId ? `${dataTestId}-config-field` : undefined}
        >
          <Textarea
            value={formData.verificationConfig}
            onChange={onFormChange('verificationConfig')}
            placeholder='{"typecheck": "pnpm typecheck", "lint": "pnpm lint"}'
            rows={3}
            size={baseSize}
            data-testid={dataTestId ? `${dataTestId}-config-input` : undefined}
          />
        </FormField>
      </SettingsSection>
    );
  }
);

VerificationSection.displayName = 'VerificationSection';

// ============================================================================
// Footer Components
// ============================================================================

/**
 * SaveFooter - Save button with error display
 */
export const SaveFooter = forwardRef<HTMLDivElement, SaveFooterProps>(function SaveFooter(
  {
    isSaving,
    hasChanges,
    saveError,
    onSave,
    size = 'md',
    'data-testid': dataTestId,
    className,
    ...props
  },
  ref
) {
  const baseSize = getBaseSize(size);
  const footerPaddingClasses = getResponsiveSizeClasses(size, FOOTER_PADDING_CLASSES);
  const buttonSize = BUTTON_SIZE_MAP[baseSize];
  const statusAnnouncement = buildStatusAnnouncement(hasChanges, false, isSaving);

  return (
    <div
      ref={ref}
      data-testid={dataTestId}
      data-size={baseSize}
      data-saving={isSaving || undefined}
      data-has-changes={hasChanges || undefined}
      data-has-error={!!saveError || undefined}
      className={cn(FOOTER_CONTAINER_CLASSES, footerPaddingClasses, className)}
      {...props}
    >
      {/* Screen reader announcements */}
      <VisuallyHidden>
        <span role="status" aria-live="polite">
          {statusAnnouncement}
        </span>
      </VisuallyHidden>

      <Button
        variant="primary"
        onClick={onSave}
        loading={isSaving}
        loadingText={DEFAULT_SAVING_TEXT}
        disabled={!hasChanges}
        size={buttonSize}
        icon={<Icon icon={Save} size={ICON_SIZE_MAP[baseSize]} aria-hidden="true" />}
        className="min-h-[44px] sm:min-h-0"
        data-testid={dataTestId ? `${dataTestId}-save-button` : undefined}
      >
        {DEFAULT_SAVE_LABEL}
      </Button>

      {saveError && (
        <Text
          role="alert"
          aria-live="assertive"
          className={SAVE_ERROR_CLASSES}
          data-testid={dataTestId ? `${dataTestId}-error` : undefined}
        >
          {saveError}
        </Text>
      )}
    </div>
  );
});

SaveFooter.displayName = 'SaveFooter';

// ============================================================================
// Composite Components
// ============================================================================

/**
 * ProjectSettingsForm - Complete settings form with all sections
 */
export const ProjectSettingsForm = forwardRef<HTMLFormElement, ProjectSettingsFormProps>(
  function ProjectSettingsForm(
    {
      project,
      formData,
      onFormChange,
      isSaving,
      hasChanges,
      saveError,
      onSave,
      size = 'md',
      'data-testid': dataTestId,
      className,
      ...props
    },
    ref
  ) {
    const baseSize = getBaseSize(size);
    const layoutClasses = getResponsiveSizeClasses(size, PROJECT_SETTINGS_SIZE_CLASSES);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSave();
    };

    return (
      <form
        ref={ref}
        role="form"
        aria-label={SR_FORM_LABEL}
        onSubmit={handleSubmit}
        data-testid={dataTestId}
        data-size={baseSize}
        data-project-id={project.id}
        className={cn(layoutClasses, className)}
        {...props}
      >
        <BasicInfoSection
          formData={formData}
          gitRepoPath={project.gitRepoPath}
          onFormChange={onFormChange}
          size={size}
          data-testid={dataTestId ? `${dataTestId}-basic-info` : undefined}
        />
        <ScriptsSection
          formData={formData}
          onFormChange={onFormChange}
          size={size}
          data-testid={dataTestId ? `${dataTestId}-scripts` : undefined}
        />
        <WorkflowsSection
          formData={formData}
          onFormChange={onFormChange}
          size={size}
          data-testid={dataTestId ? `${dataTestId}-workflows` : undefined}
        />
        <RulesSection
          formData={formData}
          onFormChange={onFormChange}
          size={size}
          data-testid={dataTestId ? `${dataTestId}-rules` : undefined}
        />
        <VerificationSection
          formData={formData}
          onFormChange={onFormChange}
          size={size}
          data-testid={dataTestId ? `${dataTestId}-verification` : undefined}
        />
        <SaveFooter
          isSaving={isSaving}
          hasChanges={hasChanges}
          saveError={saveError}
          onSave={onSave}
          size={size}
          data-testid={dataTestId ? `${dataTestId}-footer` : undefined}
        />
      </form>
    );
  }
);

ProjectSettingsForm.displayName = 'ProjectSettingsForm';

/**
 * ProjectSettingsContent - Handles loading, empty, error, and form states
 */
export const ProjectSettingsContent = forwardRef<HTMLDivElement, ProjectSettingsContentProps>(
  function ProjectSettingsContent(
    {
      project,
      projects,
      formData,
      onFormChange,
      onProjectSelect,
      isLoading = false,
      isSaving,
      hasChanges,
      saveError,
      saveSuccess,
      onSave,
      error,
      onRetry,
      size = 'md',
      'data-testid': dataTestId,
      className,
      ...props
    },
    ref
  ) {
    const baseSize = getBaseSize(size);
    const layoutClasses = getResponsiveSizeClasses(size, PROJECT_SETTINGS_SIZE_CLASSES);

    // Build dropdown options from projects
    const selectorOptions = projects.map((p) => ({
      value: p.id,
      label: p.name,
    }));

    // Loading state
    if (isLoading) {
      return (
        <div ref={ref} data-testid={dataTestId} className={cn(layoutClasses, className)} {...props}>
          <ProjectSettingsLoadingSkeleton
            size={size}
            data-testid={dataTestId ? `${dataTestId}-loading` : undefined}
          />
        </div>
      );
    }

    // Error state
    if (error) {
      return (
        <div ref={ref} data-testid={dataTestId} className={cn(layoutClasses, className)} {...props}>
          <ProjectSettingsErrorState
            error={error}
            onRetry={onRetry}
            size={size}
            data-testid={dataTestId ? `${dataTestId}-error` : undefined}
          />
        </div>
      );
    }

    // Empty state (no projects)
    if (projects.length === 0) {
      return (
        <div ref={ref} data-testid={dataTestId} className={cn(layoutClasses, className)} {...props}>
          <ProjectSettingsEmptyState
            size={size}
            data-testid={dataTestId ? `${dataTestId}-empty` : undefined}
          />
        </div>
      );
    }

    // Selector and form
    return (
      <div
        ref={ref}
        data-testid={dataTestId}
        data-size={baseSize}
        className={cn(layoutClasses, className)}
        {...props}
      >
        {/* Project selector */}
        <ProjectSettingsSelector
          options={selectorOptions}
          selectedProjectId={project?.id ?? null}
          onSelect={onProjectSelect}
          hasChanges={hasChanges}
          saveSuccess={saveSuccess}
          size={size}
          data-testid={dataTestId ? `${dataTestId}-selector` : undefined}
        />

        {/* Form (only show if project selected) */}
        {project && (
          <ProjectSettingsForm
            project={project}
            formData={formData}
            onFormChange={onFormChange}
            isSaving={isSaving}
            hasChanges={hasChanges}
            saveError={saveError}
            onSave={onSave}
            size={size}
            data-testid={dataTestId ? `${dataTestId}-form` : undefined}
          />
        )}
      </div>
    );
  }
);

ProjectSettingsContent.displayName = 'ProjectSettingsContent';
