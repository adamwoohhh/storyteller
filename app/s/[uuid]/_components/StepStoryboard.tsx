"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/client/api";
import { useJob } from "@/lib/client/useJob";
import { toast } from "sonner";
import { StepFrame } from "./StepFrame";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

export function StepStoryboard({
  data,
  onNext,
  reload,
}: {
  data: Any;
  onNext: () => void;
  reload: () => Promise<void>;
}) {
  const [jobId, setJobId] = useState<string | null>(null);
  const job = useJob(jobId);

  useEffect(() => {
    if (data.nodes.length === 0 && jobId === null) {
      api
        .storyboard(data.story.id, { targetMin: 6, targetMax: 12 })
        .then((r) => setJobId(r.jobId))
        .catch((e: Error) => toast.error(e.message));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.story.id, data.nodes.length]);

  useEffect(() => {
    if (job.status === "done") reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job.status]);

  async function patch(id: string, body: Any) {
    await api.patchNode(id, body);
    await reload();
  }

  return (
    <StepFrame
      title="分镜小剧场"
      description="每个节点都是一格画面：上面是剧情，下面是生图提示。"
      currentStep="storyboard"
    >
      {job.status === "running" && (
        <div className="mb-4 rounded-full bg-secondary px-4 py-2 text-center text-sm font-black">
          分镜生成中…
        </div>
      )}
      <div className="grid gap-4">
        {data.nodes.map((n: Any, i: number) => (
          <Card key={n.id} className="space-y-3 bg-[#fff8e8] p-4">
            <div className="story-chip w-fit bg-secondary text-foreground">镜头 {i + 1}</div>
            <div className="rounded-2xl border border-[#5a3029]/15 bg-card/70 p-3">
              <div className="mb-2 text-xs font-black text-muted-foreground">原始段落</div>
              <div className="whitespace-pre-wrap text-sm leading-6">{n.text}</div>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`summary-${n.id}`}>段落总结</Label>
              <Textarea
                id={`summary-${n.id}`}
                rows={2}
                value={n.summary ?? ""}
                onChange={(e) => patch(n.id, { summary: e.target.value })}
                placeholder="整段总结或选取片段总结"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`image-prompt-${n.id}`}>画面提示词</Label>
              <Textarea
                id={`image-prompt-${n.id}`}
                rows={3}
                value={n.imagePrompt}
                onChange={(e) => patch(n.id, { imagePrompt: e.target.value })}
                placeholder="image_prompt（用于生图）"
              />
            </div>
          </Card>
        ))}
      </div>
      <div className="mt-6 flex justify-end">
        <Button onClick={onNext} disabled={data.nodes.length === 0}>
          继续 → 画风
        </Button>
      </div>
    </StepFrame>
  );
}
