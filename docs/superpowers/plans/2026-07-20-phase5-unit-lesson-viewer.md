# Phase 5 Unit Page + Lesson Viewer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `#/unit-1`..`#/unit-4` Coming Soon placeholders with a real Unit page (lesson list) and a new Lesson viewer (text + multiple-choice quiz) reachable at `#/unit-N/lesson-X`, with real authored content for Unit 1's 3 lessons. Completing a lesson's quiz updates XP and that unit's progress percentage in `progress-store.js`.

**Architecture:** `js/router.js` gets a small extension: a regex check for `unit-N/lesson-X` hashes before the static route-table lookup, dynamically importing a new Lesson viewer module directly. The `unit-1`..`unit-4` table entries load a new Unit page module and each carries a `meta: { unitId }`. `js/storage/progress-store.js` gains a `completedLessons` array and a `completeLesson(...)` function. New per-lesson JSON files under `json/lessons/` hold lesson text + quiz content, kept separate from the lightweight `course.json`.

**Tech Stack:** Same as every prior phase — vanilla ES6 modules, no bundler, no test framework, manual browser verification.

---

### Task 1: progress-store.js — completedLessons + completeLesson()

**Files:**
- Modify: `js/storage/progress-store.js`

- [ ] **Step 1: Add `completedLessons` to DEFAULT_STATE**

Find:
```js
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
```

Replace with:
```js
const DEFAULT_STATE = {
  xp: 0,
  streak: 0,
  learningTime: 0,
  currentLesson: null,
  completedLessons: [],
  unitProgress: {
    "unit-1": 0,
    "unit-2": 0,
    "unit-3": 0,
    "unit-4": 0
  }
};
```

- [ ] **Step 2: Guard `completedLessons` shape in getState() the same way unitProgress already is**

Find:
```js
export function getState() {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(raw);
    const storedUnitProgress =
      parsed.unitProgress && typeof parsed.unitProgress === "object" && !Array.isArray(parsed.unitProgress)
        ? parsed.unitProgress
        : {};
    return {
      ...DEFAULT_STATE,
      ...parsed,
      unitProgress: { ...DEFAULT_STATE.unitProgress, ...storedUnitProgress }
    };
  } catch {
    return { ...DEFAULT_STATE };
  }
}
```

Replace with:
```js
export function getState() {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(raw);
    const storedUnitProgress =
      parsed.unitProgress && typeof parsed.unitProgress === "object" && !Array.isArray(parsed.unitProgress)
        ? parsed.unitProgress
        : {};
    const storedCompletedLessons = Array.isArray(parsed.completedLessons) ? parsed.completedLessons : [];
    return {
      ...DEFAULT_STATE,
      ...parsed,
      unitProgress: { ...DEFAULT_STATE.unitProgress, ...storedUnitProgress },
      completedLessons: storedCompletedLessons
    };
  } catch {
    return { ...DEFAULT_STATE };
  }
}
```

- [ ] **Step 3: Add completeLesson()**

Add this new exported function after `setState` (before `resetProgress`):

```js
export function completeLesson({ lessonKey, unitId, unitProgressPercent, xpAward }) {
  const current = getState();
  if (current.completedLessons.includes(lessonKey)) {
    return current;
  }
  return setState({
    xp: current.xp + xpAward,
    completedLessons: [...current.completedLessons, lessonKey],
    unitProgress: { [unitId]: unitProgressPercent }
  });
}
```

Note: this relies on `setState`'s existing merge behavior (`unitProgress: { ...current.unitProgress, ...(partial.unitProgress || {}) }`), so passing only `{ [unitId]: unitProgressPercent }` correctly updates just that one unit's percentage without touching the other three — same pattern already used by every other caller of `setState`.

- [ ] **Step 4: Verify with a scratch script**

Run:
```
node -e "
globalThis.localStorage = { store:{}, getItem(k){return this.store[k]||null}, setItem(k,v){this.store[k]=v} };
import('./js/storage/progress-store.js').then(m => {
  console.log(m.getState().completedLessons, m.getState().xp);
  m.completeLesson({ lessonKey: 'unit-1/lesson-1', unitId: 'unit-1', unitProgressPercent: 33, xpAward: 20 });
  console.log(m.getState().completedLessons, m.getState().xp, m.getState().unitProgress);
  m.completeLesson({ lessonKey: 'unit-1/lesson-1', unitId: 'unit-1', unitProgressPercent: 33, xpAward: 20 });
  console.log(m.getState().completedLessons, m.getState().xp);
});
"
```
Expected: prints `[] 0`, then `['unit-1/lesson-1'] 20 { 'unit-1': 33, 'unit-2': 0, 'unit-3': 0, 'unit-4': 0 }`, then `['unit-1/lesson-1'] 20` again (unchanged — the second `completeLesson` call for the same `lessonKey` is a no-op, confirming no double XP award).

- [ ] **Step 5: Commit**

```bash
git add js/storage/progress-store.js
git commit -m "feat: add completedLessons tracking and completeLesson() to progress-store"
```

---

### Task 2: router.js — lesson routing, sidebar highlight, unit route wiring

**Files:**
- Modify: `js/router.js`

- [ ] **Step 1: Update the unit-1..unit-4 route table entries**

Find each of these 4 entries:
```js
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
```

Replace with:
```js
  "unit-1": {
    load: () => import("./modules/unit/unit.js"),
    meta: { unitId: "unit-1" }
  },
  "unit-2": {
    load: () => import("./modules/unit/unit.js"),
    meta: { unitId: "unit-2" }
  },
  "unit-3": {
    load: () => import("./modules/unit/unit.js"),
    meta: { unitId: "unit-3" }
  },
  "unit-4": {
    load: () => import("./modules/unit/unit.js"),
    meta: { unitId: "unit-4" }
  },
```

- [ ] **Step 2: Add lesson-route handling to handleRoute**

Find:
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

    await waitForTransitionEnd(mainEl, "route-fade-out", 300);

    if (myRequestId !== requestId) return;

    mainEl.classList.remove("route-fade-out");

    if (currentModule && typeof currentModule.unmount === "function") {
      currentModule.unmount();
    }

    currentModule = mod;
    await mod.mount(mainEl, entry.meta, () => myRequestId !== requestId);

    if (myRequestId !== requestId) return;

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

Replace with:
```js
const LESSON_ROUTE_PATTERN = /^(unit-\d+)\/(.+)$/;

async function handleRoute(mainEl, onRouteChange) {
  const routeId = (location.hash.replace(/^#\//, "") || DEFAULT_ROUTE);
  const lessonMatch = routeId.match(LESSON_ROUTE_PATTERN);

  let load;
  let meta;
  let sidebarRoute;

  if (lessonMatch) {
    const [, unitId, lessonId] = lessonMatch;
    load = () => import("./modules/lesson/lesson.js");
    meta = { unitId, lessonId };
    sidebarRoute = unitId;
  } else {
    const entry = routeTable[routeId];
    if (!entry) {
      location.hash = `#/${DEFAULT_ROUTE}`;
      return;
    }
    load = entry.load;
    meta = entry.meta;
    sidebarRoute = routeId;
  }

  const myRequestId = ++requestId;

  try {
    const mod = await load();

    if (myRequestId !== requestId) return;

    await waitForTransitionEnd(mainEl, "route-fade-out", 300);

    if (myRequestId !== requestId) return;

    mainEl.classList.remove("route-fade-out");

    if (currentModule && typeof currentModule.unmount === "function") {
      currentModule.unmount();
    }

    currentModule = mod;
    await mod.mount(mainEl, meta, () => myRequestId !== requestId);

    if (myRequestId !== requestId) return;

    onRouteChange(sidebarRoute);

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

Note what changed and why: the function now resolves `load`/`meta`/`sidebarRoute` from either the lesson-pattern match or the existing `routeTable` lookup *before* entering the same try/catch/staleness-guard body that was already there — every guard (`myRequestId !== requestId` after load, after the fade-out wait, after mount) is preserved verbatim, just now operating on `load`/`meta` local variables instead of `entry.load`/`entry.meta` directly. `onRouteChange` now receives `sidebarRoute` (the parent unit id for lesson routes, the route id unchanged for everything else) instead of always `routeId`, so `setActiveLink` in `sidebar.js` keeps the Unit link highlighted while viewing any lesson inside it — no changes needed to `sidebar.js` itself, since it already just compares whatever string it's given against link `href`s.

- [ ] **Step 3: Verify**

Run `node --check js/router.js` — expect no output. Manually trace: for `location.hash = "#/unit-1/lesson-1"`, `routeId` becomes `"unit-1/lesson-1"`, `lessonMatch` captures `["unit-1", "lesson-1"]`, so `load`/`meta`/`sidebarRoute` resolve to the lesson module / `{unitId:"unit-1", lessonId:"lesson-1"}` / `"unit-1"`. For `location.hash = "#/unit-1"`, `lessonMatch` is `null` (no `/` in `routeId`), so it falls through to the unchanged `routeTable["unit-1"]` lookup. For `location.hash = "#/nonexistent"`, `lessonMatch` is `null`, `routeTable["nonexistent"]` is `undefined`, redirect to default route — same as before this change.

- [ ] **Step 4: Commit**

```bash
git add js/router.js
git commit -m "feat: add unit-N/lesson-X route pattern, wire unit pages to real module"
```

---

### Task 3: Lesson content JSON (Unit 1's 3 lessons)

**Files:**
- Create: `json/lessons/unit-1-lesson-1.json`
- Create: `json/lessons/unit-1-lesson-2.json`
- Create: `json/lessons/unit-1-lesson-3.json`

- [ ] **Step 1: Write unit-1-lesson-1.json**

```json
{
  "title": "What Is Artificial Intelligence?",
  "sections": [
    {
      "heading": "Defining AI",
      "body": "Artificial intelligence is the field of building systems that perform tasks normally requiring human intelligence: recognizing images, understanding language, making decisions from incomplete information. It isn't one algorithm — it's a broad umbrella covering many different techniques aimed at that same general goal."
    },
    {
      "heading": "Narrow vs. General AI",
      "body": "Every AI system in everyday use today is \"narrow\" — built and trained for one job, like translating text or recommending videos. It can be extremely good at that one job and completely unable to do anything else. \"General\" AI, matching human-level flexibility across any task, remains a research goal, not something shipped in products today."
    },
    {
      "heading": "AI vs. Machine Learning",
      "body": "AI is the goal — building intelligent behavior. Machine learning is today's dominant approach to reaching it: instead of a person hand-coding every rule, a machine learning system learns patterns directly from examples. Most of what people call \"AI\" in current products is machine learning underneath."
    }
  ],
  "quiz": [
    {
      "question": "Which best describes \"narrow AI\"?",
      "options": [
        "A system that matches human intelligence across any task",
        "A system built to perform one specific task well",
        "A robot with a physical body",
        "An AI that can only run on small devices"
      ],
      "correctIndex": 1
    },
    {
      "question": "What's the relationship between AI and machine learning?",
      "options": [
        "They are the same thing",
        "Machine learning is unrelated to AI",
        "Machine learning is one approach used to build AI systems",
        "AI is a subset of machine learning"
      ],
      "correctIndex": 2
    },
    {
      "question": "True general AI (human-level, any task) exists today in deployed products.",
      "options": ["True", "False"],
      "correctIndex": 1
    }
  ]
}
```

- [ ] **Step 2: Write unit-1-lesson-2.json**

```json
{
  "title": "Data, Patterns, and Learning",
  "sections": [
    {
      "heading": "Why Data Matters",
      "body": "Machine learning systems aren't given explicit rules — they infer patterns from example data. The more representative that data is of the situations the system will actually face, the better it tends to generalize once it's in real use."
    },
    {
      "heading": "Training Data vs. Real-World Data",
      "body": "A model only learns what's present in its training data. If the training examples don't represent the full range of situations it'll encounter later, the model can fail in ways that seem surprising from the outside — this is where problems like bias and overfitting come from."
    },
    {
      "heading": "What \"Learning\" Means Here",
      "body": "In this context, \"learning\" means adjusting a model's internal numbers (its parameters) so its outputs get closer to correct answers across many training examples. It's a mathematical optimization process, not learning the way a person studies a subject."
    }
  ],
  "quiz": [
    {
      "question": "Why can a model fail on real-world situations it wasn't trained on?",
      "options": [
        "It intentionally refuses new situations",
        "Its patterns were learned only from its training data, which may not represent every case",
        "Models can only process numbers",
        "It ran out of storage"
      ],
      "correctIndex": 1
    },
    {
      "question": "In machine learning, \"learning\" primarily refers to:",
      "options": [
        "Memorizing exact training examples",
        "Adjusting internal parameters to reduce error over training examples",
        "A human manually programming rules",
        "Downloading more data automatically"
      ],
      "correctIndex": 1
    },
    {
      "question": "More representative training data generally leads to:",
      "options": [
        "Worse generalization",
        "No change",
        "Better generalization to new situations",
        "Slower hardware"
      ],
      "correctIndex": 2
    }
  ]
}
```

- [ ] **Step 3: Write unit-1-lesson-3.json**

```json
{
  "title": "Supervised vs. Unsupervised Learning",
  "sections": [
    {
      "heading": "Supervised Learning",
      "body": "In supervised learning, training examples come paired with correct answers, called labels. The model learns to map inputs to those labels — for example, learning to classify an email as spam or not-spam from many examples that were already labeled that way."
    },
    {
      "heading": "Unsupervised Learning",
      "body": "In unsupervised learning, there are no labels. The model finds structure in the data on its own — for example, grouping similar customers together (clustering) without being told in advance what the groups should be."
    },
    {
      "heading": "Choosing Between Them",
      "body": "Supervised learning needs labeled data, which is often costly or slow to produce, but it gives targeted, predictable results. Unsupervised learning needs no labels, but the patterns it discovers aren't guaranteed to be the ones that actually matter for your goal."
    }
  ],
  "quiz": [
    {
      "question": "What distinguishes supervised learning from unsupervised learning?",
      "options": [
        "Supervised uses labeled examples with correct answers; unsupervised does not",
        "Supervised is always more accurate",
        "Unsupervised requires more labels",
        "They are the same technique"
      ],
      "correctIndex": 0
    },
    {
      "question": "Which is an example of unsupervised learning?",
      "options": [
        "Predicting house prices from labeled sale data",
        "Classifying emails as spam using labeled examples",
        "Grouping customers into segments with no predefined categories",
        "Translating a sentence with a labeled parallel corpus"
      ],
      "correctIndex": 2
    },
    {
      "question": "A key cost of supervised learning is often:",
      "options": [
        "It requires no data at all",
        "Producing enough labeled examples",
        "It never needs training",
        "It cannot use numeric data"
      ],
      "correctIndex": 1
    }
  ]
}
```

- [ ] **Step 4: Verify**

Run: `node -e "['unit-1-lesson-1','unit-1-lesson-2','unit-1-lesson-3'].forEach(f => { JSON.parse(require('fs').readFileSync('json/lessons/' + f + '.json', 'utf8')); console.log(f, 'valid'); })"`
Expected: prints `unit-1-lesson-1 valid`, `unit-1-lesson-2 valid`, `unit-1-lesson-3 valid`.

Confirm each file's `title` matches the corresponding lesson title already in `json/course.json`'s `unit-1.lessons` array (`"What Is Artificial Intelligence?"`, `"Data, Patterns, and Learning"`, `"Supervised vs. Unsupervised Learning"`), and confirm every `correctIndex` is a valid index into that question's own `options` array (no out-of-range values).

- [ ] **Step 5: Commit**

```bash
git add json/lessons/unit-1-lesson-1.json json/lessons/unit-1-lesson-2.json json/lessons/unit-1-lesson-3.json
git commit -m "feat: author Unit 1 lesson content (3 lessons, text + quiz)"
```

---

### Task 4: Unit page styles

**Files:**
- Create: `css/components/unit.css`

- [ ] **Step 1: Write unit.css**

```css
/* css/components/unit.css */
.unit {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.unit__description {
  color: var(--color-text-muted);
}

.unit__lessons {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.unit-lesson-row {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  padding: var(--space-4);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  text-decoration: none;
  color: var(--color-text);
  transition: transform var(--duration-fast) var(--ease-standard),
    border-color var(--duration-fast) var(--ease-standard);
}

.unit-lesson-row:hover {
  transform: translateY(-2px);
  border-color: var(--color-primary);
}

.unit-lesson-row__title {
  font-weight: 600;
}

.unit-lesson-row__check {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--color-primary) 15%, transparent);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.unit-lesson-row__check svg {
  width: 14px;
  height: 14px;
}

.unit__error,
.unit__empty {
  color: var(--color-text-muted);
  text-align: center;
  padding: var(--space-6);
}
```

- [ ] **Step 2: Verify CSS is syntactically valid**

Not linked into `index.html` yet (Task 8). Confirm brace balance and that every `var(--...)` reference exists in `css/tokens.css`, including `--duration-fast`/`--ease-standard`/`color-mix(...)` (same pattern already used by `progress.css`, `roadmap.css`, `achievements.css`).

- [ ] **Step 3: Commit**

```bash
git add css/components/unit.css
git commit -m "feat: add unit page styles"
```

---

### Task 5: Unit page view module

**Files:**
- Create: `js/modules/unit/unit.js`

- [ ] **Step 1: Write unit.js**

```js
// js/modules/unit/unit.js
import { createEl } from "../../utils/dom.js";
import { getState } from "../../storage/progress-store.js";

export async function mount(container, meta, isStale) {
  container.innerHTML = "";

  const unitId = meta && meta.unitId;

  let courseData = { units: [] };
  try {
    const res = await fetch("json/course.json");
    if (!res.ok) throw new Error(`course.json fetch failed: ${res.status}`);
    courseData = await res.json();
    if (!Array.isArray(courseData.units)) {
      throw new Error("course.json 'units' field is missing or not an array");
    }
  } catch (err) {
    console.error("Failed to load course data:", err);
    if (isStale && isStale()) return;
    container.appendChild(
      createEl("div", { className: "unit__error", text: "Couldn't load this unit. Please try again later." })
    );
    return;
  }

  if (isStale && isStale()) return;

  const unit = courseData.units.find((u) => u.id === unitId);
  if (!unit) {
    container.appendChild(
      createEl("div", { className: "unit__error", text: "Couldn't find this unit." })
    );
    return;
  }

  const { completedLessons } = getState();

  const heading = createEl("h1", { text: unit.title });
  const description = createEl("div", { className: "unit__description", text: unit.description });

  const lessonsSection =
    unit.lessons.length === 0
      ? createEl("div", { className: "unit__empty", text: "Content for this unit hasn't been written yet." })
      : createEl("div", {
          className: "unit__lessons",
          children: unit.lessons.map((lesson) => renderLessonRow(unitId, lesson, completedLessons))
        });

  container.appendChild(
    createEl("div", { className: "unit", children: [heading, description, lessonsSection] })
  );

  if (window.lucide) window.lucide.createIcons();
}

export function unmount() {
  /* no-op: read-only view, nothing to clean up */
}

function renderLessonRow(unitId, lesson, completedLessons) {
  const isComplete = completedLessons.includes(`${unitId}/${lesson.id}`);

  const children = [createEl("span", { className: "unit-lesson-row__title", text: lesson.title })];

  if (isComplete) {
    const check = createEl("span", { className: "unit-lesson-row__check" });
    check.innerHTML = '<i data-lucide="check"></i>';
    children.unshift(check);
  }

  const row = createEl("a", {
    className: "unit-lesson-row",
    children,
    attrs: { href: `#/${unitId}/${lesson.id}` }
  });

  return row;
}
```

Note: `.unit-lesson-row` uses the same Lucide `innerHTML` + `data-lucide` pattern already established in `coming-soon.js`/`topbar.js`/`achievements.js`. The `if (window.lucide) window.lucide.createIcons();` call at the end of `mount()`'s success path (shown in the code above) matches `achievements.js`'s exact call site — without it, the check icon's `<i data-lucide="check">` tag would never get replaced with a real SVG.

- [ ] **Step 2: Verify with node --check**

Run: `node --check js/modules/unit/unit.js` — expect no output.

- [ ] **Step 3: Verify imports and Lucide call**

Confirm `js/storage/progress-store.js` exports `getState`. Confirm `js/utils/dom.js`'s `createEl` signature matches usage. Confirm the `if (window.lucide) window.lucide.createIcons();` line from the code above landed correctly right after the success-path `container.appendChild(...)` call.

- [ ] **Step 4: Commit**

```bash
git add js/modules/unit/unit.js
git commit -m "feat: add Unit page view (lesson list, completion checkmarks)"
```

---

### Task 6: Lesson viewer styles

**Files:**
- Create: `css/components/lesson.css`

- [ ] **Step 1: Write lesson.css**

```css
/* css/components/lesson.css */
.lesson {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  max-width: 720px;
}

.lesson__section {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.lesson__section-heading {
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 1.0625rem;
}

.lesson__section-body {
  white-space: pre-wrap;
  color: var(--color-text);
  line-height: 1.6;
}

.lesson__quiz {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.lesson__quiz-question {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.lesson__quiz-question-text {
  font-weight: 600;
}

.lesson__quiz-option-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.lesson__quiz-option-row--correct {
  color: var(--color-primary);
}

.lesson__quiz-option-row--incorrect {
  color: var(--color-error);
}

.lesson__quiz-submit {
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

.lesson__quiz-submit:hover {
  opacity: 0.9;
}

.lesson__quiz-submit:active {
  transform: scale(0.97);
}

.lesson__quiz-feedback {
  font-weight: 600;
}

.lesson__quiz-feedback--success {
  color: var(--color-primary);
}

.lesson__quiz-feedback--retry {
  color: var(--color-error);
}

.lesson__back-link {
  color: var(--color-primary);
  font-weight: 600;
  text-decoration: none;
  align-self: flex-start;
}

.lesson__back-link:hover {
  text-decoration: underline;
}

.lesson__error {
  color: var(--color-text-muted);
  text-align: center;
  padding: var(--space-6);
}
```

- [ ] **Step 2: Verify CSS is syntactically valid**

Not linked into `index.html` yet (Task 8). Confirm brace balance and that every `var(--...)` reference exists in `css/tokens.css`.

- [ ] **Step 3: Commit**

```bash
git add css/components/lesson.css
git commit -m "feat: add lesson viewer styles"
```

---

### Task 7: Lesson viewer view module

**Files:**
- Create: `js/modules/lesson/lesson.js`

- [ ] **Step 1: Write lesson.js**

```js
// js/modules/lesson/lesson.js
import { createEl } from "../../utils/dom.js";
import { getState, completeLesson } from "../../storage/progress-store.js";

const XP_PER_LESSON = 20;

let selectedAnswers = [];
let feedbackState = null; // null | "correct-all" | "has-wrong"
let justAwardedXp = false;

export async function mount(container, meta, isStale) {
  container.innerHTML = "";
  selectedAnswers = [];
  feedbackState = null;
  justAwardedXp = false;

  const unitId = meta && meta.unitId;
  const lessonId = meta && meta.lessonId;

  let courseData = { units: [] };
  let lessonData = null;

  try {
    const [courseRes, lessonRes] = await Promise.all([
      fetch("json/course.json"),
      fetch(`json/lessons/${unitId}-${lessonId}.json`)
    ]);
    if (!courseRes.ok) throw new Error(`course.json fetch failed: ${courseRes.status}`);
    if (!lessonRes.ok) throw new Error(`lesson fetch failed: ${lessonRes.status}`);
    courseData = await courseRes.json();
    lessonData = await lessonRes.json();
    if (!Array.isArray(courseData.units)) {
      throw new Error("course.json 'units' field is missing or not an array");
    }
    if (!lessonData || !Array.isArray(lessonData.sections) || !Array.isArray(lessonData.quiz)) {
      throw new Error("lesson data is missing 'sections' or 'quiz' arrays");
    }
  } catch (err) {
    console.error("Failed to load lesson:", err);
    if (isStale && isStale()) return;
    container.appendChild(
      createEl("div", { className: "lesson__error", text: "Couldn't load this lesson. Please try again later." })
    );
    return;
  }

  if (isStale && isStale()) return;

  const unit = courseData.units.find((u) => u.id === unitId);
  const totalLessonsInUnit = unit ? unit.lessons.length : 0;

  selectedAnswers = new Array(lessonData.quiz.length).fill(null);

  render(container, unitId, lessonId, lessonData, totalLessonsInUnit);
}

export function unmount() {
  selectedAnswers = [];
  feedbackState = null;
  justAwardedXp = false;
}

function render(container, unitId, lessonId, lessonData, totalLessonsInUnit) {
  container.innerHTML = "";

  const backLink = createEl("a", {
    className: "lesson__back-link",
    text: "← Back to unit",
    attrs: { href: `#/${unitId}` }
  });

  const heading = createEl("h1", { text: lessonData.title });

  const sections = lessonData.sections.map((section) =>
    createEl("div", {
      className: "lesson__section",
      children: [
        createEl("div", { className: "lesson__section-heading", text: section.heading }),
        createEl("div", { className: "lesson__section-body", text: section.body })
      ]
    })
  );

  const quiz = renderQuiz(container, unitId, lessonId, lessonData, totalLessonsInUnit);

  container.appendChild(
    createEl("div", { className: "lesson", children: [backLink, heading, ...sections, quiz] })
  );
}

function renderQuiz(container, unitId, lessonId, lessonData, totalLessonsInUnit) {
  const lessonKey = `${unitId}/${lessonId}`;
  const alreadyComplete = getState().completedLessons.includes(lessonKey);

  const questionEls = lessonData.quiz.map((q, qIndex) => renderQuestion(q, qIndex, container, unitId, lessonId, lessonData, totalLessonsInUnit));

  const children = [...questionEls];

  if (feedbackState === "correct-all" || alreadyComplete) {
    children.push(
      createEl("div", {
        className: "lesson__quiz-feedback lesson__quiz-feedback--success",
        text: justAwardedXp
          ? `Lesson complete! +${XP_PER_LESSON} XP`
          : "You've already completed this lesson."
      })
    );
  } else {
    if (feedbackState === "has-wrong") {
      children.push(
        createEl("div", {
          className: "lesson__quiz-feedback lesson__quiz-feedback--retry",
          text: "Not quite — review the highlighted answers and try again."
        })
      );
    }

    const submit = createEl("button", { className: "lesson__quiz-submit", text: "Submit" });
    submit.addEventListener("click", () => {
      const allCorrect = lessonData.quiz.every((q, i) => selectedAnswers[i] === q.correctIndex);
      feedbackState = allCorrect ? "correct-all" : "has-wrong";

      if (allCorrect) {
        const { completedLessons } = getState();
        const wasAlreadyComplete = completedLessons.includes(lessonKey);
        justAwardedXp = !wasAlreadyComplete;

        if (!wasAlreadyComplete) {
          const totalCompletedInUnit = completedLessons.filter((k) => k.startsWith(`${unitId}/`)).length;
          const unitProgressPercent = totalLessonsInUnit > 0
            ? Math.round(((totalCompletedInUnit + 1) / totalLessonsInUnit) * 100)
            : 0;
          completeLesson({ lessonKey, unitId, unitProgressPercent, xpAward: XP_PER_LESSON });
        }
      }

      render(container, unitId, lessonId, lessonData, totalLessonsInUnit);
    });
    children.push(submit);
  }

  return createEl("div", { className: "lesson__quiz", children });
}

function renderQuestion(q, qIndex, container, unitId, lessonId, lessonData, totalLessonsInUnit) {
  const showFeedback = feedbackState === "has-wrong";

  const optionRows = q.options.map((option, optIndex) => {
    const input = createEl("input", {
      attrs: { type: "radio", name: `quiz-q${qIndex}`, id: `quiz-q${qIndex}-opt${optIndex}` }
    });
    input.checked = selectedAnswers[qIndex] === optIndex;
    input.addEventListener("change", () => {
      selectedAnswers[qIndex] = optIndex;
    });

    const label = createEl("label", {
      attrs: { for: `quiz-q${qIndex}-opt${optIndex}` },
      text: option
    });

    let rowClass = "lesson__quiz-option-row";
    if (showFeedback) {
      if (optIndex === q.correctIndex) {
        rowClass += " lesson__quiz-option-row--correct";
      } else if (selectedAnswers[qIndex] === optIndex) {
        rowClass += " lesson__quiz-option-row--incorrect";
      }
    }

    return createEl("div", { className: rowClass, children: [input, label] });
  });

  return createEl("div", {
    className: "lesson__quiz-question",
    children: [createEl("div", { className: "lesson__quiz-question-text", text: q.question }), ...optionRows]
  });
}
```

- [ ] **Step 2: Verify with node --check**

Run: `node --check js/modules/lesson/lesson.js` — expect no output.

- [ ] **Step 3: Verify imports and logic**

Confirm `js/storage/progress-store.js` exports `getState` and `completeLesson` (added in Task 1) with the exact `{ lessonKey, unitId, unitProgressPercent, xpAward }` parameter shape this file calls it with. Confirm `js/utils/dom.js`'s `createEl` signature matches usage. Trace the percentage math for a 3-lesson unit: completing lesson 1 of 3 → `newCompletedCount = 1` → `Math.round((1/3)*100) = 33`; completing lesson 2 → `newCompletedCount = 2` → `67`; completing lesson 3 → `100`. Confirm resubmitting an already-completed lesson's correct quiz does not change `newCompletedCount` (the `getState().completedLessons.includes(lessonKey) ? totalCompleted : totalCompleted + 1` branch), so `completeLesson`'s own no-op-if-already-completed check is doubly safe.

- [ ] **Step 4: Commit**

```bash
git add js/modules/lesson/lesson.js
git commit -m "feat: add Lesson viewer (text sections + graded multiple-choice quiz)"
```

---

### Task 8: Wire CSS links into index.html

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Add unit.css and lesson.css links**

Add these two lines after the `css/components/roadmap.css` link (the last CSS link in `<head>`):

```html
  <link rel="stylesheet" href="css/components/unit.css" />
  <link rel="stylesheet" href="css/components/lesson.css" />
```

- [ ] **Step 2: Verify in browser**

Run: `npx serve .`, open printed URL, navigate `#/roadmap` → click Unit 1's "Start" link.
Expected: Unit page shows all 3 lessons, none checked. Click "What Is Artificial Intelligence?" — lesson text renders, quiz shows 3 questions with radio options. Select at least one wrong answer, click Submit — confirm incorrect options are highlighted in the error color, correct-but-unselected isn't highlighted, and a "Not quite" message shows; confirm you can change answers and resubmit. Select all correct answers, submit — confirm the success message with "+20 XP", and that `localStorage.ailp:progress` now shows `unit-1/lesson-1` in `completedLessons` and `unitProgress["unit-1"]` at `33`. Click "Back to unit" — confirm the lesson now shows a checkmark. Complete all 3 lessons — confirm `unitProgress["unit-1"]` reaches `100`, and that `#/dashboard`, `#/roadmap`, and `#/progress` (all unmodified, already shipped) reflect the new percentage and XP total. Re-open a completed lesson, resubmit its already-correct quiz, confirm XP does not increase again (still shows a completed-state message rather than double-awarding). Confirm the sidebar's "Unit 1" link stays highlighted the whole time you're viewing any of its lessons.

If no browser is available in your environment, do a structural trace instead (confirm both CSS link insertions, confirm `unit.js`/`lesson.js`'s imports resolve to real exports, confirm the router's lesson-pattern regex correctly matches sample hash strings) and report that live-browser verification wasn't possible — consistent with how every prior phase's tasks handled this environment limitation.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: link unit and lesson page styles"
```

---

## Self-Review Notes

- **Spec coverage:** router extension for `unit-N/lesson-X` routes + sidebar-highlight fix (Task 2) ✓; Unit page reading `meta.unitId`, listing lessons with completion checkmarks, no locking (Task 4, 5) ✓; Lesson viewer with text sections + graded quiz, all-correct-to-pass, unlimited retries, inline per-question feedback (Task 6, 7) ✓; `completedLessons` tracking + idempotent `completeLesson()` preventing double XP (Task 1) ✓; real authored content for Unit 1's 3 lessons (Task 3) ✓; fetch-hardening + `isStale` checks mirroring the Roadmap sub-project's established pattern in both new async modules (Task 5, 7) ✓; per-lesson JSON files separate from `course.json` (Task 3) ✓.
- **Type consistency:** `completeLesson({ lessonKey, unitId, unitProgressPercent, xpAward })`'s parameter names/shape (Task 1) exactly match the call site in `lesson.js` (Task 7). `lessonKey` format (`"unit-1/lesson-1"`) is identical between `progress-store.js`'s storage, `unit.js`'s completion-checkmark lookup (Task 5), and `lesson.js`'s own check (Task 7) — one shared format, no translation. `mount(container, meta, isStale)` three-argument signature is used consistently by both new modules, matching the contract `roadmap.js` already established. Router's `sidebarRoute` variable (Task 2) is the unit id for lesson routes and the plain route id otherwise, consumed unchanged by `onRouteChange`/`setActiveLink` with no changes needed to `sidebar.js`.
- **No placeholders:** every step has runnable code or an explicit manual-verification action; no TBD/TODO markers. Lesson content is real, fact-checked-at-authoring-time introductory AI/ML material, not lorem ipsum.
