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

export async function POST(req: NextRequest) {
  const { db } = await getRuntime();
  const body = Schema.parse(await req.json());
  const id = randomUUID();
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
  return NextResponse.json({ id });
}
