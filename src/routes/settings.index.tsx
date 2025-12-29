/**
 * Settings Index Route (General Settings)
 *
 * The default settings page shown at /settings.
 * Contains general application preferences.
 *
 * Follows the orchestration pattern: connects hooks to UI components.
 */

import { useState, useCallback, useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Save, Moon, Sun, Monitor, HardDrive } from 'lucide-react';
import { Button, FormField, Card, Badge } from '@openflow/ui';
import { useAllSettings, useSetSetting, useKeyboardShortcuts } from '@openflow/hooks';

export const Route = createFileRoute('/settings/')({
  component: GeneralSettingsPage,
});

// Theme options
type Theme = 'system' | 'dark' | 'light';

const themeOptions: { value: Theme; label: string; icon: React.ReactNode }[] = [
  { value: 'system', label: 'System', icon: <Monitor className="h-4 w-4" /> },
  { value: 'dark', label: 'Dark', icon: <Moon className="h-4 w-4" /> },
  { value: 'light', label: 'Light', icon: <Sun className="h-4 w-4" /> },
];

function GeneralSettingsPage() {
  // UI state
  const [theme, setTheme] = useState<Theme>('system');
  const [autoSave, setAutoSave] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Data fetching
  const { data: settings = {}, isLoading } = useAllSettings();
  const setSetting = useSetSetting();

  // Load settings into state
  useEffect(() => {
    if (settings.theme) {
      setTheme(settings.theme as Theme);
    }
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
  const handleThemeChange = useCallback((newTheme: Theme) => {
    setTheme(newTheme);
    setHasChanges(true);
    setSaveSuccess(false);
  }, []);

  const handleAutoSaveChange = useCallback((checked: boolean) => {
    setAutoSave(checked);
    setHasChanges(true);
    setSaveSuccess(false);
  }, []);

  const handleSave = useCallback(async () => {
    try {
      await Promise.all([
        setSetting.mutateAsync({ key: 'theme', value: theme }),
        setSetting.mutateAsync({ key: 'autoSave', value: String(autoSave) }),
      ]);
      setHasChanges(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      // Error handling done by mutation
    }
  }, [theme, autoSave, setSetting]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-[rgb(var(--muted-foreground))]">
          Loading settings...
        </div>
      </div>
    );
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
            <div className="flex gap-2">
              {themeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleThemeChange(option.value)}
                  className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                    theme === option.value
                      ? 'border-[rgb(var(--primary))] bg-[rgb(var(--primary))]/10 text-[rgb(var(--primary))]'
                      : 'border-[rgb(var(--border))] text-[rgb(var(--muted-foreground))] hover:border-[rgb(var(--primary))]/50 hover:text-[rgb(var(--foreground))]'
                  }`}
                >
                  {option.icon}
                  {option.label}
                </button>
              ))}
            </div>
          </FormField>
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
