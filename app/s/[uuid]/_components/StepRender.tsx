"use client";
import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/client/api";
import { useJob } from "@/lib/client/useJob";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

export function StepRender({
  data,
  onDone,
  reload,
}: {
  data: Any;
  onDone: () => void;
  reload: () => Promise<void>;
}) {
  const [jobId, setJobId] = useState<string | null>(null);
  const job = useJob(jobId);

  useEffect(() => {
    if (jobId === null) api.renderAll(data.story.id).then((r) => setJobId(r.jobId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.story.id]);

  useEffect(() => {
    if (job.status === "done") {
      reload().then(() => onDone());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job.status]);

  const total = job.progress?.total ?? data.nodes.length;
  const current = job.progress?.current ?? 0;
  const pct = total === 0 ? 0 : Math.round((current / total) * 100);

  return (
    <main className="max-w-3xl mx-auto p-8 space-y-6">
      <h2 className="text-xl font-semibold">生成插图</h2>
      <Progress value={pct} />
      <div className="text-sm text-muted-foreground">
        {current} / {total} 完成（{pct}%）
      </div>
      {job.status === "error" && <div className="text-red-600">出错：{job.error}</div>}
      <Button variant="outline" onClick={() => jobId && api.cancelJob(jobId)}>
        取消
      </Button>
    </main>
  );
}
