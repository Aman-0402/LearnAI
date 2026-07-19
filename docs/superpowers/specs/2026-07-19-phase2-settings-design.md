# Phase 2 Sub-project: Settings — Design

## Goal

Replace the "Coming Soon" placeholder at `#/settings` with a working Settings page: theme mode control (light/dark/system), a reduced-motion preference, a daily learning-goal target, and a destructive "reset progress" action. First of several independent Phase 2 sub-projects (Settings, then Notes, Bookmarks, Achievements, Flashcards, Search — each gets its own spec/plan/build cycle).

## Architecture

New route module `js/modules/settings/settings.js`, following the exact `mount(container, meta)`/`unmount()` contract every other view module already implements (`dashboard.js`, `coming-soon.js`). `js/router.js`'s existing `settings` route table entry is updated: its `load` changes from `() => import("./modules/coming-soon/coming-soon.js")` to `() => import("./modules/settings/settings.js")`, and its `meta: { title: "Settings", phase: "Phase 2" }` key is removed (no longer needed once the real view exists).

Theme mode remains solely owned by `js/storage/theme-store.js` — the settings page's radio buttons call that module's existing `applyTheme`/`setStoredTheme` functions directly (the same functions `theme-toggle.js` already uses), so there is exactly one source of truth for theme state, not two competing ones. A new `clearStoredTheme()` export is added to `theme-store.js` for the "System" radio option (removes the `ailp:theme` localStorage key entirely, letting `resolveTheme()` fall through to `getSystemTheme()` on next resolution).

A new `js/storage/settings-store.js` module holds the two settings that don't belong anywhere else (`reducedMotion`, `dailyGoalMinutes`), following the identical try/catch + default-fallback pattern already established by `theme-store.js` and `progress-store.js`.

`js/storage/progress-store.js` gains one new export, `resetProgress()`, which writes `DEFAULT_STATE` back to the `ailp:progress` localStorage key — used by the Settings page's danger-zone action.

## Components

**Appearance card** (`.panel`, reusing existing panel styling from `dashboard.css`/`coming-soon.css`):
- Three radio buttons: Light / Dark / System. Checked state is derived at render time from `getStoredTheme()` — `null` (nothing stored) → "System" checked; `"light"`/`"dark"` → the matching radio checked.
- Selecting Light or Dark calls `applyTheme(value)` then `setStoredTheme(value)` immediately — live preview, identical behavior to the existing topbar toggle.
- Selecting System calls `clearStoredTheme()` then `applyTheme(getSystemTheme())` — clears the override and re-syncs the DOM to whatever the OS preference currently is.
- A "Reduced motion" checkbox below the radios, backed by `settings-store.js`'s `reducedMotion` field. On change, persists via `setSettings({ reducedMotion: checked })` and sets `data-reduced-motion="true"|"false"` on `document.documentElement`. No CSS currently reads this attribute (Phase 1/2 has no animation to suppress yet) — this ships the storage + DOM-attribute plumbing now so it's forward-compatible once Phase 3's animated components exist, without pretending it does something visible today.

**Learning card**:
- One number input labeled "Daily goal (minutes)", backed by `settings-store.js`'s `dailyGoalMinutes` field (default `15`). Clamped client-side to the range [5, 240] before being written to storage. Saves on `change` (fires on blur or Enter, not on every keystroke).

**Data card** (danger-zone styling: border color `var(--color-error)` instead of the default `var(--color-border)`):
- "Reset Progress" button. On click, shows a native `confirm("This will permanently erase your XP, streak, and unit progress. This cannot be undone. Continue?")`. If confirmed: calls `resetProgress()`, then `location.reload()`. The reload is a deliberate simplification — Phase 1/2 has no cross-component state-change event system, and a full reload is the simplest way to guarantee the sidebar's bottom progress block and any other progress-reading UI reflect the reset without building pub/sub infrastructure this phase.

## Data Flow / State

`settings.js`'s `mount(container)` reads `getSettings()` and `getStoredTheme()` once at render time — the same one-shot-read-on-mount pattern already established by `dashboard.js` (no reactivity system exists yet in this codebase, and this sub-project doesn't introduce one). Every control's change handler writes through the relevant store immediately; there is no "Save" button — changes are live, matching the UX the topbar theme-toggle already establishes.

## Error Handling

`settings-store.js` follows the identical defensive pattern already used by `theme-store.js` and `progress-store.js`: `try/catch` around every `localStorage` read/write, falling back to documented defaults (`{ reducedMotion: false, dailyGoalMinutes: 15 }`) rather than throwing. The daily-goal number input clamps out-of-range values client-side (below 5 → 5, above 240 → 240) before the value ever reaches storage, so `settings-store.js` never needs to validate range itself — it trusts its caller, consistent with how `theme-store.js` trusts `applyTheme`'s caller to pass a valid theme string.

## Testing

No test framework (frontend-only, no build tooling, consistent with the rest of the project). Verification is manual: serve the folder locally, navigate to `#/settings`, confirm the correct radio is pre-checked based on current theme state, toggle each control and confirm the app reflects the change immediately (theme swap, and after reload, that reduced-motion/daily-goal/theme values persisted), and confirm the reset-progress flow shows the native confirm dialog and actually clears state.

## Out of Scope (this sub-project)

- Any UI reading `data-reduced-motion` to actually suppress animation (no animations exist yet in the codebase).
- Daily goal being enforced/tracked anywhere (Dashboard doesn't yet show goal progress — that's a future Dashboard enhancement, not part of this Settings page).
- A custom modal/dialog component (native `confirm()` used instead, per decision above).
- The other Phase 2 sub-projects (Notes, Bookmarks, Achievements, Flashcards, Search) — each gets its own spec.
