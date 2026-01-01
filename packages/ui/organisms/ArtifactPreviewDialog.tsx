import { type ResponsiveValue, VisuallyHidden } from '@openflow/primitives';
import { cn } from '@openflow/utils';
import { forwardRef, useId } from 'react';
import { Skeleton } from '../atoms/Skeleton';
import { Dialog, DialogContent } from '../molecules/Dialog';

// ============================================================================
// Types
// ============================================================================

export type ArtifactPreviewSize = 'sm' | 'md' | 'lg';
export type ArtifactPreviewBreakpoint = 'base' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface ArtifactPreviewDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Callback when the dialog should close */
  onClose: () => void;
  /** Name of the file being previewed */
  fileName: string;
  /** Content of the file */
  content: string | null;
  /** Whether the content is loading */
  loading?: boolean;
  /** Size of the dialog - responsive value supported */
  size?: ResponsiveValue<ArtifactPreviewSize>;
  /** Data attributes for testing */
  'data-testid'?: string;
  /** Additional class names */
  className?: string;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Breakpoint order for responsive class generation
 */
const BREAKPOINT_ORDER: readonly ArtifactPreviewBreakpoint[] = [
  'base',
  'sm',
  'md',
  'lg',
  'xl',
  '2xl',
];

/**
 * Default number of skeleton lines for loading state
 */
export const DEFAULT_SKELETON_LINES = 6;

/**
 * Default empty content message
 */
export const DEFAULT_EMPTY_MESSAGE = 'No content available';

/**
 * Loading announcement for screen readers
 */
export const LOADING_ANNOUNCEMENT = 'Loading file content';

/**
 * Size mapping to Dialog sizes
 */
export const ARTIFACT_PREVIEW_SIZE_MAP: Record<ArtifactPreviewSize, 'md' | 'lg' | 'xl'> = {
  sm: 'md',
  md: 'lg',
  lg: 'xl',
};

/**
 * Base classes for the preview container
 */
export const ARTIFACT_PREVIEW_CONTAINER_CLASSES = [
  'max-h-[60vh]',
  'overflow-auto',
  'scrollbar-thin',
].join(' ');

/**
 * Base classes for the code/content block
 */
export const ARTIFACT_PREVIEW_CONTENT_CLASSES = [
  'whitespace-pre-wrap',
  'break-words',
  'text-sm',
  'font-mono',
  'text-[rgb(var(--foreground))]',
  'bg-[rgb(var(--muted))]/30',
  'rounded-md',
].join(' ');

/**
 * Padding classes for content by size
 */
export const ARTIFACT_PREVIEW_PADDING_CLASSES: Record<ArtifactPreviewSize, string> = {
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
};

/**
 * Base classes for the skeleton loading container
 */
export const ARTIFACT_PREVIEW_SKELETON_CLASSES = 'space-y-3';

/**
 * Width classes for skeleton lines (creates visual variation)
 */
export const SKELETON_LINE_WIDTHS = ['w-full', 'w-3/4', 'w-5/6', 'w-2/3', 'w-full', 'w-4/5'];

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get the base size from a ResponsiveValue
 */
export function getBaseSize(
  size: ResponsiveValue<ArtifactPreviewSize> | undefined
): ArtifactPreviewSize {
  if (size === undefined) {
    return 'md';
  }
  if (typeof size === 'string') {
    return size;
  }
  if (typeof size === 'object' && size !== null) {
    return (size as Partial<Record<ArtifactPreviewBreakpoint, ArtifactPreviewSize>>).base ?? 'md';
  }
  return 'md';
}

/**
 * Generate responsive padding classes from size value
 */
export function getResponsivePaddingClasses(
  size: ResponsiveValue<ArtifactPreviewSize> | undefined
): string {
  if (size === undefined) {
    return ARTIFACT_PREVIEW_PADDING_CLASSES.md;
  }

  if (typeof size === 'string') {
    return ARTIFACT_PREVIEW_PADDING_CLASSES[size];
  }

  if (typeof size === 'object' && size !== null) {
    const classes: string[] = [];
    for (const breakpoint of BREAKPOINT_ORDER) {
      const breakpointValue = (
        size as Partial<Record<ArtifactPreviewBreakpoint, ArtifactPreviewSize>>
      )[breakpoint];
      if (breakpointValue !== undefined) {
        const paddingClass = ARTIFACT_PREVIEW_PADDING_CLASSES[breakpointValue];
        // Extract the padding value (e.g., "p-4" -> "4")
        const paddingValue = paddingClass.replace('p-', '');
        if (breakpoint === 'base') {
          classes.push(`p-${paddingValue}`);
        } else {
          classes.push(`${breakpoint}:p-${paddingValue}`);
        }
      }
    }
    return classes.join(' ');
  }

  return ARTIFACT_PREVIEW_PADDING_CLASSES.md;
}

/**
 * Convert ArtifactPreviewSize to Dialog size
 */
export function getDialogSize(
  size: ResponsiveValue<ArtifactPreviewSize> | undefined
): ResponsiveValue<'md' | 'lg' | 'xl'> {
  if (size === undefined) {
    return 'lg';
  }

  if (typeof size === 'string') {
    return ARTIFACT_PREVIEW_SIZE_MAP[size];
  }

  if (typeof size === 'object' && size !== null) {
    const mapped: Partial<Record<ArtifactPreviewBreakpoint, 'md' | 'lg' | 'xl'>> = {};
    for (const breakpoint of BREAKPOINT_ORDER) {
      const breakpointValue = (
        size as Partial<Record<ArtifactPreviewBreakpoint, ArtifactPreviewSize>>
      )[breakpoint];
      if (breakpointValue !== undefined) {
        mapped[breakpoint] = ARTIFACT_PREVIEW_SIZE_MAP[breakpointValue];
      }
    }
    return mapped;
  }

  return 'lg';
}

/**
 * Get screen reader announcement for content state
 */
export function getContentAnnouncement(
  fileName: string,
  loading: boolean,
  content: string | null
): string {
  if (loading) {
    return `Loading content for ${fileName}`;
  }
  if (content === null || content === '') {
    return `${fileName}: ${DEFAULT_EMPTY_MESSAGE}`;
  }
  const lineCount = content.split('\n').length;
  return `${fileName} loaded, ${lineCount} line${lineCount !== 1 ? 's' : ''} of content`;
}

// ============================================================================
// PreviewSkeleton Component
// ============================================================================

export interface PreviewSkeletonProps {
  /** Number of skeleton lines to render */
  lines?: number;
  /** Data attributes for testing */
  'data-testid'?: string;
}

/**
 * Loading skeleton for the preview content.
 * Shows animated placeholder lines while content is loading.
 */
export const PreviewSkeleton = forwardRef<HTMLDivElement, PreviewSkeletonProps>(
  function PreviewSkeleton({ lines = DEFAULT_SKELETON_LINES, 'data-testid': dataTestId }, ref) {
    // Ensure we have enough width classes
    const widthClasses = SKELETON_LINE_WIDTHS;

    return (
      <div
        ref={ref}
        className={ARTIFACT_PREVIEW_SKELETON_CLASSES}
        role="presentation"
        aria-hidden="true"
        data-testid={dataTestId}
        data-lines={lines}
      >
        {Array.from({ length: lines }, (_, index) => (
          <Skeleton
            key={index}
            variant="text"
            className={widthClasses[index % widthClasses.length]}
            data-testid={dataTestId ? `${dataTestId}-line-${index}` : undefined}
          />
        ))}
      </div>
    );
  }
);

PreviewSkeleton.displayName = 'PreviewSkeleton';

// ============================================================================
// ArtifactPreviewDialog Component
// ============================================================================

/**
 * ArtifactPreviewDialog component for previewing artifact file content.
 * Stateless - receives all data via props, emits actions via callbacks.
 *
 * Accessibility features:
 * - Uses Dialog molecule with full accessibility (focus trap, escape key, aria)
 * - Loading state announced to screen readers
 * - Content loading state uses aria-busy
 * - Empty/null content provides meaningful fallback message
 * - File name used as dialog title for context
 * - Motion-safe animations (via Dialog)
 *
 * @example
 * <ArtifactPreviewDialog
 *   isOpen={!!previewFile}
 *   onClose={() => setPreviewFile(null)}
 *   fileName={previewFile?.name ?? ''}
 *   content={previewContent}
 *   loading={isLoadingPreview}
 * />
 *
 * @example
 * // Responsive sizing
 * <ArtifactPreviewDialog
 *   isOpen={isOpen}
 *   onClose={handleClose}
 *   fileName="large-file.tsx"
 *   content={content}
 *   size={{ base: 'sm', md: 'md', lg: 'lg' }}
 * />
 */
export const ArtifactPreviewDialog = forwardRef<HTMLDivElement, ArtifactPreviewDialogProps>(
  function ArtifactPreviewDialog(
    {
      isOpen,
      onClose,
      fileName,
      content,
      loading = false,
      size = 'md',
      'data-testid': dataTestId,
      className,
    },
    ref
  ) {
    const descriptionId = useId();
    const dialogSize = getDialogSize(size);
    const paddingClasses = getResponsivePaddingClasses(size);
    const baseSize = getBaseSize(size);
    const announcement = getContentAnnouncement(fileName, loading, content);

    // Determine display content
    const displayContent = content ?? DEFAULT_EMPTY_MESSAGE;
    const hasContent = content !== null && content !== '';

    return (
      <Dialog
        ref={ref}
        isOpen={isOpen}
        onClose={onClose}
        title={fileName}
        size={dialogSize}
        descriptionId={descriptionId}
        data-testid={dataTestId}
        className={className}
      >
        {/* Screen reader announcement for content state changes */}
        <VisuallyHidden>
          <span id={descriptionId} role="status" aria-live="polite" aria-atomic="true">
            {announcement}
          </span>
        </VisuallyHidden>

        <DialogContent
          className={ARTIFACT_PREVIEW_CONTAINER_CLASSES}
          data-testid={dataTestId ? `${dataTestId}-content` : undefined}
          aria-busy={loading}
        >
          {loading ? (
            <PreviewSkeleton
              lines={DEFAULT_SKELETON_LINES}
              data-testid={dataTestId ? `${dataTestId}-skeleton` : undefined}
            />
          ) : (
            <pre
              className={cn(ARTIFACT_PREVIEW_CONTENT_CLASSES, paddingClasses)}
              data-testid={dataTestId ? `${dataTestId}-code` : undefined}
              data-empty={!hasContent}
              data-size={baseSize}
            >
              {displayContent}
            </pre>
          )}
        </DialogContent>
      </Dialog>
    );
  }
);

ArtifactPreviewDialog.displayName = 'ArtifactPreviewDialog';
