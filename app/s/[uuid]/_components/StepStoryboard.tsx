"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
  const isPaste = data.story.inputMode === "paste";

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
            <Textarea
              rows={3}
              value={n.text}
              disabled={isPaste}
              onChange={(e) => patch(n.id, { text: e.target.value })}
              placeholder="节点文本"
            />
            <Textarea
              rows={3}
              value={n.imagePrompt}
              onChange={(e) => patch(n.id, { imagePrompt: e.target.value })}
              placeholder="image_prompt（用于生图）"
            />
          </Card>
        ))}
      </div>
      <div className="mt-6 flex justify-end">
        <Button onClick={onNext} disabled={data.nodes.length === 0}>
          继续：画风
        </Button>
      </div>
    </StepFrame>
  );
}
