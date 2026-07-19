# Phase 2 Bookmarks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `#/bookmarks` Coming Soon placeholder with a working Bookmarks page: add/delete freestanding link bookmarks (title + URL + optional note), backed by localStorage.

**Architecture:** New `js/modules/bookmarks/bookmarks.js` view module (`mount`/`unmount` contract), a new `js/storage/bookmarks-store.js` holding bookmarks as an array (`getBookmarks`/`addBookmark`/`deleteBookmark`), and a one-entry swap in `js/router.js`'s route table.

**Tech Stack:** Same as Phase 1/Settings/Notes — vanilla ES6 modules, no bundler, no test framework, manual browser verification.

---

### Task 1: bookmarks-store.js

**Files:**
- Create: `js/storage/bookmarks-store.js`

- [ ] **Step 1: Write bookmarks-store.js**

```js
// js/storage/bookmarks-store.js
const BOOKMARKS_KEY = "ailp:bookmarks";

export function getBookmarks() {
  try {
    const raw = localStorage.getItem(BOOKMARKS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveBookmarks(bookmarks) {
  try {
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
  } catch {
    /* localStorage unavailable - bookmarks just won't persist */
  }
}

export function addBookmark(title, url, note) {
  const bookmarks = getBookmarks();
  const bookmark = { id: crypto.randomUUID(), title, url, note, createdAt: Date.now() };
  bookmarks.push(bookmark);
  saveBookmarks(bookmarks);
  return bookmark;
}

export function deleteBookmark(id) {
  const bookmarks = getBookmarks().filter((b) => b.id !== id);
  saveBookmarks(bookmarks);
}
```

- [ ] **Step 2: Verify with a scratch script**

Run: `node -e "
globalThis.localStorage = { store:{}, getItem(k){return this.store[k]||null}, setItem(k,v){this.store[k]=v} };
globalThis.crypto = { randomUUID: () => 'test-uuid-1' };
import('./js/storage/bookmarks-store.js').then(m => {
  console.log(m.getBookmarks());
  const b = m.addBookmark('Example', 'https://example.com', 'A note');
  console.log(m.getBookmarks());
  m.deleteBookmark(b.id);
  console.log(m.getBookmarks());
});
"`
Expected: prints `[]`, then an array with one bookmark (title `Example`, url `https://example.com`, note `A note`), then `[]`.

- [ ] **Step 3: Commit**

```bash
git add js/storage/bookmarks-store.js
git commit -m "feat: add bookmarks-store with add/delete CRUD"
```

---

### Task 2: Bookmarks page styles

**Files:**
- Create: `css/components/bookmarks.css`

- [ ] **Step 1: Write bookmarks.css**

```css
/* css/components/bookmarks.css */
.bookmarks {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  max-width: 720px;
}

.bookmarks__form {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.bookmarks__input,
.bookmarks__textarea {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  padding: var(--space-2) var(--space-3);
  color: var(--color-text);
  font-family: inherit;
  width: 100%;
}

.bookmarks__textarea {
  min-height: 60px;
  resize: vertical;
}

.bookmarks__error {
  color: var(--color-error);
  font-size: 0.875rem;
}

.bookmarks__submit {
  align-self: flex-start;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: var(--radius-control);
  padding: var(--space-3) var(--space-5);
  font-weight: 600;
  cursor: pointer;
}

.bookmarks__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.bookmark-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.bookmark-card__title {
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 1.0625rem;
  color: var(--color-primary);
  text-decoration: none;
}

.bookmark-card__title:hover {
  text-decoration: underline;
}

.bookmark-card__note {
  white-space: pre-wrap;
  color: var(--color-text);
}

.bookmark-card__date {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  font-family: var(--font-mono);
}

.bookmark-card__actions {
  display: flex;
  gap: var(--space-2);
  margin-top: var(--space-2);
}

.bookmark-card__button {
  background: none;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  padding: var(--space-2) var(--space-4);
  cursor: pointer;
  color: var(--color-text);
  font-weight: 500;
}

.bookmark-card__button--danger {
  border-color: var(--color-error);
  color: var(--color-error);
}

.bookmarks__empty {
  color: var(--color-text-muted);
  text-align: center;
  padding: var(--space-6);
}
```

- [ ] **Step 2: Verify CSS is syntactically valid**

Not linked into `index.html` yet (Task 4). Confirm brace balance and every `var(--...)` reference exists in `css/tokens.css`.

- [ ] **Step 3: Commit**

```bash
git add css/components/bookmarks.css
git commit -m "feat: add bookmarks page styles"
```

---

### Task 3: Bookmarks view module

**Files:**
- Create: `js/modules/bookmarks/bookmarks.js`

- [ ] **Step 1: Write bookmarks.js**

```js
// js/modules/bookmarks/bookmarks.js
import { createEl } from "../../utils/dom.js";
import { getBookmarks, addBookmark, deleteBookmark } from "../../storage/bookmarks-store.js";

let urlError = null;

export function mount(container) {
  urlError = null;
  render(container);
}

export function unmount() {
  urlError = null;
}

function render(container) {
  container.innerHTML = "";
  container.appendChild(
    createEl("div", {
      className: "bookmarks",
      children: [renderForm(container), renderList(container)]
    })
  );
}

function isValidHttpUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function renderForm(container) {
  const titleInput = createEl("input", {
    className: "bookmarks__input",
    attrs: { type: "text", placeholder: "Title", "aria-label": "Bookmark title" }
  });

  const urlInput = createEl("input", {
    className: "bookmarks__input",
    attrs: { type: "text", placeholder: "https://...", "aria-label": "Bookmark URL" }
  });

  const noteInput = createEl("textarea", {
    className: "bookmarks__textarea",
    attrs: { placeholder: "Note (optional)", "aria-label": "Bookmark note" }
  });

  const submit = createEl("button", { className: "bookmarks__submit", text: "Add Bookmark" });

  const formChildren = [titleInput, urlInput];
  if (urlError) {
    formChildren.push(createEl("div", { className: "bookmarks__error", text: urlError, attrs: { role: "alert" } }));
  }
  formChildren.push(noteInput, submit);

  const form = createEl("form", { className: "bookmarks__form", children: formChildren });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const title = titleInput.value.trim();
    const url = urlInput.value.trim();

    if (!title) return;

    if (!isValidHttpUrl(url)) {
      urlError = "Enter a valid http(s) URL";
      render(container);
      return;
    }

    urlError = null;
    addBookmark(title, url, noteInput.value);
    render(container);
  });

  return form;
}

function renderList(container) {
  const bookmarks = getBookmarks().slice().sort((a, b) => b.createdAt - a.createdAt);

  if (bookmarks.length === 0) {
    return createEl("div", { className: "bookmarks__empty", text: "No bookmarks yet — save your first link above." });
  }

  const cards = bookmarks.map((bookmark) => renderCard(bookmark, container));
  return createEl("div", { className: "bookmarks__list", children: cards });
}

function renderCard(bookmark, container) {
  const dateLabel = new Date(bookmark.createdAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric"
  });

  const titleLink = createEl("a", {
    className: "bookmark-card__title",
    text: bookmark.title,
    attrs: { href: bookmark.url, target: "_blank", rel: "noopener noreferrer" }
  });

  const deleteButton = createEl("button", {
    className: "bookmark-card__button bookmark-card__button--danger",
    text: "Delete"
  });
  deleteButton.addEventListener("click", () => {
    if (confirm("Delete this bookmark? This cannot be undone.")) {
      deleteBookmark(bookmark.id);
      render(container);
    }
  });

  const children = [titleLink];
  if (bookmark.note) {
    children.push(createEl("div", { className: "bookmark-card__note", text: bookmark.note }));
  }
  children.push(createEl("div", { className: "bookmark-card__date", text: dateLabel }));
  children.push(createEl("div", { className: "bookmark-card__actions", children: [deleteButton] }));

  return createEl("div", { className: "bookmark-card", children });
}
```

- [ ] **Step 2: Verify with node --check**

Run: `node --check js/modules/bookmarks/bookmarks.js`
Expected: no output (syntax OK).

- [ ] **Step 3: Commit**

```bash
git add js/modules/bookmarks/bookmarks.js
git commit -m "feat: add Bookmarks view (add with URL validation, delete)"
```

---

### Task 4: Wire Bookmarks into the router and index.html

**Files:**
- Modify: `js/router.js`
- Modify: `index.html`

- [ ] **Step 1: Update the `bookmarks` route table entry in router.js**

Find this existing entry in `routeTable`:

```js
  bookmarks: {
    load: () => import("./modules/coming-soon/coming-soon.js"),
    meta: { title: "Bookmarks", phase: "Phase 2" }
  },
```

Replace it with:

```js
  bookmarks: {
    load: () => import("./modules/bookmarks/bookmarks.js")
  },
```

Leave every other route table entry untouched.

- [ ] **Step 2: Add bookmarks.css link to index.html**

Add this line after the `css/components/notes.css` link (the last CSS link in `<head>`):

```html
  <link rel="stylesheet" href="css/components/bookmarks.css" />
```

- [ ] **Step 3: Verify in browser**

Run: `npx serve .`, open printed URL, navigate to `#/bookmarks`.
Expected: empty state message shows initially. Try submitting with an empty/invalid URL (no scheme, `javascript:alert(1)`, plain text) — inline error shows, nothing saved. Add a bookmark with a valid `https://` URL and a note — it appears at top of list immediately as a clickable link opening in a new tab. Add a bookmark with no note — card renders without a note line. Click Delete — confirm dialog appears; confirming removes the bookmark. Add multiple bookmarks and confirm newest-first ordering. Reload the page and confirm all bookmarks persisted (check devtools → Application → Local Storage → `ailp:bookmarks`).

If no browser is available in your environment, do a structural trace instead (confirm the route table change, confirm the CSS link insertion point, confirm `js/modules/bookmarks/bookmarks.js`'s imports resolve to the real exports from Task 1) and report that live-browser verification wasn't possible — consistent with how prior Phase 1/2 tasks handled this environment limitation.

- [ ] **Step 4: Commit**

```bash
git add js/router.js index.html
git commit -m "feat: wire Bookmarks view into router"
```

---

## Self-Review Notes

- **Spec coverage:** freestanding bookmarks with title+url+optional note (Task 1, 3) ✓, add form with URL validation via `URL` constructor requiring http/https and inline error (Task 3) ✓, no auto-prefixing, no silent drop (Task 3) ✓, newest-first sort (Task 3) ✓, title-as-link with `target="_blank" rel="noopener noreferrer"` (Task 3) ✓, delete with native confirm (Task 3) ✓, empty state (Task 3) ✓, no edit action (Task 3, by design) ✓, array-based store with try/catch + non-array fallback (Task 1) ✓, router wiring replacing Coming Soon (Task 4) ✓.
- **Type consistency:** `getBookmarks`/`addBookmark`/`deleteBookmark` names and signatures match between `bookmarks-store.js` (Task 1) and `bookmarks.js` (Task 3). Bookmark shape `{id, title, url, note, createdAt}` consistent across `addBookmark`'s construction and `bookmarks.js`'s rendering (`bookmark.title`, `bookmark.url`, `bookmark.note`, `bookmark.createdAt`, `bookmark.id`). `mount(container)`/`unmount()` signature matches the router's generic call site, same pattern already verified safe for `dashboard.js`/`settings.js`/`notes.js`.
- **No placeholders:** every step has runnable code or an explicit manual-verification action; no TBD/TODO markers.
