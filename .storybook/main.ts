import { resolve } from 'node:path';
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../packages/ui/**/*.stories.@(ts|tsx)', '../src/**/*.stories.@(ts|tsx)'],

  addons: ['@storybook/addon-essentials', '@storybook/addon-interactions', '@storybook/addon-a11y'],

  framework: {
    name: '@storybook/react-vite',
    options: {},
  },

  viteFinal: async (config) => {
    // Apply the same aliases as the main vite config
    config.resolve = {
      ...config.resolve,
      alias: {
        ...config.resolve?.alias,
        '@openflow/generated': resolve(__dirname, '../packages/generated/index.ts'),
        '@openflow/utils': resolve(__dirname, '../packages/utils/index.ts'),
        '@openflow/validation': resolve(__dirname, '../packages/validation/index.ts'),
        '@openflow/queries': resolve(__dirname, '../packages/queries/index.ts'),
        '@openflow/hooks': resolve(__dirname, '../packages/hooks/index.ts'),
        '@openflow/ui': resolve(__dirname, '../packages/ui/index.ts'),
      },
    };
    return config;
  },

  docs: {},

  typescript: {
    reactDocgen: 'react-docgen-typescript',
  },
};

export default config;
