import type { Meta, StoryObj } from '@storybook/react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bell,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Edit,
  ExternalLink,
  Eye,
  EyeOff,
  File,
  Folder,
  GitBranch,
  Heart,
  HelpCircle,
  Home,
  Info,
  Loader2,
  Lock,
  Mail,
  Menu,
  MoreHorizontal,
  Play,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Square,
  Star,
  Trash2,
  User,
  X,
  XCircle,
} from 'lucide-react';
import { useRef } from 'react';
import { Icon } from './Icon';

const meta: Meta<typeof Icon> = {
  title: 'Atoms/Icon',
  component: Icon,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Icon component for displaying Lucide React icons with standardized sizing and accessibility.

## Features
- **Decorative by default**: Icons are hidden from screen readers with \`aria-hidden={true}\`
- **Meaningful icons**: Use \`aria-label\` prop to make icons announced by screen readers
- **Responsive sizing**: Supports ResponsiveValue for breakpoint-aware sizing
- **forwardRef support**: Full ref forwarding to the SVG element
- **focusable="false"**: Prevents focus on the SVG element in IE/Edge

## Accessibility Guidelines
1. **Decorative icons** (next to text): Use without \`aria-label\` - the text provides meaning
2. **Meaningful icons** (standalone): Add \`aria-label\` to describe the icon's purpose
3. **Icon-only buttons**: Put \`aria-label\` on the button, NOT the icon
4. **Status indicators**: Consider using both icon and text for color-blind users
        `,
      },
    },
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
      description: 'Size of the icon - supports responsive values',
    },
    'aria-label': {
      control: 'text',
      description:
        'Accessible label for meaningful icons. When provided, icon is announced by screen readers.',
    },
    'data-testid': {
      control: 'text',
      description: 'Data attribute for testing',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Icon>;

// =============================================================================
// Basic Sizes
// =============================================================================

/** Default decorative icon with medium size */
export const Default: Story = {
  args: {
    icon: Search,
    size: 'md',
  },
};

/** Extra small icon (12x12px) */
export const ExtraSmall: Story = {
  args: {
    icon: Check,
    size: 'xs',
  },
};

/** Small icon (16x16px) */
export const Small: Story = {
  args: {
    icon: Plus,
    size: 'sm',
  },
};

/** Medium icon - default (20x20px) */
export const Medium: Story = {
  args: {
    icon: Settings,
    size: 'md',
  },
};

/** Large icon (24x24px) */
export const Large: Story = {
  args: {
    icon: Trash2,
    size: 'lg',
  },
};

/** Extra large icon (32x32px) */
export const ExtraLarge: Story = {
  args: {
    icon: AlertCircle,
    size: 'xl',
  },
};

/** All sizes displayed together */
export const AllSizes: Story = {
  render: () => (
    <div className="flex items-end gap-4">
      <div className="flex flex-col items-center gap-1">
        <Icon icon={Search} size="xs" />
        <span className="text-xs text-[rgb(var(--muted-foreground))]">xs (12px)</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <Icon icon={Search} size="sm" />
        <span className="text-xs text-[rgb(var(--muted-foreground))]">sm (16px)</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <Icon icon={Search} size="md" />
        <span className="text-xs text-[rgb(var(--muted-foreground))]">md (20px)</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <Icon icon={Search} size="lg" />
        <span className="text-xs text-[rgb(var(--muted-foreground))]">lg (24px)</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <Icon icon={Search} size="xl" />
        <span className="text-xs text-[rgb(var(--muted-foreground))]">xl (32px)</span>
      </div>
    </div>
  ),
};

// =============================================================================
// Responsive Sizing
// =============================================================================

/** Responsive sizing - icon grows at larger breakpoints */
export const ResponsiveSizing: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Icon icon={Menu} size={{ base: 'sm', md: 'md', lg: 'lg' }} />
        <span className="text-sm text-[rgb(var(--muted-foreground))]">
          sm → md → lg (resize browser to see)
        </span>
      </div>
      <div className="flex items-center gap-3">
        <Icon icon={Settings} size={{ base: 'md', lg: 'xl' }} />
        <span className="text-sm text-[rgb(var(--muted-foreground))]">
          md → xl at lg breakpoint
        </span>
      </div>
      <div className="flex items-center gap-3">
        <Icon icon={Bell} size={{ base: 'xs', sm: 'sm', md: 'md', lg: 'lg', xl: 'xl' }} />
        <span className="text-sm text-[rgb(var(--muted-foreground))]">
          Progressive: xs → sm → md → lg → xl
        </span>
      </div>
    </div>
  ),
};

// =============================================================================
// Accessibility - Decorative vs Meaningful Icons
// =============================================================================

/**
 * Decorative icons are hidden from screen readers (aria-hidden={true}).
 * Use when the icon is next to text that conveys the same meaning.
 */
export const DecorativeIcons: Story = {
  name: 'Decorative Icons (with text)',
  render: () => (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-[rgb(var(--muted-foreground))] max-w-md">
        These icons are decorative (no aria-label) because the text provides the meaning. Screen
        readers will skip the icon and read only the text.
      </p>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Icon icon={Plus} size="md" />
          <span>Add new item</span>
        </div>
        <div className="flex items-center gap-2">
          <Icon icon={Settings} size="md" />
          <span>Settings</span>
        </div>
        <div className="flex items-center gap-2">
          <Icon icon={Trash2} size="md" className="text-red-500" />
          <span>Delete</span>
        </div>
        <div className="flex items-center gap-2">
          <Icon icon={CheckCircle} size="md" className="text-green-500" />
          <span>Task completed</span>
        </div>
      </div>
    </div>
  ),
};

/**
 * Meaningful icons have an aria-label and are announced by screen readers.
 * Use when the icon is standalone and conveys information.
 */
export const MeaningfulIcons: Story = {
  name: 'Meaningful Icons (with aria-label)',
  render: () => (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-[rgb(var(--muted-foreground))] max-w-md">
        These icons have aria-label and are announced by screen readers. Use when the icon stands
        alone and conveys meaning without visible text.
      </p>
      <div className="flex gap-4">
        <div className="flex flex-col items-center gap-2">
          <Icon icon={AlertCircle} size="lg" className="text-yellow-500" aria-label="Warning" />
          <span className="text-xs text-[rgb(var(--muted-foreground))]">
            SR: &quot;Warning, image&quot;
          </span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Icon icon={CheckCircle} size="lg" className="text-green-500" aria-label="Success" />
          <span className="text-xs text-[rgb(var(--muted-foreground))]">
            SR: &quot;Success, image&quot;
          </span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Icon icon={XCircle} size="lg" className="text-red-500" aria-label="Error" />
          <span className="text-xs text-[rgb(var(--muted-foreground))]">
            SR: &quot;Error, image&quot;
          </span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Icon icon={Info} size="lg" className="text-blue-500" aria-label="Information" />
          <span className="text-xs text-[rgb(var(--muted-foreground))]">
            SR: &quot;Information, image&quot;
          </span>
        </div>
      </div>
    </div>
  ),
};

/**
 * Correct pattern for icon-only buttons: aria-label on button, NOT icon.
 */
export const IconOnlyButtonsCorrect: Story = {
  name: 'Icon Buttons (Correct Pattern)',
  render: () => (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-[rgb(var(--muted-foreground))] max-w-md">
        For icon-only buttons, put aria-label on the BUTTON, not the icon. The icon stays
        decorative.
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          aria-label="Add item"
          className="p-2 rounded-md hover:bg-[rgb(var(--muted))] focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))]"
        >
          <Icon icon={Plus} size="md" />
        </button>
        <button
          type="button"
          aria-label="Edit"
          className="p-2 rounded-md hover:bg-[rgb(var(--muted))] focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))]"
        >
          <Icon icon={Edit} size="md" />
        </button>
        <button
          type="button"
          aria-label="Delete"
          className="p-2 rounded-md hover:bg-[rgb(var(--muted))] focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))]"
        >
          <Icon icon={Trash2} size="md" className="text-red-500" />
        </button>
        <button
          type="button"
          aria-label="More options"
          className="p-2 rounded-md hover:bg-[rgb(var(--muted))] focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))]"
        >
          <Icon icon={MoreHorizontal} size="md" />
        </button>
      </div>
    </div>
  ),
};

// =============================================================================
// Common Icon Categories
// =============================================================================

/** Common action icons */
export const ActionIcons: Story = {
  render: () => (
    <div className="flex gap-3">
      <Icon icon={Plus} size="md" />
      <Icon icon={Edit} size="md" />
      <Icon icon={Trash2} size="md" />
      <Icon icon={Check} size="md" />
      <Icon icon={X} size="md" />
      <Icon icon={RefreshCw} size="md" />
    </div>
  ),
};

/** Navigation icons */
export const NavigationIcons: Story = {
  render: () => (
    <div className="flex gap-3">
      <Icon icon={Home} size="md" />
      <Icon icon={ArrowLeft} size="md" />
      <Icon icon={ArrowRight} size="md" />
      <Icon icon={ChevronRight} size="md" />
      <Icon icon={ChevronDown} size="md" />
      <Icon icon={Menu} size="md" />
      <Icon icon={ExternalLink} size="md" />
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

/** Status and feedback icons with semantic colors */
export const StatusIcons: Story = {
  render: () => (
    <div className="flex gap-4">
      <div className="flex flex-col items-center gap-1">
        <Icon icon={CheckCircle} size="lg" className="text-green-500" />
        <span className="text-xs text-[rgb(var(--muted-foreground))]">Success</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <Icon icon={XCircle} size="lg" className="text-red-500" />
        <span className="text-xs text-[rgb(var(--muted-foreground))]">Error</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <Icon icon={AlertTriangle} size="lg" className="text-yellow-500" />
        <span className="text-xs text-[rgb(var(--muted-foreground))]">Warning</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <Icon icon={Info} size="lg" className="text-blue-500" />
        <span className="text-xs text-[rgb(var(--muted-foreground))]">Info</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <Icon icon={HelpCircle} size="lg" className="text-purple-500" />
        <span className="text-xs text-[rgb(var(--muted-foreground))]">Help</span>
      </div>
    </div>
  ),
};

/** User interface icons */
export const UIIcons: Story = {
  render: () => (
    <div className="flex gap-3">
      <Icon icon={Search} size="md" />
      <Icon icon={Settings} size="md" />
      <Icon icon={Bell} size="md" />
      <Icon icon={User} size="md" />
      <Icon icon={Mail} size="md" />
      <Icon icon={Lock} size="md" />
    </div>
  ),
};

/** Interactive feedback icons */
export const InteractiveIcons: Story = {
  render: () => (
    <div className="flex gap-3">
      <Icon icon={Eye} size="md" />
      <Icon icon={EyeOff} size="md" />
      <Icon icon={Heart} size="md" />
      <Icon icon={Star} size="md" />
      <Icon icon={Check} size="md" />
      <Icon icon={X} size="md" />
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

// =============================================================================
// Styling
// =============================================================================

/** Icon with custom color using className */
export const CustomColor: Story = {
  args: {
    icon: AlertCircle,
    size: 'lg',
    className: 'text-red-500',
  },
};

/** Icon with animation */
export const Animated: Story = {
  args: {
    icon: Settings,
    size: 'lg',
    className: 'animate-spin text-blue-500',
  },
};

/** Loading spinner pattern */
export const LoadingSpinner: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Icon icon={Loader2} size="md" className="animate-spin" />
      <span className="text-sm">Loading...</span>
    </div>
  ),
};

/** Theme-aware colors */
export const ThemeAwareColors: Story = {
  render: () => (
    <div className="flex gap-4">
      <Icon icon={Star} size="lg" className="text-[rgb(var(--primary))]" />
      <Icon icon={Heart} size="lg" className="text-[rgb(var(--destructive))]" />
      <Icon icon={Check} size="lg" className="text-[rgb(var(--muted-foreground))]" />
      <Icon icon={Info} size="lg" className="text-[rgb(var(--foreground))]" />
    </div>
  ),
};

// =============================================================================
// Ref and Testing
// =============================================================================

/** forwardRef support for accessing the SVG element */
export const WithRef: Story = {
  render: () => {
    const iconRef = useRef<SVGSVGElement>(null);

    const handleClick = () => {
      if (iconRef.current) {
        const el = iconRef.current;
        const tagName = el.tagName;
        const className = el.getAttribute('class');
        // Log to demonstrate ref works - visible in browser console
        window.alert(`Icon ref: ${tagName}, classes: ${className}`);
      }
    };

    return (
      <div className="flex flex-col gap-4">
        <button
          type="button"
          onClick={handleClick}
          className="px-4 py-2 bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))] rounded-md hover:opacity-90"
        >
          Log ref to console
        </button>
        <Icon ref={iconRef} icon={Settings} size="lg" />
      </div>
    );
  },
};

/** With data-testid for testing */
export const WithTestId: Story = {
  args: {
    icon: Search,
    size: 'md',
    'data-testid': 'search-icon',
  },
};

// =============================================================================
// Real-world Examples
// =============================================================================

/** Breadcrumb navigation with icons */
export const BreadcrumbExample: Story = {
  render: () => (
    <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm">
      <button type="button" className="flex items-center gap-1 hover:underline text-inherit">
        <Icon icon={Home} size="sm" />
        Home
      </button>
      <Icon icon={ChevronRight} size="sm" className="text-[rgb(var(--muted-foreground))]" />
      <button type="button" className="hover:underline text-inherit">
        Projects
      </button>
      <Icon icon={ChevronRight} size="sm" className="text-[rgb(var(--muted-foreground))]" />
      <span className="text-[rgb(var(--muted-foreground))]">Current Page</span>
    </nav>
  ),
};

/** Status badges with icons */
export const StatusBadgesExample: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-green-500/20 text-green-600">
        <Icon icon={CheckCircle} size="sm" />
        <span className="text-sm font-medium">Completed</span>
      </div>
      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-yellow-500/20 text-yellow-600">
        <Icon icon={AlertTriangle} size="sm" />
        <span className="text-sm font-medium">Warning</span>
      </div>
      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-red-500/20 text-red-600">
        <Icon icon={XCircle} size="sm" />
        <span className="text-sm font-medium">Failed</span>
      </div>
      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-blue-500/20 text-blue-600">
        <Icon icon={Loader2} size="sm" className="animate-spin" />
        <span className="text-sm font-medium">Processing</span>
      </div>
    </div>
  ),
};

/** Action toolbar */
export const ActionToolbarExample: Story = {
  render: () => (
    <div className="flex items-center gap-1 p-1 rounded-lg border border-[rgb(var(--border))]">
      <button type="button" aria-label="Bold" className="p-2 rounded hover:bg-[rgb(var(--muted))]">
        <Icon icon={Edit} size="sm" />
      </button>
      <div className="w-px h-6 bg-[rgb(var(--border))]" />
      <button
        type="button"
        aria-label="Add link"
        className="p-2 rounded hover:bg-[rgb(var(--muted))]"
      >
        <Icon icon={ExternalLink} size="sm" />
      </button>
      <button
        type="button"
        aria-label="Add image"
        className="p-2 rounded hover:bg-[rgb(var(--muted))]"
      >
        <Icon icon={File} size="sm" />
      </button>
      <div className="w-px h-6 bg-[rgb(var(--border))]" />
      <button type="button" aria-label="Undo" className="p-2 rounded hover:bg-[rgb(var(--muted))]">
        <Icon icon={ArrowLeft} size="sm" />
      </button>
      <button type="button" aria-label="Redo" className="p-2 rounded hover:bg-[rgb(var(--muted))]">
        <Icon icon={ArrowRight} size="sm" />
      </button>
    </div>
  ),
};
