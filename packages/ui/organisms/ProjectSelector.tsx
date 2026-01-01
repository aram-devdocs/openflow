import type { Project } from '@openflow/generated';
import { VisuallyHidden } from '@openflow/primitives';
import { cn } from '@openflow/utils';
import {
  Check,
  ChevronDown,
  Folder,
  FolderCode,
  FolderGit2,
  FolderKanban,
  FolderOpen,
  type LucideIcon,
  Plus,
} from 'lucide-react';
import { forwardRef, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Icon } from '../atoms/Icon';
import { Skeleton } from '../atoms/Skeleton';

// ============================================================================
// Types
// ============================================================================

/** Breakpoint names for responsive values */
export type ProjectSelectorBreakpoint = 'base' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

/** Size variants for the project selector */
export type ProjectSelectorSize = 'sm' | 'md' | 'lg';

/** Responsive value type supporting breakpoints */
export type ResponsiveValue<T> = T | Partial<Record<ProjectSelectorBreakpoint, T>>;

export interface ProjectSelectorProps {
  /** Array of projects to display */
  projects: Project[];
  /** ID of the currently selected project */
  selectedProjectId?: string;
  /** Callback when a project is selected */
  onSelectProject?: (projectId: string) => void;
  /** Callback when the "New Project" button is clicked */
  onNewProject?: () => void;
  /** Whether the selector is disabled */
  disabled?: boolean;
  /** Placeholder text when no project is selected */
  placeholder?: string;
  /** Size variant - supports responsive values */
  size?: ResponsiveValue<ProjectSelectorSize>;
  /** Additional CSS classes */
  className?: string;
  /** Accessible label for the combobox */
  'aria-label'?: string;
  /** ID for aria-describedby */
  'aria-describedby'?: string;
  /** Test ID for automated testing */
  'data-testid'?: string;
}

export interface ProjectSelectorSkeletonProps {
  /** Size variant - supports responsive values */
  size?: ResponsiveValue<ProjectSelectorSize>;
  /** Additional CSS classes */
  className?: string;
  /** Test ID for automated testing */
  'data-testid'?: string;
}

// ============================================================================
// Constants
// ============================================================================

/** Map of project icon names to Lucide icons */
export const PROJECT_ICON_MAP: Record<string, LucideIcon> = {
  folder: Folder,
  'folder-git': FolderGit2,
  'folder-code': FolderCode,
  'folder-kanban': FolderKanban,
  'folder-open': FolderOpen,
};

// Default labels
export const DEFAULT_PLACEHOLDER = 'Select a project...';
export const DEFAULT_ARIA_LABEL = 'Select project';
export const DEFAULT_NEW_PROJECT_LABEL = 'New Project';
export const DEFAULT_EMPTY_MESSAGE = 'No projects yet';
export const DEFAULT_SELECTED_INDICATOR = 'Selected';
export const DEFAULT_NEW_PROJECT_ACTION = 'Create new project';

// Screen reader announcements
export const SR_DROPDOWN_OPENED = 'Project selector opened';
export const SR_DROPDOWN_CLOSED = 'Project selector closed';
export const SR_PROJECT_SELECTED = 'Selected';
export const SR_OPTION_HIGHLIGHTED = 'Option';
export const SR_OPTION_COUNT_TEMPLATE = '{count} projects available';
export const SR_NEW_PROJECT_HIGHLIGHTED = 'New Project button';

// Size class constants
export const SELECTOR_SIZE_CLASSES: Record<ProjectSelectorSize, string> = {
  sm: 'min-h-[36px] text-sm',
  md: 'min-h-[44px] text-sm',
  lg: 'min-h-[48px] text-base',
};

export const SELECTOR_PADDING_CLASSES: Record<ProjectSelectorSize, string> = {
  sm: 'px-2 py-1',
  md: 'px-3 py-2',
  lg: 'px-4 py-2.5',
};

export const OPTION_SIZE_CLASSES: Record<ProjectSelectorSize, string> = {
  sm: 'min-h-[36px] px-2 py-1 text-sm',
  md: 'min-h-[44px] px-3 py-2 text-sm',
  lg: 'min-h-[48px] px-4 py-2.5 text-base',
};

export const ICON_SIZE_MAP: Record<ProjectSelectorSize, 'xs' | 'sm' | 'md'> = {
  sm: 'xs',
  md: 'sm',
  lg: 'md',
};

// Base class constants
export const SELECTOR_TRIGGER_BASE_CLASSES =
  'flex w-full items-center justify-between gap-2 rounded-md border transition-colors duration-150';

export const SELECTOR_TRIGGER_FOCUS_CLASSES =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--background))]';

export const SELECTOR_TRIGGER_DISABLED_CLASSES = 'cursor-not-allowed opacity-50';

export const SELECTOR_TRIGGER_HOVER_CLASSES = 'hover:border-[rgb(var(--ring))]';

export const SELECTOR_TRIGGER_OPEN_CLASSES = 'border-[rgb(var(--ring))]';

export const SELECTOR_TRIGGER_DEFAULT_CLASSES =
  'border-[rgb(var(--border))] bg-[rgb(var(--background))] text-[rgb(var(--foreground))]';

export const SELECTOR_LISTBOX_CLASSES =
  'absolute z-50 mt-1 w-full overflow-auto scrollbar-thin rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--popover))] py-1 shadow-md max-h-60 focus:outline-none motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95';

export const OPTION_BASE_CLASSES =
  'flex cursor-pointer items-center gap-2 motion-safe:transition-colors motion-safe:duration-75';

export const OPTION_HIGHLIGHTED_CLASSES =
  'bg-[rgb(var(--accent))] text-[rgb(var(--accent-foreground))]';

export const OPTION_SELECTED_CLASSES = 'font-medium';

export const DIVIDER_CLASSES = 'my-1 h-px bg-[rgb(var(--border))]';

export const EMPTY_MESSAGE_CLASSES = 'px-3 py-2 text-sm text-[rgb(var(--muted-foreground))]';

export const SKELETON_CONTAINER_CLASSES =
  'flex w-full items-center gap-2 rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--background))]';

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get the icon component for a project.
 * Falls back to Folder if the icon name is not recognized.
 */
export function getProjectIcon(iconName: string): LucideIcon {
  return PROJECT_ICON_MAP[iconName] ?? Folder;
}

/**
 * Get the base size from a responsive value.
 */
export function getBaseSize(size: ResponsiveValue<ProjectSelectorSize>): ProjectSelectorSize {
  if (typeof size === 'string') {
    return size;
  }
  return size.base ?? 'md';
}

/**
 * Generate responsive size classes from a size value.
 */
export function getResponsiveSizeClasses(
  size: ResponsiveValue<ProjectSelectorSize>,
  classMap: Record<ProjectSelectorSize, string>
): string {
  if (typeof size === 'string') {
    return classMap[size];
  }

  const classes: string[] = [];
  const breakpointOrder: ProjectSelectorBreakpoint[] = ['base', 'sm', 'md', 'lg', 'xl', '2xl'];

  for (const bp of breakpointOrder) {
    const sizeValue = size[bp];
    if (sizeValue) {
      const sizeClass = classMap[sizeValue];
      if (bp === 'base') {
        // Split and add each class
        classes.push(...sizeClass.split(' '));
      } else {
        // Add breakpoint prefix to each class
        classes.push(...sizeClass.split(' ').map((cls) => `${bp}:${cls}`));
      }
    }
  }

  return classes.join(' ');
}

/**
 * Generate option ID for aria-activedescendant.
 */
export function getOptionId(listboxId: string, index: number): string {
  return `${listboxId}-option-${index}`;
}

/**
 * Build screen reader announcement for selection change.
 */
export function buildSelectionAnnouncement(projectName: string): string {
  return `${SR_PROJECT_SELECTED} ${projectName}`;
}

/**
 * Build screen reader announcement for highlighted option.
 */
export function buildHighlightAnnouncement(
  name: string,
  index: number,
  total: number,
  isNewProject: boolean
): string {
  if (isNewProject) {
    return `${SR_NEW_PROJECT_HIGHLIGHTED}, ${index + 1} of ${total}`;
  }
  return `${name}, ${SR_OPTION_HIGHLIGHTED} ${index + 1} of ${total}`;
}

/**
 * Build accessible label for a project option.
 */
export function buildProjectAccessibleLabel(project: Project, isSelected: boolean): string {
  const parts = [project.name];
  if (isSelected) {
    parts.push(DEFAULT_SELECTED_INDICATOR);
  }
  return parts.join(', ');
}

/**
 * Build count announcement for available options.
 */
export function buildCountAnnouncement(count: number): string {
  return SR_OPTION_COUNT_TEMPLATE.replace('{count}', String(count));
}

// ============================================================================
// Skeleton Component
// ============================================================================

/**
 * Loading skeleton for ProjectSelector.
 */
export const ProjectSelectorSkeleton = forwardRef<HTMLDivElement, ProjectSelectorSkeletonProps>(
  function ProjectSelectorSkeleton({ size = 'md', className, 'data-testid': testId }, ref) {
    const baseSize = getBaseSize(size);
    const sizeClasses = getResponsiveSizeClasses(size, SELECTOR_SIZE_CLASSES);
    const paddingClasses = getResponsiveSizeClasses(size, SELECTOR_PADDING_CLASSES);
    const iconSize = ICON_SIZE_MAP[baseSize];

    return (
      <div
        ref={ref}
        className={cn(SKELETON_CONTAINER_CLASSES, sizeClasses, paddingClasses, className)}
        aria-hidden="true"
        role="presentation"
        data-testid={testId ?? 'project-selector-skeleton'}
        data-size={baseSize}
      >
        <Skeleton
          variant="circular"
          width={iconSize === 'xs' ? 16 : iconSize === 'sm' ? 20 : 24}
          height={iconSize === 'xs' ? 16 : iconSize === 'sm' ? 20 : 24}
        />
        <Skeleton variant="text" className="flex-1" height={16} />
        <Skeleton variant="circular" width={16} height={16} />
      </div>
    );
  }
);

ProjectSelectorSkeleton.displayName = 'ProjectSelectorSkeleton';

// ============================================================================
// Main Component
// ============================================================================

/**
 * ProjectSelector component for switching between projects.
 * Stateless - receives all data via props, emits actions via callbacks.
 *
 * Features:
 * - Project dropdown with icons
 * - New project button
 * - Full keyboard navigation (Arrow keys, Home, End, Enter, Escape)
 * - ARIA combobox/listbox pattern
 * - Screen reader announcements
 * - Touch target compliance (44px minimum on mobile)
 *
 * @example
 * <ProjectSelector
 *   projects={projects}
 *   selectedProjectId={currentProjectId}
 *   onSelectProject={(id) => setCurrentProjectId(id)}
 *   onNewProject={() => openNewProjectDialog()}
 * />
 */
export const ProjectSelector = forwardRef<HTMLDivElement, ProjectSelectorProps>(
  function ProjectSelector(
    {
      projects,
      selectedProjectId,
      onSelectProject,
      onNewProject,
      disabled = false,
      placeholder = DEFAULT_PLACEHOLDER,
      size = 'md',
      className,
      'aria-label': ariaLabel = DEFAULT_ARIA_LABEL,
      'aria-describedby': ariaDescribedBy,
      'data-testid': testId,
    },
    ref
  ) {
    const [isOpen, setIsOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const [announcement, setAnnouncement] = useState('');
    const triggerRef = useRef<HTMLButtonElement>(null);
    const listRef = useRef<HTMLUListElement>(null);
    const id = useId();
    const listboxId = `${id}-listbox`;

    // Calculate sizes
    const baseSize = getBaseSize(size);
    const sizeClasses = getResponsiveSizeClasses(size, SELECTOR_SIZE_CLASSES);
    const paddingClasses = getResponsiveSizeClasses(size, SELECTOR_PADDING_CLASSES);
    const optionClasses = getResponsiveSizeClasses(size, OPTION_SIZE_CLASSES);
    const iconSize = ICON_SIZE_MAP[baseSize];

    // Find the selected project
    const selectedProject = useMemo(
      () => projects.find((p) => p.id === selectedProjectId),
      [projects, selectedProjectId]
    );

    // Total items including new project button
    const totalItems = projects.length + 1;
    const newProjectIndex = projects.length;

    // Get highlighted option ID for aria-activedescendant
    const highlightedOptionId =
      highlightedIndex >= 0 ? getOptionId(listboxId, highlightedIndex) : undefined;

    const openDropdown = useCallback(() => {
      if (disabled) return;
      setIsOpen(true);
      // Highlight current selection or first item
      const currentIndex = projects.findIndex((p) => p.id === selectedProjectId);
      setHighlightedIndex(currentIndex >= 0 ? currentIndex : 0);
      setAnnouncement(`${SR_DROPDOWN_OPENED}. ${buildCountAnnouncement(projects.length)}`);
    }, [disabled, projects, selectedProjectId]);

    const closeDropdown = useCallback(() => {
      setIsOpen(false);
      setHighlightedIndex(-1);
      setAnnouncement(SR_DROPDOWN_CLOSED);
    }, []);

    const selectProject = useCallback(
      (projectId: string) => {
        const project = projects.find((p) => p.id === projectId);
        if (project) {
          onSelectProject?.(projectId);
          setAnnouncement(buildSelectionAnnouncement(project.name));
        }
        closeDropdown();
        triggerRef.current?.focus();
      },
      [onSelectProject, closeDropdown, projects]
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

    // Scroll highlighted item into view
    useEffect(() => {
      if (isOpen && highlightedIndex >= 0 && listRef.current) {
        const highlightedElement = listRef.current.querySelector(
          `[data-index="${highlightedIndex}"]`
        );
        highlightedElement?.scrollIntoView({ block: 'nearest' });
      }
    }, [isOpen, highlightedIndex]);

    // Announce highlighted option for screen readers
    useEffect(() => {
      if (!isOpen || highlightedIndex < 0) return;

      if (highlightedIndex === newProjectIndex) {
        setAnnouncement(
          buildHighlightAnnouncement(DEFAULT_NEW_PROJECT_LABEL, highlightedIndex, totalItems, true)
        );
      } else if (projects[highlightedIndex]) {
        const project = projects[highlightedIndex];
        setAnnouncement(
          buildHighlightAnnouncement(project.name, highlightedIndex, totalItems, false)
        );
      }
    }, [isOpen, highlightedIndex, projects, totalItems, newProjectIndex]);

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
          setHighlightedIndex((prev) => (prev < totalItems - 1 ? prev + 1 : 0));
          break;
        case 'ArrowUp':
          event.preventDefault();
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : totalItems - 1));
          break;
        case 'Enter':
        case ' ':
          event.preventDefault();
          if (highlightedIndex === newProjectIndex) {
            onNewProject?.();
            closeDropdown();
            triggerRef.current?.focus();
          } else if (highlightedIndex >= 0 && projects[highlightedIndex]) {
            selectProject(projects[highlightedIndex].id);
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
          setHighlightedIndex(totalItems - 1);
          break;
      }
    };

    const handleNewProjectClick = (event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      onNewProject?.();
      closeDropdown();
    };

    return (
      <div
        ref={ref}
        className={cn('relative', className)}
        data-testid={testId ?? 'project-selector'}
        data-state={isOpen ? 'open' : 'closed'}
        data-size={baseSize}
        data-disabled={disabled || undefined}
      >
        {/* Screen reader announcements */}
        <VisuallyHidden>
          <div role="status" aria-live="polite" aria-atomic="true">
            {announcement}
          </div>
        </VisuallyHidden>

        {/* Trigger button */}
        <button
          ref={triggerRef}
          type="button"
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-controls={listboxId}
          aria-activedescendant={isOpen ? highlightedOptionId : undefined}
          aria-label={ariaLabel}
          aria-describedby={ariaDescribedBy}
          disabled={disabled}
          onClick={() => (isOpen ? closeDropdown() : openDropdown())}
          onKeyDown={handleTriggerKeyDown}
          className={cn(
            // Base styles
            SELECTOR_TRIGGER_BASE_CLASSES,
            SELECTOR_TRIGGER_DEFAULT_CLASSES,
            sizeClasses,
            paddingClasses,
            // Focus
            SELECTOR_TRIGGER_FOCUS_CLASSES,
            // Hover (only when not disabled)
            !disabled && SELECTOR_TRIGGER_HOVER_CLASSES,
            // Disabled
            disabled && SELECTOR_TRIGGER_DISABLED_CLASSES,
            // Open state
            isOpen && SELECTOR_TRIGGER_OPEN_CLASSES
          )}
          data-testid={testId ? `${testId}-trigger` : 'project-selector-trigger'}
        >
          <span
            className={cn(
              'flex items-center gap-2 truncate',
              !selectedProject && 'text-[rgb(var(--muted-foreground))]'
            )}
          >
            {selectedProject ? (
              <>
                <Icon
                  icon={getProjectIcon(selectedProject.icon)}
                  size={iconSize}
                  className="shrink-0 text-[rgb(var(--primary))]"
                  aria-hidden="true"
                />
                <span className="truncate">{selectedProject.name}</span>
              </>
            ) : (
              <>
                <Icon
                  icon={Folder}
                  size={iconSize}
                  className="shrink-0 text-[rgb(var(--muted-foreground))]"
                  aria-hidden="true"
                />
                <span>{placeholder}</span>
              </>
            )}
          </span>
          <Icon
            icon={ChevronDown}
            size={iconSize}
            className={cn(
              'shrink-0 text-[rgb(var(--muted-foreground))] motion-safe:transition-transform motion-safe:duration-200',
              isOpen && 'rotate-180'
            )}
            aria-hidden="true"
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
            aria-label={ariaLabel}
            className={SELECTOR_LISTBOX_CLASSES}
            data-testid={testId ? `${testId}-listbox` : 'project-selector-listbox'}
          >
            {projects.length === 0 ? (
              <li className={EMPTY_MESSAGE_CLASSES} role="presentation">
                {DEFAULT_EMPTY_MESSAGE}
              </li>
            ) : (
              projects.map((project, index) => {
                const isSelected = project.id === selectedProjectId;
                const isHighlighted = index === highlightedIndex;
                const ProjectIcon = getProjectIcon(project.icon);

                return (
                  <li
                    key={project.id}
                    id={getOptionId(listboxId, index)}
                    role="option"
                    aria-selected={isSelected}
                    aria-label={buildProjectAccessibleLabel(project, isSelected)}
                    data-index={index}
                    data-highlighted={isHighlighted || undefined}
                    onClick={() => selectProject(project.id)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={cn(
                      OPTION_BASE_CLASSES,
                      optionClasses,
                      isHighlighted && OPTION_HIGHLIGHTED_CLASSES,
                      isSelected && OPTION_SELECTED_CLASSES
                    )}
                    data-testid={
                      testId ? `${testId}-option-${project.id}` : `project-option-${project.id}`
                    }
                  >
                    <Icon
                      icon={ProjectIcon}
                      size={iconSize}
                      className={cn(
                        'shrink-0',
                        isSelected
                          ? 'text-[rgb(var(--primary))]'
                          : 'text-[rgb(var(--muted-foreground))]'
                      )}
                      aria-hidden="true"
                    />
                    <span className="flex-1 truncate">{project.name}</span>
                    {isSelected && (
                      <Icon
                        icon={Check}
                        size={iconSize}
                        className="text-[rgb(var(--primary))]"
                        aria-hidden="true"
                      />
                    )}
                  </li>
                );
              })
            )}

            {/* Divider */}
            {projects.length > 0 && (
              <li role="separator" className={DIVIDER_CLASSES} aria-hidden="true" />
            )}

            {/* New Project button */}
            <li
              id={getOptionId(listboxId, newProjectIndex)}
              role="option"
              aria-selected={false}
              aria-label={DEFAULT_NEW_PROJECT_ACTION}
              data-index={newProjectIndex}
              data-highlighted={highlightedIndex === newProjectIndex || undefined}
              onClick={handleNewProjectClick}
              onMouseEnter={() => setHighlightedIndex(newProjectIndex)}
              className={cn(
                OPTION_BASE_CLASSES,
                optionClasses,
                highlightedIndex === newProjectIndex && OPTION_HIGHLIGHTED_CLASSES
              )}
              data-testid={testId ? `${testId}-new-project` : 'project-selector-new-project'}
            >
              <Icon
                icon={Plus}
                size={iconSize}
                className="shrink-0 text-[rgb(var(--primary))]"
                aria-hidden="true"
              />
              <span className="flex-1">{DEFAULT_NEW_PROJECT_LABEL}</span>
            </li>
          </ul>
        )}
      </div>
    );
  }
);

ProjectSelector.displayName = 'ProjectSelector';
