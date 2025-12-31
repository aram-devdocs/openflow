/**
 * useTaskSession - Hook for managing task detail page state
 *
 * This hook encapsulates all the state management and effects for the
 * task detail page, keeping the route component pure.
 */

import type { Chat, Commit, FileDiff, Task, TaskStatus, WorkflowStep } from '@openflow/generated';
import { ChatRole, MessageRole, WorkflowStepStatus } from '@openflow/generated';
import type { ArtifactFile } from '@openflow/queries';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useArtifactContent, useArtifacts, useOpenArtifact } from './useArtifacts';
import { useChat, useCreateChat, useToggleStepComplete } from './useChats';
import { useClaudeEvents } from './useClaudeEvents';
import { useConfirmDialog } from './useConfirmDialog';
import { useExecutorProfiles, useRunExecutor } from './useExecutorProfiles';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';
import { useCreateMessage, useMessages } from './useMessages';
import { useKillProcess } from './useProcesses';
import { useArchiveTask, useDeleteTask, useTask, useUpdateTask } from './useTasks';

// ============================================================================
// Types
// ============================================================================

export interface UseTaskSessionOptions {
  /** Task ID to load */
  taskId: string;
  /** Callback for showing toast messages */
  onSuccess?: (title: string, message: string) => void;
  onError?: (title: string, message: string) => void;
  /** Navigation callback */
  onNavigate?: (path: string, params?: Record<string, string>) => void;
}

export interface MoreMenuState {
  isOpen: boolean;
  position: { x: number; y: number };
}

export interface AddStepDialogState {
  isOpen: boolean;
  title: string;
  description: string;
}

export interface TaskSessionState {
  // Data
  task: Task | undefined;
  chats: Chat[];
  messages: ReturnType<typeof useMessages>['data'];
  workflowSteps: WorkflowStep[];
  diffs: FileDiff[];
  commits: Commit[];
  artifacts: ArtifactFile[];
  isLoadingArtifacts: boolean;

  // UI State
  activeTab: string;
  activeStepIndex: number;
  autoStart: boolean;
  isTitleEditing: boolean;
  titleInputValue: string;
  expandedDiffFiles: Set<string>;
  expandedCommits: Set<string>;
  showRawOutput: boolean;

  // Streaming state
  claudeEvents: ReturnType<typeof useClaudeEvents>['events'];
  rawOutput: string[];
  isRunning: boolean;

  // Preview state
  previewArtifact: ArtifactFile | null;
  previewContent: string | null;
  isLoadingPreview: boolean;

  // Menu state
  moreMenuState: MoreMenuState;

  // Dialog state
  addStepDialog: AddStepDialogState;
  confirmDialogProps: ReturnType<typeof useConfirmDialog>['dialogProps'];

  // Executor profiles
  executorProfiles: ReturnType<typeof useExecutorProfiles>['data'];
  selectedExecutorProfileId: string;

  // Loading state
  isLoadingTask: boolean;
  hasBranch: boolean;

  // Mutation loading states
  isCreatingChat: boolean;
  isRunningExecutor: boolean;

  // Actions - Tab/Step
  setActiveTab: (tab: string) => void;
  setActiveStepIndex: (index: number) => void;
  setAutoStart: (value: boolean) => void;
  handleSelectStep: (stepIndex: number) => void;
  handleToggleStep: (stepIndex: number, completed: boolean) => void;
  handleStartStep: (stepIndex: number) => Promise<void>;

  // Actions - Title editing
  handleTitleEditToggle: () => void;
  handleTitleInputChange: (value: string) => void;
  handleTitleEditSubmit: () => void;
  handleTitleEditCancel: () => void;

  // Actions - Task status
  handleStatusChange: (status: TaskStatus) => void;

  // Actions - Navigation
  handleBack: () => void;
  handleCreatePR: () => void;

  // Actions - More menu
  handleMoreActions: (event?: React.MouseEvent) => void;
  handleCloseMoreMenu: () => void;
  handleArchiveTask: () => Promise<void>;
  handleDeleteTask: () => void;

  // Actions - Add step dialog
  handleAddStep: () => void;
  handleCloseAddStepDialog: () => void;
  handleNewStepTitleChange: (value: string) => void;
  handleNewStepDescriptionChange: (value: string) => void;
  handleCreateStep: (startImmediately: boolean) => Promise<void>;

  // Actions - Chat/Messages
  handleSendMessage: (content: string) => Promise<void>;
  handleStopProcess: () => void;
  setShowRawOutput: (value: boolean) => void;

  // Actions - Files/Commits
  handleFileToggle: (path: string) => void;
  handleCommitToggle: (hash: string) => void;
  handleViewCommit: (hash: string) => void;

  // Actions - Artifacts
  handleOpenArtifact: (artifact: ArtifactFile) => void;
  handlePreviewArtifact: (artifact: ArtifactFile) => void;
  handleClosePreview: () => void;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * useTaskSession hook for managing task detail page state.
 *
 * Encapsulates:
 * - Data fetching (task, chats, messages, artifacts, executor profiles)
 * - Claude event streaming and processing
 * - Workflow step management
 * - Tab and step navigation
 * - Title editing
 * - More actions menu
 * - Add step dialog
 * - Auto-start next step on completion
 *
 * @example
 * ```tsx
 * function TaskDetailPage() {
 *   const { taskId } = Route.useParams();
 *   const navigate = useNavigate();
 *   const toast = useToast();
 *   const session = useTaskSession({
 *     taskId,
 *     onSuccess: (title, message) => toast.success(title, message),
 *     onError: (title, message) => toast.error(title, message),
 *     onNavigate: (path, params) => navigate({ to: path, params }),
 *   });
 *
 *   if (session.isLoadingTask) return <SkeletonTaskDetail />;
 *   if (!session.task) return <TaskNotFound onBack={() => navigate({ to: '/' })} />;
 *
 *   return (
 *     <TaskLayout
 *       task={session.task}
 *       chats={session.chats}
 *       {...session}
 *     />
 *   );
 * }
 * ```
 */
export function useTaskSession({
  taskId,
  onSuccess,
  onError,
  onNavigate,
}: UseTaskSessionOptions): TaskSessionState {
  // =========================================================================
  // UI State
  // =========================================================================
  const [activeTab, setActiveTab] = useState('steps');
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [autoStart, setAutoStart] = useState(false);
  const [isTitleEditing, setIsTitleEditing] = useState(false);
  const [titleInputValue, setTitleInputValue] = useState('');
  const [expandedDiffFiles, setExpandedDiffFiles] = useState<Set<string>>(new Set());
  const [expandedCommits, setExpandedCommits] = useState<Set<string>>(new Set());
  const [activeProcessId, setActiveProcessId] = useState<string | null>(null);
  const [showRawOutput, setShowRawOutput] = useState(false);

  // Add Step dialog state
  const [addStepDialog, setAddStepDialog] = useState<AddStepDialogState>({
    isOpen: false,
    title: '',
    description: '',
  });

  // Artifact preview state
  const [previewArtifact, setPreviewArtifact] = useState<ArtifactFile | null>(null);

  // More actions menu state
  const [moreMenuState, setMoreMenuState] = useState<MoreMenuState>({
    isOpen: false,
    position: { x: 0, y: 0 },
  });

  // Confirm dialog
  const { dialogProps: confirmDialogProps, confirm } = useConfirmDialog();

  // Track previous completion state for auto-start detection
  const prevIsCompleteRef = useRef(false);

  // =========================================================================
  // Data Fetching
  // =========================================================================
  const { data: taskData, isLoading: isLoadingTask } = useTask(taskId);
  const { data: executorProfiles = [] } = useExecutorProfiles();
  const { data: artifacts = [], isLoading: isLoadingArtifacts } = useArtifacts(taskId);
  const { data: previewContent, isLoading: isLoadingPreview } = useArtifactContent(
    taskId,
    previewArtifact?.name ?? ''
  );

  // Mutations
  const updateTask = useUpdateTask();
  const runExecutor = useRunExecutor();
  const createMessage = useCreateMessage();
  const createChat = useCreateChat();
  const openArtifact = useOpenArtifact();
  const archiveTask = useArchiveTask();
  const deleteTask = useDeleteTask();
  const killProcess = useKillProcess();
  const toggleStepComplete = useToggleStepComplete();

  // Claude events for streaming output
  const {
    events: claudeEvents,
    rawOutput,
    isRunning,
    isComplete,
  } = useClaudeEvents(activeProcessId);

  // Get the task and chats
  const task = taskData?.task;
  const chats = taskData?.chats ?? [];

  // Find the active chat for the current step
  const activeChat = useMemo(() => {
    if (chats.length === 0) return null;
    const chatForStep = chats.find((c) => c.workflowStepIndex === activeStepIndex);
    return chatForStep ?? chats[0];
  }, [chats, activeStepIndex]);

  const activeChatId = activeChat?.id ?? '';
  const selectedExecutorProfileId = activeChat?.executorProfileId ?? executorProfiles[0]?.id ?? '';
  useChat(activeChatId); // Keep chat data in cache
  const { data: messages = [] } = useMessages(activeChatId);

  // =========================================================================
  // Keyboard Shortcuts
  // =========================================================================
  useKeyboardShortcuts([
    { key: '1', meta: true, action: () => setActiveTab('steps') },
    { key: '2', meta: true, action: () => setActiveTab('artifacts') },
    { key: '3', meta: true, action: () => setActiveTab('changes') },
    { key: '4', meta: true, action: () => setActiveTab('commits') },
  ]);

  // =========================================================================
  // Derived State
  // =========================================================================

  // Build workflow steps from chats
  const workflowSteps: WorkflowStep[] = useMemo(() => {
    return chats.map((chat, index) => ({
      index,
      name: chat.title ?? `Step ${index + 1}`,
      description: chat.initialPrompt ?? '',
      status: chat.setupCompletedAt
        ? WorkflowStepStatus.Completed
        : isRunning && activeChat?.id === chat.id
          ? WorkflowStepStatus.InProgress
          : WorkflowStepStatus.Pending,
      chatId: chat.id,
    }));
  }, [chats, activeChat?.id, isRunning]);

  // Mock data for changes and commits (would come from git queries in real app)
  const diffs: FileDiff[] = useMemo(() => [], []);
  const commits: Commit[] = useMemo(() => [], []);

  // Determine if we have a branch for PR creation
  const hasBranch = chats.some((c) => c.branch);

  // =========================================================================
  // Auto-start next step on completion
  // =========================================================================
  useEffect(() => {
    if (isComplete && !prevIsCompleteRef.current && autoStart && activeProcessId) {
      const currentStepIndex = activeStepIndex;
      const nextStepIndex = currentStepIndex + 1;
      const nextChat = chats[nextStepIndex];

      if (nextChat?.initialPrompt) {
        onSuccess?.('Step completed', `Finished "${activeChat?.title}"`);

        setTimeout(() => {
          handleStartStep(nextStepIndex);
        }, 500);
      } else {
        onSuccess?.('Workflow completed', 'All steps have finished');
      }
    }
    prevIsCompleteRef.current = isComplete;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isComplete,
    autoStart,
    activeProcessId,
    activeStepIndex,
    chats,
    activeChat?.title,
    onSuccess,
  ]);

  // =========================================================================
  // Callbacks - Status Change
  // =========================================================================
  const handleStatusChange = useCallback(
    (status: TaskStatus) => {
      if (!task) return;
      updateTask.mutate({ id: task.id, request: { status } });
    },
    [task, updateTask]
  );

  // =========================================================================
  // Callbacks - Title Editing
  // =========================================================================
  const handleTitleEditToggle = useCallback(() => {
    if (!task) return;
    setTitleInputValue(task.title);
    setIsTitleEditing(true);
  }, [task]);

  const handleTitleInputChange = useCallback((value: string) => {
    setTitleInputValue(value);
  }, []);

  const handleTitleEditSubmit = useCallback(() => {
    if (!task || !titleInputValue.trim()) return;
    updateTask.mutate(
      { id: task.id, request: { title: titleInputValue.trim() } },
      { onSuccess: () => setIsTitleEditing(false) }
    );
  }, [task, titleInputValue, updateTask]);

  const handleTitleEditCancel = useCallback(() => {
    setIsTitleEditing(false);
    setTitleInputValue('');
  }, []);

  // =========================================================================
  // Callbacks - Step Management
  // =========================================================================
  const handleStartStep = useCallback(
    async (stepIndex: number) => {
      const chat = chats[stepIndex];
      if (!chat || !chat.initialPrompt) return;

      try {
        const process = await runExecutor.mutateAsync({
          chatId: chat.id,
          prompt: chat.initialPrompt,
          executorProfileId: chat.executorProfileId,
        });
        setActiveProcessId(process.id);
        setActiveStepIndex(stepIndex);
        onSuccess?.('Step started', `Running "${chat.title}"`);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        onError?.('Failed to start step', message);
      }
    },
    [chats, runExecutor, onSuccess, onError]
  );

  const handleToggleStep = useCallback(
    (stepIndex: number, _completed: boolean) => {
      const chat = chats[stepIndex];
      if (!chat) return;

      toggleStepComplete.mutate(chat.id, {
        onSuccess: (updatedChat) => {
          const action = updatedChat.setupCompletedAt ? 'completed' : 'reopened';
          onSuccess?.('Step updated', `"${chat.title}" has been ${action}`);
        },
        onError: (error) => {
          const message = error instanceof Error ? error.message : 'Unknown error';
          onError?.('Failed to update step', message);
        },
      });
    },
    [chats, toggleStepComplete, onSuccess, onError]
  );

  const handleSelectStep = useCallback((stepIndex: number) => {
    setActiveStepIndex(stepIndex);
  }, []);

  // =========================================================================
  // Callbacks - Add Step Dialog
  // =========================================================================
  const handleAddStep = useCallback(() => {
    if (!task) return;
    setAddStepDialog({
      isOpen: true,
      title: `Step ${chats.length + 1}`,
      description: task.description || task.title,
    });
  }, [task, chats.length]);

  const handleCloseAddStepDialog = useCallback(() => {
    setAddStepDialog({ isOpen: false, title: '', description: '' });
  }, []);

  const handleNewStepTitleChange = useCallback((value: string) => {
    setAddStepDialog((prev) => ({ ...prev, title: value }));
  }, []);

  const handleNewStepDescriptionChange = useCallback((value: string) => {
    setAddStepDialog((prev) => ({ ...prev, description: value }));
  }, []);

  const handleCreateStep = useCallback(
    async (startImmediately: boolean) => {
      if (!task || !addStepDialog.title.trim()) return;

      const stepIndex = chats.length;
      const defaultExecutorProfile =
        executorProfiles.find((p) => p.isDefault) ?? executorProfiles[0];

      createChat.mutate(
        {
          taskId: task.id,
          projectId: task.projectId,
          title: addStepDialog.title.trim(),
          chatRole: ChatRole.Main,
          executorProfileId: defaultExecutorProfile?.id,
          initialPrompt: addStepDialog.description.trim() || task.title,
          workflowStepIndex: stepIndex,
        },
        {
          onSuccess: async (newChat) => {
            onSuccess?.('Step added', `Created "${newChat.title}"`);
            setActiveStepIndex(stepIndex);
            handleCloseAddStepDialog();

            if (startImmediately && newChat.initialPrompt) {
              try {
                const process = await runExecutor.mutateAsync({
                  chatId: newChat.id,
                  prompt: newChat.initialPrompt,
                  executorProfileId: newChat.executorProfileId,
                });
                setActiveProcessId(process.id);
              } catch (error) {
                const message = error instanceof Error ? error.message : 'Unknown error';
                onError?.('Failed to start step', message);
              }
            }
          },
          onError: (error) => {
            onError?.('Failed to add step', error.message);
          },
        }
      );
    },
    [
      task,
      chats.length,
      executorProfiles,
      createChat,
      runExecutor,
      addStepDialog,
      onSuccess,
      onError,
      handleCloseAddStepDialog,
    ]
  );

  // =========================================================================
  // Callbacks - Chat/Messages
  // =========================================================================
  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!activeChatId) return;

      createMessage.mutate({
        chatId: activeChatId,
        role: MessageRole.User,
        content,
      });

      try {
        const process = await runExecutor.mutateAsync({
          chatId: activeChatId,
          prompt: content,
          executorProfileId: selectedExecutorProfileId,
        });
        setActiveProcessId(process.id);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        onError?.('Failed to run executor', message);
      }
    },
    [activeChatId, createMessage, runExecutor, selectedExecutorProfileId, onError]
  );

  const handleStopProcess = useCallback(() => {
    if (!activeProcessId) return;
    killProcess.mutate(activeProcessId, {
      onSuccess: () => {
        setActiveProcessId(null);
        onSuccess?.('Process stopped', 'The executor process has been stopped');
      },
      onError: (error) => {
        const message = error instanceof Error ? error.message : 'Unknown error';
        onError?.('Failed to stop process', message);
      },
    });
  }, [activeProcessId, killProcess, onSuccess, onError]);

  // =========================================================================
  // Callbacks - Navigation
  // =========================================================================
  const handleBack = useCallback(() => {
    if (task?.projectId) {
      onNavigate?.('/projects/$projectId', { projectId: task.projectId });
    } else {
      onNavigate?.('/tasks');
    }
  }, [task?.projectId, onNavigate]);

  const handleCreatePR = useCallback(() => {
    // TODO: Implement PR creation
    console.log('Create PR clicked');
  }, []);

  // =========================================================================
  // Callbacks - More Actions Menu
  // =========================================================================
  const handleMoreActions = useCallback((event?: React.MouseEvent) => {
    const rect = (event?.currentTarget as HTMLElement)?.getBoundingClientRect();
    setMoreMenuState({
      isOpen: true,
      position: {
        x: rect ? rect.right : 0,
        y: rect ? rect.bottom + 4 : 0,
      },
    });
  }, []);

  const handleCloseMoreMenu = useCallback(() => {
    setMoreMenuState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const handleArchiveTask = useCallback(async () => {
    if (!task) return;
    handleCloseMoreMenu();

    try {
      await archiveTask.mutateAsync(task.id);
      onSuccess?.('Task archived', 'The task has been moved to the archive.');
      onNavigate?.('/tasks');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      onError?.('Failed to archive task', message);
    }
  }, [task, archiveTask, handleCloseMoreMenu, onSuccess, onError, onNavigate]);

  const handleDeleteTask = useCallback(() => {
    if (!task) return;
    handleCloseMoreMenu();

    confirm({
      title: 'Delete Task',
      description: `Are you sure you want to delete "${task.title}"? This will permanently delete all chats and messages and cannot be undone.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      variant: 'destructive',
      onConfirm: async () => {
        try {
          await deleteTask.mutateAsync(task.id);
          onSuccess?.('Task deleted', 'The task has been permanently deleted.');
          onNavigate?.('/tasks');
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          onError?.('Failed to delete task', message);
        }
      },
    });
  }, [task, handleCloseMoreMenu, confirm, deleteTask, onSuccess, onError, onNavigate]);

  // =========================================================================
  // Callbacks - File/Commit Toggles
  // =========================================================================
  const handleFileToggle = useCallback((path: string) => {
    setExpandedDiffFiles((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  const handleCommitToggle = useCallback((hash: string) => {
    setExpandedCommits((prev) => {
      const next = new Set(prev);
      if (next.has(hash)) {
        next.delete(hash);
      } else {
        next.add(hash);
      }
      return next;
    });
  }, []);

  const handleViewCommit = useCallback((_hash: string) => {
    // TODO: Show commit diff
    console.log('View commit clicked');
  }, []);

  // =========================================================================
  // Callbacks - Artifacts
  // =========================================================================
  const handleOpenArtifact = useCallback(
    (artifact: ArtifactFile) => {
      openArtifact.mutate(artifact.path, {
        onError: (error) => {
          onError?.('Failed to open artifact', error.message);
        },
      });
    },
    [openArtifact, onError]
  );

  const handlePreviewArtifact = useCallback((artifact: ArtifactFile) => {
    setPreviewArtifact(artifact);
  }, []);

  const handleClosePreview = useCallback(() => {
    setPreviewArtifact(null);
  }, []);

  // =========================================================================
  // Return State
  // =========================================================================
  return {
    // Data
    task,
    chats,
    messages,
    workflowSteps,
    diffs,
    commits,
    artifacts,
    isLoadingArtifacts,

    // UI State
    activeTab,
    activeStepIndex,
    autoStart,
    isTitleEditing,
    titleInputValue,
    expandedDiffFiles,
    expandedCommits,
    showRawOutput,

    // Streaming state
    claudeEvents,
    rawOutput,
    isRunning,

    // Preview state
    previewArtifact,
    previewContent: previewContent ?? null,
    isLoadingPreview,

    // Menu state
    moreMenuState,

    // Dialog state
    addStepDialog,
    confirmDialogProps,

    // Executor profiles
    executorProfiles,
    selectedExecutorProfileId,

    // Loading state
    isLoadingTask,
    hasBranch,

    // Mutation loading states
    isCreatingChat: createChat.isPending,
    isRunningExecutor: runExecutor.isPending,

    // Actions - Tab/Step
    setActiveTab,
    setActiveStepIndex,
    setAutoStart,
    handleSelectStep,
    handleToggleStep,
    handleStartStep,

    // Actions - Title editing
    handleTitleEditToggle,
    handleTitleInputChange,
    handleTitleEditSubmit,
    handleTitleEditCancel,

    // Actions - Task status
    handleStatusChange,

    // Actions - Navigation
    handleBack,
    handleCreatePR,

    // Actions - More menu
    handleMoreActions,
    handleCloseMoreMenu,
    handleArchiveTask,
    handleDeleteTask,

    // Actions - Add step dialog
    handleAddStep,
    handleCloseAddStepDialog,
    handleNewStepTitleChange,
    handleNewStepDescriptionChange,
    handleCreateStep,

    // Actions - Chat/Messages
    handleSendMessage,
    handleStopProcess,
    setShowRawOutput,

    // Actions - Files/Commits
    handleFileToggle,
    handleCommitToggle,
    handleViewCommit,

    // Actions - Artifacts
    handleOpenArtifact,
    handlePreviewArtifact,
    handleClosePreview,
  };
}
