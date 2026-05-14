"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/client/api";
import { useJob } from "@/lib/client/useJob";
import { toast } from "sonner";
import { StepFrame } from "../StepFrame";
import { buildStoryGalleryItems, ImageGalleryThumb } from "../image-gallery";
import {
  type CharacterProfileDraft,
  type CDSDraft,
  getCharactersNeedingCDSImage,
  hasCompleteCDSDraft,
  saveCharacterProfile,
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
  const [profileEdits, setProfileEdits] = useState<Record<string, CharacterProfileDraft>>({});
  const [extractJobId, setExtractJobId] = useState<string | null>(null);
  const [cdsTextJobId, setCdsTextJobId] = useState<string | null>(null);
  const [savingProfileId, setSavingProfileId] = useState<string | null>(null);
  const extractJob = useJob(extractJobId);
  const cdsTextJob = useJob(cdsTextJobId);
  const galleryItems = buildStoryGalleryItems(data);
  const characters = data.characters as Any[];
  const drafts = Object.fromEntries(
    characters.map((character) => [
      character.id,
      draftEdits[character.id] ?? toCDSDraft(character),
    ]),
  ) as Record<string, CDSDraft>;
  const profiles = Object.fromEntries(
    characters.map((character) => [
      character.id,
      profileEdits[character.id] ?? toProfileDraft(character),
    ]),
  ) as Record<string, CharacterProfileDraft>;
  const hasMissingCDSPrompt =
    characters.length > 0 && characters.some((c) => !hasCompleteCDSDraft(c));
  const isExtractingCharacters = extractJobId !== null && extractJob.status !== "error";
  const isCDSTextLoading =
    data.story.status === "style_done" || cdsTextJobId !== null || hasMissingCDSPrompt;
  const batchTargets = getCharactersNeedingCDSImage(
    characters.map((c) => ({ ...c, ...(drafts[c.id] ?? {}) })),
  );
  const hasActiveRender = Object.keys(renderJobs).length > 0 || savingRenderId !== null;

  useEffect(() => {
    if (!isCDSTextLoading && !isExtractingCharacters) return;
    const timer = window.setInterval(() => {
      reload().catch(() => {});
    }, 2000);
    return () => window.clearInterval(timer);
  }, [isCDSTextLoading, isExtractingCharacters, reload]);

  useEffect(() => {
    if (characters.length > 0 || extractJobId !== null || data.story.inputMode !== "paste") return;
    api
      .extractCharacters(data.story.id)
      .then((result) => setExtractJobId(result.jobId))
      .catch((error: Error) => toast.error(error.message));
  }, [characters.length, data.story.id, data.story.inputMode, extractJobId]);

  useEffect(() => {
    if (!extractJobId) return;
    if (extractJob.status === "done") {
      reload().finally(() => setExtractJobId(null));
    }
    if (extractJob.status === "error") {
      toast.error(extractJob.error ?? "角色提取失败，请稍后重试");
      queueMicrotask(() => setExtractJobId(null));
    }
  }, [extractJob.error, extractJob.status, extractJobId, reload]);

  useEffect(() => {
    if (
      cdsTextJobId !== null ||
      data.story.status !== "cds_done" ||
      characters.length === 0 ||
      !hasMissingCDSPrompt ||
      !data.story.artStylePrompt
    ) {
      return;
    }
    api
      .cds(data.story.id, {
        artStyleKey: data.story.artStyleKey || "custom",
        artStylePrompt: data.story.artStylePrompt,
      })
      .then((result) => setCdsTextJobId(result.jobId))
      .catch((error: Error) => toast.error(error.message));
  }, [
    cdsTextJobId,
    characters.length,
    data.story.artStyleKey,
    data.story.artStylePrompt,
    data.story.id,
    data.story.status,
    hasMissingCDSPrompt,
  ]);

  useEffect(() => {
    if (!cdsTextJobId) return;
    if (cdsTextJob.status === "done") {
      reload().finally(() => setCdsTextJobId(null));
    }
    if (cdsTextJob.status === "error") {
      toast.error(cdsTextJob.error ?? "角色提示词生成失败，请稍后重试");
      queueMicrotask(() => setCdsTextJobId(null));
    }
  }, [cdsTextJob.error, cdsTextJob.status, cdsTextJobId, reload]);

  const markRenderDone = useCallback(async (characterId: string) => {
    setRenderJobs((current) => {
      const next = { ...current };
      delete next[characterId];
      return next;
    });
    await api.patchCharacter(characterId, { confirmed: true });
    await reload();
  }, [reload]);

  const markRenderError = useCallback((characterId: string, error?: string) => {
    setRenderJobs((current) => {
      const next = { ...current };
      delete next[characterId];
      return next;
    });
    toast.error(error ?? "角色参考图生成失败，请稍后重试");
  }, []);

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

  async function saveProfile(id: string, profile: CharacterProfileDraft) {
    setSavingProfileId(id);
    try {
      await saveCharacterProfile({
        characterId: id,
        profile: { ...profile, preserveWorkflow: true },
        patchCharacter: api.patchCharacter,
      });
      setDraftEdits((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
      await reload();
    } finally {
      setSavingProfileId(null);
    }
  }

  async function uploadRef(id: string, profile: CharacterProfileDraft, file: File) {
    const { assetId } = await api.uploadFile(data.story.id, file);
    await saveProfile(id, { ...profile, userImageId: assetId });
  }

  const allConfirmed =
    characters.length > 0 && characters.every((c) => c.confirmed || c.cdsImageId);

  return (
    <StepFrame
      title="角色图"
      description="在这里确认角色信息、编辑角色提示词，并生成每个角色的参考图。"
      currentStep="cds"
    >
      {isExtractingCharacters && (
        <div className="mb-4 rounded-full bg-secondary px-4 py-2 text-center text-sm font-black">
          正在提取角色…
        </div>
      )}
      {characters.length === 0 && !isExtractingCharacters && (
        <Card className="bg-[#fff8e8] p-4 text-center text-sm font-black text-muted-foreground">
          还没有角色。可以回到故事输入里补充角色，或粘贴完整故事后自动提取。
        </Card>
      )}
      <div className="space-y-5">
        {characters.map((c: Any) => (
          <CharacterCDSCard
            key={c.id}
            character={c}
            profile={profiles[c.id] ?? toProfileDraft(c)}
            draft={drafts[c.id] ?? toCDSDraft(c)}
            cdsTextLoading={isCDSTextLoading || !hasCompleteCDSDraft(drafts[c.id] ?? toCDSDraft(c))}
            galleryItems={galleryItems}
            renderJobId={renderJobs[c.id] ?? null}
            savingProfileId={savingProfileId}
            savingRenderId={savingRenderId}
            hasActiveRender={hasActiveRender || batchSaving}
            onProfileChange={(profile) =>
              setProfileEdits((current) => ({ ...current, [c.id]: profile }))
            }
            onProfileSave={saveProfile}
            onRefUpload={uploadRef}
            onDraftChange={(draft) =>
              setDraftEdits((current) => ({ ...current, [c.id]: draft }))
            }
            onRender={render}
            onRenderDone={markRenderDone}
            onRenderError={markRenderError}
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

function toProfileDraft(character: Any): CharacterProfileDraft {
  return {
    name: character.name ?? "",
    userInput: character.userInput ?? "",
    userImageId: character.userImageId ?? null,
  };
}

function CharacterCDSCard({
  character,
  profile,
  draft,
  cdsTextLoading,
  galleryItems,
  renderJobId,
  savingProfileId,
  savingRenderId,
  hasActiveRender,
  onProfileChange,
  onProfileSave,
  onRefUpload,
  onDraftChange,
  onRender,
  onRenderDone,
  onRenderError,
}: {
  character: Any;
  profile: CharacterProfileDraft;
  draft: CDSDraft;
  cdsTextLoading: boolean;
  galleryItems: ReturnType<typeof buildStoryGalleryItems>;
  renderJobId: string | null;
  savingProfileId: string | null;
  savingRenderId: string | null;
  hasActiveRender: boolean;
  onProfileChange: (profile: CharacterProfileDraft) => void;
  onProfileSave: (id: string, profile: CharacterProfileDraft) => Promise<void>;
  onRefUpload: (id: string, profile: CharacterProfileDraft, file: File) => Promise<void>;
  onDraftChange: (draft: CDSDraft) => void;
  onRender: (id: string, draft: CDSDraft) => Promise<void>;
  onRenderDone: (characterId: string) => Promise<void>;
  onRenderError: (characterId: string, error?: string) => void;
}) {
  const job = useJob(renderJobId);
  const handledJobIdRef = useRef<string | null>(null);
  const reportedTransportIssueRef = useRef<string | null>(null);

  useEffect(() => {
    if (!renderJobId || handledJobIdRef.current === renderJobId) return;
    if (
      job.transportError &&
      reportedTransportIssueRef.current !== `${renderJobId}:${job.transportError}`
    ) {
      reportedTransportIssueRef.current = `${renderJobId}:${job.transportError}`;
      toast.error(job.transportError);
    }
    if (job.status === "done") {
      handledJobIdRef.current = renderJobId;
      onRenderDone(character.id).catch(() => {});
    }
    if (job.status === "error") {
      handledJobIdRef.current = renderJobId;
      onRenderError(character.id, job.error);
    }
  }, [
    character.id,
    job.error,
    job.status,
    job.transportError,
    onRenderDone,
    onRenderError,
    renderJobId,
  ]);

  function updateDraft(field: keyof CDSDraft, value: string) {
    onDraftChange({ ...draft, [field]: value });
  }

  function updateProfile(field: keyof CharacterProfileDraft, value: string | null) {
    onProfileChange({ ...profile, [field]: value });
  }

  const isRendering = renderJobId !== null && job.status !== "error";
  const profileChanged =
    profile.name !== (character.name ?? "") ||
    profile.userInput !== (character.userInput ?? "") ||
    profile.userImageId !== (character.userImageId ?? null);

  return (
    <Card className="space-y-4 bg-[#fff8e8] p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-lg font-black">{profile.name || "未命名角色"}</div>
        {character.cdsImageId && <span className="story-chip-active story-chip">已采纳</span>}
      </div>
      <div className="grid gap-3 md:grid-cols-[1fr_2fr]">
        <div className="space-y-2">
          <Label className="font-black">角色名</Label>
          <Input
            value={profile.name}
            onChange={(e) => updateProfile("name", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label className="font-black">角色描述</Label>
          <Textarea
            rows={2}
            value={profile.userInput}
            onChange={(e) => updateProfile("userInput", e.target.value)}
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="max-w-full text-sm text-muted-foreground file:mr-3 file:rounded-full file:border-0 file:bg-secondary file:px-3 file:py-2 file:font-black file:text-foreground"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onRefUpload(character.id, profile, file).catch((error: Error) => toast.error(error.message));
          }}
        />
        {profile.userImageId && (
          <ImageGalleryThumb
            items={galleryItems}
            assetId={profile.userImageId}
            alt=""
            className="h-14 w-14 rounded-2xl border-2 border-[#5a3029]/30 object-cover"
          />
        )}
        <Button
          size="sm"
          variant="secondary"
          onClick={() => onProfileSave(character.id, profile)}
          disabled={!profile.name.trim() || !profileChanged || savingProfileId === character.id}
        >
          {savingProfileId === character.id ? "保存中…" : "保存角色信息"}
        </Button>
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
