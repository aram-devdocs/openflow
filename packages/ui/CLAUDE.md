# UI Package

## Purpose

Stateless React components organized by atomic design. Components are pure functions of props - they render UI, nothing else.

## Atomic Design Hierarchy

- **Atoms:** Basic building blocks using primitives
- **Molecules:** Compositions of atoms
- **Organisms:** Complex compositions of molecules
- **Templates:** Page layout patterns
- **Pages:** Full page compositions

Higher levels compose lower levels, never the reverse.

## Stateless Philosophy

Components receive data and callbacks as props. They don't fetch data, manage state, or contain business logic.

## Accessibility

All components meet WCAG 2.1 Level AA. Include proper ARIA attributes, focus management, and keyboard navigation.

## Ref Forwarding

All components support refs via forwardRef. This enables focus management and imperative handles.

## Testing

Components are testable in Storybook isolation. No mocking needed - just pass props.

See layer-specific CLAUDE.md files for patterns at each level.
