/**
 * Storybook stories for Tooltip molecule
 *
 * Demonstrates all tooltip features including:
 * - Position variants (top, bottom, left, right)
 * - Delay configurations
 * - Rich content support
 * - Accessibility features
 * - Keyboard navigation
 */

import type { Meta, StoryObj } from '@storybook/react';
import {
  AlertTriangle,
  Check,
  Copy,
  ExternalLink,
  HelpCircle,
  Info,
  Plus,
  Save,
  Settings,
  Trash2,
  X,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { Button } from '../atoms/Button';
import { Icon } from '../atoms/Icon';
import {
  DEFAULT_DELAY_HIDE,
  DEFAULT_DELAY_SHOW,
  TOOLTIP_ANIMATION_CLASSES,
  TOOLTIP_ARROW_BASE_CLASSES,
  TOOLTIP_ARROW_CLASSES,
  TOOLTIP_CONTAINER_CLASSES,
  TOOLTIP_CONTENT_CLASSES,
  TOOLTIP_MAX_WIDTH_CLASSES,
  TOOLTIP_POSITION_CLASSES,
  TOOLTIP_TRIGGER_CLASSES,
  Tooltip,
  getAccessibleDescription,
  getArrowClasses,
  getMaxWidthClass,
  getPositionClasses,
} from './Tooltip';

const meta: Meta<typeof Tooltip> = {
  title: 'Molecules/Tooltip',
  component: Tooltip,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    content: {
      control: 'text',
      description: 'Content to display in the tooltip',
    },
    position: {
      control: 'select',
      options: ['top', 'bottom', 'left', 'right'],
      description: 'Position of the tooltip relative to the trigger',
    },
    delayShow: {
      control: 'number',
      description: `Delay before showing tooltip (ms). Default: ${DEFAULT_DELAY_SHOW}`,
    },
    delayHide: {
      control: 'number',
      description: `Delay before hiding tooltip (ms). Default: ${DEFAULT_DELAY_HIDE}`,
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the tooltip is disabled',
    },
    maxWidth: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'none'],
      description: 'Maximum width of the tooltip',
    },
    'aria-label': {
      control: 'text',
      description: 'Accessible label when content is not a string',
    },
    'data-testid': {
      control: 'text',
      description: 'Data attributes for testing',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Tooltip>;

// ============================================================================
// Basic Examples
// ============================================================================

/** Default tooltip on top */
export const Default: Story = {
  render: () => (
    <div className="p-16">
      <Tooltip content="This is a helpful tooltip">
        <Button>Hover me</Button>
      </Tooltip>
    </div>
  ),
};

/** Tooltip positioned on the top (default) */
export const PositionTop: Story = {
  render: () => (
    <div className="p-16">
      <Tooltip content="Tooltip on top" position="top">
        <Button>Top</Button>
      </Tooltip>
    </div>
  ),
};

/** Tooltip positioned on the bottom */
export const PositionBottom: Story = {
  render: () => (
    <div className="p-16">
      <Tooltip content="Tooltip on bottom" position="bottom">
        <Button>Bottom</Button>
      </Tooltip>
    </div>
  ),
};

/** Tooltip positioned on the left */
export const PositionLeft: Story = {
  render: () => (
    <div className="p-16">
      <Tooltip content="Tooltip on left" position="left">
        <Button>Left</Button>
      </Tooltip>
    </div>
  ),
};

/** Tooltip positioned on the right */
export const PositionRight: Story = {
  render: () => (
    <div className="p-16">
      <Tooltip content="Tooltip on right" position="right">
        <Button>Right</Button>
      </Tooltip>
    </div>
  ),
};

/** All positions side by side */
export const AllPositions: Story = {
  render: () => (
    <div className="flex gap-8 p-16">
      <Tooltip content="Top tooltip" position="top">
        <Button variant="secondary">Top</Button>
      </Tooltip>
      <Tooltip content="Bottom tooltip" position="bottom">
        <Button variant="secondary">Bottom</Button>
      </Tooltip>
      <Tooltip content="Left tooltip" position="left">
        <Button variant="secondary">Left</Button>
      </Tooltip>
      <Tooltip content="Right tooltip" position="right">
        <Button variant="secondary">Right</Button>
      </Tooltip>
    </div>
  ),
};

// ============================================================================
// Delay Examples
// ============================================================================

/** Tooltip with instant show (0ms delay) */
export const InstantShow: Story = {
  render: () => (
    <div className="p-16">
      <Tooltip content="Instant appearance (0ms)" delayShow={0}>
        <Button>Instant (0ms)</Button>
      </Tooltip>
    </div>
  ),
};

/** Tooltip with slow show delay */
export const SlowShow: Story = {
  render: () => (
    <div className="p-16">
      <Tooltip content="Slow appearance (500ms)" delayShow={500}>
        <Button>Slow (500ms)</Button>
      </Tooltip>
    </div>
  ),
};

/** Tooltip with custom delay comparison */
export const CustomDelay: Story = {
  render: () => (
    <div className="flex gap-4 p-16">
      <Tooltip content="Instant (0ms)" delayShow={0}>
        <Button variant="ghost">Instant</Button>
      </Tooltip>
      <Tooltip content="Default (200ms)" delayShow={200}>
        <Button variant="ghost">Default</Button>
      </Tooltip>
      <Tooltip content="Slow (500ms)" delayShow={500}>
        <Button variant="ghost">Slow</Button>
      </Tooltip>
      <Tooltip content="Very slow (1000ms)" delayShow={1000}>
        <Button variant="ghost">Very slow</Button>
      </Tooltip>
    </div>
  ),
};

/** Tooltip with hide delay */
export const WithHideDelay: Story = {
  render: () => (
    <div className="p-16">
      <Tooltip content="This tooltip has a 300ms hide delay" delayHide={300}>
        <Button>Hover me (300ms hide delay)</Button>
      </Tooltip>
    </div>
  ),
};

// ============================================================================
// Content Examples
// ============================================================================

/** Tooltip with long content that wraps */
export const LongContent: Story = {
  render: () => (
    <div className="p-16">
      <Tooltip
        content="This is a much longer tooltip that will wrap to multiple lines. It contains detailed information about the element and provides helpful context for the user."
        position="bottom"
      >
        <Button>Hover for details</Button>
      </Tooltip>
    </div>
  ),
};

/** Tooltip with rich content */
export const RichContent: Story = {
  render: () => (
    <div className="p-16">
      <Tooltip
        content={
          <div className="flex flex-col gap-1">
            <span className="font-semibold">Keyboard Shortcut</span>
            <span className="text-[rgb(var(--muted-foreground))]">Cmd + S</span>
          </div>
        }
        aria-label="Save keyboard shortcut: Command + S"
      >
        <Button>
          <Icon icon={Save} size="sm" aria-hidden={true} />
          Save
        </Button>
      </Tooltip>
    </div>
  ),
};

/** Tooltip with icon content */
export const IconContent: Story = {
  render: () => (
    <div className="flex gap-4 p-16">
      <Tooltip
        content={
          <span className="flex items-center gap-1.5">
            <Icon icon={Check} size="xs" className="text-green-500" aria-hidden={true} />
            Saved successfully
          </span>
        }
        aria-label="Saved successfully"
      >
        <Button variant="ghost" size="sm">
          <Icon icon={Check} size="sm" className="text-green-500" aria-hidden={true} />
        </Button>
      </Tooltip>
      <Tooltip
        content={
          <span className="flex items-center gap-1.5">
            <Icon icon={AlertTriangle} size="xs" className="text-yellow-500" aria-hidden={true} />
            Unsaved changes
          </span>
        }
        aria-label="Unsaved changes warning"
      >
        <Button variant="ghost" size="sm">
          <Icon icon={AlertTriangle} size="sm" className="text-yellow-500" aria-hidden={true} />
        </Button>
      </Tooltip>
      <Tooltip
        content={
          <span className="flex items-center gap-1.5">
            <Icon icon={X} size="xs" className="text-red-500" aria-hidden={true} />
            Error occurred
          </span>
        }
        aria-label="Error occurred"
      >
        <Button variant="ghost" size="sm">
          <Icon icon={X} size="sm" className="text-red-500" aria-hidden={true} />
        </Button>
      </Tooltip>
    </div>
  ),
};

// ============================================================================
// Max Width Examples
// ============================================================================

/** Tooltip with different max widths */
export const MaxWidthVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4 p-16">
      <Tooltip
        content="This is a tooltip with xs max-width (20rem). It will wrap if the content is longer than this."
        maxWidth="xs"
        position="right"
      >
        <Button>XS max-width</Button>
      </Tooltip>
      <Tooltip
        content="This is a tooltip with sm max-width (24rem). It has more space for longer content."
        maxWidth="sm"
        position="right"
      >
        <Button>SM max-width</Button>
      </Tooltip>
      <Tooltip
        content="This is a tooltip with md max-width (28rem). Even more room for detailed explanations."
        maxWidth="md"
        position="right"
      >
        <Button>MD max-width</Button>
      </Tooltip>
      <Tooltip
        content="This is a tooltip with lg max-width (32rem). Suitable for very long explanatory text."
        maxWidth="lg"
        position="right"
      >
        <Button>LG max-width</Button>
      </Tooltip>
      <Tooltip
        content="No max-width limit - content determines width."
        maxWidth="none"
        position="right"
      >
        <Button>None (no limit)</Button>
      </Tooltip>
    </div>
  ),
};

// ============================================================================
// Disabled State
// ============================================================================

/** Disabled tooltip comparison */
export const Disabled: Story = {
  render: () => (
    <div className="flex gap-4 p-16">
      <Tooltip content="This tooltip is disabled" disabled>
        <Button>Disabled tooltip</Button>
      </Tooltip>
      <Tooltip content="This tooltip works">
        <Button>Enabled tooltip</Button>
      </Tooltip>
    </div>
  ),
};

// ============================================================================
// Icon Button Examples
// ============================================================================

/** Tooltip with icon button trigger */
export const WithIconButton: Story = {
  render: () => (
    <div className="flex gap-4 p-16">
      <Tooltip content="More information">
        <button
          type="button"
          className="rounded-full p-2 hover:bg-[rgb(var(--muted))] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))]"
          aria-label="More information"
        >
          <Icon
            icon={Info}
            size="md"
            className="text-[rgb(var(--muted-foreground))]"
            aria-hidden={true}
          />
        </button>
      </Tooltip>
      <Tooltip content="Help & Documentation">
        <button
          type="button"
          className="rounded-full p-2 hover:bg-[rgb(var(--muted))] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))]"
          aria-label="Help"
        >
          <Icon
            icon={HelpCircle}
            size="md"
            className="text-[rgb(var(--muted-foreground))]"
            aria-hidden={true}
          />
        </button>
      </Tooltip>
      <Tooltip content="Settings">
        <button
          type="button"
          className="rounded-full p-2 hover:bg-[rgb(var(--muted))] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))]"
          aria-label="Settings"
        >
          <Icon
            icon={Settings}
            size="md"
            className="text-[rgb(var(--muted-foreground))]"
            aria-hidden={true}
          />
        </button>
      </Tooltip>
    </div>
  ),
};

// ============================================================================
// Real-World Examples
// ============================================================================

/** Toolbar with tooltips */
export const ToolbarExample: Story = {
  render: () => (
    <div className="p-16">
      <div className="flex items-center gap-1 rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--background))] p-1">
        <Tooltip content="Add new item (Cmd+N)" position="bottom">
          <button
            type="button"
            className="rounded p-2 hover:bg-[rgb(var(--muted))] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))]"
            aria-label="Add new item"
          >
            <Icon icon={Plus} size="sm" aria-hidden={true} />
          </button>
        </Tooltip>
        <Tooltip content="Save changes (Cmd+S)" position="bottom">
          <button
            type="button"
            className="rounded p-2 hover:bg-[rgb(var(--muted))] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))]"
            aria-label="Save changes"
          >
            <Icon icon={Save} size="sm" aria-hidden={true} />
          </button>
        </Tooltip>
        <Tooltip content="Settings (Cmd+,)" position="bottom">
          <button
            type="button"
            className="rounded p-2 hover:bg-[rgb(var(--muted))] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))]"
            aria-label="Settings"
          >
            <Icon icon={Settings} size="sm" aria-hidden={true} />
          </button>
        </Tooltip>
        <div className="mx-1 h-4 w-px bg-[rgb(var(--border))]" aria-hidden="true" />
        <Tooltip content="Delete item (Cmd+D)" position="bottom">
          <button
            type="button"
            className="rounded p-2 hover:bg-[rgb(var(--destructive))]/10 text-[rgb(var(--destructive))] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))]"
            aria-label="Delete item"
          >
            <Icon icon={Trash2} size="sm" aria-hidden={true} />
          </button>
        </Tooltip>
      </div>
    </div>
  ),
};

/** Button variants with tooltips */
export const ButtonVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4 p-16">
      <Tooltip content="Primary button action">
        <Button variant="primary">Primary</Button>
      </Tooltip>
      <Tooltip content="Secondary button action">
        <Button variant="secondary">Secondary</Button>
      </Tooltip>
      <Tooltip content="Ghost button action">
        <Button variant="ghost">Ghost</Button>
      </Tooltip>
      <Tooltip content="Destructive button action">
        <Button variant="destructive">Destructive</Button>
      </Tooltip>
    </div>
  ),
};

/** Link with external indicator tooltip */
export const ExternalLinkExample: Story = {
  render: () => (
    <div className="p-16">
      <Tooltip content="Opens in a new tab">
        <a
          href="https://example.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[rgb(var(--primary))] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))]"
        >
          External link
          <Icon icon={ExternalLink} size="xs" aria-hidden={true} />
        </a>
      </Tooltip>
    </div>
  ),
};

/** Copy button with tooltip feedback */
export const CopyButtonExample: Story = {
  render: function CopyButtonStory() {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    return (
      <div className="p-16">
        <Tooltip content={copied ? 'Copied!' : 'Copy to clipboard'}>
          <button
            type="button"
            onClick={handleCopy}
            className="rounded p-2 hover:bg-[rgb(var(--muted))] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))]"
            aria-label="Copy to clipboard"
          >
            <Icon
              icon={copied ? Check : Copy}
              size="sm"
              className={copied ? 'text-green-500' : ''}
              aria-hidden={true}
            />
          </button>
        </Tooltip>
      </div>
    );
  },
};

// ============================================================================
// Accessibility Demos
// ============================================================================

/** Keyboard navigation demo */
export const KeyboardNavigation: Story = {
  render: () => (
    <div className="flex flex-col gap-4 p-16">
      <p className="text-sm text-[rgb(var(--muted-foreground))]">
        Tab through these buttons to see tooltips appear on focus. Press Escape to dismiss.
      </p>
      <div className="flex gap-4">
        <Tooltip content="First action - Tab here first">
          <Button variant="secondary">First</Button>
        </Tooltip>
        <Tooltip content="Second action - Tab to continue">
          <Button variant="secondary">Second</Button>
        </Tooltip>
        <Tooltip content="Third action - Last focusable item">
          <Button variant="secondary">Third</Button>
        </Tooltip>
      </div>
    </div>
  ),
};

/** Screen reader accessibility demo */
export const ScreenReaderAccessibility: Story = {
  render: () => (
    <div className="flex flex-col gap-4 p-16">
      <p className="text-sm text-[rgb(var(--muted-foreground))]">
        These tooltips are accessible to screen readers via aria-describedby and aria-live
        announcements.
      </p>
      <div className="flex gap-4">
        <Tooltip content="Simple text content is announced automatically">
          <Button>Text tooltip</Button>
        </Tooltip>
        <Tooltip
          content={
            <div className="flex items-center gap-2">
              <Icon icon={Info} size="xs" aria-hidden={true} />
              <span>Rich content with icon</span>
            </div>
          }
          aria-label="Tooltip with icon: Rich content with icon"
        >
          <Button>Rich tooltip</Button>
        </Tooltip>
      </div>
    </div>
  ),
};

/** Focus ring visibility demo */
export const FocusRingVisibility: Story = {
  render: () => (
    <div className="flex flex-col gap-4 p-16">
      <p className="text-sm text-[rgb(var(--muted-foreground))]">
        Focus visible rings are maintained on tooltip triggers. Tab to see focus indicators.
      </p>
      <div className="flex gap-4">
        <Tooltip content="Focus ring visible on button">
          <Button>Focusable button</Button>
        </Tooltip>
        <Tooltip content="Focus ring on icon button">
          <button
            type="button"
            className="rounded-full p-2 hover:bg-[rgb(var(--muted))] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))] focus-visible:ring-offset-2"
            aria-label="Help"
          >
            <Icon icon={HelpCircle} size="md" aria-hidden={true} />
          </button>
        </Tooltip>
      </div>
    </div>
  ),
};

/** Reduced motion demo */
export const ReducedMotionDemo: Story = {
  render: () => (
    <div className="flex flex-col gap-4 p-16">
      <p className="text-sm text-[rgb(var(--muted-foreground))]">
        Animation is disabled when prefers-reduced-motion is enabled. Toggle this in your OS
        accessibility settings.
      </p>
      <Tooltip content="Animation respects prefers-reduced-motion">
        <Button>Hover to see animation</Button>
      </Tooltip>
      <p className="text-xs text-[rgb(var(--muted-foreground))]">
        Animation classes used:{' '}
        <code className="bg-[rgb(var(--muted))] px-1 rounded">motion-safe:animate-in</code>
      </p>
    </div>
  ),
};

// ============================================================================
// Ref Forwarding & Data Attributes
// ============================================================================

/** Ref forwarding demo */
export const RefForwarding: Story = {
  render: function RefForwardingStory() {
    const tooltipRef = useRef<HTMLDivElement>(null);

    return (
      <div className="flex flex-col gap-4 p-16">
        <p className="text-sm text-[rgb(var(--muted-foreground))]">
          The Tooltip component supports ref forwarding for programmatic access.
        </p>
        <Tooltip ref={tooltipRef} content="Tooltip with forwarded ref">
          <Button
            onClick={() => {
              if (tooltipRef.current) {
                // Access the outer container
                alert(`Tooltip container width: ${tooltipRef.current.offsetWidth}px`);
              }
            }}
          >
            Click to check ref
          </Button>
        </Tooltip>
      </div>
    );
  },
};

/** Data-testid demo */
export const DataTestId: Story = {
  render: () => (
    <div className="flex flex-col gap-4 p-16">
      <p className="text-sm text-[rgb(var(--muted-foreground))]">
        The Tooltip component supports data-testid for automated testing.
      </p>
      <Tooltip content="Tooltip with test ID" data-testid="demo-tooltip">
        <Button>Hover to inspect</Button>
      </Tooltip>
      <div className="text-xs text-[rgb(var(--muted-foreground))] space-y-1">
        <p>
          <code>data-testid="demo-tooltip"</code> - Container
        </p>
        <p>
          <code>data-testid="demo-tooltip-trigger"</code> - Trigger wrapper
        </p>
        <p>
          <code>data-testid="demo-tooltip-tooltip"</code> - Tooltip element
        </p>
        <p>
          <code>data-state="open|closed"</code> - Current state
        </p>
        <p>
          <code>data-position="top|bottom|left|right"</code> - Position
        </p>
      </div>
    </div>
  ),
};

// ============================================================================
// Showcase
// ============================================================================

/** Showcase all tooltip features */
export const Showcase: Story = {
  render: () => (
    <div className="flex flex-col gap-8 p-16">
      <div>
        <h3 className="mb-2 text-sm font-medium text-[rgb(var(--foreground))]">Positions</h3>
        <div className="flex gap-4">
          <Tooltip content="Top" position="top">
            <Button size="sm" variant="ghost">
              Top
            </Button>
          </Tooltip>
          <Tooltip content="Bottom" position="bottom">
            <Button size="sm" variant="ghost">
              Bottom
            </Button>
          </Tooltip>
          <Tooltip content="Left" position="left">
            <Button size="sm" variant="ghost">
              Left
            </Button>
          </Tooltip>
          <Tooltip content="Right" position="right">
            <Button size="sm" variant="ghost">
              Right
            </Button>
          </Tooltip>
        </div>
      </div>
      <div>
        <h3 className="mb-2 text-sm font-medium text-[rgb(var(--foreground))]">Delays</h3>
        <div className="flex gap-4">
          <Tooltip content="0ms delay" delayShow={0}>
            <Button size="sm" variant="ghost">
              Instant
            </Button>
          </Tooltip>
          <Tooltip content="500ms delay" delayShow={500}>
            <Button size="sm" variant="ghost">
              Delayed
            </Button>
          </Tooltip>
        </div>
      </div>
      <div>
        <h3 className="mb-2 text-sm font-medium text-[rgb(var(--foreground))]">Content Types</h3>
        <div className="flex gap-4">
          <Tooltip content="Simple text">
            <Button size="sm" variant="ghost">
              Text
            </Button>
          </Tooltip>
          <Tooltip
            content={
              <div>
                <strong>Rich content</strong>
                <br />
                With multiple lines
              </div>
            }
            aria-label="Rich content with multiple lines"
          >
            <Button size="sm" variant="ghost">
              Rich
            </Button>
          </Tooltip>
        </div>
      </div>
    </div>
  ),
};

// ============================================================================
// Constants Reference
// ============================================================================

/** Reference to exported constants and utilities */
export const ConstantsReference: Story = {
  render: () => (
    <div className="flex flex-col gap-4 p-8 max-w-2xl">
      <h3 className="text-lg font-semibold">Exported Constants</h3>

      <div className="space-y-2">
        <h4 className="font-medium">Default Values</h4>
        <pre className="bg-[rgb(var(--muted))] p-2 rounded text-xs overflow-auto">
          {`DEFAULT_DELAY_SHOW = ${DEFAULT_DELAY_SHOW}
DEFAULT_DELAY_HIDE = ${DEFAULT_DELAY_HIDE}`}
        </pre>
      </div>

      <div className="space-y-2">
        <h4 className="font-medium">Position Classes</h4>
        <pre className="bg-[rgb(var(--muted))] p-2 rounded text-xs overflow-auto">
          {JSON.stringify(TOOLTIP_POSITION_CLASSES, null, 2)}
        </pre>
      </div>

      <div className="space-y-2">
        <h4 className="font-medium">Arrow Classes</h4>
        <pre className="bg-[rgb(var(--muted))] p-2 rounded text-xs overflow-auto">
          {JSON.stringify(TOOLTIP_ARROW_CLASSES, null, 2)}
        </pre>
      </div>

      <div className="space-y-2">
        <h4 className="font-medium">Max Width Classes</h4>
        <pre className="bg-[rgb(var(--muted))] p-2 rounded text-xs overflow-auto">
          {JSON.stringify(TOOLTIP_MAX_WIDTH_CLASSES, null, 2)}
        </pre>
      </div>

      <div className="space-y-2">
        <h4 className="font-medium">Container Classes</h4>
        <pre className="bg-[rgb(var(--muted))] p-2 rounded text-xs overflow-auto">
          TOOLTIP_CONTAINER_CLASSES = "{TOOLTIP_CONTAINER_CLASSES}"
        </pre>
      </div>

      <div className="space-y-2">
        <h4 className="font-medium">Animation Classes</h4>
        <pre className="bg-[rgb(var(--muted))] p-2 rounded text-xs overflow-auto">
          TOOLTIP_ANIMATION_CLASSES = "{TOOLTIP_ANIMATION_CLASSES}"
        </pre>
      </div>

      <div className="space-y-2">
        <h4 className="font-medium">Content Classes</h4>
        <pre className="bg-[rgb(var(--muted))] p-2 rounded text-xs overflow-auto">
          TOOLTIP_CONTENT_CLASSES = "{TOOLTIP_CONTENT_CLASSES}"
        </pre>
      </div>

      <div className="space-y-2">
        <h4 className="font-medium">Arrow Base Classes</h4>
        <pre className="bg-[rgb(var(--muted))] p-2 rounded text-xs overflow-auto">
          TOOLTIP_ARROW_BASE_CLASSES = "{TOOLTIP_ARROW_BASE_CLASSES}"
        </pre>
      </div>

      <div className="space-y-2">
        <h4 className="font-medium">Trigger Classes</h4>
        <pre className="bg-[rgb(var(--muted))] p-2 rounded text-xs overflow-auto">
          TOOLTIP_TRIGGER_CLASSES = "{TOOLTIP_TRIGGER_CLASSES}"
        </pre>
      </div>

      <h3 className="text-lg font-semibold mt-4">Utility Functions</h3>

      <div className="space-y-2">
        <h4 className="font-medium">getPositionClasses(position)</h4>
        <pre className="bg-[rgb(var(--muted))] p-2 rounded text-xs overflow-auto">
          {`getPositionClasses('top') = "${getPositionClasses('top')}"
getPositionClasses('bottom') = "${getPositionClasses('bottom')}"
getPositionClasses('left') = "${getPositionClasses('left')}"
getPositionClasses('right') = "${getPositionClasses('right')}"`}
        </pre>
      </div>

      <div className="space-y-2">
        <h4 className="font-medium">getArrowClasses(position)</h4>
        <pre className="bg-[rgb(var(--muted))] p-2 rounded text-xs overflow-auto">
          {`getArrowClasses('top') = "${getArrowClasses('top').slice(0, 50)}..."`}
        </pre>
      </div>

      <div className="space-y-2">
        <h4 className="font-medium">getMaxWidthClass(maxWidth)</h4>
        <pre className="bg-[rgb(var(--muted))] p-2 rounded text-xs overflow-auto">
          {`getMaxWidthClass('xs') = "${getMaxWidthClass('xs')}"
getMaxWidthClass('sm') = "${getMaxWidthClass('sm')}"
getMaxWidthClass('md') = "${getMaxWidthClass('md')}"
getMaxWidthClass('lg') = "${getMaxWidthClass('lg')}"
getMaxWidthClass('none') = "${getMaxWidthClass('none')}"`}
        </pre>
      </div>

      <div className="space-y-2">
        <h4 className="font-medium">getAccessibleDescription(content, ariaLabel)</h4>
        <pre className="bg-[rgb(var(--muted))] p-2 rounded text-xs overflow-auto">
          {`getAccessibleDescription('Hello') = "${getAccessibleDescription('Hello')}"
getAccessibleDescription(42) = "${getAccessibleDescription(42)}"
getAccessibleDescription(<div/>, 'Custom label') = "${getAccessibleDescription(<div />, 'Custom label')}"
getAccessibleDescription(<div/>) = "${getAccessibleDescription(<div />)}"`}
        </pre>
      </div>
    </div>
  ),
};
