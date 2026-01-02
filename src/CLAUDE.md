# Application Layer

## Route Organization

Routes are the top-level orchestration layer. They compose UI components with hooks to create pages. Routes should read like pseudocode describing the page structure.

## Provider Composition

Providers are composed at the app level, not in individual routes. Query client, theme, toast notifications, and router are all set up once at the top.

## Data Fetching Pattern

Routes use hooks for data, never queries directly. Hooks handle loading states, error states, caching, and invalidation. Routes just consume the hook's return value.

## State Management

Route-level state should be minimal. Prefer:
- URL state for navigation/filters
- Server state via TanStack Query
- Local component state for UI-only concerns

Avoid prop drilling - if data needs to flow deep, consider extracting to a hook or using context.

## Loading/Error/Empty States

Every data-dependent route must handle:
- Loading state with appropriate skeleton
- Error state with retry action
- Empty state with call-to-action

Use the UI package's state components for consistency.
