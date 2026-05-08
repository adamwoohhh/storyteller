"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/client/api";
import { useJob } from "@/lib/client/useJob";
import { toast } from "sonner";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

export function StepStoryText({
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
  const [edited, setEdited] = useState<string>(data.story.storyText ?? "");
  const [revisePrompt, setRevisePrompt] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (
      !data.story.storyText &&
      data.story.inputMode === "structured" &&
      jobId === null
    ) {
      api
        .generateText(data.story.id)
        .then((r) => setJobId(r.jobId))
        .catch((e: Error) => toast.error(e.message));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.story.id]);

  useEffect(() => {
    if (job.status === "done") reload();
    if (job.status === "error") toast.error(job.error ?? "生成失败");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job.status]);

  useEffect(() => {
    setEdited(data.story.storyText ?? "");
  }, [data.story.storyText]);

  async function revise() {
    if (!revisePrompt.trim()) return;
    const { jobId } = await api.reviseText(data.story.id, revisePrompt.trim());
    setJobId(jobId);
    setRevisePrompt("");
  }

  async function saveEdit() {
    setSaving(true);
    try {
      await api.patchStory(data.story.id, { storyText: edited });
      await reload();
      toast.success("已保存");
    } finally {
      setSaving(false);
    }
  }

  const liveText = job.status === "running" ? job.chunks : edited;
  const isStreaming = job.status === "running";

  return (
    <main className="max-w-3xl mx-auto p-8 space-y-6">
      <h2 className="text-xl font-semibold">故事文本</h2>
      {isStreaming ? (
        <div className="whitespace-pre-wrap border rounded p-4 bg-muted/20 min-h-[200px]">
          {liveText}
          <span className="animate-pulse">▍</span>
        </div>
      ) : (
        <Textarea rows={18} value={edited} onChange={(e) => setEdited(e.target.value)} />
      )}
      {!isStreaming && (
        <>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={saveEdit} disabled={saving}>
              {saving ? "保存中…" : "保存编辑"}
            </Button>
          </div>
          <div className="space-y-2 border-t pt-4">
            <Label>修订提示词（让模型按要求改写整篇）</Label>
            <Input
              value={revisePrompt}
              onChange={(e) => setRevisePrompt(e.target.value)}
              placeholder="例：让结尾更温馨；加快中段节奏"
            />
            <Button
              variant="secondary"
              onClick={revise}
              disabled={!revisePrompt.trim()}
            >
              按提示词重新生成
            </Button>
          </div>
          <div className="flex justify-end">
            <Button onClick={onNext} disabled={!edited.trim()}>
              继续 → 分镜
            </Button>
          </div>
        </>
      )}
    </main>
  );
}
