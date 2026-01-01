import { type SearchResult, SearchResultType } from '@openflow/generated';
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { Archive, FileText, GitBranch, Plus, Search, Settings } from 'lucide-react';
import { useRef, useState } from 'react';
import { Button } from '../atoms/Button';
import {
  COMMAND_PALETTE_ICON_SIZE_MAP,
  COMMAND_PALETTE_ITEM_SIZE_CLASSES,
  COMMAND_PALETTE_SIZE_CLASSES,
  type CommandAction,
  CommandPalette,
  CommandPaletteSkeleton,
  DEFAULT_ACTIONS_LABEL,
  DEFAULT_CLOSE_LABEL,
  DEFAULT_DIALOG_LABEL,
  DEFAULT_EMPTY_DESCRIPTION,
  DEFAULT_EMPTY_TITLE,
  DEFAULT_NO_RESULTS_TITLE,
  // Constants
  DEFAULT_PLACEHOLDER,
  DEFAULT_RECENT_LABEL,
  DEFAULT_RESULTS_LABEL,
  DEFAULT_SEARCH_LABEL,
  RESULT_TYPE_ICONS,
  RESULT_TYPE_LABELS,
  type RecentItem,
  SR_NO_RESULTS,
  SR_PALETTE_OPENED,
  SR_RESULTS_COUNT,
  SR_SEARCHING,
  // Utility functions
  getBaseSize,
  getItemTypeLabel,
  getOptionId,
  getResultsAnnouncement,
  getSelectionAnnouncement,
} from './CommandPalette';

const meta = {
  title: 'Organisms/CommandPalette',
  component: CommandPalette,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
CommandPalette component for quick search and navigation (Cmd+K).

## Accessibility Features

- **ARIA Combobox Pattern**: Input has \`role="combobox"\` with \`aria-controls\` pointing to listbox
- **Listbox Results**: Results container has \`role="listbox"\` with \`role="option"\` on items
- **aria-activedescendant**: Tracks the currently highlighted item for screen readers
- **aria-selected**: Indicates the selected option
- **Screen Reader Announcements**: Live region announces results count, navigation changes
- **Focus Management**: Focus is trapped within dialog, returns to trigger on close
- **Keyboard Navigation**:
  - Arrow Up/Down: Navigate between items
  - Home/End: Jump to first/last item
  - Enter: Select current item
  - Escape: Close palette
  - Tab: Trapped within dialog

## Touch Target Compliance

All interactive elements have a minimum touch target of 44px (WCAG 2.5.5).

## Responsive Sizing

Supports responsive sizing via the \`size\` prop with breakpoint-aware values.
        `,
      },
    },
  },
  tags: ['autodocs'],
  args: {
    isOpen: true,
    onClose: fn(),
    onSearch: fn(),
    onSelectResult: fn(),
    onSelectRecent: fn(),
  },
  decorators: [
    (Story) => (
      <div className="h-screen w-full bg-[rgb(var(--background))]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CommandPalette>;

export default meta;
type Story = StoryObj<typeof meta>;

// =============================================================================
// Sample Data
// =============================================================================

const sampleRecentItems: RecentItem[] = [
  {
    id: 'task-1',
    type: SearchResultType.Task,
    title: 'Implement user authentication',
    subtitle: 'OpenFlow Project',
  },
  {
    id: 'task-2',
    type: SearchResultType.Task,
    title: 'Fix sidebar navigation bug',
    subtitle: 'OpenFlow Project',
  },
  {
    id: 'project-1',
    type: SearchResultType.Project,
    title: 'OpenFlow',
    subtitle: '/Users/dev/openflow',
  },
  {
    id: 'chat-1',
    type: SearchResultType.Chat,
    title: 'Feature: Add dark mode toggle',
    subtitle: 'Step: Implementation',
  },
];

const sampleSearchResults: SearchResult[] = [
  {
    id: 'task-1',
    resultType: SearchResultType.Task,
    title: 'Add authentication middleware',
    subtitle: 'OpenFlow Project',
    score: 0.95,
  },
  {
    id: 'task-2',
    resultType: SearchResultType.Task,
    title: 'Create auth provider component',
    subtitle: 'OpenFlow Project',
    score: 0.88,
  },
  {
    id: 'project-1',
    resultType: SearchResultType.Project,
    title: 'Auth Service',
    subtitle: '/Users/dev/auth-service',
    score: 0.75,
  },
  {
    id: 'message-1',
    resultType: SearchResultType.Message,
    title: 'Discussion about auth flow',
    subtitle: 'Task: Implement user authentication',
    score: 0.65,
  },
];

const sampleActions: CommandAction[] = [
  {
    id: 'new-task',
    label: 'Create New Task',
    shortcut: '⌘N',
    icon: Plus,
    onSelect: fn(),
  },
  {
    id: 'settings',
    label: 'Open Settings',
    shortcut: '⌘,',
    icon: Settings,
    onSelect: fn(),
  },
  {
    id: 'archive',
    label: 'View Archive',
    icon: Archive,
    onSelect: fn(),
  },
  {
    id: 'new-project',
    label: 'Add New Project',
    icon: FileText,
    onSelect: fn(),
  },
  {
    id: 'branches',
    label: 'View Branches',
    icon: GitBranch,
    onSelect: fn(),
  },
];

// =============================================================================
// Basic Stories
// =============================================================================

/**
 * Default command palette with recent items and actions
 */
export const Default: Story = {
  args: {
    recentItems: sampleRecentItems,
    actions: sampleActions,
  },
};

/**
 * Command palette with search results
 */
export const WithSearchResults: Story = {
  args: {
    query: 'auth',
    searchResults: sampleSearchResults,
  },
};

/**
 * Command palette while searching (loading state)
 */
export const Searching: Story = {
  args: {
    query: 'authentication',
    isSearching: true,
    searchResults: [],
  },
};

/**
 * Command palette with no search results
 */
export const NoResults: Story = {
  args: {
    query: 'xyznonexistent',
    searchResults: [],
  },
};

/**
 * Command palette with only recent items
 */
export const RecentItemsOnly: Story = {
  args: {
    recentItems: sampleRecentItems,
    actions: [],
  },
};

/**
 * Command palette with only actions
 */
export const ActionsOnly: Story = {
  args: {
    recentItems: [],
    actions: sampleActions,
  },
};

/**
 * Empty command palette (no recent items or actions)
 */
export const Empty: Story = {
  args: {
    recentItems: [],
    actions: [],
  },
};

/**
 * Command palette closed (should render nothing)
 */
export const Closed: Story = {
  args: {
    isOpen: false,
    recentItems: sampleRecentItems,
    actions: sampleActions,
  },
};

// =============================================================================
// Size Variants
// =============================================================================

/**
 * Small size variant
 */
export const SizeSmall: Story = {
  args: {
    size: 'sm',
    recentItems: sampleRecentItems,
    actions: sampleActions,
  },
};

/**
 * Medium size variant (default)
 */
export const SizeMedium: Story = {
  args: {
    size: 'md',
    recentItems: sampleRecentItems,
    actions: sampleActions,
  },
};

/**
 * Large size variant
 */
export const SizeLarge: Story = {
  args: {
    size: 'lg',
    recentItems: sampleRecentItems,
    actions: sampleActions,
  },
};

/**
 * Responsive sizing - changes size at different breakpoints
 */
export const ResponsiveSizing: Story = {
  args: {
    size: { base: 'sm', md: 'md', lg: 'lg' },
    recentItems: sampleRecentItems,
    actions: sampleActions,
  },
  parameters: {
    docs: {
      description: {
        story: 'Resize your viewport to see the palette change size at different breakpoints.',
      },
    },
  },
};

// =============================================================================
// Content Variations
// =============================================================================

/**
 * Command palette with many search results (for scroll testing)
 */
export const ManyResults: Story = {
  args: {
    query: 'component',
    searchResults: [
      {
        id: 'task-1',
        resultType: SearchResultType.Task,
        title: 'Create Button component',
        subtitle: 'UI Library',
        score: 0.95,
      },
      {
        id: 'task-2',
        resultType: SearchResultType.Task,
        title: 'Create Input component',
        subtitle: 'UI Library',
        score: 0.92,
      },
      {
        id: 'task-3',
        resultType: SearchResultType.Task,
        title: 'Create Card component',
        subtitle: 'UI Library',
        score: 0.9,
      },
      {
        id: 'task-4',
        resultType: SearchResultType.Task,
        title: 'Create Dialog component',
        subtitle: 'UI Library',
        score: 0.88,
      },
      {
        id: 'task-5',
        resultType: SearchResultType.Task,
        title: 'Create Dropdown component',
        subtitle: 'UI Library',
        score: 0.85,
      },
      {
        id: 'task-6',
        resultType: SearchResultType.Task,
        title: 'Create Tabs component',
        subtitle: 'UI Library',
        score: 0.83,
      },
      {
        id: 'task-7',
        resultType: SearchResultType.Task,
        title: 'Create Tooltip component',
        subtitle: 'UI Library',
        score: 0.8,
      },
      {
        id: 'task-8',
        resultType: SearchResultType.Task,
        title: 'Create Menu component',
        subtitle: 'UI Library',
        score: 0.78,
      },
      {
        id: 'project-1',
        resultType: SearchResultType.Project,
        title: 'Component Library',
        subtitle: '/Users/dev/component-lib',
        score: 0.75,
      },
      {
        id: 'message-1',
        resultType: SearchResultType.Message,
        title: 'Discussion about component architecture',
        subtitle: 'Task: Create Button component',
        score: 0.7,
      },
      {
        id: 'message-2',
        resultType: SearchResultType.Message,
        title: 'Review of component patterns',
        subtitle: 'Task: Create Input component',
        score: 0.68,
      },
      {
        id: 'chat-1',
        resultType: SearchResultType.Chat,
        title: 'Component implementation chat',
        subtitle: 'Step: Development',
        score: 0.65,
      },
    ],
  },
};

/**
 * Command palette with custom placeholder
 */
export const CustomPlaceholder: Story = {
  args: {
    recentItems: sampleRecentItems,
    actions: sampleActions,
    placeholder: 'What would you like to do?',
  },
};

/**
 * Command palette with mixed result types
 */
export const MixedResults: Story = {
  args: {
    query: 'flow',
    searchResults: [
      {
        id: 'project-1',
        resultType: SearchResultType.Project,
        title: 'OpenFlow',
        subtitle: '/Users/dev/openflow',
        score: 0.98,
      },
      {
        id: 'task-1',
        resultType: SearchResultType.Task,
        title: 'Implement workflow system',
        subtitle: 'OpenFlow Project',
        score: 0.92,
      },
      {
        id: 'task-2',
        resultType: SearchResultType.Task,
        title: 'Add workflow templates',
        subtitle: 'OpenFlow Project',
        score: 0.88,
      },
      {
        id: 'chat-1',
        resultType: SearchResultType.Chat,
        title: 'Workflow design discussion',
        subtitle: 'Step: Planning',
        score: 0.75,
      },
      {
        id: 'message-1',
        resultType: SearchResultType.Message,
        title: 'Workflow state machine implementation details',
        subtitle: 'Task: Implement workflow system',
        score: 0.7,
      },
    ],
  },
};

// =============================================================================
// Accessibility Demos
// =============================================================================

/**
 * Demonstrates keyboard navigation.
 *
 * - Arrow Up/Down: Navigate between items
 * - Home: Jump to first item
 * - End: Jump to last item
 * - Enter: Select current item
 * - Escape: Close palette
 */
export const KeyboardNavigation: Story = {
  args: {
    recentItems: sampleRecentItems,
    actions: sampleActions,
  },
  parameters: {
    docs: {
      description: {
        story: `
Try these keyboard shortcuts:
- **Arrow Up/Down**: Navigate between items
- **Home**: Jump to first item
- **End**: Jump to last item
- **Enter**: Select current item
- **Escape**: Close palette
- **Tab**: Trapped within dialog
        `,
      },
    },
  },
};

/**
 * Demonstrates screen reader announcements.
 *
 * The component announces:
 * - When the palette opens
 * - Results count when searching
 * - Current item when navigating
 * - Keyboard shortcuts for actions
 */
export const ScreenReaderAccessibility: Story = {
  args: {
    recentItems: sampleRecentItems,
    actions: sampleActions,
    'data-testid': 'command-palette-sr',
  },
  parameters: {
    docs: {
      description: {
        story: `
Screen reader announcements include:
- Opening announcement: "${SR_PALETTE_OPENED}"
- Results count: e.g., "${SR_RESULTS_COUNT(5)}"
- No results: "${SR_NO_RESULTS}"
- Searching: "${SR_SEARCHING}"
- Item selection with type and keyboard shortcut
        `,
      },
    },
  },
};

/**
 * Demonstrates focus ring visibility on all backgrounds.
 */
export const FocusRingVisibility: Story = {
  args: {
    recentItems: sampleRecentItems,
    actions: sampleActions,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Tab or use arrow keys to see the focus ring. The ring uses an inset style for visibility on all backgrounds.',
      },
    },
  },
};

/**
 * Demonstrates touch target compliance (44px minimum).
 */
export const TouchTargetAccessibility: Story = {
  args: {
    recentItems: sampleRecentItems,
    actions: sampleActions,
  },
  parameters: {
    docs: {
      description: {
        story:
          'All interactive elements have a minimum touch target of 44px (WCAG 2.5.5). Resize to mobile to see the enlarged close button.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="h-screen w-full bg-[rgb(var(--background))]">
        <div className="p-4 text-sm text-[rgb(var(--muted-foreground))]">
          All items have a min-height of 44px for touch accessibility.
        </div>
        <Story />
      </div>
    ),
  ],
};

// =============================================================================
// Interactive Demos
// =============================================================================

/**
 * Interactive example with working search
 */
export const InteractiveDemo: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(true);
    const [query, setQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [results, setResults] = useState<SearchResult[]>([]);

    const allResults = sampleSearchResults;

    const handleSearch = (q: string) => {
      setQuery(q);
      if (q) {
        setIsSearching(true);
        setTimeout(() => {
          const filtered = allResults.filter(
            (r) =>
              r.title.toLowerCase().includes(q.toLowerCase()) ||
              r.subtitle?.toLowerCase().includes(q.toLowerCase())
          );
          setResults(filtered);
          setIsSearching(false);
        }, 300);
      } else {
        setResults([]);
      }
    };

    return (
      <div className="p-4">
        <Button onClick={() => setIsOpen(true)}>Open Command Palette (⌘K)</Button>
        <CommandPalette
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onSearch={handleSearch}
          query={query}
          searchResults={results}
          isSearching={isSearching}
          recentItems={sampleRecentItems}
          actions={sampleActions}
          onSelectResult={(result) => console.log('Selected result:', result)}
          onSelectRecent={(item) => console.log('Selected recent:', item)}
        />
      </div>
    );
  },
};

/**
 * Demonstrates ref forwarding
 */
export const RefForwarding: Story = {
  render: () => {
    const ref = useRef<HTMLDivElement>(null);
    const [isOpen, setIsOpen] = useState(true);

    return (
      <div className="p-4">
        <Button
          onClick={() => {
            if (ref.current) {
              console.log('Ref is attached:', ref.current);
            }
          }}
        >
          Log Ref
        </Button>
        <CommandPalette
          ref={ref}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onSearch={fn()}
          recentItems={sampleRecentItems}
          actions={sampleActions}
          data-testid="command-palette-ref"
        />
      </div>
    );
  },
};

/**
 * Demonstrates data-testid attributes
 */
export const DataTestIdAttributes: Story = {
  args: {
    recentItems: sampleRecentItems,
    actions: sampleActions,
    'data-testid': 'cmd-palette',
  },
  parameters: {
    docs: {
      description: {
        story: `
Data attributes available:
- \`data-testid="cmd-palette"\` - Root container
- \`data-testid="cmd-palette-input"\` - Search input
- \`data-testid="cmd-palette-list"\` - Results list
- \`data-testid="cmd-palette-close"\` - Close button
- \`data-state="open|closed"\` - Current state
        `,
      },
    },
  },
};

// =============================================================================
// Real-World Examples
// =============================================================================

/**
 * Developer IDE command palette with code-related actions
 */
export const IDECommandPalette: Story = {
  args: {
    placeholder: 'Search files, commands, or symbols...',
    recentItems: [
      {
        id: '1',
        type: SearchResultType.Message,
        title: 'src/components/Button.tsx',
        subtitle: 'Last edited 5 min ago',
      },
      {
        id: '2',
        type: SearchResultType.Message,
        title: 'src/hooks/useAuth.ts',
        subtitle: 'Last edited 1 hour ago',
      },
      {
        id: '3',
        type: SearchResultType.Project,
        title: 'openflow-ui',
        subtitle: '/workspace/openflow-ui',
      },
    ],
    actions: [
      { id: 'goto-file', label: 'Go to File...', shortcut: '⌘P', icon: FileText, onSelect: fn() },
      {
        id: 'goto-symbol',
        label: 'Go to Symbol...',
        shortcut: '⌘⇧O',
        icon: Search,
        onSelect: fn(),
      },
      { id: 'git-status', label: 'Git: Show Status', icon: GitBranch, onSelect: fn() },
      {
        id: 'settings',
        label: 'Preferences: Open Settings',
        shortcut: '⌘,',
        icon: Settings,
        onSelect: fn(),
      },
    ],
  },
};

/**
 * Application launcher style command palette
 */
export const ApplicationLauncher: Story = {
  args: {
    placeholder: 'Search apps and actions...',
    size: 'lg',
    recentItems: [],
    actions: [
      { id: 'new-doc', label: 'New Document', shortcut: '⌘N', icon: FileText, onSelect: fn() },
      { id: 'new-project', label: 'New Project', shortcut: '⌘⇧N', icon: Plus, onSelect: fn() },
      { id: 'settings', label: 'System Settings', icon: Settings, onSelect: fn() },
      { id: 'archive', label: 'Open Archive', icon: Archive, onSelect: fn() },
    ],
  },
};

// =============================================================================
// Skeleton Component
// =============================================================================

/**
 * Loading skeleton for command palette
 */
export const Skeleton: StoryObj<typeof CommandPaletteSkeleton> = {
  render: () => (
    <div className="max-w-xl rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
      <CommandPaletteSkeleton count={5} data-testid="cmd-skeleton" />
    </div>
  ),
};

// =============================================================================
// Constants Reference
// =============================================================================

/**
 * Reference for all exported constants and utilities
 */
export const ConstantsReference: Story = {
  render: () => (
    <div className="space-y-8 p-8 text-sm">
      <section>
        <h2 className="mb-4 text-lg font-semibold">Default Labels</h2>
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b">
              <th className="p-2 text-left">Constant</th>
              <th className="p-2 text-left">Value</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="p-2 font-mono text-xs">DEFAULT_PLACEHOLDER</td>
              <td className="p-2">{DEFAULT_PLACEHOLDER}</td>
            </tr>
            <tr className="border-b">
              <td className="p-2 font-mono text-xs">DEFAULT_DIALOG_LABEL</td>
              <td className="p-2">{DEFAULT_DIALOG_LABEL}</td>
            </tr>
            <tr className="border-b">
              <td className="p-2 font-mono text-xs">DEFAULT_SEARCH_LABEL</td>
              <td className="p-2">{DEFAULT_SEARCH_LABEL}</td>
            </tr>
            <tr className="border-b">
              <td className="p-2 font-mono text-xs">DEFAULT_CLOSE_LABEL</td>
              <td className="p-2">{DEFAULT_CLOSE_LABEL}</td>
            </tr>
            <tr className="border-b">
              <td className="p-2 font-mono text-xs">DEFAULT_RECENT_LABEL</td>
              <td className="p-2">{DEFAULT_RECENT_LABEL}</td>
            </tr>
            <tr className="border-b">
              <td className="p-2 font-mono text-xs">DEFAULT_ACTIONS_LABEL</td>
              <td className="p-2">{DEFAULT_ACTIONS_LABEL}</td>
            </tr>
            <tr className="border-b">
              <td className="p-2 font-mono text-xs">DEFAULT_RESULTS_LABEL</td>
              <td className="p-2">{DEFAULT_RESULTS_LABEL}</td>
            </tr>
            <tr className="border-b">
              <td className="p-2 font-mono text-xs">DEFAULT_NO_RESULTS_TITLE</td>
              <td className="p-2">{DEFAULT_NO_RESULTS_TITLE}</td>
            </tr>
            <tr className="border-b">
              <td className="p-2 font-mono text-xs">DEFAULT_EMPTY_TITLE</td>
              <td className="p-2">{DEFAULT_EMPTY_TITLE}</td>
            </tr>
            <tr className="border-b">
              <td className="p-2 font-mono text-xs">DEFAULT_EMPTY_DESCRIPTION</td>
              <td className="p-2">{DEFAULT_EMPTY_DESCRIPTION}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Screen Reader Announcements</h2>
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b">
              <th className="p-2 text-left">Function/Constant</th>
              <th className="p-2 text-left">Example Output</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="p-2 font-mono text-xs">SR_PALETTE_OPENED</td>
              <td className="p-2">{SR_PALETTE_OPENED}</td>
            </tr>
            <tr className="border-b">
              <td className="p-2 font-mono text-xs">SR_RESULTS_COUNT(5)</td>
              <td className="p-2">{SR_RESULTS_COUNT(5)}</td>
            </tr>
            <tr className="border-b">
              <td className="p-2 font-mono text-xs">SR_RESULTS_COUNT(1)</td>
              <td className="p-2">{SR_RESULTS_COUNT(1)}</td>
            </tr>
            <tr className="border-b">
              <td className="p-2 font-mono text-xs">SR_NO_RESULTS</td>
              <td className="p-2">{SR_NO_RESULTS}</td>
            </tr>
            <tr className="border-b">
              <td className="p-2 font-mono text-xs">SR_SEARCHING</td>
              <td className="p-2">{SR_SEARCHING}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Size Classes</h2>
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b">
              <th className="p-2 text-left">Size</th>
              <th className="p-2 text-left">Panel Width</th>
              <th className="p-2 text-left">Item Padding</th>
              <th className="p-2 text-left">Icon Size</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="p-2">sm</td>
              <td className="p-2 font-mono text-xs">{COMMAND_PALETTE_SIZE_CLASSES.sm}</td>
              <td className="p-2 font-mono text-xs">{COMMAND_PALETTE_ITEM_SIZE_CLASSES.sm}</td>
              <td className="p-2 font-mono text-xs">{COMMAND_PALETTE_ICON_SIZE_MAP.sm}</td>
            </tr>
            <tr className="border-b">
              <td className="p-2">md</td>
              <td className="p-2 font-mono text-xs">{COMMAND_PALETTE_SIZE_CLASSES.md}</td>
              <td className="p-2 font-mono text-xs">{COMMAND_PALETTE_ITEM_SIZE_CLASSES.md}</td>
              <td className="p-2 font-mono text-xs">{COMMAND_PALETTE_ICON_SIZE_MAP.md}</td>
            </tr>
            <tr className="border-b">
              <td className="p-2">lg</td>
              <td className="p-2 font-mono text-xs">{COMMAND_PALETTE_SIZE_CLASSES.lg}</td>
              <td className="p-2 font-mono text-xs">{COMMAND_PALETTE_ITEM_SIZE_CLASSES.lg}</td>
              <td className="p-2 font-mono text-xs">{COMMAND_PALETTE_ICON_SIZE_MAP.lg}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Utility Functions</h2>
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b">
              <th className="p-2 text-left">Function</th>
              <th className="p-2 text-left">Description</th>
              <th className="p-2 text-left">Example</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="p-2 font-mono text-xs">getBaseSize(size)</td>
              <td className="p-2">Get base size from responsive value</td>
              <td className="p-2 font-mono text-xs">{getBaseSize({ base: 'sm', lg: 'lg' })}</td>
            </tr>
            <tr className="border-b">
              <td className="p-2 font-mono text-xs">getItemTypeLabel(type)</td>
              <td className="p-2">Get human-readable type label</td>
              <td className="p-2 font-mono text-xs">{getItemTypeLabel(SearchResultType.Task)}</td>
            </tr>
            <tr className="border-b">
              <td className="p-2 font-mono text-xs">getOptionId(baseId, section, index)</td>
              <td className="p-2">Generate unique option ID</td>
              <td className="p-2 font-mono text-xs">{getOptionId('cmd', 'recent', 0)}</td>
            </tr>
            <tr className="border-b">
              <td className="p-2 font-mono text-xs">
                getSelectionAnnouncement(label, type, shortcut?)
              </td>
              <td className="p-2">Generate screen reader announcement</td>
              <td className="p-2 font-mono text-xs">
                {getSelectionAnnouncement('Create Task', 'Action', '⌘N')}
              </td>
            </tr>
            <tr className="border-b">
              <td className="p-2 font-mono text-xs">
                getResultsAnnouncement(count, isSearching, query)
              </td>
              <td className="p-2">Generate results count announcement</td>
              <td className="p-2 font-mono text-xs">{getResultsAnnouncement(5, false, 'auth')}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Result Type Configuration</h2>
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b">
              <th className="p-2 text-left">Type</th>
              <th className="p-2 text-left">Label</th>
              <th className="p-2 text-left">Icon</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(RESULT_TYPE_LABELS).map(([type, label]) => (
              <tr key={type} className="border-b">
                <td className="p-2 font-mono text-xs">{type}</td>
                <td className="p-2">{label}</td>
                <td className="p-2">
                  {RESULT_TYPE_ICONS[type as SearchResultType]?.name || 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};
