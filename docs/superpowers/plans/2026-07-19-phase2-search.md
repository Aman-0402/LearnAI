# Phase 2 Search Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `#/search` Coming Soon placeholder with a working Search page: a single live-filtering search box across the three existing localStorage-backed content stores (Notes, Bookmarks, Flashcards), results grouped by type.

**Architecture:** New `js/modules/search/search.js` view module (`mount`/`unmount` contract). No new storage module — reads live from the existing `js/storage/notes-store.js` (`getNotes`), `js/storage/bookmarks-store.js` (`getBookmarks`), `js/storage/flashcards-store.js` (`getFlashcards`). Unlike every prior Phase 2 module, the search input itself is NOT rebuilt on every re-render (only the results section is), so the input never loses focus/cursor position while the user types. A one-entry swap in `js/router.js`'s route table.

**Tech Stack:** Same as prior Phase 2 sub-projects — vanilla ES6 modules, no bundler, no test framework, manual browser verification.

---

### Task 1: Search page styles

**Files:**
- Create: `css/components/search.css`

- [ ] **Step 1: Write search.css**

```css
/* css/components/search.css */
.search {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  max-width: 720px;
}

.search__input {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  padding: var(--space-3) var(--space-4);
  color: var(--color-text);
  font-family: inherit;
  font-size: 1rem;
  width: 100%;
}

.search__results {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.search__group-heading {
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 0.9375rem;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: var(--space-3);
}

.search__group-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.search-result {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.search-result__title {
  font-weight: 700;
}

.search-result__title-link {
  font-weight: 700;
  color: var(--color-primary);
  text-decoration: none;
}

.search-result__title-link:hover {
  text-decoration: underline;
}

.search-result__snippet {
  color: var(--color-text-muted);
  font-size: 0.9375rem;
}

.search__empty,
.search__no-results {
  color: var(--color-text-muted);
  text-align: center;
  padding: var(--space-6);
}
```

- [ ] **Step 2: Verify CSS is syntactically valid**

Not linked into `index.html` yet (Task 3). Confirm brace balance and that every `var(--...)` reference used above exists in `css/tokens.css`.

- [ ] **Step 3: Commit**

```bash
git add css/components/search.css
git commit -m "feat: add search page styles"
```

---

### Task 2: Search view module

**Files:**
- Create: `js/modules/search/search.js`

- [ ] **Step 1: Write search.js**

```js
// js/modules/search/search.js
import { createEl, clearChildren } from "../../utils/dom.js";
import { getNotes } from "../../storage/notes-store.js";
import { getBookmarks } from "../../storage/bookmarks-store.js";
import { getFlashcards } from "../../storage/flashcards-store.js";

let resultsEl = null;

export function mount(container) {
  resultsEl = null;
  render(container);
}

export function unmount() {
  resultsEl = null;
}

function render(container) {
  container.innerHTML = "";

  const input = createEl("input", {
    className: "search__input",
    attrs: {
      type: "search",
      placeholder: "Search notes, bookmarks, flashcards...",
      "aria-label": "Search notes, bookmarks, and flashcards"
    }
  });

  resultsEl = createEl("div", { className: "search__results" });

  input.addEventListener("input", () => {
    renderResults(input.value);
  });

  container.appendChild(
    createEl("div", { className: "search", children: [input, resultsEl] })
  );

  renderResults("");
}

function matchNote(note, q) {
  return note.title.toLowerCase().includes(q) || note.body.toLowerCase().includes(q);
}

function matchBookmark(bookmark, q) {
  return (
    bookmark.title.toLowerCase().includes(q) ||
    bookmark.url.toLowerCase().includes(q) ||
    (bookmark.note && bookmark.note.toLowerCase().includes(q))
  );
}

function matchFlashcard(card, q) {
  return card.front.toLowerCase().includes(q) || card.back.toLowerCase().includes(q);
}

function snippet(text, length = 100) {
  return text.length > length ? `${text.slice(0, length)}…` : text;
}

function renderResults(rawQuery) {
  clearChildren(resultsEl);

  const query = rawQuery.trim().toLowerCase();

  if (!query) {
    resultsEl.appendChild(
      createEl("div", {
        className: "search__empty",
        text: "Type to search your notes, bookmarks, and flashcards."
      })
    );
    return;
  }

  const noteMatches = getNotes().filter((n) => matchNote(n, query));
  const bookmarkMatches = getBookmarks().filter((b) => matchBookmark(b, query));
  const flashcardMatches = getFlashcards().filter((c) => matchFlashcard(c, query));

  const groups = [
    { label: "Notes", items: noteMatches, render: renderNoteResult },
    { label: "Bookmarks", items: bookmarkMatches, render: renderBookmarkResult },
    { label: "Flashcards", items: flashcardMatches, render: renderFlashcardResult }
  ].filter((g) => g.items.length > 0);

  if (groups.length === 0) {
    resultsEl.appendChild(
      createEl("div", { className: "search__no-results", text: `No results for "${rawQuery.trim()}"` })
    );
    return;
  }

  groups.forEach((group) => {
    resultsEl.appendChild(
      createEl("div", {
        className: "search__group",
        children: [
          createEl("div", { className: "search__group-heading", text: group.label }),
          createEl("div", { className: "search__group-list", children: group.items.map(group.render) })
        ]
      })
    );
  });
}

function renderNoteResult(note) {
  return createEl("div", {
    className: "search-result",
    children: [
      createEl("div", { className: "search-result__title", text: note.title }),
      createEl("div", { className: "search-result__snippet", text: snippet(note.body) })
    ]
  });
}

function renderBookmarkResult(bookmark) {
  const children = [
    createEl("a", {
      className: "search-result__title-link",
      text: bookmark.title,
      attrs: { href: bookmark.url, target: "_blank", rel: "noopener noreferrer" }
    })
  ];
  if (bookmark.note) {
    children.push(createEl("div", { className: "search-result__snippet", text: snippet(bookmark.note) }));
  }
  return createEl("div", { className: "search-result", children });
}

function renderFlashcardResult(card) {
  return createEl("div", {
    className: "search-result",
    children: [
      createEl("div", { className: "search-result__title", text: card.front }),
      createEl("div", { className: "search-result__snippet", text: card.back })
    ]
  });
}
```

- [ ] **Step 2: Verify with node --check**

Run: `node --check js/modules/search/search.js`
Expected: no output (syntax OK).

- [ ] **Step 3: Verify imports resolve**

Confirm `js/storage/notes-store.js` exports `getNotes`, `js/storage/bookmarks-store.js` exports `getBookmarks`, `js/storage/flashcards-store.js` exports `getFlashcards`, and `js/utils/dom.js` exports both `createEl` and `clearChildren` (the latter is used here for the first time outside `sidebar.js`, which imported it but never used it — confirm the export genuinely exists and clears only child nodes, not the element itself).

- [ ] **Step 4: Commit**

```bash
git add js/modules/search/search.js
git commit -m "feat: add Search view (live cross-store filtering)"
```

---

### Task 3: Wire Search into the router and index.html

**Files:**
- Modify: `js/router.js`
- Modify: `index.html`

- [ ] **Step 1: Update the `search` route table entry in router.js**

Find this existing entry in `routeTable`:

```js
  search: {
    load: () => import("./modules/coming-soon/coming-soon.js"),
    meta: { title: "Search", phase: "Phase 2" }
  },
```

Replace it with:

```js
  search: {
    load: () => import("./modules/search/search.js")
  },
```

Leave every other route table entry untouched.

- [ ] **Step 2: Add search.css link to index.html**

Add this line after the `css/components/flashcards.css` link (the last CSS link in `<head>`):

```html
  <link rel="stylesheet" href="css/components/search.css" />
```

- [ ] **Step 3: Verify in browser**

Run: `npx serve .`, open printed URL. First, add a couple of notes (via `#/notes`), a bookmark (via `#/bookmarks`), and a flashcard (via `#/flashcards`) if none exist yet. Navigate to `#/search`.
Expected: empty-query prompt shows initially. Type a query matching only a note — only the "Notes" group appears. Clear and type a query matching a bookmark's title — only "Bookmarks" appears, title is a clickable link opening in a new tab. Type a query matching a flashcard's front or back text — only "Flashcards" appears, showing both sides. Type a query matching content across two or more types — multiple groups appear together. Type a query matching nothing — "No results" message shows. Clear the input entirely — reverts to the empty-query prompt. Confirm the input never loses focus while typing (type several characters in a row without re-clicking the input).

If no browser is available in your environment, do a structural trace instead (confirm the route table change, the CSS link insertion point, and that search.js's imports resolve to real exports across all three stores) and report that live-browser verification wasn't possible — consistent with how prior Phase 1/2 tasks handled this environment limitation.

- [ ] **Step 4: Commit**

```bash
git add js/router.js index.html
git commit -m "feat: wire Search view into router"
```

---

## Self-Review Notes

- **Spec coverage:** live cross-store search (Task 2) ✓, grouped-by-type results with per-type omission when zero matches (Task 2) ✓, case-insensitive substring matching across the specified fields per type (Task 2) ✓, empty-query prompt and no-results state with exact wording from spec (Task 2) ✓, note/bookmark/flashcard result rendering per spec (bookmark title as safe link, flashcard shows both sides, note shows title+snippet) (Task 2) ✓, input never rebuilt/never loses focus (only `resultsEl` is touched by `renderResults`, the outer `render()` that builds the input only runs once at mount) (Task 2) ✓, no new storage module (Task 2) ✓, router wiring replacing Coming Soon (Task 3) ✓.
- **Type consistency:** `getNotes`/`getBookmarks`/`getFlashcards` import and usage match the real exports confirmed in each store file. Field names read (`note.title`/`note.body`, `bookmark.title`/`bookmark.url`/`bookmark.note`, `card.front`/`card.back`) match the shapes established in the Notes/Bookmarks/Flashcards plans. `mount(container)`/`unmount()` signature matches the router's generic call site, consistent with every prior Phase 2 module.
- **No placeholders:** every step has runnable code or an explicit manual-verification action; no TBD/TODO markers.
