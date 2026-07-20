// js/modules/roadmap/roadmap.js
import { createEl } from "../../utils/dom.js";
import { getState } from "../../storage/progress-store.js";

let expandedUnits = new Set();

export async function mount(container, meta, isStale) {
  container.innerHTML = "";
  expandedUnits = new Set();

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
      createEl("div", {
        className: "roadmap__error",
        text: "Couldn't load the course roadmap. Please try again later."
      })
    );
    return;
  }

  if (isStale && isStale()) return;

  render(container, courseData);
}

export function unmount() {
  expandedUnits = new Set();
}

function render(container, courseData) {
  container.innerHTML = "";

  const { unitProgress, completedLessons } = getState();

  const heading = createEl("h1", { text: "Course Roadmap" });

  const units = createEl("div", {
    className: "roadmap__units",
    children: courseData.units.map((unit) =>
      renderUnitCard(container, courseData, unit, unitProgress[unit.id] || 0, completedLessons)
    )
  });

  container.appendChild(
    createEl("div", { className: "roadmap", children: [heading, units] })
  );

  if (window.lucide) window.lucide.createIcons();
}

function renderUnitCard(container, courseData, unit, percent, completedLessons) {
  const lessonCountLabel =
    unit.lessons.length > 0
      ? `${unit.lessons.length} lesson${unit.lessons.length === 1 ? "" : "s"}`
      : "Content coming soon";

  const isExpanded = expandedUnits.has(unit.id);

  const fill = createEl("div", { className: "roadmap-unit-card__fill" });
  fill.style.width = `${percent}%`;

  const chevron = createEl("span", { className: "roadmap-unit-card__chevron" });
  chevron.innerHTML = '<i data-lucide="chevron-right"></i>';

  const titleButton = createEl("button", {
    className: "roadmap-unit-card__title",
    attrs: { type: "button", "aria-expanded": String(isExpanded) },
    children: [chevron, createEl("span", { text: unit.title })]
  });
  titleButton.addEventListener("click", () => {
    if (expandedUnits.has(unit.id)) {
      expandedUnits.delete(unit.id);
    } else {
      expandedUnits.add(unit.id);
    }
    render(container, courseData);
  });

  const children = [
    titleButton,
    createEl("div", { className: "roadmap-unit-card__description", text: unit.description }),
    createEl("div", { className: "roadmap-unit-card__meta", text: `${lessonCountLabel} · ${percent}% complete` }),
    createEl("div", { className: "roadmap-unit-card__bar", children: [fill] })
  ];

  if (isExpanded) {
    children.push(renderTopicsList(unit, completedLessons));
  }

  children.push(
    createEl("a", {
      className: "roadmap-unit-card__link",
      text: "Start",
      attrs: { href: `#/${unit.id}` }
    })
  );

  return createEl("div", {
    className: isExpanded ? "roadmap-unit-card roadmap-unit-card--expanded" : "roadmap-unit-card",
    children
  });
}

function renderTopicsList(unit, completedLessons) {
  if (unit.lessons.length === 0) {
    return createEl("div", {
      className: "roadmap-unit-card__topics-empty",
      text: "No topics published for this unit yet."
    });
  }

  return createEl("div", {
    className: "roadmap-unit-card__topics",
    children: unit.lessons.map((lesson) => renderTopicLink(unit, lesson, completedLessons))
  });
}

function renderTopicLink(unit, lesson, completedLessons) {
  const isComplete = completedLessons.includes(`${unit.id}/${lesson.id}`);

  const children = [createEl("span", { text: lesson.title })];

  if (isComplete) {
    const check = createEl("span", { className: "roadmap-unit-card__topic-check" });
    check.innerHTML = '<i data-lucide="check"></i>';
    children.unshift(check);
  }

  return createEl("a", {
    className: "roadmap-unit-card__topic-link",
    children,
    attrs: { href: `#/${unit.id}/${lesson.id}` }
  });
}
