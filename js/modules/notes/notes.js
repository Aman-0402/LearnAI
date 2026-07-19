// js/modules/notes/notes.js
import { createEl } from "../../utils/dom.js";
import { getNotes, addNote, updateNote, deleteNote } from "../../storage/notes-store.js";

let editingId = null;
let focusTarget = null; // { type: "add-title" } | { type: "note-title", id } | { type: "note-edit-button", id }

export function mount(container) {
  editingId = null;
  focusTarget = null;
  render(container);
}

export function unmount() {
  editingId = null;
  focusTarget = null;
}

function render(container) {
  const scrollY = window.scrollY;
  container.innerHTML = "";
  const form = renderForm(container);
  const list = renderList(container);
  container.appendChild(
    createEl("div", {
      className: "notes",
      children: [createEl("h1", { text: "Notes" }), form, list]
    })
  );
  window.scrollTo(0, scrollY);
  applyFocusTarget(container);
}

function applyFocusTarget(container) {
  if (!focusTarget) return;
  let el = null;
  if (focusTarget.type === "add-title") {
    el = container.querySelector(".notes__form .notes__input");
  } else if (focusTarget.type === "note-title") {
    el = container.querySelector(`[data-note-id="${focusTarget.id}"] .notes__input`);
  } else if (focusTarget.type === "note-edit-button") {
    el = container.querySelector(
      `[data-note-id="${focusTarget.id}"] .note-card__button:not(.note-card__button--danger)`
    );
  }
  if (el) el.focus();
  focusTarget = null;
}

function renderForm(container) {
  const titleInput = createEl("input", {
    className: "notes__input",
    attrs: { type: "text", placeholder: "Title", "aria-label": "Note title" }
  });

  const bodyInput = createEl("textarea", {
    className: "notes__textarea",
    attrs: { placeholder: "Write your note...", "aria-label": "Note body" }
  });

  const submit = createEl("button", { className: "notes__submit", text: "Add Note" });

  const form = createEl("form", {
    className: "notes__form",
    children: [titleInput, bodyInput, submit]
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const title = titleInput.value.trim();
    if (!title) return;
    addNote(title, bodyInput.value);
    focusTarget = { type: "add-title" };
    render(container);
  });

  return form;
}

function renderList(container) {
  const notes = getNotes().slice().sort((a, b) => b.createdAt - a.createdAt);

  if (notes.length === 0) {
    return createEl("div", { className: "notes__empty", text: "No notes yet — write your first one above." });
  }

  const cards = notes.map((note) =>
    note.id === editingId ? renderEditCard(note, container) : renderCard(note, container)
  );

  return createEl("div", { className: "notes__list", children: cards });
}

function renderCard(note, container) {
  const dateLabel = new Date(note.createdAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric"
  });

  const editButton = createEl("button", { className: "note-card__button", text: "Edit" });
  editButton.addEventListener("click", () => {
    editingId = note.id;
    focusTarget = { type: "note-title", id: note.id };
    render(container);
  });

  const deleteButton = createEl("button", {
    className: "note-card__button note-card__button--danger",
    text: "Delete"
  });
  deleteButton.addEventListener("click", () => {
    if (confirm("Delete this note? This cannot be undone.")) {
      deleteNote(note.id);
      focusTarget = { type: "add-title" };
      render(container);
    }
  });

  return createEl("div", {
    className: "note-card",
    attrs: { "data-note-id": note.id },
    children: [
      createEl("div", { className: "note-card__title", text: note.title }),
      createEl("div", { className: "note-card__body", text: note.body }),
      createEl("div", { className: "note-card__date", text: dateLabel }),
      createEl("div", { className: "note-card__actions", children: [editButton, deleteButton] })
    ]
  });
}

function renderEditCard(note, container) {
  const titleInput = createEl("input", {
    className: "notes__input",
    attrs: { type: "text", "aria-label": "Edit note title" }
  });
  titleInput.value = note.title;

  const bodyInput = createEl("textarea", {
    className: "notes__textarea",
    attrs: { "aria-label": "Edit note body" }
  });
  bodyInput.value = note.body;

  const saveButton = createEl("button", { className: "note-card__button", text: "Save" });
  saveButton.addEventListener("click", () => {
    const title = titleInput.value.trim();
    if (!title) return;
    updateNote(note.id, { title, body: bodyInput.value });
    editingId = null;
    focusTarget = { type: "note-edit-button", id: note.id };
    render(container);
  });

  const cancelButton = createEl("button", { className: "note-card__button", text: "Cancel" });
  cancelButton.addEventListener("click", () => {
    editingId = null;
    focusTarget = { type: "note-edit-button", id: note.id };
    render(container);
  });

  return createEl("div", {
    className: "note-card",
    attrs: { "data-note-id": note.id },
    children: [
      titleInput,
      bodyInput,
      createEl("div", { className: "note-card__actions", children: [saveButton, cancelButton] })
    ]
  });
}
