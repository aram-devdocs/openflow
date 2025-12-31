import type { Meta, StoryObj } from '@storybook/react';
import { Article } from './Article';
import { Box } from './Box';
import { Flex } from './Flex';
import { Footer } from './Footer';
import { Header } from './Header';
import { Heading } from './Heading';
import { Link } from './Link';
import { List } from './List';
import { ListItem } from './ListItem';
import { Main } from './Main';
import { Nav } from './Nav';
import { Stack } from './Stack';
import { Text } from './Text';

const meta: Meta<typeof Footer> = {
  title: 'Primitives/Footer',
  component: Footer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Semantic `<footer>` landmark primitive for closing content. When used as a direct child of body, it becomes a contentinfo landmark (role="contentinfo"). Commonly contains copyright, legal links, contact information, and site navigation.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    'aria-label': {
      control: 'text',
      description: 'Optional accessible label when multiple footers exist',
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
type Story = StoryObj<typeof Footer>;

/** Basic site footer with copyright */
export const Default: Story = {
  args: {
    children: (
      <Flex justify="between" align="center">
        <Text color="muted-foreground" size="sm">
          &copy; 2025 Company Name. All rights reserved.
        </Text>
        <Nav aria-label="Footer navigation">
          <Flex gap="4">
            <Link href="#" size="sm">
              Privacy
            </Link>
            <Link href="#" size="sm">
              Terms
            </Link>
            <Link href="#" size="sm">
              Contact
            </Link>
          </Flex>
        </Nav>
      </Flex>
    ),
  },
};

/** Footer with padding */
export const WithPadding: Story = {
  args: {
    p: '4',
    className: 'bg-[rgb(var(--muted))]',
    children: (
      <Flex justify="between" align="center">
        <Text color="muted-foreground" size="sm">
          &copy; 2025 Brand. All rights reserved.
        </Text>
        <Nav aria-label="Footer links">
          <Flex gap="4">
            <Link href="#" size="sm">
              Help
            </Link>
            <Link href="#" size="sm">
              Support
            </Link>
          </Flex>
        </Nav>
      </Flex>
    ),
  },
};

/** Footer with responsive padding */
export const ResponsivePadding: Story = {
  render: () => (
    <Footer
      p={{ base: '3', md: '4', lg: '6' }}
      className="bg-[rgb(var(--muted))] border-t border-[rgb(var(--border))]"
    >
      <Flex justify="between" align="center">
        <Text color="muted-foreground" size="sm">
          Responsive Footer
        </Text>
        <Text size="sm" color="muted-foreground">
          Resize to see padding change: p-3 → p-4 → p-6
        </Text>
      </Flex>
    </Footer>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Footer padding adjusts based on viewport width using responsive props.',
      },
    },
  },
};

/** Full-featured multi-column footer */
export const FullFeaturedFooter: Story = {
  render: () => (
    <Footer
      px={{ base: '4', lg: '8' }}
      py={{ base: '8', md: '12' }}
      className="bg-[rgb(var(--muted))] border-t border-[rgb(var(--border))]"
    >
      <Stack gap="8">
        {/* Main footer content */}
        <Flex
          direction={{ base: 'column', md: 'row' }}
          gap={{ base: '8', md: '12' }}
          justify="between"
        >
          {/* Company info */}
          <Stack gap="4" className="max-w-xs">
            <Text weight="bold" size="lg">
              OpenFlow
            </Text>
            <Text size="sm" color="muted-foreground">
              AI Task Orchestration Desktop Application. Build reliable software through spec-driven
              workflows.
            </Text>
          </Stack>

          {/* Navigation columns */}
          <Flex gap={{ base: '8', md: '12' }} wrap="wrap">
            <Stack gap="3">
              <Text weight="semibold" size="sm">
                Product
              </Text>
              <Nav aria-label="Product links">
                <Stack gap="2">
                  <Link href="#" size="sm" color="muted-foreground">
                    Features
                  </Link>
                  <Link href="#" size="sm" color="muted-foreground">
                    Pricing
                  </Link>
                  <Link href="#" size="sm" color="muted-foreground">
                    Changelog
                  </Link>
                  <Link href="#" size="sm" color="muted-foreground">
                    Roadmap
                  </Link>
                </Stack>
              </Nav>
            </Stack>

            <Stack gap="3">
              <Text weight="semibold" size="sm">
                Resources
              </Text>
              <Nav aria-label="Resource links">
                <Stack gap="2">
                  <Link href="#" size="sm" color="muted-foreground">
                    Documentation
                  </Link>
                  <Link href="#" size="sm" color="muted-foreground">
                    Guides
                  </Link>
                  <Link href="#" size="sm" color="muted-foreground">
                    API Reference
                  </Link>
                  <Link href="#" size="sm" color="muted-foreground">
                    Blog
                  </Link>
                </Stack>
              </Nav>
            </Stack>

            <Stack gap="3">
              <Text weight="semibold" size="sm">
                Company
              </Text>
              <Nav aria-label="Company links">
                <Stack gap="2">
                  <Link href="#" size="sm" color="muted-foreground">
                    About
                  </Link>
                  <Link href="#" size="sm" color="muted-foreground">
                    Careers
                  </Link>
                  <Link href="#" size="sm" color="muted-foreground">
                    Contact
                  </Link>
                  <Link href="#" size="sm" color="muted-foreground">
                    Press
                  </Link>
                </Stack>
              </Nav>
            </Stack>
          </Flex>
        </Flex>

        {/* Bottom bar */}
        <Flex
          direction={{ base: 'column', sm: 'row' }}
          justify="between"
          align="center"
          gap="4"
          pt="6"
          className="border-t border-[rgb(var(--border))]"
        >
          <Text size="sm" color="muted-foreground">
            &copy; 2025 OpenFlow. All rights reserved.
          </Text>
          <Flex gap="4">
            <Link href="#" size="sm" color="muted-foreground">
              Privacy Policy
            </Link>
            <Link href="#" size="sm" color="muted-foreground">
              Terms of Service
            </Link>
            <Link href="#" size="sm" color="muted-foreground">
              Cookie Settings
            </Link>
          </Flex>
        </Flex>
      </Stack>
    </Footer>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'A comprehensive footer with company info, navigation columns, and legal links. Adapts layout for different screen sizes.',
      },
    },
  },
};

/** Article footer with tags and author info */
export const ArticleFooter: Story = {
  render: () => (
    <Article>
      <Header mb="4">
        <Heading level={1}>Article Title</Heading>
      </Header>
      <Text as="p" className="mb-4">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut
        labore et dolore magna aliqua.
      </Text>
      <Footer
        mt="8"
        pt="6"
        className="border-t border-[rgb(var(--border))]"
        aria-label="Article footer"
      >
        <Stack gap="4">
          {/* Tags */}
          <Flex gap="2" wrap="wrap">
            <Text size="sm" color="muted-foreground">
              Tags:
            </Text>
            <Link href="#" size="sm">
              React
            </Link>
            <Link href="#" size="sm">
              TypeScript
            </Link>
            <Link href="#" size="sm">
              Accessibility
            </Link>
          </Flex>

          {/* Author */}
          <Flex gap="3" align="center">
            <Box className="w-10 h-10 bg-[rgb(var(--muted))] rounded-full" />
            <Stack gap="0">
              <Text weight="medium" size="sm">
                Jane Developer
              </Text>
              <Text size="xs" color="muted-foreground">
                Published on January 15, 2025
              </Text>
            </Stack>
          </Flex>
        </Stack>
      </Footer>
    </Article>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Footers can be used within articles for metadata, tags, and author information. Note: Article footers are not contentinfo landmarks.',
      },
    },
  },
};

/** Minimal footer */
export const MinimalFooter: Story = {
  render: () => (
    <Footer py="4" className="border-t border-[rgb(var(--border))]">
      <Flex justify="center">
        <Text size="sm" color="muted-foreground">
          &copy; 2025 Company Name
        </Text>
      </Flex>
    </Footer>
  ),
};

/** Footer with social links */
export const FooterWithSocialLinks: Story = {
  render: () => (
    <Footer px="6" py="6" className="bg-[rgb(var(--muted))]">
      <Stack gap="4" align="center">
        <Text weight="semibold">Follow Us</Text>
        <Nav aria-label="Social media links">
          <Flex gap="4">
            <Link href="#" aria-label="Twitter">
              <Box className="w-8 h-8 bg-[rgb(var(--foreground))] rounded-full flex items-center justify-center">
                <Text className="text-white" size="xs">
                  X
                </Text>
              </Box>
            </Link>
            <Link href="#" aria-label="GitHub">
              <Box className="w-8 h-8 bg-[rgb(var(--foreground))] rounded-full flex items-center justify-center">
                <Text className="text-white" size="xs">
                  GH
                </Text>
              </Box>
            </Link>
            <Link href="#" aria-label="LinkedIn">
              <Box className="w-8 h-8 bg-[rgb(var(--foreground))] rounded-full flex items-center justify-center">
                <Text className="text-white" size="xs">
                  in
                </Text>
              </Box>
            </Link>
          </Flex>
        </Nav>
        <Text size="sm" color="muted-foreground">
          &copy; 2025 Company Name
        </Text>
      </Stack>
    </Footer>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Footer with social media links (using aria-label for icon-only links).',
      },
    },
  },
};

/** Footer with newsletter signup */
export const FooterWithNewsletter: Story = {
  render: () => (
    <Footer
      px={{ base: '4', md: '8' }}
      py={{ base: '8', md: '12' }}
      className="bg-[rgb(var(--muted))]"
    >
      <Stack gap="8">
        <Flex direction={{ base: 'column', md: 'row' }} gap="8" justify="between" align="start">
          {/* Newsletter */}
          <Stack gap="4" className="max-w-md">
            <Heading level={3} size="lg">
              Subscribe to our newsletter
            </Heading>
            <Text size="sm" color="muted-foreground">
              Get the latest updates and articles delivered straight to your inbox.
            </Text>
            <Flex gap="2">
              <Box className="flex-1 h-10 bg-white border border-[rgb(var(--border))] rounded-md" />
              <Box className="px-4 h-10 bg-[rgb(var(--primary))] rounded-md flex items-center">
                <Text size="sm" className="text-white" weight="medium">
                  Subscribe
                </Text>
              </Box>
            </Flex>
          </Stack>

          {/* Quick links */}
          <Nav aria-label="Footer links">
            <Flex gap="8">
              <Stack gap="2">
                <Text weight="semibold" size="sm">
                  Quick Links
                </Text>
                <Link href="#" size="sm" color="muted-foreground">
                  Home
                </Link>
                <Link href="#" size="sm" color="muted-foreground">
                  About
                </Link>
                <Link href="#" size="sm" color="muted-foreground">
                  Contact
                </Link>
              </Stack>
            </Flex>
          </Nav>
        </Flex>

        <Flex justify="center" pt="4" className="border-t border-[rgb(var(--border))]">
          <Text size="sm" color="muted-foreground">
            &copy; 2025 Newsletter Co. All rights reserved.
          </Text>
        </Flex>
      </Stack>
    </Footer>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Footer with a newsletter signup form.',
      },
    },
  },
};

/** Sticky footer that stays at bottom */
export const StickyFooter: Story = {
  render: () => (
    <Stack gap="0" className="min-h-64">
      <Main p="4" className="flex-1">
        <Stack gap="4">
          <Heading level={1}>Page Content</Heading>
          <Text as="p">This content area can be short, but the footer stays at the bottom.</Text>
        </Stack>
      </Main>

      <Footer
        px="4"
        py="3"
        className="sticky bottom-0 bg-white dark:bg-[rgb(var(--background))] border-t border-[rgb(var(--border))] shadow-[0_-2px_4px_rgba(0,0,0,0.05)]"
      >
        <Flex justify="between" align="center">
          <Text size="sm" color="muted-foreground">
            &copy; 2025 Company
          </Text>
          <Flex gap="4">
            <Link href="#" size="sm">
              Help
            </Link>
            <Link href="#" size="sm">
              Settings
            </Link>
          </Flex>
        </Flex>
      </Footer>
    </Stack>
  ),
  parameters: {
    docs: {
      description: {
        story: 'A sticky footer that stays at the bottom of the viewport.',
      },
    },
  },
};

/** Card footer */
export const CardFooter: Story = {
  render: () => (
    <Box className="w-80 border border-[rgb(var(--border))] rounded-lg overflow-hidden">
      <Header p="4" className="border-b border-[rgb(var(--border))]">
        <Heading level={3} size="base">
          Card Title
        </Heading>
      </Header>
      <Box p="4">
        <Text as="p">
          Card content goes here. This demonstrates using Footer within a card component.
        </Text>
      </Box>
      <Footer p="4" className="border-t border-[rgb(var(--border))] bg-[rgb(var(--muted))]/50">
        <Flex justify="end" gap="2">
          <Box className="px-3 py-1.5 border border-[rgb(var(--border))] rounded-md">
            <Text size="sm">Cancel</Text>
          </Box>
          <Box className="px-3 py-1.5 bg-[rgb(var(--primary))] rounded-md">
            <Text size="sm" className="text-white">
              Save
            </Text>
          </Box>
        </Flex>
      </Footer>
    </Box>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Footers can be used within cards for action buttons.',
      },
    },
  },
};

/** Multiple footers with labels */
export const MultipleFooters: Story = {
  render: () => (
    <Stack gap="6">
      <Box p="4" className="bg-amber-100 border border-amber-300 rounded-lg">
        <Text size="sm">
          <strong>Accessibility Note:</strong> When multiple footer elements exist on a page, use
          aria-label to help screen reader users distinguish between them.
        </Text>
      </Box>

      <Stack gap="4">
        <Article className="border border-[rgb(var(--border))] rounded-lg overflow-hidden">
          <Header p="4" className="border-b border-[rgb(var(--border))]">
            <Heading level={2} size="lg">
              Article One
            </Heading>
          </Header>
          <Box p="4">
            <Text as="p">Article content...</Text>
          </Box>
          <Footer
            aria-label="Article one footer"
            p="4"
            className="border-t border-[rgb(var(--border))] bg-[rgb(var(--muted))]/50"
          >
            <Flex justify="between" align="center">
              <Text size="sm" color="muted-foreground">
                Article Footer
              </Text>
              <Text size="sm" color="muted-foreground">
                Not a contentinfo landmark (inside article)
              </Text>
            </Flex>
          </Footer>
        </Article>

        <Footer
          aria-label="Site footer"
          px="4"
          py="3"
          className="bg-[rgb(var(--muted))] border border-[rgb(var(--border))] rounded-lg"
        >
          <Flex justify="between" align="center">
            <Text weight="medium">Site Footer</Text>
            <Text size="sm" color="muted-foreground">
              Contentinfo landmark (direct child of body)
            </Text>
          </Flex>
        </Footer>
      </Stack>
    </Stack>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Footers behave differently depending on their context. Page-level footers are contentinfo landmarks, while footers inside article/section are not.',
      },
    },
  },
};

/** Dark themed footer */
export const DarkFooter: Story = {
  render: () => (
    <Footer px={{ base: '4', md: '8' }} py="8" className="bg-gray-900">
      <Stack gap="6">
        <Flex direction={{ base: 'column', md: 'row' }} gap="8" justify="between">
          <Stack gap="3" className="max-w-xs">
            <Text weight="bold" size="lg" className="text-white">
              Company
            </Text>
            <Text size="sm" className="text-gray-400">
              Building the future of software development with AI-powered tools.
            </Text>
          </Stack>

          <Nav aria-label="Footer navigation">
            <Flex gap="8">
              <Stack gap="2">
                <Text weight="semibold" size="sm" className="text-white">
                  Links
                </Text>
                <Link href="#" size="sm" className="text-gray-400 hover:text-white">
                  About
                </Link>
                <Link href="#" size="sm" className="text-gray-400 hover:text-white">
                  Blog
                </Link>
                <Link href="#" size="sm" className="text-gray-400 hover:text-white">
                  Careers
                </Link>
              </Stack>
            </Flex>
          </Nav>
        </Flex>

        <Flex justify="center" pt="6" className="border-t border-gray-800">
          <Text size="sm" className="text-gray-500">
            &copy; 2025 Company. All rights reserved.
          </Text>
        </Flex>
      </Stack>
    </Footer>
  ),
  parameters: {
    docs: {
      description: {
        story: 'A dark-themed footer commonly used on landing pages.',
      },
    },
  },
};

/** All spacing props demonstration */
export const AllSpacingProps: Story = {
  render: () => (
    <Stack gap="4">
      <Footer p="6" className="bg-blue-100 rounded">
        <Text>p=&quot;6&quot; - Padding all sides</Text>
      </Footer>

      <Footer px="8" py="2" className="bg-green-100 rounded">
        <Text>px=&quot;8&quot; py=&quot;2&quot; - Different horizontal and vertical padding</Text>
      </Footer>

      <Footer pt="8" pb="2" pl="4" pr="12" className="bg-yellow-100 rounded">
        <Text>
          pt=&quot;8&quot; pb=&quot;2&quot; pl=&quot;4&quot; pr=&quot;12&quot; - Individual sides
        </Text>
      </Footer>

      <Box className="bg-gray-200 p-2 rounded">
        <Footer m="4" p="4" className="bg-purple-100 rounded">
          <Text>m=&quot;4&quot; - Margin on all sides (visible against gray background)</Text>
        </Footer>
      </Box>

      <Box className="bg-gray-200 p-2 rounded">
        <Footer mx="8" p="4" className="bg-pink-100 rounded">
          <Text>mx=&quot;8&quot; - Horizontal margin only</Text>
        </Footer>
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
    'data-testid': 'page-footer',
    p: '4',
    className: 'bg-[rgb(var(--muted))]',
    children: <Text as="p">This footer has a data-testid for automated testing.</Text>,
  },
};

/** Accessibility demonstration */
export const AccessibilityDemo: Story = {
  render: () => (
    <Stack gap="6">
      <Box p="4" className="bg-amber-100 border border-amber-300 rounded-lg">
        <Text size="sm">
          <strong>Accessibility Note:</strong> The `&lt;footer&gt;` element becomes a contentinfo
          landmark (role=&quot;contentinfo&quot;) when it&apos;s a direct child of `&lt;body&gt;`.
          Screen reader users can navigate directly to the contentinfo using landmark navigation.
          Only one contentinfo should exist per page.
        </Text>
      </Box>

      <Stack gap="0">
        <Header px="4" py="3" className="border-b border-[rgb(var(--border))]">
          <Flex justify="between" align="center">
            <Text weight="bold" size="lg">
              Site Title
            </Text>
            <Nav aria-label="Primary navigation">
              <Flex gap="4">
                <Link href="#">Home</Link>
                <Link href="#">About</Link>
              </Flex>
            </Nav>
          </Flex>
        </Header>

        <Main p="4">
          <Stack gap="4">
            <Heading level={1}>Page Content</Heading>
            <Text as="p">
              The footer below is a contentinfo landmark. Screen readers announce:
              &quot;contentinfo&quot; when users navigate to it. Use semantic footer elements to
              help users understand page structure.
            </Text>
          </Stack>
        </Main>

        <Footer px="4" py="3" className="border-t border-[rgb(var(--border))]">
          <Flex justify="between" align="center">
            <Text size="sm" color="muted-foreground">
              &copy; 2025 Company Name
            </Text>
            <Nav aria-label="Footer navigation">
              <List ordered={false} styleType="none" gap="4" className="flex">
                <ListItem>
                  <Link href="#" size="sm">
                    Privacy
                  </Link>
                </ListItem>
                <ListItem>
                  <Link href="#" size="sm">
                    Terms
                  </Link>
                </ListItem>
              </List>
            </Nav>
          </Flex>
        </Footer>
      </Stack>
    </Stack>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'This demo shows how the Footer primitive creates proper landmark structure for assistive technologies.',
      },
    },
  },
};

/** Centered footer layout */
export const CenteredFooter: Story = {
  render: () => (
    <Footer py="6" className="border-t border-[rgb(var(--border))]">
      <Stack gap="4" align="center">
        <Nav aria-label="Footer navigation">
          <Flex gap="6">
            <Link href="#" size="sm">
              Home
            </Link>
            <Link href="#" size="sm">
              About
            </Link>
            <Link href="#" size="sm">
              Services
            </Link>
            <Link href="#" size="sm">
              Contact
            </Link>
          </Flex>
        </Nav>
        <Text size="sm" color="muted-foreground">
          &copy; 2025 Company Name. All rights reserved.
        </Text>
      </Stack>
    </Footer>
  ),
};

/** Full-width footer with container */
export const FullWidthWithContainer: Story = {
  render: () => (
    <Footer className="bg-[rgb(var(--muted))] border-t border-[rgb(var(--border))]">
      <Box px={{ base: '4', lg: '8' }} py="6" className="max-w-7xl mx-auto">
        <Flex justify="between" align="center">
          <Text size="sm" color="muted-foreground">
            &copy; 2025 Full Width Footer Co.
          </Text>
          <Nav aria-label="Footer navigation">
            <Flex gap="4">
              <Link href="#" size="sm">
                Privacy
              </Link>
              <Link href="#" size="sm">
                Terms
              </Link>
            </Flex>
          </Nav>
        </Flex>
      </Box>
    </Footer>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Footer spans full width with a contained inner wrapper for max-width content alignment.',
      },
    },
  },
};

/** Legal footer with comprehensive links */
export const LegalFooter: Story = {
  render: () => (
    <Footer px={{ base: '4', md: '8' }} py="6" className="border-t border-[rgb(var(--border))]">
      <Flex direction={{ base: 'column', md: 'row' }} gap="4" justify="between" align="center">
        <Text size="xs" color="muted-foreground" className="text-center md:text-left">
          &copy; 2025 Legal Company, Inc. All rights reserved. Use of this site constitutes
          acceptance of our Terms of Service and Privacy Policy.
        </Text>
        <Nav aria-label="Legal links">
          <Flex gap="4" wrap="wrap" justify="center">
            <Link href="#" size="xs" color="muted-foreground">
              Terms of Service
            </Link>
            <Link href="#" size="xs" color="muted-foreground">
              Privacy Policy
            </Link>
            <Link href="#" size="xs" color="muted-foreground">
              Cookie Policy
            </Link>
            <Link href="#" size="xs" color="muted-foreground">
              GDPR
            </Link>
            <Link href="#" size="xs" color="muted-foreground">
              Accessibility
            </Link>
          </Flex>
        </Nav>
      </Flex>
    </Footer>
  ),
  parameters: {
    docs: {
      description: {
        story: 'A legal-focused footer with comprehensive policy links.',
      },
    },
  },
};

/** App footer with version and status */
export const AppFooter: Story = {
  render: () => (
    <Footer px="4" py="2" className="bg-[rgb(var(--muted))] border-t border-[rgb(var(--border))]">
      <Flex justify="between" align="center" className="text-xs">
        <Flex gap="4" align="center">
          <Text color="muted-foreground">Version 1.2.3</Text>
          <Flex gap="1" align="center">
            <Box className="w-2 h-2 bg-green-500 rounded-full" />
            <Text color="muted-foreground">All systems operational</Text>
          </Flex>
        </Flex>
        <Flex gap="4">
          <Link href="#" size="xs" color="muted-foreground">
            Changelog
          </Link>
          <Link href="#" size="xs" color="muted-foreground">
            Documentation
          </Link>
          <Link href="#" size="xs" color="muted-foreground">
            Support
          </Link>
        </Flex>
      </Flex>
    </Footer>
  ),
  parameters: {
    docs: {
      description: {
        story: 'A compact app footer showing version and system status.',
      },
    },
  },
};
