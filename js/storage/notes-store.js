// js/storage/notes-store.js
const NOTES_KEY = "ailp:notes";

export function getNotes() {
  try {
    const raw = localStorage.getItem(NOTES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveNotes(notes) {
  try {
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  } catch {
    /* localStorage unavailable - notes just won't persist */
  }
}

export function addNote(title, body) {
  const notes = getNotes();
  const now = Date.now();
  const note = { id: crypto.randomUUID(), title, body, createdAt: now, updatedAt: now };
  notes.push(note);
  saveNotes(notes);
  return note;
}

export function updateNote(id, changes) {
  const notes = getNotes();
  const index = notes.findIndex((n) => n.id === id);
  if (index === -1) return null;
  notes[index] = { ...notes[index], ...changes, updatedAt: Date.now() };
  saveNotes(notes);
  return notes[index];
}

export function deleteNote(id) {
  const notes = getNotes().filter((n) => n.id !== id);
  saveNotes(notes);
}
