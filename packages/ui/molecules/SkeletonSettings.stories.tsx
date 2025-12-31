import type { Meta, StoryObj } from '@storybook/react';
import { SkeletonSettings } from './SkeletonSettings';

const meta: Meta<typeof SkeletonSettings> = {
  title: 'Molecules/SkeletonSettings',
  component: SkeletonSettings,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof SkeletonSettings>;

/** Default settings skeleton with 2 sections, 2 fields each */
export const Default: Story = {
  render: () => (
    <div className="max-w-2xl">
      <SkeletonSettings />
    </div>
  ),
};

/** Settings skeleton with 3 sections */
export const ThreeSections: Story = {
  render: () => (
    <div className="max-w-2xl">
      <SkeletonSettings sectionCount={3} />
    </div>
  ),
};

/** Settings skeleton with more fields per section */
export const MoreFields: Story = {
  render: () => (
    <div className="max-w-2xl">
      <SkeletonSettings fieldsPerSection={4} />
    </div>
  ),
};

/** Single section skeleton */
export const SingleSection: Story = {
  render: () => (
    <div className="max-w-2xl">
      <SkeletonSettings sectionCount={1} fieldsPerSection={3} />
    </div>
  ),
};
