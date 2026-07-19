# Phase 1 — Project Foundation: Design

## Goal

Build the static app shell for the Interactive AI Learning Platform: theme system, sidebar, topbar, hash router, and a fully working Dashboard (empty-state, since no lesson content exists yet). All other sidebar destinations render a shared "Coming Soon" placeholder. Frontend-only, no build tooling — runs directly as static files, deployable to GitHub Pages.

## Architecture

Static multi-file frontend using native ES6 modules (`<script type="module">`), no bundler. A single `index.html` loads the shell once; a hash-based router (`#/dashboard`, `#/unit-2`, `#/ai-lab`, ...) swaps the contents of `<main>` by mounting view modules. Hash routing was chosen over in-memory view state because GitHub Pages serves purely static files — hash routes require zero server config, survive page refresh, and are deep-linkable/bookmarkable, at negligible extra complexity over a single-file router table.

### Folder structure

```
/
├── index.html
├── css/
│   ├── tokens.css          # color/spacing/radius/shadow/type CSS custom properties (light + dark)
│   ├── base.css             # reset, base typography
│   ├── layout.css           # shell grid: sidebar + topbar + content area
│   └── components/          # button.css, card.css, sidebar.css, topbar.css, stat-card.css, ...
├── js/
│   ├── main.js               # app bootstrap: mounts shell, starts router
│   ├── router.js             # hash router: route table -> view module mount(container)
│   ├── modules/
│   │   ├── shell/
│   │   │   ├── sidebar.js     # renders nav from json/nav.json, active-route highlight, drawer toggle
│   │   │   ├── topbar.js      # logo, search stub, streak badge, theme toggle
│   │   │   └── theme-toggle.js
│   │   ├── dashboard/
│   │   │   └── dashboard.js   # + subcomponents (hero, stat-strip, unit-progress, recommended-lesson)
│   │   └── coming-soon/
│   │       └── coming-soon.js # shared placeholder view for unbuilt routes
│   ├── utils/
│   │   └── dom.js             # small DOM helper functions (createEl, qs, etc.)
│   └── storage/
│       ├── theme-store.js     # get/set theme, defaults to system preference
│       └── progress-store.js  # get/set xp, streak, learning-time, per-unit progress
├── json/
│   └── nav.json                # sidebar nav structure: icon, label, route, section
└── assets/
    └── icons/                   # Lucide icons (CDN primary, local SVG fallback)
```

## Routing

`js/router.js` maintains a route table mapping hash paths to view modules exposing a `mount(container)` function. On `hashchange` (and initial load), the router:

1. Parses the current hash.
2. Looks up the matching view module; unmounts the previous view if it exposes `unmount()`.
3. Mounts the new view into `<main>`.
4. Updates the sidebar's active-route highlight.

Routes without a built view (`#/unit-1` through `#/unit-4`, `#/ai-lab`, `#/flashcards`, `#/bookmarks`, `#/notes`, `#/search`, `#/progress`, `#/achievements`, `#/settings`, `#/roadmap`) all resolve to the shared `ComingSoonView` — same card styling/icon system as the rest of the app, with a "Coming in Phase X" message referencing the relevant phase from the master plan. Invalid/unknown hashes fall back to `#/dashboard`.

## Shell Components

**Topbar** (sticky, above content): logo, global search input (visually present, non-functional — wired in Phase 2), streak badge (🔥 reads from `progress-store`, shows 0 initially), theme toggle (☀/☾ icon button).

**Sidebar** (collapses to off-canvas drawer + hamburger trigger under 1024px): renders entirely from `json/nav.json` — one entry per item with icon, label, route, and section grouping (main nav vs. bottom-pinned block). Bottom-pinned block shows Overall Progress bar, Current Lesson mini-card, Daily Streak, Learning Time — all reading live (currently empty/zero) values from `progress-store.js`.

**Dashboard** (only fully-built page this phase): top-to-bottom —
1. "Continue Learning" hero — empty state (icon + "Start your journey" message + CTA button routing to `#/roadmap`, which itself shows Coming Soon for now).
2. Stat strip — four cards: XP, Streak, Learning Time, Course Progress %, all sourced from `progress-store.js` (all zero/empty initially).
3. Two-column row — Unit Progress list (Unit 1–4, each 0%) alongside a Recommended Lesson card (hardcoded pointer to "Unit 1 → Lesson 1" until real lesson data exists in Phase 5).

## Data & State

- `json/nav.json` is the single source of truth for sidebar structure — adding/reordering nav items means editing this file only, not sidebar.js logic.
- `js/storage/*.js` wrap `localStorage` with typed get/set functions and safe defaults (`theme`, `xp: 0`, `streak: 0`, `learningTime: 0`, `progress: {}`). No other JSON data is needed this phase; course/unit/lesson JSON structures are introduced in Phase 5.

## Styling

`tokens.css` defines the full palette and typography from the project spec as CSS custom properties, with light (`#F8FAFC` background) and dark (`#020617` background) variants toggled via a `data-theme` attribute on `<html>`. Fonts: Manrope (headings), Inter (body), JetBrains Mono (metrics/code), loaded via Google Fonts CDN with a system-font fallback stack so the UI degrades gracefully offline.

**Theme default**: on first load (no stored preference), theme follows `prefers-color-scheme` (falls back to light if unsupported). Once a user manually toggles, that choice is persisted to `localStorage` and takes precedence over system preference on all future loads.

## Error Handling

- Router: unknown/invalid hash silently redirects to `#/dashboard`.
- Storage wrappers: `try/catch` around `JSON.parse`; corrupted or missing localStorage values fall back to documented defaults rather than throwing.

## Testing / Verification

No test framework (frontend-only, no build tooling per project constraints). Verification is manual: serve the folder with a local static server, confirm all sidebar routes navigate correctly with active-state highlighting, confirm the responsive breakpoint collapses the sidebar into a hamburger drawer, confirm theme toggle persists across reload, confirm Dashboard renders correctly in its all-empty state.

## Out of Scope (this phase)

- Any real lesson/course content or JSON (Phase 5+).
- Working search, notes, bookmarks, flashcards, achievements logic (Phase 2+).
- AI Lab simulations (Phase 4).
- Any animation library integration (GSAP/Lottie) beyond what's needed for basic shell polish — full interactive component work is Phase 3.
