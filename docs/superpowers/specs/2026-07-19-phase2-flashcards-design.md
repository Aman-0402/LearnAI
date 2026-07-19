# Phase 2 Sub-project: Flashcards — Design

## Goal

Replace the "Coming Soon" placeholder at `#/flashcards` with a working Flashcards page: freestanding user-created front/back cards, click-to-flip review, add/delete, backed by localStorage. Not tied to any lesson/unit content — no lesson data exists yet (Phase 5). Fifth Phase 2 sub-project (after Settings, Notes, Bookmarks, Achievements).

## Architecture

New route module `js/modules/flashcards/flashcards.js`, following the established `mount(container)`/`unmount()` contract. `js/router.js`'s `flashcards` route table entry is updated the same way as prior sub-projects: `load` changes to `() => import("./modules/flashcards/flashcards.js")`, `meta` key removed.

A new `js/storage/flashcards-store.js` module holds cards as an array — `[{ id, front, back, createdAt }, ...]` — following the identical try/catch + array-fallback pattern established by `notes-store.js`/`bookmarks-store.js`.

## Components

**Add form** (top of page, inside a `.panel`): a "Front" text input and a "Back" text input, both required (non-empty after trim), with an "Add Card" submit button. On submit: creates the card via the store (`createdAt: Date.now()`), clears the form, re-renders.

**Card grid**: cards below the form, sorted newest-first by `createdAt`. Each card starts showing only its **front** text. Clicking anywhere on the card body flips it to show the **back** text instead (pure per-card UI toggle, not persisted — every fresh render/mount starts all cards front-side-up). A small "Front"/"Back" label indicates which side is showing. A Delete button (separate from the flip click target, e.g. positioned so clicking it doesn't also trigger a flip) is gated by native `confirm()`.

**Empty state**: when `getFlashcards()` returns an empty array, the grid area renders "No flashcards yet — add your first one above." instead of rendering nothing.

No edit action — fixing a card is delete-and-re-add, consistent with the Bookmarks precedent (simpler than Notes' edit-in-place, appropriate for short front/back text).

## Data Flow / State

`flashcards.js`'s `mount(container)` reads all cards once via `getFlashcards()` inside an internal `render()` function that draws the entire page (form + grid) from scratch, matching every other Phase 2 view module's full-redraw approach. Per-card flip state is **not** module-level global state (that would flip all cards together) — instead, a module-level `Set` of currently-flipped card ids (`flippedIds`) is toggled on click and read during `renderCard` to decide front/back. This `Set` is cleared in `mount`/`unmount`, so navigating away and back always resets every card to front-side-up. Add/Delete call the relevant store function then re-invoke `render()`; a flip only mutates `flippedIds` then re-invokes `render()` (no store interaction, since flip state isn't persisted).

## Error Handling

`flashcards-store.js` follows the identical defensive pattern as every other store: `try/catch` around all `localStorage` reads/writes, falling back to `[]` on missing/corrupted/non-array data. Front/back validation (non-empty after trim) happens client-side in `flashcards.js` before calling the store.

## Testing

No test framework (consistent with the rest of the project). Verification is manual: add a card, confirm it appears front-side-up at the top of the grid; click it, confirm it flips to show the back; click again, confirm it flips back to front; delete a card with the confirm dialog (confirm clicking Delete does not also trigger a flip); reload the page and confirm all cards persisted and reset to front-side-up; delete all cards and confirm the empty-state message appears.

## Out of Scope (this sub-project)

- Any linking between flashcards and lessons/units (no lesson content exists yet — Phase 5).
- Spaced-repetition scheduling, difficulty rating, or study-session tracking (no progress data model exists for this; out of scope).
- Edit-in-place (delete-and-re-add covers the same need with less code, consistent with the Bookmarks precedent).
- Shuffling/randomized study order (cards render in a fixed newest-first order; a "shuffle" control could be added later but isn't required now).
- The remaining Phase 2 sub-projects (Search, Progress) — each gets its own spec.
