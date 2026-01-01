import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { useRef, useState } from 'react';
import { Button } from '../atoms/Button';
import {
  ARTIFACT_PREVIEW_CONTAINER_CLASSES,
  ARTIFACT_PREVIEW_CONTENT_CLASSES,
  ARTIFACT_PREVIEW_PADDING_CLASSES,
  ARTIFACT_PREVIEW_SIZE_MAP,
  ARTIFACT_PREVIEW_SKELETON_CLASSES,
  ArtifactPreviewDialog,
  DEFAULT_EMPTY_MESSAGE,
  DEFAULT_SKELETON_LINES,
  LOADING_ANNOUNCEMENT,
  PreviewSkeleton,
  SKELETON_LINE_WIDTHS,
  getBaseSize,
  getContentAnnouncement,
  getDialogSize,
  getResponsivePaddingClasses,
} from './ArtifactPreviewDialog';

const meta: Meta<typeof ArtifactPreviewDialog> = {
  title: 'Organisms/ArtifactPreviewDialog',
  component: ArtifactPreviewDialog,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    isOpen: {
      control: 'boolean',
      description: 'Whether the dialog is open',
    },
    fileName: {
      control: 'text',
      description: 'Name of the file being previewed',
    },
    content: {
      control: 'text',
      description: 'Content of the file',
    },
    loading: {
      control: 'boolean',
      description: 'Whether the content is loading',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size of the dialog - supports responsive values',
    },
    'data-testid': {
      control: 'text',
      description: 'Test ID for automated testing',
    },
  },
  args: {
    onClose: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof ArtifactPreviewDialog>;

// ============================================================================
// Sample Content
// ============================================================================

/** Sample TypeScript code content */
const typescriptContent = `import { cn } from '@openflow/utils';
import type { ReactNode } from 'react';

export interface CardProps {
  variant?: 'default' | 'outlined' | 'elevated';
  header?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
}

const variantStyles = {
  default: 'bg-[rgb(var(--card))] border border-[rgb(var(--border))]',
  outlined: 'bg-transparent border-2 border-[rgb(var(--border))]',
  elevated: 'bg-[rgb(var(--card))] shadow-lg',
};

export function Card({
  variant = 'default',
  header,
  footer,
  children,
  className,
}: CardProps) {
  return (
    <div className={cn('rounded-lg', variantStyles[variant], className)}>
      {header && (
        <div className="border-b border-[rgb(var(--border))] px-4 py-3 font-medium">
          {header}
        </div>
      )}
      <div className="px-4 py-3">{children}</div>
      {footer && (
        <div className="border-t border-[rgb(var(--border))] px-4 py-3">
          {footer}
        </div>
      )}
    </div>
  );
}

Card.displayName = 'Card';
`;

/** Sample JSON content */
const jsonContent = `{
  "name": "openflow",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@tanstack/react-query": "^5.0.0",
    "tailwindcss": "^3.4.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "@types/react": "^18.2.0"
  }
}`;

/** Sample markdown content */
const markdownContent = `# Feature Specification

## Overview
This document outlines the technical specification for the new user authentication feature.

## Requirements
- Support email/password authentication
- OAuth2 integration (Google, GitHub)
- JWT token-based sessions
- Password reset functionality

## Implementation Notes
The authentication system will use the following components:

1. **AuthProvider** - React context for auth state
2. **useAuth** - Custom hook for auth operations
3. **AuthService** - Backend API integration

## API Endpoints
\`\`\`
POST /api/auth/login
POST /api/auth/register
POST /api/auth/logout
POST /api/auth/refresh
\`\`\`
`;

/** Sample plain text content */
const plainTextContent = `Build Log - 2024-01-15 10:30:45

Starting build process...
[1/4] Compiling TypeScript files...
[2/4] Bundling assets...
[3/4] Optimizing images...
[4/4] Generating source maps...

Build completed successfully!
Total time: 45.2s
Output size: 2.4 MB
`;

// ============================================================================
// Basic Stories
// ============================================================================

/** Default TypeScript file preview */
export const TypeScriptFile: Story = {
  args: {
    isOpen: true,
    fileName: 'Card.tsx',
    content: typescriptContent,
  },
};

/** JSON file preview */
export const JsonFile: Story = {
  args: {
    isOpen: true,
    fileName: 'package.json',
    content: jsonContent,
  },
};

/** Markdown file preview */
export const MarkdownFile: Story = {
  args: {
    isOpen: true,
    fileName: 'spec.md',
    content: markdownContent,
  },
};

/** Plain text file preview */
export const PlainTextFile: Story = {
  args: {
    isOpen: true,
    fileName: 'build.log',
    content: plainTextContent,
  },
};

// ============================================================================
// Loading States
// ============================================================================

/** Loading state with skeleton */
export const Loading: Story = {
  args: {
    isOpen: true,
    fileName: 'LargeFile.tsx',
    content: null,
    loading: true,
  },
};

/** Loading state - small size */
export const LoadingSmall: Story = {
  args: {
    isOpen: true,
    fileName: 'small-file.ts',
    content: null,
    loading: true,
    size: 'sm',
  },
};

/** Loading state - large size */
export const LoadingLarge: Story = {
  args: {
    isOpen: true,
    fileName: 'large-file.tsx',
    content: null,
    loading: true,
    size: 'lg',
  },
};

// ============================================================================
// Content States
// ============================================================================

/** Empty content (empty string) */
export const EmptyContent: Story = {
  args: {
    isOpen: true,
    fileName: 'empty.txt',
    content: '',
  },
};

/** Null content (shows fallback message) */
export const NullContent: Story = {
  args: {
    isOpen: true,
    fileName: 'unknown.bin',
    content: null,
  },
};

/** Long file name that might need truncation */
export const LongFileName: Story = {
  args: {
    isOpen: true,
    fileName: 'this-is-a-very-long-file-name-that-might-need-truncation-in-the-dialog-title.tsx',
    content: typescriptContent,
  },
};

/** Very long content (for scroll testing) */
export const LongContent: Story = {
  args: {
    isOpen: true,
    fileName: 'large-file.ts',
    content: Array(100).fill(typescriptContent).join('\n\n// --- Section Break ---\n\n'),
  },
};

/** Wide content (horizontal scroll) */
export const WideContent: Story = {
  args: {
    isOpen: true,
    fileName: 'minified.js',
    content:
      'const veryLongVariableName = "This is a very long string that extends beyond the normal width of the dialog and should trigger horizontal scrolling in the preview area to allow users to see the full content without breaking the layout";',
  },
};

// ============================================================================
// Size Variants
// ============================================================================

/** Small dialog size */
export const SizeSmall: Story = {
  args: {
    isOpen: true,
    fileName: 'config.json',
    content: jsonContent,
    size: 'sm',
  },
};

/** Medium dialog size (default) */
export const SizeMedium: Story = {
  args: {
    isOpen: true,
    fileName: 'component.tsx',
    content: typescriptContent,
    size: 'md',
  },
};

/** Large dialog size */
export const SizeLarge: Story = {
  args: {
    isOpen: true,
    fileName: 'specification.md',
    content: markdownContent,
    size: 'lg',
  },
};

/** All sizes comparison */
export const AllSizes: Story = {
  render: () => {
    const [openSize, setOpenSize] = useState<'sm' | 'md' | 'lg' | null>(null);

    return (
      <div className="flex flex-col gap-4 p-8">
        <h3 className="text-lg font-semibold">Click a button to see each size:</h3>
        <div className="flex gap-2">
          <Button onClick={() => setOpenSize('sm')}>Small</Button>
          <Button onClick={() => setOpenSize('md')}>Medium</Button>
          <Button onClick={() => setOpenSize('lg')}>Large</Button>
        </div>

        <ArtifactPreviewDialog
          isOpen={openSize !== null}
          onClose={() => setOpenSize(null)}
          fileName={`example-${openSize}.tsx`}
          content={typescriptContent}
          size={openSize ?? 'md'}
        />
      </div>
    );
  },
};

// ============================================================================
// Responsive Sizing
// ============================================================================

/** Responsive sizing - different sizes at different breakpoints */
export const ResponsiveSizing: Story = {
  args: {
    isOpen: true,
    fileName: 'responsive-preview.tsx',
    content: typescriptContent,
    size: { base: 'sm', md: 'md', lg: 'lg' },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Resize your browser window to see the dialog size change at different breakpoints. On mobile (< md) it uses sm, on tablet (md-lg) it uses md, and on desktop (> lg) it uses lg.',
      },
    },
  },
};

/** Responsive - small on mobile, large on desktop */
export const ResponsiveSmallToLarge: Story = {
  args: {
    isOpen: true,
    fileName: 'mobile-to-desktop.tsx',
    content: typescriptContent,
    size: { base: 'sm', lg: 'lg' },
  },
};

// ============================================================================
// Accessibility
// ============================================================================

/** With data-testid for testing */
export const WithTestId: Story = {
  args: {
    isOpen: true,
    fileName: 'test-file.tsx',
    content: typescriptContent,
    'data-testid': 'artifact-preview',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Uses data-testid for automated testing. The dialog, content, code block, and skeleton all have corresponding test IDs.',
      },
    },
  },
};

/** Focus ring visibility demo */
export const FocusRingVisibility: Story = {
  args: {
    isOpen: true,
    fileName: 'focus-demo.tsx',
    content: typescriptContent,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Tab through the dialog to see the focus ring on the close button. Focus trap keeps focus within the dialog.',
      },
    },
  },
};

/** Screen reader accessibility demo */
export const ScreenReaderAccessibility: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const handleOpen = () => {
      setIsOpen(true);
      setIsLoading(true);
      // Simulate loading
      setTimeout(() => setIsLoading(false), 2000);
    };

    return (
      <div className="p-8">
        <div className="mb-4 space-y-2">
          <h3 className="text-lg font-semibold">Screen Reader Demo</h3>
          <p className="text-sm text-[rgb(var(--muted-foreground))]">
            Click the button to open the dialog. Screen readers will announce:
          </p>
          <ul className="ml-4 list-disc text-sm text-[rgb(var(--muted-foreground))]">
            <li>&quot;Dialog opened: example.tsx&quot; when the dialog opens</li>
            <li>&quot;Loading content for example.tsx&quot; during loading</li>
            <li>&quot;example.tsx loaded, X lines of content&quot; when loaded</li>
          </ul>
        </div>

        <Button onClick={handleOpen}>Open Preview with Loading</Button>

        <ArtifactPreviewDialog
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          fileName="example.tsx"
          content={isLoading ? null : typescriptContent}
          loading={isLoading}
          data-testid="sr-demo"
        />
      </div>
    );
  },
};

/** Keyboard navigation demo */
export const KeyboardNavigation: Story = {
  args: {
    isOpen: true,
    fileName: 'keyboard-demo.tsx',
    content: typescriptContent,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Keyboard accessibility: Tab to navigate between elements, Escape to close the dialog, focus is trapped within the dialog, and focus returns to the trigger element on close.',
      },
    },
  },
};

// ============================================================================
// Interactive Examples
// ============================================================================

/** Interactive toggle demo */
export const InteractiveToggle: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    const [fileName, setFileName] = useState('example.tsx');
    const [content, setContent] = useState(typescriptContent);

    const files = [
      { name: 'Card.tsx', content: typescriptContent },
      { name: 'package.json', content: jsonContent },
      { name: 'README.md', content: markdownContent },
      { name: 'build.log', content: plainTextContent },
    ];

    return (
      <div className="p-8">
        <div className="mb-4">
          <h3 className="mb-2 text-lg font-semibold">Select a file to preview:</h3>
          <div className="flex flex-wrap gap-2">
            {files.map((file) => (
              <Button
                key={file.name}
                variant={fileName === file.name ? 'primary' : 'ghost'}
                onClick={() => {
                  setFileName(file.name);
                  setContent(file.content);
                  setIsOpen(true);
                }}
              >
                {file.name}
              </Button>
            ))}
          </div>
        </div>

        <ArtifactPreviewDialog
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          fileName={fileName}
          content={content}
        />
      </div>
    );
  },
};

/** Ref forwarding demo */
export const RefForwarding: Story = {
  render: () => {
    const dialogRef = useRef<HTMLDivElement>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [refInfo, setRefInfo] = useState<string>('');

    const handleOpen = () => {
      setIsOpen(true);
      // Wait for dialog to render
      setTimeout(() => {
        if (dialogRef.current) {
          const rect = dialogRef.current.getBoundingClientRect();
          setRefInfo(`Dialog dimensions: ${Math.round(rect.width)}x${Math.round(rect.height)}px`);
        }
      }, 100);
    };

    return (
      <div className="p-8">
        <Button onClick={handleOpen}>Open Dialog with Ref</Button>
        {refInfo && <p className="mt-4 text-sm text-[rgb(var(--muted-foreground))]">{refInfo}</p>}

        <ArtifactPreviewDialog
          ref={dialogRef}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          fileName="ref-demo.tsx"
          content={typescriptContent}
        />
      </div>
    );
  },
};

/** Dialog closed (should show nothing) */
export const Closed: Story = {
  args: {
    isOpen: false,
    fileName: 'file.txt',
    content: 'This content should not be visible',
  },
};

// ============================================================================
// Real-World Examples
// ============================================================================

/** Artifact file browser simulation */
export const ArtifactBrowser: Story = {
  render: () => {
    const [selectedFile, setSelectedFile] = useState<{ name: string; content: string } | null>(
      null
    );
    const [loading, setLoading] = useState(false);

    const artifacts = [
      { name: 'src/components/Button.tsx', content: typescriptContent },
      { name: 'package.json', content: jsonContent },
      { name: 'docs/README.md', content: markdownContent },
      { name: 'logs/build.log', content: plainTextContent },
      { name: 'dist/bundle.min.js', content: 'var a=1,b=2,c=a+b;console.log(c);' },
    ];

    const handleFileClick = (file: { name: string; content: string }) => {
      setLoading(true);
      setSelectedFile(file);
      // Simulate loading delay
      setTimeout(() => setLoading(false), 800);
    };

    return (
      <div className="min-h-screen bg-[rgb(var(--background))] p-4">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-4 text-xl font-bold text-[rgb(var(--foreground))]">Artifact Browser</h2>
          <div className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))]">
            <ul className="divide-y divide-[rgb(var(--border))]">
              {artifacts.map((file) => (
                <li key={file.name}>
                  <button
                    type="button"
                    className="w-full px-4 py-3 text-left text-sm font-mono text-[rgb(var(--foreground))] hover:bg-[rgb(var(--muted))]/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))] focus-visible:ring-offset-2"
                    onClick={() => handleFileClick(file)}
                  >
                    📄 {file.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <ArtifactPreviewDialog
          isOpen={selectedFile !== null}
          onClose={() => setSelectedFile(null)}
          fileName={selectedFile?.name ?? ''}
          content={loading ? null : (selectedFile?.content ?? null)}
          loading={loading}
          size={{ base: 'sm', md: 'md', lg: 'lg' }}
          data-testid="artifact-browser-preview"
        />
      </div>
    );
  },
};

/** Build output preview */
export const BuildOutputPreview: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [output, setOutput] = useState<string | null>(null);

    const simulateBuild = () => {
      setIsOpen(true);
      setIsLoading(true);
      setOutput(null);

      // Simulate build process
      setTimeout(() => {
        setIsLoading(false);
        setOutput(plainTextContent);
      }, 1500);
    };

    return (
      <div className="p-8">
        <Button onClick={simulateBuild}>Run Build & Preview Output</Button>

        <ArtifactPreviewDialog
          isOpen={isOpen}
          onClose={() => {
            setIsOpen(false);
            setOutput(null);
          }}
          fileName="build-output.log"
          content={output}
          loading={isLoading}
          size="lg"
          data-testid="build-output"
        />
      </div>
    );
  },
};

// ============================================================================
// PreviewSkeleton Stories
// ============================================================================

/** PreviewSkeleton - Default lines */
export const SkeletonDefault: Story = {
  render: () => (
    <div className="p-8 max-w-lg">
      <h3 className="mb-4 text-lg font-semibold">PreviewSkeleton (Default: 6 lines)</h3>
      <div className="rounded-lg border border-[rgb(var(--border))] p-4 bg-[rgb(var(--card))]">
        <PreviewSkeleton data-testid="preview-skeleton" />
      </div>
    </div>
  ),
};

/** PreviewSkeleton - Custom line count */
export const SkeletonCustomLines: Story = {
  render: () => (
    <div className="p-8 max-w-lg space-y-6">
      <div>
        <h3 className="mb-2 text-sm font-medium">3 lines</h3>
        <div className="rounded-lg border border-[rgb(var(--border))] p-4 bg-[rgb(var(--card))]">
          <PreviewSkeleton lines={3} />
        </div>
      </div>
      <div>
        <h3 className="mb-2 text-sm font-medium">10 lines</h3>
        <div className="rounded-lg border border-[rgb(var(--border))] p-4 bg-[rgb(var(--card))]">
          <PreviewSkeleton lines={10} />
        </div>
      </div>
    </div>
  ),
};

// ============================================================================
// Constants Reference
// ============================================================================

/** Constants reference for development */
export const ConstantsReference: Story = {
  render: () => (
    <div className="p-8 space-y-6 max-w-4xl">
      <h2 className="text-xl font-bold">ArtifactPreviewDialog Constants Reference</h2>

      <div className="space-y-4">
        <section>
          <h3 className="text-lg font-semibold mb-2">Default Values</h3>
          <div className="rounded-lg border border-[rgb(var(--border))] p-4 bg-[rgb(var(--muted))]/30 font-mono text-sm">
            <p>DEFAULT_SKELETON_LINES = {DEFAULT_SKELETON_LINES}</p>
            <p>DEFAULT_EMPTY_MESSAGE = &quot;{DEFAULT_EMPTY_MESSAGE}&quot;</p>
            <p>LOADING_ANNOUNCEMENT = &quot;{LOADING_ANNOUNCEMENT}&quot;</p>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-2">Size Mapping</h3>
          <div className="rounded-lg border border-[rgb(var(--border))] p-4 bg-[rgb(var(--muted))]/30 font-mono text-sm">
            <p>ARTIFACT_PREVIEW_SIZE_MAP:</p>
            <ul className="ml-4">
              {Object.entries(ARTIFACT_PREVIEW_SIZE_MAP).map(([key, value]) => (
                <li key={key}>
                  {key} → {value}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-2">Padding Classes</h3>
          <div className="rounded-lg border border-[rgb(var(--border))] p-4 bg-[rgb(var(--muted))]/30 font-mono text-sm">
            <p>ARTIFACT_PREVIEW_PADDING_CLASSES:</p>
            <ul className="ml-4">
              {Object.entries(ARTIFACT_PREVIEW_PADDING_CLASSES).map(([key, value]) => (
                <li key={key}>
                  {key} = &quot;{value}&quot;
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-2">CSS Classes</h3>
          <div className="rounded-lg border border-[rgb(var(--border))] p-4 bg-[rgb(var(--muted))]/30 font-mono text-sm space-y-2">
            <p>ARTIFACT_PREVIEW_CONTAINER_CLASSES:</p>
            <p className="ml-4 text-xs break-all">
              &quot;{ARTIFACT_PREVIEW_CONTAINER_CLASSES}&quot;
            </p>
            <p>ARTIFACT_PREVIEW_CONTENT_CLASSES:</p>
            <p className="ml-4 text-xs break-all">&quot;{ARTIFACT_PREVIEW_CONTENT_CLASSES}&quot;</p>
            <p>ARTIFACT_PREVIEW_SKELETON_CLASSES:</p>
            <p className="ml-4 text-xs">&quot;{ARTIFACT_PREVIEW_SKELETON_CLASSES}&quot;</p>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-2">Skeleton Line Widths</h3>
          <div className="rounded-lg border border-[rgb(var(--border))] p-4 bg-[rgb(var(--muted))]/30 font-mono text-sm">
            <p>SKELETON_LINE_WIDTHS = [{SKELETON_LINE_WIDTHS.join(', ')}]</p>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-2">Utility Functions</h3>
          <div className="rounded-lg border border-[rgb(var(--border))] p-4 bg-[rgb(var(--muted))]/30 font-mono text-sm space-y-2">
            <p>getBaseSize(&apos;md&apos;) = &quot;{getBaseSize('md')}&quot;</p>
            <p>
              getBaseSize({'{ base: "sm", lg: "lg" }'}) = &quot;
              {getBaseSize({ base: 'sm', lg: 'lg' })}&quot;
            </p>
            <p>getDialogSize(&apos;sm&apos;) = &quot;{String(getDialogSize('sm'))}&quot;</p>
            <p>
              getResponsivePaddingClasses(&apos;lg&apos;) = &quot;
              {getResponsivePaddingClasses('lg')}&quot;
            </p>
            <p>
              getContentAnnouncement(&apos;file.tsx&apos;, false, &apos;content&apos;) = &quot;
              {getContentAnnouncement('file.tsx', false, 'content')}&quot;
            </p>
          </div>
        </section>
      </div>
    </div>
  ),
};
