import type { Meta, StoryObj } from '@storybook/react';
import { Box } from './Box';

const meta: Meta<typeof Box> = {
  title: 'Primitives/Box',
  component: Box,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'The foundational layout primitive. A polymorphic container with responsive spacing and accessibility support.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    as: {
      control: 'select',
      options: ['div', 'section', 'article', 'aside', 'header', 'footer', 'main', 'nav', 'span'],
      description: 'HTML element to render',
    },
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
    m: {
      control: 'select',
      options: ['0', '1', '2', '3', '4', '5', '6', '8', '10', '12', '16', 'auto'],
      description: 'Margin on all sides',
    },
    gap: {
      control: 'select',
      options: ['0', '1', '2', '3', '4', '5', '6', '8', '10', '12', '16'],
      description: 'Gap between children (for flex/grid)',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Box>;

/** Basic Box with padding */
export const Default: Story = {
  args: {
    p: '4',
    children: 'A basic Box with padding',
    className: 'bg-[rgb(var(--muted))] rounded-md',
  },
};

/** Box with different padding values */
export const WithPadding: Story = {
  render: () => (
    <div className="space-y-4">
      <Box p="2" className="bg-[rgb(var(--muted))] rounded">
        p="2"
      </Box>
      <Box p="4" className="bg-[rgb(var(--muted))] rounded">
        p="4"
      </Box>
      <Box p="8" className="bg-[rgb(var(--muted))] rounded">
        p="8"
      </Box>
    </div>
  ),
};

/** Box with horizontal and vertical padding */
export const WithDirectionalPadding: Story = {
  render: () => (
    <div className="space-y-4">
      <Box px="8" py="2" className="bg-[rgb(var(--muted))] rounded">
        px="8" py="2"
      </Box>
      <Box px="2" py="8" className="bg-[rgb(var(--muted))] rounded">
        px="2" py="8"
      </Box>
    </div>
  ),
};

/** Box with margin */
export const WithMargin: Story = {
  render: () => (
    <div className="bg-[rgb(var(--border))] rounded">
      <Box m="4" p="4" className="bg-[rgb(var(--muted))] rounded">
        m="4" p="4"
      </Box>
    </div>
  ),
};

/** Responsive padding - changes based on viewport */
export const ResponsivePadding: Story = {
  render: () => (
    <Box
      p={{ base: '2', sm: '4', md: '6', lg: '8', xl: '10' }}
      className="bg-[rgb(var(--muted))] rounded"
    >
      Responsive padding: p-2 → sm:p-4 → md:p-6 → lg:p-8 → xl:p-10
    </Box>
  ),
};

/** Responsive margin */
export const ResponsiveMargin: Story = {
  render: () => (
    <div className="bg-[rgb(var(--border))] rounded">
      <Box m={{ base: '2', md: '4', lg: '8' }} p="4" className="bg-[rgb(var(--muted))] rounded">
        Responsive margin: m-2 → md:m-4 → lg:m-8
      </Box>
    </div>
  ),
};

/** Box rendered as different HTML elements */
export const PolymorphicAs: Story = {
  render: () => (
    <div className="space-y-4">
      <Box as="div" p="4" className="bg-[rgb(var(--muted))] rounded">
        as="div" (default)
      </Box>
      <Box
        as="section"
        p="4"
        className="bg-[rgb(var(--muted))] rounded"
        aria-label="Example section"
      >
        as="section"
      </Box>
      <Box as="article" p="4" className="bg-[rgb(var(--muted))] rounded">
        as="article"
      </Box>
      <Box as="aside" p="4" className="bg-[rgb(var(--muted))] rounded" aria-label="Sidebar">
        as="aside"
      </Box>
      <Box as="span" p="2" className="bg-[rgb(var(--muted))] rounded inline-block">
        as="span" (inline)
      </Box>
    </div>
  ),
};

/** Box with ARIA attributes for accessibility */
export const WithA11yProps: Story = {
  render: () => (
    <div className="space-y-4">
      <Box
        as="section"
        p="4"
        className="bg-[rgb(var(--muted))] rounded"
        aria-label="Featured content"
        role="region"
      >
        Section with aria-label and role
      </Box>
      <Box p="4" className="bg-[rgb(var(--muted))] rounded" aria-live="polite" aria-busy={false}>
        Live region (aria-live="polite")
      </Box>
      <Box p="4" className="bg-[rgb(var(--muted))] rounded" aria-hidden={true}>
        Hidden from screen readers (aria-hidden)
      </Box>
    </div>
  ),
};

/** Nested Box components for layout composition */
export const NestedBoxes: Story = {
  render: () => (
    <Box p="4" className="bg-[rgb(var(--muted))] rounded">
      <Box
        p="4"
        mb="4"
        className="bg-[rgb(var(--background))] rounded border border-[rgb(var(--border))]"
      >
        Header Box
      </Box>
      <Box
        p="4"
        mb="4"
        className="bg-[rgb(var(--background))] rounded border border-[rgb(var(--border))]"
      >
        Main Content Box
      </Box>
      <Box p="4" className="bg-[rgb(var(--background))] rounded border border-[rgb(var(--border))]">
        Footer Box
      </Box>
    </Box>
  ),
};

/** Box as a flex container with gap */
export const AsFlexContainer: Story = {
  render: () => (
    <Box p="4" gap="4" className="flex bg-[rgb(var(--muted))] rounded">
      <Box p="4" className="bg-[rgb(var(--background))] rounded border border-[rgb(var(--border))]">
        Item 1
      </Box>
      <Box p="4" className="bg-[rgb(var(--background))] rounded border border-[rgb(var(--border))]">
        Item 2
      </Box>
      <Box p="4" className="bg-[rgb(var(--background))] rounded border border-[rgb(var(--border))]">
        Item 3
      </Box>
    </Box>
  ),
};

/** Box with data-testid for testing */
export const WithTestId: Story = {
  args: {
    p: '4',
    children: 'Box with test ID',
    className: 'bg-[rgb(var(--muted))] rounded',
    'data-testid': 'my-box',
  },
};

/** All spacing props demonstrated */
export const AllSpacingProps: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="text-sm font-medium">Padding (p, px, py, pt, pr, pb, pl):</div>
      <Box pt="8" className="bg-[rgb(var(--muted))] rounded">
        pt="8" (padding-top)
      </Box>
      <Box pr="8" className="bg-[rgb(var(--muted))] rounded">
        pr="8" (padding-right)
      </Box>
      <Box pb="8" className="bg-[rgb(var(--muted))] rounded">
        pb="8" (padding-bottom)
      </Box>
      <Box pl="8" className="bg-[rgb(var(--muted))] rounded">
        pl="8" (padding-left)
      </Box>

      <div className="text-sm font-medium mt-8">Margin (m, mx, my, mt, mr, mb, ml):</div>
      <div className="bg-[rgb(var(--border))] rounded p-1">
        <Box mt="4" p="2" className="bg-[rgb(var(--muted))] rounded">
          mt="4"
        </Box>
      </div>
      <div className="bg-[rgb(var(--border))] rounded p-1">
        <Box mx="8" p="2" className="bg-[rgb(var(--muted))] rounded">
          mx="8"
        </Box>
      </div>
      <div className="bg-[rgb(var(--border))] rounded p-1">
        <Box my="4" p="2" className="bg-[rgb(var(--muted))] rounded">
          my="4"
        </Box>
      </div>
    </div>
  ),
};

/** Box combined with custom className */
export const WithCustomStyles: Story = {
  args: {
    p: '6',
    children: 'Custom styled Box',
    className: 'bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl shadow-lg',
  },
};
