import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Loader, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const API_BASE_URL = 'http://localhost:3000/api';

interface Flashcard {
  id: number;
  user_id: number;
  vocab_id: number | null;
  grammar_id: number | null;
  deck_id: number | null;
  word: string;
  reading: string;
  meaning: string;
  username: string;
  interval: number;
  repetitions: number;
  ease_factor: number;
  next_review_date: string;
  created_at: string;
}

export default function AdminFlashcards() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    user_id: 0,
    vocab_id: '',
    grammar_id: '',
    deck_id: '',
    interval: 0,
    repetitions: 0,
    ease_factor: 2.5,
  });

  useEffect(() => {
    fetchFlashcards();
  }, [token]);

  const fetchFlashcards = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/flashcards?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setFlashcards(data.rows || []);
    } catch (error) {
      console.error('Error fetching flashcards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.user_id) {
      showToast('Vui lòng chọn người dùng', 'error');
      return;
    }

    try {
      const payload = {
        user_id: formData.user_id,
        vocab_id: formData.vocab_id ? parseInt(formData.vocab_id) : null,
        grammar_id: formData.grammar_id ? parseInt(formData.grammar_id) : null,
        deck_id: formData.deck_id ? parseInt(formData.deck_id) : null,
        interval: parseInt(formData.interval) || 0,
        repetitions: parseInt(formData.repetitions) || 0,
        ease_factor: parseFloat(formData.ease_factor) || 2.5,
      };

      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `${API_BASE_URL}/admin/flashcards/${editingId}` : `${API_BASE_URL}/admin/flashcards`;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await fetchFlashcards();
        setShowForm(false);
        setEditingId(null);
        setFormData({
          user_id: 0,
          vocab_id: '',
          grammar_id: '',
          deck_id: '',
          interval: 0,
          repetitions: 0,
          ease_factor: 2.5,
        });
        showToast(editingId ? 'Flashcard đã được cập nhật' : 'Flashcard tạo thành công', 'success');
      } else {
        showToast('Lỗi khi lưu flashcard', 'error');
      }
    } catch (error) {
      console.error('Error saving flashcard:', error);
      showToast('Lỗi khi lưu flashcard', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa flashcard này?')) return;

    try {
      const res = await fetch(`${API_BASE_URL}/admin/flashcards/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        await fetchFlashcards();
        showToast('Flashcard đã xóa', 'success');
      } else {
        showToast('Lỗi khi xóa flashcard', 'error');
      }
    } catch (error) {
      console.error('Error deleting flashcard:', error);
      showToast('Lỗi khi xóa flashcard', 'error');
    }
  };

  const handleEdit = (item: Flashcard) => {
    setFormData({
      user_id: item.user_id,
      vocab_id: item.vocab_id ? item.vocab_id.toString() : '',
      grammar_id: item.grammar_id ? item.grammar_id.toString() : '',
      deck_id: item.deck_id ? item.deck_id.toString() : '',
      interval: item.interval,
      repetitions: item.repetitions,
      ease_factor: item.ease_factor,
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      user_id: 0,
      vocab_id: '',
      grammar_id: '',
      deck_id: '',
      interval: 0,
      repetitions: 0,
      ease_factor: 2.5,
    });
  };

  const filteredFlashcards = flashcards.filter(
    (card) =>
      card.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.reading.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.meaning.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Quản Lý Flashcards</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Thêm Flashcard
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Tìm kiếm từ, reading, nghĩa hoặc người dùng..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg max-w-md w-full">
            <h2 className="text-2xl font-bold mb-6">{editingId ? 'Cập Nhật' : 'Thêm'} Flashcard</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">User ID *</label>
                <input
                  type="number"
                  value={formData.user_id}
                  onChange={(e) => setFormData({ ...formData, user_id: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Vocab ID</label>
                <input
                  type="number"
                  value={formData.vocab_id}
                  onChange={(e) => setFormData({ ...formData, vocab_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Grammar ID</label>
                <input
                  type="number"
                  value={formData.grammar_id}
                  onChange={(e) => setFormData({ ...formData, grammar_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Deck ID</label>
                <input
                  type="number"
                  value={formData.deck_id}
                  onChange={(e) => setFormData({ ...formData, deck_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Interval</label>
                <input
                  type="number"
                  value={formData.interval}
                  onChange={(e) => setFormData({ ...formData, interval: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Repetitions</label>
                <input
                  type="number"
                  value={formData.repetitions}
                  onChange={(e) => setFormData({ ...formData, repetitions: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Ease Factor</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.ease_factor}
                  onChange={(e) => setFormData({ ...formData, ease_factor: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  {editingId ? 'Cập Nhật' : 'Thêm'}
                </button>
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="flex-1 bg-gray-300 text-gray-800 py-2 rounded-lg hover:bg-gray-400 transition-colors font-medium"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Flashcards Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Từ Vựng</th>
              <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Reading</th>
              <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Nghĩa</th>
              <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Người Dùng</th>
              <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Repetitions</th>
              <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Ease Factor</th>
              <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Hành Động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredFlashcards.map((card) => (
              <tr key={card.id} className="hover:bg-gray-50">
                <td className="px-6 py-3 text-sm">{card.word}</td>
                <td className="px-6 py-3 text-sm text-gray-600">{card.reading}</td>
                <td className="px-6 py-3 text-sm">{card.meaning}</td>
                <td className="px-6 py-3 text-sm text-gray-600">{card.username}</td>
                <td className="px-6 py-3 text-sm">{card.repetitions}</td>
                <td className="px-6 py-3 text-sm">{card.ease_factor.toFixed(2)}</td>
                <td className="px-6 py-3 text-sm flex gap-2">
                  <button
                    onClick={() => handleEdit(card)}
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(card.id)}
                    className="flex items-center gap-1 text-red-600 hover:text-red-700 font-medium"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredFlashcards.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>Không tìm thấy flashcard nào.</p>
        </div>
      )}
    </div>
  );
}
