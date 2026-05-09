"use client";
import { Handle, Position } from "reactflow";
import { Button } from "@/components/ui/button";
import { useJob } from "@/lib/client/useJob";
import { useEffect, useState } from "react";
import { api } from "@/lib/client/api";

export interface StoryNodeData {
  id: string;
  text: string;
  imagePrompt: string;
  imageId: string | null;
  onChanged: () => void;
}

export function StoryNodeView({ data }: { data: StoryNodeData }) {
  const [jobId, setJobId] = useState<string | null>(null);
  const job = useJob(jobId);

  async function regen() {
    const r = await api.renderNode(data.id);
    setJobId(r.jobId);
  }

  useEffect(() => {
    if (job.status === "done" && jobId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setJobId(null);
      data.onChanged();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job.status]);

  return (
    <div className="w-72 overflow-hidden rounded-[1.5rem] border-2 border-[#5a3029] bg-card shadow-[7px_7px_0_#bed18a]">
      <Handle type="target" position={Position.Top} />
      <div className="aspect-square w-full overflow-hidden bg-muted">
        {data.imageId ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/assets/${data.imageId}`}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs font-black text-muted-foreground">
            {job.status === "running" ? "生成中…" : "暂无图片"}
          </div>
        )}
      </div>
      <div className="space-y-3 p-4">
        <div className="line-clamp-4 whitespace-pre-wrap text-sm leading-6">{data.text}</div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="nodrag nopan"
            onClick={regen}
            disabled={job.status === "running"}
          >
            重生图
          </Button>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
