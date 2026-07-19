// js/modules/roadmap/roadmap.js
import { createEl } from "../../utils/dom.js";
import { getState } from "../../storage/progress-store.js";

export async function mount(container) {
  container.innerHTML = "";

  let courseData = { units: [] };
  try {
    const res = await fetch("json/course.json");
    if (!res.ok) throw new Error(`course.json fetch failed: ${res.status}`);
    courseData = await res.json();
    if (!Array.isArray(courseData.units)) {
      throw new Error("course.json 'units' field is missing or not an array");
    }
  } catch (err) {
    console.error("Failed to load course data:", err);
    container.appendChild(
      createEl("div", {
        className: "roadmap__error",
        text: "Couldn't load the course roadmap. Please try again later."
      })
    );
    return;
  }

  const { unitProgress } = getState();

  const heading = createEl("h1", { text: "Course Roadmap" });

  const units = createEl("div", {
    className: "roadmap__units",
    children: courseData.units.map((unit) => renderUnitCard(unit, unitProgress[unit.id] || 0))
  });

  container.appendChild(
    createEl("div", { className: "roadmap", children: [heading, units] })
  );
}

export function unmount() {
  /* no-op: read-only view, nothing to clean up */
}

function renderUnitCard(unit, percent) {
  const lessonCountLabel =
    unit.lessons.length > 0
      ? `${unit.lessons.length} lesson${unit.lessons.length === 1 ? "" : "s"}`
      : "Content coming soon";

  const fill = createEl("div", { className: "roadmap-unit-card__fill" });
  fill.style.width = `${percent}%`;

  return createEl("div", {
    className: "roadmap-unit-card",
    children: [
      createEl("div", { className: "roadmap-unit-card__title", text: unit.title }),
      createEl("div", { className: "roadmap-unit-card__description", text: unit.description }),
      createEl("div", { className: "roadmap-unit-card__meta", text: `${lessonCountLabel} · ${percent}% complete` }),
      createEl("div", { className: "roadmap-unit-card__bar", children: [fill] }),
      createEl("a", {
        className: "roadmap-unit-card__link",
        text: "Start",
        attrs: { href: `#/${unit.id}` }
      })
    ]
  });
}
