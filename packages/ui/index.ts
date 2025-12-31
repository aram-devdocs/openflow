/**
 * @openflow/ui - Stateless UI Components
 *
 * This package contains all UI components following atomic design principles.
 * Components are STATELESS - they receive data via props and emit actions via callbacks.
 *
 * FORBIDDEN in UI components:
 * - invoke() calls
 * - useQuery / useMutation hooks
 * - Business logic
 * - Global state access
 *
 * All components must be testable in Storybook with just props.
 */

// Atoms - Basic building blocks
export * from './atoms';

// Molecules - Composite components from atoms
export * from './molecules';

// Organisms - Complex components with business context
export * from './organisms';

// Templates - Page layout structures
export * from './templates';

// Pages - Complete page components (stateless, props-only)
export * from './pages';
