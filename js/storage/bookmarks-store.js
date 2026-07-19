// js/storage/bookmarks-store.js
const BOOKMARKS_KEY = "ailp:bookmarks";

export function getBookmarks() {
  try {
    const raw = localStorage.getItem(BOOKMARKS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveBookmarks(bookmarks) {
  try {
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
  } catch {
    /* localStorage unavailable - bookmarks just won't persist */
  }
}

export function addBookmark(title, url, note) {
  const bookmarks = getBookmarks();
  const bookmark = { id: crypto.randomUUID(), title, url, note, createdAt: Date.now() };
  bookmarks.push(bookmark);
  saveBookmarks(bookmarks);
  return bookmark;
}

export function deleteBookmark(id) {
  const bookmarks = getBookmarks().filter((b) => b.id !== id);
  saveBookmarks(bookmarks);
}
