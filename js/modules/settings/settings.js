// js/modules/settings/settings.js
import { createEl } from "../../utils/dom.js";
import {
  getStoredTheme,
  applyTheme,
  setStoredTheme,
  clearStoredTheme,
  getSystemTheme
} from "../../storage/theme-store.js";
import { getSettings, setSettings } from "../../storage/settings-store.js";
import { resetProgress } from "../../storage/progress-store.js";

export function mount(container) {
  container.innerHTML = "";
  container.appendChild(
    createEl("div", {
      className: "settings",
      children: [renderAppearanceCard(), renderLearningCard(), renderDataCard()]
    })
  );
}

export function unmount() {
  /* no listeners/timers to clean up */
}

function renderAppearanceCard() {
  const stored = getStoredTheme();

  const radioRows = ["light", "dark", "system"].map((value) => {
    const isChecked = value === "system" ? stored === null : stored === value;

    const input = createEl("input", {
      attrs: { type: "radio", name: "theme-mode", value, id: `theme-${value}` }
    });
    input.checked = isChecked;
    input.addEventListener("change", () => {
      if (value === "system") {
        clearStoredTheme();
        applyTheme(getSystemTheme());
      } else {
        applyTheme(value);
        setStoredTheme(value);
      }
    });

    const label = createEl("label", {
      attrs: { for: `theme-${value}` },
      text: value.charAt(0).toUpperCase() + value.slice(1)
    });

    return createEl("div", { className: "settings__radio-row", children: [input, label] });
  });

  const settings = getSettings();
  const reducedMotionCheckbox = createEl("input", {
    attrs: { type: "checkbox", id: "reduced-motion" }
  });
  reducedMotionCheckbox.checked = settings.reducedMotion;
  reducedMotionCheckbox.addEventListener("change", (event) => {
    const checked = event.target.checked;
    setSettings({ reducedMotion: checked });
    document.documentElement.setAttribute("data-reduced-motion", String(checked));
  });

  const reducedMotionRow = createEl("div", {
    className: "settings__checkbox-row",
    children: [
      reducedMotionCheckbox,
      createEl("label", { attrs: { for: "reduced-motion" }, text: "Reduce motion" })
    ]
  });

  return createEl("div", {
    className: "panel settings__card",
    children: [createEl("h2", { text: "Appearance" }), ...radioRows, reducedMotionRow]
  });
}

function renderLearningCard() {
  const settings = getSettings();

  const label = createEl("label", {
    attrs: { for: "daily-goal" },
    text: "Daily goal (minutes)"
  });

  const input = createEl("input", {
    className: "settings__number-input",
    attrs: { type: "number", id: "daily-goal", min: "5", max: "240", step: "5" }
  });
  input.value = settings.dailyGoalMinutes;

  input.addEventListener("change", () => {
    let value = parseInt(input.value, 10);
    if (Number.isNaN(value)) value = 15;
    value = Math.min(240, Math.max(5, value));
    input.value = value;
    setSettings({ dailyGoalMinutes: value });
  });

  return createEl("div", {
    className: "panel settings__card",
    children: [createEl("h2", { text: "Learning" }), label, input]
  });
}

function renderDataCard() {
  const button = createEl("button", {
    className: "settings__danger-button",
    text: "Reset Progress"
  });

  button.addEventListener("click", () => {
    const confirmed = confirm(
      "This will permanently erase your XP, streak, and unit progress. This cannot be undone. Continue?"
    );
    if (confirmed) {
      resetProgress();
      location.reload();
    }
  });

  return createEl("div", {
    className: "panel settings__card settings__card--danger",
    children: [
      createEl("h2", { text: "Data" }),
      createEl("p", { text: "Permanently clear your saved learning progress." }),
      button
    ]
  });
}
