import type { Meta, StoryObj } from '@storybook/react';
import { Link } from './Link';
import { Paragraph } from './Paragraph';

const meta: Meta<typeof Link> = {
  title: 'Primitives/Link',
  component: Link,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Link primitive for semantic `<a>` elements. Provides external link security handling, focus ring styles, and typography customization. External links automatically get `target="_blank"` and `rel="noopener noreferrer"` for security.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    href: {
      control: 'text',
      description: 'Link URL (required)',
    },
    external: {
      control: 'boolean',
      description: 'Whether link opens in new tab with security attributes',
    },
    underline: {
      control: 'select',
      options: ['always', 'hover', 'none'],
      description: 'Underline behavior',
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl'],
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
      description: 'Text color (e.g., "blue-500", "primary")',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the link is disabled',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Link>;

/** Basic link with default hover underline */
export const Default: Story = {
  args: {
    href: '#',
    children: 'Click me',
  },
};

/** Internal navigation link */
export const InternalLink: Story = {
  args: {
    href: '/dashboard',
    children: 'Go to Dashboard',
  },
};

/** External link - automatically adds security attributes */
export const ExternalLink: Story = {
  args: {
    href: 'https://github.com',
    external: true,
    children: 'Visit GitHub',
  },
  parameters: {
    docs: {
      description: {
        story:
          'External links automatically receive `target="_blank"` and `rel="noopener noreferrer"` to prevent reverse tabnapping and referrer leaks.',
      },
    },
  },
};

/** Always underlined link */
export const AlwaysUnderlined: Story = {
  args: {
    href: '#',
    underline: 'always',
    children: 'Always underlined',
  },
};

/** Underline on hover only */
export const HoverUnderline: Story = {
  args: {
    href: '#',
    underline: 'hover',
    children: 'Hover to see underline',
  },
};

/** No underline link */
export const NoUnderline: Story = {
  args: {
    href: '#',
    underline: 'none',
    children: 'No underline',
  },
};

/** Different underline styles comparison */
export const UnderlineStyles: Story = {
  render: () => (
    <div className="flex gap-6">
      <Link href="#" underline="always">
        Always
      </Link>
      <Link href="#" underline="hover">
        Hover
      </Link>
      <Link href="#" underline="none">
        None
      </Link>
    </div>
  ),
};

/** Colored link */
export const ColoredLink: Story = {
  args: {
    href: '#',
    color: 'blue-600',
    children: 'Blue link',
  },
};

/** Primary color link using CSS variable */
export const PrimaryColorLink: Story = {
  args: {
    href: '#',
    color: 'primary',
    children: 'Primary color link',
  },
};

/** Various text sizes */
export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <Link href="#" size="xs">
        Extra small link (xs)
      </Link>
      <Link href="#" size="sm">
        Small link (sm)
      </Link>
      <Link href="#" size="base">
        Base link (base)
      </Link>
      <Link href="#" size="lg">
        Large link (lg)
      </Link>
      <Link href="#" size="xl">
        Extra large link (xl)
      </Link>
      <Link href="#" size="2xl">
        2XL link
      </Link>
    </div>
  ),
};

/** Responsive text size */
export const ResponsiveSize: Story = {
  args: {
    href: '#',
    size: { base: 'sm', md: 'base', lg: 'lg' },
    children: 'Resize browser to see size change',
  },
  parameters: {
    docs: {
      description: {
        story: 'Link size changes based on viewport width.',
      },
    },
  },
};

/** Various font weights */
export const Weights: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <Link href="#" weight="light">
        Light weight
      </Link>
      <Link href="#" weight="normal">
        Normal weight
      </Link>
      <Link href="#" weight="medium">
        Medium weight
      </Link>
      <Link href="#" weight="semibold">
        Semibold weight
      </Link>
      <Link href="#" weight="bold">
        Bold weight
      </Link>
    </div>
  ),
};

/** Disabled link */
export const Disabled: Story = {
  args: {
    href: '#',
    disabled: true,
    children: 'Disabled link (cannot click)',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Disabled links have reduced opacity, cannot be clicked, and have `aria-disabled` for accessibility.',
      },
    },
  },
};

/** Disabled vs enabled comparison */
export const DisabledComparison: Story = {
  render: () => (
    <div className="flex gap-6">
      <Link href="#">Enabled link</Link>
      <Link href="#" disabled>
        Disabled link
      </Link>
    </div>
  ),
};

/** Link in body text */
export const InBodyText: Story = {
  render: () => (
    <Paragraph>
      Visit our{' '}
      <Link href="/privacy" color="blue-600">
        privacy policy
      </Link>{' '}
      for more information about how we handle your data. You can also check our{' '}
      <Link href="/terms" color="blue-600">
        terms of service
      </Link>
      .
    </Paragraph>
  ),
};

/** Multiple links inline */
export const InlineLinks: Story = {
  render: () => (
    <div className="flex gap-4">
      <Link href="#home">Home</Link>
      <Link href="#about">About</Link>
      <Link href="#contact">Contact</Link>
      <Link href="#blog">Blog</Link>
    </div>
  ),
};

/** Navigation menu style */
export const NavigationStyle: Story = {
  render: () => (
    <nav aria-label="Main navigation" className="flex gap-6">
      <Link href="#" underline="none" weight="medium" className="hover:text-[rgb(var(--primary))]">
        Home
      </Link>
      <Link href="#" underline="none" weight="medium" className="hover:text-[rgb(var(--primary))]">
        Products
      </Link>
      <Link href="#" underline="none" weight="medium" className="hover:text-[rgb(var(--primary))]">
        About
      </Link>
      <Link href="#" underline="none" weight="medium" className="hover:text-[rgb(var(--primary))]">
        Contact
      </Link>
    </nav>
  ),
};

/** Styled call-to-action link */
export const CallToAction: Story = {
  render: () => (
    <Link
      href="#"
      size="lg"
      weight="semibold"
      color="primary"
      underline="none"
      className="inline-flex items-center gap-2 hover:opacity-80"
    >
      Get Started
      <span aria-hidden="true">-&gt;</span>
    </Link>
  ),
};

/** Focus ring demonstration */
export const FocusRing: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Paragraph size="sm" color="muted-foreground">
        Use Tab key to navigate and see focus rings
      </Paragraph>
      <div className="flex gap-4">
        <Link href="#">First Link</Link>
        <Link href="#">Second Link</Link>
        <Link href="#">Third Link</Link>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'All links have visible focus rings for keyboard navigation. The focus ring appears on keyboard focus (focus-visible) but not on mouse click.',
      },
    },
  },
};

/** External links with icons */
export const ExternalWithIcon: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <Link href="https://github.com" external className="inline-flex items-center gap-1">
        GitHub
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
      </Link>
      <Link href="https://docs.example.com" external className="inline-flex items-center gap-1">
        Documentation
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
      </Link>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'External links often include an icon to indicate they open in a new tab.',
      },
    },
  },
};

/** Email and tel links */
export const ContactLinks: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <Link href="mailto:contact@example.com">contact@example.com</Link>
      <Link href="tel:+1234567890">+1 (234) 567-890</Link>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Links work with mailto: and tel: protocols for contact information.',
      },
    },
  },
};

/** Download link */
export const DownloadLink: Story = {
  args: {
    href: '/files/report.pdf',
    download: 'report.pdf',
    children: 'Download Report (PDF)',
  },
  parameters: {
    docs: {
      description: {
        story: 'The native download attribute is supported for file downloads.',
      },
    },
  },
};

/** Link with ARIA attributes */
export const WithAriaAttributes: Story = {
  args: {
    href: '#',
    'aria-label': 'Learn more about our services',
    children: 'Learn more',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Use aria-label to provide more context when the link text alone is not descriptive enough.',
      },
    },
  },
};

/** Current page indicator */
export const CurrentPage: Story = {
  render: () => (
    <nav aria-label="Breadcrumb" className="flex gap-2 text-sm">
      <Link href="#" color="muted-foreground">
        Home
      </Link>
      <span aria-hidden="true">/</span>
      <Link href="#" color="muted-foreground">
        Products
      </Link>
      <span aria-hidden="true">/</span>
      <Link href="#" aria-current="page" weight="semibold" underline="none">
        Widget Pro
      </Link>
    </nav>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Use aria-current="page" to indicate the current page in navigation.',
      },
    },
  },
};

/** With data-testid for testing */
export const WithTestId: Story = {
  args: {
    href: '#',
    'data-testid': 'my-link',
    children: 'Testable link',
  },
  parameters: {
    docs: {
      description: {
        story: 'Use data-testid for automated testing.',
      },
    },
  },
};

/** All typography options combined */
export const FullyStyled: Story = {
  args: {
    href: '#',
    size: 'lg',
    weight: 'semibold',
    color: 'blue-600',
    underline: 'always',
    children: 'Fully styled link',
  },
};

/** Color variations */
export const ColorVariations: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <Link href="#" color="red-500">
        Red link
      </Link>
      <Link href="#" color="green-600">
        Green link
      </Link>
      <Link href="#" color="blue-600">
        Blue link
      </Link>
      <Link href="#" color="purple-600">
        Purple link
      </Link>
      <Link href="#" color="primary">
        Primary (CSS var)
      </Link>
      <Link href="#" color="destructive">
        Destructive (CSS var)
      </Link>
    </div>
  ),
};

/** Skip link pattern */
export const SkipLink: Story = {
  render: () => (
    <div>
      <Link
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-[rgb(var(--background))] focus:p-4 focus:shadow-lg"
      >
        Skip to main content
      </Link>
      <Paragraph size="sm" color="muted-foreground">
        Tab into this area to see the skip link appear
      </Paragraph>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Skip links help keyboard users bypass navigation. They are hidden by default and appear on focus.',
      },
    },
  },
};
