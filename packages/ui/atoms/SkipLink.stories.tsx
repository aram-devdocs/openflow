/**
 * SkipLink Storybook Stories
 *
 * Comprehensive stories demonstrating all SkipLink features, accessibility,
 * and real-world usage patterns.
 */

import { Footer, Header, Main, Nav } from '@openflow/primitives';
import type { Meta, StoryObj } from '@storybook/react';
import { useRef, useState } from 'react';
import { DEFAULT_SKIP_LINK_TEXT, SkipLink } from './SkipLink';

const meta: Meta<typeof SkipLink> = {
  title: 'Atoms/SkipLink',
  component: SkipLink,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
The SkipLink is an essential accessibility component that allows keyboard users
to bypass repetitive navigation and jump directly to main content.

**WCAG Compliance:**
- WCAG 2.4.1 Bypass Blocks (Level A) - Provides mechanism to bypass repeated content

**Key Features:**
- Visually hidden by default (sr-only)
- Appears prominently when focused
- High contrast colors for visibility
- Touch target ≥44px when visible
- Links to #main-content by default

**Usage:**
Place as the first focusable element in your layout, before the header/navigation.
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    targetId: {
      control: 'text',
      description: 'ID of the target element to skip to',
      table: {
        defaultValue: { summary: 'main-content' },
      },
    },
    children: {
      control: 'text',
      description: 'Link text content',
      table: {
        defaultValue: { summary: DEFAULT_SKIP_LINK_TEXT },
      },
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
    'data-testid': {
      control: 'text',
      description: 'Test ID for automated testing',
    },
  },
};

export default meta;
type Story = StoryObj<typeof SkipLink>;

// =============================================================================
// Basic Usage
// =============================================================================

/**
 * Default skip link - Tab to see it appear
 *
 * The skip link is hidden until focused. Press Tab at the top of the page
 * to reveal it. This allows keyboard users to bypass navigation.
 */
export const Default: Story = {
  render: () => (
    <div className="min-h-screen bg-[rgb(var(--background))]">
      <SkipLink />
      <Header p="4" className="border-b border-[rgb(var(--border))]">
        <Nav aria-label="Main navigation" className="flex gap-4">
          <a href="#home" className="text-[rgb(var(--foreground))] hover:underline">
            Home
          </a>
          <a href="#about" className="text-[rgb(var(--foreground))] hover:underline">
            About
          </a>
          <a href="#contact" className="text-[rgb(var(--foreground))] hover:underline">
            Contact
          </a>
        </Nav>
      </Header>
      <Main p="8" tabIndex={-1}>
        <h1 className="text-2xl font-bold text-[rgb(var(--foreground))]">Main Content</h1>
        <p className="mt-4 text-[rgb(var(--muted-foreground))]">
          Press Tab at the top of the page to reveal the skip link. This allows keyboard users to
          bypass navigation and jump directly to the main content.
        </p>
      </Main>
    </div>
  ),
};

/**
 * Custom target ID
 *
 * You can specify a custom target ID to skip to any element on the page.
 */
export const CustomTarget: Story = {
  render: () => (
    <div className="min-h-screen bg-[rgb(var(--background))]">
      <SkipLink targetId="content-area" />
      <Header p="4" className="border-b border-[rgb(var(--border))]">
        <p className="text-sm text-[rgb(var(--muted-foreground))]">Header with navigation</p>
      </Header>
      <aside className="border-b border-[rgb(var(--border))] p-4">
        <p className="text-sm text-[rgb(var(--muted-foreground))]">Sidebar content</p>
      </aside>
      <main id="content-area" tabIndex={-1} className="p-8">
        <h1 className="text-2xl font-bold text-[rgb(var(--foreground))]">Content Area</h1>
        <p className="mt-4 text-[rgb(var(--muted-foreground))]">
          This skip link targets &quot;content-area&quot; instead of the default
          &quot;main-content&quot;.
        </p>
      </main>
    </div>
  ),
};

/**
 * Custom link text
 *
 * Customize the link text for different contexts.
 */
export const CustomText: Story = {
  render: () => (
    <div className="min-h-screen bg-[rgb(var(--background))]">
      <SkipLink>Jump to article</SkipLink>
      <Header p="4" className="border-b border-[rgb(var(--border))]">
        <p className="text-sm text-[rgb(var(--muted-foreground))]">Header</p>
      </Header>
      <Main p="8" tabIndex={-1}>
        <article>
          <h1 className="text-2xl font-bold text-[rgb(var(--foreground))]">Article Title</h1>
          <p className="mt-4 text-[rgb(var(--muted-foreground))]">
            The skip link text has been customized to &quot;Jump to article&quot;.
          </p>
        </article>
      </Main>
    </div>
  ),
};

// =============================================================================
// Multiple Skip Links
// =============================================================================

/**
 * Multiple skip links
 *
 * For complex layouts, you can provide multiple skip links to different sections.
 */
export const MultipleSkipLinks: Story = {
  render: () => (
    <div className="min-h-screen bg-[rgb(var(--background))]">
      <SkipLink targetId="main-content">Skip to main content</SkipLink>
      <SkipLink targetId="search-form">Skip to search</SkipLink>
      <SkipLink targetId="footer-nav">Skip to footer navigation</SkipLink>

      <Header p="4" className="border-b border-[rgb(var(--border))]">
        <Nav aria-label="Main navigation" className="flex items-center justify-between">
          <div className="flex gap-4">
            <a href="#home" className="text-[rgb(var(--foreground))] hover:underline">
              Home
            </a>
            <a href="#products" className="text-[rgb(var(--foreground))] hover:underline">
              Products
            </a>
            <a href="#about" className="text-[rgb(var(--foreground))] hover:underline">
              About
            </a>
          </div>
          <form id="search-form" tabIndex={-1} className="flex gap-2">
            <input
              type="search"
              placeholder="Search..."
              className="rounded border border-[rgb(var(--border))] bg-[rgb(var(--background))] px-3 py-1 text-[rgb(var(--foreground))]"
            />
            <button
              type="submit"
              className="rounded bg-[rgb(var(--primary))] px-3 py-1 text-[rgb(var(--primary-foreground))]"
            >
              Search
            </button>
          </form>
        </Nav>
      </Header>

      <Main p="8" tabIndex={-1}>
        <h1 className="text-2xl font-bold text-[rgb(var(--foreground))]">Main Content</h1>
        <p className="mt-4 text-[rgb(var(--muted-foreground))]">
          This page has multiple skip links. Tab repeatedly to cycle through: main content, search,
          and footer navigation.
        </p>
      </Main>

      <Footer p="4" className="border-t border-[rgb(var(--border))]" aria-label="Footer">
        <nav id="footer-nav" tabIndex={-1} aria-label="Footer navigation" className="flex gap-4">
          <a href="#privacy" className="text-[rgb(var(--foreground))] hover:underline">
            Privacy Policy
          </a>
          <a href="#terms" className="text-[rgb(var(--foreground))] hover:underline">
            Terms of Service
          </a>
          <a href="#contact" className="text-[rgb(var(--foreground))] hover:underline">
            Contact Us
          </a>
        </nav>
      </Footer>
    </div>
  ),
};

// =============================================================================
// Visual Demonstration
// =============================================================================

/**
 * Always visible (for demo)
 *
 * Shows what the skip link looks like when focused.
 * In real usage, it's only visible on focus.
 */
export const AlwaysVisible: Story = {
  render: () => (
    <div className="p-8 bg-[rgb(var(--background))]">
      <p className="mb-4 text-sm text-[rgb(var(--muted-foreground))]">
        Normally the skip link is only visible when focused. Here&apos;s what it looks like:
      </p>
      <a
        href="#main-content"
        className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md bg-[rgb(var(--primary))] px-4 py-3 font-medium text-[rgb(var(--primary-foreground))] shadow-lg outline-none ring-2 ring-[rgb(var(--ring))] ring-offset-2"
      >
        Skip to main content
      </a>
      <p className="mt-4 text-xs text-[rgb(var(--muted-foreground))]">
        Note the high contrast colors, rounded corners, shadow, and focus ring.
      </p>
    </div>
  ),
};

/**
 * Focus behavior demonstration
 *
 * Interactive demo showing how the skip link behaves with keyboard navigation.
 */
export const FocusBehavior: Story = {
  render: () => (
    <div className="min-h-screen bg-[rgb(var(--background))]">
      <SkipLink />
      <div className="p-8">
        <div className="rounded-lg border border-[rgb(var(--border))] p-4">
          <h3 className="font-medium text-[rgb(var(--foreground))]">How to Use</h3>
          <ol className="mt-2 list-inside list-decimal space-y-1 text-sm text-[rgb(var(--muted-foreground))]">
            <li>Click somewhere on this page to ensure it has focus</li>
            <li>Press Tab to focus the skip link (it will appear in the top-left)</li>
            <li>Press Enter to skip to the main content</li>
            <li>Or press Tab again to continue through the navigation</li>
          </ol>
        </div>
      </div>
      <Header p="4" className="border-b border-[rgb(var(--border))]">
        <Nav aria-label="Main navigation" className="flex gap-4">
          <a
            href="#nav-1"
            className="text-[rgb(var(--foreground))] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))]"
          >
            Nav Item 1
          </a>
          <a
            href="#nav-2"
            className="text-[rgb(var(--foreground))] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))]"
          >
            Nav Item 2
          </a>
          <a
            href="#nav-3"
            className="text-[rgb(var(--foreground))] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))]"
          >
            Nav Item 3
          </a>
        </Nav>
      </Header>
      <Main p="8" tabIndex={-1}>
        <h1 className="text-2xl font-bold text-[rgb(var(--foreground))]">Main Content</h1>
        <p className="mt-4 text-[rgb(var(--muted-foreground))]">
          If you used the skip link, focus should now be here.
        </p>
      </Main>
    </div>
  ),
};

// =============================================================================
// Accessibility Features
// =============================================================================

/**
 * Touch target accessibility
 *
 * Demonstrates the 44px minimum touch target when the skip link is visible.
 */
export const TouchTargetAccessibility: Story = {
  render: () => (
    <div className="p-8 bg-[rgb(var(--background))]">
      <div className="mb-6 rounded-lg bg-[rgb(var(--muted))] p-4">
        <h3 className="font-medium text-[rgb(var(--foreground))]">WCAG 2.5.5 Touch Target Size</h3>
        <p className="mt-1 text-sm text-[rgb(var(--muted-foreground))]">
          When visible, the skip link has a minimum touch target of 44x44 pixels.
        </p>
      </div>

      <div className="relative">
        {/* 44x44 reference grid */}
        <div
          className="absolute left-0 top-0 border-2 border-dashed border-[rgb(var(--destructive))]"
          style={{ width: 44, height: 44 }}
        />
        <p className="absolute left-12 top-0 text-xs text-[rgb(var(--muted-foreground))]">
          44x44px reference
        </p>

        <div className="mt-16">
          <a
            href="#main-content"
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md bg-[rgb(var(--primary))] px-4 py-3 font-medium text-[rgb(var(--primary-foreground))] shadow-lg outline-none ring-2 ring-[rgb(var(--ring))] ring-offset-2"
          >
            Skip to main content
          </a>
        </div>
      </div>
    </div>
  ),
};

/**
 * Focus ring visibility
 *
 * Shows the focus ring styling for keyboard navigation indication.
 */
export const FocusRingVisibility: Story = {
  render: () => (
    <div className="p-8 bg-[rgb(var(--background))]">
      <div className="mb-6 rounded-lg bg-[rgb(var(--muted))] p-4">
        <h3 className="font-medium text-[rgb(var(--foreground))]">Focus Ring</h3>
        <p className="mt-1 text-sm text-[rgb(var(--muted-foreground))]">
          The skip link has a prominent focus ring with ring-offset for visibility on any
          background.
        </p>
      </div>

      <div className="grid gap-6">
        <div className="p-4 bg-[rgb(var(--background))]">
          <p className="mb-2 text-xs text-[rgb(var(--muted-foreground))]">On light background:</p>
          <a
            href="#main-content"
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md bg-[rgb(var(--primary))] px-4 py-3 font-medium text-[rgb(var(--primary-foreground))] shadow-lg outline-none ring-2 ring-[rgb(var(--ring))] ring-offset-2"
          >
            Skip to main content
          </a>
        </div>

        <div className="rounded p-4 bg-[rgb(var(--foreground))]">
          <p className="mb-2 text-xs text-[rgb(var(--background))]">On dark background:</p>
          <a
            href="#main-content"
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md bg-[rgb(var(--primary))] px-4 py-3 font-medium text-[rgb(var(--primary-foreground))] shadow-lg outline-none ring-2 ring-[rgb(var(--ring))] ring-offset-2"
          >
            Skip to main content
          </a>
        </div>
      </div>
    </div>
  ),
};

/**
 * Screen reader accessibility
 *
 * The skip link is properly accessible to screen readers.
 */
export const ScreenReaderAccessibility: Story = {
  render: () => (
    <div className="p-8 bg-[rgb(var(--background))]">
      <div className="mb-6 rounded-lg bg-[rgb(var(--muted))] p-4">
        <h3 className="font-medium text-[rgb(var(--foreground))]">Screen Reader Features</h3>
        <ul className="mt-2 list-disc pl-5 text-sm text-[rgb(var(--muted-foreground))]">
          <li>Uses sr-only pattern: hidden visually but readable by screen readers</li>
          <li>When focused, announces via aria-live region</li>
          <li>Link text is clear and descriptive</li>
          <li>Target element should have tabIndex={'{-1}'} for focus reception</li>
        </ul>
      </div>

      <div className="rounded-lg border border-[rgb(var(--border))] p-4">
        <p className="text-sm text-[rgb(var(--muted-foreground))]">
          With a screen reader active, tab to the skip link and note how it announces:
        </p>
        <ol className="mt-2 list-inside list-decimal text-sm text-[rgb(var(--muted-foreground))]">
          <li>The link text (&quot;Skip to main content&quot;)</li>
          <li>That it&apos;s a link</li>
          <li>The focus announcement via aria-live</li>
        </ol>
      </div>
    </div>
  ),
};

/**
 * Keyboard navigation demo
 *
 * Interactive demo for testing keyboard navigation.
 */
export const KeyboardNavigation: Story = {
  render: () => {
    const InteractiveDemo = () => {
      const [focusHistory, setFocusHistory] = useState<string[]>([]);

      const logFocus = (name: string) => {
        setFocusHistory((prev) => [...prev.slice(-4), name]);
      };

      return (
        <div className="min-h-screen bg-[rgb(var(--background))]">
          <SkipLink data-testid="skip-link" />

          <div className="fixed right-4 top-4 z-50 rounded-lg bg-[rgb(var(--card))] p-4 shadow-lg">
            <h4 className="text-sm font-medium text-[rgb(var(--foreground))]">Focus History</h4>
            <ul className="mt-2 text-xs text-[rgb(var(--muted-foreground))]">
              {focusHistory.length === 0 ? (
                <li>Tab to start...</li>
              ) : (
                focusHistory.map((item, i) => <li key={i}>{item}</li>)
              )}
            </ul>
          </div>

          <Header p="4" className="border-b border-[rgb(var(--border))]">
            <Nav aria-label="Main navigation" className="flex gap-4">
              <a
                href="#home"
                onFocus={() => logFocus('Home link')}
                className="text-[rgb(var(--foreground))] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))]"
              >
                Home
              </a>
              <a
                href="#about"
                onFocus={() => logFocus('About link')}
                className="text-[rgb(var(--foreground))] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))]"
              >
                About
              </a>
              <a
                href="#contact"
                onFocus={() => logFocus('Contact link')}
                className="text-[rgb(var(--foreground))] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))]"
              >
                Contact
              </a>
            </Nav>
          </Header>

          <Main
            p="8"
            tabIndex={-1}
            onFocus={() => logFocus('Main content')}
            className="outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))] focus-visible:ring-inset"
          >
            <h1 className="text-2xl font-bold text-[rgb(var(--foreground))]">Main Content</h1>
            <p className="mt-4 text-[rgb(var(--muted-foreground))]">
              Use Tab to navigate. The focus history panel shows the order of focused elements.
            </p>
            <button
              type="button"
              onFocus={() => logFocus('Action button')}
              className="mt-4 rounded bg-[rgb(var(--primary))] px-4 py-2 text-[rgb(var(--primary-foreground))] focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))]"
            >
              Action Button
            </button>
          </Main>
        </div>
      );
    };

    return <InteractiveDemo />;
  },
};

// =============================================================================
// Ref Forwarding & Data Attributes
// =============================================================================

/**
 * Ref forwarding support
 *
 * The SkipLink supports ref forwarding for programmatic focus management.
 */
export const RefForwarding: Story = {
  render: () => {
    const RefDemo = () => {
      const skipLinkRef = useRef<HTMLAnchorElement>(null);

      const handleFocusSkipLink = () => {
        skipLinkRef.current?.focus();
      };

      return (
        <div className="p-8 bg-[rgb(var(--background))]">
          <SkipLink ref={skipLinkRef} data-testid="skip-link-ref" />

          <div className="rounded-lg border border-[rgb(var(--border))] p-4">
            <h3 className="font-medium text-[rgb(var(--foreground))]">Ref Forwarding Demo</h3>
            <p className="mt-2 text-sm text-[rgb(var(--muted-foreground))]">
              Click the button to programmatically focus the skip link:
            </p>
            <button
              type="button"
              onClick={handleFocusSkipLink}
              className="mt-4 rounded bg-[rgb(var(--primary))] px-4 py-2 text-[rgb(var(--primary-foreground))] hover:bg-[rgb(var(--primary))]/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))]"
            >
              Focus Skip Link
            </button>
          </div>
        </div>
      );
    };

    return <RefDemo />;
  },
};

/**
 * Data-testid support
 *
 * The SkipLink supports data-testid for automated testing.
 */
export const DataTestId: Story = {
  render: () => (
    <div className="p-8 bg-[rgb(var(--background))]">
      <SkipLink data-testid="my-skip-link" />

      <div className="rounded-lg border border-[rgb(var(--border))] p-4">
        <h3 className="font-medium text-[rgb(var(--foreground))]">Testing Support</h3>
        <pre className="mt-2 rounded bg-[rgb(var(--muted))] p-2 text-sm">
          {`<SkipLink data-testid="my-skip-link" />`}
        </pre>
        <p className="mt-2 text-sm text-[rgb(var(--muted-foreground))]">
          Use data-testid for reliable element selection in tests.
        </p>
      </div>
    </div>
  ),
};

// =============================================================================
// Real-World Usage Examples
// =============================================================================

/**
 * Dashboard layout example
 *
 * Real-world example of skip link in a dashboard layout.
 */
export const DashboardLayout: Story = {
  render: () => (
    <div className="min-h-screen bg-[rgb(var(--background))]">
      <SkipLink targetId="dashboard-content">Skip to dashboard</SkipLink>

      {/* Top Header */}
      <Header
        p="4"
        className="flex items-center justify-between border-b border-[rgb(var(--border))]"
      >
        <div className="flex items-center gap-4">
          <span className="text-xl font-bold text-[rgb(var(--foreground))]">OpenFlow</span>
          <Nav aria-label="Primary navigation" className="hidden gap-4 md:flex">
            <a href="#projects" className="text-[rgb(var(--foreground))] hover:underline">
              Projects
            </a>
            <a href="#tasks" className="text-[rgb(var(--foreground))] hover:underline">
              Tasks
            </a>
            <a href="#settings" className="text-[rgb(var(--foreground))] hover:underline">
              Settings
            </a>
          </Nav>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded p-2 hover:bg-[rgb(var(--muted))] focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))]"
          >
            <span className="sr-only">Notifications</span>🔔
          </button>
          <button
            type="button"
            className="rounded p-2 hover:bg-[rgb(var(--muted))] focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))]"
          >
            <span className="sr-only">User menu</span>👤
          </button>
        </div>
      </Header>

      {/* Sidebar + Main */}
      <div className="flex">
        <aside className="hidden w-64 border-r border-[rgb(var(--border))] p-4 md:block">
          <nav aria-label="Sidebar navigation" className="space-y-2">
            <a
              href="#dashboard"
              className="block rounded px-3 py-2 text-[rgb(var(--foreground))] hover:bg-[rgb(var(--muted))]"
            >
              Dashboard
            </a>
            <a
              href="#workflows"
              className="block rounded px-3 py-2 text-[rgb(var(--foreground))] hover:bg-[rgb(var(--muted))]"
            >
              Workflows
            </a>
            <a
              href="#archive"
              className="block rounded px-3 py-2 text-[rgb(var(--foreground))] hover:bg-[rgb(var(--muted))]"
            >
              Archive
            </a>
          </nav>
        </aside>

        <Main id="dashboard-content" p="8" tabIndex={-1} className="flex-1">
          <h1 className="text-2xl font-bold text-[rgb(var(--foreground))]">Dashboard</h1>
          <p className="mt-4 text-[rgb(var(--muted-foreground))]">
            Press Tab at the very beginning to access the skip link and jump directly here,
            bypassing all the navigation elements.
          </p>
        </Main>
      </div>
    </div>
  ),
};

/**
 * Blog article layout
 *
 * Skip link in a blog/content-focused layout.
 */
export const BlogLayout: Story = {
  render: () => (
    <div className="min-h-screen bg-[rgb(var(--background))]">
      <SkipLink targetId="article-content">Skip to article</SkipLink>

      <Header p="4" className="border-b border-[rgb(var(--border))]">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <span className="text-xl font-bold text-[rgb(var(--foreground))]">TechBlog</span>
          <Nav aria-label="Blog navigation" className="flex gap-4">
            <a href="#latest" className="text-[rgb(var(--foreground))] hover:underline">
              Latest
            </a>
            <a href="#categories" className="text-[rgb(var(--foreground))] hover:underline">
              Categories
            </a>
            <a href="#about" className="text-[rgb(var(--foreground))] hover:underline">
              About
            </a>
            <a href="#subscribe" className="text-[rgb(var(--foreground))] hover:underline">
              Subscribe
            </a>
          </Nav>
        </div>
      </Header>

      <Main className="mx-auto max-w-4xl px-4 py-8">
        <article id="article-content" tabIndex={-1}>
          <header>
            <h1 className="text-3xl font-bold text-[rgb(var(--foreground))]">
              Building Accessible Skip Links
            </h1>
            <p className="mt-2 text-[rgb(var(--muted-foreground))]">
              Published January 15, 2024 • 5 min read
            </p>
          </header>

          <div className="mt-8 space-y-4 text-[rgb(var(--foreground))]">
            <p>
              Skip links are an essential accessibility feature that allow keyboard users to bypass
              repetitive navigation...
            </p>
            <p>
              This article was navigated to using a skip link. The keyboard user was able to bypass
              all navigation elements and jump directly to the article content.
            </p>
          </div>
        </article>
      </Main>
    </div>
  ),
};

/**
 * E-commerce layout
 *
 * Skip links in an e-commerce site with multiple navigation areas.
 */
export const EcommerceLayout: Story = {
  render: () => (
    <div className="min-h-screen bg-[rgb(var(--background))]">
      <SkipLink targetId="product-grid">Skip to products</SkipLink>
      <SkipLink targetId="category-filters">Skip to filters</SkipLink>

      {/* Promo Banner */}
      <div className="bg-[rgb(var(--primary))] px-4 py-2 text-center text-sm text-[rgb(var(--primary-foreground))]">
        Free shipping on orders over $50! Use code SHIP50
      </div>

      {/* Header */}
      <Header p="4" className="border-b border-[rgb(var(--border))]">
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-[rgb(var(--foreground))]">ShopMart</span>
          <Nav aria-label="Main navigation" className="flex gap-4">
            <a href="#new" className="text-[rgb(var(--foreground))] hover:underline">
              New Arrivals
            </a>
            <a href="#sale" className="text-[rgb(var(--foreground))] hover:underline">
              Sale
            </a>
            <a href="#categories" className="text-[rgb(var(--foreground))] hover:underline">
              Categories
            </a>
          </Nav>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded p-2 hover:bg-[rgb(var(--muted))] focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))]"
            >
              🔍
            </button>
            <button
              type="button"
              className="rounded p-2 hover:bg-[rgb(var(--muted))] focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))]"
            >
              🛒
            </button>
          </div>
        </div>
      </Header>

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="border-b border-[rgb(var(--border))] px-4 py-2">
        <ol className="flex gap-2 text-sm">
          <li>
            <a href="#home" className="text-[rgb(var(--muted-foreground))] hover:underline">
              Home
            </a>
          </li>
          <li className="text-[rgb(var(--muted-foreground))]">/</li>
          <li>
            <a href="#electronics" className="text-[rgb(var(--muted-foreground))] hover:underline">
              Electronics
            </a>
          </li>
          <li className="text-[rgb(var(--muted-foreground))]">/</li>
          <li className="text-[rgb(var(--foreground))]">Laptops</li>
        </ol>
      </nav>

      {/* Main Content */}
      <div className="flex">
        {/* Filters Sidebar */}
        <aside
          id="category-filters"
          tabIndex={-1}
          className="w-64 border-r border-[rgb(var(--border))] p-4"
        >
          <h2 className="font-semibold text-[rgb(var(--foreground))]">Filters</h2>
          <div className="mt-4 space-y-4">
            <div>
              <h3 className="text-sm font-medium text-[rgb(var(--foreground))]">Price</h3>
              <div className="mt-2 space-y-1">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" /> Under $500
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" /> $500 - $1000
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" /> Over $1000
                </label>
              </div>
            </div>
          </div>
        </aside>

        {/* Product Grid */}
        <Main id="product-grid" p="8" tabIndex={-1} className="flex-1">
          <h1 className="text-2xl font-bold text-[rgb(var(--foreground))]">Laptops</h1>
          <p className="mt-2 text-[rgb(var(--muted-foreground))]">24 products found</p>

          <div className="mt-6 grid grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="rounded-lg border border-[rgb(var(--border))] p-4">
                <div className="aspect-square rounded bg-[rgb(var(--muted))]" />
                <h3 className="mt-2 font-medium text-[rgb(var(--foreground))]">Laptop {i}</h3>
                <p className="text-[rgb(var(--muted-foreground))]">${499 + i * 100}</p>
              </div>
            ))}
          </div>
        </Main>
      </div>
    </div>
  ),
};
