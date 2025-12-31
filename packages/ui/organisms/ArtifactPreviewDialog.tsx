import { cn } from '@openflow/utils';
import { Skeleton } from '../atoms/Skeleton';
import { Dialog, DialogContent } from '../molecules/Dialog';

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
}

/**
 * Loading skeleton for the preview content.
 */
function PreviewSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading content">
      <Skeleton variant="text" className="w-full" />
      <Skeleton variant="text" className="w-3/4" />
      <Skeleton variant="text" className="w-5/6" />
      <Skeleton variant="text" className="w-2/3" />
      <Skeleton variant="text" className="w-full" />
      <Skeleton variant="text" className="w-4/5" />
    </div>
  );
}

/**
 * ArtifactPreviewDialog component for previewing artifact file content.
 * Stateless - receives all data via props, emits actions via callbacks.
 *
 * Features:
 * - Displays file content in monospace font
 * - Loading skeleton state while fetching content
 * - Proper text wrapping for long content
 * - Accessible dialog with focus management
 *
 * @example
 * <ArtifactPreviewDialog
 *   isOpen={!!previewFile}
 *   onClose={() => setPreviewFile(null)}
 *   fileName={previewFile?.name ?? ''}
 *   content={previewContent}
 *   loading={isLoadingPreview}
 * />
 */
export function ArtifactPreviewDialog({
  isOpen,
  onClose,
  fileName,
  content,
  loading = false,
}: ArtifactPreviewDialogProps) {
  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={fileName} size="lg">
      <DialogContent
        className={cn(
          'max-h-[60vh] overflow-auto',
          // Custom scrollbar styling
          'scrollbar-thin'
        )}
      >
        {loading ? (
          <PreviewSkeleton />
        ) : (
          <pre
            className={cn(
              'whitespace-pre-wrap break-words',
              'text-sm font-mono',
              'text-[rgb(var(--foreground))]',
              'bg-[rgb(var(--muted))]/30 rounded-md p-4'
            )}
          >
            {content ?? 'No content available'}
          </pre>
        )}
      </DialogContent>
    </Dialog>
  );
}

ArtifactPreviewDialog.displayName = 'ArtifactPreviewDialog';
