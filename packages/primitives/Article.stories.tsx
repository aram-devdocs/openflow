import type { Meta, StoryObj } from '@storybook/react';
import { Article } from './Article';
import { Box } from './Box';
import { Flex } from './Flex';
import { Heading } from './Heading';
import { Stack } from './Stack';
import { Text } from './Text';

const meta: Meta<typeof Article> = {
  title: 'Primitives/Article',
  component: Article,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Semantic `<article>` landmark primitive for self-contained content. Articles represent independently distributable compositions like blog posts, news articles, forum posts, or product cards.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    'aria-label': {
      control: 'text',
      description: 'Optional accessible label for additional context',
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
type Story = StoryObj<typeof Article>;

/** Basic article with content */
export const Default: Story = {
  args: {
    children: (
      <Stack gap="4">
        <Heading level={2}>Understanding Web Accessibility</Heading>
        <Flex gap="2" align="center">
          <Text size="sm" color="muted-foreground">
            Published on January 15, 2025
          </Text>
          <Text size="sm" color="muted-foreground">
            •
          </Text>
          <Text size="sm" color="muted-foreground">
            5 min read
          </Text>
        </Flex>
        <Text as="p">
          Web accessibility ensures that websites and web applications are usable by everyone,
          including people with disabilities. This article explores the fundamental principles.
        </Text>
      </Stack>
    ),
  },
};

/** Article with padding */
export const WithPadding: Story = {
  args: {
    p: '8',
    className: 'bg-[rgb(var(--muted))] rounded-lg',
    children: (
      <Stack gap="4">
        <Heading level={2}>Padded Article</Heading>
        <Text as="p">This article has padding applied using the p prop.</Text>
      </Stack>
    ),
  },
};

/** Article with responsive padding */
export const ResponsivePadding: Story = {
  render: () => (
    <Article p={{ base: '4', md: '8', lg: '12' }} className="bg-[rgb(var(--muted))] rounded-lg">
      <Stack gap="4">
        <Heading level={2}>Responsive Padding</Heading>
        <Text as="p">
          Resize your browser to see padding change: p-4 (mobile) → p-8 (tablet) → p-12 (desktop).
        </Text>
      </Stack>
    </Article>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Article padding adjusts based on viewport width using responsive props.',
      },
    },
  },
};

/** Blog post layout */
export const BlogPost: Story = {
  render: () => (
    <Article className="max-w-2xl">
      <Stack gap="6">
        <Box>
          <Heading level={1}>The Future of AI in Software Development</Heading>
          <Flex gap="4" align="center" className="mt-3">
            <Flex gap="2" align="center">
              <Box className="w-8 h-8 rounded-full bg-[rgb(var(--primary))]" />
              <Text size="sm" weight="medium">
                Jane Developer
              </Text>
            </Flex>
            <Text size="sm" color="muted-foreground">
              January 15, 2025
            </Text>
          </Flex>
        </Box>

        <Box className="aspect-video bg-[rgb(var(--muted))] rounded-lg" />

        <Stack gap="4">
          <Text as="p" size="lg" color="muted-foreground">
            Artificial intelligence is transforming how we write, test, and maintain software.
            Let&apos;s explore what this means for developers.
          </Text>

          <Heading level={2}>The Rise of AI Assistants</Heading>
          <Text as="p">
            AI-powered coding assistants have become an integral part of modern development
            workflows. From code completion to bug detection, these tools are reshaping our daily
            practices.
          </Text>

          <Heading level={2}>What This Means for Developers</Heading>
          <Text as="p">
            Rather than replacing developers, AI tools are augmenting our capabilities, allowing us
            to focus on higher-level design and architecture decisions.
          </Text>
        </Stack>
      </Stack>
    </Article>
  ),
  parameters: {
    docs: {
      description: {
        story: 'A complete blog post layout demonstrating article structure.',
      },
    },
  },
};

/** News article layout */
export const NewsArticle: Story = {
  render: () => (
    <Article p="6" className="bg-[rgb(var(--muted))] rounded-lg max-w-xl">
      <Stack gap="4">
        <Box className="inline-block bg-red-500 text-white px-2 py-0.5 rounded text-xs font-semibold uppercase">
          Breaking
        </Box>

        <Heading level={2}>Major Technology Announcement Shakes Industry</Heading>

        <Flex gap="2" align="center">
          <Text size="sm" color="muted-foreground">
            Reuters
          </Text>
          <Text size="sm" color="muted-foreground">
            •
          </Text>
          <Text size="sm" color="muted-foreground">
            2 hours ago
          </Text>
        </Flex>

        <Text as="p">
          In a surprise announcement today, a major technology company revealed plans that could
          reshape the entire industry. Experts weigh in on what this means for consumers and
          businesses alike.
        </Text>

        <Text as="p" size="sm" color="muted-foreground">
          Continue reading →
        </Text>
      </Stack>
    </Article>
  ),
};

/** Forum post */
export const ForumPost: Story = {
  render: () => (
    <Article p="4" className="border border-[rgb(var(--border))] rounded-lg">
      <Flex gap="4">
        <Box className="shrink-0">
          <Box className="w-12 h-12 rounded-full bg-[rgb(var(--primary))]" />
        </Box>

        <Stack gap="3" className="flex-1">
          <Flex justify="between" align="center">
            <Flex gap="2" align="center">
              <Text weight="semibold">user_developer_42</Text>
              <Text size="sm" color="muted-foreground">
                • 3 hours ago
              </Text>
            </Flex>
            <Text size="xs" color="muted-foreground">
              #1234
            </Text>
          </Flex>

          <Text as="p">
            Has anyone else experienced issues with the new update? I&apos;m seeing unexpected
            behavior when using the command palette. Steps to reproduce: 1. Open command palette 2.
            Type &quot;settings&quot; 3. Notice the lag.
          </Text>

          <Flex gap="4">
            <Text size="sm" color="muted-foreground">
              👍 12
            </Text>
            <Text size="sm" color="muted-foreground">
              💬 5 replies
            </Text>
          </Flex>
        </Stack>
      </Flex>
    </Article>
  ),
};

/** Product card */
export const ProductCard: Story = {
  render: () => (
    <Article
      className="w-64 bg-[rgb(var(--background))] border border-[rgb(var(--border))] rounded-lg overflow-hidden"
      aria-labelledby="product-name"
    >
      <Box className="aspect-square bg-[rgb(var(--muted))]" />
      <Box p="4">
        <Stack gap="2">
          <Text size="xs" color="muted-foreground" className="uppercase tracking-wide">
            Electronics
          </Text>
          <Heading level={3} id="product-name" size="base">
            Wireless Headphones Pro
          </Heading>
          <Flex justify="between" align="center">
            <Text weight="bold" size="lg">
              $199.99
            </Text>
            <Text size="sm" color="muted-foreground" className="line-through">
              $249.99
            </Text>
          </Flex>
          <Flex gap="1" align="center">
            <Text size="sm">⭐⭐⭐⭐⭐</Text>
            <Text size="xs" color="muted-foreground">
              (128 reviews)
            </Text>
          </Flex>
        </Stack>
      </Box>
    </Article>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Product cards are a common use case for articles. Each card represents an independent item.',
      },
    },
  },
};

/** Multiple articles in a feed */
export const ArticleFeed: Story = {
  render: () => (
    <Stack gap="6" className="max-w-2xl">
      {[
        {
          title: 'Getting Started with React 19',
          author: 'Sarah Chen',
          date: 'January 14, 2025',
          excerpt:
            'React 19 brings exciting new features including improved server components and enhanced hooks.',
        },
        {
          title: 'TypeScript 5.4 Deep Dive',
          author: 'Michael Ross',
          date: 'January 13, 2025',
          excerpt:
            'Exploring the new type inference improvements and utility types in the latest TypeScript release.',
        },
        {
          title: 'Building Accessible Components',
          author: 'Emily Park',
          date: 'January 12, 2025',
          excerpt:
            'A comprehensive guide to building components that work for everyone, including users with disabilities.',
        },
      ].map((post, index) => (
        <Article
          key={index}
          p="6"
          className="bg-[rgb(var(--muted))] rounded-lg hover:bg-[rgb(var(--muted))]/80 transition-colors"
        >
          <Stack gap="3">
            <Heading level={2} size="xl">
              {post.title}
            </Heading>
            <Flex gap="2" align="center">
              <Text size="sm" weight="medium">
                {post.author}
              </Text>
              <Text size="sm" color="muted-foreground">
                • {post.date}
              </Text>
            </Flex>
            <Text as="p" color="muted-foreground">
              {post.excerpt}
            </Text>
          </Stack>
        </Article>
      ))}
    </Stack>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'A feed of articles, common pattern for blogs, news sites, and social media timelines.',
      },
    },
  },
};

/** Comment thread */
export const CommentThread: Story = {
  render: () => (
    <Stack gap="4" className="max-w-xl">
      <Article p="4" className="bg-[rgb(var(--muted))] rounded-lg">
        <Flex gap="3">
          <Box className="w-10 h-10 rounded-full bg-blue-500 shrink-0" />
          <Stack gap="2" className="flex-1">
            <Flex gap="2" align="center">
              <Text weight="semibold" size="sm">
                alex_coder
              </Text>
              <Text size="xs" color="muted-foreground">
                2 hours ago
              </Text>
            </Flex>
            <Text as="p" size="sm">
              Great article! This really helped me understand the fundamentals.
            </Text>
          </Stack>
        </Flex>
      </Article>

      <Box pl="12">
        <Article p="4" className="bg-[rgb(var(--muted))]/50 rounded-lg">
          <Flex gap="3">
            <Box className="w-10 h-10 rounded-full bg-green-500 shrink-0" />
            <Stack gap="2" className="flex-1">
              <Flex gap="2" align="center">
                <Text weight="semibold" size="sm">
                  jane_dev
                </Text>
                <Text size="xs" color="muted-foreground">
                  1 hour ago
                </Text>
              </Flex>
              <Text as="p" size="sm">
                @alex_coder Glad it helped! Let me know if you have any questions.
              </Text>
            </Stack>
          </Flex>
        </Article>
      </Box>

      <Article p="4" className="bg-[rgb(var(--muted))] rounded-lg">
        <Flex gap="3">
          <Box className="w-10 h-10 rounded-full bg-purple-500 shrink-0" />
          <Stack gap="2" className="flex-1">
            <Flex gap="2" align="center">
              <Text weight="semibold" size="sm">
                newbie_programmer
              </Text>
              <Text size="xs" color="muted-foreground">
                45 minutes ago
              </Text>
            </Flex>
            <Text as="p" size="sm">
              Could you explain the part about state management in more detail?
            </Text>
          </Stack>
        </Flex>
      </Article>
    </Stack>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Comments in a thread, each represented as an article element.',
      },
    },
  },
};

/** Article with aria-label */
export const WithAriaLabel: Story = {
  render: () => (
    <Article
      aria-label="Featured article about web accessibility"
      p="6"
      className="bg-[rgb(var(--muted))] rounded-lg"
    >
      <Stack gap="4">
        <Heading level={2}>Web Accessibility Fundamentals</Heading>
        <Text as="p">
          While articles are typically self-describing through their content, you can add an
          aria-label for additional screen reader context when needed.
        </Text>
      </Stack>
    </Article>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Articles can optionally include aria-label for additional context, though this is not required.',
      },
    },
  },
};

/** Article with aria-labelledby */
export const WithAriaLabelledby: Story = {
  render: () => (
    <Article aria-labelledby="article-heading" p="6" className="bg-[rgb(var(--muted))] rounded-lg">
      <Stack gap="4">
        <Heading level={2} id="article-heading">
          Understanding ARIA Labelledby
        </Heading>
        <Text as="p">
          When using aria-labelledby, the article is labeled by the visible heading, which is often
          the most natural approach for screen reader users.
        </Text>
      </Stack>
    </Article>
  ),
};

/** Article with test ID */
export const WithTestId: Story = {
  args: {
    'data-testid': 'featured-article',
    p: '4',
    className: 'bg-[rgb(var(--muted))] rounded-lg',
    children: <Text as="p">This article has a data-testid for automated testing.</Text>,
  },
};

/** All spacing props demonstration */
export const AllSpacingProps: Story = {
  render: () => (
    <Stack gap="4">
      <Article p="6" className="bg-blue-100 rounded">
        <Text>p=&quot;6&quot; - Padding all sides</Text>
      </Article>

      <Article px="8" py="2" className="bg-green-100 rounded">
        <Text>px=&quot;8&quot; py=&quot;2&quot; - Different horizontal and vertical padding</Text>
      </Article>

      <Article pt="8" pb="2" pl="4" pr="12" className="bg-yellow-100 rounded">
        <Text>
          pt=&quot;8&quot; pb=&quot;2&quot; pl=&quot;4&quot; pr=&quot;12&quot; - Individual sides
        </Text>
      </Article>

      <Box className="bg-gray-200 p-2 rounded">
        <Article m="4" p="4" className="bg-purple-100 rounded">
          <Text>m=&quot;4&quot; - Margin on all sides (visible against gray background)</Text>
        </Article>
      </Box>

      <Box className="bg-gray-200 p-2 rounded">
        <Article mx="8" p="4" className="bg-pink-100 rounded">
          <Text>mx=&quot;8&quot; - Horizontal margin only</Text>
        </Article>
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

/** Dashboard widget as article */
export const DashboardWidget: Story = {
  render: () => (
    <Flex gap="4" wrap="wrap">
      <Article p="6" className="bg-[rgb(var(--muted))] rounded-lg min-w-[200px] flex-1">
        <Stack gap="2">
          <Text size="sm" color="muted-foreground">
            Total Revenue
          </Text>
          <Text size="3xl" weight="bold">
            $45,231
          </Text>
          <Text size="sm" className="text-green-600">
            +20.1% from last month
          </Text>
        </Stack>
      </Article>

      <Article p="6" className="bg-[rgb(var(--muted))] rounded-lg min-w-[200px] flex-1">
        <Stack gap="2">
          <Text size="sm" color="muted-foreground">
            Active Users
          </Text>
          <Text size="3xl" weight="bold">
            2,350
          </Text>
          <Text size="sm" className="text-green-600">
            +180 since yesterday
          </Text>
        </Stack>
      </Article>

      <Article p="6" className="bg-[rgb(var(--muted))] rounded-lg min-w-[200px] flex-1">
        <Stack gap="2">
          <Text size="sm" color="muted-foreground">
            Pending Tasks
          </Text>
          <Text size="3xl" weight="bold">
            12
          </Text>
          <Text size="sm" className="text-amber-600">
            3 due today
          </Text>
        </Stack>
      </Article>
    </Flex>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Dashboard widgets can be articles when they represent independent, self-contained stats.',
      },
    },
  },
};

/** Recipe card */
export const RecipeCard: Story = {
  render: () => (
    <Article className="max-w-sm bg-[rgb(var(--background))] border border-[rgb(var(--border))] rounded-xl overflow-hidden">
      <Box className="aspect-[4/3] bg-[rgb(var(--muted))]" />
      <Box p="5">
        <Stack gap="3">
          <Flex justify="between" align="start">
            <Heading level={3} size="lg">
              Classic Chocolate Cake
            </Heading>
            <Text size="sm" className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
              ⭐ 4.8
            </Text>
          </Flex>

          <Text as="p" size="sm" color="muted-foreground">
            A rich, moist chocolate cake with a velvety ganache frosting. Perfect for any occasion.
          </Text>

          <Flex gap="4">
            <Stack gap="0.5">
              <Text size="xs" color="muted-foreground">
                Prep Time
              </Text>
              <Text size="sm" weight="medium">
                20 min
              </Text>
            </Stack>
            <Stack gap="0.5">
              <Text size="xs" color="muted-foreground">
                Cook Time
              </Text>
              <Text size="sm" weight="medium">
                35 min
              </Text>
            </Stack>
            <Stack gap="0.5">
              <Text size="xs" color="muted-foreground">
                Servings
              </Text>
              <Text size="sm" weight="medium">
                12
              </Text>
            </Stack>
          </Flex>

          <Flex gap="2" wrap="wrap">
            <Text size="xs" className="bg-[rgb(var(--muted))] px-2 py-1 rounded">
              Dessert
            </Text>
            <Text size="xs" className="bg-[rgb(var(--muted))] px-2 py-1 rounded">
              Chocolate
            </Text>
            <Text size="xs" className="bg-[rgb(var(--muted))] px-2 py-1 rounded">
              Baking
            </Text>
          </Flex>
        </Stack>
      </Box>
    </Article>
  ),
};

/** Job listing */
export const JobListing: Story = {
  render: () => (
    <Article
      p="6"
      className="border border-[rgb(var(--border))] rounded-lg hover:border-[rgb(var(--primary))] transition-colors"
    >
      <Flex justify="between" align="start" gap="4">
        <Flex gap="4">
          <Box className="w-12 h-12 rounded-lg bg-[rgb(var(--primary))] shrink-0" />
          <Stack gap="1">
            <Heading level={3} size="lg">
              Senior Frontend Developer
            </Heading>
            <Text color="muted-foreground">OpenFlow Inc. • Remote</Text>
            <Flex gap="2" wrap="wrap" className="mt-2">
              <Text size="xs" className="bg-[rgb(var(--muted))] px-2 py-1 rounded">
                React
              </Text>
              <Text size="xs" className="bg-[rgb(var(--muted))] px-2 py-1 rounded">
                TypeScript
              </Text>
              <Text size="xs" className="bg-[rgb(var(--muted))] px-2 py-1 rounded">
                Tailwind
              </Text>
            </Flex>
          </Stack>
        </Flex>

        <Stack gap="1" className="text-right shrink-0">
          <Text weight="semibold">$150k - $200k</Text>
          <Text size="sm" color="muted-foreground">
            Posted 2 days ago
          </Text>
        </Stack>
      </Flex>
    </Article>
  ),
};

/** Accessibility demonstration */
export const AccessibilityDemo: Story = {
  render: () => (
    <Stack gap="6">
      <Box p="4" className="bg-amber-100 border border-amber-300 rounded-lg">
        <Text size="sm">
          <strong>Accessibility Note:</strong> Articles are landmark elements that help screen
          reader users navigate the page. Each article represents a self-contained, independently
          distributable piece of content.
        </Text>
      </Box>

      <Article p="4" className="bg-[rgb(var(--muted))] rounded-lg">
        <Stack gap="2">
          <Heading level={2}>Self-Contained Content</Heading>
          <Text as="p" size="sm">
            Screen readers identify this as an article region, allowing users to navigate directly
            to it using landmark navigation.
          </Text>
        </Stack>
      </Article>

      <Article aria-label="Featured Post" p="4" className="bg-[rgb(var(--muted))] rounded-lg">
        <Stack gap="2">
          <Heading level={2}>With Aria Label</Heading>
          <Text as="p" size="sm">
            This article has an optional aria-label. Screen readers will announce: &quot;Featured
            Post, article&quot;.
          </Text>
        </Stack>
      </Article>
    </Stack>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'This demo shows how screen readers interpret article elements and optional aria-labels.',
      },
    },
  },
};
