import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardHeader, CardContent, CardFooter } from './Card';
import { Button } from '../atoms/Button';
import { Badge } from '../atoms/Badge';

const meta: Meta<typeof Card> = {
  title: 'Molecules/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    isSelected: {
      control: 'boolean',
      description: 'Whether the card is in a selected state',
    },
    isClickable: {
      control: 'boolean',
      description: 'Whether the card has hover/focus effects',
    },
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Card>;

/** Default card with header, content, and footer */
export const Default: Story = {
  render: (args) => (
    <Card {...args}>
      <CardHeader>
        <h3 className="text-lg font-semibold">Card Title</h3>
        <p className="text-sm text-[rgb(var(--muted-foreground))]">
          Card description goes here
        </p>
      </CardHeader>
      <CardContent>
        <p>
          This is the main content of the card. It can contain any elements you
          need.
        </p>
      </CardContent>
      <CardFooter>
        <Button variant="primary" size="sm">
          Action
        </Button>
      </CardFooter>
    </Card>
  ),
};

/** Card with only content */
export const ContentOnly: Story = {
  render: () => (
    <Card>
      <CardContent>
        <p>A simple card with just content and no header or footer.</p>
      </CardContent>
    </Card>
  ),
};

/** Card with header and content */
export const WithHeaderAndContent: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">Project Overview</h3>
      </CardHeader>
      <CardContent>
        <p className="text-[rgb(var(--muted-foreground))]">
          View details about your project, including status, progress, and team
          members.
        </p>
      </CardContent>
    </Card>
  ),
};

/** Clickable card with hover effects */
export const Clickable: Story = {
  args: {
    isClickable: true,
  },
  render: (args) => (
    <Card {...args} onClick={() => alert('Card clicked!')}>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Clickable Card</h3>
            <p className="text-sm text-[rgb(var(--muted-foreground))]">
              Click or press Enter to interact
            </p>
          </div>
          <span className="text-[rgb(var(--muted-foreground))]">&rarr;</span>
        </div>
      </CardContent>
    </Card>
  ),
};

/** Selected card state */
export const Selected: Story = {
  args: {
    isSelected: true,
    isClickable: true,
  },
  render: (args) => (
    <Card {...args}>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Selected Card</h3>
            <p className="text-sm text-[rgb(var(--muted-foreground))]">
              This card is currently selected
            </p>
          </div>
          <Badge variant="success">Active</Badge>
        </div>
      </CardContent>
    </Card>
  ),
};

/** Card with multiple footer actions */
export const WithMultipleActions: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">Confirm Action</h3>
        <p className="text-sm text-[rgb(var(--muted-foreground))]">
          Are you sure you want to proceed?
        </p>
      </CardHeader>
      <CardContent>
        <p>This action cannot be undone. Please review before confirming.</p>
      </CardContent>
      <CardFooter className="justify-end gap-2">
        <Button variant="ghost" size="sm">
          Cancel
        </Button>
        <Button variant="primary" size="sm">
          Confirm
        </Button>
      </CardFooter>
    </Card>
  ),
};

/** Task card example */
export const TaskCard: Story = {
  render: () => (
    <Card isClickable>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Implement authentication</h3>
          <Badge variant="inprogress">In Progress</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-[rgb(var(--muted-foreground))]">
          Add OAuth2 authentication with Google and GitHub providers.
        </p>
      </CardContent>
      <CardFooter className="justify-between">
        <span className="text-xs text-[rgb(var(--muted-foreground))]">
          Created 2 days ago
        </span>
        <Badge>3 steps</Badge>
      </CardFooter>
    </Card>
  ),
};

/** Project card example */
export const ProjectCard: Story = {
  render: () => (
    <Card isClickable>
      <CardContent>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))]">
            <span className="text-lg">P</span>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">My Project</h3>
            <p className="text-sm text-[rgb(var(--muted-foreground))]">
              /path/to/project
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  ),
};

/** All card states showcase */
export const AllStates: Story = {
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
  render: () => (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent>
          <h3 className="font-semibold">Default Card</h3>
          <p className="text-sm text-[rgb(var(--muted-foreground))]">
            Standard card without interactions
          </p>
        </CardContent>
      </Card>

      <Card isClickable>
        <CardContent>
          <h3 className="font-semibold">Clickable Card</h3>
          <p className="text-sm text-[rgb(var(--muted-foreground))]">
            Has hover and focus effects
          </p>
        </CardContent>
      </Card>

      <Card isClickable isSelected>
        <CardContent>
          <h3 className="font-semibold">Selected Card</h3>
          <p className="text-sm text-[rgb(var(--muted-foreground))]">
            Shows selected state with border highlight
          </p>
        </CardContent>
      </Card>
    </div>
  ),
};

/** Card list example */
export const CardList: Story = {
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
  render: () => {
    const items = [
      { id: '1', title: 'First Item', status: 'todo' as const },
      { id: '2', title: 'Second Item', status: 'inprogress' as const },
      { id: '3', title: 'Third Item', status: 'done' as const },
    ];

    return (
      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <Card key={item.id} isClickable>
            <CardContent className="py-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">{item.title}</span>
                <Badge variant={item.status}>{item.status}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  },
};
