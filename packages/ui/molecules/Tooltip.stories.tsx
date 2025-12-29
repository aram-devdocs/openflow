import type { Meta, StoryObj } from '@storybook/react';
import { HelpCircle, Info, Plus, Save, Settings, Trash2 } from 'lucide-react';
import { Button } from '../atoms/Button';
import { Icon } from '../atoms/Icon';
import { Tooltip } from './Tooltip';

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
      description: 'Delay before showing tooltip (ms)',
    },
    delayHide: {
      control: 'number',
      description: 'Delay before hiding tooltip (ms)',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the tooltip is disabled',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Tooltip>;

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

/** Tooltip with icon button trigger */
export const WithIconButton: Story = {
  render: () => (
    <div className="flex gap-4 p-16">
      <Tooltip content="More information">
        <button
          type="button"
          className="rounded-full p-2 hover:bg-[rgb(var(--muted))] transition-colors"
        >
          <Icon icon={Info} size="md" className="text-[rgb(var(--muted-foreground))]" />
        </button>
      </Tooltip>
      <Tooltip content="Help & Documentation">
        <button
          type="button"
          className="rounded-full p-2 hover:bg-[rgb(var(--muted))] transition-colors"
        >
          <Icon icon={HelpCircle} size="md" className="text-[rgb(var(--muted-foreground))]" />
        </button>
      </Tooltip>
      <Tooltip content="Settings">
        <button
          type="button"
          className="rounded-full p-2 hover:bg-[rgb(var(--muted))] transition-colors"
        >
          <Icon icon={Settings} size="md" className="text-[rgb(var(--muted-foreground))]" />
        </button>
      </Tooltip>
    </div>
  ),
};

/** Tooltip with custom delay */
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
      >
        <Button>
          <Icon icon={Save} size="sm" />
          Save
        </Button>
      </Tooltip>
    </div>
  ),
};

/** Disabled tooltip */
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

/** Toolbar with tooltips */
export const ToolbarExample: Story = {
  render: () => (
    <div className="p-16">
      <div className="flex items-center gap-1 rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--background))] p-1">
        <Tooltip content="Add new item (Cmd+N)" position="bottom">
          <button
            type="button"
            className="rounded p-2 hover:bg-[rgb(var(--muted))] transition-colors"
          >
            <Icon icon={Plus} size="sm" />
          </button>
        </Tooltip>
        <Tooltip content="Save changes (Cmd+S)" position="bottom">
          <button
            type="button"
            className="rounded p-2 hover:bg-[rgb(var(--muted))] transition-colors"
          >
            <Icon icon={Save} size="sm" />
          </button>
        </Tooltip>
        <Tooltip content="Settings (Cmd+,)" position="bottom">
          <button
            type="button"
            className="rounded p-2 hover:bg-[rgb(var(--muted))] transition-colors"
          >
            <Icon icon={Settings} size="sm" />
          </button>
        </Tooltip>
        <div className="mx-1 h-4 w-px bg-[rgb(var(--border))]" />
        <Tooltip content="Delete item (Cmd+D)" position="bottom">
          <button
            type="button"
            className="rounded p-2 hover:bg-[rgb(var(--destructive))]/10 text-[rgb(var(--destructive))] transition-colors"
          >
            <Icon icon={Trash2} size="sm" />
          </button>
        </Tooltip>
      </div>
    </div>
  ),
};

/** Tooltips on different button variants */
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

/** Tooltip with hide delay */
export const WithHideDelay: Story = {
  render: () => (
    <div className="p-16">
      <Tooltip content="This tooltip has a 300ms hide delay" delayHide={300}>
        <Button>Hover me</Button>
      </Tooltip>
    </div>
  ),
};

/** Keyboard navigation demo */
export const KeyboardNavigation: Story = {
  render: () => (
    <div className="flex flex-col gap-4 p-16">
      <p className="text-sm text-[rgb(var(--muted-foreground))]">
        Tab through these buttons to see tooltips appear on focus:
      </p>
      <div className="flex gap-4">
        <Tooltip content="First action">
          <Button variant="secondary">First</Button>
        </Tooltip>
        <Tooltip content="Second action">
          <Button variant="secondary">Second</Button>
        </Tooltip>
        <Tooltip content="Third action">
          <Button variant="secondary">Third</Button>
        </Tooltip>
      </div>
      <p className="text-xs text-[rgb(var(--muted-foreground))]">
        Press Escape to dismiss the tooltip while focused.
      </p>
    </div>
  ),
};

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
