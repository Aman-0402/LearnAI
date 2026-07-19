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
hash-based router, empty-state Dashboard. See `docs/superpowers/specs/` and
`docs/superpowers/plans/` for design history.
