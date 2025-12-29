import { cn } from '@openflow/utils';
import type { HTMLAttributes, ReactNode } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Card content */
  children: ReactNode;
  /** Whether the card is in a selected state */
  isSelected?: boolean;
  /** Whether the card is clickable (adds hover effects) */
  isClickable?: boolean;
}

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  /** Header content */
  children: ReactNode;
}

export interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  /** Content */
  children: ReactNode;
}

export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  /** Footer content */
  children: ReactNode;
}

/**
 * Card component for content containers.
 * Stateless - receives all data via props, emits actions via callbacks.
 *
 * @example
 * <Card>
 *   <CardHeader>
 *     <h3>Card Title</h3>
 *   </CardHeader>
 *   <CardContent>
 *     <p>Card content goes here</p>
 *   </CardContent>
 *   <CardFooter>
 *     <Button>Action</Button>
 *   </CardFooter>
 * </Card>
 *
 * @example
 * <Card isClickable isSelected={isSelected} onClick={handleClick}>
 *   <CardContent>Selectable card</CardContent>
 * </Card>
 */
export function Card({
  children,
  isSelected = false,
  isClickable = false,
  className,
  onClick,
  ...props
}: CardProps) {
  // If onClick is provided, treat as clickable
  const clickable = isClickable || Boolean(onClick);

  return (
    <div
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.(e as unknown as React.MouseEvent<HTMLDivElement>);
              }
            }
          : undefined
      }
      className={cn(
        // Base styles
        'rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] text-[rgb(var(--card-foreground))]',
        'shadow-sm',
        // Clickable/interactive styles
        clickable && [
          'cursor-pointer',
          'transition-colors duration-150',
          'hover:bg-[rgb(var(--accent))]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--background))]',
        ],
        // Selected state
        isSelected && ['border-[rgb(var(--primary))]', 'ring-1 ring-[rgb(var(--primary))]'],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Card header section.
 * Typically contains title, subtitle, or action buttons.
 */
export function CardHeader({ children, className, ...props }: CardHeaderProps) {
  return (
    <div className={cn('flex flex-col space-y-1.5 p-4 pb-0', className)} {...props}>
      {children}
    </div>
  );
}

/**
 * Card content section.
 * Main content area of the card.
 */
export function CardContent({ children, className, ...props }: CardContentProps) {
  return (
    <div className={cn('p-4', className)} {...props}>
      {children}
    </div>
  );
}

/**
 * Card footer section.
 * Typically contains actions or metadata.
 */
export function CardFooter({ children, className, ...props }: CardFooterProps) {
  return (
    <div className={cn('flex items-center p-4 pt-0', className)} {...props}>
      {children}
    </div>
  );
}

Card.displayName = 'Card';
CardHeader.displayName = 'CardHeader';
CardContent.displayName = 'CardContent';
CardFooter.displayName = 'CardFooter';
