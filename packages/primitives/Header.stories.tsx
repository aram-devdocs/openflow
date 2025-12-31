import type { Meta, StoryObj } from '@storybook/react';
import { Article } from './Article';
import { Box } from './Box';
import { Flex } from './Flex';
import { Header } from './Header';
import { Heading } from './Heading';
import { Link } from './Link';
import { List } from './List';
import { ListItem } from './ListItem';
import { Main } from './Main';
import { Nav } from './Nav';
import { Stack } from './Stack';
import { Text } from './Text';

const meta: Meta<typeof Header> = {
  title: 'Primitives/Header',
  component: Header,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Semantic `<header>` landmark primitive for introductory content. When used as a direct child of body, it becomes a banner landmark (role="banner"). Commonly contains headings, logos, navigation, and search forms.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    'aria-label': {
      control: 'text',
      description: 'Optional accessible label when multiple headers exist',
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
type Story = StoryObj<typeof Header>;

/** Basic site header with logo and navigation */
export const Default: Story = {
  args: {
    children: (
      <Flex justify="between" align="center">
        <Text weight="bold" size="xl">
          Logo
        </Text>
        <Nav aria-label="Main navigation">
          <Flex gap="4">
            <Link href="#">Home</Link>
            <Link href="#">About</Link>
            <Link href="#">Contact</Link>
          </Flex>
        </Nav>
      </Flex>
    ),
  },
};

/** Header with padding */
export const WithPadding: Story = {
  args: {
    p: '4',
    className: 'bg-[rgb(var(--muted))]',
    children: (
      <Flex justify="between" align="center">
        <Text weight="bold" size="xl">
          Brand
        </Text>
        <Nav aria-label="Main navigation">
          <Flex gap="4">
            <Link href="#">Products</Link>
            <Link href="#">Pricing</Link>
            <Link href="#">Docs</Link>
          </Flex>
        </Nav>
      </Flex>
    ),
  },
};

/** Header with responsive padding */
export const ResponsivePadding: Story = {
  render: () => (
    <Header
      p={{ base: '3', md: '4', lg: '6' }}
      className="bg-[rgb(var(--muted))] border-b border-[rgb(var(--border))]"
    >
      <Flex justify="between" align="center">
        <Text weight="bold" size="xl">
          Responsive Header
        </Text>
        <Text size="sm" color="muted-foreground">
          Resize to see padding change: p-3 → p-4 → p-6
        </Text>
      </Flex>
    </Header>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Header padding adjusts based on viewport width using responsive props.',
      },
    },
  },
};

/** Sticky header that stays at top while scrolling */
export const StickyHeader: Story = {
  render: () => (
    <Stack gap="0" className="h-96 overflow-auto">
      <Header
        px="4"
        py="3"
        className="sticky top-0 z-50 bg-white dark:bg-[rgb(var(--background))] border-b border-[rgb(var(--border))] shadow-sm"
      >
        <Flex justify="between" align="center">
          <Text weight="bold" size="lg">
            Sticky Logo
          </Text>
          <Nav aria-label="Main navigation">
            <Flex gap="4">
              <Link href="#">Home</Link>
              <Link href="#">About</Link>
              <Link href="#">Contact</Link>
            </Flex>
          </Nav>
        </Flex>
      </Header>

      <Main p="4">
        <Stack gap="4">
          <Heading level={1}>Main Content</Heading>
          {Array.from({ length: 10 }).map((_, i) => (
            <Text key={i} as="p">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
              incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
              exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
            </Text>
          ))}
        </Stack>
      </Main>
    </Stack>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Header with sticky positioning stays visible while scrolling. Scroll within this container to see the effect.',
      },
    },
  },
};

/** Header with logo, search, and navigation */
export const FullFeaturedHeader: Story = {
  render: () => (
    <Header px={{ base: '4', lg: '8' }} py="4" className="border-b border-[rgb(var(--border))]">
      <Flex justify="between" align="center" gap="4">
        {/* Logo */}
        <Flex align="center" gap="2" className="shrink-0">
          <Box className="w-8 h-8 bg-[rgb(var(--primary))] rounded-md" />
          <Text weight="bold" size="lg">
            OpenFlow
          </Text>
        </Flex>

        {/* Search (hidden on mobile) */}
        <Box className="hidden md:flex flex-1 max-w-md mx-4">
          <Box className="w-full h-9 bg-[rgb(var(--muted))] rounded-md border border-[rgb(var(--border))]" />
        </Box>

        {/* Navigation */}
        <Nav aria-label="Main navigation">
          <Flex gap="4" align="center">
            <Link href="#" className="hidden sm:inline">
              Docs
            </Link>
            <Link href="#" className="hidden sm:inline">
              Pricing
            </Link>
            <Box className="w-8 h-8 bg-[rgb(var(--muted))] rounded-full" />
          </Flex>
        </Nav>
      </Flex>
    </Header>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'A full-featured header with logo, search bar, and navigation that adapts to different screen sizes.',
      },
    },
  },
};

/** Article header with title and metadata */
export const ArticleHeader: Story = {
  render: () => (
    <Article>
      <Header mb="6">
        <Stack gap="2">
          <Text size="sm" color="muted-foreground" className="uppercase tracking-wide">
            Tutorial
          </Text>
          <Heading level={1}>Getting Started with React Primitives</Heading>
          <Flex gap="4" className="flex-wrap">
            <Text size="sm" color="muted-foreground">
              By Jane Developer
            </Text>
            <Text size="sm" color="muted-foreground">
              •
            </Text>
            <Text size="sm" color="muted-foreground">
              January 15, 2025
            </Text>
            <Text size="sm" color="muted-foreground">
              •
            </Text>
            <Text size="sm" color="muted-foreground">
              5 min read
            </Text>
          </Flex>
        </Stack>
      </Header>
      <Text as="p">Article content goes here...</Text>
    </Article>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Headers can be used within articles for title and metadata. Note: Article headers are not banner landmarks.',
      },
    },
  },
};

/** Minimal header */
export const MinimalHeader: Story = {
  render: () => (
    <Header py="3" className="border-b border-[rgb(var(--border))]">
      <Flex justify="center">
        <Text weight="bold" size="lg">
          Simple Header
        </Text>
      </Flex>
    </Header>
  ),
};

/** Header with dropdown navigation */
export const HeaderWithDropdowns: Story = {
  render: () => (
    <Header px="6" py="4" className="bg-[rgb(var(--background))] shadow-sm">
      <Flex justify="between" align="center">
        <Text weight="bold" size="xl">
          Company
        </Text>

        <Nav aria-label="Main navigation">
          <Flex gap="6" align="center">
            <Box className="relative">
              <Text weight="medium" className="cursor-pointer">
                Products ▾
              </Text>
            </Box>
            <Box className="relative">
              <Text weight="medium" className="cursor-pointer">
                Solutions ▾
              </Text>
            </Box>
            <Link href="#" weight="medium">
              Pricing
            </Link>
            <Link href="#" weight="medium">
              Resources
            </Link>
          </Flex>
        </Nav>

        <Flex gap="3">
          <Link href="#">Sign In</Link>
          <Box className="px-4 py-2 bg-[rgb(var(--primary))] rounded-md">
            <Text className="text-white" size="sm" weight="medium">
              Get Started
            </Text>
          </Box>
        </Flex>
      </Flex>
    </Header>
  ),
  parameters: {
    docs: {
      description: {
        story: 'A header with dropdown menus for navigation (dropdowns indicated with ▾).',
      },
    },
  },
};

/** Mobile-friendly header with hamburger menu placeholder */
export const MobileHeader: Story = {
  render: () => (
    <Header px="4" py="3" className="border-b border-[rgb(var(--border))]">
      <Flex justify="between" align="center">
        {/* Hamburger menu placeholder */}
        <Box className="w-8 h-8 flex flex-col justify-center gap-1 cursor-pointer md:hidden">
          <Box className="w-5 h-0.5 bg-current" />
          <Box className="w-5 h-0.5 bg-current" />
          <Box className="w-5 h-0.5 bg-current" />
        </Box>

        {/* Logo */}
        <Text weight="bold" size="lg" className="md:order-first">
          Brand
        </Text>

        {/* Desktop nav */}
        <Nav aria-label="Main navigation" className="hidden md:block">
          <Flex gap="4">
            <Link href="#">Home</Link>
            <Link href="#">Products</Link>
            <Link href="#">About</Link>
            <Link href="#">Contact</Link>
          </Flex>
        </Nav>

        {/* User menu */}
        <Box className="w-8 h-8 bg-[rgb(var(--muted))] rounded-full" />
      </Flex>
    </Header>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Mobile-optimized header showing hamburger menu on small screens and full navigation on larger screens.',
      },
    },
  },
};

/** Dashboard header with breadcrumbs */
export const DashboardHeader: Story = {
  render: () => (
    <Header px="6" py="4" className="border-b border-[rgb(var(--border))]">
      <Stack gap="2">
        {/* Breadcrumb navigation */}
        <Nav aria-label="Breadcrumb">
          <Flex gap="2" className="text-sm">
            <Link href="#" color="muted-foreground">
              Dashboard
            </Link>
            <Text color="muted-foreground">/</Text>
            <Link href="#" color="muted-foreground">
              Projects
            </Link>
            <Text color="muted-foreground">/</Text>
            <Text>Current Project</Text>
          </Flex>
        </Nav>

        {/* Title and actions */}
        <Flex justify="between" align="center">
          <Heading level={1} size="2xl">
            Current Project
          </Heading>
          <Flex gap="2">
            <Box className="px-3 py-1.5 border border-[rgb(var(--border))] rounded-md">
              <Text size="sm">Edit</Text>
            </Box>
            <Box className="px-3 py-1.5 bg-[rgb(var(--primary))] rounded-md">
              <Text size="sm" className="text-white">
                Save
              </Text>
            </Box>
          </Flex>
        </Flex>
      </Stack>
    </Header>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Dashboard-style header with breadcrumb navigation and action buttons.',
      },
    },
  },
};

/** Card header */
export const CardHeader: Story = {
  render: () => (
    <Box className="w-80 border border-[rgb(var(--border))] rounded-lg overflow-hidden">
      <Header p="4" className="border-b border-[rgb(var(--border))] bg-[rgb(var(--muted))]/50">
        <Flex justify="between" align="center">
          <Heading level={3} size="base">
            Card Title
          </Heading>
          <Box className="w-6 h-6 flex items-center justify-center cursor-pointer">
            <Text>⋯</Text>
          </Box>
        </Flex>
      </Header>
      <Box p="4">
        <Text as="p">
          Card content goes here. This demonstrates using Header within a card component.
        </Text>
      </Box>
    </Box>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Headers can be used within cards for consistent sectioning.',
      },
    },
  },
};

/** Multiple headers with labels */
export const MultipleHeaders: Story = {
  render: () => (
    <Stack gap="6">
      <Box p="4" className="bg-amber-100 border border-amber-300 rounded-lg">
        <Text size="sm">
          <strong>Accessibility Note:</strong> When multiple header elements exist on a page, use
          aria-label to help screen reader users distinguish between them.
        </Text>
      </Box>

      <Stack gap="4">
        <Header
          aria-label="Site header"
          px="4"
          py="3"
          className="bg-[rgb(var(--muted))] border border-[rgb(var(--border))] rounded-lg"
        >
          <Flex justify="between" align="center">
            <Text weight="bold">Site Header</Text>
            <Text size="sm" color="muted-foreground">
              Banner landmark (direct child of body)
            </Text>
          </Flex>
        </Header>

        <Article className="border border-[rgb(var(--border))] rounded-lg overflow-hidden">
          <Header
            aria-label="Article header"
            p="4"
            className="border-b border-[rgb(var(--border))]"
          >
            <Flex justify="between" align="center">
              <Text weight="bold">Article Header</Text>
              <Text size="sm" color="muted-foreground">
                Not a landmark (inside article)
              </Text>
            </Flex>
          </Header>
          <Box p="4">
            <Text as="p">Article content...</Text>
          </Box>
        </Article>
      </Stack>
    </Stack>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Headers behave differently depending on their context. Page-level headers are banner landmarks, while headers inside article/section are not.',
      },
    },
  },
};

/** All spacing props demonstration */
export const AllSpacingProps: Story = {
  render: () => (
    <Stack gap="4">
      <Header p="6" className="bg-blue-100 rounded">
        <Text>p=&quot;6&quot; - Padding all sides</Text>
      </Header>

      <Header px="8" py="2" className="bg-green-100 rounded">
        <Text>px=&quot;8&quot; py=&quot;2&quot; - Different horizontal and vertical padding</Text>
      </Header>

      <Header pt="8" pb="2" pl="4" pr="12" className="bg-yellow-100 rounded">
        <Text>
          pt=&quot;8&quot; pb=&quot;2&quot; pl=&quot;4&quot; pr=&quot;12&quot; - Individual sides
        </Text>
      </Header>

      <Box className="bg-gray-200 p-2 rounded">
        <Header m="4" p="4" className="bg-purple-100 rounded">
          <Text>m=&quot;4&quot; - Margin on all sides (visible against gray background)</Text>
        </Header>
      </Box>

      <Box className="bg-gray-200 p-2 rounded">
        <Header mx="8" p="4" className="bg-pink-100 rounded">
          <Text>mx=&quot;8&quot; - Horizontal margin only</Text>
        </Header>
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
    'data-testid': 'page-header',
    p: '4',
    className: 'bg-[rgb(var(--muted))]',
    children: <Text as="p">This header has a data-testid for automated testing.</Text>,
  },
};

/** Accessibility demonstration */
export const AccessibilityDemo: Story = {
  render: () => (
    <Stack gap="6">
      <Box p="4" className="bg-amber-100 border border-amber-300 rounded-lg">
        <Text size="sm">
          <strong>Accessibility Note:</strong> The `&lt;header&gt;` element becomes a banner
          landmark (role=&quot;banner&quot;) when it&apos;s a direct child of `&lt;body&gt;`. Screen
          reader users can navigate directly to the banner using landmark navigation. Only one
          banner should exist per page.
        </Text>
      </Box>

      <Stack gap="4">
        <Header px="4" py="3" className="border-b border-[rgb(var(--border))]">
          <Flex justify="between" align="center">
            <Text weight="bold" size="lg">
              Site Title
            </Text>
            <Nav aria-label="Primary navigation">
              <List ordered={false} styleType="none" gap="4" className="flex">
                <ListItem>
                  <Link href="#">Home</Link>
                </ListItem>
                <ListItem>
                  <Link href="#">About</Link>
                </ListItem>
                <ListItem>
                  <Link href="#">Contact</Link>
                </ListItem>
              </List>
            </Nav>
          </Flex>
        </Header>

        <Main p="4">
          <Stack gap="4">
            <Heading level={1}>Page Content</Heading>
            <Text as="p">
              The header above is a banner landmark. Screen readers announce: &quot;banner&quot;
              when users navigate to it. Use semantic header elements to help users understand page
              structure.
            </Text>
          </Stack>
        </Main>
      </Stack>
    </Stack>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'This demo shows how the Header primitive creates proper landmark structure for assistive technologies.',
      },
    },
  },
};

/** Centered header layout */
export const CenteredHeader: Story = {
  render: () => (
    <Header py="4" className="border-b border-[rgb(var(--border))]">
      <Flex direction="column" align="center" gap="4">
        <Box className="w-12 h-12 bg-[rgb(var(--primary))] rounded-full" />
        <Text weight="bold" size="xl">
          Centered Brand
        </Text>
        <Nav aria-label="Main navigation">
          <Flex gap="6">
            <Link href="#">Home</Link>
            <Link href="#">Products</Link>
            <Link href="#">About</Link>
            <Link href="#">Contact</Link>
          </Flex>
        </Nav>
      </Flex>
    </Header>
  ),
};

/** Full-width header with container */
export const FullWidthWithContainer: Story = {
  render: () => (
    <Header className="bg-[rgb(var(--muted))] border-b border-[rgb(var(--border))]">
      <Box px={{ base: '4', lg: '8' }} py="4" className="max-w-7xl mx-auto">
        <Flex justify="between" align="center">
          <Text weight="bold" size="lg">
            Full Width Header
          </Text>
          <Nav aria-label="Main navigation">
            <Flex gap="4">
              <Link href="#">Home</Link>
              <Link href="#">About</Link>
            </Flex>
          </Nav>
        </Flex>
      </Box>
    </Header>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Header spans full width with a contained inner wrapper for max-width content alignment.',
      },
    },
  },
};

/** Transparent header for hero sections */
export const TransparentHeader: Story = {
  render: () => (
    <Box className="relative h-64 bg-gradient-to-b from-blue-500 to-blue-700">
      <Header px="6" py="4" className="absolute top-0 left-0 right-0 bg-transparent">
        <Flex justify="between" align="center">
          <Text weight="bold" size="lg" className="text-white">
            Transparent Header
          </Text>
          <Nav aria-label="Main navigation">
            <Flex gap="4">
              <Link href="#" className="text-white hover:text-white/80">
                Home
              </Link>
              <Link href="#" className="text-white hover:text-white/80">
                About
              </Link>
              <Link href="#" className="text-white hover:text-white/80">
                Contact
              </Link>
            </Flex>
          </Nav>
        </Flex>
      </Header>
      <Flex className="h-full items-center justify-center">
        <Text size="3xl" weight="bold" className="text-white">
          Hero Content
        </Text>
      </Flex>
    </Box>
  ),
  parameters: {
    docs: {
      description: {
        story: 'A transparent header that overlays hero content.',
      },
    },
  },
};
