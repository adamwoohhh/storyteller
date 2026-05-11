export const ADMIN_STORIES_HREF = "/admin/stories";

export type StoryViewMode = "edit" | "read";

export function getStoryDisplayTitle(title: string | null | undefined): string {
  const trimmed = title?.trim();
  return trimmed || "未命名故事";
}

export function getStoryModeAction(mode: StoryViewMode): { label: string; mode: StoryViewMode } {
  return mode === "edit" ? { label: "阅读态", mode: "read" } : { label: "编辑态", mode: "edit" };
}
