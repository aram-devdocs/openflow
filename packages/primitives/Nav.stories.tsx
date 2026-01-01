import type { Meta, StoryObj } from '@storybook/react';
import { Box } from './Box';
import { Flex } from './Flex';
import { Heading } from './Heading';
import { Link } from './Link';
import { List } from './List';
import { ListItem } from './ListItem';
import { Nav } from './Nav';
import { Stack } from './Stack';
import { Text } from './Text';
import { VisuallyHidden } from './VisuallyHidden';

const meta: Meta<typeof Nav> = {
  title: 'Primitives/Nav',
  component: Nav,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Semantic `<nav>` landmark primitive for navigation regions. Screen readers expose this as a navigation landmark, allowing users to quickly jump to navigation areas. Use aria-label to distinguish multiple nav elements.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    'aria-label': {
      control: 'text',
      description: 'Accessible label to distinguish navigation regions',
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
type Story = StoryObj<typeof Nav>;

/** Basic navigation with links */
export const Default: Story = {
  args: {
    'aria-label': 'Main navigation',
    children: (
      <List ordered={false} styleType="none" gap="2">
        <ListItem>
          <Link href="/" underline="hover">
            Home
          </Link>
        </ListItem>
        <ListItem>
          <Link href="/about" underline="hover">
            About
          </Link>
        </ListItem>
        <ListItem>
          <Link href="/services" underline="hover">
            Services
          </Link>
        </ListItem>
        <ListItem>
          <Link href="/contact" underline="hover">
            Contact
          </Link>
        </ListItem>
      </List>
    ),
  },
};

/** Horizontal navigation bar */
export const HorizontalNav: Story = {
  render: () => (
    <Nav aria-label="Main navigation" className="bg-[rgb(var(--muted))]" px="6" py="4">
      <Flex justify="between" align="center">
        <Text weight="bold" size="lg">
          Logo
        </Text>
        <Flex gap="6" align="center">
          <Link href="/" underline="hover">
            Home
          </Link>
          <Link href="/products" underline="hover">
            Products
          </Link>
          <Link href="/about" underline="hover">
            About
          </Link>
          <Link href="/contact" underline="hover">
            Contact
          </Link>
        </Flex>
      </Flex>
    </Nav>
  ),
  parameters: {
    docs: {
      description: {
        story: 'A typical horizontal navigation bar found at the top of websites.',
      },
    },
  },
};

/** Responsive navigation */
export const ResponsiveNav: Story = {
  render: () => (
    <Nav
      aria-label="Main navigation"
      className="bg-[rgb(var(--muted))]"
      px={{ base: '4', md: '6', lg: '8' }}
      py="4"
    >
      <Flex justify="between" align="center" wrap="wrap" gap="4">
        <Text weight="bold" size="lg">
          Logo
        </Text>
        <Flex
          gap={{ base: '4', md: '6' }}
          align="center"
          direction={{ base: 'column', md: 'row' }}
          className="w-full md:w-auto"
        >
          <Link href="/" underline="hover">
            Home
          </Link>
          <Link href="/products" underline="hover">
            Products
          </Link>
          <Link href="/about" underline="hover">
            About
          </Link>
          <Link href="/contact" underline="hover">
            Contact
          </Link>
        </Flex>
      </Flex>
    </Nav>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Responsive navigation that adjusts padding and layout based on viewport. Resize to see changes.',
      },
    },
  },
};

/** Sidebar navigation */
export const SidebarNav: Story = {
  render: () => (
    <Box className="w-64 h-screen bg-[rgb(var(--muted))]">
      <Nav aria-label="Sidebar navigation" p="4">
        <Stack gap="6">
          <Text weight="bold" size="lg">
            Dashboard
          </Text>

          <Stack gap="1">
            <Text size="xs" color="muted-foreground" weight="semibold" className="uppercase px-3">
              Main
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
                  href="/reports"
                  underline="none"
                  className="flex px-3 py-2 rounded-md hover:bg-[rgb(var(--background))]"
                >
                  Reports
                </Link>
              </ListItem>
            </List>
          </Stack>

          <Stack gap="1">
            <Text size="xs" color="muted-foreground" weight="semibold" className="uppercase px-3">
              Settings
            </Text>
            <List ordered={false} styleType="none" gap="1">
              <ListItem>
                <Link
                  href="/profile"
                  underline="none"
                  className="flex px-3 py-2 rounded-md hover:bg-[rgb(var(--background))]"
                >
                  Profile
                </Link>
              </ListItem>
              <ListItem>
                <Link
                  href="/preferences"
                  underline="none"
                  className="flex px-3 py-2 rounded-md hover:bg-[rgb(var(--background))]"
                >
                  Preferences
                </Link>
              </ListItem>
            </List>
          </Stack>
        </Stack>
      </Nav>
    </Box>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Vertical sidebar navigation commonly used in dashboard applications.',
      },
    },
  },
};

/** Breadcrumb navigation */
export const BreadcrumbNav: Story = {
  render: () => (
    <Nav aria-label="Breadcrumb" py="2">
      <List
        ordered
        styleType="none"
        gap="2"
        className="flex flex-row items-center list-none [&>li]:flex [&>li]:items-center"
      >
        <ListItem>
          <Link href="/" underline="hover" size="sm">
            Home
          </Link>
          <Text size="sm" color="muted-foreground" className="mx-2">
            /
          </Text>
        </ListItem>
        <ListItem>
          <Link href="/products" underline="hover" size="sm">
            Products
          </Link>
          <Text size="sm" color="muted-foreground" className="mx-2">
            /
          </Text>
        </ListItem>
        <ListItem>
          <Text size="sm" color="muted-foreground" aria-current="page">
            Widget Pro
          </Text>
        </ListItem>
      </List>
    </Nav>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Breadcrumb navigation showing the user's current location within the site hierarchy.",
      },
    },
  },
};

/** Pagination navigation */
export const PaginationNav: Story = {
  render: () => (
    <Nav aria-label="Pagination">
      <Flex gap="1" align="center" justify="center">
        <Link
          href="/page/1"
          underline="none"
          className="px-3 py-2 rounded-md hover:bg-[rgb(var(--muted))]"
          aria-label="Go to previous page"
        >
          Previous
        </Link>
        <Link
          href="/page/1"
          underline="none"
          className="px-3 py-2 rounded-md hover:bg-[rgb(var(--muted))]"
        >
          1
        </Link>
        <Link
          href="/page/2"
          underline="none"
          className="px-3 py-2 rounded-md bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))]"
          aria-current="page"
        >
          2
        </Link>
        <Link
          href="/page/3"
          underline="none"
          className="px-3 py-2 rounded-md hover:bg-[rgb(var(--muted))]"
        >
          3
        </Link>
        <Text color="muted-foreground">...</Text>
        <Link
          href="/page/10"
          underline="none"
          className="px-3 py-2 rounded-md hover:bg-[rgb(var(--muted))]"
        >
          10
        </Link>
        <Link
          href="/page/3"
          underline="none"
          className="px-3 py-2 rounded-md hover:bg-[rgb(var(--muted))]"
          aria-label="Go to next page"
        >
          Next
        </Link>
      </Flex>
    </Nav>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Pagination navigation for navigating through paginated content.',
      },
    },
  },
};

/** Table of contents */
export const TableOfContents: Story = {
  render: () => (
    <Box className="w-64">
      <Nav aria-label="Table of contents" p="4" className="bg-[rgb(var(--muted))] rounded-lg">
        <Stack gap="3">
          <Text weight="semibold" size="sm">
            On this page
          </Text>
          <List ordered={false} styleType="none" gap="2">
            <ListItem>
              <Link href="#introduction" underline="hover" size="sm">
                Introduction
              </Link>
            </ListItem>
            <ListItem>
              <Link href="#getting-started" underline="hover" size="sm">
                Getting Started
              </Link>
            </ListItem>
            <ListItem>
              <Link href="#installation" underline="hover" size="sm" className="pl-4">
                Installation
              </Link>
            </ListItem>
            <ListItem>
              <Link href="#configuration" underline="hover" size="sm" className="pl-4">
                Configuration
              </Link>
            </ListItem>
            <ListItem>
              <Link href="#api-reference" underline="hover" size="sm">
                API Reference
              </Link>
            </ListItem>
            <ListItem>
              <Link href="#examples" underline="hover" size="sm">
                Examples
              </Link>
            </ListItem>
          </List>
        </Stack>
      </Nav>
    </Box>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Table of contents navigation for long documents with section anchors.',
      },
    },
  },
};

/** Footer navigation */
export const FooterNav: Story = {
  render: () => (
    <Nav
      aria-label="Footer navigation"
      p={{ base: '6', md: '8' }}
      className="bg-[rgb(var(--muted))]"
    >
      <Flex gap={{ base: '8', md: '16' }} wrap="wrap">
        <Stack gap="4">
          <Heading level={3} size="sm">
            Product
          </Heading>
          <List ordered={false} styleType="none" gap="2">
            <ListItem>
              <Link href="/features" underline="hover" size="sm" color="muted-foreground">
                Features
              </Link>
            </ListItem>
            <ListItem>
              <Link href="/pricing" underline="hover" size="sm" color="muted-foreground">
                Pricing
              </Link>
            </ListItem>
            <ListItem>
              <Link href="/changelog" underline="hover" size="sm" color="muted-foreground">
                Changelog
              </Link>
            </ListItem>
          </List>
        </Stack>

        <Stack gap="4">
          <Heading level={3} size="sm">
            Company
          </Heading>
          <List ordered={false} styleType="none" gap="2">
            <ListItem>
              <Link href="/about" underline="hover" size="sm" color="muted-foreground">
                About
              </Link>
            </ListItem>
            <ListItem>
              <Link href="/blog" underline="hover" size="sm" color="muted-foreground">
                Blog
              </Link>
            </ListItem>
            <ListItem>
              <Link href="/careers" underline="hover" size="sm" color="muted-foreground">
                Careers
              </Link>
            </ListItem>
          </List>
        </Stack>

        <Stack gap="4">
          <Heading level={3} size="sm">
            Support
          </Heading>
          <List ordered={false} styleType="none" gap="2">
            <ListItem>
              <Link href="/docs" underline="hover" size="sm" color="muted-foreground">
                Documentation
              </Link>
            </ListItem>
            <ListItem>
              <Link href="/help" underline="hover" size="sm" color="muted-foreground">
                Help Center
              </Link>
            </ListItem>
            <ListItem>
              <Link href="/contact" underline="hover" size="sm" color="muted-foreground">
                Contact Us
              </Link>
            </ListItem>
          </List>
        </Stack>

        <Stack gap="4">
          <Heading level={3} size="sm">
            Legal
          </Heading>
          <List ordered={false} styleType="none" gap="2">
            <ListItem>
              <Link href="/privacy" underline="hover" size="sm" color="muted-foreground">
                Privacy Policy
              </Link>
            </ListItem>
            <ListItem>
              <Link href="/terms" underline="hover" size="sm" color="muted-foreground">
                Terms of Service
              </Link>
            </ListItem>
          </List>
        </Stack>
      </Flex>
    </Nav>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Footer navigation with multiple link groups organized by category.',
      },
    },
  },
};

/** Multiple navigations on same page */
export const MultipleNavs: Story = {
  render: () => (
    <Stack gap="6">
      <Box p="4" className="bg-amber-100 border border-amber-300 rounded-lg">
        <Text size="sm">
          <strong>Accessibility Note:</strong> When multiple nav elements exist on a page, each
          should have a unique aria-label so screen reader users can distinguish between them.
        </Text>
      </Box>

      <Nav aria-label="Main navigation" px="6" py="4" className="bg-[rgb(var(--muted))]">
        <Flex justify="between" align="center">
          <Text weight="bold">Logo</Text>
          <Flex gap="4">
            <Link href="/">Home</Link>
            <Link href="/about">About</Link>
            <Link href="/contact">Contact</Link>
          </Flex>
        </Flex>
      </Nav>

      <Box p="8" className="bg-[rgb(var(--background))] min-h-[200px]">
        <Text color="muted-foreground">Page content would go here...</Text>
      </Box>

      <Nav aria-label="Footer navigation" p="6" className="bg-[rgb(var(--muted))]">
        <Flex gap="6" justify="center">
          <Link href="/privacy" size="sm" color="muted-foreground">
            Privacy
          </Link>
          <Link href="/terms" size="sm" color="muted-foreground">
            Terms
          </Link>
          <Link href="/sitemap" size="sm" color="muted-foreground">
            Sitemap
          </Link>
        </Flex>
      </Nav>
    </Stack>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'A page with multiple navigation regions, each with unique aria-labels for screen readers.',
      },
    },
  },
};

/** Mobile navigation menu */
export const MobileNavMenu: Story = {
  render: () => (
    <Box className="w-[320px] h-[600px] bg-[rgb(var(--background))] border rounded-lg overflow-hidden relative">
      {/* Simulated mobile menu overlay */}
      <Box className="absolute inset-0 bg-black/50" />
      <Nav
        aria-label="Mobile navigation"
        className="absolute left-0 top-0 bottom-0 w-64 bg-[rgb(var(--background))] shadow-lg"
        p="6"
      >
        <Stack gap="6">
          <Flex justify="between" align="center">
            <Text weight="bold" size="lg">
              Menu
            </Text>
            <Text className="cursor-pointer" aria-label="Close menu">
              ✕
            </Text>
          </Flex>

          <List ordered={false} styleType="none" gap="1">
            <ListItem>
              <Link
                href="/"
                underline="none"
                className="flex px-3 py-3 rounded-md hover:bg-[rgb(var(--muted))]"
              >
                Home
              </Link>
            </ListItem>
            <ListItem>
              <Link
                href="/products"
                underline="none"
                className="flex px-3 py-3 rounded-md hover:bg-[rgb(var(--muted))]"
              >
                Products
              </Link>
            </ListItem>
            <ListItem>
              <Link
                href="/about"
                underline="none"
                className="flex px-3 py-3 rounded-md hover:bg-[rgb(var(--muted))]"
              >
                About
              </Link>
            </ListItem>
            <ListItem>
              <Link
                href="/contact"
                underline="none"
                className="flex px-3 py-3 rounded-md hover:bg-[rgb(var(--muted))]"
              >
                Contact
              </Link>
            </ListItem>
          </List>

          <Box className="border-t border-[rgb(var(--border))] pt-4">
            <List ordered={false} styleType="none" gap="1">
              <ListItem>
                <Link
                  href="/login"
                  underline="none"
                  className="flex px-3 py-3 rounded-md hover:bg-[rgb(var(--muted))]"
                >
                  Log In
                </Link>
              </ListItem>
              <ListItem>
                <Link
                  href="/signup"
                  underline="none"
                  className="flex px-3 py-3 rounded-md bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))] justify-center"
                >
                  Sign Up
                </Link>
              </ListItem>
            </List>
          </Box>
        </Stack>
      </Nav>
    </Box>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Mobile navigation menu overlay pattern.',
      },
    },
  },
};

/** All spacing props demonstration */
export const AllSpacingProps: Story = {
  render: () => (
    <Stack gap="4">
      <Nav aria-label="Example 1" p="6" className="bg-blue-100 rounded">
        <Text>p=&quot;6&quot; - Padding all sides</Text>
      </Nav>

      <Nav aria-label="Example 2" px="8" py="2" className="bg-green-100 rounded">
        <Text>px=&quot;8&quot; py=&quot;2&quot; - Different horizontal and vertical padding</Text>
      </Nav>

      <Nav aria-label="Example 3" pt="8" pb="2" pl="4" pr="12" className="bg-yellow-100 rounded">
        <Text>
          pt=&quot;8&quot; pb=&quot;2&quot; pl=&quot;4&quot; pr=&quot;12&quot; - Individual sides
        </Text>
      </Nav>

      <Box className="bg-gray-200 p-2 rounded">
        <Nav aria-label="Example 4" m="4" p="4" className="bg-purple-100 rounded">
          <Text>m=&quot;4&quot; - Margin on all sides (visible against gray background)</Text>
        </Nav>
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
    'aria-label': 'Test navigation',
    'data-testid': 'main-nav',
    p: '4',
    className: 'bg-[rgb(var(--muted))] rounded-lg',
    children: <Text>This nav has a data-testid for automated testing.</Text>,
  },
};

/** Skip link integration */
export const SkipLinkExample: Story = {
  render: () => (
    <Stack gap="0">
      <Link
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:p-4 focus:bg-[rgb(var(--background))]"
      >
        Skip to main content
      </Link>

      <Nav aria-label="Main navigation" px="6" py="4" className="bg-[rgb(var(--muted))]">
        <Flex justify="between" align="center">
          <Text weight="bold">Logo</Text>
          <Flex gap="4">
            <Link href="/">Home</Link>
            <Link href="/about">About</Link>
            <Link href="/contact">Contact</Link>
          </Flex>
        </Flex>
      </Nav>

      <Box id="main-content" p="8" className="min-h-[200px]">
        <Text>Main content starts here. Press Tab on page load to see skip link.</Text>
      </Box>
    </Stack>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Navigation with a skip link that allows keyboard users to bypass navigation and jump directly to main content.',
      },
    },
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
                Nav elements are announced as &quot;navigation&quot; landmarks by screen readers
              </Text>
            </ListItem>
            <ListItem>
              <Text size="sm">aria-label distinguishes multiple navigation regions on a page</Text>
            </ListItem>
            <ListItem>
              <Text size="sm">Users can jump directly to nav using landmark navigation</Text>
            </ListItem>
            <ListItem>
              <Text size="sm">Contains lists of links with proper semantic structure</Text>
            </ListItem>
          </List>
        </Stack>
      </Box>

      <Nav aria-label="Primary navigation" p="4" className="bg-[rgb(var(--muted))] rounded-lg">
        <Stack gap="2">
          <VisuallyHidden>
            <Heading level={2}>Primary Navigation</Heading>
          </VisuallyHidden>
          <List ordered={false} styleType="none" gap="2" role="list">
            <ListItem>
              <Link href="/">Home</Link>
            </ListItem>
            <ListItem>
              <Link href="/products">Products</Link>
            </ListItem>
            <ListItem>
              <Link href="/contact">Contact</Link>
            </ListItem>
          </List>
        </Stack>
      </Nav>

      <Text size="sm" color="muted-foreground">
        Screen readers will announce: &quot;Primary navigation, navigation landmark, list with 3
        items&quot;
      </Text>
    </Stack>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates how screen readers interpret the nav element and its aria-label.',
      },
    },
  },
};

/** Social media links */
export const SocialLinks: Story = {
  render: () => (
    <Nav aria-label="Social media links" p="4">
      <Flex gap="4" justify="center">
        <Link href="https://twitter.com" external aria-label="Twitter">
          <Text>𝕏</Text>
        </Link>
        <Link href="https://github.com" external aria-label="GitHub">
          <Text>GH</Text>
        </Link>
        <Link href="https://linkedin.com" external aria-label="LinkedIn">
          <Text>in</Text>
        </Link>
        <Link href="https://youtube.com" external aria-label="YouTube">
          <Text>YT</Text>
        </Link>
      </Flex>
    </Nav>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Social media navigation links. Each icon link has an aria-label for screen readers.',
      },
    },
  },
};

/** Documentation navigation with active state */
export const DocumentationNav: Story = {
  render: () => (
    <Box className="w-64">
      <Nav aria-label="Documentation" p="4">
        <Stack gap="4">
          <Stack gap="2">
            <Text size="sm" weight="bold">
              Getting Started
            </Text>
            <List ordered={false} styleType="none" gap="1" className="ml-2">
              <ListItem>
                <Link
                  href="/docs/intro"
                  underline="none"
                  className="flex py-1 text-sm text-[rgb(var(--primary))]"
                  aria-current="page"
                >
                  Introduction
                </Link>
              </ListItem>
              <ListItem>
                <Link
                  href="/docs/install"
                  underline="none"
                  className="flex py-1 text-sm hover:text-[rgb(var(--primary))]"
                >
                  Installation
                </Link>
              </ListItem>
              <ListItem>
                <Link
                  href="/docs/quickstart"
                  underline="none"
                  className="flex py-1 text-sm hover:text-[rgb(var(--primary))]"
                >
                  Quick Start
                </Link>
              </ListItem>
            </List>
          </Stack>

          <Stack gap="2">
            <Text size="sm" weight="bold">
              Primitives
            </Text>
            <List ordered={false} styleType="none" gap="1" className="ml-2">
              <ListItem>
                <Link
                  href="/docs/box"
                  underline="none"
                  className="flex py-1 text-sm hover:text-[rgb(var(--primary))]"
                >
                  Box
                </Link>
              </ListItem>
              <ListItem>
                <Link
                  href="/docs/flex"
                  underline="none"
                  className="flex py-1 text-sm hover:text-[rgb(var(--primary))]"
                >
                  Flex
                </Link>
              </ListItem>
              <ListItem>
                <Link
                  href="/docs/nav"
                  underline="none"
                  className="flex py-1 text-sm hover:text-[rgb(var(--primary))]"
                >
                  Nav
                </Link>
              </ListItem>
            </List>
          </Stack>
        </Stack>
      </Nav>
    </Box>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Documentation sidebar navigation with hierarchical structure and active page indicator.',
      },
    },
  },
};
