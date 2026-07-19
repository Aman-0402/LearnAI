// js/modules/shell/theme-toggle.js
import { resolveTheme, applyTheme, setStoredTheme } from "../../storage/theme-store.js";

export function initThemeToggle(buttonEl) {
  const initial = resolveTheme();
  applyTheme(initial);
  updateIcon(buttonEl, initial);

  buttonEl.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme") || resolveTheme();
    const next = current === "dark" ? "light" : "dark";
    applyTheme(next);
    setStoredTheme(next);
    updateIcon(buttonEl, next);
  });
}

function updateIcon(buttonEl, theme) {
  buttonEl.innerHTML = "";
  const icon = document.createElement("i");
  icon.setAttribute("data-lucide", theme === "dark" ? "moon" : "sun");
  buttonEl.appendChild(icon);
  if (window.lucide) window.lucide.createIcons();
}
