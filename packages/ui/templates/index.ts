/**
 * Templates - Page layout structures
 *
 * These define the overall structure and layout of pages.
 * They arrange organisms, molecules, and atoms into complete page layouts.
 * Examples: AppLayout, TaskLayout, SettingsLayout
 */

// ============================================================================
// AppLayout Exports
// ============================================================================

export {
  AppLayout,
  // Types
  type AppLayoutProps,
  type AppLayoutSize,
  type AppLayoutBreakpoint,
  // Default Labels (prefixed to avoid conflicts with organisms)
  DEFAULT_SKIP_LINK_TEXT as APP_LAYOUT_SKIP_LINK_TEXT,
  DEFAULT_SIDEBAR_LABEL as APP_LAYOUT_SIDEBAR_LABEL,
  DEFAULT_HEADER_LABEL as APP_LAYOUT_HEADER_LABEL,
  DEFAULT_MAIN_LABEL as APP_LAYOUT_MAIN_LABEL,
  DEFAULT_MOBILE_DRAWER_LABEL as APP_LAYOUT_MOBILE_DRAWER_LABEL,
  // Screen Reader Announcements (prefixed to avoid conflicts)
  SR_SIDEBAR_COLLAPSED as APP_LAYOUT_SR_SIDEBAR_COLLAPSED,
  SR_SIDEBAR_EXPANDED as APP_LAYOUT_SR_SIDEBAR_EXPANDED,
  SR_DRAWER_OPENED as APP_LAYOUT_SR_DRAWER_OPENED,
  SR_DRAWER_CLOSED as APP_LAYOUT_SR_DRAWER_CLOSED,
  // CSS Class Constants
  APP_LAYOUT_CONTAINER_CLASSES,
  APP_LAYOUT_SIDEBAR_BASE_CLASSES,
  SIDEBAR_EXPANDED_WIDTH_CLASSES,
  SIDEBAR_COLLAPSED_WIDTH,
  APP_LAYOUT_MAIN_AREA_CLASSES,
  APP_LAYOUT_HEADER_CONTAINER_CLASSES,
  APP_LAYOUT_HAMBURGER_CONTAINER_CLASSES,
  APP_LAYOUT_HEADER_CONTENT_CLASSES,
  APP_LAYOUT_MAIN_CONTENT_CLASSES,
  // Utility Functions
  getBaseSize as getAppLayoutBaseSize,
  getResponsiveSidebarClasses,
  buildSidebarAnnouncement as buildAppLayoutSidebarAnnouncement,
  buildDrawerAnnouncement as buildAppLayoutDrawerAnnouncement,
} from './AppLayout';

// ============================================================================
// TaskLayout Exports
// ============================================================================

export {
  TaskLayout,
  TaskLayoutSkeleton,
  // Types
  type TaskLayoutProps,
  type TaskLayoutSkeletonProps,
  type TaskLayoutSize,
  type TaskLayoutBreakpoint,
  // Default Labels (prefixed to avoid conflicts)
  DEFAULT_HEADER_LABEL as TASK_LAYOUT_HEADER_LABEL,
  DEFAULT_MAIN_LABEL as TASK_LAYOUT_MAIN_LABEL,
  DEFAULT_STEPS_PANEL_LABEL as TASK_LAYOUT_STEPS_PANEL_LABEL,
  DEFAULT_STEPS_PANEL_WIDTH as TASK_LAYOUT_STEPS_PANEL_WIDTH,
  DEFAULT_BACK_LABEL as TASK_LAYOUT_BACK_LABEL,
  DEFAULT_EDIT_TITLE_LABEL as TASK_LAYOUT_EDIT_TITLE_LABEL,
  DEFAULT_MORE_ACTIONS_LABEL as TASK_LAYOUT_MORE_ACTIONS_LABEL,
  DEFAULT_CREATE_PR_LABEL as TASK_LAYOUT_CREATE_PR_LABEL,
  // Screen Reader Announcements (prefixed to avoid conflicts)
  SR_LOADING as TASK_LAYOUT_SR_LOADING,
  SR_STEPS_EXPANDED as TASK_LAYOUT_SR_STEPS_EXPANDED,
  SR_STEPS_COLLAPSED as TASK_LAYOUT_SR_STEPS_COLLAPSED,
  SR_TAB_CHANGED as TASK_LAYOUT_SR_TAB_CHANGED,
  SR_TITLE_EDITING as TASK_LAYOUT_SR_TITLE_EDITING,
  SR_TITLE_SAVED as TASK_LAYOUT_SR_TITLE_SAVED,
  SR_STATUS_CHANGED as TASK_LAYOUT_SR_STATUS_CHANGED,
  // Status Options
  STATUS_OPTIONS as TASK_LAYOUT_STATUS_OPTIONS,
  // CSS Class Constants
  TASK_LAYOUT_CONTAINER_CLASSES,
  TASK_LAYOUT_SIZE_CLASSES,
  TASK_LAYOUT_HEADER_CLASSES,
  TASK_LAYOUT_HEADER_ROW_CLASSES,
  TASK_LAYOUT_HEADER_LEFT_CLASSES,
  TASK_LAYOUT_HEADER_RIGHT_CLASSES,
  TASK_LAYOUT_TITLE_CLASSES,
  TASK_LAYOUT_TITLE_INPUT_CLASSES,
  TASK_LAYOUT_EDIT_TITLE_BUTTON_CLASSES,
  TASK_LAYOUT_BRANCH_CLASSES,
  TASK_LAYOUT_TABS_CLASSES,
  TASK_LAYOUT_MAIN_CLASSES,
  TASK_LAYOUT_MOBILE_STEPS_TOGGLE_CLASSES,
  TASK_LAYOUT_MOBILE_STEPS_PANEL_CLASSES,
  TASK_LAYOUT_DESKTOP_STEPS_PANEL_CLASSES,
  TASK_LAYOUT_MAIN_PANEL_CLASSES,
  TASK_LAYOUT_TAB_CONTENT_CLASSES,
  TASK_LAYOUT_ICON_BUTTON_CLASSES,
  // Utility Functions
  getBaseSize as getTaskLayoutBaseSize,
  getResponsiveSizeClasses as getTaskLayoutResponsiveSizeClasses,
  getCurrentBranch as getTaskLayoutCurrentBranch,
  buildTaskHeaderAccessibleLabel,
  buildStepsPanelAnnouncement as buildTaskLayoutStepsPanelAnnouncement,
  buildTabChangeAnnouncement as buildTaskLayoutTabChangeAnnouncement,
  buildStatusChangeAnnouncement as buildTaskLayoutStatusChangeAnnouncement,
  getStepsPanelId as getTaskLayoutStepsPanelId,
  getMainPanelId as getTaskLayoutMainPanelId,
} from './TaskLayout';

// ============================================================================
// SettingsLayout Exports
// ============================================================================

export {
  SettingsLayout,
  // Types
  type SettingsLayoutProps,
  type SettingsNavItem,
  type SettingsLayoutSize,
  type SettingsLayoutBreakpoint,
  // Default Labels (prefixed to avoid conflicts)
  DEFAULT_NAV_LABEL as SETTINGS_LAYOUT_NAV_LABEL,
  DEFAULT_CONTENT_LABEL as SETTINGS_LAYOUT_CONTENT_LABEL,
  DEFAULT_NAV_WIDTH as SETTINGS_LAYOUT_NAV_WIDTH,
  // Screen Reader Announcements (prefixed to avoid conflicts)
  SR_NAV_CHANGED as SETTINGS_LAYOUT_SR_NAV_CHANGED,
  SR_SECTION_HEADER as SETTINGS_LAYOUT_SR_SECTION_HEADER,
  SR_CURRENT_PAGE as SETTINGS_LAYOUT_SR_CURRENT_PAGE,
  // CSS Class Constants
  SETTINGS_LAYOUT_CONTAINER_CLASSES,
  SETTINGS_LAYOUT_SIZE_CLASSES,
  SETTINGS_MOBILE_NAV_CLASSES,
  SETTINGS_MOBILE_TAB_BASE_CLASSES,
  SETTINGS_MOBILE_TAB_ACTIVE_CLASSES,
  SETTINGS_MOBILE_TAB_INACTIVE_CLASSES,
  SETTINGS_MOBILE_TAB_DISABLED_CLASSES,
  SETTINGS_DESKTOP_NAV_CLASSES,
  SETTINGS_NAV_LIST_CLASSES,
  SETTINGS_SECTION_HEADER_CLASSES,
  SETTINGS_NAV_ITEM_BASE_CLASSES,
  SETTINGS_NAV_ITEM_ACTIVE_CLASSES,
  SETTINGS_NAV_ITEM_INACTIVE_CLASSES,
  SETTINGS_NAV_ITEM_DISABLED_CLASSES,
  SETTINGS_CONTENT_WRAPPER_CLASSES,
  SETTINGS_HEADER_CLASSES,
  // Utility Functions
  getBaseSize as getSettingsLayoutBaseSize,
  getResponsiveSizeClasses as getSettingsLayoutResponsiveSizeClasses,
  buildNavChangeAnnouncement as buildSettingsLayoutNavChangeAnnouncement,
  getNavItemId as getSettingsLayoutNavItemId,
  getTabPanelId as getSettingsLayoutTabPanelId,
  getClickableNavItems as getSettingsLayoutClickableNavItems,
  getNavItemIndex as getSettingsLayoutNavItemIndex,
  findNextEnabledItem as findSettingsLayoutNextEnabledItem,
} from './SettingsLayout';
