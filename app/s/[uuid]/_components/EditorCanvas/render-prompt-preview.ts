export interface PromptPreviewStory {
  artStylePrompt: string;
}

export interface PromptPreviewNode {
  characters: string;
  imagePrompt: string;
}

export interface PromptPreviewCharacter {
  id: string;
  name: string;
  cdsAppearance: string;
  cdsOutfit: string;
  cdsTraits: string;
  cdsStyle: string;
  cdsImageId: string | null;
}

export interface RenderPromptPreview {
  artStylePrompt: string;
  characterPrompt: string;
  imagePrompt: string;
  finalPrompt: string;
  references: { id: string; name: string; cdsImageId: string | null }[];
}

function parseCharacterIds(value: string): string[] {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export function buildRenderPromptPreview({
  story,
  node,
  characters,
}: {
  story: PromptPreviewStory;
  node: PromptPreviewNode;
  characters: PromptPreviewCharacter[];
}): RenderPromptPreview {
  const characterIds = parseCharacterIds(node.characters);
  const characterRows = characterIds
    .map((id) => characters.find((character) => character.id === id))
    .filter((character): character is PromptPreviewCharacter => Boolean(character));

  const characterPrompt = characterRows
    .map(
      (character) =>
        `${character.name}: ${[
          character.cdsAppearance,
          character.cdsOutfit,
          character.cdsTraits,
          character.cdsStyle,
        ]
          .filter(Boolean)
          .join(", ")}`,
    )
    .join(" | ");

  return {
    artStylePrompt: story.artStylePrompt,
    characterPrompt,
    imagePrompt: node.imagePrompt,
    finalPrompt: [story.artStylePrompt, characterPrompt, node.imagePrompt].filter(Boolean).join("\n\n"),
    references: characterRows.map((character) => ({
      id: character.id,
      name: character.name,
      cdsImageId: character.cdsImageId,
    })),
  };
}
