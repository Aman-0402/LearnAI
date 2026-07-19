// js/storage/theme-store.js
const THEME_KEY = "ailp:theme";

export function getSystemTheme() {
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function getStoredTheme() {
  try {
    return localStorage.getItem(THEME_KEY);
  } catch {
    return null;
  }
}

export function setStoredTheme(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* localStorage unavailable (private mode, quota) - theme just won't persist */
  }
}

export function resolveTheme() {
  const stored = getStoredTheme();
  if (stored === "light" || stored === "dark") return stored;
  return getSystemTheme();
}

export function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
}
