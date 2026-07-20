// js/modules/roadmap/roadmap.js
import { createEl } from "../../utils/dom.js";
import { getState } from "../../storage/progress-store.js";

const UNIT_ACCENTS = ["var(--color-primary)", "var(--color-success)", "var(--color-accent)", "var(--color-warning)"];

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
    children: courseData.units.map((unit, index) =>
      renderUnitCard(container, courseData, unit, index, unitProgress[unit.id] || 0, completedLessons)
    )
  });

  container.appendChild(
    createEl("div", { className: "roadmap", children: [heading, units] })
  );

  if (window.lucide) window.lucide.createIcons();
}

function renderUnitCard(container, courseData, unit, index, percent, completedLessons) {
  const accent = UNIT_ACCENTS[index % UNIT_ACCENTS.length];
  const isExpanded = expandedUnits.has(unit.id);

  const lessonCountLabel =
    unit.lessons.length > 0
      ? `${unit.lessons.length} lesson${unit.lessons.length === 1 ? "" : "s"}`
      : "Content coming soon";

  const eyebrow = createEl("div", {
    className: "roadmap-unit-card__eyebrow",
    text: `Unit ${String(index + 1).padStart(2, "0")}`
  });

  const titleButton = createEl("button", {
    className: "roadmap-unit-card__title",
    attrs: { type: "button", "aria-expanded": String(isExpanded) },
    text: unit.title.replace(/^Unit \d+:\s*/, "")
  });

  const toggle = createEl("button", {
    className: "roadmap-unit-card__toggle",
    attrs: { type: "button", "aria-label": isExpanded ? "Collapse topics" : "Expand topics" }
  });
  toggle.innerHTML = '<i data-lucide="chevron-down"></i>';

  const onToggle = () => {
    if (expandedUnits.has(unit.id)) {
      expandedUnits.delete(unit.id);
    } else {
      expandedUnits.add(unit.id);
    }
    render(container, courseData);
  };
  titleButton.addEventListener("click", onToggle);
  toggle.addEventListener("click", onToggle);

  const header = createEl("div", {
    className: "roadmap-unit-card__header",
    children: [createEl("div", { className: "roadmap-unit-card__heading", children: [eyebrow, titleButton] }), toggle]
  });

  const fill = createEl("div", { className: "roadmap-unit-card__fill" });
  fill.style.width = `${percent}%`;

  const progressRow = createEl("div", {
    className: "roadmap-unit-card__progress-row",
    children: [
      createEl("div", { className: "roadmap-unit-card__bar", children: [fill] }),
      createEl("div", {
        className: "roadmap-unit-card__meta",
        children: [createEl("span", { className: "roadmap-unit-card__percent", text: `${percent}%` }), document.createTextNode(` · ${lessonCountLabel}`)]
      })
    ]
  });

  const children = [
    header,
    createEl("div", { className: "roadmap-unit-card__description", text: unit.description }),
    progressRow
  ];

  if (isExpanded) {
    children.push(renderTopicsList(unit, completedLessons));
  }

  const startIcon = createEl("span", {});
  startIcon.innerHTML = '<i data-lucide="arrow-right"></i>';
  const startLink = createEl("a", {
    className: "roadmap-unit-card__link",
    children: [createEl("span", { text: percent > 0 ? "Continue" : "Start" }), startIcon],
    attrs: { href: `#/${unit.id}` }
  });
  children.push(startLink);

  const card = createEl("div", {
    className: isExpanded ? "roadmap-unit-card roadmap-unit-card--expanded" : "roadmap-unit-card",
    children
  });
  card.style.setProperty("--unit-accent", accent);

  return card;
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
    children: unit.lessons.map((lesson, i) => renderTopicLink(unit, lesson, i, completedLessons))
  });
}

function renderTopicLink(unit, lesson, index, completedLessons) {
  const isComplete = completedLessons.includes(`${unit.id}/${lesson.id}`);

  const indexBadge = createEl("span", { className: "roadmap-unit-card__topic-index" });
  if (isComplete) {
    indexBadge.innerHTML = '<i data-lucide="check"></i>';
  } else {
    indexBadge.textContent = String(index + 1);
  }

  return createEl("a", {
    className: isComplete
      ? "roadmap-unit-card__topic-link roadmap-unit-card__topic-link--done"
      : "roadmap-unit-card__topic-link",
    children: [indexBadge, createEl("span", { className: "roadmap-unit-card__topic-title", text: lesson.title })],
    attrs: { href: `#/${unit.id}/${lesson.id}` }
  });
}
