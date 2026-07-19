# Phase 2 Notes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `#/notes` Coming Soon placeholder with a working Notes page: add/edit/delete freestanding notes (title + body), backed by localStorage.

**Architecture:** New `js/modules/notes/notes.js` view module (`mount`/`unmount` contract), a new `js/storage/notes-store.js` holding notes as an array (`getNotes`/`addNote`/`updateNote`/`deleteNote`), and a one-entry swap in `js/router.js`'s route table.

**Tech Stack:** Same as Phase 1/Settings — vanilla ES6 modules, no bundler, no test framework, manual browser verification.

---

### Task 1: notes-store.js

**Files:**
- Create: `js/storage/notes-store.js`

- [ ] **Step 1: Write notes-store.js**

```js
// js/storage/notes-store.js
const NOTES_KEY = "ailp:notes";

export function getNotes() {
  try {
    const raw = localStorage.getItem(NOTES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveNotes(notes) {
  try {
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  } catch {
    /* localStorage unavailable - notes just won't persist */
  }
}

export function addNote(title, body) {
  const notes = getNotes();
  const now = Date.now();
  const note = { id: crypto.randomUUID(), title, body, createdAt: now, updatedAt: now };
  notes.push(note);
  saveNotes(notes);
  return note;
}

export function updateNote(id, changes) {
  const notes = getNotes();
  const index = notes.findIndex((n) => n.id === id);
  if (index === -1) return null;
  notes[index] = { ...notes[index], ...changes, updatedAt: Date.now() };
  saveNotes(notes);
  return notes[index];
}

export function deleteNote(id) {
  const notes = getNotes().filter((n) => n.id !== id);
  saveNotes(notes);
}
```

- [ ] **Step 2: Verify with a scratch script**

Run: `node -e "
globalThis.localStorage = { store:{}, getItem(k){return this.store[k]||null}, setItem(k,v){this.store[k]=v} };
globalThis.crypto = { randomUUID: () => 'test-uuid-1' };
import('./js/storage/notes-store.js').then(m => {
  console.log(m.getNotes());
  const note = m.addNote('Hello', 'World');
  console.log(m.getNotes());
  m.updateNote(note.id, { title: 'Updated' });
  console.log(m.getNotes()[0].title);
  m.deleteNote(note.id);
  console.log(m.getNotes());
});
"`
Expected: prints `[]`, then an array with one note (title `Hello`, body `World`), then `Updated`, then `[]`.

- [ ] **Step 3: Commit**

```bash
git add js/storage/notes-store.js
git commit -m "feat: add notes-store with add/update/delete CRUD"
```

---

### Task 2: Notes page styles

**Files:**
- Create: `css/components/notes.css`

- [ ] **Step 1: Write notes.css**

```css
/* css/components/notes.css */
.notes {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  max-width: 720px;
}

.notes__form {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.notes__input,
.notes__textarea {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  padding: var(--space-2) var(--space-3);
  color: var(--color-text);
  font-family: inherit;
  width: 100%;
}

.notes__textarea {
  min-height: 80px;
  resize: vertical;
}

.notes__submit {
  align-self: flex-start;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: var(--radius-control);
  padding: var(--space-3) var(--space-5);
  font-weight: 600;
  cursor: pointer;
}

.notes__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.note-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.note-card__title {
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 1.0625rem;
}

.note-card__body {
  white-space: pre-wrap;
  color: var(--color-text);
}

.note-card__date {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  font-family: var(--font-mono);
}

.note-card__actions {
  display: flex;
  gap: var(--space-2);
  margin-top: var(--space-2);
}

.note-card__button {
  background: none;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  padding: var(--space-2) var(--space-4);
  cursor: pointer;
  color: var(--color-text);
  font-weight: 500;
}

.note-card__button--danger {
  border-color: var(--color-error);
  color: var(--color-error);
}

.notes__empty {
  color: var(--color-text-muted);
  text-align: center;
  padding: var(--space-6);
}
```

- [ ] **Step 2: Verify CSS is syntactically valid**

Not linked into `index.html` yet (Task 4). Confirm brace balance and every `var(--...)` reference exists in `css/tokens.css`.

- [ ] **Step 3: Commit**

```bash
git add css/components/notes.css
git commit -m "feat: add notes page styles"
```

---

### Task 3: Notes view module

**Files:**
- Create: `js/modules/notes/notes.js`

- [ ] **Step 1: Write notes.js**

```js
// js/modules/notes/notes.js
import { createEl } from "../../utils/dom.js";
import { getNotes, addNote, updateNote, deleteNote } from "../../storage/notes-store.js";

let editingId = null;

export function mount(container) {
  editingId = null;
  render(container);
}

export function unmount() {
  editingId = null;
}

function render(container) {
  container.innerHTML = "";
  container.appendChild(
    createEl("div", {
      className: "notes",
      children: [renderForm(container), renderList(container)]
    })
  );
}

function renderForm(container) {
  const titleInput = createEl("input", {
    className: "notes__input",
    attrs: { type: "text", placeholder: "Title", "aria-label": "Note title" }
  });

  const bodyInput = createEl("textarea", {
    className: "notes__textarea",
    attrs: { placeholder: "Write your note...", "aria-label": "Note body" }
  });

  const submit = createEl("button", { className: "notes__submit", text: "Add Note" });

  const form = createEl("form", {
    className: "notes__form",
    children: [titleInput, bodyInput, submit]
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const title = titleInput.value.trim();
    if (!title) return;
    addNote(title, bodyInput.value);
    render(container);
  });

  return form;
}

function renderList(container) {
  const notes = getNotes().slice().sort((a, b) => b.createdAt - a.createdAt);

  if (notes.length === 0) {
    return createEl("div", { className: "notes__empty", text: "No notes yet — write your first one above." });
  }

  const cards = notes.map((note) =>
    note.id === editingId ? renderEditCard(note, container) : renderCard(note, container)
  );

  return createEl("div", { className: "notes__list", children: cards });
}

function renderCard(note, container) {
  const dateLabel = new Date(note.createdAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric"
  });

  const editButton = createEl("button", { className: "note-card__button", text: "Edit" });
  editButton.addEventListener("click", () => {
    editingId = note.id;
    render(container);
  });

  const deleteButton = createEl("button", {
    className: "note-card__button note-card__button--danger",
    text: "Delete"
  });
  deleteButton.addEventListener("click", () => {
    if (confirm("Delete this note? This cannot be undone.")) {
      deleteNote(note.id);
      render(container);
    }
  });

  return createEl("div", {
    className: "note-card",
    children: [
      createEl("div", { className: "note-card__title", text: note.title }),
      createEl("div", { className: "note-card__body", text: note.body }),
      createEl("div", { className: "note-card__date", text: dateLabel }),
      createEl("div", { className: "note-card__actions", children: [editButton, deleteButton] })
    ]
  });
}

function renderEditCard(note, container) {
  const titleInput = createEl("input", {
    className: "notes__input",
    attrs: { type: "text", "aria-label": "Edit note title" }
  });
  titleInput.value = note.title;

  const bodyInput = createEl("textarea", {
    className: "notes__textarea",
    attrs: { "aria-label": "Edit note body" }
  });
  bodyInput.value = note.body;

  const saveButton = createEl("button", { className: "note-card__button", text: "Save" });
  saveButton.addEventListener("click", () => {
    const title = titleInput.value.trim();
    if (!title) return;
    updateNote(note.id, { title, body: bodyInput.value });
    editingId = null;
    render(container);
  });

  const cancelButton = createEl("button", { className: "note-card__button", text: "Cancel" });
  cancelButton.addEventListener("click", () => {
    editingId = null;
    render(container);
  });

  return createEl("div", {
    className: "note-card",
    children: [
      titleInput,
      bodyInput,
      createEl("div", { className: "note-card__actions", children: [saveButton, cancelButton] })
    ]
  });
}
```

- [ ] **Step 2: Verify with node --check**

Run: `node --check js/modules/notes/notes.js`
Expected: no output (syntax OK).

- [ ] **Step 3: Commit**

```bash
git add js/modules/notes/notes.js
git commit -m "feat: add Notes view (add, edit-in-place, delete)"
```

---

### Task 4: Wire Notes into the router and index.html

**Files:**
- Modify: `js/router.js`
- Modify: `index.html`

- [ ] **Step 1: Update the `notes` route table entry in router.js**

Find this existing entry in `routeTable`:

```js
  notes: {
    load: () => import("./modules/coming-soon/coming-soon.js"),
    meta: { title: "Notes", phase: "Phase 2" }
  },
```

Replace it with:

```js
  notes: {
    load: () => import("./modules/notes/notes.js")
  },
```

Leave every other route table entry untouched.

- [ ] **Step 2: Add notes.css link to index.html**

Add this line after the `css/components/settings.css` link (the last CSS link in `<head>`):

```html
  <link rel="stylesheet" href="css/components/notes.css" />
```

- [ ] **Step 3: Verify in browser**

Run: `npx serve .`, open printed URL, navigate to `#/notes`.
Expected: empty state message shows initially. Add a note (title required, body optional) — it appears at top of list immediately. Click Edit — card switches to editable inputs pre-filled with current values; Save persists changes and returns to display mode; Cancel discards changes and returns to display mode unchanged. Click Delete — confirm dialog appears; confirming removes the note. Add multiple notes and confirm newest-first ordering. Reload the page and confirm all notes persisted (check devtools → Application → Local Storage → `ailp:notes`).

If no browser is available in your environment, do a structural trace instead (confirm the route table change, confirm the CSS link insertion point, confirm `js/modules/notes/notes.js`'s imports resolve to the real exports from Task 1) and report that live-browser verification wasn't possible — consistent with how prior Phase 1/2 tasks handled this environment limitation.

- [ ] **Step 4: Commit**

```bash
git add js/router.js index.html
git commit -m "feat: wire Notes view into router"
```

---

## Self-Review Notes

- **Spec coverage:** freestanding notes with title+body (Task 1, 3) ✓, add form (Task 3) ✓, inline edit with Save/Cancel (Task 3) ✓, delete with native confirm (Task 3) ✓, newest-first sort (Task 3) ✓, empty state (Task 3) ✓, array-based store with try/catch + non-array fallback (Task 1) ✓, router wiring replacing Coming Soon (Task 4) ✓.
- **Type consistency:** `getNotes`/`addNote`/`updateNote`/`deleteNote` names and signatures match between `notes-store.js` (Task 1) and `notes.js` (Task 3). Note shape `{id, title, body, createdAt, updatedAt}` consistent across `addNote`'s construction, `updateNote`'s merge, and `notes.js`'s rendering (`note.title`, `note.body`, `note.createdAt`, `note.id`). `mount(container)`/`unmount()` signature matches the router's generic call site, same pattern already verified safe for `dashboard.js`/`settings.js`.
- **No placeholders:** every step has runnable code or an explicit manual-verification action; no TBD/TODO markers.
