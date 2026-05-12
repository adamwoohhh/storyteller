# Art Style Structured Prompts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add structured art style prompts and selection-page preview images to the art style picker.

**Architecture:** Keep all style metadata and prompt resolution in `lib/art-styles.ts`. Keep preview images as public UI-only paths consumed by `StepArtStyle`; do not change provider APIs, database schema, or render pipelines.

**Tech Stack:** Next.js App Router, React, TypeScript, Vitest, Tailwind CSS.

---

### Task 1: Style Metadata And Prompt Resolution

**Files:**
- Modify: `lib/art-styles.ts`
- Modify: `tests/unit/art-styles.test.ts`

- [ ] **Step 1: Write failing tests**

Add tests that expect `structuredPrompt` and `previewImage`, and expect structured prompts to resolve with newline-separated lines plus optional user additions.

```ts
it("exposes structured prompt metadata and preview images", () => {
  const s = getArtStyle("fzk");
  expect(s?.structuredPrompt).toEqual(
    expect.arrayContaining(["画风：中国水墨、文人画、传统人物小品、古风插画"]),
  );
  expect(s?.previewImage).toBe("/art-styles/fzk.png");
});

it("resolves structured prompts before user additions", () => {
  const resolved = resolveArtStylePrompt("fzk", "偏暖色调");
  expect(resolved).toContain("画风：中国水墨、文人画、传统人物小品、古风插画");
  expect(resolved).toContain("\n");
  expect(resolved.endsWith("偏暖色调")).toBe(true);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test tests/unit/art-styles.test.ts`

Expected: FAIL because `structuredPrompt` and `previewImage` are not implemented yet.

- [ ] **Step 3: Implement metadata and resolver**

Update the `ArtStyle` interface to use:

```ts
structuredPrompt?: string[];
previewImage?: string;
```

Rename the existing `fzk` fields from `structed_prompt` to `structuredPrompt` and from `ref` to `previewImage`. Resolve prompts by joining `structuredPrompt` with `\n` when present, otherwise using `prompt`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test tests/unit/art-styles.test.ts`

Expected: PASS.

### Task 2: Gallery-First Selector UI

**Files:**
- Modify: `app/s/[uuid]/_components/StepArtStyle.tsx`

- [ ] **Step 1: Update card rendering**

Add helpers inside the component file:

```ts
function getStyleSummary(style: ArtStyle): string {
  if (style.structuredPrompt?.length) return style.structuredPrompt.slice(0, 3).join("\n");
  return style.prompt || "完全自定义";
}
```

Render `style.previewImage` at the top of each card when present, using a plain `img` element with `alt={`${style.name} 示例图`}`.

- [ ] **Step 2: Preserve prompt preview behavior**

Keep the existing `resolved = resolveArtStylePrompt(selectedKey, extra)` preview and `api.cds` payload unchanged so only the final prompt string is persisted.

- [ ] **Step 3: Run focused verification**

Run: `pnpm test tests/unit/art-styles.test.ts`

Expected: PASS.

- [ ] **Step 4: Run typecheck**

Run: `pnpm run typecheck`

Expected: PASS.

