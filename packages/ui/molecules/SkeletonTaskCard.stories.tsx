import type { Meta, StoryObj } from '@storybook/react';
import { SkeletonTaskCard } from './SkeletonTaskCard';

const meta: Meta<typeof SkeletonTaskCard> = {
  title: 'Molecules/SkeletonTaskCard',
  component: SkeletonTaskCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof SkeletonTaskCard>;

/** Default task card skeleton */
export const Default: Story = {
  render: () => (
    <div className="w-80">
      <SkeletonTaskCard />
    </div>
  ),
};

/** Multiple task cards showing a loading list */
export const MultipleCards: Story = {
  render: () => (
    <div className="w-80 space-y-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonTaskCard key={`skeleton-task-${i}`} />
      ))}
    </div>
  ),
};

/** Wide task card skeleton */
export const WideCard: Story = {
  render: () => (
    <div className="w-[500px]">
      <SkeletonTaskCard />
    </div>
  ),
};
