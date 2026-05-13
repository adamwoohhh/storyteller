import { randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import type { DB } from "@/lib/db/client";
import { stories, characters as charactersTable, nodes } from "@/lib/db/schema";
import type { TextProvider } from "@/lib/providers/types";
import { splitStoryParagraphs, storyTextFromParagraphs } from "@/lib/story-paragraphs";
import { invalidateAfterStoryboard } from "./workflow-invalidation";

export async function generateStoryboard(args: {
  db: DB;
  provider: TextProvider;
  storyId: string;
  targetMin: number;
  targetMax: number;
}): Promise<
  {
    id: string;
    orderIndex: number;
    text: string;
    summary: string;
    imagePrompt: string;
    characters: string[];
  }[]
> {
  const { db, provider, storyId, targetMin, targetMax } = args;
  const story = db.select().from(stories).where(eq(stories.id, storyId)).get();
  if (!story) throw new Error(`story not found: ${storyId}`);
  const charRows = db
    .select()
    .from(charactersTable)
    .where(eq(charactersTable.storyId, storyId))
    .all();
  const isStructured = story.inputMode === "structured";
  const storyParagraphs = splitStoryParagraphs(story.storyText);
  const storyboardText =
    isStructured && storyParagraphs.length > 0
      ? storyTextFromParagraphs(storyParagraphs)
      : story.storyText;
  const resolvedMin = isStructured && storyParagraphs.length > 0 ? storyParagraphs.length : targetMin;
  const resolvedMax = isStructured && storyParagraphs.length > 0 ? storyParagraphs.length : targetMax;

  const drafts = await provider.generateStoryboard(storyboardText, {
    mode: story.inputMode as "structured" | "paste",
    characters: charRows.map((c) => ({ id: c.id, name: c.name, description: c.userInput })),
    targetMin: resolvedMin,
    targetMax: resolvedMax,
  });
  const validCharacterIds = new Set(charRows.map((c) => c.id));
  for (const draft of drafts) {
    for (const characterId of draft.characters) {
      if (!validCharacterIds.has(characterId)) {
        throw new Error(`invalid storyboard character id: ${characterId}`);
      }
    }
  }

  db.delete(nodes).where(eq(nodes.storyId, storyId)).run();
  const result: {
    id: string;
    orderIndex: number;
    text: string;
    summary: string;
    imagePrompt: string;
    characters: string[];
  }[] = [];
  const nodeCount = isStructured && storyParagraphs.length > 0 ? storyParagraphs.length : drafts.length;
  for (let i = 0; i < nodeCount; i++) {
    const d = drafts[i]!;
    const id = randomUUID();
    const text = isStructured && storyParagraphs[i] ? storyParagraphs[i]! : d.text;
    const summary = d?.summary?.trim() || text.slice(0, 80);
    const imagePrompt = d?.image_prompt?.trim() || `画面 ${i + 1}：${summary}`;
    const characterIds = d?.characters ?? [];
    db.insert(nodes)
      .values({
        id,
        storyId,
        orderIndex: i,
        text,
        summary,
        imagePrompt,
        characters: JSON.stringify(characterIds),
        positionX: 0,
        positionY: i * 220,
      })
      .run();
    result.push({
      id,
      orderIndex: i,
      text,
      summary,
      imagePrompt,
      characters: characterIds,
    });
  }
  db.update(stories)
    .set({ status: "storyboard_done", updatedAt: sql`(unixepoch())` })
    .where(eq(stories.id, storyId))
    .run();
  invalidateAfterStoryboard(db, storyId);
  return result;
}
