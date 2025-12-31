import type { Meta, StoryObj } from '@storybook/react';
import { List } from './List';
import { ListItem } from './ListItem';

const meta: Meta<typeof ListItem> = {
  title: 'Primitives/ListItem',
  component: ListItem,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'ListItem primitive for semantic `<li>` elements. Provides spacing props, ARIA attribute support, and proper list item semantics. Use as a child of the List component.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    p: {
      control: 'select',
      options: ['0', '1', '2', '3', '4', '5', '6', '8', '10', '12', '16'],
      description: 'Padding on all sides',
    },
    px: {
      control: 'select',
      options: ['0', '1', '2', '3', '4', '5', '6', '8', '10', '12', '16'],
      description: 'Horizontal padding',
    },
    py: {
      control: 'select',
      options: ['0', '1', '2', '3', '4', '5', '6', '8', '10', '12', '16'],
      description: 'Vertical padding',
    },
    value: {
      control: 'number',
      description: 'Value attribute for ordered lists (overrides default number)',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the item appears disabled',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ListItem>;

/** Basic list item inside an unordered list */
export const Default: Story = {
  render: () => (
    <List>
      <ListItem>First item</ListItem>
      <ListItem>Second item</ListItem>
      <ListItem>Third item</ListItem>
    </List>
  ),
};

/** List items in an ordered list */
export const InOrderedList: Story = {
  render: () => (
    <List ordered>
      <ListItem>First item</ListItem>
      <ListItem>Second item</ListItem>
      <ListItem>Third item</ListItem>
    </List>
  ),
};

/** List items with padding */
export const WithPadding: Story = {
  render: () => (
    <List styleType="none" gap="2">
      <ListItem p="2" className="bg-[rgb(var(--muted))] rounded">
        Item with p="2"
      </ListItem>
      <ListItem p="4" className="bg-[rgb(var(--muted))] rounded">
        Item with p="4"
      </ListItem>
      <ListItem px="4" py="2" className="bg-[rgb(var(--muted))] rounded">
        Item with px="4" py="2"
      </ListItem>
    </List>
  ),
};

/** List items with responsive padding */
export const ResponsivePadding: Story = {
  render: () => (
    <List styleType="none" gap="2">
      <ListItem p={{ base: '2', md: '4', lg: '6' }} className="bg-[rgb(var(--muted))] rounded">
        Responsive padding: 2 (mobile) → 4 (tablet) → 6 (desktop)
      </ListItem>
      <ListItem
        px={{ base: '2', md: '6' }}
        py={{ base: '1', md: '3' }}
        className="bg-[rgb(var(--muted))] rounded"
      >
        Responsive px and py
      </ListItem>
    </List>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Resize your browser to see the padding change at different breakpoints.',
      },
    },
  },
};

/** List items with margin */
export const WithMargin: Story = {
  render: () => (
    <div className="bg-[rgb(var(--muted))] p-4 rounded">
      <List styleType="none">
        <ListItem className="bg-[rgb(var(--background))] rounded">No margin</ListItem>
        <ListItem mt="4" className="bg-[rgb(var(--background))] rounded">
          mt="4"
        </ListItem>
        <ListItem my="2" className="bg-[rgb(var(--background))] rounded">
          my="2"
        </ListItem>
        <ListItem m="4" className="bg-[rgb(var(--background))] rounded">
          m="4" (all sides)
        </ListItem>
      </List>
    </div>
  ),
};

/** Ordered list with custom value attribute */
export const CustomValue: Story = {
  render: () => (
    <List ordered>
      <ListItem value={5}>This is numbered 5</ListItem>
      <ListItem value={10}>This is numbered 10</ListItem>
      <ListItem value={100}>This is numbered 100</ListItem>
    </List>
  ),
  parameters: {
    docs: {
      description: {
        story: 'The value prop allows you to override the automatic numbering in ordered lists.',
      },
    },
  },
};

/** Disabled list items */
export const Disabled: Story = {
  render: () => (
    <List styleType="none" gap="1">
      <ListItem px="4" py="2" className="hover:bg-[rgb(var(--muted))] rounded cursor-pointer">
        Normal item
      </ListItem>
      <ListItem px="4" py="2" disabled className="rounded" aria-disabled>
        Disabled item
      </ListItem>
      <ListItem px="4" py="2" className="hover:bg-[rgb(var(--muted))] rounded cursor-pointer">
        Another normal item
      </ListItem>
    </List>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Use the disabled prop for visual styling and aria-disabled for screen reader announcement.',
      },
    },
  },
};

/** Interactive list items with hover states */
export const Interactive: Story = {
  render: () => (
    <List styleType="none" gap="1">
      <ListItem
        px="4"
        py="2"
        className="hover:bg-[rgb(var(--muted))] rounded cursor-pointer transition-colors"
        tabIndex={0}
      >
        Hover or focus me
      </ListItem>
      <ListItem
        px="4"
        py="2"
        className="hover:bg-[rgb(var(--muted))] rounded cursor-pointer transition-colors"
        tabIndex={0}
      >
        I'm interactive too
      </ListItem>
      <ListItem
        px="4"
        py="2"
        className="hover:bg-[rgb(var(--muted))] rounded cursor-pointer transition-colors"
        tabIndex={0}
      >
        And so am I
      </ListItem>
    </List>
  ),
};

/** Menu item pattern with ARIA roles */
export const MenuItems: Story = {
  render: () => (
    <List role="menu" aria-label="Actions menu" styleType="none" gap="1">
      <ListItem
        role="menuitem"
        tabIndex={0}
        px="4"
        py="2"
        className="hover:bg-[rgb(var(--muted))] rounded cursor-pointer focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]"
      >
        Edit
      </ListItem>
      <ListItem
        role="menuitem"
        tabIndex={0}
        px="4"
        py="2"
        className="hover:bg-[rgb(var(--muted))] rounded cursor-pointer focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]"
      >
        Duplicate
      </ListItem>
      <ListItem
        role="menuitem"
        tabIndex={0}
        px="4"
        py="2"
        className="hover:bg-[rgb(var(--destructive))] text-[rgb(var(--destructive-foreground))] rounded cursor-pointer focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]"
      >
        Delete
      </ListItem>
    </List>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'ListItem can be used with ARIA roles to create accessible menus. Use role="menuitem" with tabIndex for keyboard navigation.',
      },
    },
  },
};

/** Listbox pattern with ARIA roles */
export const ListboxItems: Story = {
  render: () => (
    <List role="listbox" aria-label="Select an option" styleType="none" gap="1">
      <ListItem
        role="option"
        aria-selected={true}
        px="4"
        py="2"
        className="bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))] rounded cursor-pointer"
      >
        Selected Option
      </ListItem>
      <ListItem
        role="option"
        aria-selected={false}
        px="4"
        py="2"
        className="hover:bg-[rgb(var(--muted))] rounded cursor-pointer"
      >
        Available Option
      </ListItem>
      <ListItem
        role="option"
        aria-selected={false}
        aria-disabled
        disabled
        px="4"
        py="2"
        className="rounded"
      >
        Disabled Option
      </ListItem>
    </List>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'ListItem can be used with role="option" for selection lists. Use aria-selected for selection state.',
      },
    },
  },
};

/** List items with complex content */
export const ComplexContent: Story = {
  render: () => (
    <List styleType="none" gap="3">
      <ListItem p="4" className="border border-[rgb(var(--border))] rounded-lg">
        <div className="flex items-start gap-3">
          <span
            className="w-10 h-10 bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))] rounded-full flex items-center justify-center flex-shrink-0"
            aria-hidden="true"
          >
            A
          </span>
          <div>
            <strong className="block">Alice Johnson</strong>
            <span className="text-sm text-[rgb(var(--muted-foreground))]">alice@example.com</span>
          </div>
        </div>
      </ListItem>
      <ListItem p="4" className="border border-[rgb(var(--border))] rounded-lg">
        <div className="flex items-start gap-3">
          <span
            className="w-10 h-10 bg-[rgb(var(--secondary))] text-[rgb(var(--secondary-foreground))] rounded-full flex items-center justify-center flex-shrink-0"
            aria-hidden="true"
          >
            B
          </span>
          <div>
            <strong className="block">Bob Smith</strong>
            <span className="text-sm text-[rgb(var(--muted-foreground))]">bob@example.com</span>
          </div>
        </div>
      </ListItem>
    </List>
  ),
};

/** Navigation items */
export const NavigationItems: Story = {
  render: () => (
    <List role="navigation" aria-label="Main navigation" styleType="none" gap="1">
      <ListItem>
        <a
          href="#dashboard"
          className="block px-4 py-2 hover:bg-[rgb(var(--muted))] rounded transition-colors"
        >
          Dashboard
        </a>
      </ListItem>
      <ListItem>
        <a
          href="#projects"
          className="block px-4 py-2 bg-[rgb(var(--muted))] rounded"
          aria-current="page"
        >
          Projects
        </a>
      </ListItem>
      <ListItem>
        <a
          href="#settings"
          className="block px-4 py-2 hover:bg-[rgb(var(--muted))] rounded transition-colors"
        >
          Settings
        </a>
      </ListItem>
    </List>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'ListItem can contain anchor elements for navigation. Use aria-current="page" to indicate the current page.',
      },
    },
  },
};

/** Task list items */
export const TaskListItems: Story = {
  render: () => (
    <List styleType="none" gap="2">
      <ListItem className="flex items-center gap-3 p-2 rounded hover:bg-[rgb(var(--muted))]">
        <input
          type="checkbox"
          id="task1"
          defaultChecked
          className="rounded"
          aria-label="Complete task: Review pull request"
        />
        <label htmlFor="task1" className="line-through text-[rgb(var(--muted-foreground))]">
          Review pull request
        </label>
      </ListItem>
      <ListItem className="flex items-center gap-3 p-2 rounded hover:bg-[rgb(var(--muted))]">
        <input
          type="checkbox"
          id="task2"
          className="rounded"
          aria-label="Complete task: Update documentation"
        />
        <label htmlFor="task2">Update documentation</label>
      </ListItem>
      <ListItem className="flex items-center gap-3 p-2 rounded hover:bg-[rgb(var(--muted))]">
        <input
          type="checkbox"
          id="task3"
          className="rounded"
          aria-label="Complete task: Deploy to staging"
        />
        <label htmlFor="task3">Deploy to staging</label>
      </ListItem>
    </List>
  ),
};

/** Feature list with icons */
export const FeatureListItems: Story = {
  render: () => (
    <List styleType="none" gap="3">
      <ListItem className="flex items-start gap-3">
        <span className="text-green-500 flex-shrink-0" aria-hidden="true">
          ✓
        </span>
        <span>Semantic HTML with proper list item element</span>
      </ListItem>
      <ListItem className="flex items-start gap-3">
        <span className="text-green-500 flex-shrink-0" aria-hidden="true">
          ✓
        </span>
        <span>Full spacing props support (padding, margin)</span>
      </ListItem>
      <ListItem className="flex items-start gap-3">
        <span className="text-green-500 flex-shrink-0" aria-hidden="true">
          ✓
        </span>
        <span>ARIA attribute forwarding for accessibility</span>
      </ListItem>
      <ListItem className="flex items-start gap-3">
        <span className="text-green-500 flex-shrink-0" aria-hidden="true">
          ✓
        </span>
        <span>Responsive props for all spacing values</span>
      </ListItem>
    </List>
  ),
};

/** With data-testid for testing */
export const WithTestId: Story = {
  render: () => (
    <List data-testid="my-list">
      <ListItem data-testid="item-1">Item 1</ListItem>
      <ListItem data-testid="item-2">Item 2</ListItem>
      <ListItem data-testid="item-3">Item 3</ListItem>
    </List>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Use data-testid for automated testing.',
      },
    },
  },
};

/** All spacing props combined */
export const AllSpacingProps: Story = {
  render: () => (
    <div className="bg-[rgb(var(--muted))] p-4 rounded">
      <List styleType="none">
        <ListItem
          p="4"
          m="2"
          className="bg-[rgb(var(--background))] border border-[rgb(var(--border))] rounded"
        >
          p="4" m="2"
        </ListItem>
        <ListItem
          px="6"
          py="3"
          mt="4"
          className="bg-[rgb(var(--background))] border border-[rgb(var(--border))] rounded"
        >
          px="6" py="3" mt="4"
        </ListItem>
        <ListItem
          pt="2"
          pr="4"
          pb="2"
          pl="4"
          mt="4"
          className="bg-[rgb(var(--background))] border border-[rgb(var(--border))] rounded"
        >
          pt="2" pr="4" pb="2" pl="4" mt="4"
        </ListItem>
      </List>
    </div>
  ),
};

/** Empty list item */
export const EmptyItem: Story = {
  render: () => (
    <List>
      <ListItem>Regular item with content</ListItem>
      <ListItem className="h-8 bg-[rgb(var(--muted))]">
        {/* Empty content, used as spacer */}
      </ListItem>
      <ListItem>Another regular item</ListItem>
    </List>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Empty list items can be used as spacers when needed.',
      },
    },
  },
};
