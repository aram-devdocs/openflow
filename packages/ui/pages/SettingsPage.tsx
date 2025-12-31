/**
 * SettingsPage - Stateless Page Component for General Settings
 *
 * This is a top-level stateless component that composes the general settings view.
 * It receives all required data and callbacks via props, making it fully
 * testable in Storybook with mocked data representing different page states.
 *
 * Note: This component is designed to work either standalone (with full layout)
 * or as a child of a settings layout route that provides navigation.
 *
 * The component composes:
 * - SkeletonSettings (loading state)
 * - Settings cards (Appearance, Behavior, About)
 * - Badge indicators for save states
 * - ThemeToggle for theme selection
 */

import { HardDrive, Moon, Save } from 'lucide-react';
import { Badge } from '../atoms/Badge';
import { Button } from '../atoms/Button';
import type { Theme } from '../atoms/ThemeToggle';
import { ThemeToggle } from '../atoms/ThemeToggle';
import { Card } from '../molecules/Card';
import { FormField } from '../molecules/FormField';
import { SkeletonSettings } from '../molecules/SkeletonSettings';

// ============================================================================
// Types
// ============================================================================

/** Props for the appearance section */
export interface SettingsPageAppearanceProps {
  /** Current theme */
  theme: Theme;
  /** Callback when theme changes */
  onThemeChange: (theme: Theme) => void;
}

/** Props for the behavior section */
export interface SettingsPageBehaviorProps {
  /** Whether auto-save is enabled */
  autoSave: boolean;
  /** Callback when auto-save changes */
  onAutoSaveChange: (checked: boolean) => void;
}

/** Props for the about section */
export interface SettingsPageAboutProps {
  /** Application version */
  version: string;
  /** Build type (Development, Production, etc.) */
  build: string;
}

/** Props for the save action */
export interface SettingsPageSaveProps {
  /** Whether there are unsaved changes */
  hasChanges: boolean;
  /** Whether save was successful (for success badge) */
  saveSuccess: boolean;
  /** Whether save is in progress */
  isSaving: boolean;
  /** Callback to save changes */
  onSave: () => void;
}

/**
 * Complete props for the SettingsPage component.
 *
 * This interface defines all data and callbacks needed to render the general settings.
 * The route component is responsible for providing these props from hooks.
 */
export interface SettingsPageProps {
  /** Whether data is loading */
  isLoading: boolean;

  /** Appearance section props */
  appearance: SettingsPageAppearanceProps;

  /** Behavior section props */
  behavior: SettingsPageBehaviorProps;

  /** About section props */
  about: SettingsPageAboutProps;

  /** Save action props */
  save: SettingsPageSaveProps;
}

// ============================================================================
// Component
// ============================================================================

/**
 * SettingsPage - Complete stateless general settings page component.
 *
 * This component receives all data and callbacks via props. It is purely
 * presentational, making it fully testable in Storybook with mocked data.
 *
 * @example
 * ```tsx
 * // In route component
 * function GeneralSettingsRoute() {
 *   const { theme, setTheme } = useTheme();
 *   const { data: settings, isLoading } = useAllSettings();
 *   const setSetting = useSetSetting();
 *
 *   const [autoSave, setAutoSave] = useState(true);
 *   const [hasChanges, setHasChanges] = useState(false);
 *   const [saveSuccess, setSaveSuccess] = useState(false);
 *
 *   const handleSave = async () => {
 *     await setSetting.mutateAsync({ key: 'autoSave', value: String(autoSave) });
 *     setHasChanges(false);
 *     setSaveSuccess(true);
 *   };
 *
 *   return (
 *     <SettingsPage
 *       isLoading={isLoading}
 *       appearance={{
 *         theme,
 *         onThemeChange: setTheme,
 *       }}
 *       behavior={{
 *         autoSave,
 *         onAutoSaveChange: (checked) => {
 *           setAutoSave(checked);
 *           setHasChanges(true);
 *         },
 *       }}
 *       about={{
 *         version: '0.1.0',
 *         build: 'Development',
 *       }}
 *       save={{
 *         hasChanges,
 *         saveSuccess,
 *         isSaving: setSetting.isPending,
 *         onSave: handleSave,
 *       }}
 *     />
 *   );
 * }
 * ```
 */
export function SettingsPage({ isLoading, appearance, behavior, about, save }: SettingsPageProps) {
  // Loading state
  if (isLoading) {
    return <SkeletonSettings sectionCount={3} fieldsPerSection={2} />;
  }

  return (
    <div className="space-y-6">
      {/* Status badges */}
      {(save.hasChanges || save.saveSuccess) && (
        <div className="flex items-center gap-2">
          {save.hasChanges && <Badge variant="warning">Unsaved changes</Badge>}
          {save.saveSuccess && <Badge variant="success">Saved successfully</Badge>}
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
            <ThemeToggle theme={appearance.theme} onThemeChange={appearance.onThemeChange} />
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
              checked={behavior.autoSave}
              onChange={(e) => behavior.onAutoSaveChange(e.target.checked)}
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
              <span className="text-[rgb(var(--foreground))]">{about.version}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[rgb(var(--muted-foreground))]">Build</span>
              <span className="text-[rgb(var(--foreground))]">{about.build}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Save button */}
      <div className="flex items-center gap-4 border-t border-[rgb(var(--border))] pt-6">
        <Button
          variant="primary"
          onClick={save.onSave}
          loading={save.isSaving}
          disabled={!save.hasChanges}
        >
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      </div>
    </div>
  );
}

SettingsPage.displayName = 'SettingsPage';
