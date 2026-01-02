# Primitives Package

## Purpose

Accessible HTML element wrappers. This is the only package that uses raw HTML tags. All other packages use these primitives.

## Primitive Pattern

Each primitive wraps a semantic HTML element with accessibility defaults, responsive props, and consistent styling patterns.

## Accessibility

Primitives enforce accessibility by requiring necessary attributes (alt text on images, labels on sections) and providing sensible defaults.

## Responsive Values

Props support responsive values for breakpoint-aware styling. This eliminates manual media query handling.

## Ref Forwarding

All primitives forward refs for focus management and DOM access. Use forwardRef consistently.

## Styling

Primitives accept className for Tailwind styling. They don't include visual styling - that comes from the UI layer.

## Usage

Only the atoms layer imports from primitives. Higher UI layers compose atoms, never using primitives directly.
