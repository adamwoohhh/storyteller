import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import type { DB } from "@/lib/db/client";
import { stories, characters } from "@/lib/db/schema";
import type { TextProvider } from "@/lib/providers/types";

export async function extractCharacters(args: {
  db: DB;
  provider: TextProvider;
  storyId: string;
}): Promise<{ id: string; name: string; description: string }[]> {
  const { db, provider, storyId } = args;
  const row = db.select().from(stories).where(eq(stories.id, storyId)).get();
  if (!row) throw new Error(`story not found: ${storyId}`);
  const extracted = await provider.extractCharacters(row.storyText);
  const inserted: { id: string; name: string; description: string }[] = [];
  for (const c of extracted) {
    const id = randomUUID();
    db.insert(characters)
      .values({
        id,
        storyId,
        name: c.name,
        userInput: c.description,
      })
      .run();
    inserted.push({ id, name: c.name, description: c.description });
  }
  return inserted;
}
