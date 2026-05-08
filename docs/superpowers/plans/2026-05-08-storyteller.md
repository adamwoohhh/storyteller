# Storyteller Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Next.js web application that turns user story input into an illustrated picture book through a 6-stage pipeline (story text → storyboard → art style → CDS → scene images → canvas display).

**Architecture:** Single Next.js (App Router) repo with TypeScript. SQLite + Drizzle for state, local filesystem for images, in-memory job queue with SSE for long-running operations. Provider interfaces (`TextProvider`, `ImageProvider`) decouple pipeline from concrete OpenAI implementation; fake providers used in tests. Frontend uses Tailwind + shadcn/ui, React Flow for the editor canvas, linear scroll for read mode.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, Drizzle ORM, better-sqlite3, OpenAI SDK, React Flow, Vitest, MSW, Playwright, Zod.

---

## Spec Reference

All decisions trace to `docs/superpowers/specs/2026-05-08-storyteller-design.md`. Read it first if you have not.

## Conventions

- **Package manager:** `pnpm`. Every install command uses `pnpm add ...`.
- **Test runner:** `pnpm test` runs Vitest. `pnpm test -- <file>` for a single file.
- **Type check:** `pnpm typecheck` runs `tsc --noEmit`.
- **Lint:** `pnpm lint`.
- **Commit style:** Conventional Commits (`feat:`, `fix:`, `chore:`, `test:`, `docs:`, `refactor:`).
- **TDD discipline:** every functional task has a failing test first, then minimal code to pass, then commit. UI tasks rely on E2E (Phase 6) instead of per-component tests.
- **Working directory** for all shell commands: `/Users/adamwu/CodeForFun/storyteller`.
- After every task, run `pnpm typecheck && pnpm test` before committing unless the task explicitly calls out a different verification. Commit only on green.

---

## Phase 0 — Project Initialization

### Task 0.1: Scaffold Next.js + TypeScript + Tailwind

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `tailwind.config.ts`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`

- [ ] **Step 1: Run create-next-app non-interactively**

```bash
pnpm dlx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias "@/*" --use-pnpm --turbopack --no-experimental
```

If prompted to overwrite existing files (LICENSE, README.md, .gitignore), choose **No** and merge manually after.

- [ ] **Step 2: Verify dev server starts**

```bash
pnpm dev
```

Expected: server up on `http://localhost:3000`, default Next.js page renders. Stop with Ctrl-C.

- [ ] **Step 3: Replace default home page with placeholder**

`app/page.tsx`:
```tsx
export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <h1 className="text-3xl font-bold">Storyteller</h1>
    </main>
  );
}
```

- [ ] **Step 4: Update tsconfig strictness**

`tsconfig.json` — ensure these compiler options exist:
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

- [ ] **Step 5: Verify typecheck**

```bash
pnpm typecheck
```

Add to `package.json` scripts if missing:
```json
"typecheck": "tsc --noEmit"
```

Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "chore: scaffold next.js project with typescript and tailwind"
```

---

### Task 0.2: Install shadcn/ui and base components

**Files:**
- Create: `components.json`, `lib/utils.ts`, `components/ui/button.tsx`, `components/ui/input.tsx`, `components/ui/textarea.tsx`, `components/ui/card.tsx`, `components/ui/label.tsx`, `components/ui/dialog.tsx`, `components/ui/tabs.tsx`, `components/ui/progress.tsx`, `components/ui/toast.tsx`, `components/ui/sonner.tsx`

- [ ] **Step 1: Initialize shadcn**

```bash
pnpm dlx shadcn@latest init -d
```

Accept defaults: New York style, Slate base color, CSS variables.

- [ ] **Step 2: Install components needed across the app**

```bash
pnpm dlx shadcn@latest add button input textarea card label dialog tabs progress sonner separator badge tooltip
```

- [ ] **Step 3: Wire up sonner toasts in layout**

`app/layout.tsx`:
```tsx
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

export const metadata = { title: "Storyteller", description: "故事绘本生成器" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh">
      <body>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Verify typecheck and build**

```bash
pnpm typecheck && pnpm build
```

Expected: clean build.

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "chore: install shadcn/ui base components"
```

---

### Task 0.3: Install runtime + dev dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install runtime dependencies**

```bash
pnpm add openai better-sqlite3 drizzle-orm zod nanoid p-limit
pnpm add -D drizzle-kit @types/better-sqlite3 vitest @vitest/coverage-v8 msw @playwright/test
```

- [ ] **Step 2: Add scripts to package.json**

Add these under `"scripts"`:
```json
"test": "vitest run",
"test:watch": "vitest",
"test:e2e": "playwright test",
"db:generate": "drizzle-kit generate",
"db:migrate": "tsx scripts/migrate.ts",
"eval": "tsx evals/runner.ts"
```

Install `tsx` for the migrate/eval scripts:
```bash
pnpm add -D tsx
```

- [ ] **Step 3: Verify install**

```bash
pnpm install
pnpm typecheck
```

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: install runtime and dev dependencies"
```

---

### Task 0.4: Configure .gitignore and .env example

**Files:**
- Modify: `.gitignore`
- Create: `.env.local.example`

- [ ] **Step 1: Update .gitignore**

Append to existing `.gitignore`:
```
# Storyteller runtime data
/data/

# Env
.env.local
.env.eval

# Test artifacts
/test-results/
/playwright-report/
/playwright/.cache/
/coverage/
```

- [ ] **Step 2: Create .env.local.example**

`.env.local.example`:
```
OPENAI_API_KEY=sk-replace-me
OPENAI_TEXT_MODEL=gpt-5
OPENAI_IMAGE_MODEL=gpt-image-1
JOB_CONCURRENCY=3
PROVIDER_MODE=openai
DATABASE_URL=file:./data/storyteller.db
STORAGE_DIR=./data/images
```

- [ ] **Step 3: Make sure data/ does not exist in git index**

```bash
git rm -r --cached data 2>/dev/null || true
mkdir -p data/images
```

- [ ] **Step 4: Commit**

```bash
git add .gitignore .env.local.example
git commit -m "chore: configure gitignore and env example"
```

---

### Task 0.5: Configure Vitest

**Files:**
- Create: `vitest.config.ts`, `tests/setup.ts`

- [ ] **Step 1: Create vitest config**

`vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/unit/**/*.test.ts", "lib/**/*.test.ts"],
    coverage: { reporter: ["text", "html"] },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./") },
  },
});
```

- [ ] **Step 2: Create test setup file**

`tests/setup.ts`:
```ts
import { afterEach, beforeAll } from "vitest";

beforeAll(() => {
  process.env.PROVIDER_MODE = "fake";
  process.env.OPENAI_API_KEY = "test-key";
  process.env.JOB_CONCURRENCY = "2";
});

afterEach(() => {
  // Reset module-level singletons in tests by re-importing where needed.
});
```

- [ ] **Step 3: Add a smoke test**

`tests/unit/smoke.test.ts`:
```ts
import { describe, expect, it } from "vitest";

describe("smoke", () => {
  it("runs", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 4: Run tests**

```bash
pnpm test
```

Expected: 1 passing.

- [ ] **Step 5: Commit**

```bash
git add vitest.config.ts tests/setup.ts tests/unit/smoke.test.ts
git commit -m "test: configure vitest with smoke test"
```

---

## Phase 1 — Configuration & Infrastructure

### Task 1.1: Config loader with Zod validation

**Files:**
- Create: `lib/config.ts`
- Test: `tests/unit/config.test.ts`

- [ ] **Step 1: Write failing test**

`tests/unit/config.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { loadConfig } from "@/lib/config";

describe("config", () => {
  it("parses required env vars", () => {
    const cfg = loadConfig({
      OPENAI_API_KEY: "sk-xxx",
      OPENAI_TEXT_MODEL: "gpt-5",
      OPENAI_IMAGE_MODEL: "gpt-image-1",
      JOB_CONCURRENCY: "3",
      PROVIDER_MODE: "openai",
      DATABASE_URL: "file:./data/storyteller.db",
      STORAGE_DIR: "./data/images",
    });
    expect(cfg.providerMode).toBe("openai");
    expect(cfg.jobConcurrency).toBe(3);
    expect(cfg.openai.apiKey).toBe("sk-xxx");
  });

  it("defaults concurrency and provider mode", () => {
    const cfg = loadConfig({
      OPENAI_API_KEY: "sk-x",
      OPENAI_TEXT_MODEL: "gpt-5",
      OPENAI_IMAGE_MODEL: "gpt-image-1",
      DATABASE_URL: "file:./data/x.db",
      STORAGE_DIR: "./data/images",
    });
    expect(cfg.providerMode).toBe("openai");
    expect(cfg.jobConcurrency).toBe(3);
  });

  it("rejects missing api key when mode is openai", () => {
    expect(() => loadConfig({
      PROVIDER_MODE: "openai",
      OPENAI_TEXT_MODEL: "gpt-5",
      OPENAI_IMAGE_MODEL: "gpt-image-1",
      DATABASE_URL: "file:./data/x.db",
      STORAGE_DIR: "./data/images",
    })).toThrow(/OPENAI_API_KEY/);
  });

  it("allows missing api key when fake", () => {
    const cfg = loadConfig({
      PROVIDER_MODE: "fake",
      OPENAI_TEXT_MODEL: "gpt-5",
      OPENAI_IMAGE_MODEL: "gpt-image-1",
      DATABASE_URL: "file:./data/x.db",
      STORAGE_DIR: "./data/images",
    });
    expect(cfg.openai.apiKey).toBe("");
  });
});
```

- [ ] **Step 2: Run test to verify fail**

```bash
pnpm test -- config
```

Expected: FAIL — `lib/config.ts` does not exist.

- [ ] **Step 3: Implement config**

`lib/config.ts`:
```ts
import { z } from "zod";

const Schema = z.object({
  OPENAI_API_KEY: z.string().optional().default(""),
  OPENAI_TEXT_MODEL: z.string().min(1),
  OPENAI_IMAGE_MODEL: z.string().min(1),
  JOB_CONCURRENCY: z.coerce.number().int().positive().default(3),
  PROVIDER_MODE: z.enum(["openai", "fake"]).default("openai"),
  DATABASE_URL: z.string().min(1),
  STORAGE_DIR: z.string().min(1),
});

export type Config = {
  providerMode: "openai" | "fake";
  jobConcurrency: number;
  openai: { apiKey: string; textModel: string; imageModel: string };
  databaseUrl: string;
  storageDir: string;
};

export function loadConfig(env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env): Config {
  const parsed = Schema.parse(env);
  if (parsed.PROVIDER_MODE === "openai" && !parsed.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is required when PROVIDER_MODE=openai");
  }
  return {
    providerMode: parsed.PROVIDER_MODE,
    jobConcurrency: parsed.JOB_CONCURRENCY,
    openai: {
      apiKey: parsed.OPENAI_API_KEY,
      textModel: parsed.OPENAI_TEXT_MODEL,
      imageModel: parsed.OPENAI_IMAGE_MODEL,
    },
    databaseUrl: parsed.DATABASE_URL,
    storageDir: parsed.STORAGE_DIR,
  };
}

let cached: Config | null = null;
export function getConfig(): Config {
  if (!cached) cached = loadConfig();
  return cached;
}
```

- [ ] **Step 4: Run test, verify pass**

```bash
pnpm test -- config
```

Expected: 4 passing.

- [ ] **Step 5: Commit**

```bash
git add lib/config.ts tests/unit/config.test.ts
git commit -m "feat(config): add zod-validated config loader"
```

---

### Task 1.2: Drizzle schema

**Files:**
- Create: `lib/db/schema.ts`, `drizzle.config.ts`
- Test: `tests/unit/db-schema.test.ts`

- [ ] **Step 1: Write failing test**

`tests/unit/db-schema.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { stories, characters, nodes, assets, jobs } from "@/lib/db/schema";

describe("db schema", () => {
  it("exports all tables", () => {
    expect(stories).toBeDefined();
    expect(characters).toBeDefined();
    expect(nodes).toBeDefined();
    expect(assets).toBeDefined();
    expect(jobs).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test, verify fail**

```bash
pnpm test -- db-schema
```

Expected: FAIL.

- [ ] **Step 3: Implement schema**

`lib/db/schema.ts`:
```ts
import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const stories = sqliteTable("stories", {
  id: text("id").primaryKey(),
  title: text("title").notNull().default(""),
  inputMode: text("input_mode", { enum: ["structured", "paste"] }).notNull(),
  setting: text("setting").notNull().default(""),
  opening: text("opening").notNull().default(""),
  storyText: text("story_text").notNull().default(""),
  artStyleKey: text("art_style_key").notNull().default(""),
  artStylePrompt: text("art_style_prompt").notNull().default(""),
  status: text("status", {
    enum: ["draft", "text_done", "storyboard_done", "style_done", "cds_done", "rendering", "done"],
  }).notNull().default("draft"),
  createdAt: integer("created_at").notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at").notNull().default(sql`(unixepoch())`),
});

export const assets = sqliteTable("assets", {
  id: text("id").primaryKey(),
  storyId: text("story_id").notNull().references(() => stories.id, { onDelete: "cascade" }),
  kind: text("kind", { enum: ["cds", "scene", "user_upload"] }).notNull(),
  filePath: text("file_path").notNull(),
  mime: text("mime").notNull(),
  createdAt: integer("created_at").notNull().default(sql`(unixepoch())`),
});

export const characters = sqliteTable("characters", {
  id: text("id").primaryKey(),
  storyId: text("story_id").notNull().references(() => stories.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  userInput: text("user_input").notNull().default(""),
  userImageId: text("user_image_id").references(() => assets.id, { onDelete: "set null" }),
  cdsAppearance: text("cds_appearance").notNull().default(""),
  cdsOutfit: text("cds_outfit").notNull().default(""),
  cdsTraits: text("cds_traits").notNull().default(""),
  cdsStyle: text("cds_style").notNull().default(""),
  cdsImageId: text("cds_image_id").references(() => assets.id, { onDelete: "set null" }),
  confirmed: integer("confirmed", { mode: "boolean" }).notNull().default(false),
});

export const nodes = sqliteTable("nodes", {
  id: text("id").primaryKey(),
  storyId: text("story_id").notNull().references(() => stories.id, { onDelete: "cascade" }),
  orderIndex: integer("order_index").notNull(),
  text: text("text").notNull().default(""),
  imagePrompt: text("image_prompt").notNull().default(""),
  characters: text("characters").notNull().default("[]"),
  imageId: text("image_id").references(() => assets.id, { onDelete: "set null" }),
  positionX: real("position_x").notNull().default(0),
  positionY: real("position_y").notNull().default(0),
});

export const jobs = sqliteTable("jobs", {
  id: text("id").primaryKey(),
  storyId: text("story_id").notNull().references(() => stories.id, { onDelete: "cascade" }),
  kind: text("kind", {
    enum: [
      "generate_story",
      "revise_story",
      "storyboard",
      "extract_chars",
      "cds_text",
      "cds_image",
      "scene_render",
    ],
  }).notNull(),
  targetId: text("target_id"),
  status: text("status", { enum: ["pending", "running", "done", "error", "canceled"] })
    .notNull()
    .default("pending"),
  error: text("error"),
  createdAt: integer("created_at").notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at").notNull().default(sql`(unixepoch())`),
});
```

- [ ] **Step 4: Create drizzle config**

`drizzle.config.ts`:
```ts
import type { Config } from "drizzle-kit";

export default {
  schema: "./lib/db/schema.ts",
  out: "./lib/db/migrations",
  dialect: "sqlite",
  dbCredentials: { url: process.env.DATABASE_URL ?? "file:./data/storyteller.db" },
} satisfies Config;
```

- [ ] **Step 5: Generate first migration**

```bash
mkdir -p data
pnpm db:generate
```

Expected: a `lib/db/migrations/0000_*.sql` file appears.

- [ ] **Step 6: Run test, verify pass**

```bash
pnpm test -- db-schema
```

Expected: pass.

- [ ] **Step 7: Commit**

```bash
git add lib/db/schema.ts drizzle.config.ts lib/db/migrations
git commit -m "feat(db): add drizzle schema for stories, characters, nodes, assets, jobs"
```

---

### Task 1.3: DB client + migration runner

**Files:**
- Create: `lib/db/client.ts`, `scripts/migrate.ts`
- Test: `tests/unit/db-client.test.ts`

- [ ] **Step 1: Write failing test**

`tests/unit/db-client.test.ts`:
```ts
import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createDb, runMigrations } from "@/lib/db/client";
import { stories } from "@/lib/db/schema";
import { randomUUID } from "node:crypto";

describe("db client", () => {
  let tmp: string;
  afterEach(() => { if (tmp) rmSync(tmp, { recursive: true, force: true }); });

  it("creates a db, runs migrations, and round-trips a story", async () => {
    tmp = mkdtempSync(path.join(tmpdir(), "storyteller-"));
    const dbPath = path.join(tmp, "test.db");
    const db = createDb(`file:${dbPath}`);
    await runMigrations(db);
    const id = randomUUID();
    db.insert(stories).values({ id, inputMode: "structured" }).run();
    const rows = db.select().from(stories).all();
    expect(rows).toHaveLength(1);
    expect(rows[0]?.id).toBe(id);
  });
});
```

- [ ] **Step 2: Run test, verify fail**

```bash
pnpm test -- db-client
```

Expected: FAIL.

- [ ] **Step 3: Implement db client**

`lib/db/client.ts`:
```ts
import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import path from "node:path";
import fs from "node:fs";
import * as schema from "./schema";

export type DB = BetterSQLite3Database<typeof schema>;

function fileFromUrl(url: string): string {
  return url.startsWith("file:") ? url.slice("file:".length) : url;
}

export function createDb(databaseUrl: string): DB {
  const file = fileFromUrl(databaseUrl);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const sqlite = new Database(file);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  return drizzle(sqlite, { schema });
}

export async function runMigrations(db: DB): Promise<void> {
  migrate(db, { migrationsFolder: path.join(process.cwd(), "lib/db/migrations") });
}

let _db: DB | null = null;
export function getDb(): DB {
  if (_db) return _db;
  const url = process.env.DATABASE_URL ?? "file:./data/storyteller.db";
  _db = createDb(url);
  return _db;
}
```

- [ ] **Step 4: Implement migrate script**

`scripts/migrate.ts`:
```ts
import { createDb, runMigrations } from "../lib/db/client";
import { loadConfig } from "../lib/config";

const cfg = loadConfig();
const db = createDb(cfg.databaseUrl);
await runMigrations(db);
console.log("migrations applied");
```

- [ ] **Step 5: Run unit test, verify pass**

```bash
pnpm test -- db-client
```

Expected: pass.

- [ ] **Step 6: Run migration on dev db**

```bash
cp .env.local.example .env.local
pnpm db:migrate
```

Expected: `data/storyteller.db` created, "migrations applied" printed.

- [ ] **Step 7: Commit**

```bash
git add lib/db/client.ts scripts/migrate.ts tests/unit/db-client.test.ts
git commit -m "feat(db): add sqlite client and migration runner"
```

---

### Task 1.4: Test DB helper

**Files:**
- Create: `tests/helpers/db.ts`

- [ ] **Step 1: Implement helper**

`tests/helpers/db.ts`:
```ts
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach } from "vitest";
import { createDb, runMigrations, type DB } from "@/lib/db/client";

export async function makeTestDb(): Promise<{ db: DB; cleanup: () => void }> {
  const dir = mkdtempSync(path.join(tmpdir(), "st-test-"));
  const db = createDb(`file:${path.join(dir, "test.db")}`);
  await runMigrations(db);
  const cleanup = () => rmSync(dir, { recursive: true, force: true });
  afterEach(cleanup);
  return { db, cleanup };
}
```

- [ ] **Step 2: Sanity check by reusing in db-client test**

Edit `tests/unit/db-client.test.ts` to import the helper and confirm tests still pass:
```ts
import { describe, expect, it } from "vitest";
import { makeTestDb } from "../helpers/db";
import { stories } from "@/lib/db/schema";
import { randomUUID } from "node:crypto";

describe("db client", () => {
  it("creates a db, runs migrations, and round-trips a story", async () => {
    const { db } = await makeTestDb();
    const id = randomUUID();
    db.insert(stories).values({ id, inputMode: "structured" }).run();
    const rows = db.select().from(stories).all();
    expect(rows).toHaveLength(1);
    expect(rows[0]?.id).toBe(id);
  });
});
```

- [ ] **Step 3: Run tests**

```bash
pnpm test
```

Expected: pass.

- [ ] **Step 4: Commit**

```bash
git add tests/helpers/db.ts tests/unit/db-client.test.ts
git commit -m "test: add temp-db helper"
```

---

### Task 1.5: Local file storage helpers

**Files:**
- Create: `lib/storage/files.ts`
- Test: `tests/unit/storage-files.test.ts`

- [ ] **Step 1: Write failing test**

`tests/unit/storage-files.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { mkdtempSync, rmSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { saveAssetFile, deleteAssetFile, resolveAssetPath } from "@/lib/storage/files";

describe("storage/files", () => {
  it("writes asset to {root}/{storyId}/{assetId}.{ext}", async () => {
    const root = mkdtempSync(path.join(tmpdir(), "stor-"));
    try {
      const rel = await saveAssetFile({
        root,
        storyId: "s1",
        assetId: "a1",
        mime: "image/png",
        bytes: Buffer.from([0x89, 0x50, 0x4e, 0x47]),
      });
      expect(rel).toMatch(/s1\/a1\.png$/);
      expect(readFileSync(resolveAssetPath(root, rel))).toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
    } finally { rmSync(root, { recursive: true, force: true }); }
  });

  it("deletes asset", async () => {
    const root = mkdtempSync(path.join(tmpdir(), "stor-"));
    try {
      const rel = await saveAssetFile({ root, storyId: "s", assetId: "a", mime: "image/png", bytes: Buffer.from([1]) });
      await deleteAssetFile(root, rel);
      expect(existsSync(resolveAssetPath(root, rel))).toBe(false);
    } finally { rmSync(root, { recursive: true, force: true }); }
  });
});
```

- [ ] **Step 2: Run test, verify fail**

```bash
pnpm test -- storage-files
```

Expected: FAIL.

- [ ] **Step 3: Implement**

`lib/storage/files.ts`:
```ts
import fs from "node:fs/promises";
import path from "node:path";

const MIME_TO_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

export function extFromMime(mime: string): string {
  const ext = MIME_TO_EXT[mime];
  if (!ext) throw new Error(`unsupported mime: ${mime}`);
  return ext;
}

export function resolveAssetPath(root: string, relPath: string): string {
  return path.join(root, relPath);
}

export async function saveAssetFile(args: {
  root: string;
  storyId: string;
  assetId: string;
  mime: string;
  bytes: Buffer;
}): Promise<string> {
  const ext = extFromMime(args.mime);
  const dir = path.join(args.root, args.storyId);
  await fs.mkdir(dir, { recursive: true });
  const rel = path.join(args.storyId, `${args.assetId}.${ext}`);
  await fs.writeFile(path.join(args.root, rel), args.bytes);
  return rel;
}

export async function readAssetFile(root: string, relPath: string): Promise<Buffer> {
  return fs.readFile(resolveAssetPath(root, relPath));
}

export async function deleteAssetFile(root: string, relPath: string): Promise<void> {
  await fs.rm(resolveAssetPath(root, relPath), { force: true });
}
```

- [ ] **Step 4: Run test, verify pass**

```bash
pnpm test -- storage-files
```

Expected: 2 passing.

- [ ] **Step 5: Commit**

```bash
git add lib/storage/files.ts tests/unit/storage-files.test.ts
git commit -m "feat(storage): add local file asset helpers"
```

---

## Phase 2 — Provider Abstraction

### Task 2.1: Provider type definitions

**Files:**
- Create: `lib/providers/types.ts`
- Test: `tests/unit/provider-types.test.ts`

- [ ] **Step 1: Write failing test**

`tests/unit/provider-types.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import type { TextProvider, ImageProvider, NodeDraft, CDSDraft, StoryInput } from "@/lib/providers/types";

describe("provider types", () => {
  it("compiles structurally", () => {
    const _draft: NodeDraft = { order_index: 0, text: "x", image_prompt: "y", characters: [] };
    const _cds: CDSDraft = { characterId: "c1", appearance: "", outfit: "", traits: "", style: "" };
    const _input: StoryInput = { setting: "", characters: [], opening: "" };
    const _t: TextProvider | null = null;
    const _i: ImageProvider | null = null;
    expect(_draft.order_index).toBe(0);
  });
});
```

- [ ] **Step 2: Run test, verify fail (compile error)**

```bash
pnpm test -- provider-types
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement types**

`lib/providers/types.ts`:
```ts
export interface StoryInput {
  setting: string;
  characters: { name: string; description: string }[];
  opening: string;
}

export interface NodeDraft {
  order_index: number;
  text: string;
  image_prompt: string;
  characters: string[];
}

export interface CDSDraft {
  characterId: string;
  appearance: string;
  outfit: string;
  traits: string;
  style: string;
}

export interface ExtractedCharacter {
  name: string;
  description: string;
}

export interface StoryboardOpts {
  mode: "structured" | "paste";
  characters: { id: string; name: string; description: string }[];
  targetMin: number;
  targetMax: number;
}

export interface CDSGenArgs {
  characters: { id: string; name: string; description: string }[];
  storyText: string;
  artStylePrompt: string;
}

export interface ReviseOpts {
  previousStory: string;
  revisePrompt: string;
}

export interface TextProvider {
  generateStory(input: StoryInput, opts?: { revise?: ReviseOpts }): AsyncIterable<string>;
  extractCharacters(storyText: string): Promise<ExtractedCharacter[]>;
  generateStoryboard(storyText: string, opts: StoryboardOpts): Promise<NodeDraft[]>;
  generateCDS(args: CDSGenArgs): Promise<CDSDraft[]>;
}

export interface ImageGenOpts {
  prompt: string;
  referenceImages?: Buffer[];
  size?: "1024x1024" | "1024x1536" | "1536x1024";
  signal?: AbortSignal;
}

export interface ImageProvider {
  generateImage(opts: ImageGenOpts): Promise<{ bytes: Buffer; mime: string }>;
}
```

- [ ] **Step 4: Run test, verify pass**

```bash
pnpm test -- provider-types
```

- [ ] **Step 5: Commit**

```bash
git add lib/providers/types.ts tests/unit/provider-types.test.ts
git commit -m "feat(providers): define text and image provider interfaces"
```

---

### Task 2.2: Fake providers

**Files:**
- Create: `lib/providers/fake-text.ts`, `lib/providers/fake-image.ts`
- Test: `tests/unit/fake-providers.test.ts`

- [ ] **Step 1: Write failing test**

`tests/unit/fake-providers.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { FakeTextProvider } from "@/lib/providers/fake-text";
import { FakeImageProvider } from "@/lib/providers/fake-image";

describe("fake providers", () => {
  it("streams story text", async () => {
    const t = new FakeTextProvider();
    const chunks: string[] = [];
    for await (const c of t.generateStory({ setting: "森林", characters: [{ name: "小红", description: "" }], opening: "出发" })) {
      chunks.push(c);
    }
    const full = chunks.join("");
    expect(full.length).toBeGreaterThan(0);
    expect(full).toContain("小红");
  });

  it("returns deterministic storyboard", async () => {
    const t = new FakeTextProvider();
    const nodes = await t.generateStoryboard("片段一。片段二。片段三。", { mode: "paste", characters: [{ id: "c1", name: "X", description: "" }], targetMin: 3, targetMax: 5 });
    expect(nodes.length).toBeGreaterThanOrEqual(3);
    expect(nodes[0]?.text).toContain("片段");
  });

  it("returns CDS for each character", async () => {
    const t = new FakeTextProvider();
    const cds = await t.generateCDS({
      characters: [{ id: "a", name: "A", description: "" }, { id: "b", name: "B", description: "" }],
      storyText: "x",
      artStylePrompt: "y",
    });
    expect(cds.map((c) => c.characterId).sort()).toEqual(["a", "b"]);
  });

  it("extracts characters from text", async () => {
    const t = new FakeTextProvider();
    const cs = await t.extractCharacters("从前有个小红和小蓝在森林。");
    expect(cs.length).toBeGreaterThan(0);
  });

  it("image provider returns 1x1 png", async () => {
    const i = new FakeImageProvider();
    const r = await i.generateImage({ prompt: "x" });
    expect(r.mime).toBe("image/png");
    expect(r.bytes.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test, verify fail**

```bash
pnpm test -- fake-providers
```

- [ ] **Step 3: Implement fake text provider**

`lib/providers/fake-text.ts`:
```ts
import type {
  TextProvider, StoryInput, NodeDraft, CDSDraft, ExtractedCharacter, StoryboardOpts, CDSGenArgs,
} from "./types";

export class FakeTextProvider implements TextProvider {
  async *generateStory(input: StoryInput): AsyncIterable<string> {
    const names = input.characters.map((c) => c.name).join("、") || "主角";
    const text = `从前，在${input.setting || "一个地方"}，${names}开始了旅程。${input.opening || ""}\n` +
      `他们经历了三段冒险，最终回到了起点。\n这是一个温暖的故事。`;
    for (const ch of text) {
      yield ch;
    }
  }

  async extractCharacters(storyText: string): Promise<ExtractedCharacter[]> {
    const candidates = ["小红", "小蓝", "小绿", "勇者", "公主"];
    return candidates
      .filter((n) => storyText.includes(n))
      .map((n) => ({ name: n, description: `从原文提取的角色：${n}` }))
      .slice(0, 3) || [{ name: "主角", description: "从原文提取的角色" }];
  }

  async generateStoryboard(storyText: string, opts: StoryboardOpts): Promise<NodeDraft[]> {
    const segments = storyText.split(/[。.\n]+/).map((s) => s.trim()).filter(Boolean);
    const target = Math.min(Math.max(opts.targetMin, segments.length || opts.targetMin), opts.targetMax);
    const ids = opts.characters.map((c) => c.id);
    return Array.from({ length: target }, (_, i) => ({
      order_index: i,
      text: segments[i] ?? `片段 ${i + 1}`,
      image_prompt: `画面 ${i + 1}：${segments[i] ?? "场景"}`,
      characters: ids,
    }));
  }

  async generateCDS(args: CDSGenArgs): Promise<CDSDraft[]> {
    return args.characters.map((c) => ({
      characterId: c.id,
      appearance: `${c.name} 的外貌（fake）`,
      outfit: `${c.name} 的服饰（fake）`,
      traits: `${c.name} 的特征（fake）`,
      style: `${c.name} 的风格（fake，遵循 ${args.artStylePrompt.slice(0, 20)}…）`,
    }));
  }
}
```

- [ ] **Step 4: Implement fake image provider**

`lib/providers/fake-image.ts`:
```ts
import type { ImageProvider, ImageGenOpts } from "./types";

const ONE_PIXEL_PNG = Buffer.from(
  "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c489000000" +
    "0a49444154789c63000100000005000196712b210000000049454e44ae426082",
  "hex",
);

export class FakeImageProvider implements ImageProvider {
  async generateImage(_opts: ImageGenOpts): Promise<{ bytes: Buffer; mime: string }> {
    return { bytes: ONE_PIXEL_PNG, mime: "image/png" };
  }
}
```

- [ ] **Step 5: Run tests**

```bash
pnpm test -- fake-providers
```

Expected: 5 passing.

- [ ] **Step 6: Commit**

```bash
git add lib/providers/fake-text.ts lib/providers/fake-image.ts tests/unit/fake-providers.test.ts
git commit -m "feat(providers): add fake text and image providers for testing"
```

---

### Task 2.3: OpenAI text provider

**Files:**
- Create: `lib/providers/openai-text.ts`, `lib/providers/prompts.ts`
- Test: `tests/unit/openai-text.test.ts`

- [ ] **Step 1: Add MSW server helper**

`tests/helpers/msw.ts`:
```ts
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll } from "vitest";
import type { RequestHandler } from "msw";

export function withMsw(handlers: RequestHandler[] = []) {
  const server = setupServer(...handlers);
  beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());
  return server;
}
```

- [ ] **Step 2: Write failing test**

`tests/unit/openai-text.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { withMsw } from "../helpers/msw";
import { OpenAITextProvider } from "@/lib/providers/openai-text";

const server = withMsw();

describe("OpenAITextProvider", () => {
  it("streams story text via chat.completions stream", async () => {
    server.use(
      http.post("https://api.openai.com/v1/chat/completions", async () => {
        const body =
          `data: {"choices":[{"delta":{"content":"从前"}}]}\n\n` +
          `data: {"choices":[{"delta":{"content":"，有"}}]}\n\n` +
          `data: [DONE]\n\n`;
        return new HttpResponse(body, { headers: { "Content-Type": "text/event-stream" } });
      }),
    );
    const provider = new OpenAITextProvider({ apiKey: "k", model: "gpt-5" });
    const out: string[] = [];
    for await (const c of provider.generateStory({ setting: "", characters: [], opening: "" })) out.push(c);
    expect(out.join("")).toBe("从前，有");
  });

  it("parses storyboard from json response", async () => {
    server.use(
      http.post("https://api.openai.com/v1/chat/completions", async () => HttpResponse.json({
        choices: [{ message: { content: JSON.stringify({ nodes: [
          { order_index: 0, text: "a", image_prompt: "p1", characters: ["c1"] },
          { order_index: 1, text: "b", image_prompt: "p2", characters: [] },
        ]}) } }],
      })),
    );
    const p = new OpenAITextProvider({ apiKey: "k", model: "gpt-5" });
    const r = await p.generateStoryboard("text", {
      mode: "paste",
      characters: [{ id: "c1", name: "x", description: "" }],
      targetMin: 2,
      targetMax: 4,
    });
    expect(r).toHaveLength(2);
    expect(r[0]?.text).toBe("a");
  });
});
```

- [ ] **Step 3: Run test, verify fail**

```bash
pnpm test -- openai-text
```

- [ ] **Step 4: Implement prompt builders**

`lib/providers/prompts.ts`:
```ts
import type { StoryInput, ReviseOpts, StoryboardOpts, CDSGenArgs } from "./types";

export const STORY_SYSTEM = `你是一位中文儿童绘本作家，擅长把简单设定写成温暖、有画面感、起承转合分明的故事。要求：
- 叙述清晰、段落分明
- 突出角色形象和场景细节，便于后续生成插图
- 不使用敏感、暴力或恐怖内容
- 直接输出故事正文，不要前后缀`;

export function buildStoryUser(input: StoryInput, revise?: ReviseOpts): string {
  if (revise) {
    return `这是上一稿故事：\n---\n${revise.previousStory}\n---\n请按以下要求修改并完整重写故事：${revise.revisePrompt}`;
  }
  const chars = input.characters.map((c) => `- ${c.name}：${c.description}`).join("\n") || "（用户未提供角色）";
  return `故事设定：${input.setting}\n角色：\n${chars}\n起始剧情：${input.opening}\n请据此创作完整故事。`;
}

export const STORYBOARD_SYSTEM = `你是一位绘本分镜师。把给定故事文本切分成节点，每个节点附一段专为生图模型优化的英文 image_prompt（以视觉细节为主：构图/动作/表情/光线/场景）。`;

export function buildStoryboardUser(storyText: string, opts: StoryboardOpts): string {
  const charLines = opts.characters.map((c) => `- ${c.id} ${c.name}: ${c.description}`).join("\n");
  const sliceRule = opts.mode === "paste"
    ? "节点 text 字段必须是原文的精确切片（连续字符），不得改写或扩写。"
    : "节点 text 字段可以是原文段落或轻度润色。";
  return `角色清单：\n${charLines}\n\n${sliceRule}\n目标节点数：${opts.targetMin}-${opts.targetMax}\n\n故事文本：\n${storyText}`;
}

export const STORYBOARD_SCHEMA = {
  name: "Storyboard",
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      nodes: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            order_index: { type: "integer" },
            text: { type: "string" },
            image_prompt: { type: "string" },
            characters: { type: "array", items: { type: "string" } },
          },
          required: ["order_index", "text", "image_prompt", "characters"],
        },
      },
    },
    required: ["nodes"],
  },
  strict: true,
};

export const EXTRACT_SYSTEM = `从给定中文故事中提取主要角色（最多 5 个），每个角色给出名字和一两句外观/性格描述。`;
export const EXTRACT_SCHEMA = {
  name: "Characters",
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      characters: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: { name: { type: "string" }, description: { type: "string" } },
          required: ["name", "description"],
        },
      },
    },
    required: ["characters"],
  },
  strict: true,
};

export const CDS_SYSTEM = `为每个角色生成 Character Design Sheet（CDS）。每个角色四个字段（appearance/outfit/traits/style），描述要为后续生图模型友好：具体、可视、避免抽象词。所有 CDS 都要符合给定的全局画风。`;
export function buildCDSUser(args: CDSGenArgs): string {
  const chars = args.characters.map((c) => `- ${c.id} ${c.name}: ${c.description}`).join("\n");
  return `画风：${args.artStylePrompt}\n角色：\n${chars}\n\n参考故事原文以保证一致性：\n${args.storyText}`;
}
export const CDS_SCHEMA = {
  name: "CDS",
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      characters: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            characterId: { type: "string" },
            appearance: { type: "string" },
            outfit: { type: "string" },
            traits: { type: "string" },
            style: { type: "string" },
          },
          required: ["characterId", "appearance", "outfit", "traits", "style"],
        },
      },
    },
    required: ["characters"],
  },
  strict: true,
};
```

- [ ] **Step 5: Implement OpenAI text provider**

`lib/providers/openai-text.ts`:
```ts
import OpenAI from "openai";
import type {
  TextProvider, StoryInput, NodeDraft, CDSDraft, ExtractedCharacter, StoryboardOpts, CDSGenArgs, ReviseOpts,
} from "./types";
import {
  STORY_SYSTEM, buildStoryUser,
  STORYBOARD_SYSTEM, buildStoryboardUser, STORYBOARD_SCHEMA,
  EXTRACT_SYSTEM, EXTRACT_SCHEMA,
  CDS_SYSTEM, buildCDSUser, CDS_SCHEMA,
} from "./prompts";

export class OpenAITextProvider implements TextProvider {
  private client: OpenAI;
  private model: string;
  constructor(opts: { apiKey: string; model: string; baseURL?: string }) {
    this.client = new OpenAI({ apiKey: opts.apiKey, baseURL: opts.baseURL, maxRetries: 3 });
    this.model = opts.model;
  }

  async *generateStory(input: StoryInput, opts?: { revise?: ReviseOpts }): AsyncIterable<string> {
    const stream = await this.client.chat.completions.create({
      model: this.model,
      stream: true,
      messages: [
        { role: "system", content: STORY_SYSTEM },
        { role: "user", content: buildStoryUser(input, opts?.revise) },
      ],
    });
    for await (const ev of stream) {
      const delta = ev.choices[0]?.delta?.content;
      if (delta) yield delta;
    }
  }

  async extractCharacters(storyText: string): Promise<ExtractedCharacter[]> {
    const r = await this.client.chat.completions.create({
      model: this.model,
      response_format: { type: "json_schema", json_schema: EXTRACT_SCHEMA as any },
      messages: [
        { role: "system", content: EXTRACT_SYSTEM },
        { role: "user", content: storyText },
      ],
    });
    const parsed = JSON.parse(r.choices[0]?.message?.content ?? "{}") as { characters?: ExtractedCharacter[] };
    return parsed.characters ?? [];
  }

  async generateStoryboard(storyText: string, opts: StoryboardOpts): Promise<NodeDraft[]> {
    const r = await this.client.chat.completions.create({
      model: this.model,
      response_format: { type: "json_schema", json_schema: STORYBOARD_SCHEMA as any },
      messages: [
        { role: "system", content: STORYBOARD_SYSTEM },
        { role: "user", content: buildStoryboardUser(storyText, opts) },
      ],
    });
    const parsed = JSON.parse(r.choices[0]?.message?.content ?? "{}") as { nodes?: NodeDraft[] };
    const nodes = parsed.nodes ?? [];
    return nodes.map((n, i) => ({ ...n, order_index: i }));
  }

  async generateCDS(args: CDSGenArgs): Promise<CDSDraft[]> {
    const r = await this.client.chat.completions.create({
      model: this.model,
      response_format: { type: "json_schema", json_schema: CDS_SCHEMA as any },
      messages: [
        { role: "system", content: CDS_SYSTEM },
        { role: "user", content: buildCDSUser(args) },
      ],
    });
    const parsed = JSON.parse(r.choices[0]?.message?.content ?? "{}") as { characters?: CDSDraft[] };
    return parsed.characters ?? [];
  }
}
```

- [ ] **Step 6: Run tests, verify pass**

```bash
pnpm test -- openai-text
```

If MSW unhandled request errors appear from the OpenAI SDK doing fetch retries, allow `passthrough()` for any non-OpenAI URLs in `withMsw` setup, but keep OpenAI URLs strict.

- [ ] **Step 7: Commit**

```bash
git add lib/providers/openai-text.ts lib/providers/prompts.ts tests/unit/openai-text.test.ts tests/helpers/msw.ts
git commit -m "feat(providers): add openai text provider"
```

---

### Task 2.4: OpenAI image provider

**Files:**
- Create: `lib/providers/openai-image.ts`
- Test: `tests/unit/openai-image.test.ts`

- [ ] **Step 1: Write failing test**

`tests/unit/openai-image.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { withMsw } from "../helpers/msw";
import { OpenAIImageProvider } from "@/lib/providers/openai-image";

const server = withMsw();
const PNG_B64 = Buffer.from([0x89, 0x50, 0x4e, 0x47]).toString("base64");

describe("OpenAIImageProvider", () => {
  it("calls images.generate when no reference images", async () => {
    let endpoint = "";
    server.use(
      http.post("https://api.openai.com/v1/images/generations", async ({ request }) => {
        endpoint = "generations";
        const body = await request.json() as { model: string; prompt: string };
        expect(body.model).toBe("gpt-image-1");
        expect(body.prompt).toBe("a fox");
        return HttpResponse.json({ data: [{ b64_json: PNG_B64 }] });
      }),
    );
    const p = new OpenAIImageProvider({ apiKey: "k", model: "gpt-image-1" });
    const r = await p.generateImage({ prompt: "a fox" });
    expect(endpoint).toBe("generations");
    expect(r.mime).toBe("image/png");
    expect(r.bytes.length).toBeGreaterThan(0);
  });

  it("calls images.edits when reference images present", async () => {
    let hit = false;
    server.use(
      http.post("https://api.openai.com/v1/images/edits", async () => {
        hit = true;
        return HttpResponse.json({ data: [{ b64_json: PNG_B64 }] });
      }),
    );
    const p = new OpenAIImageProvider({ apiKey: "k", model: "gpt-image-1" });
    const ref = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
    const r = await p.generateImage({ prompt: "with this fox", referenceImages: [ref] });
    expect(hit).toBe(true);
    expect(r.bytes.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test, verify fail**

```bash
pnpm test -- openai-image
```

- [ ] **Step 3: Implement**

`lib/providers/openai-image.ts`:
```ts
import OpenAI, { toFile } from "openai";
import type { ImageProvider, ImageGenOpts } from "./types";

export class OpenAIImageProvider implements ImageProvider {
  private client: OpenAI;
  private model: string;
  constructor(opts: { apiKey: string; model: string; baseURL?: string }) {
    this.client = new OpenAI({ apiKey: opts.apiKey, baseURL: opts.baseURL, maxRetries: 3 });
    this.model = opts.model;
  }

  async generateImage(opts: ImageGenOpts): Promise<{ bytes: Buffer; mime: string }> {
    const size = opts.size ?? "1024x1024";
    if (opts.referenceImages?.length) {
      const files = await Promise.all(
        opts.referenceImages.map((b, i) => toFile(b, `ref-${i}.png`, { type: "image/png" })),
      );
      const r = await this.client.images.edit(
        { model: this.model, image: files, prompt: opts.prompt, size },
        { signal: opts.signal },
      );
      const b64 = r.data?.[0]?.b64_json;
      if (!b64) throw new Error("openai images.edit returned no b64_json");
      return { bytes: Buffer.from(b64, "base64"), mime: "image/png" };
    }
    const r = await this.client.images.generate(
      { model: this.model, prompt: opts.prompt, size },
      { signal: opts.signal },
    );
    const b64 = r.data?.[0]?.b64_json;
    if (!b64) throw new Error("openai images.generate returned no b64_json");
    return { bytes: Buffer.from(b64, "base64"), mime: "image/png" };
  }
}
```

- [ ] **Step 4: Run test, verify pass**

```bash
pnpm test -- openai-image
```

- [ ] **Step 5: Commit**

```bash
git add lib/providers/openai-image.ts tests/unit/openai-image.test.ts
git commit -m "feat(providers): add openai image provider with reference image support"
```

---

### Task 2.5: Provider factory

**Files:**
- Create: `lib/providers/factory.ts`
- Test: `tests/unit/provider-factory.test.ts`

- [ ] **Step 1: Write failing test**

`tests/unit/provider-factory.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { getTextProvider, getImageProvider } from "@/lib/providers/factory";

describe("provider factory", () => {
  it("returns fake providers when PROVIDER_MODE=fake", () => {
    const t = getTextProvider({ providerMode: "fake", openai: { apiKey: "", textModel: "x", imageModel: "y" } } as any);
    const i = getImageProvider({ providerMode: "fake", openai: { apiKey: "", textModel: "x", imageModel: "y" } } as any);
    expect(t.constructor.name).toBe("FakeTextProvider");
    expect(i.constructor.name).toBe("FakeImageProvider");
  });

  it("returns openai providers when PROVIDER_MODE=openai", () => {
    const t = getTextProvider({ providerMode: "openai", openai: { apiKey: "k", textModel: "gpt-5", imageModel: "gpt-image-1" } } as any);
    const i = getImageProvider({ providerMode: "openai", openai: { apiKey: "k", textModel: "gpt-5", imageModel: "gpt-image-1" } } as any);
    expect(t.constructor.name).toBe("OpenAITextProvider");
    expect(i.constructor.name).toBe("OpenAIImageProvider");
  });
});
```

- [ ] **Step 2: Run test, verify fail**

```bash
pnpm test -- provider-factory
```

- [ ] **Step 3: Implement**

`lib/providers/factory.ts`:
```ts
import type { Config } from "../config";
import type { TextProvider, ImageProvider } from "./types";
import { FakeTextProvider } from "./fake-text";
import { FakeImageProvider } from "./fake-image";
import { OpenAITextProvider } from "./openai-text";
import { OpenAIImageProvider } from "./openai-image";

export function getTextProvider(cfg: Config): TextProvider {
  if (cfg.providerMode === "fake") return new FakeTextProvider();
  return new OpenAITextProvider({ apiKey: cfg.openai.apiKey, model: cfg.openai.textModel });
}

export function getImageProvider(cfg: Config): ImageProvider {
  if (cfg.providerMode === "fake") return new FakeImageProvider();
  return new OpenAIImageProvider({ apiKey: cfg.openai.apiKey, model: cfg.openai.imageModel });
}
```

- [ ] **Step 4: Run tests, verify pass**

```bash
pnpm test
```

- [ ] **Step 5: Commit**

```bash
git add lib/providers/factory.ts tests/unit/provider-factory.test.ts
git commit -m "feat(providers): add factory selecting provider by config"
```

---

## Phase 3 — Job System (Queue + SSE)

### Task 3.1: SSE bus

**Files:**
- Create: `lib/jobs/sse-bus.ts`
- Test: `tests/unit/sse-bus.test.ts`

- [ ] **Step 1: Write failing test**

`tests/unit/sse-bus.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { SseBus } from "@/lib/jobs/sse-bus";

describe("SseBus", () => {
  it("delivers events to current subscribers", async () => {
    const bus = new SseBus();
    const received: any[] = [];
    const unsub = bus.subscribe("j1", (e) => received.push(e));
    bus.publish("j1", { type: "chunk", data: "hello" });
    bus.publish("j1", { type: "done", data: { ok: true } });
    unsub();
    bus.publish("j1", { type: "chunk", data: "ignored" });
    expect(received).toEqual([
      { type: "chunk", data: "hello" },
      { type: "done", data: { ok: true } },
    ]);
  });

  it("isolates per-job channels", () => {
    const bus = new SseBus();
    const a: any[] = [], b: any[] = [];
    bus.subscribe("a", (e) => a.push(e));
    bus.subscribe("b", (e) => b.push(e));
    bus.publish("a", { type: "chunk", data: 1 });
    expect(a).toHaveLength(1);
    expect(b).toHaveLength(0);
  });

  it("buffers events delivered before any subscriber connects", () => {
    const bus = new SseBus();
    bus.publish("late", { type: "chunk", data: "first" });
    const got: any[] = [];
    bus.subscribe("late", (e) => got.push(e));
    expect(got).toEqual([{ type: "chunk", data: "first" }]);
  });
});
```

- [ ] **Step 2: Run test, verify fail**

```bash
pnpm test -- sse-bus
```

- [ ] **Step 3: Implement**

`lib/jobs/sse-bus.ts`:
```ts
export type SseEvent =
  | { type: "chunk"; data: string }
  | { type: "progress"; data: { current: number; total: number; note?: string } }
  | { type: "done"; data: unknown }
  | { type: "error"; data: { message: string } };

type Listener = (e: SseEvent) => void;

export class SseBus {
  private listeners = new Map<string, Set<Listener>>();
  private buffers = new Map<string, SseEvent[]>();

  subscribe(jobId: string, fn: Listener): () => void {
    let set = this.listeners.get(jobId);
    if (!set) { set = new Set(); this.listeners.set(jobId, set); }
    set.add(fn);
    const buffered = this.buffers.get(jobId);
    if (buffered) {
      this.buffers.delete(jobId);
      for (const e of buffered) fn(e);
    }
    return () => {
      const s = this.listeners.get(jobId);
      if (s) { s.delete(fn); if (s.size === 0) this.listeners.delete(jobId); }
    };
  }

  publish(jobId: string, event: SseEvent): void {
    const set = this.listeners.get(jobId);
    if (set && set.size > 0) {
      for (const fn of set) fn(event);
      return;
    }
    const buf = this.buffers.get(jobId) ?? [];
    buf.push(event);
    this.buffers.set(jobId, buf);
  }

  end(jobId: string): void {
    this.listeners.delete(jobId);
    this.buffers.delete(jobId);
  }
}

let _bus: SseBus | null = null;
export function getSseBus(): SseBus {
  if (!_bus) _bus = new SseBus();
  return _bus;
}
```

- [ ] **Step 4: Run tests, verify pass**

```bash
pnpm test -- sse-bus
```

- [ ] **Step 5: Commit**

```bash
git add lib/jobs/sse-bus.ts tests/unit/sse-bus.test.ts
git commit -m "feat(jobs): add in-memory sse bus with buffering"
```

---

### Task 3.2: Job queue with concurrency limit

**Files:**
- Create: `lib/jobs/queue.ts`
- Test: `tests/unit/job-queue.test.ts`

- [ ] **Step 1: Write failing test**

`tests/unit/job-queue.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { JobQueue } from "@/lib/jobs/queue";

describe("JobQueue", () => {
  it("enforces concurrency limit", async () => {
    const q = new JobQueue({ concurrency: 2 });
    let active = 0, peak = 0;
    const make = () => async () => {
      active++; peak = Math.max(peak, active);
      await new Promise((r) => setTimeout(r, 20));
      active--;
    };
    await Promise.all([q.enqueue("1", make()), q.enqueue("2", make()), q.enqueue("3", make()), q.enqueue("4", make())]);
    expect(peak).toBeLessThanOrEqual(2);
  });

  it("supports cancellation via abort signal", async () => {
    const q = new JobQueue({ concurrency: 1 });
    let started = false;
    const p = q.enqueue("j1", async (signal) => {
      started = true;
      await new Promise((res, rej) => {
        const t = setTimeout(res, 200);
        signal.addEventListener("abort", () => { clearTimeout(t); rej(new Error("aborted")); });
      });
    });
    await new Promise((r) => setTimeout(r, 10));
    expect(started).toBe(true);
    q.cancel("j1");
    await expect(p).rejects.toThrow(/abort/i);
  });
});
```

- [ ] **Step 2: Run test, verify fail**

```bash
pnpm test -- job-queue
```

- [ ] **Step 3: Implement**

`lib/jobs/queue.ts`:
```ts
import pLimit from "p-limit";

export type JobFn = (signal: AbortSignal) => Promise<void>;

export class JobQueue {
  private limit: ReturnType<typeof pLimit>;
  private controllers = new Map<string, AbortController>();
  constructor(opts: { concurrency: number }) {
    this.limit = pLimit(opts.concurrency);
  }

  enqueue(id: string, fn: JobFn): Promise<void> {
    const ctrl = new AbortController();
    this.controllers.set(id, ctrl);
    return this.limit(async () => {
      try {
        await fn(ctrl.signal);
      } finally {
        this.controllers.delete(id);
      }
    });
  }

  cancel(id: string): void {
    const c = this.controllers.get(id);
    if (c) c.abort(new Error("aborted"));
  }
}

let _queue: JobQueue | null = null;
export function getJobQueue(concurrency: number): JobQueue {
  if (!_queue) _queue = new JobQueue({ concurrency });
  return _queue;
}
```

- [ ] **Step 4: Run tests, verify pass**

```bash
pnpm test -- job-queue
```

- [ ] **Step 5: Commit**

```bash
git add lib/jobs/queue.ts tests/unit/job-queue.test.ts
git commit -m "feat(jobs): add concurrency-limited queue with cancel"
```

---

### Task 3.3: Job runner (DB + queue + bus glue)

**Files:**
- Create: `lib/jobs/runner.ts`
- Test: `tests/unit/job-runner.test.ts`

- [ ] **Step 1: Write failing test**

`tests/unit/job-runner.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { makeTestDb } from "../helpers/db";
import { stories, jobs } from "@/lib/db/schema";
import { runJob } from "@/lib/jobs/runner";
import { JobQueue } from "@/lib/jobs/queue";
import { SseBus } from "@/lib/jobs/sse-bus";
import { randomUUID } from "node:crypto";

describe("runJob", () => {
  it("runs job, marks done, emits events", async () => {
    const { db } = await makeTestDb();
    const storyId = randomUUID();
    db.insert(stories).values({ id: storyId, inputMode: "structured" }).run();
    const bus = new SseBus();
    const queue = new JobQueue({ concurrency: 1 });
    const events: any[] = [];
    const jobId = randomUUID();
    db.insert(jobs).values({ id: jobId, storyId, kind: "generate_story" }).run();
    bus.subscribe(jobId, (e) => events.push(e));
    await runJob({ db, queue, bus, jobId, fn: async (ctx) => {
      ctx.publish({ type: "chunk", data: "hi" });
      return { ok: true };
    }});
    const row = db.select().from(jobs).where(eq(jobs.id, jobId)).get();
    expect(row?.status).toBe("done");
    expect(events.some((e) => e.type === "chunk")).toBe(true);
    expect(events.some((e) => e.type === "done")).toBe(true);
  });

  it("marks job error on throw", async () => {
    const { db } = await makeTestDb();
    const storyId = randomUUID();
    db.insert(stories).values({ id: storyId, inputMode: "structured" }).run();
    const bus = new SseBus();
    const queue = new JobQueue({ concurrency: 1 });
    const jobId = randomUUID();
    db.insert(jobs).values({ id: jobId, storyId, kind: "generate_story" }).run();
    await expect(runJob({ db, queue, bus, jobId, fn: async () => { throw new Error("boom"); } })).rejects.toThrow();
    const row = db.select().from(jobs).where(eq(jobs.id, jobId)).get();
    expect(row?.status).toBe("error");
    expect(row?.error).toMatch(/boom/);
  });
});
```

- [ ] **Step 2: Run test, verify fail**

```bash
pnpm test -- job-runner
```

- [ ] **Step 3: Implement**

`lib/jobs/runner.ts`:
```ts
import { eq, sql } from "drizzle-orm";
import type { DB } from "@/lib/db/client";
import { jobs } from "@/lib/db/schema";
import type { JobQueue } from "./queue";
import type { SseBus, SseEvent } from "./sse-bus";

export interface JobContext {
  db: DB;
  signal: AbortSignal;
  publish: (e: SseEvent) => void;
}

export async function runJob<T>(args: {
  db: DB;
  queue: JobQueue;
  bus: SseBus;
  jobId: string;
  fn: (ctx: JobContext) => Promise<T>;
}): Promise<T> {
  const { db, queue, bus, jobId, fn } = args;
  let result!: T;
  let caught: unknown = null;

  await queue.enqueue(jobId, async (signal) => {
    db.update(jobs).set({ status: "running", updatedAt: sql`(unixepoch())` }).where(eq(jobs.id, jobId)).run();
    try {
      result = await fn({ db, signal, publish: (e) => bus.publish(jobId, e) });
      db.update(jobs).set({ status: "done", updatedAt: sql`(unixepoch())` }).where(eq(jobs.id, jobId)).run();
      bus.publish(jobId, { type: "done", data: result });
    } catch (err) {
      caught = err;
      const msg = err instanceof Error ? err.message : String(err);
      const status = signal.aborted ? "canceled" : "error";
      db.update(jobs).set({ status, error: msg, updatedAt: sql`(unixepoch())` }).where(eq(jobs.id, jobId)).run();
      bus.publish(jobId, { type: "error", data: { message: msg } });
    } finally {
      bus.end(jobId);
    }
  });

  if (caught) throw caught;
  return result;
}
```

- [ ] **Step 4: Run tests, verify pass**

```bash
pnpm test -- job-runner
```

- [ ] **Step 5: Commit**

```bash
git add lib/jobs/runner.ts tests/unit/job-runner.test.ts
git commit -m "feat(jobs): add runner gluing queue, db status, and sse bus"
```

---

## Phase 4 — Pipeline Stages

Each stage is a pure function over DB + provider. Stages do NOT call jobs/SSE directly — that wiring lives in API routes (Phase 5).

### Task 4.1: Art styles registry

**Files:**
- Create: `lib/art-styles.ts`
- Test: `tests/unit/art-styles.test.ts`

- [ ] **Step 1: Write failing test**

`tests/unit/art-styles.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { ART_STYLES, getArtStyle, resolveArtStylePrompt } from "@/lib/art-styles";

describe("art-styles", () => {
  it("exports a list with stable ids", () => {
    const ids = ART_STYLES.map((s) => s.id);
    expect(ids).toContain("watercolor-picturebook");
    expect(ids).toContain("custom");
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("looks up a style by id", () => {
    const s = getArtStyle("watercolor-picturebook");
    expect(s?.name).toBe("水彩绘本");
  });

  it("resolves a custom prompt", () => {
    expect(resolveArtStylePrompt("watercolor-picturebook", "warm tones")).toMatch(/watercolor/i);
    expect(resolveArtStylePrompt("watercolor-picturebook", "warm tones")).toContain("warm tones");
    expect(resolveArtStylePrompt("custom", "all custom")).toBe("all custom");
  });
});
```

- [ ] **Step 2: Run test, verify fail**

```bash
pnpm test -- art-styles
```

- [ ] **Step 3: Implement**

`lib/art-styles.ts`:
```ts
export interface ArtStyle {
  id: string;
  name: string;
  prompt: string;
}

export const ART_STYLES: ArtStyle[] = [
  { id: "watercolor-picturebook", name: "水彩绘本",
    prompt: "soft watercolor children's book illustration, gentle pastel palette, hand-painted texture, light warm lighting, storybook composition, no text" },
  { id: "ghibli-anime", name: "吉卜力动画",
    prompt: "studio ghibli style hand-drawn anime, lush painterly backgrounds, soft cel shading, expressive characters, naturalistic lighting, no text" },
  { id: "american-comic", name: "美式漫画",
    prompt: "modern american comic illustration, bold inked outlines, dynamic poses, cel shading with halftone shadows, saturated colors, no text" },
  { id: "pixel-art", name: "像素风",
    prompt: "16-bit pixel art illustration, limited palette, crisp pixel edges, charming retro game aesthetic, no text" },
  { id: "oil-painting", name: "古典油画",
    prompt: "classical oil painting illustration, visible brush strokes, rich chiaroscuro lighting, museum quality, no text" },
  { id: "cinematic-cg", name: "写实电影 CG",
    prompt: "photorealistic 3D cinematic render, dramatic lighting, high detail, shallow depth of field, no text" },
  { id: "ink-wash", name: "水墨",
    prompt: "traditional chinese ink wash painting, fluid brush strokes, monochrome with subtle color washes, abundant negative space, no text" },
  { id: "custom", name: "自定义", prompt: "" },
];

export function getArtStyle(id: string): ArtStyle | undefined {
  return ART_STYLES.find((s) => s.id === id);
}

export function resolveArtStylePrompt(id: string, userAddition: string): string {
  if (id === "custom") return userAddition.trim();
  const base = getArtStyle(id)?.prompt ?? "";
  const extra = userAddition.trim();
  return extra ? `${base}. ${extra}` : base;
}
```

- [ ] **Step 4: Run tests, verify pass**

```bash
pnpm test -- art-styles
```

- [ ] **Step 5: Commit**

```bash
git add lib/art-styles.ts tests/unit/art-styles.test.ts
git commit -m "feat(art-styles): add preset registry and prompt resolver"
```

---

### Task 4.2: Pipeline S1 — Story text

**Files:**
- Create: `lib/pipeline/story-text.ts`
- Test: `tests/unit/pipeline-story-text.test.ts`

- [ ] **Step 1: Write failing test**

`tests/unit/pipeline-story-text.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { makeTestDb } from "../helpers/db";
import { stories } from "@/lib/db/schema";
import { generateStoryText } from "@/lib/pipeline/story-text";
import { FakeTextProvider } from "@/lib/providers/fake-text";
import { randomUUID } from "node:crypto";

describe("pipeline.story-text", () => {
  it("streams chunks, persists final text, sets status", async () => {
    const { db } = await makeTestDb();
    const id = randomUUID();
    db.insert(stories).values({ id, inputMode: "structured", setting: "森林", opening: "出发" }).run();
    const chunks: string[] = [];
    const out = await generateStoryText({
      db, provider: new FakeTextProvider(), storyId: id,
      onChunk: (c) => chunks.push(c),
    });
    expect(out.length).toBeGreaterThan(0);
    expect(chunks.length).toBeGreaterThan(0);
    const row = db.select().from(stories).where(eq(stories.id, id)).get();
    expect(row?.storyText).toBe(out);
    expect(row?.status).toBe("text_done");
  });

  it("revise mode passes previous story to provider", async () => {
    const { db } = await makeTestDb();
    const id = randomUUID();
    db.insert(stories).values({
      id, inputMode: "structured", setting: "S", opening: "O",
      storyText: "上一稿故事", status: "text_done",
    }).run();
    const out = await generateStoryText({
      db, provider: new FakeTextProvider(), storyId: id,
      revisePrompt: "更温馨", onChunk: () => {},
    });
    expect(out.length).toBeGreaterThan(0);
    const row = db.select().from(stories).where(eq(stories.id, id)).get();
    expect(row?.storyText).toBe(out);
    expect(row?.status).toBe("text_done");
  });
});
```

- [ ] **Step 2: Run test, verify fail**

```bash
pnpm test -- pipeline-story-text
```

- [ ] **Step 3: Implement**

`lib/pipeline/story-text.ts`:
```ts
import { eq, sql } from "drizzle-orm";
import type { DB } from "@/lib/db/client";
import { stories, characters as charactersTable } from "@/lib/db/schema";
import type { TextProvider } from "@/lib/providers/types";

export async function generateStoryText(args: {
  db: DB;
  provider: TextProvider;
  storyId: string;
  revisePrompt?: string;
  onChunk: (chunk: string) => void;
  signal?: AbortSignal;
}): Promise<string> {
  const { db, provider, storyId, revisePrompt, onChunk, signal } = args;
  const row = db.select().from(stories).where(eq(stories.id, storyId)).get();
  if (!row) throw new Error(`story not found: ${storyId}`);
  const charRows = db.select().from(charactersTable).where(eq(charactersTable.storyId, storyId)).all();

  const input = {
    setting: row.setting,
    opening: row.opening,
    characters: charRows.map((c) => ({ name: c.name, description: c.userInput })),
  };
  const opts = revisePrompt ? { revise: { previousStory: row.storyText, revisePrompt } } : undefined;

  let full = "";
  for await (const chunk of provider.generateStory(input, opts)) {
    if (signal?.aborted) throw new Error("aborted");
    full += chunk;
    onChunk(chunk);
  }
  db.update(stories)
    .set({ storyText: full, status: "text_done", updatedAt: sql`(unixepoch())` })
    .where(eq(stories.id, storyId))
    .run();
  return full;
}
```

- [ ] **Step 4: Run tests, verify pass**

```bash
pnpm test -- pipeline-story-text
```

- [ ] **Step 5: Commit**

```bash
git add lib/pipeline/story-text.ts tests/unit/pipeline-story-text.test.ts
git commit -m "feat(pipeline): S1 generate story text"
```

---

### Task 4.3: Pipeline S2 — Character extraction

**Files:**
- Create: `lib/pipeline/character-extract.ts`
- Test: `tests/unit/pipeline-character-extract.test.ts`

- [ ] **Step 1: Write failing test**

`tests/unit/pipeline-character-extract.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { makeTestDb } from "../helpers/db";
import { stories, characters } from "@/lib/db/schema";
import { extractCharacters } from "@/lib/pipeline/character-extract";
import { FakeTextProvider } from "@/lib/providers/fake-text";
import { randomUUID } from "node:crypto";

describe("pipeline.character-extract", () => {
  it("extracts characters and inserts rows", async () => {
    const { db } = await makeTestDb();
    const id = randomUUID();
    db.insert(stories).values({ id, inputMode: "paste", storyText: "小红和小蓝在森林里玩耍。" }).run();
    const inserted = await extractCharacters({ db, provider: new FakeTextProvider(), storyId: id });
    const rows = db.select().from(characters).where(eq(characters.storyId, id)).all();
    expect(rows.length).toBeGreaterThan(0);
    expect(inserted.length).toBe(rows.length);
    expect(rows[0]?.name).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test, verify fail**

```bash
pnpm test -- pipeline-character-extract
```

- [ ] **Step 3: Implement**

`lib/pipeline/character-extract.ts`:
```ts
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import type { DB } from "@/lib/db/client";
import { stories, characters } from "@/lib/db/schema";
import type { TextProvider } from "@/lib/providers/types";

export async function extractCharacters(args: {
  db: DB;
  provider: TextProvider;
  storyId: string;
}): Promise<{ id: string; name: string; description: string }[]> {
  const { db, provider, storyId } = args;
  const row = db.select().from(stories).where(eq(stories.id, storyId)).get();
  if (!row) throw new Error(`story not found: ${storyId}`);
  const extracted = await provider.extractCharacters(row.storyText);
  const inserted: { id: string; name: string; description: string }[] = [];
  for (const c of extracted) {
    const id = randomUUID();
    db.insert(characters).values({
      id, storyId, name: c.name, userInput: c.description,
    }).run();
    inserted.push({ id, name: c.name, description: c.description });
  }
  return inserted;
}
```

- [ ] **Step 4: Run tests, verify pass**

```bash
pnpm test -- pipeline-character-extract
```

- [ ] **Step 5: Commit**

```bash
git add lib/pipeline/character-extract.ts tests/unit/pipeline-character-extract.test.ts
git commit -m "feat(pipeline): S2 extract characters from pasted story"
```

---

### Task 4.4: Pipeline S3 — Storyboard

**Files:**
- Create: `lib/pipeline/storyboard.ts`
- Test: `tests/unit/pipeline-storyboard.test.ts`

- [ ] **Step 1: Write failing test**

`tests/unit/pipeline-storyboard.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { makeTestDb } from "../helpers/db";
import { stories, characters, nodes } from "@/lib/db/schema";
import { generateStoryboard } from "@/lib/pipeline/storyboard";
import { FakeTextProvider } from "@/lib/providers/fake-text";
import { randomUUID } from "node:crypto";

describe("pipeline.storyboard", () => {
  it("creates nodes with sequential order_index", async () => {
    const { db } = await makeTestDb();
    const id = randomUUID();
    db.insert(stories).values({
      id, inputMode: "paste",
      storyText: "段一。段二。段三。段四。",
    }).run();
    const c1 = randomUUID();
    db.insert(characters).values({ id: c1, storyId: id, name: "X" }).run();
    const inserted = await generateStoryboard({
      db, provider: new FakeTextProvider(), storyId: id,
      targetMin: 3, targetMax: 5,
    });
    expect(inserted.length).toBeGreaterThanOrEqual(3);
    const rows = db.select().from(nodes).where(eq(nodes.storyId, id)).all();
    expect(rows.length).toBe(inserted.length);
    expect(rows.map((r) => r.orderIndex).sort((a, b) => a - b)).toEqual(rows.map((_, i) => i));
    const story = db.select().from(stories).where(eq(stories.id, id)).get();
    expect(story?.status).toBe("storyboard_done");
  });
});
```

- [ ] **Step 2: Run test, verify fail**

```bash
pnpm test -- pipeline-storyboard
```

- [ ] **Step 3: Implement**

`lib/pipeline/storyboard.ts`:
```ts
import { randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import type { DB } from "@/lib/db/client";
import { stories, characters as charactersTable, nodes } from "@/lib/db/schema";
import type { TextProvider } from "@/lib/providers/types";

export async function generateStoryboard(args: {
  db: DB;
  provider: TextProvider;
  storyId: string;
  targetMin: number;
  targetMax: number;
}): Promise<{ id: string; orderIndex: number; text: string; imagePrompt: string; characters: string[] }[]> {
  const { db, provider, storyId, targetMin, targetMax } = args;
  const story = db.select().from(stories).where(eq(stories.id, storyId)).get();
  if (!story) throw new Error(`story not found: ${storyId}`);
  const charRows = db.select().from(charactersTable).where(eq(charactersTable.storyId, storyId)).all();
  const drafts = await provider.generateStoryboard(story.storyText, {
    mode: story.inputMode as "structured" | "paste",
    characters: charRows.map((c) => ({ id: c.id, name: c.name, description: c.userInput })),
    targetMin, targetMax,
  });

  db.delete(nodes).where(eq(nodes.storyId, storyId)).run();
  const result: { id: string; orderIndex: number; text: string; imagePrompt: string; characters: string[] }[] = [];
  for (let i = 0; i < drafts.length; i++) {
    const d = drafts[i]!;
    const id = randomUUID();
    db.insert(nodes).values({
      id, storyId, orderIndex: i,
      text: d.text, imagePrompt: d.image_prompt,
      characters: JSON.stringify(d.characters),
      positionX: 0, positionY: i * 220,
    }).run();
    result.push({ id, orderIndex: i, text: d.text, imagePrompt: d.image_prompt, characters: d.characters });
  }
  db.update(stories).set({ status: "storyboard_done", updatedAt: sql`(unixepoch())` }).where(eq(stories.id, storyId)).run();
  return result;
}
```

- [ ] **Step 4: Run tests, verify pass**

```bash
pnpm test -- pipeline-storyboard
```

- [ ] **Step 5: Commit**

```bash
git add lib/pipeline/storyboard.ts tests/unit/pipeline-storyboard.test.ts
git commit -m "feat(pipeline): S3 generate storyboard nodes"
```

---

### Task 4.5: Pipeline S4 — CDS text

**Files:**
- Create: `lib/pipeline/character-design-text.ts`
- Test: `tests/unit/pipeline-cds-text.test.ts`

- [ ] **Step 1: Write failing test**

`tests/unit/pipeline-cds-text.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { makeTestDb } from "../helpers/db";
import { stories, characters } from "@/lib/db/schema";
import { generateCDSText } from "@/lib/pipeline/character-design-text";
import { FakeTextProvider } from "@/lib/providers/fake-text";
import { randomUUID } from "node:crypto";

describe("pipeline.cds-text", () => {
  it("fills CDS fields for each character", async () => {
    const { db } = await makeTestDb();
    const id = randomUUID();
    db.insert(stories).values({ id, inputMode: "structured", storyText: "x", artStylePrompt: "watercolor" }).run();
    const a = randomUUID(), b = randomUUID();
    db.insert(characters).values({ id: a, storyId: id, name: "A", userInput: "勇敢" }).run();
    db.insert(characters).values({ id: b, storyId: id, name: "B", userInput: "聪明" }).run();
    await generateCDSText({ db, provider: new FakeTextProvider(), storyId: id });
    const rows = db.select().from(characters).where(eq(characters.storyId, id)).all();
    for (const r of rows) {
      expect(r.cdsAppearance.length).toBeGreaterThan(0);
      expect(r.cdsOutfit.length).toBeGreaterThan(0);
      expect(r.cdsTraits.length).toBeGreaterThan(0);
      expect(r.cdsStyle.length).toBeGreaterThan(0);
    }
  });
});
```

- [ ] **Step 2: Run test, verify fail**

```bash
pnpm test -- pipeline-cds-text
```

- [ ] **Step 3: Implement**

`lib/pipeline/character-design-text.ts`:
```ts
import { eq } from "drizzle-orm";
import type { DB } from "@/lib/db/client";
import { stories, characters } from "@/lib/db/schema";
import type { TextProvider } from "@/lib/providers/types";

export async function generateCDSText(args: { db: DB; provider: TextProvider; storyId: string }): Promise<void> {
  const { db, provider, storyId } = args;
  const story = db.select().from(stories).where(eq(stories.id, storyId)).get();
  if (!story) throw new Error(`story not found: ${storyId}`);
  const charRows = db.select().from(characters).where(eq(characters.storyId, storyId)).all();
  if (charRows.length === 0) return;
  const drafts = await provider.generateCDS({
    characters: charRows.map((c) => ({ id: c.id, name: c.name, description: c.userInput })),
    storyText: story.storyText,
    artStylePrompt: story.artStylePrompt,
  });
  for (const d of drafts) {
    db.update(characters).set({
      cdsAppearance: d.appearance, cdsOutfit: d.outfit, cdsTraits: d.traits, cdsStyle: d.style,
    }).where(eq(characters.id, d.characterId)).run();
  }
}
```

- [ ] **Step 4: Run tests, verify pass**

```bash
pnpm test -- pipeline-cds-text
```

- [ ] **Step 5: Commit**

```bash
git add lib/pipeline/character-design-text.ts tests/unit/pipeline-cds-text.test.ts
git commit -m "feat(pipeline): S4 generate CDS text per character"
```

---

### Task 4.6: Pipeline S5 — CDS image

**Files:**
- Create: `lib/pipeline/character-design-image.ts`
- Test: `tests/unit/pipeline-cds-image.test.ts`

- [ ] **Step 1: Write failing test**

`tests/unit/pipeline-cds-image.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { mkdtempSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { eq } from "drizzle-orm";
import { makeTestDb } from "../helpers/db";
import { stories, characters, assets } from "@/lib/db/schema";
import { renderCDSImage } from "@/lib/pipeline/character-design-image";
import { FakeImageProvider } from "@/lib/providers/fake-image";
import { randomUUID } from "node:crypto";

describe("pipeline.cds-image", () => {
  it("creates an asset and links it to the character", async () => {
    const { db } = await makeTestDb();
    const root = mkdtempSync(path.join(tmpdir(), "cdsi-"));
    try {
      const sId = randomUUID();
      db.insert(stories).values({ id: sId, inputMode: "structured", artStylePrompt: "watercolor" }).run();
      const cId = randomUUID();
      db.insert(characters).values({
        id: cId, storyId: sId, name: "X",
        cdsAppearance: "tall", cdsOutfit: "blue coat", cdsTraits: "kind", cdsStyle: "soft",
      }).run();
      const result = await renderCDSImage({
        db, provider: new FakeImageProvider(), storageRoot: root, characterId: cId,
      });
      expect(result.assetId).toBeDefined();
      const row = db.select().from(characters).where(eq(characters.id, cId)).get();
      expect(row?.cdsImageId).toBe(result.assetId);
      const a = db.select().from(assets).where(eq(assets.id, result.assetId)).get();
      expect(a?.kind).toBe("cds");
      expect(existsSync(path.join(root, a!.filePath))).toBe(true);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
```

- [ ] **Step 2: Run test, verify fail**

```bash
pnpm test -- pipeline-cds-image
```

- [ ] **Step 3: Implement**

`lib/pipeline/character-design-image.ts`:
```ts
import { randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import type { DB } from "@/lib/db/client";
import { stories, characters, assets } from "@/lib/db/schema";
import type { ImageProvider } from "@/lib/providers/types";
import { saveAssetFile, readAssetFile } from "@/lib/storage/files";

export async function renderCDSImage(args: {
  db: DB;
  provider: ImageProvider;
  storageRoot: string;
  characterId: string;
  signal?: AbortSignal;
}): Promise<{ assetId: string; filePath: string }> {
  const { db, provider, storageRoot, characterId, signal } = args;
  const c = db.select().from(characters).where(eq(characters.id, characterId)).get();
  if (!c) throw new Error(`character not found: ${characterId}`);
  const story = db.select().from(stories).where(eq(stories.id, c.storyId)).get();
  if (!story) throw new Error(`story not found: ${c.storyId}`);

  const refImages: Buffer[] = [];
  if (c.userImageId) {
    const ua = db.select().from(assets).where(eq(assets.id, c.userImageId)).get();
    if (ua) refImages.push(await readAssetFile(storageRoot, ua.filePath));
  }

  const cdsBlock = [c.cdsAppearance, c.cdsOutfit, c.cdsTraits, c.cdsStyle].filter(Boolean).join(", ");
  const prompt = `${story.artStylePrompt}. Character reference sheet for ${c.name}: ${cdsBlock}. Single full-body character on neutral background, no text.`;

  const { bytes, mime } = await provider.generateImage({
    prompt, referenceImages: refImages.length ? refImages : undefined, signal,
  });

  const assetId = randomUUID();
  const filePath = await saveAssetFile({ root: storageRoot, storyId: story.id, assetId, mime, bytes });
  db.insert(assets).values({ id: assetId, storyId: story.id, kind: "cds", filePath, mime }).run();
  db.update(characters).set({ cdsImageId: assetId }).where(eq(characters.id, characterId)).run();
  db.update(stories).set({ updatedAt: sql`(unixepoch())` }).where(eq(stories.id, story.id)).run();
  return { assetId, filePath };
}
```

- [ ] **Step 4: Run tests, verify pass**

```bash
pnpm test -- pipeline-cds-image
```

- [ ] **Step 5: Commit**

```bash
git add lib/pipeline/character-design-image.ts tests/unit/pipeline-cds-image.test.ts
git commit -m "feat(pipeline): S5 render CDS reference image"
```

---

### Task 4.7: Pipeline S6 — Scene render

**Files:**
- Create: `lib/pipeline/scene-render.ts`
- Test: `tests/unit/pipeline-scene-render.test.ts`

- [ ] **Step 1: Write failing test**

`tests/unit/pipeline-scene-render.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { eq } from "drizzle-orm";
import { makeTestDb } from "../helpers/db";
import { stories, characters, nodes, assets } from "@/lib/db/schema";
import { renderScene } from "@/lib/pipeline/scene-render";
import { FakeImageProvider } from "@/lib/providers/fake-image";
import { randomUUID } from "node:crypto";

describe("pipeline.scene-render", () => {
  it("links new asset to node and concatenates style + cds + image_prompt", async () => {
    const { db } = await makeTestDb();
    const root = mkdtempSync(path.join(tmpdir(), "scn-"));
    try {
      const sId = randomUUID();
      db.insert(stories).values({ id: sId, inputMode: "structured", artStylePrompt: "watercolor" }).run();
      const cdsAssetId = randomUUID();
      db.insert(assets).values({ id: cdsAssetId, storyId: sId, kind: "cds", filePath: "x/y.png", mime: "image/png" }).run();
      // create the file so readAssetFile won't error
      const fs = await import("node:fs/promises");
      await fs.mkdir(path.join(root, "x"), { recursive: true });
      await fs.writeFile(path.join(root, "x/y.png"), Buffer.from([1]));
      const cId = randomUUID();
      db.insert(characters).values({
        id: cId, storyId: sId, name: "X",
        cdsAppearance: "tall", cdsOutfit: "blue", cdsTraits: "kind", cdsStyle: "warm",
        cdsImageId: cdsAssetId,
      }).run();
      const nId = randomUUID();
      db.insert(nodes).values({
        id: nId, storyId: sId, orderIndex: 0,
        text: "他走进森林。", imagePrompt: "X walks into a forest at dusk",
        characters: JSON.stringify([cId]),
      }).run();
      const r = await renderScene({ db, provider: new FakeImageProvider(), storageRoot: root, nodeId: nId });
      expect(r.assetId).toBeDefined();
      const row = db.select().from(nodes).where(eq(nodes.id, nId)).get();
      expect(row?.imageId).toBe(r.assetId);
      expect(r.promptUsed).toContain("watercolor");
      expect(r.promptUsed).toContain("X walks into a forest at dusk");
    } finally { rmSync(root, { recursive: true, force: true }); }
  });
});
```

- [ ] **Step 2: Run test, verify fail**

```bash
pnpm test -- pipeline-scene-render
```

- [ ] **Step 3: Implement**

`lib/pipeline/scene-render.ts`:
```ts
import { randomUUID } from "node:crypto";
import { eq, inArray, sql } from "drizzle-orm";
import type { DB } from "@/lib/db/client";
import { stories, characters, nodes, assets } from "@/lib/db/schema";
import type { ImageProvider } from "@/lib/providers/types";
import { saveAssetFile, readAssetFile } from "@/lib/storage/files";

export async function renderScene(args: {
  db: DB;
  provider: ImageProvider;
  storageRoot: string;
  nodeId: string;
  signal?: AbortSignal;
}): Promise<{ assetId: string; filePath: string; promptUsed: string }> {
  const { db, provider, storageRoot, nodeId, signal } = args;
  const node = db.select().from(nodes).where(eq(nodes.id, nodeId)).get();
  if (!node) throw new Error(`node not found: ${nodeId}`);
  const story = db.select().from(stories).where(eq(stories.id, node.storyId)).get();
  if (!story) throw new Error(`story not found: ${node.storyId}`);

  const cIds: string[] = JSON.parse(node.characters || "[]");
  const cRows = cIds.length
    ? db.select().from(characters).where(inArray(characters.id, cIds)).all()
    : [];
  const refBuffers: Buffer[] = [];
  for (const c of cRows) {
    if (c.cdsImageId) {
      const a = db.select().from(assets).where(eq(assets.id, c.cdsImageId)).get();
      if (a) refBuffers.push(await readAssetFile(storageRoot, a.filePath));
    }
  }

  const cdsBlock = cRows
    .map((c) => `${c.name}: ${[c.cdsAppearance, c.cdsOutfit, c.cdsTraits, c.cdsStyle].filter(Boolean).join(", ")}`)
    .join(" | ");
  const promptUsed = [story.artStylePrompt, cdsBlock, node.imagePrompt].filter(Boolean).join("\n\n");

  const { bytes, mime } = await provider.generateImage({
    prompt: promptUsed, referenceImages: refBuffers.length ? refBuffers : undefined, signal,
  });

  const assetId = randomUUID();
  const filePath = await saveAssetFile({ root: storageRoot, storyId: story.id, assetId, mime, bytes });
  db.insert(assets).values({ id: assetId, storyId: story.id, kind: "scene", filePath, mime }).run();
  db.update(nodes).set({ imageId: assetId }).where(eq(nodes.id, nodeId)).run();
  db.update(stories).set({ updatedAt: sql`(unixepoch())` }).where(eq(stories.id, story.id)).run();
  return { assetId, filePath, promptUsed };
}
```

- [ ] **Step 4: Run tests, verify pass**

```bash
pnpm test -- pipeline-scene-render
```

- [ ] **Step 5: Commit**

```bash
git add lib/pipeline/scene-render.ts tests/unit/pipeline-scene-render.test.ts
git commit -m "feat(pipeline): S6 render scene image with cds references"
```

---

## Phase 5 — API Routes

Each route is a thin Next.js Route Handler that delegates to pipeline functions or direct DB queries.
Per-route unit tests are skipped — Phase 7 E2E covers the wire. Tests below are only added for routes with non-trivial wiring (SSE, multipart upload).

A shared helper lazily wires the runtime singletons.

### Task 5.1: Runtime helpers

**Files:**
- Create: `lib/runtime.ts`

- [ ] **Step 1: Implement**

`lib/runtime.ts`:
```ts
import { getConfig, type Config } from "./config";
import { getDb, runMigrations, type DB } from "./db/client";
import { getSseBus, SseBus } from "./jobs/sse-bus";
import { getJobQueue } from "./jobs/queue";
import { getTextProvider, getImageProvider } from "./providers/factory";
import type { TextProvider, ImageProvider } from "./providers/types";
import type { JobQueue } from "./jobs/queue";
import path from "node:path";

export interface Runtime {
  cfg: Config;
  db: DB;
  bus: SseBus;
  queue: JobQueue;
  text: TextProvider;
  image: ImageProvider;
  storageRoot: string;
}

let _runtime: Runtime | null = null;
let _migrated = false;

export async function getRuntime(): Promise<Runtime> {
  if (_runtime) return _runtime;
  const cfg = getConfig();
  const db = getDb();
  if (!_migrated) { await runMigrations(db); _migrated = true; }
  _runtime = {
    cfg, db,
    bus: getSseBus(),
    queue: getJobQueue(cfg.jobConcurrency),
    text: getTextProvider(cfg),
    image: getImageProvider(cfg),
    storageRoot: path.resolve(process.cwd(), cfg.storageDir),
  };
  return _runtime;
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/runtime.ts
git commit -m "feat(runtime): add lazy runtime singleton wiring"
```

---

### Task 5.2: POST /api/stories — Create story

**Files:**
- Create: `app/api/stories/route.ts`

- [ ] **Step 1: Implement**

`app/api/stories/route.ts`:
```ts
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { getRuntime } from "@/lib/runtime";
import { stories, characters as charactersTable } from "@/lib/db/schema";

export const runtime = "nodejs";

const Schema = z.object({
  inputMode: z.enum(["structured", "paste"]),
  title: z.string().default(""),
  setting: z.string().default(""),
  opening: z.string().default(""),
  storyText: z.string().default(""),
  characters: z.array(z.object({
    name: z.string().min(1),
    description: z.string().default(""),
    userImageId: z.string().optional(),
  })).default([]),
});

export async function POST(req: NextRequest) {
  const { db } = await getRuntime();
  const body = Schema.parse(await req.json());
  const id = randomUUID();
  db.insert(stories).values({
    id, title: body.title, inputMode: body.inputMode,
    setting: body.setting, opening: body.opening,
    storyText: body.storyText,
    status: body.inputMode === "paste" && body.storyText ? "text_done" : "draft",
  }).run();
  for (const c of body.characters) {
    const cid = randomUUID();
    db.insert(charactersTable).values({
      id: cid, storyId: id, name: c.name, userInput: c.description,
      userImageId: c.userImageId ?? null,
    }).run();
  }
  return NextResponse.json({ id });
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/stories/route.ts
git commit -m "feat(api): POST /api/stories"
```

---

### Task 5.3: GET /api/stories/[id] — Fetch story

**Files:**
- Create: `app/api/stories/[id]/route.ts`

- [ ] **Step 1: Implement**

`app/api/stories/[id]/route.ts`:
```ts
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getRuntime } from "@/lib/runtime";
import { stories, characters, nodes, assets } from "@/lib/db/schema";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { db } = await getRuntime();
  const story = db.select().from(stories).where(eq(stories.id, id)).get();
  if (!story) return NextResponse.json({ error: "not found" }, { status: 404 });
  const cs = db.select().from(characters).where(eq(characters.storyId, id)).all();
  const ns = db.select().from(nodes).where(eq(nodes.storyId, id)).all().sort((a, b) => a.orderIndex - b.orderIndex);
  const as = db.select().from(assets).where(eq(assets.storyId, id)).all();
  return NextResponse.json({ story, characters: cs, nodes: ns, assets: as });
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/stories/[id]/route.ts
git commit -m "feat(api): GET /api/stories/:id"
```

---

### Task 5.4: Story-level pipeline routes

**Files:**
- Create: `app/api/stories/[id]/generate-text/route.ts`, `app/api/stories/[id]/revise-text/route.ts`, `app/api/stories/[id]/extract-characters/route.ts`, `app/api/stories/[id]/storyboard/route.ts`, `app/api/stories/[id]/cds/route.ts`, `app/api/stories/[id]/render-all/route.ts`

Pattern: each route creates a `jobs` row, kicks off `runJob` in the background (does not await), returns `{ jobId }`. Frontend subscribes via SSE.

- [ ] **Step 1: Add `startJob` helper to `lib/runtime.ts`**

Edit `lib/runtime.ts` so its imports section becomes:
```ts
import { randomUUID } from "node:crypto";
import path from "node:path";
import { getConfig, type Config } from "./config";
import { getDb, runMigrations, type DB } from "./db/client";
import { getSseBus, SseBus } from "./jobs/sse-bus";
import { getJobQueue, type JobQueue } from "./jobs/queue";
import { getTextProvider, getImageProvider } from "./providers/factory";
import type { TextProvider, ImageProvider } from "./providers/types";
import { jobs } from "./db/schema";
import { runJob, type JobContext } from "./jobs/runner";
```

Then append this exported function at the end of the file:
```ts
export async function startJob(args: {
  rt: Runtime;
  storyId: string;
  kind: typeof jobs.$inferInsert.kind;
  targetId?: string;
  fn: (ctx: JobContext) => Promise<unknown>;
}): Promise<string> {
  const id = randomUUID();
  args.rt.db.insert(jobs).values({ id, storyId: args.storyId, kind: args.kind, targetId: args.targetId ?? null }).run();
  void runJob({ db: args.rt.db, queue: args.rt.queue, bus: args.rt.bus, jobId: id, fn: args.fn })
    .catch(() => {/* runner already records error */});
  return id;
}
```

- [ ] **Step 2: Implement generate-text**

`app/api/stories/[id]/generate-text/route.ts`:
```ts
import { NextRequest, NextResponse } from "next/server";
import { getRuntime, startJob } from "@/lib/runtime";
import { generateStoryText } from "@/lib/pipeline/story-text";

export const runtime = "nodejs";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rt = await getRuntime();
  const jobId = await startJob({
    rt, storyId: id, kind: "generate_story",
    fn: async (ctx) => {
      const out = await generateStoryText({
        db: rt.db, provider: rt.text, storyId: id, signal: ctx.signal,
        onChunk: (c) => ctx.publish({ type: "chunk", data: c }),
      });
      return { length: out.length };
    },
  });
  return NextResponse.json({ jobId });
}
```

- [ ] **Step 3: Implement revise-text**

`app/api/stories/[id]/revise-text/route.ts`:
```ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRuntime, startJob } from "@/lib/runtime";
import { generateStoryText } from "@/lib/pipeline/story-text";

export const runtime = "nodejs";
const Body = z.object({ revisePrompt: z.string().min(1) });

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { revisePrompt } = Body.parse(await req.json());
  const rt = await getRuntime();
  const jobId = await startJob({
    rt, storyId: id, kind: "revise_story",
    fn: async (ctx) => {
      await generateStoryText({
        db: rt.db, provider: rt.text, storyId: id, revisePrompt, signal: ctx.signal,
        onChunk: (c) => ctx.publish({ type: "chunk", data: c }),
      });
      return { ok: true };
    },
  });
  return NextResponse.json({ jobId });
}
```

- [ ] **Step 4: Implement extract-characters**

`app/api/stories/[id]/extract-characters/route.ts`:
```ts
import { NextRequest, NextResponse } from "next/server";
import { getRuntime, startJob } from "@/lib/runtime";
import { extractCharacters } from "@/lib/pipeline/character-extract";

export const runtime = "nodejs";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rt = await getRuntime();
  const jobId = await startJob({
    rt, storyId: id, kind: "extract_chars",
    fn: async () => extractCharacters({ db: rt.db, provider: rt.text, storyId: id }),
  });
  return NextResponse.json({ jobId });
}
```

- [ ] **Step 5: Implement storyboard**

`app/api/stories/[id]/storyboard/route.ts`:
```ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRuntime, startJob } from "@/lib/runtime";
import { generateStoryboard } from "@/lib/pipeline/storyboard";

export const runtime = "nodejs";
const Body = z.object({
  targetMin: z.number().int().min(2).max(20).default(6),
  targetMax: z.number().int().min(2).max(30).default(12),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { targetMin, targetMax } = Body.parse(await req.json().catch(() => ({})));
  const rt = await getRuntime();
  const jobId = await startJob({
    rt, storyId: id, kind: "storyboard",
    fn: async () => generateStoryboard({ db: rt.db, provider: rt.text, storyId: id, targetMin, targetMax }),
  });
  return NextResponse.json({ jobId });
}
```

- [ ] **Step 6: Implement cds (text)**

`app/api/stories/[id]/cds/route.ts`:
```ts
import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { getRuntime, startJob } from "@/lib/runtime";
import { stories } from "@/lib/db/schema";
import { generateCDSText } from "@/lib/pipeline/character-design-text";

export const runtime = "nodejs";
const Body = z.object({
  artStyleKey: z.string().min(1),
  artStylePrompt: z.string().min(1),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { artStyleKey, artStylePrompt } = Body.parse(await req.json());
  const rt = await getRuntime();
  rt.db.update(stories).set({
    artStyleKey, artStylePrompt, status: "style_done", updatedAt: sql`(unixepoch())`,
  }).where(eq(stories.id, id)).run();
  const jobId = await startJob({
    rt, storyId: id, kind: "cds_text",
    fn: async () => {
      await generateCDSText({ db: rt.db, provider: rt.text, storyId: id });
      rt.db.update(stories).set({ status: "cds_done", updatedAt: sql`(unixepoch())` }).where(eq(stories.id, id)).run();
      return { ok: true };
    },
  });
  return NextResponse.json({ jobId });
}
```

- [ ] **Step 7: Implement render-all**

`app/api/stories/[id]/render-all/route.ts`:
```ts
import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { getRuntime, startJob } from "@/lib/runtime";
import { stories, nodes } from "@/lib/db/schema";
import { renderScene } from "@/lib/pipeline/scene-render";

export const runtime = "nodejs";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rt = await getRuntime();
  rt.db.update(stories).set({ status: "rendering", updatedAt: sql`(unixepoch())` }).where(eq(stories.id, id)).run();
  const ns = rt.db.select().from(nodes).where(eq(nodes.storyId, id)).all();
  const total = ns.length;
  const jobId = await startJob({
    rt, storyId: id, kind: "scene_render",
    fn: async (ctx) => {
      let done = 0;
      const errors: { nodeId: string; message: string }[] = [];
      // Per-node renders go through the same shared queue (concurrency-limited).
      await Promise.all(ns.map(async (n) => {
        try {
          await renderScene({ db: rt.db, provider: rt.image, storageRoot: rt.storageRoot, nodeId: n.id, signal: ctx.signal });
        } catch (err) {
          errors.push({ nodeId: n.id, message: err instanceof Error ? err.message : String(err) });
        } finally {
          done += 1;
          ctx.publish({ type: "progress", data: { current: done, total } });
        }
      }));
      rt.db.update(stories).set({ status: "done", updatedAt: sql`(unixepoch())` }).where(eq(stories.id, id)).run();
      return { total, errors };
    },
  });
  return NextResponse.json({ jobId, total });
}
```

Note: child renders within `Promise.all` run inline, not via the queue, because the parent job already holds a queue slot. Concurrency between parent jobs is still limited; per-node parallelism is unlimited within a single render-all. If you want strict global limits, refactor `renderScene` to enqueue per-node sub-jobs and have the parent await them — out of scope for MVP.

- [ ] **Step 8: Commit**

```bash
git add app/api/stories lib/runtime.ts
git commit -m "feat(api): story-level pipeline routes (generate, revise, extract, storyboard, cds, render-all)"
```

---

### Task 5.5: Character routes

**Files:**
- Create: `app/api/characters/[id]/route.ts`, `app/api/characters/[id]/render/route.ts`

- [ ] **Step 1: Implement PATCH/DELETE**

`app/api/characters/[id]/route.ts`:
```ts
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getRuntime } from "@/lib/runtime";
import { characters } from "@/lib/db/schema";

export const runtime = "nodejs";
const Patch = z.object({
  name: z.string().min(1).optional(),
  userInput: z.string().optional(),
  userImageId: z.string().nullable().optional(),
  cdsAppearance: z.string().optional(),
  cdsOutfit: z.string().optional(),
  cdsTraits: z.string().optional(),
  cdsStyle: z.string().optional(),
  confirmed: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = Patch.parse(await req.json());
  const { db } = await getRuntime();
  db.update(characters).set(body).where(eq(characters.id, id)).run();
  const row = db.select().from(characters).where(eq(characters.id, id)).get();
  return NextResponse.json(row);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { db } = await getRuntime();
  db.delete(characters).where(eq(characters.id, id)).run();
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Implement render endpoint**

`app/api/characters/[id]/render/route.ts`:
```ts
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getRuntime, startJob } from "@/lib/runtime";
import { characters } from "@/lib/db/schema";
import { renderCDSImage } from "@/lib/pipeline/character-design-image";

export const runtime = "nodejs";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rt = await getRuntime();
  const c = rt.db.select().from(characters).where(eq(characters.id, id)).get();
  if (!c) return NextResponse.json({ error: "not found" }, { status: 404 });
  const jobId = await startJob({
    rt, storyId: c.storyId, kind: "cds_image", targetId: id,
    fn: async (ctx) => renderCDSImage({
      db: rt.db, provider: rt.image, storageRoot: rt.storageRoot, characterId: id, signal: ctx.signal,
    }),
  });
  return NextResponse.json({ jobId });
}
```

- [ ] **Step 3: Commit**

```bash
git add app/api/characters
git commit -m "feat(api): character PATCH/DELETE and CDS image render"
```

---

### Task 5.6: Node routes

**Files:**
- Create: `app/api/nodes/[id]/route.ts`, `app/api/nodes/[id]/render/route.ts`

- [ ] **Step 1: Implement PATCH/DELETE**

`app/api/nodes/[id]/route.ts`:
```ts
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getRuntime } from "@/lib/runtime";
import { nodes } from "@/lib/db/schema";

export const runtime = "nodejs";
const Patch = z.object({
  text: z.string().optional(),
  imagePrompt: z.string().optional(),
  characters: z.array(z.string()).optional(),
  orderIndex: z.number().int().optional(),
  positionX: z.number().optional(),
  positionY: z.number().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = Patch.parse(await req.json());
  const { db } = await getRuntime();
  const update: Record<string, unknown> = { ...body };
  if (body.characters) update.characters = JSON.stringify(body.characters);
  db.update(nodes).set(update).where(eq(nodes.id, id)).run();
  return NextResponse.json(db.select().from(nodes).where(eq(nodes.id, id)).get());
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { db } = await getRuntime();
  db.delete(nodes).where(eq(nodes.id, id)).run();
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Implement single-node render**

`app/api/nodes/[id]/render/route.ts`:
```ts
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getRuntime, startJob } from "@/lib/runtime";
import { nodes } from "@/lib/db/schema";
import { renderScene } from "@/lib/pipeline/scene-render";

export const runtime = "nodejs";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rt = await getRuntime();
  const n = rt.db.select().from(nodes).where(eq(nodes.id, id)).get();
  if (!n) return NextResponse.json({ error: "not found" }, { status: 404 });
  const jobId = await startJob({
    rt, storyId: n.storyId, kind: "scene_render", targetId: id,
    fn: async (ctx) => renderScene({
      db: rt.db, provider: rt.image, storageRoot: rt.storageRoot, nodeId: id, signal: ctx.signal,
    }),
  });
  return NextResponse.json({ jobId });
}
```

- [ ] **Step 3: Commit**

```bash
git add app/api/nodes
git commit -m "feat(api): node PATCH/DELETE and per-node scene render"
```

---

### Task 5.7: Upload route + asset serve

**Files:**
- Create: `app/api/uploads/route.ts`, `app/api/assets/[id]/route.ts`

- [ ] **Step 1: Implement upload**

`app/api/uploads/route.ts`:
```ts
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getRuntime } from "@/lib/runtime";
import { assets, stories } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { saveAssetFile } from "@/lib/storage/files";

export const runtime = "nodejs";
const ALLOWED_MIME = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get("file");
  const storyId = form.get("storyId");
  if (!(file instanceof File) || typeof storyId !== "string") {
    return NextResponse.json({ error: "file and storyId required" }, { status: 400 });
  }
  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json({ error: `unsupported mime ${file.type}` }, { status: 415 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "file too large (>5MB)" }, { status: 413 });
  }
  const rt = await getRuntime();
  const story = rt.db.select().from(stories).where(eq(stories.id, storyId)).get();
  if (!story) return NextResponse.json({ error: "story not found" }, { status: 404 });
  const assetId = randomUUID();
  const bytes = Buffer.from(await file.arrayBuffer());
  const filePath = await saveAssetFile({ root: rt.storageRoot, storyId, assetId, mime: file.type, bytes });
  rt.db.insert(assets).values({ id: assetId, storyId, kind: "user_upload", filePath, mime: file.type }).run();
  return NextResponse.json({ assetId });
}
```

- [ ] **Step 2: Implement asset serve**

`app/api/assets/[id]/route.ts`:
```ts
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getRuntime } from "@/lib/runtime";
import { assets } from "@/lib/db/schema";
import { readAssetFile } from "@/lib/storage/files";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rt = await getRuntime();
  const a = rt.db.select().from(assets).where(eq(assets.id, id)).get();
  if (!a) return NextResponse.json({ error: "not found" }, { status: 404 });
  const bytes = await readAssetFile(rt.storageRoot, a.filePath);
  return new NextResponse(bytes as unknown as BodyInit, {
    headers: { "Content-Type": a.mime, "Cache-Control": "private, max-age=3600" },
  });
}
```

- [ ] **Step 3: Commit**

```bash
git add app/api/uploads app/api/assets
git commit -m "feat(api): multipart upload and asset serve"
```

---

### Task 5.8: SSE endpoint

**Files:**
- Create: `app/api/sse/jobs/[id]/route.ts`

- [ ] **Step 1: Implement**

`app/api/sse/jobs/[id]/route.ts`:
```ts
import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { getRuntime } from "@/lib/runtime";
import { jobs } from "@/lib/db/schema";

export const runtime = "nodejs";

function pack(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rt = await getRuntime();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const enc = new TextEncoder();
      const job = rt.db.select().from(jobs).where(eq(jobs.id, id)).get();
      if (!job) {
        controller.enqueue(enc.encode(pack("error", { message: "job not found" })));
        controller.close();
        return;
      }
      // If already terminal, replay the final state.
      if (job.status === "done" || job.status === "error" || job.status === "canceled") {
        controller.enqueue(enc.encode(pack(job.status === "done" ? "done" : "error", { status: job.status, error: job.error ?? null })));
        controller.close();
        return;
      }
      const unsub = rt.bus.subscribe(id, (e) => {
        controller.enqueue(enc.encode(pack(e.type, e.data)));
        if (e.type === "done" || e.type === "error") {
          controller.close();
          unsub();
        }
      });
    },
    cancel() {
      // Connection closed by client; leave job running.
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
    },
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/sse
git commit -m "feat(api): SSE endpoint for job progress"
```

---

### Task 5.9: Cancel job route

**Files:**
- Create: `app/api/jobs/[id]/route.ts`

- [ ] **Step 1: Implement**

`app/api/jobs/[id]/route.ts`:
```ts
import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { getRuntime } from "@/lib/runtime";
import { jobs } from "@/lib/db/schema";

export const runtime = "nodejs";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rt = await getRuntime();
  rt.queue.cancel(id);
  rt.db.update(jobs)
    .set({ status: "canceled", updatedAt: sql`(unixepoch())` })
    .where(eq(jobs.id, id))
    .run();
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/jobs
git commit -m "feat(api): DELETE /api/jobs/:id to cancel"
```

---

## Phase 6 — Frontend

Frontend mostly arranges UI around the API. Per-component unit tests are skipped; Phase 7 E2E covers the wizard. Each task ends with `pnpm typecheck && pnpm build` + commit.

### Task 6.1: API client + SSE hook

**Files:**
- Create: `lib/client/api.ts`, `lib/client/useJob.ts`

- [ ] **Step 1: Implement API client**

`lib/client/api.ts`:
```ts
async function jsonReq<T>(method: string, url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`${res.status} ${err}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  createStory: (body: any) => jsonReq<{ id: string }>("POST", "/api/stories", body),
  getStory: (id: string) => jsonReq<any>("GET", `/api/stories/${id}`),
  generateText: (id: string) => jsonReq<{ jobId: string }>("POST", `/api/stories/${id}/generate-text`),
  reviseText: (id: string, revisePrompt: string) => jsonReq<{ jobId: string }>("POST", `/api/stories/${id}/revise-text`, { revisePrompt }),
  extractCharacters: (id: string) => jsonReq<{ jobId: string }>("POST", `/api/stories/${id}/extract-characters`),
  storyboard: (id: string, opts?: { targetMin?: number; targetMax?: number }) =>
    jsonReq<{ jobId: string }>("POST", `/api/stories/${id}/storyboard`, opts ?? {}),
  cds: (id: string, body: { artStyleKey: string; artStylePrompt: string }) =>
    jsonReq<{ jobId: string }>("POST", `/api/stories/${id}/cds`, body),
  renderCharacter: (cid: string) => jsonReq<{ jobId: string }>("POST", `/api/characters/${cid}/render`),
  patchCharacter: (cid: string, body: any) => jsonReq<any>("PATCH", `/api/characters/${cid}`, body),
  patchNode: (nid: string, body: any) => jsonReq<any>("PATCH", `/api/nodes/${nid}`, body),
  deleteNode: (nid: string) => jsonReq<{ ok: true }>("DELETE", `/api/nodes/${nid}`),
  renderNode: (nid: string) => jsonReq<{ jobId: string }>("POST", `/api/nodes/${nid}/render`),
  renderAll: (id: string) => jsonReq<{ jobId: string; total: number }>("POST", `/api/stories/${id}/render-all`),
  cancelJob: (jid: string) => jsonReq<{ ok: true }>("DELETE", `/api/jobs/${jid}`),
  uploadFile: async (storyId: string, file: File): Promise<{ assetId: string }> => {
    const fd = new FormData();
    fd.append("file", file); fd.append("storyId", storyId);
    const res = await fetch("/api/uploads", { method: "POST", body: fd });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
};
```

- [ ] **Step 2: Implement useJob hook**

`lib/client/useJob.ts`:
```ts
"use client";
import { useEffect, useRef, useState } from "react";

export interface JobState {
  status: "running" | "done" | "error";
  chunks: string;
  progress?: { current: number; total: number };
  result?: unknown;
  error?: string;
}

export function useJob(jobId: string | null): JobState {
  const [state, setState] = useState<JobState>({ status: "running", chunks: "" });
  const ref = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!jobId) return;
    setState({ status: "running", chunks: "" });
    const es = new EventSource(`/api/sse/jobs/${jobId}`);
    ref.current = es;
    es.addEventListener("chunk", (e: MessageEvent) => {
      const data = JSON.parse(e.data) as string;
      setState((s) => ({ ...s, chunks: s.chunks + data }));
    });
    es.addEventListener("progress", (e: MessageEvent) => {
      setState((s) => ({ ...s, progress: JSON.parse(e.data) }));
    });
    es.addEventListener("done", (e: MessageEvent) => {
      setState((s) => ({ ...s, status: "done", result: JSON.parse(e.data) }));
      es.close();
    });
    es.addEventListener("error", (e: MessageEvent) => {
      const data = (e as MessageEvent).data ? JSON.parse((e as MessageEvent).data) : { message: "stream error" };
      setState((s) => ({ ...s, status: "error", error: data.message ?? "error" }));
      es.close();
    });
    return () => es.close();
  }, [jobId]);

  return state;
}
```

- [ ] **Step 3: Verify typecheck**

```bash
pnpm typecheck
```

- [ ] **Step 4: Commit**

```bash
git add lib/client
git commit -m "feat(client): api client and useJob SSE hook"
```

---

### Task 6.2: Home page (Step 1)

**Files:**
- Create: `app/page.tsx` (overwrite placeholder), `app/_components/InputModeStructured.tsx`, `app/_components/InputModePaste.tsx`, `app/_components/CharacterUploadField.tsx`

- [ ] **Step 1: Implement home page**

`app/page.tsx`:
```tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/client/api";
import { toast } from "sonner";
import { InputModeStructured } from "./_components/InputModeStructured";
import { InputModePaste } from "./_components/InputModePaste";

export default function Home() {
  const router = useRouter();
  const [mode, setMode] = useState<"structured" | "paste">("structured");
  const [structured, setStructured] = useState({ setting: "", opening: "", title: "", characters: [] as { name: string; description: string; userImageId?: string }[] });
  const [paste, setPaste] = useState({ title: "", storyText: "" });
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    try {
      const body = mode === "structured"
        ? { inputMode: "structured", title: structured.title, setting: structured.setting, opening: structured.opening, characters: structured.characters }
        : { inputMode: "paste", title: paste.title, storyText: paste.storyText, characters: [] };
      const { id } = await api.createStory(body);
      router.push(`/s/${id}?step=${mode === "paste" ? "extract" : "story"}`);
    } catch (e: any) {
      toast.error(e.message ?? "创建失败");
    } finally { setBusy(false); }
  }

  return (
    <main className="max-w-2xl mx-auto p-8 space-y-6">
      <h1 className="text-3xl font-bold">Storyteller</h1>
      <p className="text-muted-foreground">把你的故事变成图文绘本</p>
      <Tabs value={mode} onValueChange={(v) => setMode(v as any)}>
        <TabsList>
          <TabsTrigger value="structured">结构化输入</TabsTrigger>
          <TabsTrigger value="paste">粘贴完整故事</TabsTrigger>
        </TabsList>
        <TabsContent value="structured">
          <InputModeStructured value={structured} onChange={setStructured} />
        </TabsContent>
        <TabsContent value="paste">
          <InputModePaste value={paste} onChange={setPaste} />
        </TabsContent>
      </Tabs>
      <Button onClick={submit} disabled={busy} size="lg">{busy ? "创建中…" : "下一步"}</Button>
    </main>
  );
}
```

- [ ] **Step 2: Implement structured input**

`app/_components/InputModeStructured.tsx`:
```tsx
"use client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

interface Character { name: string; description: string; userImageId?: string; }
interface Value { title: string; setting: string; opening: string; characters: Character[]; }

export function InputModeStructured({ value, onChange }: { value: Value; onChange: (v: Value) => void }) {
  const set = (patch: Partial<Value>) => onChange({ ...value, ...patch });
  const upsertChar = (i: number, p: Partial<Character>) => {
    const next = [...value.characters];
    next[i] = { ...next[i]!, ...p };
    set({ characters: next });
  };
  return (
    <div className="space-y-4 mt-4">
      <div>
        <Label>标题（可选）</Label>
        <Input value={value.title} onChange={(e) => set({ title: e.target.value })} />
      </div>
      <div>
        <Label>故事设定</Label>
        <Textarea rows={4} value={value.setting} onChange={(e) => set({ setting: e.target.value })} placeholder="例如：森林深处住着一群会说话的动物" />
      </div>
      <div>
        <Label>角色</Label>
        <div className="space-y-3">
          {value.characters.map((c, i) => (
            <Card key={i} className="p-3 space-y-2">
              <Input placeholder="名字" value={c.name} onChange={(e) => upsertChar(i, { name: e.target.value })} />
              <Textarea placeholder="描述" rows={2} value={c.description} onChange={(e) => upsertChar(i, { description: e.target.value })} />
              <Button variant="ghost" size="sm" onClick={() => set({ characters: value.characters.filter((_, j) => j !== i) })}>删除</Button>
            </Card>
          ))}
          <Button variant="outline" size="sm" onClick={() => set({ characters: [...value.characters, { name: "", description: "" }] })}>+ 添加角色</Button>
        </div>
      </div>
      <div>
        <Label>起始剧情</Label>
        <Textarea rows={3} value={value.opening} onChange={(e) => set({ opening: e.target.value })} placeholder="故事从哪里开始" />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Implement paste input**

`app/_components/InputModePaste.tsx`:
```tsx
"use client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface Value { title: string; storyText: string; }

export function InputModePaste({ value, onChange }: { value: Value; onChange: (v: Value) => void }) {
  return (
    <div className="space-y-4 mt-4">
      <div>
        <Label>标题（可选）</Label>
        <Input value={value.title} onChange={(e) => onChange({ ...value, title: e.target.value })} />
      </div>
      <div>
        <Label>完整故事</Label>
        <Textarea rows={14} value={value.storyText} onChange={(e) => onChange({ ...value, storyText: e.target.value })} placeholder="把你写好的故事粘贴到这里…" />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify build**

```bash
pnpm typecheck && pnpm build
```

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx app/_components
git commit -m "feat(ui): home page with structured/paste input modes"
```

---

### Task 6.3: Story page shell with step routing

**Files:**
- Create: `app/s/[uuid]/page.tsx`, `app/s/[uuid]/_components/StepShell.tsx`

- [ ] **Step 1: Implement page**

`app/s/[uuid]/page.tsx`:
```tsx
import { StepShell } from "./_components/StepShell";

export default async function StoryPage({ params, searchParams }: {
  params: Promise<{ uuid: string }>;
  searchParams: Promise<{ step?: string; mode?: string }>;
}) {
  const { uuid } = await params;
  const sp = await searchParams;
  return <StepShell storyId={uuid} step={sp.step ?? "auto"} mode={sp.mode ?? "edit"} />;
}
```

- [ ] **Step 2: Implement shell that loads story and dispatches by step**

`app/s/[uuid]/_components/StepShell.tsx`:
```tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/client/api";
import { StepStoryText } from "./StepStoryText";
import { StepExtract } from "./StepExtract";
import { StepStoryboard } from "./StepStoryboard";
import { StepArtStyle } from "./StepArtStyle";
import { StepCDS } from "./StepCDS";
import { StepRender } from "./StepRender";
import { EditorCanvas } from "./EditorCanvas";
import { ReadView } from "./ReadView";

export function StepShell({ storyId, step, mode }: { storyId: string; step: string; mode: string }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [data, setData] = useState<any>(null);
  useEffect(() => { api.getStory(storyId).then(setData).catch(() => {}); }, [storyId]);
  if (!data) return <div className="p-8">加载中…</div>;

  const goto = (s: string) => router.push(`/s/${storyId}?step=${s}`);
  const gotoMode = (m: "edit" | "read") => router.push(`/s/${storyId}?mode=${m}`);

  // If mode param given (no step), render canvas/read view.
  if (sp.get("mode") && !sp.get("step")) {
    return mode === "read"
      ? <ReadView data={data} onSwitch={() => gotoMode("edit")} />
      : <EditorCanvas data={data} onSwitch={() => gotoMode("read")} reload={() => api.getStory(storyId).then(setData)} />;
  }

  switch (step) {
    case "story":   return <StepStoryText data={data} onNext={() => goto("storyboard")} reload={() => api.getStory(storyId).then(setData)} />;
    case "extract": return <StepExtract data={data} onNext={() => goto("storyboard")} reload={() => api.getStory(storyId).then(setData)} />;
    case "storyboard": return <StepStoryboard data={data} onNext={() => goto("style")} reload={() => api.getStory(storyId).then(setData)} />;
    case "style":   return <StepArtStyle data={data} onNext={() => goto("cds")} reload={() => api.getStory(storyId).then(setData)} />;
    case "cds":     return <StepCDS data={data} onNext={() => goto("render")} reload={() => api.getStory(storyId).then(setData)} />;
    case "render":  return <StepRender data={data} onDone={() => router.push(`/s/${storyId}?mode=edit`)} reload={() => api.getStory(storyId).then(setData)} />;
    default: {
      // auto-route based on status
      const s = data.story.status as string;
      const map: Record<string, string> = { draft: "story", text_done: "storyboard", storyboard_done: "style", style_done: "cds", cds_done: "render", rendering: "render", done: "" };
      const next = map[s] ?? "story";
      if (next) router.replace(`/s/${storyId}?step=${next}`);
      else router.replace(`/s/${storyId}?mode=edit`);
      return <div className="p-8">跳转中…</div>;
    }
  }
}
```

- [ ] **Step 3: Add stub child components so the page compiles**

Create empty stubs that we will fill in subsequent tasks. Each file should export a default-named React component matching the import.

`app/s/[uuid]/_components/StepStoryText.tsx`:
```tsx
"use client";
export function StepStoryText(_: any) { return <div className="p-8">Step: Story Text (stub)</div>; }
```

Create the same one-line stub form for: `StepExtract.tsx`, `StepStoryboard.tsx`, `StepArtStyle.tsx`, `StepCDS.tsx`, `StepRender.tsx`, `EditorCanvas.tsx`, `ReadView.tsx` — each returning a placeholder div.

- [ ] **Step 4: Verify build**

```bash
pnpm typecheck && pnpm build
```

- [ ] **Step 5: Commit**

```bash
git add app/s
git commit -m "feat(ui): story page shell with step routing and stubs"
```

---

### Task 6.4: Step 2 — Story text view (structured mode)

**Files:**
- Modify: `app/s/[uuid]/_components/StepStoryText.tsx`

- [ ] **Step 1: Replace stub with full implementation**

```tsx
"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/client/api";
import { useJob } from "@/lib/client/useJob";
import { toast } from "sonner";

export function StepStoryText({ data, onNext, reload }: any) {
  const [jobId, setJobId] = useState<string | null>(null);
  const job = useJob(jobId);
  const [edited, setEdited] = useState<string>(data.story.storyText ?? "");
  const [revisePrompt, setRevisePrompt] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!data.story.storyText && data.story.inputMode === "structured" && jobId === null) {
      api.generateText(data.story.id).then((r) => setJobId(r.jobId)).catch((e) => toast.error(e.message));
    }
  }, [data.story.id]);

  useEffect(() => {
    if (job.status === "done") {
      reload();
    }
    if (job.status === "error") toast.error(job.error ?? "生成失败");
  }, [job.status]);

  useEffect(() => { setEdited(data.story.storyText ?? ""); }, [data.story.storyText]);

  async function revise() {
    if (!revisePrompt.trim()) return;
    const { jobId } = await api.reviseText(data.story.id, revisePrompt.trim());
    setJobId(jobId);
    setRevisePrompt("");
  }

  async function saveEdit() {
    setSaving(true);
    try {
      await fetch(`/api/stories/${data.story.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ storyText: edited }) });
      reload();
      toast.success("已保存");
    } finally { setSaving(false); }
  }

  const liveText = job.status === "running" ? job.chunks : edited;
  const isStreaming = job.status === "running";

  return (
    <main className="max-w-3xl mx-auto p-8 space-y-6">
      <h2 className="text-xl font-semibold">故事文本</h2>
      {isStreaming
        ? <div className="whitespace-pre-wrap border rounded p-4 bg-muted/20 min-h-[200px]">{liveText}<span className="animate-pulse">▍</span></div>
        : <Textarea rows={18} value={edited} onChange={(e) => setEdited(e.target.value)} />}
      {!isStreaming && (
        <>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={saveEdit} disabled={saving}>{saving ? "保存中…" : "保存编辑"}</Button>
          </div>
          <div className="space-y-2 border-t pt-4">
            <Label>修订提示词（让模型按要求改写整篇）</Label>
            <Input value={revisePrompt} onChange={(e) => setRevisePrompt(e.target.value)} placeholder="例：让结尾更温馨；加快中段节奏" />
            <Button variant="secondary" onClick={revise} disabled={!revisePrompt.trim()}>按提示词重新生成</Button>
          </div>
          <div className="flex justify-end">
            <Button onClick={onNext} disabled={!edited.trim()}>继续 → 分镜</Button>
          </div>
        </>
      )}
    </main>
  );
}
```

- [ ] **Step 2: Add PATCH /api/stories/:id route for save edit**

Append to `app/api/stories/[id]/route.ts`:
```ts
import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { stories } from "@/lib/db/schema";

const StoryPatch = z.object({
  storyText: z.string().optional(),
  title: z.string().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = StoryPatch.parse(await req.json());
  const { db } = await getRuntime();
  db.update(stories).set({ ...body, updatedAt: sql`(unixepoch())` }).where(eq(stories.id, id)).run();
  return NextResponse.json(db.select().from(stories).where(eq(stories.id, id)).get());
}
```

(Adjust imports at top of `app/api/stories/[id]/route.ts` to include the new symbols.)

- [ ] **Step 3: Verify build**

```bash
pnpm typecheck && pnpm build
```

- [ ] **Step 4: Commit**

```bash
git add app/s/[uuid]/_components/StepStoryText.tsx app/api/stories/[id]/route.ts
git commit -m "feat(ui): step 2 story text view with stream + revise + edit"
```

---

### Task 6.5: Step 2b — Extract characters (paste mode)

**Files:**
- Modify: `app/s/[uuid]/_components/StepExtract.tsx`

- [ ] **Step 1: Replace stub**

```tsx
"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/client/api";
import { useJob } from "@/lib/client/useJob";
import { toast } from "sonner";

export function StepExtract({ data, onNext, reload }: any) {
  const [jobId, setJobId] = useState<string | null>(null);
  const job = useJob(jobId);

  useEffect(() => {
    if (data.characters.length === 0 && jobId === null) {
      api.extractCharacters(data.story.id).then((r) => setJobId(r.jobId)).catch((e) => toast.error(e.message));
    }
  }, [data.story.id, data.characters.length]);

  useEffect(() => { if (job.status === "done") reload(); }, [job.status]);

  async function patchChar(id: string, body: any) { await api.patchCharacter(id, body); reload(); }
  async function deleteChar(id: string) { await fetch(`/api/characters/${id}`, { method: "DELETE" }); reload(); }
  async function uploadRef(id: string, file: File) {
    const { assetId } = await api.uploadFile(data.story.id, file);
    await api.patchCharacter(id, { userImageId: assetId });
    reload();
  }

  return (
    <main className="max-w-3xl mx-auto p-8 space-y-6">
      <h2 className="text-xl font-semibold">确认角色</h2>
      <p className="text-sm text-muted-foreground">从你粘贴的故事中提取的角色。可以编辑、删除、添加，或为每个角色上传参考图。</p>
      {job.status === "running" && <div>提取中…</div>}
      <div className="space-y-3">
        {data.characters.map((c: any) => (
          <Card key={c.id} className="p-3 space-y-2">
            <Input value={c.name} onChange={(e) => patchChar(c.id, { name: e.target.value })} />
            <Textarea rows={2} value={c.userInput} onChange={(e) => patchChar(c.id, { userInput: e.target.value })} />
            <div className="flex items-center gap-2">
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => e.target.files?.[0] && uploadRef(c.id, e.target.files[0])} />
              {c.userImageId && <img src={`/api/assets/${c.userImageId}`} alt="" className="h-12 w-12 object-cover rounded" />}
              <Button variant="ghost" size="sm" onClick={() => deleteChar(c.id)} className="ml-auto">删除</Button>
            </div>
          </Card>
        ))}
      </div>
      <div className="flex justify-end">
        <Button onClick={onNext} disabled={data.characters.length === 0}>继续 → 分镜</Button>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Verify build & commit**

```bash
pnpm typecheck && pnpm build
git add app/s/[uuid]/_components/StepExtract.tsx
git commit -m "feat(ui): step 2b extract characters and upload reference"
```

---

### Task 6.6: Step 3 — Storyboard

**Files:**
- Modify: `app/s/[uuid]/_components/StepStoryboard.tsx`

- [ ] **Step 1: Replace stub**

```tsx
"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/client/api";
import { useJob } from "@/lib/client/useJob";
import { toast } from "sonner";

export function StepStoryboard({ data, onNext, reload }: any) {
  const [jobId, setJobId] = useState<string | null>(null);
  const job = useJob(jobId);
  const isPaste = data.story.inputMode === "paste";

  useEffect(() => {
    if (data.nodes.length === 0 && jobId === null) {
      api.storyboard(data.story.id, { targetMin: 6, targetMax: 12 }).then((r) => setJobId(r.jobId)).catch((e) => toast.error(e.message));
    }
  }, [data.story.id, data.nodes.length]);

  useEffect(() => { if (job.status === "done") reload(); }, [job.status]);

  async function patch(id: string, body: any) { await api.patchNode(id, body); reload(); }

  return (
    <main className="max-w-3xl mx-auto p-8 space-y-6">
      <h2 className="text-xl font-semibold">分镜</h2>
      {job.status === "running" && <div>分镜生成中…</div>}
      <div className="space-y-3">
        {data.nodes.map((n: any, i: number) => (
          <Card key={n.id} className="p-3 space-y-2">
            <div className="text-xs text-muted-foreground">节点 {i + 1}</div>
            <Textarea rows={3} value={n.text} disabled={isPaste} onChange={(e) => patch(n.id, { text: e.target.value })} placeholder="节点文本" />
            <Textarea rows={3} value={n.imagePrompt} onChange={(e) => patch(n.id, { imagePrompt: e.target.value })} placeholder="image_prompt（用于生图）" />
          </Card>
        ))}
      </div>
      <div className="flex justify-end">
        <Button onClick={onNext} disabled={data.nodes.length === 0}>继续 → 画风</Button>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Build & commit**

```bash
pnpm typecheck && pnpm build
git add app/s/[uuid]/_components/StepStoryboard.tsx
git commit -m "feat(ui): step 3 storyboard editor"
```

---

### Task 6.7: Step 4 — Art style picker

**Files:**
- Modify: `app/s/[uuid]/_components/StepArtStyle.tsx`

- [ ] **Step 1: Replace stub**

```tsx
"use client";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ART_STYLES, resolveArtStylePrompt } from "@/lib/art-styles";
import { api } from "@/lib/client/api";
import { toast } from "sonner";

export function StepArtStyle({ data, onNext, reload }: any) {
  const [selectedKey, setSelectedKey] = useState<string>(data.story.artStyleKey || "watercolor-picturebook");
  const [extra, setExtra] = useState<string>(data.story.artStylePrompt && data.story.artStyleKey ? "" : "");
  const [saving, setSaving] = useState(false);
  const resolved = resolveArtStylePrompt(selectedKey, extra);

  async function confirm() {
    setSaving(true);
    try {
      await api.cds(data.story.id, { artStyleKey: selectedKey, artStylePrompt: resolved });
      reload();
      onNext();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  return (
    <main className="max-w-3xl mx-auto p-8 space-y-6">
      <h2 className="text-xl font-semibold">选择画风</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {ART_STYLES.map((s) => (
          <Card key={s.id}
                onClick={() => setSelectedKey(s.id)}
                className={`p-4 cursor-pointer ${selectedKey === s.id ? "ring-2 ring-primary" : ""}`}>
            <div className="font-medium">{s.name}</div>
            <div className="text-xs text-muted-foreground line-clamp-3 mt-1">{s.prompt || "完全自定义"}</div>
          </Card>
        ))}
      </div>
      <div className="space-y-2">
        <div className="text-sm font-medium">追加自定义描述（可选）</div>
        <Textarea rows={3} value={extra} onChange={(e) => setExtra(e.target.value)} placeholder="例：偏暖色调，有怀旧感" />
      </div>
      <Card className="p-3 bg-muted/20">
        <div className="text-xs text-muted-foreground">最终画风 prompt：</div>
        <div className="text-sm mt-1 whitespace-pre-wrap">{resolved}</div>
      </Card>
      <div className="flex justify-end">
        <Button onClick={confirm} disabled={!resolved.trim() || saving}>{saving ? "保存中…" : "确认 → CDS"}</Button>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Build & commit**

```bash
pnpm typecheck && pnpm build
git add app/s/[uuid]/_components/StepArtStyle.tsx
git commit -m "feat(ui): step 4 art style picker"
```

---

### Task 6.8: Step 5 — CDS confirmation

**Files:**
- Modify: `app/s/[uuid]/_components/StepCDS.tsx`

- [ ] **Step 1: Replace stub**

```tsx
"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/client/api";
import { useJob } from "@/lib/client/useJob";
import { toast } from "sonner";

export function StepCDS({ data, onNext, reload }: any) {
  const [renderJob, setRenderJob] = useState<{ id: string; charId: string } | null>(null);
  const job = useJob(renderJob?.id ?? null);

  useEffect(() => { if (job.status === "done") { reload(); setRenderJob(null); } }, [job.status]);

  async function patch(id: string, body: any) { await api.patchCharacter(id, body); reload(); }
  async function render(id: string) {
    const r = await api.renderCharacter(id);
    setRenderJob({ id: r.jobId, charId: id });
  }

  const allConfirmed = data.characters.length > 0 && data.characters.every((c: any) => c.confirmed);

  return (
    <main className="max-w-3xl mx-auto p-8 space-y-6">
      <h2 className="text-xl font-semibold">Character Design Sheet</h2>
      <p className="text-sm text-muted-foreground">编辑每个角色的 4 个字段，生成参考图，确认后即可批量生成插图。</p>
      <div className="space-y-4">
        {data.characters.map((c: any) => (
          <Card key={c.id} className="p-4 space-y-3">
            <div className="font-medium">{c.name}</div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>外貌</Label><Textarea rows={3} value={c.cdsAppearance} onChange={(e) => patch(c.id, { cdsAppearance: e.target.value })} /></div>
              <div><Label>服饰</Label><Textarea rows={3} value={c.cdsOutfit} onChange={(e) => patch(c.id, { cdsOutfit: e.target.value })} /></div>
              <div><Label>特征</Label><Textarea rows={3} value={c.cdsTraits} onChange={(e) => patch(c.id, { cdsTraits: e.target.value })} /></div>
              <div><Label>风格</Label><Textarea rows={3} value={c.cdsStyle} onChange={(e) => patch(c.id, { cdsStyle: e.target.value })} /></div>
            </div>
            <div className="flex items-center gap-3">
              {c.cdsImageId
                ? <img src={`/api/assets/${c.cdsImageId}`} alt="" className="h-32 w-32 object-cover rounded border" />
                : <div className="h-32 w-32 rounded border flex items-center justify-center text-xs text-muted-foreground">未生成</div>}
              <div className="flex flex-col gap-2">
                <Button size="sm" variant="secondary" onClick={() => render(c.id)} disabled={!!renderJob}>
                  {renderJob?.charId === c.id && job.status === "running" ? "生成中…" : c.cdsImageId ? "重新生成参考图" : "生成参考图"}
                </Button>
                <Button size="sm" variant={c.confirmed ? "default" : "outline"} onClick={() => patch(c.id, { confirmed: !c.confirmed })} disabled={!c.cdsImageId}>
                  {c.confirmed ? "✓ 已确认" : "确认"}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <div className="flex justify-end">
        <Button onClick={onNext} disabled={!allConfirmed}>开始生成插图</Button>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Build & commit**

```bash
pnpm typecheck && pnpm build
git add app/s/[uuid]/_components/StepCDS.tsx
git commit -m "feat(ui): step 5 cds confirmation"
```

---

### Task 6.9: Step 6 — Render progress

**Files:**
- Modify: `app/s/[uuid]/_components/StepRender.tsx`

- [ ] **Step 1: Replace stub**

```tsx
"use client";
import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/client/api";
import { useJob } from "@/lib/client/useJob";

export function StepRender({ data, onDone, reload }: any) {
  const [jobId, setJobId] = useState<string | null>(null);
  const job = useJob(jobId);

  useEffect(() => {
    if (jobId === null) api.renderAll(data.story.id).then((r) => setJobId(r.jobId));
  }, [data.story.id]);

  useEffect(() => { if (job.status === "done") { reload().then(() => onDone()); } }, [job.status]);

  const total = job.progress?.total ?? data.nodes.length;
  const current = job.progress?.current ?? 0;
  const pct = total === 0 ? 0 : Math.round((current / total) * 100);

  return (
    <main className="max-w-3xl mx-auto p-8 space-y-6">
      <h2 className="text-xl font-semibold">生成插图</h2>
      <Progress value={pct} />
      <div className="text-sm text-muted-foreground">{current} / {total} 完成（{pct}%）</div>
      {job.status === "error" && <div className="text-red-600">出错：{job.error}</div>}
      <Button variant="outline" onClick={() => jobId && api.cancelJob(jobId)}>取消</Button>
    </main>
  );
}
```

- [ ] **Step 2: Build & commit**

```bash
pnpm typecheck && pnpm build
git add app/s/[uuid]/_components/StepRender.tsx
git commit -m "feat(ui): step 6 render progress"
```

---

### Task 6.10: Step 7 — Editor canvas (React Flow)

**Files:**
- Install: `reactflow`
- Modify: `app/s/[uuid]/_components/EditorCanvas.tsx`
- Create: `app/s/[uuid]/_components/StoryNode.tsx`

- [ ] **Step 1: Install React Flow**

```bash
pnpm add reactflow
```

- [ ] **Step 2: Implement custom node**

`app/s/[uuid]/_components/StoryNode.tsx`:
```tsx
"use client";
import { Handle, Position } from "reactflow";
import { Button } from "@/components/ui/button";
import { useJob } from "@/lib/client/useJob";
import { useState } from "react";
import { api } from "@/lib/client/api";

export interface StoryNodeData {
  id: string;
  text: string;
  imagePrompt: string;
  imageId: string | null;
  onChanged: () => void;
}

export function StoryNodeView({ data }: { data: StoryNodeData }) {
  const [jobId, setJobId] = useState<string | null>(null);
  const job = useJob(jobId);

  async function regen() {
    const r = await api.renderNode(data.id);
    setJobId(r.jobId);
  }
  if (job.status === "done") { setTimeout(() => { setJobId(null); data.onChanged(); }, 0); }

  return (
    <div className="bg-white border rounded-md shadow w-72">
      <Handle type="target" position={Position.Top} />
      <div className="aspect-square w-full bg-muted overflow-hidden">
        {data.imageId
          ? <img src={`/api/assets/${data.imageId}`} alt="" className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">{job.status === "running" ? "生成中…" : "暂无图片"}</div>}
      </div>
      <div className="p-3 space-y-2">
        <div className="text-sm whitespace-pre-wrap line-clamp-4">{data.text}</div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={regen} disabled={job.status === "running"}>重生图</Button>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
```

- [ ] **Step 3: Implement editor canvas**

`app/s/[uuid]/_components/EditorCanvas.tsx`:
```tsx
"use client";
import { useMemo } from "react";
import ReactFlow, { Background, Controls, MiniMap, type Node, type Edge } from "reactflow";
import "reactflow/dist/style.css";
import { Button } from "@/components/ui/button";
import { StoryNodeView } from "./StoryNode";
import { api } from "@/lib/client/api";

const nodeTypes = { story: StoryNodeView };

export function EditorCanvas({ data, onSwitch, reload }: { data: any; onSwitch: () => void; reload: () => void }) {
  const nodes = useMemo<Node[]>(
    () => data.nodes.map((n: any) => ({
      id: n.id,
      type: "story",
      position: { x: n.positionX || 0, y: n.positionY || 0 },
      data: { id: n.id, text: n.text, imagePrompt: n.imagePrompt, imageId: n.imageId, onChanged: reload },
    })),
    [data.nodes, reload],
  );
  const edges = useMemo<Edge[]>(() => {
    const sorted = [...data.nodes].sort((a, b) => a.orderIndex - b.orderIndex);
    return sorted.slice(1).map((n, i) => ({
      id: `e-${sorted[i]!.id}-${n.id}`,
      source: sorted[i]!.id,
      target: n.id,
      animated: false,
      style: { strokeDasharray: "4 4", opacity: 0.5 },
    }));
  }, [data.nodes]);

  function onNodeDragStop(_: any, n: Node) {
    api.patchNode(n.id, { positionX: n.position.x, positionY: n.position.y }).catch(() => {});
  }

  return (
    <div className="h-screen flex flex-col">
      <header className="flex items-center justify-between p-3 border-b">
        <h2 className="font-semibold">{data.story.title || "Untitled"}</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onSwitch}>阅读态</Button>
        </div>
      </header>
      <div className="flex-1">
        <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} onNodeDragStop={onNodeDragStop} fitView>
          <Background />
          <MiniMap pannable zoomable />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Build & commit**

```bash
pnpm typecheck && pnpm build
git add app/s/[uuid]/_components/EditorCanvas.tsx app/s/[uuid]/_components/StoryNode.tsx package.json pnpm-lock.yaml
git commit -m "feat(ui): step 7 editor canvas with react flow"
```

---

### Task 6.11: Step 7 — Read view

**Files:**
- Modify: `app/s/[uuid]/_components/ReadView.tsx`

- [ ] **Step 1: Replace stub**

```tsx
"use client";
import { Button } from "@/components/ui/button";

export function ReadView({ data, onSwitch }: { data: any; onSwitch: () => void }) {
  const sorted = [...data.nodes].sort((a: any, b: any) => a.orderIndex - b.orderIndex);
  return (
    <main className="min-h-screen">
      <header className="sticky top-0 bg-background/90 backdrop-blur border-b z-10 flex items-center justify-between p-3">
        <h2 className="font-semibold">{data.story.title || "Untitled"}</h2>
        <Button variant="outline" onClick={onSwitch}>编辑态</Button>
      </header>
      <div className="max-w-2xl mx-auto py-8 space-y-16">
        {sorted.map((n: any) => (
          <section key={n.id} className="space-y-4">
            {n.imageId
              ? <img src={`/api/assets/${n.imageId}`} alt="" className="w-full rounded-lg shadow-md" />
              : <div className="w-full aspect-square bg-muted rounded-lg flex items-center justify-center">暂无图片</div>}
            <p className="text-lg leading-relaxed whitespace-pre-wrap text-center">{n.text}</p>
          </section>
        ))}
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Build & commit**

```bash
pnpm typecheck && pnpm build
git add app/s/[uuid]/_components/ReadView.tsx
git commit -m "feat(ui): step 7 linear read view"
```

---

## Phase 7 — E2E + Eval

### Task 7.1: Playwright setup

**Files:**
- Create: `playwright.config.ts`, `tests/e2e/fixtures.ts`

- [ ] **Step 1: Initialize Playwright browsers**

```bash
pnpm exec playwright install chromium
```

- [ ] **Step 2: Configure**

`playwright.config.ts`:
```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  use: { baseURL: "http://localhost:3100", trace: "retain-on-failure" },
  webServer: {
    command: "PROVIDER_MODE=fake DATABASE_URL=file:./data/e2e.db STORAGE_DIR=./data/e2e-images PORT=3100 pnpm dev",
    url: "http://localhost:3100",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
```

- [ ] **Step 3: Add fixtures**

`tests/e2e/fixtures.ts`:
```ts
import { test as base } from "@playwright/test";
import fs from "node:fs";

export const test = base.extend({});
export { expect } from "@playwright/test";

export async function resetE2EData() {
  fs.rmSync("./data/e2e.db", { force: true });
  fs.rmSync("./data/e2e.db-shm", { force: true });
  fs.rmSync("./data/e2e.db-wal", { force: true });
  fs.rmSync("./data/e2e-images", { recursive: true, force: true });
}
```

- [ ] **Step 4: Commit**

```bash
git add playwright.config.ts tests/e2e/fixtures.ts
git commit -m "test: configure playwright with fake provider mode"
```

---

### Task 7.2: E2E — Structured mode happy path

**Files:**
- Create: `tests/e2e/structured-flow.spec.ts`

- [ ] **Step 1: Write spec**

```ts
import { test, expect, resetE2EData } from "./fixtures";

test.beforeAll(() => resetE2EData());

test("structured input runs through wizard to canvas", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("故事设定").fill("森林深处");
  await page.getByRole("button", { name: "+ 添加角色" }).click();
  await page.getByPlaceholder("名字").fill("小红");
  await page.getByPlaceholder("描述").fill("勇敢的小女孩");
  await page.getByLabel("起始剧情").fill("她踏上旅程");
  await page.getByRole("button", { name: "下一步" }).click();

  // Step 2 — story text streams in
  await expect(page.getByRole("heading", { name: "故事文本" })).toBeVisible();
  await page.getByRole("button", { name: "继续 → 分镜" }).click({ timeout: 30_000 });

  // Step 3 — storyboard
  await expect(page.getByRole("heading", { name: "分镜" })).toBeVisible();
  await page.getByRole("button", { name: "继续 → 画风" }).click({ timeout: 30_000 });

  // Step 4 — art style
  await page.getByText("水彩绘本").click();
  await page.getByRole("button", { name: /确认 → CDS/ }).click();

  // Step 5 — CDS
  await expect(page.getByRole("heading", { name: "Character Design Sheet" })).toBeVisible({ timeout: 30_000 });
  await page.getByRole("button", { name: /生成参考图/ }).first().click();
  await expect(page.getByRole("button", { name: /✓ 已确认|确认/ }).first()).toBeEnabled({ timeout: 30_000 });
  await page.getByRole("button", { name: /确认/ }).first().click();
  await page.getByRole("button", { name: "开始生成插图" }).click();

  // Step 6 → editor
  await expect(page.getByRole("button", { name: "阅读态" })).toBeVisible({ timeout: 60_000 });
});
```

- [ ] **Step 2: Run**

```bash
pnpm test:e2e -- structured-flow
```

Expected: pass.

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/structured-flow.spec.ts
git commit -m "test(e2e): structured flow happy path"
```

---

### Task 7.3: E2E — Paste mode + single node regenerate

**Files:**
- Create: `tests/e2e/paste-flow.spec.ts`, `tests/e2e/regenerate.spec.ts`

- [ ] **Step 1: Paste-mode spec**

`tests/e2e/paste-flow.spec.ts`:
```ts
import { test, expect, resetE2EData } from "./fixtures";

test.beforeAll(() => resetE2EData());

test("paste mode runs character extraction and storyboard", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("tab", { name: "粘贴完整故事" }).click();
  await page.getByLabel("完整故事").fill("从前小红和小蓝在森林里走着。后来他们遇到了狼。最后大家成了朋友。");
  await page.getByRole("button", { name: "下一步" }).click();

  // Step 2b — extract characters
  await expect(page.getByRole("heading", { name: "确认角色" })).toBeVisible({ timeout: 30_000 });
  await page.getByRole("button", { name: "继续 → 分镜" }).click();

  // Step 3 — storyboard with locked text
  await expect(page.getByRole("heading", { name: "分镜" })).toBeVisible({ timeout: 30_000 });
  // Storyboard nodes' text fields should be disabled in paste mode
  const firstText = page.locator("textarea[disabled]").first();
  await expect(firstText).toBeVisible();
});
```

- [ ] **Step 2: Single-node regen spec**

`tests/e2e/regenerate.spec.ts`:
```ts
import { test, expect, resetE2EData } from "./fixtures";

test.beforeAll(() => resetE2EData());

test("single node regenerate from canvas", async ({ page, request }) => {
  // Bootstrap a finished story directly via API to skip wizard for this case
  const create = await request.post("/api/stories", { data: {
    inputMode: "paste",
    storyText: "段一。段二。段三。",
    characters: [],
  }});
  const { id } = await create.json();
  await request.post(`/api/stories/${id}/storyboard`, { data: { targetMin: 3, targetMax: 3 } });
  // Wait for storyboard to land
  await page.waitForTimeout(1500);
  await request.post(`/api/stories/${id}/cds`, { data: { artStyleKey: "watercolor-picturebook", artStylePrompt: "watercolor" } });
  await page.waitForTimeout(1500);
  await request.post(`/api/stories/${id}/render-all`);
  await page.waitForTimeout(2000);

  await page.goto(`/s/${id}?mode=edit`);
  const button = page.getByRole("button", { name: "重生图" }).first();
  await expect(button).toBeVisible({ timeout: 30_000 });
  await button.click();
  // Loading text appears, then disappears
  await expect(page.getByText("生成中…").first()).toBeVisible({ timeout: 5_000 });
});
```

- [ ] **Step 3: Run**

```bash
pnpm test:e2e
```

- [ ] **Step 4: Commit**

```bash
git add tests/e2e
git commit -m "test(e2e): paste flow and single node regeneration"
```

---

### Task 7.4: Eval runner skeleton

**Files:**
- Create: `evals/runner.ts`, `evals/judges/types.ts`

- [ ] **Step 1: Implement skeleton**

`evals/judges/types.ts`:
```ts
export interface CaseScore {
  case: string;
  scores: Record<string, number>;
  notes?: string;
}
export interface Report {
  stage: string;
  total: { mean: number; n: number };
  cases: CaseScore[];
}
```

`evals/runner.ts`:
```ts
import fs from "node:fs/promises";
import path from "node:path";
import { loadConfig } from "../lib/config";
import { OpenAITextProvider } from "../lib/providers/openai-text";
import type { Report, CaseScore } from "./judges/types";
import { runStoryTextEval } from "./judges/story-text-judge";
import { runStoryboardEval } from "./judges/storyboard-judge";

const STAGE = process.argv[2] ?? "all";

async function main() {
  process.env.PROVIDER_MODE = "openai";
  const cfg = loadConfig();
  const provider = new OpenAITextProvider({ apiKey: cfg.openai.apiKey, model: cfg.openai.textModel });
  const reports: Report[] = [];
  if (STAGE === "story-text" || STAGE === "all") reports.push(await runStoryTextEval(provider));
  if (STAGE === "storyboard" || STAGE === "all") reports.push(await runStoryboardEval(provider));

  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const outDir = path.join("evals", "reports");
  await fs.mkdir(outDir, { recursive: true });
  const file = path.join(outDir, `${ts}.json`);
  await fs.writeFile(file, JSON.stringify({ generatedAt: ts, reports }, null, 2));
  console.log(`report written: ${file}`);
  for (const r of reports) {
    console.log(`${r.stage}: mean=${r.total.mean.toFixed(2)} n=${r.total.n}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 2: Commit**

```bash
git add evals/runner.ts evals/judges/types.ts
git commit -m "feat(eval): runner skeleton"
```

---

### Task 7.5: Story-text eval

**Files:**
- Create: `evals/cases/story-text/01-forest.json`, `evals/cases/story-text/02-space.json`, `evals/cases/story-text/03-undersea.json`, `evals/judges/story-text-judge.ts`

- [ ] **Step 1: Add case files**

`evals/cases/story-text/01-forest.json`:
```json
{ "id": "forest", "input": { "setting": "森林深处住着一群会说话的动物", "characters": [{ "name": "小红", "description": "勇敢的小狐狸" }, { "name": "灰兔", "description": "胆小但善良" }], "opening": "一封神秘的信出现在树洞里" } }
```

`evals/cases/story-text/02-space.json`:
```json
{ "id": "space", "input": { "setting": "未来的太空殖民地", "characters": [{ "name": "Lila", "description": "13 岁的工程少女" }], "opening": "她发现空间站的能源出现异常" } }
```

`evals/cases/story-text/03-undersea.json`:
```json
{ "id": "undersea", "input": { "setting": "海底珊瑚城", "characters": [{ "name": "贝贝", "description": "好奇的小章鱼" }, { "name": "海马爷爷", "description": "智慧的长者" }], "opening": "海流带来了陆地上的纸船" } }
```

- [ ] **Step 2: Implement judge**

`evals/judges/story-text-judge.ts`:
```ts
import fs from "node:fs/promises";
import path from "node:path";
import OpenAI from "openai";
import type { TextProvider } from "../../lib/providers/types";
import type { CaseScore, Report } from "./types";

const JUDGE_SYSTEM = `你是绘本故事评测员。给一段中文故事在 4 个维度打分（0-10 整数）：
1. 连贯性 coherence
2. 角色一致性 characterConsistency
3. 起承转合 narrativeArc
4. 与用户输入贴合度 fidelityToInput
仅输出 JSON：{"coherence":N,"characterConsistency":N,"narrativeArc":N,"fidelityToInput":N,"notes":"..."}。`;

const JUDGE_SCHEMA = {
  name: "Score",
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      coherence: { type: "integer", minimum: 0, maximum: 10 },
      characterConsistency: { type: "integer", minimum: 0, maximum: 10 },
      narrativeArc: { type: "integer", minimum: 0, maximum: 10 },
      fidelityToInput: { type: "integer", minimum: 0, maximum: 10 },
      notes: { type: "string" },
    },
    required: ["coherence", "characterConsistency", "narrativeArc", "fidelityToInput", "notes"],
  },
  strict: true,
};

export async function runStoryTextEval(provider: TextProvider): Promise<Report> {
  const judge = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const judgeModel = process.env.EVAL_JUDGE_MODEL ?? "gpt-5";
  const dir = path.join("evals", "cases", "story-text");
  const files = (await fs.readdir(dir)).filter((f) => f.endsWith(".json"));
  const cases: CaseScore[] = [];

  for (const f of files) {
    const c = JSON.parse(await fs.readFile(path.join(dir, f), "utf8")) as { id: string; input: any };
    let story = "";
    for await (const chunk of provider.generateStory(c.input)) story += chunk;
    const r = await judge.chat.completions.create({
      model: judgeModel,
      response_format: { type: "json_schema", json_schema: JUDGE_SCHEMA as any },
      messages: [
        { role: "system", content: JUDGE_SYSTEM },
        { role: "user", content: `用户输入：\n${JSON.stringify(c.input)}\n\n生成的故事：\n${story}` },
      ],
    });
    const parsed = JSON.parse(r.choices[0]?.message?.content ?? "{}");
    cases.push({ case: c.id, scores: parsed, notes: parsed.notes });
  }

  const all = cases.flatMap((c) => Object.entries(c.scores).filter(([k]) => k !== "notes").map(([, v]) => Number(v)));
  const mean = all.length ? all.reduce((a, b) => a + b, 0) / all.length : 0;
  return { stage: "story-text", total: { mean, n: all.length }, cases };
}
```

- [ ] **Step 3: Sanity-run with fake (skipped — judge needs real OpenAI). Document instead.**

The eval requires a real key. Document in README addendum (Task 7.7).

- [ ] **Step 4: Commit**

```bash
git add evals/cases/story-text evals/judges/story-text-judge.ts
git commit -m "feat(eval): story-text llm-as-judge"
```

---

### Task 7.6: Storyboard eval

**Files:**
- Create: `evals/cases/storyboard/01-forest.json`, `evals/cases/storyboard/02-undersea.json`, `evals/judges/storyboard-judge.ts`

- [ ] **Step 1: Add case files**

`evals/cases/storyboard/01-forest.json`:
```json
{ "id": "forest", "storyText": "从前在森林里，小红收到了一封信，信上画着一棵会发光的树。她和灰兔决定去找这棵树。一路上遇到了风雨和岔路，最终他们在山顶发现了那棵树，树下藏着失踪多年的爷爷。", "characters": [{ "id": "c1", "name": "小红", "description": "勇敢的小狐狸" }, { "id": "c2", "name": "灰兔", "description": "胆小善良" }] }
```

`evals/cases/storyboard/02-undersea.json`:
```json
{ "id": "undersea", "storyText": "海底的珊瑚城迎来了一阵不寻常的海流，贝贝在海底捡到一个纸船。海马爷爷告诉贝贝纸船来自陆地。贝贝决定追溯纸船的起源，最终在海面上看到了一座小灯塔。", "characters": [{ "id": "c1", "name": "贝贝", "description": "小章鱼" }, { "id": "c2", "name": "海马爷爷", "description": "智者" }] }
```

- [ ] **Step 2: Implement judge**

`evals/judges/storyboard-judge.ts`:
```ts
import fs from "node:fs/promises";
import path from "node:path";
import OpenAI from "openai";
import type { TextProvider } from "../../lib/providers/types";
import type { CaseScore, Report } from "./types";

const JUDGE_SYSTEM = `你是分镜评测员。对给定的分镜节点列表打分（0-10 整数）：
1. 节点数合理性 nodeCount
2. image_prompt 视觉信息密度 visualDensity
3. 角色出场覆盖（主要角色每段都有合理露出）characterCoverage
仅输出 JSON。`;

const JUDGE_SCHEMA = {
  name: "Score",
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      nodeCount: { type: "integer", minimum: 0, maximum: 10 },
      visualDensity: { type: "integer", minimum: 0, maximum: 10 },
      characterCoverage: { type: "integer", minimum: 0, maximum: 10 },
      notes: { type: "string" },
    },
    required: ["nodeCount", "visualDensity", "characterCoverage", "notes"],
  },
  strict: true,
};

export async function runStoryboardEval(provider: TextProvider): Promise<Report> {
  const judge = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const judgeModel = process.env.EVAL_JUDGE_MODEL ?? "gpt-5";
  const dir = path.join("evals", "cases", "storyboard");
  const files = (await fs.readdir(dir)).filter((f) => f.endsWith(".json"));
  const cases: CaseScore[] = [];

  for (const f of files) {
    const c = JSON.parse(await fs.readFile(path.join(dir, f), "utf8")) as { id: string; storyText: string; characters: { id: string; name: string; description: string }[] };
    const nodes = await provider.generateStoryboard(c.storyText, {
      mode: "paste",
      characters: c.characters,
      targetMin: 6,
      targetMax: 12,
    });
    const r = await judge.chat.completions.create({
      model: judgeModel,
      response_format: { type: "json_schema", json_schema: JUDGE_SCHEMA as any },
      messages: [
        { role: "system", content: JUDGE_SYSTEM },
        { role: "user", content: `原文：\n${c.storyText}\n\n角色：${JSON.stringify(c.characters)}\n\n分镜：\n${JSON.stringify(nodes, null, 2)}` },
      ],
    });
    const parsed = JSON.parse(r.choices[0]?.message?.content ?? "{}");
    cases.push({ case: c.id, scores: parsed, notes: parsed.notes });
  }
  const all = cases.flatMap((c) => Object.entries(c.scores).filter(([k]) => k !== "notes").map(([, v]) => Number(v)));
  const mean = all.length ? all.reduce((a, b) => a + b, 0) / all.length : 0;
  return { stage: "storyboard", total: { mean, n: all.length }, cases };
}
```

- [ ] **Step 3: Commit**

```bash
git add evals/cases/storyboard evals/judges/storyboard-judge.ts
git commit -m "feat(eval): storyboard llm-as-judge"
```

---

### Task 7.7: README and dev docs

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Replace README with usage notes**

`README.md`:
```markdown
# Storyteller

把故事设定/角色/起始剧情（或一篇完整故事）变成图文绘本。Next.js + SQLite + 本地图片存储；BYO OpenAI key。

## Quick start
1. `cp .env.local.example .env.local` 并填入 `OPENAI_API_KEY`
2. `pnpm install`
3. `pnpm db:migrate`
4. `pnpm dev`，打开 http://localhost:3000

## 使用 fake provider 跑通流程（不烧 token）
```
PROVIDER_MODE=fake pnpm dev
```

## 测试
```
pnpm test          # 单元测试 (Vitest)
pnpm test:e2e      # 端到端 (Playwright，使用 fake provider)
```

## 评测（真实调用 OpenAI）
```
EVAL_JUDGE_MODEL=gpt-5 pnpm eval                # 全部
EVAL_JUDGE_MODEL=gpt-5 pnpm eval story-text     # 单个 stage
EVAL_JUDGE_MODEL=gpt-5 pnpm eval storyboard
```

报告写到 `evals/reports/<timestamp>.json`，便于回归对比。

## 数据
所有运行时数据集中在 `data/`：SQLite 文件 + 图片。`/data/` 已 gitignore。备份：打包整个目录。Docker 部署挂载 `-v ./data:/app/data`。

## 设计与计划
- 设计：`docs/superpowers/specs/2026-05-08-storyteller-design.md`
- 实现计划：`docs/superpowers/plans/2026-05-08-storyteller.md`
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: project README with quick-start and eval"
```

---

## Phase 8 — Final Verification

### Task 8.1: Smoke test the full pipeline against fake providers

- [ ] **Step 1: Reset env and run dev**

```bash
rm -rf data && mkdir -p data
cp .env.local.example .env.local
sed -i '' 's/^PROVIDER_MODE=.*/PROVIDER_MODE=fake/' .env.local
pnpm db:migrate
pnpm dev
```

- [ ] **Step 2: Walk through both modes manually**

In a browser at http://localhost:3000:

1. **Structured mode**: fill setting, one character, opening → next → wait for story stream → next → storyboard appears → next → pick "水彩绘本" → confirm → CDS appears → 生成参考图 for each character → confirm each → 开始生成插图 → editor canvas appears with N nodes
2. **Paste mode**: tab to "粘贴完整故事" → paste a few sentences → next → extract characters appears → next → storyboard with locked text → continue through to canvas
3. From canvas: click 重生图 on one node → image refreshes
4. Switch to 阅读态 → linear scroll view shows all nodes

Each step should complete within seconds (fake providers).

- [ ] **Step 3: Smoke test unit + E2E + typecheck + build**

```bash
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
```

All four must be green. Fix any regressions before committing.

- [ ] **Step 4: Commit any final fixes**

```bash
git status
# if any leftover fixes:
git add -A
git commit -m "chore: final smoke fixes"
```

---

### Task 8.2: Real-key smoke test (manual, ungated by CI)

- [ ] **Step 1: Switch to OpenAI provider**

```bash
sed -i '' 's/^PROVIDER_MODE=.*/PROVIDER_MODE=openai/' .env.local
```

Ensure `OPENAI_API_KEY` is set.

- [ ] **Step 2: Walk both modes**

Run `pnpm dev` and step through the wizard end-to-end. Confirm:
- Story streams from OpenAI (Chinese text appears progressively)
- Storyboard returns ≥ 6 nodes for a substantial story
- Art style picker shows the 8 presets
- CDS reference image generates as a real image (not 1×1 PNG)
- Scene images respect both art style and character likeness

This is acceptance — no test asserts it. Note any quality issues for a follow-up tuning task; do not block on them.

- [ ] **Step 3: Commit nothing** (manual verification only)

---

## Spec Coverage Map

| Spec section | Tasks |
|--------------|-------|
| §3.1 Tech stack | 0.1, 0.2, 0.3 |
| §3.2 Directory structure | All phases (paths exact) |
| §3.3 Provider abstraction | 2.1–2.5 |
| §4 Data model | 1.2 |
| §5 Pipeline (S1–S6) | 4.2, 4.3, 4.4, 4.5, 4.6, 4.7 |
| §6 User journey 1 — input | 6.2 |
| §6 User journey 2 — story text | 6.4 |
| §6 User journey 2b — extract | 6.5 |
| §6 User journey 3 — storyboard | 6.6 |
| §6 User journey 4 — art style | 6.7 |
| §6 User journey 5 — CDS | 6.8 |
| §6 User journey 6 — render | 6.9 |
| §6 User journey 7 — canvas/read | 6.10, 6.11 |
| §7 Job model | 3.1, 3.2, 3.3, 5.4, 5.8, 5.9 |
| §8 Art styles | 4.1, 6.7 |
| §9 Error handling | UI tasks (sonner toasts); job runner persists errors (3.3); SDK retry on 429/5xx via `maxRetries: 3` (Tasks 2.3, 2.4) |
| §10.1 Unit tests | Each pipeline + provider task |
| §10.2 Eval | 7.4, 7.5, 7.6 |
| §10.3 E2E | 7.1, 7.2, 7.3 |
| §11 Config | 0.4, 1.1 |
| §12 Deployment | README (7.7) |

**§9 retry policy on 429:** Implemented by passing `maxRetries: 3` to `new OpenAI({...})` in Tasks 2.3 and 2.4. The SDK's built-in retry handles 429 + 5xx with exponential backoff.

---

## Execution Notes

- Each phase produces working software. After Phase 5 you can hit the API with curl. After Phase 6 you have a runnable UI on fake providers. Phase 7 verifies the wizard end-to-end.
- If a step fails (`pnpm test` red, `pnpm build` red), STOP and fix it before moving on. Do not stack tasks on a broken trunk.
- Commit on every green state — there are ~50 commits in this plan; that is intentional.
- The plan assumes you have not pre-installed Playwright browsers; Task 7.1 step 1 handles that.
- If Next.js complains about route `params` types, ensure you are on Next.js 15+ where `params` is a `Promise`.






