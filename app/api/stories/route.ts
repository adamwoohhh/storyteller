import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { getRuntime } from "@/lib/runtime";
import { stories, characters as charactersTable } from "@/lib/db/schema";

export const runtime = "nodejs";

const Schema = z.object({
  inputMode: z.enum(["structured", "paste"]),
  title: z.string().default(""),
  setting: z.string().default(""),
  opening: z.string().default(""),
  storyText: z.string().default(""),
  characters: z
    .array(
      z.object({
        name: z.string().min(1),
        description: z.string().default(""),
        userImageId: z.string().optional(),
      }),
    )
    .default([]),
});

/**
 * 创建故事，入口api
 */
export async function POST(req: NextRequest) {
  // runtime 封装了一些全局单例（比如数据库对象）
  const { db } = await getRuntime();
  // 根据 schema 解析请求体
  const body = Schema.parse(await req.json());
  // 生成 story id
  const id = randomUUID();
  // 插入数据库：故事表
  db.insert(stories)
    .values({
      id,
      title: body.title,
      inputMode: body.inputMode,
      setting: body.setting,
      opening: body.opening,
      storyText: body.storyText,
      status: body.inputMode === "paste" && body.storyText ? "text_done" : "draft",
    })
    .run();
  // 解析请求体中的角色信息，插入角色表
  for (const c of body.characters) {
    const cid = randomUUID();
    db.insert(charactersTable)
      .values({
        id: cid,
        storyId: id,
        name: c.name,
        userInput: c.description,
        userImageId: c.userImageId ?? null,
      })
      .run();
  }
  // 返回 id
  return NextResponse.json({ id });
}
