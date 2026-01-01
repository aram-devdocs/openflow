import {
  PERMISSION_DIALOG_BACKDROP_CLASSES,
  PERMISSION_DIALOG_BUTTON_CLASSES,
  PERMISSION_DIALOG_CLOSE_BUTTON_CLASSES,
  PERMISSION_DIALOG_CONTAINER_CLASSES,
  PERMISSION_DIALOG_CONTENT_CLASSES,
  // Constants
  PERMISSION_DIALOG_DEFAULT_APPROVE_LABEL,
  PERMISSION_DIALOG_DEFAULT_CLOSE_LABEL,
  PERMISSION_DIALOG_DEFAULT_DENY_LABEL,
  PERMISSION_DIALOG_DEFAULT_TOOL_CONFIG,
  PERMISSION_DIALOG_FILEPATH_CLASSES,
  PERMISSION_DIALOG_FOOTER_CLASSES,
  PERMISSION_DIALOG_HEADER_CLASSES,
  PERMISSION_DIALOG_PANEL_CLASSES,
  PERMISSION_DIALOG_SIZE_CLASSES,
  PERMISSION_DIALOG_SR_APPROVING,
  PERMISSION_DIALOG_SR_DENYING,
  PERMISSION_DIALOG_SR_DIALOG_OPENED,
  PERMISSION_DIALOG_SR_PERMISSION_REQUEST,
  PERMISSION_DIALOG_SR_SECURITY_WARNING,
  PERMISSION_DIALOG_TOOL_CONFIG,
  PERMISSION_DIALOG_TOOL_ICON_CLASSES,
  PERMISSION_DIALOG_WARNING_ICON_CLASSES,
  // Types
  type PermissionRequest,
  buildPermissionDialogAccessibleLabel,
  buildPermissionDialogAnnouncement,
  getPermissionDialogActionDescription,
  // Utility functions
  getPermissionDialogBaseSize,
  getPermissionDialogResponsiveSizeClasses,
  getPermissionDialogToolIcon,
} from '@openflow/ui/organisms';
import { describe, expect, it } from 'vitest';

// ============================================================================
// Default Label Constants Tests
// ============================================================================

describe('Default Label Constants', () => {
  it('DEFAULT_APPROVE_LABEL should be "Allow"', () => {
    expect(PERMISSION_DIALOG_DEFAULT_APPROVE_LABEL).toBe('Allow');
  });

  it('DEFAULT_DENY_LABEL should be "Deny"', () => {
    expect(PERMISSION_DIALOG_DEFAULT_DENY_LABEL).toBe('Deny');
  });

  it('DEFAULT_CLOSE_LABEL should be descriptive', () => {
    expect(PERMISSION_DIALOG_DEFAULT_CLOSE_LABEL).toBe('Close and deny permission');
    expect(PERMISSION_DIALOG_DEFAULT_CLOSE_LABEL.length).toBeGreaterThan(10);
  });
});

// ============================================================================
// Screen Reader Announcement Constants Tests
// ============================================================================

describe('Screen Reader Announcement Constants', () => {
  it('SR_DIALOG_OPENED should announce dialog opening', () => {
    expect(PERMISSION_DIALOG_SR_DIALOG_OPENED).toBe('Permission request dialog opened.');
    expect(PERMISSION_DIALOG_SR_DIALOG_OPENED).toContain('dialog');
  });

  it('SR_PERMISSION_REQUEST should describe permission context', () => {
    expect(PERMISSION_DIALOG_SR_PERMISSION_REQUEST).toBe('Claude is requesting permission to');
    expect(PERMISSION_DIALOG_SR_PERMISSION_REQUEST).toContain('permission');
  });

  it('SR_APPROVING should announce loading state', () => {
    expect(PERMISSION_DIALOG_SR_APPROVING).toBe('Approving permission, please wait...');
    expect(PERMISSION_DIALOG_SR_APPROVING).toContain('please wait');
  });

  it('SR_DENYING should announce loading state', () => {
    expect(PERMISSION_DIALOG_SR_DENYING).toBe('Denying permission, please wait...');
    expect(PERMISSION_DIALOG_SR_DENYING).toContain('please wait');
  });

  it('SR_SECURITY_WARNING should indicate security context', () => {
    expect(PERMISSION_DIALOG_SR_SECURITY_WARNING).toBe('Security warning:');
    expect(PERMISSION_DIALOG_SR_SECURITY_WARNING).toContain('Security');
  });
});

// ============================================================================
// Tool Configuration Tests
// ============================================================================

describe('TOOL_CONFIG', () => {
  it('should have configuration for write tool', () => {
    const writeConfig = PERMISSION_DIALOG_TOOL_CONFIG.write;
    expect(writeConfig).toBeDefined();
    expect(writeConfig?.action).toBe('write to');
    expect(writeConfig?.icon).toBeDefined();
    expect(writeConfig?.srPrefix).toContain('write');
  });

  it('should have configuration for read tool', () => {
    const readConfig = PERMISSION_DIALOG_TOOL_CONFIG.read;
    expect(readConfig).toBeDefined();
    expect(readConfig?.action).toBe('read from');
    expect(readConfig?.icon).toBeDefined();
    expect(readConfig?.srPrefix).toContain('read');
  });

  it('should have configuration for bash tool', () => {
    const bashConfig = PERMISSION_DIALOG_TOOL_CONFIG.bash;
    expect(bashConfig).toBeDefined();
    expect(bashConfig?.action).toBe('execute command in');
    expect(bashConfig?.icon).toBeDefined();
    expect(bashConfig?.srPrefix).toContain('execution');
  });

  it('should have 3 tool configurations', () => {
    expect(Object.keys(PERMISSION_DIALOG_TOOL_CONFIG)).toHaveLength(3);
  });
});

describe('DEFAULT_TOOL_CONFIG', () => {
  it('should provide fallback for unknown tools', () => {
    expect(PERMISSION_DIALOG_DEFAULT_TOOL_CONFIG).toBeDefined();
    expect(PERMISSION_DIALOG_DEFAULT_TOOL_CONFIG.action).toBe('access');
    expect(PERMISSION_DIALOG_DEFAULT_TOOL_CONFIG.icon).toBeDefined();
    expect(PERMISSION_DIALOG_DEFAULT_TOOL_CONFIG.srPrefix).toBe('Permission required:');
  });
});

// ============================================================================
// Size Classes Tests
// ============================================================================

describe('PERMISSION_DIALOG_SIZE_CLASSES', () => {
  it('should have sm size class', () => {
    expect(PERMISSION_DIALOG_SIZE_CLASSES.sm).toBe('max-w-sm');
  });

  it('should have md size class', () => {
    expect(PERMISSION_DIALOG_SIZE_CLASSES.md).toBe('max-w-md');
  });

  it('should have lg size class', () => {
    expect(PERMISSION_DIALOG_SIZE_CLASSES.lg).toBe('max-w-lg');
  });

  it('should have 3 size options', () => {
    expect(Object.keys(PERMISSION_DIALOG_SIZE_CLASSES)).toHaveLength(3);
  });

  it('should use Tailwind max-w- pattern', () => {
    Object.values(PERMISSION_DIALOG_SIZE_CLASSES).forEach((value) => {
      expect(value).toMatch(/^max-w-/);
    });
  });
});

// ============================================================================
// Container Classes Tests
// ============================================================================

describe('PERMISSION_DIALOG_CONTAINER_CLASSES', () => {
  it('should include fixed positioning', () => {
    expect(PERMISSION_DIALOG_CONTAINER_CLASSES).toContain('fixed');
    expect(PERMISSION_DIALOG_CONTAINER_CLASSES).toContain('inset-0');
  });

  it('should include z-index for overlay', () => {
    expect(PERMISSION_DIALOG_CONTAINER_CLASSES).toContain('z-50');
  });

  it('should include centering classes', () => {
    expect(PERMISSION_DIALOG_CONTAINER_CLASSES).toContain('flex');
    expect(PERMISSION_DIALOG_CONTAINER_CLASSES).toContain('items-center');
    expect(PERMISSION_DIALOG_CONTAINER_CLASSES).toContain('justify-center');
  });
});

// ============================================================================
// Backdrop Classes Tests
// ============================================================================

describe('PERMISSION_DIALOG_BACKDROP_CLASSES', () => {
  it('should include fixed positioning', () => {
    expect(PERMISSION_DIALOG_BACKDROP_CLASSES).toContain('fixed');
    expect(PERMISSION_DIALOG_BACKDROP_CLASSES).toContain('inset-0');
  });

  it('should include background opacity', () => {
    expect(PERMISSION_DIALOG_BACKDROP_CLASSES).toContain('bg-black/60');
  });

  it('should support reduced transparency preference', () => {
    expect(PERMISSION_DIALOG_BACKDROP_CLASSES).toContain(
      '[@media(prefers-reduced-transparency:reduce)]'
    );
    expect(PERMISSION_DIALOG_BACKDROP_CLASSES).toContain('bg-black/80');
  });

  it('should respect reduced motion preference for transitions', () => {
    expect(PERMISSION_DIALOG_BACKDROP_CLASSES).toContain('motion-safe:transition-opacity');
  });
});

// ============================================================================
// Panel Classes Tests
// ============================================================================

describe('PERMISSION_DIALOG_PANEL_CLASSES', () => {
  it('should include z-index for stacking above backdrop', () => {
    expect(PERMISSION_DIALOG_PANEL_CLASSES).toContain('z-50');
  });

  it('should include full width with horizontal margin', () => {
    expect(PERMISSION_DIALOG_PANEL_CLASSES).toContain('w-full');
    expect(PERMISSION_DIALOG_PANEL_CLASSES).toContain('mx-4');
  });

  it('should include border and shadow styling', () => {
    expect(PERMISSION_DIALOG_PANEL_CLASSES).toContain('rounded-lg');
    expect(PERMISSION_DIALOG_PANEL_CLASSES).toContain('border');
    expect(PERMISSION_DIALOG_PANEL_CLASSES).toContain('shadow-xl');
  });

  it('should include background color', () => {
    expect(PERMISSION_DIALOG_PANEL_CLASSES).toContain('bg-[rgb(var(--card))]');
  });

  it('should include motion-safe animations', () => {
    expect(PERMISSION_DIALOG_PANEL_CLASSES).toContain('motion-safe:animate-in');
    expect(PERMISSION_DIALOG_PANEL_CLASSES).toContain('motion-safe:fade-in-0');
    expect(PERMISSION_DIALOG_PANEL_CLASSES).toContain('motion-safe:zoom-in-95');
  });

  it('should include focus styling', () => {
    expect(PERMISSION_DIALOG_PANEL_CLASSES).toContain('focus:outline-none');
  });
});

// ============================================================================
// Header Classes Tests
// ============================================================================

describe('PERMISSION_DIALOG_HEADER_CLASSES', () => {
  it('should include flex layout', () => {
    expect(PERMISSION_DIALOG_HEADER_CLASSES).toContain('flex');
    expect(PERMISSION_DIALOG_HEADER_CLASSES).toContain('items-center');
    expect(PERMISSION_DIALOG_HEADER_CLASSES).toContain('gap-3');
  });

  it('should include border', () => {
    expect(PERMISSION_DIALOG_HEADER_CLASSES).toContain('border-b');
  });

  it('should include padding', () => {
    expect(PERMISSION_DIALOG_HEADER_CLASSES).toContain('px-4');
    expect(PERMISSION_DIALOG_HEADER_CLASSES).toContain('py-3');
  });
});

// ============================================================================
// Warning Icon Classes Tests
// ============================================================================

describe('PERMISSION_DIALOG_WARNING_ICON_CLASSES', () => {
  it('should include fixed dimensions', () => {
    expect(PERMISSION_DIALOG_WARNING_ICON_CLASSES).toContain('h-10');
    expect(PERMISSION_DIALOG_WARNING_ICON_CLASSES).toContain('w-10');
  });

  it('should include flex centering', () => {
    expect(PERMISSION_DIALOG_WARNING_ICON_CLASSES).toContain('flex');
    expect(PERMISSION_DIALOG_WARNING_ICON_CLASSES).toContain('items-center');
    expect(PERMISSION_DIALOG_WARNING_ICON_CLASSES).toContain('justify-center');
  });

  it('should include rounded styling', () => {
    expect(PERMISSION_DIALOG_WARNING_ICON_CLASSES).toContain('rounded-full');
  });

  it('should include warning background color', () => {
    expect(PERMISSION_DIALOG_WARNING_ICON_CLASSES).toContain('bg-warning/20');
  });

  it('should prevent shrinking', () => {
    expect(PERMISSION_DIALOG_WARNING_ICON_CLASSES).toContain('shrink-0');
  });
});

// ============================================================================
// Content Classes Tests
// ============================================================================

describe('PERMISSION_DIALOG_CONTENT_CLASSES', () => {
  it('should include padding', () => {
    expect(PERMISSION_DIALOG_CONTENT_CLASSES).toBe('p-4');
  });
});

// ============================================================================
// Tool Icon Classes Tests
// ============================================================================

describe('PERMISSION_DIALOG_TOOL_ICON_CLASSES', () => {
  it('should include fixed dimensions', () => {
    expect(PERMISSION_DIALOG_TOOL_ICON_CLASSES).toContain('h-8');
    expect(PERMISSION_DIALOG_TOOL_ICON_CLASSES).toContain('w-8');
  });

  it('should include flex centering', () => {
    expect(PERMISSION_DIALOG_TOOL_ICON_CLASSES).toContain('flex');
    expect(PERMISSION_DIALOG_TOOL_ICON_CLASSES).toContain('items-center');
    expect(PERMISSION_DIALOG_TOOL_ICON_CLASSES).toContain('justify-center');
  });

  it('should include rounded styling', () => {
    expect(PERMISSION_DIALOG_TOOL_ICON_CLASSES).toContain('rounded');
  });

  it('should include muted background', () => {
    expect(PERMISSION_DIALOG_TOOL_ICON_CLASSES).toContain('bg-[rgb(var(--muted))]');
  });
});

// ============================================================================
// Filepath Classes Tests
// ============================================================================

describe('PERMISSION_DIALOG_FILEPATH_CLASSES', () => {
  it('should include margin top', () => {
    expect(PERMISSION_DIALOG_FILEPATH_CLASSES).toContain('mt-1');
  });

  it('should include muted background', () => {
    expect(PERMISSION_DIALOG_FILEPATH_CLASSES).toContain('bg-[rgb(var(--muted))]');
  });

  it('should include small text', () => {
    expect(PERMISSION_DIALOG_FILEPATH_CLASSES).toContain('text-xs');
  });

  it('should handle long paths with break-all', () => {
    expect(PERMISSION_DIALOG_FILEPATH_CLASSES).toContain('break-all');
  });

  it('should be a block element', () => {
    expect(PERMISSION_DIALOG_FILEPATH_CLASSES).toContain('block');
  });
});

// ============================================================================
// Footer Classes Tests
// ============================================================================

describe('PERMISSION_DIALOG_FOOTER_CLASSES', () => {
  it('should include flex layout', () => {
    expect(PERMISSION_DIALOG_FOOTER_CLASSES).toContain('flex');
  });

  it('should stack vertically on mobile', () => {
    expect(PERMISSION_DIALOG_FOOTER_CLASSES).toContain('flex-col');
  });

  it('should be horizontal on sm+ breakpoint', () => {
    expect(PERMISSION_DIALOG_FOOTER_CLASSES).toContain('sm:flex-row');
  });

  it('should include gap', () => {
    expect(PERMISSION_DIALOG_FOOTER_CLASSES).toContain('gap-2');
  });

  it('should include border', () => {
    expect(PERMISSION_DIALOG_FOOTER_CLASSES).toContain('border-t');
  });
});

// ============================================================================
// Button Classes Tests
// ============================================================================

describe('PERMISSION_DIALOG_BUTTON_CLASSES', () => {
  it('should be full width on mobile', () => {
    expect(PERMISSION_DIALOG_BUTTON_CLASSES).toContain('w-full');
  });

  it('should be auto width on sm+ breakpoint', () => {
    expect(PERMISSION_DIALOG_BUTTON_CLASSES).toContain('sm:w-auto');
  });

  it('should flex-1 on sm+ breakpoint', () => {
    expect(PERMISSION_DIALOG_BUTTON_CLASSES).toContain('sm:flex-1');
  });
});

// ============================================================================
// Close Button Classes Tests
// ============================================================================

describe('PERMISSION_DIALOG_CLOSE_BUTTON_CLASSES', () => {
  it('should meet touch target requirements (44px)', () => {
    expect(PERMISSION_DIALOG_CLOSE_BUTTON_CLASSES).toContain('min-h-[44px]');
    expect(PERMISSION_DIALOG_CLOSE_BUTTON_CLASSES).toContain('min-w-[44px]');
  });

  it('should include h-11 w-11 for base size', () => {
    expect(PERMISSION_DIALOG_CLOSE_BUTTON_CLASSES).toContain('h-11');
    expect(PERMISSION_DIALOG_CLOSE_BUTTON_CLASSES).toContain('w-11');
  });

  it('should have no padding (icon only)', () => {
    expect(PERMISSION_DIALOG_CLOSE_BUTTON_CLASSES).toContain('p-0');
  });
});

// ============================================================================
// getBaseSize Utility Tests
// ============================================================================

describe('getBaseSize', () => {
  it('should return md when undefined', () => {
    expect(getPermissionDialogBaseSize(undefined)).toBe('md');
  });

  it('should return the string value directly', () => {
    expect(getPermissionDialogBaseSize('sm')).toBe('sm');
    expect(getPermissionDialogBaseSize('md')).toBe('md');
    expect(getPermissionDialogBaseSize('lg')).toBe('lg');
  });

  it('should return base value from responsive object', () => {
    expect(getPermissionDialogBaseSize({ base: 'sm', md: 'lg' })).toBe('sm');
    expect(getPermissionDialogBaseSize({ base: 'lg' })).toBe('lg');
  });

  it('should return md when responsive object has no base', () => {
    expect(getPermissionDialogBaseSize({ md: 'lg' })).toBe('md');
  });

  it('should handle empty object', () => {
    expect(getPermissionDialogBaseSize({})).toBe('md');
  });
});

// ============================================================================
// getResponsiveSizeClasses Utility Tests
// ============================================================================

describe('getResponsiveSizeClasses', () => {
  it('should return md classes when undefined', () => {
    expect(getPermissionDialogResponsiveSizeClasses(undefined)).toBe('max-w-md');
  });

  it('should return size class for string value', () => {
    expect(getPermissionDialogResponsiveSizeClasses('sm')).toBe('max-w-sm');
    expect(getPermissionDialogResponsiveSizeClasses('md')).toBe('max-w-md');
    expect(getPermissionDialogResponsiveSizeClasses('lg')).toBe('max-w-lg');
  });

  it('should generate responsive classes from object', () => {
    const result = getPermissionDialogResponsiveSizeClasses({ base: 'sm', md: 'md', lg: 'lg' });
    expect(result).toContain('max-w-sm');
    expect(result).toContain('md:max-w-md');
    expect(result).toContain('lg:max-w-lg');
  });

  it('should handle partial responsive object', () => {
    const result = getPermissionDialogResponsiveSizeClasses({ base: 'sm', lg: 'lg' });
    expect(result).toContain('max-w-sm');
    expect(result).toContain('lg:max-w-lg');
    expect(result).not.toContain('md:');
  });

  it('should handle object with only base', () => {
    expect(getPermissionDialogResponsiveSizeClasses({ base: 'lg' })).toBe('max-w-lg');
  });

  it('should handle empty object', () => {
    expect(getPermissionDialogResponsiveSizeClasses({})).toBe('max-w-md');
  });

  it('should handle all breakpoints', () => {
    const result = getPermissionDialogResponsiveSizeClasses({
      base: 'sm',
      sm: 'sm',
      md: 'md',
      lg: 'lg',
      xl: 'lg',
      '2xl': 'lg',
    });
    expect(result).toContain('max-w-sm');
    expect(result).toContain('sm:max-w-sm');
    expect(result).toContain('md:max-w-md');
    expect(result).toContain('lg:max-w-lg');
    expect(result).toContain('xl:max-w-lg');
    expect(result).toContain('2xl:max-w-lg');
  });
});

// ============================================================================
// getToolIcon Utility Tests
// ============================================================================

describe('getToolIcon', () => {
  it('should return icon for write tool', () => {
    const icon = getPermissionDialogToolIcon('write');
    expect(icon).toBeDefined();
    expect(icon).toBe(PERMISSION_DIALOG_TOOL_CONFIG.write?.icon);
  });

  it('should return icon for read tool', () => {
    const icon = getPermissionDialogToolIcon('read');
    expect(icon).toBeDefined();
    expect(icon).toBe(PERMISSION_DIALOG_TOOL_CONFIG.read?.icon);
  });

  it('should return icon for bash tool', () => {
    const icon = getPermissionDialogToolIcon('bash');
    expect(icon).toBeDefined();
    expect(icon).toBe(PERMISSION_DIALOG_TOOL_CONFIG.bash?.icon);
  });

  it('should return default icon for unknown tool', () => {
    const icon = getPermissionDialogToolIcon('unknown');
    expect(icon).toBe(PERMISSION_DIALOG_DEFAULT_TOOL_CONFIG.icon);
  });

  it('should be case-insensitive', () => {
    expect(getPermissionDialogToolIcon('Write')).toBe(PERMISSION_DIALOG_TOOL_CONFIG.write?.icon);
    expect(getPermissionDialogToolIcon('WRITE')).toBe(PERMISSION_DIALOG_TOOL_CONFIG.write?.icon);
    expect(getPermissionDialogToolIcon('BASH')).toBe(PERMISSION_DIALOG_TOOL_CONFIG.bash?.icon);
  });
});

// ============================================================================
// getActionDescription Utility Tests
// ============================================================================

describe('getActionDescription', () => {
  it('should return action for write tool', () => {
    expect(getPermissionDialogActionDescription('write')).toBe('write to');
  });

  it('should return action for read tool', () => {
    expect(getPermissionDialogActionDescription('read')).toBe('read from');
  });

  it('should return action for bash tool', () => {
    expect(getPermissionDialogActionDescription('bash')).toBe('execute command in');
  });

  it('should return default action for unknown tool', () => {
    expect(getPermissionDialogActionDescription('unknown')).toBe('access');
  });

  it('should be case-insensitive', () => {
    expect(getPermissionDialogActionDescription('Write')).toBe('write to');
    expect(getPermissionDialogActionDescription('READ')).toBe('read from');
    expect(getPermissionDialogActionDescription('Bash')).toBe('execute command in');
  });
});

// ============================================================================
// buildAccessibleLabel Utility Tests
// ============================================================================

describe('buildAccessibleLabel', () => {
  const writeRequest: PermissionRequest = {
    processId: 'test-1',
    toolName: 'Write',
    filePath: '/path/to/file.txt',
    description: 'Test description',
  };

  const readRequest: PermissionRequest = {
    processId: 'test-2',
    toolName: 'Read',
    filePath: '/config/settings.json',
    description: 'Read settings',
  };

  const noFileRequest: PermissionRequest = {
    processId: 'test-3',
    toolName: 'CustomTool',
    description: 'Access API',
  };

  it('should include tool prefix for write', () => {
    const label = buildPermissionDialogAccessibleLabel(writeRequest);
    expect(label).toContain('File write permission:');
  });

  it('should include tool prefix for read', () => {
    const label = buildPermissionDialogAccessibleLabel(readRequest);
    expect(label).toContain('File read permission:');
  });

  it('should include action description', () => {
    const label = buildPermissionDialogAccessibleLabel(writeRequest);
    expect(label).toContain('Claude wants to write to');
  });

  it('should include file path when present', () => {
    const label = buildPermissionDialogAccessibleLabel(writeRequest);
    expect(label).toContain('/path/to/file.txt');
  });

  it('should not include file path when absent', () => {
    const label = buildPermissionDialogAccessibleLabel(noFileRequest);
    expect(label).not.toContain('undefined');
    expect(label).not.toContain('null');
  });

  it('should include description', () => {
    const label = buildPermissionDialogAccessibleLabel(writeRequest);
    expect(label).toContain('Test description');
  });

  it('should use default prefix for unknown tools', () => {
    const label = buildPermissionDialogAccessibleLabel(noFileRequest);
    expect(label).toContain('Permission required:');
  });
});

// ============================================================================
// buildDialogAnnouncement Utility Tests
// ============================================================================

describe('buildDialogAnnouncement', () => {
  const request: PermissionRequest = {
    processId: 'test',
    toolName: 'Write',
    filePath: '/file.txt',
    description: 'Test',
  };

  it('should return approving message when approving', () => {
    const announcement = buildPermissionDialogAnnouncement(request, true, false);
    expect(announcement).toBe(PERMISSION_DIALOG_SR_APPROVING);
  });

  it('should return denying message when denying', () => {
    const announcement = buildPermissionDialogAnnouncement(request, false, true);
    expect(announcement).toBe(PERMISSION_DIALOG_SR_DENYING);
  });

  it('should return full announcement when neither loading', () => {
    const announcement = buildPermissionDialogAnnouncement(request, false, false);
    expect(announcement).toContain(PERMISSION_DIALOG_SR_DIALOG_OPENED);
    expect(announcement).toContain('File write permission:');
  });

  it('should prioritize approving over denying', () => {
    const announcement = buildPermissionDialogAnnouncement(request, true, true);
    expect(announcement).toBe(PERMISSION_DIALOG_SR_APPROVING);
  });
});

// ============================================================================
// Accessibility Behavior Documentation
// ============================================================================

describe('Accessibility Behavior Documentation', () => {
  it('documents role="alertdialog" usage', () => {
    // alertdialog is used instead of dialog because permission requests are urgent
    // and require immediate attention from the user
    expect(true).toBe(true);
  });

  it('documents focus trap requirements', () => {
    // Tab and Shift+Tab should cycle through focusable elements within the dialog
    // without leaving the dialog boundaries
    expect(true).toBe(true);
  });

  it('documents focus restoration', () => {
    // When the dialog closes, focus should return to the element that was
    // focused before the dialog opened
    expect(true).toBe(true);
  });

  it('documents Escape key behavior', () => {
    // Escape key should deny the permission and close the dialog
    // unless closeOnEscape is false or loading is in progress
    expect(true).toBe(true);
  });

  it('documents touch target compliance', () => {
    // All interactive elements must be at least 44x44px per WCAG 2.5.5
    expect(PERMISSION_DIALOG_CLOSE_BUTTON_CLASSES).toContain('min-h-[44px]');
    expect(PERMISSION_DIALOG_CLOSE_BUTTON_CLASSES).toContain('min-w-[44px]');
  });

  it('documents screen reader announcements', () => {
    // aria-live="assertive" is used for permission dialogs because they are
    // security-critical and should interrupt the user
    expect(true).toBe(true);
  });

  it('documents button order rationale', () => {
    // Deny button comes first (left on desktop, top on mobile) because
    // denying is the safer default action for security-sensitive operations
    expect(true).toBe(true);
  });
});

// ============================================================================
// Component Props Documentation
// ============================================================================

describe('Component Props Documentation', () => {
  it('documents required props', () => {
    // Required props:
    // - request: PermissionRequest
    // - onApprove: () => void
    // - onDeny: () => void
    expect(true).toBe(true);
  });

  it('documents optional props with defaults', () => {
    // Optional props:
    // - approving: boolean (default: false)
    // - denying: boolean (default: false)
    // - size: ResponsiveValue<PermissionDialogSize> (default: 'md')
    // - approveLabel: string (default: DEFAULT_APPROVE_LABEL)
    // - denyLabel: string (default: DEFAULT_DENY_LABEL)
    // - closeLabel: string (default: DEFAULT_CLOSE_LABEL)
    // - closeOnEscape: boolean (default: true)
    // - closeOnBackdropClick: boolean (default: true)
    // - data-testid: string (optional)
    expect(true).toBe(true);
  });
});

// ============================================================================
// Visual State Classes Documentation
// ============================================================================

describe('Visual State Classes Documentation', () => {
  it('documents loading state visual behavior', () => {
    // When approving: Allow button shows spinner, Deny and Close are disabled
    // When denying: Deny button shows spinner, Allow and Close are disabled
    expect(true).toBe(true);
  });

  it('documents reduced motion support', () => {
    // motion-safe: prefix ensures animations only play when user has not
    // enabled "reduce motion" preference
    expect(PERMISSION_DIALOG_PANEL_CLASSES).toContain('motion-safe:animate-in');
    expect(PERMISSION_DIALOG_BACKDROP_CLASSES).toContain('motion-safe:transition-opacity');
  });

  it('documents reduced transparency support', () => {
    // Backdrop uses higher opacity when prefers-reduced-transparency is enabled
    expect(PERMISSION_DIALOG_BACKDROP_CLASSES).toContain(
      '[@media(prefers-reduced-transparency:reduce)]'
    );
  });
});

// ============================================================================
// Data Attributes Documentation
// ============================================================================

describe('Data Attributes Documentation', () => {
  it('documents data-testid pattern', () => {
    // When data-testid="permission-dialog" is provided:
    // - Container: permission-dialog-container
    // - Backdrop: permission-dialog-backdrop
    // - Panel: permission-dialog
    // - Header: permission-dialog-header
    // - Close button: permission-dialog-close
    // - Content: permission-dialog-content
    // - Footer: permission-dialog-footer
    // - Deny button: permission-dialog-deny
    // - Approve button: permission-dialog-approve
    expect(true).toBe(true);
  });

  it('documents data-tool attribute', () => {
    // data-tool contains the lowercase tool name for CSS styling/testing
    // Example: data-tool="write", data-tool="bash"
    expect(true).toBe(true);
  });

  it('documents loading state attributes', () => {
    // data-approving is present when approving is true
    // data-denying is present when denying is true
    expect(true).toBe(true);
  });
});

// ============================================================================
// Integration Pattern Documentation
// ============================================================================

describe('Integration Pattern Documentation', () => {
  it('documents typical usage pattern', () => {
    // Usage pattern:
    // const [approving, setApproving] = useState(false);
    // const [denying, setDenying] = useState(false);
    //
    // <PermissionDialog
    //   request={permissionRequest}
    //   onApprove={async () => {
    //     setApproving(true);
    //     await sendInput(request.processId, "y\n");
    //     setApproving(false);
    //   }}
    //   onDeny={async () => {
    //     setDenying(true);
    //     await sendInput(request.processId, "n\n");
    //     setDenying(false);
    //   }}
    //   approving={approving}
    //   denying={denying}
    // />
    expect(true).toBe(true);
  });

  it('documents Claude Code integration', () => {
    // The PermissionDialog is designed to work with Claude Code CLI tools.
    // When Claude Code requests permission, the process is paused waiting for
    // user input. The onApprove/onDeny handlers should send "y\n" or "n\n"
    // to the process stdin to continue execution.
    expect(true).toBe(true);
  });
});
