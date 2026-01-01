import type { Meta, StoryObj } from '@storybook/react';
import { Box } from './Box';
import { Stack } from './Stack';

const meta: Meta<typeof Stack> = {
  title: 'Primitives/Stack',
  component: Stack,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Stack primitive for vertical or horizontal layouts. Provides simple gap-based spacing between children with optional dividers.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    as: {
      control: 'select',
      options: [
        'div',
        'section',
        'article',
        'aside',
        'header',
        'footer',
        'main',
        'nav',
        'ul',
        'ol',
      ],
      description: 'HTML element to render',
    },
    direction: {
      control: 'select',
      options: ['vertical', 'horizontal'],
      description: 'Stack direction',
    },
    align: {
      control: 'select',
      options: ['start', 'end', 'center', 'baseline', 'stretch'],
      description: 'Cross axis alignment',
    },
    gap: {
      control: 'select',
      options: ['0', '1', '2', '3', '4', '5', '6', '8', '10', '12', '16'],
      description: 'Gap between children',
    },
    dividers: {
      control: 'boolean',
      description: 'Show dividers between items',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Stack>;

/** Item component for demo purposes */
const DemoItem = ({ children }: { children: React.ReactNode }) => (
  <Box p="4" className="bg-[rgb(var(--muted))] rounded border border-[rgb(var(--border))]">
    {children}
  </Box>
);

/** Basic vertical stack (default) */
export const Default: Story = {
  render: () => (
    <Stack gap="4">
      <DemoItem>Item 1</DemoItem>
      <DemoItem>Item 2</DemoItem>
      <DemoItem>Item 3</DemoItem>
    </Stack>
  ),
};

/** Vertical stack (explicit direction) */
export const Vertical: Story = {
  render: () => (
    <Stack direction="vertical" gap="4">
      <DemoItem>Top</DemoItem>
      <DemoItem>Middle</DemoItem>
      <DemoItem>Bottom</DemoItem>
    </Stack>
  ),
};

/** Horizontal stack */
export const Horizontal: Story = {
  render: () => (
    <Stack direction="horizontal" gap="4">
      <DemoItem>Left</DemoItem>
      <DemoItem>Center</DemoItem>
      <DemoItem>Right</DemoItem>
    </Stack>
  ),
};

/** Gap sizes */
export const GapSizes: Story = {
  render: () => (
    <div className="space-y-8">
      {(['0', '1', '2', '4', '6', '8', '12'] as const).map((gapSize) => (
        <div key={gapSize}>
          <div className="text-sm font-medium mb-2">gap="{gapSize}"</div>
          <Stack
            direction="horizontal"
            gap={gapSize}
            className="bg-[rgb(var(--muted))] p-2 rounded"
          >
            <Box p="3" className="bg-[rgb(var(--background))] rounded">
              A
            </Box>
            <Box p="3" className="bg-[rgb(var(--background))] rounded">
              B
            </Box>
            <Box p="3" className="bg-[rgb(var(--background))] rounded">
              C
            </Box>
          </Stack>
        </div>
      ))}
    </div>
  ),
};

/** Alignment options (vertical stack) */
export const AlignVertical: Story = {
  render: () => (
    <div className="space-y-6">
      {(['start', 'end', 'center', 'stretch'] as const).map((alignValue) => (
        <div key={alignValue}>
          <div className="text-sm font-medium mb-2">align="{alignValue}"</div>
          <Stack
            direction="vertical"
            align={alignValue}
            gap="2"
            className="bg-[rgb(var(--muted))] p-4 rounded"
          >
            <Box p="2" className="bg-[rgb(var(--background))] rounded">
              Short
            </Box>
            <Box p="2" className="bg-[rgb(var(--background))] rounded">
              Medium length
            </Box>
            <Box p="2" className="bg-[rgb(var(--background))] rounded">
              Longest content here
            </Box>
          </Stack>
        </div>
      ))}
    </div>
  ),
};

/** Alignment options (horizontal stack) */
export const AlignHorizontal: Story = {
  render: () => (
    <div className="space-y-6">
      {(['start', 'end', 'center', 'baseline', 'stretch'] as const).map((alignValue) => (
        <div key={alignValue}>
          <div className="text-sm font-medium mb-2">align="{alignValue}"</div>
          <Stack
            direction="horizontal"
            align={alignValue}
            gap="4"
            className="bg-[rgb(var(--muted))] p-2 rounded h-24"
          >
            <Box p="2" className="bg-[rgb(var(--background))] rounded">
              Short
            </Box>
            <Box p="4" className="bg-[rgb(var(--background))] rounded">
              Taller
            </Box>
            <Box p="1" className="bg-[rgb(var(--background))] rounded">
              Tiny
            </Box>
          </Stack>
        </div>
      ))}
    </div>
  ),
};

/** With dividers (vertical) */
export const WithDividersVertical: Story = {
  render: () => (
    <Stack gap="4" dividers className="bg-[rgb(var(--muted))] p-4 rounded">
      <Box p="4" className="bg-[rgb(var(--background))] rounded">
        Section 1
      </Box>
      <Box p="4" className="bg-[rgb(var(--background))] rounded">
        Section 2
      </Box>
      <Box p="4" className="bg-[rgb(var(--background))] rounded">
        Section 3
      </Box>
    </Stack>
  ),
};

/** With dividers (horizontal) */
export const WithDividersHorizontal: Story = {
  render: () => (
    <Stack direction="horizontal" gap="4" dividers className="bg-[rgb(var(--muted))] p-4 rounded">
      <Box p="4" className="bg-[rgb(var(--background))] rounded">
        Left
      </Box>
      <Box p="4" className="bg-[rgb(var(--background))] rounded">
        Center
      </Box>
      <Box p="4" className="bg-[rgb(var(--background))] rounded">
        Right
      </Box>
    </Stack>
  ),
};

/** Custom divider */
export const CustomDivider: Story = {
  render: () => (
    <Stack
      direction="horizontal"
      gap="2"
      align="center"
      dividers
      divider={
        <span className="text-[rgb(var(--muted-foreground))]" aria-hidden="true">
          •
        </span>
      }
    >
      <span>Home</span>
      <span>Products</span>
      <span>About</span>
      <span>Contact</span>
    </Stack>
  ),
};

/** Breadcrumb-style custom divider */
export const BreadcrumbDivider: Story = {
  render: () => (
    <Stack
      direction="horizontal"
      gap="2"
      align="center"
      dividers
      divider={
        <span className="text-[rgb(var(--muted-foreground))]" aria-hidden="true">
          /
        </span>
      }
      aria-label="Breadcrumb"
    >
      <button type="button" className="text-[rgb(var(--primary))] hover:underline">
        Home
      </button>
      <button type="button" className="text-[rgb(var(--primary))] hover:underline">
        Category
      </button>
      <span aria-current="page">Current Page</span>
    </Stack>
  ),
};

/** Responsive direction - vertical on mobile, horizontal on desktop */
export const ResponsiveDirection: Story = {
  render: () => (
    <Stack
      direction={{ base: 'vertical', md: 'horizontal' }}
      gap={{ base: '2', md: '4' }}
      className="bg-[rgb(var(--muted))] p-4 rounded"
    >
      <DemoItem>Item 1</DemoItem>
      <DemoItem>Item 2</DemoItem>
      <DemoItem>Item 3</DemoItem>
    </Stack>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Resize your browser to see the layout change from vertical (mobile) to horizontal (tablet and up).',
      },
    },
  },
};

/** Responsive alignment */
export const ResponsiveAlign: Story = {
  render: () => (
    <Stack
      direction="vertical"
      align={{ base: 'stretch', sm: 'start', md: 'center', lg: 'end' }}
      gap="4"
      className="bg-[rgb(var(--muted))] p-4 rounded"
    >
      <DemoItem>Item 1</DemoItem>
      <DemoItem>Item 2</DemoItem>
      <DemoItem>Item 3</DemoItem>
    </Stack>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Resize to see alignment change: stretch (mobile) → start (sm) → center (md) → end (lg).',
      },
    },
  },
};

/** Nested stacks */
export const NestedStacks: Story = {
  render: () => (
    <Stack gap="6" className="bg-[rgb(var(--muted))] p-4 rounded">
      <Stack direction="horizontal" gap="4">
        <Box p="4" className="bg-[rgb(var(--background))] rounded flex-1">
          Row 1, Item 1
        </Box>
        <Box p="4" className="bg-[rgb(var(--background))] rounded flex-1">
          Row 1, Item 2
        </Box>
      </Stack>
      <Stack direction="horizontal" gap="4">
        <Box p="4" className="bg-[rgb(var(--background))] rounded flex-1">
          Row 2, Item 1
        </Box>
        <Box p="4" className="bg-[rgb(var(--background))] rounded flex-1">
          Row 2, Item 2
        </Box>
        <Box p="4" className="bg-[rgb(var(--background))] rounded flex-1">
          Row 2, Item 3
        </Box>
      </Stack>
    </Stack>
  ),
};

/** Polymorphic - rendered as different HTML elements */
export const PolymorphicAs: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <div className="text-sm font-medium mb-2">as="nav"</div>
        <Stack as="nav" direction="horizontal" gap="4" aria-label="Main navigation">
          <Box p="2" className="bg-[rgb(var(--muted))] rounded">
            Home
          </Box>
          <Box p="2" className="bg-[rgb(var(--muted))] rounded">
            About
          </Box>
          <Box p="2" className="bg-[rgb(var(--muted))] rounded">
            Contact
          </Box>
        </Stack>
      </div>
      <div>
        <div className="text-sm font-medium mb-2">as="ul"</div>
        <Stack as="ul" gap="2" className="list-none">
          <Box as="li" p="2" className="bg-[rgb(var(--muted))] rounded">
            List Item 1
          </Box>
          <Box as="li" p="2" className="bg-[rgb(var(--muted))] rounded">
            List Item 2
          </Box>
          <Box as="li" p="2" className="bg-[rgb(var(--muted))] rounded">
            List Item 3
          </Box>
        </Stack>
      </div>
    </div>
  ),
};

/** With spacing props */
export const WithSpacing: Story = {
  render: () => (
    <Stack gap="4" p="6" m="4" className="bg-[rgb(var(--muted))] rounded">
      <Box p="4" className="bg-[rgb(var(--background))] rounded border border-[rgb(var(--border))]">
        Stack with p="6" m="4"
      </Box>
      <Box p="4" className="bg-[rgb(var(--background))] rounded border border-[rgb(var(--border))]">
        Children have gap="4"
      </Box>
    </Stack>
  ),
};

/** Form layout example */
export const FormLayout: Story = {
  render: () => (
    <Stack gap="4" className="max-w-md">
      <Stack gap="2">
        <label htmlFor="name" className="font-medium">
          Name
        </label>
        <input
          id="name"
          type="text"
          className="border border-[rgb(var(--border))] rounded px-3 py-2 bg-[rgb(var(--background))]"
          placeholder="Enter your name"
        />
      </Stack>
      <Stack gap="2">
        <label htmlFor="email" className="font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          className="border border-[rgb(var(--border))] rounded px-3 py-2 bg-[rgb(var(--background))]"
          placeholder="Enter your email"
        />
      </Stack>
      <Stack direction="horizontal" gap="4">
        <button
          type="button"
          className="px-4 py-2 bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))] rounded"
        >
          Submit
        </button>
        <button type="button" className="px-4 py-2 border border-[rgb(var(--border))] rounded">
          Cancel
        </button>
      </Stack>
    </Stack>
  ),
};

/** Card with sections */
export const CardWithSections: Story = {
  render: () => (
    <Stack
      gap="0"
      dividers
      className="border border-[rgb(var(--border))] rounded-lg overflow-hidden max-w-sm"
    >
      <Box p="4" className="bg-[rgb(var(--background))]">
        <div className="font-medium">Card Header</div>
      </Box>
      <Box p="4" className="bg-[rgb(var(--background))]">
        <div className="text-[rgb(var(--muted-foreground))]">
          This is the main content area of the card with some descriptive text.
        </div>
      </Box>
      <Box p="4" className="bg-[rgb(var(--muted))]">
        <Stack direction="horizontal" gap="2">
          <button type="button" className="text-sm text-[rgb(var(--primary))] hover:underline">
            Action 1
          </button>
          <button type="button" className="text-sm text-[rgb(var(--primary))] hover:underline">
            Action 2
          </button>
        </Stack>
      </Box>
    </Stack>
  ),
};

/** With ARIA attributes */
export const WithA11yProps: Story = {
  render: () => (
    <Stack
      as="nav"
      direction="horizontal"
      gap="4"
      dividers
      divider={<span aria-hidden="true">/</span>}
      aria-label="Breadcrumb navigation"
      role="navigation"
    >
      <Box p="2" className="bg-[rgb(var(--muted))] rounded">
        Home
      </Box>
      <Box p="2" className="bg-[rgb(var(--muted))] rounded">
        Products
      </Box>
      <Box p="2" className="bg-[rgb(var(--muted))] rounded" aria-current="page">
        Current Page
      </Box>
    </Stack>
  ),
};

/** With data-testid for testing */
export const WithTestId: Story = {
  args: {
    gap: '4',
    'data-testid': 'my-stack-container',
    children: (
      <>
        <Box p="4" className="bg-[rgb(var(--muted))] rounded" data-testid="stack-item-1">
          Item 1
        </Box>
        <Box p="4" className="bg-[rgb(var(--muted))] rounded" data-testid="stack-item-2">
          Item 2
        </Box>
      </>
    ),
  },
};

/** Single child (no dividers shown) */
export const SingleChild: Story = {
  render: () => (
    <Stack gap="4" dividers>
      <DemoItem>Only one item - no dividers shown</DemoItem>
    </Stack>
  ),
};

/** Empty stack */
export const EmptyStack: Story = {
  render: () => (
    <Stack gap="4" className="bg-[rgb(var(--muted))] p-4 rounded min-h-[100px]">
      {/* Empty stack */}
    </Stack>
  ),
};
