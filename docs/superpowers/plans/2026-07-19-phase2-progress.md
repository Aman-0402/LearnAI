# Phase 2 Progress Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `#/progress` Coming Soon placeholder with a working Progress page: the same 4 top-line stats the Dashboard already shows, plus a full per-unit breakdown (name, percentage, bar, "Continue" link) that the Dashboard's condensed panel doesn't provide.

**Architecture:** New `js/modules/progress/progress.js` view module (`mount`/`unmount` contract). No new storage module — reads live from the existing `js/storage/progress-store.js` (`getState`, `getOverallProgressPercent`). Reuses `.dashboard__stats`/`.stat-card` CSS classes already defined in `css/components/dashboard.css` for the stat row; only the unit-breakdown section gets new CSS. A one-entry swap in `js/router.js`'s route table.

**Tech Stack:** Same as prior Phase 2 sub-projects — vanilla ES6 modules, no bundler, no test framework, manual browser verification.

---

### Task 1: Progress page styles

**Files:**
- Create: `css/components/progress.css`

- [ ] **Step 1: Write progress.css**

```css
/* css/components/progress.css */
.progress {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.progress__units {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.progress-unit-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.progress-unit-card__top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-3);
}

.progress-unit-card__label {
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 1.0625rem;
}

.progress-unit-card__percent {
  font-family: var(--font-mono);
  color: var(--color-text-muted);
  font-size: 0.9375rem;
}

.progress-unit-card__bar {
  height: 8px;
  background: var(--color-bg);
  border-radius: 999px;
  overflow: hidden;
}

.progress-unit-card__fill {
  height: 100%;
  background: var(--color-primary);
  border-radius: 999px;
}

.progress-unit-card__link {
  align-self: flex-start;
  color: var(--color-primary);
  font-weight: 600;
  text-decoration: none;
  font-size: 0.9375rem;
}

.progress-unit-card__link:hover {
  text-decoration: underline;
}
```

- [ ] **Step 2: Verify CSS is syntactically valid**

Not linked into `index.html` yet (Task 3). Confirm brace balance and that every `var(--...)` reference used above exists in `css/tokens.css`. Confirm `css/components/dashboard.css` (already linked in `index.html` from Phase 1) already defines `.dashboard__stats` and `.stat-card`/`.stat-card__label` — this new file intentionally does NOT redefine those, since Task 2's JS will reuse them directly by class name.

- [ ] **Step 3: Commit**

```bash
git add css/components/progress.css
git commit -m "feat: add progress page styles"
```

---

### Task 2: Progress view module

**Files:**
- Create: `js/modules/progress/progress.js`

- [ ] **Step 1: Write progress.js**

```js
// js/modules/progress/progress.js
import { createEl } from "../../utils/dom.js";
import { getState, getOverallProgressPercent } from "../../storage/progress-store.js";

export function mount(container) {
  render(container);
}

export function unmount() {
  /* no-op: read-only view, nothing to clean up */
}

function unitLabel(key) {
  const match = key.match(/^unit-(\d+)$/);
  return match ? `Unit ${match[1]}` : key;
}

function render(container) {
  container.innerHTML = "";

  const state = getState();
  const overall = getOverallProgressPercent();

  const heading = createEl("h1", { text: "Progress" });

  const stats = createEl("div", {
    className: "dashboard__stats",
    children: [
      renderStat("XP", state.xp),
      renderStat("Streak", `${state.streak} days`),
      renderStat("Learning Time", `${state.learningTime} min`),
      renderStat("Overall", `${overall}%`)
    ]
  });

  const unitEntries = Object.entries(state.unitProgress);
  const units = createEl("div", {
    className: "progress__units",
    children: unitEntries.map(([key, percent]) => renderUnitCard(key, percent))
  });

  container.appendChild(
    createEl("div", { className: "progress", children: [heading, stats, units] })
  );
}

function renderStat(label, value) {
  return createEl("div", {
    className: "stat-card",
    children: [
      createEl("span", { className: "stat-card__label", text: label }),
      createEl("span", { className: "stat-card__value", text: String(value) })
    ]
  });
}

function renderUnitCard(key, percent) {
  const fill = createEl("div", { className: "progress-unit-card__fill" });
  fill.style.width = `${percent}%`;

  return createEl("div", {
    className: "progress-unit-card",
    children: [
      createEl("div", {
        className: "progress-unit-card__top",
        children: [
          createEl("div", { className: "progress-unit-card__label", text: unitLabel(key) }),
          createEl("div", { className: "progress-unit-card__percent", text: `${percent}%` })
        ]
      }),
      createEl("div", { className: "progress-unit-card__bar", children: [fill] }),
      createEl("a", {
        className: "progress-unit-card__link",
        text: "Continue",
        attrs: { href: `#/${key}` }
      })
    ]
  });
}
```

- [ ] **Step 2: Verify with node --check**

Run: `node --check js/modules/progress/progress.js`
Expected: no output (syntax OK).

- [ ] **Step 3: Verify class name reuse against dashboard.css**

Confirmed already: `css/components/dashboard.css` defines `.dashboard__stats`, `.stat-card`, `.stat-card__label`, `.stat-card__value`, and `js/modules/dashboard/dashboard.js` builds the label/value pair as `<span>` elements (not `<div>`) — the code above already uses `createEl("span", ...)` to match exactly. Just re-confirm these class names still exist unchanged in your checkout before proceeding.

- [ ] **Step 4: Commit**

```bash
git add js/modules/progress/progress.js
git commit -m "feat: add Progress view (stats + per-unit breakdown)"
```

---

### Task 3: Wire Progress into the router and index.html

**Files:**
- Modify: `js/router.js`
- Modify: `index.html`

- [ ] **Step 1: Update the `progress` route table entry in router.js**

Find this existing entry in `routeTable`:

```js
  progress: {
    load: () => import("./modules/coming-soon/coming-soon.js"),
    meta: { title: "Progress", phase: "Phase 2" }
  },
```

Replace it with:

```js
  progress: {
    load: () => import("./modules/progress/progress.js")
  },
```

Leave every other route table entry untouched.

- [ ] **Step 2: Add progress.css link to index.html**

Add this line after the `css/components/search.css` link (the last CSS link in `<head>`):

```html
  <link rel="stylesheet" href="css/components/progress.css" />
```

Note: `css/components/dashboard.css` is already linked from Phase 1 (required for the reused `.dashboard__stats`/`.stat-card` classes) — do not add a duplicate link.

- [ ] **Step 3: Verify in browser**

Run: `npx serve .`, open printed URL, navigate to `#/progress`.
Expected: 4 stat cards render (XP, Streak, Learning Time, Overall) matching the Dashboard's visual style. Below them, 4 unit cards each show a label ("Unit 1".."Unit 4"), a percentage, a progress bar reflecting that percentage, and a "Continue" link. Click a unit's Continue link — confirm it navigates to `#/unit-N` (which shows the Phase 5 Coming Soon placeholder, expected). Reset progress via Settings, reload `#/progress`, confirm everything shows 0.

If no browser is available in your environment, do a structural trace instead (confirm the route table change, the CSS link insertion point, that progress.js's imports resolve to real exports, and that the reused stat-card class names genuinely match what `dashboard.css`/`dashboard.js` define) and report that live-browser verification wasn't possible — consistent with how prior Phase 1/2 tasks handled this environment limitation.

- [ ] **Step 4: Commit**

```bash
git add js/router.js index.html
git commit -m "feat: wire Progress view into router"
```

---

## Self-Review Notes

- **Spec coverage:** reused stat-card row (Task 2) ✓, no new storage module, reads `progress-store.js`'s `getState`/`getOverallProgressPercent` (Task 2) ✓, per-unit breakdown with label/percent/bar/Continue-link derived from `unitProgress` keys, no hardcoded second source of truth (Task 2) ✓, new unit-card CSS distinct from stat-card reuse (Task 1) ✓, router wiring replacing Coming Soon (Task 3) ✓, out-of-scope items (history/trends, lesson granularity, reset action, achievements) correctly absent from all tasks ✓.
- **Type consistency:** `getState()`/`getOverallProgressPercent()` import/usage matches `progress-store.js`'s actual exports and return shape. `mount(container)`/`unmount()` signature matches the router's generic call site, consistent with every prior Phase 2 module. Task 2 Step 3 explicitly requires verifying the real `.stat-card` value class name against `dashboard.js`/`dashboard.css` rather than assuming — flagged here so the implementer doesn't silently guess wrong and produce unstyled stat values.
- **No placeholders:** every step has runnable code or an explicit manual-verification action; no TBD/TODO markers.
