import { cn } from '@openflow/utils';
import { AlertCircle, GitPullRequest } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '../atoms/Button';
import { Icon } from '../atoms/Icon';
import { Input } from '../atoms/Input';
import { Textarea } from '../atoms/Textarea';
import { Dialog, DialogContent, DialogFooter } from '../molecules/Dialog';

export interface CreatePRDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Callback when the dialog should close */
  onClose: () => void;
  /** Callback when a PR is created */
  onCreate: (data: {
    title: string;
    body: string;
    base?: string;
    draft?: boolean;
  }) => void;
  /** Pre-filled title (usually from task title) */
  defaultTitle?: string;
  /** Pre-filled body (optional) */
  defaultBody?: string;
  /** Base branch for the PR (e.g., "main", "develop") */
  defaultBase?: string;
  /** Whether the dialog is in a loading/submitting state */
  isSubmitting?: boolean;
  /** Error message to display */
  error?: string | null;
  /** Whether GitHub CLI is installed */
  ghCliInstalled?: boolean;
  /** Whether user is authenticated with GitHub */
  ghAuthenticated?: boolean;
}

/**
 * Dialog for creating a GitHub Pull Request.
 * Stateless - receives all data via props, emits actions via callbacks.
 *
 * Features:
 * - Title input (required)
 * - Body textarea (markdown)
 * - Base branch selector (optional, defaults to project's base branch)
 * - Draft PR toggle
 * - GitHub CLI status indicators
 *
 * @example
 * <CreatePRDialog
 *   isOpen={isOpen}
 *   onClose={handleClose}
 *   onCreate={handleCreate}
 *   defaultTitle="Add user authentication"
 *   defaultBase="main"
 *   ghCliInstalled={true}
 *   ghAuthenticated={true}
 * />
 */
export function CreatePRDialog({
  isOpen,
  onClose,
  onCreate,
  defaultTitle = '',
  defaultBody = '',
  defaultBase = '',
  isSubmitting = false,
  error,
  ghCliInstalled = true,
  ghAuthenticated = true,
}: CreatePRDialogProps) {
  // Local form state
  const [title, setTitle] = useState(defaultTitle);
  const [body, setBody] = useState(defaultBody);
  const [base, setBase] = useState(defaultBase);
  const [isDraft, setIsDraft] = useState(false);

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setTitle(defaultTitle);
      setBody(defaultBody);
      setBase(defaultBase);
      setIsDraft(false);
    }
  }, [isOpen, defaultTitle, defaultBody, defaultBase]);

  // Validate form
  const isValid = title.trim().length > 0 && ghCliInstalled && ghAuthenticated;

  const handleSubmit = useCallback(() => {
    if (!isValid) return;

    onCreate({
      title: title.trim(),
      body: body.trim(),
      base: base.trim() || undefined,
      draft: isDraft || undefined,
    });
  }, [isValid, title, body, base, isDraft, onCreate]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' && event.metaKey && isValid && !isSubmitting) {
        event.preventDefault();
        handleSubmit();
      }
    },
    [isValid, isSubmitting, handleSubmit]
  );

  // Show warning if GitHub CLI is not installed or not authenticated
  const showGhWarning = !ghCliInstalled || !ghAuthenticated;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Create Pull Request"
      size="lg"
      closeOnEscape={!isSubmitting}
      closeOnBackdropClick={!isSubmitting}
    >
      <DialogContent>
        <div className="space-y-4" onKeyDown={handleKeyDown}>
          {/* GitHub CLI warning */}
          {showGhWarning && (
            <div
              className={cn(
                'flex items-start gap-3 rounded-md border p-3',
                'border-[rgb(var(--warning))]/30 bg-[rgb(var(--warning))]/10'
              )}
            >
              <Icon
                icon={AlertCircle}
                size="sm"
                className="mt-0.5 shrink-0 text-[rgb(var(--warning))]"
              />
              <div className="text-sm">
                {!ghCliInstalled ? (
                  <>
                    <p className="font-medium text-[rgb(var(--warning))]">
                      GitHub CLI not installed
                    </p>
                    <p className="mt-1 text-[rgb(var(--muted-foreground))]">
                      Install the GitHub CLI to create pull requests:{' '}
                      <code className="rounded bg-[rgb(var(--muted))] px-1 py-0.5">
                        brew install gh
                      </code>
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-medium text-[rgb(var(--warning))]">
                      Not authenticated with GitHub
                    </p>
                    <p className="mt-1 text-[rgb(var(--muted-foreground))]">
                      Run{' '}
                      <code className="rounded bg-[rgb(var(--muted))] px-1 py-0.5">
                        gh auth login
                      </code>{' '}
                      to authenticate.
                    </p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* PR Icon and info */}
          <div className="flex items-center gap-3 text-[rgb(var(--muted-foreground))]">
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-full',
                'bg-[rgb(var(--primary))]/10'
              )}
            >
              <Icon icon={GitPullRequest} size="md" className="text-[rgb(var(--primary))]" />
            </div>
            <p className="text-sm">
              This will create a pull request from your task branch to the target branch.
            </p>
          </div>

          {/* Title input (required) */}
          <div className="space-y-2">
            <label htmlFor="pr-title" className="text-sm font-medium text-[rgb(var(--foreground))]">
              Title <span className="text-[rgb(var(--destructive))]">*</span>
            </label>
            <Input
              id="pr-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief description of changes"
              disabled={isSubmitting || showGhWarning}
              autoFocus
              maxLength={256}
            />
          </div>

          {/* Body textarea */}
          <div className="space-y-2">
            <label htmlFor="pr-body" className="text-sm font-medium text-[rgb(var(--foreground))]">
              Description
              <span className="ml-1 text-xs text-[rgb(var(--muted-foreground))]">(optional)</span>
            </label>
            <Textarea
              id="pr-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Describe your changes in detail. Supports markdown."
              disabled={isSubmitting || showGhWarning}
              rows={6}
              resize="vertical"
            />
          </div>

          {/* Base branch input */}
          <div className="space-y-2">
            <label htmlFor="pr-base" className="text-sm font-medium text-[rgb(var(--foreground))]">
              Base Branch
              <span className="ml-1 text-xs text-[rgb(var(--muted-foreground))]">(optional)</span>
            </label>
            <Input
              id="pr-base"
              type="text"
              value={base}
              onChange={(e) => setBase(e.target.value)}
              placeholder="main"
              disabled={isSubmitting || showGhWarning}
            />
            <p className="text-xs text-[rgb(var(--muted-foreground))]">
              Leave empty to use the project's default base branch.
            </p>
          </div>

          {/* Draft PR toggle */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="pr-draft"
              checked={isDraft}
              onChange={(e) => setIsDraft(e.target.checked)}
              disabled={isSubmitting || showGhWarning}
              className={cn(
                'h-4 w-4 rounded border-[rgb(var(--border))]',
                'text-[rgb(var(--primary))] focus:ring-[rgb(var(--ring))]',
                'disabled:cursor-not-allowed disabled:opacity-50'
              )}
            />
            <label htmlFor="pr-draft" className="text-sm text-[rgb(var(--foreground))]">
              Create as draft PR
              <span className="ml-1 text-xs text-[rgb(var(--muted-foreground))]">
                (can be marked ready for review later)
              </span>
            </label>
          </div>

          {/* Error message */}
          {error && (
            <div
              className={cn(
                'flex items-start gap-2 rounded-md border p-3',
                'border-[rgb(var(--destructive))]/30 bg-[rgb(var(--destructive))]/10'
              )}
            >
              <Icon
                icon={AlertCircle}
                size="sm"
                className="mt-0.5 shrink-0 text-[rgb(var(--destructive))]"
              />
              <p className="text-sm text-[rgb(var(--destructive))]">{error}</p>
            </div>
          )}
        </div>
      </DialogContent>

      <DialogFooter>
        <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={!isValid || isSubmitting}
          loading={isSubmitting}
          loadingText="Creating PR..."
        >
          <Icon icon={GitPullRequest} size="sm" className="mr-2" />
          Create Pull Request
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

CreatePRDialog.displayName = 'CreatePRDialog';
