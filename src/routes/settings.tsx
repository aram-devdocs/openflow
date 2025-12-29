/**
 * Settings Layout Route
 *
 * Parent route for all settings pages.
 * Provides navigation sidebar and layout for:
 * - Executor profiles management
 * - Project settings
 * - General preferences
 *
 * Follows the orchestration pattern: connects hooks to UI components.
 */

import { useCallback } from 'react';
import { createFileRoute, useNavigate, Outlet, useMatches } from '@tanstack/react-router';
import { Settings, User, FolderGit2, Palette, Bell, Keyboard } from 'lucide-react';
import { AppLayout, Header, SettingsLayout } from '@openflow/ui';
import type { SettingsNavItem } from '@openflow/ui';
import { useKeyboardShortcuts } from '@openflow/hooks';

export const Route = createFileRoute('/settings')({
  component: SettingsPage,
});

// Navigation items for settings sidebar
const settingsNavItems: SettingsNavItem[] = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'profiles', label: 'Executor Profiles', icon: User },
  { id: 'projects', label: 'Projects', icon: FolderGit2 },
  { id: 'preferences', label: 'Preferences', isSection: true },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'shortcuts', label: 'Keyboard Shortcuts', icon: Keyboard },
];

function SettingsPage() {
  const navigate = useNavigate();
  const matches = useMatches();

  // Determine active nav item from current route
  const getActiveNavId = useCallback(() => {
    const currentPath = matches[matches.length - 1]?.pathname ?? '';
    if (currentPath.includes('/settings/profiles')) return 'profiles';
    if (currentPath.includes('/settings/projects')) return 'projects';
    if (currentPath.includes('/settings/appearance')) return 'appearance';
    if (currentPath.includes('/settings/notifications')) return 'notifications';
    if (currentPath.includes('/settings/shortcuts')) return 'shortcuts';
    return 'general';
  }, [matches]);

  const activeNavId = getActiveNavId();

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'Escape',
      action: () => navigate({ to: '/' }),
    },
  ]);

  // Navigate to settings section
  const handleNavChange = useCallback(
    (id: string) => {
      // Section headers are not clickable
      if (id === 'preferences') return;

      switch (id) {
        case 'profiles':
          navigate({ to: '/settings/profiles' });
          break;
        case 'projects':
          navigate({ to: '/settings/projects' });
          break;
        case 'general':
        default:
          navigate({ to: '/settings' });
          break;
        // Other sections are placeholders for now
      }
    },
    [navigate]
  );

  const handleSearch = useCallback(() => {
    // TODO: Open command palette for search
    console.log('Search clicked');
  }, []);

  return (
    <AppLayout
      sidebarCollapsed={true}
      sidebar={null}
      header={
        <Header
          title="Settings"
          subtitle="Manage your OpenFlow configuration"
          onSearch={handleSearch}
        />
      }
    >
      <SettingsLayout
        navigation={settingsNavItems}
        activeNavId={activeNavId}
        onNavChange={handleNavChange}
        title={getSettingsTitle(activeNavId)}
        description={getSettingsDescription(activeNavId)}
      >
        <Outlet />
      </SettingsLayout>
    </AppLayout>
  );
}

// Helper functions for dynamic titles
function getSettingsTitle(navId: string): string {
  switch (navId) {
    case 'profiles':
      return 'Executor Profiles';
    case 'projects':
      return 'Project Settings';
    case 'appearance':
      return 'Appearance';
    case 'notifications':
      return 'Notifications';
    case 'shortcuts':
      return 'Keyboard Shortcuts';
    case 'general':
    default:
      return 'General Settings';
  }
}

function getSettingsDescription(navId: string): string {
  switch (navId) {
    case 'profiles':
      return 'Configure AI CLI tools and executor profiles for your tasks.';
    case 'projects':
      return 'Manage project-specific settings and scripts.';
    case 'appearance':
      return 'Customize the look and feel of OpenFlow.';
    case 'notifications':
      return 'Configure notification preferences.';
    case 'shortcuts':
      return 'View and customize keyboard shortcuts.';
    case 'general':
    default:
      return 'Configure general application settings.';
  }
}
