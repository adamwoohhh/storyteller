# Story Admin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `/admin/stories` with story-level viewing and logical deletion.

**Architecture:** Add `stories.deletedAt`, centralize active-story list/delete behavior in `lib/stories/admin.ts`, wire API routes to that behavior, and render a small admin page with a client-side delete action. Deleted stories stay in the database and are hidden from normal reads.

**Tech Stack:** Next.js App Router, Drizzle ORM, SQLite, Vitest, TypeScript, existing shadcn-style UI components.

---

## File Structure

- Modify `lib/db/schema.ts`: add nullable `deletedAt` column to `stories`.
- Create `lib/db/migrations/0001_story_deleted_at.sql`: add `deleted_at` to existing databases.
- Modify `lib/db/migrations/meta/_journal.json`: register the migration.
- Create `tests/unit/story-admin.test.ts`: service-level TDD coverage for listing, logical deletion, and hidden deleted stories.
- Create `lib/stories/admin.ts`: active story list, active story detail, logical delete helpers.
- Modify `app/api/stories/route.ts`: add `GET` list endpoint.
- Modify `app/api/stories/[id]/route.ts`: hide deleted stories from `GET`, add `DELETE`.
- Modify `lib/client/api.ts`: add `listStories` and `deleteStory`.
- Create `app/admin/stories/page.tsx`: admin list page.
- Create `app/admin/stories/StoryAdminClient.tsx`: client table and delete confirmation behavior.

## Task 1: Database Logical Delete Column

**Files:**
- Test: `tests/unit/story-admin.test.ts`
- Modify: `lib/db/schema.ts`
- Create: `lib/db/migrations/0001_story_deleted_at.sql`
- Modify: `lib/db/migrations/meta/_journal.json`

- [ ] **Step 1: Write the failing schema test**

Create `tests/unit/story-admin.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { makeTestDb } from "../helpers/db";
import { stories } from "@/lib/db/schema";

describe("story admin data model", () => {
  it("stores active stories with a null deletedAt value", async () => {
    const { db } = await makeTestDb();
    db.insert(stories)
      .values({ id: "story-active", inputMode: "structured", title: "Active" })
      .run();

    const row = db.select().from(stories).get();

    expect(row?.deletedAt).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test tests/unit/story-admin.test.ts`

Expected: FAIL because `deletedAt` is not part of the stories schema.

- [ ] **Step 3: Add the column and migration**

In `lib/db/schema.ts`, add this to `stories` after `updatedAt`:

```ts
  deletedAt: integer("deleted_at"),
```

Create `lib/db/migrations/0001_story_deleted_at.sql`:

```sql
ALTER TABLE `stories` ADD `deleted_at` integer;
```

Update `lib/db/migrations/meta/_journal.json` by appending:

```json
{
  "idx": 1,
  "version": "7",
  "when": 1778457600000,
  "tag": "0001_story_deleted_at",
  "breakpoints": true
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test tests/unit/story-admin.test.ts`

Expected: PASS.

## Task 2: Story Admin Service Behavior

**Files:**
- Test: `tests/unit/story-admin.test.ts`
- Create: `lib/stories/admin.ts`

- [ ] **Step 1: Add failing service tests**

Append to `tests/unit/story-admin.test.ts`:

```ts
import { characters, nodes } from "@/lib/db/schema";
import {
  getActiveStoryBundle,
  listActiveStories,
  logicallyDeleteStory,
} from "@/lib/stories/admin";

describe("story admin service", () => {
  it("lists only active stories with related counts, newest updated first", async () => {
    const { db } = await makeTestDb();
    db.insert(stories)
      .values({
        id: "older-active",
        inputMode: "structured",
        title: "Older",
        updatedAt: 10,
      })
      .run();
    db.insert(stories)
      .values({
        id: "newer-active",
        inputMode: "paste",
        title: "Newer",
        updatedAt: 20,
      })
      .run();
    db.insert(stories)
      .values({
        id: "deleted",
        inputMode: "paste",
        title: "Deleted",
        updatedAt: 30,
        deletedAt: 40,
      })
      .run();
    db.insert(characters).values({ id: "char-1", storyId: "newer-active", name: "Hero" }).run();
    db.insert(nodes).values({ id: "node-1", storyId: "newer-active", orderIndex: 0 }).run();

    const rows = listActiveStories(db);

    expect(rows.map((row) => row.id)).toEqual(["newer-active", "older-active"]);
    expect(rows[0]).toMatchObject({
      id: "newer-active",
      title: "Newer",
      characterCount: 1,
      nodeCount: 1,
    });
  });

  it("logically deletes a story while preserving related rows", async () => {
    const { db } = await makeTestDb();
    db.insert(stories).values({ id: "story-1", inputMode: "structured" }).run();
    db.insert(characters).values({ id: "char-1", storyId: "story-1", name: "Hero" }).run();
    db.insert(nodes).values({ id: "node-1", storyId: "story-1", orderIndex: 0 }).run();

    const result = logicallyDeleteStory(db, "story-1");

    const story = db.select().from(stories).get();
    expect(result).toEqual({ ok: true });
    expect(story?.deletedAt).toEqual(expect.any(Number));
    expect(db.select().from(characters).all()).toHaveLength(1);
    expect(db.select().from(nodes).all()).toHaveLength(1);
  });

  it("returns null for deleted stories in the active story bundle", async () => {
    const { db } = await makeTestDb();
    db.insert(stories)
      .values({ id: "deleted", inputMode: "structured", deletedAt: 10 })
      .run();

    expect(getActiveStoryBundle(db, "deleted")).toBeNull();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm test tests/unit/story-admin.test.ts`

Expected: FAIL because `lib/stories/admin.ts` does not exist.

- [ ] **Step 3: Implement the service**

Create `lib/stories/admin.ts` with exported helpers:

```ts
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { assets, characters, nodes, stories } from "@/lib/db/schema";
import type { DB } from "@/lib/db/client";

export function listActiveStories(db: DB) {
  return db
    .select({
      id: stories.id,
      title: stories.title,
      inputMode: stories.inputMode,
      status: stories.status,
      createdAt: stories.createdAt,
      updatedAt: stories.updatedAt,
      characterCount: sql<number>`count(distinct ${characters.id})`,
      nodeCount: sql<number>`count(distinct ${nodes.id})`,
    })
    .from(stories)
    .leftJoin(characters, eq(characters.storyId, stories.id))
    .leftJoin(nodes, eq(nodes.storyId, stories.id))
    .where(isNull(stories.deletedAt))
    .groupBy(stories.id)
    .orderBy(desc(stories.updatedAt))
    .all();
}

export function getActiveStoryBundle(db: DB, id: string) {
  const story = db
    .select()
    .from(stories)
    .where(and(eq(stories.id, id), isNull(stories.deletedAt)))
    .get();
  if (!story) return null;

  const cs = db.select().from(characters).where(eq(characters.storyId, id)).all();
  const ns = db
    .select()
    .from(nodes)
    .where(eq(nodes.storyId, id))
    .all()
    .sort((a, b) => a.orderIndex - b.orderIndex);
  const as = db.select().from(assets).where(eq(assets.storyId, id)).all();

  return { story, characters: cs, nodes: ns, assets: as };
}

export function logicallyDeleteStory(db: DB, id: string) {
  const story = db.select({ id: stories.id }).from(stories).where(eq(stories.id, id)).get();
  if (!story) return null;

  db.update(stories)
    .set({ deletedAt: sql`(unixepoch())`, updatedAt: sql`(unixepoch())` })
    .where(eq(stories.id, id))
    .run();

  return { ok: true as const };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm test tests/unit/story-admin.test.ts`

Expected: PASS.

## Task 3: API Endpoints

**Files:**
- Modify: `app/api/stories/route.ts`
- Modify: `app/api/stories/[id]/route.ts`
- Modify: `lib/client/api.ts`

- [ ] **Step 1: Wire the list API**

In `app/api/stories/route.ts`, import `listActiveStories` and add:

```ts
export async function GET() {
  const { db } = await getRuntime();
  return NextResponse.json({ stories: listActiveStories(db) });
}
```

- [ ] **Step 2: Wire the detail/delete API**

In `app/api/stories/[id]/route.ts`, use `getActiveStoryBundle` in `GET` and add `DELETE` with `logicallyDeleteStory`. Missing rows return 404.

- [ ] **Step 3: Add client helpers**

In `lib/client/api.ts`, add:

```ts
  listStories: () => jsonReq<{ stories: Any[] }>("GET", "/api/stories"),
  deleteStory: (id: string) => jsonReq<{ ok: true }>("DELETE", `/api/stories/${id}`),
```

- [ ] **Step 4: Run targeted tests**

Run: `pnpm test tests/unit/story-admin.test.ts`

Expected: PASS.

## Task 4: Admin Page UI

**Files:**
- Create: `app/admin/stories/page.tsx`
- Create: `app/admin/stories/StoryAdminClient.tsx`

- [ ] **Step 1: Create the server page**

Create `app/admin/stories/page.tsx` to call `getRuntime()`, load `listActiveStories(db)`, and render `StoryAdminClient`.

- [ ] **Step 2: Create the client table**

Create `app/admin/stories/StoryAdminClient.tsx` with:

- A header containing "故事管理" and a link back to `/`
- Empty state when the list is empty
- Table-like rows with title, status, input mode, counts, created/updated times
- "查看" link to `/s/{id}`
- "删除" button that opens `window.confirm`, calls `api.deleteStory(id)`, shows `toast`, then `router.refresh()`

- [ ] **Step 3: Run verification**

Run: `pnpm run typecheck`

Expected: PASS.

Run: `pnpm test tests/unit/story-admin.test.ts`

Expected: PASS.

## Task 5: Final Verification

**Files:**
- All changed files

- [ ] **Step 1: Run full checks**

Run: `pnpm test`

Expected: PASS.

Run: `pnpm run typecheck`

Expected: PASS.

- [ ] **Step 2: Review git diff**

Run: `git diff --stat`

Expected: changes are limited to story admin schema, service, APIs, page, tests, and docs.
