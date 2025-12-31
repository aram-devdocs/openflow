import type { Meta, StoryObj } from '@storybook/react';
import { Aside } from './Aside';
import { Box } from './Box';
import { Flex } from './Flex';
import { Heading } from './Heading';
import { Link } from './Link';
import { List } from './List';
import { ListItem } from './ListItem';
import { Stack } from './Stack';
import { Text } from './Text';

const meta: Meta<typeof Aside> = {
  title: 'Primitives/Aside',
  component: Aside,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Semantic `<aside>` landmark primitive for complementary content. Aside elements represent content that is tangentially related to the main content, such as sidebars, pull quotes, table of contents, or related links.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    'aria-label': {
      control: 'text',
      description: 'Optional accessible label to distinguish this aside from others',
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
type Story = StoryObj<typeof Aside>;

/** Basic aside with content */
export const Default: Story = {
  args: {
    'aria-label': 'Related links',
    children: (
      <Stack gap="4">
        <Heading level={2}>Related Articles</Heading>
        <List styleType="disc" gap="2">
          <ListItem>
            <Link href="#">Getting Started with React</Link>
          </ListItem>
          <ListItem>
            <Link href="#">Understanding TypeScript</Link>
          </ListItem>
          <ListItem>
            <Link href="#">CSS Grid Layouts</Link>
          </ListItem>
        </List>
      </Stack>
    ),
  },
};

/** Aside with padding */
export const WithPadding: Story = {
  args: {
    'aria-label': 'Sidebar',
    p: '6',
    className: 'bg-[rgb(var(--muted))] rounded-lg',
    children: (
      <Stack gap="4">
        <Heading level={2}>Sidebar Content</Heading>
        <Text as="p">This aside has padding applied using the p prop.</Text>
      </Stack>
    ),
  },
};

/** Aside with responsive padding */
export const ResponsivePadding: Story = {
  render: () => (
    <Aside
      aria-label="Responsive sidebar"
      p={{ base: '4', md: '6', lg: '8' }}
      className="bg-[rgb(var(--muted))] rounded-lg"
    >
      <Stack gap="4">
        <Heading level={2}>Responsive Padding</Heading>
        <Text as="p">
          Resize your browser to see padding change: p-4 (mobile) &rarr; p-6 (tablet) &rarr; p-8
          (desktop).
        </Text>
      </Stack>
    </Aside>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Aside padding adjusts based on viewport width using responsive props.',
      },
    },
  },
};

/** Table of contents sidebar */
export const TableOfContents: Story = {
  render: () => (
    <Aside aria-label="Table of contents" p="4" className="bg-[rgb(var(--muted))] rounded-lg w-64">
      <Stack gap="3">
        <Heading level={3} size="sm" className="uppercase tracking-wide text-muted-foreground">
          On this page
        </Heading>
        <List styleType="none" gap="2">
          <ListItem>
            <Link href="#introduction" className="block py-1">
              Introduction
            </Link>
          </ListItem>
          <ListItem>
            <Link href="#installation" className="block py-1">
              Installation
            </Link>
          </ListItem>
          <ListItem>
            <Link href="#usage" className="block py-1">
              Usage
            </Link>
          </ListItem>
          <ListItem>
            <Link href="#api" className="block py-1">
              API Reference
            </Link>
          </ListItem>
          <ListItem>
            <Link href="#examples" className="block py-1">
              Examples
            </Link>
          </ListItem>
        </List>
      </Stack>
    </Aside>
  ),
  parameters: {
    docs: {
      description: {
        story: 'A table of contents is a common use case for the aside element.',
      },
    },
  },
};

/** Pull quote */
export const PullQuote: Story = {
  render: () => (
    <Aside
      aria-label="Pull quote"
      py="4"
      pl="6"
      className="border-l-4 border-[rgb(var(--primary))] my-8"
    >
      <Text as="p" size="xl" className="italic">
        &ldquo;The best code is no code at all. Every line of code you write is a line that has to
        be maintained, debugged, and understood.&rdquo;
      </Text>
      <Text as="p" size="sm" color="muted-foreground" className="mt-2">
        &mdash; Jeff Atwood
      </Text>
    </Aside>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Pull quotes are tangential content that can be styled distinctively within an article.',
      },
    },
  },
};

/** Author bio sidebar */
export const AuthorBio: Story = {
  render: () => (
    <Aside aria-label="About the author" p="6" className="bg-[rgb(var(--muted))] rounded-lg">
      <Flex gap="4">
        <Box className="w-16 h-16 rounded-full bg-[rgb(var(--primary))] shrink-0" />
        <Stack gap="2">
          <Heading level={3} size="lg">
            Jane Developer
          </Heading>
          <Text as="p" size="sm" color="muted-foreground">
            Senior Software Engineer at OpenFlow. Passionate about accessibility and clean code.
          </Text>
          <Flex gap="2">
            <Link href="#" size="sm">
              Twitter
            </Link>
            <Link href="#" size="sm">
              GitHub
            </Link>
            <Link href="#" size="sm">
              LinkedIn
            </Link>
          </Flex>
        </Stack>
      </Flex>
    </Aside>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Author biographies are complementary content that belongs in an aside element.',
      },
    },
  },
};

/** Related articles sidebar */
export const RelatedArticles: Story = {
  render: () => (
    <Aside aria-label="Related articles" p="6" className="bg-[rgb(var(--muted))] rounded-lg w-80">
      <Stack gap="4">
        <Heading level={3} size="lg">
          Related Articles
        </Heading>

        <Stack gap="4">
          {[
            { title: 'Understanding ARIA Roles', date: 'Jan 10, 2025' },
            { title: 'CSS Grid for Layouts', date: 'Jan 8, 2025' },
            { title: 'React 19 Features', date: 'Jan 5, 2025' },
          ].map((article, index) => (
            <Box
              key={index}
              p="3"
              className="bg-[rgb(var(--background))] rounded-md hover:shadow-sm transition-shadow"
            >
              <Link href="#" className="block">
                <Text weight="medium" size="sm">
                  {article.title}
                </Text>
                <Text size="xs" color="muted-foreground" className="mt-1">
                  {article.date}
                </Text>
              </Link>
            </Box>
          ))}
        </Stack>
      </Stack>
    </Aside>
  ),
};

/** Newsletter signup sidebar */
export const NewsletterSignup: Story = {
  render: () => (
    <Aside aria-label="Newsletter signup" p="6" className="bg-[rgb(var(--primary))] rounded-lg">
      <Stack gap="4">
        <Heading level={3} size="lg" className="text-white">
          Subscribe to our newsletter
        </Heading>
        <Text as="p" size="sm" className="text-white/80">
          Get the latest articles and tutorials delivered to your inbox.
        </Text>
        <Flex gap="2">
          <Box className="flex-1 h-10 bg-white rounded-md" />
          <Box className="h-10 px-4 bg-white/20 rounded-md flex items-center">
            <Text size="sm" className="text-white font-medium">
              Subscribe
            </Text>
          </Box>
        </Flex>
      </Stack>
    </Aside>
  ),
};

/** Sticky sidebar */
export const StickySidebar: Story = {
  render: () => (
    <Flex gap="8">
      <Box className="flex-1">
        <Stack gap="4">
          <Heading level={1}>Main Content</Heading>
          {Array.from({ length: 5 }).map((_, i) => (
            <Text key={i} as="p">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
              incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
              exercitation ullamco laboris.
            </Text>
          ))}
        </Stack>
      </Box>

      <Aside
        aria-label="Sticky navigation"
        p="4"
        className="w-64 bg-[rgb(var(--muted))] rounded-lg sticky top-4 h-fit"
      >
        <Stack gap="3">
          <Heading level={3} size="sm">
            Quick Links
          </Heading>
          <List styleType="none" gap="2">
            <ListItem>
              <Link href="#">Section 1</Link>
            </ListItem>
            <ListItem>
              <Link href="#">Section 2</Link>
            </ListItem>
            <ListItem>
              <Link href="#">Section 3</Link>
            </ListItem>
          </List>
        </Stack>
      </Aside>
    </Flex>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Aside can be used as a sticky sidebar that remains visible while scrolling. Note: Sticky positioning is applied via className.',
      },
    },
  },
};

/** Social sharing widget */
export const SocialSharing: Story = {
  render: () => (
    <Aside
      aria-label="Share this article"
      p="4"
      className="border border-[rgb(var(--border))] rounded-lg"
    >
      <Stack gap="3">
        <Text size="sm" weight="medium">
          Share this article
        </Text>
        <Flex gap="2">
          {['Twitter', 'Facebook', 'LinkedIn', 'Copy'].map((platform) => (
            <Box
              key={platform}
              className="w-10 h-10 bg-[rgb(var(--muted))] rounded-lg flex items-center justify-center cursor-pointer hover:bg-[rgb(var(--muted))]/80"
            >
              <Text size="xs">{platform[0]}</Text>
            </Box>
          ))}
        </Flex>
      </Stack>
    </Aside>
  ),
};

/** Advertisement placeholder */
export const Advertisement: Story = {
  render: () => (
    <Aside aria-label="Advertisement" className="text-center">
      <Box p="8" className="bg-[rgb(var(--muted))] border border-[rgb(var(--border))] rounded-lg">
        <Stack gap="2" className="items-center">
          <Text size="xs" color="muted-foreground" className="uppercase tracking-wide">
            Advertisement
          </Text>
          <Box className="w-full h-32 bg-[rgb(var(--border))] rounded flex items-center justify-center">
            <Text color="muted-foreground">Ad Space</Text>
          </Box>
        </Stack>
      </Box>
    </Aside>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Advertisements are complementary content that should be marked with aside and clearly labeled.',
      },
    },
  },
};

/** Page layout with multiple asides */
export const MultipleAsides: Story = {
  render: () => (
    <Flex gap="6">
      <Aside
        aria-label="Navigation sidebar"
        p="4"
        className="w-48 bg-[rgb(var(--muted))] rounded-lg h-fit"
      >
        <Stack gap="3">
          <Heading level={3} size="sm">
            Navigation
          </Heading>
          <List styleType="none" gap="1">
            <ListItem>
              <Link href="#">Dashboard</Link>
            </ListItem>
            <ListItem>
              <Link href="#">Projects</Link>
            </ListItem>
            <ListItem>
              <Link href="#">Settings</Link>
            </ListItem>
          </List>
        </Stack>
      </Aside>

      <Box className="flex-1 p-6 bg-[rgb(var(--background))] border border-[rgb(var(--border))] rounded-lg">
        <Heading level={1}>Main Content Area</Heading>
        <Text as="p" className="mt-4">
          When you have multiple aside elements on a page, use unique aria-labels to help screen
          reader users distinguish between them.
        </Text>
      </Box>

      <Aside
        aria-label="Activity feed"
        p="4"
        className="w-64 bg-[rgb(var(--muted))] rounded-lg h-fit"
      >
        <Stack gap="3">
          <Heading level={3} size="sm">
            Recent Activity
          </Heading>
          <Stack gap="2">
            {['User logged in', 'File uploaded', 'Task completed'].map((activity, i) => (
              <Text key={i} size="sm">
                {activity}
              </Text>
            ))}
          </Stack>
        </Stack>
      </Aside>
    </Flex>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'When multiple asides exist on a page, each should have a unique aria-label for accessibility.',
      },
    },
  },
};

/** All spacing props demonstration */
export const AllSpacingProps: Story = {
  render: () => (
    <Stack gap="4">
      <Aside aria-label="Padding all sides" p="6" className="bg-blue-100 rounded">
        <Text>p=&quot;6&quot; - Padding all sides</Text>
      </Aside>

      <Aside
        aria-label="Horizontal and vertical padding"
        px="8"
        py="2"
        className="bg-green-100 rounded"
      >
        <Text>px=&quot;8&quot; py=&quot;2&quot; - Different horizontal and vertical padding</Text>
      </Aside>

      <Aside
        aria-label="Individual side padding"
        pt="8"
        pb="2"
        pl="4"
        pr="12"
        className="bg-yellow-100 rounded"
      >
        <Text>
          pt=&quot;8&quot; pb=&quot;2&quot; pl=&quot;4&quot; pr=&quot;12&quot; - Individual sides
        </Text>
      </Aside>

      <Box className="bg-gray-200 p-2 rounded">
        <Aside aria-label="Margin all sides" m="4" p="4" className="bg-purple-100 rounded">
          <Text>m=&quot;4&quot; - Margin on all sides (visible against gray background)</Text>
        </Aside>
      </Box>

      <Box className="bg-gray-200 p-2 rounded">
        <Aside aria-label="Horizontal margin" mx="8" p="4" className="bg-pink-100 rounded">
          <Text>mx=&quot;8&quot; - Horizontal margin only</Text>
        </Aside>
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

/** With test ID */
export const WithTestId: Story = {
  args: {
    'data-testid': 'sidebar-content',
    'aria-label': 'Test sidebar',
    p: '4',
    className: 'bg-[rgb(var(--muted))] rounded-lg',
    children: <Text as="p">This aside has a data-testid for automated testing.</Text>,
  },
};

/** Accessibility demonstration */
export const AccessibilityDemo: Story = {
  render: () => (
    <Stack gap="6">
      <Box p="4" className="bg-amber-100 border border-amber-300 rounded-lg">
        <Text size="sm">
          <strong>Accessibility Note:</strong> Aside elements are complementary landmarks. Screen
          reader users can navigate directly to them. When multiple asides exist, aria-labels help
          distinguish them. The content should be tangentially related to the main content.
        </Text>
      </Box>

      <Flex gap="6">
        <Box className="flex-1 p-4 bg-[rgb(var(--background))] border border-[rgb(var(--border))] rounded-lg">
          <Heading level={2}>Main Article Content</Heading>
          <Text as="p" className="mt-2">
            This is the primary content of the page. The aside elements to the right provide
            supplementary information that is related but not essential.
          </Text>
        </Box>

        <Stack gap="4" className="w-64">
          <Aside
            aria-label="Author information"
            p="4"
            className="bg-[rgb(var(--muted))] rounded-lg"
          >
            <Stack gap="2">
              <Heading level={3} size="sm">
                About the Author
              </Heading>
              <Text as="p" size="sm">
                Screen readers announce: &quot;Author information, complementary&quot;
              </Text>
            </Stack>
          </Aside>

          <Aside aria-label="Related content" p="4" className="bg-[rgb(var(--muted))] rounded-lg">
            <Stack gap="2">
              <Heading level={3} size="sm">
                Related Links
              </Heading>
              <Text as="p" size="sm">
                Screen readers announce: &quot;Related content, complementary&quot;
              </Text>
            </Stack>
          </Aside>
        </Stack>
      </Flex>
    </Stack>
  ),
  parameters: {
    docs: {
      description: {
        story: 'This demo shows how screen readers interpret aside elements with aria-labels.',
      },
    },
  },
};

/** Glossary sidebar */
export const Glossary: Story = {
  render: () => (
    <Aside aria-label="Glossary" p="6" className="bg-[rgb(var(--muted))] rounded-lg w-80">
      <Stack gap="4">
        <Heading level={3}>Glossary</Heading>

        <Stack gap="4">
          <Box>
            <Text weight="semibold">Accessibility (a11y)</Text>
            <Text as="p" size="sm" color="muted-foreground">
              The practice of making websites usable by as many people as possible.
            </Text>
          </Box>

          <Box>
            <Text weight="semibold">ARIA</Text>
            <Text as="p" size="sm" color="muted-foreground">
              Accessible Rich Internet Applications - a set of attributes for enhanced
              accessibility.
            </Text>
          </Box>

          <Box>
            <Text weight="semibold">Landmark</Text>
            <Text as="p" size="sm" color="muted-foreground">
              A region of the page that screen reader users can navigate directly to.
            </Text>
          </Box>
        </Stack>
      </Stack>
    </Aside>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'A glossary providing definitions is complementary content perfect for an aside element.',
      },
    },
  },
};

/** FAQ sidebar */
export const FAQSidebar: Story = {
  render: () => (
    <Aside
      aria-label="Frequently asked questions"
      p="6"
      className="bg-[rgb(var(--muted))] rounded-lg"
    >
      <Stack gap="4">
        <Heading level={3}>FAQ</Heading>

        <Stack gap="4">
          <Box>
            <Text weight="semibold" size="sm">
              When should I use aside?
            </Text>
            <Text as="p" size="sm" color="muted-foreground" className="mt-1">
              Use aside for content tangentially related to the main content.
            </Text>
          </Box>

          <Box>
            <Text weight="semibold" size="sm">
              Is aria-label required?
            </Text>
            <Text as="p" size="sm" color="muted-foreground" className="mt-1">
              No, but it helps when multiple asides exist on a page.
            </Text>
          </Box>

          <Box>
            <Text weight="semibold" size="sm">
              Can aside be nested?
            </Text>
            <Text as="p" size="sm" color="muted-foreground" className="mt-1">
              Yes, but nested asides should have clear labels to distinguish them.
            </Text>
          </Box>
        </Stack>
      </Stack>
    </Aside>
  ),
};

/** Support/help widget */
export const SupportWidget: Story = {
  render: () => (
    <Aside
      aria-label="Need help?"
      p="4"
      className="border border-[rgb(var(--border))] rounded-lg w-72"
    >
      <Flex gap="3">
        <Box className="w-10 h-10 bg-[rgb(var(--primary))] rounded-full shrink-0 flex items-center justify-center">
          <Text className="text-white">?</Text>
        </Box>
        <Stack gap="1">
          <Text weight="semibold" size="sm">
            Need help?
          </Text>
          <Text as="p" size="xs" color="muted-foreground">
            Check our documentation or contact support.
          </Text>
          <Flex gap="2" className="mt-2">
            <Link href="#" size="xs">
              Docs
            </Link>
            <Link href="#" size="xs">
              Contact
            </Link>
          </Flex>
        </Stack>
      </Flex>
    </Aside>
  ),
};
