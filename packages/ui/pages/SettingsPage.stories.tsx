/**
 * Storybook stories for SettingsPage
 *
 * Demonstrates the general settings page in various states:
 * - Default state
 * - Loading state
 * - With unsaved changes
 * - Save success state
 * - Saving in progress
 * - Different themes
 */

import type { Meta, StoryObj } from '@storybook/react';
import type { Theme } from '../atoms/ThemeToggle';
import { SettingsPage, type SettingsPageProps } from './SettingsPage';

const meta: Meta<typeof SettingsPage> = {
  title: 'Pages/SettingsPage',
  component: SettingsPage,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="max-w-2xl mx-auto p-6">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof SettingsPage>;

// ============================================================================
// Helper functions
// ============================================================================

const noop = () => {};
const noopTheme = (_theme: Theme) => {};
const noopBoolean = (_b: boolean) => {};

// ============================================================================
// Default Props Factory
// ============================================================================

function createDefaultProps(overrides?: Partial<SettingsPageProps>): SettingsPageProps {
  return {
    isLoading: false,
    appearance: {
      theme: 'system' as Theme,
      onThemeChange: noopTheme,
    },
    behavior: {
      autoSave: true,
      onAutoSaveChange: noopBoolean,
    },
    about: {
      version: '0.1.0',
      build: 'Development',
    },
    save: {
      hasChanges: false,
      saveSuccess: false,
      isSaving: false,
      onSave: noop,
    },
    ...overrides,
  };
}

// ============================================================================
// Stories
// ============================================================================

/**
 * Default settings page
 */
export const Default: Story = {
  args: createDefaultProps(),
};

/**
 * Loading state
 */
export const Loading: Story = {
  args: createDefaultProps({
    isLoading: true,
  }),
};

/**
 * With unsaved changes
 */
export const UnsavedChanges: Story = {
  args: createDefaultProps({
    behavior: {
      autoSave: false,
      onAutoSaveChange: noopBoolean,
    },
    save: {
      hasChanges: true,
      saveSuccess: false,
      isSaving: false,
      onSave: noop,
    },
  }),
};

/**
 * Save success state
 */
export const SaveSuccess: Story = {
  args: createDefaultProps({
    save: {
      hasChanges: false,
      saveSuccess: true,
      isSaving: false,
      onSave: noop,
    },
  }),
};

/**
 * Saving in progress
 */
export const Saving: Story = {
  args: createDefaultProps({
    save: {
      hasChanges: true,
      saveSuccess: false,
      isSaving: true,
      onSave: noop,
    },
  }),
};

/**
 * Light theme selected
 */
export const LightTheme: Story = {
  args: createDefaultProps({
    appearance: {
      theme: 'light' as Theme,
      onThemeChange: noopTheme,
    },
  }),
};

/**
 * Dark theme selected
 */
export const DarkTheme: Story = {
  args: createDefaultProps({
    appearance: {
      theme: 'dark' as Theme,
      onThemeChange: noopTheme,
    },
  }),
};

/**
 * System theme selected (default)
 */
export const SystemTheme: Story = {
  args: createDefaultProps({
    appearance: {
      theme: 'system' as Theme,
      onThemeChange: noopTheme,
    },
  }),
};

/**
 * Auto-save disabled
 */
export const AutoSaveDisabled: Story = {
  args: createDefaultProps({
    behavior: {
      autoSave: false,
      onAutoSaveChange: noopBoolean,
    },
  }),
};

/**
 * Production build info
 */
export const ProductionBuild: Story = {
  args: createDefaultProps({
    about: {
      version: '1.2.3',
      build: 'Production',
    },
  }),
};

/**
 * Beta version
 */
export const BetaVersion: Story = {
  args: createDefaultProps({
    about: {
      version: '2.0.0-beta.1',
      build: 'Beta',
    },
  }),
};
