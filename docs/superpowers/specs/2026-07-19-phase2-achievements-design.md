# Phase 2 Sub-project: Achievements — Design

## Goal

Replace the "Coming Soon" placeholder at `#/achievements` with a working Achievements page: a grid of badges, each locked or unlocked based on the existing progress state already tracked by `js/storage/progress-store.js` (xp, streak, learningTime, unitProgress). Fourth Phase 2 sub-project (after Settings, Notes, Bookmarks).

## Architecture

New route module `js/modules/achievements/achievements.js`, following the established `mount(container)`/`unmount()` contract. `js/router.js`'s `achievements` route table entry is updated the same way `notes`/`settings`/`bookmarks` were: `load` changes to `() => import("./modules/achievements/achievements.js")`, `meta` key removed.

**No new storage module.** Unlike Notes/Bookmarks, achievements are not user-entered data — they are *derived* from the progress state that `js/storage/progress-store.js` already persists (`getState()`). This keeps the sub-project self-contained with no new localStorage key, and means achievements automatically reflect whatever xp/streak/unitProgress values exist, including ones set by a future Phase (lessons) without any migration.

A static, module-level `ACHIEVEMENTS` array in `achievements.js` itself defines each badge:

```js
const ACHIEVEMENTS = [
  { id: "first-steps", title: "First Steps", description: "Log your first minute of learning time", check: (s) => s.learningTime > 0 },
  { id: "xp-100", title: "Century", description: "Earn 100 XP", check: (s) => s.xp >= 100 },
  { id: "xp-500", title: "High Achiever", description: "Earn 500 XP", check: (s) => s.xp >= 500 },
  { id: "streak-3", title: "On a Roll", description: "Reach a 3-day streak", check: (s) => s.streak >= 3 },
  { id: "streak-7", title: "Committed", description: "Reach a 7-day streak", check: (s) => s.streak >= 7 },
  { id: "unit-complete", title: "Unit Complete", description: "Finish any unit (100%)", check: (s) => Object.values(s.unitProgress).some((v) => v >= 100) },
  { id: "all-units", title: "Course Complete", description: "Finish all 4 units", check: (s) => Object.values(s.unitProgress).every((v) => v >= 100) }
];
```

Seven badges — enough to feel like a real feature without inventing content that has no basis in currently-tracked state. Each `check` function takes the object returned by `getState()` and returns a boolean.

## Components

**Page**: an `<h1>Achievements</h1>` heading (matching the fixed heading-hierarchy convention from the Phase 2 cross-cutting review) followed by a summary line ("3 of 7 unlocked") and a responsive card grid (`.achievements__grid`, similar `auto-fill`/`minmax` grid pattern to the dashboard's stat-card grid).

**Badge card** (`.achievement-card`): icon circle (checkmark icon if unlocked, lock icon if locked — reusing the Lucide icon set already loaded via CDN, same `window.lucide.createIcons()` call pattern used elsewhere), title, description. Unlocked cards use full color/opacity; locked cards are dimmed (`opacity` + grayscale via CSS, no separate "locked" icon asset needed beyond the lock glyph).

## Data Flow / State

`mount(container)` reads `getState()` once via `progress-store.js`, computes `unlocked = ACHIEVEMENTS.filter((a) => a.check(state))`, and renders the full grid in one pass — no mutation, no re-render triggers, since this page has no user interactions that change state (achievements are read-only reflections of progress). `unmount()` is a no-op, consistent with `dashboard.js`.

No live-updating: if the user's progress changes in another tab/view, the Achievements page reflects it next time it's mounted (on navigation), same as every other view in this app (no cross-tab sync exists anywhere in the codebase today).

## Error Handling

No new failure surface: this module only *reads* via `progress-store.js`'s already-hardened `getState()` (which itself falls back to `DEFAULT_STATE` on any corrupt/missing data). No writes, no localStorage access of its own, so no new try/catch is needed in `achievements.js`.

## Testing

No test framework (consistent with the rest of the project). Verification is manual: with a fresh/reset progress state, confirm all 7 badges show locked; use the Settings page's "Reset Progress" to get to zero, then manually edit `localStorage.ailp:progress` in devtools to set xp/streak/unitProgress values crossing various thresholds, reload `#/achievements`, and confirm the correct badges flip to unlocked and the summary count updates.

## Out of Scope (this sub-project)

- Any achievement tied to lesson/unit *content* completion in a granular sense (no lesson content exists yet — Phase 5); `unit-complete`/`all-units` use the existing `unitProgress` percentage field only, whatever mechanism eventually sets it.
- Notifications/toasts when a new achievement is unlocked (would require watching for state transitions across page loads — no such mechanism exists in this app yet; out of scope).
- Achievement persistence/history (e.g. "unlocked on Jul 19") — badges are computed live from current state each mount, not stored as discrete unlock events.
- The remaining Phase 2 sub-projects (Flashcards, Search, Progress) — each gets its own spec.
