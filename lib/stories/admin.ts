import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { assets, characters, nodes, stories } from "@/lib/db/schema";
import type { DB } from "@/lib/db/client";

export function listActiveStories(db: DB) {
  return db
    .select({
      id: stories.id,
      title: stories.title,
      inputMode: stories.inputMode,
      status: stories.status,
      createdAt: stories.createdAt,
      updatedAt: stories.updatedAt,
      characterCount: sql<number>`count(distinct ${characters.id})`,
      nodeCount: sql<number>`count(distinct ${nodes.id})`,
    })
    .from(stories)
    .leftJoin(characters, eq(characters.storyId, stories.id))
    .leftJoin(nodes, eq(nodes.storyId, stories.id))
    .where(isNull(stories.deletedAt))
    .groupBy(stories.id)
    .orderBy(desc(stories.updatedAt))
    .all();
}

export function getActiveStoryBundle(db: DB, id: string) {
  const story = db
    .select()
    .from(stories)
    .where(and(eq(stories.id, id), isNull(stories.deletedAt)))
    .get();
  if (!story) return null;

  const cs = db.select().from(characters).where(eq(characters.storyId, id)).all();
  const ns = db
    .select()
    .from(nodes)
    .where(eq(nodes.storyId, id))
    .all()
    .sort((a, b) => a.orderIndex - b.orderIndex);
  const as = db.select().from(assets).where(eq(assets.storyId, id)).all();

  return { story, characters: cs, nodes: ns, assets: as };
}

export function logicallyDeleteStory(db: DB, id: string) {
  const story = db.select({ id: stories.id }).from(stories).where(eq(stories.id, id)).get();
  if (!story) return null;

  db.update(stories)
    .set({ deletedAt: sql`(unixepoch())`, updatedAt: sql`(unixepoch())` })
    .where(eq(stories.id, id))
    .run();

  return { ok: true as const };
}
