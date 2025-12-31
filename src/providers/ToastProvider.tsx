/**
 * Toast Provider
 *
 * Combines the useToastProvider hook from @openflow/hooks
 * with the Toast UI component from @openflow/ui.
 *
 * This follows the pattern of ThemeProvider:
 * - State/logic in hooks package
 * - UI rendering in UI package
 * - Provider component at app level connects them
 */

import { ToastContext, useToastProvider } from '@openflow/hooks';
import { Toast } from '@openflow/ui';
import type { ReactNode } from 'react';

export interface ToastProviderProps {
  children: ReactNode;
}

/**
 * ToastProvider manages toast notifications across the application.
 * Wrap your app with this provider to enable toast functionality.
 *
 * @example
 * <ToastProvider>
 *   <App />
 * </ToastProvider>
 */
export function ToastProvider({ children }: ToastProviderProps) {
  const value = useToastProvider();

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast container with ARIA live region for accessibility */}
      <div
        role="region"
        aria-label="Notifications"
        className="pointer-events-none fixed bottom-0 right-0 z-50 flex max-h-screen w-full flex-col gap-2 p-4 sm:max-w-md"
      >
        {value.toasts.map((t) => (
          <Toast
            key={t.id}
            id={t.id}
            variant={t.variant}
            title={t.title}
            description={t.description}
            action={t.action}
            onDismiss={value.removeToast}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
