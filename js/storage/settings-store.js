// js/storage/settings-store.js
const SETTINGS_KEY = "ailp:settings";

const DEFAULT_SETTINGS = {
  reducedMotion: false,
  dailyGoalMinutes: 15
};

export function getSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function setSettings(partial) {
  const next = { ...getSettings(), ...partial };
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  } catch {
    /* localStorage unavailable - settings just won't persist */
  }
  return next;
}
