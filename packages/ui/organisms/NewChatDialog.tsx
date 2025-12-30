import type { ExecutorProfile, Project } from '@openflow/generated';
import { cn } from '@openflow/utils';
import { Bot, Terminal } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '../atoms/Button';
import { Icon } from '../atoms/Icon';
import { Input } from '../atoms/Input';
import { Dialog, DialogContent, DialogFooter } from '../molecules/Dialog';
import { Dropdown, type DropdownOption } from '../molecules/Dropdown';
import { ProjectSelector } from './ProjectSelector';

export interface NewChatDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Callback when the dialog should close */
  onClose: () => void;
  /** Available projects to choose from */
  projects: Project[];
  /** Available executor profiles */
  executorProfiles: ExecutorProfile[];
  /** Pre-selected project ID (optional) */
  selectedProjectId?: string;
  /** Whether the dialog is in a loading/submitting state */
  isSubmitting?: boolean;
  /** Callback when a new chat is created */
  onCreate: (data: { projectId: string; executorProfileId?: string; title?: string }) => void;
  /** Callback when a new project is requested */
  onNewProject?: () => void;
}

/**
 * Dialog for creating a new standalone chat.
 * Stateless - receives all data via props, emits actions via callbacks.
 *
 * Features:
 * - Project selector (when not pre-selected)
 * - Executor profile selector with default selection
 * - Optional title input
 *
 * @example
 * <NewChatDialog
 *   isOpen={isOpen}
 *   onClose={handleClose}
 *   projects={projects}
 *   executorProfiles={executorProfiles}
 *   selectedProjectId={currentProjectId}
 *   onCreate={handleCreate}
 * />
 */
export function NewChatDialog({
  isOpen,
  onClose,
  projects,
  executorProfiles,
  selectedProjectId: preSelectedProjectId,
  isSubmitting = false,
  onCreate,
  onNewProject,
}: NewChatDialogProps) {
  // Local form state
  const [projectId, setProjectId] = useState<string | undefined>(preSelectedProjectId);
  const [executorProfileId, setExecutorProfileId] = useState<string | undefined>();
  const [title, setTitle] = useState('');

  // Find default executor profile
  const defaultProfile = useMemo(
    () => executorProfiles.find((p) => p.isDefault) ?? executorProfiles[0],
    [executorProfiles]
  );

  // Reset form when dialog opens/closes or pre-selected project changes
  useEffect(() => {
    if (isOpen) {
      setProjectId(preSelectedProjectId);
      setExecutorProfileId(defaultProfile?.id);
      setTitle('');
    }
  }, [isOpen, preSelectedProjectId, defaultProfile?.id]);

  // Convert executor profiles to dropdown options
  const executorOptions = useMemo<DropdownOption[]>(
    () =>
      executorProfiles.map((profile) => ({
        value: profile.id,
        label: profile.name,
        icon: profile.command.includes('claude') ? Bot : Terminal,
      })),
    [executorProfiles]
  );

  // Determine if we need to show project selector
  const showProjectSelector = !preSelectedProjectId;

  // Validate form
  const isValid = useMemo(() => {
    return Boolean(projectId);
  }, [projectId]);

  const handleSubmit = useCallback(() => {
    if (!isValid || !projectId) return;

    onCreate({
      projectId,
      executorProfileId: executorProfileId || undefined,
      title: title.trim() || undefined,
    });
  }, [isValid, projectId, executorProfileId, title, onCreate]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' && isValid && !isSubmitting) {
        event.preventDefault();
        handleSubmit();
      }
    },
    [isValid, isSubmitting, handleSubmit]
  );

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="New Chat"
      size="md"
      closeOnEscape={!isSubmitting}
      closeOnBackdropClick={!isSubmitting}
    >
      <DialogContent>
        <div className="space-y-4" onKeyDown={handleKeyDown}>
          {/* Project selector (if not pre-selected) */}
          {showProjectSelector && (
            <div className="space-y-2">
              <label
                htmlFor="project-selector"
                className="text-sm font-medium text-[rgb(var(--foreground))]"
              >
                Project
              </label>
              <ProjectSelector
                projects={projects}
                selectedProjectId={projectId}
                onSelectProject={setProjectId}
                onNewProject={onNewProject}
                placeholder="Select a project..."
                disabled={isSubmitting}
              />
            </div>
          )}

          {/* Pre-selected project info */}
          {!showProjectSelector && projectId && (
            <div className="space-y-2">
              <span className="text-sm font-medium text-[rgb(var(--foreground))]">Project</span>
              <div
                className={cn(
                  'flex items-center gap-2 rounded-md border px-3 py-2',
                  'border-[rgb(var(--border))] bg-[rgb(var(--muted))]',
                  'text-sm text-[rgb(var(--foreground))]'
                )}
              >
                <Icon
                  icon={Bot}
                  size="sm"
                  className="shrink-0 text-[rgb(var(--muted-foreground))]"
                />
                <span className="truncate">
                  {projects.find((p) => p.id === projectId)?.name ?? 'Unknown Project'}
                </span>
              </div>
            </div>
          )}

          {/* Executor profile selector */}
          <div className="space-y-2">
            <span id="agent-label" className="text-sm font-medium text-[rgb(var(--foreground))]">
              Agent
              <span className="ml-1 text-xs text-[rgb(var(--muted-foreground))]">(optional)</span>
            </span>
            {executorOptions.length > 0 ? (
              <Dropdown
                options={executorOptions}
                value={executorProfileId}
                onChange={setExecutorProfileId}
                placeholder="Select an agent..."
                disabled={isSubmitting}
                aria-label="Agent"
              />
            ) : (
              <div
                className={cn(
                  'flex items-center gap-2 rounded-md border px-3 py-2',
                  'border-[rgb(var(--border))] bg-[rgb(var(--muted))]',
                  'text-sm text-[rgb(var(--muted-foreground))]'
                )}
              >
                <Icon icon={Bot} size="sm" className="shrink-0" />
                <span>No agents configured</span>
              </div>
            )}
            {defaultProfile && !executorProfileId && (
              <p className="text-xs text-[rgb(var(--muted-foreground))]">
                Will use default: {defaultProfile.name}
              </p>
            )}
          </div>

          {/* Title input (optional) */}
          <div className="space-y-2">
            <label
              htmlFor="chat-title"
              className="text-sm font-medium text-[rgb(var(--foreground))]"
            >
              Title
              <span className="ml-1 text-xs text-[rgb(var(--muted-foreground))]">(optional)</span>
            </label>
            <Input
              id="chat-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Chat title..."
              disabled={isSubmitting}
              maxLength={500}
            />
          </div>
        </div>
      </DialogContent>

      <DialogFooter>
        <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSubmit} disabled={!isValid || isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create Chat'}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

NewChatDialog.displayName = 'NewChatDialog';
