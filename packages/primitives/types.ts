/**
 * @openflow/primitives - Shared type definitions
 *
 * Level 0 package - provides base types for responsive and accessible primitives
 */

import type { CSSProperties, ReactNode } from 'react';

/**
 * Tailwind CSS breakpoints
 */
export type Breakpoint = 'base' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

/**
 * Responsive value that can vary by breakpoint
 * @example
 * // Simple value
 * const padding: ResponsiveValue<string> = '4';
 *
 * // Responsive value
 * const padding: ResponsiveValue<string> = { base: '2', md: '4', lg: '6' };
 */
export type ResponsiveValue<T> = T | Partial<Record<Breakpoint, T>>;

/**
 * Spacing scale values (Tailwind spacing scale)
 */
export type SpacingValue =
  | '0'
  | '0.5'
  | '1'
  | '1.5'
  | '2'
  | '2.5'
  | '3'
  | '3.5'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '10'
  | '11'
  | '12'
  | '14'
  | '16'
  | '20'
  | '24'
  | '28'
  | '32'
  | '36'
  | '40'
  | '44'
  | '48'
  | '52'
  | '56'
  | '60'
  | '64'
  | '72'
  | '80'
  | '96'
  | 'px'
  | 'auto';

/**
 * Spacing props for padding and margin
 */
export interface SpacingProps {
  /** Padding on all sides */
  p?: ResponsiveValue<SpacingValue>;
  /** Padding horizontal (left and right) */
  px?: ResponsiveValue<SpacingValue>;
  /** Padding vertical (top and bottom) */
  py?: ResponsiveValue<SpacingValue>;
  /** Padding top */
  pt?: ResponsiveValue<SpacingValue>;
  /** Padding right */
  pr?: ResponsiveValue<SpacingValue>;
  /** Padding bottom */
  pb?: ResponsiveValue<SpacingValue>;
  /** Padding left */
  pl?: ResponsiveValue<SpacingValue>;
  /** Margin on all sides */
  m?: ResponsiveValue<SpacingValue>;
  /** Margin horizontal (left and right) */
  mx?: ResponsiveValue<SpacingValue>;
  /** Margin vertical (top and bottom) */
  my?: ResponsiveValue<SpacingValue>;
  /** Margin top */
  mt?: ResponsiveValue<SpacingValue>;
  /** Margin right */
  mr?: ResponsiveValue<SpacingValue>;
  /** Margin bottom */
  mb?: ResponsiveValue<SpacingValue>;
  /** Margin left */
  ml?: ResponsiveValue<SpacingValue>;
  /** Gap between children */
  gap?: ResponsiveValue<SpacingValue>;
}

/**
 * ARIA live region politeness level
 */
export type AriaLive = 'off' | 'polite' | 'assertive';

/**
 * Common ARIA role values
 */
export type AriaRole =
  | 'alert'
  | 'alertdialog'
  | 'application'
  | 'article'
  | 'banner'
  | 'button'
  | 'cell'
  | 'checkbox'
  | 'columnheader'
  | 'combobox'
  | 'complementary'
  | 'contentinfo'
  | 'definition'
  | 'dialog'
  | 'directory'
  | 'document'
  | 'feed'
  | 'figure'
  | 'form'
  | 'grid'
  | 'gridcell'
  | 'group'
  | 'heading'
  | 'img'
  | 'link'
  | 'list'
  | 'listbox'
  | 'listitem'
  | 'log'
  | 'main'
  | 'marquee'
  | 'math'
  | 'menu'
  | 'menubar'
  | 'menuitem'
  | 'menuitemcheckbox'
  | 'menuitemradio'
  | 'navigation'
  | 'none'
  | 'note'
  | 'option'
  | 'presentation'
  | 'progressbar'
  | 'radio'
  | 'radiogroup'
  | 'region'
  | 'row'
  | 'rowgroup'
  | 'rowheader'
  | 'scrollbar'
  | 'search'
  | 'searchbox'
  | 'separator'
  | 'slider'
  | 'spinbutton'
  | 'status'
  | 'switch'
  | 'tab'
  | 'table'
  | 'tablist'
  | 'tabpanel'
  | 'term'
  | 'textbox'
  | 'timer'
  | 'toolbar'
  | 'tooltip'
  | 'tree'
  | 'treegrid'
  | 'treeitem';

/**
 * Accessibility props for ARIA attributes
 */
export interface A11yProps {
  /** Accessible label (use when visible label is not available) */
  'aria-label'?: string;
  /** ID of element that labels this element */
  'aria-labelledby'?: string;
  /** ID of element that describes this element */
  'aria-describedby'?: string;
  /** Whether element is hidden from assistive technology */
  'aria-hidden'?: boolean;
  /** Live region politeness level */
  'aria-live'?: AriaLive;
  /** Whether element is busy/loading */
  'aria-busy'?: boolean;
  /** Whether element is expanded (for disclosure widgets) */
  'aria-expanded'?: boolean;
  /** Whether element is pressed (for toggle buttons) */
  'aria-pressed'?: boolean | 'mixed';
  /** Whether element is selected */
  'aria-selected'?: boolean;
  /** Whether element is checked */
  'aria-checked'?: boolean | 'mixed';
  /** Whether element is disabled */
  'aria-disabled'?: boolean;
  /** Whether element is required */
  'aria-required'?: boolean;
  /** Whether element has invalid input */
  'aria-invalid'?: boolean | 'grammar' | 'spelling';
  /** ARIA role */
  role?: AriaRole | (string & {});
  /** ID of the element that controls this element */
  'aria-controls'?: string;
  /** ID of the element that owns this element */
  'aria-owns'?: string;
  /** Whether element has a popup */
  'aria-haspopup'?: boolean | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog';
  /** ID of the active descendant */
  'aria-activedescendant'?: string;
  /** Current item in a set (e.g., current page in navigation) */
  'aria-current'?: boolean | 'page' | 'step' | 'location' | 'date' | 'time' | 'true' | 'false';
  /** Number of items in the current set */
  'aria-setsize'?: number;
  /** Position in the current set */
  'aria-posinset'?: number;
  /** Level in a hierarchical structure */
  'aria-level'?: number;
  /** Value text for range widgets */
  'aria-valuetext'?: string;
  /** Current value for range widgets */
  'aria-valuenow'?: number;
  /** Minimum value for range widgets */
  'aria-valuemin'?: number;
  /** Maximum value for range widgets */
  'aria-valuemax'?: number;
}

/**
 * Base props shared by all primitives
 */
export interface BaseProps extends A11yProps {
  /** Additional CSS class names */
  className?: string;
  /** Inline styles (use sparingly, prefer className) */
  style?: CSSProperties;
  /** Children content */
  children?: ReactNode;
  /** Element ID */
  id?: string;
  /** Data attributes */
  'data-testid'?: string;
}

/**
 * Polymorphic component props - allows changing the underlying HTML element
 * @example
 * // Render as a div (default)
 * <Box>content</Box>
 *
 * // Render as a section
 * <Box as="section">content</Box>
 */
export type PolymorphicProps<Element extends keyof JSX.IntrinsicElements = 'div'> = {
  /** HTML element to render as */
  as?: Element;
} & Omit<JSX.IntrinsicElements[Element], 'ref'>;

/**
 * Box primitive props - generic container with spacing and a11y support
 */
export interface BoxProps extends BaseProps, SpacingProps {
  /** HTML element to render as */
  as?: keyof JSX.IntrinsicElements;
}

/**
 * Flex direction values
 */
export type FlexDirection = 'row' | 'row-reverse' | 'column' | 'column-reverse';

/**
 * Flex wrap values
 */
export type FlexWrap = 'nowrap' | 'wrap' | 'wrap-reverse';

/**
 * Justify content values
 */
export type JustifyContent = 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly';

/**
 * Align items values
 */
export type AlignItems = 'start' | 'end' | 'center' | 'baseline' | 'stretch';

/**
 * Flex primitive props
 */
export interface FlexProps extends BoxProps {
  /** Flex direction */
  direction?: ResponsiveValue<FlexDirection>;
  /** Flex wrap */
  wrap?: ResponsiveValue<FlexWrap>;
  /** Justify content */
  justify?: ResponsiveValue<JustifyContent>;
  /** Align items */
  align?: ResponsiveValue<AlignItems>;
  /** Gap between items */
  gap?: ResponsiveValue<SpacingValue>;
  /** Inline flex (display: inline-flex) */
  inline?: boolean;
}

/**
 * Grid primitive props
 */
export interface GridProps extends BoxProps {
  /** Number of columns (1-12) or 'none' */
  columns?: ResponsiveValue<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 'none'>;
  /** Number of rows (1-6) or 'none' */
  rows?: ResponsiveValue<1 | 2 | 3 | 4 | 5 | 6 | 'none'>;
  /** Gap between grid items */
  gap?: ResponsiveValue<SpacingValue>;
  /** Column gap */
  gapX?: ResponsiveValue<SpacingValue>;
  /** Row gap */
  gapY?: ResponsiveValue<SpacingValue>;
  /** Grid flow direction */
  flow?: ResponsiveValue<'row' | 'col' | 'dense' | 'row-dense' | 'col-dense'>;
  /** Inline grid (display: inline-grid) */
  inline?: boolean;
}

/**
 * Stack direction
 */
export type StackDirection = 'horizontal' | 'vertical';

/**
 * Stack primitive props
 */
export interface StackProps extends BoxProps {
  /** Stack direction */
  direction?: ResponsiveValue<StackDirection>;
  /** Gap between items */
  gap?: ResponsiveValue<SpacingValue>;
  /** Align items along cross axis */
  align?: ResponsiveValue<AlignItems>;
  /** Whether to include dividers between items */
  dividers?: boolean;
}

/**
 * Text size values
 */
export type TextSize =
  | 'xs'
  | 'sm'
  | 'base'
  | 'lg'
  | 'xl'
  | '2xl'
  | '3xl'
  | '4xl'
  | '5xl'
  | '6xl'
  | '7xl'
  | '8xl'
  | '9xl';

/**
 * Font weight values
 */
export type FontWeight =
  | 'thin'
  | 'extralight'
  | 'light'
  | 'normal'
  | 'medium'
  | 'semibold'
  | 'bold'
  | 'extrabold'
  | 'black';

/**
 * Text primitive props
 */
export interface TextProps extends BaseProps {
  /** HTML element to render as */
  as?: 'span' | 'p' | 'strong' | 'em' | 'small' | 'del' | 'ins' | 'mark' | 'code';
  /** Text size */
  size?: ResponsiveValue<TextSize>;
  /** Font weight */
  weight?: ResponsiveValue<FontWeight>;
  /** Text color (Tailwind color class without 'text-' prefix) */
  color?: string;
  /** Truncate text with ellipsis */
  truncate?: boolean;
  /** Line clamp (max number of lines) */
  lineClamp?: 1 | 2 | 3 | 4 | 5 | 6;
}

/**
 * Heading level (1-6)
 */
export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Heading primitive props
 */
export interface HeadingProps extends BaseProps {
  /** Heading level (1-6), determines the HTML tag (h1-h6) */
  level: HeadingLevel;
  /** Text size (defaults based on level) */
  size?: ResponsiveValue<TextSize>;
  /** Font weight */
  weight?: ResponsiveValue<FontWeight>;
  /** Text color */
  color?: string;
}

/**
 * Paragraph primitive props
 */
export interface ParagraphProps extends BaseProps {
  /** Text size */
  size?: ResponsiveValue<TextSize>;
  /** Line height */
  leading?: ResponsiveValue<'none' | 'tight' | 'snug' | 'normal' | 'relaxed' | 'loose'>;
  /** Text color */
  color?: string;
}

/**
 * List primitive props
 */
export interface ListProps extends BaseProps {
  /** Whether list is ordered */
  ordered?: boolean;
  /** List style type */
  styleType?: 'none' | 'disc' | 'decimal' | 'circle' | 'square' | 'alpha' | 'roman';
  /** Gap between items */
  gap?: ResponsiveValue<SpacingValue>;
}

/**
 * ListItem primitive props (base interface)
 * The full ListItemProps is exported from ./ListItem.tsx with spacing props
 */
export interface ListItemPropsBase extends BaseProps {
  /** Value attribute for ordered lists (overrides default number) */
  value?: number;
  /** Whether the item is disabled (visual only, use with role="option") */
  disabled?: boolean;
}

/**
 * Link primitive props
 */
export interface LinkProps extends BaseProps {
  /** Link URL */
  href: string;
  /** Whether link opens in new tab */
  external?: boolean;
  /** Whether to show underline */
  underline?: boolean | 'hover';
}

/**
 * Image primitive props - alt is REQUIRED for accessibility
 */
export interface ImageProps extends BaseProps {
  /** Image source URL */
  src: string;
  /** Alternative text (REQUIRED for accessibility) */
  alt: string;
  /** Image width */
  width?: number | string;
  /** Image height */
  height?: number | string;
  /** Loading strategy */
  loading?: 'lazy' | 'eager';
  /** Decoding strategy */
  decoding?: 'async' | 'sync' | 'auto';
  /** Object fit */
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  /** Object position */
  objectPosition?: string;
}

/**
 * VisuallyHidden primitive props - content visible only to screen readers
 */
export interface VisuallyHiddenProps {
  /** Hidden content */
  children: ReactNode;
  /** Whether to make focusable elements visible when focused */
  focusable?: boolean;
}

/**
 * Section primitive props - requires aria-label for accessibility
 */
export interface SectionProps extends BaseProps {
  /** Accessible label for the section (REQUIRED) */
  'aria-label': string;
}

/**
 * Article primitive props
 */
export interface ArticleProps extends BaseProps {}

/**
 * Nav primitive props
 */
export interface NavProps extends BaseProps {
  /** Accessible label for the navigation */
  'aria-label'?: string;
}

/**
 * Main primitive props
 */
export interface MainProps extends BaseProps {
  /** ID for skip link targeting (defaults to 'main-content') */
  id?: string;
}

/**
 * Aside primitive props
 */
export interface AsideProps extends BaseProps {
  /** Accessible label for the aside */
  'aria-label'?: string;
}

/**
 * Header primitive props
 */
export interface HeaderProps extends BaseProps {}

/**
 * Footer primitive props
 */
export interface FooterProps extends BaseProps {}

/**
 * Utility type to extract spacing classes from props
 */
export type SpacingPropKeys = keyof SpacingProps;

/**
 * Utility type to extract A11y prop keys
 */
export type A11yPropKeys = keyof A11yProps;
