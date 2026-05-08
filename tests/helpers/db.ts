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
