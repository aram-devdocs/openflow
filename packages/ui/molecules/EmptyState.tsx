import { cn } from '@openflow/utils';
import type { LucideIcon } from 'lucide-react';
import { Button, type ButtonVariant } from '../atoms/Button';
import { Icon } from '../atoms/Icon';

interface EmptyStateAction {
  /** Button label text */
  label: string;
  /** Click handler */
  onClick: () => void;
  /** Button variant - defaults to 'primary' for primary action, 'secondary' for secondary */
  variant?: ButtonVariant;
  /** Whether the button is in loading state */
  loading?: boolean;
}

export interface EmptyStateProps {
  /** Icon to display above the title */
  icon?: LucideIcon;
  /** Main heading text */
  title: string;
  /** Optional description text below the title */
  description?: string;
  /** Primary action button */
  action?: EmptyStateAction;
  /** Secondary action button */
  secondaryAction?: EmptyStateAction;
  /** Additional CSS classes */
  className?: string;
  /** Size variant - 'sm' for inline, 'md' for panels, 'lg' for full page */
  size?: 'sm' | 'md' | 'lg';
}

const sizeStyles = {
  sm: {
    container: 'py-6 px-4',
    iconWrapper: 'mb-2 p-2',
    icon: 'h-5 w-5',
    title: 'text-sm font-medium',
    description: 'mt-1 text-xs',
    actions: 'mt-3 gap-2',
  },
  md: {
    container: 'py-8 px-6',
    iconWrapper: 'mb-3 p-3',
    icon: 'h-6 w-6',
    title: 'text-base font-medium',
    description: 'mt-1 text-sm',
    actions: 'mt-4 gap-3',
  },
  lg: {
    container: 'py-12 px-6',
    iconWrapper: 'mb-4 p-4',
    icon: 'h-8 w-8',
    title: 'text-lg font-semibold',
    description: 'mt-2 text-sm',
    actions: 'mt-6 gap-3',
  },
};

/**
 * EmptyState component for displaying placeholder content when there's no data.
 * Stateless - receives all data via props, emits actions via callbacks.
 *
 * Features:
 * - Configurable icon, title, and description
 * - Primary and secondary action buttons
 * - Three size variants for different contexts
 * - Accessible with semantic HTML
 *
 * @example
 * // Simple empty state
 * <EmptyState
 *   icon={Inbox}
 *   title="No messages"
 *   description="Your inbox is empty."
 * />
 *
 * @example
 * // With action buttons
 * <EmptyState
 *   icon={FolderPlus}
 *   title="No projects"
 *   description="Get started by creating your first project."
 *   action={{
 *     label: 'Create Project',
 *     onClick: () => openCreateDialog(),
 *   }}
 *   secondaryAction={{
 *     label: 'Learn More',
 *     onClick: () => openDocs(),
 *   }}
 * />
 *
 * @example
 * // Small inline variant
 * <EmptyState
 *   size="sm"
 *   title="No results"
 *   description="Try a different search term."
 * />
 */
export function EmptyState({
  icon: IconComponent,
  title,
  description,
  action,
  secondaryAction,
  className,
  size = 'md',
}: EmptyStateProps) {
  const styles = sizeStyles[size];

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        styles.container,
        className
      )}
      role="status"
      aria-label={title}
    >
      {IconComponent && (
        <div className={cn('rounded-full bg-[rgb(var(--muted))]', styles.iconWrapper)}>
          <Icon
            icon={IconComponent}
            className={cn('text-[rgb(var(--muted-foreground))]', styles.icon)}
          />
        </div>
      )}

      <h3 className={cn('text-[rgb(var(--foreground))]', styles.title)}>{title}</h3>

      {description && (
        <p className={cn('max-w-sm text-[rgb(var(--muted-foreground))]', styles.description)}>
          {description}
        </p>
      )}

      {(action || secondaryAction) && (
        <div className={cn('flex items-center', styles.actions)}>
          {action && (
            <Button
              variant={action.variant ?? 'primary'}
              size={size === 'sm' ? 'sm' : 'md'}
              onClick={action.onClick}
              loading={action.loading}
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant={secondaryAction.variant ?? 'secondary'}
              size={size === 'sm' ? 'sm' : 'md'}
              onClick={secondaryAction.onClick}
              loading={secondaryAction.loading}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

EmptyState.displayName = 'EmptyState';
