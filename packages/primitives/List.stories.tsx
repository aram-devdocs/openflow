import type { Meta, StoryObj } from '@storybook/react';
import { List } from './List';

const meta: Meta<typeof List> = {
  title: 'Primitives/List',
  component: List,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'List primitive for semantic ul/ol elements. Provides list styling, gap support, and marker customization while maintaining proper HTML semantics.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    ordered: {
      control: 'boolean',
      description: 'Whether to render as ordered list (ol) or unordered list (ul)',
    },
    styleType: {
      control: 'select',
      options: [
        'none',
        'disc',
        'decimal',
        'circle',
        'square',
        'decimal-leading-zero',
        'lower-roman',
        'upper-roman',
        'lower-alpha',
        'upper-alpha',
      ],
      description: 'List style type',
    },
    gap: {
      control: 'select',
      options: ['0', '1', '2', '3', '4', '5', '6', '8', '10', '12', '16'],
      description: 'Gap between list items',
    },
    markerPosition: {
      control: 'select',
      options: ['inside', 'outside'],
      description: 'List marker position',
    },
    start: {
      control: 'number',
      description: 'Starting number for ordered lists',
    },
    reversed: {
      control: 'boolean',
      description: 'Reverse order for ordered lists',
    },
  },
};

export default meta;
type Story = StoryObj<typeof List>;

/** Basic unordered list (default) */
export const Default: Story = {
  render: () => (
    <List>
      <li>First item</li>
      <li>Second item</li>
      <li>Third item</li>
    </List>
  ),
};

/** Basic ordered list */
export const Ordered: Story = {
  render: () => (
    <List ordered>
      <li>First item</li>
      <li>Second item</li>
      <li>Third item</li>
    </List>
  ),
};

/** Unordered list style types */
export const UnorderedStyleTypes: Story = {
  render: () => (
    <div className="space-y-6">
      {(['disc', 'circle', 'square', 'none'] as const).map((style) => (
        <div key={style}>
          <div className="text-sm font-medium mb-2">styleType="{style}"</div>
          <List styleType={style} className="pl-6">
            <li>Item A</li>
            <li>Item B</li>
            <li>Item C</li>
          </List>
        </div>
      ))}
    </div>
  ),
};

/** Ordered list style types */
export const OrderedStyleTypes: Story = {
  render: () => (
    <div className="space-y-6">
      {(
        [
          'decimal',
          'decimal-leading-zero',
          'lower-roman',
          'upper-roman',
          'lower-alpha',
          'upper-alpha',
        ] as const
      ).map((style) => (
        <div key={style}>
          <div className="text-sm font-medium mb-2">styleType="{style}"</div>
          <List ordered styleType={style} className="pl-8">
            <li>First item</li>
            <li>Second item</li>
            <li>Third item</li>
          </List>
        </div>
      ))}
    </div>
  ),
};

/** With gap between items */
export const WithGap: Story = {
  render: () => (
    <div className="space-y-8">
      {(['0', '2', '4', '6', '8'] as const).map((gapSize) => (
        <div key={gapSize}>
          <div className="text-sm font-medium mb-2">gap="{gapSize}"</div>
          <List gap={gapSize} className="pl-6">
            <li className="bg-[rgb(var(--muted))] p-2 rounded">Item 1</li>
            <li className="bg-[rgb(var(--muted))] p-2 rounded">Item 2</li>
            <li className="bg-[rgb(var(--muted))] p-2 rounded">Item 3</li>
          </List>
        </div>
      ))}
    </div>
  ),
};

/** Marker position */
export const MarkerPosition: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <div className="text-sm font-medium mb-2">markerPosition="outside" (default)</div>
        <List markerPosition="outside" className="pl-6 bg-[rgb(var(--muted))] p-4 rounded">
          <li>Outside marker position</li>
          <li>The marker sits outside the content box</li>
          <li>This is the traditional list appearance</li>
        </List>
      </div>
      <div>
        <div className="text-sm font-medium mb-2">markerPosition="inside"</div>
        <List markerPosition="inside" className="bg-[rgb(var(--muted))] p-4 rounded">
          <li>Inside marker position</li>
          <li>The marker is inside the content box</li>
          <li>Useful for styled list items</li>
        </List>
      </div>
    </div>
  ),
};

/** Custom marker color */
export const MarkerColor: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <div className="text-sm font-medium mb-2">markerColor="blue-500"</div>
        <List markerColor="blue-500" className="pl-6">
          <li>Blue markers</li>
          <li>Customized bullet color</li>
          <li>Uses Tailwind color</li>
        </List>
      </div>
      <div>
        <div className="text-sm font-medium mb-2">markerColor="green-500"</div>
        <List markerColor="green-500" className="pl-6">
          <li>Green markers</li>
          <li>Customized bullet color</li>
          <li>Uses Tailwind color</li>
        </List>
      </div>
      <div>
        <div className="text-sm font-medium mb-2">markerColor="primary" (CSS variable)</div>
        <List markerColor="primary" className="pl-6">
          <li>Primary colored markers</li>
          <li>Uses CSS variable</li>
          <li>Theme-aware color</li>
        </List>
      </div>
    </div>
  ),
};

/** Ordered list with custom start */
export const CustomStart: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <div className="text-sm font-medium mb-2">start={5}</div>
        <List ordered start={5} className="pl-8">
          <li>Fifth item</li>
          <li>Sixth item</li>
          <li>Seventh item</li>
        </List>
      </div>
      <div>
        <div className="text-sm font-medium mb-2">start={100}</div>
        <List ordered start={100} className="pl-12">
          <li>100th item</li>
          <li>101st item</li>
          <li>102nd item</li>
        </List>
      </div>
    </div>
  ),
};

/** Reversed ordered list */
export const Reversed: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <div className="text-sm font-medium mb-2">Normal order</div>
        <List ordered className="pl-8">
          <li>First</li>
          <li>Second</li>
          <li>Third</li>
        </List>
      </div>
      <div>
        <div className="text-sm font-medium mb-2">reversed={true}</div>
        <List ordered reversed className="pl-8">
          <li>First (numbered 3)</li>
          <li>Second (numbered 2)</li>
          <li>Third (numbered 1)</li>
        </List>
      </div>
    </div>
  ),
};

/** Responsive gap */
export const ResponsiveGap: Story = {
  render: () => (
    <List gap={{ base: '2', md: '4', lg: '6' }} className="pl-6 bg-[rgb(var(--muted))] p-4 rounded">
      <li className="bg-[rgb(var(--background))] p-2 rounded">Item 1</li>
      <li className="bg-[rgb(var(--background))] p-2 rounded">Item 2</li>
      <li className="bg-[rgb(var(--background))] p-2 rounded">Item 3</li>
    </List>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Resize your browser to see the gap change: 2 (mobile) → 4 (tablet) → 6 (desktop).',
      },
    },
  },
};

/** Nested lists */
export const NestedLists: Story = {
  render: () => (
    <List className="pl-6" gap="2">
      <li>
        First level item
        <List className="pl-6 mt-2" styleType="circle" gap="1">
          <li>Second level item</li>
          <li>
            Another second level
            <List className="pl-6 mt-1" styleType="square" gap="1">
              <li>Third level item</li>
              <li>Another third level</li>
            </List>
          </li>
        </List>
      </li>
      <li>
        Another first level
        <List className="pl-6 mt-2" styleType="circle" gap="1">
          <li>Nested item</li>
        </List>
      </li>
    </List>
  ),
};

/** Definition-style list */
export const DefinitionStyle: Story = {
  render: () => (
    <List styleType="none" gap="4">
      <li>
        <strong className="block">Term 1</strong>
        <span className="text-[rgb(var(--muted-foreground))]">
          Definition for the first term. This explains what the term means.
        </span>
      </li>
      <li>
        <strong className="block">Term 2</strong>
        <span className="text-[rgb(var(--muted-foreground))]">
          Definition for the second term with additional details.
        </span>
      </li>
      <li>
        <strong className="block">Term 3</strong>
        <span className="text-[rgb(var(--muted-foreground))]">
          Another definition explaining this concept.
        </span>
      </li>
    </List>
  ),
};

/** Task list style */
export const TaskListStyle: Story = {
  render: () => (
    <List styleType="none" gap="2">
      <li className="flex items-center gap-2">
        <input type="checkbox" defaultChecked className="rounded" />
        <span className="line-through text-[rgb(var(--muted-foreground))]">Completed task</span>
      </li>
      <li className="flex items-center gap-2">
        <input type="checkbox" className="rounded" />
        <span>Pending task</span>
      </li>
      <li className="flex items-center gap-2">
        <input type="checkbox" className="rounded" />
        <span>Another task to do</span>
      </li>
    </List>
  ),
};

/** Feature list with icons */
export const FeatureList: Story = {
  render: () => (
    <List styleType="none" gap="3">
      <li className="flex items-start gap-3">
        <span className="text-green-500 flex-shrink-0" aria-hidden="true">
          ✓
        </span>
        <span>Accessible by default with proper semantics</span>
      </li>
      <li className="flex items-start gap-3">
        <span className="text-green-500 flex-shrink-0" aria-hidden="true">
          ✓
        </span>
        <span>Responsive gap between items</span>
      </li>
      <li className="flex items-start gap-3">
        <span className="text-green-500 flex-shrink-0" aria-hidden="true">
          ✓
        </span>
        <span>Multiple list style types supported</span>
      </li>
      <li className="flex items-start gap-3">
        <span className="text-green-500 flex-shrink-0" aria-hidden="true">
          ✓
        </span>
        <span>Works with ordered and unordered lists</span>
      </li>
    </List>
  ),
};

/** With spacing props */
export const WithSpacing: Story = {
  render: () => (
    <List
      p="4"
      m="2"
      gap="2"
      className="bg-[rgb(var(--muted))] rounded border border-[rgb(var(--border))]"
    >
      <li>List with padding and margin</li>
      <li>Uses spacing props from primitives</li>
      <li>Easily styled with Tailwind</li>
    </List>
  ),
};

/** With ARIA attributes */
export const WithA11yProps: Story = {
  render: () => (
    <List aria-label="Navigation menu" role="menu" styleType="none" gap="1">
      <li className="px-4 py-2 hover:bg-[rgb(var(--muted))] rounded cursor-pointer focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]">
        Dashboard
      </li>
      <li className="px-4 py-2 hover:bg-[rgb(var(--muted))] rounded cursor-pointer focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]">
        Settings
      </li>
      <li className="px-4 py-2 hover:bg-[rgb(var(--muted))] rounded cursor-pointer focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]">
        Profile
      </li>
      <li
        aria-current="page"
        className="px-4 py-2 bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))] rounded focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]"
      >
        Current Page
      </li>
    </List>
  ),
};

/** With data-testid for testing */
export const WithTestId: Story = {
  args: {
    gap: '2',
    'data-testid': 'my-list-container',
    className: 'pl-6',
    children: (
      <>
        <li data-testid="list-item-1">Item 1</li>
        <li data-testid="list-item-2">Item 2</li>
        <li data-testid="list-item-3">Item 3</li>
      </>
    ),
  },
};

/** Empty list */
export const EmptyList: Story = {
  render: () => (
    <List className="pl-6 bg-[rgb(var(--muted))] p-4 rounded min-h-[50px]">{/* Empty list */}</List>
  ),
};

/** Single item */
export const SingleItem: Story = {
  render: () => (
    <List className="pl-6">
      <li>Only one item in this list</li>
    </List>
  ),
};

/** Long list */
export const LongList: Story = {
  render: () => (
    <List ordered gap="1" className="pl-8">
      {Array.from({ length: 20 }, (_, i) => (
        <li key={i}>List item number {i + 1}</li>
      ))}
    </List>
  ),
};

/** Horizontal list (using display flex) */
export const HorizontalList: Story = {
  render: () => (
    <List styleType="none" className="flex flex-row flex-wrap gap-4">
      <li className="px-3 py-1 bg-[rgb(var(--muted))] rounded">Tag 1</li>
      <li className="px-3 py-1 bg-[rgb(var(--muted))] rounded">Tag 2</li>
      <li className="px-3 py-1 bg-[rgb(var(--muted))] rounded">Tag 3</li>
      <li className="px-3 py-1 bg-[rgb(var(--muted))] rounded">Tag 4</li>
    </List>
  ),
  parameters: {
    docs: {
      description: {
        story: 'For horizontal lists, use styleType="none" and apply flex classes via className.',
      },
    },
  },
};
