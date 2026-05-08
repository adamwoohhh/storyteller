"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/client/api";
import { useJob } from "@/lib/client/useJob";
import { toast } from "sonner";

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
    <main className="max-w-3xl mx-auto p-8 space-y-6">
      <h2 className="text-xl font-semibold">分镜</h2>
      {job.status === "running" && <div>分镜生成中…</div>}
      <div className="space-y-3">
        {data.nodes.map((n: Any, i: number) => (
          <Card key={n.id} className="p-3 space-y-2">
            <div className="text-xs text-muted-foreground">节点 {i + 1}</div>
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
      <div className="flex justify-end">
        <Button onClick={onNext} disabled={data.nodes.length === 0}>
          继续 → 画风
        </Button>
      </div>
    </main>
  );
}
