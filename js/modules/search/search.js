// js/modules/search/search.js
import { createEl, clearChildren } from "../../utils/dom.js";
import { getNotes } from "../../storage/notes-store.js";
import { getBookmarks } from "../../storage/bookmarks-store.js";
import { getFlashcards } from "../../storage/flashcards-store.js";

let resultsEl = null;

export function mount(container) {
  resultsEl = null;
  render(container);
}

export function unmount() {
  resultsEl = null;
}

function render(container) {
  container.innerHTML = "";

  const input = createEl("input", {
    className: "search__input",
    attrs: {
      type: "search",
      placeholder: "Search notes, bookmarks, flashcards...",
      "aria-label": "Search notes, bookmarks, and flashcards"
    }
  });

  resultsEl = createEl("div", { className: "search__results" });

  input.addEventListener("input", () => {
    renderResults(input.value);
  });

  container.appendChild(
    createEl("div", { className: "search", children: [input, resultsEl] })
  );

  renderResults("");
}

function matchNote(note, q) {
  return note.title.toLowerCase().includes(q) || note.body.toLowerCase().includes(q);
}

function matchBookmark(bookmark, q) {
  return (
    bookmark.title.toLowerCase().includes(q) ||
    bookmark.url.toLowerCase().includes(q) ||
    (bookmark.note && bookmark.note.toLowerCase().includes(q))
  );
}

function matchFlashcard(card, q) {
  return card.front.toLowerCase().includes(q) || card.back.toLowerCase().includes(q);
}

function snippet(text, length = 100) {
  return text.length > length ? `${text.slice(0, length)}…` : text;
}

function renderResults(rawQuery) {
  clearChildren(resultsEl);

  const query = rawQuery.trim().toLowerCase();

  if (!query) {
    resultsEl.appendChild(
      createEl("div", {
        className: "search__empty",
        text: "Type to search your notes, bookmarks, and flashcards."
      })
    );
    return;
  }

  const noteMatches = getNotes().filter((n) => matchNote(n, query));
  const bookmarkMatches = getBookmarks().filter((b) => matchBookmark(b, query));
  const flashcardMatches = getFlashcards().filter((c) => matchFlashcard(c, query));

  const groups = [
    { label: "Notes", items: noteMatches, render: renderNoteResult },
    { label: "Bookmarks", items: bookmarkMatches, render: renderBookmarkResult },
    { label: "Flashcards", items: flashcardMatches, render: renderFlashcardResult }
  ].filter((g) => g.items.length > 0);

  if (groups.length === 0) {
    resultsEl.appendChild(
      createEl("div", { className: "search__no-results", text: `No results for "${rawQuery.trim()}"` })
    );
    return;
  }

  groups.forEach((group) => {
    resultsEl.appendChild(
      createEl("div", {
        className: "search__group",
        children: [
          createEl("div", { className: "search__group-heading", text: group.label }),
          createEl("div", { className: "search__group-list", children: group.items.map(group.render) })
        ]
      })
    );
  });
}

function renderNoteResult(note) {
  return createEl("div", {
    className: "search-result",
    children: [
      createEl("div", { className: "search-result__title", text: note.title }),
      createEl("div", { className: "search-result__snippet", text: snippet(note.body) })
    ]
  });
}

function renderBookmarkResult(bookmark) {
  const children = [
    createEl("a", {
      className: "search-result__title-link",
      text: bookmark.title,
      attrs: { href: bookmark.url, target: "_blank", rel: "noopener noreferrer" }
    })
  ];
  if (bookmark.note) {
    children.push(createEl("div", { className: "search-result__snippet", text: snippet(bookmark.note) }));
  }
  return createEl("div", { className: "search-result", children });
}

function renderFlashcardResult(card) {
  return createEl("div", {
    className: "search-result",
    children: [
      createEl("div", { className: "search-result__title", text: card.front }),
      createEl("div", { className: "search-result__snippet", text: card.back })
    ]
  });
}
