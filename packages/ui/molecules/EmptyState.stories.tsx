import type { Meta, StoryObj } from '@storybook/react';
import { Archive, ClipboardList, FolderPlus, Inbox, Search } from 'lucide-react';
import { EmptyState } from './EmptyState';

const meta: Meta<typeof EmptyState> = {
  title: 'Molecules/EmptyState',
  component: EmptyState,
  parameters: {
    layout: 'centered',
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
      description: 'Size variant - sm for inline, md for panels, lg for full page',
    },
    action: {
      control: false,
      description: 'Primary action button configuration',
    },
    secondaryAction: {
      control: false,
      description: 'Secondary action button configuration',
    },
  },
};

export default meta;
type Story = StoryObj<typeof EmptyState>;

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

/** Empty state with primary action */
export const WithAction: Story = {
  args: {
    icon: ClipboardList,
    title: 'No tasks yet',
    description: 'Create a task to start working with AI agents.',
    action: {
      label: 'Create Task',
      onClick: () => {},
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
      onClick: () => {},
    },
    secondaryAction: {
      label: 'Import from Git',
      onClick: () => {},
    },
  },
};

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
          Small
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
          Medium
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
          Large
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
