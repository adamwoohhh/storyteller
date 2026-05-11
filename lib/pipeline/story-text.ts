import { eq, sql } from "drizzle-orm";
import type { DB } from "@/lib/db/client";
import { stories, characters as charactersTable } from "@/lib/db/schema";
import type { TextProvider } from "@/lib/providers/types";

export async function generateStoryText(args: {
  db: DB;
  provider: TextProvider;
  storyId: string;
  // 是否是修改 prompt 重新生成的场景
  revisePrompt?: string;
  onChunk: (chunk: string) => void;
  signal?: AbortSignal;
}): Promise<string> {
  const { db, provider, storyId, revisePrompt, onChunk, signal } = args;
  // 从 db 查询故事基础信息
  const row = db.select().from(stories).where(eq(stories.id, storyId)).get();
  if (!row) throw new Error(`story not found: ${storyId}`);
  // 从 db 查询角色信息
  const charRows = db
    .select()
    .from(charactersTable)
    .where(eq(charactersTable.storyId, storyId))
    .all();

  const input = {
    setting: row.setting,
    opening: row.opening,
    characters: charRows.map((c) => ({ name: c.name, description: c.userInput })),
  };
  const opts = revisePrompt
    ? { revise: { previousStory: row.storyText, revisePrompt } }
    : undefined;

  let full = "";
  // 调用模型接口生成故事正文
  for await (const chunk of provider.generateStory(input, opts)) {
    if (signal?.aborted) throw new Error("aborted");
    full += chunk;
    onChunk(chunk);
  }
  db.update(stories)
    .set({ storyText: full, status: "text_done", updatedAt: sql`(unixepoch())` })
    .where(eq(stories.id, storyId))
    .run();
  return full;
}
