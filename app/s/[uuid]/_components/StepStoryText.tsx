"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/client/api";
import { useJob } from "@/lib/client/useJob";
import { toast } from "sonner";
import { StepFrame } from "./StepFrame";
import { splitStoryParagraphs } from "@/lib/story-paragraphs";

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
  const [revisePrompt, setRevisePrompt] = useState("");
  const [saving, setSaving] = useState(false);

  // 如果故事正文未生成，并且是结构化创作模式，则自动触发生成文本的任务
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

  async function revise() {
    if (!revisePrompt.trim()) return;
    const { jobId } = await api.reviseText(data.story.id, revisePrompt.trim());
    setJobId(jobId);
    setRevisePrompt("");
  }

  async function saveEdit() {
    setSaving(true);
    try {
      await api.patchStory(data.story.id, { storyText: data.story.storyText ?? "" });
      await reload();
      toast.success("已保存");
    } finally {
      setSaving(false);
    }
  }

  const liveText = job.status === "running" ? job.chunks : data.story.storyText ?? "";
  const isStreaming = job.status === "running";

  return (
    <StepFrame
      title="故事文本"
      description="先把故事揉成一篇完整草稿，再决定下一幕怎么分镜。"
      currentStep="story"
    >
      <StoryParagraphPreview text={liveText} showCursor={isStreaming} />
      {!isStreaming && (
        <>
          <div className="mt-6 space-y-3 rounded-3xl border border-border bg-[#fff8e8] p-4">
            <Label htmlFor="revise-prompt" className="font-black text-foreground">
              修订提示词（让模型按要求改写整篇）
            </Label>
            <Input
              id="revise-prompt"
              value={revisePrompt}
              onChange={(e) => setRevisePrompt(e.target.value)}
              placeholder="例：让结尾更温馨；加快中段节奏"
            />
          </div>
          <div className="mt-6 flex flex-wrap justify-end gap-2">
            <Button variant="secondary" onClick={revise} disabled={!revisePrompt.trim()}>
              修改故事
            </Button>
            <Button variant="outline" onClick={saveEdit} disabled={saving || !liveText.trim()}>
              {saving ? "保存中…" : "保存文本"}
            </Button>
            <Button onClick={onNext} disabled={!liveText.trim()}>
              继续 → 分镜
            </Button>
          </div>
        </>
      )}
    </StepFrame>
  );
}

function StoryParagraphPreview({
  text,
  showCursor = false,
}: {
  text: string;
  showCursor?: boolean;
}) {
  const paragraphs = splitStoryParagraphs(text);
  const visible = paragraphs.length > 0 ? paragraphs : [text];

  return (
    <div className="min-h-[220px] rounded-3xl border-2 border-dashed border-[#5a3029]/30 bg-[#fff8e8] p-5 leading-7">
      {visible.map((paragraph, index) => (
        <div key={index}>
          {index > 0 && <div className="my-4 h-px bg-[#5a3029]/20" />}
          <p className="whitespace-pre-wrap">{paragraph}</p>
        </div>
      ))}
      {showCursor && <span className="animate-pulse">▍</span>}
    </div>
  );
}
