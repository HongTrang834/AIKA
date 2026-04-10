import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Loader, Search, Palette } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const API_BASE_URL = 'http://localhost:3000/api';

interface Deck {
  id: number;
  name: string;
  description: string;
  color: string;
  is_global: boolean;
  card_count: number;
  created_at: string;
}

const COLORS = [
  { name: 'blue', label: 'Xanh', bg: 'bg-blue-50', border: 'border-blue-300', ring: 'ring-blue-500' },
  { name: 'red', label: 'Đỏ', bg: 'bg-red-50', border: 'border-red-300', ring: 'ring-red-500' },
  { name: 'green', label: 'Xanh lá', bg: 'bg-green-50', border: 'border-green-300', ring: 'ring-green-500' },
  { name: 'purple', label: 'Tím', bg: 'bg-purple-50', border: 'border-purple-300', ring: 'ring-purple-500' },
  { name: 'yellow', label: 'Vàng', bg: 'bg-yellow-50', border: 'border-yellow-300', ring: 'ring-yellow-500' },
  { name: 'pink', label: 'Hồng', bg: 'bg-pink-50', border: 'border-pink-300', ring: 'ring-pink-500' },
];

export default function AdminDecks() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: 'blue',
    flashcards: [{ word: '', reading: '', meaning: '' }],
  });

  useEffect(() => {
    fetchDecks();
  }, [token]);

  const fetchDecks = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/decks?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setDecks(data.rows || []);
    } catch (error) {
      console.error('Error fetching decks:', error);
      showToast('Lỗi khi tải decks', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      showToast('Tên deck không thể trống', 'error');
      return;
    }

    setSaving(true);
    try {
      const deckPayload = {
        name: formData.name,
        description: formData.description,
        color: formData.color,
      };

      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `${API_BASE_URL}/admin/decks/${editingId}` : `${API_BASE_URL}/admin/decks`;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(deckPayload),
      });

      if (res.ok) {
        const newDeck = await res.json();
        
        // If adding new deck and has flashcards, create them
        if (!editingId && formData.flashcards.length > 0) {
          const validFlashcards = formData.flashcards.filter(
            (fc) => fc.word.trim() || fc.reading.trim() || fc.meaning.trim()
          );
          
          if (validFlashcards.length > 0) {
            try {
              // Use bulk endpoint for creating flashcards with vocab
              const bulkRes = await fetch(`${API_BASE_URL}/admin/decks/${newDeck.id}/flashcards/bulk`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                  flashcards: validFlashcards.map(fc => ({
                    word: fc.word,
                    reading: fc.reading || fc.word,
                    meaning: fc.meaning,
                  })),
                }),
              });

              if (bulkRes.ok) {
                const bulkResult = await bulkRes.json();
                showToast(`Deck tạo thành công với ${bulkResult.created} flashcards`, 'success');
                // Update decks list with new card count
                newDeck.card_count = bulkResult.created;
                setDecks([{ ...newDeck, is_global: true }, ...decks]);
              } else {
                const error = await bulkRes.json();
                showToast(`Deck tạo nhưng lỗi: ${error.error}`, 'error');
                setDecks([{ ...newDeck, card_count: 0, is_global: true }, ...decks]);
              }
            } catch (fcErr) {
              console.error('Error creating flashcards:', fcErr);
              showToast('Deck tạo nhưng lỗi khi tạo flashcards', 'error');
              setDecks([{ ...newDeck, card_count: 0, is_global: true }, ...decks]);
            }
          }
        } else if (editingId) {
          // Update deck
          setDecks(decks.map(d => d.id === editingId ? { ...d, ...newDeck } : d));
          showToast('Deck đã cập nhật', 'success');
        } else {
          // Add new deck without flashcards
          setDecks([{ ...newDeck, card_count: 0, is_global: true }, ...decks]);
          showToast('Deck tạo thành công', 'success');
        }
        
        setShowForm(false);
        setEditingId(null);
        setFormData({ name: '', description: '', color: 'blue', flashcards: [{ word: '', reading: '', meaning: '' }] });
      } else {
        showToast('Lỗi khi lưu deck', 'error');
      }
    } catch (error) {
      console.error('Error saving deck:', error);
      showToast('Lỗi khi lưu deck', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa deck này?')) return;

    try {
      const res = await fetch(`${API_BASE_URL}/admin/decks/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setDecks(decks.filter(d => d.id !== id));
        showToast('Deck đã xóa', 'success');
      } else {
        showToast('Lỗi khi xóa deck', 'error');
      }
    } catch (error) {
      console.error('Error deleting deck:', error);
      showToast('Lỗi khi xóa deck', 'error');
    }
  };

  const handleEdit = async (deck: Deck) => {
    try {
      // Fetch full deck with flashcards
      const res = await fetch(`${API_BASE_URL}/admin/decks/${deck.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const fullDeck = await res.json();
        setFormData({
          name: fullDeck.name,
          description: fullDeck.description || '',
          color: fullDeck.color || 'blue',
          flashcards:
            fullDeck.flashcards && fullDeck.flashcards.length > 0
              ? fullDeck.flashcards.map((fc: any) => ({
                  word: fc.word || '',
                  reading: fc.reading || '',
                  meaning: fc.meaning || '',
                }))
              : [{ word: '', reading: '', meaning: '' }],
        });
      } else {
        // Fallback if fetch fails
        setFormData({
          name: deck.name,
          description: deck.description || '',
          color: deck.color || 'blue',
          flashcards: [{ word: '', reading: '', meaning: '' }],
        });
      }
    } catch (error) {
      console.error('Error fetching deck details:', error);
      setFormData({
        name: deck.name,
        description: deck.description || '',
        color: deck.color || 'blue',
        flashcards: [{ word: '', reading: '', meaning: '' }],
      });
    }
    setEditingId(deck.id);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: '', description: '', color: 'blue', flashcards: [{ word: '', reading: '', meaning: '' }] });
  };

  const addFlashcardRow = () => {
    setFormData({
      ...formData,
      flashcards: [...formData.flashcards, { word: '', reading: '', meaning: '' }],
    });
  };

  const removeFlashcardRow = (index: number) => {
    setFormData({
      ...formData,
      flashcards: formData.flashcards.filter((_, i) => i !== index),
    });
  };

  const updateFlashcard = (index: number, field: 'word' | 'reading' | 'meaning', value: string) => {
    const newFlashcards = [...formData.flashcards];
    newFlashcards[index][field] = value;
    setFormData({ ...formData, flashcards: newFlashcards });
  };

  const filteredDecks = decks.filter(
    (deck) =>
      deck.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deck.description.toLowerCase().includes(searchTerm.toLowerCase())
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
        <div>
          <h1 className="text-3xl font-bold">Quản Lý Decks Global</h1>
          <p className="text-gray-600 mt-1">Các deck này sẽ hiển thị cho tất cả người dùng</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Thêm Deck
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Tìm kiếm tên hoặc mô tả deck..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">{editingId ? 'Cập Nhật' : 'Thêm'} Deck</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tên Deck *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ví dụ: N2 Business"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Mô Tả</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Mô tả ngắn về deck này"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-3">Màu Sắc</label>
                <div className="grid grid-cols-3 gap-2">
                  {COLORS.map((colorOption) => (
                    <button
                      key={colorOption.name}
                      type="button"
                      onClick={() => setFormData({ ...formData, color: colorOption.name })}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        formData.color === colorOption.name
                          ? `${colorOption.bg} ${colorOption.border} ring-2 ${colorOption.ring}`
                          : `${colorOption.bg} border-gray-300 hover:border-gray-500`
                      }`}
                      title={colorOption.label}
                    >
                      <Palette className="w-5 h-5 mx-auto" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Flashcards */}
              {!editingId && (
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="block text-sm font-medium">Flashcards (Tùy chọn)</label>
                    <button
                      type="button"
                      onClick={addFlashcardRow}
                      className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                    >
                      + Thêm hàng
                    </button>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
                    {formData.flashcards.map((fc, idx) => (
                      <div key={idx} className="flex gap-2 items-start">
                        <div className="flex-1">
                          <input
                            type="text"
                            placeholder="Thuật ngữ"
                            value={fc.word}
                            onChange={(e) => updateFlashcard(idx, 'word', e.target.value)}
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>

                        <div className="flex-1">
                          <input
                            type="text"
                            placeholder="Định nghĩa"
                            value={fc.meaning}
                            onChange={(e) => updateFlashcard(idx, 'meaning', e.target.value)}
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>

                        {formData.flashcards.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeFlashcardRow(idx)}
                            className="text-red-600 hover:text-red-700 font-medium text-sm mt-1.5"
                          >
                            Xóa
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Nhập thuật ngữ và định nghĩa. Sẽ được thêm vào deck khi lưu.</p>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {saving && <Loader className="w-4 h-4 animate-spin" />}
                  {editingId ? 'Cập Nhật' : 'Thêm'}
                </button>
                <button
                  type="button"
                  onClick={handleCloseForm}
                  disabled={saving}
                  className="flex-1 bg-gray-300 text-gray-800 py-2 rounded-lg hover:bg-gray-400 transition-colors font-medium disabled:bg-gray-200 disabled:cursor-not-allowed"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Decks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDecks.map((deck) => {
          const colorOption = COLORS.find((c) => c.name === deck.color) || COLORS[0];
          return (
            <div key={deck.id} className={`${colorOption.bg} border-2 ${colorOption.border} rounded-lg p-6`}>
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-bold text-gray-900 flex-1">{deck.name}</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(deck)}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(deck.id)}
                    className="text-red-600 hover:text-red-700 font-medium"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {deck.description && (
                <p className="text-gray-700 text-sm mb-3">{deck.description}</p>
              )}

              <div className="flex justify-between items-center text-sm text-gray-600 pt-3 border-t border-current border-opacity-20">
                <span>📚 {deck.card_count} flashcards</span>
                <span className="text-xs text-gray-500">
                  {new Date(deck.created_at).toLocaleDateString('vi-VN')}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {filteredDecks.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>Không tìm thấy deck nào.</p>
        </div>
      )}
    </div>
  );
}
