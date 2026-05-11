"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/client/api";
import { useJob } from "@/lib/client/useJob";
import { StepFrame } from "../StepFrame";
import { buildStoryGalleryItems, ImageGalleryThumb } from "../image-gallery";
import { type CDSDraft, saveAndRenderCharacter } from "./step-cds-actions";

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
  const [savingRenderId, setSavingRenderId] = useState<string | null>(null);
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
  async function render(id: string, draft: CDSDraft) {
    setSavingRenderId(id);
    try {
      const r = await saveAndRenderCharacter({
        characterId: id,
        draft,
        patchCharacter: api.patchCharacter,
        renderCharacter: api.renderCharacter,
      });
      setRenderJob({ id: r.jobId, charId: id });
    } finally {
      setSavingRenderId(null);
    }
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
          <CharacterCDSCard
            key={c.id}
            character={c}
            galleryItems={galleryItems}
            renderJob={renderJob}
            savingRenderId={savingRenderId}
            jobStatus={job.status}
            onRender={render}
            onConfirm={(confirmed) => patch(c.id, { confirmed })}
          />
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

function CharacterCDSCard({
  character,
  galleryItems,
  renderJob,
  savingRenderId,
  jobStatus,
  onRender,
  onConfirm,
}: {
  character: Any;
  galleryItems: ReturnType<typeof buildStoryGalleryItems>;
  renderJob: { id: string; charId: string } | null;
  savingRenderId: string | null;
  jobStatus: string;
  onRender: (id: string, draft: CDSDraft) => Promise<void>;
  onConfirm: (confirmed: boolean) => Promise<void>;
}) {
  const [draft, setDraft] = useState<CDSDraft>({
    cdsAppearance: character.cdsAppearance,
    cdsOutfit: character.cdsOutfit,
    cdsTraits: character.cdsTraits,
    cdsStyle: character.cdsStyle,
  });

  function updateDraft(field: keyof CDSDraft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  return (
    <Card className="space-y-4 bg-[#fff8e8] p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-lg font-black">{character.name}</div>
        {character.confirmed && <span className="story-chip-active story-chip">已确认</span>}
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <Label className="font-black">外貌</Label>
          <Textarea
            rows={3}
            value={draft.cdsAppearance}
            onChange={(e) => updateDraft("cdsAppearance", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label className="font-black">服饰</Label>
          <Textarea
            rows={3}
            value={draft.cdsOutfit}
            onChange={(e) => updateDraft("cdsOutfit", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label className="font-black">特征</Label>
          <Textarea
            rows={3}
            value={draft.cdsTraits}
            onChange={(e) => updateDraft("cdsTraits", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label className="font-black">风格</Label>
          <Textarea
            rows={3}
            value={draft.cdsStyle}
            onChange={(e) => updateDraft("cdsStyle", e.target.value)}
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        {character.cdsImageId ? (
          <ImageGalleryThumb
            items={galleryItems}
            assetId={character.cdsImageId}
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
            onClick={() => onRender(character.id, draft)}
            disabled={!!renderJob || savingRenderId !== null}
          >
            {savingRenderId === character.id
              ? "保存中…"
              : renderJob?.charId === character.id && jobStatus === "running"
                ? "生成中…"
                : character.cdsImageId
                  ? "重新生成参考图"
                  : "生成参考图"}
          </Button>
          <Button
            size="sm"
            variant={character.confirmed ? "default" : "outline"}
            onClick={() => onConfirm(!character.confirmed)}
            disabled={!character.cdsImageId}
          >
            {character.confirmed ? "已确认" : "确认"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
