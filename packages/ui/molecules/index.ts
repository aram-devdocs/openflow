/**
 * Molecules - Composite components built from atoms
 *
 * These combine multiple atoms into more complex, reusable components.
 * Examples: FormField, Card, Dropdown, Dialog, Tabs, Tooltip, Menu
 */

export {
  FormField,
  getBaseSpacing as getFormFieldBaseSpacing,
  getResponsiveSpacingClasses as getFormFieldResponsiveSpacingClasses,
  FORM_FIELD_BASE_CLASSES,
  FORM_FIELD_SPACING_CLASSES,
  HELPER_TEXT_CLASSES,
  ERROR_TEXT_CLASSES,
} from './FormField';
export type { FormFieldProps, FormFieldSpacing } from './FormField';

export {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  getResponsivePaddingClasses,
  CARD_BASE_CLASSES,
  CARD_CLICKABLE_CLASSES,
  CARD_SELECTED_CLASSES,
  DEFAULT_SELECTED_LABEL,
} from './Card';
export type {
  CardProps,
  CardHeaderProps,
  CardContentProps,
  CardFooterProps,
  CardPadding,
} from './Card';

export {
  Dropdown,
  getResponsiveSizeClasses as getDropdownResponsiveSizeClasses,
  getOptionId,
  DEFAULT_OPENED_LABEL,
  DEFAULT_CLOSED_LABEL,
  DEFAULT_EMPTY_LABEL,
  DEFAULT_PLACEHOLDER,
  DROPDOWN_SIZE_CLASSES,
  DROPDOWN_TRIGGER_CLASSES,
  DROPDOWN_TRIGGER_HOVER_CLASSES,
  DROPDOWN_TRIGGER_FOCUS_CLASSES,
  DROPDOWN_TRIGGER_DISABLED_CLASSES,
  DROPDOWN_TRIGGER_ERROR_CLASSES,
  DROPDOWN_TRIGGER_OPEN_CLASSES,
  DROPDOWN_LISTBOX_CLASSES,
  DROPDOWN_OPTION_BASE_CLASSES,
  DROPDOWN_OPTION_HIGHLIGHTED_CLASSES,
  DROPDOWN_OPTION_SELECTED_CLASSES,
  DROPDOWN_OPTION_DISABLED_CLASSES,
} from './Dropdown';
export type { DropdownProps, DropdownOption, DropdownSize } from './Dropdown';

export {
  Dialog,
  DialogHeader,
  DialogContent,
  DialogFooter,
  getResponsiveSizeClasses as getDialogResponsiveSizeClasses,
  getDialogPaddingClasses,
  DEFAULT_CLOSE_LABEL,
  DIALOG_SIZE_CLASSES,
  DIALOG_PANEL_CLASSES,
  DIALOG_BACKDROP_CLASSES,
  DIALOG_HEADER_CLASSES,
  DIALOG_CONTENT_CLASSES,
  DIALOG_FOOTER_CLASSES,
} from './Dialog';
export type {
  DialogProps,
  DialogHeaderProps,
  DialogContentProps,
  DialogFooterProps,
  DialogSize,
  DialogPadding,
} from './Dialog';

export { Tabs, TabPanel } from './Tabs';
export type { TabsProps, TabPanelProps, Tab } from './Tabs';

export { Tooltip } from './Tooltip';
export type { TooltipProps, TooltipPosition } from './Tooltip';

export {
  Menu,
  getPositionStyles as getMenuPositionStyles,
  getItemAnnouncement,
  MENU_BASE_CLASSES,
  MENU_ANIMATION_CLASSES,
  MENU_ITEM_BASE_CLASSES,
  MENU_DIVIDER_CLASSES,
} from './Menu';
export type { MenuProps, MenuItem, MenuPosition } from './Menu';

export {
  EntityContextMenu,
  getEntityLabel,
  getScreenReaderAnnouncement,
  buildMenuItems,
  ENTITY_CONTEXT_MENU_BASE_CLASSES,
  ENTITY_TYPE_LABELS,
  MENU_ITEM_IDS,
  DEFAULT_ARIA_LABEL_TEMPLATE,
} from './EntityContextMenu';
export type {
  EntityContextMenuProps,
  EntityType,
  EntityContextMenuSize,
} from './EntityContextMenu';

export { SkeletonCard } from './SkeletonCard';
export type { SkeletonCardProps } from './SkeletonCard';

export { SkeletonList } from './SkeletonList';
export type { SkeletonListProps } from './SkeletonList';

export { SkeletonTaskCard } from './SkeletonTaskCard';
export type { SkeletonTaskCardProps } from './SkeletonTaskCard';

export { SkeletonChat } from './SkeletonChat';
export type { SkeletonChatProps } from './SkeletonChat';

export { SkeletonStats } from './SkeletonStats';
export type { SkeletonStatsProps } from './SkeletonStats';

export { SkeletonSettings } from './SkeletonSettings';
export type { SkeletonSettingsProps } from './SkeletonSettings';

export { SkeletonProjectCard } from './SkeletonProjectCard';
export type { SkeletonProjectCardProps } from './SkeletonProjectCard';

export { SkeletonTaskDetail } from './SkeletonTaskDetail';
export type { SkeletonTaskDetailProps } from './SkeletonTaskDetail';

export { SkeletonArchiveList } from './SkeletonArchiveList';
export type { SkeletonArchiveListProps } from './SkeletonArchiveList';

export {
  EmptyState,
  getBaseSize as getEmptyStateBaseSize,
  getResponsiveSizeClasses as getEmptyStateResponsiveSizeClasses,
  EMPTY_STATE_BASE_CLASSES,
  SIZE_STYLES as EMPTY_STATE_SIZE_STYLES,
} from './EmptyState';
export type { EmptyStateProps, EmptyStateSize, EmptyStateAction } from './EmptyState';
