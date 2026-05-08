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
}): Promise<
  { id: string; orderIndex: number; text: string; imagePrompt: string; characters: string[] }[]
> {
  const { db, provider, storyId, targetMin, targetMax } = args;
  const story = db.select().from(stories).where(eq(stories.id, storyId)).get();
  if (!story) throw new Error(`story not found: ${storyId}`);
  const charRows = db
    .select()
    .from(charactersTable)
    .where(eq(charactersTable.storyId, storyId))
    .all();
  const drafts = await provider.generateStoryboard(story.storyText, {
    mode: story.inputMode as "structured" | "paste",
    characters: charRows.map((c) => ({ id: c.id, name: c.name, description: c.userInput })),
    targetMin,
    targetMax,
  });

  db.delete(nodes).where(eq(nodes.storyId, storyId)).run();
  const result: {
    id: string;
    orderIndex: number;
    text: string;
    imagePrompt: string;
    characters: string[];
  }[] = [];
  for (let i = 0; i < drafts.length; i++) {
    const d = drafts[i]!;
    const id = randomUUID();
    db.insert(nodes)
      .values({
        id,
        storyId,
        orderIndex: i,
        text: d.text,
        imagePrompt: d.image_prompt,
        characters: JSON.stringify(d.characters),
        positionX: 0,
        positionY: i * 220,
      })
      .run();
    result.push({
      id,
      orderIndex: i,
      text: d.text,
      imagePrompt: d.image_prompt,
      characters: d.characters,
    });
  }
  db.update(stories)
    .set({ status: "storyboard_done", updatedAt: sql`(unixepoch())` })
    .where(eq(stories.id, storyId))
    .run();
  return result;
}
