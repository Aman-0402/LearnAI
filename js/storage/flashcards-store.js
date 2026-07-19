// js/storage/flashcards-store.js
const FLASHCARDS_KEY = "ailp:flashcards";

export function getFlashcards() {
  try {
    const raw = localStorage.getItem(FLASHCARDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveFlashcards(cards) {
  try {
    localStorage.setItem(FLASHCARDS_KEY, JSON.stringify(cards));
  } catch {
    /* localStorage unavailable - cards just won't persist */
  }
}

export function addFlashcard(front, back) {
  const cards = getFlashcards();
  const card = { id: crypto.randomUUID(), front, back, createdAt: Date.now() };
  cards.push(card);
  saveFlashcards(cards);
  return card;
}

export function deleteFlashcard(id) {
  const cards = getFlashcards().filter((c) => c.id !== id);
  saveFlashcards(cards);
}
