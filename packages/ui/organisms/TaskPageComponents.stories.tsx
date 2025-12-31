import type { Meta, StoryObj } from '@storybook/react';
import type { ClaudeEvent } from './ClaudeEventRenderer';
import { AddStepDialog, TaskNotFound, TaskOutputPanel } from './TaskPageComponents';

const meta: Meta = {
  title: 'Organisms/TaskPageComponents',
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-[rgb(var(--background))]">
        <Story />
      </div>
    ),
  ],
};

export default meta;

// ============================================================================
// Mock Data
// ============================================================================

const mockClaudeEvents: ClaudeEvent[] = [
  {
    type: 'assistant',
    message: {
      content: [
        {
          type: 'text',
          text: "I'll help you implement this feature. Let me start by analyzing the codebase...\n\n",
        },
      ],
    },
  },
  {
    type: 'assistant',
    message: {
      content: [
        {
          type: 'tool_use',
          id: 'tool-1',
          name: 'read_file',
          input: { path: 'src/components/Button.tsx' },
        },
      ],
    },
  },
  {
    type: 'user',
    message: {
      content: [
        {
          type: 'tool_result',
          tool_use_id: 'tool-1',
          content: 'export function Button({ children, onClick }) { ... }',
        },
      ],
    },
  },
  {
    type: 'assistant',
    message: {
      content: [
        {
          type: 'text',
          text: '\n\nI found the Button component. Now let me make the changes...\n',
        },
      ],
    },
  },
];

const mockRawOutput = [
  '> claude: Starting analysis...',
  '> claude: Reading file src/components/Button.tsx',
  '> claude: File contents loaded',
  '> claude: Processing changes...',
];

// ============================================================================
// TaskNotFound Stories
// ============================================================================

export const NotFound: StoryObj<typeof TaskNotFound> = {
  render: () => <TaskNotFound onBack={() => console.log('Back')} />,
};

// ============================================================================
// TaskOutputPanel Stories
// ============================================================================

export const OutputPanelStreaming: StoryObj<typeof TaskOutputPanel> = {
  render: () => (
    <div className="h-96">
      <TaskOutputPanel
        claudeEvents={mockClaudeEvents}
        rawOutput={mockRawOutput}
        isRunning={true}
        showRawOutput={false}
        onToggleRawOutput={() => console.log('Toggle raw')}
      />
    </div>
  ),
};

export const OutputPanelRaw: StoryObj<typeof TaskOutputPanel> = {
  render: () => (
    <div className="h-96">
      <TaskOutputPanel
        claudeEvents={mockClaudeEvents}
        rawOutput={mockRawOutput}
        isRunning={false}
        showRawOutput={true}
        onToggleRawOutput={() => console.log('Toggle raw')}
      />
    </div>
  ),
};

export const OutputPanelEmpty: StoryObj<typeof TaskOutputPanel> = {
  render: () => (
    <div className="h-96">
      <TaskOutputPanel
        claudeEvents={[]}
        rawOutput={[]}
        isRunning={false}
        showRawOutput={false}
        onToggleRawOutput={() => console.log('Toggle raw')}
      />
    </div>
  ),
};

// ============================================================================
// AddStepDialog Stories
// ============================================================================

export const AddStep: StoryObj<typeof AddStepDialog> = {
  render: () => (
    <AddStepDialog
      isOpen={true}
      onClose={() => console.log('Close')}
      title="Implement validation"
      description="Add form validation with Zod schemas"
      onTitleChange={(value) => console.log('Title:', value)}
      onDescriptionChange={(value) => console.log('Description:', value)}
      onCreateStep={(startImmediately) => console.log('Create step:', startImmediately)}
      isCreating={false}
    />
  ),
};

export const AddStepEmpty: StoryObj<typeof AddStepDialog> = {
  render: () => (
    <AddStepDialog
      isOpen={true}
      onClose={() => console.log('Close')}
      title=""
      description=""
      onTitleChange={(value) => console.log('Title:', value)}
      onDescriptionChange={(value) => console.log('Description:', value)}
      onCreateStep={(startImmediately) => console.log('Create step:', startImmediately)}
      isCreating={false}
    />
  ),
};

export const AddStepCreating: StoryObj<typeof AddStepDialog> = {
  render: () => (
    <AddStepDialog
      isOpen={true}
      onClose={() => console.log('Close')}
      title="Implement validation"
      description="Add form validation with Zod schemas"
      onTitleChange={(value) => console.log('Title:', value)}
      onDescriptionChange={(value) => console.log('Description:', value)}
      onCreateStep={(startImmediately) => console.log('Create step:', startImmediately)}
      isCreating={true}
    />
  ),
};
