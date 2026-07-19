// js/modules/dashboard/dashboard.js
import { createEl } from "../../utils/dom.js";
import { getState } from "../../storage/progress-store.js";

export function mount(container) {
  const state = getState();

  container.innerHTML = "";
  container.appendChild(
    createEl("div", {
      className: "dashboard",
      children: [renderHero(), renderStats(state), renderRow(state)]
    })
  );

  if (window.lucide) window.lucide.createIcons();
}

export function unmount() {
  /* no listeners/timers to clean up */
}

function renderHero() {
  const cta = createEl("button", { className: "dashboard__hero-cta", text: "Start your journey" });
  cta.addEventListener("click", () => {
    location.hash = "#/roadmap";
  });

  return createEl("div", {
    className: "dashboard__hero",
    children: [
      createEl("div", {
        children: [
          createEl("h1", { text: "Continue Learning" }),
          createEl("p", { text: "You haven't started a lesson yet. Explore the course roadmap to begin your AI journey." })
        ]
      }),
      cta
    ]
  });
}

function renderStats(state) {
  const overall = Math.round(
    Object.values(state.unitProgress).reduce((sum, v) => sum + v, 0) / Object.values(state.unitProgress).length
  );

  const stats = [
    { label: "XP", value: state.xp },
    { label: "Streak", value: `${state.streak} days` },
    { label: "Learning Time", value: `${state.learningTime} min` },
    { label: "Course Progress", value: `${overall}%` }
  ];

  const cards = stats.map((s) =>
    createEl("div", {
      className: "stat-card",
      children: [
        createEl("span", { className: "stat-card__label", text: s.label }),
        createEl("span", { className: "stat-card__value", text: String(s.value) })
      ]
    })
  );

  return createEl("div", { className: "dashboard__stats", children: cards });
}

function renderRow(state) {
  return createEl("div", {
    className: "dashboard__row",
    children: [renderUnitProgress(state), renderRecommended()]
  });
}

function renderUnitProgress(state) {
  const rows = Object.entries(state.unitProgress).map(([unitId, pct]) => {
    const label = unitId.replace("unit-", "Unit ");
    const bar = createEl("div", { className: "sidebar__progress-bar" });
    const fill = createEl("div", { className: "sidebar__progress-fill" });
    fill.style.width = `${pct}%`;
    bar.appendChild(fill);

    return createEl("div", {
      className: "unit-progress-row",
      children: [
        createEl("span", { className: "unit-progress-row__label", text: label }),
        bar,
        createEl("span", { className: "unit-progress-row__value", text: `${pct}%` })
      ]
    });
  });

  return createEl("div", {
    className: "panel",
    children: [createEl("h3", { text: "Unit Progress" }), ...rows]
  });
}

function renderRecommended() {
  const link = createEl("a", {
    attrs: { href: "#/unit-1" },
    text: "Go to lesson"
  });

  return createEl("div", {
    className: "panel recommended-card",
    children: [
      createEl("h3", { text: "Recommended Lesson" }),
      createEl("span", { text: "Unit 1 – Lesson 1" }),
      createEl("span", { className: "recommended-card__meta", text: "Introduction to Artificial Intelligence" }),
      link
    ]
  });
}
