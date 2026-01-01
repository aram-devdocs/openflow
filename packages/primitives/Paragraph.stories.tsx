import type { Meta, StoryObj } from '@storybook/react';
import { Box } from './Box';
import { Flex } from './Flex';
import { Heading } from './Heading';
import { Paragraph } from './Paragraph';
import { Stack } from './Stack';

const meta: Meta<typeof Paragraph> = {
  title: 'Primitives/Paragraph',
  component: Paragraph,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Semantic paragraph primitive for body text content. Provides responsive text size, line height, color, alignment, and optional prose width for optimal reading length.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['xs', 'sm', 'base', 'lg', 'xl', '2xl'],
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
    leading: {
      control: 'select',
      options: ['none', 'tight', 'snug', 'normal', 'relaxed', 'loose'],
      description: 'Line height (defaults to "relaxed")',
    },
    color: {
      control: 'text',
      description: 'Text color (e.g., "gray-600", "muted-foreground")',
    },
    align: {
      control: 'select',
      options: ['left', 'center', 'right', 'justify'],
      description: 'Text alignment',
    },
    indent: {
      control: 'boolean',
      description: 'First line indent',
    },
    prose: {
      control: 'boolean',
      description: 'Maximum width for optimal reading (max-w-prose)',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Paragraph>;

/** Basic paragraph rendering */
export const Default: Story = {
  args: {
    children:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
  },
};

/** All available text sizes */
export const Sizes: Story = {
  render: () => (
    <Stack gap="6">
      {(['xs', 'sm', 'base', 'lg', 'xl', '2xl'] as const).map((size) => (
        <Box key={size}>
          <Heading level={6} size="sm" color="muted-foreground" className="mb-2">
            size="{size}"
          </Heading>
          <Paragraph size={size}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
            incididunt ut labore et dolore magna aliqua.
          </Paragraph>
        </Box>
      ))}
    </Stack>
  ),
};

/** Responsive text sizing */
export const ResponsiveSize: Story = {
  render: () => (
    <Paragraph size={{ base: 'sm', sm: 'base', md: 'lg', lg: 'xl' }}>
      Resize your browser to see this paragraph change size at different breakpoints. On mobile it's
      small, then base, then large, then extra large on desktop.
    </Paragraph>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Paragraph size changes at different viewport widths: sm → base → lg → xl.',
      },
    },
  },
};

/** All line height options */
export const LineHeights: Story = {
  render: () => (
    <Stack gap="8">
      {(['tight', 'snug', 'normal', 'relaxed', 'loose'] as const).map((lineHeight) => (
        <Box key={lineHeight} className="border-l-2 border-[rgb(var(--border))] pl-4">
          <Heading level={6} size="sm" color="muted-foreground" className="mb-2">
            leading="{lineHeight}"
          </Heading>
          <Paragraph leading={lineHeight} className="max-w-lg">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
            incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
            exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure
            dolor in reprehenderit.
          </Paragraph>
        </Box>
      ))}
    </Stack>
  ),
};

/** Responsive line height */
export const ResponsiveLineHeight: Story = {
  render: () => (
    <Paragraph leading={{ base: 'normal', md: 'relaxed', lg: 'loose' }} className="max-w-lg">
      Resize to see line height change: normal → relaxed → loose. This demonstrates how line height
      can adapt to different screen sizes for optimal readability.
    </Paragraph>
  ),
};

/** Text alignment options */
export const TextAlignment: Story = {
  render: () => (
    <Stack gap="6">
      {(['left', 'center', 'right', 'justify'] as const).map((alignment) => (
        <Box key={alignment} className="border border-[rgb(var(--border))] p-4 rounded">
          <Heading level={6} size="sm" color="muted-foreground" className="mb-2">
            align="{alignment}"
          </Heading>
          <Paragraph align={alignment}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
            incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
            exercitation ullamco laboris.
          </Paragraph>
        </Box>
      ))}
    </Stack>
  ),
};

/** Responsive text alignment */
export const ResponsiveAlignment: Story = {
  render: () => (
    <Box className="border border-[rgb(var(--border))] p-4 rounded">
      <Paragraph align={{ base: 'center', md: 'left', lg: 'justify' }} className="max-w-lg">
        Resize to see alignment change: center on mobile, left on tablet, justified on desktop.
        Lorem ipsum dolor sit amet, consectetur adipiscing elit.
      </Paragraph>
    </Box>
  ),
};

/** Text colors */
export const Colors: Story = {
  render: () => (
    <Stack gap="4">
      <Paragraph>Default color paragraph</Paragraph>
      <Paragraph color="muted-foreground">Muted foreground (CSS variable)</Paragraph>
      <Paragraph color="gray-600">Gray 600 text</Paragraph>
      <Paragraph color="blue-600">Blue 600 text</Paragraph>
      <Paragraph color="green-600">Green 600 text</Paragraph>
      <Paragraph color="red-600">Red 600 text for error messages or warnings</Paragraph>
    </Stack>
  ),
};

/** First line indent for book-like typography */
export const FirstLineIndent: Story = {
  render: () => (
    <Stack gap="4" className="max-w-lg">
      <Paragraph indent>
        This paragraph has first-line indentation, which is common in books and formal documents.
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut
        labore et dolore magna aliqua.
      </Paragraph>
      <Paragraph indent>
        Each subsequent paragraph also has the same indentation. Ut enim ad minim veniam, quis
        nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute
        irure dolor in reprehenderit.
      </Paragraph>
    </Stack>
  ),
};

/** Prose width for optimal reading */
export const ProseWidth: Story = {
  render: () => (
    <Stack gap="6">
      <Box>
        <Heading level={6} size="sm" color="muted-foreground" className="mb-2">
          Without prose (full width)
        </Heading>
        <Paragraph className="border-l-2 border-[rgb(var(--border))] pl-4">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt
          ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation
          ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in
          reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur
          sint occaecat cupidatat non proident.
        </Paragraph>
      </Box>
      <Box>
        <Heading level={6} size="sm" color="muted-foreground" className="mb-2">
          With prose (max-w-prose for optimal reading)
        </Heading>
        <Paragraph prose className="border-l-2 border-[rgb(var(--border))] pl-4">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt
          ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation
          ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in
          reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur
          sint occaecat cupidatat non proident.
        </Paragraph>
      </Box>
    </Stack>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'The prose prop adds max-w-prose (65ch) for optimal reading length. Studies suggest 50-75 characters per line is ideal for readability.',
      },
    },
  },
};

/** Font weights */
export const FontWeights: Story = {
  render: () => (
    <Stack gap="4">
      {(['light', 'normal', 'medium', 'semibold', 'bold'] as const).map((weight) => (
        <Box key={weight}>
          <Heading level={6} size="sm" color="muted-foreground" className="mb-1">
            weight="{weight}"
          </Heading>
          <Paragraph weight={weight} prose>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
            incididunt ut labore et dolore magna aliqua.
          </Paragraph>
        </Box>
      ))}
    </Stack>
  ),
};

/** Combined styling for article-like content */
export const ArticleStyle: Story = {
  render: () => (
    <Box className="max-w-2xl">
      <Heading level={1} className="mb-4">
        The Art of Typography
      </Heading>
      <Paragraph size="xl" color="muted-foreground" leading="relaxed" className="mb-8">
        A deep dive into the principles of readable, beautiful text that enhances the user
        experience across all devices.
      </Paragraph>
      <Paragraph prose className="mb-4">
        Typography is the art and technique of arranging type to make written language legible,
        readable, and appealing when displayed. The arrangement of type involves selecting
        typefaces, point sizes, line lengths, line-spacing, and letter-spacing.
      </Paragraph>
      <Paragraph prose className="mb-4">
        Good typography establishes a strong visual hierarchy, provides a graphic balance to the
        website, and sets the product's overall tone. It should guide and inform users, optimize
        readability and accessibility, and ensure an excellent user experience.
      </Paragraph>
      <Paragraph prose color="muted-foreground" size="sm">
        Note: The examples above use the default relaxed line height which is optimized for body
        text readability.
      </Paragraph>
    </Box>
  ),
};

/** Justified text with indent (book style) */
export const BookStyle: Story = {
  render: () => (
    <Box className="max-w-lg border border-[rgb(var(--border))] p-8 rounded bg-[rgb(var(--background))]">
      <Heading level={2} align="center" className="mb-6">
        Chapter One
      </Heading>
      <Paragraph align="justify" indent leading="relaxed" className="mb-4">
        It was the best of times, it was the worst of times, it was the age of wisdom, it was the
        age of foolishness, it was the epoch of belief, it was the epoch of incredulity, it was the
        season of Light, it was the season of Darkness.
      </Paragraph>
      <Paragraph align="justify" indent leading="relaxed" className="mb-4">
        We were all going direct to Heaven, we were all going direct the other way - in short, the
        period was so far like the present period, that some of its noisiest authorities insisted on
        its being received, for good or for evil, in the superlative degree of comparison only.
      </Paragraph>
      <Paragraph align="justify" indent leading="relaxed">
        There were a king with a large jaw and a queen with a plain face, on the throne of England;
        there were a king with a large jaw and a queen with a fair face, on the throne of France.
      </Paragraph>
    </Box>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Book-style typography with justified text and first-line indentation, suitable for long-form reading content.',
      },
    },
  },
};

/** With ARIA attributes for accessibility */
export const WithA11yProps: Story = {
  render: () => (
    <Stack gap="4">
      <Paragraph aria-live="polite" role="status">
        Status message that will be announced to screen readers when updated.
      </Paragraph>
      <Paragraph aria-labelledby="para-label" id="described-para">
        This paragraph is associated with a label via aria-labelledby.
      </Paragraph>
      <Paragraph aria-describedby="para-description">
        This paragraph has additional description linked via aria-describedby.
      </Paragraph>
    </Stack>
  ),
};

/** With data-testid for testing */
export const WithTestId: Story = {
  args: {
    children: 'Paragraph with test ID for automated testing.',
    'data-testid': 'my-paragraph-element',
    size: 'lg',
    prose: true,
  },
};

/** Error/warning message paragraph */
export const ErrorMessage: Story = {
  render: () => (
    <Stack gap="4">
      <Paragraph color="red-600" role="alert" size="sm">
        There was an error processing your request. Please check your input and try again. If the
        problem persists, contact support.
      </Paragraph>
      <Paragraph color="orange-600" size="sm">
        Warning: Your session will expire in 5 minutes. Please save your work.
      </Paragraph>
      <Paragraph color="green-600" size="sm">
        Success! Your changes have been saved successfully.
      </Paragraph>
    </Stack>
  ),
};

/** Small print / legal text */
export const SmallPrint: Story = {
  render: () => (
    <Paragraph size="xs" color="muted-foreground" leading="normal" prose>
      By clicking "Accept", you agree to our Terms of Service and Privacy Policy. Your data may be
      processed in accordance with applicable laws and regulations. This agreement is governed by
      the laws of the State of California. For questions, contact legal@example.com.
    </Paragraph>
  ),
};

/** Lead paragraph (intro text) */
export const LeadParagraph: Story = {
  render: () => (
    <Stack gap="4" className="max-w-2xl">
      <Paragraph size="xl" leading="relaxed" color="muted-foreground">
        OpenFlow orchestrates AI coding CLI tools to build reliable software through spec-driven
        workflows, parallel execution, and automated verification.
      </Paragraph>
      <Paragraph prose>
        It wraps existing CLI tools developers already use and provides coordination through
        isolated git worktrees, multi-agent workflows, and built-in quality gates. This enables
        teams to leverage AI assistants effectively while maintaining code quality.
      </Paragraph>
    </Stack>
  ),
};

/** Multiple paragraphs with consistent spacing */
export const ConsistentSpacing: Story = {
  render: () => (
    <Stack gap="4" className="max-w-lg">
      <Paragraph>
        First paragraph: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
        tempor incididunt ut labore et dolore magna aliqua.
      </Paragraph>
      <Paragraph>
        Second paragraph: Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
        aliquip ex ea commodo consequat.
      </Paragraph>
      <Paragraph>
        Third paragraph: Duis aute irure dolor in reprehenderit in voluptate velit esse cillum
        dolore eu fugiat nulla pariatur.
      </Paragraph>
    </Stack>
  ),
};

/** Card content example */
export const CardContent: Story = {
  render: () => (
    <Flex gap="6">
      {[1, 2, 3].map((i) => (
        <Box
          key={i}
          className="flex-1 border border-[rgb(var(--border))] p-4 rounded bg-[rgb(var(--card))]"
        >
          <Heading level={3} size="lg" className="mb-2">
            Card Title {i}
          </Heading>
          <Paragraph size="sm" color="muted-foreground" className="line-clamp-3">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
            incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
            exercitation ullamco laboris.
          </Paragraph>
        </Box>
      ))}
    </Flex>
  ),
};
