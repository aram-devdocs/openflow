import { cn } from '@openflow/utils';
import { AlertTriangle, FileText, Shield, Terminal, X } from 'lucide-react';
import { Button } from '../atoms/Button';
import { Icon } from '../atoms/Icon';

export interface PermissionRequest {
  processId: string;
  toolName: string;
  filePath?: string;
  description: string;
}

export interface PermissionDialogProps {
  /** The permission request to display */
  request: PermissionRequest;
  /** Called when user approves the permission */
  onApprove: () => void;
  /** Called when user denies the permission */
  onDeny: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Get the appropriate icon for a tool type.
 */
function getToolIcon(toolName: string) {
  switch (toolName.toLowerCase()) {
    case 'write':
      return FileText;
    case 'read':
      return FileText;
    case 'bash':
      return Terminal;
    default:
      return Shield;
  }
}

/**
 * Get a human-readable action description for a tool.
 */
function getActionDescription(toolName: string): string {
  switch (toolName.toLowerCase()) {
    case 'write':
      return 'write to';
    case 'read':
      return 'read from';
    case 'bash':
      return 'execute command in';
    default:
      return 'access';
  }
}

/**
 * PermissionDialog component for handling Claude Code permission requests.
 * Shows a dialog when Claude needs permission to perform an action.
 *
 * @example
 * ```tsx
 * <PermissionDialog
 *   request={{
 *     processId: "abc123",
 *     toolName: "Write",
 *     filePath: "/path/to/file.txt",
 *     description: "Allow Claude to write to file.txt? (y/n)"
 *   }}
 *   onApprove={() => sendInput(processId, "y\n")}
 *   onDeny={() => sendInput(processId, "n\n")}
 * />
 * ```
 */
export function PermissionDialog({ request, onApprove, onDeny, className }: PermissionDialogProps) {
  const ToolIcon = getToolIcon(request.toolName);
  const actionDesc = getActionDescription(request.toolName);

  return (
    <div
      className={cn('fixed inset-0 z-50 flex items-center justify-center bg-black/50', className)}
    >
      <div
        className={cn(
          'w-full max-w-md rounded-lg border border-[rgb(var(--border))]',
          'bg-[rgb(var(--card))] shadow-xl'
        )}
      >
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-[rgb(var(--border))] px-4 py-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500/20">
            <Icon icon={AlertTriangle} size="md" className="text-yellow-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-[rgb(var(--foreground))]">
              Permission Required
            </h2>
            <p className="text-xs text-[rgb(var(--muted-foreground))]">
              Claude is requesting access
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDeny}
            className="h-8 w-8 p-0"
            aria-label="Close"
          >
            <Icon icon={X} size="sm" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-[rgb(var(--muted))]">
              <Icon icon={ToolIcon} size="sm" className="text-[rgb(var(--primary))]" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-[rgb(var(--foreground))]">
                Claude wants to <span className="font-medium">{actionDesc}</span>
              </p>
              {request.filePath && (
                <code className="mt-1 block rounded bg-[rgb(var(--muted))] px-2 py-1 text-xs text-[rgb(var(--muted-foreground))]">
                  {request.filePath}
                </code>
              )}
              <p className="mt-2 text-xs text-[rgb(var(--muted-foreground))]">
                {request.description}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 border-t border-[rgb(var(--border))] px-4 py-3">
          <Button variant="secondary" size="sm" onClick={onDeny} className="flex-1">
            Deny
          </Button>
          <Button variant="primary" size="sm" onClick={onApprove} className="flex-1">
            Allow
          </Button>
        </div>
      </div>
    </div>
  );
}

PermissionDialog.displayName = 'PermissionDialog';
