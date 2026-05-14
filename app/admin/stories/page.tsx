import { getRuntime } from "@/lib/runtime";
import { listActiveStories } from "@/lib/stories/admin";
import { StoryAdminClient } from "./StoryAdminClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function StoryAdminPage() {
  const { db } = await getRuntime();
  const storyRows = listActiveStories(db);

  return <StoryAdminClient stories={storyRows} />;
}
