import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const stories = sqliteTable("stories", {
  id: text("id").primaryKey(),
  title: text("title").notNull().default(""),
  inputMode: text("input_mode", { enum: ["structured", "paste"] }).notNull(),
  setting: text("setting").notNull().default(""),
  opening: text("opening").notNull().default(""),
  storyText: text("story_text").notNull().default(""),
  artStyleKey: text("art_style_key").notNull().default(""),
  artStylePrompt: text("art_style_prompt").notNull().default(""),
  status: text("status", {
    enum: ["draft", "text_done", "storyboard_done", "style_done", "cds_done", "rendering", "done"],
  })
    .notNull()
    .default("draft"),
  createdAt: integer("created_at").notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at").notNull().default(sql`(unixepoch())`),
  deletedAt: integer("deleted_at"),
});

export const assets = sqliteTable("assets", {
  id: text("id").primaryKey(),
  storyId: text("story_id")
    .notNull()
    .references(() => stories.id, { onDelete: "cascade" }),
  kind: text("kind", { enum: ["cds", "scene", "user_upload"] }).notNull(),
  filePath: text("file_path").notNull(),
  mime: text("mime").notNull(),
  createdAt: integer("created_at").notNull().default(sql`(unixepoch())`),
});

export const characters = sqliteTable("characters", {
  id: text("id").primaryKey(),
  storyId: text("story_id")
    .notNull()
    .references(() => stories.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  userInput: text("user_input").notNull().default(""),
  userImageId: text("user_image_id").references(() => assets.id, { onDelete: "set null" }),
  cdsAppearance: text("cds_appearance").notNull().default(""),
  cdsOutfit: text("cds_outfit").notNull().default(""),
  cdsTraits: text("cds_traits").notNull().default(""),
  cdsStyle: text("cds_style").notNull().default(""),
  cdsImageId: text("cds_image_id").references(() => assets.id, { onDelete: "set null" }),
  confirmed: integer("confirmed", { mode: "boolean" }).notNull().default(false),
});

export const nodes = sqliteTable("nodes", {
  id: text("id").primaryKey(),
  storyId: text("story_id")
    .notNull()
    .references(() => stories.id, { onDelete: "cascade" }),
  orderIndex: integer("order_index").notNull(),
  text: text("text").notNull().default(""),
  summary: text("summary").notNull().default(""),
  imagePrompt: text("image_prompt").notNull().default(""),
  characters: text("characters").notNull().default("[]"),
  imageId: text("image_id").references(() => assets.id, { onDelete: "set null" }),
  positionX: real("position_x").notNull().default(0),
  positionY: real("position_y").notNull().default(0),
});

export const jobs = sqliteTable("jobs", {
  id: text("id").primaryKey(),
  storyId: text("story_id")
    .notNull()
    .references(() => stories.id, { onDelete: "cascade" }),
  kind: text("kind", {
    enum: [
      "generate_story",
      "revise_story",
      "storyboard",
      "extract_chars",
      "cds_text",
      "cds_image",
      "scene_render",
    ],
  }).notNull(),
  targetId: text("target_id"),
  status: text("status", { enum: ["pending", "running", "done", "error", "canceled"] })
    .notNull()
    .default("pending"),
  error: text("error"),
  createdAt: integer("created_at").notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at").notNull().default(sql`(unixepoch())`),
});
