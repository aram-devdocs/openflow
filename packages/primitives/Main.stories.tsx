import type { Meta, StoryObj } from '@storybook/react';
import { Box } from './Box';
import { Flex } from './Flex';
import { Heading } from './Heading';
import { Link } from './Link';
import { List } from './List';
import { ListItem } from './ListItem';
import { Main } from './Main';
import { Nav } from './Nav';
import { Paragraph } from './Paragraph';
import { Stack } from './Stack';
import { Text } from './Text';
import { VisuallyHidden } from './VisuallyHidden';

const meta: Meta<typeof Main> = {
  title: 'Primitives/Main',
  component: Main,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Semantic `<main>` landmark primitive for the primary content area. Screen readers expose this as the main landmark, allowing users to quickly jump to primary content. Defaults to id="main-content" for skip link targeting.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    id: {
      control: 'text',
      description: 'Element ID for skip link targeting (defaults to "main-content")',
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
    gap: {
      control: 'select',
      options: [undefined, '0', '1', '2', '3', '4', '5', '6', '8'],
      description: 'Gap between children (when using flex/grid)',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Main>;

/** Basic main content area */
export const Default: Story = {
  args: {
    children: (
      <Stack gap="4">
        <Heading level={1}>Page Title</Heading>
        <Paragraph>
          This is the main content area of the page. The main element represents the dominant
          content of the body of a document.
        </Paragraph>
      </Stack>
    ),
  },
};

/** Main with padding */
export const WithPadding: Story = {
  render: () => (
    <Main p="8" className="bg-[rgb(var(--muted))]">
      <Stack gap="4">
        <Heading level={1}>Padded Content</Heading>
        <Paragraph>
          This main element has padding applied via the p prop. Notice the consistent spacing around
          all edges.
        </Paragraph>
      </Stack>
    </Main>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Main content area with uniform padding on all sides.',
      },
    },
  },
};

/** Responsive padding */
export const ResponsivePadding: Story = {
  render: () => (
    <Main p={{ base: '4', md: '6', lg: '8' }} className="bg-[rgb(var(--muted))]">
      <Stack gap="4">
        <Heading level={1}>Responsive Padding</Heading>
        <Paragraph>
          This main element adjusts its padding based on viewport size. Resize the browser to see
          the padding change: 16px on mobile, 24px on tablet, 32px on desktop.
        </Paragraph>
      </Stack>
    </Main>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Main content area with responsive padding that increases on larger screens.',
      },
    },
  },
};

/** Full page layout with skip link */
export const FullPageLayout: Story = {
  render: () => (
    <Box className="min-h-screen flex flex-col">
      {/* Skip Link - visible only on focus */}
      <Link
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:p-4 focus:bg-[rgb(var(--background))] focus:text-[rgb(var(--foreground))]"
      >
        Skip to main content
      </Link>

      {/* Header */}
      <Box as="header" className="bg-[rgb(var(--muted))]" px="6" py="4">
        <Flex justify="between" align="center">
          <Text weight="bold" size="lg">
            Logo
          </Text>
          <Nav aria-label="Main navigation">
            <Flex gap="4">
              <Link href="/">Home</Link>
              <Link href="/about">About</Link>
              <Link href="/contact">Contact</Link>
            </Flex>
          </Nav>
        </Flex>
      </Box>

      {/* Main Content - Target of skip link */}
      <Main p={{ base: '4', md: '6', lg: '8' }} className="flex-1">
        <Stack gap="6" className="max-w-4xl mx-auto">
          <Heading level={1}>Welcome to Our Site</Heading>
          <Paragraph size="lg">
            This is the main content area that the skip link targets. Users who tab through the page
            will see a &quot;Skip to main content&quot; link appear first, allowing them to bypass
            the navigation.
          </Paragraph>
          <Paragraph>
            Try pressing Tab when this page loads to see the skip link appear. This is a crucial
            accessibility feature for keyboard users.
          </Paragraph>
        </Stack>
      </Main>

      {/* Footer */}
      <Box as="footer" className="bg-[rgb(var(--muted))]" p="6">
        <Text size="sm" color="muted-foreground" align="center">
          © 2025 Example Company
        </Text>
      </Box>
    </Box>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Complete page layout demonstrating the skip link pattern. Press Tab when the page loads to see the skip link appear.',
      },
    },
  },
};

/** Custom ID for skip link */
export const CustomId: Story = {
  render: () => (
    <Stack gap="4">
      <Box p="4" className="bg-amber-100 border border-amber-300 rounded-lg">
        <Text size="sm">
          <strong>Note:</strong> This main element uses a custom ID (&quot;primary-content&quot;)
          instead of the default &quot;main-content&quot;. Ensure your skip link targets this custom
          ID.
        </Text>
      </Box>

      <Main id="primary-content" p="6" className="bg-[rgb(var(--muted))] rounded-lg">
        <Stack gap="4">
          <Heading level={1}>Custom ID Example</Heading>
          <Paragraph>
            This main element has id=&quot;primary-content&quot;. Your skip link should use
            href=&quot;#primary-content&quot; to target this element.
          </Paragraph>
        </Stack>
      </Main>
    </Stack>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Main element with a custom ID. Useful when you need a different skip link target.',
      },
    },
  },
};

/** Centered content layout */
export const CenteredLayout: Story = {
  render: () => (
    <Main px={{ base: '4', md: '6' }} py="8">
      <Box className="max-w-3xl mx-auto">
        <Stack gap="6">
          <Heading level={1}>Centered Content</Heading>
          <Paragraph size="lg" leading="relaxed">
            This layout uses horizontal padding on the main element combined with a max-width
            container to create a centered reading area. This is a common pattern for blog posts and
            article pages.
          </Paragraph>
          <Paragraph leading="relaxed">
            The content stays readable on all screen sizes while utilizing available space
            appropriately. The max-width prevents lines from becoming too long on wide screens,
            which improves readability.
          </Paragraph>
          <Heading level={2}>Secondary Heading</Heading>
          <Paragraph leading="relaxed">
            Additional paragraphs and sections maintain the same comfortable reading width, creating
            a consistent and pleasant reading experience.
          </Paragraph>
        </Stack>
      </Box>
    </Main>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Common layout pattern with centered content and max-width for readability.',
      },
    },
  },
};

/** Two column layout */
export const TwoColumnLayout: Story = {
  render: () => (
    <Main p={{ base: '4', lg: '8' }}>
      <Flex gap="8" direction={{ base: 'column', lg: 'row' }}>
        {/* Main content */}
        <Box className="flex-1">
          <Stack gap="6">
            <Heading level={1}>Article Title</Heading>
            <Paragraph>
              This is a two-column layout where the main content and sidebar are both within the
              main element. The sidebar typically contains related content, navigation, or
              supplementary information.
            </Paragraph>
            <Paragraph>
              On smaller screens, the layout stacks vertically for better mobile usability.
            </Paragraph>
          </Stack>
        </Box>

        {/* Sidebar */}
        <Box as="aside" aria-label="Related content" className="lg:w-80">
          <Stack gap="4" p="4" className="bg-[rgb(var(--muted))] rounded-lg">
            <Heading level={2} size="lg">
              Related Articles
            </Heading>
            <List ordered={false} styleType="none" gap="2">
              <ListItem>
                <Link href="/article-1">Related Article One</Link>
              </ListItem>
              <ListItem>
                <Link href="/article-2">Related Article Two</Link>
              </ListItem>
              <ListItem>
                <Link href="/article-3">Related Article Three</Link>
              </ListItem>
            </List>
          </Stack>
        </Box>
      </Flex>
    </Main>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Two-column layout with main content and sidebar. Stacks on mobile for responsiveness.',
      },
    },
  },
};

/** With tabindex for focus management */
export const FocusManagement: Story = {
  render: () => (
    <Stack gap="4">
      <Box p="4" className="bg-amber-100 border border-amber-300 rounded-lg">
        <Stack gap="2">
          <Text size="sm" weight="bold">
            Focus Management:
          </Text>
          <Text size="sm">
            When using the skip link, focus is moved to the main element. Adding
            tabIndex=&quot;-1&quot; allows the element to receive focus programmatically without
            being in the tab order.
          </Text>
        </Stack>
      </Box>

      <Main
        tabIndex={-1}
        p="6"
        className="bg-[rgb(var(--muted))] rounded-lg focus:outline-2 focus:outline-[rgb(var(--primary))]"
      >
        <Stack gap="4">
          <Heading level={1}>Focusable Main</Heading>
          <Paragraph>
            This main element can receive focus programmatically. When a skip link is clicked, the
            browser scrolls to this element and focus is moved here. The outline style shows when
            this element is focused.
          </Paragraph>
        </Stack>
      </Main>
    </Stack>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Main element with tabIndex=-1 for programmatic focus. Shows focus ring when focused.',
      },
    },
  },
};

/** Dashboard layout */
export const DashboardLayout: Story = {
  render: () => (
    <Box className="min-h-screen flex">
      {/* Sidebar Navigation */}
      <Nav
        aria-label="Dashboard navigation"
        className="w-64 bg-[rgb(var(--muted))] hidden md:block"
        p="4"
      >
        <Stack gap="4">
          <Text weight="bold" size="lg">
            Dashboard
          </Text>
          <List ordered={false} styleType="none" gap="1">
            <ListItem>
              <Link
                href="/dashboard"
                underline="none"
                className="flex px-3 py-2 rounded-md bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))]"
              >
                Overview
              </Link>
            </ListItem>
            <ListItem>
              <Link
                href="/analytics"
                underline="none"
                className="flex px-3 py-2 rounded-md hover:bg-[rgb(var(--background))]"
              >
                Analytics
              </Link>
            </ListItem>
            <ListItem>
              <Link
                href="/settings"
                underline="none"
                className="flex px-3 py-2 rounded-md hover:bg-[rgb(var(--background))]"
              >
                Settings
              </Link>
            </ListItem>
          </List>
        </Stack>
      </Nav>

      {/* Main Content Area */}
      <Main p="6" className="flex-1">
        <Stack gap="6">
          <Heading level={1}>Dashboard Overview</Heading>
          <Box className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Box p="4" className="bg-[rgb(var(--muted))] rounded-lg">
              <Stack gap="2">
                <Text size="sm" color="muted-foreground">
                  Total Users
                </Text>
                <Text size="3xl" weight="bold">
                  1,234
                </Text>
              </Stack>
            </Box>
            <Box p="4" className="bg-[rgb(var(--muted))] rounded-lg">
              <Stack gap="2">
                <Text size="sm" color="muted-foreground">
                  Revenue
                </Text>
                <Text size="3xl" weight="bold">
                  $45,678
                </Text>
              </Stack>
            </Box>
            <Box p="4" className="bg-[rgb(var(--muted))] rounded-lg">
              <Stack gap="2">
                <Text size="sm" color="muted-foreground">
                  Active Projects
                </Text>
                <Text size="3xl" weight="bold">
                  12
                </Text>
              </Stack>
            </Box>
          </Box>
        </Stack>
      </Main>
    </Box>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Dashboard layout with sidebar navigation and main content area containing widgets.',
      },
    },
  },
};

/** All spacing props demonstration */
export const AllSpacingProps: Story = {
  render: () => (
    <Stack gap="4">
      <Main p="6" className="bg-blue-100 rounded">
        <Text>p=&quot;6&quot; - Padding all sides</Text>
      </Main>

      <Main px="8" py="2" className="bg-green-100 rounded">
        <Text>px=&quot;8&quot; py=&quot;2&quot; - Different horizontal and vertical padding</Text>
      </Main>

      <Main pt="8" pb="2" pl="4" pr="12" className="bg-yellow-100 rounded">
        <Text>
          pt=&quot;8&quot; pb=&quot;2&quot; pl=&quot;4&quot; pr=&quot;12&quot; - Individual sides
        </Text>
      </Main>

      <Box className="bg-gray-200 p-2 rounded">
        <Main m="4" p="4" className="bg-purple-100 rounded">
          <Text>m=&quot;4&quot; - Margin on all sides (visible against gray background)</Text>
        </Main>
      </Box>
    </Stack>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Demonstration of all available spacing props.',
      },
    },
  },
};

/** With test ID */
export const WithTestId: Story = {
  args: {
    'data-testid': 'main-content-area',
    p: '4',
    className: 'bg-[rgb(var(--muted))] rounded-lg',
    children: <Text>This main has a data-testid for automated testing.</Text>,
  },
};

/** Accessibility demonstration */
export const AccessibilityDemo: Story = {
  render: () => (
    <Stack gap="6">
      <Box p="4" className="bg-amber-100 border border-amber-300 rounded-lg">
        <Stack gap="2">
          <Text size="sm" weight="bold">
            Accessibility Features:
          </Text>
          <List ordered={false} styleType="disc" gap="1" className="ml-4">
            <ListItem>
              <Text size="sm">
                Main elements are announced as &quot;main&quot; landmarks by screen readers
              </Text>
            </ListItem>
            <ListItem>
              <Text size="sm">Users can jump directly to main using landmark navigation</Text>
            </ListItem>
            <ListItem>
              <Text size="sm">Skip links target the main element&apos;s id for quick access</Text>
            </ListItem>
            <ListItem>
              <Text size="sm">Only one visible main element should exist per page</Text>
            </ListItem>
          </List>
        </Stack>
      </Box>

      <Main p="4" className="bg-[rgb(var(--muted))] rounded-lg">
        <Stack gap="2">
          <VisuallyHidden>
            <Heading level={1}>Main Content Area</Heading>
          </VisuallyHidden>
          <Heading level={1}>Page Title</Heading>
          <Paragraph>
            Screen readers will announce: &quot;main landmark&quot; when encountering this element.
            Users can navigate directly to it using their screen reader&apos;s landmark navigation.
          </Paragraph>
        </Stack>
      </Main>

      <Text size="sm" color="muted-foreground">
        Try using a screen reader to navigate landmarks on this page.
      </Text>
    </Stack>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates how screen readers interpret the main element as a landmark.',
      },
    },
  },
};

/** Multiple main elements (anti-pattern) */
export const MultipleMainsAntiPattern: Story = {
  render: () => (
    <Stack gap="4">
      <Box p="4" className="bg-red-100 border border-red-300 rounded-lg">
        <Stack gap="2">
          <Text size="sm" weight="bold" color="red-700">
            Anti-Pattern Warning:
          </Text>
          <Text size="sm">
            Only ONE visible main element should exist per page. Having multiple visible main
            elements confuses screen reader users and violates HTML semantics.
          </Text>
          <Text size="sm">
            If you need multiple content sections, use {'<section>'} with aria-label instead.
          </Text>
        </Stack>
      </Box>

      {/* This is shown for educational purposes only */}
      <Box className="opacity-50">
        <Main id="main-1" p="4" className="bg-[rgb(var(--muted))] rounded-lg mb-4">
          <Text>First main (visible) - This is correct</Text>
        </Main>
        <Box as="main" aria-hidden className="p-4 bg-red-50 rounded-lg border border-red-200">
          <Text color="red-700">Second main - INCORRECT! Use section instead</Text>
        </Box>
      </Box>
    </Stack>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Educational example showing why multiple main elements is an anti-pattern. Only one main should be visible at a time.',
      },
    },
  },
};

/** Loading state in main */
export const LoadingState: Story = {
  render: () => (
    <Main p="8">
      <Stack gap="6" className="max-w-4xl mx-auto">
        {/* Skeleton for heading */}
        <Box className="h-10 w-2/3 bg-[rgb(var(--muted))] rounded animate-pulse" aria-hidden />

        {/* Skeleton for paragraphs */}
        <Stack gap="3">
          <Box className="h-4 w-full bg-[rgb(var(--muted))] rounded animate-pulse" aria-hidden />
          <Box className="h-4 w-full bg-[rgb(var(--muted))] rounded animate-pulse" aria-hidden />
          <Box className="h-4 w-3/4 bg-[rgb(var(--muted))] rounded animate-pulse" aria-hidden />
        </Stack>

        {/* Screen reader loading announcement */}
        <VisuallyHidden>
          <Text role="status" aria-live="polite">
            Loading page content...
          </Text>
        </VisuallyHidden>
      </Stack>
    </Main>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Main content area showing a loading skeleton state with proper aria-live announcement.',
      },
    },
  },
};

/** Error state in main */
export const ErrorState: Story = {
  render: () => (
    <Main p="8">
      <Box className="max-w-xl mx-auto text-center">
        <Stack gap="4" align="center">
          <Text size="4xl" aria-hidden>
            ⚠️
          </Text>
          <Heading level={1}>Something Went Wrong</Heading>
          <Paragraph color="muted-foreground">
            We couldn&apos;t load the page content. Please try again or contact support if the
            problem persists.
          </Paragraph>
          <Link
            href="#"
            className="inline-flex px-4 py-2 bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))] rounded-md"
          >
            Try Again
          </Link>
        </Stack>
      </Box>
    </Main>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Main content area displaying an error state with retry action.',
      },
    },
  },
};

/** Article page layout */
export const ArticleLayout: Story = {
  render: () => (
    <Main py="8">
      <Box className="max-w-2xl mx-auto" px={{ base: '4', md: '0' }}>
        <Stack gap="6">
          <Stack gap="2">
            <Text size="sm" color="muted-foreground">
              <time dateTime="2025-01-15">January 15, 2025</time>
            </Text>
            <Heading level={1}>Understanding Web Accessibility</Heading>
            <Text color="muted-foreground">
              A guide to making your web content accessible to everyone.
            </Text>
          </Stack>

          <Paragraph size="lg" leading="relaxed">
            Web accessibility ensures that websites and applications are usable by people with
            disabilities. This includes visual, auditory, motor, and cognitive impairments.
          </Paragraph>

          <Heading level={2}>Why Accessibility Matters</Heading>
          <Paragraph leading="relaxed">
            Accessibility is not just about compliance—it&apos;s about ensuring everyone can access
            and use your content. An accessible website benefits all users, including those using
            mobile devices or slow internet connections.
          </Paragraph>

          <Heading level={2}>Key Principles</Heading>
          <List ordered styleType="decimal" gap="3">
            <ListItem>
              <Text weight="semibold">Perceivable</Text>
              <Text color="muted-foreground">
                Information must be presentable in ways users can perceive.
              </Text>
            </ListItem>
            <ListItem>
              <Text weight="semibold">Operable</Text>
              <Text color="muted-foreground">UI components must be operable by all users.</Text>
            </ListItem>
            <ListItem>
              <Text weight="semibold">Understandable</Text>
              <Text color="muted-foreground">Content must be understandable to users.</Text>
            </ListItem>
            <ListItem>
              <Text weight="semibold">Robust</Text>
              <Text color="muted-foreground">
                Content must work with current and future technologies.
              </Text>
            </ListItem>
          </List>
        </Stack>
      </Box>
    </Main>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Article/blog post layout with proper heading hierarchy and readable line lengths.',
      },
    },
  },
};
