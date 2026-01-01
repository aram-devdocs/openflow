import type { Meta, StoryObj } from '@storybook/react';
import { useRef, useState } from 'react';
import { Badge } from '../atoms/Badge';
import { Button } from '../atoms/Button';
import { Card, CardContent, CardFooter, CardHeader } from './Card';

const meta: Meta<typeof Card> = {
  title: 'Molecules/Card',
  component: Card,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Card component for content containers with built-in accessibility support.

### Features
- **Responsive padding**: All sub-components support responsive \`p\` prop
- **Interactive mode**: Cards can be clickable with proper keyboard support
- **Selection state**: Visual and accessible selection indicators
- **Screen reader support**: Selected state announced via VisuallyHidden
- **Focus management**: Visible focus ring with offset for all backgrounds

### Accessibility
- Interactive cards use \`role="button"\` with Enter/Space keyboard support
- \`aria-pressed\` indicates selection state on interactive cards
- Selected state announced via screen reader-only text
- Focus ring uses \`ring-offset\` for visibility on any background
- \`data-state\` attribute for CSS-based state styling
        `,
      },
    },
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
    selectedLabel: {
      control: 'text',
      description: 'Screen reader label for selected state',
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

// ============================================================================
// Basic Examples
// ============================================================================

/** Default card with header, content, and footer */
export const Default: Story = {
  render: (args) => (
    <Card {...args}>
      <CardHeader>
        <h3 className="text-lg font-semibold">Card Title</h3>
        <p className="text-sm text-[rgb(var(--muted-foreground))]">Card description goes here</p>
      </CardHeader>
      <CardContent>
        <p>This is the main content of the card. It can contain any elements you need.</p>
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
          View details about your project, including status, progress, and team members.
        </p>
      </CardContent>
    </Card>
  ),
};

// ============================================================================
// Interactive States
// ============================================================================

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

/** Interactive toggle demonstration */
export const InteractiveToggle: Story = {
  render: () => {
    const [selected, setSelected] = useState<string | null>(null);

    const cards = [
      { id: '1', title: 'Option A', description: 'First choice' },
      { id: '2', title: 'Option B', description: 'Second choice' },
      { id: '3', title: 'Option C', description: 'Third choice' },
    ];

    return (
      <div className="flex flex-col gap-2 w-full">
        <p className="text-sm text-[rgb(var(--muted-foreground))] mb-2">
          Click to select (keyboard: Tab to navigate, Enter/Space to select)
        </p>
        {cards.map((card) => (
          <Card
            key={card.id}
            isClickable
            isSelected={selected === card.id}
            onClick={() => setSelected(selected === card.id ? null : card.id)}
            data-testid={`card-${card.id}`}
          >
            <CardContent className="py-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{card.title}</h3>
                  <p className="text-sm text-[rgb(var(--muted-foreground))]">{card.description}</p>
                </div>
                {selected === card.id && <Badge variant="success">Selected</Badge>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  },
};

// ============================================================================
// Responsive Padding
// ============================================================================

/** Card with responsive padding */
export const ResponsivePadding: Story = {
  render: () => (
    <Card>
      <CardHeader p={{ base: '2', md: '4', lg: '6' }}>
        <h3 className="text-lg font-semibold">Responsive Header</h3>
        <p className="text-sm text-[rgb(var(--muted-foreground))]">
          Padding adjusts at breakpoints: p-2 → p-4 → p-6
        </p>
      </CardHeader>
      <CardContent p={{ base: '2', md: '4', lg: '6' }}>
        <p>Content with responsive padding. Resize the window to see the change.</p>
      </CardContent>
      <CardFooter p={{ base: '2', md: '4', lg: '6' }}>
        <Button size="sm">Action</Button>
      </CardFooter>
    </Card>
  ),
};

/** Compact card with minimal padding */
export const CompactCard: Story = {
  render: () => (
    <Card>
      <CardContent p="2">
        <p className="text-sm">Compact card with p-2 padding throughout.</p>
      </CardContent>
    </Card>
  ),
};

/** Spacious card with large padding */
export const SpaciousCard: Story = {
  render: () => (
    <Card>
      <CardHeader p="8">
        <h3 className="text-lg font-semibold">Spacious Card</h3>
      </CardHeader>
      <CardContent p="8">
        <p>Large padding (p-8) for spacious layouts.</p>
      </CardContent>
    </Card>
  ),
};

// ============================================================================
// Real-World Examples
// ============================================================================

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
        <span className="text-xs text-[rgb(var(--muted-foreground))]">Created 2 days ago</span>
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
            <p className="text-sm text-[rgb(var(--muted-foreground))]">/path/to/project</p>
          </div>
        </div>
      </CardContent>
    </Card>
  ),
};

// ============================================================================
// All States Showcase
// ============================================================================

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
          <p className="text-sm text-[rgb(var(--muted-foreground))]">Has hover and focus effects</p>
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

// ============================================================================
// Accessibility Demonstrations
// ============================================================================

/** Focus ring visibility demonstration */
export const FocusRingVisibility: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Tab to the card to see the focus ring. The ring uses offset for visibility on any background.',
      },
    },
  },
  render: () => (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-[rgb(var(--muted-foreground))]">
        Tab to each card to see the focus ring with offset
      </p>
      <div className="p-4 bg-[rgb(var(--background))]">
        <Card isClickable>
          <CardContent className="py-3">
            <h3 className="font-semibold">Light Background</h3>
          </CardContent>
        </Card>
      </div>
      <div className="p-4 bg-[rgb(var(--foreground))] rounded-lg">
        <Card isClickable>
          <CardContent className="py-3">
            <h3 className="font-semibold">Dark Background</h3>
          </CardContent>
        </Card>
      </div>
    </div>
  ),
};

/** Keyboard navigation demonstration */
export const KeyboardNavigation: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Interactive cards support Enter and Space keys. Tab navigates between cards, Enter/Space activates.',
      },
    },
  },
  render: () => {
    const [lastAction, setLastAction] = useState<string>('');

    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-[rgb(var(--muted-foreground))]">
          Tab to navigate, Enter/Space to activate. Last action: {lastAction || 'None'}
        </p>
        <Card isClickable onClick={() => setLastAction('Card 1 activated')}>
          <CardContent className="py-3">
            <h3 className="font-semibold">Card 1</h3>
            <p className="text-sm text-[rgb(var(--muted-foreground))]">Press Enter or Space</p>
          </CardContent>
        </Card>
        <Card isClickable onClick={() => setLastAction('Card 2 activated')}>
          <CardContent className="py-3">
            <h3 className="font-semibold">Card 2</h3>
            <p className="text-sm text-[rgb(var(--muted-foreground))]">Press Enter or Space</p>
          </CardContent>
        </Card>
      </div>
    );
  },
};

/** Screen reader accessibility demonstration */
export const ScreenReaderAccessibility: Story = {
  parameters: {
    docs: {
      description: {
        story: `
Selected cards announce their state to screen readers via VisuallyHidden text.
- Interactive cards have \`role="button"\`
- Selected state uses \`aria-pressed="true"\`
- Selection announced via VisuallyHidden "Selected" text
        `,
      },
    },
  },
  render: () => {
    const [selected, setSelected] = useState(false);

    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-[rgb(var(--muted-foreground))]">
          Enable a screen reader and click the card to hear "Selected" announced
        </p>
        <Card
          isClickable
          isSelected={selected}
          onClick={() => setSelected(!selected)}
          selectedLabel="Card is now selected"
        >
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Toggle Selection</h3>
                <p className="text-sm text-[rgb(var(--muted-foreground))]">
                  {selected ? 'Selected - click to deselect' : 'Click to select'}
                </p>
              </div>
              {selected && <Badge variant="success">Selected</Badge>}
            </div>
          </CardContent>
        </Card>
        <ul className="text-sm text-[rgb(var(--muted-foreground))] space-y-1">
          <li>• role="button" for interactive semantics</li>
          <li>• aria-pressed={String(selected)} for toggle state</li>
          <li>• VisuallyHidden announces selection to screen readers</li>
        </ul>
      </div>
    );
  },
};

/** ARIA attributes demonstration */
export const AriaAttributes: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates the ARIA attributes applied to interactive and selected cards.',
      },
    },
  },
  render: () => (
    <div className="flex flex-col gap-4">
      <div>
        <h4 className="font-semibold mb-2">Non-Interactive Card</h4>
        <pre className="text-xs bg-[rgb(var(--muted))] p-2 rounded mb-2">
          {'<div>...</div>  // No role, no tabIndex'}
        </pre>
        <Card>
          <CardContent className="py-2">
            <p className="text-sm">Static content</p>
          </CardContent>
        </Card>
      </div>

      <div>
        <h4 className="font-semibold mb-2">Clickable Card (Not Selected)</h4>
        <pre className="text-xs bg-[rgb(var(--muted))] p-2 rounded mb-2">
          {`<div role="button" tabIndex={0} aria-pressed="false">...</div>`}
        </pre>
        <Card isClickable>
          <CardContent className="py-2">
            <p className="text-sm">Clickable content</p>
          </CardContent>
        </Card>
      </div>

      <div>
        <h4 className="font-semibold mb-2">Clickable + Selected Card</h4>
        <pre className="text-xs bg-[rgb(var(--muted))] p-2 rounded mb-2">
          {`<div role="button" tabIndex={0} aria-pressed="true" data-state="selected">
  <span class="sr-only">Selected</span>
  ...
</div>`}
        </pre>
        <Card isClickable isSelected>
          <CardContent className="py-2">
            <p className="text-sm">Selected content</p>
          </CardContent>
        </Card>
      </div>
    </div>
  ),
};

// ============================================================================
// Ref Forwarding
// ============================================================================

/** Ref forwarding demonstration */
export const RefForwarding: Story = {
  parameters: {
    docs: {
      description: {
        story: 'All Card components support ref forwarding for programmatic focus and DOM access.',
      },
    },
  },
  render: () => {
    const cardRef = useRef<HTMLDivElement>(null);
    const headerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const footerRef = useRef<HTMLDivElement>(null);

    return (
      <div className="flex flex-col gap-4">
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" onClick={() => cardRef.current?.focus()}>
            Focus Card
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => alert(`Card width: ${cardRef.current?.offsetWidth}px`)}
          >
            Get Card Width
          </Button>
        </div>

        <Card ref={cardRef} isClickable data-testid="ref-demo-card">
          <CardHeader ref={headerRef} data-testid="ref-demo-header">
            <h3 className="font-semibold">Ref Demo Card</h3>
          </CardHeader>
          <CardContent ref={contentRef} data-testid="ref-demo-content">
            <p className="text-sm text-[rgb(var(--muted-foreground))]">
              All components support ref forwarding
            </p>
          </CardContent>
          <CardFooter ref={footerRef} data-testid="ref-demo-footer">
            <Badge>Footer</Badge>
          </CardFooter>
        </Card>
      </div>
    );
  },
};

// ============================================================================
// Data Attributes
// ============================================================================

/** Data-testid demonstration */
export const DataTestId: Story = {
  parameters: {
    docs: {
      description: {
        story: 'All Card components support data-testid for automated testing.',
      },
    },
  },
  render: () => (
    <Card data-testid="test-card" isClickable isSelected>
      <CardHeader data-testid="test-header">
        <h3 className="font-semibold">Test Card</h3>
      </CardHeader>
      <CardContent data-testid="test-content">
        <p className="text-sm">Check DevTools for data-testid attributes</p>
      </CardContent>
      <CardFooter data-testid="test-footer">
        <Badge>Footer</Badge>
      </CardFooter>
    </Card>
  ),
};

/** Data-state attribute demonstration */
export const DataState: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Selected cards have data-state="selected" for CSS styling hooks.',
      },
    },
  },
  render: () => (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="py-2">
          <p className="text-sm">data-state: undefined</p>
        </CardContent>
      </Card>
      <Card isSelected>
        <CardContent className="py-2">
          <p className="text-sm">data-state: "selected"</p>
        </CardContent>
      </Card>
    </div>
  ),
};
