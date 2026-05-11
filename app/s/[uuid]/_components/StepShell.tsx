"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/client/api";
import { StepStoryText } from "./StepStoryText";
import { StepExtract } from "./StepExtract";
import { StepStoryboard } from "./StepStoryboard";
import { StepArtStyle } from "./StepArtStyle";
import { StepCDS } from "./StepCDS";
import { EditorCanvas } from "./EditorCanvas";
import { ReadView } from "./ReadView";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Data = any;

/**
 * 创作流程分步调度
 */
export function StepShell({
  storyId,
  step,
  mode,
}: {
  storyId: string;
  step: string;
  mode: string;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const [data, setData] = useState<Data | null>(null);

  // 查询故事信息
  const reload = useCallback(
    async () => api.getStory(storyId).then(setData),
    [storyId],
  );

  useEffect(() => {
    reload().catch(() => {});
  }, [reload]);

  if (!data) {
    return (
      <main className="story-bg flex min-h-screen items-center justify-center px-4">
        <div className="story-panel px-8 py-6 text-center font-black text-primary">
          加载故事小剧场中…
        </div>
      </main>
    );
  }

  const goto = (s: string) => router.push(`/s/${storyId}?step=${s}`);
  const gotoMode = (m: "edit" | "read") => router.push(`/s/${storyId}?mode=${m}`);

  // 如果不存在 step 参数且存在mode参数，则进入阅读/编辑切换模式
  if (sp.get("mode") && !sp.get("step")) {
    return mode === "read" ? (
      <ReadView data={data} onSwitch={() => gotoMode("edit")} />
    ) : (
      <EditorCanvas data={data} onSwitch={() => gotoMode("read")} reload={reload} />
    );
  }

  // 进入故事创作流程
  switch (step) {
    case "story":
      return (
        <StepStoryText data={data} onNext={() => goto("storyboard")} reload={reload} />
      );
    case "extract":
      return (
        <StepExtract data={data} onNext={() => goto("storyboard")} reload={reload} />
      );
    case "storyboard":
      return (
        <StepStoryboard data={data} onNext={() => goto("style")} reload={reload} />
      );
    case "style":
      return <StepArtStyle data={data} onNext={() => goto("cds")} reload={reload} />;
    case "cds":
      return <StepCDS data={data} onNext={() => gotoMode("edit")} reload={reload} />;
    default: {
      const s = data.story.status as string;
      const map: Record<string, string> = {
        draft: "story",
        text_done: "storyboard",
        storyboard_done: "style",
        style_done: "cds",
        cds_done: "",
        rendering: "",
        done: "",
      };
      const next = map[s] ?? "story";
      if (next) router.replace(`/s/${storyId}?step=${next}`);
      else router.replace(`/s/${storyId}?mode=edit`);
      return (
        <main className="story-bg flex min-h-screen items-center justify-center px-4">
          <div className="story-panel px-8 py-6 text-center font-black text-primary">
            正在打开下一幕…
          </div>
        </main>
      );
    }
  }
}
