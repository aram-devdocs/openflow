import type { Meta, StoryObj } from '@storybook/react';
import { SkeletonStats } from './SkeletonStats';

const meta: Meta<typeof SkeletonStats> = {
  title: 'Molecules/SkeletonStats',
  component: SkeletonStats,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof SkeletonStats>;

/** Default 4-column stats skeleton */
export const Default: Story = {
  render: () => <SkeletonStats />,
};

/** Stats skeleton with 3 columns */
export const ThreeColumns: Story = {
  render: () => <SkeletonStats count={3} />,
};

/** Stats skeleton with 2 columns */
export const TwoColumns: Story = {
  render: () => <SkeletonStats count={2} />,
};

/** Single stat skeleton */
export const SingleStat: Story = {
  render: () => (
    <div className="w-64">
      <SkeletonStats count={1} />
    </div>
  ),
};
