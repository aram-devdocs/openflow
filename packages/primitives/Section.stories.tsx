import type { Meta, StoryObj } from '@storybook/react';
import { Box } from './Box';
import { Flex } from './Flex';
import { Heading } from './Heading';
import { Section } from './Section';
import { Stack } from './Stack';
import { Text } from './Text';

const meta: Meta<typeof Section> = {
  title: 'Primitives/Section',
  component: Section,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Semantic `<section>` landmark primitive with REQUIRED aria-label for accessibility. Sections group thematic content and provide navigation landmarks for screen reader users.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    'aria-label': {
      control: 'text',
      description: 'Accessible label for the section (REQUIRED)',
    },
    p: {
      control: 'select',
      options: [undefined, '0', '1', '2', '3', '4', '5', '6', '8', '10', '12', '16'],
      description: 'Padding on all sides',
    },
    px: {
      control: 'select',
      options: [undefined, '0', '1', '2', '3', '4', '5', '6', '8'],
      description: 'Horizontal padding',
    },
    py: {
      control: 'select',
      options: [undefined, '0', '1', '2', '3', '4', '5', '6', '8'],
      description: 'Vertical padding',
    },
    m: {
      control: 'select',
      options: [undefined, '0', '1', '2', '3', '4', '5', '6', '8'],
      description: 'Margin on all sides',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Section>;

/** Basic section with required aria-label */
export const Default: Story = {
  args: {
    'aria-label': 'Introduction',
    children: (
      <Stack gap="4">
        <Heading level={2}>Introduction</Heading>
        <Text as="p">
          This is a basic section with the required aria-label attribute. Screen readers will
          announce this as "Introduction region" when navigating landmarks.
        </Text>
      </Stack>
    ),
  },
};

/** Section with padding */
export const WithPadding: Story = {
  args: {
    'aria-label': 'Padded Content',
    p: '8',
    className: 'bg-[rgb(var(--muted))] rounded-lg',
    children: (
      <Stack gap="4">
        <Heading level={2}>Padded Section</Heading>
        <Text as="p">This section has padding applied using the p prop.</Text>
      </Stack>
    ),
  },
};

/** Section with responsive padding */
export const ResponsivePadding: Story = {
  render: () => (
    <Section
      aria-label="Responsive Example"
      p={{ base: '4', md: '8', lg: '12' }}
      className="bg-[rgb(var(--muted))] rounded-lg"
    >
      <Stack gap="4">
        <Heading level={2}>Responsive Padding</Heading>
        <Text as="p">
          Resize your browser to see padding change: p-4 (mobile) → p-8 (tablet) → p-12 (desktop).
        </Text>
      </Stack>
    </Section>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Section padding adjusts based on viewport width using responsive props.',
      },
    },
  },
};

/** Section with margin */
export const WithMargin: Story = {
  render: () => (
    <Box className="bg-[rgb(var(--border))] p-1 rounded-lg">
      <Section
        aria-label="Margined Content"
        m="4"
        p="4"
        className="bg-[rgb(var(--background))] rounded"
      >
        <Text as="p">This section has margin around it (visible against the border).</Text>
      </Section>
    </Box>
  ),
};

/** Multiple sections on a page */
export const MultipleSections: Story = {
  render: () => (
    <Stack gap="8">
      <Section aria-label="Hero" p="8" className="bg-[rgb(var(--primary))] text-white rounded-lg">
        <Stack gap="2" className="text-center">
          <Heading level={1} color="white">
            Welcome to OpenFlow
          </Heading>
          <Text as="p" className="text-white/80">
            AI Task Orchestration for Modern Development
          </Text>
        </Stack>
      </Section>

      <Section aria-label="Features" p="6" className="bg-[rgb(var(--muted))] rounded-lg">
        <Stack gap="4">
          <Heading level={2}>Features</Heading>
          <Text as="p">Discover what makes OpenFlow powerful.</Text>
        </Stack>
      </Section>

      <Section aria-label="Testimonials" p="6" className="bg-[rgb(var(--muted))] rounded-lg">
        <Stack gap="4">
          <Heading level={2}>What People Say</Heading>
          <Text as="p">Hear from our users about their experience.</Text>
        </Stack>
      </Section>

      <Section aria-label="Pricing" p="6" className="bg-[rgb(var(--muted))] rounded-lg">
        <Stack gap="4">
          <Heading level={2}>Pricing Plans</Heading>
          <Text as="p">Choose the plan that fits your needs.</Text>
        </Stack>
      </Section>
    </Stack>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'A typical landing page structure with multiple sections. Each section has a unique aria-label that screen readers announce when navigating landmarks.',
      },
    },
  },
};

/** Section with aria-labelledby */
export const WithAriaLabelledby: Story = {
  render: () => (
    <Section aria-label="Company Information" aria-labelledby="about-heading">
      <Stack gap="4">
        <Heading level={2} id="about-heading">
          About Our Company
        </Heading>
        <Text as="p">
          When using aria-labelledby, the section is labeled by the visible heading. The aria-label
          prop is still required for TypeScript, but screen readers will prefer aria-labelledby when
          both are present.
        </Text>
      </Stack>
    </Section>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'When a section has a visible heading, use aria-labelledby to point to it. This avoids announcing duplicate labels.',
      },
    },
  },
};

/** Nested sections */
export const NestedSections: Story = {
  render: () => (
    <Section aria-label="Documentation" p="6" className="bg-[rgb(var(--muted))] rounded-lg">
      <Stack gap="6">
        <Heading level={2}>Documentation</Heading>

        <Section aria-label="Getting Started" p="4" className="bg-[rgb(var(--background))] rounded">
          <Stack gap="2">
            <Heading level={3}>Getting Started</Heading>
            <Text as="p" size="sm">
              Learn the basics of OpenFlow.
            </Text>
          </Stack>
        </Section>

        <Section aria-label="API Reference" p="4" className="bg-[rgb(var(--background))] rounded">
          <Stack gap="2">
            <Heading level={3}>API Reference</Heading>
            <Text as="p" size="sm">
              Complete API documentation.
            </Text>
          </Stack>
        </Section>

        <Section aria-label="Examples" p="4" className="bg-[rgb(var(--background))] rounded">
          <Stack gap="2">
            <Heading level={3}>Examples</Heading>
            <Text as="p" size="sm">
              Real-world usage examples.
            </Text>
          </Stack>
        </Section>
      </Stack>
    </Section>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Sections can be nested for complex document structures. Each nested section should have its own descriptive aria-label.',
      },
    },
  },
};

/** Section with complex content */
export const ComplexContent: Story = {
  render: () => (
    <Section aria-label="Team Members" p="6" className="bg-[rgb(var(--muted))] rounded-lg">
      <Stack gap="6">
        <Flex justify="between" align="center">
          <Heading level={2}>Our Team</Heading>
          <Text size="sm" color="muted-foreground">
            12 members
          </Text>
        </Flex>

        <Flex gap="4" wrap="wrap">
          {['Alice', 'Bob', 'Charlie', 'Diana'].map((name) => (
            <Box
              key={name}
              className="bg-[rgb(var(--background))] p-4 rounded-lg flex-1 min-w-[150px]"
            >
              <Stack gap="2" className="text-center">
                <Box className="w-12 h-12 rounded-full bg-[rgb(var(--primary))] mx-auto" />
                <Text weight="medium">{name}</Text>
                <Text size="sm" color="muted-foreground">
                  Engineer
                </Text>
              </Stack>
            </Box>
          ))}
        </Flex>
      </Stack>
    </Section>
  ),
};

/** Full-width section (common for landing pages) */
export const FullWidth: Story = {
  render: () => (
    <Box className="-mx-4">
      <Section
        aria-label="Call to Action"
        py="16"
        px="4"
        className="bg-[rgb(var(--primary))] text-white"
      >
        <Stack gap="4" className="text-center max-w-2xl mx-auto">
          <Heading level={2} color="white" size="3xl">
            Ready to Get Started?
          </Heading>
          <Text as="p" className="text-white/80" size="lg">
            Join thousands of developers using OpenFlow to orchestrate their AI tools.
          </Text>
          <Box className="mt-4">
            <Box
              as="span"
              className="inline-block bg-white text-[rgb(var(--primary))] px-6 py-3 rounded-lg font-semibold"
            >
              Start Free Trial
            </Box>
          </Box>
        </Stack>
      </Section>
    </Box>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Full-width sections are common for call-to-action blocks on landing pages.',
      },
    },
  },
};

/** Section with ID for skip links */
export const WithSkipLinkTarget: Story = {
  render: () => (
    <Stack gap="4">
      <Text size="sm" color="muted-foreground">
        This section has an ID that can be targeted by skip links:
      </Text>
      <Section
        aria-label="Main Content"
        id="main-content"
        p="6"
        className="bg-[rgb(var(--muted))] rounded-lg"
      >
        <Stack gap="4">
          <Heading level={2}>Main Content Area</Heading>
          <Text as="p">
            Skip links can target this section using href=&quot;#main-content&quot;.
          </Text>
        </Stack>
      </Section>
    </Stack>
  ),
};

/** Section with data-testid for testing */
export const WithTestId: Story = {
  args: {
    'aria-label': 'Test Section',
    'data-testid': 'features-section',
    p: '4',
    className: 'bg-[rgb(var(--muted))] rounded-lg',
    children: <Text as="p">This section has a data-testid for automated testing.</Text>,
  },
};

/** Accessibility demonstration */
export const AccessibilityDemo: Story = {
  render: () => (
    <Stack gap="6">
      <Box p="4" className="bg-amber-100 border border-amber-300 rounded-lg">
        <Text size="sm">
          <strong>Accessibility Note:</strong> Use a screen reader (VoiceOver, NVDA, JAWS) to
          navigate these sections. Press the landmark navigation shortcut (usually &quot;R&quot; or
          &quot;D&quot; key in browse mode) to jump between regions.
        </Text>
      </Box>

      <Section aria-label="Navigation Example" p="4" className="bg-[rgb(var(--muted))] rounded-lg">
        <Stack gap="2">
          <Heading level={2}>Navigation Section</Heading>
          <Text as="p" size="sm">
            Screen readers announce: &quot;Navigation Example region&quot;
          </Text>
        </Stack>
      </Section>

      <Section aria-label="Content Area" p="4" className="bg-[rgb(var(--muted))] rounded-lg">
        <Stack gap="2">
          <Heading level={2}>Content Section</Heading>
          <Text as="p" size="sm">
            Screen readers announce: &quot;Content Area region&quot;
          </Text>
        </Stack>
      </Section>

      <Section aria-label="Footer Information" p="4" className="bg-[rgb(var(--muted))] rounded-lg">
        <Stack gap="2">
          <Heading level={2}>Footer Section</Heading>
          <Text as="p" size="sm">
            Screen readers announce: &quot;Footer Information region&quot;
          </Text>
        </Stack>
      </Section>
    </Stack>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'This demo shows how screen readers announce sections with aria-labels. Each section becomes a navigable landmark.',
      },
    },
  },
};

/** Dashboard layout example */
export const DashboardLayout: Story = {
  render: () => (
    <Flex gap="6">
      <Section aria-label="Sidebar Navigation" className="w-64 shrink-0">
        <Box p="4" className="bg-[rgb(var(--muted))] rounded-lg h-[300px]">
          <Stack gap="4">
            <Heading level={3} size="sm">
              Navigation
            </Heading>
            <Stack gap="2">
              {['Dashboard', 'Projects', 'Tasks', 'Settings'].map((item) => (
                <Text key={item} size="sm">
                  {item}
                </Text>
              ))}
            </Stack>
          </Stack>
        </Box>
      </Section>

      <Section aria-label="Dashboard Content" className="flex-1">
        <Stack gap="6">
          <Box p="6" className="bg-[rgb(var(--muted))] rounded-lg">
            <Stack gap="4">
              <Heading level={2}>Dashboard Overview</Heading>
              <Text as="p" color="muted-foreground">
                Welcome back! Here&apos;s what&apos;s happening.
              </Text>
            </Stack>
          </Box>

          <Flex gap="4">
            <Box p="4" className="bg-[rgb(var(--muted))] rounded-lg flex-1">
              <Text size="sm" color="muted-foreground">
                Active Projects
              </Text>
              <Text size="2xl" weight="bold">
                12
              </Text>
            </Box>
            <Box p="4" className="bg-[rgb(var(--muted))] rounded-lg flex-1">
              <Text size="sm" color="muted-foreground">
                Pending Tasks
              </Text>
              <Text size="2xl" weight="bold">
                8
              </Text>
            </Box>
            <Box p="4" className="bg-[rgb(var(--muted))] rounded-lg flex-1">
              <Text size="sm" color="muted-foreground">
                Completed
              </Text>
              <Text size="2xl" weight="bold">
                47
              </Text>
            </Box>
          </Flex>
        </Stack>
      </Section>
    </Flex>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Example of sections used in a dashboard layout, providing clear landmark navigation for screen reader users.',
      },
    },
  },
};

/** Form section example */
export const FormSection: Story = {
  render: () => (
    <Section aria-label="Contact Form" p="6" className="bg-[rgb(var(--muted))] rounded-lg max-w-md">
      <Stack gap="6">
        <Stack gap="1">
          <Heading level={2}>Contact Us</Heading>
          <Text as="p" size="sm" color="muted-foreground">
            Fill out the form below and we&apos;ll get back to you.
          </Text>
        </Stack>

        <Stack gap="4">
          <Box>
            <Text as="label" size="sm" weight="medium" className="block mb-1.5">
              Name
            </Text>
            <Box className="w-full h-10 bg-[rgb(var(--background))] border border-[rgb(var(--border))] rounded-md" />
          </Box>

          <Box>
            <Text as="label" size="sm" weight="medium" className="block mb-1.5">
              Email
            </Text>
            <Box className="w-full h-10 bg-[rgb(var(--background))] border border-[rgb(var(--border))] rounded-md" />
          </Box>

          <Box>
            <Text as="label" size="sm" weight="medium" className="block mb-1.5">
              Message
            </Text>
            <Box className="w-full h-24 bg-[rgb(var(--background))] border border-[rgb(var(--border))] rounded-md" />
          </Box>

          <Box className="bg-[rgb(var(--primary))] text-white px-4 py-2 rounded-md text-center font-medium">
            Send Message
          </Box>
        </Stack>
      </Stack>
    </Section>
  ),
};

/** Article/blog layout */
export const ArticleLayout: Story = {
  render: () => (
    <Stack gap="8" className="max-w-2xl">
      <Section aria-label="Article Header">
        <Stack gap="4">
          <Heading level={1}>Building Accessible Web Applications</Heading>
          <Flex gap="2" align="center">
            <Text size="sm" color="muted-foreground">
              Published on January 15, 2025
            </Text>
            <Text size="sm" color="muted-foreground">
              •
            </Text>
            <Text size="sm" color="muted-foreground">
              10 min read
            </Text>
          </Flex>
        </Stack>
      </Section>

      <Section aria-label="Article Content" className="prose">
        <Stack gap="4">
          <Text as="p">
            Building accessible web applications is not just about following guidelines—it&apos;s
            about creating inclusive experiences for all users.
          </Text>
          <Heading level={2}>Why Accessibility Matters</Heading>
          <Text as="p">
            Accessibility ensures that people with disabilities can perceive, understand, navigate,
            and interact with websites and tools.
          </Text>
          <Heading level={2}>Getting Started</Heading>
          <Text as="p">
            Start by using semantic HTML elements and providing proper labels for interactive
            elements.
          </Text>
        </Stack>
      </Section>

      <Section aria-label="Author Information" p="4" className="bg-[rgb(var(--muted))] rounded-lg">
        <Flex gap="4" align="center">
          <Box className="w-12 h-12 rounded-full bg-[rgb(var(--primary))]" />
          <Stack gap="1">
            <Text weight="medium">Jane Developer</Text>
            <Text size="sm" color="muted-foreground">
              Frontend Engineer at OpenFlow
            </Text>
          </Stack>
        </Flex>
      </Section>
    </Stack>
  ),
};

/** All spacing props demonstration */
export const AllSpacingProps: Story = {
  render: () => (
    <Stack gap="4">
      <Section aria-label="Padding Example" p="6" className="bg-blue-100 rounded">
        <Text>p=&quot;6&quot; - Padding all sides</Text>
      </Section>

      <Section aria-label="Horizontal Padding" px="8" py="2" className="bg-green-100 rounded">
        <Text>px=&quot;8&quot; py=&quot;2&quot; - Different horizontal and vertical padding</Text>
      </Section>

      <Section
        aria-label="Individual Padding"
        pt="8"
        pb="2"
        pl="4"
        pr="12"
        className="bg-yellow-100 rounded"
      >
        <Text>
          pt=&quot;8&quot; pb=&quot;2&quot; pl=&quot;4&quot; pr=&quot;12&quot; - Individual sides
        </Text>
      </Section>

      <Box className="bg-gray-200 p-2 rounded">
        <Section aria-label="Margin Example" m="4" p="4" className="bg-purple-100 rounded">
          <Text>m=&quot;4&quot; - Margin on all sides (visible against gray background)</Text>
        </Section>
      </Box>

      <Box className="bg-gray-200 p-2 rounded">
        <Section aria-label="Horizontal Margin" mx="8" p="4" className="bg-pink-100 rounded">
          <Text>mx=&quot;8&quot; - Horizontal margin only</Text>
        </Section>
      </Box>
    </Stack>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Demonstration of all available spacing props: p, px, py, pt, pr, pb, pl, m, mx, my, mt, mr, mb, ml.',
      },
    },
  },
};
