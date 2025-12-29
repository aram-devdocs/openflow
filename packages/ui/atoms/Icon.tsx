import type { LucideIcon, LucideProps } from 'lucide-react';
import { cn } from '@openflow/utils';

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface IconProps extends Omit<LucideProps, 'size'> {
  /** The Lucide icon component to render */
  icon: LucideIcon;
  /** Size of the icon */
  size?: IconSize;
  /** Additional CSS classes */
  className?: string;
}

const sizeClasses: Record<IconSize, string> = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
  xl: 'h-8 w-8',
};

/**
 * Icon component - wrapper around Lucide React icons with standardized sizing.
 * Stateless - receives all data via props.
 *
 * @example
 * import { Search, Plus, Settings } from 'lucide-react';
 *
 * <Icon icon={Search} size="md" />
 * <Icon icon={Plus} size="lg" className="text-green-500" />
 * <Icon icon={Settings} size="sm" />
 */
export function Icon({
  icon: LucideIconComponent,
  size = 'md',
  className,
  ...props
}: IconProps) {
  return (
    <LucideIconComponent
      className={cn(sizeClasses[size], className)}
      aria-hidden="true"
      {...props}
    />
  );
}
