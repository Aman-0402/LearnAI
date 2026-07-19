# Phase 3: Motion & Micro-interactions — Design

## Goal

Prior phases explicitly deferred "full interactive component work" and animation polish to Phase 3 (see `docs/superpowers/specs/2026-07-19-phase1-foundation-design.md`, "Out of Scope"). With Phase 2 (Core Platform) complete, Phase 3 delivers: (1) a fade transition on route changes instead of an instant content swap, and (2) hover/press/focus micro-interactions on buttons, cards, and nav links across every existing page. Pure CSS — no animation library — using the `--duration-*`/`--ease-standard` tokens already defined in `css/tokens.css`. Everything routes through the `data-reduced-motion` attribute Settings already sets on `<html>`, and the CSS rule in `base.css` that zeroes all `animation`/`transition` durations when it's `"true"` — this phase gives that existing (currently inert) hook its first real effect.

## Architecture

**New `css/motion.css`**, linked in `index.html` immediately after `css/base.css` (before every component stylesheet, so component-specific rules can still override where needed — though none should need to). Holds:
- `.route-fade-out` / `.route-fade-in` classes (opacity + small translateY transition/animation) used only by the router.
- Nothing else — no shared "card hover" utility class, since each component's hover rule is one line added directly to that component's own stylesheet (see Micro-interactions below). A shared utility class here would be premature abstraction for what's ~10 one-line additions.

**Router change** (`js/router.js`): `handleRoute` currently does `mod.mount(mainEl, entry.meta)` immediately after import resolves. This becomes: add `route-fade-out` to `mainEl`, wait for that transition to finish (`transitionend`, with a `setTimeout` fallback matching `--duration-base` in case the event doesn't fire — e.g. if `mainEl` had `display: none` mid-transition, which it doesn't currently, but the fallback is cheap insurance), unmount/mount as today, then add `route-fade-in` and remove it after its `animationend` (or an equivalent timeout fallback). If `data-reduced-motion="true"`, the CSS transition/animation duration is already 0 via the existing `base.css` rule, so this still runs through the same code path but resolves instantly — no separate JS branch needed.

**Micro-interactions**: added directly to each existing component stylesheet as new `:hover`/`:active`/`:focus-visible` rules on already-existing selectors (no new classes, no HTML changes) — e.g. `.stat-card:hover`, `.note-card:hover`, `.bookmark-card:hover`, `.flashcard:hover` (careful not to conflict with its existing click-to-flip `cursor: pointer`), `.achievement-card:hover` (skip for `--locked` cards — nothing to interact with), `.sidebar__link:hover`/`:active`, topbar buttons, all form submit/action buttons already in Notes/Bookmarks/Flashcards/Settings. Each gets a subtle `transform: translateY(-2px)` and/or `box-shadow`/`border-color` shift on hover, using `transition: transform var(--duration-fast) var(--ease-standard), ...` — reusing the exact tokens already defined, no new ones needed.

## Data Flow / State

No state. This is presentational CSS plus one small async-timing change in the router (adding two classes and awaiting their end events before proceeding). No new localStorage keys, no new modules to mount/unmount.

## Error Handling

The `transitionend`/`animationend` + `setTimeout` fallback in `router.js` guards against the one realistic failure mode: an event listener never firing (e.g. if `--duration-base` were ever set to `0ms` outside the reduced-motion path, or a browser quirk). The `setTimeout` fallback always fires regardless, so route navigation can never hang waiting on an animation event that doesn't arrive — this preserves the router's existing reliability contract (Task 11's error handling from Phase 1) rather than introducing a new stuck-state risk.

## Testing

No test framework (consistent with the rest of the project). Verification is manual: navigate between several routes (`#/dashboard`, `#/notes`, `#/settings`, etc.) and confirm a smooth fade instead of an instant jump-cut, with no visible flash of blank content between routes. Hover over stat cards, note/bookmark/flashcard cards, achievement cards (unlocked only), sidebar links, and page action buttons on each already-shipped Phase 1/2 page, confirming a subtle, consistent hover response. Toggle Settings' "Reduced motion" checkbox on, repeat both checks, and confirm route changes become instant and hover states no longer transition (though the hover style itself, e.g. the shadow, may still apply — it's the *transition* that's suppressed, not the end state, matching how `prefers-reduced-motion` is conventionally handled). Toggle it back off and confirm motion returns.

## Out of Scope (this phase)

- List-mutation animations (items animating in/out when added/deleted in Notes/Bookmarks/Flashcards) — explicitly descoped by the user in favor of route transitions + micro-interactions; can be a future, separate pass if wanted.
- Any animation library (GSAP/Lottie) or the View Transitions API — pure CSS only, per the chosen approach; both were considered and explicitly not chosen for this phase.
- AI Lab (Phase 4) or lesson-content (Phase 5) interactions — neither exists yet.
- Loading-state skeletons/spinners for the router's async `import()` — out of scope; the existing "Loading..." placeholder and the Phase 1 Task 11 error-handling fallback are unchanged by this phase.
