# Phase 1 Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the static app shell (theme system, sidebar, topbar, hash router) and a fully working empty-state Dashboard, deployable as-is on GitHub Pages.

**Architecture:** Native ES6 modules, no bundler. `index.html` loads the shell once; `js/router.js` swaps `<main>` content by dynamically importing and mounting view modules keyed off `location.hash`. All nav structure lives in `json/nav.json`; all persisted state (theme, xp, streak, learning time, per-unit progress) lives behind small `js/storage/*.js` wrappers around `localStorage`.

**Tech Stack:** HTML5, CSS3 (custom properties for theming), vanilla ES6 modules, Lucide icons (CDN), Google Fonts (Manrope/Inter/JetBrains Mono CDN). No test framework — this project has no build/test tooling per spec, so every task ends with a manual browser-verification step instead of an automated test.

**Local server for verification:** GitHub Pages serves static files, and `file://` breaks ES module imports (CORS). Use any static server, e.g. `npx serve .` or `python -m http.server 8080`, run from the repo root, for every verification step below.

---

### Task 1: Design tokens (colors, spacing, type, radius, shadow)

**Files:**
- Create: `css/tokens.css`

- [ ] **Step 1: Write the tokens file**

```css
/* css/tokens.css */
:root {
  /* Brand */
  --color-primary: #2563EB;
  --color-secondary: #4F46E5;
  --color-accent: #7C3AED;
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-error: #EF4444;

  /* Surfaces - light (default) */
  --color-bg: #F8FAFC;
  --color-surface: #FFFFFF;
  --color-border: #E2E8F0;
  --color-text: #0F172A;
  --color-text-muted: #64748B;

  /* Card */
  --radius-card: 18px;
  --radius-control: 10px;
  --shadow-card: 0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px rgba(15, 23, 42, 0.06);

  /* Spacing scale */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-7: 48px;

  /* Typography */
  --font-heading: "Manrope", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --font-body: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, SFMono-Regular, monospace;

  /* Layout */
  --sidebar-width: 264px;
  --sidebar-width-collapsed: 0px;
  --topbar-height: 64px;

  /* Motion */
  --ease-standard: cubic-bezier(0.4, 0, 0.2, 1);
  --duration-fast: 150ms;
  --duration-base: 250ms;
}

[data-theme="dark"] {
  --color-bg: #020617;
  --color-surface: #0F172A;
  --color-border: #1E293B;
  --color-text: #F1F5F9;
  --color-text-muted: #94A3B8;
  --shadow-card: 0 1px 2px rgba(0, 0, 0, 0.3), 0 8px 24px rgba(0, 0, 0, 0.35);
}
```

- [ ] **Step 2: Verify in browser**

Create a temporary `css/tokens.css` sanity check is not needed yet — token files have no visible output on their own. Skip to Task 2 where `base.css` consumes these variables and becomes visually verifiable.

- [ ] **Step 3: Commit**

```bash
git add css/tokens.css
git commit -m "feat: add design tokens for light/dark theming"
```

---

### Task 2: Base reset + typography + font loading

**Files:**
- Create: `css/base.css`
- Create: `index.html` (minimal skeleton, expanded in later tasks)

- [ ] **Step 1: Write base.css**

```css
/* css/base.css */
*,
*::before,
*::after {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  padding: 0;
}

body {
  background: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-body);
  font-size: 16px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  transition: background var(--duration-base) var(--ease-standard),
    color var(--duration-base) var(--ease-standard);
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
  font-weight: 700;
  margin: 0 0 var(--space-3) 0;
  color: var(--color-text);
}

p {
  margin: 0 0 var(--space-3) 0;
}

a {
  color: var(--color-primary);
  text-decoration: none;
}

button, input {
  font-family: inherit;
  font-size: inherit;
}

code, kbd, pre {
  font-family: var(--font-mono);
}

:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
```

- [ ] **Step 2: Write minimal index.html skeleton**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AI Learning Platform</title>

  <!-- Inline FOUC-prevention: sets data-theme before first paint, before any module loads.
       Duplicates the 3-line resolution logic in js/storage/theme-store.js on purpose -
       an ES module import cannot run synchronously before paint. -->
  <script>
    (function () {
      var stored = localStorage.getItem("ailp:theme");
      var theme = stored || (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
      document.documentElement.setAttribute("data-theme", theme);
    })();
  </script>

  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@500;700;800&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />

  <link rel="stylesheet" href="css/tokens.css" />
  <link rel="stylesheet" href="css/base.css" />
</head>
<body>
  <div id="app">
    <p style="padding: 24px;">Loading...</p>
  </div>

  <script type="module" src="js/main.js"></script>
</body>
</html>
```

- [ ] **Step 3: Write placeholder main.js so the page doesn't error**

```js
// js/main.js
console.log("AI Learning Platform booting...");
```

- [ ] **Step 4: Verify in browser**

Run: `npx serve .` (or `python -m http.server 8080`) from repo root, open the printed URL.
Expected: page shows "Loading..." text in Inter font on `#F8FAFC` background (or dark equivalent if OS is in dark mode), no console errors.

- [ ] **Step 5: Commit**

```bash
git add css/base.css index.html js/main.js
git commit -m "feat: add base styles and index.html skeleton"
```

---

### Task 3: Sidebar navigation data

**Files:**
- Create: `json/nav.json`

- [ ] **Step 1: Write nav.json**

```json
{
  "main": [
    { "id": "dashboard", "label": "Dashboard", "route": "dashboard", "icon": "layout-dashboard" },
    { "id": "roadmap", "label": "Course Roadmap", "route": "roadmap", "icon": "map", "phase": "Phase 5" },
    { "id": "unit-1", "label": "Unit 1", "route": "unit-1", "icon": "book-open", "phase": "Phase 5" },
    { "id": "unit-2", "label": "Unit 2", "route": "unit-2", "icon": "book-open", "phase": "Phase 5" },
    { "id": "unit-3", "label": "Unit 3", "route": "unit-3", "icon": "book-open", "phase": "Phase 5" },
    { "id": "unit-4", "label": "Unit 4", "route": "unit-4", "icon": "book-open", "phase": "Phase 5" },
    { "id": "ai-lab", "label": "AI Lab", "route": "ai-lab", "icon": "flask-conical", "phase": "Phase 4" },
    { "id": "flashcards", "label": "Flashcards", "route": "flashcards", "icon": "layers", "phase": "Phase 2" },
    { "id": "bookmarks", "label": "Bookmarks", "route": "bookmarks", "icon": "bookmark", "phase": "Phase 2" },
    { "id": "notes", "label": "Notes", "route": "notes", "icon": "notebook-pen", "phase": "Phase 2" },
    { "id": "search", "label": "Search", "route": "search", "icon": "search", "phase": "Phase 2" },
    { "id": "progress", "label": "Progress", "route": "progress", "icon": "trending-up", "phase": "Phase 2" },
    { "id": "achievements", "label": "Achievements", "route": "achievements", "icon": "trophy", "phase": "Phase 2" },
    { "id": "settings", "label": "Settings", "route": "settings", "icon": "settings", "phase": "Phase 2" }
  ]
}
```

- [ ] **Step 2: Verify JSON is valid**

Run: `node -e "JSON.parse(require('fs').readFileSync('json/nav.json','utf8')); console.log('valid')"`
Expected: prints `valid`

- [ ] **Step 3: Commit**

```bash
git add json/nav.json
git commit -m "feat: add sidebar navigation data"
```

---

### Task 4: Storage wrappers (theme + progress)

**Files:**
- Create: `js/storage/theme-store.js`
- Create: `js/storage/progress-store.js`

- [ ] **Step 1: Write theme-store.js**

```js
// js/storage/theme-store.js
const THEME_KEY = "ailp:theme";

export function getSystemTheme() {
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function getStoredTheme() {
  try {
    return localStorage.getItem(THEME_KEY);
  } catch {
    return null;
  }
}

export function setStoredTheme(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* localStorage unavailable (private mode, quota) - theme just won't persist */
  }
}

export function resolveTheme() {
  return getStoredTheme() || getSystemTheme();
}

export function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
}
```

- [ ] **Step 2: Write progress-store.js**

```js
// js/storage/progress-store.js
const PROGRESS_KEY = "ailp:progress";

const DEFAULT_STATE = {
  xp: 0,
  streak: 0,
  learningTime: 0,
  currentLesson: null,
  unitProgress: {
    "unit-1": 0,
    "unit-2": 0,
    "unit-3": 0,
    "unit-4": 0
  }
};

export function getState() {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_STATE,
      ...parsed,
      unitProgress: { ...DEFAULT_STATE.unitProgress, ...(parsed.unitProgress || {}) }
    };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

export function setState(partial) {
  const next = { ...getState(), ...partial };
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(next));
  } catch {
    /* localStorage unavailable - state just won't persist */
  }
  return next;
}

export function getOverallProgressPercent() {
  const { unitProgress } = getState();
  const values = Object.values(unitProgress);
  const total = values.reduce((sum, v) => sum + v, 0);
  return Math.round(total / values.length);
}
```

- [ ] **Step 3: Verify with a scratch script**

Run: `node -e "
globalThis.localStorage = { store:{}, getItem(k){return this.store[k]||null}, setItem(k,v){this.store[k]=v} };
globalThis.window = { matchMedia: () => ({ matches: false }) };
globalThis.document = { documentElement: { setAttribute(){} } };
import('./js/storage/progress-store.js').then(m => {
  console.log(m.getState());
  console.log(m.getOverallProgressPercent());
});
"`
Expected: prints default state object (all zeros) then `0`, no errors.

- [ ] **Step 4: Commit**

```bash
git add js/storage/theme-store.js js/storage/progress-store.js
git commit -m "feat: add localStorage wrappers for theme and progress state"
```

---

### Task 5: DOM helper utility

**Files:**
- Create: `js/utils/dom.js`

- [ ] **Step 1: Write dom.js**

```js
// js/utils/dom.js
export function createEl(tag, { className, text, attrs, children } = {}) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  if (attrs) {
    for (const [key, value] of Object.entries(attrs)) {
      el.setAttribute(key, value);
    }
  }
  if (children) {
    for (const child of children) {
      el.appendChild(child);
    }
  }
  return el;
}

export function qs(selector, root = document) {
  return root.querySelector(selector);
}

export function clearChildren(el) {
  while (el.firstChild) {
    el.removeChild(el.firstChild);
  }
}
```

- [ ] **Step 2: Verify with a scratch script**

Run: `node -e "
globalThis.document = { createElement: (tag) => ({ tag, setAttribute(){}, appendChild(){} }) };
import('./js/utils/dom.js').then(m => {
  const el = m.createEl('div', { className: 'x', text: 'hi' });
  console.log(el.tag, el.className, el.textContent);
});
"`
Expected: prints `div x hi`

- [ ] **Step 3: Commit**

```bash
git add js/utils/dom.js
git commit -m "feat: add createEl/qs/clearChildren DOM helpers"
```

---

### Task 6: Shell layout grid + Lucide icon loading

**Files:**
- Create: `css/layout.css`
- Modify: `index.html`

- [ ] **Step 1: Write layout.css**

```css
/* css/layout.css */
.app-shell {
  display: grid;
  grid-template-columns: var(--sidebar-width) 1fr;
  grid-template-rows: var(--topbar-height) 1fr;
  grid-template-areas:
    "sidebar topbar"
    "sidebar main";
  min-height: 100vh;
}

.app-topbar {
  grid-area: topbar;
  position: sticky;
  top: 0;
  z-index: 20;
}

.app-sidebar {
  grid-area: sidebar;
}

.app-main {
  grid-area: main;
  padding: var(--space-6);
  max-width: 1200px;
  width: 100%;
}

@media (max-width: 1024px) {
  .app-shell {
    grid-template-columns: 1fr;
    grid-template-areas:
      "topbar"
      "main";
  }

  .app-sidebar {
    position: fixed;
    inset: var(--topbar-height) auto 0 0;
    width: var(--sidebar-width);
    transform: translateX(-100%);
    transition: transform var(--duration-base) var(--ease-standard);
    z-index: 30;
  }

  .app-sidebar[data-open="true"] {
    transform: translateX(0);
  }

  .sidebar-scrim {
    display: none;
    position: fixed;
    inset: var(--topbar-height) 0 0 0;
    background: rgba(15, 23, 42, 0.4);
    z-index: 25;
  }

  .sidebar-scrim[data-open="true"] {
    display: block;
  }
}

@media (min-width: 1025px) {
  .sidebar-scrim {
    display: none;
  }
}
```

- [ ] **Step 2: Add Lucide CDN script to index.html `<head>`**

```html
  <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js" defer></script>
```

Add this line right after the Google Fonts `<link rel="stylesheet">` tag, and add `<link rel="stylesheet" href="css/layout.css" />` right after `css/base.css`.

- [ ] **Step 3: Verify in browser**

Run: `npx serve .`, open printed URL, open devtools console.
Expected: no 404s for the Lucide script, `window.lucide` is defined (type `lucide` in console).

- [ ] **Step 4: Commit**

```bash
git add css/layout.css index.html
git commit -m "feat: add shell layout grid and Lucide icon loading"
```

---

### Task 7: Topbar component

**Files:**
- Create: `css/components/topbar.css`
- Create: `js/modules/shell/topbar.js`
- Create: `js/modules/shell/theme-toggle.js`

- [ ] **Step 1: Write topbar.css**

```css
/* css/components/topbar.css */
.topbar {
  height: var(--topbar-height);
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: 0 var(--space-5);
}

.topbar__hamburger {
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text);
  padding: var(--space-2);
}

@media (max-width: 1024px) {
  .topbar__hamburger {
    display: inline-flex;
  }
}

.topbar__logo {
  font-family: var(--font-heading);
  font-weight: 800;
  font-size: 1.125rem;
  color: var(--color-text);
  white-space: nowrap;
}

.topbar__search {
  flex: 1;
  max-width: 420px;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  padding: var(--space-2) var(--space-3);
  color: var(--color-text-muted);
}

.topbar__search input {
  border: none;
  background: transparent;
  outline: none;
  color: var(--color-text);
  width: 100%;
}

.topbar__actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.topbar__streak {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: 0.875rem;
  color: var(--color-text-muted);
  font-family: var(--font-mono);
}

.topbar__theme-toggle {
  background: none;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  padding: var(--space-2);
  cursor: pointer;
  color: var(--color-text);
  display: inline-flex;
}
```

- [ ] **Step 2: Write theme-toggle.js**

```js
// js/modules/shell/theme-toggle.js
import { resolveTheme, applyTheme, setStoredTheme } from "../../storage/theme-store.js";

export function initThemeToggle(buttonEl) {
  let current = resolveTheme();
  applyTheme(current);
  updateIcon(buttonEl, current);

  buttonEl.addEventListener("click", () => {
    current = current === "dark" ? "light" : "dark";
    applyTheme(current);
    setStoredTheme(current);
    updateIcon(buttonEl, current);
  });
}

function updateIcon(buttonEl, theme) {
  buttonEl.innerHTML = "";
  const icon = document.createElement("i");
  icon.setAttribute("data-lucide", theme === "dark" ? "moon" : "sun");
  buttonEl.appendChild(icon);
  if (window.lucide) window.lucide.createIcons();
}
```

- [ ] **Step 3: Write topbar.js**

```js
// js/modules/shell/topbar.js
import { createEl } from "../../utils/dom.js";
import { getState } from "../../storage/progress-store.js";
import { initThemeToggle } from "./theme-toggle.js";

export function renderTopbar({ onHamburgerClick }) {
  const hamburger = createEl("button", {
    className: "topbar__hamburger",
    attrs: { "aria-label": "Toggle navigation menu" }
  });
  hamburger.innerHTML = '<i data-lucide="menu"></i>';
  hamburger.addEventListener("click", onHamburgerClick);

  const logo = createEl("div", { className: "topbar__logo", text: "AI Learning Platform" });

  const search = createEl("div", { className: "topbar__search" });
  search.innerHTML = '<i data-lucide="search"></i>';
  const searchInput = createEl("input", {
    attrs: { type: "text", placeholder: "Search lessons, terms, concepts..." }
  });
  search.appendChild(searchInput);

  const { streak } = getState();
  const streakBadge = createEl("div", {
    className: "topbar__streak",
    text: `\u{1F525} ${streak}`
  });

  const themeToggle = createEl("button", {
    className: "topbar__theme-toggle",
    attrs: { "aria-label": "Toggle color theme" }
  });

  const actions = createEl("div", { className: "topbar__actions", children: [streakBadge, themeToggle] });

  const topbar = createEl("header", {
    className: "topbar",
    attrs: { role: "banner" },
    children: [hamburger, logo, search, actions]
  });

  initThemeToggle(themeToggle);
  if (window.lucide) window.lucide.createIcons();

  return topbar;
}
```

- [ ] **Step 4: Verify (deferred to Task 9 integration)**

Topbar has no standalone mount point yet — visual verification happens in Task 9 once `main.js` wires the full shell. Skip ahead.

- [ ] **Step 5: Commit**

```bash
git add css/components/topbar.css js/modules/shell/topbar.js js/modules/shell/theme-toggle.js
git commit -m "feat: add topbar component with search, streak badge, theme toggle"
```

---

### Task 8: Sidebar component

**Files:**
- Create: `css/components/sidebar.css`
- Create: `js/modules/shell/sidebar.js`

- [ ] **Step 1: Write sidebar.css**

```css
/* css/components/sidebar.css */
.sidebar {
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.sidebar__nav {
  list-style: none;
  margin: 0;
  padding: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.sidebar__link {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  border-radius: var(--radius-control);
  color: var(--color-text-muted);
  font-size: 0.9375rem;
  font-weight: 500;
}

.sidebar__link:hover {
  background: var(--color-bg);
  color: var(--color-text);
}

.sidebar__link[data-active="true"] {
  background: color-mix(in srgb, var(--color-primary) 12%, transparent);
  color: var(--color-primary);
}

.sidebar__bottom {
  margin-top: auto;
  padding: var(--space-4);
  border-top: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.sidebar__progress-bar {
  height: 6px;
  background: var(--color-bg);
  border-radius: 999px;
  overflow: hidden;
}

.sidebar__progress-fill {
  height: 100%;
  background: var(--color-primary);
  border-radius: 999px;
}

.sidebar__stat-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}
```

- [ ] **Step 2: Write sidebar.js**

```js
// js/modules/shell/sidebar.js
import { createEl, clearChildren } from "../../utils/dom.js";
import { getState, getOverallProgressPercent } from "../../storage/progress-store.js";

export async function renderSidebar({ activeRoute }) {
  const navData = await fetch("json/nav.json").then((res) => res.json());

  const list = createEl("ul", { className: "sidebar__nav" });
  for (const item of navData.main) {
    const link = createEl("a", {
      className: "sidebar__link",
      attrs: {
        href: `#/${item.route}`,
        "data-active": String(item.route === activeRoute)
      }
    });
    link.innerHTML = `<i data-lucide="${item.icon}"></i><span>${item.label}</span>`;
    const li = createEl("li", { children: [link] });
    list.appendChild(li);
  }

  const bottom = renderBottomBlock();

  const sidebar = createEl("nav", {
    className: "sidebar",
    attrs: { "aria-label": "Main navigation" },
    children: [list, bottom]
  });

  if (window.lucide) window.lucide.createIcons();

  return sidebar;
}

export function setActiveLink(sidebarEl, activeRoute) {
  const links = sidebarEl.querySelectorAll(".sidebar__link");
  links.forEach((link) => {
    const isActive = link.getAttribute("href") === `#/${activeRoute}`;
    link.setAttribute("data-active", String(isActive));
  });
}

function renderBottomBlock() {
  const state = getState();
  const overall = getOverallProgressPercent();

  const progressLabel = createEl("div", {
    className: "sidebar__stat-row",
    children: [
      createEl("span", { text: "Overall Progress" }),
      createEl("span", { text: `${overall}%` })
    ]
  });

  const progressBar = createEl("div", { className: "sidebar__progress-bar" });
  const progressFill = createEl("div", { className: "sidebar__progress-fill" });
  progressFill.style.width = `${overall}%`;
  progressBar.appendChild(progressFill);

  const currentLesson = createEl("div", {
    className: "sidebar__stat-row",
    children: [
      createEl("span", { text: "Current Lesson" }),
      createEl("span", { text: state.currentLesson || "None yet" })
    ]
  });

  const streak = createEl("div", {
    className: "sidebar__stat-row",
    children: [
      createEl("span", { text: "Daily Streak" }),
      createEl("span", { text: `${state.streak} days` })
    ]
  });

  const time = createEl("div", {
    className: "sidebar__stat-row",
    children: [
      createEl("span", { text: "Learning Time" }),
      createEl("span", { text: `${state.learningTime} min` })
    ]
  });

  return createEl("div", {
    className: "sidebar__bottom",
    children: [progressLabel, progressBar, currentLesson, streak, time]
  });
}
```

- [ ] **Step 3: Verify (deferred to Task 9 integration)**

Sidebar fetches `json/nav.json` and has no standalone mount point yet. Visual verification happens in Task 9.

- [ ] **Step 4: Commit**

```bash
git add css/components/sidebar.css js/modules/shell/sidebar.js
git commit -m "feat: add sidebar component with nav rendering and progress block"
```

---

### Task 9: Wire the shell together in main.js

**Files:**
- Modify: `index.html`
- Modify: `js/main.js`

- [ ] **Step 1: Add remaining CSS links to index.html `<head>`**

Add these two lines after `css/layout.css`:

```html
  <link rel="stylesheet" href="css/components/topbar.css" />
  <link rel="stylesheet" href="css/components/sidebar.css" />
```

- [ ] **Step 2: Replace js/main.js with shell bootstrap**

```js
// js/main.js
import { renderTopbar } from "./modules/shell/topbar.js";
import { renderSidebar, setActiveLink } from "./modules/shell/sidebar.js";
import { createEl } from "./utils/dom.js";

async function bootstrap() {
  const app = document.getElementById("app");
  app.innerHTML = "";

  let sidebarOpen = false;

  const shell = createEl("div", { className: "app-shell" });
  const scrim = createEl("div", { className: "sidebar-scrim" });

  const topbar = renderTopbar({
    onHamburgerClick: () => {
      sidebarOpen = !sidebarOpen;
      sidebarEl.setAttribute("data-open", String(sidebarOpen));
      scrim.setAttribute("data-open", String(sidebarOpen));
    }
  });
  topbar.classList.add("app-topbar");

  const initialRoute = (location.hash.replace(/^#\//, "") || "dashboard");
  const sidebarEl = await renderSidebar({ activeRoute: initialRoute });
  sidebarEl.classList.add("app-sidebar");

  scrim.addEventListener("click", () => {
    sidebarOpen = false;
    sidebarEl.setAttribute("data-open", "false");
    scrim.setAttribute("data-open", "false");
  });

  const main = createEl("main", { className: "app-main", attrs: { id: "main-content" } });

  shell.appendChild(topbar);
  shell.appendChild(sidebarEl);
  shell.appendChild(main);
  app.appendChild(shell);
  app.appendChild(scrim);

  const { initRouter } = await import("./router.js");
  initRouter(main, (activeRoute) => setActiveLink(sidebarEl, activeRoute));
}

bootstrap();
```

Note: `router.js` doesn't exist until Task 11 — this task will error in the browser until then. That's expected; Step 3 below verifies structurally instead.

- [ ] **Step 3: Verify shell renders (router import will 404, that's OK for now)**

Run: `npx serve .`, open printed URL, open devtools console.
Expected: topbar and sidebar render with correct styling and icons; console shows a 404/module error for `./router.js` (expected until Task 11); no other errors.

- [ ] **Step 4: Commit**

```bash
git add index.html js/main.js
git commit -m "feat: wire topbar and sidebar into app shell bootstrap"
```

---

### Task 10: Coming Soon placeholder view

**Files:**
- Create: `css/components/coming-soon.css`
- Create: `js/modules/coming-soon/coming-soon.js`

- [ ] **Step 1: Write coming-soon.css**

```css
/* css/components/coming-soon.css */
.coming-soon {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  padding: var(--space-7);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: var(--space-3);
  max-width: 480px;
  margin: var(--space-7) auto;
}

.coming-soon__icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--color-primary) 12%, transparent);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.coming-soon__phase {
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  background: var(--color-bg);
  border-radius: 999px;
  padding: var(--space-1) var(--space-3);
}
```

- [ ] **Step 2: Write coming-soon.js**

```js
// js/modules/coming-soon/coming-soon.js
import { createEl } from "../../utils/dom.js";

export function mount(container, meta = {}) {
  const { title = "This section", phase = "a future phase" } = meta;

  const icon = createEl("div", { className: "coming-soon__icon" });
  icon.innerHTML = '<i data-lucide="hammer"></i>';

  const heading = createEl("h2", { text: title });
  const body = createEl("p", {
    text: `${title} is being built in ${phase}. Check back soon.`
  });
  const badge = createEl("div", { className: "coming-soon__phase", text: phase });

  const card = createEl("div", {
    className: "coming-soon",
    children: [icon, heading, body, badge]
  });

  container.innerHTML = "";
  container.appendChild(card);

  if (window.lucide) window.lucide.createIcons();
}

export function unmount() {
  /* no listeners/timers to clean up */
}
```

- [ ] **Step 3: Verify (deferred to Task 11 integration)**

This view has no route wiring yet. Verified once `router.js` exists.

- [ ] **Step 4: Commit**

```bash
git add css/components/coming-soon.css js/modules/coming-soon/coming-soon.js
git commit -m "feat: add shared Coming Soon placeholder view"
```

---

### Task 11: Hash router

**Files:**
- Create: `js/router.js`
- Modify: `index.html`

- [ ] **Step 1: Add coming-soon.css link to index.html**

Add after the `sidebar.css` link:

```html
  <link rel="stylesheet" href="css/components/coming-soon.css" />
```

- [ ] **Step 2: Write router.js**

```js
// js/router.js
const routeTable = {
  dashboard: { load: () => import("./modules/dashboard/dashboard.js") },
  roadmap: {
    load: () => import("./modules/coming-soon/coming-soon.js"),
    meta: { title: "Course Roadmap", phase: "Phase 5" }
  },
  "unit-1": {
    load: () => import("./modules/coming-soon/coming-soon.js"),
    meta: { title: "Unit 1", phase: "Phase 5" }
  },
  "unit-2": {
    load: () => import("./modules/coming-soon/coming-soon.js"),
    meta: { title: "Unit 2", phase: "Phase 5" }
  },
  "unit-3": {
    load: () => import("./modules/coming-soon/coming-soon.js"),
    meta: { title: "Unit 3", phase: "Phase 5" }
  },
  "unit-4": {
    load: () => import("./modules/coming-soon/coming-soon.js"),
    meta: { title: "Unit 4", phase: "Phase 5" }
  },
  "ai-lab": {
    load: () => import("./modules/coming-soon/coming-soon.js"),
    meta: { title: "AI Lab", phase: "Phase 4" }
  },
  flashcards: {
    load: () => import("./modules/coming-soon/coming-soon.js"),
    meta: { title: "Flashcards", phase: "Phase 2" }
  },
  bookmarks: {
    load: () => import("./modules/coming-soon/coming-soon.js"),
    meta: { title: "Bookmarks", phase: "Phase 2" }
  },
  notes: {
    load: () => import("./modules/coming-soon/coming-soon.js"),
    meta: { title: "Notes", phase: "Phase 2" }
  },
  search: {
    load: () => import("./modules/coming-soon/coming-soon.js"),
    meta: { title: "Search", phase: "Phase 2" }
  },
  progress: {
    load: () => import("./modules/coming-soon/coming-soon.js"),
    meta: { title: "Progress", phase: "Phase 2" }
  },
  achievements: {
    load: () => import("./modules/coming-soon/coming-soon.js"),
    meta: { title: "Achievements", phase: "Phase 2" }
  },
  settings: {
    load: () => import("./modules/coming-soon/coming-soon.js"),
    meta: { title: "Settings", phase: "Phase 2" }
  }
};

const DEFAULT_ROUTE = "dashboard";

let currentModule = null;

export function initRouter(mainEl, onRouteChange) {
  window.addEventListener("hashchange", () => handleRoute(mainEl, onRouteChange));
  handleRoute(mainEl, onRouteChange);
}

async function handleRoute(mainEl, onRouteChange) {
  const routeId = (location.hash.replace(/^#\//, "") || DEFAULT_ROUTE);
  const entry = routeTable[routeId];

  if (!entry) {
    location.hash = `#/${DEFAULT_ROUTE}`;
    return;
  }

  if (currentModule && typeof currentModule.unmount === "function") {
    currentModule.unmount();
  }

  const mod = await entry.load();
  currentModule = mod;
  mod.mount(mainEl, entry.meta);

  onRouteChange(routeId);
}
```

- [ ] **Step 3: Verify in browser**

Run: `npx serve .`, open printed URL.
Expected: no console errors; navigating to `#/roadmap`, `#/ai-lab`, `#/settings` etc. via the sidebar shows the Coming Soon card with the correct title/phase badge; sidebar active link highlight follows the current route; invalid hash (e.g. manually type `#/nonsense` in the address bar) redirects to `#/dashboard`.

Note: `#/dashboard` itself will still error until Task 12 creates `dashboard.js` — that's expected.

- [ ] **Step 4: Commit**

```bash
git add js/router.js index.html
git commit -m "feat: add hash router with Coming Soon fallback for unbuilt routes"
```

---

### Task 12: Dashboard view

**Files:**
- Create: `css/components/dashboard.css`
- Create: `js/modules/dashboard/dashboard.js`

- [ ] **Step 1: Write dashboard.css**

```css
/* css/components/dashboard.css */
.dashboard {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.dashboard__hero {
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  border-radius: var(--radius-card);
  padding: var(--space-6);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-5);
  flex-wrap: wrap;
}

.dashboard__hero h1 {
  color: #fff;
  font-size: 1.5rem;
  margin-bottom: var(--space-2);
}

.dashboard__hero p {
  color: rgba(255, 255, 255, 0.85);
  margin-bottom: 0;
  max-width: 480px;
}

.dashboard__hero-cta {
  background: #fff;
  color: var(--color-primary);
  border: none;
  border-radius: var(--radius-control);
  padding: var(--space-3) var(--space-5);
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.dashboard__stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-4);
}

@media (max-width: 768px) {
  .dashboard__stats {
    grid-template-columns: repeat(2, 1fr);
  }
}

.stat-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.stat-card__label {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}

.stat-card__value {
  font-family: var(--font-heading);
  font-size: 1.5rem;
  font-weight: 800;
}

.dashboard__row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--space-4);
}

@media (max-width: 900px) {
  .dashboard__row {
    grid-template-columns: 1fr;
  }
}

.panel {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  padding: var(--space-5);
}

.panel h3 {
  font-size: 1.0625rem;
  margin-bottom: var(--space-4);
}

.unit-progress-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-3);
}

.unit-progress-row:last-child {
  margin-bottom: 0;
}

.unit-progress-row__label {
  width: 70px;
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.unit-progress-row .sidebar__progress-bar {
  flex: 1;
}

.unit-progress-row__value {
  width: 40px;
  text-align: right;
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}

.recommended-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.recommended-card__meta {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}
```

- [ ] **Step 2: Write dashboard.js**

```js
// js/modules/dashboard/dashboard.js
import { createEl } from "../../utils/dom.js";
import { getState } from "../../storage/progress-store.js";

export function mount(container) {
  const state = getState();

  container.innerHTML = "";
  container.appendChild(
    createEl("div", {
      className: "dashboard",
      children: [renderHero(), renderStats(state), renderRow(state)]
    })
  );

  if (window.lucide) window.lucide.createIcons();
}

export function unmount() {
  /* no listeners/timers to clean up */
}

function renderHero() {
  const cta = createEl("button", { className: "dashboard__hero-cta", text: "Start your journey" });
  cta.addEventListener("click", () => {
    location.hash = "#/roadmap";
  });

  return createEl("div", {
    className: "dashboard__hero",
    children: [
      createEl("div", {
        children: [
          createEl("h1", { text: "Continue Learning" }),
          createEl("p", { text: "You haven't started a lesson yet. Explore the course roadmap to begin your AI journey." })
        ]
      }),
      cta
    ]
  });
}

function renderStats(state) {
  const overall = Math.round(
    Object.values(state.unitProgress).reduce((sum, v) => sum + v, 0) / Object.values(state.unitProgress).length
  );

  const stats = [
    { label: "XP", value: state.xp },
    { label: "Streak", value: `${state.streak} days` },
    { label: "Learning Time", value: `${state.learningTime} min` },
    { label: "Course Progress", value: `${overall}%` }
  ];

  const cards = stats.map((s) =>
    createEl("div", {
      className: "stat-card",
      children: [
        createEl("span", { className: "stat-card__label", text: s.label }),
        createEl("span", { className: "stat-card__value", text: String(s.value) })
      ]
    })
  );

  return createEl("div", { className: "dashboard__stats", children: cards });
}

function renderRow(state) {
  return createEl("div", {
    className: "dashboard__row",
    children: [renderUnitProgress(state), renderRecommended()]
  });
}

function renderUnitProgress(state) {
  const rows = Object.entries(state.unitProgress).map(([unitId, pct]) => {
    const label = unitId.replace("unit-", "Unit ");
    const bar = createEl("div", { className: "sidebar__progress-bar" });
    const fill = createEl("div", { className: "sidebar__progress-fill" });
    fill.style.width = `${pct}%`;
    bar.appendChild(fill);

    return createEl("div", {
      className: "unit-progress-row",
      children: [
        createEl("span", { className: "unit-progress-row__label", text: label }),
        bar,
        createEl("span", { className: "unit-progress-row__value", text: `${pct}%` })
      ]
    });
  });

  return createEl("div", {
    className: "panel",
    children: [createEl("h3", { text: "Unit Progress" }), ...rows]
  });
}

function renderRecommended() {
  const link = createEl("a", {
    attrs: { href: "#/unit-1" },
    text: "Go to lesson"
  });

  return createEl("div", {
    className: "panel recommended-card",
    children: [
      createEl("h3", { text: "Recommended Lesson" }),
      createEl("span", { text: "Unit 1 – Lesson 1" }),
      createEl("span", { className: "recommended-card__meta", text: "Introduction to Artificial Intelligence" }),
      link
    ]
  });
}
```

- [ ] **Step 3: Add dashboard.css link to index.html**

Add after the `coming-soon.css` link:

```html
  <link rel="stylesheet" href="css/components/dashboard.css" />
```

- [ ] **Step 4: Verify in browser**

Run: `npx serve .`, open printed URL (defaults to `#/dashboard`).
Expected: hero banner renders with gradient + "Start your journey" button (clicking it navigates to `#/roadmap` Coming Soon); four stat cards show 0/0 days/0 min/0%; Unit Progress panel shows Unit 1-4 all at 0%; Recommended Lesson panel shows "Unit 1 – Lesson 1"; no console errors.

- [ ] **Step 5: Commit**

```bash
git add css/components/dashboard.css js/modules/dashboard/dashboard.js index.html
git commit -m "feat: add empty-state Dashboard view"
```

---

### Task 13: Responsive sidebar drawer verification pass

**Files:**
- None (verification-only task; layout.css/topbar.js/main.js already implement this behavior from Tasks 6, 7, 9)

- [ ] **Step 1: Verify desktop layout**

Run: `npx serve .`, open printed URL at a viewport ≥1025px wide.
Expected: sidebar fixed at `264px` on the left, no hamburger icon visible, no scrim.

- [ ] **Step 2: Verify mobile/tablet layout**

Resize devtools viewport to <1024px (e.g. 768px).
Expected: sidebar is hidden off-canvas by default, hamburger icon appears in topbar; clicking it slides the sidebar in from the left and shows a dark scrim behind it; clicking the scrim closes the sidebar.

- [ ] **Step 3: Verify theme toggle persists across reload**

Click the theme toggle button in the topbar, then reload the page.
Expected: theme choice (light/dark) persists after reload, no flash of the wrong theme.

- [ ] **Step 4: No commit needed**

This task is verification-only — nothing to stage.

---

### Task 14: README + final Phase 1 wrap-up commit

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write a minimal README**

```markdown
# Interactive AI Learning Platform

Frontend-only (HTML/CSS/vanilla ES6 modules) interactive learning platform covering
Artificial Intelligence from beginner to university level. No build step, no backend,
deployable directly to GitHub Pages.

## Running locally

Any static file server works, e.g.:

\`\`\`bash
npx serve .
# or
python -m http.server 8080
\`\`\`

Open the printed URL. (Opening `index.html` directly via `file://` will not work —
ES module imports require CORS-safe HTTP(S) serving.)

## Status

**Phase 1 (Foundation) complete:** theme system, responsive sidebar/topbar shell,
hash-based router, empty-state Dashboard. See `docs/superpowers/specs/` and
`docs/superpowers/plans/` for design history.
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add project README for Phase 1"
```

---

## Self-Review Notes

- **Spec coverage:** theme system (Task 1, 4, 7) ✓, sidebar (Task 3, 8) ✓, topbar (Task 7) ✓, hash router (Task 11) ✓, Dashboard hero/stats/unit-progress/recommended (Task 12) ✓, responsive collapse to hamburger (Task 6, 9, 13) ✓, Coming Soon placeholders for unbuilt routes (Task 10, 11) ✓, localStorage persistence for theme/progress (Task 4) ✓, error handling — invalid hash redirect + storage try/catch (Task 4, 11) ✓, GitHub Pages deployability — no bundler, relative paths, verified via static server (all tasks) ✓.
- **Type consistency:** `getState()`/`setState()`/`getOverallProgressPercent()` names match between `progress-store.js` (Task 4) and all three consumers (`sidebar.js` Task 8, `dashboard.js` Task 12). `mount(container, meta)`/`unmount()` signature matches across `coming-soon.js` (Task 10), `dashboard.js` (Task 12), and how `router.js` (Task 11) calls them.
- **No placeholders:** every step has runnable code or an explicit manual-verification action; no TBD/TODO markers.
