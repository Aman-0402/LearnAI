# Phase 3 Motion & Micro-interactions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a CSS fade transition on route changes and hover/active micro-interactions on buttons, cards, and nav links across every existing Phase 1/2 page — pure CSS, no library, fully suppressed by the existing `data-reduced-motion` attribute.

**Architecture:** New `css/motion.css` holds the route-fade classes/keyframes. `js/router.js` gets a small async change to apply those classes around each route swap. Micro-interactions are added as new `:hover`/`:active` rules directly inside each existing component stylesheet — no new classes, no HTML/JS changes for those.

**Tech Stack:** Same as prior phases — vanilla CSS/JS, no bundler, no test framework, manual browser verification.

---

### Task 1: motion.css + index.html link

**Files:**
- Create: `css/motion.css`
- Modify: `index.html`

- [ ] **Step 1: Write motion.css**

```css
/* css/motion.css */
.route-fade-out {
  opacity: 0;
  transform: translateY(4px);
  transition: opacity var(--duration-base) var(--ease-standard),
    transform var(--duration-base) var(--ease-standard);
}

.route-fade-in {
  animation: route-fade-in-keyframes var(--duration-base) var(--ease-standard);
}

@keyframes route-fade-in-keyframes {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

- [ ] **Step 2: Link it in index.html**

Add this line right after `<link rel="stylesheet" href="css/base.css" />` (before `css/layout.css`, so component stylesheets loaded later can still override if ever needed):

```html
  <link rel="stylesheet" href="css/motion.css" />
```

- [ ] **Step 3: Verify**

Confirm brace balance in `css/motion.css`. Confirm `--duration-base` and `--ease-standard` exist in `css/tokens.css` (they do — used elsewhere already in `css/base.css`/`css/layout.css`). Not yet wired to any JS behavior (Task 2's job) — this task only needs to produce syntactically valid, unused CSS.

- [ ] **Step 4: Commit**

```bash
git add css/motion.css index.html
git commit -m "feat: add motion.css route-fade classes"
```

---

### Task 2: Wire route-fade into the router

**Files:**
- Modify: `js/router.js`

- [ ] **Step 1: Update handleRoute to fade out, swap, fade in**

Find this function in `js/router.js`:

```js
async function handleRoute(mainEl, onRouteChange) {
  const routeId = (location.hash.replace(/^#\//, "") || DEFAULT_ROUTE);
  const entry = routeTable[routeId];

  if (!entry) {
    location.hash = `#/${DEFAULT_ROUTE}`;
    return;
  }

  const myRequestId = ++requestId;

  try {
    const mod = await entry.load();

    if (myRequestId !== requestId) return;

    if (currentModule && typeof currentModule.unmount === "function") {
      currentModule.unmount();
    }

    currentModule = mod;
    mod.mount(mainEl, entry.meta);
    onRouteChange(routeId);
  } catch (err) {
    if (myRequestId !== requestId) return;
    console.error(`Failed to load route "${routeId}":`, err);
    mainEl.innerHTML = '<p style="padding: 24px;">Failed to load this section. Please try again.</p>';
  }
}
```

Replace it with:

```js
function waitForTransitionEnd(el, className, fallbackMs) {
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      el.removeEventListener("transitionend", finish);
      resolve();
    };
    el.addEventListener("transitionend", finish, { once: true });
    setTimeout(finish, fallbackMs);
    el.classList.add(className);
  });
}

async function handleRoute(mainEl, onRouteChange) {
  const routeId = (location.hash.replace(/^#\//, "") || DEFAULT_ROUTE);
  const entry = routeTable[routeId];

  if (!entry) {
    location.hash = `#/${DEFAULT_ROUTE}`;
    return;
  }

  const myRequestId = ++requestId;

  try {
    const mod = await entry.load();

    if (myRequestId !== requestId) return;

    await waitForTransitionEnd(mainEl, "route-fade-out", 300);
    mainEl.classList.remove("route-fade-out");

    if (myRequestId !== requestId) return;

    if (currentModule && typeof currentModule.unmount === "function") {
      currentModule.unmount();
    }

    currentModule = mod;
    mod.mount(mainEl, entry.meta);
    onRouteChange(routeId);

    mainEl.classList.add("route-fade-in");
    mainEl.addEventListener(
      "animationend",
      () => mainEl.classList.remove("route-fade-in"),
      { once: true }
    );
  } catch (err) {
    if (myRequestId !== requestId) return;
    console.error(`Failed to load route "${routeId}":`, err);
    mainEl.innerHTML = '<p style="padding: 24px;">Failed to load this section. Please try again.</p>';
  }
}
```

Leave `routeTable`, `DEFAULT_ROUTE`, `initRouter`, and the `currentModule`/`requestId` declarations above this function untouched.

- [ ] **Step 2: Verify**

Run `node --check js/router.js` — expect no output. Read the diff: `waitForTransitionEnd` is a new module-level helper (300ms fallback comfortably exceeds `--duration-base`'s 250ms so the real transition always wins in normal conditions); the fade-out happens *before* `mod.mount`/`unmount` swap the content, and fade-in happens *after* — matching the "fade out old content, swap, fade in new content" spec. Note the code above includes a **second** `if (myRequestId !== requestId) return;` check right after `await waitForTransitionEnd(...)`, in addition to the existing one after `await entry.load()` — this is required, not optional: the fade-out wait is itself a new async gap (~250-300ms), and without re-checking staleness after it, a rapid second navigation during that window could let a stale route proceed to unmount/mount, regressing Task 11's Phase 1 race-condition guard. (An earlier draft of this plan omitted this second check; it was caught in code review and must be present in the final code.)

- [ ] **Step 3: Verify in browser**

Run `npx serve .`, navigate between a few routes (e.g. `#/dashboard` → `#/notes` → `#/settings`). Expected: a brief fade/slight-slide instead of an instant swap, no blank flash. Rapidly click multiple sidebar links in succession — confirm the final destination is correct and nothing gets stuck fading. If no browser is available, do a structural trace instead (confirm the class-add/remove logic reads correctly against the CSS from Task 1) and report that live-browser verification wasn't possible.

- [ ] **Step 4: Commit**

```bash
git add js/router.js
git commit -m "feat: fade route content on navigation"
```

---

### Task 3: Shell micro-interactions (topbar, sidebar)

**Files:**
- Modify: `css/components/topbar.css`
- Modify: `css/components/sidebar.css`

- [ ] **Step 1: Add hover/active states to topbar.css**

Find:
```css
.topbar__hamburger {
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text);
  padding: var(--space-2);
}
```

Replace with:
```css
.topbar__hamburger {
  display: none;
  background: none;
  border: none;
  border-radius: var(--radius-control);
  cursor: pointer;
  color: var(--color-text);
  padding: var(--space-2);
  transition: background-color var(--duration-fast) var(--ease-standard);
}

.topbar__hamburger:hover {
  background-color: color-mix(in srgb, var(--color-text) 8%, transparent);
}
```

Find:
```css
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

Replace with:
```css
.topbar__theme-toggle {
  background: none;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  padding: var(--space-2);
  cursor: pointer;
  color: var(--color-text);
  display: inline-flex;
  transition: background-color var(--duration-fast) var(--ease-standard);
}

.topbar__theme-toggle:hover {
  background-color: color-mix(in srgb, var(--color-text) 8%, transparent);
}
```

- [ ] **Step 2: Add active state + transition to sidebar.css**

Find:
```css
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
```

Replace with:
```css
.sidebar__link {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  border-radius: var(--radius-control);
  color: var(--color-text-muted);
  font-size: 0.9375rem;
  font-weight: 500;
  transition: background-color var(--duration-fast) var(--ease-standard),
    color var(--duration-fast) var(--ease-standard);
}

.sidebar__link:hover {
  background: var(--color-bg);
  color: var(--color-text);
}

.sidebar__link:active {
  transform: scale(0.98);
}
```

Leave `.sidebar__link[data-active="true"]` and everything else in both files untouched.

- [ ] **Step 3: Verify**

Confirm brace balance in both files. Confirm `--duration-fast`/`--ease-standard` exist in `css/tokens.css` and `color-mix(in srgb, var(--color-text) 8%, transparent)` matches the exact pattern already used in `css/components/achievements.css` (`.achievement-card__icon`) and `css/components/sidebar.css` (`.sidebar__link[data-active="true"]`) — same technique, not a new one.

- [ ] **Step 4: Commit**

```bash
git add css/components/topbar.css css/components/sidebar.css
git commit -m "feat: add hover/active micro-interactions to topbar and sidebar"
```

---

### Task 4: Dashboard + Notes + Bookmarks + Flashcards micro-interactions

**Files:**
- Modify: `css/components/dashboard.css`
- Modify: `css/components/notes.css`
- Modify: `css/components/bookmarks.css`
- Modify: `css/components/flashcards.css`

- [ ] **Step 1: dashboard.css — hero CTA and stat cards**

Find:
```css
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
```

Replace with:
```css
.dashboard__hero-cta {
  background: #fff;
  color: var(--color-primary);
  border: none;
  border-radius: var(--radius-control);
  padding: var(--space-3) var(--space-5);
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: opacity var(--duration-fast) var(--ease-standard),
    transform var(--duration-fast) var(--ease-standard);
}

.dashboard__hero-cta:hover {
  opacity: 0.9;
}

.dashboard__hero-cta:active {
  transform: scale(0.97);
}
```

Find:
```css
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
```

Replace with:
```css
.stat-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  transition: transform var(--duration-fast) var(--ease-standard),
    border-color var(--duration-fast) var(--ease-standard);
}

.stat-card:hover {
  transform: translateY(-2px);
  border-color: var(--color-primary);
}
```

- [ ] **Step 2: notes.css — submit button, note card, action buttons**

Find:
```css
.notes__submit {
  align-self: flex-start;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: var(--radius-control);
  padding: var(--space-3) var(--space-5);
  font-weight: 600;
  cursor: pointer;
}
```

Replace with:
```css
.notes__submit {
  align-self: flex-start;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: var(--radius-control);
  padding: var(--space-3) var(--space-5);
  font-weight: 600;
  cursor: pointer;
  transition: opacity var(--duration-fast) var(--ease-standard),
    transform var(--duration-fast) var(--ease-standard);
}

.notes__submit:hover {
  opacity: 0.9;
}

.notes__submit:active {
  transform: scale(0.97);
}
```

Find:
```css
.note-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
```

Replace with:
```css
.note-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  transition: transform var(--duration-fast) var(--ease-standard),
    border-color var(--duration-fast) var(--ease-standard);
}

.note-card:hover {
  transform: translateY(-2px);
  border-color: var(--color-primary);
}
```

Find:
```css
.note-card__button {
  background: none;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  padding: var(--space-2) var(--space-4);
  cursor: pointer;
  color: var(--color-text);
  font-weight: 500;
}
```

Replace with:
```css
.note-card__button {
  background: none;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  padding: var(--space-2) var(--space-4);
  cursor: pointer;
  color: var(--color-text);
  font-weight: 500;
  transition: background-color var(--duration-fast) var(--ease-standard);
}

.note-card__button:hover {
  background-color: color-mix(in srgb, var(--color-text) 8%, transparent);
}
```

Note: `.note-card__button--danger` (a modifier on the same element) inherits this new `:hover` background automatically since both rules apply to the same element — no separate danger-hover rule is needed.

- [ ] **Step 3: bookmarks.css — submit button, bookmark card, action button**

Find:
```css
.bookmarks__submit {
  align-self: flex-start;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: var(--radius-control);
  padding: var(--space-3) var(--space-5);
  font-weight: 600;
  cursor: pointer;
}
```

Replace with:
```css
.bookmarks__submit {
  align-self: flex-start;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: var(--radius-control);
  padding: var(--space-3) var(--space-5);
  font-weight: 600;
  cursor: pointer;
  transition: opacity var(--duration-fast) var(--ease-standard),
    transform var(--duration-fast) var(--ease-standard);
}

.bookmarks__submit:hover {
  opacity: 0.9;
}

.bookmarks__submit:active {
  transform: scale(0.97);
}
```

Find:
```css
.bookmark-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
```

Replace with:
```css
.bookmark-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  transition: transform var(--duration-fast) var(--ease-standard),
    border-color var(--duration-fast) var(--ease-standard);
}

.bookmark-card:hover {
  transform: translateY(-2px);
  border-color: var(--color-primary);
}
```

Find:
```css
.bookmark-card__button {
  background: none;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  padding: var(--space-2) var(--space-4);
  cursor: pointer;
  color: var(--color-text);
  font-weight: 500;
}
```

Replace with:
```css
.bookmark-card__button {
  background: none;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  padding: var(--space-2) var(--space-4);
  cursor: pointer;
  color: var(--color-text);
  font-weight: 500;
  transition: background-color var(--duration-fast) var(--ease-standard);
}

.bookmark-card__button:hover {
  background-color: color-mix(in srgb, var(--color-text) 8%, transparent);
}
```

- [ ] **Step 4: flashcards.css — submit button, flashcard, delete button**

Find:
```css
.flashcards__submit {
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: var(--radius-control);
  padding: var(--space-3) var(--space-5);
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}
```

Replace with:
```css
.flashcards__submit {
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: var(--radius-control);
  padding: var(--space-3) var(--space-5);
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: opacity var(--duration-fast) var(--ease-standard),
    transform var(--duration-fast) var(--ease-standard);
}

.flashcards__submit:hover {
  opacity: 0.9;
}

.flashcards__submit:active {
  transform: scale(0.97);
}
```

Find:
```css
.flashcard {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  min-height: 140px;
}
```

Replace with:
```css
.flashcard {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  min-height: 140px;
  transition: border-color var(--duration-fast) var(--ease-standard);
}

.flashcard:hover {
  border-color: var(--color-primary);
}
```

Note: unlike the other cards, `.flashcard` intentionally does NOT get a `translateY` hover lift — its `.flashcard__body` already has its own `cursor: pointer` click-to-flip interaction (Phase 2 Flashcards), and a card-level lift plus an inner flip-target would be visually redundant/competing. A border-color highlight is enough to signal interactivity here.

Find:
```css
.flashcard__delete {
  background: none;
  border: 1px solid var(--color-error);
  color: var(--color-error);
  border-radius: var(--radius-control);
  padding: var(--space-2) var(--space-4);
  cursor: pointer;
  font-weight: 500;
}
```

Replace with:
```css
.flashcard__delete {
  background: none;
  border: 1px solid var(--color-error);
  color: var(--color-error);
  border-radius: var(--radius-control);
  padding: var(--space-2) var(--space-4);
  cursor: pointer;
  font-weight: 500;
  transition: background-color var(--duration-fast) var(--ease-standard);
}

.flashcard__delete:hover {
  background-color: color-mix(in srgb, var(--color-error) 10%, transparent);
}
```

- [ ] **Step 5: Verify**

Confirm brace balance in all 4 files. Run `npx serve .` if available; hover each modified selector on `#/dashboard`, `#/notes`, `#/bookmarks`, `#/flashcards` and confirm the expected transform/opacity/background change with a smooth transition, and confirm `.flashcard__body`'s existing click-to-flip still works unaffected. If no browser is available, do a structural trace (confirm every `:hover`/`:active` selector targets an element that actually exists in the corresponding view module) instead.

- [ ] **Step 6: Commit**

```bash
git add css/components/dashboard.css css/components/notes.css css/components/bookmarks.css css/components/flashcards.css
git commit -m "feat: add hover/active micro-interactions to dashboard, notes, bookmarks, flashcards"
```

---

### Task 5: Achievements + Progress + Search + Settings micro-interactions

**Files:**
- Modify: `css/components/achievements.css`
- Modify: `css/components/progress.css`
- Modify: `css/components/search.css`
- Modify: `css/components/settings.css`

- [ ] **Step 1: achievements.css — unlocked card only**

Find:
```css
.achievement-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-2);
}
```

Replace with:
```css
.achievement-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-2);
  transition: transform var(--duration-fast) var(--ease-standard),
    border-color var(--duration-fast) var(--ease-standard);
}

.achievement-card:not(.achievement-card--locked):hover {
  transform: translateY(-2px);
  border-color: var(--color-primary);
}
```

Using `:not(.achievement-card--locked)` (rather than adding a hover rule under `.achievement-card--locked` to cancel it) keeps locked cards inert by construction — there's nothing to "undo" for a locked badge, matching the spec's "skip for locked cards, nothing to interact with."

- [ ] **Step 2: progress.css — unit card**

Find:
```css
.progress-unit-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
```

Replace with:
```css
.progress-unit-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  transition: transform var(--duration-fast) var(--ease-standard),
    border-color var(--duration-fast) var(--ease-standard);
}

.progress-unit-card:hover {
  transform: translateY(-2px);
  border-color: var(--color-primary);
}
```

- [ ] **Step 3: search.css — result card**

Find:
```css
.search-result {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}
```

Replace with:
```css
.search-result {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  transition: transform var(--duration-fast) var(--ease-standard),
    border-color var(--duration-fast) var(--ease-standard);
}

.search-result:hover {
  transform: translateY(-2px);
  border-color: var(--color-primary);
}
```

- [ ] **Step 4: settings.css — danger button**

Find:
```css
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

Replace with:
```css
.settings__danger-button {
  align-self: flex-start;
  background: var(--color-error);
  color: #fff;
  border: none;
  border-radius: var(--radius-control);
  padding: var(--space-3) var(--space-5);
  font-weight: 600;
  cursor: pointer;
  transition: opacity var(--duration-fast) var(--ease-standard),
    transform var(--duration-fast) var(--ease-standard);
}

.settings__danger-button:hover {
  opacity: 0.9;
}

.settings__danger-button:active {
  transform: scale(0.97);
}
```

- [ ] **Step 5: Verify**

Confirm brace balance in all 4 files. On `#/achievements`, confirm only unlocked badge cards lift on hover and locked ones don't. Run `npx serve .` if available and hover-test `#/progress`, `#/search` (after typing a query so results render), and the Settings "Reset Progress" button. If no browser is available, do a structural trace instead.

- [ ] **Step 6: Commit**

```bash
git add css/components/achievements.css css/components/progress.css css/components/search.css css/components/settings.css
git commit -m "feat: add hover/active micro-interactions to achievements, progress, search, settings"
```

---

## Self-Review Notes

- **Spec coverage:** route fade via CSS classes toggled by the router, with `transitionend`/`animationend` + timeout fallback (Task 1, 2) ✓; hover/press micro-interactions on buttons, cards, and nav links across every existing Phase 1/2 page (Tasks 3-5) ✓; everything routes through the existing `data-reduced-motion` CSS hook with no new JS branching (all new rules are plain `transition`/`animation` properties, already covered by `base.css`'s blanket `[data-reduced-motion="true"] *` zero-duration rule) ✓; list-mutation animations explicitly NOT added (out of scope per spec) ✓; no animation library or View Transitions API used ✓.
- **Type consistency:** `waitForTransitionEnd`'s class-name parameter (`"route-fade-out"`) and the `"route-fade-in"` class added after mount both match the exact class names defined in `css/motion.css` (Task 1). Every new CSS selector targeting a JS-rendered element (`.stat-card`, `.note-card`, `.bookmark-card`, `.flashcard`, `.achievement-card`, `.progress-unit-card`, `.search-result`, and every button class) was cross-checked against the actual `createEl` calls in each view module during plan authoring — no invented class names.
- **No placeholders:** every step has complete before/after CSS or JS code, or an explicit manual-verification action; no TBD/TODO markers.
