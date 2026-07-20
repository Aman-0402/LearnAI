// js/modules/lesson/lesson.js
import { createEl } from "../../utils/dom.js";
import { getState, completeLesson, addXp } from "../../storage/progress-store.js";

const DEFAULT_QUESTION_XP = 5;

let selectedAnswers = [];
let questionStatus = []; // null | "correct" | "wrong", per question index
let xpAwardedThisSession = new Set();
let lessonWasCompleteAtMount = false;
let justCompletedTopic = false;
let currentUnit = null;

export async function mount(container, meta, isStale) {
  container.innerHTML = "";
  selectedAnswers = [];
  questionStatus = [];
  xpAwardedThisSession = new Set();
  lessonWasCompleteAtMount = false;
  justCompletedTopic = false;
  currentUnit = null;

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
  currentUnit = unit || null;

  selectedAnswers = new Array(lessonData.quiz.length).fill(null);
  questionStatus = new Array(lessonData.quiz.length).fill(null);
  lessonWasCompleteAtMount = getState().completedLessons.includes(`${unitId}/${lessonId}`);

  render(container, unitId, lessonId, lessonData, totalLessonsInUnit);
}

export function unmount() {
  selectedAnswers = [];
  questionStatus = [];
  xpAwardedThisSession = new Set();
  lessonWasCompleteAtMount = false;
  justCompletedTopic = false;
  currentUnit = null;
}

function render(container, unitId, lessonId, lessonData, totalLessonsInUnit) {
  container.innerHTML = "";

  const backLink = createEl("a", {
    className: "lesson__back-link",
    text: "← Back to unit",
    attrs: { href: `#/${unitId}` }
  });

  const heading = createEl("h1", { text: lessonData.title });

  const sections = lessonData.sections.map((section, sIndex) => {
    const children = [
      createEl("div", {
        className: "lesson__section-number",
        text: `Section ${sIndex + 1}`
      }),
      createEl("div", { className: "lesson__section-heading", text: section.heading })
    ];

    if (section.intro) {
      children.push(createEl("div", { className: "lesson__section-body", text: section.intro }));
    }

    if (Array.isArray(section.blocks) && section.blocks.length > 0) {
      section.blocks.forEach((block) => children.push(renderContentBlock(block)));
    } else if (section.body) {
      children.push(createEl("div", { className: "lesson__section-body", text: section.body }));
    }

    if (section.image) {
      const img = createEl("img", {
        className: "lesson__section-image",
        attrs: { src: encodeURI(section.image), alt: section.heading, loading: "lazy" }
      });
      children.push(img);
    }

    if (Array.isArray(section.interviewQA) && section.interviewQA.length > 0) {
      children.push(renderQAList("Interview Questions", section.interviewQA));
    }

    if (Array.isArray(section.examQuestions) && section.examQuestions.length > 0) {
      children.push(renderExamQuestions(section.examQuestions));
    }

    return createEl("div", { className: "lesson__section", children });
  });

  const quiz = renderQuiz(container, unitId, lessonId, lessonData, totalLessonsInUnit);

  const footerNav = renderFooterNav(unitId, lessonId);

  container.appendChild(
    createEl("div", { className: "lesson", children: [backLink, heading, ...sections, quiz, ...(footerNav ? [footerNav] : [])] })
  );

  if (window.lucide) window.lucide.createIcons();
}

function renderQuiz(container, unitId, lessonId, lessonData, totalLessonsInUnit) {
  const quizHeading = createEl("div", { className: "lesson__quiz-heading", text: "Knowledge Check" });

  const questionEls = lessonData.quiz.map((q, qIndex) =>
    renderQuestion(q, qIndex, container, unitId, lessonId, lessonData, totalLessonsInUnit)
  );

  const children = [quizHeading, ...questionEls];

  const allCorrect = lessonData.quiz.every((q, i) => questionStatus[i] === "correct");

  if (lessonWasCompleteAtMount || allCorrect) {
    children.push(
      createEl("div", {
        className: "lesson__quiz-feedback lesson__quiz-feedback--success",
        text: justCompletedTopic
          ? "Topic complete! All questions answered correctly."
          : "You've already completed this lesson."
      })
    );
  }

  return createEl("div", { className: "lesson__quiz", children });
}

function renderQuestion(q, qIndex, container, unitId, lessonId, lessonData, totalLessonsInUnit) {
  const lessonKey = `${unitId}/${lessonId}`;
  const status = questionStatus[qIndex];
  const questionXp = q.xp || DEFAULT_QUESTION_XP;

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
    if (status === "wrong") {
      if (optIndex === q.correctIndex) {
        rowClass += " lesson__quiz-option-row--correct";
      } else if (selectedAnswers[qIndex] === optIndex) {
        rowClass += " lesson__quiz-option-row--incorrect";
      }
    }

    return createEl("div", { className: rowClass, children: [input, label] });
  });

  const children = [
    createEl("div", {
      className: "lesson__quiz-question-header",
      children: [
        createEl("span", { className: "lesson__quiz-question-number", text: `Q${qIndex + 1}` }),
        createEl("span", { className: "lesson__quiz-question-text", text: q.question }),
        createEl("span", { className: "lesson__quiz-question-xp", text: `+${questionXp} XP` })
      ]
    }),
    ...optionRows
  ];

  if (status === "correct") {
    children.push(
      createEl("div", {
        className: "lesson__quiz-question-feedback lesson__quiz-question-feedback--correct",
        text: `Correct! +${questionXp} XP`
      })
    );
  } else if (status === "wrong") {
    children.push(
      createEl("div", {
        className: "lesson__quiz-question-feedback lesson__quiz-question-feedback--wrong",
        text: "Not quite — the correct answer is highlighted above. Try again."
      })
    );
  } else {
    const submit = createEl("button", { className: "lesson__quiz-question-submit", text: "Submit Answer" });
    submit.addEventListener("click", () => {
      const isCorrect = selectedAnswers[qIndex] === q.correctIndex;
      questionStatus[qIndex] = isCorrect ? "correct" : "wrong";

      if (isCorrect && !lessonWasCompleteAtMount && !xpAwardedThisSession.has(qIndex)) {
        xpAwardedThisSession.add(qIndex);
        addXp(questionXp);
      }

      const allCorrect = lessonData.quiz.every((qq, ii) => questionStatus[ii] === "correct");
      if (isCorrect && allCorrect && !lessonWasCompleteAtMount) {
        const { completedLessons } = getState();
        if (!completedLessons.includes(lessonKey)) {
          const totalCompletedInUnit = completedLessons.filter((k) => k.startsWith(`${unitId}/`)).length;
          const unitProgressPercent = totalLessonsInUnit > 0
            ? Math.round(((totalCompletedInUnit + 1) / totalLessonsInUnit) * 100)
            : 0;
          completeLesson({ lessonKey, unitId, unitProgressPercent, xpAward: 0 });
          justCompletedTopic = true;
        }
      }

      render(container, unitId, lessonId, lessonData, totalLessonsInUnit);
    });
    children.push(submit);
  }

  return createEl("div", { className: `lesson__quiz-question lesson__quiz-question--${status || "pending"}`, children });
}

function renderContentBlock(block) {
  switch (block.type) {
    case "definition":
      return createEl("div", {
        className: "lesson__block lesson__block--definition",
        children: [
          createEl("span", { className: "lesson__block-label", text: block.label }),
          createEl("div", { className: "lesson__block-text", text: block.text })
        ]
      });
    case "list":
      return createEl("div", {
        className: "lesson__block lesson__block--list",
        children: [
          ...(block.heading ? [createEl("div", { className: "lesson__block-heading", text: block.heading })] : []),
          createEl("ul", {
            className: "lesson__block-list",
            children: block.items.map((item) => createEl("li", { text: item }))
          }),
          ...(block.note ? [createEl("div", { className: "lesson__block-note", text: block.note })] : [])
        ]
      });
    case "comparison":
      return createEl("div", {
        className: "lesson__block lesson__block--comparison",
        children: [
          ...(block.heading ? [createEl("div", { className: "lesson__block-heading", text: block.heading })] : []),
          createEl("div", {
            className: "lesson__comparison-grid",
            children: block.items.map((item) =>
              createEl("div", {
                className: "lesson__comparison-card",
                children: [
                  createEl("div", { className: "lesson__comparison-label", text: item.label }),
                  createEl("div", { className: "lesson__comparison-text", text: item.text })
                ]
              })
            )
          })
        ]
      });
    case "keypoints":
      return createEl("div", {
        className: "lesson__block lesson__block--keypoints",
        children: [
          createEl("div", { className: "lesson__block-heading", text: block.heading || "Key Points" }),
          createEl("ul", {
            className: "lesson__block-list lesson__block-list--keypoints",
            children: block.items.map((item) => createEl("li", { text: item }))
          })
        ]
      });
    case "steps":
      return createEl("div", {
        className: "lesson__block lesson__block--steps",
        children: [
          ...(block.heading ? [createEl("div", { className: "lesson__block-heading", text: block.heading })] : []),
          createEl("div", {
            className: "lesson__steps-list",
            children: block.items.map((item, i) =>
              createEl("div", {
                className: "lesson__step",
                children: [
                  createEl("span", { className: "lesson__step-number", text: String(i + 1) }),
                  createEl("div", {
                    className: "lesson__step-body",
                    children: [
                      createEl("div", { className: "lesson__step-title", text: item.title }),
                      createEl("div", { className: "lesson__step-text", text: item.text }),
                      ...(item.example
                        ? [createEl("div", { className: "lesson__step-example", text: `Example: ${item.example}` })]
                        : [])
                    ]
                  })
                ]
              })
            )
          })
        ]
      });
    case "table":
      return createEl("div", {
        className: "lesson__block lesson__block--table",
        children: [
          ...(block.heading ? [createEl("div", { className: "lesson__block-heading", text: block.heading })] : []),
          createEl("table", {
            className: "lesson__table",
            children: [
              createEl("thead", {
                children: [
                  createEl("tr", { children: block.headers.map((h) => createEl("th", { text: h })) })
                ]
              }),
              createEl("tbody", {
                children: block.rows.map((row) =>
                  createEl("tr", { children: row.map((cell) => createEl("td", { text: cell })) })
                )
              })
            ]
          })
        ]
      });
    case "mnemonic":
      return createEl("div", {
        className: "lesson__block lesson__block--mnemonic",
        children: [
          createEl("div", { className: "lesson__block-heading", text: block.heading || "Easy Trick to Remember" }),
          createEl("div", { className: "lesson__mnemonic-phrase", text: `"${block.phrase}"` }),
          createEl("div", {
            className: "lesson__mnemonic-items",
            children: block.items.map((item) =>
              createEl("div", {
                className: "lesson__mnemonic-item",
                children: [
                  createEl("span", { className: "lesson__mnemonic-letter", text: item.letter }),
                  createEl("span", { className: "lesson__mnemonic-meaning", text: item.meaning })
                ]
              })
            )
          }),
          ...(block.note ? [createEl("div", { className: "lesson__block-note", text: block.note })] : [])
        ]
      });
    case "flow":
      return createEl("div", {
        className: "lesson__block lesson__block--flow",
        children: [
          ...(block.heading ? [createEl("div", { className: "lesson__block-heading", text: block.heading })] : []),
          createEl("div", {
            className: "lesson__flow",
            children: block.items.flatMap((item, i) => {
              const step = createEl("div", { className: "lesson__flow-step", text: item });
              if (i === block.items.length - 1) return [step];
              const arrow = createEl("div", { className: "lesson__flow-arrow", text: "↓" });
              return [step, arrow];
            })
          })
        ]
      });
    case "paragraph":
    default:
      return createEl("div", { className: "lesson__section-body", text: block.text || "" });
  }
}

function renderFooterNav(unitId, lessonId) {
  if (!currentUnit || !Array.isArray(currentUnit.lessons)) return null;

  const currentIndex = currentUnit.lessons.findIndex((l) => l.id === lessonId);
  if (currentIndex === -1) return null;

  const nextLesson = currentUnit.lessons[currentIndex + 1];
  if (!nextLesson) return null;

  return createEl("a", {
    className: "lesson__next-link",
    children: [
      createEl("span", {
        children: [
          createEl("span", { className: "lesson__next-label", text: "Next Topic" }),
          createEl("span", { className: "lesson__next-title", text: nextLesson.title })
        ]
      }),
      (() => {
        const icon = createEl("span", { className: "lesson__next-icon" });
        icon.innerHTML = '<i data-lucide="arrow-right"></i>';
        return icon;
      })()
    ],
    attrs: { href: `#/${unitId}/${nextLesson.id}` }
  });
}

function renderQAList(heading, items) {
  const rows = items.map((item) =>
    createEl("div", {
      className: "lesson__qa-item",
      children: [
        createEl("div", {
          className: "lesson__qa-question",
          children: [createEl("span", { className: "lesson__qa-badge lesson__qa-badge--q", text: "Q" }), createEl("span", { text: item.question })]
        }),
        createEl("div", {
          className: "lesson__qa-answer",
          children: [createEl("span", { className: "lesson__qa-badge lesson__qa-badge--a", text: "A" }), createEl("span", { text: item.answer })]
        })
      ]
    })
  );

  return createEl("div", {
    className: "lesson__qa-block",
    children: [createEl("div", { className: "lesson__qa-heading", text: heading }), ...rows]
  });
}

function renderExamQuestions(items) {
  const rows = items.map((item) =>
    createEl("div", {
      className: "lesson__exam-item",
      children: [
        createEl("span", { className: "lesson__exam-marks", text: `${item.marks} Marks` }),
        createEl("span", { className: "lesson__exam-question", text: item.question })
      ]
    })
  );

  return createEl("div", {
    className: "lesson__qa-block",
    children: [createEl("div", { className: "lesson__qa-heading", text: "University Exam Questions" }), ...rows]
  });
}
