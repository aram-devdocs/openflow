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
 * Uses TaskLayout template with tabs for Steps, Changes, and Commits.
 * Follows the orchestration pattern: connects hooks to UI components.
 * Keeps page logic minimal (<200 lines) by delegating to UI components.
 */

import type { Commit, FileDiff, TaskStatus, WorkflowStep } from '@openflow/generated';
import { ChatRole, MessageRole, WorkflowStepStatus } from '@openflow/generated';
import {
  useArtifactContent,
  useArtifacts,
  useChat,
  useClaudeEvents,
  useCreateChat,
  useCreateMessage,
  useExecutorProfiles,
  useKeyboardShortcuts,
  useMessages,
  useOpenArtifact,
  useRunExecutor,
  useTask,
  useUpdateTask,
} from '@openflow/hooks';
import type { ArtifactFile } from '@openflow/queries';
import {
  ArtifactPreviewDialog,
  ArtifactsPanel,
  Button,
  ChatPanel,
  ClaudeEventRenderer,
  CommitList,
  Dialog,
  DialogContent,
  DialogFooter,
  DiffViewer,
  Input,
  SkeletonTaskDetail,
  StepsPanel,
  TaskLayout,
  Textarea,
  useToast,
} from '@openflow/ui';
import type { Tab } from '@openflow/ui';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import {
  AlertCircle,
  FileText,
  GitCommitHorizontal,
  GitCompare,
  ListTodo,
  Terminal,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export const Route = createFileRoute('/tasks/$taskId')({
  component: TaskDetailPage,
});

function TaskDetailPage() {
  const { taskId } = Route.useParams();
  const navigate = useNavigate();
  const toast = useToast();

  // UI state
  const [activeTab, setActiveTab] = useState('steps');
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [autoStart, setAutoStart] = useState(false);
  const [isTitleEditing, setIsTitleEditing] = useState(false);
  const [titleInputValue, setTitleInputValue] = useState('');
  const [expandedDiffFiles, setExpandedDiffFiles] = useState<Set<string>>(new Set());
  const [expandedCommits, setExpandedCommits] = useState<Set<string>>(new Set());
  const [activeProcessId, setActiveProcessId] = useState<string | null>(null);
  const [showRawOutput, setShowRawOutput] = useState(false);

  // Add Step dialog state
  const [isAddStepDialogOpen, setIsAddStepDialogOpen] = useState(false);
  const [newStepTitle, setNewStepTitle] = useState('');
  const [newStepDescription, setNewStepDescription] = useState('');

  // Artifact preview state
  const [previewArtifact, setPreviewArtifact] = useState<ArtifactFile | null>(null);

  // Data fetching
  const { data: taskData, isLoading: isLoadingTask } = useTask(taskId);
  const { data: executorProfiles = [] } = useExecutorProfiles();
  const { data: artifacts = [], isLoading: isLoadingArtifacts } = useArtifacts(taskId);
  const { data: previewContent, isLoading: isLoadingPreview } = useArtifactContent(
    taskId,
    previewArtifact?.name ?? ''
  );
  const updateTask = useUpdateTask();
  const runExecutor = useRunExecutor();
  const createMessage = useCreateMessage();
  const createChat = useCreateChat();
  const openArtifact = useOpenArtifact();

  // Claude events for streaming output
  const {
    events: claudeEvents,
    rawOutput,
    isRunning,
    isComplete,
  } = useClaudeEvents(activeProcessId);

  // Get the active chat based on the selected step
  const task = taskData?.task;
  const chats = taskData?.chats ?? [];

  // Find the active chat for the current step
  const activeChat = useMemo(() => {
    if (chats.length === 0) return null;
    // Find chat by workflow step index, or fall back to first chat
    const chatForStep = chats.find((c) => c.workflowStepIndex === activeStepIndex);
    return chatForStep ?? chats[0];
  }, [chats, activeStepIndex]);

  const activeChatId = activeChat?.id ?? '';
  const selectedExecutorProfileId = activeChat?.executorProfileId ?? executorProfiles[0]?.id ?? '';
  useChat(activeChatId); // Keep chat data in cache
  const { data: messages = [] } = useMessages(activeChatId);

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: '1',
      meta: true,
      action: () => setActiveTab('steps'),
    },
    {
      key: '2',
      meta: true,
      action: () => setActiveTab('artifacts'),
    },
    {
      key: '3',
      meta: true,
      action: () => setActiveTab('changes'),
    },
    {
      key: '4',
      meta: true,
      action: () => setActiveTab('commits'),
    },
  ]);

  // Build workflow steps from chats
  // Status is based on actual execution state, not selection
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

  // Track previous completion state for auto-start detection
  const prevIsCompleteRef = useRef(false);

  // Mock data for changes and commits (would come from git queries in real app)
  const diffs: FileDiff[] = useMemo(() => [], []);
  const commits: Commit[] = useMemo(() => [], []);

  // Tabs configuration
  const tabs: Tab[] = useMemo(() => {
    const tabsList: Tab[] = [{ id: 'steps', label: 'Steps', icon: ListTodo }];

    // Artifacts tab with badge showing count
    if (artifacts.length > 0) {
      tabsList.push({
        id: 'artifacts',
        label: 'Artifacts',
        icon: FileText,
        badge: artifacts.length,
      });
    } else {
      tabsList.push({
        id: 'artifacts',
        label: 'Artifacts',
        icon: FileText,
      });
    }

    if (diffs.length > 0) {
      tabsList.push({
        id: 'changes',
        label: 'Changes',
        icon: GitCompare,
        badge: diffs.length,
      });
    } else {
      tabsList.push({
        id: 'changes',
        label: 'Changes',
        icon: GitCompare,
      });
    }

    if (commits.length > 0) {
      tabsList.push({
        id: 'commits',
        label: 'Commits',
        icon: GitCommitHorizontal,
        badge: commits.length,
      });
    } else {
      tabsList.push({
        id: 'commits',
        label: 'Commits',
        icon: GitCommitHorizontal,
      });
    }

    return tabsList;
  }, [artifacts.length, diffs.length, commits.length]);

  // Callbacks
  const handleStatusChange = useCallback(
    (status: TaskStatus) => {
      if (!task) return;
      updateTask.mutate({ id: task.id, request: { status } });
    },
    [task, updateTask]
  );

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
      {
        onSuccess: () => {
          setIsTitleEditing(false);
        },
      }
    );
  }, [task, titleInputValue, updateTask]);

  const handleTitleEditCancel = useCallback(() => {
    setIsTitleEditing(false);
    setTitleInputValue('');
  }, []);

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
        toast.success('Step started', `Running "${chat.title}"`);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        toast.error('Failed to start step', message);
      }
    },
    [chats, runExecutor, toast]
  );

  // Auto-start next step when current step completes
  useEffect(() => {
    // Detect transition from not-complete to complete
    if (isComplete && !prevIsCompleteRef.current && autoStart && activeProcessId) {
      const currentStepIndex = activeStepIndex;
      const nextStepIndex = currentStepIndex + 1;
      const nextChat = chats[nextStepIndex];

      if (nextChat?.initialPrompt) {
        // Mark current step as complete (would persist to DB in real app)
        toast.success('Step completed', `Finished "${activeChat?.title}"`);

        // Small delay before starting next step for UX
        setTimeout(() => {
          handleStartStep(nextStepIndex);
        }, 500);
      } else {
        // No more steps to run
        toast.success('Workflow completed', 'All steps have finished');
      }
    }
    prevIsCompleteRef.current = isComplete;
  }, [
    isComplete,
    autoStart,
    activeProcessId,
    activeStepIndex,
    chats,
    activeChat?.title,
    handleStartStep,
    toast,
  ]);

  const handleToggleStep = useCallback((_stepIndex: number, _completed: boolean) => {
    // TODO: Implement step completion toggle
  }, []);

  const handleSelectStep = useCallback((stepIndex: number) => {
    setActiveStepIndex(stepIndex);
  }, []);

  // Open the Add Step dialog with default values
  const handleAddStep = useCallback(() => {
    if (!task) return;
    // Pre-fill with task title/description as defaults
    setNewStepTitle(`Step ${chats.length + 1}`);
    setNewStepDescription(task.description || task.title);
    setIsAddStepDialogOpen(true);
  }, [task, chats.length]);

  // Close the Add Step dialog
  const handleCloseAddStepDialog = useCallback(() => {
    setIsAddStepDialogOpen(false);
    setNewStepTitle('');
    setNewStepDescription('');
  }, []);

  // Create the step and optionally auto-start it
  const handleCreateStep = useCallback(
    async (startImmediately: boolean) => {
      if (!task || !newStepTitle.trim()) return;

      const stepIndex = chats.length;
      const defaultExecutorProfile =
        executorProfiles.find((p) => p.isDefault) ?? executorProfiles[0];

      createChat.mutate(
        {
          taskId: task.id,
          projectId: task.projectId,
          title: newStepTitle.trim(),
          chatRole: ChatRole.Main,
          executorProfileId: defaultExecutorProfile?.id,
          initialPrompt: newStepDescription.trim() || task.title,
          workflowStepIndex: stepIndex,
        },
        {
          onSuccess: async (newChat) => {
            toast.success('Step added', `Created "${newChat.title}"`);
            setActiveStepIndex(stepIndex);
            handleCloseAddStepDialog();

            // Auto-start if requested
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
                toast.error('Failed to start step', message);
              }
            }
          },
          onError: (error) => {
            toast.error('Failed to add step', error.message);
          },
        }
      );
    },
    [
      task,
      chats.length,
      executorProfiles,
      createChat,
      toast,
      newStepTitle,
      newStepDescription,
      handleCloseAddStepDialog,
      runExecutor,
    ]
  );

  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!activeChatId) return;

      // 1. Create user message in DB
      createMessage.mutate({
        chatId: activeChatId,
        role: MessageRole.User,
        content,
      });

      // 2. Start executor with the message as prompt
      try {
        const process = await runExecutor.mutateAsync({
          chatId: activeChatId,
          prompt: content,
          executorProfileId: selectedExecutorProfileId,
        });
        setActiveProcessId(process.id);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        toast.error('Failed to run executor', message);
      }
    },
    [activeChatId, createMessage, runExecutor, selectedExecutorProfileId, toast]
  );

  const handleStopProcess = useCallback(() => {
    // TODO: Implement process stopping
    console.log('Stop process clicked');
  }, []);

  const handleCreatePR = useCallback(() => {
    // TODO: Implement PR creation
    console.log('Create PR clicked');
  }, []);

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

  // Artifact handlers
  const handleOpenArtifact = useCallback(
    (artifact: ArtifactFile) => {
      openArtifact.mutate(artifact.path, {
        onError: (error) => {
          toast.error('Failed to open artifact', error.message);
        },
      });
    },
    [openArtifact, toast]
  );

  const handlePreviewArtifact = useCallback((artifact: ArtifactFile) => {
    setPreviewArtifact(artifact);
  }, []);

  const handleClosePreview = useCallback(() => {
    setPreviewArtifact(null);
  }, []);

  // Loading state
  if (isLoadingTask) {
    return <SkeletonTaskDetail />;
  }

  // Not found state
  if (!task) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-[rgb(var(--background))] p-8">
        <AlertCircle className="mb-4 h-16 w-16 text-[rgb(var(--muted-foreground))]" />
        <h2 className="text-lg font-semibold text-[rgb(var(--foreground))]">Task not found</h2>
        <p className="mt-2 text-sm text-[rgb(var(--muted-foreground))]">
          The task you're looking for doesn't exist or has been deleted.
        </p>
        <Button variant="primary" className="mt-4" onClick={() => navigate({ to: '/' })}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'artifacts':
        return (
          <ArtifactsPanel
            artifacts={artifacts}
            loading={isLoadingArtifacts}
            onOpenArtifact={handleOpenArtifact}
            onPreviewArtifact={handlePreviewArtifact}
          />
        );
      case 'changes':
        return (
          <div className="p-4">
            <DiffViewer
              diffs={diffs}
              expandedFiles={expandedDiffFiles}
              onFileToggle={handleFileToggle}
              showLineNumbers
            />
          </div>
        );
      case 'commits':
        return (
          <div className="p-4">
            <CommitList
              commits={commits}
              expandedCommits={expandedCommits}
              onCommitToggle={handleCommitToggle}
              onViewCommit={handleViewCommit}
            />
          </div>
        );
      default:
        return null;
    }
  };

  // Determine if we have a branch for PR creation
  const hasBranch = chats.some((c) => c.branch);

  return (
    <>
      <TaskLayout
        task={task}
        chats={chats}
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onStatusChange={handleStatusChange}
        onTitleEditToggle={handleTitleEditToggle}
        isTitleEditing={isTitleEditing}
        titleInputValue={titleInputValue}
        onTitleInputChange={handleTitleInputChange}
        onTitleEditSubmit={handleTitleEditSubmit}
        onTitleEditCancel={handleTitleEditCancel}
        {...(hasBranch && { onCreatePR: handleCreatePR })}
        stepsPanel={
          <StepsPanel
            steps={workflowSteps}
            activeStepIndex={activeStepIndex}
            onStartStep={handleStartStep}
            onToggleStep={handleToggleStep}
            onSelectStep={handleSelectStep}
            onAddStep={handleAddStep}
            autoStart={autoStart}
            onAutoStartChange={setAutoStart}
          />
        }
        mainPanel={
          <div className="flex h-full flex-col">
            {/* Claude streaming output */}
            {(claudeEvents.length > 0 || isRunning || rawOutput.length > 0) && (
              <div className="flex-1 overflow-auto border-b border-[rgb(var(--border))]">
                {/* Output header with view toggle */}
                <div className="flex items-center justify-between border-b border-[rgb(var(--border))] px-4 py-2">
                  <span className="text-xs font-medium text-[rgb(var(--muted-foreground))]">
                    {isRunning ? 'Running...' : 'Output'}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowRawOutput(!showRawOutput)}
                    className="h-7 gap-1.5 px-2 text-xs"
                  >
                    <Terminal className="h-3.5 w-3.5" />
                    {showRawOutput ? 'Formatted' : 'Raw'}
                  </Button>
                </div>
                <div className="p-4">
                  <ClaudeEventRenderer
                    events={claudeEvents}
                    isStreaming={isRunning}
                    showRawOutput={showRawOutput}
                    rawOutput={rawOutput}
                  />
                </div>
              </div>
            )}
            {/* Chat input panel */}
            <ChatPanel
              messages={messages}
              onSendMessage={handleSendMessage}
              isProcessing={runExecutor.isPending || isRunning}
              onStopProcess={handleStopProcess}
              executorProfiles={executorProfiles}
              selectedExecutorProfileId={selectedExecutorProfileId}
              showExecutorSelector={executorProfiles.length > 1}
              placeholder="Type a message or instruction..."
            />
          </div>
        }
        tabContent={renderTabContent()}
      />

      {/* Add Step Dialog */}
      <Dialog
        isOpen={isAddStepDialogOpen}
        onClose={handleCloseAddStepDialog}
        title="Add New Step"
        size="md"
      >
        <DialogContent>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="step-title"
                className="mb-1.5 block text-sm font-medium text-[rgb(var(--foreground))]"
              >
                Title
              </label>
              <Input
                id="step-title"
                value={newStepTitle}
                onChange={(e) => setNewStepTitle(e.target.value)}
                placeholder="Step name..."
                autoFocus
              />
            </div>
            <div>
              <label
                htmlFor="step-description"
                className="mb-1.5 block text-sm font-medium text-[rgb(var(--foreground))]"
              >
                Prompt / Instructions
              </label>
              <Textarea
                id="step-description"
                value={newStepDescription}
                onChange={(e) => setNewStepDescription(e.target.value)}
                placeholder="Describe what this step should accomplish..."
                rows={5}
              />
              <p className="mt-1.5 text-xs text-[rgb(var(--muted-foreground))]">
                This will be sent to the AI agent when the step is started.
              </p>
            </div>
          </div>
        </DialogContent>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={handleCloseAddStepDialog}
            disabled={createChat.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="secondary"
            onClick={() => handleCreateStep(false)}
            disabled={!newStepTitle.trim() || createChat.isPending}
            loading={createChat.isPending}
            loadingText="Adding..."
          >
            Add Step
          </Button>
          <Button
            variant="primary"
            onClick={() => handleCreateStep(true)}
            disabled={!newStepTitle.trim() || createChat.isPending}
            loading={createChat.isPending}
            loadingText="Adding..."
          >
            Add & Start
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Artifact Preview Dialog */}
      <ArtifactPreviewDialog
        isOpen={previewArtifact !== null}
        onClose={handleClosePreview}
        fileName={previewArtifact?.name ?? ''}
        content={previewContent ?? null}
        loading={isLoadingPreview}
      />
    </>
  );
}
