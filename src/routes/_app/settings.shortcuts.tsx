/**
 * Keyboard Shortcuts Settings Route
 *
 * Displays all keyboard shortcuts available in the application.
 * Uses the KeyboardShortcutsSettingsPage component from @openflow/ui.
 *
 * Follows the orchestration pattern: pure composition of hooks and UI components.
 */

import { useKeyboardShortcuts } from '@openflow/hooks';
import { KeyboardShortcutsSettingsPage, defaultShortcutGroups } from '@openflow/ui';
import { createFileRoute, useNavigate } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/settings/shortcuts')({
  component: KeyboardShortcutsRoute,
});

function KeyboardShortcutsRoute() {
  const navigate = useNavigate();

  // Register keyboard shortcuts for this page
  useKeyboardShortcuts([
    {
      key: 'Escape',
      action: () => navigate({ to: '/settings' }),
    },
  ]);

  return <KeyboardShortcutsSettingsPage shortcutGroups={defaultShortcutGroups} />;
}
