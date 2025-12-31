/**
 * Atoms - Basic UI building blocks
 *
 * These are the smallest, most fundamental UI components.
 * Examples: Button, Input, Label, Badge, Icon, Spinner
 */

export { Button } from './Button';
export type { ButtonProps, ButtonVariant, ButtonSize } from './Button';

export {
  Spinner,
  getResponsiveSizeClasses as getSpinnerSizeClasses,
  SPINNER_BASE_CLASSES,
  DEFAULT_SPINNER_LABEL,
} from './Spinner';
export type { SpinnerProps, SpinnerSize } from './Spinner';

export {
  Input,
  getSizeClasses as getInputSizeClasses,
  getBaseSize as getInputBaseSize,
} from './Input';
export type { InputProps, InputSize, InputVariant } from './Input';

export {
  Textarea,
  getSizeClasses as getTextareaSizeClasses,
  getBaseSize as getTextareaBaseSize,
  TEXTAREA_BASE_CLASSES,
} from './Textarea';
export type { TextareaProps, TextareaSize, TextareaResize } from './Textarea';

export { Badge, taskStatusToVariant, taskStatusToLabel } from './Badge';
export type { BadgeProps, BadgeVariant, BadgeSize } from './Badge';

export { Icon, getResponsiveSizeClasses } from './Icon';
export type { IconProps, IconSize } from './Icon';

export { Label, getBaseSize as getLabelBaseSize, convertToTextSize } from './Label';
export type { LabelProps, LabelSize } from './Label';

export { Checkbox } from './Checkbox';
export type { CheckboxProps } from './Checkbox';

export {
  Toast,
  getSizeClasses as getToastSizeClasses,
  getBaseSize as getToastBaseSize,
  getAriaRole as getToastAriaRole,
  getAriaLive as getToastAriaLive,
  VARIANT_CLASSES as TOAST_VARIANT_CLASSES,
  VARIANT_ICONS as TOAST_VARIANT_ICONS,
  VARIANT_ICON_COLORS as TOAST_VARIANT_ICON_COLORS,
  SIZE_CLASSES as TOAST_SIZE_CLASSES,
  TOAST_BASE_CLASSES,
  DEFAULT_DISMISS_LABEL,
} from './Toast';
export type { ToastProps, ToastVariant, ToastAction, ToastSize } from './Toast';

export {
  ToastProvider,
  useToast,
  getPositionClasses as getToastPositionClasses,
  resetToastIdCounter,
  POSITION_CLASSES as TOAST_POSITION_CLASSES,
  TOAST_CONTAINER_BASE_CLASSES,
  DEFAULT_DURATION as DEFAULT_TOAST_DURATION,
  DEFAULT_ERROR_DURATION as DEFAULT_TOAST_ERROR_DURATION,
  DEFAULT_MAX_TOASTS,
  DEFAULT_POSITION as DEFAULT_TOAST_POSITION,
  DEFAULT_REGION_LABEL as DEFAULT_TOAST_REGION_LABEL,
} from './ToastProvider';
export type { ToastProviderProps, ToastOptions, ToastData, ToastPosition } from './ToastProvider';

export {
  ThemeToggle,
  getSizeClasses as getThemeToggleSizeClasses,
  THEME_TOGGLE_BASE_CLASSES,
} from './ThemeToggle';
export type { ThemeToggleProps, Theme, ThemeToggleSize } from './ThemeToggle';

export {
  ThemeToggleCompact,
  getSizeClasses as getThemeToggleCompactSizeClasses,
  THEME_TOGGLE_COMPACT_BASE_CLASSES,
  DEFAULT_LIGHT_LABEL,
  DEFAULT_DARK_LABEL,
} from './ThemeToggleCompact';
export type {
  ThemeToggleCompactProps,
  ResolvedTheme,
  ThemeToggleCompactSize,
} from './ThemeToggleCompact';

export { Skeleton, getVariantClasses, SKELETON_BASE_CLASSES } from './Skeleton';
export type {
  SkeletonProps,
  SkeletonVariant,
  SkeletonDimension,
  SkeletonBreakpoint,
  ResponsiveSkeletonDimension,
} from './Skeleton';

export {
  SkipLink,
  getSkipLinkClasses,
  SKIP_LINK_BASE_CLASSES,
  DEFAULT_SKIP_LINK_TEXT,
} from './SkipLink';
export type { SkipLinkProps } from './SkipLink';

export { HamburgerButton } from './HamburgerButton';
export type { HamburgerButtonProps } from './HamburgerButton';
