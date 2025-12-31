/**
 * Settings Index Route (General Settings)
 *
 * The default settings page shown at /settings.
 * Contains general application preferences.
 *
 * Follows the orchestration pattern: connects hooks to UI components.
 */

import { useAllSettings, useKeyboardShortcuts, useSetSetting, useTheme } from '@openflow/hooks';
import { Badge, Button, Card, FormField, SkeletonSettings, ThemeToggle } from '@openflow/ui';
import type { Theme } from '@openflow/ui';
import { createFileRoute } from '@tanstack/react-router';
import { HardDrive, Moon, Save } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

export const Route = createFileRoute('/_app/settings/')({
  component: GeneralSettingsPage,
});

function GeneralSettingsPage() {
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

  // Loading state
  if (isLoading) {
    return <SkeletonSettings sectionCount={3} fieldsPerSection={2} />;
  }

  return (
    <div className="space-y-6">
      {/* Status badges */}
      {(hasChanges || saveSuccess) && (
        <div className="flex items-center gap-2">
          {hasChanges && <Badge variant="warning">Unsaved changes</Badge>}
          {saveSuccess && <Badge variant="success">Saved successfully</Badge>}
        </div>
      )}

      {/* Appearance Section */}
      <Card className="overflow-hidden">
        <div className="border-b border-[rgb(var(--border))] bg-[rgb(var(--muted))]/50 px-4 py-3">
          <div className="flex items-center gap-2">
            <Moon className="h-4 w-4 text-[rgb(var(--primary))]" />
            <h3 className="font-medium text-[rgb(var(--foreground))]">Appearance</h3>
          </div>
          <p className="mt-0.5 text-xs text-[rgb(var(--muted-foreground))]">
            Customize how OpenFlow looks
          </p>
        </div>
        <div className="p-4">
          <FormField label="Theme">
            <ThemeToggle theme={theme} onThemeChange={handleThemeChange} />
          </FormField>
          <p className="mt-2 text-xs text-[rgb(var(--muted-foreground))]">
            Theme changes are applied immediately and persisted automatically.
          </p>
        </div>
      </Card>

      {/* Behavior Section */}
      <Card className="overflow-hidden">
        <div className="border-b border-[rgb(var(--border))] bg-[rgb(var(--muted))]/50 px-4 py-3">
          <div className="flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-[rgb(var(--primary))]" />
            <h3 className="font-medium text-[rgb(var(--foreground))]">Behavior</h3>
          </div>
          <p className="mt-0.5 text-xs text-[rgb(var(--muted-foreground))]">
            Configure application behavior
          </p>
        </div>
        <div className="p-4">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={autoSave}
              onChange={(e) => handleAutoSaveChange(e.target.checked)}
              className="h-4 w-4 rounded border-[rgb(var(--border))] bg-[rgb(var(--background))] text-[rgb(var(--primary))] focus:ring-[rgb(var(--primary))]"
            />
            <div>
              <span className="text-sm font-medium text-[rgb(var(--foreground))]">
                Auto-save task descriptions
              </span>
              <p className="text-xs text-[rgb(var(--muted-foreground))]">
                Automatically save changes as you type
              </p>
            </div>
          </label>
        </div>
      </Card>

      {/* About Section */}
      <Card className="overflow-hidden">
        <div className="border-b border-[rgb(var(--border))] bg-[rgb(var(--muted))]/50 px-4 py-3">
          <h3 className="font-medium text-[rgb(var(--foreground))]">About</h3>
        </div>
        <div className="p-4">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[rgb(var(--muted-foreground))]">Version</span>
              <span className="text-[rgb(var(--foreground))]">0.1.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[rgb(var(--muted-foreground))]">Build</span>
              <span className="text-[rgb(var(--foreground))]">Development</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Save button */}
      <div className="flex items-center gap-4 border-t border-[rgb(var(--border))] pt-6">
        <Button
          variant="primary"
          onClick={handleSave}
          loading={setSetting.isPending}
          disabled={!hasChanges}
        >
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      </div>
    </div>
  );
}
