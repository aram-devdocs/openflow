/**
 * Image Primitive - Accessible image wrapper with lazy loading and responsive sizing
 *
 * The foundational image primitive that wraps `<img>` elements with:
 * - REQUIRED alt prop for accessibility (TypeScript enforces this)
 * - Lazy loading by default for performance
 * - Responsive width and height support
 * - Object-fit and object-position for flexible layouts
 * - ARIA attribute forwarding
 * - className merging with Tailwind conflict resolution
 *
 * @example
 * // Basic image with required alt text
 * <Image src="/photo.jpg" alt="A sunset over the ocean" />
 *
 * // Lazy loaded image (default)
 * <Image src="/hero.jpg" alt="Hero banner" loading="lazy" />
 *
 * // Fixed size image
 * <Image src="/avatar.jpg" alt="User profile" width={48} height={48} rounded />
 *
 * // Cover image for cards
 * <Image src="/card.jpg" alt="Card cover" objectFit="cover" aspectRatio="16/9" />
 */

import { cn } from '@openflow/utils';
import { type ImgHTMLAttributes, forwardRef } from 'react';
import type { A11yProps, ResponsiveValue } from './types';

/**
 * Object fit values
 */
export type ObjectFit = 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';

/**
 * Object position values
 */
export type ObjectPosition =
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'center'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

/**
 * Border radius values
 */
export type BorderRadius = 'none' | 'sm' | 'base' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';

/**
 * Aspect ratio values
 */
export type AspectRatio = 'auto' | 'square' | 'video' | '4/3' | '3/2' | '16/9' | '21/9';

/**
 * Image component props
 *
 * Note: `alt` is REQUIRED. TypeScript will error if alt is not provided.
 * For decorative images, use alt="" explicitly with aria-hidden="true".
 */
export interface ImageProps
  extends A11yProps,
    Omit<ImgHTMLAttributes<HTMLImageElement>, keyof A11yProps | 'loading' | 'decoding'> {
  /** Image source URL (required) */
  src: string;
  /**
   * Alternative text description (REQUIRED for accessibility)
   *
   * - For informative images: Describe the content and purpose
   * - For decorative images: Use alt="" with aria-hidden="true"
   * - For functional images (like icons in buttons): Describe the action
   *
   * @example
   * // Informative
   * alt="A golden retriever playing fetch in a park"
   *
   * // Decorative (empty alt with aria-hidden)
   * alt="" aria-hidden="true"
   *
   * // Functional (in a link/button)
   * alt="Download report"
   */
  alt: string;
  /** Element ID */
  id?: string;
  /** Data attributes for testing */
  'data-testid'?: string;
  /** Image width (number for pixels, string for other units or percentages) */
  width?: number | string;
  /** Image height (number for pixels, string for other units or percentages) */
  height?: number | string;
  /**
   * Loading strategy
   * - 'lazy' (default): Load when approaching viewport (performance optimization)
   * - 'eager': Load immediately (use for above-the-fold images)
   */
  loading?: 'lazy' | 'eager';
  /**
   * Decoding strategy
   * - 'async' (default): Decode asynchronously to prevent blocking
   * - 'sync': Decode synchronously
   * - 'auto': Browser decides
   */
  decoding?: 'async' | 'sync' | 'auto';
  /**
   * How the image should fit its container
   * - 'contain': Scale to fit within container, maintaining aspect ratio
   * - 'cover': Scale to cover container, maintaining aspect ratio (may crop)
   * - 'fill': Stretch to fill container (may distort)
   * - 'none': No scaling, use intrinsic size
   * - 'scale-down': Use smaller of 'none' or 'contain'
   */
  objectFit?: ResponsiveValue<ObjectFit>;
  /**
   * Position of the image within its container when using objectFit
   */
  objectPosition?: ResponsiveValue<ObjectPosition>;
  /**
   * Border radius
   */
  rounded?: ResponsiveValue<BorderRadius>;
  /**
   * Aspect ratio for the image container
   */
  aspectRatio?: AspectRatio;
  /**
   * Fallback content or placeholder while loading
   * Note: This affects the wrapper behavior, not the img element directly
   */
  placeholder?: 'blur' | 'empty';
  /**
   * Blur data URL for placeholder (used with placeholder="blur")
   */
  blurDataURL?: string;
  /**
   * Priority loading (equivalent to loading="eager" + fetchpriority="high")
   * Use for LCP (Largest Contentful Paint) images
   */
  priority?: boolean;
  /**
   * Add drop shadow effect
   */
  shadow?: ResponsiveValue<'none' | 'sm' | 'base' | 'md' | 'lg' | 'xl' | '2xl'>;
  /**
   * Border styling
   */
  border?: boolean;
}

/**
 * Breakpoint order for responsive classes
 */
const BREAKPOINT_ORDER = ['base', 'sm', 'md', 'lg', 'xl', '2xl'] as const;
type Breakpoint = (typeof BREAKPOINT_ORDER)[number];

/**
 * Object fit to Tailwind class mapping
 */
const OBJECT_FIT_MAP: Record<ObjectFit, string> = {
  contain: 'object-contain',
  cover: 'object-cover',
  fill: 'object-fill',
  none: 'object-none',
  'scale-down': 'object-scale-down',
};

/**
 * Object position to Tailwind class mapping
 */
const OBJECT_POSITION_MAP: Record<ObjectPosition, string> = {
  top: 'object-top',
  bottom: 'object-bottom',
  left: 'object-left',
  right: 'object-right',
  center: 'object-center',
  'top-left': 'object-left-top',
  'top-right': 'object-right-top',
  'bottom-left': 'object-left-bottom',
  'bottom-right': 'object-right-bottom',
};

/**
 * Border radius to Tailwind class mapping
 */
const BORDER_RADIUS_MAP: Record<BorderRadius, string> = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  base: 'rounded',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  '3xl': 'rounded-3xl',
  full: 'rounded-full',
};

/**
 * Aspect ratio to Tailwind class mapping
 */
const ASPECT_RATIO_MAP: Record<AspectRatio, string> = {
  auto: 'aspect-auto',
  square: 'aspect-square',
  video: 'aspect-video',
  '4/3': 'aspect-[4/3]',
  '3/2': 'aspect-[3/2]',
  '16/9': 'aspect-[16/9]',
  '21/9': 'aspect-[21/9]',
};

/**
 * Shadow to Tailwind class mapping
 */
const SHADOW_MAP: Record<string, string> = {
  none: 'shadow-none',
  sm: 'shadow-sm',
  base: 'shadow',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
  '2xl': 'shadow-2xl',
};

/**
 * Generate responsive classes from a responsive value
 */
export function getResponsiveClasses<T extends string>(
  value: ResponsiveValue<T>,
  map: Record<T, string>
): string[] {
  const classes: string[] = [];

  if (typeof value === 'string') {
    const mappedClass = map[value as T];
    if (mappedClass) {
      classes.push(mappedClass);
    }
  } else if (typeof value === 'object' && value !== null) {
    for (const breakpoint of BREAKPOINT_ORDER) {
      const breakpointValue = (value as Partial<Record<Breakpoint, T>>)[breakpoint];
      if (breakpointValue !== undefined) {
        const mappedClass = map[breakpointValue];
        if (mappedClass) {
          if (breakpoint === 'base') {
            classes.push(mappedClass);
          } else {
            classes.push(`${breakpoint}:${mappedClass}`);
          }
        }
      }
    }
  }

  return classes;
}

/**
 * Image - Accessible image element primitive
 *
 * A semantic image wrapper that enforces accessibility best practices.
 * The alt prop is REQUIRED - TypeScript will error if not provided.
 *
 * @example
 * // Basic usage - alt is required
 * <Image src="/photo.jpg" alt="A beautiful sunset" />
 *
 * // Optimized hero image (priority loading)
 * <Image
 *   src="/hero.jpg"
 *   alt="Hero banner showing our product"
 *   priority
 *   aspectRatio="16/9"
 *   objectFit="cover"
 * />
 *
 * // Avatar image
 * <Image
 *   src="/avatar.jpg"
 *   alt="John Doe's profile picture"
 *   width={48}
 *   height={48}
 *   rounded="full"
 * />
 *
 * // Decorative image (explicitly empty alt + hidden from AT)
 * <Image
 *   src="/decoration.jpg"
 *   alt=""
 *   aria-hidden="true"
 *   role="presentation"
 * />
 *
 * // Card cover image
 * <Image
 *   src="/card-cover.jpg"
 *   alt="Product preview"
 *   objectFit="cover"
 *   aspectRatio="4/3"
 *   rounded="lg"
 * />
 */
export const Image = forwardRef<HTMLImageElement, ImageProps>(function Image(
  {
    src,
    alt,
    className,
    style,
    id,
    'data-testid': dataTestId,
    // Dimensions
    width,
    height,
    // Loading behavior
    loading = 'lazy',
    decoding = 'async',
    priority = false,
    // Styling
    objectFit,
    objectPosition,
    rounded,
    aspectRatio,
    shadow,
    border = false,
    // Placeholder (informational props, passed through)
    placeholder,
    blurDataURL,
    // Native img attributes we spread
    srcSet,
    sizes,
    crossOrigin,
    referrerPolicy,
    onLoad,
    onError,
    // Rest props include A11y attributes
    ...restProps
  },
  ref
) {
  // Build classes array
  const imageClasses: string[] = [];

  // Base image styling
  imageClasses.push('max-w-full'); // Responsive by default

  // Object fit classes
  if (objectFit !== undefined) {
    imageClasses.push(...getResponsiveClasses(objectFit, OBJECT_FIT_MAP));
  }

  // Object position classes
  if (objectPosition !== undefined) {
    imageClasses.push(...getResponsiveClasses(objectPosition, OBJECT_POSITION_MAP));
  }

  // Border radius classes
  if (rounded !== undefined) {
    imageClasses.push(...getResponsiveClasses(rounded, BORDER_RADIUS_MAP));
  }

  // Aspect ratio class
  if (aspectRatio !== undefined) {
    imageClasses.push(ASPECT_RATIO_MAP[aspectRatio]);
  }

  // Shadow classes
  if (shadow !== undefined) {
    imageClasses.push(...getResponsiveClasses(shadow, SHADOW_MAP));
  }

  // Border styling
  if (border) {
    imageClasses.push('border', 'border-[rgb(var(--border))]');
  }

  // Handle priority loading
  const effectiveLoading = priority ? 'eager' : loading;
  const fetchPriority = priority ? 'high' : undefined;

  // Build inline styles for dimensions
  const inlineStyles: React.CSSProperties = { ...style };

  // Handle width
  if (width !== undefined) {
    inlineStyles.width = typeof width === 'number' ? `${width}px` : width;
  }

  // Handle height
  if (height !== undefined) {
    inlineStyles.height = typeof height === 'number' ? `${height}px` : height;
  }

  // Handle blur placeholder background
  if (placeholder === 'blur' && blurDataURL) {
    inlineStyles.backgroundImage = `url(${blurDataURL})`;
    inlineStyles.backgroundSize = 'cover';
    inlineStyles.backgroundPosition = 'center';
  }

  // biome-ignore lint/a11y/useAltText: alt is required by TypeScript and passed directly to img element
  return (
    <img
      ref={ref}
      id={id}
      data-testid={dataTestId}
      src={src}
      alt={alt}
      className={cn(...imageClasses, className)}
      style={Object.keys(inlineStyles).length > 0 ? inlineStyles : undefined}
      loading={effectiveLoading}
      decoding={decoding}
      fetchPriority={fetchPriority}
      width={typeof width === 'number' ? width : undefined}
      height={typeof height === 'number' ? height : undefined}
      srcSet={srcSet}
      sizes={sizes}
      crossOrigin={crossOrigin}
      referrerPolicy={referrerPolicy}
      onLoad={onLoad}
      onError={onError}
      {...restProps}
    />
  );
});

Image.displayName = 'Image';
