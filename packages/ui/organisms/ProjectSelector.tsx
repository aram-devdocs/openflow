import type { Project } from '@openflow/generated';
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
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Icon } from '../atoms/Icon';

/** Map of project icon names to Lucide icons */
const iconMap: Record<string, LucideIcon> = {
  folder: Folder,
  'folder-git': FolderGit2,
  'folder-code': FolderCode,
  'folder-kanban': FolderKanban,
  'folder-open': FolderOpen,
};

/**
 * Get the icon component for a project.
 * Falls back to Folder if the icon name is not recognized.
 */
function getProjectIcon(iconName: string): LucideIcon {
  return iconMap[iconName] ?? Folder;
}

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
  /** Additional CSS classes */
  className?: string;
}

/**
 * ProjectSelector component for switching between projects.
 * Stateless - receives all data via props, emits actions via callbacks.
 *
 * Features:
 * - Project dropdown with icons
 * - New project button
 * - Keyboard navigation (Arrow keys, Enter, Escape)
 * - Click outside to close
 *
 * @example
 * <ProjectSelector
 *   projects={projects}
 *   selectedProjectId={currentProjectId}
 *   onSelectProject={(id) => setCurrentProjectId(id)}
 *   onNewProject={() => openNewProjectDialog()}
 * />
 */
export function ProjectSelector({
  projects,
  selectedProjectId,
  onSelectProject,
  onNewProject,
  disabled = false,
  placeholder = 'Select a project...',
  className,
}: ProjectSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const id = useId();
  const listboxId = `${id}-listbox`;

  // Find the selected project
  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  const openDropdown = useCallback(() => {
    if (disabled) return;
    setIsOpen(true);
    // Highlight current selection or first item
    const currentIndex = projects.findIndex((p) => p.id === selectedProjectId);
    setHighlightedIndex(currentIndex >= 0 ? currentIndex : 0);
  }, [disabled, projects, selectedProjectId]);

  const closeDropdown = useCallback(() => {
    setIsOpen(false);
    setHighlightedIndex(-1);
  }, []);

  const selectProject = useCallback(
    (projectId: string) => {
      onSelectProject?.(projectId);
      closeDropdown();
      triggerRef.current?.focus();
    },
    [onSelectProject, closeDropdown]
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
    // Total items = projects + 1 (new project button)
    const totalItems = projects.length + 1;
    const newProjectIndex = projects.length;

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
    <div className={cn('relative', className)}>
      {/* Trigger button */}
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        aria-label="Select project"
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
          // Open state
          isOpen && 'border-[rgb(var(--ring))]'
        )}
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
                size="sm"
                className="shrink-0 text-[rgb(var(--primary))]"
              />
              <span className="truncate">{selectedProject.name}</span>
            </>
          ) : (
            <>
              <Icon
                icon={Folder}
                size="sm"
                className="shrink-0 text-[rgb(var(--muted-foreground))]"
              />
              <span>{placeholder}</span>
            </>
          )}
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
            'absolute z-50 mt-1 w-full overflow-auto scrollbar-thin',
            'rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--popover))]',
            'py-1 shadow-md',
            'max-h-60',
            'focus:outline-none'
          )}
        >
          {projects.length === 0 ? (
            <li className="px-3 py-2 text-sm text-[rgb(var(--muted-foreground))]">
              No projects yet
            </li>
          ) : (
            projects.map((project, index) => {
              const isSelected = project.id === selectedProjectId;
              const isHighlighted = index === highlightedIndex;
              const ProjectIcon = getProjectIcon(project.icon);

              return (
                // biome-ignore lint/a11y/useSemanticElements: Standard accessible option pattern
                // biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: Required for accessible listbox
                // biome-ignore lint/a11y/useFocusableInteractive: Focus managed by parent listbox
                // biome-ignore lint/a11y/useKeyWithClickEvents: Keyboard handled by parent listbox
                <li
                  key={project.id}
                  role="option"
                  aria-selected={isSelected}
                  data-index={index}
                  onClick={() => selectProject(project.id)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={cn(
                    'flex cursor-pointer items-center gap-2 px-3 py-2 text-sm',
                    'transition-colors duration-75',
                    // Highlighted state
                    isHighlighted && 'bg-[rgb(var(--accent))] text-[rgb(var(--accent-foreground))]',
                    // Selected state
                    isSelected && 'font-medium'
                  )}
                >
                  <Icon
                    icon={ProjectIcon}
                    size="sm"
                    className={cn(
                      'shrink-0',
                      isSelected
                        ? 'text-[rgb(var(--primary))]'
                        : 'text-[rgb(var(--muted-foreground))]'
                    )}
                  />
                  <span className="flex-1 truncate">{project.name}</span>
                  {isSelected && (
                    <Icon icon={Check} size="sm" className="text-[rgb(var(--primary))]" />
                  )}
                </li>
              );
            })
          )}

          {/* Divider */}
          {projects.length > 0 && (
            // biome-ignore lint/a11y/useFocusableInteractive: Separator is not interactive
            // biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: Separator pattern
            <li role="separator" className="my-1 h-px bg-[rgb(var(--border))]" />
          )}

          {/* New Project button */}
          {/* biome-ignore lint/a11y/useSemanticElements: Standard accessible option pattern */}
          {/* biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: Required for accessible listbox */}
          {/* biome-ignore lint/a11y/useFocusableInteractive: Focus managed by parent listbox */}
          {/* biome-ignore lint/a11y/useKeyWithClickEvents: Keyboard handled by parent listbox */}
          <li
            role="option"
            aria-selected={false}
            data-index={projects.length}
            onClick={handleNewProjectClick}
            onMouseEnter={() => setHighlightedIndex(projects.length)}
            className={cn(
              'flex cursor-pointer items-center gap-2 px-3 py-2 text-sm',
              'transition-colors duration-75',
              highlightedIndex === projects.length &&
                'bg-[rgb(var(--accent))] text-[rgb(var(--accent-foreground))]'
            )}
          >
            <Icon icon={Plus} size="sm" className="shrink-0 text-[rgb(var(--primary))]" />
            <span className="flex-1">New Project</span>
          </li>
        </ul>
      )}
    </div>
  );
}

ProjectSelector.displayName = 'ProjectSelector';
