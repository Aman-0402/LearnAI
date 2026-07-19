# Phase 2 Sub-project: Progress — Design

## Goal

Replace the "Coming Soon" placeholder at `#/progress` with a working Progress page: a dedicated, detailed breakdown of the same underlying state the Dashboard already summarizes (`js/storage/progress-store.js`), distinct from the Dashboard's condensed widgets by going one level deeper per unit and linking directly into each unit route. Seventh and final Phase 2 sub-project.

## Why this doesn't duplicate the Dashboard

The Dashboard (`js/modules/dashboard/dashboard.js`, Phase 1) already shows: 4 stat cards (XP, streak, learning time, overall %) and a condensed "Unit Progress" panel (one progress bar per unit, no labels beyond the bar). The Progress page is not a second copy of that — it shows the same 4 top-line stats (reused for orientation, so the page isn't confusing to land on) but replaces the condensed unit panel with a **full per-unit breakdown**: each unit gets its own card showing the unit name, numeric percentage, a full-width progress bar, and a "Continue" link to that unit's route (`#/unit-1` etc.) — none of which the Dashboard's compact panel provides. This is the same "reuse `.panel`/`.stat-card`, add a unit-focused view" relationship Notes/Bookmarks/Flashcards/Search all have to their own underlying stores — Progress's relationship is to `progress-store.js`, reused rather than duplicated.

## Architecture

New route module `js/modules/progress/progress.js`, following the established `mount(container)`/`unmount()` contract. `js/router.js`'s `progress` route table entry is updated the same way as prior sub-projects: `load` changes to `() => import("./modules/progress/progress.js")`, `meta` key removed.

**No new storage module.** Progress is a read-only view over the existing `js/storage/progress-store.js` (`getState`, `getOverallProgressPercent`) — the same store the Dashboard already reads. No writes happen from this page (resetting progress remains a Settings-page action, not duplicated here).

Unit display names (`"Unit 1"`..`"Unit 4"`) and routes (`#/unit-1`..`#/unit-4`) are derived directly from the `unitProgress` object's keys (`"unit-1"`..`"unit-4"`) via a small formatting helper — no separate hardcoded unit-metadata array, since the keys already carry the ordering and identity needed (avoids a second source of truth that could drift from `progress-store.js`'s `DEFAULT_STATE.unitProgress` keys).

## Components

**Page**: `<h1>Progress</h1>` heading, followed by the same 4-stat-card row style already established by the Dashboard (XP, streak, learning time, overall %) reusing the existing `.dashboard__stats`/`.stat-card` CSS classes from `css/components/dashboard.css` (no new stat-card CSS needed — this page imports no new tokens for that section, just reuses the class names already linked via `dashboard.css`).

**Unit breakdown** (`.progress__units`, new): one `.progress-unit-card` per unit, each showing:
- Unit label (e.g. "Unit 1"), derived from the key.
- Numeric percentage (e.g. "45%").
- A full-width progress bar (new `.progress-unit-card__bar`/`.progress-unit-card__fill`, sized via inline `style.width` percentage — same technique the sidebar's existing progress bar already uses, confirmed by reading `css/components/sidebar.css`'s `.sidebar__progress-fill` for the pattern before building a near-identical bar here).
- A "Continue" link (`<a href="#/unit-N">`) — plain in-app hash link, not `target="_blank"`, since it's internal navigation (unlike Bookmarks' external links).

## Data Flow / State

`mount(container)` reads `getState()` and `getOverallProgressPercent()` once via `progress-store.js` and renders the full page in one pass — no mutation, no re-render triggers, since (like Achievements) this page has no interactive elements that change state; it's a pure reflection of existing progress. `unmount()` is a no-op, consistent with `dashboard.js` and `achievements.js`.

## Error Handling

No new failure surface: reads only via `progress-store.js`'s already-hardened `getState()`/`getOverallProgressPercent()` (both already handle corrupt/missing localStorage data via the existing store's fallback logic). No writes, no localStorage access of its own.

## Testing

No test framework (consistent with the rest of the project). Verification is manual: with a fresh/reset progress state (via Settings > Reset Progress), navigate to `#/progress`, confirm all 4 stat cards show 0/0/0min/0% and all 4 unit cards show 0% with empty-looking bars. Manually edit `localStorage.ailp:progress` in devtools to set varied `unitProgress` values (e.g. `unit-1: 100, unit-2: 45, unit-3: 0, unit-4: 0`) and `xp`/`streak`/`learningTime`, reload, confirm the stat cards and each unit card's percentage/bar/link reflect the new values correctly. Click a unit's "Continue" link, confirm it navigates to that unit's route (which will show the Phase 5 Coming Soon placeholder, since unit content doesn't exist yet — that's expected and out of scope here).

## Out of Scope (this sub-project)

- Historical/trend data (e.g. "XP earned this week", a streak calendar, a chart of progress over time) — `progress-store.js` only tracks current-value state, no timestamped history log exists anywhere in the app, and adding one is a data-model change well beyond this sub-project's scope.
- Any lesson-level granularity within a unit (no lesson content exists yet — Phase 5); the per-unit percentage is whatever `unitProgress["unit-N"]` already holds, however that value eventually gets set.
- A reset/edit action on this page (Reset Progress already lives on the Settings page; not duplicated here).
- Achievements integration (Achievements already has its own page; Progress does not re-show badge state).
