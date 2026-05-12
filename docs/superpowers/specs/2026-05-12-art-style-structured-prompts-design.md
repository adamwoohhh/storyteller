# Art Style Structured Prompts Design

## Goal

The art style selection step should support richer preset styles without changing the downstream generation pipeline. A preset can include a structured prompt and a preview image so users can understand the visual direction quickly before confirming the style.

## Scope

- Add first-class style metadata for structured prompt lines.
- Add first-class style metadata for a selection-page preview image.
- Keep preview images display-only. They are not sent to text or image providers.
- Keep the existing story fields: `artStyleKey` and `artStylePrompt`.
- Keep custom style behavior as a text-only prompt supplied by the user.

## Data Model

`ArtStyle` will support:

- `id`: stable style identifier.
- `name`: display name.
- `prompt`: optional free-form prompt string.
- `structuredPrompt`: optional ordered prompt lines.
- `previewImage`: optional public image path for the selector UI.

The existing misspelled `structed_prompt` shape should be replaced with `structuredPrompt`, and `ref` should be replaced with `previewImage`.

## Prompt Resolution

`resolveArtStylePrompt(id, userAddition)` produces the stored `artStylePrompt`.

- For `custom`, return the trimmed user addition.
- For styles with `structuredPrompt`, join the structured lines with newlines.
- For styles with only `prompt`, use that prompt.
- Append the trimmed user addition after the base prompt when both are present.
- Return the base prompt when there is no user addition.

## UI

Use the gallery-first layout selected during review:

- Keep the existing responsive grid of selectable style cards.
- Show the preview image at the top of a card when `previewImage` exists.
- Show the style name and a short prompt summary below the image.
- For structured styles, derive the summary from the first few structured lines.
- Preserve the optional custom addition textarea.
- Preserve the final prompt preview card so users can inspect the exact prompt before confirming.

The selector remains a fast visual choice. No separate detail panel is required for this iteration.

## Error Handling

- Missing preview images should degrade to a text-only card; saving must still work.
- Styles with neither `prompt` nor `structuredPrompt` produce an empty base prompt, which is valid only when the user adds custom text or the style is `custom`.

## Testing

- Unit tests for prompt resolution with structured prompt lines.
- Unit tests for style metadata using stable field names.
- Component/render-oriented tests can continue to focus on existing UI helpers unless a suitable selector test already exists.

