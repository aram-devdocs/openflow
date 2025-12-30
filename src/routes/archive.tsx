/**
 * Archive Page Route
 *
 * Displays all archived tasks with options to:
 * - View archived task details
 * - Restore tasks back to active status
 * - Permanently delete tasks
 *
 * Follows the orchestration pattern: connects hooks to UI components.
 * Keeps page logic minimal (<200 lines) by delegating to UI components.
 */

import type { Task } from '@openflow/generated';
import {
  useArchivedTasks,
  useDeleteTask,
  useKeyboardShortcuts,
  useProjects,
  useRestoreTask,
} from '@openflow/hooks';
import { AppLayout, Button, Dialog, EmptyState, Header } from '@openflow/ui';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Archive, ArrowLeft, RotateCcw, Trash2 } from 'lucide-react';
import { useCallback, useState } from 'react';

export const Route = createFileRoute('/archive')({
  component: ArchivePage,
});

function ArchivePage() {
  const navigate = useNavigate();

  // UI state
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Task | null>(null);

  // Data fetching
  const { data: archivedTasks = [], isLoading } = useArchivedTasks();
  const { data: projects = [] } = useProjects();
  const restoreTask = useRestoreTask();
  const deleteTask = useDeleteTask();

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'Escape',
      action: () => {
        setSelectedTask(null);
        setConfirmDelete(null);
      },
    },
  ]);

  // Get project name by ID
  const getProjectName = useCallback(
    (projectId: string) => {
      const project = projects.find((p) => p.id === projectId);
      return project?.name ?? 'Unknown Project';
    },
    [projects]
  );

  // Callbacks
  const handleBack = useCallback(() => {
    navigate({ to: '/' });
  }, [navigate]);

  const handleSelectTask = useCallback((task: Task) => {
    setSelectedTask(task);
  }, []);

  const handleRestoreTask = useCallback(
    (task: Task) => {
      restoreTask.mutate(
        { id: task.id },
        {
          onSuccess: () => {
            setSelectedTask(null);
          },
        }
      );
    },
    [restoreTask]
  );

  const handleDeleteClick = useCallback((task: Task) => {
    setConfirmDelete(task);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (confirmDelete) {
      deleteTask.mutate(confirmDelete.id, {
        onSuccess: () => {
          setConfirmDelete(null);
          setSelectedTask(null);
        },
      });
    }
  }, [confirmDelete, deleteTask]);

  const handleCancelDelete = useCallback(() => {
    setConfirmDelete(null);
  }, []);

  const handleSearch = useCallback(() => {
    // TODO: Open command palette for search
    console.log('Search clicked');
  }, []);

  // Format date for display
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <AppLayout
      sidebarCollapsed={true}
      sidebar={null}
      header={
        <Header
          title="Archive"
          subtitle={`${archivedTasks.length} archived task${archivedTasks.length === 1 ? '' : 's'}`}
          onSearch={handleSearch}
        />
      }
    >
      <div className="flex h-full flex-col">
        {/* Back button */}
        <div className="border-b border-[rgb(var(--border))] px-6 py-3">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-2 text-sm text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-sm text-[rgb(var(--muted-foreground))]">
                Loading archived tasks...
              </div>
            </div>
          ) : archivedTasks.length === 0 ? (
            <EmptyState
              icon={Archive}
              title="Archive is empty"
              description="Tasks you archive will appear here."
              size="lg"
              className="h-full"
            />
          ) : (
            <div className="space-y-2">
              {archivedTasks.map((task) => (
                <div
                  key={task.id}
                  className={`group flex items-center justify-between rounded-lg border p-4 transition-colors ${
                    selectedTask?.id === task.id
                      ? 'border-[rgb(var(--primary))] bg-[rgb(var(--primary))]/5'
                      : 'border-[rgb(var(--border))] bg-[rgb(var(--card))] hover:bg-[rgb(var(--muted))]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleSelectTask(task)}
                    className="flex flex-1 flex-col items-start gap-1 text-left"
                  >
                    <span className="font-medium text-[rgb(var(--foreground))]">{task.title}</span>
                    <div className="flex items-center gap-2 text-xs text-[rgb(var(--muted-foreground))]">
                      <span>{getProjectName(task.projectId)}</span>
                      <span>-</span>
                      <span>Archived {formatDate(task.archivedAt)}</span>
                    </div>
                  </button>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => handleRestoreTask(task)}
                      disabled={restoreTask.isPending}
                      className="inline-flex items-center gap-1.5 rounded-md bg-[rgb(var(--primary))] px-3 py-1.5 text-xs font-medium text-[rgb(var(--primary-foreground))] hover:bg-[rgb(var(--primary))]/90 disabled:opacity-50"
                      title="Restore task"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Restore
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteClick(task)}
                      className="inline-flex items-center gap-1.5 rounded-md bg-error/10 px-3 py-1.5 text-xs font-medium text-error hover:bg-error/20"
                      title="Delete permanently"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Confirm delete dialog */}
      <Dialog
        isOpen={confirmDelete !== null}
        onClose={handleCancelDelete}
        title="Delete Task Permanently"
      >
        <div className="space-y-4">
          <p className="text-sm text-[rgb(var(--muted-foreground))]">
            Are you sure you want to permanently delete{' '}
            <span className="font-medium text-[rgb(var(--foreground))]">
              {confirmDelete?.title}
            </span>
            ? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={handleCancelDelete}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              loading={deleteTask.isPending}
            >
              Delete
            </Button>
          </div>
        </div>
      </Dialog>
    </AppLayout>
  );
}
