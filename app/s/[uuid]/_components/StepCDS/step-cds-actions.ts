export type CDSDraft = {
  cdsAppearance: string;
  cdsOutfit: string;
  cdsTraits: string;
  cdsStyle: string;
};

export type CharacterCDSState = CDSDraft & {
  id: string;
  cdsImageId?: string | null;
};

export type CharacterProfileDraft = {
  name: string;
  userInput: string;
  userImageId?: string | null;
  preserveWorkflow?: boolean;
};

export function hasCompleteCDSDraft(draft: CDSDraft): boolean {
  return [
    draft.cdsAppearance,
    draft.cdsOutfit,
    draft.cdsTraits,
    draft.cdsStyle,
  ].every((value) => value.trim().length > 0);
}

export function getCharactersNeedingCDSImage<T extends CharacterCDSState>(
  characters: T[],
): T[] {
  return characters.filter((character) => {
    return !character.cdsImageId && hasCompleteCDSDraft(character);
  });
}

export async function saveAndRenderCharacter({
  characterId,
  draft,
  patchCharacter,
  renderCharacter,
}: {
  characterId: string;
  draft: CDSDraft;
  patchCharacter: (characterId: string, body: CDSDraft) => Promise<unknown>;
  renderCharacter: (characterId: string) => Promise<{ jobId: string }>;
}): Promise<{ jobId: string }> {
  await patchCharacter(characterId, draft);
  return renderCharacter(characterId);
}

export async function saveCharacterProfile({
  characterId,
  profile,
  patchCharacter,
}: {
  characterId: string;
  profile: CharacterProfileDraft;
  patchCharacter: (characterId: string, body: CharacterProfileDraft) => Promise<unknown>;
}): Promise<void> {
  await patchCharacter(characterId, profile);
}

export async function startBatchRenderCharacters<T extends CharacterCDSState>({
  characters,
  drafts,
  patchCharacter,
  renderCharacter,
}: {
  characters: T[];
  drafts?: Record<string, CDSDraft>;
  patchCharacter?: (characterId: string, body: CDSDraft) => Promise<unknown>;
  renderCharacter: (characterId: string) => Promise<{ jobId: string }>;
}): Promise<{ characterId: string; jobId: string }[]> {
  const targets = getCharactersNeedingCDSImage(
    characters.map((character) => ({
      ...character,
      ...(drafts?.[character.id] ?? {}),
    })),
  );
  return Promise.all(
    targets.map(async (character) => {
      const draft = drafts?.[character.id];
      // 如果提示词有修改，先保存
      if (draft && patchCharacter) {
        await patchCharacter(character.id, draft);
      }
      // 生成并渲染角色参考图（仅返回job_id）
      const result = await renderCharacter(character.id);
      return { characterId: character.id, jobId: result.jobId };
    }),
  );
}
