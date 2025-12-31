import type { Meta, StoryObj } from '@storybook/react';
import { SkeletonTaskDetail } from './SkeletonTaskDetail';

const meta: Meta<typeof SkeletonTaskDetail> = {
  title: 'Molecules/SkeletonTaskDetail',
  component: SkeletonTaskDetail,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof SkeletonTaskDetail>;

/** Default task detail skeleton showing full page loading state */
export const Default: Story = {
  render: () => (
    <div className="h-screen">
      <SkeletonTaskDetail />
    </div>
  ),
};

/** Task detail skeleton with custom class for sizing */
export const FixedHeight: Story = {
  render: () => (
    <div className="h-[600px] border border-[rgb(var(--border))] rounded-lg overflow-hidden">
      <SkeletonTaskDetail />
    </div>
  ),
};
