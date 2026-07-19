// js/router.js
const routeTable = {
  dashboard: { load: () => import("./modules/dashboard/dashboard.js") },
  roadmap: {
    load: () => import("./modules/roadmap/roadmap.js")
  },
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
  "ai-lab": {
    load: () => import("./modules/coming-soon/coming-soon.js"),
    meta: { title: "AI Lab", phase: "Phase 4" }
  },
  flashcards: {
    load: () => import("./modules/flashcards/flashcards.js")
  },
  bookmarks: {
    load: () => import("./modules/bookmarks/bookmarks.js")
  },
  notes: {
    load: () => import("./modules/notes/notes.js")
  },
  search: {
    load: () => import("./modules/search/search.js")
  },
  progress: {
    load: () => import("./modules/progress/progress.js")
  },
  achievements: {
    load: () => import("./modules/achievements/achievements.js")
  },
  settings: {
    load: () => import("./modules/settings/settings.js")
  }
};

const DEFAULT_ROUTE = "dashboard";

let currentModule = null;
let requestId = 0;

export function initRouter(mainEl, onRouteChange) {
  window.addEventListener("hashchange", () => handleRoute(mainEl, onRouteChange));
  handleRoute(mainEl, onRouteChange);
}

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
