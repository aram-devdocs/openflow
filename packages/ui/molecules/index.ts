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

export {
  SkeletonCard,
  getBaseSize as getSkeletonCardBaseSize,
  getResponsiveSizeClasses as getSkeletonCardResponsiveSizeClasses,
  getAvatarDimensions as getSkeletonCardAvatarDimensions,
  SKELETON_CARD_BASE_CLASSES,
  SKELETON_CARD_PADDING_CLASSES,
  SKELETON_CARD_HEADER_GAP_CLASSES,
  SKELETON_CARD_AVATAR_CLASSES,
  SKELETON_CARD_TITLE_CLASSES,
  SKELETON_CARD_DESCRIPTION_CLASSES,
  SKELETON_CARD_ACTION_CLASSES,
  SKELETON_CARD_ACTIONS_GAP_CLASSES,
  SKELETON_CARD_ACTIONS_MARGIN_CLASSES,
  SKELETON_CARD_CONTENT_GAP_CLASSES,
} from './SkeletonCard';
export type {
  SkeletonCardProps,
  SkeletonCardSize,
  SkeletonCardBreakpoint,
} from './SkeletonCard';

export {
  SkeletonList,
  getBaseSize as getSkeletonListBaseSize,
  getResponsiveSizeClasses as getSkeletonListResponsiveSizeClasses,
  getAvatarDimensions as getSkeletonListAvatarDimensions,
  DEFAULT_SKELETON_COUNT as SKELETON_LIST_DEFAULT_COUNT,
  DEFAULT_SKELETON_LINES as SKELETON_LIST_DEFAULT_LINES,
  SKELETON_LIST_BASE_CLASSES,
  SKELETON_LIST_GAP_CLASSES,
  SKELETON_ITEM_PADDING_CLASSES,
  SKELETON_ITEM_GAP_CLASSES,
  SKELETON_AVATAR_DIMENSIONS as SKELETON_LIST_AVATAR_DIMENSIONS,
  SKELETON_PRIMARY_TEXT_CLASSES,
  SKELETON_SECONDARY_TEXT_CLASSES,
  SKELETON_TERTIARY_TEXT_CLASSES,
  SKELETON_TEXT_GAP_CLASSES,
} from './SkeletonList';
export type {
  SkeletonListProps,
  SkeletonListSize,
  SkeletonListBreakpoint,
} from './SkeletonList';

export { SkeletonTaskCard } from './SkeletonTaskCard';
export type { SkeletonTaskCardProps } from './SkeletonTaskCard';

export {
  SkeletonChat,
  getBaseSize as getSkeletonChatBaseSize,
  getResponsiveSizeClasses as getSkeletonChatResponsiveSizeClasses,
  getAvatarDimensions as getSkeletonChatAvatarDimensions,
  DEFAULT_MESSAGE_COUNT,
  SKELETON_CHAT_BASE_CLASSES,
  SKELETON_CHAT_PADDING_CLASSES,
  SKELETON_CHAT_GAP_CLASSES,
  SKELETON_BUBBLE_GAP_CLASSES,
  SKELETON_AVATAR_DIMENSIONS,
  SKELETON_BUBBLE_CLASSES,
  SKELETON_BUBBLE_SPACING_CLASSES,
  SKELETON_TEXT_HEIGHT_CLASSES,
  SKELETON_USER_PRIMARY_WIDTH_CLASSES,
  SKELETON_USER_SECONDARY_WIDTH_CLASSES,
  SKELETON_ASSISTANT_PRIMARY_WIDTH_CLASSES,
  SKELETON_ASSISTANT_SECONDARY_WIDTH_CLASSES,
  SKELETON_ASSISTANT_TERTIARY_WIDTH_CLASSES,
} from './SkeletonChat';
export type {
  SkeletonChatProps,
  SkeletonChatSize,
  SkeletonChatBreakpoint,
} from './SkeletonChat';

export { SkeletonStats } from './SkeletonStats';
export type { SkeletonStatsProps } from './SkeletonStats';

export { SkeletonSettings } from './SkeletonSettings';
export type { SkeletonSettingsProps } from './SkeletonSettings';

export {
  SkeletonProjectCard,
  getBaseSize as getSkeletonProjectCardBaseSize,
  getResponsiveSizeClasses as getSkeletonProjectCardResponsiveSizeClasses,
  getIconDimensions as getSkeletonProjectCardIconDimensions,
  SKELETON_PROJECT_CARD_BASE_CLASSES,
  SKELETON_PROJECT_CARD_PADDING_CLASSES,
  SKELETON_PROJECT_CARD_ICON_CLASSES,
  SKELETON_PROJECT_CARD_ICON_MARGIN_CLASSES,
  SKELETON_PROJECT_CARD_TITLE_CLASSES,
  SKELETON_PROJECT_CARD_TITLE_MARGIN_CLASSES,
  SKELETON_PROJECT_CARD_DESCRIPTION_CLASSES,
} from './SkeletonProjectCard';
export type {
  SkeletonProjectCardProps,
  SkeletonProjectCardSize,
  SkeletonProjectCardBreakpoint,
} from './SkeletonProjectCard';

export { SkeletonTaskDetail } from './SkeletonTaskDetail';
export type { SkeletonTaskDetailProps } from './SkeletonTaskDetail';

export {
  SkeletonArchiveList,
  getBaseSize as getSkeletonArchiveListBaseSize,
  getResponsiveSizeClasses as getSkeletonArchiveListResponsiveSizeClasses,
  DEFAULT_SKELETON_COUNT,
  SKELETON_ARCHIVE_LIST_BASE_CLASSES,
  SKELETON_ARCHIVE_LIST_SIZE_CLASSES,
  SKELETON_ITEM_CONTAINER_CLASSES,
  SKELETON_TITLE_CLASSES,
  SKELETON_METADATA_CLASSES,
  SKELETON_SECONDARY_METADATA_CLASSES,
  SKELETON_ACTION_BUTTON_CLASSES,
  SKELETON_SECONDARY_ACTION_CLASSES,
} from './SkeletonArchiveList';
export type {
  SkeletonArchiveListProps,
  SkeletonArchiveListSize,
  SkeletonArchiveListBreakpoint,
} from './SkeletonArchiveList';

export {
  EmptyState,
  getBaseSize as getEmptyStateBaseSize,
  getResponsiveSizeClasses as getEmptyStateResponsiveSizeClasses,
  EMPTY_STATE_BASE_CLASSES,
  SIZE_STYLES as EMPTY_STATE_SIZE_STYLES,
} from './EmptyState';
export type { EmptyStateProps, EmptyStateSize, EmptyStateAction } from './EmptyState';
