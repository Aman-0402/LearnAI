# Interactive AI Learning Platform

Frontend-only (HTML/CSS/vanilla ES6 modules) interactive learning platform covering
Artificial Intelligence from beginner to university level. No build step, no backend,
deployable directly to GitHub Pages.

## Running locally

Any static file server works, e.g.:

```bash
npx serve .
# or
python -m http.server 8080
```

Open the printed URL. (Opening `index.html` directly via `file://` will not work —
ES module imports require CORS-safe HTTP(S) serving.)

## Status

**Phase 1 (Foundation) complete:** theme system, responsive sidebar/topbar shell,
hash-based router, empty-state Dashboard.

**Phase 2 (Core Platform) complete:** Settings (theme/reduced-motion/daily-goal/reset),
Notes, Bookmarks, Achievements, Flashcards, Search (live cross-store filtering), and a
dedicated Progress page — all localStorage-backed, all reachable from the sidebar nav.
Only the lesson-content routes (Roadmap, Unit 1-4, AI Lab), which depend on Phase 4/5
content that doesn't exist yet, still show a Coming Soon placeholder.

See `docs/superpowers/specs/` and `docs/superpowers/plans/` for design history.
