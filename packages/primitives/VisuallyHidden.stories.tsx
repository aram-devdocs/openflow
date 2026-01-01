/**
 * VisuallyHidden Stories
 *
 * Demonstrates the VisuallyHidden primitive which hides content
 * visually while keeping it accessible to screen readers.
 */

import type { Meta, StoryObj } from '@storybook/react';
import {
  VisuallyHidden,
  visuallyHiddenClassName,
  visuallyHiddenStyleObject,
} from './VisuallyHidden';

const meta: Meta<typeof VisuallyHidden> = {
  title: 'Primitives/VisuallyHidden',
  component: VisuallyHidden,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
The VisuallyHidden primitive hides content from sighted users while keeping it accessible to screen readers.

## Use Cases
- Skip links that should only appear on focus
- Icon-only buttons that need accessible names
- Additional context for screen reader users
- Form field descriptions that are visually implied

## How It Works
Uses the CSS clip technique which is the most reliable method for hiding content visually:
- \`position: absolute\` - removes from document flow
- \`clip: rect(0,0,0,0)\` - clips to nothing
- \`width/height: 1px\` - minimizes space
- \`overflow: hidden\` - hides any overflow

## Accessibility Notes
- Content is announced by screen readers
- When \`focusable\` is true, content becomes visible on focus
- Use for skip links, icon buttons, and supplementary descriptions
        `,
      },
    },
  },
  argTypes: {
    focusable: {
      control: 'boolean',
      description: 'When true, content becomes visible when focused or contains a focused element',
    },
    children: {
      control: 'text',
      description: 'The content to hide visually',
    },
  },
};

export default meta;
type Story = StoryObj<typeof VisuallyHidden>;

/**
 * Basic usage - content is hidden from view but announced by screen readers.
 * Turn on your screen reader to hear the hidden text!
 */
export const Default: Story = {
  render: () => (
    <div className="p-4 space-y-4">
      <p className="text-sm text-muted-foreground">
        This demo contains hidden text. Use a screen reader to hear it, or inspect the DOM to see
        the hidden span.
      </p>
      <div className="p-4 border rounded-lg">
        <span className="font-medium">Visible text: </span>
        Hello, World!
        <VisuallyHidden> - This text is hidden but readable by screen readers</VisuallyHidden>
      </div>
    </div>
  ),
};

/**
 * Icon buttons should always have accessible names.
 * VisuallyHidden provides the label without showing it visually.
 */
export const IconButton: Story = {
  render: () => (
    <div className="p-4 space-y-4">
      <p className="text-sm text-muted-foreground mb-4">
        These icon buttons have visually hidden labels for screen readers:
      </p>
      <div className="flex gap-4">
        <button
          type="button"
          className="p-2 rounded-lg border hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <VisuallyHidden>Search</VisuallyHidden>
        </button>

        <button
          type="button"
          className="p-2 rounded-lg border hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <VisuallyHidden>Settings</VisuallyHidden>
        </button>

        <button
          type="button"
          className="p-2 rounded-lg border hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
          <VisuallyHidden>Close</VisuallyHidden>
        </button>
      </div>
    </div>
  ),
};

/**
 * Skip links allow keyboard users to bypass navigation.
 * They're hidden until focused, then become visible.
 */
export const SkipLink: Story = {
  render: () => (
    <div className="p-4 space-y-4">
      <p className="text-sm text-muted-foreground mb-4">Press Tab to see the skip link appear:</p>
      <div className="relative">
        <VisuallyHidden focusable>
          <a
            href="#main-content"
            className="absolute top-2 left-2 z-50 px-4 py-2 bg-blue-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Skip to main content
          </a>
        </VisuallyHidden>

        <nav className="p-4 bg-gray-100 rounded-lg mb-4">
          <ul className="flex gap-4">
            <li>
              <a
                href="#home-section"
                className="text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              >
                Home
              </a>
            </li>
            <li>
              <a
                href="#about-section"
                className="text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              >
                About
              </a>
            </li>
            <li>
              <a
                href="#services-section"
                className="text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              >
                Services
              </a>
            </li>
            <li>
              <a
                href="#contact-section"
                className="text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              >
                Contact
              </a>
            </li>
          </ul>
        </nav>

        <main id="main-content" className="p-4 border rounded-lg">
          <h1 className="text-xl font-bold mb-2">Main Content</h1>
          <p>This is the main content area that the skip link jumps to.</p>
        </main>
      </div>
    </div>
  ),
};

/**
 * Focusable variant - content becomes visible when it or its children receive focus.
 * Useful for skip links and other focus-triggered content.
 */
export const Focusable: Story = {
  render: () => (
    <div className="p-4 space-y-4">
      <p className="text-sm text-muted-foreground mb-4">
        Tab through to see the focusable hidden content appear:
      </p>
      <div className="flex flex-col gap-4">
        <button
          type="button"
          className="self-start px-4 py-2 bg-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          First focusable element
        </button>

        <VisuallyHidden focusable>
          <a
            href="#focusable-demo"
            className="inline-block px-4 py-2 bg-yellow-200 text-yellow-900 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
          >
            I appear when focused!
          </a>
        </VisuallyHidden>

        <button
          type="button"
          className="self-start px-4 py-2 bg-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Last focusable element
        </button>
      </div>
    </div>
  ),
};

/**
 * Additional form context that's visually implied but helpful for screen readers.
 */
export const FormContext: Story = {
  render: () => (
    <div className="p-4 max-w-md">
      <form className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email address
            <VisuallyHidden> (required, we'll never share your email)</VisuallyHidden>
            <span className="text-red-500 ml-1" aria-hidden="true">
              *
            </span>
          </label>
          <input
            type="email"
            id="email"
            required
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            Password
            <VisuallyHidden> (required, minimum 8 characters)</VisuallyHidden>
            <span className="text-red-500 ml-1" aria-hidden="true">
              *
            </span>
          </label>
          <input
            type="password"
            id="password"
            required
            minLength={8}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your password"
          />
          <p className="text-xs text-muted-foreground mt-1">Must be at least 8 characters</p>
        </div>

        <button
          type="submit"
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Sign up
        </button>
      </form>
    </div>
  ),
};

/**
 * Announcement text for live regions - providing context that's
 * only needed by screen reader users.
 */
export const Announcements: Story = {
  render: () => (
    <div className="p-4 space-y-4">
      <p className="text-sm text-muted-foreground mb-4">
        These status badges have additional context for screen readers:
      </p>
      <div className="flex gap-4">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
          <span className="w-2 h-2 mr-2 bg-green-500 rounded-full" aria-hidden="true" />
          Active
          <VisuallyHidden> - Service is running normally</VisuallyHidden>
        </span>

        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
          <span className="w-2 h-2 mr-2 bg-yellow-500 rounded-full" aria-hidden="true" />
          Pending
          <VisuallyHidden> - Awaiting approval</VisuallyHidden>
        </span>

        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
          <span className="w-2 h-2 mr-2 bg-red-500 rounded-full" aria-hidden="true" />
          Error
          <VisuallyHidden> - Action required to resolve issue</VisuallyHidden>
        </span>
      </div>
    </div>
  ),
};

/**
 * Table headers that are visually clear from context but need labels for screen readers.
 */
export const TableContext: Story = {
  render: () => (
    <div className="p-4">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Name
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Status
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              <VisuallyHidden>Actions</VisuallyHidden>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          <tr>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              Project Alpha
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Active</td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <button
                type="button"
                className="text-blue-600 hover:text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              >
                Edit<VisuallyHidden> Project Alpha</VisuallyHidden>
              </button>
            </td>
          </tr>
          <tr>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              Project Beta
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Pending</td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <button
                type="button"
                className="text-blue-600 hover:text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              >
                Edit<VisuallyHidden> Project Beta</VisuallyHidden>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  ),
};

/**
 * Using the exported utilities for custom implementations.
 */
export const Utilities: Story = {
  render: () => (
    <div className="p-4 space-y-4">
      <p className="text-sm text-muted-foreground mb-4">
        The component exports utilities for custom implementations:
      </p>

      <div className="space-y-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium mb-2">visuallyHiddenClassName</h3>
          <p className="text-sm text-gray-600 mb-2">Tailwind class for visually hidden content:</p>
          <code className="px-2 py-1 bg-gray-200 rounded text-sm">{visuallyHiddenClassName}</code>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium mb-2">visuallyHiddenStyleObject</h3>
          <p className="text-sm text-gray-600 mb-2">
            CSS-in-JS style object for visually hidden content:
          </p>
          <pre className="px-2 py-1 bg-gray-200 rounded text-sm overflow-x-auto">
            {JSON.stringify(visuallyHiddenStyleObject, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  ),
};

/**
 * With custom className for additional styling.
 */
export const WithClassName: Story = {
  render: () => (
    <div className="p-4">
      <p className="text-sm text-muted-foreground mb-4">
        Custom className can be added for debugging or edge cases:
      </p>
      <div className="p-4 border rounded-lg">
        <span>Visible text </span>
        <VisuallyHidden className="debug-hidden" data-testid="hidden-text">
          Hidden text with custom class and data-testid
        </VisuallyHidden>
      </div>
    </div>
  ),
};

/**
 * Reading order context - helps screen reader users understand
 * the relationship between visual elements.
 */
export const ReadingOrder: Story = {
  render: () => (
    <div className="p-4">
      <p className="text-sm text-muted-foreground mb-4">
        VisuallyHidden can provide context about visual layout:
      </p>
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-blue-100 rounded-lg">
          <VisuallyHidden>Left column: </VisuallyHidden>
          <h2 className="font-bold mb-2">Features</h2>
          <p className="text-sm">Explore our product features.</p>
        </div>
        <div className="p-4 bg-green-100 rounded-lg">
          <VisuallyHidden>Right column: </VisuallyHidden>
          <h2 className="font-bold mb-2">Pricing</h2>
          <p className="text-sm">View our pricing plans.</p>
        </div>
      </div>
    </div>
  ),
};

/**
 * Interactive demo showing the difference between hidden and focusable modes.
 */
export const InteractiveDemo: Story = {
  render: () => (
    <div className="p-4 space-y-6">
      <div className="p-4 border rounded-lg">
        <h3 className="font-medium mb-2">Non-focusable (default)</h3>
        <p className="text-sm text-muted-foreground mb-2">
          Content stays hidden even when tabbing through:
        </p>
        <div className="flex gap-2 items-center">
          <button
            type="button"
            className="px-3 py-1 bg-gray-200 rounded focus:ring-2 focus:ring-blue-500"
          >
            Button 1
          </button>
          <VisuallyHidden>This is hidden text between buttons</VisuallyHidden>
          <button
            type="button"
            className="px-3 py-1 bg-gray-200 rounded focus:ring-2 focus:ring-blue-500"
          >
            Button 2
          </button>
        </div>
      </div>

      <div className="p-4 border rounded-lg">
        <h3 className="font-medium mb-2">Focusable</h3>
        <p className="text-sm text-muted-foreground mb-2">
          Content appears when child element receives focus:
        </p>
        <div className="flex gap-2 items-center">
          <button
            type="button"
            className="px-3 py-1 bg-gray-200 rounded focus:ring-2 focus:ring-blue-500"
          >
            Button 1
          </button>
          <VisuallyHidden focusable>
            <button
              type="button"
              className="px-3 py-1 bg-yellow-200 rounded focus:ring-2 focus:ring-yellow-500"
            >
              Hidden until focused
            </button>
          </VisuallyHidden>
          <button
            type="button"
            className="px-3 py-1 bg-gray-200 rounded focus:ring-2 focus:ring-blue-500"
          >
            Button 2
          </button>
        </div>
      </div>
    </div>
  ),
};
