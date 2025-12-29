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

import { useState, useCallback, useMemo } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ListTodo, GitCompare, GitCommitHorizontal, AlertCircle } from 'lucide-react';
import {
  TaskLayout,
  StepsPanel,
  ChatPanel,
  DiffViewer,
  CommitList,
  Button,
} from '@openflow/ui';
import type { Tab } from '@openflow/ui';
import {
  useTask,
  useUpdateTask,
  useChat,
  useMessages,
  useCreateMessage,
  useStartWorkflowStep,
  useExecutorProfiles,
  useKeyboardShortcuts,
} from '@openflow/hooks';
import type {
  TaskStatus,
  WorkflowStep,
  FileDiff,
  Commit,
} from '@openflow/generated';
import { WorkflowStepStatus, MessageRole } from '@openflow/generated';

export const Route = createFileRoute('/tasks/$taskId')({
  component: TaskDetailPage,
});

function TaskDetailPage() {
  const { taskId } = Route.useParams();
  const navigate = useNavigate();

  // UI state
  const [activeTab, setActiveTab] = useState('steps');
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [autoStart, setAutoStart] = useState(false);
  const [isTitleEditing, setIsTitleEditing] = useState(false);
  const [titleInputValue, setTitleInputValue] = useState('');
  const [expandedDiffFiles, setExpandedDiffFiles] = useState<Set<string>>(
    new Set()
  );
  const [expandedCommits, setExpandedCommits] = useState<Set<string>>(
    new Set()
  );

  // Data fetching
  const { data: taskData, isLoading: isLoadingTask } = useTask(taskId);
  const { data: executorProfiles = [] } = useExecutorProfiles();
  const updateTask = useUpdateTask();
  const startWorkflowStep = useStartWorkflowStep();
  const createMessage = useCreateMessage();

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
      action: () => setActiveTab('changes'),
    },
    {
      key: '3',
      meta: true,
      action: () => setActiveTab('commits'),
    },
  ]);

  // Build workflow steps from chats
  const workflowSteps: WorkflowStep[] = useMemo(() => {
    return chats.map((chat, index) => ({
      index,
      name: chat.title ?? `Step ${index + 1}`,
      description: chat.initialPrompt ?? '',
      status: chat.setupCompletedAt
        ? WorkflowStepStatus.Completed
        : index === activeStepIndex
          ? WorkflowStepStatus.InProgress
          : WorkflowStepStatus.Pending,
      chatId: chat.id,
    }));
  }, [chats, activeStepIndex]);

  // Mock data for changes and commits (would come from git queries in real app)
  const diffs: FileDiff[] = useMemo(() => [], []);
  const commits: Commit[] = useMemo(() => [], []);

  // Tabs configuration
  const tabs: Tab[] = useMemo(() => {
    const tabsList: Tab[] = [{ id: 'steps', label: 'Steps', icon: ListTodo }];

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
  }, [diffs.length, commits.length]);

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
    (stepIndex: number) => {
      const chat = chats[stepIndex];
      if (!chat) return;
      startWorkflowStep.mutate(chat.id);
      setActiveStepIndex(stepIndex);
    },
    [chats, startWorkflowStep]
  );

  const handleToggleStep = useCallback(
    (_stepIndex: number, _completed: boolean) => {
      // TODO: Implement step completion toggle
    },
    []
  );

  const handleSelectStep = useCallback((stepIndex: number) => {
    setActiveStepIndex(stepIndex);
  }, []);

  const handleAddStep = useCallback(() => {
    // TODO: Open dialog to add new workflow step
    console.log('Add step clicked');
  }, []);

  const handleSendMessage = useCallback(
    (content: string) => {
      if (!activeChatId) return;
      createMessage.mutate({
        chatId: activeChatId,
        role: MessageRole.User,
        content,
      });
    },
    [activeChatId, createMessage]
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

  // Loading state
  if (isLoadingTask) {
    return (
      <div className="flex h-full items-center justify-center bg-[rgb(var(--background))]">
        <div className="text-sm text-[rgb(var(--muted-foreground))]">
          Loading task...
        </div>
      </div>
    );
  }

  // Not found state
  if (!task) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-[rgb(var(--background))] p-8">
        <AlertCircle className="mb-4 h-16 w-16 text-[rgb(var(--muted-foreground))]" />
        <h2 className="text-lg font-semibold text-[rgb(var(--foreground))]">
          Task not found
        </h2>
        <p className="mt-2 text-sm text-[rgb(var(--muted-foreground))]">
          The task you're looking for doesn't exist or has been deleted.
        </p>
        <Button
          variant="primary"
          className="mt-4"
          onClick={() => navigate({ to: '/' })}
        >
          Back to Dashboard
        </Button>
      </div>
    );
  }

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
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

  // Compute selected executor profile ID
  const selectedExecutorProfileId =
    activeChat?.executorProfileId ?? executorProfiles[0]?.id ?? '';

  // Determine if we have a branch for PR creation
  const hasBranch = chats.some((c) => c.branch);

  return (
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
        <ChatPanel
          messages={messages}
          onSendMessage={handleSendMessage}
          isProcessing={startWorkflowStep.isPending}
          onStopProcess={handleStopProcess}
          executorProfiles={executorProfiles}
          selectedExecutorProfileId={selectedExecutorProfileId}
          showExecutorSelector={executorProfiles.length > 1}
          placeholder="Type a message or instruction..."
        />
      }
      tabContent={renderTabContent()}
    />
  );
}
