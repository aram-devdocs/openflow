import type { Meta, StoryObj } from '@storybook/react';
import { SkeletonProjectCard } from './SkeletonProjectCard';

const meta: Meta<typeof SkeletonProjectCard> = {
  title: 'Molecules/SkeletonProjectCard',
  component: SkeletonProjectCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof SkeletonProjectCard>;

/** Default project card skeleton */
export const Default: Story = {
  render: () => (
    <div className="w-64">
      <SkeletonProjectCard />
    </div>
  ),
};

/** Multiple project cards showing a loading grid */
export const Grid: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4 w-[540px]">
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonProjectCard key={`skeleton-project-${i}`} />
      ))}
    </div>
  ),
};

/** Wide project card skeleton */
export const WideCard: Story = {
  render: () => (
    <div className="w-80">
      <SkeletonProjectCard />
    </div>
  ),
};
