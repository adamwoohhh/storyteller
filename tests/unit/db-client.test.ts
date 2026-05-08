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
