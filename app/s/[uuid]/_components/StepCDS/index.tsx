"use client";
import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/client/api";
import { useJob } from "@/lib/client/useJob";
import { StepFrame } from "../StepFrame";
import { buildStoryGalleryItems, ImageGalleryThumb } from "../image-gallery";
import {
  type CDSDraft,
  getCharactersNeedingCDSImage,
  hasCompleteCDSDraft,
  saveAndRenderCharacter,
  startBatchRenderCharacters,
} from "./step-cds-actions";

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
  const [renderJobs, setRenderJobs] = useState<Record<string, string>>({});
  const [savingRenderId, setSavingRenderId] = useState<string | null>(null);
  const [batchSaving, setBatchSaving] = useState(false);
  const [draftEdits, setDraftEdits] = useState<Record<string, CDSDraft>>({});
  const galleryItems = buildStoryGalleryItems(data);
  const characters = data.characters as Any[];
  const drafts = Object.fromEntries(
    characters.map((character) => [
      character.id,
      draftEdits[character.id] ?? toCDSDraft(character),
    ]),
  ) as Record<string, CDSDraft>;
  const hasMissingCDSPrompt =
    characters.length > 0 && characters.some((c) => !hasCompleteCDSDraft(c));
  const isCDSTextLoading = data.story.status === "style_done" || hasMissingCDSPrompt;
  const batchTargets = getCharactersNeedingCDSImage(
    characters.map((c) => ({ ...c, ...(drafts[c.id] ?? {}) })),
  );
  const hasActiveRender = Object.keys(renderJobs).length > 0 || savingRenderId !== null;

  useEffect(() => {
    if (!isCDSTextLoading) return;
    const timer = window.setInterval(() => {
      reload().catch(() => {});
    }, 2000);
    return () => window.clearInterval(timer);
  }, [isCDSTextLoading, reload]);

  const markRenderDone = useCallback(async (characterId: string) => {
    setRenderJobs((current) => {
      const next = { ...current };
      delete next[characterId];
      return next;
    });
    await api.patchCharacter(characterId, { confirmed: true });
    await reload();
  }, [reload]);

  async function startBatchRender() {
    setBatchSaving(true);
    try {
      const jobs = await startBatchRenderCharacters({
        characters,
        drafts,
        patchCharacter: api.patchCharacter,
        renderCharacter: api.renderCharacter,
      });
      setRenderJobs((current) => {
        const next = { ...current };
        for (const item of jobs) {
          next[item.characterId] = item.jobId;
        }
        return next;
      });
      await reload();
    } finally {
      setBatchSaving(false);
    }
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
      setRenderJobs((current) => ({ ...current, [id]: r.jobId }));
    } finally {
      setSavingRenderId(null);
    }
  }

  const allConfirmed =
    characters.length > 0 && characters.every((c) => c.confirmed || c.cdsImageId);

  return (
    <StepFrame
      title="角色设计卡"
      description="确认角色提示词后批量生成参考图；生成完成会自动采纳，也可以编辑提示词后重新生成。"
      currentStep="cds"
    >
      {Object.entries(renderJobs).map(([characterId, jobId]) => (
        <RenderJobWatcher
          key={`${characterId}-${jobId}`}
          characterId={characterId}
          jobId={jobId}
          onDone={markRenderDone}
        />
      ))}
      <div className="space-y-5">
        {characters.map((c: Any) => (
          <CharacterCDSCard
            key={c.id}
            character={c}
            draft={drafts[c.id] ?? toCDSDraft(c)}
            cdsTextLoading={isCDSTextLoading || !hasCompleteCDSDraft(drafts[c.id] ?? toCDSDraft(c))}
            galleryItems={galleryItems}
            renderJobId={renderJobs[c.id] ?? null}
            savingRenderId={savingRenderId}
            hasActiveRender={hasActiveRender || batchSaving}
            onDraftChange={(draft) =>
              setDraftEdits((current) => ({ ...current, [c.id]: draft }))
            }
            onRender={render}
          />
        ))}
      </div>
      <div className="mt-6 flex justify-end">
        {batchTargets.length > 0 ? (
          <Button
            onClick={startBatchRender}
            disabled={isCDSTextLoading || hasActiveRender || batchSaving}
          >
            {batchSaving || hasActiveRender
              ? "角色图生成中…"
              : `确认提示词并批量生成角色图（${batchTargets.length}）`}
          </Button>
        ) : (
          <Button onClick={onNext} disabled={!allConfirmed || isCDSTextLoading || hasActiveRender}>
            {isCDSTextLoading ? "角色提示词生成中…" : "开始生成插图"}
          </Button>
        )}
      </div>
    </StepFrame>
  );
}

function toCDSDraft(character: Any): CDSDraft {
  return {
    cdsAppearance: character.cdsAppearance ?? "",
    cdsOutfit: character.cdsOutfit ?? "",
    cdsTraits: character.cdsTraits ?? "",
    cdsStyle: character.cdsStyle ?? "",
  };
}

function RenderJobWatcher({
  characterId,
  jobId,
  onDone,
}: {
  characterId: string;
  jobId: string;
  onDone: (characterId: string) => Promise<void>;
}) {
  const job = useJob(jobId);

  useEffect(() => {
    if (job.status !== "done") return;
    onDone(characterId).catch(() => {});
  }, [characterId, job.status, onDone]);

  return null;
}

function CharacterCDSCard({
  character,
  draft,
  cdsTextLoading,
  galleryItems,
  renderJobId,
  savingRenderId,
  hasActiveRender,
  onDraftChange,
  onRender,
}: {
  character: Any;
  draft: CDSDraft;
  cdsTextLoading: boolean;
  galleryItems: ReturnType<typeof buildStoryGalleryItems>;
  renderJobId: string | null;
  savingRenderId: string | null;
  hasActiveRender: boolean;
  onDraftChange: (draft: CDSDraft) => void;
  onRender: (id: string, draft: CDSDraft) => Promise<void>;
}) {
  function updateDraft(field: keyof CDSDraft, value: string) {
    onDraftChange({ ...draft, [field]: value });
  }

  const isRendering = renderJobId !== null;

  return (
    <Card className="space-y-4 bg-[#fff8e8] p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-lg font-black">{character.name}</div>
        {character.cdsImageId && <span className="story-chip-active story-chip">已采纳</span>}
      </div>
      {cdsTextLoading ? (
        <div className="grid gap-3 md:grid-cols-2">
          {["外貌", "服饰", "特征", "风格"].map((label) => (
            <div key={label} className="space-y-2">
              <Label className="font-black">{label}</Label>
              <div className="flex h-[86px] items-center rounded-md border border-[#5a3029]/20 bg-white/70 px-3 text-sm font-black text-muted-foreground">
                角色提示词生成中…
              </div>
            </div>
          ))}
        </div>
      ) : (
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
      )}
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
            {isRendering ? "生成中…" : "未生成"}
          </div>
        )}
        <div className="flex flex-col gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onRender(character.id, draft)}
            disabled={cdsTextLoading || hasActiveRender || !hasCompleteCDSDraft(draft)}
          >
            {savingRenderId === character.id
              ? "保存中…"
              : isRendering
                ? "生成中…"
                : character.cdsImageId
                  ? "重新生成参考图"
                  : "生成参考图"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
