// js/modules/shell/topbar.js
import { createEl } from "../../utils/dom.js";
import { getState } from "../../storage/progress-store.js";
import { initThemeToggle } from "./theme-toggle.js";

export function renderTopbar({ onHamburgerClick }) {
  const hamburger = createEl("button", {
    className: "topbar__hamburger",
    attrs: { "aria-label": "Toggle navigation menu" }
  });
  hamburger.innerHTML = '<i data-lucide="menu"></i>';
  hamburger.addEventListener("click", onHamburgerClick);

  const logo = createEl("div", { className: "topbar__logo", text: "AI Learning Platform" });

  const search = createEl("div", { className: "topbar__search" });
  search.innerHTML = '<i data-lucide="search"></i>';
  const searchInput = createEl("input", {
    attrs: { type: "text", placeholder: "Search lessons, terms, concepts...", "aria-label": "Search lessons, terms, concepts" }
  });
  search.appendChild(searchInput);

  const { streak } = getState();
  const streakBadge = createEl("div", {
    className: "topbar__streak",
    text: `\u{1F525} ${streak}`
  });

  const themeToggle = createEl("button", {
    className: "topbar__theme-toggle",
    attrs: { "aria-label": "Toggle color theme" }
  });

  const actions = createEl("div", { className: "topbar__actions", children: [streakBadge, themeToggle] });

  const topbar = createEl("header", {
    className: "topbar",
    attrs: { role: "banner" },
    children: [hamburger, logo, search, actions]
  });

  initThemeToggle(themeToggle);
  if (window.lucide) window.lucide.createIcons();

  return topbar;
}
