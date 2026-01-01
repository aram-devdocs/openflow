import type { Meta, StoryObj } from '@storybook/react';
import { Box } from './Box';
import { Flex } from './Flex';

const meta: Meta<typeof Flex> = {
  title: 'Primitives/Flex',
  component: Flex,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Flexbox container primitive. Provides responsive flex direction, wrap, justify, and align props with all spacing props from Box.',
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
      options: ['row', 'row-reverse', 'column', 'column-reverse'],
      description: 'Flex direction',
    },
    wrap: {
      control: 'select',
      options: ['nowrap', 'wrap', 'wrap-reverse'],
      description: 'Flex wrap behavior',
    },
    justify: {
      control: 'select',
      options: ['start', 'end', 'center', 'between', 'around', 'evenly'],
      description: 'Main axis alignment',
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
    inline: {
      control: 'boolean',
      description: 'Display as inline-flex',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Flex>;

/** Item component for demo purposes */
const DemoItem = ({ children }: { children: React.ReactNode }) => (
  <Box p="4" className="bg-[rgb(var(--muted))] rounded border border-[rgb(var(--border))]">
    {children}
  </Box>
);

/** Basic horizontal flex layout */
export const Default: Story = {
  render: () => (
    <Flex gap="4">
      <DemoItem>Item 1</DemoItem>
      <DemoItem>Item 2</DemoItem>
      <DemoItem>Item 3</DemoItem>
    </Flex>
  ),
};

/** Different flex directions */
export const Directions: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <div className="text-sm font-medium mb-2">row (default)</div>
        <Flex direction="row" gap="4">
          <DemoItem>1</DemoItem>
          <DemoItem>2</DemoItem>
          <DemoItem>3</DemoItem>
        </Flex>
      </div>
      <div>
        <div className="text-sm font-medium mb-2">row-reverse</div>
        <Flex direction="row-reverse" gap="4">
          <DemoItem>1</DemoItem>
          <DemoItem>2</DemoItem>
          <DemoItem>3</DemoItem>
        </Flex>
      </div>
      <div>
        <div className="text-sm font-medium mb-2">column</div>
        <Flex direction="column" gap="4">
          <DemoItem>1</DemoItem>
          <DemoItem>2</DemoItem>
          <DemoItem>3</DemoItem>
        </Flex>
      </div>
      <div>
        <div className="text-sm font-medium mb-2">column-reverse</div>
        <Flex direction="column-reverse" gap="4">
          <DemoItem>1</DemoItem>
          <DemoItem>2</DemoItem>
          <DemoItem>3</DemoItem>
        </Flex>
      </div>
    </div>
  ),
};

/** Justify content options (main axis) */
export const JustifyContent: Story = {
  render: () => (
    <div className="space-y-6">
      {(['start', 'end', 'center', 'between', 'around', 'evenly'] as const).map((justify) => (
        <div key={justify}>
          <div className="text-sm font-medium mb-2">justify="{justify}"</div>
          <Flex justify={justify} gap="2" className="bg-[rgb(var(--muted))] p-2 rounded">
            <Box p="3" className="bg-[rgb(var(--background))] rounded">
              A
            </Box>
            <Box p="3" className="bg-[rgb(var(--background))] rounded">
              B
            </Box>
            <Box p="3" className="bg-[rgb(var(--background))] rounded">
              C
            </Box>
          </Flex>
        </div>
      ))}
    </div>
  ),
};

/** Align items options (cross axis) */
export const AlignItems: Story = {
  render: () => (
    <div className="space-y-6">
      {(['start', 'end', 'center', 'baseline', 'stretch'] as const).map((align) => (
        <div key={align}>
          <div className="text-sm font-medium mb-2">align="{align}"</div>
          <Flex align={align} gap="4" className="bg-[rgb(var(--muted))] p-2 rounded h-24">
            <Box p="2" className="bg-[rgb(var(--background))] rounded">
              Short
            </Box>
            <Box p="4" className="bg-[rgb(var(--background))] rounded">
              Taller
            </Box>
            <Box p="1" className="bg-[rgb(var(--background))] rounded">
              Tiny
            </Box>
          </Flex>
        </div>
      ))}
    </div>
  ),
};

/** Wrap behavior */
export const WrapBehavior: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <div className="text-sm font-medium mb-2">nowrap (default) - items overflow</div>
        <Flex
          wrap="nowrap"
          gap="4"
          className="max-w-md overflow-hidden bg-[rgb(var(--muted))] p-2 rounded"
        >
          {Array.from({ length: 8 }, (_, i) => (
            <Box key={i} p="3" className="bg-[rgb(var(--background))] rounded whitespace-nowrap">
              Item {i + 1}
            </Box>
          ))}
        </Flex>
      </div>
      <div>
        <div className="text-sm font-medium mb-2">wrap - items wrap to next line</div>
        <Flex wrap="wrap" gap="4" className="max-w-md bg-[rgb(var(--muted))] p-2 rounded">
          {Array.from({ length: 8 }, (_, i) => (
            <Box key={i} p="3" className="bg-[rgb(var(--background))] rounded">
              Item {i + 1}
            </Box>
          ))}
        </Flex>
      </div>
      <div>
        <div className="text-sm font-medium mb-2">wrap-reverse - items wrap upward</div>
        <Flex wrap="wrap-reverse" gap="4" className="max-w-md bg-[rgb(var(--muted))] p-2 rounded">
          {Array.from({ length: 8 }, (_, i) => (
            <Box key={i} p="3" className="bg-[rgb(var(--background))] rounded">
              Item {i + 1}
            </Box>
          ))}
        </Flex>
      </div>
    </div>
  ),
};

/** Gap between items */
export const GapSizes: Story = {
  render: () => (
    <div className="space-y-6">
      {(['0', '1', '2', '4', '6', '8'] as const).map((gapSize) => (
        <div key={gapSize}>
          <div className="text-sm font-medium mb-2">gap="{gapSize}"</div>
          <Flex gap={gapSize} className="bg-[rgb(var(--muted))] p-2 rounded">
            <Box p="3" className="bg-[rgb(var(--background))] rounded">
              A
            </Box>
            <Box p="3" className="bg-[rgb(var(--background))] rounded">
              B
            </Box>
            <Box p="3" className="bg-[rgb(var(--background))] rounded">
              C
            </Box>
          </Flex>
        </div>
      ))}
    </div>
  ),
};

/** Responsive layout - column on mobile, row on larger screens */
export const ResponsiveDirection: Story = {
  render: () => (
    <Flex
      direction={{ base: 'column', md: 'row' }}
      gap={{ base: '2', md: '4' }}
      className="bg-[rgb(var(--muted))] p-4 rounded"
    >
      <DemoItem>Item 1</DemoItem>
      <DemoItem>Item 2</DemoItem>
      <DemoItem>Item 3</DemoItem>
    </Flex>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Resize your browser to see the layout change from column (mobile) to row (tablet and up).',
      },
    },
  },
};

/** Responsive alignment */
export const ResponsiveAlign: Story = {
  render: () => (
    <Flex
      direction="column"
      align={{ base: 'stretch', sm: 'start', md: 'center', lg: 'end' }}
      gap="4"
      className="bg-[rgb(var(--muted))] p-4 rounded min-h-[200px]"
    >
      <DemoItem>Item 1</DemoItem>
      <DemoItem>Item 2</DemoItem>
      <DemoItem>Item 3</DemoItem>
    </Flex>
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

/** Centering content */
export const CenteredContent: Story = {
  render: () => (
    <Flex justify="center" align="center" className="bg-[rgb(var(--muted))] rounded h-64">
      <DemoItem>Centered Content</DemoItem>
    </Flex>
  ),
};

/** Space between layout */
export const SpaceBetween: Story = {
  render: () => (
    <Flex justify="between" align="center" className="bg-[rgb(var(--muted))] p-4 rounded">
      <Box p="3" className="bg-[rgb(var(--background))] rounded">
        Left
      </Box>
      <Box p="3" className="bg-[rgb(var(--background))] rounded">
        Center
      </Box>
      <Box p="3" className="bg-[rgb(var(--background))] rounded">
        Right
      </Box>
    </Flex>
  ),
};

/** Inline flex */
export const InlineFlex: Story = {
  render: () => (
    <div>
      <span>Some text before </span>
      <Flex inline gap="2" align="center">
        <Box p="1" className="bg-[rgb(var(--muted))] rounded">
          Inline
        </Box>
        <Box p="1" className="bg-[rgb(var(--muted))] rounded">
          Flex
        </Box>
      </Flex>
      <span> and some text after.</span>
    </div>
  ),
};

/** Polymorphic - rendered as different HTML elements */
export const PolymorphicAs: Story = {
  render: () => (
    <div className="space-y-4">
      <Flex as="nav" gap="4" aria-label="Main navigation">
        <Box p="2" className="bg-[rgb(var(--muted))] rounded">
          Home
        </Box>
        <Box p="2" className="bg-[rgb(var(--muted))] rounded">
          About
        </Box>
        <Box p="2" className="bg-[rgb(var(--muted))] rounded">
          Contact
        </Box>
      </Flex>
      <Flex as="ul" direction="column" gap="2" className="list-none">
        <Box as="li" p="2" className="bg-[rgb(var(--muted))] rounded">
          List Item 1
        </Box>
        <Box as="li" p="2" className="bg-[rgb(var(--muted))] rounded">
          List Item 2
        </Box>
        <Box as="li" p="2" className="bg-[rgb(var(--muted))] rounded">
          List Item 3
        </Box>
      </Flex>
    </div>
  ),
};

/** Combined with spacing props */
export const WithSpacing: Story = {
  render: () => (
    <Flex direction="column" gap="4" p="6" m="4" className="bg-[rgb(var(--muted))] rounded">
      <Box p="4" className="bg-[rgb(var(--background))] rounded border border-[rgb(var(--border))]">
        Item with p="6" m="4" on parent
      </Box>
      <Box p="4" className="bg-[rgb(var(--background))] rounded border border-[rgb(var(--border))]">
        Children have gap="4"
      </Box>
    </Flex>
  ),
};

/** Card layout example */
export const CardLayoutExample: Story = {
  render: () => (
    <Flex direction={{ base: 'column', md: 'row' }} wrap="wrap" gap="4">
      {Array.from({ length: 6 }, (_, i) => (
        <Box
          key={i}
          p="4"
          className="bg-[rgb(var(--background))] rounded border border-[rgb(var(--border))] flex-1 min-w-[200px]"
        >
          <Flex direction="column" gap="2">
            <div className="font-medium">Card {i + 1}</div>
            <div className="text-sm text-[rgb(var(--muted-foreground))]">
              Card description goes here
            </div>
          </Flex>
        </Box>
      ))}
    </Flex>
  ),
};

/** With ARIA attributes */
export const WithA11yProps: Story = {
  render: () => (
    <Flex as="nav" gap="4" aria-label="Breadcrumb navigation" role="navigation">
      <Box p="2" className="bg-[rgb(var(--muted))] rounded">
        Home
      </Box>
      <span aria-hidden="true">/</span>
      <Box p="2" className="bg-[rgb(var(--muted))] rounded">
        Products
      </Box>
      <span aria-hidden="true">/</span>
      <Box p="2" className="bg-[rgb(var(--muted))] rounded" aria-current="page">
        Current Page
      </Box>
    </Flex>
  ),
};

/** With data-testid for testing */
export const WithTestId: Story = {
  args: {
    gap: '4',
    'data-testid': 'my-flex-container',
    children: (
      <>
        <Box p="4" className="bg-[rgb(var(--muted))] rounded" data-testid="flex-item-1">
          Item 1
        </Box>
        <Box p="4" className="bg-[rgb(var(--muted))] rounded" data-testid="flex-item-2">
          Item 2
        </Box>
      </>
    ),
  },
};
