import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { makeTestDb } from "../helpers/db";
import { stories, characters, nodes } from "@/lib/db/schema";
import { generateStoryboard } from "@/lib/pipeline/storyboard";
import { FakeTextProvider } from "@/lib/providers/fake-text";
import type { NodeDraft, TextProvider } from "@/lib/providers/types";
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

  it("keeps structured story paragraphs as node text and stores summaries", async () => {
    const { db } = await makeTestDb();
    const id = randomUUID();
    db.insert(stories)
      .values({
        id,
        inputMode: "structured",
        storyText: "第一段。\n\n第二段。\n\n第三段。\n\n第四段。",
      })
      .run();

    const inserted = await generateStoryboard({
      db,
      provider: new FakeTextProvider(),
      storyId: id,
      targetMin: 4,
      targetMax: 12,
    });

    expect(inserted.map((node) => node.text)).toEqual(["第一段。", "第二段。", "第三段。", "第四段。"]);
    expect(inserted.every((node) => node.summary.length > 0)).toBe(true);
    const rows = db.select().from(nodes).where(eq(nodes.storyId, id)).all();
    expect(rows.map((node) => node.summary)).toEqual(inserted.map((node) => node.summary));
  });

  it("rejects storyboard characters that are not exact character ids", async () => {
    const { db } = await makeTestDb();
    const storyId = randomUUID();
    const characterId = randomUUID();
    db.insert(stories)
      .values({
        id: storyId,
        inputMode: "paste",
        storyText: "兔叽叽和龟龟比赛。",
      })
      .run();
    db.insert(characters)
      .values({ id: characterId, storyId, name: "兔叽叽" })
      .run();

    await expect(
      generateStoryboard({
        db,
        provider: new InvalidStoryboardCharacterProvider(`${characterId} 兔叽叽`),
        storyId,
        targetMin: 1,
        targetMax: 1,
      }),
    ).rejects.toThrow(`invalid storyboard character id: ${characterId} 兔叽叽`);

    expect(db.select().from(nodes).where(eq(nodes.storyId, storyId)).all()).toHaveLength(0);
  });
});

class InvalidStoryboardCharacterProvider implements TextProvider {
  constructor(private readonly characterValue: string) {}

  async *generateStory(): AsyncIterable<string> {
    yield "";
  }

  async extractCharacters(): Promise<[]> {
    return [];
  }

  async generateStoryboard(): Promise<NodeDraft[]> {
    return [
      {
        order_index: 0,
        text: "兔叽叽和龟龟比赛。",
        summary: "兔叽叽和龟龟比赛",
        image_prompt: "rabbit and turtle racing",
        characters: [this.characterValue],
      },
    ];
  }

  async generateCDS(): Promise<[]> {
    return [];
  }
}
