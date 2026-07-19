// js/modules/achievements/achievements.js
import { createEl } from "../../utils/dom.js";
import { getState } from "../../storage/progress-store.js";

const ACHIEVEMENTS = [
  {
    id: "first-steps",
    title: "First Steps",
    description: "Log your first minute of learning time",
    check: (s) => s.learningTime > 0
  },
  {
    id: "xp-100",
    title: "Century",
    description: "Earn 100 XP",
    check: (s) => s.xp >= 100
  },
  {
    id: "xp-500",
    title: "High Achiever",
    description: "Earn 500 XP",
    check: (s) => s.xp >= 500
  },
  {
    id: "streak-3",
    title: "On a Roll",
    description: "Reach a 3-day streak",
    check: (s) => s.streak >= 3
  },
  {
    id: "streak-7",
    title: "Committed",
    description: "Reach a 7-day streak",
    check: (s) => s.streak >= 7
  },
  {
    id: "unit-complete",
    title: "Unit Complete",
    description: "Finish any unit (100%)",
    check: (s) => Object.values(s.unitProgress).some((v) => v >= 100)
  },
  {
    id: "all-units",
    title: "Course Complete",
    description: "Finish all 4 units",
    check: (s) => Object.values(s.unitProgress).every((v) => v >= 100)
  }
];

export function mount(container) {
  render(container);
}

export function unmount() {
  /* no-op: read-only view, nothing to clean up */
}

function render(container) {
  container.innerHTML = "";

  const state = getState();
  const results = ACHIEVEMENTS.map((a) => ({ ...a, unlocked: a.check(state) }));
  const unlockedCount = results.filter((a) => a.unlocked).length;

  const heading = createEl("h1", { text: "Achievements" });

  const summary = createEl("div", {
    className: "achievements__summary",
    text: `${unlockedCount} of ${ACHIEVEMENTS.length} unlocked`
  });

  const grid = createEl("div", {
    className: "achievements__grid",
    children: results.map(renderCard)
  });

  container.appendChild(
    createEl("div", { className: "achievements", children: [heading, summary, grid] })
  );

  if (window.lucide) window.lucide.createIcons();
}

function renderCard(achievement) {
  const iconWrap = createEl("div", { className: "achievement-card__icon" });
  iconWrap.innerHTML = achievement.unlocked ? '<i data-lucide="check"></i>' : '<i data-lucide="lock"></i>';

  return createEl("div", {
    className: achievement.unlocked ? "achievement-card" : "achievement-card achievement-card--locked",
    children: [
      iconWrap,
      createEl("div", { className: "achievement-card__title", text: achievement.title }),
      createEl("div", { className: "achievement-card__description", text: achievement.description })
    ]
  });
}
