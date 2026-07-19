# Phase 2 Sub-project: Notes — Design

## Goal

Replace the "Coming Soon" placeholder at `#/notes` with a working Notes page: a freestanding personal scratchpad (title + body), with add/edit/delete, backed by localStorage. Not tied to any lesson/unit content — no lesson data exists yet (Phase 5). Second of several independent Phase 2 sub-projects (after Settings).

## Architecture

New route module `js/modules/notes/notes.js`, following the established `mount(container, meta)`/`unmount()` contract every other view module implements. `js/router.js`'s existing `notes` route table entry is updated: `load` changes from `() => import("./modules/coming-soon/coming-soon.js")` to `() => import("./modules/notes/notes.js")`, and its `meta` key is removed (matching how the Settings route was wired in the prior sub-project).

A new `js/storage/notes-store.js` module holds notes as an array (unlike every existing store, which holds a single object) — `[{ id, title, body, createdAt, updatedAt }, ...]`. `id` is generated via `crypto.randomUUID()` (native, no dependency, available in all evergreen browsers this project targets). The module follows the identical try/catch + default-fallback (`[]`) pattern established by `theme-store.js`/`progress-store.js`/`settings-store.js`, with the same "malformed-but-valid-JSON" hardening already applied to `sidebar.js`'s `nav.json` handling in Phase 1 (if the parsed value isn't an array, fall back to `[]` rather than throwing downstream).

## Components

**Add form** (top of page, inside a `.panel`, reusing Phase 1's panel styling): a title text input and a body `<textarea>`, with an "Add Note" submit button. Title is required (non-empty after trim); body may be empty. On submit: creates a note via the store (`createdAt`/`updatedAt` both set to `Date.now()`), clears the form, re-renders the list.

**Notes list**: cards below the form, sorted newest-first by `createdAt`. Each card shows the title, the body (rendered with `white-space: pre-wrap` to preserve line breaks — via `textContent`, not `innerHTML`, so no formatting/XSS risk), a plain date (e.g. `Jul 19, 2026`, no relative-time library needed), and Edit/Delete buttons.

**Edit-in-place**: clicking Edit swaps that card's static content for the same title-input/textarea pair, pre-filled with the note's current values, plus Save/Cancel buttons — no modal, no separate route, matching the already-decided inline UX. Save updates the note's `title`/`body`/`updatedAt` via the store and re-renders; Cancel discards the in-progress edit and re-renders the original.

**Delete**: a Delete button per card, gated behind a native `confirm()` dialog — same pattern as the Settings sub-project's "Reset Progress" action, for consistency.

**Empty state**: when `getNotes()` returns an empty array, the list area renders a simple message ("No notes yet — write your first one above") instead of rendering nothing.

## Data Flow / State

`notes.js`'s `mount(container)` reads all notes once via `getNotes()` inside an internal `render()` function that draws the entire page (form + list) from scratch. Every mutation (add, save-edit, delete) calls the relevant store function and then re-invokes the same `render()` to redraw everything — consistent with the "just redraw on state change" simplicity already used by `dashboard.js` and `settings.js` (no partial-DOM-patching/diffing system exists or is introduced here). Given notes are a low-frequency-interaction list (not a per-keystroke-updated view), full redraw is not a performance concern at this scale.

## Error Handling

`notes-store.js` follows the identical defensive pattern as every other store: `try/catch` around all `localStorage` reads/writes, falling back to `[]` on missing/corrupted/non-array data. The add-form's title validation (non-empty after trim) happens client-side before ever calling the store — the store itself doesn't validate note shape beyond what's needed to keep `Array.prototype` methods (`map`/`filter`/`sort`) from throwing on malformed data.

## Testing

No test framework (consistent with the rest of the project). Verification is manual: add a note, confirm it appears at the top of the list; edit it in place, confirm changes save and Cancel correctly discards; delete a note with the confirm dialog; reload the page and confirm all notes persisted; delete all notes and confirm the empty-state message appears.

## Out of Scope (this sub-project)

- Any linking between notes and lessons/units (no lesson content exists yet — Phase 5).
- Search/filter within notes (that's the separate "Search" Phase 2 sub-project, and per the earlier sequencing discussion it's saved for last since there's no lesson content for it to search yet either).
- Rich text / markdown formatting in note bodies (plain text only).
- The remaining Phase 2 sub-projects (Bookmarks, Achievements, Flashcards, Search) — each gets its own spec.
