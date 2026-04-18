const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const api = {
  // Auth
  register: async (data: { username: string; email: string; password: string; full_name: string }) => {
    const res = await fetch(`${API_BASE_URL}/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  login: async (data: { email: string; password: string }) => {
    const res = await fetch(`${API_BASE_URL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  getProfile: async (token: string) => {
    const res = await fetch(`${API_BASE_URL}/users/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to load profile');
    }
    return res.json();
  },

  updateProfile: async (token: string, data: { full_name?: string; avatar_url?: string }) => {
    const res = await fetch(`${API_BASE_URL}/users/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to update profile');
    }
    return res.json();
  },

  changePassword: async (token: string, data: { old_password: string; new_password: string; confirm_password: string }) => {
    const res = await fetch(`${API_BASE_URL}/users/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to change password');
    }
    return res.json();
  },

  // Vocabulary
  getVocabulary: async (limit = 10, offset = 0) => {
    const res = await fetch(`${API_BASE_URL}/vocabulary?limit=${limit}&offset=${offset}`);
    return res.json();
  },

  getVocabularyById: async (id: number) => {
    const res = await fetch(`${API_BASE_URL}/vocabulary/${id}`);
    return res.json();
  },

  // Grammar
  getGrammar: async (limit = 10, offset = 0) => {
    const res = await fetch(`${API_BASE_URL}/grammar?limit=${limit}&offset=${offset}`);
    return res.json();
  },

  getGrammarById: async (id: number) => {
    const res = await fetch(`${API_BASE_URL}/grammar/${id}`);
    return res.json();
  },

  // Flashcards
  getFlashcards: async (token: string) => {
    const res = await fetch(`${API_BASE_URL}/flashcards`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  createFlashcard: async (token: string, data: { vocab_id?: number; grammar_id?: number; deck_id?: number }) => {
    const res = await fetch(`${API_BASE_URL}/flashcards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  updateFlashcard: async (token: string, id: number, quality: number) => {
    const res = await fetch(`${API_BASE_URL}/flashcards/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ quality }),
    });
    return res.json();
  },

  deleteFlashcard: async (token: string, id: number) => {
    const res = await fetch(`${API_BASE_URL}/flashcards/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  // Conversation
  getConversationHistory: async (token: string, mode?: string) => {
    const url = mode ? `${API_BASE_URL}/conversation/history?mode=${mode}` : `${API_BASE_URL}/conversation/history`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  saveConversation: async (token: string, data: { mode: string; user_message: string; ai_response: string; grammar_errors?: any[] }) => {
    const res = await fetch(`${API_BASE_URL}/conversation/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  getScenarios: async () => {
    const res = await fetch(`${API_BASE_URL}/conversation/scenarios`);
    return res.json();
  },

  // Flashcard Decks
  getDecks: async (token: string) => {
    const res = await fetch(`${API_BASE_URL}/decks`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  createDeck: async (token: string, data: { name: string; description?: string; color?: string }) => {
    const res = await fetch(`${API_BASE_URL}/decks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  updateDeck: async (token: string, id: number, data: { name?: string; description?: string; color?: string }) => {
    const res = await fetch(`${API_BASE_URL}/decks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  deleteDeck: async (token: string, id: number) => {
    const res = await fetch(`${API_BASE_URL}/decks/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  // Tests
  getTests: async (category?: string, type: string = 'vocabulary') => {
    let url = `${API_BASE_URL}/tests?type=${type}`;
    if (category) url += `&category=${category}`;
    const res = await fetch(url);
    return res.json();
  },

  getTest: async (id: number, token?: string | null) => {
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await fetch(`${API_BASE_URL}/tests/${id}`, { headers });
    return res.json();
  },

  submitTest: async (token: string, testId: number, answers: any[]) => {
    const res = await fetch(`${API_BASE_URL}/tests/${testId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ answers }),
    });
    return res.json();
  },

  getTestResults: async (token: string, testId: number) => {
    const res = await fetch(`${API_BASE_URL}/tests/${testId}/results`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  // Progress tracking
  updateProgress: async (token: string, type: 'vocab' | 'grammar' | 'kaiwa' | 'flashcard', increment: number = 1) => {
    const res = await fetch(`${API_BASE_URL}/users/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ type, increment }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to update progress');
    }
    return res.json();
  },

  updateProgressBulk: async (token: string, data: { vocab?: number; grammar?: number; kaiwa?: number; flashcard?: number }) => {
    const res = await fetch(`${API_BASE_URL}/users/progress/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to update progress');
    }
    return res.json();
  },
};
