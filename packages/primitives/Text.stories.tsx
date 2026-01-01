import type { Meta, StoryObj } from '@storybook/react';
import { Box } from './Box';
import { Flex } from './Flex';
import { Stack } from './Stack';
import { Text } from './Text';

const meta: Meta<typeof Text> = {
  title: 'Primitives/Text',
  component: Text,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Typography primitive for inline text content. Provides responsive text size, font weight, color, truncation, and line clamping with all ARIA attributes.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    as: {
      control: 'select',
      options: [
        'span',
        'p',
        'strong',
        'em',
        'small',
        'del',
        'ins',
        'mark',
        'code',
        'abbr',
        'cite',
        'kbd',
        'samp',
        'sub',
        'sup',
        'time',
        'var',
        'label',
      ],
      description: 'HTML element to render',
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl'],
      description: 'Text size',
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
      description: 'Font weight',
    },
    color: {
      control: 'text',
      description: 'Text color (e.g., "red-500", "muted-foreground")',
    },
    truncate: {
      control: 'boolean',
      description: 'Truncate text with ellipsis',
    },
    lineClamp: {
      control: 'select',
      options: [undefined, 1, 2, 3, 4, 5, 6],
      description: 'Max number of lines before clamping',
    },
    align: {
      control: 'select',
      options: ['left', 'center', 'right', 'justify'],
      description: 'Text alignment',
    },
    tracking: {
      control: 'select',
      options: ['tighter', 'tight', 'normal', 'wide', 'wider', 'widest'],
      description: 'Letter spacing',
    },
    leading: {
      control: 'select',
      options: ['none', 'tight', 'snug', 'normal', 'relaxed', 'loose'],
      description: 'Line height',
    },
    decoration: {
      control: 'select',
      options: [undefined, 'underline', 'overline', 'line-through', 'none'],
      description: 'Text decoration',
    },
    transform: {
      control: 'select',
      options: [undefined, 'uppercase', 'lowercase', 'capitalize', 'normal-case'],
      description: 'Text transform',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Text>;

/** Basic text rendering */
export const Default: Story = {
  args: {
    children: 'The quick brown fox jumps over the lazy dog.',
    size: 'base',
  },
};

/** All available text sizes */
export const Sizes: Story = {
  render: () => (
    <Stack gap="4">
      {(['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl'] as const).map((size) => (
        <Flex key={size} align="baseline" gap="4">
          <Text size="sm" color="muted-foreground" className="w-12">
            {size}
          </Text>
          <Text size={size}>The quick brown fox jumps over the lazy dog.</Text>
        </Flex>
      ))}
    </Stack>
  ),
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
          <Text size="lg" weight={weight}>
            The quick brown fox jumps over the lazy dog.
          </Text>
        </Flex>
      ))}
    </Stack>
  ),
};

/** Responsive text sizing */
export const ResponsiveSize: Story = {
  render: () => (
    <Text size={{ base: 'sm', sm: 'base', md: 'lg', lg: 'xl', xl: '2xl' }}>
      Resize your browser to see this text change size at different breakpoints.
    </Text>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Text size changes at different viewport widths: sm → base → lg → xl → 2xl.',
      },
    },
  },
};

/** Responsive font weight */
export const ResponsiveWeight: Story = {
  render: () => (
    <Text weight={{ base: 'normal', md: 'medium', lg: 'bold' }} size="xl">
      Resize to see weight change: normal → medium → bold
    </Text>
  ),
};

/** Text truncation with ellipsis */
export const Truncation: Story = {
  render: () => (
    <Box className="max-w-xs">
      <Text truncate className="block">
        This is a very long text that will be truncated with an ellipsis when it overflows its
        container.
      </Text>
    </Box>
  ),
};

/** Multi-line text clamping */
export const LineClamping: Story = {
  render: () => (
    <Stack gap="6">
      {([1, 2, 3] as const).map((lines) => (
        <Box key={lines} className="max-w-md">
          <Text size="sm" color="muted-foreground" className="mb-1 block">
            lineClamp={lines}
          </Text>
          <Text lineClamp={lines} className="block">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
            incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
            exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure
            dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
          </Text>
        </Box>
      ))}
    </Stack>
  ),
};

/** Text colors using Tailwind classes */
export const Colors: Story = {
  render: () => (
    <Stack gap="3">
      <Text color="red-500">Red 500 text</Text>
      <Text color="blue-600">Blue 600 text</Text>
      <Text color="green-500">Green 500 text</Text>
      <Text color="orange-500">Orange 500 text</Text>
      <Text color="purple-600">Purple 600 text</Text>
      <Text color="muted-foreground">Muted foreground (CSS variable)</Text>
      <Text color="primary">Primary color (CSS variable)</Text>
    </Stack>
  ),
};

/** Semantic HTML elements */
export const SemanticElements: Story = {
  render: () => (
    <Stack gap="3">
      <Text as="span">Default span element</Text>
      <Text as="strong" weight="bold">
        Strong - important text
      </Text>
      <Text as="em">Emphasized text</Text>
      <Text as="small" size="sm">
        Small text
      </Text>
      <Text as="del" decoration="line-through">
        Deleted text
      </Text>
      <Text as="ins" decoration="underline">
        Inserted text
      </Text>
      <Text as="mark" className="bg-yellow-200 px-1">
        Marked/highlighted text
      </Text>
      <Text as="code" className="bg-[rgb(var(--muted))] px-1 py-0.5 rounded font-mono">
        Code element
      </Text>
      <Text
        as="kbd"
        className="bg-[rgb(var(--muted))] px-1.5 py-0.5 rounded border border-[rgb(var(--border))] font-mono text-sm"
      >
        Ctrl+C
      </Text>
      <Text
        as="abbr"
        title="Hypertext Markup Language"
        decoration="underline"
        className="decoration-dotted"
      >
        HTML
      </Text>
    </Stack>
  ),
};

/** Text alignment options */
export const TextAlignment: Story = {
  render: () => (
    <Stack gap="4">
      {(['left', 'center', 'right', 'justify'] as const).map((alignment) => (
        <Box key={alignment} className="border border-[rgb(var(--border))] p-4 rounded">
          <Text size="sm" color="muted-foreground" className="mb-2 block">
            align="{alignment}"
          </Text>
          <Text align={alignment} className="block">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
            incididunt ut labore et dolore magna aliqua.
          </Text>
        </Box>
      ))}
    </Stack>
  ),
};

/** Responsive text alignment */
export const ResponsiveAlignment: Story = {
  render: () => (
    <Box className="border border-[rgb(var(--border))] p-4 rounded">
      <Text align={{ base: 'center', md: 'left', lg: 'right' }} className="block">
        Resize to see alignment change: center → left → right
      </Text>
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
          <Text tracking={spacing} size="lg">
            LETTER SPACING
          </Text>
        </Flex>
      ))}
    </Stack>
  ),
};

/** Line height options */
export const LineHeight: Story = {
  render: () => (
    <Stack gap="6">
      {(['tight', 'snug', 'normal', 'relaxed', 'loose'] as const).map((lineHeight) => (
        <Box key={lineHeight} className="max-w-md">
          <Text size="sm" color="muted-foreground" className="mb-1 block">
            leading="{lineHeight}"
          </Text>
          <Text leading={lineHeight} className="block border-l-2 border-[rgb(var(--border))] pl-3">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
            incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
            exercitation ullamco laboris.
          </Text>
        </Box>
      ))}
    </Stack>
  ),
};

/** Text decorations */
export const Decorations: Story = {
  render: () => (
    <Stack gap="3">
      <Text decoration="underline">Underline decoration</Text>
      <Text decoration="overline">Overline decoration</Text>
      <Text decoration="line-through">Line-through decoration</Text>
      <Text decoration="none" className="underline">
        Decoration none (removes inherited underline)
      </Text>
    </Stack>
  ),
};

/** Text transforms */
export const Transforms: Story = {
  render: () => (
    <Stack gap="3">
      <Text transform="uppercase">uppercase transform</Text>
      <Text transform="lowercase">LOWERCASE TRANSFORM</Text>
      <Text transform="capitalize">capitalize transform</Text>
      <Text transform="normal-case" className="uppercase">
        Normal case (resets inherited transform)
      </Text>
    </Stack>
  ),
};

/** White space handling */
export const WhiteSpace: Story = {
  render: () => (
    <Stack gap="4">
      <Box className="border border-[rgb(var(--border))] p-4 rounded max-w-sm">
        <Text size="sm" color="muted-foreground" className="mb-1 block">
          normal
        </Text>
        <Text whiteSpace="normal" className="block">
          This text has multiple spaces and newlines that will be collapsed.
        </Text>
      </Box>
      <Box className="border border-[rgb(var(--border))] p-4 rounded max-w-sm">
        <Text size="sm" color="muted-foreground" className="mb-1 block">
          nowrap
        </Text>
        <Text whiteSpace="nowrap" className="block overflow-hidden">
          This text will not wrap to the next line even if it overflows.
        </Text>
      </Box>
      <Box className="border border-[rgb(var(--border))] p-4 rounded max-w-sm">
        <Text size="sm" color="muted-foreground" className="mb-1 block">
          pre-wrap
        </Text>
        <Text whiteSpace="pre-wrap" className="block">
          This text preserves spaces and newlines while still wrapping.
        </Text>
      </Box>
    </Stack>
  ),
};

/** Word break options */
export const WordBreak: Story = {
  render: () => (
    <Stack gap="4">
      <Box className="border border-[rgb(var(--border))] p-4 rounded max-w-xs">
        <Text size="sm" color="muted-foreground" className="mb-1 block">
          normal
        </Text>
        <Text wordBreak="normal" className="block">
          Supercalifragilisticexpialidocious word that is very long.
        </Text>
      </Box>
      <Box className="border border-[rgb(var(--border))] p-4 rounded max-w-xs">
        <Text size="sm" color="muted-foreground" className="mb-1 block">
          break-all
        </Text>
        <Text wordBreak="all" className="block">
          Supercalifragilisticexpialidocious word that is very long.
        </Text>
      </Box>
      <Box className="border border-[rgb(var(--border))] p-4 rounded max-w-xs">
        <Text size="sm" color="muted-foreground" className="mb-1 block">
          break-words
        </Text>
        <Text wordBreak="words" className="block">
          Supercalifragilisticexpialidocious word that is very long.
        </Text>
      </Box>
    </Stack>
  ),
};

/** Combined typography styles */
export const CombinedStyles: Story = {
  render: () => (
    <Stack gap="4">
      <Text size="3xl" weight="bold" tracking="tight">
        Hero Heading Style
      </Text>
      <Text size="xl" weight="light" color="muted-foreground" leading="relaxed">
        Subtitle with light weight and relaxed line height for improved readability on longer text
        blocks.
      </Text>
      <Text size="sm" weight="medium" transform="uppercase" tracking="wider" color="blue-600">
        Label / Overline Text
      </Text>
      <Text size="base" leading="relaxed" className="max-w-prose">
        Body text with normal weight and relaxed line height. Lorem ipsum dolor sit amet,
        consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna
        aliqua.
      </Text>
      <Text size="xs" color="muted-foreground">
        Caption or helper text in extra small size
      </Text>
    </Stack>
  ),
};

/** With ARIA attributes for accessibility */
export const WithA11yProps: Story = {
  render: () => (
    <Stack gap="3">
      <Text aria-live="polite" role="status">
        Status message that will be announced
      </Text>
      <Text aria-label="Important notification">Text with explicit aria-label</Text>
      <Text as="abbr" title="Application Programming Interface" aria-describedby="api-description">
        API
      </Text>
      <Text id="api-description" size="sm" color="muted-foreground">
        Description linked via aria-describedby
      </Text>
    </Stack>
  ),
};

/** With data-testid for testing */
export const WithTestId: Story = {
  args: {
    children: 'Text with test ID',
    'data-testid': 'my-text-element',
    size: 'lg',
    weight: 'semibold',
  },
};

/** Inline usage within other text */
export const InlineUsage: Story = {
  render: () => (
    <Text as="p" size="base" leading="relaxed" className="max-w-prose">
      This is a paragraph with{' '}
      <Text as="strong" weight="bold">
        bold text
      </Text>
      , some <Text as="em">emphasized text</Text>, and a{' '}
      <Text color="blue-600" decoration="underline">
        styled inline span
      </Text>
      . You can also include{' '}
      <Text as="code" className="bg-[rgb(var(--muted))] px-1 py-0.5 rounded font-mono text-sm">
        inline code
      </Text>{' '}
      within regular text.
    </Text>
  ),
};

/** Price display example */
export const PriceDisplay: Story = {
  render: () => (
    <Flex align="baseline" gap="2">
      <Text size="3xl" weight="bold">
        $99
      </Text>
      <Text size="xl" weight="normal" color="muted-foreground">
        .99
      </Text>
      <Text size="sm" color="muted-foreground">
        /month
      </Text>
    </Flex>
  ),
};

/** Error message example */
export const ErrorMessage: Story = {
  render: () => (
    <Text size="sm" color="red-500" role="alert">
      Please enter a valid email address.
    </Text>
  ),
};

/** Badge-like text */
export const BadgeText: Story = {
  render: () => (
    <Flex gap="2">
      <Text
        size="xs"
        weight="medium"
        transform="uppercase"
        tracking="wide"
        className="bg-green-100 text-green-800 px-2 py-0.5 rounded"
      >
        Active
      </Text>
      <Text
        size="xs"
        weight="medium"
        transform="uppercase"
        tracking="wide"
        className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded"
      >
        Pending
      </Text>
      <Text
        size="xs"
        weight="medium"
        transform="uppercase"
        tracking="wide"
        className="bg-red-100 text-red-800 px-2 py-0.5 rounded"
      >
        Failed
      </Text>
    </Flex>
  ),
};
