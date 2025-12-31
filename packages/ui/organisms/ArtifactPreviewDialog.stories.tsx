import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { ArtifactPreviewDialog } from './ArtifactPreviewDialog';

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
  },
  args: {
    onClose: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof ArtifactPreviewDialog>;

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

/** Loading state */
export const Loading: Story = {
  args: {
    isOpen: true,
    fileName: 'LargeFile.tsx',
    content: null,
    loading: true,
  },
};

/** Empty content */
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

/** Long file name */
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

/** Dialog closed */
export const Closed: Story = {
  args: {
    isOpen: false,
    fileName: 'file.txt',
    content: 'This content should not be visible',
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
