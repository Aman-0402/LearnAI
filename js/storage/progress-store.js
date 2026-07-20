// js/storage/progress-store.js
const PROGRESS_KEY = "ailp:progress";

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

export function setState(partial) {
  const current = getState();
  const next = {
    ...current,
    ...partial,
    unitProgress: { ...current.unitProgress, ...(partial.unitProgress || {}) }
  };
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(next));
  } catch {
    /* localStorage unavailable - state just won't persist */
  }
  return next;
}

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

export function resetProgress() {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(DEFAULT_STATE));
  } catch {
    /* localStorage unavailable - nothing to reset */
  }
}

export function getOverallProgressPercent() {
  const { unitProgress } = getState();
  const values = Object.values(unitProgress);
  const total = values.reduce((sum, v) => sum + v, 0);
  return Math.round(total / values.length);
}
