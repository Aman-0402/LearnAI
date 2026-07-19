# Phase 2 Flashcards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `#/flashcards` Coming Soon placeholder with a working Flashcards page: add/delete freestanding front/back cards with click-to-flip review, backed by localStorage.

**Architecture:** New `js/modules/flashcards/flashcards.js` view module (`mount`/`unmount` contract), a new `js/storage/flashcards-store.js` holding cards as an array (`getFlashcards`/`addFlashcard`/`deleteFlashcard`), and a one-entry swap in `js/router.js`'s route table.

**Tech Stack:** Same as prior Phase 2 sub-projects — vanilla ES6 modules, no bundler, no test framework, manual browser verification.

---

### Task 1: flashcards-store.js

**Files:**
- Create: `js/storage/flashcards-store.js`

- [ ] **Step 1: Write flashcards-store.js**

```js
// js/storage/flashcards-store.js
const FLASHCARDS_KEY = "ailp:flashcards";

export function getFlashcards() {
  try {
    const raw = localStorage.getItem(FLASHCARDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveFlashcards(cards) {
  try {
    localStorage.setItem(FLASHCARDS_KEY, JSON.stringify(cards));
  } catch {
    /* localStorage unavailable - cards just won't persist */
  }
}

export function addFlashcard(front, back) {
  const cards = getFlashcards();
  const card = { id: crypto.randomUUID(), front, back, createdAt: Date.now() };
  cards.push(card);
  saveFlashcards(cards);
  return card;
}

export function deleteFlashcard(id) {
  const cards = getFlashcards().filter((c) => c.id !== id);
  saveFlashcards(cards);
}
```

- [ ] **Step 2: Verify with a scratch script**

Run: `node -e "
globalThis.localStorage = { store:{}, getItem(k){return this.store[k]||null}, setItem(k,v){this.store[k]=v} };
globalThis.crypto = { randomUUID: () => 'test-uuid-1' };
import('./js/storage/flashcards-store.js').then(m => {
  console.log(m.getFlashcards());
  const c = m.addFlashcard('Front text', 'Back text');
  console.log(m.getFlashcards());
  m.deleteFlashcard(c.id);
  console.log(m.getFlashcards());
});
"`
Expected: prints `[]`, then an array with one card (`front: 'Front text'`, `back: 'Back text'`), then `[]`.

- [ ] **Step 3: Commit**

```bash
git add js/storage/flashcards-store.js
git commit -m "feat: add flashcards-store with add/delete CRUD"
```

---

### Task 2: Flashcards page styles

**Files:**
- Create: `css/components/flashcards.css`

- [ ] **Step 1: Write flashcards.css**

```css
/* css/components/flashcards.css */
.flashcards {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.flashcards__form {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  align-items: flex-end;
}

.flashcards__field {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  flex: 1 1 200px;
}

.flashcards__label {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}

.flashcards__input {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  padding: var(--space-2) var(--space-3);
  color: var(--color-text);
  font-family: inherit;
  width: 100%;
}

.flashcards__submit {
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: var(--radius-control);
  padding: var(--space-3) var(--space-5);
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.flashcards__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-4);
}

@media (max-width: 900px) {
  .flashcards__grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .flashcards__grid {
    grid-template-columns: 1fr;
  }
}

.flashcard {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  min-height: 140px;
}

.flashcard__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  cursor: pointer;
}

.flashcard__side-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-text-muted);
  font-family: var(--font-mono);
}

.flashcard__text {
  font-size: 1.0625rem;
  font-weight: 600;
  white-space: pre-wrap;
}

.flashcard__actions {
  display: flex;
  justify-content: flex-end;
}

.flashcard__delete {
  background: none;
  border: 1px solid var(--color-error);
  color: var(--color-error);
  border-radius: var(--radius-control);
  padding: var(--space-2) var(--space-4);
  cursor: pointer;
  font-weight: 500;
}

.flashcards__empty {
  color: var(--color-text-muted);
  text-align: center;
  padding: var(--space-6);
}
```

- [ ] **Step 2: Verify CSS is syntactically valid**

Not linked into `index.html` yet (Task 4). Confirm brace balance and that every `var(--...)` reference used above exists in `css/tokens.css`.

- [ ] **Step 3: Commit**

```bash
git add css/components/flashcards.css
git commit -m "feat: add flashcards page styles"
```

---

### Task 3: Flashcards view module

**Files:**
- Create: `js/modules/flashcards/flashcards.js`

- [ ] **Step 1: Write flashcards.js**

```js
// js/modules/flashcards/flashcards.js
import { createEl } from "../../utils/dom.js";
import { getFlashcards, addFlashcard, deleteFlashcard } from "../../storage/flashcards-store.js";

let flippedIds = new Set();

export function mount(container) {
  flippedIds = new Set();
  render(container);
}

export function unmount() {
  flippedIds = new Set();
}

function render(container) {
  container.innerHTML = "";
  container.appendChild(
    createEl("div", {
      className: "flashcards",
      children: [renderForm(container), renderGrid(container)]
    })
  );
}

function renderForm(container) {
  const frontInput = createEl("input", {
    className: "flashcards__input",
    attrs: { type: "text", "aria-label": "Card front" }
  });

  const backInput = createEl("input", {
    className: "flashcards__input",
    attrs: { type: "text", "aria-label": "Card back" }
  });

  const submit = createEl("button", { className: "flashcards__submit", text: "Add Card" });

  const form = createEl("form", {
    className: "flashcards__form",
    children: [
      createEl("div", {
        className: "flashcards__field",
        children: [createEl("label", { className: "flashcards__label", text: "Front" }), frontInput]
      }),
      createEl("div", {
        className: "flashcards__field",
        children: [createEl("label", { className: "flashcards__label", text: "Back" }), backInput]
      }),
      submit
    ]
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const front = frontInput.value.trim();
    const back = backInput.value.trim();
    if (!front || !back) return;
    addFlashcard(front, back);
    render(container);
  });

  return form;
}

function renderGrid(container) {
  const cards = getFlashcards().slice().sort((a, b) => b.createdAt - a.createdAt);

  if (cards.length === 0) {
    return createEl("div", { className: "flashcards__empty", text: "No flashcards yet — add your first one above." });
  }

  return createEl("div", {
    className: "flashcards__grid",
    children: cards.map((card) => renderCard(card, container))
  });
}

function renderCard(card, container) {
  const isFlipped = flippedIds.has(card.id);

  const body = createEl("div", {
    className: "flashcard__body",
    children: [
      createEl("div", { className: "flashcard__side-label", text: isFlipped ? "Back" : "Front" }),
      createEl("div", { className: "flashcard__text", text: isFlipped ? card.back : card.front })
    ]
  });
  body.addEventListener("click", () => {
    if (flippedIds.has(card.id)) {
      flippedIds.delete(card.id);
    } else {
      flippedIds.add(card.id);
    }
    render(container);
  });

  const deleteButton = createEl("button", { className: "flashcard__delete", text: "Delete" });
  deleteButton.addEventListener("click", (event) => {
    event.stopPropagation();
    if (confirm("Delete this flashcard? This cannot be undone.")) {
      deleteFlashcard(card.id);
      render(container);
    }
  });

  return createEl("div", {
    className: "flashcard",
    children: [body, createEl("div", { className: "flashcard__actions", children: [deleteButton] })]
  });
}
```

- [ ] **Step 2: Verify with node --check**

Run: `node --check js/modules/flashcards/flashcards.js`
Expected: no output (syntax OK).

- [ ] **Step 3: Commit**

```bash
git add js/modules/flashcards/flashcards.js
git commit -m "feat: add Flashcards view (add, click-to-flip, delete)"
```

---

### Task 4: Wire Flashcards into the router and index.html

**Files:**
- Modify: `js/router.js`
- Modify: `index.html`

- [ ] **Step 1: Update the `flashcards` route table entry in router.js**

Find this existing entry in `routeTable`:

```js
  flashcards: {
    load: () => import("./modules/coming-soon/coming-soon.js"),
    meta: { title: "Flashcards", phase: "Phase 2" }
  },
```

Replace it with:

```js
  flashcards: {
    load: () => import("./modules/flashcards/flashcards.js")
  },
```

Leave every other route table entry untouched.

- [ ] **Step 2: Add flashcards.css link to index.html**

Add this line after the `css/components/achievements.css` link (the last CSS link in `<head>`):

```html
  <link rel="stylesheet" href="css/components/flashcards.css" />
```

- [ ] **Step 3: Verify in browser**

Run: `npx serve .`, open printed URL, navigate to `#/flashcards`.
Expected: empty state shows initially. Add a card with front/back text — it appears at the top of the grid, front-side-up. Click the card body — it flips to show the back with a "Back" label; click again — flips back to "Front". Click Delete — a confirm dialog appears (clicking Delete must NOT also trigger a flip, verify `event.stopPropagation()` works); confirming removes the card. Add multiple cards, confirm newest-first ordering. Reload the page — confirm all cards persisted and every card resets to front-side-up (flip state is not persisted, by design).

If no browser is available in your environment, do a structural trace instead (confirm the route table change, the CSS link insertion point, and that flashcards.js's imports resolve to real exports) and report that live-browser verification wasn't possible — consistent with how prior Phase 1/2 tasks handled this environment limitation.

- [ ] **Step 4: Commit**

```bash
git add js/router.js index.html
git commit -m "feat: wire Flashcards view into router"
```

---

## Self-Review Notes

- **Spec coverage:** freestanding front/back cards (Task 1, 3) ✓, add form with both fields required (Task 3) ✓, click-to-flip per-card via non-persisted `flippedIds` Set cleared on mount/unmount (Task 3) ✓, delete with native confirm and `stopPropagation` so it doesn't also flip (Task 3) ✓, newest-first sort (Task 3) ✓, empty state (Task 3) ✓, no edit action (Task 3, by design per spec) ✓, array-based store with try/catch + non-array fallback (Task 1) ✓, router wiring replacing Coming Soon (Task 4) ✓.
- **Type consistency:** `getFlashcards`/`addFlashcard`/`deleteFlashcard` names and signatures match between `flashcards-store.js` (Task 1) and `flashcards.js` (Task 3). Card shape `{id, front, back, createdAt}` consistent across `addFlashcard`'s construction and `flashcards.js`'s rendering. `mount(container)`/`unmount()` signature matches the router's generic call site, same pattern already verified safe for every prior Phase 2 module.
- **No placeholders:** every step has runnable code or an explicit manual-verification action; no TBD/TODO markers.
