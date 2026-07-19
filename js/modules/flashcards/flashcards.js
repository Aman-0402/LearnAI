// js/modules/flashcards/flashcards.js
import { createEl } from "../../utils/dom.js";
import { getFlashcards, addFlashcard, deleteFlashcard } from "../../storage/flashcards-store.js";

let flippedIds = new Set();
let focusTarget = null; // { type: "add-front" } | { type: "card", id: string }

export function mount(container) {
  flippedIds = new Set();
  focusTarget = null;
  render(container);
}

export function unmount() {
  flippedIds = new Set();
  focusTarget = null;
}

function render(container) {
  container.innerHTML = "";
  container.appendChild(
    createEl("div", {
      className: "flashcards",
      children: [renderForm(container), renderGrid(container)]
    })
  );
  applyFocusTarget(container);
}

function applyFocusTarget(container) {
  if (!focusTarget) return;
  let el = null;
  if (focusTarget.type === "add-front") {
    el = container.querySelector(".flashcards__form .flashcards__input");
  } else if (focusTarget.type === "card") {
    el = container.querySelector(`.flashcard__body[data-card-id="${focusTarget.id}"]`);
  }
  if (el) el.focus();
  focusTarget = null;
}

function renderForm(container) {
  const frontInput = createEl("input", {
    className: "flashcards__input",
    attrs: { type: "text", "aria-label": "Card front" }
  });

  const backInput = createEl("input", {
    className: "flashcards__input",
    attrs: { type: "text", "aria-label": "Card back" }
  });

  const submit = createEl("button", { className: "flashcards__submit", text: "Add Card" });

  const form = createEl("form", {
    className: "flashcards__form",
    children: [
      createEl("div", {
        className: "flashcards__field",
        children: [createEl("label", { className: "flashcards__label", text: "Front" }), frontInput]
      }),
      createEl("div", {
        className: "flashcards__field",
        children: [createEl("label", { className: "flashcards__label", text: "Back" }), backInput]
      }),
      submit
    ]
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const front = frontInput.value.trim();
    const back = backInput.value.trim();
    if (!front || !back) return;
    addFlashcard(front, back);
    focusTarget = { type: "add-front" };
    render(container);
  });

  return form;
}

function renderGrid(container) {
  const cards = getFlashcards().slice().sort((a, b) => b.createdAt - a.createdAt);

  if (cards.length === 0) {
    return createEl("div", { className: "flashcards__empty", text: "No flashcards yet — add your first one above." });
  }

  return createEl("div", {
    className: "flashcards__grid",
    children: cards.map((card) => renderCard(card, container))
  });
}

function renderCard(card, container) {
  const isFlipped = flippedIds.has(card.id);

  const body = createEl("div", {
    className: "flashcard__body",
    attrs: {
      tabindex: "0",
      role: "button",
      "aria-label": isFlipped ? "Show front" : "Show back",
      "data-card-id": card.id
    },
    children: [
      createEl("div", { className: "flashcard__side-label", text: isFlipped ? "Back" : "Front" }),
      createEl("div", { className: "flashcard__text", text: isFlipped ? card.back : card.front })
    ]
  });

  const toggleFlip = () => {
    if (flippedIds.has(card.id)) {
      flippedIds.delete(card.id);
    } else {
      flippedIds.add(card.id);
    }
    focusTarget = { type: "card", id: card.id };
    render(container);
  };

  body.addEventListener("click", toggleFlip);
  body.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleFlip();
    }
  });

  const deleteButton = createEl("button", { className: "flashcard__delete", text: "Delete" });
  deleteButton.addEventListener("click", (event) => {
    event.stopPropagation();
    if (confirm("Delete this flashcard? This cannot be undone.")) {
      deleteFlashcard(card.id);
      focusTarget = { type: "add-front" };
      render(container);
    }
  });

  return createEl("div", {
    className: "flashcard",
    children: [body, createEl("div", { className: "flashcard__actions", children: [deleteButton] })]
  });
}
