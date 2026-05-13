import { eq, sql } from "drizzle-orm";
import type { DB } from "@/lib/db/client";
import { characters, nodes, stories } from "@/lib/db/schema";

export function invalidateAfterStoryText(db: DB, storyId: string): void {
  const story = db.select().from(stories).where(eq(stories.id, storyId)).get();
  if (!story) throw new Error(`story not found: ${storyId}`);

  db.delete(nodes).where(eq(nodes.storyId, storyId)).run();
  if (story.inputMode === "paste") {
    db.delete(characters).where(eq(characters.storyId, storyId)).run();
  } else {
    resetCharacterDesigns(db, storyId);
  }
  db.update(stories)
    .set({
      artStyleKey: "",
      artStylePrompt: "",
      status: story.storyText.trim() ? "text_done" : "draft",
      updatedAt: sql`(unixepoch())`,
    })
    .where(eq(stories.id, storyId))
    .run();
}

export function invalidateAfterCharacters(db: DB, storyId: string): void {
  db.delete(nodes).where(eq(nodes.storyId, storyId)).run();
  resetCharacterDesigns(db, storyId);
  db.update(stories)
    .set({
      artStyleKey: "",
      artStylePrompt: "",
      status: "text_done",
      updatedAt: sql`(unixepoch())`,
    })
    .where(eq(stories.id, storyId))
    .run();
}

export function invalidateAfterStoryboard(db: DB, storyId: string): void {
  resetCharacterDesigns(db, storyId);
  db.update(stories)
    .set({
      artStyleKey: "",
      artStylePrompt: "",
      status: "storyboard_done",
      updatedAt: sql`(unixepoch())`,
    })
    .where(eq(stories.id, storyId))
    .run();
}

export function invalidateAfterStyle(db: DB, storyId: string): void {
  resetCharacterDesigns(db, storyId);
  db.update(stories)
    .set({ status: "style_done", updatedAt: sql`(unixepoch())` })
    .where(eq(stories.id, storyId))
    .run();
}

function resetCharacterDesigns(db: DB, storyId: string): void {
  db.update(characters)
    .set({
      cdsAppearance: "",
      cdsOutfit: "",
      cdsTraits: "",
      cdsStyle: "",
      cdsImageId: null,
      confirmed: false,
    })
    .where(eq(characters.storyId, storyId))
    .run();
}
