import type { Meta, StoryObj } from '@storybook/react';
import { SkipLink } from './SkipLink';

const meta: Meta<typeof SkipLink> = {
  title: 'Atoms/SkipLink',
  component: SkipLink,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    targetId: {
      control: 'text',
      description: 'ID of the target element to skip to',
    },
    children: {
      control: 'text',
      description: 'Link text content',
    },
  },
};

export default meta;
type Story = StoryObj<typeof SkipLink>;

/** Default skip link - tab to see it appear */
export const Default: Story = {
  render: () => (
    <div className="min-h-screen">
      <SkipLink />
      <header className="border-b border-[rgb(var(--border))] p-4">
        <nav className="flex gap-4">
          <a href="#home" className="text-[rgb(var(--foreground))] hover:underline">
            Home
          </a>
          <a href="#about" className="text-[rgb(var(--foreground))] hover:underline">
            About
          </a>
          <a href="#contact" className="text-[rgb(var(--foreground))] hover:underline">
            Contact
          </a>
        </nav>
      </header>
      <main id="main-content" tabIndex={-1} className="p-8">
        <h1 className="text-2xl font-bold text-[rgb(var(--foreground))]">Main Content</h1>
        <p className="mt-4 text-[rgb(var(--muted-foreground))]">
          Press Tab at the top of the page to reveal the skip link. This allows keyboard users to
          bypass navigation and jump directly to the main content.
        </p>
      </main>
    </div>
  ),
};

/** Custom target ID */
export const CustomTarget: Story = {
  render: () => (
    <div className="min-h-screen">
      <SkipLink targetId="content-area" />
      <header className="border-b border-[rgb(var(--border))] p-4">
        <p className="text-sm text-[rgb(var(--muted-foreground))]">Header with navigation</p>
      </header>
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

/** Custom link text */
export const CustomText: Story = {
  render: () => (
    <div className="min-h-screen">
      <SkipLink>Jump to article</SkipLink>
      <header className="border-b border-[rgb(var(--border))] p-4">
        <p className="text-sm text-[rgb(var(--muted-foreground))]">Header</p>
      </header>
      <main id="main-content" tabIndex={-1} className="p-8">
        <article>
          <h1 className="text-2xl font-bold text-[rgb(var(--foreground))]">Article Title</h1>
          <p className="mt-4 text-[rgb(var(--muted-foreground))]">
            The skip link text has been customized to &quot;Jump to article&quot;.
          </p>
        </article>
      </main>
    </div>
  ),
};

/** Visible for demo purposes */
export const AlwaysVisible: Story = {
  render: () => (
    <div className="p-8">
      <p className="mb-4 text-sm text-[rgb(var(--muted-foreground))]">
        Normally the skip link is only visible when focused. Here it&apos;s forced to be visible:
      </p>
      <a
        href="#main-content"
        className="rounded-md bg-[rgb(var(--primary))] px-4 py-2 text-[rgb(var(--primary-foreground))] shadow-lg outline-none ring-2 ring-[rgb(var(--ring))]"
      >
        Skip to main content
      </a>
      <p className="mt-4 text-xs text-[rgb(var(--muted-foreground))]">
        This shows what the skip link looks like when focused.
      </p>
    </div>
  ),
};

/** Focus behavior demonstration */
export const FocusBehavior: Story = {
  render: () => (
    <div className="min-h-screen">
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
      <header className="border-b border-[rgb(var(--border))] p-4">
        <nav className="flex gap-4">
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
        </nav>
      </header>
      <main id="main-content" tabIndex={-1} className="p-8">
        <h1 className="text-2xl font-bold text-[rgb(var(--foreground))]">Main Content</h1>
        <p className="mt-4 text-[rgb(var(--muted-foreground))]">
          If you used the skip link, focus should now be here.
        </p>
      </main>
    </div>
  ),
};
