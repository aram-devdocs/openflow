import type { Meta, StoryObj } from '@storybook/react';
import { SkeletonCard } from './SkeletonCard';
import { SkeletonChat } from './SkeletonChat';
import { SkeletonList } from './SkeletonList';
import { SkeletonTaskCard } from './SkeletonTaskCard';

const meta: Meta = {
  title: 'Molecules/Skeletons',
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;

/** SkeletonCard - Generic card loading placeholder */
export const Card: StoryObj<typeof SkeletonCard> = {
  render: () => (
    <div className="w-80">
      <SkeletonCard />
    </div>
  ),
};

/** SkeletonCard with action buttons */
export const CardWithActions: StoryObj<typeof SkeletonCard> = {
  render: () => (
    <div className="w-80">
      <SkeletonCard showActions />
    </div>
  ),
};

/** SkeletonCard without avatar */
export const CardWithoutAvatar: StoryObj<typeof SkeletonCard> = {
  render: () => (
    <div className="w-80">
      <SkeletonCard showAvatar={false} />
    </div>
  ),
};

/** SkeletonList - List loading placeholder */
export const List: StoryObj<typeof SkeletonList> = {
  render: () => (
    <div className="w-80">
      <SkeletonList />
    </div>
  ),
};

/** SkeletonList with custom count */
export const ListCustomCount: StoryObj<typeof SkeletonList> = {
  render: () => (
    <div className="w-80">
      <SkeletonList count={3} />
    </div>
  ),
};

/** SkeletonList without avatars */
export const ListWithoutAvatars: StoryObj<typeof SkeletonList> = {
  render: () => (
    <div className="w-80">
      <SkeletonList showAvatar={false} />
    </div>
  ),
};

/** SkeletonTaskCard - Task card loading placeholder */
export const TaskCard: StoryObj<typeof SkeletonTaskCard> = {
  render: () => (
    <div className="w-80">
      <SkeletonTaskCard />
    </div>
  ),
};

/** Multiple SkeletonTaskCards */
export const TaskCardList: StoryObj<typeof SkeletonTaskCard> = {
  render: () => (
    <div className="w-80 space-y-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonTaskCard key={`task-${i}`} />
      ))}
    </div>
  ),
};

/** SkeletonChat - Chat messages loading placeholder */
export const Chat: StoryObj<typeof SkeletonChat> = {
  render: () => (
    <div className="w-[500px] rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--background))]">
      <SkeletonChat />
    </div>
  ),
};

/** SkeletonChat with more messages */
export const ChatExtended: StoryObj<typeof SkeletonChat> = {
  render: () => (
    <div className="w-[500px] rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--background))]">
      <SkeletonChat messageCount={6} />
    </div>
  ),
};

/** All skeleton molecule components together */
export const AllSkeletons: StoryObj = {
  render: () => (
    <div className="flex flex-wrap gap-8">
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-[rgb(var(--muted-foreground))]">SkeletonCard</h3>
        <SkeletonCard className="w-64" />
      </div>
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-[rgb(var(--muted-foreground))]">SkeletonList</h3>
        <SkeletonList className="w-64" count={3} />
      </div>
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-[rgb(var(--muted-foreground))]">
          SkeletonTaskCard
        </h3>
        <SkeletonTaskCard className="w-64" />
      </div>
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-[rgb(var(--muted-foreground))]">SkeletonChat</h3>
        <div className="w-80 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--background))]">
          <SkeletonChat messageCount={2} />
        </div>
      </div>
    </div>
  ),
};
