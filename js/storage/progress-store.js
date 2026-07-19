// js/storage/progress-store.js
const PROGRESS_KEY = "ailp:progress";

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

export function getState() {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_STATE,
      ...parsed,
      unitProgress: { ...DEFAULT_STATE.unitProgress, ...(parsed.unitProgress || {}) }
    };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

export function setState(partial) {
  const next = { ...getState(), ...partial };
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(next));
  } catch {
    /* localStorage unavailable - state just won't persist */
  }
  return next;
}

export function getOverallProgressPercent() {
  const { unitProgress } = getState();
  const values = Object.values(unitProgress);
  const total = values.reduce((sum, v) => sum + v, 0);
  return Math.round(total / values.length);
}
