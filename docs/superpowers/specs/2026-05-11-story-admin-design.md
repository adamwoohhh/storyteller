# Story Admin Design

## Goal

Add a small internal management page for story-level inspection and logical deletion.

## Scope

This change adds `/admin/stories`, where an operator can see existing non-deleted stories, open a story editor/read flow, and logically delete a story. Logical deletion means the story row and all related rows remain in the database; deleted stories are hidden from the default admin list and are not accessible through the normal story page/API read path.

Out of scope for this iteration:

- Restoring deleted stories
- Viewing deleted stories in a separate filter
- Batch actions
- Authentication or role-based permissions
- Physically deleting database records or uploaded files

## Data Model

Add `deletedAt` to `stories`.

- Type: nullable integer unix timestamp
- Default: `null`
- Meaning: `null` is active, non-null is logically deleted

No cascade deletion should be triggered by the admin delete action. Existing related `characters`, `nodes`, `assets`, and `jobs` rows must remain untouched.

## Backend

Extend story APIs as follows:

- `GET /api/stories` returns active stories only, sorted by `updatedAt` descending.
- `GET /api/stories/[id]` returns 404 for missing or logically deleted stories.
- `DELETE /api/stories/[id]` sets `deletedAt` and `updatedAt` to the current unix timestamp.

The delete endpoint is idempotent enough for UI use: deleting an already deleted story should still return `{ ok: true }` if the story row exists. Missing stories return 404.

## Admin UI

Create `/admin/stories`.

The page displays:

- Story title, falling back to "未命名故事"
- Status
- Input mode
- Character count
- Node count
- Created time
- Updated time

Actions:

- "查看" opens `/s/{id}`
- "删除" opens a confirmation dialog
- Confirming delete calls the API, shows success or error feedback, and refreshes the list

Empty state:

- If there are no active stories, show a concise empty state and a link back to `/`.

## Error Handling

- Failed list loading should surface a simple error state.
- Failed deletion should leave the row visible and show a toast error.
- Deleted stories should not be editable from `/s/{id}`.

## Testing

Use TDD.

Backend tests should verify:

- Active stories are listed.
- Logically deleted stories are hidden from the list.
- Deleting a story sets `deletedAt` and does not remove related rows.
- Fetching a logically deleted story returns 404.

Frontend coverage should verify the admin page renders story rows and the expected action links/buttons from representative data. If component-level test setup is too costly for this app, keep the UI thin and rely on API tests plus typecheck/build verification.
