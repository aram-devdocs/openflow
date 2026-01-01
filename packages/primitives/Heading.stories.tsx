import type { Meta, StoryObj } from '@storybook/react';
import { Box } from './Box';
import { Flex } from './Flex';
import { Heading } from './Heading';
import { Stack } from './Stack';
import { Text } from './Text';

const meta: Meta<typeof Heading> = {
  title: 'Primitives/Heading',
  component: Heading,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Semantic heading primitive (h1-h6) with required level prop and automatic sizing. Provides responsive text size, font weight, and color with ARIA attribute support.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    level: {
      control: { type: 'select' },
      options: [1, 2, 3, 4, 5, 6],
      description: 'Heading level (1-6), determines the HTML tag (h1-h6)',
    },
    size: {
      control: 'select',
      options: [
        undefined,
        'xs',
        'sm',
        'base',
        'lg',
        'xl',
        '2xl',
        '3xl',
        '4xl',
        '5xl',
        '6xl',
        '7xl',
      ],
      description: 'Text size (overrides automatic sizing based on level)',
    },
    weight: {
      control: 'select',
      options: [
        'thin',
        'extralight',
        'light',
        'normal',
        'medium',
        'semibold',
        'bold',
        'extrabold',
        'black',
      ],
      description: 'Font weight (defaults to bold)',
    },
    color: {
      control: 'text',
      description: 'Text color (e.g., "red-500", "muted-foreground")',
    },
    truncate: {
      control: 'boolean',
      description: 'Truncate text with ellipsis',
    },
    align: {
      control: 'select',
      options: [undefined, 'left', 'center', 'right'],
      description: 'Text alignment',
    },
    tracking: {
      control: 'select',
      options: [undefined, 'tighter', 'tight', 'normal', 'wide', 'wider', 'widest'],
      description: 'Letter spacing',
    },
    leading: {
      control: 'select',
      options: [undefined, 'none', 'tight', 'snug', 'normal', 'relaxed', 'loose'],
      description: 'Line height',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Heading>;

/** Basic heading with automatic sizing based on level */
export const Default: Story = {
  args: {
    level: 1,
    children: 'Page Title',
  },
};

/** All heading levels with their default sizes */
export const AllLevels: Story = {
  render: () => (
    <Stack gap="4">
      <Heading level={1}>Heading Level 1 (h1) - 4xl</Heading>
      <Heading level={2}>Heading Level 2 (h2) - 3xl</Heading>
      <Heading level={3}>Heading Level 3 (h3) - 2xl</Heading>
      <Heading level={4}>Heading Level 4 (h4) - xl</Heading>
      <Heading level={5}>Heading Level 5 (h5) - lg</Heading>
      <Heading level={6}>Heading Level 6 (h6) - base</Heading>
    </Stack>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Each heading level automatically gets an appropriate text size: h1=4xl, h2=3xl, h3=2xl, h4=xl, h5=lg, h6=base.',
      },
    },
  },
};

/** Heading levels with their corresponding HTML tags visible */
export const LevelsWithTags: Story = {
  render: () => (
    <Stack gap="4">
      {([1, 2, 3, 4, 5, 6] as const).map((level) => (
        <Flex key={level} align="baseline" gap="4">
          <Text size="sm" color="muted-foreground" className="w-8 font-mono">
            h{level}
          </Text>
          <Heading level={level}>Heading Level {level}</Heading>
        </Flex>
      ))}
    </Stack>
  ),
};

/** Custom size override */
export const CustomSize: Story = {
  render: () => (
    <Stack gap="4">
      <Heading level={1} size="7xl">
        Extra Large H1
      </Heading>
      <Heading level={2} size="5xl">
        Large H2
      </Heading>
      <Heading level={3} size="sm">
        Small H3 (size overridden)
      </Heading>
    </Stack>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'The size prop allows overriding the default size for a heading level while maintaining semantic HTML.',
      },
    },
  },
};

/** Responsive sizing */
export const ResponsiveSize: Story = {
  render: () => (
    <Heading level={1} size={{ base: 'xl', sm: '2xl', md: '3xl', lg: '4xl', xl: '5xl' }}>
      Resize your browser to see this heading change size
    </Heading>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Heading size changes at different viewport widths: xl → 2xl → 3xl → 4xl → 5xl.',
      },
    },
  },
};

/** All available font weights */
export const Weights: Story = {
  render: () => (
    <Stack gap="3">
      {(
        [
          'thin',
          'extralight',
          'light',
          'normal',
          'medium',
          'semibold',
          'bold',
          'extrabold',
          'black',
        ] as const
      ).map((weight) => (
        <Flex key={weight} align="center" gap="4">
          <Text size="sm" color="muted-foreground" className="w-20">
            {weight}
          </Text>
          <Heading level={3} weight={weight}>
            The Quick Brown Fox
          </Heading>
        </Flex>
      ))}
    </Stack>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Font weight can be customized. The default weight for all heading levels is "bold".',
      },
    },
  },
};

/** Responsive font weight */
export const ResponsiveWeight: Story = {
  render: () => (
    <Heading level={2} weight={{ base: 'normal', md: 'semibold', lg: 'bold' }}>
      Resize to see weight change: normal → semibold → bold
    </Heading>
  ),
};

/** Text colors using Tailwind classes */
export const Colors: Story = {
  render: () => (
    <Stack gap="3">
      <Heading level={3} color="red-500">
        Red 500 Heading
      </Heading>
      <Heading level={3} color="blue-600">
        Blue 600 Heading
      </Heading>
      <Heading level={3} color="green-500">
        Green 500 Heading
      </Heading>
      <Heading level={3} color="orange-500">
        Orange 500 Heading
      </Heading>
      <Heading level={3} color="purple-600">
        Purple 600 Heading
      </Heading>
      <Heading level={3} color="muted-foreground">
        Muted Foreground (CSS variable)
      </Heading>
      <Heading level={3} color="primary">
        Primary Color (CSS variable)
      </Heading>
    </Stack>
  ),
};

/** Text alignment options */
export const TextAlignment: Story = {
  render: () => (
    <Stack gap="4">
      {(['left', 'center', 'right'] as const).map((alignment) => (
        <Box key={alignment} className="border border-[rgb(var(--border))] p-4 rounded">
          <Text size="sm" color="muted-foreground" className="mb-2 block">
            align="{alignment}"
          </Text>
          <Heading level={2} align={alignment}>
            Aligned Heading
          </Heading>
        </Box>
      ))}
    </Stack>
  ),
};

/** Responsive text alignment */
export const ResponsiveAlignment: Story = {
  render: () => (
    <Box className="border border-[rgb(var(--border))] p-4 rounded">
      <Heading level={2} align={{ base: 'center', md: 'left', lg: 'right' }}>
        Resize to see alignment change: center → left → right
      </Heading>
    </Box>
  ),
};

/** Letter spacing options */
export const LetterSpacing: Story = {
  render: () => (
    <Stack gap="3">
      {(['tighter', 'tight', 'normal', 'wide', 'wider', 'widest'] as const).map((spacing) => (
        <Flex key={spacing} align="center" gap="4">
          <Text size="sm" color="muted-foreground" className="w-16">
            {spacing}
          </Text>
          <Heading level={3} tracking={spacing}>
            LETTER SPACING
          </Heading>
        </Flex>
      ))}
    </Stack>
  ),
};

/** Tight tracking for large headings */
export const TightTrackingHero: Story = {
  render: () => (
    <Stack gap="2">
      <Heading level={1} size="6xl" tracking="tighter" weight="black">
        Hero Headline
      </Heading>
      <Heading level={2} size="3xl" tracking="tight" weight="light" color="muted-foreground">
        Subheadline with tight tracking
      </Heading>
    </Stack>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Tighter letter spacing works well for large hero headings to maintain visual density.',
      },
    },
  },
};

/** Line height options */
export const LineHeight: Story = {
  render: () => (
    <Stack gap="6">
      {(['tight', 'snug', 'normal', 'relaxed', 'loose'] as const).map((lineHeight) => (
        <Box key={lineHeight} className="max-w-lg">
          <Text size="sm" color="muted-foreground" className="mb-1 block">
            leading="{lineHeight}"
          </Text>
          <Heading
            level={3}
            leading={lineHeight}
            className="border-l-2 border-[rgb(var(--border))] pl-3"
          >
            Multi-line heading that demonstrates different line heights when it wraps to the next
            line
          </Heading>
        </Box>
      ))}
    </Stack>
  ),
};

/** Truncation for long headings */
export const Truncation: Story = {
  render: () => (
    <Box className="max-w-sm">
      <Heading level={2} truncate>
        This is a very long heading that will be truncated with an ellipsis when it overflows
      </Heading>
    </Box>
  ),
};

/** Combined typography styles */
export const CombinedStyles: Story = {
  render: () => (
    <Stack gap="6">
      <Heading level={1} size="5xl" weight="black" tracking="tighter">
        Hero Title
      </Heading>
      <Heading level={2} size="2xl" weight="light" color="muted-foreground" tracking="tight">
        Subtle Section Heading
      </Heading>
      <Heading level={3} size="xl" weight="semibold" align="center">
        Centered Heading
      </Heading>
      <Heading level={4} weight="medium" color="blue-600">
        Accent Color Heading
      </Heading>
    </Stack>
  ),
};

/** Document structure example */
export const DocumentStructure: Story = {
  render: () => (
    <Stack gap="6" className="max-w-2xl">
      <Box as="header">
        <Heading level={1}>Getting Started with OpenFlow</Heading>
        <Text as="p" size="lg" color="muted-foreground" className="mt-2">
          Learn how to orchestrate AI coding tools effectively.
        </Text>
      </Box>

      <Box as="section">
        <Heading level={2} className="mb-3">
          Installation
        </Heading>
        <Text as="p" className="mb-4">
          Follow these steps to install OpenFlow on your system.
        </Text>

        <Heading level={3} className="mb-2">
          Prerequisites
        </Heading>
        <Text as="p">You&apos;ll need Node.js 18+ and Rust installed.</Text>
      </Box>

      <Box as="section">
        <Heading level={2} className="mb-3">
          Configuration
        </Heading>
        <Text as="p" className="mb-4">
          Configure your AI tools and workflows.
        </Text>

        <Heading level={3} className="mb-2">
          Environment Variables
        </Heading>
        <Text as="p">Set up the required environment variables.</Text>

        <Heading level={4} className="mt-4 mb-2">
          API Keys
        </Heading>
        <Text as="p" size="sm" color="muted-foreground">
          Configure your API keys for Claude, Gemini, etc.
        </Text>
      </Box>
    </Stack>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Example of proper heading hierarchy in document structure. Headings should follow a logical order without skipping levels.',
      },
    },
  },
};

/** Card header example */
export const CardHeader: Story = {
  render: () => (
    <Box className="border border-[rgb(var(--border))] rounded-lg p-6 max-w-sm">
      <Heading level={3} size="lg">
        Project Settings
      </Heading>
      <Text as="p" size="sm" color="muted-foreground" className="mt-1">
        Configure your project&apos;s behavior and defaults.
      </Text>
    </Box>
  ),
};

/** Dashboard section headers */
export const DashboardHeaders: Story = {
  render: () => (
    <Stack gap="8">
      <Box>
        <Heading level={2} size="xl" weight="semibold" className="mb-4">
          Recent Projects
        </Heading>
        <Box className="bg-[rgb(var(--muted))] rounded-lg p-8 text-center">
          <Text color="muted-foreground">Project cards would go here</Text>
        </Box>
      </Box>

      <Box>
        <Flex justify="between" align="center" className="mb-4">
          <Heading level={2} size="xl" weight="semibold">
            Active Tasks
          </Heading>
          <Text size="sm" color="muted-foreground">
            View all
          </Text>
        </Flex>
        <Box className="bg-[rgb(var(--muted))] rounded-lg p-8 text-center">
          <Text color="muted-foreground">Task list would go here</Text>
        </Box>
      </Box>
    </Stack>
  ),
};

/** With ARIA attributes for accessibility */
export const WithA11yProps: Story = {
  render: () => (
    <Stack gap="4">
      <Heading level={2} aria-describedby="section-description">
        Section with Description
      </Heading>
      <Text id="section-description" color="muted-foreground">
        This description is linked to the heading via aria-describedby.
      </Text>

      <Heading level={2} id="announcements-heading">
        Announcements
      </Heading>
      <Box
        role="region"
        aria-labelledby="announcements-heading"
        className="p-4 border border-[rgb(var(--border))] rounded"
      >
        <Text>Content region labeled by the heading above.</Text>
      </Box>
    </Stack>
  ),
};

/** With data-testid for testing */
export const WithTestId: Story = {
  args: {
    level: 1,
    children: 'Test Page Title',
    'data-testid': 'page-title',
  },
};

/** Modal/dialog header */
export const DialogHeader: Story = {
  render: () => (
    <Box className="border border-[rgb(var(--border))] rounded-lg max-w-md">
      <Box className="p-4 border-b border-[rgb(var(--border))]">
        <Heading level={2} size="lg" id="dialog-title">
          Confirm Deletion
        </Heading>
        <Text as="p" size="sm" color="muted-foreground" className="mt-1" id="dialog-description">
          This action cannot be undone.
        </Text>
      </Box>
      <Box className="p-4">
        <Text>Are you sure you want to delete this item?</Text>
      </Box>
    </Box>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Example heading structure for a modal dialog with proper aria-labelledby and aria-describedby targets.',
      },
    },
  },
};

/** Error page heading */
export const ErrorPageHeading: Story = {
  render: () => (
    <Box className="text-center">
      <Heading level={1} size="9xl" weight="black" color="muted-foreground">
        404
      </Heading>
      <Heading level={2} size="2xl" className="mt-2">
        Page Not Found
      </Heading>
      <Text as="p" color="muted-foreground" className="mt-2">
        The page you&apos;re looking for doesn&apos;t exist.
      </Text>
    </Box>
  ),
};

/** Semantic override use case */
export const SemanticOverride: Story = {
  render: () => (
    <Stack gap="4">
      <Text size="sm" color="muted-foreground">
        Sometimes you need h3 semantics but want it to look like h1 for visual hierarchy:
      </Text>
      <Heading level={3} size="4xl" weight="bold">
        Visually Large but Semantically h3
      </Heading>
      <Text size="sm" color="muted-foreground">
        Or h1 semantics with smaller visual size for sidebars:
      </Text>
      <Heading level={1} size="lg" weight="semibold">
        Sidebar Section Title (h1)
      </Heading>
    </Stack>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'The level prop determines semantic meaning (h1-h6) while size controls visual appearance. This allows proper document outline while maintaining design flexibility.',
      },
    },
  },
};
