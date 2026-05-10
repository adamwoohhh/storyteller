"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/client/api";
import { useJob } from "@/lib/client/useJob";
import { StepFrame } from "./StepFrame";
import { buildStoryGalleryItems, ImageGalleryThumb } from "./image-gallery";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

export function StepCDS({
  data,
  onNext,
  reload,
}: {
  data: Any;
  onNext: () => void;
  reload: () => Promise<void>;
}) {
  const [renderJob, setRenderJob] = useState<{ id: string; charId: string } | null>(null);
  const job = useJob(renderJob?.id ?? null);
  const galleryItems = buildStoryGalleryItems(data);

  useEffect(() => {
    if (job.status === "done") {
      reload();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRenderJob(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job.status]);

  async function patch(id: string, body: Any) {
    await api.patchCharacter(id, body);
    await reload();
  }
  async function render(id: string) {
    const r = await api.renderCharacter(id);
    setRenderJob({ id: r.jobId, charId: id });
  }

  const allConfirmed =
    data.characters.length > 0 && data.characters.every((c: Any) => c.confirmed);

  return (
    <StepFrame
      title="角色设计卡"
      description="编辑每个角色的外貌、服饰、特征和风格，确认后就能批量生成插图。"
      currentStep="cds"
    >
      <div className="space-y-5">
        {data.characters.map((c: Any) => (
          <Card key={c.id} className="space-y-4 bg-[#fff8e8] p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-lg font-black">{c.name}</div>
              {c.confirmed && <span className="story-chip-active story-chip">已确认</span>}
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="font-black">外貌</Label>
                <Textarea
                  rows={3}
                  value={c.cdsAppearance}
                  onChange={(e) => patch(c.id, { cdsAppearance: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="font-black">服饰</Label>
                <Textarea
                  rows={3}
                  value={c.cdsOutfit}
                  onChange={(e) => patch(c.id, { cdsOutfit: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="font-black">特征</Label>
                <Textarea
                  rows={3}
                  value={c.cdsTraits}
                  onChange={(e) => patch(c.id, { cdsTraits: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="font-black">风格</Label>
                <Textarea
                  rows={3}
                  value={c.cdsStyle}
                  onChange={(e) => patch(c.id, { cdsStyle: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              {c.cdsImageId ? (
                <ImageGalleryThumb
                  items={galleryItems}
                  assetId={c.cdsImageId}
                  alt=""
                  className="h-32 w-32 rounded-3xl border-2 border-[#5a3029]/30 object-cover shadow-[0_5px_0_rgb(90_48_41_/_0.18)]"
                />
              ) : (
                <div className="flex h-32 w-32 items-center justify-center rounded-3xl border-2 border-dashed border-[#5a3029]/30 bg-card text-xs font-black text-muted-foreground">
                  未生成
                </div>
              )}
              <div className="flex flex-col gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => render(c.id)}
                  disabled={!!renderJob}
                >
                  {renderJob?.charId === c.id && job.status === "running"
                    ? "生成中…"
                    : c.cdsImageId
                      ? "重新生成参考图"
                      : "生成参考图"}
                </Button>
                <Button
                  size="sm"
                  variant={c.confirmed ? "default" : "outline"}
                  onClick={() => patch(c.id, { confirmed: !c.confirmed })}
                  disabled={!c.cdsImageId}
                >
                  {c.confirmed ? "已确认" : "确认"}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <div className="mt-6 flex justify-end">
        <Button onClick={onNext} disabled={!allConfirmed}>
          开始生成插图
        </Button>
      </div>
    </StepFrame>
  );
}
