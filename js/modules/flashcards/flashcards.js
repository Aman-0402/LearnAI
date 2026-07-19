// js/modules/flashcards/flashcards.js
import { createEl } from "../../utils/dom.js";
import { getFlashcards, addFlashcard, deleteFlashcard } from "../../storage/flashcards-store.js";

let flippedIds = new Set();

export function mount(container) {
  flippedIds = new Set();
  render(container);
}

export function unmount() {
  flippedIds = new Set();
}

function render(container) {
  container.innerHTML = "";
  container.appendChild(
    createEl("div", {
      className: "flashcards",
      children: [renderForm(container), renderGrid(container)]
    })
  );
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
    children: [
      createEl("div", { className: "flashcard__side-label", text: isFlipped ? "Back" : "Front" }),
      createEl("div", { className: "flashcard__text", text: isFlipped ? card.back : card.front })
    ]
  });
  body.addEventListener("click", () => {
    if (flippedIds.has(card.id)) {
      flippedIds.delete(card.id);
    } else {
      flippedIds.add(card.id);
    }
    render(container);
  });

  const deleteButton = createEl("button", { className: "flashcard__delete", text: "Delete" });
  deleteButton.addEventListener("click", (event) => {
    event.stopPropagation();
    if (confirm("Delete this flashcard? This cannot be undone.")) {
      deleteFlashcard(card.id);
      render(container);
    }
  });

  return createEl("div", {
    className: "flashcard",
    children: [body, createEl("div", { className: "flashcard__actions", children: [deleteButton] })]
  });
}
