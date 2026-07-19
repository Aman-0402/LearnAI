// js/router.js
const routeTable = {
  dashboard: { load: () => import("./modules/dashboard/dashboard.js") },
  roadmap: {
    load: () => import("./modules/coming-soon/coming-soon.js"),
    meta: { title: "Course Roadmap", phase: "Phase 5" }
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
    load: () => import("./modules/coming-soon/coming-soon.js"),
    meta: { title: "Flashcards", phase: "Phase 2" }
  },
  bookmarks: {
    load: () => import("./modules/coming-soon/coming-soon.js"),
    meta: { title: "Bookmarks", phase: "Phase 2" }
  },
  notes: {
    load: () => import("./modules/coming-soon/coming-soon.js"),
    meta: { title: "Notes", phase: "Phase 2" }
  },
  search: {
    load: () => import("./modules/coming-soon/coming-soon.js"),
    meta: { title: "Search", phase: "Phase 2" }
  },
  progress: {
    load: () => import("./modules/coming-soon/coming-soon.js"),
    meta: { title: "Progress", phase: "Phase 2" }
  },
  achievements: {
    load: () => import("./modules/coming-soon/coming-soon.js"),
    meta: { title: "Achievements", phase: "Phase 2" }
  },
  settings: {
    load: () => import("./modules/coming-soon/coming-soon.js"),
    meta: { title: "Settings", phase: "Phase 2" }
  }
};

const DEFAULT_ROUTE = "dashboard";

let currentModule = null;

export function initRouter(mainEl, onRouteChange) {
  window.addEventListener("hashchange", () => handleRoute(mainEl, onRouteChange));
  handleRoute(mainEl, onRouteChange);
}

async function handleRoute(mainEl, onRouteChange) {
  const routeId = (location.hash.replace(/^#\//, "") || DEFAULT_ROUTE);
  const entry = routeTable[routeId];

  if (!entry) {
    location.hash = `#/${DEFAULT_ROUTE}`;
    return;
  }

  if (currentModule && typeof currentModule.unmount === "function") {
    currentModule.unmount();
  }

  const mod = await entry.load();
  currentModule = mod;
  mod.mount(mainEl, entry.meta);

  onRouteChange(routeId);
}
