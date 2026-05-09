"use client";
import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/client/api";
import { useJob } from "@/lib/client/useJob";
import { StepFrame } from "./StepFrame";

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
    <StepFrame
      title="生成插图"
      description="故事镜头正在一张张变成绘本插图。"
      currentStep="render"
    >
      <div className="rounded-3xl bg-[#fff8e8] p-5">
        <Progress value={pct} />
        <div className="mt-4 text-center text-sm font-black text-muted-foreground">
          {current} / {total} 完成（{pct}%）
        </div>
      </div>
      {job.status === "error" && (
        <div className="mt-4 rounded-3xl bg-destructive/10 p-4 text-destructive">
          出错：{job.error}
        </div>
      )}
      <div className="mt-6 flex justify-center">
        <Button variant="outline" onClick={() => jobId && api.cancelJob(jobId)}>
          取消
        </Button>
      </div>
    </StepFrame>
  );
}
