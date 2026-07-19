# Phase 5 Sub-project: Course Data Model + Roadmap Page — Design

## Goal

Replace the `#/roadmap` Coming Soon placeholder with a working course overview page, backed by a new static `json/course.json` data file. This is the first of three Phase 5 sub-projects (course data + Roadmap → Unit page + Lesson viewer with real Unit 1 content → [future: Units 2-4 content]). No real lesson content is written yet in this sub-project — only enough unit/lesson metadata to make the Roadmap page real.

## Architecture

**New `json/course.json`**, structured identically in spirit to the existing `json/nav.json` (a single top-level array, fetched once, no build step):

```json
{
  "units": [
    {
      "id": "unit-1",
      "title": "Unit 1: Foundations",
      "description": "What AI actually is, and the core ideas behind machine learning.",
      "lessons": [
        { "id": "lesson-1", "title": "What Is Artificial Intelligence?" },
        { "id": "lesson-2", "title": "Data, Patterns, and Learning" }
      ]
    },
    {
      "id": "unit-2",
      "title": "Unit 2: Coming Soon",
      "description": "Content for this unit hasn't been written yet.",
      "lessons": []
    }
  ]
}
```

Unit 1 gets a handful of real lesson titles (exact count and titles decided during implementation planning — content-authoring detail, not architecture). Units 2-4 get a placeholder title/description and an empty `lessons` array, so the Roadmap can still render a card for every unit (matching the sidebar's existing 4 unit nav entries) without pretending content exists that doesn't. `unit.id` values match the existing route ids (`unit-1`..`unit-4`) already used by `js/router.js` and `progress-store.js`'s `unitProgress` keys — one shared identifier space, no translation layer.

**New route module** `js/modules/roadmap/roadmap.js`, following the established `mount(container)`/`unmount()` contract. `js/router.js`'s `roadmap` route table entry is updated the same way every completed sub-project has been: `load` changes to `() => import("./modules/roadmap/roadmap.js")`, `meta` key removed.

## Components

**Page**: `<h1>Course Roadmap</h1>` heading, followed by a `.roadmap__units` list of `.roadmap-unit-card` cards — one per `course.json` unit, in file order (`unit-1` through `unit-4`).

**Unit card**: title, description, a lesson-count line ("2 lessons" / "Content coming soon" when `lessons.length === 0`), a progress bar (reusing the same bar markup/CSS technique already established in `sidebar.js`/`progress.js` — a `.roadmap-unit-card__fill` div with `style.width` set from `progress-store.js`), and a "Start"/"Continue" link to `#/unit-N`. No locking — every card is always a live link, matching the decision already made for the Progress page's unit cards.

## Data Flow / State

`mount(container)` does one `fetch("json/course.json")` (async, try/catch + `res.ok` check + shape validation on `data.units` being an array — mirroring `sidebar.js`'s existing `nav.json` fetch-hardening pattern exactly, including logging to `console.error` and falling back to an empty list on failure rather than throwing), plus a synchronous `getState()` read from `progress-store.js` for the per-unit percentages. Renders once; no interactivity beyond the unit links, so no re-render logic is needed. `unmount()` is a no-op, consistent with `dashboard.js`/`achievements.js`/`progress.js`.

## Error Handling

`course.json` fetch failures degrade gracefully: log via `console.error`, render an empty/error-state message in place of the unit list rather than leaving the page blank or throwing an unhandled rejection into the router (matching the existing hardened pattern, not inventing a new one). `progress-store.js`'s `getState()` is already hardened (falls back to `DEFAULT_STATE` on any corrupt/missing localStorage data), so no new defensive code is needed on that side.

## Testing

No test framework (consistent with the rest of the project). Verification is manual: navigate to `#/roadmap`, confirm 4 unit cards render in order, Unit 1 shows its real lesson count and Units 2-4 show "Content coming soon". Manually edit `localStorage.ailp:progress` to set varied `unitProgress` values, reload, confirm each card's progress bar reflects them (matching what `#/progress` already shows for the same data). Click each unit's link, confirm navigation to the corresponding `#/unit-N` (which still shows the Phase 1 Coming Soon placeholder until the next Phase 5 sub-project builds the real Unit page — expected and out of scope here). Temporarily rename `course.json` to simulate a fetch failure, reload `#/roadmap`, confirm the page shows a graceful error state instead of blank/crashed.

## Out of Scope (this sub-project)

- The Unit page (lesson list within a unit) and Lesson viewer (text + quiz) — next Phase 5 sub-project.
- Real lesson content/body text for any lesson, including Unit 1's — this sub-project only needs lesson *titles* to populate the Roadmap; lesson bodies are authored alongside the Lesson viewer in the next sub-project.
- Sequential unit locking — explicitly decided against; all units always browsable.
- Any change to how `unitProgress` values get set (still whatever manual/future mechanism sets them — connecting real lesson completion to `unitProgress` is part of the Lesson viewer sub-project, not this one).
- Real content for Units 2-4 — deferred indefinitely per the "one seed unit" scope decision; may become its own future sub-project.
