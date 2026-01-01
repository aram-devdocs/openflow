import { Box, type ResponsiveValue, Text, VisuallyHidden } from '@openflow/primitives';
import { cn } from '@openflow/utils';
import { type HTMLAttributes, type ReactNode, forwardRef } from 'react';

// ============================================================================
// Types
// ============================================================================

export type CardPadding = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '8';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Card content */
  children: ReactNode;
  /** Whether the card is in a selected state */
  isSelected?: boolean;
  /** Whether the card is clickable (adds hover effects) */
  isClickable?: boolean;
  /** Accessible label for selected state (default: "Selected") */
  selectedLabel?: string;
  /** Data attributes for testing */
  'data-testid'?: string;
}

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  /** Header content */
  children: ReactNode;
  /** Responsive padding - overrides default p-4 */
  p?: ResponsiveValue<CardPadding>;
  /** Data attributes for testing */
  'data-testid'?: string;
}

export interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  /** Content */
  children: ReactNode;
  /** Responsive padding - overrides default p-4 */
  p?: ResponsiveValue<CardPadding>;
  /** Data attributes for testing */
  'data-testid'?: string;
}

export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  /** Footer content */
  children: ReactNode;
  /** Responsive padding - overrides default p-4 */
  p?: ResponsiveValue<CardPadding>;
  /** Data attributes for testing */
  'data-testid'?: string;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Breakpoint order for responsive class generation
 */
const BREAKPOINT_ORDER = ['base', 'sm', 'md', 'lg', 'xl', '2xl'] as const;
type Breakpoint = (typeof BREAKPOINT_ORDER)[number];

/**
 * Default accessible label for selected state
 */
export const DEFAULT_SELECTED_LABEL = 'Selected';

/**
 * Base classes for Card component
 */
export const CARD_BASE_CLASSES =
  'rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] text-[rgb(var(--card-foreground))] shadow-sm';

/**
 * Classes for clickable/interactive cards
 */
export const CARD_CLICKABLE_CLASSES = [
  'cursor-pointer',
  'transition-colors duration-150',
  'hover:bg-[rgb(var(--accent))]',
  // Focus ring with offset for visibility on all backgrounds
  'focus-visible:outline-none',
  'focus-visible:ring-2',
  'focus-visible:ring-[rgb(var(--ring))]',
  'focus-visible:ring-offset-2',
  'focus-visible:ring-offset-[rgb(var(--background))]',
].join(' ');

/**
 * Classes for selected state
 */
export const CARD_SELECTED_CLASSES =
  'border-[rgb(var(--primary))] ring-1 ring-[rgb(var(--primary))]';

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate responsive padding classes from CardPadding value
 */
export function getResponsivePaddingClasses(
  padding: ResponsiveValue<CardPadding> | undefined,
  defaultPadding: string
): string {
  if (padding === undefined) {
    return defaultPadding;
  }

  if (typeof padding === 'string') {
    return `p-${padding}`;
  }

  if (typeof padding === 'object' && padding !== null) {
    const classes: string[] = [];
    for (const breakpoint of BREAKPOINT_ORDER) {
      const breakpointValue = (padding as Partial<Record<Breakpoint, CardPadding>>)[breakpoint];
      if (breakpointValue !== undefined) {
        if (breakpoint === 'base') {
          classes.push(`p-${breakpointValue}`);
        } else {
          classes.push(`${breakpoint}:p-${breakpointValue}`);
        }
      }
    }
    return classes.join(' ');
  }

  return defaultPadding;
}

// ============================================================================
// Card Component
// ============================================================================

/**
 * Card component for content containers.
 * Stateless - receives all data via props, emits actions via callbacks.
 *
 * Accessibility features:
 * - Interactive cards use role="button" with proper keyboard support (Enter/Space)
 * - Selected state announced via VisuallyHidden for screen readers
 * - Focus ring visible on all backgrounds with ring-offset
 * - aria-pressed indicates selection state on interactive cards
 * - data-state attribute for CSS-based state styling
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
 * // Interactive card with selection
 * <Card isClickable isSelected={isSelected} onClick={handleClick}>
 *   <CardContent>Selectable card</CardContent>
 * </Card>
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  {
    children,
    isSelected = false,
    isClickable = false,
    selectedLabel = DEFAULT_SELECTED_LABEL,
    className,
    onClick,
    'data-testid': dataTestId,
    ...props
  },
  ref
) {
  // If onClick is provided, treat as clickable
  const clickable = isClickable || Boolean(onClick);

  return (
    <Box
      ref={ref}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      aria-pressed={clickable ? isSelected : undefined}
      data-state={isSelected ? 'selected' : undefined}
      data-testid={dataTestId}
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
        CARD_BASE_CLASSES,
        // Clickable/interactive styles
        clickable && CARD_CLICKABLE_CLASSES,
        // Selected state
        isSelected && CARD_SELECTED_CLASSES,
        className
      )}
      {...props}
    >
      {/* Screen reader announcement for selected state */}
      {isSelected && (
        <VisuallyHidden>
          <Text as="span" role="status" aria-live="polite">
            {selectedLabel}
          </Text>
        </VisuallyHidden>
      )}
      {children}
    </Box>
  );
});

// ============================================================================
// CardHeader Component
// ============================================================================

/**
 * Card header section.
 * Typically contains title, subtitle, or action buttons.
 *
 * @example
 * <CardHeader>
 *   <h3 className="text-lg font-semibold">Title</h3>
 *   <p className="text-sm text-muted-foreground">Subtitle</p>
 * </CardHeader>
 *
 * @example
 * // Responsive padding
 * <CardHeader p={{ base: '2', md: '4', lg: '6' }}>
 *   <h3>Responsive Title</h3>
 * </CardHeader>
 */
export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(function CardHeader(
  { children, className, p, 'data-testid': dataTestId, ...props },
  ref
) {
  const paddingClasses = getResponsivePaddingClasses(p, 'p-4');

  return (
    <Box
      ref={ref}
      data-testid={dataTestId}
      className={cn('flex flex-col space-y-1.5 pb-0', paddingClasses, className)}
      {...props}
    >
      {children}
    </Box>
  );
});

// ============================================================================
// CardContent Component
// ============================================================================

/**
 * Card content section.
 * Main content area of the card.
 *
 * @example
 * <CardContent>
 *   <p>Main content here</p>
 * </CardContent>
 *
 * @example
 * // Responsive padding
 * <CardContent p={{ base: '2', md: '4', lg: '6' }}>
 *   <p>Responsive content</p>
 * </CardContent>
 */
export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(function CardContent(
  { children, className, p, 'data-testid': dataTestId, ...props },
  ref
) {
  const paddingClasses = getResponsivePaddingClasses(p, 'p-4');

  return (
    <Box ref={ref} data-testid={dataTestId} className={cn(paddingClasses, className)} {...props}>
      {children}
    </Box>
  );
});

// ============================================================================
// CardFooter Component
// ============================================================================

/**
 * Card footer section.
 * Typically contains actions or metadata.
 *
 * @example
 * <CardFooter>
 *   <Button>Action</Button>
 * </CardFooter>
 *
 * @example
 * // Multiple actions with custom spacing
 * <CardFooter className="justify-end gap-2" p={{ base: '2', md: '4' }}>
 *   <Button variant="ghost">Cancel</Button>
 *   <Button variant="primary">Confirm</Button>
 * </CardFooter>
 */
export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(function CardFooter(
  { children, className, p, 'data-testid': dataTestId, ...props },
  ref
) {
  const paddingClasses = getResponsivePaddingClasses(p, 'p-4');

  return (
    <Box
      ref={ref}
      data-testid={dataTestId}
      className={cn('flex items-center pt-0', paddingClasses, className)}
      {...props}
    >
      {children}
    </Box>
  );
});

// ============================================================================
// Display Names
// ============================================================================

Card.displayName = 'Card';
CardHeader.displayName = 'CardHeader';
CardContent.displayName = 'CardContent';
CardFooter.displayName = 'CardFooter';
