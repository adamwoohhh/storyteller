# Storyteller Q Chibi UI Redesign

## Scope

Redesign the visible Storyteller application UI in a light, cheerful, Q-style anime direction while preserving current behavior.

The project currently has two page routes:

- `/`: story creation entry page.
- `/s/[uuid]`: story workflow page, with step views for story text, character extraction, storyboard, art style, character design sheets, rendering, editor canvas, and read mode.

API routes and pipeline logic are out of scope except where visual state text needs to remain compatible.

## Visual Direction

Use the approved "more anime, more cute" direction:

- Warm off-white page backgrounds with generous empty space.
- Kindsight-inspired maroon and earthy green as primary colors.
- Peach, butter, and soft cream accents for a friendly picture-book tone.
- Rounded sticker-like panels, subtle thick borders, soft shadows, and playful status chips.
- Q-style character energy without adding heavy illustration assets in this pass.

The UI should feel like a cute story-making desk: centered, calm, friendly, and clearly usable.

## Page Layout

### Home Page

The home page becomes a centered creation card inside a spacious illustrated-feeling background.

It includes:

- A compact brand mark area for `Storyteller`.
- A large friendly headline in Chinese.
- A short supporting line about turning ideas into illustrated stories.
- Centered tabs for structured input and pasted story input.
- Form controls restyled with warm surfaces, rounded borders, and clear focus states.
- A prominent maroon primary button with a soft pressed/shadow treatment.

The page should not become a marketing landing page. The first screen remains the actual creation experience.

### Workflow Steps

All step components under `/s/[uuid]` use a shared centered page shell style:

- Max-width content container.
- Warm background with decorative but non-obstructive soft shapes created in CSS.
- A top title block that names the step and gives concise guidance.
- A small centered step trail/chip row where useful.
- Main content inside one prominent sticker-like panel or repeated child cards.
- Primary actions aligned clearly at the bottom right or centered on narrow screens.

Covered steps:

- Story text generation and editing.
- Character extraction and confirmation.
- Storyboard editing.
- Art style selection.
- Character Design Sheet editing.
- Render progress.

### Read Mode

Read mode keeps the existing vertical story format, but restyles it as a centered picture-book reader:

- Sticky header with warm translucent background.
- Centered title.
- Image panels with soft borders and shadow.
- Text blocks centered with comfortable line height and readable width.
- Empty image states use a cute placeholder surface.

### Editor Canvas

The React Flow editor remains full-height for usability, but receives the same visual language:

- Warm canvas background.
- Centered, rounded header bar with story title and read-mode action.
- Story nodes restyled as Q-style story cards with rounded image areas, warm borders, and playful empty/loading states.
- Edge styling adjusted to a softer brown/green palette.

## Components And Theme

Global CSS will define the app palette and utility classes for this redesign:

- Background: warm cream.
- Foreground: deep brown.
- Primary: Kindsight-like warm maroon.
- Secondary/accent: earthy green and peach.
- Muted surfaces: butter/cream.
- Border and ring colors tuned for accessibility.

Shared shadcn/base UI components should be lightly restyled where useful:

- `Button`: more rounded, stronger primary treatment, playful shadow for default actions.
- `Input` and `Textarea`: warm filled surfaces, thicker focus ring, comfortable padding.
- `Card`: warm surface, soft border, restrained shadow.
- `Tabs`: pill-like segmented controls.

Avoid introducing a new component library.

## Assets

No generated raster assets are required for this pass. The Q-style feel will come from CSS shapes, palette, spacing, rounded forms, and card treatments.

If future polish is desired, small mascot or sticker assets can be added later, but they are out of scope for this implementation.

## Interaction And States

Existing behavior remains unchanged:

- Story creation still routes to the correct first step.
- Streaming story text keeps its live text and pulse cursor.
- Job running, error, empty, confirmed, and disabled states remain visible.
- File upload for character references remains available.
- React Flow node dragging and regeneration still work.

All button labels and Chinese UI copy remain concise. Copy can be lightly rewritten for tone, but should not change workflows.

## Accessibility And Responsiveness

The redesign must:

- Preserve keyboard focus visibility.
- Keep text readable against warm backgrounds.
- Use responsive layouts for narrow screens.
- Avoid text overlap in buttons, cards, and step headers.
- Keep form controls large enough for comfortable use.

## Verification

After implementation:

- Run typecheck and lint if available.
- Start the local Next dev server.
- Use browser verification for `/`.
- If local data is available, inspect `/s/[uuid]` states; otherwise rely on component-level visual review and type safety.
- Check both desktop and mobile widths for layout overflow.
