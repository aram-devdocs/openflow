/**
 * Task Detail Page Route
 *
 * Displays a single task with its workflow steps and chat interface.
 * Users can:
 * - View and edit task details (title, status)
 * - Navigate workflow steps
 * - Chat with the AI assistant
 * - View code changes (diffs)
 * - View commit history
 * - Create pull requests
 *
 * Uses TaskPage component with tabs for Steps, Artifacts, Changes, and Commits.
 * Route is pure composition - all state is in useTaskSession hook.
 */

import { useTaskSession, useToast } from '@openflow/hooks';
import { TaskPage } from '@openflow/ui';
import type { TaskPageTab } from '@openflow/ui';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { FileText, GitCommitHorizontal, GitCompare, ListTodo } from 'lucide-react';
import { useMemo } from 'react';

export const Route = createFileRoute('/_app/tasks/$taskId')({
  component: TaskDetailRoute,
});

function TaskDetailRoute() {
  const { taskId } = Route.useParams();
  const navigate = useNavigate();
  const toast = useToast();

  // All state management is encapsulated in the hook
  const session = useTaskSession({
    taskId,
    onSuccess: (title, message) => toast.success(title, message),
    onError: (title, message) => toast.error(title, message),
    onNavigate: (path, params) => navigate({ to: path as '/', params }),
  });

  // Build tabs with icons (hook returns badge counts, we add icons here)
  const tabs: TaskPageTab[] = useMemo(
    () => [
      { id: 'steps', label: 'Steps', icon: ListTodo },
      {
        id: 'artifacts',
        label: 'Artifacts',
        icon: FileText,
        badge: session.artifacts.length > 0 ? session.artifacts.length : undefined,
      },
      {
        id: 'changes',
        label: 'Changes',
        icon: GitCompare,
        badge: session.diffs.length > 0 ? session.diffs.length : undefined,
      },
      {
        id: 'commits',
        label: 'Commits',
        icon: GitCommitHorizontal,
        badge: session.commits.length > 0 ? session.commits.length : undefined,
      },
    ],
    [session.artifacts.length, session.diffs.length, session.commits.length]
  );

  // Loading state
  if (session.isLoadingTask) {
    return <TaskPage state="loading" />;
  }

  // Not found state
  if (!session.task) {
    return <TaskPage state="not-found" onNotFoundBack={() => navigate({ to: '/' })} />;
  }

  // Ready state
  return (
    <TaskPage
      state="ready"
      task={session.task}
      chats={session.chats}
      header={{
        onBack: session.handleBack,
        onStatusChange: session.handleStatusChange,
        onTitleEditToggle: session.handleTitleEditToggle,
        isTitleEditing: session.isTitleEditing,
        titleInputValue: session.titleInputValue,
        onTitleInputChange: session.handleTitleInputChange,
        onTitleEditSubmit: session.handleTitleEditSubmit,
        onTitleEditCancel: session.handleTitleEditCancel,
        onCreatePR: session.hasBranch ? session.handleCreatePR : undefined,
        onMoreActions: session.handleMoreActions,
      }}
      tabs={{
        tabs,
        activeTab: session.activeTab,
        onTabChange: session.setActiveTab,
      }}
      stepsPanel={{
        steps: session.workflowSteps,
        activeStepIndex: session.activeStepIndex,
        onStartStep: session.handleStartStep,
        onToggleStep: session.handleToggleStep,
        onSelectStep: session.handleSelectStep,
        onAddStep: session.handleAddStep,
        autoStart: session.autoStart,
        onAutoStartChange: session.setAutoStart,
        onCompleteStep: session.handleCompleteStep,
        onSkipStep: session.handleSkipStep,
        onViewChat: session.handleViewStepChat,
      }}
      mainPanel={{
        claudeEvents: session.claudeEvents,
        rawOutput: session.rawOutput,
        isRunning: session.isRunning,
        showRawOutput: session.showRawOutput,
        onToggleRawOutput: () => session.setShowRawOutput(!session.showRawOutput),
        messages: session.messages ?? [],
        onSendMessage: session.handleSendMessage,
        isProcessing: session.isRunningExecutor || session.isRunning,
        onStopProcess: session.handleStopProcess,
        executorProfiles: session.executorProfiles ?? [],
        selectedExecutorProfileId: session.selectedExecutorProfileId,
      }}
      artifactsTab={{
        artifacts: session.artifacts,
        loading: session.isLoadingArtifacts,
        onOpenArtifact: session.handleOpenArtifact,
        onPreviewArtifact: session.handlePreviewArtifact,
      }}
      changesTab={{
        diffs: session.diffs,
        expandedFiles: session.expandedDiffFiles,
        onFileToggle: session.handleFileToggle,
      }}
      commitsTab={{
        commits: session.commits,
        expandedCommits: session.expandedCommits,
        onCommitToggle: session.handleCommitToggle,
        onViewCommit: session.handleViewCommit,
      }}
      addStepDialog={{
        isOpen: session.addStepDialog.isOpen,
        onClose: session.handleCloseAddStepDialog,
        title: session.addStepDialog.title,
        description: session.addStepDialog.description,
        onTitleChange: session.handleNewStepTitleChange,
        onDescriptionChange: session.handleNewStepDescriptionChange,
        onCreateStep: session.handleCreateStep,
        isCreating: session.isCreatingChat,
      }}
      artifactPreviewDialog={{
        isOpen: session.previewArtifact !== null,
        onClose: session.handleClosePreview,
        fileName: session.previewArtifact?.name ?? '',
        content: session.previewContent,
        loading: session.isLoadingPreview,
      }}
      moreMenu={{
        isOpen: session.moreMenuState.isOpen,
        position: session.moreMenuState.position,
        onClose: session.handleCloseMoreMenu,
        onArchive: session.handleArchiveTask,
        onDelete: session.handleDeleteTask,
      }}
      confirmDialog={session.confirmDialogProps}
      createPRDialog={{
        isOpen: session.createPRDialog.isOpen,
        onClose: session.handleClosePRDialog,
        onCreate: session.handleSubmitPR,
        defaultTitle: session.createPRDialog.title,
        defaultBody: session.createPRDialog.body,
        defaultBase: session.createPRDialog.base,
        isSubmitting: session.isCreatingPR,
        error: session.createPRDialog.error,
        ghCliInstalled: session.ghCliInstalled,
        ghAuthenticated: session.ghAuthenticated,
      }}
    />
  );
}
