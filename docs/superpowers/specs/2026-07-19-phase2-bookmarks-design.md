# Phase 2 Sub-project: Bookmarks — Design

## Goal

Replace the "Coming Soon" placeholder at `#/bookmarks` with a working Bookmarks page: a freestanding personal link saver (title + URL + optional note), with add/delete, backed by localStorage. Not tied to any lesson/unit content — no lesson data exists yet (Phase 5). Third Phase 2 sub-project (after Settings, Notes).

## Architecture

New route module `js/modules/bookmarks/bookmarks.js`, following the established `mount(container, meta)`/`unmount()` contract every other view module implements. `js/router.js`'s existing `bookmarks` route table entry is updated: `load` changes from `() => import("./modules/coming-soon/coming-soon.js")` to `() => import("./modules/bookmarks/bookmarks.js")`, and its `meta` key is removed (matching how Settings and Notes were wired).

A new `js/storage/bookmarks-store.js` module holds bookmarks as an array — `[{ id, title, url, note, createdAt }, ...]` — following the identical try/catch + default-fallback (`[]`) pattern established by `notes-store.js`, including the same non-array-JSON hardening (fall back to `[]` rather than throwing downstream).

## Components

**Add form** (top of page, inside a `.panel`): a title text input, a URL text input, and an optional note `<textarea>`, with an "Add Bookmark" submit button. On submit:
- Title must be non-empty after trim.
- URL must be non-empty after trim and must parse via the `URL` constructor with `http:` or `https:` protocol. If validation fails, an inline error message is shown next to the URL field (`role="alert"`, e.g. "Enter a valid http(s) URL") and the bookmark is not saved — no silent drop, no auto-prefixing of a missing scheme.
- Note is optional, no length limit.
- On success: creates the bookmark via the store (`createdAt` set to `Date.now()`), clears the form and any error message, re-renders the list.

**Bookmarks list**: cards below the form, sorted newest-first by `createdAt`. Each card shows:
- Title rendered as a link (`<a href="{url}" target="_blank" rel="noopener noreferrer">`), text content only (no `innerHTML`).
- Note, if present, rendered below the title (`white-space: pre-wrap`, `textContent`).
- A plain date (e.g. `Jul 19, 2026`).
- A Delete button.

**Delete**: a Delete button per card, gated behind a native `confirm()` dialog — same pattern as Notes/Settings' destructive actions.

**Empty state**: when `getBookmarks()` returns an empty array, the list area renders "No bookmarks yet — save your first link above." instead of rendering nothing.

No edit action — fixing a bookmark is delete-and-re-add, consistent with the decision to keep this simpler than Notes.

## Data Flow / State

`bookmarks.js`'s `mount(container)` reads all bookmarks once via `getBookmarks()` inside an internal `render()` function that draws the entire page (form + list) from scratch. Every mutation (add, delete) calls the relevant store function and then re-invokes the same `render()` to redraw everything — consistent with the full-redraw approach already used by `dashboard.js`, `settings.js`, and `notes.js`. A local `urlError` variable (module-level, cleared on mount/successful add) holds the current inline validation message so it survives the redraw after a failed submit.

## Error Handling

`bookmarks-store.js` follows the identical defensive pattern as every other store: `try/catch` around all `localStorage` reads/writes, falling back to `[]` on missing/corrupted/non-array data. Title and URL validation happen client-side in `bookmarks.js` before ever calling the store — the store itself doesn't validate bookmark shape beyond what's needed to keep `Array.prototype` methods (`map`/`filter`/`sort`) from throwing on malformed data.

## Testing

No test framework (consistent with the rest of the project). Verification is manual: add a bookmark with a valid URL, confirm it appears at the top of the list as a working link; try an invalid URL (empty, no scheme, `javascript:`), confirm the inline error shows and nothing is saved; delete a bookmark with the confirm dialog; reload the page and confirm all bookmarks persisted; delete all bookmarks and confirm the empty-state message appears.

## Out of Scope (this sub-project)

- Any linking between bookmarks and lessons/units (no lesson content exists yet — Phase 5).
- Tags/categories or filtering (explicitly deferred per YAGNI — can be added later if the list grows unwieldy).
- Edit-in-place (delete-and-re-add covers the same need with less code).
- Search/filter within bookmarks (separate "Search" Phase 2 sub-project).
- The remaining Phase 2 sub-projects (Achievements, Flashcards, Search, Progress) — each gets its own spec.
