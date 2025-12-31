import type { Meta, StoryObj } from '@storybook/react';
import { Box } from './Box';
import { Grid } from './Grid';

const meta: Meta<typeof Grid> = {
  title: 'Primitives/Grid',
  component: Grid,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'CSS Grid container primitive. Provides responsive columns, rows, gap, and flow props with all spacing props from Box.',
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
    columns: {
      control: 'select',
      options: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 'none'],
      description: 'Number of grid columns',
    },
    rows: {
      control: 'select',
      options: [1, 2, 3, 4, 5, 6, 'none'],
      description: 'Number of grid rows',
    },
    gap: {
      control: 'select',
      options: ['0', '1', '2', '3', '4', '5', '6', '8', '10', '12', '16'],
      description: 'Gap between grid items',
    },
    gapX: {
      control: 'select',
      options: ['0', '1', '2', '3', '4', '5', '6', '8', '10', '12', '16'],
      description: 'Horizontal gap between grid items',
    },
    gapY: {
      control: 'select',
      options: ['0', '1', '2', '3', '4', '5', '6', '8', '10', '12', '16'],
      description: 'Vertical gap between grid items',
    },
    flow: {
      control: 'select',
      options: ['row', 'col', 'dense', 'row-dense', 'col-dense'],
      description: 'Grid auto-flow direction',
    },
    inline: {
      control: 'boolean',
      description: 'Display as inline-grid',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Grid>;

/** Item component for demo purposes */
const DemoItem = ({ children }: { children: React.ReactNode }) => (
  <Box
    p="4"
    className="bg-[rgb(var(--muted))] rounded border border-[rgb(var(--border))] text-center"
  >
    {children}
  </Box>
);

/** Basic 3-column grid layout */
export const Default: Story = {
  render: () => (
    <Grid columns={3} gap="4">
      <DemoItem>Item 1</DemoItem>
      <DemoItem>Item 2</DemoItem>
      <DemoItem>Item 3</DemoItem>
      <DemoItem>Item 4</DemoItem>
      <DemoItem>Item 5</DemoItem>
      <DemoItem>Item 6</DemoItem>
    </Grid>
  ),
};

/** Different column counts */
export const ColumnCounts: Story = {
  render: () => (
    <div className="space-y-8">
      {([1, 2, 3, 4, 6, 12] as const).map((cols) => (
        <div key={cols}>
          <div className="text-sm font-medium mb-2">columns={cols}</div>
          <Grid columns={cols} gap="2">
            {Array.from({ length: 6 }, (_, i) => (
              <Box key={i} p="2" className="bg-[rgb(var(--muted))] rounded text-center text-sm">
                {i + 1}
              </Box>
            ))}
          </Grid>
        </div>
      ))}
    </div>
  ),
};

/** Different row counts */
export const RowCounts: Story = {
  render: () => (
    <div className="space-y-8">
      {([1, 2, 3] as const).map((rowCount) => (
        <div key={rowCount}>
          <div className="text-sm font-medium mb-2">rows={rowCount} (with flow="col")</div>
          <Grid rows={rowCount} flow="col" gap="2" className="h-48">
            {Array.from({ length: 6 }, (_, i) => (
              <Box key={i} p="2" className="bg-[rgb(var(--muted))] rounded text-center text-sm">
                {i + 1}
              </Box>
            ))}
          </Grid>
        </div>
      ))}
    </div>
  ),
};

/** Gap sizes */
export const GapSizes: Story = {
  render: () => (
    <div className="space-y-6">
      {(['0', '1', '2', '4', '6', '8'] as const).map((gapSize) => (
        <div key={gapSize}>
          <div className="text-sm font-medium mb-2">gap="{gapSize}"</div>
          <Grid columns={3} gap={gapSize} className="bg-[rgb(var(--muted))] p-2 rounded">
            {Array.from({ length: 6 }, (_, i) => (
              <Box key={i} p="3" className="bg-[rgb(var(--background))] rounded text-center">
                {i + 1}
              </Box>
            ))}
          </Grid>
        </div>
      ))}
    </div>
  ),
};

/** Separate X and Y gaps */
export const SeparateGaps: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <div className="text-sm font-medium mb-2">gapX="2" gapY="8"</div>
        <Grid columns={3} gapX="2" gapY="8" className="bg-[rgb(var(--muted))] p-2 rounded">
          {Array.from({ length: 9 }, (_, i) => (
            <Box key={i} p="3" className="bg-[rgb(var(--background))] rounded text-center">
              {i + 1}
            </Box>
          ))}
        </Grid>
      </div>
      <div>
        <div className="text-sm font-medium mb-2">gapX="8" gapY="2"</div>
        <Grid columns={3} gapX="8" gapY="2" className="bg-[rgb(var(--muted))] p-2 rounded">
          {Array.from({ length: 9 }, (_, i) => (
            <Box key={i} p="3" className="bg-[rgb(var(--background))] rounded text-center">
              {i + 1}
            </Box>
          ))}
        </Grid>
      </div>
    </div>
  ),
};

/** Grid flow directions */
export const FlowDirections: Story = {
  render: () => (
    <div className="space-y-8">
      {(['row', 'col', 'dense', 'row-dense', 'col-dense'] as const).map((flowDir) => (
        <div key={flowDir}>
          <div className="text-sm font-medium mb-2">flow="{flowDir}"</div>
          <Grid
            columns={3}
            rows={2}
            flow={flowDir}
            gap="2"
            className="bg-[rgb(var(--muted))] p-2 rounded h-32"
          >
            {Array.from({ length: 5 }, (_, i) => (
              <Box
                key={i}
                p="2"
                className="bg-[rgb(var(--background))] rounded text-center text-sm"
              >
                {i + 1}
              </Box>
            ))}
          </Grid>
        </div>
      ))}
    </div>
  ),
};

/** Dense packing with varying item sizes */
export const DensePacking: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <div className="text-sm font-medium mb-2">Without dense (gaps appear)</div>
        <Grid columns={3} gap="2" className="bg-[rgb(var(--muted))] p-2 rounded">
          <Box p="3" className="bg-[rgb(var(--background))] rounded text-center col-span-2">
            Wide 1
          </Box>
          <Box p="3" className="bg-[rgb(var(--background))] rounded text-center">
            A
          </Box>
          <Box p="3" className="bg-[rgb(var(--background))] rounded text-center col-span-2">
            Wide 2
          </Box>
          <Box p="3" className="bg-[rgb(var(--background))] rounded text-center">
            B
          </Box>
          <Box p="3" className="bg-[rgb(var(--background))] rounded text-center">
            C
          </Box>
        </Grid>
      </div>
      <div>
        <div className="text-sm font-medium mb-2">With dense (fills gaps)</div>
        <Grid columns={3} flow="dense" gap="2" className="bg-[rgb(var(--muted))] p-2 rounded">
          <Box p="3" className="bg-[rgb(var(--background))] rounded text-center col-span-2">
            Wide 1
          </Box>
          <Box p="3" className="bg-[rgb(var(--background))] rounded text-center">
            A
          </Box>
          <Box p="3" className="bg-[rgb(var(--background))] rounded text-center col-span-2">
            Wide 2
          </Box>
          <Box p="3" className="bg-[rgb(var(--background))] rounded text-center">
            B
          </Box>
          <Box p="3" className="bg-[rgb(var(--background))] rounded text-center">
            C
          </Box>
        </Grid>
      </div>
    </div>
  ),
};

/** Responsive columns - 1 on mobile, 2 on tablet, 4 on desktop */
export const ResponsiveColumns: Story = {
  render: () => (
    <Grid
      columns={{ base: 1, sm: 2, md: 3, lg: 4 }}
      gap={{ base: '2', md: '4' }}
      className="bg-[rgb(var(--muted))] p-4 rounded"
    >
      {Array.from({ length: 8 }, (_, i) => (
        <DemoItem key={i}>Item {i + 1}</DemoItem>
      ))}
    </Grid>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Resize your browser to see columns change: 1 (mobile) → 2 (sm) → 3 (md) → 4 (lg).',
      },
    },
  },
};

/** Responsive gap */
export const ResponsiveGap: Story = {
  render: () => (
    <Grid
      columns={3}
      gap={{ base: '1', sm: '2', md: '4', lg: '8' }}
      className="bg-[rgb(var(--muted))] p-4 rounded"
    >
      {Array.from({ length: 6 }, (_, i) => (
        <Box key={i} p="3" className="bg-[rgb(var(--background))] rounded text-center">
          {i + 1}
        </Box>
      ))}
    </Grid>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Resize to see gap change: 1 (mobile) → 2 (sm) → 4 (md) → 8 (lg).',
      },
    },
  },
};

/** Inline grid */
export const InlineGrid: Story = {
  render: () => (
    <div>
      <span>Some text before </span>
      <Grid inline columns={2} gap="2">
        <Box p="1" className="bg-[rgb(var(--muted))] rounded text-sm">
          Grid
        </Box>
        <Box p="1" className="bg-[rgb(var(--muted))] rounded text-sm">
          Items
        </Box>
      </Grid>
      <span> and some text after.</span>
    </div>
  ),
};

/** Polymorphic - rendered as different HTML elements */
export const PolymorphicAs: Story = {
  render: () => (
    <div className="space-y-4">
      <Grid as="section" columns={3} gap="4" aria-label="Feature grid">
        <DemoItem>Feature 1</DemoItem>
        <DemoItem>Feature 2</DemoItem>
        <DemoItem>Feature 3</DemoItem>
      </Grid>
      <Grid as="ul" columns={2} gap="2" className="list-none">
        <Box as="li" p="2" className="bg-[rgb(var(--muted))] rounded">
          List Item 1
        </Box>
        <Box as="li" p="2" className="bg-[rgb(var(--muted))] rounded">
          List Item 2
        </Box>
        <Box as="li" p="2" className="bg-[rgb(var(--muted))] rounded">
          List Item 3
        </Box>
        <Box as="li" p="2" className="bg-[rgb(var(--muted))] rounded">
          List Item 4
        </Box>
      </Grid>
    </div>
  ),
};

/** Combined with spacing props */
export const WithSpacing: Story = {
  render: () => (
    <Grid columns={2} gap="4" p="6" m="4" className="bg-[rgb(var(--muted))] rounded">
      <Box p="4" className="bg-[rgb(var(--background))] rounded border border-[rgb(var(--border))]">
        Item with p="6" m="4" on parent
      </Box>
      <Box p="4" className="bg-[rgb(var(--background))] rounded border border-[rgb(var(--border))]">
        Children have gap="4"
      </Box>
    </Grid>
  ),
};

/** Card grid layout example */
export const CardGridExample: Story = {
  render: () => (
    <Grid columns={{ base: 1, sm: 2, lg: 3, xl: 4 }} gap="6">
      {Array.from({ length: 8 }, (_, i) => (
        <Box
          key={i}
          p="4"
          className="bg-[rgb(var(--background))] rounded-lg border border-[rgb(var(--border))] shadow-sm"
        >
          <div className="font-medium mb-2">Card {i + 1}</div>
          <div className="text-sm text-[rgb(var(--muted-foreground))]">
            This is a card description with responsive grid layout.
          </div>
        </Box>
      ))}
    </Grid>
  ),
};

/** Dashboard grid layout example */
export const DashboardLayoutExample: Story = {
  render: () => (
    <Grid columns={12} gap="4">
      {/* Main content area - spans 8 columns on large screens */}
      <Box
        p="4"
        className="col-span-12 lg:col-span-8 bg-[rgb(var(--background))] rounded border border-[rgb(var(--border))] min-h-[200px]"
      >
        <div className="font-medium">Main Content</div>
        <div className="text-sm text-[rgb(var(--muted-foreground))]">8 columns on lg+</div>
      </Box>
      {/* Sidebar - spans 4 columns on large screens */}
      <Box
        p="4"
        className="col-span-12 lg:col-span-4 bg-[rgb(var(--background))] rounded border border-[rgb(var(--border))] min-h-[200px]"
      >
        <div className="font-medium">Sidebar</div>
        <div className="text-sm text-[rgb(var(--muted-foreground))]">4 columns on lg+</div>
      </Box>
      {/* Stats row - 4 equal columns */}
      {Array.from({ length: 4 }, (_, i) => (
        <Box
          key={i}
          p="4"
          className="col-span-6 md:col-span-3 bg-[rgb(var(--background))] rounded border border-[rgb(var(--border))]"
        >
          <div className="font-medium">Stat {i + 1}</div>
          <div className="text-2xl font-bold">{(i + 1) * 123}</div>
        </Box>
      ))}
    </Grid>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Example dashboard layout using 12-column grid with responsive column spans.',
      },
    },
  },
};

/** Photo gallery example */
export const PhotoGalleryExample: Story = {
  render: () => (
    <Grid columns={{ base: 2, md: 3, lg: 4 }} gap="2">
      {Array.from({ length: 12 }, (_, i) => (
        <Box
          key={i}
          className="aspect-square bg-[rgb(var(--muted))] rounded overflow-hidden flex items-center justify-center"
        >
          <span className="text-[rgb(var(--muted-foreground))] text-sm">Photo {i + 1}</span>
        </Box>
      ))}
    </Grid>
  ),
};

/** With ARIA attributes */
export const WithA11yProps: Story = {
  render: () => (
    <Grid as="section" columns={3} gap="4" aria-label="Product grid" role="list">
      {Array.from({ length: 6 }, (_, i) => (
        <Box
          key={i}
          p="4"
          className="bg-[rgb(var(--background))] rounded border border-[rgb(var(--border))]"
          role="listitem"
        >
          <div className="font-medium">Product {i + 1}</div>
          <div className="text-sm text-[rgb(var(--muted-foreground))]">$99.99</div>
        </Box>
      ))}
    </Grid>
  ),
};

/** With data-testid for testing */
export const WithTestId: Story = {
  args: {
    columns: 3,
    gap: '4',
    'data-testid': 'my-grid-container',
    children: (
      <>
        <Box p="4" className="bg-[rgb(var(--muted))] rounded" data-testid="grid-item-1">
          Item 1
        </Box>
        <Box p="4" className="bg-[rgb(var(--muted))] rounded" data-testid="grid-item-2">
          Item 2
        </Box>
        <Box p="4" className="bg-[rgb(var(--muted))] rounded" data-testid="grid-item-3">
          Item 3
        </Box>
      </>
    ),
  },
};
