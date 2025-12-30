import type { ArtifactFile } from '@openflow/queries';
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Button } from '../atoms/Button';
import { Dialog, DialogContent, DialogFooter } from '../molecules/Dialog';
import { ArtifactsPanel } from './ArtifactsPanel';

const meta: Meta<typeof ArtifactsPanel> = {
  title: 'Organisms/ArtifactsPanel',
  component: ArtifactsPanel,
  parameters: {
    layout: 'centered',
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
  },
};

export default meta;
type Story = StoryObj<typeof ArtifactsPanel>;

/** First artifact for single-artifact stories */
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

/** Default artifacts panel with sample files */
export const Default: Story = {
  render: () => <ArtifactsPanelDemo />,
};

/** Loading state with skeletons */
export const Loading: Story = {
  render: () => (
    <div className="w-80 rounded-lg border border-[rgb(var(--border))]">
      <ArtifactsPanel artifacts={[]} onOpenArtifact={() => {}} loading />
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

/** Hover interaction demo */
export const HoverInteraction: Story = {
  render: () => (
    <div className="w-80 space-y-4">
      <div className="rounded-lg border border-[rgb(var(--border))] p-4">
        <h3 className="font-medium text-[rgb(var(--foreground))]">Hover Interaction</h3>
        <p className="mt-2 text-sm text-[rgb(var(--muted-foreground))]">
          Hover over artifact items to reveal action buttons. Markdown files show both preview and
          open buttons.
        </p>
      </div>
      <ArtifactsPanelDemo />
    </div>
  ),
};
