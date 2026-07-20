// js/modules/lesson/lesson.js
import { createEl } from "../../utils/dom.js";
import { getState, completeLesson } from "../../storage/progress-store.js";

const XP_PER_LESSON = 20;

let selectedAnswers = [];
let feedbackState = null; // null | "correct-all" | "has-wrong"

export async function mount(container, meta, isStale) {
  container.innerHTML = "";
  selectedAnswers = [];
  feedbackState = null;

  const unitId = meta && meta.unitId;
  const lessonId = meta && meta.lessonId;

  let courseData = { units: [] };
  let lessonData = null;

  try {
    const [courseRes, lessonRes] = await Promise.all([
      fetch("json/course.json"),
      fetch(`json/lessons/${unitId}-${lessonId}.json`)
    ]);
    if (!courseRes.ok) throw new Error(`course.json fetch failed: ${courseRes.status}`);
    if (!lessonRes.ok) throw new Error(`lesson fetch failed: ${lessonRes.status}`);
    courseData = await courseRes.json();
    lessonData = await lessonRes.json();
    if (!Array.isArray(courseData.units)) {
      throw new Error("course.json 'units' field is missing or not an array");
    }
    if (!lessonData || !Array.isArray(lessonData.sections) || !Array.isArray(lessonData.quiz)) {
      throw new Error("lesson data is missing 'sections' or 'quiz' arrays");
    }
  } catch (err) {
    console.error("Failed to load lesson:", err);
    if (isStale && isStale()) return;
    container.appendChild(
      createEl("div", { className: "lesson__error", text: "Couldn't load this lesson. Please try again later." })
    );
    return;
  }

  if (isStale && isStale()) return;

  const unit = courseData.units.find((u) => u.id === unitId);
  const totalLessonsInUnit = unit ? unit.lessons.length : 0;

  selectedAnswers = new Array(lessonData.quiz.length).fill(null);

  render(container, unitId, lessonId, lessonData, totalLessonsInUnit);
}

export function unmount() {
  selectedAnswers = [];
  feedbackState = null;
}

function render(container, unitId, lessonId, lessonData, totalLessonsInUnit) {
  container.innerHTML = "";

  const backLink = createEl("a", {
    className: "lesson__back-link",
    text: "← Back to unit",
    attrs: { href: `#/${unitId}` }
  });

  const heading = createEl("h1", { text: lessonData.title });

  const sections = lessonData.sections.map((section) =>
    createEl("div", {
      className: "lesson__section",
      children: [
        createEl("div", { className: "lesson__section-heading", text: section.heading }),
        createEl("div", { className: "lesson__section-body", text: section.body })
      ]
    })
  );

  const quiz = renderQuiz(container, unitId, lessonId, lessonData, totalLessonsInUnit);

  container.appendChild(
    createEl("div", { className: "lesson", children: [backLink, heading, ...sections, quiz] })
  );
}

function renderQuiz(container, unitId, lessonId, lessonData, totalLessonsInUnit) {
  const lessonKey = `${unitId}/${lessonId}`;
  const alreadyComplete = getState().completedLessons.includes(lessonKey);

  const questionEls = lessonData.quiz.map((q, qIndex) => renderQuestion(q, qIndex, container, unitId, lessonId, lessonData, totalLessonsInUnit));

  const children = [...questionEls];

  if (feedbackState === "correct-all" || alreadyComplete) {
    children.push(
      createEl("div", {
        className: "lesson__quiz-feedback lesson__quiz-feedback--success",
        text: alreadyComplete && feedbackState !== "correct-all"
          ? "You've already completed this lesson."
          : `Lesson complete! +${XP_PER_LESSON} XP`
      })
    );
  } else {
    if (feedbackState === "has-wrong") {
      children.push(
        createEl("div", {
          className: "lesson__quiz-feedback lesson__quiz-feedback--retry",
          text: "Not quite — review the highlighted answers and try again."
        })
      );
    }

    const submit = createEl("button", { className: "lesson__quiz-submit", text: "Submit" });
    submit.addEventListener("click", () => {
      const allCorrect = lessonData.quiz.every((q, i) => selectedAnswers[i] === q.correctIndex);
      feedbackState = allCorrect ? "correct-all" : "has-wrong";

      if (allCorrect) {
        const totalCompleted = getState().completedLessons.filter((k) => k.startsWith(`${unitId}/`)).length;
        const newCompletedCount = getState().completedLessons.includes(lessonKey)
          ? totalCompleted
          : totalCompleted + 1;
        const unitProgressPercent = totalLessonsInUnit > 0
          ? Math.round((newCompletedCount / totalLessonsInUnit) * 100)
          : 0;
        completeLesson({ lessonKey, unitId, unitProgressPercent, xpAward: XP_PER_LESSON });
      }

      render(container, unitId, lessonId, lessonData, totalLessonsInUnit);
    });
    children.push(submit);
  }

  return createEl("div", { className: "lesson__quiz", children });
}

function renderQuestion(q, qIndex, container, unitId, lessonId, lessonData, totalLessonsInUnit) {
  const showFeedback = feedbackState === "has-wrong";

  const optionRows = q.options.map((option, optIndex) => {
    const input = createEl("input", {
      attrs: { type: "radio", name: `quiz-q${qIndex}`, id: `quiz-q${qIndex}-opt${optIndex}` }
    });
    input.checked = selectedAnswers[qIndex] === optIndex;
    input.addEventListener("change", () => {
      selectedAnswers[qIndex] = optIndex;
    });

    const label = createEl("label", {
      attrs: { for: `quiz-q${qIndex}-opt${optIndex}` },
      text: option
    });

    let rowClass = "lesson__quiz-option-row";
    if (showFeedback && selectedAnswers[qIndex] === optIndex) {
      rowClass += optIndex === q.correctIndex
        ? " lesson__quiz-option-row--correct"
        : " lesson__quiz-option-row--incorrect";
    }

    return createEl("div", { className: rowClass, children: [input, label] });
  });

  return createEl("div", {
    className: "lesson__quiz-question",
    children: [createEl("div", { className: "lesson__quiz-question-text", text: q.question }), ...optionRows]
  });
}
