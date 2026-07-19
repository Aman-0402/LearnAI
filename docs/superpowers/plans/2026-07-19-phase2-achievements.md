# Phase 2 Achievements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `#/achievements` Coming Soon placeholder with a working Achievements page: a grid of 7 badges, each locked or unlocked based on the existing progress state already tracked by `js/storage/progress-store.js`.

**Architecture:** New `js/modules/achievements/achievements.js` view module (`mount`/`unmount` contract) with a static, module-level `ACHIEVEMENTS` array defining each badge and its unlock condition. No new storage module — achievements are derived by reading `getState()` from the existing `js/storage/progress-store.js`. A one-entry swap in `js/router.js`'s route table.

**Tech Stack:** Same as Phase 1/Settings/Notes/Bookmarks — vanilla ES6 modules, no bundler, no test framework, manual browser verification. Icons via the Lucide UMD global already loaded in `index.html`.

---

### Task 1: Achievements page styles

**Files:**
- Create: `css/components/achievements.css`

- [ ] **Step 1: Write achievements.css**

```css
/* css/components/achievements.css */
.achievements {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.achievements__summary {
  color: var(--color-text-muted);
  font-family: var(--font-mono);
  font-size: 0.9375rem;
}

.achievements__grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-4);
}

@media (max-width: 768px) {
  .achievements__grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.achievement-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-2);
}

.achievement-card--locked {
  opacity: 0.5;
  filter: grayscale(1);
}

.achievement-card__icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--color-primary) 15%, transparent);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.achievement-card--locked .achievement-card__icon {
  background: color-mix(in srgb, var(--color-text-muted) 15%, transparent);
  color: var(--color-text-muted);
}

.achievement-card__icon svg {
  width: 20px;
  height: 20px;
}

.achievement-card__title {
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 1rem;
}

.achievement-card__description {
  color: var(--color-text-muted);
  font-size: 0.875rem;
}
```

- [ ] **Step 2: Verify CSS is syntactically valid**

Not linked into `index.html` yet (Task 3). Confirm brace balance and that every `var(--...)` reference used above exists in `css/tokens.css`: `--space-2`, `--space-4`, `--space-5`, `--color-text-muted`, `--font-mono`, `--color-surface`, `--color-border`, `--radius-card`, `--shadow-card`, `--color-primary`, `--font-heading`.

- [ ] **Step 3: Commit**

```bash
git add css/components/achievements.css
git commit -m "feat: add achievements page styles"
```

---

### Task 2: Achievements view module

**Files:**
- Create: `js/modules/achievements/achievements.js`

- [ ] **Step 1: Write achievements.js**

```js
// js/modules/achievements/achievements.js
import { createEl } from "../../utils/dom.js";
import { getState } from "../../storage/progress-store.js";

const ACHIEVEMENTS = [
  {
    id: "first-steps",
    title: "First Steps",
    description: "Log your first minute of learning time",
    check: (s) => s.learningTime > 0
  },
  {
    id: "xp-100",
    title: "Century",
    description: "Earn 100 XP",
    check: (s) => s.xp >= 100
  },
  {
    id: "xp-500",
    title: "High Achiever",
    description: "Earn 500 XP",
    check: (s) => s.xp >= 500
  },
  {
    id: "streak-3",
    title: "On a Roll",
    description: "Reach a 3-day streak",
    check: (s) => s.streak >= 3
  },
  {
    id: "streak-7",
    title: "Committed",
    description: "Reach a 7-day streak",
    check: (s) => s.streak >= 7
  },
  {
    id: "unit-complete",
    title: "Unit Complete",
    description: "Finish any unit (100%)",
    check: (s) => Object.values(s.unitProgress).some((v) => v >= 100)
  },
  {
    id: "all-units",
    title: "Course Complete",
    description: "Finish all 4 units",
    check: (s) => Object.values(s.unitProgress).every((v) => v >= 100)
  }
];

export function mount(container) {
  render(container);
}

export function unmount() {
  /* no-op: read-only view, nothing to clean up */
}

function render(container) {
  container.innerHTML = "";

  const state = getState();
  const results = ACHIEVEMENTS.map((a) => ({ ...a, unlocked: a.check(state) }));
  const unlockedCount = results.filter((a) => a.unlocked).length;

  const heading = createEl("h1", { text: "Achievements" });

  const summary = createEl("div", {
    className: "achievements__summary",
    text: `${unlockedCount} of ${ACHIEVEMENTS.length} unlocked`
  });

  const grid = createEl("div", {
    className: "achievements__grid",
    children: results.map(renderCard)
  });

  container.appendChild(
    createEl("div", { className: "achievements", children: [heading, summary, grid] })
  );

  if (window.lucide) window.lucide.createIcons();
}

function renderCard(achievement) {
  const iconWrap = createEl("div", { className: "achievement-card__icon" });
  iconWrap.innerHTML = achievement.unlocked ? '<i data-lucide="check"></i>' : '<i data-lucide="lock"></i>';

  return createEl("div", {
    className: achievement.unlocked ? "achievement-card" : "achievement-card achievement-card--locked",
    children: [
      iconWrap,
      createEl("div", { className: "achievement-card__title", text: achievement.title }),
      createEl("div", { className: "achievement-card__description", text: achievement.description })
    ]
  });
}
```

- [ ] **Step 2: Verify with node --check**

Run: `node --check js/modules/achievements/achievements.js`
Expected: no output (syntax OK).

- [ ] **Step 3: Verify the ACHIEVEMENTS logic with a scratch script**

Run: `node -e "
globalThis.localStorage = { store:{}, getItem(k){return this.store[k]||null}, setItem(k,v){this.store[k]=v} };
import('./js/storage/progress-store.js').then(async (store) => {
  const mod = await import('./js/modules/achievements/achievements.js');
  // achievements.js has no exported check-only helper, so this step just confirms
  // getState() shape matches what the module destructures/reads (xp, streak, learningTime, unitProgress).
  console.log(store.getState());
  store.setState({ xp: 100, streak: 3, learningTime: 5, unitProgress: { 'unit-1': 100 } });
  console.log(store.getState());
});
"`
Expected: prints the default state object, then the same object with `xp: 100`, `streak: 3`, `learningTime: 5`, `unitProgress['unit-1']: 100` — confirming the shape `achievements.js`'s `ACHIEVEMENTS[].check` functions read (`s.xp`, `s.streak`, `s.learningTime`, `s.unitProgress`) matches exactly what `progress-store.js` produces.

- [ ] **Step 4: Commit**

```bash
git add js/modules/achievements/achievements.js
git commit -m "feat: add Achievements view (derived from progress state)"
```

---

### Task 3: Wire Achievements into the router and index.html

**Files:**
- Modify: `js/router.js`
- Modify: `index.html`

- [ ] **Step 1: Update the `achievements` route table entry in router.js**

Find this existing entry in `routeTable`:

```js
  achievements: {
    load: () => import("./modules/coming-soon/coming-soon.js"),
    meta: { title: "Achievements", phase: "Phase 2" }
  },
```

Replace it with:

```js
  achievements: {
    load: () => import("./modules/achievements/achievements.js")
  },
```

Leave every other route table entry untouched.

- [ ] **Step 2: Add achievements.css link to index.html**

Add this line after the `css/components/bookmarks.css` link (the last CSS link in `<head>`):

```html
  <link rel="stylesheet" href="css/components/achievements.css" />
```

- [ ] **Step 3: Verify in browser**

Run: `npx serve .`, open printed URL, navigate to `#/achievements`.
Expected: with a fresh/reset progress state (via Settings > Reset Progress, or a fresh browser profile), all 7 badges show locked (dimmed/grayscale, lock icon) and the summary reads "0 of 7 unlocked". Open devtools → Application → Local Storage, edit `ailp:progress` to set `xp` to `150`, `streak` to `5`, and one `unitProgress` value to `100`, reload — confirm "Century" (xp-100), "On a Roll" (streak-3), and "Unit Complete" badges flip to unlocked (checkmark icon, full color) and the summary count updates accordingly, while "High Achiever" (xp-500), "Committed" (streak-7), and "Course Complete" remain locked.

If no browser is available in your environment, do a structural trace instead (confirm the route table change, confirm the CSS link insertion point, confirm `js/modules/achievements/achievements.js`'s import of `getState` resolves to the real export from `js/storage/progress-store.js`) and report that live-browser verification wasn't possible — consistent with how prior Phase 1/2 tasks handled this environment limitation.

- [ ] **Step 4: Commit**

```bash
git add js/router.js index.html
git commit -m "feat: wire Achievements view into router"
```

---

## Self-Review Notes

- **Spec coverage:** no new storage module, derived from `progress-store.js`'s `getState()` (Task 2) ✓; static 7-badge `ACHIEVEMENTS` array with the exact ids/titles/descriptions/check functions from the spec (Task 2) ✓; `h1` heading + "N of 7 unlocked" summary + responsive grid (Task 1, 2) ✓; locked/unlocked visual states via `.achievement-card--locked` modifier (Task 1) ✓; Lucide check/lock icons via the same `innerHTML` + `data-lucide` + `window.lucide.createIcons()` pattern already used in `coming-soon.js`/`topbar.js` (Task 2) ✓; router wiring replacing Coming Soon (Task 3) ✓; no notifications/history/persistence, explicitly out of scope per spec — none added ✓.
- **Type consistency:** `getState()` import/usage in `achievements.js` matches `progress-store.js`'s actual return shape (`{ xp, streak, learningTime, currentLesson, unitProgress: {...} }`) — every `ACHIEVEMENTS[].check` function only reads fields that exist on that shape. `mount(container)`/`unmount()` signature matches the router's generic call site, same pattern verified safe for `dashboard.js`/`settings.js`/`notes.js`/`bookmarks.js`.
- **No placeholders:** every step has runnable code or an explicit manual-verification action; no TBD/TODO markers.
