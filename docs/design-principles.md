# Design Principles

## Feature-Owned Code Organization

Keep feature-specific UI code and its private helper code together under one feature directory.

When a component grows companion logic that is only used by that component or feature, organize it as a directory instead of scattering sibling files in `_components`. The directory should expose the feature component from `index.tsx`, and keep private helpers, actions, and small types next to it.

Recommended shape:

```text
app/s/[uuid]/_components/StepCDS/
  index.tsx
  step-cds-actions.ts
```

Use `_components` for shared or directly importable view components. Avoid placing non-component helper files directly beside unrelated components unless they are broadly shared by that directory.

If a helper becomes shared by multiple features, move it to a clearly shared location such as `lib/` or a named shared module instead of leaving it inside a single feature directory.
