import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { makeTestDb } from "../helpers/db";
import { stories } from "@/lib/db/schema";
import { generateStoryText } from "@/lib/pipeline/story-text";
import { FakeTextProvider } from "@/lib/providers/fake-text";
import { splitStoryParagraphs } from "@/lib/story-paragraphs";
import { randomUUID } from "node:crypto";

describe("pipeline.story-text", () => {
  it("streams chunks, persists final text, sets status", async () => {
    const { db } = await makeTestDb();
    const id = randomUUID();
    db.insert(stories)
      .values({ id, inputMode: "structured", setting: "森林", opening: "出发" })
      .run();
    const chunks: string[] = [];
    const out = await generateStoryText({
      db,
      provider: new FakeTextProvider(),
      storyId: id,
      onChunk: (c) => chunks.push(c),
    });
    expect(out.length).toBeGreaterThan(0);
    expect(chunks.length).toBeGreaterThan(0);
    const row = db.select().from(stories).where(eq(stories.id, id)).get();
    expect(row?.storyText).toBe(out);
    expect(row?.status).toBe("text_done");
    const paragraphs = splitStoryParagraphs(out);
    expect(paragraphs.length).toBeGreaterThanOrEqual(4);
    expect(paragraphs.length).toBeLessThanOrEqual(12);
  });

  it("revise mode passes previous story to provider", async () => {
    const { db } = await makeTestDb();
    const id = randomUUID();
    db.insert(stories)
      .values({
        id,
        inputMode: "structured",
        setting: "S",
        opening: "O",
        storyText: "上一稿故事",
        status: "text_done",
      })
      .run();
    const out = await generateStoryText({
      db,
      provider: new FakeTextProvider(),
      storyId: id,
      revisePrompt: "更温馨",
      onChunk: () => {},
    });
    expect(out.length).toBeGreaterThan(0);
    const row = db.select().from(stories).where(eq(stories.id, id)).get();
    expect(row?.storyText).toBe(out);
    expect(row?.status).toBe("text_done");
  });
});
