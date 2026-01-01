import type { Meta, StoryObj } from '@storybook/react';
import { useRef, useState } from 'react';
import { Button } from '../atoms/Button';
import { Dialog, DialogContent, DialogFooter } from '../molecules/Dialog';
import {
  ARTIFACTS_ICON_SIZE_MAP,
  ARTIFACTS_ITEM_SIZE_CLASSES,
  ARTIFACTS_PANEL_SIZE_CLASSES,
  type ArtifactFile,
  ArtifactsPanel,
  ArtifactsPanelError,
  ArtifactsPanelSkeleton,
  DEFAULT_EMPTY_DESCRIPTION,
  DEFAULT_EMPTY_TITLE,
  DEFAULT_ERROR_TITLE,
  DEFAULT_HEADING,
  DEFAULT_RETRY_LABEL,
  // Constants used in ConstantsReference story
  DEFAULT_SKELETON_COUNT,
} from './ArtifactsPanel';

const meta: Meta<typeof ArtifactsPanel> = {
  title: 'Organisms/ArtifactsPanel',
  component: ArtifactsPanel,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
ArtifactsPanel displays a list of task artifact files with full accessibility support.

## Features
- **Loading state**: Skeleton UI while data loads
- **Empty state**: Friendly message when no artifacts exist
- **Error state**: Error display with retry option
- **Responsive sizing**: sm, md, lg sizes with breakpoint support
- **Screen reader support**: Announces file count and types
- **Keyboard accessible**: Full Tab navigation with visible focus states
- **Touch targets**: 44px minimum touch targets on mobile (WCAG 2.5.5)
- **Reduced motion**: Respects prefers-reduced-motion

## Accessibility
- Uses role="list" and role="listitem" for semantic structure
- aria-labelledby links list to heading
- aria-live regions announce changes
- VisuallyHidden provides screen reader context for file types
- Touch-friendly action buttons
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    artifacts: {
      control: false,
      description: 'Array of artifact files to display',
    },
    onOpenArtifact: {
      action: 'open',
      description: 'Callback when an artifact is opened in external editor',
    },
    onPreviewArtifact: {
      action: 'preview',
      description: 'Callback when an artifact is previewed',
    },
    loading: {
      control: 'boolean',
      description: 'Whether the panel is in a loading state',
    },
    error: {
      control: 'text',
      description: 'Error message to display',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size variant',
    },
    heading: {
      control: 'text',
      description: 'Custom heading for the panel',
    },
    emptyTitle: {
      control: 'text',
      description: 'Custom empty state title',
    },
    emptyDescription: {
      control: 'text',
      description: 'Custom empty state description',
    },
    errorTitle: {
      control: 'text',
      description: 'Custom error title',
    },
    skeletonCount: {
      control: { type: 'number', min: 1, max: 10 },
      description: 'Number of skeleton items to show when loading',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ArtifactsPanel>;

// ============================================================================
// Sample Data
// ============================================================================

/** Sample markdown artifact */
const planArtifact: ArtifactFile = {
  name: 'plan.md',
  path: '.zenflow/tasks/task-123/plan.md',
  size: 2048,
  isDirectory: false,
  modifiedAt: new Date().toISOString(),
};

/** Sample artifact files for stories */
const sampleArtifacts: ArtifactFile[] = [
  planArtifact,
  {
    name: 'spec.md',
    path: '.zenflow/tasks/task-123/spec.md',
    size: 4096,
    isDirectory: false,
    modifiedAt: new Date().toISOString(),
  },
  {
    name: 'requirements.md',
    path: '.zenflow/tasks/task-123/requirements.md',
    size: 1536,
    isDirectory: false,
    modifiedAt: new Date().toISOString(),
  },
  {
    name: 'notes.txt',
    path: '.zenflow/tasks/task-123/notes.txt',
    size: 512,
    isDirectory: false,
    modifiedAt: new Date().toISOString(),
  },
  {
    name: 'steps',
    path: '.zenflow/tasks/task-123/steps',
    size: 0,
    isDirectory: true,
    modifiedAt: new Date().toISOString(),
  },
];

// ============================================================================
// Demo Components
// ============================================================================

/** Interactive demo with preview dialog */
function ArtifactsPanelDemo({
  artifacts = sampleArtifacts,
  ...props
}: Partial<React.ComponentProps<typeof ArtifactsPanel>>) {
  const [previewFile, setPreviewFile] = useState<ArtifactFile | null>(null);

  return (
    <div className="w-80 rounded-lg border border-[rgb(var(--border))]">
      <ArtifactsPanel
        artifacts={artifacts}
        onOpenArtifact={(artifact) => {
          console.log('Opening:', artifact.path);
        }}
        onPreviewArtifact={setPreviewFile}
        {...props}
      />

      {/* Preview Dialog */}
      <Dialog
        isOpen={previewFile !== null}
        onClose={() => setPreviewFile(null)}
        title={previewFile?.name ?? 'Preview'}
        size="lg"
      >
        <DialogContent className="max-h-[400px]">
          <pre className="whitespace-pre-wrap text-sm text-[rgb(var(--muted-foreground))]">
            {previewFile?.name === 'plan.md' &&
              `# Implementation Plan

## Overview
This is a sample plan file.

## Steps
1. First step
2. Second step
3. Third step

## Notes
- Important note 1
- Important note 2`}
            {previewFile?.name === 'spec.md' &&
              `# Technical Specification

## Architecture
Description of the architecture...

## Components
- Component A
- Component B
- Component C

## API Design
\`\`\`typescript
interface API {
  method(): void;
}
\`\`\``}
            {previewFile?.name === 'requirements.md' &&
              `# Requirements

## Functional Requirements
1. The system shall...
2. The system shall...

## Non-Functional Requirements
- Performance: Response time < 100ms
- Security: All data encrypted`}
          </pre>
        </DialogContent>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setPreviewFile(null)}>
            Close
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}

// ============================================================================
// Basic Stories
// ============================================================================

/** Default artifacts panel with sample files */
export const Default: Story = {
  render: () => <ArtifactsPanelDemo />,
};

/** Single artifact */
export const SingleArtifact: Story = {
  render: () => <ArtifactsPanelDemo artifacts={[planArtifact]} />,
};

/** Many artifacts */
export const ManyArtifacts: Story = {
  render: () => {
    const manyArtifacts: ArtifactFile[] = [
      ...sampleArtifacts,
      {
        name: 'context.md',
        path: '.zenflow/tasks/task-123/context.md',
        size: 3072,
        isDirectory: false,
        modifiedAt: new Date().toISOString(),
      },
      {
        name: 'implementation.md',
        path: '.zenflow/tasks/task-123/implementation.md',
        size: 8192,
        isDirectory: false,
        modifiedAt: new Date().toISOString(),
      },
      {
        name: 'testing.md',
        path: '.zenflow/tasks/task-123/testing.md',
        size: 2560,
        isDirectory: false,
        modifiedAt: new Date().toISOString(),
      },
      {
        name: 'deployment.md',
        path: '.zenflow/tasks/task-123/deployment.md',
        size: 1024,
        isDirectory: false,
        modifiedAt: new Date().toISOString(),
      },
    ];

    return <ArtifactsPanelDemo artifacts={manyArtifacts} />;
  },
};

// ============================================================================
// State Stories
// ============================================================================

/** Loading state with skeletons */
export const Loading: Story = {
  render: () => (
    <div className="w-80 rounded-lg border border-[rgb(var(--border))]">
      <ArtifactsPanel artifacts={[]} onOpenArtifact={() => {}} loading />
    </div>
  ),
};

/** Loading with custom skeleton count */
export const LoadingCustomCount: Story = {
  render: () => (
    <div className="w-80 rounded-lg border border-[rgb(var(--border))]">
      <ArtifactsPanel artifacts={[]} onOpenArtifact={() => {}} loading skeletonCount={5} />
    </div>
  ),
};

/** Empty state - no artifacts */
export const Empty: Story = {
  render: () => (
    <div className="w-80 rounded-lg border border-[rgb(var(--border))]">
      <ArtifactsPanel artifacts={[]} onOpenArtifact={() => {}} />
    </div>
  ),
};

/** Empty state with custom text */
export const EmptyCustomText: Story = {
  render: () => (
    <div className="w-80 rounded-lg border border-[rgb(var(--border))]">
      <ArtifactsPanel
        artifacts={[]}
        onOpenArtifact={() => {}}
        emptyTitle="No files yet"
        emptyDescription="Upload or generate files to see them here."
      />
    </div>
  ),
};

/** Error state */
export const ErrorState: Story = {
  render: () => (
    <div className="w-80 rounded-lg border border-[rgb(var(--border))]">
      <ArtifactsPanel
        artifacts={[]}
        onOpenArtifact={() => {}}
        error="Unable to connect to the server"
        onRetry={() => console.log('Retry clicked')}
      />
    </div>
  ),
};

/** Error state without retry */
export const ErrorNoRetry: Story = {
  render: () => (
    <div className="w-80 rounded-lg border border-[rgb(var(--border))]">
      <ArtifactsPanel artifacts={[]} onOpenArtifact={() => {}} error="File system access denied" />
    </div>
  ),
};

/** Error state with custom title */
export const ErrorCustomTitle: Story = {
  render: () => (
    <div className="w-80 rounded-lg border border-[rgb(var(--border))]">
      <ArtifactsPanel
        artifacts={[]}
        onOpenArtifact={() => {}}
        error="Network request timed out"
        errorTitle="Connection Error"
        onRetry={() => console.log('Retry clicked')}
      />
    </div>
  ),
};

// ============================================================================
// Size Variants
// ============================================================================

/** Small size */
export const SizeSmall: Story = {
  render: () => <ArtifactsPanelDemo size="sm" />,
};

/** Medium size (default) */
export const SizeMedium: Story = {
  render: () => <ArtifactsPanelDemo size="md" />,
};

/** Large size */
export const SizeLarge: Story = {
  render: () => <ArtifactsPanelDemo size="lg" />,
};

/** All sizes comparison */
export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-wrap gap-6">
      <div>
        <h3 className="mb-2 text-sm font-medium text-[rgb(var(--muted-foreground))]">Small</h3>
        <ArtifactsPanelDemo size="sm" artifacts={sampleArtifacts.slice(0, 3)} />
      </div>
      <div>
        <h3 className="mb-2 text-sm font-medium text-[rgb(var(--muted-foreground))]">Medium</h3>
        <ArtifactsPanelDemo size="md" artifacts={sampleArtifacts.slice(0, 3)} />
      </div>
      <div>
        <h3 className="mb-2 text-sm font-medium text-[rgb(var(--muted-foreground))]">Large</h3>
        <ArtifactsPanelDemo size="lg" artifacts={sampleArtifacts.slice(0, 3)} />
      </div>
    </div>
  ),
};

/** Responsive sizing */
export const ResponsiveSizing: Story = {
  render: () => (
    <div className="space-y-4">
      <p className="text-sm text-[rgb(var(--muted-foreground))]">
        Resize the viewport to see the panel adapt. Small on mobile, medium on tablet, large on
        desktop.
      </p>
      <div className="w-80 rounded-lg border border-[rgb(var(--border))]">
        <ArtifactsPanel
          artifacts={sampleArtifacts}
          onOpenArtifact={() => {}}
          size={{ base: 'sm', md: 'md', lg: 'lg' }}
        />
      </div>
    </div>
  ),
};

// ============================================================================
// File Type Variations
// ============================================================================

/** Various file sizes */
export const VariousFileSizes: Story = {
  render: () => {
    const variousSizes: ArtifactFile[] = [
      {
        name: 'tiny.md',
        path: '.zenflow/tasks/task-123/tiny.md',
        size: 128,
        isDirectory: false,
        modifiedAt: new Date().toISOString(),
      },
      {
        name: 'small.md',
        path: '.zenflow/tasks/task-123/small.md',
        size: 512,
        isDirectory: false,
        modifiedAt: new Date().toISOString(),
      },
      {
        name: 'medium.md',
        path: '.zenflow/tasks/task-123/medium.md',
        size: 4096,
        isDirectory: false,
        modifiedAt: new Date().toISOString(),
      },
      {
        name: 'large.md',
        path: '.zenflow/tasks/task-123/large.md',
        size: 1048576,
        isDirectory: false,
        modifiedAt: new Date().toISOString(),
      },
      {
        name: 'very-large.md',
        path: '.zenflow/tasks/task-123/very-large.md',
        size: 5242880,
        isDirectory: false,
        modifiedAt: new Date().toISOString(),
      },
    ];

    return <ArtifactsPanelDemo artifacts={variousSizes} />;
  },
};

/** Mixed file types */
export const MixedFileTypes: Story = {
  render: () => {
    const mixedTypes: ArtifactFile[] = [
      {
        name: 'README.md',
        path: '.zenflow/tasks/task-123/README.md',
        size: 2048,
        isDirectory: false,
        modifiedAt: new Date().toISOString(),
      },
      {
        name: 'config.json',
        path: '.zenflow/tasks/task-123/config.json',
        size: 512,
        isDirectory: false,
        modifiedAt: new Date().toISOString(),
      },
      {
        name: 'script.ts',
        path: '.zenflow/tasks/task-123/script.ts',
        size: 1024,
        isDirectory: false,
        modifiedAt: new Date().toISOString(),
      },
      {
        name: 'data',
        path: '.zenflow/tasks/task-123/data',
        size: 0,
        isDirectory: true,
        modifiedAt: new Date().toISOString(),
      },
      {
        name: 'output.log',
        path: '.zenflow/tasks/task-123/output.log',
        size: 8192,
        isDirectory: false,
        modifiedAt: new Date().toISOString(),
      },
    ];

    return <ArtifactsPanelDemo artifacts={mixedTypes} />;
  },
};

/** Long file names */
export const LongFileNames: Story = {
  render: () => {
    const longNames: ArtifactFile[] = [
      {
        name: 'very-long-file-name-that-should-be-truncated-in-the-ui.md',
        path: '.zenflow/tasks/task-123/very-long-file-name-that-should-be-truncated-in-the-ui.md',
        size: 2048,
        isDirectory: false,
        modifiedAt: new Date().toISOString(),
      },
      {
        name: 'another-extremely-long-filename-for-testing-truncation.md',
        path: '.zenflow/tasks/task-123/another-extremely-long-filename-for-testing-truncation.md',
        size: 1024,
        isDirectory: false,
        modifiedAt: new Date().toISOString(),
      },
    ];

    return <ArtifactsPanelDemo artifacts={longNames} />;
  },
};

// ============================================================================
// Customization Stories
// ============================================================================

/** Custom heading */
export const CustomHeading: Story = {
  render: () => (
    <div className="w-80 rounded-lg border border-[rgb(var(--border))]">
      <ArtifactsPanel artifacts={sampleArtifacts} onOpenArtifact={() => {}} heading="Task Files" />
    </div>
  ),
};

/** Without preview callback (no preview button) */
export const WithoutPreview: Story = {
  render: () => (
    <div className="w-80 rounded-lg border border-[rgb(var(--border))]">
      <ArtifactsPanel
        artifacts={sampleArtifacts}
        onOpenArtifact={(artifact) => {
          console.log('Opening:', artifact.path);
        }}
      />
    </div>
  ),
};

// ============================================================================
// Accessibility Stories
// ============================================================================

/** Keyboard navigation demo */
export const KeyboardNavigation: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="rounded-lg border border-[rgb(var(--border))] p-4">
        <h3 className="font-medium text-[rgb(var(--foreground))]">Keyboard Navigation</h3>
        <ul className="mt-2 list-inside list-disc text-sm text-[rgb(var(--muted-foreground))]">
          <li>Tab to navigate through artifact items</li>
          <li>Tab to action buttons (preview, open)</li>
          <li>Enter or Space to activate buttons</li>
          <li>Focus indicator visible on all interactive elements</li>
        </ul>
      </div>
      <ArtifactsPanelDemo />
    </div>
  ),
};

/** Screen reader demo */
export const ScreenReaderAccessibility: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="rounded-lg border border-[rgb(var(--border))] p-4">
        <h3 className="font-medium text-[rgb(var(--foreground))]">Screen Reader Support</h3>
        <ul className="mt-2 list-inside list-disc text-sm text-[rgb(var(--muted-foreground))]">
          <li>List announced as "Task artifacts" with role="list"</li>
          <li>Announces "4 files and 1 folder" on load</li>
          <li>Each item announces name, size, and type (file/folder/markdown file)</li>
          <li>Preview button: "Preview plan.md"</li>
          <li>Open button: "Open plan.md in editor"</li>
          <li>Error state uses role="alert" for immediate announcement</li>
        </ul>
      </div>
      <ArtifactsPanelDemo />
    </div>
  ),
};

/** Touch target accessibility */
export const TouchTargetAccessibility: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="rounded-lg border border-[rgb(var(--border))] p-4">
        <h3 className="font-medium text-[rgb(var(--foreground))]">Touch Target Accessibility</h3>
        <p className="mt-2 text-sm text-[rgb(var(--muted-foreground))]">
          Action buttons have a minimum touch target of 44x44px on mobile devices (WCAG 2.5.5). On
          larger screens, the visual size is smaller but still accessible.
        </p>
      </div>
      <div className="flex gap-6">
        <div>
          <h4 className="mb-2 text-xs text-[rgb(var(--muted-foreground))]">
            Small (mobile-friendly)
          </h4>
          <div className="w-64 rounded-lg border border-[rgb(var(--border))]">
            <ArtifactsPanel
              artifacts={sampleArtifacts.slice(0, 2)}
              onOpenArtifact={() => {}}
              onPreviewArtifact={() => {}}
              size="sm"
            />
          </div>
        </div>
        <div>
          <h4 className="mb-2 text-xs text-[rgb(var(--muted-foreground))]">Large</h4>
          <div className="w-80 rounded-lg border border-[rgb(var(--border))]">
            <ArtifactsPanel
              artifacts={sampleArtifacts.slice(0, 2)}
              onOpenArtifact={() => {}}
              onPreviewArtifact={() => {}}
              size="lg"
            />
          </div>
        </div>
      </div>
    </div>
  ),
};

/** Focus ring visibility */
export const FocusRingVisibility: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="rounded-lg border border-[rgb(var(--border))] p-4">
        <h3 className="font-medium text-[rgb(var(--foreground))]">Focus Ring Visibility</h3>
        <p className="mt-2 text-sm text-[rgb(var(--muted-foreground))]">
          Tab through the panel to see focus indicators on action buttons. Focus rings use
          ring-offset for visibility on various backgrounds.
        </p>
      </div>
      <ArtifactsPanelDemo />
    </div>
  ),
};

/** Reduced motion demo */
export const ReducedMotion: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="rounded-lg border border-[rgb(var(--border))] p-4">
        <h3 className="font-medium text-[rgb(var(--foreground))]">Reduced Motion Support</h3>
        <p className="mt-2 text-sm text-[rgb(var(--muted-foreground))]">
          All transitions use the motion-safe: prefix and will be disabled when the user has
          requested reduced motion in their system preferences.
        </p>
      </div>
      <ArtifactsPanelDemo />
    </div>
  ),
};

// ============================================================================
// Ref and Data Attribute Stories
// ============================================================================

/** Ref forwarding demo */
export const RefForwarding: Story = {
  render: function RefForwardingStory() {
    const panelRef = useRef<HTMLDivElement>(null);

    return (
      <div className="space-y-4">
        <Button
          onClick={() => {
            if (panelRef.current) {
              panelRef.current.style.outline = '2px solid blue';
              setTimeout(() => {
                if (panelRef.current) {
                  panelRef.current.style.outline = '';
                }
              }, 1000);
            }
          }}
        >
          Flash Panel Ref
        </Button>
        <div className="w-80 rounded-lg border border-[rgb(var(--border))]">
          <ArtifactsPanel ref={panelRef} artifacts={sampleArtifacts} onOpenArtifact={() => {}} />
        </div>
      </div>
    );
  },
};

/** Data attributes demo */
export const DataAttributes: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="rounded-lg border border-[rgb(var(--border))] p-4">
        <h3 className="font-medium text-[rgb(var(--foreground))]">Data Attributes</h3>
        <p className="mt-2 text-sm text-[rgb(var(--muted-foreground))]">
          Inspect the panel element to see data attributes:
        </p>
        <ul className="mt-2 list-inside list-disc text-sm text-[rgb(var(--muted-foreground))]">
          <li>data-testid="artifacts-panel"</li>
          <li>data-size="md"</li>
          <li>data-count="5"</li>
          <li>data-path on each item</li>
          <li>data-type="file" or "directory" on items</li>
        </ul>
      </div>
      <div className="w-80 rounded-lg border border-[rgb(var(--border))]">
        <ArtifactsPanel
          artifacts={sampleArtifacts}
          onOpenArtifact={() => {}}
          data-testid="artifacts-panel"
        />
      </div>
    </div>
  ),
};

// ============================================================================
// Sub-components Stories
// ============================================================================

/** Skeleton component standalone */
export const SkeletonStandalone: Story = {
  render: () => (
    <div className="flex gap-6">
      <div>
        <h4 className="mb-2 text-xs text-[rgb(var(--muted-foreground))]">3 items (default)</h4>
        <div className="w-64 rounded-lg border border-[rgb(var(--border))]">
          <ArtifactsPanelSkeleton />
        </div>
      </div>
      <div>
        <h4 className="mb-2 text-xs text-[rgb(var(--muted-foreground))]">5 items</h4>
        <div className="w-64 rounded-lg border border-[rgb(var(--border))]">
          <ArtifactsPanelSkeleton count={5} />
        </div>
      </div>
      <div>
        <h4 className="mb-2 text-xs text-[rgb(var(--muted-foreground))]">Large size</h4>
        <div className="w-80 rounded-lg border border-[rgb(var(--border))]">
          <ArtifactsPanelSkeleton count={3} size="lg" />
        </div>
      </div>
    </div>
  ),
};

/** Error component standalone */
export const ErrorStandalone: Story = {
  render: () => (
    <div className="flex gap-6">
      <div>
        <h4 className="mb-2 text-xs text-[rgb(var(--muted-foreground))]">With retry</h4>
        <div className="w-64 rounded-lg border border-[rgb(var(--border))]">
          <ArtifactsPanelError
            error="Connection timeout"
            onRetry={() => console.log('Retry clicked')}
          />
        </div>
      </div>
      <div>
        <h4 className="mb-2 text-xs text-[rgb(var(--muted-foreground))]">Without retry</h4>
        <div className="w-64 rounded-lg border border-[rgb(var(--border))]">
          <ArtifactsPanelError error="Access denied" />
        </div>
      </div>
      <div>
        <h4 className="mb-2 text-xs text-[rgb(var(--muted-foreground))]">Custom title</h4>
        <div className="w-64 rounded-lg border border-[rgb(var(--border))]">
          <ArtifactsPanelError
            error="Server returned 500"
            title="Server Error"
            onRetry={() => console.log('Retry clicked')}
          />
        </div>
      </div>
    </div>
  ),
};

// ============================================================================
// Real-world Examples
// ============================================================================

/** Task sidebar context */
export const TaskSidebarContext: Story = {
  render: () => (
    <div className="flex h-[500px] gap-4">
      {/* Simulated sidebar */}
      <div className="w-72 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface-0))]">
        <div className="border-b border-[rgb(var(--border))] p-4">
          <h2 className="font-semibold text-[rgb(var(--foreground))]">Task Details</h2>
          <p className="mt-1 text-sm text-[rgb(var(--muted-foreground))]">
            Implement authentication
          </p>
        </div>

        {/* Steps section */}
        <div className="border-b border-[rgb(var(--border))] p-4">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted-foreground))]">
            Steps
          </h3>
          <div className="space-y-1">
            <div className="rounded bg-[rgb(var(--primary))] px-2 py-1 text-sm text-[rgb(var(--primary-foreground))]">
              1. Setup auth module
            </div>
            <div className="rounded px-2 py-1 text-sm text-[rgb(var(--muted-foreground))]">
              2. Add login form
            </div>
          </div>
        </div>

        {/* Artifacts section */}
        <ArtifactsPanel
          artifacts={sampleArtifacts}
          onOpenArtifact={() => {}}
          onPreviewArtifact={() => {}}
          size="sm"
        />
      </div>

      {/* Main content area placeholder */}
      <div className="flex-1 rounded-lg border border-dashed border-[rgb(var(--border))] p-4">
        <p className="text-sm text-[rgb(var(--muted-foreground))]">Main content area</p>
      </div>
    </div>
  ),
};

/** Loading transition demo */
export const LoadingTransition: Story = {
  render: function LoadingTransitionStory() {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <Button
            onClick={() => {
              setIsLoading(true);
              setHasError(false);
            }}
          >
            Show Loading
          </Button>
          <Button
            onClick={() => {
              setIsLoading(false);
              setHasError(false);
            }}
          >
            Show Content
          </Button>
          <Button
            onClick={() => {
              setIsLoading(false);
              setHasError(true);
            }}
          >
            Show Error
          </Button>
        </div>
        <div className="w-80 rounded-lg border border-[rgb(var(--border))]">
          <ArtifactsPanel
            artifacts={isLoading || hasError ? [] : sampleArtifacts}
            onOpenArtifact={() => {}}
            onPreviewArtifact={() => {}}
            loading={isLoading}
            error={hasError ? 'Failed to load artifacts' : undefined}
            onRetry={() => {
              setIsLoading(true);
              setHasError(false);
            }}
          />
        </div>
      </div>
    );
  },
};

// ============================================================================
// Constants Reference
// ============================================================================

/** Constants reference for developers */
export const ConstantsReference: Story = {
  render: () => (
    <div className="max-w-2xl space-y-6 text-sm">
      <div className="rounded-lg border border-[rgb(var(--border))] p-4">
        <h3 className="font-medium text-[rgb(var(--foreground))]">Default Values</h3>
        <table className="mt-2 w-full text-left">
          <tbody className="divide-y divide-[rgb(var(--border))]">
            <tr>
              <td className="py-1 font-mono text-xs text-[rgb(var(--muted-foreground))]">
                DEFAULT_SKELETON_COUNT
              </td>
              <td className="py-1">{DEFAULT_SKELETON_COUNT}</td>
            </tr>
            <tr>
              <td className="py-1 font-mono text-xs text-[rgb(var(--muted-foreground))]">
                DEFAULT_HEADING
              </td>
              <td className="py-1">"{DEFAULT_HEADING}"</td>
            </tr>
            <tr>
              <td className="py-1 font-mono text-xs text-[rgb(var(--muted-foreground))]">
                DEFAULT_EMPTY_TITLE
              </td>
              <td className="py-1">"{DEFAULT_EMPTY_TITLE}"</td>
            </tr>
            <tr>
              <td className="py-1 font-mono text-xs text-[rgb(var(--muted-foreground))]">
                DEFAULT_EMPTY_DESCRIPTION
              </td>
              <td className="py-1">"{DEFAULT_EMPTY_DESCRIPTION}"</td>
            </tr>
            <tr>
              <td className="py-1 font-mono text-xs text-[rgb(var(--muted-foreground))]">
                DEFAULT_ERROR_TITLE
              </td>
              <td className="py-1">"{DEFAULT_ERROR_TITLE}"</td>
            </tr>
            <tr>
              <td className="py-1 font-mono text-xs text-[rgb(var(--muted-foreground))]">
                DEFAULT_RETRY_LABEL
              </td>
              <td className="py-1">"{DEFAULT_RETRY_LABEL}"</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="rounded-lg border border-[rgb(var(--border))] p-4">
        <h3 className="font-medium text-[rgb(var(--foreground))]">Size Classes</h3>
        <table className="mt-2 w-full text-left">
          <thead>
            <tr className="text-[rgb(var(--muted-foreground))]">
              <th className="py-1">Size</th>
              <th className="py-1">Panel Padding</th>
              <th className="py-1">Item Padding</th>
              <th className="py-1">Icon Size</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgb(var(--border))]">
            {(['sm', 'md', 'lg'] as const).map((size) => (
              <tr key={size}>
                <td className="py-1 font-mono text-xs">{size}</td>
                <td className="py-1 font-mono text-xs text-[rgb(var(--muted-foreground))]">
                  {ARTIFACTS_PANEL_SIZE_CLASSES[size]}
                </td>
                <td className="py-1 font-mono text-xs text-[rgb(var(--muted-foreground))]">
                  {ARTIFACTS_ITEM_SIZE_CLASSES[size]}
                </td>
                <td className="py-1 font-mono text-xs text-[rgb(var(--muted-foreground))]">
                  {ARTIFACTS_ICON_SIZE_MAP[size]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-lg border border-[rgb(var(--border))] p-4">
        <h3 className="font-medium text-[rgb(var(--foreground))]">Utility Functions</h3>
        <ul className="mt-2 space-y-2 text-[rgb(var(--muted-foreground))]">
          <li>
            <code className="font-mono text-xs">getBaseSize(size)</code> - Get base size from
            responsive value
          </li>
          <li>
            <code className="font-mono text-xs">getResponsiveSizeClasses(size, classMap)</code> -
            Generate responsive CSS classes
          </li>
          <li>
            <code className="font-mono text-xs">formatFileSize(bytes)</code> - Format bytes to
            human-readable string
          </li>
          <li>
            <code className="font-mono text-xs">getFileIcon(artifact)</code> - Get icon component
            for file type
          </li>
          <li>
            <code className="font-mono text-xs">canPreview(artifact)</code> - Check if file can be
            previewed
          </li>
          <li>
            <code className="font-mono text-xs">getFileType(artifact)</code> - Get file type for
            screen readers
          </li>
          <li>
            <code className="font-mono text-xs">getListAnnouncement(artifacts)</code> - Generate
            screen reader announcement
          </li>
        </ul>
      </div>

      <div className="rounded-lg border border-[rgb(var(--border))] p-4">
        <h3 className="font-medium text-[rgb(var(--foreground))]">Exported Classes</h3>
        <ul className="mt-2 space-y-1 font-mono text-xs text-[rgb(var(--muted-foreground))]">
          <li>ARTIFACTS_PANEL_BASE_CLASSES</li>
          <li>ARTIFACTS_PANEL_SIZE_CLASSES</li>
          <li>ARTIFACTS_ITEM_BASE_CLASSES</li>
          <li>ARTIFACTS_ITEM_SIZE_CLASSES</li>
          <li>ARTIFACTS_HEADING_MARGIN_CLASSES</li>
          <li>ARTIFACTS_LIST_GAP_CLASSES</li>
          <li>ARTIFACTS_FILE_INFO_CLASSES</li>
          <li>ARTIFACTS_FILE_NAME_CLASSES</li>
          <li>ARTIFACTS_ACTIONS_CLASSES</li>
          <li>ARTIFACTS_SKELETON_CONTAINER_CLASSES</li>
          <li>ARTIFACTS_SKELETON_TEXT_CLASSES</li>
          <li>ARTIFACTS_ERROR_CLASSES</li>
          <li>ARTIFACTS_ICON_SIZE_MAP</li>
          <li>ARTIFACTS_BUTTON_SIZE_MAP</li>
          <li>ARTIFACTS_BUTTON_DIMENSION_CLASSES</li>
        </ul>
      </div>
    </div>
  ),
};
