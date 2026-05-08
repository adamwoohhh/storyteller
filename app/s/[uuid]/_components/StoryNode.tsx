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
      setJobId(null);
      data.onChanged();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job.status]);

  return (
    <div className="bg-white border rounded-md shadow w-72">
      <Handle type="target" position={Position.Top} />
      <div className="aspect-square w-full bg-muted overflow-hidden">
        {data.imageId ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/assets/${data.imageId}`}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
            {job.status === "running" ? "生成中…" : "暂无图片"}
          </div>
        )}
      </div>
      <div className="p-3 space-y-2">
        <div className="text-sm whitespace-pre-wrap line-clamp-4">{data.text}</div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
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
