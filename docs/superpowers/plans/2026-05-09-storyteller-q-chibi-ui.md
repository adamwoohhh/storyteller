# Storyteller Q Chibi UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the Storyteller app into a centered, cheerful Q-style anime UI inspired by Kindsight colors while preserving all current workflows.

**Architecture:** Add a small shared UI shell for workflow pages, define global theme utilities in Tailwind CSS, and restyle existing page/components in place. Keep API, data flow, and route behavior unchanged.

**Tech Stack:** Next.js App Router, React 19, Tailwind CSS v4, Base UI/shadcn-style local components, React Flow.

---

### Task 1: Theme And Shared Shell

**Files:**
- Modify: `app/globals.css`
- Modify: `components/ui/button.tsx`
- Modify: `components/ui/card.tsx`
- Modify: `components/ui/input.tsx`
- Modify: `components/ui/textarea.tsx`
- Modify: `components/ui/tabs.tsx`
- Create: `app/s/[uuid]/_components/StepFrame.tsx`

- [ ] **Step 1: Add warm Q-style CSS variables and utilities**

Define warm cream backgrounds, deep brown text, maroon primary, earthy green secondary, sticker shadows, and a centered page background utility in `app/globals.css`.

- [ ] **Step 2: Restyle primitive UI components**

Update local Button, Card, Input, Textarea, and Tabs class strings to use the warm theme, rounded forms, sticker-like default buttons, and readable focus states.

- [ ] **Step 3: Create workflow step shell**

Create `StepFrame` with `title`, `description`, `currentStep`, optional `children`, and step chips for story/extract/storyboard/style/cds/render.

- [ ] **Step 4: Run typecheck**

Run: `pnpm run typecheck`
Expected: PASS.

### Task 2: Home And Input Forms

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/_components/InputModeStructured.tsx`
- Modify: `app/_components/InputModePaste.tsx`

- [ ] **Step 1: Restyle the home route**

Replace the plain max-width layout with a centered story creation card, compact brand mark, Chinese headline, warm tabs, and prominent primary CTA.

- [ ] **Step 2: Restyle structured input form**

Use warm spacing, friendly labels, sticker-like character cards, and responsive controls while preserving all state updates.

- [ ] **Step 3: Restyle paste input form**

Use the same form rhythm and warm textarea styling while preserving all state updates.

- [ ] **Step 4: Run typecheck**

Run: `pnpm run typecheck`
Expected: PASS.

### Task 3: Workflow Steps

**Files:**
- Modify: `app/s/[uuid]/_components/StepShell.tsx`
- Modify: `app/s/[uuid]/_components/StepStoryText.tsx`
- Modify: `app/s/[uuid]/_components/StepExtract.tsx`
- Modify: `app/s/[uuid]/_components/StepStoryboard.tsx`
- Modify: `app/s/[uuid]/_components/StepArtStyle.tsx`
- Modify: `app/s/[uuid]/_components/StepCDS.tsx`
- Modify: `app/s/[uuid]/_components/StepRender.tsx`

- [ ] **Step 1: Wrap each step in StepFrame**

Replace repeated `main` shells with `StepFrame`, passing the correct title, description, and current step.

- [ ] **Step 2: Restyle step content cards and states**

Update cards, streaming boxes, running/error/empty states, style selection cards, CDS image panels, and render progress copy to match the Q-style design.

- [ ] **Step 3: Preserve actions and behavior**

Keep all API calls, state transitions, route pushes, file uploads, and disabled conditions unchanged.

- [ ] **Step 4: Run typecheck**

Run: `pnpm run typecheck`
Expected: PASS.

### Task 4: Reader And Canvas

**Files:**
- Modify: `app/s/[uuid]/_components/ReadView.tsx`
- Modify: `app/s/[uuid]/_components/EditorCanvas.tsx`
- Modify: `app/s/[uuid]/_components/StoryNode.tsx`

- [ ] **Step 1: Restyle read mode**

Use a warm sticky header, centered reader column, rounded picture panels, and cute empty states.

- [ ] **Step 2: Restyle editor canvas**

Keep React Flow full-height but add a warm background, centered rounded header, softer edges, and themed controls.

- [ ] **Step 3: Restyle story node cards**

Use warm sticker cards, rounded image areas, visible empty/loading states, and themed regenerate action.

- [ ] **Step 4: Run typecheck**

Run: `pnpm run typecheck`
Expected: PASS.

### Task 5: Verification

**Files:**
- No new production files expected.

- [ ] **Step 1: Run lint**

Run: `pnpm run lint`
Expected: PASS.

- [ ] **Step 2: Run typecheck**

Run: `pnpm run typecheck`
Expected: PASS.

- [ ] **Step 3: Start dev server**

Run: `pnpm run dev`
Expected: Next dev server starts successfully.

- [ ] **Step 4: Browser review**

Open `/` in the in-app browser and verify centered layout, warm Kindsight-inspired palette, Q-style rounded/sticker elements, and mobile-friendly spacing.
