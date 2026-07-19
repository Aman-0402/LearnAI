// js/modules/bookmarks/bookmarks.js
import { createEl } from "../../utils/dom.js";
import { getBookmarks, addBookmark, deleteBookmark } from "../../storage/bookmarks-store.js";

let urlError = null;
let pendingTitle = null;
let pendingUrl = null;
let pendingNote = null;
let focusTarget = null; // { type: "add-title" } | { type: "add-url" }

export function mount(container) {
  urlError = null;
  pendingTitle = null;
  pendingUrl = null;
  pendingNote = null;
  focusTarget = null;
  render(container);
}

export function unmount() {
  urlError = null;
  pendingTitle = null;
  pendingUrl = null;
  pendingNote = null;
  focusTarget = null;
}

function render(container) {
  container.innerHTML = "";
  container.appendChild(
    createEl("div", {
      className: "bookmarks",
      children: [renderForm(container), renderList(container)]
    })
  );
  applyFocusTarget(container);
}

function applyFocusTarget(container) {
  if (!focusTarget) return;
  let el = null;
  if (focusTarget.type === "add-title") {
    el = container.querySelector(".bookmarks__form .bookmarks__input");
  } else if (focusTarget.type === "add-url") {
    el = container.querySelectorAll(".bookmarks__form .bookmarks__input")[1] || null;
  }
  if (el) el.focus();
  focusTarget = null;
}

function isValidHttpUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function renderForm(container) {
  const titleInput = createEl("input", {
    className: "bookmarks__input",
    attrs: { type: "text", placeholder: "Title", "aria-label": "Bookmark title" }
  });

  const urlInput = createEl("input", {
    className: "bookmarks__input",
    attrs: { type: "text", placeholder: "https://...", "aria-label": "Bookmark URL" }
  });

  const noteInput = createEl("textarea", {
    className: "bookmarks__textarea",
    attrs: { placeholder: "Note (optional)", "aria-label": "Bookmark note" }
  });

  if (pendingTitle !== null) titleInput.value = pendingTitle;
  if (pendingUrl !== null) urlInput.value = pendingUrl;
  if (pendingNote !== null) noteInput.value = pendingNote;

  const submit = createEl("button", { className: "bookmarks__submit", text: "Add Bookmark" });

  const formChildren = [titleInput, urlInput];
  if (urlError) {
    formChildren.push(createEl("div", { className: "bookmarks__error", text: urlError, attrs: { role: "alert" } }));
  }
  formChildren.push(noteInput, submit);

  const form = createEl("form", { className: "bookmarks__form", children: formChildren });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const title = titleInput.value.trim();
    const url = urlInput.value.trim();

    if (!title) return;

    if (!isValidHttpUrl(url)) {
      urlError = "Enter a valid http(s) URL";
      pendingTitle = title;
      pendingUrl = url;
      pendingNote = noteInput.value;
      focusTarget = { type: "add-url" };
      render(container);
      return;
    }

    urlError = null;
    pendingTitle = null;
    pendingUrl = null;
    pendingNote = null;
    addBookmark(title, url, noteInput.value);
    focusTarget = { type: "add-title" };
    render(container);
  });

  return form;
}

function renderList(container) {
  const bookmarks = getBookmarks().slice().sort((a, b) => b.createdAt - a.createdAt);

  if (bookmarks.length === 0) {
    return createEl("div", { className: "bookmarks__empty", text: "No bookmarks yet — save your first link above." });
  }

  const cards = bookmarks.map((bookmark) => renderCard(bookmark, container));
  return createEl("div", { className: "bookmarks__list", children: cards });
}

function renderCard(bookmark, container) {
  const dateLabel = new Date(bookmark.createdAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric"
  });

  const titleLink = createEl("a", {
    className: "bookmark-card__title",
    text: bookmark.title,
    attrs: { href: bookmark.url, target: "_blank", rel: "noopener noreferrer" }
  });

  const deleteButton = createEl("button", {
    className: "bookmark-card__button bookmark-card__button--danger",
    text: "Delete"
  });
  deleteButton.addEventListener("click", () => {
    if (confirm("Delete this bookmark? This cannot be undone.")) {
      deleteBookmark(bookmark.id);
      focusTarget = { type: "add-title" };
      render(container);
    }
  });

  const children = [titleLink];
  if (bookmark.note) {
    children.push(createEl("div", { className: "bookmark-card__note", text: bookmark.note }));
  }
  children.push(createEl("div", { className: "bookmark-card__date", text: dateLabel }));
  children.push(createEl("div", { className: "bookmark-card__actions", children: [deleteButton] }));

  return createEl("div", { className: "bookmark-card", children });
}
