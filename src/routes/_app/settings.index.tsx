/**
 * Settings Index Route (General Settings)
 *
 * The default settings page shown at /settings.
 * Contains general application preferences.
 *
 * Follows the orchestration pattern: connects hooks to UI components.
 */

import { useAllSettings, useKeyboardShortcuts, useSetSetting, useTheme } from '@openflow/hooks';
import { SettingsPage } from '@openflow/ui';
import type { Theme } from '@openflow/ui';
import { createFileRoute } from '@tanstack/react-router';
import { useCallback, useEffect, useState } from 'react';

export const Route = createFileRoute('/_app/settings/')({
  component: GeneralSettingsRoute,
});

function GeneralSettingsRoute() {
  // Theme from context (applies immediately)
  const { theme, setTheme: setThemeContext } = useTheme();

  // UI state for other settings
  const [autoSave, setAutoSave] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Data fetching for non-theme settings
  const { data: settings = {}, isLoading } = useAllSettings();
  const setSetting = useSetSetting();

  // Load non-theme settings into state
  useEffect(() => {
    if (settings.autoSave !== undefined) {
      setAutoSave(settings.autoSave === 'true');
    }
  }, [settings]);

  // Handlers
  const handleThemeChange = useCallback(
    (newTheme: Theme) => {
      setThemeContext(newTheme);
      // Theme is applied immediately via context, no need to save
    },
    [setThemeContext]
  );

  const handleAutoSaveChange = useCallback((checked: boolean) => {
    setAutoSave(checked);
    setHasChanges(true);
    setSaveSuccess(false);
  }, []);

  const handleSave = useCallback(async () => {
    try {
      await setSetting.mutateAsync({ key: 'autoSave', value: String(autoSave) });
      setHasChanges(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      // Error handling done by mutation
    }
  }, [autoSave, setSetting]);

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 's',
      meta: true,
      action: () => {
        if (hasChanges) handleSave();
      },
    },
  ]);

  return (
    <SettingsPage
      isLoading={isLoading}
      appearance={{
        theme,
        onThemeChange: handleThemeChange,
      }}
      behavior={{
        autoSave,
        onAutoSaveChange: handleAutoSaveChange,
      }}
      about={{
        version: '0.1.0',
        build: 'Development',
      }}
      save={{
        hasChanges,
        saveSuccess,
        isSaving: setSetting.isPending,
        onSave: handleSave,
      }}
    />
  );
}
