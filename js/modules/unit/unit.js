// js/modules/unit/unit.js
import { createEl } from "../../utils/dom.js";
import { getState } from "../../storage/progress-store.js";

export async function mount(container, meta, isStale) {
  container.innerHTML = "";

  const unitId = meta && meta.unitId;

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
    if (isStale && isStale()) return;
    container.appendChild(
      createEl("div", { className: "unit__error", text: "Couldn't load this unit. Please try again later." })
    );
    return;
  }

  if (isStale && isStale()) return;

  const unit = courseData.units.find((u) => u.id === unitId);
  if (!unit) {
    container.appendChild(
      createEl("div", { className: "unit__error", text: "Couldn't find this unit." })
    );
    return;
  }

  const { completedLessons } = getState();

  const heading = createEl("h1", { text: unit.title });
  const description = createEl("div", { className: "unit__description", text: unit.description });

  const lessonsSection =
    unit.lessons.length === 0
      ? createEl("div", { className: "unit__empty", text: "Content for this unit hasn't been written yet." })
      : createEl("div", {
          className: "unit__lessons",
          children: unit.lessons.map((lesson) => renderLessonRow(unitId, lesson, completedLessons))
        });

  container.appendChild(
    createEl("div", { className: "unit", children: [heading, description, lessonsSection] })
  );

  if (window.lucide) window.lucide.createIcons();
}

export function unmount() {
  /* no-op: read-only view, nothing to clean up */
}

function renderLessonRow(unitId, lesson, completedLessons) {
  const isComplete = completedLessons.includes(`${unitId}/${lesson.id}`);

  const children = [createEl("span", { className: "unit-lesson-row__title", text: lesson.title })];

  if (isComplete) {
    const check = createEl("span", { className: "unit-lesson-row__check" });
    check.innerHTML = '<i data-lucide="check"></i>';
    children.unshift(check);
  }

  const row = createEl("a", {
    className: "unit-lesson-row",
    children,
    attrs: { href: `#/${unitId}/${lesson.id}` }
  });

  return row;
}
