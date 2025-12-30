import { cn } from '@openflow/utils';
import type { HTMLAttributes } from 'react';

export type SkeletonVariant = 'text' | 'circular' | 'rectangular';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /** Shape variant of the skeleton */
  variant?: SkeletonVariant;
  /** Width of the skeleton (number for px, string for any CSS unit) */
  width?: string | number;
  /** Height of the skeleton (number for px, string for any CSS unit) */
  height?: string | number;
}

/**
 * Skeleton component for loading placeholders.
 * Provides visual loading indication while content is being fetched.
 *
 * Features:
 * - Three variants: text, circular, rectangular
 * - Custom width and height support
 * - Respects prefers-reduced-motion
 * - Properly hidden from screen readers
 *
 * @example
 * // Text skeleton
 * <Skeleton variant="text" className="w-3/4" />
 *
 * @example
 * // Circular avatar skeleton
 * <Skeleton variant="circular" width={40} height={40} />
 *
 * @example
 * // Rectangular card skeleton
 * <Skeleton variant="rectangular" width="100%" height={200} />
 */
export function Skeleton({
  variant = 'rectangular',
  width,
  height,
  className,
  style,
  ...props
}: SkeletonProps) {
  const computedStyle: React.CSSProperties = {
    ...style,
    ...(width !== undefined && {
      width: typeof width === 'number' ? `${width}px` : width,
    }),
    ...(height !== undefined && {
      height: typeof height === 'number' ? `${height}px` : height,
    }),
  };

  return (
    <div
      className={cn(
        // Base styles with motion-safe animation
        'bg-[rgb(var(--muted))] motion-safe:animate-pulse',
        // Variant-specific styles
        variant === 'circular' && 'rounded-full',
        variant === 'rectangular' && 'rounded-md',
        variant === 'text' && 'h-4 rounded',
        className
      )}
      style={computedStyle}
      aria-hidden="true"
      {...props}
    />
  );
}

Skeleton.displayName = 'Skeleton';
