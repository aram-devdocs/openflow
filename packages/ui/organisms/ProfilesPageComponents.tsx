/**
 * ProfilesPageComponents - Stateless UI components for the Executor Profiles Settings page
 *
 * These components are pure functions of their props, receiving data and callbacks
 * from the useProfilesSession hook. They render UI and call callbacks on user interaction.
 *
 * Accessibility features:
 * - All components use forwardRef for programmatic access
 * - ResponsiveValue<ProfilesSize> for responsive sizing
 * - Proper ARIA attributes (role, aria-label, aria-labelledby, aria-describedby)
 * - Screen reader announcements via VisuallyHidden
 * - Touch targets ≥44px (WCAG 2.5.5)
 * - Focus management and keyboard navigation
 * - Loading, empty, and error states with proper semantics
 */

import type { ExecutorProfile } from '@openflow/generated';
import {
  Box,
  Flex,
  Heading,
  List,
  ListItem,
  type ResponsiveValue,
  Text,
  VisuallyHidden,
} from '@openflow/primitives';
import { cn } from '@openflow/utils';
import { AlertCircle, Check, Pencil, Plus, Star, Terminal, Trash2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { type HTMLAttributes, type ReactNode, forwardRef, useId } from 'react';
import { Badge } from '../atoms/Badge';
import { Button } from '../atoms/Button';
import { Checkbox } from '../atoms/Checkbox';
import { Icon } from '../atoms/Icon';
import { Input } from '../atoms/Input';
import { Label } from '../atoms/Label';
import { Textarea } from '../atoms/Textarea';
import { Card } from '../molecules/Card';
import { Dialog } from '../molecules/Dialog';
import { EmptyState } from '../molecules/EmptyState';
import { FormField } from '../molecules/FormField';
import { SkeletonCard } from '../molecules/SkeletonCard';
import { ConfirmDialog, type ConfirmDialogProps } from './ConfirmDialog';

// ============================================================================
// Types
// ============================================================================

export type ProfilesSize = 'sm' | 'md' | 'lg';
export type ProfilesBreakpoint = 'base' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

/** Form data for creating/editing executor profiles */
export interface ProfileFormData {
  name: string;
  command: string;
  args: string;
  env: string;
  description: string;
  isDefault: boolean;
}

/** Props for ProfilesPageLayout component */
export interface ProfilesPageLayoutProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Description text for the page */
  description: string;
  /** Callback for create button click */
  onCreateClick: () => void;
  /** Main content */
  children: ReactNode;
  /** Accessible label for the page */
  'aria-label'?: string;
  /** Responsive size */
  size?: ResponsiveValue<ProfilesSize>;
  /** Test ID for automated testing */
  'data-testid'?: string;
}

/** Props for ProfilesLoadingSkeleton component */
export interface ProfilesLoadingSkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /** Number of skeleton cards to show */
  count?: number;
  /** Responsive size */
  size?: ResponsiveValue<ProfilesSize>;
  /** Test ID for automated testing */
  'data-testid'?: string;
}

/** Props for ProfilesEmptyState component */
export interface ProfilesEmptyStateProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Callback for create button click */
  onCreateClick: () => void;
  /** Responsive size */
  size?: ResponsiveValue<ProfilesSize>;
  /** Test ID for automated testing */
  'data-testid'?: string;
}

/** Props for ProfilesErrorState component */
export interface ProfilesErrorStateProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Error message to display */
  error: string;
  /** Callback for retry button click */
  onRetry?: () => void;
  /** Responsive size */
  size?: ResponsiveValue<ProfilesSize>;
  /** Test ID for automated testing */
  'data-testid'?: string;
}

/** Props for ProfilesList component */
export interface ProfilesListProps extends HTMLAttributes<HTMLUListElement> {
  /** Profiles to display */
  profiles: ExecutorProfile[];
  /** Callback when edit is clicked */
  onEdit: (profile: ExecutorProfile) => void;
  /** Callback when delete is clicked */
  onDelete: (profile: ExecutorProfile) => void;
  /** Callback when set default is clicked */
  onSetDefault: (profile: ExecutorProfile) => void;
  /** Responsive size */
  size?: ResponsiveValue<ProfilesSize>;
  /** Accessible label for the list */
  'aria-label'?: string;
  /** Test ID for automated testing */
  'data-testid'?: string;
}

/** Props for ProfileCard component */
export interface ProfileCardProps extends HTMLAttributes<HTMLLIElement> {
  /** Profile data */
  profile: ExecutorProfile;
  /** Callback when edit is clicked */
  onEdit: () => void;
  /** Callback when delete is clicked */
  onDelete: () => void;
  /** Callback when set default is clicked */
  onSetDefault: () => void;
  /** Responsive size */
  size?: ResponsiveValue<ProfilesSize>;
  /** Accessible label for edit button */
  editLabel?: string;
  /** Accessible label for delete button */
  deleteLabel?: string;
  /** Accessible label for set default button */
  setDefaultLabel?: string;
  /** Test ID for automated testing */
  'data-testid'?: string;
}

/** Props for ProfileFormDialog component */
export interface ProfileFormDialogProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Whether dialog is open */
  isOpen: boolean;
  /** Callback to close dialog */
  onClose: () => void;
  /** Dialog title */
  title: string;
  /** Current form data */
  formData: ProfileFormData;
  /** Callback when form field changes */
  onFormChange: (field: keyof ProfileFormData, value: string | boolean) => void;
  /** Callback to submit form */
  onSubmit: () => void;
  /** Whether submit is pending */
  isPending: boolean;
  /** Error message if any */
  error: string | null;
  /** Submit button text */
  submitLabel: string;
  /** Loading text */
  loadingText: string;
  /** Responsive size */
  size?: ResponsiveValue<ProfilesSize>;
  /** Test ID for automated testing */
  'data-testid'?: string;
}

/** Props for ProfilesConfirmDialog component */
export interface ProfilesConfirmDialogProps extends ConfirmDialogProps {}

/** Props for ProfilesContent component */
export interface ProfilesContentProps extends HTMLAttributes<HTMLDivElement> {
  /** Profiles to display */
  profiles: ExecutorProfile[];
  /** Callback for create button click (in empty state) */
  onCreateClick: () => void;
  /** Callback when edit is clicked */
  onEdit: (profile: ExecutorProfile) => void;
  /** Callback when delete is clicked */
  onDelete: (profile: ExecutorProfile) => void;
  /** Callback when set default is clicked */
  onSetDefault: (profile: ExecutorProfile) => void;
  /** Whether data is loading */
  isLoading?: boolean;
  /** Error message if any */
  error?: string | null;
  /** Callback for retry on error */
  onRetry?: () => void;
  /** Responsive size */
  size?: ResponsiveValue<ProfilesSize>;
  /** Test ID for automated testing */
  'data-testid'?: string;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Breakpoint order for responsive class generation
 */
const BREAKPOINT_ORDER: readonly ProfilesBreakpoint[] = ['base', 'sm', 'md', 'lg', 'xl', '2xl'];

/**
 * Default skeleton card count
 */
export const DEFAULT_SKELETON_COUNT = 4;

/**
 * Default label for page region
 */
export const DEFAULT_PAGE_LABEL = 'Executor Profiles Settings';

/**
 * Default label for profiles list
 */
export const DEFAULT_LIST_LABEL = 'Executor profiles';

/**
 * Default label for create button
 */
export const DEFAULT_CREATE_LABEL = 'New Profile';

/**
 * Default label for edit button
 */
export const DEFAULT_EDIT_LABEL = 'Edit profile';

/**
 * Default label for delete button
 */
export const DEFAULT_DELETE_LABEL = 'Delete profile';

/**
 * Default label for set default button
 */
export const DEFAULT_SET_DEFAULT_LABEL = 'Set as default';

/**
 * Default empty state title
 */
export const DEFAULT_EMPTY_TITLE = 'No executor profiles';

/**
 * Default empty state description
 */
export const DEFAULT_EMPTY_DESCRIPTION = 'Create your first profile to start using AI CLI tools.';

/**
 * Default error state title
 */
export const DEFAULT_ERROR_TITLE = 'Failed to load profiles';

/**
 * Default retry button label
 */
export const DEFAULT_RETRY_LABEL = 'Try again';

/**
 * Screen reader announcement for loading state
 */
export const SR_LOADING = 'Loading executor profiles...';

/**
 * Screen reader announcement for loaded state
 */
export const SR_PROFILES_LOADED = 'profiles loaded';

/**
 * Screen reader announcement for empty state
 */
export const SR_EMPTY = 'No executor profiles. Create one to get started.';

/**
 * Screen reader announcement for default badge
 */
export const SR_DEFAULT_BADGE = 'Default profile';

/**
 * Screen reader announcement when profile is set as default
 */
export const SR_SET_AS_DEFAULT = 'Set as default profile';

/**
 * Screen reader prefix for profile cards
 */
export const SR_PROFILE_PREFIX = 'Executor profile:';

/**
 * Size class mappings for spacing
 */
export const PROFILES_SIZE_CLASSES: Record<ProfilesSize, string> = {
  sm: 'gap-3',
  md: 'gap-4',
  lg: 'gap-6',
};

/**
 * Grid size classes
 */
export const PROFILES_GRID_CLASSES: Record<ProfilesSize, string> = {
  sm: 'gap-3 sm:grid-cols-2',
  md: 'gap-4 sm:grid-cols-2',
  lg: 'gap-6 sm:grid-cols-2 lg:grid-cols-3',
};

/**
 * Card padding classes
 */
export const PROFILE_CARD_PADDING_CLASSES: Record<ProfilesSize, string> = {
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
};

/**
 * Action button size mapping
 */
export const ACTION_BUTTON_SIZE_MAP: Record<ProfilesSize, 'sm' | 'md' | 'lg'> = {
  sm: 'sm',
  md: 'sm',
  lg: 'md',
};

/**
 * Icon size mapping for action buttons
 */
export const ACTION_ICON_SIZE_MAP: Record<ProfilesSize, 'xs' | 'sm' | 'md'> = {
  sm: 'xs',
  md: 'sm',
  lg: 'sm',
};

/**
 * Layout base classes
 */
export const PROFILES_LAYOUT_BASE_CLASSES = 'space-y-6';

/**
 * Header container classes
 */
export const PROFILES_HEADER_CLASSES = 'flex items-center justify-between';

/**
 * Description text classes
 */
export const PROFILES_DESCRIPTION_CLASSES = 'text-sm text-[rgb(var(--muted-foreground))]';

/**
 * Profile card container classes
 */
export const PROFILE_CARD_CONTAINER_CLASSES = 'flex items-start justify-between';

/**
 * Profile card title classes
 */
export const PROFILE_CARD_TITLE_CLASSES = 'font-medium text-[rgb(var(--foreground))]';

/**
 * Profile card command classes
 */
export const PROFILE_CARD_COMMAND_CLASSES =
  'mt-1 block text-xs text-[rgb(var(--muted-foreground))]';

/**
 * Profile card description classes
 */
export const PROFILE_CARD_DESC_CLASSES = 'mt-2 text-sm text-[rgb(var(--muted-foreground))]';

/**
 * Action buttons container classes
 */
export const PROFILE_CARD_ACTIONS_CLASSES = 'flex items-center gap-1';

/**
 * Individual action button classes
 */
export const PROFILE_ACTION_BUTTON_CLASSES = [
  'rounded p-1.5',
  'min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 sm:h-8 sm:w-8',
  'text-[rgb(var(--muted-foreground))]',
  'hover:bg-[rgb(var(--muted))] hover:text-[rgb(var(--foreground))]',
  'focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))] focus-visible:ring-offset-2',
  'motion-safe:transition-colors',
].join(' ');

/**
 * Destructive action button classes
 */
export const PROFILE_DELETE_BUTTON_CLASSES = [
  'rounded p-1.5',
  'min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 sm:h-8 sm:w-8',
  'text-[rgb(var(--muted-foreground))]',
  'hover:bg-[rgb(var(--destructive))]/10 hover:text-[rgb(var(--destructive))]',
  'focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))] focus-visible:ring-offset-2',
  'motion-safe:transition-colors',
].join(' ');

/**
 * Error state container classes
 */
export const PROFILES_ERROR_CLASSES = [
  'flex flex-col items-center justify-center',
  'rounded-lg border border-dashed border-[rgb(var(--destructive))]/30',
  'py-12 px-4 text-center',
].join(' ');

/**
 * Error icon container classes
 */
export const PROFILES_ERROR_ICON_CLASSES =
  'flex h-12 w-12 items-center justify-center rounded-full bg-[rgb(var(--destructive))]/10 mb-4';

/**
 * Skeleton container base classes
 */
export const PROFILES_SKELETON_CONTAINER_CLASSES = 'grid';

/**
 * Form field gap classes
 */
export const FORM_FIELD_GAP_CLASSES: Record<ProfilesSize, string> = {
  sm: 'space-y-3',
  md: 'space-y-4',
  lg: 'space-y-5',
};

/**
 * Form footer classes
 */
export const FORM_FOOTER_CLASSES = 'flex flex-col gap-2 pt-4 sm:flex-row sm:justify-end';

/**
 * Checkbox container classes
 */
export const FORM_CHECKBOX_CONTAINER_CLASSES = 'flex items-center gap-2';

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get the base size from a responsive value
 */
export function getBaseSize(size: ResponsiveValue<ProfilesSize> | undefined): ProfilesSize {
  if (size === undefined) {
    return 'md';
  }

  if (typeof size === 'string') {
    return size;
  }

  if (typeof size === 'object' && size !== null) {
    const sizeObj = size as Partial<Record<ProfilesBreakpoint, ProfilesSize>>;
    return sizeObj.base ?? 'md';
  }

  return 'md';
}

/**
 * Generate responsive size classes from ProfilesSize value
 */
export function getResponsiveSizeClasses(
  size: ResponsiveValue<ProfilesSize> | undefined,
  classMap: Record<ProfilesSize, string>
): string {
  if (size === undefined) {
    return classMap.md;
  }

  if (typeof size === 'string') {
    return classMap[size];
  }

  if (typeof size === 'object' && size !== null) {
    const classes: string[] = [];
    const sizeObj = size as Partial<Record<ProfilesBreakpoint, ProfilesSize>>;

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
 * Build accessible label for a profile card
 */
export function buildProfileAccessibleLabel(profile: ExecutorProfile): string {
  const parts: string[] = [SR_PROFILE_PREFIX, profile.name];

  if (profile.isDefault) {
    parts.push('(Default)');
  }

  if (profile.command) {
    parts.push(`Command: ${profile.command}`);
  }

  if (profile.description) {
    parts.push(profile.description);
  }

  return parts.join(' ');
}

/**
 * Build screen reader announcement for profiles count
 */
export function buildProfilesCountAnnouncement(count: number): string {
  if (count === 0) {
    return SR_EMPTY;
  }
  return `${count} ${SR_PROFILES_LOADED}`;
}

/**
 * Get icon for a profile (placeholder for future icon support)
 */
export function getProfileIcon(_profile: ExecutorProfile): LucideIcon {
  return Terminal;
}

// ============================================================================
// Layout Components
// ============================================================================

/**
 * ProfilesPageLayout - Main layout for the profiles settings page
 */
export const ProfilesPageLayout = forwardRef<HTMLDivElement, ProfilesPageLayoutProps>(
  function ProfilesPageLayout(
    {
      description,
      onCreateClick,
      children,
      size = 'md',
      'aria-label': ariaLabel = DEFAULT_PAGE_LABEL,
      'data-testid': dataTestId,
      className,
      ...props
    },
    ref
  ) {
    const id = useId();
    const descId = `${id}-desc`;
    const baseSize = getBaseSize(size);

    return (
      <Box
        ref={ref}
        role="region"
        aria-label={ariaLabel}
        aria-describedby={descId}
        data-testid={dataTestId}
        data-size={baseSize}
        className={cn(PROFILES_LAYOUT_BASE_CLASSES, className)}
        {...props}
      >
        {/* Header with create button */}
        <Box
          className={PROFILES_HEADER_CLASSES}
          data-testid={dataTestId ? `${dataTestId}-header` : undefined}
        >
          <Text
            id={descId}
            size="sm"
            color="muted-foreground"
            className={PROFILES_DESCRIPTION_CLASSES}
          >
            {description}
          </Text>
          <Button
            variant="primary"
            size={ACTION_BUTTON_SIZE_MAP[baseSize]}
            onClick={onCreateClick}
            icon={<Plus aria-hidden={true} />}
            data-testid={dataTestId ? `${dataTestId}-create` : undefined}
          >
            {DEFAULT_CREATE_LABEL}
          </Button>
        </Box>

        {children}
      </Box>
    );
  }
);

ProfilesPageLayout.displayName = 'ProfilesPageLayout';

// ============================================================================
// State Components
// ============================================================================

/**
 * ProfilesLoadingSkeleton - Loading state for profiles list
 */
export const ProfilesLoadingSkeleton = forwardRef<HTMLDivElement, ProfilesLoadingSkeletonProps>(
  function ProfilesLoadingSkeleton(
    { count = DEFAULT_SKELETON_COUNT, size = 'md', 'data-testid': dataTestId, className, ...props },
    ref
  ) {
    const baseSize = getBaseSize(size);
    const gridClasses = getResponsiveSizeClasses(size, PROFILES_GRID_CLASSES);

    return (
      <Box
        ref={ref}
        role="status"
        aria-label={SR_LOADING}
        aria-busy={true}
        data-testid={dataTestId}
        data-count={count}
        data-size={baseSize}
        className={cn(PROFILES_SKELETON_CONTAINER_CLASSES, gridClasses, className)}
        {...props}
      >
        <VisuallyHidden>
          <Text as="span" aria-live="polite">
            {SR_LOADING}
          </Text>
        </VisuallyHidden>
        {Array.from({ length: count }).map((_, i) => (
          <SkeletonCard
            key={`skeleton-profile-${i}`}
            showActions
            size={baseSize}
            data-testid={dataTestId ? `${dataTestId}-item-${i}` : undefined}
          />
        ))}
      </Box>
    );
  }
);

ProfilesLoadingSkeleton.displayName = 'ProfilesLoadingSkeleton';

/**
 * ProfilesEmptyState - Empty state when no profiles exist
 */
export const ProfilesEmptyState = forwardRef<HTMLDivElement, ProfilesEmptyStateProps>(
  function ProfilesEmptyState(
    { onCreateClick, size = 'md', 'data-testid': dataTestId, className, ...props },
    ref
  ) {
    const baseSize = getBaseSize(size);

    return (
      <EmptyState
        ref={ref}
        icon={Terminal}
        title={DEFAULT_EMPTY_TITLE}
        description={DEFAULT_EMPTY_DESCRIPTION}
        action={{
          label: 'Create Profile',
          onClick: onCreateClick,
        }}
        size={baseSize}
        aria-label={SR_EMPTY}
        data-testid={dataTestId}
        className={className}
        {...props}
      />
    );
  }
);

ProfilesEmptyState.displayName = 'ProfilesEmptyState';

/**
 * ProfilesErrorState - Error state when loading fails
 */
export const ProfilesErrorState = forwardRef<HTMLDivElement, ProfilesErrorStateProps>(
  function ProfilesErrorState(
    { error, onRetry, size = 'md', 'data-testid': dataTestId, className, ...props },
    ref
  ) {
    const baseSize = getBaseSize(size);

    return (
      <Box
        ref={ref}
        role="alert"
        aria-live="assertive"
        data-testid={dataTestId}
        data-size={baseSize}
        className={cn(PROFILES_ERROR_CLASSES, className)}
        {...props}
      >
        <VisuallyHidden>
          <Text as="span">Error: {error}</Text>
        </VisuallyHidden>
        <Box
          className={PROFILES_ERROR_ICON_CLASSES}
          aria-hidden={true}
          data-testid={dataTestId ? `${dataTestId}-icon` : undefined}
        >
          <Icon icon={AlertCircle} size="lg" className="text-[rgb(var(--destructive))]" />
        </Box>
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
            size={ACTION_BUTTON_SIZE_MAP[baseSize]}
            onClick={onRetry}
            data-testid={dataTestId ? `${dataTestId}-retry` : undefined}
          >
            {DEFAULT_RETRY_LABEL}
          </Button>
        )}
      </Box>
    );
  }
);

ProfilesErrorState.displayName = 'ProfilesErrorState';

// ============================================================================
// Content Components
// ============================================================================

/**
 * ProfilesList - Grid of profile cards
 */
export const ProfilesList = forwardRef<HTMLUListElement, ProfilesListProps>(function ProfilesList(
  {
    profiles,
    onEdit,
    onDelete,
    onSetDefault,
    size = 'md',
    'aria-label': ariaLabel = DEFAULT_LIST_LABEL,
    'data-testid': dataTestId,
    className,
    ...props
  },
  ref
) {
  const baseSize = getBaseSize(size);
  const gridClasses = getResponsiveSizeClasses(size, PROFILES_GRID_CLASSES);

  return (
    <List
      ref={ref}
      aria-label={ariaLabel}
      data-testid={dataTestId}
      data-count={profiles.length}
      data-size={baseSize}
      className={cn('grid', gridClasses, className)}
      {...props}
    >
      <VisuallyHidden>
        <Text as="span" role="status" aria-live="polite">
          {buildProfilesCountAnnouncement(profiles.length)}
        </Text>
      </VisuallyHidden>
      {profiles.map((profile) => (
        <ProfileCard
          key={profile.id}
          profile={profile}
          onEdit={() => onEdit(profile)}
          onDelete={() => onDelete(profile)}
          onSetDefault={() => onSetDefault(profile)}
          size={size}
          data-testid={dataTestId ? `${dataTestId}-item-${profile.id}` : undefined}
        />
      ))}
    </List>
  );
});

ProfilesList.displayName = 'ProfilesList';

/**
 * ProfileCard - Individual profile card with actions
 */
export const ProfileCard = forwardRef<HTMLLIElement, ProfileCardProps>(function ProfileCard(
  {
    profile,
    onEdit,
    onDelete,
    onSetDefault,
    size = 'md',
    editLabel = DEFAULT_EDIT_LABEL,
    deleteLabel = DEFAULT_DELETE_LABEL,
    setDefaultLabel = DEFAULT_SET_DEFAULT_LABEL,
    'data-testid': dataTestId,
    className,
    ...props
  },
  ref
) {
  const baseSize = getBaseSize(size);
  const paddingClasses = getResponsiveSizeClasses(size, PROFILE_CARD_PADDING_CLASSES);
  const iconSize = ACTION_ICON_SIZE_MAP[baseSize];
  const accessibleLabel = buildProfileAccessibleLabel(profile);
  const ProfileIcon = getProfileIcon(profile);

  return (
    <ListItem
      ref={ref}
      aria-label={accessibleLabel}
      data-testid={dataTestId}
      data-profile-id={profile.id}
      data-is-default={profile.isDefault || undefined}
      data-size={baseSize}
      className={cn('relative', className)}
      {...props}
    >
      <Card className="relative h-full">
        <Box
          className={cn(PROFILE_CARD_CONTAINER_CLASSES, paddingClasses)}
          data-testid={dataTestId ? `${dataTestId}-content` : undefined}
        >
          <Box className="flex-1 min-w-0">
            <Flex gap="2" align="center">
              <Icon
                icon={ProfileIcon}
                size={iconSize}
                className="text-[rgb(var(--primary))] shrink-0"
                aria-hidden={true}
              />
              <Text
                as="span"
                weight="medium"
                className={cn(PROFILE_CARD_TITLE_CLASSES, 'truncate')}
              >
                {profile.name}
              </Text>
              {profile.isDefault && (
                <Badge
                  variant="success"
                  size="sm"
                  icon={<Star aria-hidden={true} />}
                  aria-label={SR_DEFAULT_BADGE}
                >
                  Default
                </Badge>
              )}
            </Flex>

            <Text
              as="code"
              className={PROFILE_CARD_COMMAND_CLASSES}
              data-testid={dataTestId ? `${dataTestId}-command` : undefined}
            >
              {profile.command}
              {profile.args && ` ${profile.args}`}
            </Text>

            {profile.description && (
              <Text
                as="p"
                size="sm"
                color="muted-foreground"
                className={PROFILE_CARD_DESC_CLASSES}
                data-testid={dataTestId ? `${dataTestId}-description` : undefined}
              >
                {profile.description}
              </Text>
            )}
          </Box>

          {/* Actions */}
          <Box
            as="nav"
            className={PROFILE_CARD_ACTIONS_CLASSES}
            aria-label={`Actions for ${profile.name}`}
            data-testid={dataTestId ? `${dataTestId}-actions` : undefined}
          >
            {!profile.isDefault && (
              <Box
                as="button"
                type="button"
                onClick={onSetDefault}
                className={PROFILE_ACTION_BUTTON_CLASSES}
                aria-label={`${setDefaultLabel}: ${profile.name}`}
                data-testid={dataTestId ? `${dataTestId}-set-default` : undefined}
              >
                <Icon icon={Check} size={iconSize} />
              </Box>
            )}
            <Box
              as="button"
              type="button"
              onClick={onEdit}
              className={PROFILE_ACTION_BUTTON_CLASSES}
              aria-label={`${editLabel}: ${profile.name}`}
              data-testid={dataTestId ? `${dataTestId}-edit` : undefined}
            >
              <Icon icon={Pencil} size={iconSize} />
            </Box>
            <Box
              as="button"
              type="button"
              onClick={onDelete}
              className={PROFILE_DELETE_BUTTON_CLASSES}
              aria-label={`${deleteLabel}: ${profile.name}`}
              data-testid={dataTestId ? `${dataTestId}-delete` : undefined}
            >
              <Icon icon={Trash2} size={iconSize} />
            </Box>
          </Box>
        </Box>
      </Card>
    </ListItem>
  );
});

ProfileCard.displayName = 'ProfileCard';

// ============================================================================
// Dialog Components
// ============================================================================

/**
 * ProfileFormDialog - Dialog for creating/editing profiles
 */
export const ProfileFormDialog = forwardRef<HTMLDivElement, ProfileFormDialogProps>(
  function ProfileFormDialog(
    {
      isOpen,
      onClose,
      title,
      formData,
      onFormChange,
      onSubmit,
      isPending,
      error,
      submitLabel,
      loadingText,
      size = 'md',
      'data-testid': dataTestId,
      className,
      ...props
    },
    ref
  ) {
    const baseSize = getBaseSize(size);
    const fieldId = useId();
    const formGapClasses = getResponsiveSizeClasses(size, FORM_FIELD_GAP_CLASSES);
    const defaultCheckboxId = `${fieldId}-default`;
    const nameFieldId = `${fieldId}-name`;
    const commandFieldId = `${fieldId}-command`;

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit();
    };

    return (
      <Dialog
        ref={ref}
        isOpen={isOpen}
        onClose={onClose}
        title={title}
        size="md"
        data-testid={dataTestId}
        className={className}
        {...props}
      >
        <VisuallyHidden>
          <Text as="span" role="status" aria-live="polite">
            {isPending ? loadingText : ''}
          </Text>
        </VisuallyHidden>

        <form
          onSubmit={handleSubmit}
          aria-label={title}
          className={formGapClasses}
          data-testid={dataTestId ? `${dataTestId}-form` : undefined}
        >
          <FormField
            label="Profile Name"
            required
            spacing={baseSize}
            {...(!formData.name.trim() && error ? { error: 'Required' } : {})}
          >
            <Input
              id={nameFieldId}
              value={formData.name}
              onChange={(e) => onFormChange('name', e.target.value)}
              placeholder="Claude Code"
              size={baseSize}
              aria-required="true"
              aria-invalid={!formData.name.trim() && !!error}
              data-testid={dataTestId ? `${dataTestId}-name` : undefined}
            />
          </FormField>

          <FormField
            label="Command"
            required
            spacing={baseSize}
            {...(!formData.command.trim() && error ? { error: 'Required' } : {})}
          >
            <Input
              id={commandFieldId}
              value={formData.command}
              onChange={(e) => onFormChange('command', e.target.value)}
              placeholder="claude"
              size={baseSize}
              aria-required="true"
              aria-invalid={!formData.command.trim() && !!error}
              data-testid={dataTestId ? `${dataTestId}-command` : undefined}
            />
          </FormField>

          <FormField label="Arguments (JSON array)" spacing={baseSize}>
            <Input
              value={formData.args}
              onChange={(e) => onFormChange('args', e.target.value)}
              placeholder='["--dangerously-skip-permissions"]'
              size={baseSize}
              data-testid={dataTestId ? `${dataTestId}-args` : undefined}
            />
          </FormField>

          <FormField label="Environment Variables (JSON object)" spacing={baseSize}>
            <Input
              value={formData.env}
              onChange={(e) => onFormChange('env', e.target.value)}
              placeholder='{"ANTHROPIC_API_KEY": "sk-..."}'
              size={baseSize}
              data-testid={dataTestId ? `${dataTestId}-env` : undefined}
            />
          </FormField>

          <FormField label="Description" spacing={baseSize}>
            <Textarea
              value={formData.description}
              onChange={(e) => onFormChange('description', e.target.value)}
              placeholder="Describe what this profile is used for..."
              rows={3}
              size={baseSize}
              data-testid={dataTestId ? `${dataTestId}-description` : undefined}
            />
          </FormField>

          <Box
            className={FORM_CHECKBOX_CONTAINER_CLASSES}
            data-testid={dataTestId ? `${dataTestId}-default-container` : undefined}
          >
            <Checkbox
              id={defaultCheckboxId}
              checked={formData.isDefault}
              onChange={(e) => onFormChange('isDefault', e.target.checked)}
              size={baseSize}
              data-testid={dataTestId ? `${dataTestId}-default-checkbox` : undefined}
            />
            <Label htmlFor={defaultCheckboxId} size="sm">
              Set as default profile
            </Label>
          </Box>

          {error && (
            <Text
              size="sm"
              color="destructive"
              role="alert"
              aria-live="assertive"
              data-testid={dataTestId ? `${dataTestId}-error` : undefined}
            >
              {error}
            </Text>
          )}

          <Box
            className={FORM_FOOTER_CLASSES}
            data-testid={dataTestId ? `${dataTestId}-footer` : undefined}
          >
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isPending}
              size={ACTION_BUTTON_SIZE_MAP[baseSize]}
              data-testid={dataTestId ? `${dataTestId}-cancel` : undefined}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={isPending}
              loadingText={loadingText}
              size={ACTION_BUTTON_SIZE_MAP[baseSize]}
              data-testid={dataTestId ? `${dataTestId}-submit` : undefined}
            >
              {submitLabel}
            </Button>
          </Box>
        </form>
      </Dialog>
    );
  }
);

ProfileFormDialog.displayName = 'ProfileFormDialog';

/**
 * ProfilesConfirmDialog - Confirm dialog for delete action
 */
export const ProfilesConfirmDialog = forwardRef<HTMLDivElement, ProfilesConfirmDialogProps>(
  function ProfilesConfirmDialog(props, ref) {
    return <ConfirmDialog ref={ref} {...props} />;
  }
);

ProfilesConfirmDialog.displayName = 'ProfilesConfirmDialog';

// ============================================================================
// Profiles Content (handles loading/empty/error/list states)
// ============================================================================

/**
 * ProfilesContent - Handles loading, empty, error, and list states
 */
export const ProfilesContent = forwardRef<HTMLDivElement, ProfilesContentProps>(
  function ProfilesContent(
    {
      profiles,
      onCreateClick,
      onEdit,
      onDelete,
      onSetDefault,
      isLoading = false,
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

    // Loading state
    if (isLoading) {
      return (
        <ProfilesLoadingSkeleton
          ref={ref}
          size={size}
          data-testid={dataTestId ? `${dataTestId}-loading` : dataTestId}
          className={className}
          {...props}
        />
      );
    }

    // Error state
    if (error) {
      return (
        <ProfilesErrorState
          ref={ref}
          error={error}
          onRetry={onRetry}
          size={size}
          data-testid={dataTestId ? `${dataTestId}-error` : dataTestId}
          className={className}
          {...props}
        />
      );
    }

    // Empty state
    if (profiles.length === 0) {
      return (
        <ProfilesEmptyState
          ref={ref}
          onCreateClick={onCreateClick}
          size={size}
          data-testid={dataTestId ? `${dataTestId}-empty` : dataTestId}
          className={className}
          {...props}
        />
      );
    }

    // List state
    return (
      <Box ref={ref} data-testid={dataTestId} data-size={baseSize} className={className} {...props}>
        <ProfilesList
          profiles={profiles}
          onEdit={onEdit}
          onDelete={onDelete}
          onSetDefault={onSetDefault}
          size={size}
          data-testid={dataTestId ? `${dataTestId}-list` : undefined}
        />
      </Box>
    );
  }
);

ProfilesContent.displayName = 'ProfilesContent';
