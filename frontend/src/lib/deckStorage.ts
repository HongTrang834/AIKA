// localStorage utilities for mock decks (when database is unavailable)

export interface StoredDeck {
  id: number;
  name: string;
  color: string;
  description: string;
  card_count: number;
  created_at: string;
}

const STORAGE_KEY = 'aika_mock_decks';

export function getMockDecks(): StoredDeck[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error('Error reading mock decks:', e);
    return [];
  }
}

export function saveMockDeck(deck: StoredDeck): StoredDeck {
  try {
    const decks = getMockDecks();
    const existing = decks.find(d => d.id === deck.id);
    
    if (existing) {
      // Update existing deck
      Object.assign(existing, deck);
    } else {
      // Add new deck
      decks.push(deck);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(decks));
    return deck;
  } catch (e) {
    console.error('Error saving mock deck:', e);
    return deck;
  }
}

export function removeMockDeck(deckId: number): boolean {
  try {
    const decks = getMockDecks();
    const filtered = decks.filter(d => d.id !== deckId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (e) {
    console.error('Error removing mock deck:', e);
    return false;
  }
}

export function getMockDeck(deckId: number): StoredDeck | undefined {
  return getMockDecks().find(d => d.id === deckId);
}

export function updateMockDeckCardCount(deckId: number, count: number): void {
  try {
    const deck = getMockDeck(deckId);
    if (deck) {
      deck.card_count = count;
      saveMockDeck(deck);
    }
  } catch (e) {
    console.error('Error updating mock deck card count:', e);
  }
}
