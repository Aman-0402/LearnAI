// js/modules/shell/theme-toggle.js
import { resolveTheme, applyTheme, setStoredTheme } from "../../storage/theme-store.js";

export function initThemeToggle(buttonEl) {
  let current = resolveTheme();
  applyTheme(current);
  updateIcon(buttonEl, current);

  buttonEl.addEventListener("click", () => {
    current = current === "dark" ? "light" : "dark";
    applyTheme(current);
    setStoredTheme(current);
    updateIcon(buttonEl, current);
  });
}

function updateIcon(buttonEl, theme) {
  buttonEl.innerHTML = "";
  const icon = document.createElement("i");
  icon.setAttribute("data-lucide", theme === "dark" ? "moon" : "sun");
  buttonEl.appendChild(icon);
  if (window.lucide) window.lucide.createIcons();
}
