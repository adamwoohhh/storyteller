import { eq } from "drizzle-orm";
import type { DB } from "@/lib/db/client";
import { stories, characters } from "@/lib/db/schema";
import type { TextProvider } from "@/lib/providers/types";

export async function generateCDSText(args: {
  db: DB;
  provider: TextProvider;
  storyId: string;
}): Promise<void> {
  const { db, provider, storyId } = args;
  const story = db.select().from(stories).where(eq(stories.id, storyId)).get();
  if (!story) throw new Error(`story not found: ${storyId}`);
  const charRows = db.select().from(characters).where(eq(characters.storyId, storyId)).all();
  if (charRows.length === 0) return;
  const drafts = await provider.generateCDS({
    characters: charRows.map((c) => ({ id: c.id, name: c.name, description: c.userInput })),
    storyText: story.storyText,
    artStylePrompt: story.artStylePrompt,
  });
  for (const d of drafts) {
    db.update(characters)
      .set({
        cdsAppearance: d.appearance,
        cdsOutfit: d.outfit,
        cdsTraits: d.traits,
        cdsStyle: d.style,
      })
      .where(eq(characters.id, d.characterId))
      .run();
  }
}
