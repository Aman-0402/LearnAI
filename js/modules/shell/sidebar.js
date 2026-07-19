// js/modules/shell/sidebar.js
import { createEl, clearChildren } from "../../utils/dom.js";
import { getState, getOverallProgressPercent } from "../../storage/progress-store.js";

export async function renderSidebar({ activeRoute }) {
  let navData = { main: [] };
  try {
    const res = await fetch("json/nav.json");
    if (!res.ok) throw new Error(`nav.json fetch failed: ${res.status}`);
    navData = await res.json();
  } catch (err) {
    console.error("Failed to load sidebar navigation:", err);
  }

  const list = createEl("ul", { className: "sidebar__nav" });
  for (const item of navData.main) {
    const link = createEl("a", {
      className: "sidebar__link",
      attrs: {
        href: `#/${item.route}`,
        "data-active": String(item.route === activeRoute)
      }
    });
    link.innerHTML = `<i data-lucide="${item.icon}"></i><span>${item.label}</span>`;
    const li = createEl("li", { children: [link] });
    list.appendChild(li);
  }

  const bottom = renderBottomBlock();

  const sidebar = createEl("nav", {
    className: "sidebar",
    attrs: { "aria-label": "Main navigation" },
    children: [list, bottom]
  });

  if (window.lucide) window.lucide.createIcons();

  return sidebar;
}

export function setActiveLink(sidebarEl, activeRoute) {
  const links = sidebarEl.querySelectorAll(".sidebar__link");
  links.forEach((link) => {
    const isActive = link.getAttribute("href") === `#/${activeRoute}`;
    link.setAttribute("data-active", String(isActive));
  });
}

function renderBottomBlock() {
  const state = getState();
  const overall = getOverallProgressPercent();

  const progressLabel = createEl("div", {
    className: "sidebar__stat-row",
    children: [
      createEl("span", { text: "Overall Progress" }),
      createEl("span", { text: `${overall}%` })
    ]
  });

  const progressBar = createEl("div", { className: "sidebar__progress-bar" });
  const progressFill = createEl("div", { className: "sidebar__progress-fill" });
  progressFill.style.width = `${overall}%`;
  progressBar.appendChild(progressFill);

  const currentLesson = createEl("div", {
    className: "sidebar__stat-row",
    children: [
      createEl("span", { text: "Current Lesson" }),
      createEl("span", { text: state.currentLesson || "None yet" })
    ]
  });

  const streak = createEl("div", {
    className: "sidebar__stat-row",
    children: [
      createEl("span", { text: "Daily Streak" }),
      createEl("span", { text: `${state.streak} days` })
    ]
  });

  const time = createEl("div", {
    className: "sidebar__stat-row",
    children: [
      createEl("span", { text: "Learning Time" }),
      createEl("span", { text: `${state.learningTime} min` })
    ]
  });

  return createEl("div", {
    className: "sidebar__bottom",
    children: [progressLabel, progressBar, currentLesson, streak, time]
  });
}
