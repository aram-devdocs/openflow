/**
 * Webview Bounds Fix Provider
 *
 * This provider works around a known Tauri/WebKit bug on macOS where
 * mouse coordinates become misaligned after fullscreen toggle or window resize.
 *
 * The bug is documented in:
 * - https://github.com/tauri-apps/tauri/issues/11788
 * - https://github.com/tauri-apps/wry/issues/405
 *
 * The fix works by forcing the browser to recalculate the viewport
 * after window state changes.
 */

import { Window } from '@tauri-apps/api/window';
import { type PropsWithChildren, useEffect } from 'react';

/**
 * Forces the webview to recalculate its bounds.
 * This fixes mouse coordinate misalignment after fullscreen/resize.
 */
function forceViewportRecalculation(): void {
  // Force a layout recalculation by toggling a style that affects layout
  const root = document.documentElement;
  const originalTransform = root.style.transform;

  // Apply a minimal transform then remove it
  // This forces WebKit to recalculate the viewport bounds
  root.style.transform = 'translateZ(0)';

  // Use requestAnimationFrame to ensure the style is applied before reverting
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      root.style.transform = originalTransform || '';
    });
  });
}

export interface WebviewBoundsProviderProps extends PropsWithChildren {
  /**
   * Whether to enable the workaround (default: true)
   * Set to false to disable if the bug is fixed in a future Tauri version
   */
  enabled?: boolean;
}

/**
 * Provider that fixes mouse coordinate misalignment on macOS
 * after window fullscreen toggle or resize operations.
 */
export function WebviewBoundsProvider({ children, enabled = true }: WebviewBoundsProviderProps) {
  useEffect(() => {
    if (!enabled) return;

    const appWindow = Window.getCurrent();
    const cleanupFunctions: Array<() => void> = [];

    async function setupListeners() {
      try {
        // Listen for window resize events
        const unlistenResize = await appWindow.onResized(() => {
          // Small delay to let the window settle
          setTimeout(forceViewportRecalculation, 50);
        });
        cleanupFunctions.push(unlistenResize);

        // Listen for fullscreen state changes (via move event as a proxy)
        // Note: There's no direct fullscreen change event, but resize is triggered
        const unlistenMove = await appWindow.onMoved(() => {
          // Window move can also cause coordinate issues on multi-monitor setups
          setTimeout(forceViewportRecalculation, 50);
        });
        cleanupFunctions.push(unlistenMove);

        // Also listen for focus events as fullscreen exit triggers focus
        const unlistenFocus = await appWindow.onFocusChanged(({ payload: focused }) => {
          if (focused) {
            // Delay slightly to ensure window is fully rendered
            setTimeout(forceViewportRecalculation, 100);
          }
        });
        cleanupFunctions.push(unlistenFocus);
      } catch (error) {
        // Gracefully handle if window events aren't available (e.g., in tests)
        console.warn('WebviewBoundsProvider: Could not setup window listeners', error);
      }
    }

    setupListeners();

    return () => {
      for (const cleanup of cleanupFunctions) {
        cleanup();
      }
    };
  }, [enabled]);

  return <>{children}</>;
}
