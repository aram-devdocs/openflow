import type { Meta, StoryObj } from '@storybook/react';
import {
  AlertCircle,
  Archive,
  Bell,
  ClipboardList,
  Cloud,
  FileText,
  FolderPlus,
  Inbox,
  MessageSquare,
  Search,
  Settings,
  Users,
} from 'lucide-react';
import { useRef, useState } from 'react';
import {
  EMPTY_STATE_BASE_CLASSES,
  EmptyState,
  SIZE_STYLES,
  getBaseSize,
  getResponsiveSizeClasses,
} from './EmptyState';

const meta: Meta<typeof EmptyState> = {
  title: 'Molecules/EmptyState',
  component: EmptyState,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
EmptyState displays placeholder content when there's no data to show.

## Accessibility Features

- **role="status"** - Indicates this is a status region
- **aria-label** - Provides accessible name (defaults to title)
- **aria-describedby** - Links to description text
- **VisuallyHidden** - Screen reader announces "Empty state: {title}"
- **Semantic heading** - Uses h3 for proper hierarchy
- **Keyboard accessible** - Action buttons are focusable

## Usage Guidelines

1. Always provide a clear, actionable title
2. Use description to explain what the user can do
3. Include a primary action when possible
4. Use appropriate size for the context (sm for inline, lg for full page)
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    icon: {
      control: false,
      description: 'Lucide icon to display above the title',
    },
    title: {
      control: 'text',
      description: 'Main heading text',
    },
    description: {
      control: 'text',
      description: 'Optional description text below the title',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description:
        'Size variant - sm for inline, md for panels, lg for full page. Supports responsive values.',
    },
    action: {
      control: false,
      description: 'Primary action button configuration',
    },
    secondaryAction: {
      control: false,
      description: 'Secondary action button configuration',
    },
    'data-testid': {
      control: 'text',
      description: 'Test ID for automated testing',
    },
    'aria-label': {
      control: 'text',
      description: 'Custom accessible label (defaults to title)',
    },
  },
};

export default meta;
type Story = StoryObj<typeof EmptyState>;

// =============================================================================
// Basic Examples
// =============================================================================

/** Default empty state with icon and description */
export const Default: Story = {
  args: {
    icon: Inbox,
    title: 'No messages',
    description: 'Your inbox is empty.',
    size: 'md',
  },
};

/** Empty state without icon */
export const NoIcon: Story = {
  args: {
    title: 'No items found',
    description: 'Try adjusting your search or filters.',
    size: 'md',
  },
};

/** Title only (minimal) */
export const TitleOnly: Story = {
  args: {
    title: 'Nothing here yet',
    size: 'md',
  },
};

// =============================================================================
// With Actions
// =============================================================================

/** Empty state with primary action */
export const WithAction: Story = {
  args: {
    icon: ClipboardList,
    title: 'No tasks yet',
    description: 'Create a task to start working with AI agents.',
    action: {
      label: 'Create Task',
      onClick: () => console.log('Create task clicked'),
    },
  },
};

/** Empty state with both primary and secondary actions */
export const WithSecondaryAction: Story = {
  args: {
    icon: FolderPlus,
    title: 'No projects',
    description: 'Add a project or import from Git.',
    action: {
      label: 'Add Project',
      onClick: () => console.log('Add project clicked'),
    },
    secondaryAction: {
      label: 'Import from Git',
      onClick: () => console.log('Import clicked'),
    },
  },
};

/** With loading button */
export const WithLoadingAction: Story = {
  args: {
    icon: FolderPlus,
    title: 'No projects',
    description: 'Add a project to get started.',
    action: {
      label: 'Creating...',
      onClick: () => {},
      loading: true,
    },
  },
};

/** Custom button variants */
export const CustomButtonVariants: Story = {
  args: {
    icon: ClipboardList,
    title: 'No tasks',
    description: 'Create or import tasks to get started.',
    action: {
      label: 'Create Task',
      onClick: () => {},
      variant: 'primary',
    },
    secondaryAction: {
      label: 'Import',
      onClick: () => {},
      variant: 'ghost',
    },
  },
};

/** Action with custom aria-label */
export const ActionWithAriaLabel: Story = {
  args: {
    icon: FileText,
    title: 'No documents',
    description: 'Start by creating your first document.',
    action: {
      label: 'New',
      onClick: () => {},
      'aria-label': 'Create a new document',
    },
  },
};

// =============================================================================
// Size Variants
// =============================================================================

/** Small size for inline usage */
export const SizeSmall: Story = {
  args: {
    icon: Search,
    title: 'No results',
    description: 'Try a different search term.',
    size: 'sm',
  },
};

/** Medium size (default) for panels */
export const SizeMedium: Story = {
  args: {
    icon: Inbox,
    title: 'No messages',
    description: 'Your inbox is empty.',
    size: 'md',
  },
};

/** Large size for full page empty states */
export const SizeLarge: Story = {
  args: {
    icon: FolderPlus,
    title: 'Welcome to OpenFlow',
    description: 'Get started by creating your first project.',
    size: 'lg',
    action: {
      label: 'Create Project',
      onClick: () => {},
    },
  },
};

/** All sizes comparison */
export const AllSizes: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase text-[rgb(var(--muted-foreground))]">
          Small (inline)
        </p>
        <div className="rounded-lg border border-[rgb(var(--border))] p-4">
          <EmptyState
            icon={Inbox}
            title="No messages"
            description="Your inbox is empty."
            size="sm"
          />
        </div>
      </div>
      <div>
        <p className="mb-2 text-xs font-semibold uppercase text-[rgb(var(--muted-foreground))]">
          Medium (panels)
        </p>
        <div className="rounded-lg border border-[rgb(var(--border))] p-4">
          <EmptyState
            icon={Inbox}
            title="No messages"
            description="Your inbox is empty."
            size="md"
          />
        </div>
      </div>
      <div>
        <p className="mb-2 text-xs font-semibold uppercase text-[rgb(var(--muted-foreground))]">
          Large (full page)
        </p>
        <div className="rounded-lg border border-[rgb(var(--border))] p-4">
          <EmptyState
            icon={Inbox}
            title="No messages"
            description="Your inbox is empty."
            size="lg"
          />
        </div>
      </div>
    </div>
  ),
};

/** Responsive sizing - changes at breakpoints */
export const ResponsiveSizing: Story = {
  args: {
    icon: Inbox,
    title: 'Responsive Empty State',
    description: 'This component changes size at different breakpoints.',
    size: { base: 'sm', md: 'md', lg: 'lg' },
    action: {
      label: 'Take Action',
      onClick: () => {},
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Resize the viewport to see the empty state change from small to medium to large at different breakpoints.',
      },
    },
  },
};

// =============================================================================
// Context-Specific Examples
// =============================================================================

/** Empty search results state */
export const NoSearchResults: Story = {
  args: {
    icon: Search,
    title: 'No results found',
    description: 'Try a different search term or clear your filters.',
    size: 'md',
  },
};

/** Empty archive state */
export const EmptyArchive: Story = {
  args: {
    icon: Archive,
    title: 'Archive is empty',
    description: 'Archived tasks will appear here.',
    size: 'md',
  },
};

/** Empty notifications */
export const NoNotifications: Story = {
  args: {
    icon: Bell,
    title: 'No notifications',
    description: "You're all caught up!",
    size: 'sm',
  },
};

/** Empty chat history */
export const NoChatHistory: Story = {
  args: {
    icon: MessageSquare,
    title: 'No conversations',
    description: 'Start a new chat to begin.',
    action: {
      label: 'New Chat',
      onClick: () => {},
    },
  },
};

/** Empty team members */
export const NoTeamMembers: Story = {
  args: {
    icon: Users,
    title: 'No team members',
    description: 'Invite your team to collaborate.',
    action: {
      label: 'Invite Member',
      onClick: () => {},
    },
    secondaryAction: {
      label: 'Learn More',
      onClick: () => {},
    },
  },
};

/** Connection error */
export const ConnectionError: Story = {
  args: {
    icon: Cloud,
    title: 'Unable to connect',
    description: 'Please check your internet connection and try again.',
    action: {
      label: 'Retry',
      onClick: () => {},
    },
  },
};

/** Settings not configured */
export const SettingsNotConfigured: Story = {
  args: {
    icon: Settings,
    title: 'Settings required',
    description: 'Configure your preferences to get started.',
    action: {
      label: 'Open Settings',
      onClick: () => {},
    },
  },
};

/** Error state */
export const ErrorState: Story = {
  args: {
    icon: AlertCircle,
    title: 'Something went wrong',
    description: 'We encountered an error loading your data.',
    action: {
      label: 'Try Again',
      onClick: () => {},
    },
  },
};

// =============================================================================
// Accessibility Demos
// =============================================================================

/** Custom aria-label for screen readers */
export const CustomAriaLabel: Story = {
  args: {
    icon: Inbox,
    title: 'No messages',
    description: 'Your inbox is empty.',
    'aria-label': 'Inbox is empty with no unread messages',
  },
  parameters: {
    docs: {
      description: {
        story: 'The aria-label can be customized for more descriptive screen reader announcements.',
      },
    },
  },
};

/** Screen reader accessibility demo */
export const ScreenReaderAccessibility: Story = {
  render: () => (
    <div className="space-y-6">
      <p className="text-sm text-[rgb(var(--muted-foreground))]">
        This empty state is fully accessible to screen readers. Enable a screen reader to hear:
      </p>
      <ul className="list-disc pl-6 text-sm text-[rgb(var(--muted-foreground))]">
        <li>"status" role announces this as a status region</li>
        <li>"Empty state: No projects" is announced via VisuallyHidden</li>
        <li>The description is linked via aria-describedby</li>
        <li>Action buttons are keyboard accessible</li>
      </ul>
      <EmptyState
        icon={FolderPlus}
        title="No projects"
        description="Create a project to get started with OpenFlow."
        action={{
          label: 'Create Project',
          onClick: () => console.log('Create clicked'),
        }}
        data-testid="accessible-empty-state"
      />
    </div>
  ),
};

/** Keyboard navigation demo */
export const KeyboardNavigation: Story = {
  render: () => (
    <div className="space-y-6">
      <p className="text-sm text-[rgb(var(--muted-foreground))]">
        Tab through the component to navigate between action buttons. Press Enter or Space to
        activate.
      </p>
      <EmptyState
        icon={ClipboardList}
        title="No tasks"
        description="Create your first task to begin."
        action={{
          label: 'Create Task',
          onClick: () => alert('Primary action activated'),
        }}
        secondaryAction={{
          label: 'Import Tasks',
          onClick: () => alert('Secondary action activated'),
        }}
      />
    </div>
  ),
};

/** Focus ring visibility demo */
export const FocusRingVisibility: Story = {
  render: () => (
    <div className="space-y-6">
      <p className="text-sm text-[rgb(var(--muted-foreground))]">
        Action buttons have visible focus rings for keyboard users. Tab to each button to see the
        focus indicator.
      </p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg bg-white p-4 dark:bg-[rgb(var(--background))]">
          <p className="mb-2 text-xs text-[rgb(var(--muted-foreground))]">Light background</p>
          <EmptyState
            icon={Inbox}
            title="Focus ring demo"
            action={{
              label: 'Tab to me',
              onClick: () => {},
            }}
            size="sm"
          />
        </div>
        <div className="rounded-lg bg-[rgb(var(--muted))] p-4">
          <p className="mb-2 text-xs text-[rgb(var(--muted-foreground))]">Muted background</p>
          <EmptyState
            icon={Inbox}
            title="Focus ring demo"
            action={{
              label: 'Tab to me',
              onClick: () => {},
            }}
            size="sm"
          />
        </div>
      </div>
    </div>
  ),
};

// =============================================================================
// Ref Forwarding & Test ID
// =============================================================================

/** Ref forwarding demo */
export const RefForwarding: Story = {
  render: () => {
    const emptyStateRef = useRef<HTMLDivElement>(null);
    const [info, setInfo] = useState<string>('');

    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => {
            if (emptyStateRef.current) {
              setInfo(`Element role: ${emptyStateRef.current.getAttribute('role')}`);
            }
          }}
          className="rounded bg-[rgb(var(--primary))] px-3 py-1 text-sm text-[rgb(var(--primary-foreground))]"
        >
          Get Element Info
        </button>
        {info && <p className="text-sm text-[rgb(var(--muted-foreground))]">{info}</p>}
        <EmptyState
          ref={emptyStateRef}
          icon={Inbox}
          title="Ref forwarding demo"
          description="Click the button above to access the DOM element."
        />
      </div>
    );
  },
};

/** Data-testid demo */
export const DataTestId: Story = {
  args: {
    icon: Inbox,
    title: 'Test ID demo',
    description: 'This component has a data-testid attribute for testing.',
    'data-testid': 'empty-state-inbox',
  },
  parameters: {
    docs: {
      description: {
        story:
          'The `data-testid` prop allows targeting this component in automated tests. Inspect the element to see `data-testid="empty-state-inbox"`.',
      },
    },
  },
};

// =============================================================================
// Interactive Demo
// =============================================================================

/** Interactive toggle between empty and content states */
export const InteractiveDemo: Story = {
  render: () => {
    const [hasItems, setHasItems] = useState(false);

    return (
      <div className="w-80 rounded-lg border border-[rgb(var(--border))]">
        <div className="flex items-center justify-between border-b border-[rgb(var(--border))] p-3">
          <span className="font-medium">Items</span>
          <button
            type="button"
            onClick={() => setHasItems(!hasItems)}
            className="rounded bg-[rgb(var(--secondary))] px-2 py-1 text-xs text-[rgb(var(--secondary-foreground))]"
          >
            {hasItems ? 'Clear Items' : 'Add Items'}
          </button>
        </div>
        <div className="p-4">
          {hasItems ? (
            <ul className="space-y-2">
              <li className="rounded bg-[rgb(var(--muted))] p-2 text-sm">Item 1</li>
              <li className="rounded bg-[rgb(var(--muted))] p-2 text-sm">Item 2</li>
              <li className="rounded bg-[rgb(var(--muted))] p-2 text-sm">Item 3</li>
            </ul>
          ) : (
            <EmptyState
              icon={Inbox}
              title="No items"
              description="Click 'Add Items' to see content."
              size="sm"
            />
          )}
        </div>
      </div>
    );
  },
};

// =============================================================================
// Real-World Examples
// =============================================================================

/** Dashboard with no recent activity */
export const DashboardNoActivity: Story = {
  render: () => (
    <div className="w-full max-w-md rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))]">
      <div className="border-b border-[rgb(var(--border))] p-4">
        <h2 className="font-semibold text-[rgb(var(--foreground))]">Recent Activity</h2>
      </div>
      <EmptyState
        icon={ClipboardList}
        title="No recent activity"
        description="Your recent actions will appear here."
        size="md"
      />
    </div>
  ),
};

/** Project onboarding */
export const ProjectOnboarding: Story = {
  render: () => (
    <div className="flex min-h-[400px] items-center justify-center rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--background))] p-8">
      <EmptyState
        icon={FolderPlus}
        title="Welcome to OpenFlow"
        description="Create your first project to start orchestrating AI agents for software development."
        size="lg"
        action={{
          label: 'Create Project',
          onClick: () => console.log('Create project'),
        }}
        secondaryAction={{
          label: 'View Documentation',
          onClick: () => console.log('View docs'),
        }}
      />
    </div>
  ),
};

/** Filtered list with no results */
export const FilteredListNoResults: Story = {
  render: () => (
    <div className="w-full max-w-lg">
      <div className="mb-4 flex gap-2">
        <input
          type="text"
          placeholder="Search..."
          className="flex-1 rounded border border-[rgb(var(--border))] bg-[rgb(var(--background))] px-3 py-2 text-sm"
          defaultValue="nonexistent"
        />
        <select className="rounded border border-[rgb(var(--border))] bg-[rgb(var(--background))] px-3 py-2 text-sm">
          <option>All Types</option>
          <option>Type A</option>
          <option>Type B</option>
        </select>
      </div>
      <div className="rounded-lg border border-[rgb(var(--border))]">
        <EmptyState
          icon={Search}
          title="No matching results"
          description='No items match "nonexistent". Try adjusting your search or filters.'
          size="md"
          action={{
            label: 'Clear Filters',
            onClick: () => console.log('Clear filters'),
          }}
        />
      </div>
    </div>
  ),
};

// =============================================================================
// Exported Constants & Utilities Reference
// =============================================================================

/** Reference for exported constants and utilities */
export const ConstantsReference: Story = {
  render: () => (
    <div className="space-y-6 text-sm">
      <div>
        <h3 className="mb-2 font-semibold">EMPTY_STATE_BASE_CLASSES</h3>
        <code className="block rounded bg-[rgb(var(--muted))] p-2">{EMPTY_STATE_BASE_CLASSES}</code>
      </div>
      <div>
        <h3 className="mb-2 font-semibold">SIZE_STYLES</h3>
        <pre className="overflow-x-auto rounded bg-[rgb(var(--muted))] p-2">
          {JSON.stringify(SIZE_STYLES, null, 2)}
        </pre>
      </div>
      <div>
        <h3 className="mb-2 font-semibold">getBaseSize(size)</h3>
        <p className="text-[rgb(var(--muted-foreground))]">
          Extracts the base size value from a ResponsiveValue
        </p>
        <code className="block rounded bg-[rgb(var(--muted))] p-2">
          getBaseSize(&apos;md&apos;) = &quot;{getBaseSize('md')}&quot;
          <br />
          getBaseSize({'{{ base: "sm", md: "lg" }}'}) = &quot;
          {getBaseSize({ base: 'sm', md: 'lg' })}&quot;
        </code>
      </div>
      <div>
        <h3 className="mb-2 font-semibold">getResponsiveSizeClasses(size)</h3>
        <p className="text-[rgb(var(--muted-foreground))]">
          Generates responsive container classes for the size prop
        </p>
        <code className="block rounded bg-[rgb(var(--muted))] p-2">
          getResponsiveSizeClasses(&apos;md&apos;) = [{getResponsiveSizeClasses('md').join(', ')}]
          <br />
          getResponsiveSizeClasses({'{{ base: "sm", lg: "lg" }}'}) = [
          {getResponsiveSizeClasses({ base: 'sm', lg: 'lg' }).join(', ')}]
        </code>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'These constants and utility functions are exported for use in tests and custom implementations.',
      },
    },
  },
};
