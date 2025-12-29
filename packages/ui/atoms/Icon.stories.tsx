import type { Meta, StoryObj } from '@storybook/react';
import { Icon } from './Icon';
import {
  Search,
  Plus,
  Settings,
  Trash2,
  Edit,
  Check,
  X,
  AlertCircle,
  Info,
  ChevronRight,
  ChevronDown,
  Folder,
  File,
  GitBranch,
  Play,
  Square,
  Loader2,
} from 'lucide-react';

const meta: Meta<typeof Icon> = {
  title: 'Atoms/Icon',
  component: Icon,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    icon: {
      control: false,
      description: 'The Lucide icon component to render',
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Icon>;

/** Default icon with medium size */
export const Default: Story = {
  args: {
    icon: Search,
    size: 'md',
  },
};

/** Extra small icon */
export const ExtraSmall: Story = {
  args: {
    icon: Check,
    size: 'xs',
  },
};

/** Small icon */
export const Small: Story = {
  args: {
    icon: Plus,
    size: 'sm',
  },
};

/** Medium icon (default) */
export const Medium: Story = {
  args: {
    icon: Settings,
    size: 'md',
  },
};

/** Large icon */
export const Large: Story = {
  args: {
    icon: Trash2,
    size: 'lg',
  },
};

/** Extra large icon */
export const ExtraLarge: Story = {
  args: {
    icon: AlertCircle,
    size: 'xl',
  },
};

/** All sizes displayed together */
export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <div className="flex flex-col items-center gap-1">
        <Icon icon={Search} size="xs" />
        <span className="text-xs text-[rgb(var(--muted-foreground))]">xs</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <Icon icon={Search} size="sm" />
        <span className="text-xs text-[rgb(var(--muted-foreground))]">sm</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <Icon icon={Search} size="md" />
        <span className="text-xs text-[rgb(var(--muted-foreground))]">md</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <Icon icon={Search} size="lg" />
        <span className="text-xs text-[rgb(var(--muted-foreground))]">lg</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <Icon icon={Search} size="xl" />
        <span className="text-xs text-[rgb(var(--muted-foreground))]">xl</span>
      </div>
    </div>
  ),
};

/** Common action icons */
export const ActionIcons: Story = {
  render: () => (
    <div className="flex gap-3">
      <Icon icon={Plus} size="md" />
      <Icon icon={Edit} size="md" />
      <Icon icon={Trash2} size="md" />
      <Icon icon={Check} size="md" />
      <Icon icon={X} size="md" />
    </div>
  ),
};

/** Navigation icons */
export const NavigationIcons: Story = {
  render: () => (
    <div className="flex gap-3">
      <Icon icon={ChevronRight} size="md" />
      <Icon icon={ChevronDown} size="md" />
      <Icon icon={Search} size="md" />
      <Icon icon={Settings} size="md" />
    </div>
  ),
};

/** File and folder icons */
export const FileIcons: Story = {
  render: () => (
    <div className="flex gap-3">
      <Icon icon={Folder} size="md" />
      <Icon icon={File} size="md" />
      <Icon icon={GitBranch} size="md" />
    </div>
  ),
};

/** Status and feedback icons */
export const StatusIcons: Story = {
  render: () => (
    <div className="flex gap-3">
      <Icon icon={Check} size="md" className="text-green-500" />
      <Icon icon={X} size="md" className="text-red-500" />
      <Icon icon={AlertCircle} size="md" className="text-yellow-500" />
      <Icon icon={Info} size="md" className="text-blue-500" />
    </div>
  ),
};

/** Playback control icons */
export const ControlIcons: Story = {
  render: () => (
    <div className="flex gap-3">
      <Icon icon={Play} size="md" />
      <Icon icon={Square} size="md" />
      <Icon icon={Loader2} size="md" className="animate-spin" />
    </div>
  ),
};

/** Icon with custom color */
export const CustomColor: Story = {
  args: {
    icon: AlertCircle,
    size: 'lg',
    className: 'text-red-500',
  },
};

/** Icon with custom className */
export const CustomClassName: Story = {
  args: {
    icon: Settings,
    size: 'md',
    className: 'animate-spin text-blue-500',
  },
};
