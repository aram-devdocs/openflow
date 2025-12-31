import type { Preview } from '@storybook/react';
import '../src/styles/globals.css';

const preview: Preview = {
  parameters: {
    // Configure actions for on* props
    actions: { argTypesRegex: '^on[A-Z].*' },

    // Control defaults
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    // Dark theme background by default
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: 'rgb(24, 24, 27)' },
        { name: 'light', value: 'rgb(255, 255, 255)' },
      ],
    },

    // Viewport presets
    viewport: {
      viewports: {
        desktop: {
          name: 'Desktop',
          styles: { width: '1280px', height: '800px' },
        },
        tablet: {
          name: 'Tablet',
          styles: { width: '768px', height: '1024px' },
        },
        mobile: {
          name: 'Mobile',
          styles: { width: '375px', height: '667px' },
        },
      },
      defaultViewport: 'desktop',
    },

    // Layout default
    layout: 'centered',
  },

  // Global decorators
  decorators: [
    // Dark mode wrapper - applies dark theme styling
    (Story) => (
      <div className="dark bg-background text-foreground min-h-screen">
        <Story />
      </div>
    ),
  ],

  // Global types for theme switching in toolbar
  globalTypes: {
    theme: {
      description: 'Color theme',
      defaultValue: 'dark',
      toolbar: {
        title: 'Theme',
        icon: 'paintbrush',
        items: [
          { value: 'dark', title: 'Dark' },
          { value: 'light', title: 'Light' },
        ],
        dynamicTitle: true,
      },
    },
  },
};

export default preview;
