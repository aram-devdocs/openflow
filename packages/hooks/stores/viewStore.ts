/**
 * ViewStore - UI-only state management using Zustand
 *
 * This store contains ONLY UI preferences and view state.
 * It does NOT contain any business state - all business data
 * comes from TanStack Query hooks that fetch from the backend.
 *
 * Key Principle: Frontend is a pure view layer.
 * - UI state (selections, panel sizes, theme) lives here
 * - Business state (tasks, sessions, events) comes from queries
 * - Backend is the single source of truth for all business data
 *
 * @module stores/viewStore
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================================================
// Types
// ============================================================================

/**
 * View state for the current UI preferences.
 * All of these are UI-only concerns that don't affect backend state.
 */
export interface ViewState {
  // Selection state (what the user is currently viewing)
  /** Currently selected task ID in the UI */
  selectedTaskId: string | null;
  /** Currently selected chat ID in the UI */
  selectedChatId: string | null;
  /** Currently selected step index within a task */
  selectedStepIndex: number;

  // Panel visibility
  /** Whether the sidebar is open */
  sidebarOpen: boolean;
  /** Whether the terminal panel is visible */
  terminalVisible: boolean;
  /** Whether raw output mode is enabled */
  showRawOutput: boolean;

  // View preferences
  /** Active tab in the task detail view */
  activeTab: string;
  /** Chat view mode (clean or terminal) */
  chatViewMode: 'clean' | 'terminal';
}

/**
 * Actions for modifying view state.
 */
export interface ViewActions {
  // Selection actions
  /** Select a task by ID */
  selectTask: (id: string | null) => void;
  /** Select a chat by ID */
  selectChat: (id: string | null) => void;
  /** Select a step by index */
  selectStep: (index: number) => void;
  /** Clear all selections */
  clearSelections: () => void;

  // Panel toggle actions
  /** Toggle sidebar visibility */
  toggleSidebar: () => void;
  /** Set sidebar visibility directly */
  setSidebarOpen: (open: boolean) => void;
  /** Toggle terminal visibility */
  toggleTerminal: () => void;
  /** Set terminal visibility directly */
  setTerminalVisible: (visible: boolean) => void;
  /** Toggle raw output mode */
  toggleRawOutput: () => void;
  /** Set raw output mode directly */
  setShowRawOutput: (show: boolean) => void;

  // View preference actions
  /** Set the active tab */
  setActiveTab: (tab: string) => void;
  /** Set the chat view mode */
  setChatViewMode: (mode: 'clean' | 'terminal') => void;
  /** Toggle chat view mode between clean and terminal */
  toggleChatViewMode: () => void;

  // Reset action
  /** Reset all view state to defaults */
  reset: () => void;
}

// ============================================================================
// Initial State
// ============================================================================

const initialState: ViewState = {
  // Selection state
  selectedTaskId: null,
  selectedChatId: null,
  selectedStepIndex: 0,

  // Panel visibility
  sidebarOpen: true,
  terminalVisible: false,
  showRawOutput: false,

  // View preferences
  activeTab: 'steps',
  chatViewMode: 'clean',
};

// ============================================================================
// Store Definition
// ============================================================================

/**
 * Zustand store for UI-only view state.
 *
 * Uses persist middleware to save preferences to localStorage.
 * Only persists a subset of state (panel visibility, view preferences).
 * Selection state is NOT persisted since it's ephemeral.
 *
 * @example
 * ```tsx
 * // Use the store hook directly
 * const { selectedTaskId, selectTask } = useViewStore();
 *
 * // Or use selectors for better performance
 * const selectedTaskId = useViewStore((s) => s.selectedTaskId);
 * const selectTask = useViewStore((s) => s.selectTask);
 *
 * // Toggle sidebar
 * const toggleSidebar = useViewStore((s) => s.toggleSidebar);
 * toggleSidebar();
 *
 * // Select a task
 * selectTask('task-123');
 * ```
 */
export const useViewStore = create<ViewState & ViewActions>()(
  persist(
    (set) => ({
      // Initial state
      ...initialState,

      // Selection actions
      selectTask: (id) =>
        set({
          selectedTaskId: id,
          // Reset step index when selecting a new task
          selectedStepIndex: 0,
        }),

      selectChat: (id) =>
        set({
          selectedChatId: id,
        }),

      selectStep: (index) =>
        set({
          selectedStepIndex: index,
        }),

      clearSelections: () =>
        set({
          selectedTaskId: null,
          selectedChatId: null,
          selectedStepIndex: 0,
        }),

      // Panel toggle actions
      toggleSidebar: () =>
        set((state) => ({
          sidebarOpen: !state.sidebarOpen,
        })),

      setSidebarOpen: (open) =>
        set({
          sidebarOpen: open,
        }),

      toggleTerminal: () =>
        set((state) => ({
          terminalVisible: !state.terminalVisible,
        })),

      setTerminalVisible: (visible) =>
        set({
          terminalVisible: visible,
        }),

      toggleRawOutput: () =>
        set((state) => ({
          showRawOutput: !state.showRawOutput,
        })),

      setShowRawOutput: (show) =>
        set({
          showRawOutput: show,
        }),

      // View preference actions
      setActiveTab: (tab) =>
        set({
          activeTab: tab,
        }),

      setChatViewMode: (mode) =>
        set({
          chatViewMode: mode,
        }),

      toggleChatViewMode: () =>
        set((state) => ({
          chatViewMode: state.chatViewMode === 'clean' ? 'terminal' : 'clean',
        })),

      // Reset action
      reset: () => set(initialState),
    }),
    {
      name: 'openflow-view-store',
      // Only persist UI preferences, not ephemeral selections
      partialize: (state) => ({
        sidebarOpen: state.sidebarOpen,
        terminalVisible: state.terminalVisible,
        showRawOutput: state.showRawOutput,
        activeTab: state.activeTab,
        chatViewMode: state.chatViewMode,
      }),
    }
  )
);

// ============================================================================
// Selector Hooks (Optional convenience hooks)
// ============================================================================

/**
 * Get the current task selection.
 * Use this when you only need the selected task ID to avoid re-renders.
 */
export const useSelectedTaskId = () => useViewStore((s) => s.selectedTaskId);

/**
 * Get the current chat selection.
 */
export const useSelectedChatId = () => useViewStore((s) => s.selectedChatId);

/**
 * Get the current step selection.
 */
export const useSelectedStepIndex = () => useViewStore((s) => s.selectedStepIndex);

/**
 * Get sidebar visibility state.
 */
export const useSidebarOpen = () => useViewStore((s) => s.sidebarOpen);

/**
 * Get terminal visibility state.
 */
export const useTerminalVisible = () => useViewStore((s) => s.terminalVisible);

/**
 * Get raw output mode state.
 */
export const useShowRawOutput = () => useViewStore((s) => s.showRawOutput);

/**
 * Get the active tab.
 */
export const useActiveTab = () => useViewStore((s) => s.activeTab);

/**
 * Get the chat view mode.
 */
export const useChatViewMode = () => useViewStore((s) => s.chatViewMode);
