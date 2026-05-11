export type CDSDraft = {
  cdsAppearance: string;
  cdsOutfit: string;
  cdsTraits: string;
  cdsStyle: string;
};

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
