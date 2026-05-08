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
