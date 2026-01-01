/**
 * useTaskSession - Hook for managing task detail page state
 *
 * This hook encapsulates all the state management and effects for the
 * task detail page, keeping the route component pure.
 *
 * Features:
 * - Logger integration with DEBUG/INFO/WARN/ERROR levels
 * - Toast notifications for user feedback (success/error)
 * - Workflow step management with auto-start support
 * - Claude event streaming and processing
 * - PR creation via GitHub CLI integration
 * - Task archive/delete with confirmation dialogs
 *
 * @module useTaskSession
 */

import type { Chat, Commit, FileDiff, Task, TaskStatus, WorkflowStep } from '@openflow/generated';
import { ChatRole, MessageRole, WorkflowStepStatus } from '@openflow/generated';
import type { ArtifactFile } from '@openflow/queries';
import { createLogger } from '@openflow/utils';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useArtifactContent, useArtifacts, useOpenArtifact } from './useArtifacts';
import { useChat, useCreateChat, useToggleStepComplete } from './useChats';
import { useClaudeEvents } from './useClaudeEvents';
import { useConfirmDialog } from './useConfirmDialog';
import { useExecutorProfiles, useRunExecutor } from './useExecutorProfiles';
import { useTaskCommits, useTaskDiff } from './useGit';
import { useCreatePullRequest, useGhAuthStatus, useGhCliInstalled } from './useGitHub';
import { useGlobalShortcuts } from './useGlobalShortcuts';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';
import { useCreateMessage, useMessages } from './useMessages';
import { useKillProcess } from './useProcesses';
import { useArchiveTask, useDeleteTask, useTask, useUpdateTask } from './useTasks';
import { useToast } from './useToast';

// Create logger for this hook
const logger = createLogger('useTaskSession');

// ============================================================================
// Types
// ============================================================================

export interface UseTaskSessionOptions {
  /** Task ID to load */
  taskId: string;
  /**
   * Callback for showing success messages
   * @deprecated Toast notifications are now handled internally via useToast hook
   */
  onSuccess?: (title: string, message: string) => void;
  /**
   * Callback for showing error messages
   * @deprecated Toast notifications are now handled internally via useToast hook
   */
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

export interface CreatePRDialogState {
  isOpen: boolean;
  title: string;
  body: string;
  base: string;
  error: string | null;
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
  createPRDialog: CreatePRDialogState;
  confirmDialogProps: ReturnType<typeof useConfirmDialog>['dialogProps'];

  // GitHub CLI state
  ghCliInstalled: boolean;
  ghAuthenticated: boolean;
  isCreatingPR: boolean;

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
  handleCompleteStep: (stepIndex: number) => void;
  handleSkipStep: (stepIndex: number) => void;
  handleViewStepChat: (chatId: string) => void;

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

  // Actions - Create PR Dialog
  handleClosePRDialog: () => void;
  handlePRTitleChange: (value: string) => void;
  handlePRBodyChange: (value: string) => void;
  handlePRBaseChange: (value: string) => void;
  handleSubmitPR: (data: { title: string; body: string; base?: string; draft?: boolean }) => void;

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
  // Log hook initialization
  const initLoggedRef = useRef(false);
  if (!initLoggedRef.current) {
    logger.debug('Hook initialized', { taskId });
    initLoggedRef.current = true;
  }

  // =========================================================================
  // Toast Integration
  // =========================================================================
  const toast = useToast();

  // Helper to show success toast (also calls deprecated callback for backward compatibility)
  const showSuccess = useCallback(
    (title: string, message: string) => {
      toast.success(title, message);
      onSuccess?.(title, message);
    },
    [toast, onSuccess]
  );

  // Helper to show error toast (also calls deprecated callback for backward compatibility)
  const showError = useCallback(
    (title: string, message: string) => {
      toast.error(title, message);
      onError?.(title, message);
    },
    [toast, onError]
  );

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

  // Create PR dialog state
  const [createPRDialog, setCreatePRDialog] = useState<CreatePRDialogState>({
    isOpen: false,
    title: '',
    body: '',
    base: '',
    error: null,
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
  const createPullRequest = useCreatePullRequest();

  // GitHub CLI status
  const { data: ghCliInstalled = false } = useGhCliInstalled();
  const { isError: ghAuthError } = useGhAuthStatus();
  const ghAuthenticated = ghCliInstalled && !ghAuthError;

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
  // Keyboard Shortcuts (local to this page)
  // =========================================================================
  useKeyboardShortcuts([
    { key: '1', meta: true, action: () => setActiveTab('steps') },
    { key: '2', meta: true, action: () => setActiveTab('artifacts') },
    { key: '3', meta: true, action: () => setActiveTab('changes') },
    { key: '4', meta: true, action: () => setActiveTab('commits') },
  ]);

  // Global shortcuts (Cmd+,) - just settings for task page
  const { registerSettingsHandler } = useGlobalShortcuts();

  useEffect(() => {
    const unregisterSettings = registerSettingsHandler(() => {
      onNavigate?.('/settings');
    });

    return () => {
      unregisterSettings();
    };
  }, [registerSettingsHandler, onNavigate]);

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

  // Fetch git diffs only when Changes tab is active
  const { data: diffs = [] } = useTaskDiff(taskId, {
    enabled: activeTab === 'changes',
  });

  // Fetch git commits only when Commits tab is active
  const { data: commits = [] } = useTaskCommits(taskId, {
    enabled: activeTab === 'commits',
  });

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

      logger.debug('Step completed, checking auto-start', {
        currentStepIndex,
        nextStepIndex,
        hasNextStep: !!nextChat,
        autoStart,
      });

      if (nextChat?.initialPrompt) {
        logger.info('Auto-starting next step', {
          completedStep: activeChat?.title,
          nextStep: nextChat.title,
          nextStepIndex,
        });
        showSuccess('Step completed', `Finished "${activeChat?.title}"`);

        setTimeout(() => {
          handleStartStep(nextStepIndex);
        }, 500);
      } else {
        logger.info('Workflow completed', {
          taskId,
          totalSteps: chats.length,
        });
        showSuccess('Workflow completed', 'All steps have finished');
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
    showSuccess,
    taskId,
  ]);

  // =========================================================================
  // Callbacks - Status Change
  // =========================================================================
  const handleStatusChange = useCallback(
    (status: TaskStatus) => {
      if (!task) {
        logger.warn('handleStatusChange called without task');
        return;
      }

      logger.debug('Changing task status', {
        taskId: task.id,
        taskTitle: task.title,
        previousStatus: task.status,
        newStatus: status,
      });

      updateTask.mutate(
        { id: task.id, request: { status } },
        {
          onSuccess: () => {
            logger.info('Task status updated', {
              taskId: task.id,
              taskTitle: task.title,
              status,
            });
            showSuccess('Status updated', `Task status changed to ${status}`);
          },
          onError: (error) => {
            const message = error instanceof Error ? error.message : 'Unknown error';
            logger.error('Failed to update task status', {
              taskId: task.id,
              taskTitle: task.title,
              status,
              error: message,
            });
            showError('Failed to update status', message);
          },
        }
      );
    },
    [task, updateTask, showSuccess, showError]
  );

  // =========================================================================
  // Callbacks - Title Editing
  // =========================================================================
  const handleTitleEditToggle = useCallback(() => {
    if (!task) {
      logger.warn('handleTitleEditToggle called without task');
      return;
    }
    logger.debug('Title edit toggled', { taskId: task.id, taskTitle: task.title });
    setTitleInputValue(task.title);
    setIsTitleEditing(true);
  }, [task]);

  const handleTitleInputChange = useCallback((value: string) => {
    setTitleInputValue(value);
  }, []);

  const handleTitleEditSubmit = useCallback(() => {
    if (!task) {
      logger.warn('handleTitleEditSubmit called without task');
      return;
    }
    if (!titleInputValue.trim()) {
      logger.warn('Title edit submitted with empty value', { taskId: task.id });
      showError('Invalid title', 'Title cannot be empty');
      return;
    }

    const newTitle = titleInputValue.trim();
    logger.debug('Submitting title edit', {
      taskId: task.id,
      previousTitle: task.title,
      newTitle,
    });

    updateTask.mutate(
      { id: task.id, request: { title: newTitle } },
      {
        onSuccess: () => {
          logger.info('Task title updated', {
            taskId: task.id,
            previousTitle: task.title,
            newTitle,
          });
          setIsTitleEditing(false);
          showSuccess('Title updated', `Task renamed to "${newTitle}"`);
        },
        onError: (error) => {
          const message = error instanceof Error ? error.message : 'Unknown error';
          logger.error('Failed to update task title', {
            taskId: task.id,
            error: message,
          });
          showError('Failed to update title', message);
        },
      }
    );
  }, [task, titleInputValue, updateTask, showSuccess, showError]);

  const handleTitleEditCancel = useCallback(() => {
    logger.debug('Title edit cancelled');
    setIsTitleEditing(false);
    setTitleInputValue('');
  }, []);

  // =========================================================================
  // Callbacks - Step Management
  // =========================================================================
  const handleStartStep = useCallback(
    async (stepIndex: number) => {
      const chat = chats[stepIndex];
      if (!chat || !chat.initialPrompt) {
        logger.warn('handleStartStep called without valid chat', { stepIndex, hasChat: !!chat });
        return;
      }

      logger.debug('Starting step', {
        stepIndex,
        chatId: chat.id,
        chatTitle: chat.title,
        executorProfileId: chat.executorProfileId,
      });

      try {
        const process = await runExecutor.mutateAsync({
          chatId: chat.id,
          prompt: chat.initialPrompt,
          executorProfileId: chat.executorProfileId,
        });
        setActiveProcessId(process.id);
        setActiveStepIndex(stepIndex);
        logger.info('Step started successfully', {
          stepIndex,
          chatTitle: chat.title,
          processId: process.id,
        });
        showSuccess('Step started', `Running "${chat.title}"`);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error('Failed to start step', {
          stepIndex,
          chatId: chat.id,
          chatTitle: chat.title,
          error: message,
        });
        showError('Failed to start step', message);
      }
    },
    [chats, runExecutor, showSuccess, showError]
  );

  const handleToggleStep = useCallback(
    (stepIndex: number, _completed: boolean) => {
      const chat = chats[stepIndex];
      if (!chat) {
        logger.warn('handleToggleStep called without valid chat', { stepIndex });
        return;
      }

      logger.debug('Toggling step completion', {
        stepIndex,
        chatId: chat.id,
        chatTitle: chat.title,
        currentlyCompleted: !!chat.setupCompletedAt,
      });

      toggleStepComplete.mutate(chat.id, {
        onSuccess: (updatedChat) => {
          const action = updatedChat.setupCompletedAt ? 'completed' : 'reopened';
          logger.info('Step toggled', {
            chatId: chat.id,
            chatTitle: chat.title,
            action,
          });
          showSuccess('Step updated', `"${chat.title}" has been ${action}`);
        },
        onError: (error) => {
          const message = error instanceof Error ? error.message : 'Unknown error';
          logger.error('Failed to toggle step', {
            chatId: chat.id,
            chatTitle: chat.title,
            error: message,
          });
          showError('Failed to update step', message);
        },
      });
    },
    [chats, toggleStepComplete, showSuccess, showError]
  );

  const handleSelectStep = useCallback((stepIndex: number) => {
    logger.debug('Step selected', { stepIndex });
    setActiveStepIndex(stepIndex);
  }, []);

  const handleCompleteStep = useCallback(
    (stepIndex: number) => {
      const chat = chats[stepIndex];
      if (!chat) {
        logger.warn('handleCompleteStep called without valid chat', { stepIndex });
        return;
      }

      // If already completed, do nothing
      if (chat.setupCompletedAt) {
        logger.debug('Step already completed', { chatId: chat.id, chatTitle: chat.title });
        showSuccess('Step already completed', `"${chat.title}" is already marked as complete`);
        return;
      }

      logger.debug('Completing step', {
        stepIndex,
        chatId: chat.id,
        chatTitle: chat.title,
      });

      toggleStepComplete.mutate(chat.id, {
        onSuccess: () => {
          logger.info('Step completed', {
            chatId: chat.id,
            chatTitle: chat.title,
          });
          showSuccess('Step completed', `"${chat.title}" has been marked as complete`);
        },
        onError: (error) => {
          const message = error instanceof Error ? error.message : 'Unknown error';
          logger.error('Failed to complete step', {
            chatId: chat.id,
            chatTitle: chat.title,
            error: message,
          });
          showError('Failed to complete step', message);
        },
      });
    },
    [chats, toggleStepComplete, showSuccess, showError]
  );

  const handleSkipStep = useCallback(
    (stepIndex: number) => {
      const chat = chats[stepIndex];
      if (!chat) {
        logger.warn('handleSkipStep called without valid chat', { stepIndex });
        return;
      }

      // Skip is essentially marking as complete without running
      if (chat.setupCompletedAt) {
        logger.debug('Step already skipped/completed', { chatId: chat.id, chatTitle: chat.title });
        showSuccess('Step already skipped/completed', `"${chat.title}" is already done`);
        return;
      }

      logger.debug('Skipping step', {
        stepIndex,
        chatId: chat.id,
        chatTitle: chat.title,
      });

      toggleStepComplete.mutate(chat.id, {
        onSuccess: () => {
          logger.info('Step skipped', {
            chatId: chat.id,
            chatTitle: chat.title,
          });
          showSuccess('Step skipped', `"${chat.title}" has been skipped`);
        },
        onError: (error) => {
          const message = error instanceof Error ? error.message : 'Unknown error';
          logger.error('Failed to skip step', {
            chatId: chat.id,
            chatTitle: chat.title,
            error: message,
          });
          showError('Failed to skip step', message);
        },
      });
    },
    [chats, toggleStepComplete, showSuccess, showError]
  );

  const handleViewStepChat = useCallback(
    (chatId: string) => {
      logger.debug('Navigating to step chat', { chatId });
      onNavigate?.('/chats/$chatId', { chatId });
    },
    [onNavigate]
  );

  // =========================================================================
  // Callbacks - Add Step Dialog
  // =========================================================================
  const handleAddStep = useCallback(() => {
    if (!task) {
      logger.warn('handleAddStep called without task');
      return;
    }
    logger.debug('Opening add step dialog', { taskId: task.id, currentStepCount: chats.length });
    setAddStepDialog({
      isOpen: true,
      title: `Step ${chats.length + 1}`,
      description: task.description || task.title,
    });
  }, [task, chats.length]);

  const handleCloseAddStepDialog = useCallback(() => {
    logger.debug('Closing add step dialog');
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
      if (!task) {
        logger.warn('handleCreateStep called without task');
        return;
      }
      if (!addStepDialog.title.trim()) {
        logger.warn('handleCreateStep called with empty title', { taskId: task.id });
        showError('Invalid step', 'Step title cannot be empty');
        return;
      }

      const stepIndex = chats.length;
      const stepTitle = addStepDialog.title.trim();
      const defaultExecutorProfile =
        executorProfiles.find((p) => p.isDefault) ?? executorProfiles[0];

      logger.debug('Creating step', {
        taskId: task.id,
        stepIndex,
        stepTitle,
        startImmediately,
        executorProfileId: defaultExecutorProfile?.id,
      });

      createChat.mutate(
        {
          taskId: task.id,
          projectId: task.projectId,
          title: stepTitle,
          chatRole: ChatRole.Main,
          executorProfileId: defaultExecutorProfile?.id,
          initialPrompt: addStepDialog.description.trim() || task.title,
          workflowStepIndex: stepIndex,
        },
        {
          onSuccess: async (newChat) => {
            logger.info('Step created', {
              chatId: newChat.id,
              chatTitle: newChat.title,
              stepIndex,
              startImmediately,
            });
            showSuccess('Step added', `Created "${newChat.title}"`);
            setActiveStepIndex(stepIndex);
            handleCloseAddStepDialog();

            if (startImmediately && newChat.initialPrompt) {
              logger.debug('Auto-starting new step', {
                chatId: newChat.id,
                chatTitle: newChat.title,
              });
              try {
                const process = await runExecutor.mutateAsync({
                  chatId: newChat.id,
                  prompt: newChat.initialPrompt,
                  executorProfileId: newChat.executorProfileId,
                });
                setActiveProcessId(process.id);
                logger.info('New step started', {
                  chatId: newChat.id,
                  processId: process.id,
                });
              } catch (error) {
                const message = error instanceof Error ? error.message : 'Unknown error';
                logger.error('Failed to auto-start new step', {
                  chatId: newChat.id,
                  error: message,
                });
                showError('Failed to start step', message);
              }
            }
          },
          onError: (error) => {
            const message = error instanceof Error ? error.message : 'Unknown error';
            logger.error('Failed to create step', {
              taskId: task.id,
              stepTitle,
              error: message,
            });
            showError('Failed to add step', message);
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
      showSuccess,
      showError,
      handleCloseAddStepDialog,
    ]
  );

  // =========================================================================
  // Callbacks - Chat/Messages
  // =========================================================================
  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!activeChatId) {
        logger.warn('handleSendMessage called without active chat');
        return;
      }

      logger.debug('Sending message', {
        chatId: activeChatId,
        contentLength: content.length,
        executorProfileId: selectedExecutorProfileId,
      });

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
        logger.info('Executor started after message', {
          chatId: activeChatId,
          processId: process.id,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error('Failed to run executor after message', {
          chatId: activeChatId,
          error: message,
        });
        showError('Failed to run executor', message);
      }
    },
    [activeChatId, createMessage, runExecutor, selectedExecutorProfileId, showError]
  );

  const handleStopProcess = useCallback(() => {
    if (!activeProcessId) {
      logger.warn('handleStopProcess called without active process');
      return;
    }

    logger.debug('Stopping process', { processId: activeProcessId });

    killProcess.mutate(activeProcessId, {
      onSuccess: () => {
        logger.info('Process stopped', { processId: activeProcessId });
        setActiveProcessId(null);
        showSuccess('Process stopped', 'The executor process has been stopped');
      },
      onError: (error) => {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error('Failed to stop process', {
          processId: activeProcessId,
          error: message,
        });
        showError('Failed to stop process', message);
      },
    });
  }, [activeProcessId, killProcess, showSuccess, showError]);

  // =========================================================================
  // Callbacks - Navigation
  // =========================================================================
  const handleBack = useCallback(() => {
    if (task?.projectId) {
      logger.debug('Navigating back to project', { projectId: task.projectId });
      onNavigate?.('/projects/$projectId', { projectId: task.projectId });
    } else {
      logger.debug('Navigating back to tasks list');
      onNavigate?.('/tasks');
    }
  }, [task?.projectId, onNavigate]);

  const handleCreatePR = useCallback(() => {
    if (!task) {
      logger.warn('handleCreatePR called without task');
      return;
    }
    logger.debug('Opening Create PR dialog', { taskId: task.id, taskTitle: task.title });
    setCreatePRDialog({
      isOpen: true,
      title: task.title,
      body: task.description || '',
      base: '',
      error: null,
    });
  }, [task]);

  // =========================================================================
  // Callbacks - Create PR Dialog
  // =========================================================================
  const handleClosePRDialog = useCallback(() => {
    logger.debug('Closing Create PR dialog');
    setCreatePRDialog((prev) => ({ ...prev, isOpen: false, error: null }));
  }, []);

  const handlePRTitleChange = useCallback((value: string) => {
    setCreatePRDialog((prev) => ({ ...prev, title: value }));
  }, []);

  const handlePRBodyChange = useCallback((value: string) => {
    setCreatePRDialog((prev) => ({ ...prev, body: value }));
  }, []);

  const handlePRBaseChange = useCallback((value: string) => {
    setCreatePRDialog((prev) => ({ ...prev, base: value }));
  }, []);

  const handleSubmitPR = useCallback(
    (data: { title: string; body: string; base?: string; draft?: boolean }) => {
      if (!task) {
        logger.warn('handleSubmitPR called without task');
        return;
      }

      logger.debug('Submitting PR', {
        taskId: task.id,
        prTitle: data.title,
        base: data.base,
        draft: data.draft,
      });

      createPullRequest.mutate(
        {
          taskId: task.id,
          title: data.title,
          body: data.body,
          base: data.base,
          draft: data.draft,
        },
        {
          onSuccess: (result) => {
            logger.info('Pull Request created', {
              taskId: task.id,
              prNumber: result.number,
              prUrl: result.url,
            });
            showSuccess('Pull Request Created', `View at ${result.url}`);
            handleClosePRDialog();
            // Optionally open the PR URL in browser
            if (typeof window !== 'undefined') {
              window.open(result.url, '_blank');
            }
          },
          onError: (error) => {
            const message = error instanceof Error ? error.message : 'Failed to create PR';
            logger.error('Failed to create PR', {
              taskId: task.id,
              prTitle: data.title,
              error: message,
            });
            setCreatePRDialog((prev) => ({ ...prev, error: message }));
            showError('Failed to create PR', message);
          },
        }
      );
    },
    [task, createPullRequest, showSuccess, showError, handleClosePRDialog]
  );

  // =========================================================================
  // Callbacks - More Actions Menu
  // =========================================================================
  const handleMoreActions = useCallback((event?: React.MouseEvent) => {
    logger.debug('Opening more actions menu');
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
    logger.debug('Closing more actions menu');
    setMoreMenuState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const handleArchiveTask = useCallback(async () => {
    if (!task) {
      logger.warn('handleArchiveTask called without task');
      return;
    }
    handleCloseMoreMenu();

    logger.debug('Archiving task', { taskId: task.id, taskTitle: task.title });

    try {
      await archiveTask.mutateAsync(task.id);
      logger.info('Task archived', { taskId: task.id, taskTitle: task.title });
      showSuccess('Task archived', 'The task has been moved to the archive.');
      onNavigate?.('/tasks');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to archive task', {
        taskId: task.id,
        taskTitle: task.title,
        error: message,
      });
      showError('Failed to archive task', message);
    }
  }, [task, archiveTask, handleCloseMoreMenu, showSuccess, showError, onNavigate]);

  const handleDeleteTask = useCallback(() => {
    if (!task) {
      logger.warn('handleDeleteTask called without task');
      return;
    }
    handleCloseMoreMenu();

    logger.debug('Opening delete confirmation dialog', { taskId: task.id, taskTitle: task.title });

    confirm({
      title: 'Delete Task',
      description: `Are you sure you want to delete "${task.title}"? This will permanently delete all chats and messages and cannot be undone.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      variant: 'destructive',
      onConfirm: async () => {
        logger.debug('Delete confirmed', { taskId: task.id, taskTitle: task.title });
        try {
          await deleteTask.mutateAsync(task.id);
          logger.info('Task deleted', { taskId: task.id, taskTitle: task.title });
          showSuccess('Task deleted', 'The task has been permanently deleted.');
          onNavigate?.('/tasks');
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          logger.error('Failed to delete task', {
            taskId: task.id,
            taskTitle: task.title,
            error: message,
          });
          showError('Failed to delete task', message);
        }
      },
    });
  }, [task, handleCloseMoreMenu, confirm, deleteTask, showSuccess, showError, onNavigate]);

  // =========================================================================
  // Callbacks - File/Commit Toggles
  // =========================================================================
  const handleFileToggle = useCallback((path: string) => {
    logger.debug('Toggling file expansion', { path });
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
    logger.debug('Toggling commit expansion', { hash });
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

  const handleViewCommit = useCallback((hash: string) => {
    // TODO: Show commit diff
    logger.debug('View commit clicked', { hash });
  }, []);

  // =========================================================================
  // Callbacks - Artifacts
  // =========================================================================
  const handleOpenArtifact = useCallback(
    (artifact: ArtifactFile) => {
      logger.debug('Opening artifact', { path: artifact.path, name: artifact.name });
      openArtifact.mutate(
        { path: artifact.path, fileName: artifact.name },
        {
          onSuccess: () => {
            logger.info('Artifact opened', { path: artifact.path, name: artifact.name });
          },
          onError: (error) => {
            const message = error instanceof Error ? error.message : 'Unknown error';
            logger.error('Failed to open artifact', {
              path: artifact.path,
              name: artifact.name,
              error: message,
            });
            showError('Failed to open artifact', message);
          },
        }
      );
    },
    [openArtifact, showError]
  );

  const handlePreviewArtifact = useCallback((artifact: ArtifactFile) => {
    logger.debug('Opening artifact preview', { path: artifact.path, name: artifact.name });
    setPreviewArtifact(artifact);
  }, []);

  const handleClosePreview = useCallback(() => {
    logger.debug('Closing artifact preview');
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
    createPRDialog,
    confirmDialogProps,

    // GitHub CLI state
    ghCliInstalled,
    ghAuthenticated,
    isCreatingPR: createPullRequest.isPending,

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
    handleCompleteStep,
    handleSkipStep,
    handleViewStepChat,

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

    // Actions - Create PR Dialog
    handleClosePRDialog,
    handlePRTitleChange,
    handlePRBodyChange,
    handlePRBaseChange,
    handleSubmitPR,

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
