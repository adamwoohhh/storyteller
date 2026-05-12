"use client";
import { Handle, Position } from "reactflow";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useJob } from "@/lib/client/useJob";
import { useEffect, useState } from "react";
import { api } from "@/lib/client/api";
import { toast } from "sonner";
import {
  buildRenderPromptPreview,
  type PromptPreviewCharacter,
  type PromptPreviewStory,
} from "./render-prompt-preview";
import { type GalleryItem, ImageGalleryThumb } from "./image-gallery";
import { cn } from "@/lib/utils";
import { EDITOR_NODE_HEIGHT, EDITOR_NODE_WIDTH } from "./editor-layout";

export interface StoryNodeData {
  id: string;
  text: string;
  summary?: string;
  characters: string;
  imagePrompt: string;
  imageId: string | null;
  isRendering?: boolean;
  imageSide?: "left" | "right";
  story: PromptPreviewStory;
  allCharacters: PromptPreviewCharacter[];
  galleryItems: GalleryItem[];
  onChanged: () => void;
}

export function StoryNodeView({ data }: { data: StoryNodeData }) {
  const [jobId, setJobId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState(data.imagePrompt);
  const [saving, setSaving] = useState(false);
  const job = useJob(jobId);
  const preview = buildRenderPromptPreview({
    story: data.story,
    node: { characters: data.characters, imagePrompt: editedPrompt },
    characters: data.allCharacters,
  });

  async function regen(prompt: string = data.imagePrompt) {
    try {
      if (prompt !== data.imagePrompt) {
        await api.patchNode(data.id, { imagePrompt: prompt });
      }
      const r = await api.renderNode(data.id);
      setJobId(r.jobId);
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "重生图失败");
    }
  }

  async function saveAndRegen() {
    setSaving(true);
    try {
      await regen(editedPrompt);
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    if (job.status === "done" && jobId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setJobId(null);
      data.onChanged();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job.status]);

  function changeOpen(nextOpen: boolean) {
    if (nextOpen) setEditedPrompt(data.imagePrompt);
    setOpen(nextOpen);
  }

  const isNodeRendering = data.isRendering || (!!jobId && job.status === "running");

  const hasInlineImage = Boolean(data.imageId || isNodeRendering);
  const imageSide = data.imageSide ?? "right";

  return (
    <div
      className="overflow-hidden rounded-[1.25rem] border-2 border-[#5a3029] bg-card shadow-[7px_7px_0_#bed18a]"
      style={{ width: EDITOR_NODE_WIDTH, height: EDITOR_NODE_HEIGHT }}
    >
      <Handle type="target" position={Position.Top} />
      <div className="flex h-full flex-col gap-3 p-4">
        <div className="min-h-0 flex-1 overflow-y-auto whitespace-pre-wrap pr-1 text-sm leading-6">
          {hasInlineImage && (
            <div
              className={cn(
                "mb-2 size-32 overflow-hidden rounded-2xl border border-[#5a3029]/20 bg-muted",
                imageSide === "left" ? "float-left mr-3" : "float-right ml-3",
              )}
            >
              {data.imageId ? (
                <ImageGalleryThumb
                  items={data.galleryItems}
                  assetId={data.imageId}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs font-black text-muted-foreground">
                  生成中…
                </div>
              )}
            </div>
          )}
          {data.text}
        </div>
        {data.summary && (
          <div className="max-h-14 overflow-y-auto rounded-2xl border border-[#5a3029]/15 bg-[#fff8e8] p-2 text-xs leading-5 text-muted-foreground">
            {data.summary}
          </div>
        )}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="nodrag nopan"
            onClick={() => changeOpen(true)}
            disabled={isNodeRendering}
          >
            重生图
          </Button>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} />
      <Dialog open={open} onOpenChange={changeOpen}>
        <DialogContent className="max-h-[88vh] overflow-y-auto rounded-[1.75rem] border-2 border-[#5a3029] bg-card p-5 shadow-[8px_8px_0_#d9b76f] sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">重生图提示词</DialogTitle>
            <DialogDescription>
              这里展示本次生图会用到的所有信息。节点提示词可以修改，全局画风和角色信息只读。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <section className="space-y-2">
              <div className="text-sm font-black">当前节点 imagePrompt（可修改）</div>
              <Textarea
                className="nodrag nopan"
                rows={5}
                value={editedPrompt}
                onChange={(event) => setEditedPrompt(event.target.value)}
              />
            </section>

            <ReadOnlyBlock title="全局画风 prompt" value={preview.artStylePrompt || "未设置"} />
            <ReadOnlyBlock title="当前节点剧情文本" value={data.text || "未设置"} />
            <ReadOnlyBlock title="角色 CDS 描述" value={preview.characterPrompt || "没有关联角色"} />

            <section className="space-y-2">
              <div className="text-sm font-black">角色参考图</div>
              <div className="grid gap-2 sm:grid-cols-2">
                {preview.references.length > 0 ? (
                  preview.references.map((reference) => (
                    <div
                      key={reference.id}
                      className="flex items-center gap-3 rounded-2xl border border-border bg-[#fff8e8] p-3"
                    >
                      {reference.cdsImageId ? (
                        <ImageGalleryThumb
                          items={data.galleryItems}
                          assetId={reference.cdsImageId}
                          alt=""
                          className="size-12 rounded-2xl border border-[#5a3029]/20 object-cover"
                        />
                      ) : (
                        <div className="flex size-12 items-center justify-center rounded-2xl border border-dashed border-[#5a3029]/30 text-xs text-muted-foreground">
                          无图
                        </div>
                      )}
                      <div>
                        <div className="font-black">{reference.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {reference.cdsImageId ? "会作为参考图传给模型" : "没有参考图"}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-border bg-[#fff8e8] p-3 text-sm text-muted-foreground">
                    这个节点没有关联角色。
                  </div>
                )}
              </div>
            </section>

            <ReadOnlyBlock title="最终 prompt 预览" value={preview.finalPrompt || "暂无 prompt"} />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => changeOpen(false)}>
              取消
            </Button>
            <Button onClick={saveAndRegen} disabled={saving || (!!jobId && job.status === "running")}>
              {saving || (!!jobId && job.status === "running") ? "生成中…" : "保存并重生图"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ReadOnlyBlock({ title, value }: { title: string; value: string }) {
  return (
    <section className="space-y-2">
      <div className="text-sm font-black">{title}</div>
      <div className="max-h-40 overflow-y-auto whitespace-pre-wrap rounded-2xl border border-border bg-[#fff8e8] p-3 text-xs leading-5 text-muted-foreground">
        {value}
      </div>
    </section>
  );
}
