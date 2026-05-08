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
    db.insert(stories)
      .values({ id, inputMode: "paste", storyText: "小红和小蓝在森林里玩耍。" })
      .run();
    const inserted = await extractCharacters({
      db,
      provider: new FakeTextProvider(),
      storyId: id,
    });
    const rows = db.select().from(characters).where(eq(characters.storyId, id)).all();
    expect(rows.length).toBeGreaterThan(0);
    expect(inserted.length).toBe(rows.length);
    expect(rows[0]?.name).toBeDefined();
  });
});
