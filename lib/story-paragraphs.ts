export function splitStoryParagraphs(text: string): string[] {
  return text
    .replace(/\r\n/g, "\n")
    .split(/\n\s*(?:-{3,}|_{3,}|\*{3,})\s*\n|\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export function storyTextFromParagraphs(paragraphs: string[]): string {
  return paragraphs.map((paragraph) => paragraph.trim()).filter(Boolean).join("\n\n");
}
