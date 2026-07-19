# Phase 5 Course Data + Roadmap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `#/roadmap` Coming Soon placeholder with a working course overview page — 4 unit cards (title, description, lesson count, progress bar, link into the unit) — backed by a new `json/course.json` data file with real lesson titles for Unit 1 and placeholder metadata for Units 2-4.

**Architecture:** New static `json/course.json` (fetched once, same pattern as `json/nav.json`). New `js/modules/roadmap/roadmap.js` view module (`mount`/`unmount` contract) that fetches it, reads `progress-store.js` for per-unit percentages, and renders the unit cards. A one-entry swap in `js/router.js`'s route table.

**Tech Stack:** Same as every prior phase — vanilla ES6 modules, no bundler, no test framework, manual browser verification.

---

### Task 1: course.json

**Files:**
- Create: `json/course.json`

- [ ] **Step 1: Write course.json**

```json
{
  "units": [
    {
      "id": "unit-1",
      "title": "Unit 1: Foundations",
      "description": "What AI actually is, and the core ideas behind machine learning.",
      "lessons": [
        { "id": "lesson-1", "title": "What Is Artificial Intelligence?" },
        { "id": "lesson-2", "title": "Data, Patterns, and Learning" },
        { "id": "lesson-3", "title": "Supervised vs. Unsupervised Learning" }
      ]
    },
    {
      "id": "unit-2",
      "title": "Unit 2: Coming Soon",
      "description": "Content for this unit hasn't been written yet.",
      "lessons": []
    },
    {
      "id": "unit-3",
      "title": "Unit 3: Coming Soon",
      "description": "Content for this unit hasn't been written yet.",
      "lessons": []
    },
    {
      "id": "unit-4",
      "title": "Unit 4: Coming Soon",
      "description": "Content for this unit hasn't been written yet.",
      "lessons": []
    }
  ]
}
```

- [ ] **Step 2: Verify**

Run: `node -e "JSON.parse(require('fs').readFileSync('json/course.json', 'utf8')); console.log('valid')"`
Expected: prints `valid`.

Confirm all 4 `unit.id` values (`unit-1`..`unit-4`) exactly match the route ids already used in `js/router.js`'s route table and the keys already used in `js/storage/progress-store.js`'s `DEFAULT_STATE.unitProgress` — this file introduces no new identifier scheme.

- [ ] **Step 3: Commit**

```bash
git add json/course.json
git commit -m "feat: add course.json with Unit 1 lesson titles and Unit 2-4 placeholders"
```

---

### Task 2: Roadmap page styles

**Files:**
- Create: `css/components/roadmap.css`

- [ ] **Step 1: Write roadmap.css**

```css
/* css/components/roadmap.css */
.roadmap {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.roadmap__units {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.roadmap-unit-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  transition: transform var(--duration-fast) var(--ease-standard),
    border-color var(--duration-fast) var(--ease-standard);
}

.roadmap-unit-card:hover {
  transform: translateY(-2px);
  border-color: var(--color-primary);
}

.roadmap-unit-card__title {
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 1.125rem;
}

.roadmap-unit-card__description {
  color: var(--color-text-muted);
}

.roadmap-unit-card__meta {
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}

.roadmap-unit-card__bar {
  height: 8px;
  background: var(--color-bg);
  border-radius: 999px;
  overflow: hidden;
}

.roadmap-unit-card__fill {
  height: 100%;
  background: var(--color-primary);
  border-radius: 999px;
}

.roadmap-unit-card__link {
  align-self: flex-start;
  color: var(--color-primary);
  font-weight: 600;
  text-decoration: none;
}

.roadmap-unit-card__link:hover {
  text-decoration: underline;
}

.roadmap__error {
  color: var(--color-text-muted);
  text-align: center;
  padding: var(--space-6);
}
```

- [ ] **Step 2: Verify CSS is syntactically valid**

Not linked into `index.html` yet (Task 4). Confirm brace balance and that every `var(--...)` reference used above exists in `css/tokens.css`, including `--duration-fast`/`--ease-standard` (already used by every Phase 3 Motion card hover rule — this follows the identical pattern).

- [ ] **Step 3: Commit**

```bash
git add css/components/roadmap.css
git commit -m "feat: add roadmap page styles"
```

---

### Task 3: Roadmap view module

**Files:**
- Create: `js/modules/roadmap/roadmap.js`

- [ ] **Step 1: Write roadmap.js**

```js
// js/modules/roadmap/roadmap.js
import { createEl } from "../../utils/dom.js";
import { getState } from "../../storage/progress-store.js";

export async function mount(container) {
  container.innerHTML = "";

  let courseData = { units: [] };
  try {
    const res = await fetch("json/course.json");
    if (!res.ok) throw new Error(`course.json fetch failed: ${res.status}`);
    courseData = await res.json();
    if (!Array.isArray(courseData.units)) {
      throw new Error("course.json 'units' field is missing or not an array");
    }
  } catch (err) {
    console.error("Failed to load course data:", err);
    container.appendChild(
      createEl("div", {
        className: "roadmap__error",
        text: "Couldn't load the course roadmap. Please try again later."
      })
    );
    return;
  }

  const { unitProgress } = getState();

  const heading = createEl("h1", { text: "Course Roadmap" });

  const units = createEl("div", {
    className: "roadmap__units",
    children: courseData.units.map((unit) => renderUnitCard(unit, unitProgress[unit.id] || 0))
  });

  container.appendChild(
    createEl("div", { className: "roadmap", children: [heading, units] })
  );
}

export function unmount() {
  /* no-op: read-only view, nothing to clean up */
}

function renderUnitCard(unit, percent) {
  const lessonCountLabel =
    unit.lessons.length > 0
      ? `${unit.lessons.length} lesson${unit.lessons.length === 1 ? "" : "s"}`
      : "Content coming soon";

  const fill = createEl("div", { className: "roadmap-unit-card__fill" });
  fill.style.width = `${percent}%`;

  return createEl("div", {
    className: "roadmap-unit-card",
    children: [
      createEl("div", { className: "roadmap-unit-card__title", text: unit.title }),
      createEl("div", { className: "roadmap-unit-card__description", text: unit.description }),
      createEl("div", { className: "roadmap-unit-card__meta", text: `${lessonCountLabel} · ${percent}% complete` }),
      createEl("div", { className: "roadmap-unit-card__bar", children: [fill] }),
      createEl("a", {
        className: "roadmap-unit-card__link",
        text: "Start",
        attrs: { href: `#/${unit.id}` }
      })
    ]
  });
}
```

- [ ] **Step 2: Verify with node --check**

Run: `node --check js/modules/roadmap/roadmap.js`
Expected: no output (syntax OK).

- [ ] **Step 3: Verify imports and data shape**

Confirm `js/storage/progress-store.js` exports `getState` and that `getState().unitProgress` is an object keyed by `unit-1`..`unit-4` (already confirmed by every prior Phase 2 module that reads it — `dashboard.js`, `achievements.js`, `progress.js`). Confirm `js/utils/dom.js`'s `createEl` signature matches usage. Confirm `unitProgress[unit.id] || 0` is safe given `getState()` always returns all 4 keys with numeric values (per `progress-store.js`'s `DEFAULT_STATE` merge — the `|| 0` is a defensive no-op in practice, not covering a real gap, but costs nothing and guards against a future data-shape change).

- [ ] **Step 4: Commit**

```bash
git add js/modules/roadmap/roadmap.js
git commit -m "feat: add Roadmap view (course.json overview, per-unit progress)"
```

---

### Task 4: Wire Roadmap into the router and index.html

**Files:**
- Modify: `js/router.js`
- Modify: `index.html`

- [ ] **Step 1: Update the `roadmap` route table entry in router.js**

Find this existing entry in `routeTable`:

```js
  roadmap: {
    load: () => import("./modules/coming-soon/coming-soon.js"),
    meta: { title: "Course Roadmap", phase: "Phase 5" }
  },
```

Replace it with:

```js
  roadmap: {
    load: () => import("./modules/roadmap/roadmap.js")
  },
```

Leave every other route table entry (including `unit-1`..`unit-4`, still coming-soon — that's the next Phase 5 sub-project) untouched.

- [ ] **Step 2: Add roadmap.css link to index.html**

Add this line after the `css/components/progress.css` link (the last CSS link in `<head>`):

```html
  <link rel="stylesheet" href="css/components/roadmap.css" />
```

- [ ] **Step 3: Verify in browser**

Run: `npx serve .`, open printed URL, navigate to `#/roadmap`.
Expected: 4 unit cards render in order. Unit 1 shows "3 lessons · N% complete" (or whatever the actual seeded lesson count is); Units 2-4 show "Content coming soon · N% complete". Progress bars reflect `localStorage.ailp:progress`'s current `unitProgress` values (0% on a fresh/reset state). Click a unit's "Start" link — confirm navigation to `#/unit-N` (still Coming Soon, expected — next sub-project's job). Temporarily rename `json/course.json` (e.g. to `course.json.bak`), reload `#/roadmap`, confirm the graceful error message renders instead of a blank page or console-only failure; rename it back afterward.

If no browser is available in your environment, do a structural trace instead (confirm the route table change, the CSS link insertion point, that `roadmap.js`'s imports resolve to real exports, and that the fetch/error-handling logic matches `sidebar.js`'s established `nav.json` pattern) and report that live-browser verification wasn't possible — consistent with how every prior phase's tasks handled this environment limitation.

- [ ] **Step 4: Commit**

```bash
git add js/router.js index.html
git commit -m "feat: wire Roadmap view into router"
```

---

## Self-Review Notes

- **Spec coverage:** `course.json` with Unit 1 real lesson titles + Units 2-4 placeholders, shared `unit-N` id scheme with existing routes/progress keys (Task 1) ✓; Roadmap page with heading + unit cards (title/description/lesson-count/progress-bar/link) (Task 2, 3) ✓; no locking, all units always linked (Task 3) ✓; fetch error handling mirroring `sidebar.js`'s exact `nav.json` pattern (try/catch, `res.ok` check, array-shape validation, graceful degraded render instead of throwing) (Task 3) ✓; router wiring replacing Coming Soon (Task 4) ✓; `unit-1`..`unit-4` routes explicitly left as Coming Soon, out of scope for this sub-project ✓.
- **Type consistency:** `getState()` import/usage matches `progress-store.js`'s actual export and `unitProgress` shape. `unit.id` values in `course.json` (Task 1) are read identically in `roadmap.js` (Task 3) as both the `unitProgress` lookup key and the `#/${unit.id}` route link — one identifier, no mismatch risk. `mount(container)`/`unmount()` signature matches the router's generic call site; `mount` is `async` here (unlike most prior read-only modules) because of the `fetch` — the router's existing `await entry.load()` / `mod.mount(mainEl, entry.meta)` call site in `js/router.js` already handles this fine since `mount` being async just means `mod.mount(...)` returns a promise the router doesn't currently await, matching how `sidebar.js`'s async `renderSidebar` is already called with `await` from `main.js` but router-mounted modules' `mount()` calls are fire-and-forget today (same as every other module) — no change needed to `router.js` beyond the route table swap.
- **No placeholders:** every step has runnable code or an explicit manual-verification action; no TBD/TODO markers.
