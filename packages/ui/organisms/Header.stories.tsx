import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { useState } from 'react';
import {
  DEFAULT_APP_NAME,
  DEFAULT_CLOSE_MENU_LABEL,
  // Constants
  DEFAULT_HEADER_LABEL,
  DEFAULT_NEW_CHAT_LABEL,
  DEFAULT_NEW_TERMINAL_LABEL,
  DEFAULT_OPEN_MENU_LABEL,
  DEFAULT_SEARCH_LABEL,
  HEADER_BUTTON_GAP_CLASSES,
  HEADER_BUTTON_SIZE_MAP,
  HEADER_ICON_SIZE_MAP,
  HEADER_PADDING_CLASSES,
  HEADER_SUBTITLE_SIZE_CLASSES,
  HEADER_TITLE_SIZE_CLASSES,
  Header,
  KEYBOARD_SHORTCUT_TEXT,
  SR_MENU_CLOSED,
  SR_MENU_OPENED,
  buildHeaderAccessibleLabel,
  // Utility functions
  getBaseSize,
  getMenuButtonLabel,
  getMenuStateAnnouncement,
} from './Header';

const meta = {
  title: 'Organisms/Header',
  component: Header,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
Header component for top navigation with role="banner" landmark.

## Features
- **role="banner" landmark** for accessibility screen readers
- **Responsive sizing** with mobile hamburger menu
- **Search button** that opens the CommandPalette (Cmd+K)
- **New chat button** for quick chat creation
- **New terminal button** for opening a terminal session
- **Optional title and subtitle** display
- **Quick theme toggle**
- **Screen reader announcements** for menu state changes
- **Touch targets ≥44px** (WCAG 2.5.5)

## Accessibility
- Uses \`role="banner"\` landmark (semantically equivalent to direct child of body \`<header>\`)
- Navigation wrapped in \`<nav aria-label="Quick actions">\`
- All interactive elements have accessible names
- Mobile menu button has \`aria-expanded\` state
- Screen reader announcements for menu state changes
- Keyboard shortcut hint is visible and announced
        `,
      },
    },
  },
  tags: ['autodocs'],
  args: {
    onSearch: fn(),
    onNewChat: fn(),
    onNewTerminal: fn(),
    onMenuToggle: fn(),
    onThemeToggle: fn(),
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Responsive size affecting padding and buttons',
    },
    resolvedTheme: {
      control: 'select',
      options: ['light', 'dark'],
      description: 'Current resolved theme',
    },
  },
  decorators: [
    (Story) => (
      <div className="w-full h-14 bg-[rgb(var(--background))]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Header>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Basic Examples
// ============================================================================

/**
 * Default header with all features enabled
 */
export const Default: Story = {
  args: {},
};

/**
 * Header with title and subtitle
 */
export const WithTitle: Story = {
  args: {
    title: 'OpenFlow Project',
    subtitle: '3 tasks in progress',
  },
};

/**
 * Header with title only
 */
export const WithTitleOnly: Story = {
  args: {
    title: 'My Awesome Project',
  },
};

/**
 * Header with long title and subtitle (tests truncation)
 */
export const LongTitleAndSubtitle: Story = {
  args: {
    title: 'This is a very long project name that might need truncation',
    subtitle: 'Currently working on 15 tasks across 3 different workflows',
  },
};

// ============================================================================
// Feature Toggles
// ============================================================================

/**
 * Header with only search enabled
 */
export const SearchOnly: Story = {
  args: {
    newChatEnabled: false,
    newTerminalEnabled: false,
    showMenuButton: false,
  },
};

/**
 * Header with only new chat enabled
 */
export const NewChatOnly: Story = {
  args: {
    searchEnabled: false,
    newTerminalEnabled: false,
    showMenuButton: false,
  },
};

/**
 * Header with only new terminal enabled
 */
export const NewTerminalOnly: Story = {
  args: {
    searchEnabled: false,
    newChatEnabled: false,
    showMenuButton: false,
  },
};

/**
 * Header with search and new chat (no terminal)
 */
export const SearchAndChat: Story = {
  args: {
    title: 'Task: Implement Authentication',
    newTerminalEnabled: false,
  },
};

/**
 * Header with all features disabled (minimal)
 */
export const Minimal: Story = {
  args: {
    searchEnabled: false,
    newChatEnabled: false,
    newTerminalEnabled: false,
    showMenuButton: false,
  },
};

/**
 * Header with all features and title
 */
export const Complete: Story = {
  args: {
    title: 'OpenFlow',
    subtitle: 'AI Task Orchestration',
    searchEnabled: true,
    newChatEnabled: true,
    newTerminalEnabled: true,
    resolvedTheme: 'dark',
  },
};

// ============================================================================
// Size Variants
// ============================================================================

/**
 * Small size header
 */
export const SizeSmall: Story = {
  args: {
    size: 'sm',
    title: 'Compact Header',
  },
};

/**
 * Medium size header (default)
 */
export const SizeMedium: Story = {
  args: {
    size: 'md',
    title: 'Medium Header',
  },
};

/**
 * Large size header
 */
export const SizeLarge: Story = {
  args: {
    size: 'lg',
    title: 'Large Header',
  },
};

/**
 * All sizes comparison
 */
export const AllSizes: Story = {
  decorators: [
    () => (
      <div className="space-y-4 p-4 bg-[rgb(var(--background))]">
        <div className="h-12">
          <Header size="sm" title="Small Header" subtitle="Compact layout" />
        </div>
        <div className="h-14">
          <Header size="md" title="Medium Header" subtitle="Default layout" />
        </div>
        <div className="h-16">
          <Header size="lg" title="Large Header" subtitle="Spacious layout" />
        </div>
      </div>
    ),
  ],
};

/**
 * Responsive sizing - changes with breakpoints
 */
export const ResponsiveSizing: Story = {
  args: {
    size: { base: 'sm', md: 'md', lg: 'lg' },
    title: 'Responsive Header',
    subtitle: 'Resize to see size change',
  },
};

// ============================================================================
// Theme Toggle
// ============================================================================

/**
 * Header with light theme
 */
export const LightTheme: Story = {
  args: {
    title: 'Light Mode',
    resolvedTheme: 'light',
  },
};

/**
 * Header with dark theme
 */
export const DarkTheme: Story = {
  args: {
    title: 'Dark Mode',
    resolvedTheme: 'dark',
  },
};

// ============================================================================
// Mobile Menu
// ============================================================================

/**
 * Interactive mobile menu toggle
 */
export const InteractiveMobileMenu: Story = {
  decorators: [
    () => {
      const [isMenuOpen, setIsMenuOpen] = useState(false);
      return (
        <div className="h-14">
          <Header
            title="Mobile Menu Demo"
            subtitle={isMenuOpen ? 'Menu is open' : 'Menu is closed'}
            isMenuOpen={isMenuOpen}
            onMenuToggle={() => setIsMenuOpen(!isMenuOpen)}
            showMenuButton={true}
            data-testid="mobile-menu-demo"
          />
        </div>
      );
    },
  ],
  parameters: {
    docs: {
      description: {
        story:
          'Resize to mobile width to see the hamburger menu button. The menu button is hidden on desktop (md breakpoint and above).',
      },
    },
  },
};

/**
 * Mobile menu open state
 */
export const MobileMenuOpen: Story = {
  args: {
    title: 'Menu Open',
    isMenuOpen: true,
    showMenuButton: true,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

/**
 * Mobile menu closed state
 */
export const MobileMenuClosed: Story = {
  args: {
    title: 'Menu Closed',
    isMenuOpen: false,
    showMenuButton: true,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

// ============================================================================
// Accessibility Demos
// ============================================================================

/**
 * Demonstrates the banner landmark and navigation structure
 */
export const AccessibilityDemo: Story = {
  args: {
    title: 'Accessibility Demo',
    subtitle: 'Inspect the DOM to see ARIA attributes',
    'aria-label': 'Main application header',
    'data-testid': 'a11y-demo-header',
    resolvedTheme: 'dark',
  },
  parameters: {
    docs: {
      description: {
        story: `
This demo highlights accessibility features:

- \`role="banner"\` on the header element
- \`aria-label\` for the header region
- \`aria-labelledby\` pointing to the title when present
- \`<nav aria-label="Quick actions">\` for desktop navigation
- All buttons have accessible labels via \`aria-label\`
- Screen reader announcements for menu state changes
        `,
      },
    },
  },
};

/**
 * Focus ring visibility demo
 */
export const FocusRingVisibility: Story = {
  args: {
    title: 'Tab through buttons',
    resolvedTheme: 'dark',
  },
  parameters: {
    docs: {
      description: {
        story: 'Use Tab key to navigate through buttons and see the focus ring styling.',
      },
    },
  },
};

/**
 * Touch target accessibility demo
 */
export const TouchTargetAccessibility: Story = {
  args: {
    title: 'Touch Targets',
    subtitle: 'All buttons ≥44px for WCAG 2.5.5',
    showMenuButton: true,
    resolvedTheme: 'dark',
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story:
          'On mobile, the hamburger menu button has a minimum touch target of 44px for WCAG 2.5.5 compliance.',
      },
    },
  },
};

/**
 * Screen reader accessibility demo
 */
export const ScreenReaderAccessibility: Story = {
  decorators: [
    () => {
      const [isMenuOpen, setIsMenuOpen] = useState(false);
      return (
        <div className="space-y-4 p-4">
          <div className="h-14 bg-[rgb(var(--background))]">
            <Header
              title="Screen Reader Demo"
              subtitle="Toggle menu to hear announcements"
              isMenuOpen={isMenuOpen}
              onMenuToggle={() => setIsMenuOpen(!isMenuOpen)}
              showMenuButton={true}
            />
          </div>
          <div className="text-sm text-[rgb(var(--muted-foreground))]">
            <p>
              <strong>Announcements:</strong> When the menu opens, screen readers will announce "
              {SR_MENU_OPENED}". When closed, they announce "{SR_MENU_CLOSED}".
            </p>
          </div>
        </div>
      );
    },
  ],
};

/**
 * Keyboard navigation demo
 */
export const KeyboardNavigation: Story = {
  args: {
    title: 'Keyboard Navigation',
    subtitle: 'Tab through all interactive elements',
    resolvedTheme: 'dark',
    'data-testid': 'keyboard-nav-demo',
  },
  parameters: {
    docs: {
      description: {
        story: `
Use keyboard to navigate:
- **Tab**: Move to next interactive element
- **Shift+Tab**: Move to previous element
- **Enter/Space**: Activate buttons
- **Escape**: Close menus (when applicable)
        `,
      },
    },
  },
};

// ============================================================================
// Real-World Examples
// ============================================================================

/**
 * Project context header
 */
export const ProjectContext: Story = {
  args: {
    title: 'Feature: User Authentication',
    subtitle: 'Step: Implementation (2/4)',
    resolvedTheme: 'dark',
  },
};

/**
 * Task context header
 */
export const TaskContext: Story = {
  args: {
    title: 'Implement dark mode toggle',
    subtitle: 'In Progress - 2 chats active',
    resolvedTheme: 'dark',
  },
};

/**
 * Dashboard header
 */
export const DashboardHeader: Story = {
  args: {
    title: 'Dashboard',
    subtitle: '5 active projects',
    searchEnabled: true,
    newChatEnabled: true,
    newTerminalEnabled: false,
    resolvedTheme: 'dark',
  },
};

/**
 * Settings page header
 */
export const SettingsHeader: Story = {
  args: {
    title: 'Settings',
    searchEnabled: false,
    newChatEnabled: false,
    newTerminalEnabled: false,
    resolvedTheme: 'light',
  },
};

/**
 * Chat page header
 */
export const ChatPageHeader: Story = {
  args: {
    title: 'Chat: Bug Analysis',
    subtitle: 'With Claude',
    searchEnabled: true,
    newChatEnabled: true,
    newTerminalEnabled: true,
    resolvedTheme: 'dark',
  },
};

// ============================================================================
// Data Attributes Demo
// ============================================================================

/**
 * Data attributes for testing
 */
export const DataAttributesDemo: Story = {
  args: {
    title: 'Data Attributes',
    subtitle: 'Inspect to see test IDs',
    'data-testid': 'demo-header',
    resolvedTheme: 'dark',
    showMenuButton: true,
  },
  parameters: {
    docs: {
      description: {
        story: `
Data attributes available for testing:
- \`data-testid\`: Main test ID
- \`data-testid-title\`: Title element
- \`data-testid-subtitle\`: Subtitle element
- \`data-testid-nav\`: Navigation container
- \`data-testid-menu-button\`: Mobile menu button
- \`data-testid-search-button\`: Search button
- \`data-testid-new-chat-button\`: New chat button
- \`data-testid-new-terminal-button\`: New terminal button
- \`data-testid-theme-toggle\`: Theme toggle
- \`data-size\`: Current size value
- \`data-menu-open\`: Menu open state
        `,
      },
    },
  },
};

// ============================================================================
// Ref Forwarding Demo
// ============================================================================

/**
 * forwardRef support demo
 */
export const RefForwarding: Story = {
  decorators: [
    () => {
      const headerRef = { current: null as HTMLElement | null };
      return (
        <div className="space-y-4 p-4">
          <div className="h-14 bg-[rgb(var(--background))]">
            <Header
              ref={(el) => {
                headerRef.current = el;
              }}
              title="Ref Forwarding"
              subtitle="Check console for ref info"
              data-testid="ref-demo"
            />
          </div>
          <button
            type="button"
            className="px-4 py-2 bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))] rounded"
            onClick={() => {
              if (headerRef.current) {
                console.log('Header ref:', headerRef.current);
                console.log('Header tagName:', headerRef.current.tagName);
                console.log('Header role:', headerRef.current.getAttribute('role'));
              }
            }}
          >
            Log Header Ref
          </button>
        </div>
      );
    },
  ],
};

// ============================================================================
// Constants Reference
// ============================================================================

/**
 * Constants reference for testing and customization
 */
export const ConstantsReference: Story = {
  decorators: [
    () => (
      <div className="p-4 space-y-4 text-sm font-mono">
        <h3 className="text-lg font-bold mb-4">Exported Constants</h3>

        <div className="space-y-2">
          <h4 className="font-semibold">Default Labels</h4>
          <div className="pl-4 space-y-1 text-[rgb(var(--muted-foreground))]">
            <p>DEFAULT_HEADER_LABEL: "{DEFAULT_HEADER_LABEL}"</p>
            <p>DEFAULT_APP_NAME: "{DEFAULT_APP_NAME}"</p>
            <p>DEFAULT_SEARCH_LABEL: "{DEFAULT_SEARCH_LABEL}"</p>
            <p>DEFAULT_NEW_CHAT_LABEL: "{DEFAULT_NEW_CHAT_LABEL}"</p>
            <p>DEFAULT_NEW_TERMINAL_LABEL: "{DEFAULT_NEW_TERMINAL_LABEL}"</p>
            <p>DEFAULT_OPEN_MENU_LABEL: "{DEFAULT_OPEN_MENU_LABEL}"</p>
            <p>DEFAULT_CLOSE_MENU_LABEL: "{DEFAULT_CLOSE_MENU_LABEL}"</p>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold">Screen Reader Announcements</h4>
          <div className="pl-4 space-y-1 text-[rgb(var(--muted-foreground))]">
            <p>SR_MENU_OPENED: "{SR_MENU_OPENED}"</p>
            <p>SR_MENU_CLOSED: "{SR_MENU_CLOSED}"</p>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold">UI Constants</h4>
          <div className="pl-4 space-y-1 text-[rgb(var(--muted-foreground))]">
            <p>KEYBOARD_SHORTCUT_TEXT: "{KEYBOARD_SHORTCUT_TEXT}"</p>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold">Size Classes</h4>
          <div className="pl-4 space-y-1 text-[rgb(var(--muted-foreground))]">
            <p>HEADER_PADDING_CLASSES: {JSON.stringify(HEADER_PADDING_CLASSES)}</p>
            <p>HEADER_TITLE_SIZE_CLASSES: {JSON.stringify(HEADER_TITLE_SIZE_CLASSES)}</p>
            <p>HEADER_SUBTITLE_SIZE_CLASSES: {JSON.stringify(HEADER_SUBTITLE_SIZE_CLASSES)}</p>
            <p>HEADER_BUTTON_GAP_CLASSES: {JSON.stringify(HEADER_BUTTON_GAP_CLASSES)}</p>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold">Size Maps</h4>
          <div className="pl-4 space-y-1 text-[rgb(var(--muted-foreground))]">
            <p>HEADER_ICON_SIZE_MAP: {JSON.stringify(HEADER_ICON_SIZE_MAP)}</p>
            <p>HEADER_BUTTON_SIZE_MAP: {JSON.stringify(HEADER_BUTTON_SIZE_MAP)}</p>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold">Utility Functions</h4>
          <div className="pl-4 space-y-1 text-[rgb(var(--muted-foreground))]">
            <p>getBaseSize('lg') → "{getBaseSize('lg')}"</p>
            <p>
              getBaseSize({'{ base: "sm", md: "lg" }'}) → "{getBaseSize({ base: 'sm', md: 'lg' })}"
            </p>
            <p>
              buildHeaderAccessibleLabel('My Project', '3 tasks') → "
              {buildHeaderAccessibleLabel('My Project', '3 tasks')}"
            </p>
            <p>getMenuButtonLabel(true) → "{getMenuButtonLabel(true)}"</p>
            <p>getMenuButtonLabel(false) → "{getMenuButtonLabel(false)}"</p>
            <p>getMenuStateAnnouncement(true) → "{getMenuStateAnnouncement(true)}"</p>
          </div>
        </div>
      </div>
    ),
  ],
};
