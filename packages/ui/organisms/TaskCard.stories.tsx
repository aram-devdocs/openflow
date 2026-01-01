import { type Task, TaskStatus } from '@openflow/generated';
import type { Meta, StoryObj } from '@storybook/react';
import { useRef, useState } from 'react';
import {
  DEFAULT_MORE_OPTIONS_LABEL,
  DEFAULT_SELECTED_LABEL,
  DEFAULT_STATUS_DROPDOWN_LABEL,
  STATUS_OPTIONS,
  TASK_CARD_BADGE_SIZE_MAP,
  TASK_CARD_ICON_SIZE_MAP,
  TASK_CARD_MORE_BUTTON_CLASSES,
  TASK_CARD_PADDING_CLASSES,
  TASK_CARD_TITLE_SIZE_CLASSES,
  TaskCard,
  buildAccessibleLabel,
  buildActionsAnnouncement,
  buildStatusChangeAnnouncement,
} from './TaskCard';

const meta: Meta<typeof TaskCard> = {
  title: 'Organisms/TaskCard',
  component: TaskCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    isSelected: {
      control: 'boolean',
      description: 'Whether the card is in a selected state',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size of the card - affects padding and typography',
    },
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof TaskCard>;

// ============================================================================
// Mock Data
// ============================================================================

const mockTask: Task = {
  id: 'task-1',
  projectId: 'project-1',
  title: 'Implement user authentication',
  description:
    'Add OAuth2 authentication with Google and GitHub providers. Include session management and token refresh.',
  status: TaskStatus.Inprogress,
  actionsRequiredCount: 0,
  autoStartNextStep: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockTaskWithActions: Task = {
  ...mockTask,
  id: 'task-2',
  title: 'Fix checkout validation',
  description: 'Validation errors are not showing correctly on the checkout form.',
  status: TaskStatus.Inprogress,
  actionsRequiredCount: 2,
};

const mockTaskTodo: Task = {
  ...mockTask,
  id: 'task-3',
  title: 'Add dark mode support',
  description: 'Implement dark mode with system preference detection.',
  status: TaskStatus.Todo,
};

const mockTaskDone: Task = {
  ...mockTask,
  id: 'task-4',
  title: 'Setup CI/CD pipeline',
  description: 'Configure GitHub Actions for automated testing and deployment.',
  status: TaskStatus.Done,
};

const mockTaskCancelled: Task = {
  ...mockTask,
  id: 'task-5',
  title: 'Legacy API migration',
  description: 'Migrate deprecated API endpoints to the new REST API.',
  status: TaskStatus.Cancelled,
};

const mockTaskInReview: Task = {
  ...mockTask,
  id: 'task-6',
  title: 'Code review for PR #42',
  description: 'Review the authentication changes submitted in the pull request.',
  status: TaskStatus.Inreview,
};

const mockTaskNoDescription: Task = {
  id: 'task-7',
  projectId: 'project-1',
  title: 'Quick fix for typo in README',
  status: TaskStatus.Todo,
  actionsRequiredCount: 0,
  autoStartNextStep: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockTaskLongTitle: Task = {
  ...mockTask,
  id: 'task-8',
  title:
    'Implement comprehensive error handling with retry logic and circuit breaker patterns for external API calls',
  description: 'This is a complex task that requires careful planning.',
  status: TaskStatus.Todo,
};

// ============================================================================
// Basic Examples
// ============================================================================

/** Default task card */
export const Default: Story = {
  args: {
    task: mockTask,
  },
};

/** Task card with actions required indicator */
export const WithActionsRequired: Story = {
  args: {
    task: mockTaskWithActions,
  },
};

/** Task card in selected state */
export const Selected: Story = {
  args: {
    task: mockTask,
    isSelected: true,
  },
};

/** Task card without description */
export const NoDescription: Story = {
  args: {
    task: mockTaskNoDescription,
  },
};

/** Task card with long title (should truncate) */
export const LongTitle: Story = {
  args: {
    task: mockTaskLongTitle,
  },
};

// ============================================================================
// Size Variants
// ============================================================================

/** Small size variant */
export const SizeSmall: Story = {
  args: {
    task: mockTask,
    size: 'sm',
  },
};

/** Medium size variant (default) */
export const SizeMedium: Story = {
  args: {
    task: mockTask,
    size: 'md',
  },
};

/** Large size variant */
export const SizeLarge: Story = {
  args: {
    task: mockTask,
    size: 'lg',
  },
};

/** All sizes comparison */
export const AllSizes: Story = {
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
  render: () => (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-2 text-sm text-muted-foreground">Small</p>
        <TaskCard task={mockTask} size="sm" />
      </div>
      <div>
        <p className="mb-2 text-sm text-muted-foreground">Medium</p>
        <TaskCard task={mockTask} size="md" />
      </div>
      <div>
        <p className="mb-2 text-sm text-muted-foreground">Large</p>
        <TaskCard task={mockTask} size="lg" />
      </div>
    </div>
  ),
};

/** Responsive sizing - adapts to screen size */
export const ResponsiveSizing: Story = {
  args: {
    task: mockTask,
    size: { base: 'sm', md: 'md', lg: 'lg' },
  },
};

// ============================================================================
// Status Variants
// ============================================================================

/** All task status variants */
export const AllStatuses: Story = {
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
  render: () => (
    <div className="flex flex-col gap-3">
      <TaskCard task={mockTaskTodo} />
      <TaskCard task={mockTask} />
      <TaskCard task={mockTaskInReview} />
      <TaskCard task={mockTaskDone} />
      <TaskCard task={mockTaskCancelled} />
    </div>
  ),
};

// ============================================================================
// Interactive Examples
// ============================================================================

/** Interactive task card with selection and status change */
export const Interactive: Story = {
  render: function InteractiveTaskCard() {
    const [task, setTask] = useState(mockTask);
    const [isSelected, setIsSelected] = useState(false);

    const handleStatusChange = (_id: string, status: TaskStatus) => {
      setTask((prev) => ({ ...prev, status }));
    };

    return (
      <TaskCard
        task={task}
        isSelected={isSelected}
        onSelect={() => setIsSelected(!isSelected)}
        onStatusChange={handleStatusChange}
      />
    );
  },
};

/** Task card with status dropdown */
export const WithStatusDropdown: Story = {
  render: function TaskCardWithDropdown() {
    const [task, setTask] = useState(mockTask);

    const handleStatusChange = (_id: string, status: TaskStatus) => {
      setTask((prev) => ({ ...prev, status }));
    };

    return <TaskCard task={task} onStatusChange={handleStatusChange} />;
  },
};

/** Multiple task cards in a list */
export const CardList: Story = {
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
  render: function TaskCardList() {
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const tasks = [mockTaskTodo, mockTask, mockTaskWithActions, mockTaskInReview, mockTaskDone];

    return (
      <div className="flex flex-col gap-2" role="list" aria-label="Task list">
        {tasks.map((task) => (
          <div key={task.id} role="listitem">
            <TaskCard task={task} isSelected={selectedId === task.id} onSelect={setSelectedId} />
          </div>
        ))}
      </div>
    );
  },
};

// ============================================================================
// Actions Required Variants
// ============================================================================

/** Task card with single action required */
export const SingleActionRequired: Story = {
  args: {
    task: {
      ...mockTask,
      actionsRequiredCount: 1,
    },
  },
};

/** Task card with many actions required */
export const ManyActionsRequired: Story = {
  args: {
    task: {
      ...mockTask,
      actionsRequiredCount: 5,
    },
  },
};

// ============================================================================
// Accessibility Demos
// ============================================================================

/** Focus ring visibility demo - tab to see focus rings */
export const FocusRingVisibility: Story = {
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
  render: () => (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Use Tab key to navigate and see focus rings on interactive elements.
      </p>
      <TaskCard
        task={mockTask}
        onSelect={() => {}}
        onStatusChange={() => {}}
        onMoreClick={() => {}}
      />
    </div>
  ),
};

/** Touch target accessibility demo - shows 44px minimum touch targets on mobile */
export const TouchTargetAccessibility: Story = {
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
  render: () => (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        On mobile, all interactive elements have a minimum 44×44px touch target (WCAG 2.5.5). Resize
        the viewport to see the difference.
      </p>
      <TaskCard
        task={mockTaskWithActions}
        onSelect={() => {}}
        onStatusChange={() => {}}
        onMoreClick={() => {}}
      />
    </div>
  ),
};

/** Screen reader accessibility demo - shows what screen readers announce */
export const ScreenReaderAccessibility: Story = {
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
  render: () => {
    const exampleLabel = buildAccessibleLabel(mockTaskWithActions, true);

    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-lg border p-4">
          <h3 className="mb-2 font-medium">Screen Reader Announcement:</h3>
          <p className="text-sm text-muted-foreground italic">"{exampleLabel}"</p>
        </div>
        <TaskCard task={mockTaskWithActions} isSelected onSelect={() => {}} />
      </div>
    );
  },
};

/** Keyboard navigation demo */
export const KeyboardNavigation: Story = {
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
  render: function KeyboardNavDemo() {
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const tasks = [mockTaskTodo, mockTask, mockTaskWithActions];

    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          Use Tab to navigate between cards. Press Enter or Space to select. Status dropdown
          supports arrow key navigation.
        </p>
        <div className="flex flex-col gap-2" role="list">
          {tasks.map((task) => (
            <div key={task.id} role="listitem">
              <TaskCard
                task={task}
                isSelected={selectedId === task.id}
                onSelect={setSelectedId}
                onStatusChange={() => {}}
              />
            </div>
          ))}
        </div>
      </div>
    );
  },
};

// ============================================================================
// Ref Forwarding & Data Attributes
// ============================================================================

/** Ref forwarding demo */
export const RefForwarding: Story = {
  render: function RefForwardingDemo() {
    const cardRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState<string>('');

    const handleMeasure = () => {
      if (cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect();
        setDimensions(`${Math.round(rect.width)} × ${Math.round(rect.height)}px`);
      }
    };

    return (
      <div className="flex flex-col gap-4">
        <button
          type="button"
          onClick={handleMeasure}
          className="rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground"
        >
          Measure Card
        </button>
        {dimensions && (
          <p className="text-sm text-muted-foreground">Card dimensions: {dimensions}</p>
        )}
        <TaskCard ref={cardRef} task={mockTask} />
      </div>
    );
  },
};

/** Data attributes demo */
export const DataAttributes: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border p-4">
        <h3 className="mb-2 font-medium">Data Attributes:</h3>
        <ul className="list-inside list-disc text-sm text-muted-foreground">
          <li>data-testid="my-task-card"</li>
          <li>data-task-id="task-1"</li>
          <li>data-status="inprogress"</li>
          <li>data-selected="true"</li>
          <li>data-size="md"</li>
        </ul>
      </div>
      <TaskCard task={mockTask} isSelected data-testid="my-task-card" />
    </div>
  ),
};

// ============================================================================
// Real-World Examples
// ============================================================================

/** Task board column example */
export const TaskBoardColumn: Story = {
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
  render: function TaskBoardColumnDemo() {
    const [tasks, setTasks] = useState([mockTaskTodo, mockTask, mockTaskWithActions]);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const handleStatusChange = (id: string, status: TaskStatus) => {
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
    };

    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">In Progress</h2>
          <span className="text-sm text-muted-foreground">{tasks.length} tasks</span>
        </div>
        <div className="flex flex-col gap-2">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              isSelected={selectedId === task.id}
              onSelect={setSelectedId}
              onStatusChange={handleStatusChange}
              onMoreClick={(id, e) => console.log('More clicked:', id, e)}
              onContextMenu={(id, e) => console.log('Context menu:', id, e)}
            />
          ))}
        </div>
      </div>
    );
  },
};

/** Dashboard widget example with different sizes */
export const DashboardWidget: Story = {
  decorators: [
    (Story) => (
      <div className="w-full max-w-xl">
        <Story />
      </div>
    ),
  ],
  render: function DashboardWidgetDemo() {
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const tasks = [{ ...mockTaskWithActions, actionsRequiredCount: 3 }, mockTask, mockTaskInReview];

    return (
      <div className="rounded-lg border p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Tasks</h2>
          <button type="button" className="text-sm text-primary hover:underline">
            View all
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              size="sm"
              isSelected={selectedId === task.id}
              onSelect={setSelectedId}
            />
          ))}
        </div>
      </div>
    );
  },
};

// ============================================================================
// Constants Reference
// ============================================================================

/** Constants reference - shows all exported constants and utilities */
export const ConstantsReference: Story = {
  decorators: [
    (Story) => (
      <div className="w-full max-w-3xl">
        <Story />
      </div>
    ),
  ],
  render: () => (
    <div className="space-y-6">
      <section>
        <h3 className="mb-2 text-lg font-semibold">Label Constants</h3>
        <div className="rounded-lg border p-4">
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <dt className="font-mono">DEFAULT_MORE_OPTIONS_LABEL</dt>
            <dd className="text-muted-foreground">"{DEFAULT_MORE_OPTIONS_LABEL}"</dd>
            <dt className="font-mono">DEFAULT_SELECTED_LABEL</dt>
            <dd className="text-muted-foreground">"{DEFAULT_SELECTED_LABEL}"</dd>
            <dt className="font-mono">DEFAULT_STATUS_DROPDOWN_LABEL</dt>
            <dd className="text-muted-foreground">"{DEFAULT_STATUS_DROPDOWN_LABEL}"</dd>
          </dl>
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-lg font-semibold">Size Class Mappings</h3>
        <div className="rounded-lg border p-4">
          <h4 className="mb-2 font-medium">TASK_CARD_PADDING_CLASSES</h4>
          <dl className="grid grid-cols-3 gap-2 text-sm">
            {Object.entries(TASK_CARD_PADDING_CLASSES).map(([size, classes]) => (
              <div key={size}>
                <dt className="font-mono">{size}</dt>
                <dd className="text-muted-foreground">{classes}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="mt-2 rounded-lg border p-4">
          <h4 className="mb-2 font-medium">TASK_CARD_TITLE_SIZE_CLASSES</h4>
          <dl className="grid grid-cols-3 gap-2 text-sm">
            {Object.entries(TASK_CARD_TITLE_SIZE_CLASSES).map(([size, classes]) => (
              <div key={size}>
                <dt className="font-mono">{size}</dt>
                <dd className="text-muted-foreground">{classes}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="mt-2 rounded-lg border p-4">
          <h4 className="mb-2 font-medium">TASK_CARD_BADGE_SIZE_MAP</h4>
          <dl className="grid grid-cols-3 gap-2 text-sm">
            {Object.entries(TASK_CARD_BADGE_SIZE_MAP).map(([size, badgeSize]) => (
              <div key={size}>
                <dt className="font-mono">{size}</dt>
                <dd className="text-muted-foreground">{badgeSize}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="mt-2 rounded-lg border p-4">
          <h4 className="mb-2 font-medium">TASK_CARD_ICON_SIZE_MAP</h4>
          <dl className="grid grid-cols-3 gap-2 text-sm">
            {Object.entries(TASK_CARD_ICON_SIZE_MAP).map(([size, iconSize]) => (
              <div key={size}>
                <dt className="font-mono">{size}</dt>
                <dd className="text-muted-foreground">{iconSize}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-lg font-semibold">Status Options</h3>
        <div className="rounded-lg border p-4">
          <dl className="grid grid-cols-2 gap-2 text-sm">
            {STATUS_OPTIONS.map((option) => (
              <div key={option.value}>
                <dt className="font-mono">{option.value}</dt>
                <dd className="text-muted-foreground">{option.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-lg font-semibold">Utility Functions</h3>
        <div className="space-y-2 rounded-lg border p-4 text-sm">
          <div>
            <code className="font-mono">getBaseSize(size)</code>
            <p className="text-muted-foreground">
              Returns base size from responsive value. getBaseSize('md') = 'md'
            </p>
          </div>
          <div>
            <code className="font-mono">getResponsiveSizeClasses(size, classMap)</code>
            <p className="text-muted-foreground">
              Generates responsive Tailwind classes with breakpoint prefixes.
            </p>
          </div>
          <div>
            <code className="font-mono">buildAccessibleLabel(task, isSelected, customLabel?)</code>
            <p className="text-muted-foreground">
              Builds comprehensive screen reader label for task card.
            </p>
          </div>
          <div>
            <code className="font-mono">buildActionsAnnouncement(count)</code>
            <p className="text-muted-foreground">Example: {buildActionsAnnouncement(3)}</p>
          </div>
          <div>
            <code className="font-mono">buildStatusChangeAnnouncement(status)</code>
            <p className="text-muted-foreground">
              Example: {buildStatusChangeAnnouncement(TaskStatus.Done)}
            </p>
          </div>
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-lg font-semibold">Base Classes Constants</h3>
        <div className="rounded-lg border p-4">
          <p className="mb-2 text-sm font-medium">TASK_CARD_MORE_BUTTON_CLASSES</p>
          <code className="block whitespace-pre-wrap text-xs text-muted-foreground">
            {TASK_CARD_MORE_BUTTON_CLASSES}
          </code>
        </div>
      </section>
    </div>
  ),
};
