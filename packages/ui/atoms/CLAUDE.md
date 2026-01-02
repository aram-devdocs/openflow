# Atoms

## Purpose

Basic building blocks that wrap primitives with styling. Atoms are the smallest reusable UI units.

## Primitives Only

Atoms import from primitives package only, never raw HTML. This ensures accessibility and consistency.

## Composition

Atoms are composed into molecules. They should be small, focused, and reusable across many contexts.

## Styling

Apply visual styling through Tailwind classes. Use design tokens for colors, spacing, typography.

## Props

Keep prop interfaces minimal. Accept children, className, and element-specific props.

## Examples

Buttons, inputs, labels, icons, badges, links - single-purpose elements.
