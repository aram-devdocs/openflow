/**
 * TaskPageComponents - UI components for the Task Detail Page
 *
 * These components are stateless and receive all data/callbacks via props.
 * They are composed by the route to build the task detail page.
 */

import type { Commit, ExecutorProfile, FileDiff, Message, WorkflowStep } from '@openflow/generated';
import { AlertCircle, Terminal } from 'lucide-react';
import { Button } from '../atoms/Button';
import { Input } from '../atoms/Input';
import { Textarea } from '../atoms/Textarea';
import { Dialog, DialogContent, DialogFooter } from '../molecules/Dialog';
import type { ArtifactFile } from './ArtifactsPanel';
import { ArtifactsPanel } from './ArtifactsPanel';
import { ChatPanel } from './ChatPanel';
import type { ClaudeEvent } from './ClaudeEventRenderer';
import { ClaudeEventRenderer } from './ClaudeEventRenderer';
import { CommitList } from './CommitList';
import { DiffViewer } from './DiffViewer';
import { StepsPanel } from './StepsPanel';

// ============================================================================
// Types
// ============================================================================

export interface TaskNotFoundProps {
  onBack: () => void;
}

export interface TaskOutputPanelProps {
  claudeEvents: ClaudeEvent[];
  rawOutput: string[];
  isRunning: boolean;
  showRawOutput: boolean;
  onToggleRawOutput: () => void;
}

export interface TaskMainPanelProps {
  claudeEvents: ClaudeEvent[];
  rawOutput: string[];
  isRunning: boolean;
  showRawOutput: boolean;
  onToggleRawOutput: () => void;
  messages: Message[];
  onSendMessage: (content: string) => void;
  isProcessing: boolean;
  onStopProcess: () => void;
  executorProfiles: ExecutorProfile[];
  selectedExecutorProfileId: string;
}

export interface TaskStepsPanelProps {
  steps: WorkflowStep[];
  activeStepIndex: number;
  onStartStep: (stepIndex: number) => void;
  onToggleStep: (stepIndex: number, completed: boolean) => void;
  onSelectStep: (stepIndex: number) => void;
  onAddStep: () => void;
  autoStart: boolean;
  onAutoStartChange: (value: boolean) => void;
}

export interface AddStepDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onCreateStep: (startImmediately: boolean) => void;
  isCreating: boolean;
}

export interface TaskArtifactsTabProps {
  artifacts: ArtifactFile[];
  loading: boolean;
  onOpenArtifact: (artifact: ArtifactFile) => void;
  onPreviewArtifact: (artifact: ArtifactFile) => void;
}

export interface TaskChangesTabProps {
  diffs: FileDiff[];
  expandedFiles: Set<string>;
  onFileToggle: (path: string) => void;
}

export interface TaskCommitsTabProps {
  commits: Commit[];
  expandedCommits: Set<string>;
  onCommitToggle: (hash: string) => void;
  onViewCommit: (hash: string) => void;
}

// ============================================================================
// Components
// ============================================================================

/**
 * TaskNotFound - Display when task is not found
 */
export function TaskNotFound({ onBack }: TaskNotFoundProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-[rgb(var(--background))] p-8">
      <AlertCircle className="mb-4 h-16 w-16 text-[rgb(var(--muted-foreground))]" />
      <h2 className="text-lg font-semibold text-[rgb(var(--foreground))]">Task not found</h2>
      <p className="mt-2 text-sm text-[rgb(var(--muted-foreground))]">
        The task you're looking for doesn't exist or has been deleted.
      </p>
      <Button variant="primary" className="mt-4" onClick={onBack}>
        Back to Dashboard
      </Button>
    </div>
  );
}

TaskNotFound.displayName = 'TaskNotFound';

/**
 * TaskOutputPanel - Claude streaming output display with toggle
 */
export function TaskOutputPanel({
  claudeEvents,
  rawOutput,
  isRunning,
  showRawOutput,
  onToggleRawOutput,
}: TaskOutputPanelProps) {
  const hasOutput = claudeEvents.length > 0 || isRunning || rawOutput.length > 0;

  if (!hasOutput) return null;

  return (
    <div className="flex-1 overflow-auto border-b border-[rgb(var(--border))]">
      {/* Output header with view toggle */}
      <div className="flex items-center justify-between border-b border-[rgb(var(--border))] px-4 py-2">
        <span className="text-xs font-medium text-[rgb(var(--muted-foreground))]">
          {isRunning ? 'Running...' : 'Output'}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleRawOutput}
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
  );
}

TaskOutputPanel.displayName = 'TaskOutputPanel';

/**
 * TaskMainPanel - Combined output and chat input
 */
export function TaskMainPanel({
  claudeEvents,
  rawOutput,
  isRunning,
  showRawOutput,
  onToggleRawOutput,
  messages,
  onSendMessage,
  isProcessing,
  onStopProcess,
  executorProfiles,
  selectedExecutorProfileId,
}: TaskMainPanelProps) {
  return (
    <div className="flex h-full flex-col">
      <TaskOutputPanel
        claudeEvents={claudeEvents}
        rawOutput={rawOutput}
        isRunning={isRunning}
        showRawOutput={showRawOutput}
        onToggleRawOutput={onToggleRawOutput}
      />
      <ChatPanel
        messages={messages}
        onSendMessage={onSendMessage}
        isProcessing={isProcessing}
        onStopProcess={onStopProcess}
        executorProfiles={executorProfiles}
        selectedExecutorProfileId={selectedExecutorProfileId}
        showExecutorSelector={executorProfiles.length > 1}
        placeholder="Type a message or instruction..."
      />
    </div>
  );
}

TaskMainPanel.displayName = 'TaskMainPanel';

/**
 * TaskStepsPanel - Wrapper for StepsPanel with consistent props
 */
export function TaskStepsPanel({
  steps,
  activeStepIndex,
  onStartStep,
  onToggleStep,
  onSelectStep,
  onAddStep,
  autoStart,
  onAutoStartChange,
}: TaskStepsPanelProps) {
  return (
    <StepsPanel
      steps={steps}
      activeStepIndex={activeStepIndex}
      onStartStep={onStartStep}
      onToggleStep={onToggleStep}
      onSelectStep={onSelectStep}
      onAddStep={onAddStep}
      autoStart={autoStart}
      onAutoStartChange={onAutoStartChange}
    />
  );
}

TaskStepsPanel.displayName = 'TaskStepsPanel';

/**
 * AddStepDialog - Dialog for adding a new workflow step
 */
export function AddStepDialog({
  isOpen,
  onClose,
  title,
  description,
  onTitleChange,
  onDescriptionChange,
  onCreateStep,
  isCreating,
}: AddStepDialogProps) {
  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Add New Step" size="md">
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
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
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
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
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
        <Button variant="ghost" onClick={onClose} disabled={isCreating}>
          Cancel
        </Button>
        <Button
          variant="secondary"
          onClick={() => onCreateStep(false)}
          disabled={!title.trim() || isCreating}
          loading={isCreating}
          loadingText="Adding..."
        >
          Add Step
        </Button>
        <Button
          variant="primary"
          onClick={() => onCreateStep(true)}
          disabled={!title.trim() || isCreating}
          loading={isCreating}
          loadingText="Adding..."
        >
          Add & Start
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

AddStepDialog.displayName = 'AddStepDialog';

/**
 * TaskArtifactsTab - Artifacts panel tab content
 */
export function TaskArtifactsTab({
  artifacts,
  loading,
  onOpenArtifact,
  onPreviewArtifact,
}: TaskArtifactsTabProps) {
  return (
    <ArtifactsPanel
      artifacts={artifacts}
      loading={loading}
      onOpenArtifact={onOpenArtifact}
      onPreviewArtifact={onPreviewArtifact}
    />
  );
}

TaskArtifactsTab.displayName = 'TaskArtifactsTab';

/**
 * TaskChangesTab - Diff viewer tab content
 */
export function TaskChangesTab({ diffs, expandedFiles, onFileToggle }: TaskChangesTabProps) {
  return (
    <div className="p-4">
      <DiffViewer
        diffs={diffs}
        expandedFiles={expandedFiles}
        onFileToggle={onFileToggle}
        showLineNumbers
      />
    </div>
  );
}

TaskChangesTab.displayName = 'TaskChangesTab';

/**
 * TaskCommitsTab - Commit list tab content
 */
export function TaskCommitsTab({
  commits,
  expandedCommits,
  onCommitToggle,
  onViewCommit,
}: TaskCommitsTabProps) {
  return (
    <div className="p-4">
      <CommitList
        commits={commits}
        expandedCommits={expandedCommits}
        onCommitToggle={onCommitToggle}
        onViewCommit={onViewCommit}
      />
    </div>
  );
}

TaskCommitsTab.displayName = 'TaskCommitsTab';
