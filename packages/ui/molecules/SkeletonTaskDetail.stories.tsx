import type { Meta, StoryObj } from '@storybook/react';
import { useRef, useState } from 'react';
import {
  // Constants
  DEFAULT_MESSAGE_COUNT,
  DEFAULT_STEP_COUNT,
  DEFAULT_TAB_COUNT,
  SKELETON_TASK_DETAIL_BASE_CLASSES,
  SKELETON_TASK_DETAIL_CONTENT_GAP_CLASSES,
  SKELETON_TASK_DETAIL_CONTENT_PADDING_CLASSES,
  SKELETON_TASK_DETAIL_HEADER_ACTION_CLASSES,
  SKELETON_TASK_DETAIL_HEADER_AVATAR_DIMENSIONS,
  SKELETON_TASK_DETAIL_HEADER_PADDING_CLASSES,
  SKELETON_TASK_DETAIL_HEADER_SUBTITLE_CLASSES,
  SKELETON_TASK_DETAIL_HEADER_TITLE_CLASSES,
  SKELETON_TASK_DETAIL_INPUT_CLASSES,
  SKELETON_TASK_DETAIL_INPUT_PADDING_CLASSES,
  SKELETON_TASK_DETAIL_MESSAGE_AVATAR_DIMENSIONS,
  SKELETON_TASK_DETAIL_MESSAGE_BUBBLE_CLASSES,
  SKELETON_TASK_DETAIL_MESSAGE_TEXT_CLASSES,
  SKELETON_TASK_DETAIL_STEPS_ACTION_CLASSES,
  SKELETON_TASK_DETAIL_STEPS_GAP_CLASSES,
  SKELETON_TASK_DETAIL_STEPS_HEADER_CLASSES,
  SKELETON_TASK_DETAIL_STEPS_PANEL_PADDING_CLASSES,
  SKELETON_TASK_DETAIL_STEPS_PANEL_WIDTH_CLASSES,
  SKELETON_TASK_DETAIL_STEPS_TITLE_CLASSES,
  SKELETON_TASK_DETAIL_STEP_DESCRIPTION_CLASSES,
  SKELETON_TASK_DETAIL_STEP_HEADER_GAP_CLASSES,
  SKELETON_TASK_DETAIL_STEP_ITEM_PADDING_CLASSES,
  SKELETON_TASK_DETAIL_STEP_NUMBER_DIMENSIONS,
  SKELETON_TASK_DETAIL_STEP_TITLE_CLASSES,
  SKELETON_TASK_DETAIL_TABS_GAP_CLASSES,
  SKELETON_TASK_DETAIL_TABS_PADDING_CLASSES,
  SKELETON_TASK_DETAIL_TAB_BUTTON_CLASSES,
  SkeletonTaskDetail,
  getAvatarDimensions,
  // Utility functions
  getResponsiveSizeClasses,
} from './SkeletonTaskDetail';

const meta: Meta<typeof SkeletonTaskDetail> = {
  title: 'Molecules/SkeletonTaskDetail',
  component: SkeletonTaskDetail,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
SkeletonTaskDetail is a loading placeholder for the task detail page layout.

## Features
- Matches the TaskLayout structure with header, tabs, chat messages, input, and steps panel
- Responsive sizing support via ResponsiveValue (sm, md, lg)
- Properly hidden from screen readers (aria-hidden="true", role="presentation")
- forwardRef support for ref forwarding
- Configurable sections (showTabs, showStepsPanel, showInput)
- Configurable counts (messageCount, stepCount, tabCount)
- data-testid support for testing

## Accessibility
- Hidden from screen readers with \`aria-hidden="true"\`
- \`role="presentation"\` for explicit non-semantic purpose
- Skeleton placeholders use \`motion-safe:animate-pulse\` for reduced motion support

## Usage
\`\`\`tsx
// Basic usage
<SkeletonTaskDetail />

// Without steps panel (mobile view)
<SkeletonTaskDetail showStepsPanel={false} />

// Custom counts
<SkeletonTaskDetail messageCount={5} stepCount={6} />

// Responsive sizing
<SkeletonTaskDetail size={{ base: 'sm', md: 'md', lg: 'lg' }} />
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
      description: 'Size variant for spacing and dimensions',
    },
    messageCount: {
      control: { type: 'number', min: 1, max: 10 },
      description: 'Number of chat message skeletons',
    },
    stepCount: {
      control: { type: 'number', min: 1, max: 10 },
      description: 'Number of step skeletons',
    },
    tabCount: {
      control: { type: 'number', min: 1, max: 8 },
      description: 'Number of tab skeletons',
    },
    showTabs: {
      control: { type: 'boolean' },
      description: 'Whether to show tabs section',
    },
    showStepsPanel: {
      control: { type: 'boolean' },
      description: 'Whether to show the steps panel sidebar',
    },
    showInput: {
      control: { type: 'boolean' },
      description: 'Whether to show the input area',
    },
  },
};

export default meta;
type Story = StoryObj<typeof SkeletonTaskDetail>;

// ============================================================================
// Basic Examples
// ============================================================================

/** Default task detail skeleton showing full page loading state */
export const Default: Story = {
  render: () => (
    <div className="h-screen">
      <SkeletonTaskDetail />
    </div>
  ),
};

/** Task detail skeleton with fewer messages */
export const FewMessages: Story = {
  render: () => (
    <div className="h-screen">
      <SkeletonTaskDetail messageCount={2} />
    </div>
  ),
};

/** Task detail skeleton with many messages for scrolling scenarios */
export const ManyMessages: Story = {
  render: () => (
    <div className="h-screen">
      <SkeletonTaskDetail messageCount={8} />
    </div>
  ),
};

/** Task detail skeleton with custom step count */
export const CustomStepCount: Story = {
  render: () => (
    <div className="h-screen">
      <SkeletonTaskDetail stepCount={6} />
    </div>
  ),
};

/** Task detail skeleton with custom tab count */
export const CustomTabCount: Story = {
  render: () => (
    <div className="h-screen">
      <SkeletonTaskDetail tabCount={6} />
    </div>
  ),
};

// ============================================================================
// Section Variations
// ============================================================================

/** Without tabs section */
export const NoTabs: Story = {
  render: () => (
    <div className="h-screen">
      <SkeletonTaskDetail showTabs={false} />
    </div>
  ),
};

/** Without steps panel (e.g., mobile view) */
export const NoStepsPanel: Story = {
  render: () => (
    <div className="h-screen">
      <SkeletonTaskDetail showStepsPanel={false} />
    </div>
  ),
};

/** Without input area */
export const NoInput: Story = {
  render: () => (
    <div className="h-screen">
      <SkeletonTaskDetail showInput={false} />
    </div>
  ),
};

/** Minimal - just header and messages */
export const Minimal: Story = {
  render: () => (
    <div className="h-screen">
      <SkeletonTaskDetail showTabs={false} showStepsPanel={false} showInput={false} />
    </div>
  ),
};

/** Chat only - no tabs or steps panel but with input */
export const ChatOnly: Story = {
  render: () => (
    <div className="h-screen">
      <SkeletonTaskDetail showTabs={false} showStepsPanel={false} />
    </div>
  ),
};

// ============================================================================
// Size Variants
// ============================================================================

/** Small size - compact layout */
export const SizeSmall: Story = {
  render: () => (
    <div className="h-screen">
      <SkeletonTaskDetail size="sm" />
    </div>
  ),
};

/** Medium size (default) */
export const SizeMedium: Story = {
  render: () => (
    <div className="h-screen">
      <SkeletonTaskDetail size="md" />
    </div>
  ),
};

/** Large size - spacious layout */
export const SizeLarge: Story = {
  render: () => (
    <div className="h-screen">
      <SkeletonTaskDetail size="lg" />
    </div>
  ),
};

/** All sizes comparison */
export const AllSizes: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-2 p-2">Small</h3>
        <div className="h-[300px] border border-[rgb(var(--border))] rounded-lg overflow-hidden">
          <SkeletonTaskDetail size="sm" />
        </div>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2 p-2">Medium (default)</h3>
        <div className="h-[300px] border border-[rgb(var(--border))] rounded-lg overflow-hidden">
          <SkeletonTaskDetail size="md" />
        </div>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2 p-2">Large</h3>
        <div className="h-[300px] border border-[rgb(var(--border))] rounded-lg overflow-hidden">
          <SkeletonTaskDetail size="lg" />
        </div>
      </div>
    </div>
  ),
};

// ============================================================================
// Responsive Sizing
// ============================================================================

/** Responsive sizing that changes at breakpoints */
export const ResponsiveSizing: Story = {
  render: () => (
    <div className="h-screen">
      <SkeletonTaskDetail size={{ base: 'sm', md: 'md', lg: 'lg' }} />
      <div className="absolute top-2 left-2 bg-[rgb(var(--card))] p-2 rounded text-xs border border-[rgb(var(--border))]">
        Resize browser to see size changes (sm → md → lg)
      </div>
    </div>
  ),
};

/** Responsive with steps panel hidden on mobile */
export const ResponsiveMobileLayout: Story = {
  render: () => (
    <div>
      <div className="md:hidden h-screen">
        <SkeletonTaskDetail size="sm" showStepsPanel={false} />
      </div>
      <div className="hidden md:block h-screen">
        <SkeletonTaskDetail size={{ base: 'sm', md: 'md', lg: 'lg' }} />
      </div>
    </div>
  ),
};

// ============================================================================
// Usage Contexts
// ============================================================================

/** Fixed height container */
export const FixedHeight: Story = {
  render: () => (
    <div className="h-[600px] border border-[rgb(var(--border))] rounded-lg overflow-hidden">
      <SkeletonTaskDetail />
    </div>
  ),
};

/** In a page context with header */
export const InPageContext: Story = {
  render: () => (
    <div className="h-screen flex flex-col">
      {/* App header */}
      <header className="h-14 border-b border-[rgb(var(--border))] bg-[rgb(var(--card))] flex items-center px-4">
        <div className="font-semibold">OpenFlow</div>
      </header>
      {/* Content area */}
      <div className="flex-1">
        <SkeletonTaskDetail />
      </div>
    </div>
  ),
};

/** Mobile viewport simulation */
export const MobileView: Story = {
  render: () => (
    <div className="w-[375px] h-[667px] border border-[rgb(var(--border))] rounded-lg overflow-hidden mx-auto">
      <SkeletonTaskDetail size="sm" showStepsPanel={false} />
    </div>
  ),
};

/** Tablet viewport simulation */
export const TabletView: Story = {
  render: () => (
    <div className="w-[768px] h-[600px] border border-[rgb(var(--border))] rounded-lg overflow-hidden mx-auto">
      <SkeletonTaskDetail size="md" />
    </div>
  ),
};

// ============================================================================
// Accessibility Demos
// ============================================================================

/** Accessibility demonstration - element is hidden from screen readers */
export const AccessibilityDemo: Story = {
  render: () => (
    <div className="space-y-4 p-4">
      <div className="bg-[rgb(var(--muted))] p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Accessibility Features</h3>
        <ul className="text-sm space-y-1 list-disc list-inside">
          <li>
            <code>aria-hidden="true"</code> - Hidden from screen readers
          </li>
          <li>
            <code>role="presentation"</code> - Explicitly non-semantic
          </li>
          <li>
            <code>motion-safe:animate-pulse</code> - Respects reduced motion preferences
          </li>
          <li>All skeleton elements have aria-hidden inherited from container</li>
        </ul>
      </div>
      <div className="h-[400px] border border-[rgb(var(--border))] rounded-lg overflow-hidden">
        <SkeletonTaskDetail data-testid="a11y-demo" />
      </div>
    </div>
  ),
};

/** Reduced motion demonstration */
export const ReducedMotionDemo: Story = {
  render: () => (
    <div className="space-y-4 p-4">
      <div className="bg-[rgb(var(--muted))] p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Reduced Motion Support</h3>
        <p className="text-sm">
          The skeleton pulse animation uses <code>motion-safe:</code> prefix, so it will not animate
          when the user has enabled "Reduce motion" in their system preferences.
        </p>
        <p className="text-sm mt-2">
          To test: Enable "Reduce motion" in your OS accessibility settings and observe the skeleton
          stop pulsing.
        </p>
      </div>
      <div className="h-[400px] border border-[rgb(var(--border))] rounded-lg overflow-hidden">
        <SkeletonTaskDetail />
      </div>
    </div>
  ),
};

// ============================================================================
// Ref Forwarding and Data Attributes
// ============================================================================

/** forwardRef demonstration */
export const RefForwarding: Story = {
  render: function RefForwardingDemo() {
    const ref = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState<string>('Click to measure');

    const handleMeasure = () => {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        setDimensions(`${Math.round(rect.width)}px × ${Math.round(rect.height)}px`);
      }
    };

    return (
      <div className="space-y-4 p-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleMeasure}
            className="px-4 py-2 bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))] rounded-md"
          >
            Measure Container
          </button>
          <span className="text-sm font-mono">{dimensions}</span>
        </div>
        <div className="h-[400px] border border-[rgb(var(--border))] rounded-lg overflow-hidden">
          <SkeletonTaskDetail ref={ref} />
        </div>
      </div>
    );
  },
};

/** data-testid demonstration */
export const DataTestId: Story = {
  render: () => (
    <div className="space-y-4 p-4">
      <div className="bg-[rgb(var(--muted))] p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Data Attributes for Testing</h3>
        <p className="text-sm mb-2">
          When <code>data-testid</code> is provided, nested elements get derived testids:
        </p>
        <ul className="text-sm space-y-1 list-disc list-inside font-mono">
          <li>task-detail-skeleton (container)</li>
          <li>task-detail-skeleton-main (main area)</li>
          <li>task-detail-skeleton-header (header section)</li>
          <li>task-detail-skeleton-tabs (tabs section)</li>
          <li>task-detail-skeleton-content (content area)</li>
          <li>task-detail-skeleton-message-0 (first message)</li>
          <li>task-detail-skeleton-input (input area)</li>
          <li>task-detail-skeleton-steps-panel (steps sidebar)</li>
          <li>task-detail-skeleton-step-0 (first step)</li>
        </ul>
      </div>
      <div className="h-[400px] border border-[rgb(var(--border))] rounded-lg overflow-hidden">
        <SkeletonTaskDetail data-testid="task-detail-skeleton" />
      </div>
    </div>
  ),
};

// ============================================================================
// Real-World Examples
// ============================================================================

/** Task page loading state */
export const TaskPageLoading: Story = {
  render: () => (
    <div className="h-screen flex flex-col bg-[rgb(var(--background))]">
      {/* App header */}
      <header className="h-14 border-b border-[rgb(var(--border))] bg-[rgb(var(--card))] flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <div className="font-semibold">OpenFlow</div>
          <nav className="flex items-center gap-2 text-sm">
            <span className="text-[rgb(var(--muted-foreground))]">Projects</span>
            <span className="text-[rgb(var(--muted-foreground))]">/</span>
            <span className="text-[rgb(var(--muted-foreground))]">Tasks</span>
            <span className="text-[rgb(var(--muted-foreground))]">/</span>
            <span>Loading...</span>
          </nav>
        </div>
      </header>
      {/* Content area */}
      <div className="flex-1 min-h-0">
        <SkeletonTaskDetail />
      </div>
    </div>
  ),
};

/** Loading transition demonstration */
export const LoadingTransitionDemo: Story = {
  render: function LoadingTransition() {
    const [isLoading, setIsLoading] = useState(true);

    return (
      <div className="space-y-4 p-4">
        <button
          type="button"
          onClick={() => setIsLoading(!isLoading)}
          className="px-4 py-2 bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))] rounded-md"
        >
          Toggle Loading State
        </button>
        <div className="h-[500px] border border-[rgb(var(--border))] rounded-lg overflow-hidden">
          {isLoading ? (
            <SkeletonTaskDetail />
          ) : (
            <div className="h-full flex">
              {/* Fake content */}
              <div className="flex-1 flex flex-col">
                <div className="flex items-center gap-4 border-b border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3">
                  <div className="w-8 h-8 rounded-full bg-[rgb(var(--primary))]" />
                  <div>
                    <div className="font-semibold">Implement user authentication</div>
                    <div className="text-sm text-[rgb(var(--muted-foreground))]">
                      Created 2 hours ago
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 border-b border-[rgb(var(--border))] px-4 py-2">
                  {['Chat', 'Files', 'Terminal', 'History'].map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      className="px-3 py-1.5 text-sm rounded-md hover:bg-[rgb(var(--muted))]"
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                <div className="flex-1 p-4">
                  <p>Task content would go here...</p>
                </div>
              </div>
              <div className="w-80 border-l border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
                <div className="font-semibold mb-4">Steps</div>
                <p className="text-sm text-[rgb(var(--muted-foreground))]">
                  Steps panel content...
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  },
};

/** Dashboard with task detail loading */
export const DashboardTaskLoading: Story = {
  render: () => (
    <div className="h-screen flex bg-[rgb(var(--background))]">
      {/* Sidebar */}
      <aside className="w-64 border-r border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shrink-0">
        <div className="font-semibold mb-4">OpenFlow</div>
        <nav className="space-y-2">
          {['Dashboard', 'Projects', 'Tasks', 'Settings'].map((item) => (
            <div
              key={item}
              className="px-3 py-2 rounded-md hover:bg-[rgb(var(--muted))] cursor-pointer"
            >
              {item}
            </div>
          ))}
        </nav>
      </aside>
      {/* Main content */}
      <main className="flex-1 min-w-0">
        <SkeletonTaskDetail />
      </main>
    </div>
  ),
};

/** Split view with task list */
export const SplitViewLoading: Story = {
  render: () => (
    <div className="h-screen flex bg-[rgb(var(--background))]">
      {/* Task list */}
      <aside className="w-80 border-r border-[rgb(var(--border))] bg-[rgb(var(--card))]">
        <div className="p-4 border-b border-[rgb(var(--border))]">
          <h2 className="font-semibold">Tasks</h2>
        </div>
        <div className="p-2 space-y-2">
          {['Task 1', 'Task 2', 'Task 3'].map((task, i) => (
            <div
              key={task}
              className={`px-3 py-2 rounded-md cursor-pointer ${
                i === 1
                  ? 'bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))]'
                  : 'hover:bg-[rgb(var(--muted))]'
              }`}
            >
              {task}
            </div>
          ))}
        </div>
      </aside>
      {/* Task detail loading */}
      <main className="flex-1 min-w-0">
        <SkeletonTaskDetail />
      </main>
    </div>
  ),
};

// ============================================================================
// Constants Reference
// ============================================================================

/** Constants and utility functions reference */
export const ConstantsReference: Story = {
  render: () => (
    <div className="p-4 space-y-6 max-w-4xl">
      <h2 className="text-xl font-semibold">Exported Constants & Utilities</h2>

      <section className="space-y-2">
        <h3 className="font-semibold">Default Values</h3>
        <div className="bg-[rgb(var(--muted))] p-4 rounded-lg font-mono text-sm">
          <pre>{`DEFAULT_MESSAGE_COUNT = ${DEFAULT_MESSAGE_COUNT}
DEFAULT_STEP_COUNT = ${DEFAULT_STEP_COUNT}
DEFAULT_TAB_COUNT = ${DEFAULT_TAB_COUNT}`}</pre>
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="font-semibold">Base Classes</h3>
        <div className="bg-[rgb(var(--muted))] p-4 rounded-lg font-mono text-sm">
          <pre>{`SKELETON_TASK_DETAIL_BASE_CLASSES = "${SKELETON_TASK_DETAIL_BASE_CLASSES}"`}</pre>
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="font-semibold">Size Classes (sm | md | lg)</h3>
        <div className="bg-[rgb(var(--muted))] p-4 rounded-lg font-mono text-sm overflow-x-auto">
          <pre>{`SKELETON_TASK_DETAIL_HEADER_PADDING_CLASSES = ${JSON.stringify(SKELETON_TASK_DETAIL_HEADER_PADDING_CLASSES, null, 2)}

SKELETON_TASK_DETAIL_HEADER_AVATAR_DIMENSIONS = ${JSON.stringify(SKELETON_TASK_DETAIL_HEADER_AVATAR_DIMENSIONS, null, 2)}

SKELETON_TASK_DETAIL_HEADER_TITLE_CLASSES = ${JSON.stringify(SKELETON_TASK_DETAIL_HEADER_TITLE_CLASSES, null, 2)}

SKELETON_TASK_DETAIL_HEADER_SUBTITLE_CLASSES = ${JSON.stringify(SKELETON_TASK_DETAIL_HEADER_SUBTITLE_CLASSES, null, 2)}

SKELETON_TASK_DETAIL_HEADER_ACTION_CLASSES = ${JSON.stringify(SKELETON_TASK_DETAIL_HEADER_ACTION_CLASSES, null, 2)}

SKELETON_TASK_DETAIL_TABS_PADDING_CLASSES = ${JSON.stringify(SKELETON_TASK_DETAIL_TABS_PADDING_CLASSES, null, 2)}

SKELETON_TASK_DETAIL_TABS_GAP_CLASSES = ${JSON.stringify(SKELETON_TASK_DETAIL_TABS_GAP_CLASSES, null, 2)}

SKELETON_TASK_DETAIL_TAB_BUTTON_CLASSES = ${JSON.stringify(SKELETON_TASK_DETAIL_TAB_BUTTON_CLASSES, null, 2)}

SKELETON_TASK_DETAIL_CONTENT_PADDING_CLASSES = ${JSON.stringify(SKELETON_TASK_DETAIL_CONTENT_PADDING_CLASSES, null, 2)}

SKELETON_TASK_DETAIL_CONTENT_GAP_CLASSES = ${JSON.stringify(SKELETON_TASK_DETAIL_CONTENT_GAP_CLASSES, null, 2)}

SKELETON_TASK_DETAIL_MESSAGE_AVATAR_DIMENSIONS = ${JSON.stringify(SKELETON_TASK_DETAIL_MESSAGE_AVATAR_DIMENSIONS, null, 2)}

SKELETON_TASK_DETAIL_MESSAGE_BUBBLE_CLASSES = ${JSON.stringify(SKELETON_TASK_DETAIL_MESSAGE_BUBBLE_CLASSES, null, 2)}

SKELETON_TASK_DETAIL_MESSAGE_TEXT_CLASSES = ${JSON.stringify(SKELETON_TASK_DETAIL_MESSAGE_TEXT_CLASSES, null, 2)}

SKELETON_TASK_DETAIL_INPUT_PADDING_CLASSES = ${JSON.stringify(SKELETON_TASK_DETAIL_INPUT_PADDING_CLASSES, null, 2)}

SKELETON_TASK_DETAIL_INPUT_CLASSES = ${JSON.stringify(SKELETON_TASK_DETAIL_INPUT_CLASSES, null, 2)}

SKELETON_TASK_DETAIL_STEPS_PANEL_WIDTH_CLASSES = ${JSON.stringify(SKELETON_TASK_DETAIL_STEPS_PANEL_WIDTH_CLASSES, null, 2)}

SKELETON_TASK_DETAIL_STEPS_PANEL_PADDING_CLASSES = ${JSON.stringify(SKELETON_TASK_DETAIL_STEPS_PANEL_PADDING_CLASSES, null, 2)}

SKELETON_TASK_DETAIL_STEPS_HEADER_CLASSES = ${JSON.stringify(SKELETON_TASK_DETAIL_STEPS_HEADER_CLASSES, null, 2)}

SKELETON_TASK_DETAIL_STEPS_TITLE_CLASSES = ${JSON.stringify(SKELETON_TASK_DETAIL_STEPS_TITLE_CLASSES, null, 2)}

SKELETON_TASK_DETAIL_STEPS_ACTION_CLASSES = ${JSON.stringify(SKELETON_TASK_DETAIL_STEPS_ACTION_CLASSES, null, 2)}

SKELETON_TASK_DETAIL_STEPS_GAP_CLASSES = ${JSON.stringify(SKELETON_TASK_DETAIL_STEPS_GAP_CLASSES, null, 2)}

SKELETON_TASK_DETAIL_STEP_ITEM_PADDING_CLASSES = ${JSON.stringify(SKELETON_TASK_DETAIL_STEP_ITEM_PADDING_CLASSES, null, 2)}

SKELETON_TASK_DETAIL_STEP_HEADER_GAP_CLASSES = ${JSON.stringify(SKELETON_TASK_DETAIL_STEP_HEADER_GAP_CLASSES, null, 2)}

SKELETON_TASK_DETAIL_STEP_NUMBER_DIMENSIONS = ${JSON.stringify(SKELETON_TASK_DETAIL_STEP_NUMBER_DIMENSIONS, null, 2)}

SKELETON_TASK_DETAIL_STEP_TITLE_CLASSES = ${JSON.stringify(SKELETON_TASK_DETAIL_STEP_TITLE_CLASSES, null, 2)}

SKELETON_TASK_DETAIL_STEP_DESCRIPTION_CLASSES = ${JSON.stringify(SKELETON_TASK_DETAIL_STEP_DESCRIPTION_CLASSES, null, 2)}`}</pre>
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="font-semibold">Utility Functions</h3>
        <div className="bg-[rgb(var(--muted))] p-4 rounded-lg font-mono text-sm">
          <pre>{`// Get base size from responsive value (import from component)
// getBaseSize('md') → 'md'
// getBaseSize({ base: 'sm', md: 'md' }) → 'sm'

// Get responsive size classes
getResponsiveSizeClasses('md', SKELETON_TASK_DETAIL_HEADER_PADDING_CLASSES)
// → '${getResponsiveSizeClasses('md', SKELETON_TASK_DETAIL_HEADER_PADDING_CLASSES)}'

getResponsiveSizeClasses({ base: 'sm', md: 'md' }, SKELETON_TASK_DETAIL_HEADER_PADDING_CLASSES)
// → '${getResponsiveSizeClasses({ base: 'sm', md: 'md' }, SKELETON_TASK_DETAIL_HEADER_PADDING_CLASSES)}'

// Get avatar/icon dimensions
getAvatarDimensions('md', SKELETON_TASK_DETAIL_HEADER_AVATAR_DIMENSIONS)
// → ${JSON.stringify(getAvatarDimensions('md', SKELETON_TASK_DETAIL_HEADER_AVATAR_DIMENSIONS))}`}</pre>
        </div>
      </section>
    </div>
  ),
};
