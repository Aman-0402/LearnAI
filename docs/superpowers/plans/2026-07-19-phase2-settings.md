# Phase 2 Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `#/settings` Coming Soon placeholder with a working Settings page: theme mode (light/dark/system), reduced-motion preference, daily learning-goal minutes, and a destructive reset-progress action.

**Architecture:** New `js/modules/settings/settings.js` view module (same `mount`/`unmount` contract as every other view), a new `js/storage/settings-store.js` for the two settings that don't belong elsewhere, one new export each on the existing `theme-store.js` (`clearStoredTheme`) and `progress-store.js` (`resetProgress`), and a one-line swap in `js/router.js`'s route table.

**Tech Stack:** Same as Phase 1 — vanilla ES6 modules, no bundler, no test framework. Verification is manual via local static server.

---

### Task 1: settings-store.js

**Files:**
- Create: `js/storage/settings-store.js`

- [ ] **Step 1: Write settings-store.js**

```js
// js/storage/settings-store.js
const SETTINGS_KEY = "ailp:settings";

const DEFAULT_SETTINGS = {
  reducedMotion: false,
  dailyGoalMinutes: 15
};

export function getSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function setSettings(partial) {
  const next = { ...getSettings(), ...partial };
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  } catch {
    /* localStorage unavailable - settings just won't persist */
  }
  return next;
}
```

- [ ] **Step 2: Verify with a scratch script**

Run: `node -e "
globalThis.localStorage = { store:{}, getItem(k){return this.store[k]||null}, setItem(k,v){this.store[k]=v} };
import('./js/storage/settings-store.js').then(m => {
  console.log(m.getSettings());
  m.setSettings({ dailyGoalMinutes: 30 });
  console.log(m.getSettings());
});
"`
Expected: prints `{ reducedMotion: false, dailyGoalMinutes: 15 }` then `{ reducedMotion: false, dailyGoalMinutes: 30 }`.

- [ ] **Step 3: Commit**

```bash
git add js/storage/settings-store.js
git commit -m "feat: add settings-store for reduced-motion and daily-goal preferences"
```

---

### Task 2: Extend theme-store.js and progress-store.js

**Files:**
- Modify: `js/storage/theme-store.js`
- Modify: `js/storage/progress-store.js`

- [ ] **Step 1: Add `clearStoredTheme` to theme-store.js**

Add this new exported function anywhere after `setStoredTheme` (e.g. right below it):

```js
export function clearStoredTheme() {
  try {
    localStorage.removeItem(THEME_KEY);
  } catch {
    /* localStorage unavailable - nothing to clear */
  }
}
```

Leave every existing function in the file untouched.

- [ ] **Step 2: Add `resetProgress` to progress-store.js**

Add this new exported function anywhere after `setState` (e.g. right below it, before `getOverallProgressPercent`):

```js
export function resetProgress() {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(DEFAULT_STATE));
  } catch {
    /* localStorage unavailable - nothing to reset */
  }
}
```

Leave every existing function in the file untouched.

- [ ] **Step 3: Verify with a scratch script**

Run: `node -e "
globalThis.localStorage = { store:{'ailp:theme':'dark'}, getItem(k){return this.store[k]||null}, setItem(k,v){this.store[k]=v}, removeItem(k){delete this.store[k]} };
import('./js/storage/theme-store.js').then(m => {
  console.log(m.getStoredTheme());
  m.clearStoredTheme();
  console.log(m.getStoredTheme());
});
"`
Expected: prints `dark` then `null`.

Run: `node -e "
globalThis.localStorage = { store:{}, getItem(k){return this.store[k]||null}, setItem(k,v){this.store[k]=v} };
import('./js/storage/progress-store.js').then(m => {
  m.setState({ xp: 500, streak: 10 });
  console.log(m.getState().xp, m.getState().streak);
  m.resetProgress();
  console.log(m.getState().xp, m.getState().streak);
});
"`
Expected: prints `500 10` then `0 0`.

- [ ] **Step 4: Commit**

```bash
git add js/storage/theme-store.js js/storage/progress-store.js
git commit -m "feat: add clearStoredTheme and resetProgress exports"
```

---

### Task 3: Settings page styles

**Files:**
- Create: `css/components/settings.css`

- [ ] **Step 1: Write settings.css**

```css
/* css/components/settings.css */
.settings {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  max-width: 640px;
}

.settings__card {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.settings__card--danger {
  border-color: var(--color-error);
}

.settings__radio-row,
.settings__checkbox-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.settings__number-input {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  padding: var(--space-2) var(--space-3);
  color: var(--color-text);
  width: 120px;
}

.settings__danger-button {
  align-self: flex-start;
  background: var(--color-error);
  color: #fff;
  border: none;
  border-radius: var(--radius-control);
  padding: var(--space-3) var(--space-5);
  font-weight: 600;
  cursor: pointer;
}
```

- [ ] **Step 2: Verify CSS is syntactically valid**

No standalone visual output yet (not linked into `index.html` until Task 5). Confirm brace balance and no typoed custom-property names against `css/tokens.css`.

- [ ] **Step 3: Commit**

```bash
git add css/components/settings.css
git commit -m "feat: add settings page styles"
```

---

### Task 4: Settings view module

**Files:**
- Create: `js/modules/settings/settings.js`

- [ ] **Step 1: Write settings.js**

```js
// js/modules/settings/settings.js
import { createEl } from "../../utils/dom.js";
import {
  getStoredTheme,
  applyTheme,
  setStoredTheme,
  clearStoredTheme,
  getSystemTheme
} from "../../storage/theme-store.js";
import { getSettings, setSettings } from "../../storage/settings-store.js";
import { resetProgress } from "../../storage/progress-store.js";

export function mount(container) {
  container.innerHTML = "";
  container.appendChild(
    createEl("div", {
      className: "settings",
      children: [renderAppearanceCard(), renderLearningCard(), renderDataCard()]
    })
  );
}

export function unmount() {
  /* no listeners/timers to clean up */
}

function renderAppearanceCard() {
  const stored = getStoredTheme();

  const radioRows = ["light", "dark", "system"].map((value) => {
    const isChecked = value === "system" ? stored === null : stored === value;

    const input = createEl("input", {
      attrs: { type: "radio", name: "theme-mode", value, id: `theme-${value}` }
    });
    input.checked = isChecked;
    input.addEventListener("change", () => {
      if (value === "system") {
        clearStoredTheme();
        applyTheme(getSystemTheme());
      } else {
        applyTheme(value);
        setStoredTheme(value);
      }
    });

    const label = createEl("label", {
      attrs: { for: `theme-${value}` },
      text: value.charAt(0).toUpperCase() + value.slice(1)
    });

    return createEl("div", { className: "settings__radio-row", children: [input, label] });
  });

  const settings = getSettings();
  const reducedMotionCheckbox = createEl("input", {
    attrs: { type: "checkbox", id: "reduced-motion" }
  });
  reducedMotionCheckbox.checked = settings.reducedMotion;
  reducedMotionCheckbox.addEventListener("change", (event) => {
    const checked = event.target.checked;
    setSettings({ reducedMotion: checked });
    document.documentElement.setAttribute("data-reduced-motion", String(checked));
  });

  const reducedMotionRow = createEl("div", {
    className: "settings__checkbox-row",
    children: [
      reducedMotionCheckbox,
      createEl("label", { attrs: { for: "reduced-motion" }, text: "Reduce motion" })
    ]
  });

  return createEl("div", {
    className: "panel settings__card",
    children: [createEl("h2", { text: "Appearance" }), ...radioRows, reducedMotionRow]
  });
}

function renderLearningCard() {
  const settings = getSettings();

  const label = createEl("label", {
    attrs: { for: "daily-goal" },
    text: "Daily goal (minutes)"
  });

  const input = createEl("input", {
    className: "settings__number-input",
    attrs: { type: "number", id: "daily-goal", min: "5", max: "240", step: "5" }
  });
  input.value = settings.dailyGoalMinutes;

  input.addEventListener("change", () => {
    let value = parseInt(input.value, 10);
    if (Number.isNaN(value)) value = 15;
    value = Math.min(240, Math.max(5, value));
    input.value = value;
    setSettings({ dailyGoalMinutes: value });
  });

  return createEl("div", {
    className: "panel settings__card",
    children: [createEl("h2", { text: "Learning" }), label, input]
  });
}

function renderDataCard() {
  const button = createEl("button", {
    className: "settings__danger-button",
    text: "Reset Progress"
  });

  button.addEventListener("click", () => {
    const confirmed = confirm(
      "This will permanently erase your XP, streak, and unit progress. This cannot be undone. Continue?"
    );
    if (confirmed) {
      resetProgress();
      location.reload();
    }
  });

  return createEl("div", {
    className: "panel settings__card settings__card--danger",
    children: [
      createEl("h2", { text: "Data" }),
      createEl("p", { text: "Permanently clear your saved learning progress." }),
      button
    ]
  });
}
```

- [ ] **Step 2: Verify with node --check**

Run: `node --check js/modules/settings/settings.js`
Expected: no output (syntax OK).

- [ ] **Step 3: Commit**

```bash
git add js/modules/settings/settings.js
git commit -m "feat: add Settings view (appearance, learning goal, data reset)"
```

---

### Task 5: Wire Settings into the router and index.html

**Files:**
- Modify: `js/router.js`
- Modify: `index.html`

- [ ] **Step 1: Update the `settings` route table entry in router.js**

Find this existing entry in `routeTable`:

```js
  settings: {
    load: () => import("./modules/coming-soon/coming-soon.js"),
    meta: { title: "Settings", phase: "Phase 2" }
  },
```

Replace it with:

```js
  settings: {
    load: () => import("./modules/settings/settings.js")
  },
```

Leave every other route table entry untouched.

- [ ] **Step 2: Add settings.css link to index.html**

Add this line after the `css/components/dashboard.css` link (the last CSS link in `<head>`):

```html
  <link rel="stylesheet" href="css/components/settings.css" />
```

- [ ] **Step 3: Verify in browser**

Run: `npx serve .`, open printed URL, navigate to `#/settings`.
Expected: three cards render (Appearance, Learning, Data). Theme radios reflect current theme (System checked on first-ever visit since no theme is stored yet, unless a previous session already set one). Clicking Light/Dark immediately changes the page theme and topbar toggle icon stays in sync. Checking "Reduce motion" persists across reload (check via devtools → Application → Local Storage → `ailp:settings`). Changing daily goal and reloading shows the saved value. Clicking "Reset Progress" shows a confirm dialog; confirming clears `ailp:progress` in localStorage and reloads the page, with the sidebar's Overall Progress/Streak/Learning Time all back to zero and the Dashboard stat cards back to zero.

If no browser is available in your environment, do a structural trace instead (confirm the route table change is syntactically correct, confirm the CSS link insertion point, confirm `js/modules/settings/settings.js`'s imports resolve to the real exports added in Tasks 1-2) and report that live-browser verification wasn't possible — consistent with how Phase 1 tasks handled this environment limitation.

- [ ] **Step 4: Commit**

```bash
git add js/router.js index.html
git commit -m "feat: wire Settings view into router"
```

---

## Self-Review Notes

- **Spec coverage:** Appearance card with theme radios + reduced-motion (Task 4) ✓, Learning card with daily-goal input (Task 4) ✓, Data card with confirm-gated reset (Task 4) ✓, settings-store.js with try/catch defaults (Task 1) ✓, theme-store.js `clearStoredTheme` (Task 2) ✓, progress-store.js `resetProgress` (Task 2) ✓, router wiring replacing Coming Soon (Task 5) ✓, one-source-of-truth theme ownership — settings.js calls theme-store.js's own functions rather than duplicating theme logic (Task 4) ✓.
- **Type consistency:** `getSettings()`/`setSettings()` names and shape (`{reducedMotion, dailyGoalMinutes}`) match between `settings-store.js` (Task 1) and `settings.js` (Task 4). `clearStoredTheme`/`getSystemTheme`/`applyTheme`/`setStoredTheme`/`getStoredTheme` import names in `settings.js` (Task 4) match the exports added/existing in `theme-store.js` (Task 2 + pre-existing). `resetProgress` import name matches its export (Task 2 → Task 4). `mount(container)`/`unmount()` signature matches the router's generic call site (`mod.mount(mainEl, entry.meta)` — `settings.js`'s `mount` only declares one param, extra arg silently dropped, same pattern already verified safe for `dashboard.js` in Phase 1).
- **No placeholders:** every step has runnable code or an explicit manual-verification action; no TBD/TODO markers.
