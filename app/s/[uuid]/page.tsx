import { StepShell } from "./_components/StepShell";

export default async function StoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ uuid: string }>;
  searchParams: Promise<{ step?: string; mode?: string }>;
}) {
  const { uuid } = await params;
  const sp = await searchParams;
  return <StepShell storyId={uuid} step={sp.step ?? "auto"} mode={sp.mode ?? "edit"} />;
}
