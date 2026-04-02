const API_BASE_URL = 'http://localhost:3000/api';

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
    return res.json();
  },

  updateProfile: async (token: string, data: { full_name?: string; avatar_url?: string }) => {
    const res = await fetch(`${API_BASE_URL}/users/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
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

  createFlashcard: async (token: string, data: { vocab_id?: number; grammar_id?: number }) => {
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
};
