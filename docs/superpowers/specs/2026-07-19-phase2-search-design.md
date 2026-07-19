# Phase 2 Sub-project: Search — Design

## Goal

Replace the "Coming Soon" placeholder at `#/search` with a working Search page: a single search box that live-filters across all three existing freestanding content types — Notes, Bookmarks, and Flashcards — showing matching results grouped by type. Sixth and final Phase 2 sub-project. Deliberately sequenced last: the Notes design spec explicitly deferred Search until there was content worth searching (no lesson data exists yet — Phase 5 — so Search cannot target lesson content; it targets the three localStorage-backed content stores built earlier in Phase 2).

## Architecture

New route module `js/modules/search/search.js`, following the established `mount(container)`/`unmount()` contract. `js/router.js`'s `search` route table entry is updated the same way as prior sub-projects: `load` changes to `() => import("./modules/search/search.js")`, `meta` key removed.

**No new storage module.** Search is a read-only cross-cutting view over the three existing stores: `js/storage/notes-store.js` (`getNotes`), `js/storage/bookmarks-store.js` (`getBookmarks`), `js/storage/flashcards-store.js` (`getFlashcards`). It imports all three and queries them live on every keystroke — no caching, no indexing, appropriate given each store's list is expected to be small (personal-use localStorage data, not a large dataset).

## Components

**Search input**: a single text `<input type="search">` at the top of the page with a placeholder like "Search notes, bookmarks, flashcards...". Filtering is **live** (on `input` event, not requiring a submit) — this is a read-only query, not a mutation, so there is no confirm/submit step to gate.

**Results**: below the input, one section per content type that has at least one match (`.search__group`), each with a small heading ("Notes", "Bookmarks", "Flashcards") and a list of result cards for that type:
- **Note result**: title + a short plain-text snippet of the body (first ~100 chars, no highlighting/truncation-ellipsis logic beyond a simple `slice`).
- **Bookmark result**: title rendered as a link (`href`, `target="_blank"`, `rel="noopener noreferrer"`, same safe-link pattern as the Bookmarks page) + the note snippet if present.
- **Flashcard result**: front text + back text shown together (both sides visible in the search result — no flip interaction here, since search is about *finding* the card, not studying it).

A group is omitted entirely if it has zero matches for the current query (no empty "Notes (0)" headers cluttering the results).

**Empty query state**: when the search input is empty, show a neutral prompt ("Type to search your notes, bookmarks, and flashcards.") instead of listing everything unfiltered — avoids dumping the user's entire content library on page load.

**No-results state**: when the query is non-empty but every group has zero matches, show "No results for '<query>'".

## Matching Logic

Case-insensitive substring match (`String.prototype.toLowerCase().includes(...)`), no fuzzy matching, no ranking — first pass over each store's array per keystroke, checking:
- Notes: `title` OR `body`.
- Bookmarks: `title` OR `url` OR `note`.
- Flashcards: `front` OR `back`.

This is intentionally the simplest possible matching strategy consistent with YAGNI — the content volume here (personal localStorage lists) doesn't justify a search index or fuzzy-matching library.

## Data Flow / State

`mount(container)` renders the search input once and wires an `input` event listener that re-reads the query, re-runs the filter against fresh reads of all three stores (`getNotes()`/`getBookmarks()`/`getFlashcards()` — re-read every keystroke rather than cached at mount, so results reflect any changes made in another tab/session since mount), and re-renders only the results section (the input itself is not rebuilt, so it never loses focus or cursor position while typing — this is the one Phase 2 view where full-page-redraw-on-every-keystroke would be a real, user-visible problem, unlike the low-frequency add/delete actions in Notes/Bookmarks/Flashcards). `unmount()` is a no-op (no timers, no listeners outlive the container being torn down by the router).

## Error Handling

No new failure surface: this module only *reads* via the three existing stores' already-hardened getters (each falls back to `[]` on any corrupt/missing data). No writes, no localStorage access of its own.

## Testing

No test framework (consistent with the rest of the project). Verification is manual: with existing notes/bookmarks/flashcards data (add a few of each first via their respective pages), navigate to `#/search`, confirm the empty-query prompt shows initially. Type a query matching a note's title — confirm only the Notes group appears with that result. Type a query matching content across multiple types (e.g. a shared word) — confirm multiple groups appear simultaneously. Type a query matching nothing — confirm the no-results message. Clear the input — confirm it reverts to the empty-query prompt. Confirm the input never loses focus while typing (single keystroke test is sufficient to catch a full-redraw regression).

## Out of Scope (this sub-project)

- Lesson/unit content search (no lesson content exists yet — Phase 5; this is explicitly why Search was sequenced last among the freestanding-content sub-projects, not first).
- Fuzzy matching, ranking/relevance scoring, or search-result highlighting of the matched substring.
- Deep-linking from a search result to its source page with the item pre-selected/scrolled-to (results are read-only previews; clicking a bookmark's link opens the bookmark's URL as normal, but clicking a note or flashcard result does not navigate anywhere — out of scope).
- Debouncing the live-filter input (given the expected data volumes, a synchronous per-keystroke filter is not a performance concern; debouncing would add complexity with no observable benefit here).
