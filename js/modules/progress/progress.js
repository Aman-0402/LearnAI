// js/modules/progress/progress.js
import { createEl } from "../../utils/dom.js";
import { getState, getOverallProgressPercent } from "../../storage/progress-store.js";

export function mount(container) {
  render(container);
}

export function unmount() {
  /* no-op: read-only view, nothing to clean up */
}

function unitLabel(key) {
  const match = key.match(/^unit-(\d+)$/);
  return match ? `Unit ${match[1]}` : key;
}

function render(container) {
  container.innerHTML = "";

  const state = getState();
  const overall = getOverallProgressPercent();

  const heading = createEl("h1", { text: "Progress" });

  const stats = createEl("div", {
    className: "dashboard__stats",
    children: [
      renderStat("XP", state.xp),
      renderStat("Streak", `${state.streak} days`),
      renderStat("Learning Time", `${state.learningTime} min`),
      renderStat("Overall", `${overall}%`)
    ]
  });

  const unitEntries = Object.entries(state.unitProgress);
  const units = createEl("div", {
    className: "progress__units",
    children: unitEntries.map(([key, percent]) => renderUnitCard(key, percent))
  });

  container.appendChild(
    createEl("div", { className: "progress", children: [heading, stats, units] })
  );
}

function renderStat(label, value) {
  return createEl("div", {
    className: "stat-card",
    children: [
      createEl("span", { className: "stat-card__label", text: label }),
      createEl("span", { className: "stat-card__value", text: String(value) })
    ]
  });
}

function renderUnitCard(key, percent) {
  const fill = createEl("div", { className: "progress-unit-card__fill" });
  fill.style.width = `${percent}%`;

  return createEl("div", {
    className: "progress-unit-card",
    children: [
      createEl("div", {
        className: "progress-unit-card__top",
        children: [
          createEl("div", { className: "progress-unit-card__label", text: unitLabel(key) }),
          createEl("div", { className: "progress-unit-card__percent", text: `${percent}%` })
        ]
      }),
      createEl("div", { className: "progress-unit-card__bar", children: [fill] }),
      createEl("a", {
        className: "progress-unit-card__link",
        text: "Continue",
        attrs: { href: `#/${key}` }
      })
    ]
  });
}
