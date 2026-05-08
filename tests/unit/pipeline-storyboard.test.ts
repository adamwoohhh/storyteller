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
    db.insert(stories)
      .values({
        id,
        inputMode: "paste",
        storyText: "段一。段二。段三。段四。",
      })
      .run();
    const c1 = randomUUID();
    db.insert(characters).values({ id: c1, storyId: id, name: "X" }).run();
    const inserted = await generateStoryboard({
      db,
      provider: new FakeTextProvider(),
      storyId: id,
      targetMin: 3,
      targetMax: 5,
    });
    expect(inserted.length).toBeGreaterThanOrEqual(3);
    const rows = db.select().from(nodes).where(eq(nodes.storyId, id)).all();
    expect(rows.length).toBe(inserted.length);
    expect(rows.map((r) => r.orderIndex).sort((a, b) => a - b)).toEqual(
      rows.map((_, i) => i),
    );
    const story = db.select().from(stories).where(eq(stories.id, id)).get();
    expect(story?.status).toBe("storyboard_done");
  });
});
