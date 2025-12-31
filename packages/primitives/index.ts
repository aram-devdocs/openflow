/**
 * @openflow/primitives - HTML element wrappers with accessibility defaults
 *
 * Level 0 package - no internal @openflow dependencies except utils
 *
 * This package provides semantic HTML element wrappers that:
 * 1. Enforce accessibility best practices
 * 2. Support responsive props
 * 3. Provide consistent styling patterns
 *
 * IMPORT RULES:
 * - Only @openflow/primitives may use raw HTML tags (<div>, <span>, etc.)
 * - Only @openflow/ui/atoms may import from @openflow/primitives
 * - All other packages must use atoms or higher-level components
 */

// ============================================================================
// Type Exports
// ============================================================================

export type {
  // Responsive types
  Breakpoint,
  ResponsiveValue,
  SpacingValue,
  // Spacing props
  SpacingProps,
  // Accessibility types
  AriaLive,
  AriaRole,
  A11yProps,
  // Base props
  BaseProps,
  PolymorphicProps,
  // Layout primitives (BoxProps exported from ./Box, FlexProps from ./Flex, GridProps from ./Grid, StackProps from ./Stack)
  BoxProps as BoxPropsBase,
  // FlexProps is exported from ./Flex component
  FlexDirection,
  FlexWrap,
  JustifyContent,
  AlignItems,
  // GridProps is exported from ./Grid component
  // StackProps is exported from ./Stack component
  StackDirection,
  // Typography primitives
  TextProps,
  TextSize,
  FontWeight,
  HeadingProps,
  HeadingLevel,
  ParagraphProps,
  // List primitives
  ListProps,
  ListItemProps,
  // Interactive primitives
  LinkProps,
  ImageProps,
  // Accessibility primitives
  VisuallyHiddenProps,
  // Landmark primitives
  SectionProps,
  ArticleProps,
  NavProps,
  MainProps,
  AsideProps,
  HeaderProps,
  FooterProps,
  // Utility types
  SpacingPropKeys,
  A11yPropKeys,
} from './types';

// ============================================================================
// Component Exports (to be added as primitives are implemented)
// ============================================================================

// Layout primitives
export { Box, type BoxProps } from './Box';
export { Flex, type FlexProps, type FlexElement } from './Flex';
export {
  Grid,
  type GridProps,
  type GridElement,
  type GridColumns,
  type GridRows,
  type GridFlow,
} from './Grid';
export { Stack, type StackProps, type StackElement } from './Stack';

// Typography primitives
// export { Text } from './Text';
// export { Heading } from './Heading';
// export { Paragraph } from './Paragraph';

// List primitives
// export { List } from './List';
// export { ListItem } from './ListItem';

// Interactive primitives
// export { Link } from './Link';
// export { Image } from './Image';

// Accessibility primitives
// export { VisuallyHidden } from './VisuallyHidden';

// Landmark primitives
// export { Section } from './Section';
// export { Article } from './Article';
// export { Nav } from './Nav';
// export { Main } from './Main';
// export { Aside } from './Aside';
// export { Header } from './Header';
// export { Footer } from './Footer';
