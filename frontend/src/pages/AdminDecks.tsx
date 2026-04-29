import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Loader, Search, Palette, CheckSquare, Square, FolderPlus } from 'lucide-react';
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
  const [vocabLoading, setVocabLoading] = useState(false);
  const [vocabSearch, setVocabSearch] = useState('');
  const [vocabCategory, setVocabCategory] = useState<string>('all');
  const [vocabCategories, setVocabCategories] = useState<string[]>([]);
  const [vocabulary, setVocabulary] = useState<any[]>([]);
  const [selectedVocabIds, setSelectedVocabIds] = useState<Set<number>>(new Set());
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: 'blue',
  });

  useEffect(() => {
    fetchDecks();
  }, [token]);

  useEffect(() => {
    if (showForm) {
      fetchVocabularyForPicker();
    }
  }, [showForm, token]);

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

  const fetchVocabularyForPicker = async () => {
    if (!token) return;
    try {
      setVocabLoading(true);
      const res = await fetch(`${API_BASE_URL}/admin/vocabulary?limit=5000&offset=0`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const rows = data.rows || [];
      setVocabulary(rows);
      const cats = Array.from(new Set<string>(rows.map((v: any) => String(v.category || 'General')))).sort();
      setVocabCategories(cats);
    } catch (err) {
      console.error('Error fetching vocabulary for picker:', err);
      showToast('Không thể tải danh sách Từ vựng', 'error');
    } finally {
      setVocabLoading(false);
    }
  };

  const toggleVocab = (id: number) => {
    setSelectedVocabIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  };

  const importCurrentCategory = () => {
    if (vocabCategory === 'all') {
      showToast('Vui lòng chọn 1 danh mục để import', 'error');
      return;
    }
    toggleCategory(vocabCategory);
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
        
        // If creating new deck, optionally add vocabulary selections
        if (!editingId) {
          const vocabIds = Array.from(selectedVocabIds);
          const cats = Array.from(selectedCategories);

          if (vocabIds.length > 0 || cats.length > 0) {
            try {
              const bulkRes = await fetch(`${API_BASE_URL}/admin/decks/${newDeck.id}/flashcards/bulk`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                  vocab_ids: vocabIds,
                  categories: cats,
                }),
              });

              if (bulkRes.ok) {
                const bulkResult = await bulkRes.json();
                showToast(`Deck tạo thành công: +${bulkResult.created} thẻ`, 'success');
                newDeck.card_count = bulkResult.created;
                setDecks([{ ...newDeck, is_global: true }, ...decks]);
              } else {
                const error = await bulkRes.json();
                showToast(`Deck tạo nhưng import lỗi: ${error.error}`, 'error');
                setDecks([{ ...newDeck, card_count: 0, is_global: true }, ...decks]);
              }
            } catch (fcErr) {
              console.error('Error importing vocabulary into deck:', fcErr);
              showToast('Deck tạo nhưng lỗi khi import từ vựng', 'error');
              setDecks([{ ...newDeck, card_count: 0, is_global: true }, ...decks]);
            }
          } else {
            setDecks([{ ...newDeck, card_count: 0, is_global: true }, ...decks]);
            showToast('Deck tạo thành công', 'success');
          }
        } else if (editingId) {
          // Update deck with vocabulary
          const vocabIds = Array.from(selectedVocabIds);
          const updateUrl = `${API_BASE_URL}/admin/decks/${editingId}`;
          
          const updateRes = await fetch(updateUrl, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              ...deckPayload,
              vocab_ids: vocabIds,
            }),
          });

          if (updateRes.ok) {
            const updatedDeck = await updateRes.json();
            setDecks(decks.map(d => d.id === editingId ? { ...d, ...updatedDeck } : d));
            showToast('Deck đã cập nhật', 'success');
          } else {
            showToast('Lỗi khi cập nhật deck', 'error');
          }
        }
        
        setShowForm(false);
        setEditingId(null);
        setFormData({ name: '', description: '', color: 'blue' });
        setSelectedVocabIds(new Set());
        setSelectedCategories(new Set());
        setVocabSearch('');
        setVocabCategory('all');
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
        // Clear previous state first
        setSelectedVocabIds(new Set());
        setSelectedCategories(new Set());
        
        setFormData({
          name: fullDeck.name,
          description: fullDeck.description || '',
          color: fullDeck.color || 'blue',
        });
        // Populate selected vocabulary
        if (fullDeck.flashcards) {
          const ids = new Set<number>(fullDeck.flashcards.map((f: any) => Number(f.vocab_id)).filter(Boolean));
          setSelectedVocabIds(ids);
        }
      } else {
        // Fallback if fetch fails
        setFormData({
          name: deck.name,
          description: deck.description || '',
          color: deck.color || 'blue',
        });
      }
    } catch (error) {
      console.error('Error fetching deck details:', error);
      setFormData({
        name: deck.name,
        description: deck.description || '',
        color: deck.color || 'blue',
      });
    }
    setEditingId(deck.id);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: '', description: '', color: 'blue' });
    setSelectedVocabIds(new Set());
    setSelectedCategories(new Set());
    setVocabSearch('');
    setVocabCategory('all');
  };

  const filteredDecks = decks.filter(
    (deck) =>
      deck.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deck.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredVocab = vocabulary
    .filter((v: any) => (vocabCategory === 'all' ? true : (v.category || 'General') === vocabCategory))
    .filter((v: any) => {
      const q = vocabSearch.trim().toLowerCase();
      if (!q) return true;
      const word = (v.word || '').toLowerCase();
      const reading = (v.reading || '').toLowerCase();
      const meaning = (v.meaning || '').toLowerCase();
      return word.includes(q) || reading.includes(q) || meaning.includes(q);
    })
    .slice(0, 200);

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
          onClick={() => {
            setEditingId(null);
            setFormData({ name: '', description: '', color: 'blue' });
            setSelectedVocabIds(new Set());
            setSelectedCategories(new Set());
            setShowForm(true);
          }}
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
              {true && (
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <label className="block text-sm font-medium">Chọn từ vựng (từ mục Từ vựng)</label>
                      <p className="text-xs text-gray-500 mt-1">
                        Bạn có thể chọn từng từ hoặc import hàng loạt theo danh mục.
                      </p>
                    </div>
                    <div className="text-xs text-gray-600">
                      Đã chọn: <b>{selectedVocabIds.size}</b> từ / <b>{selectedCategories.size}</b> danh mục
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
                    <div className="md:col-span-2 relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        value={vocabSearch}
                        onChange={(e) => setVocabSearch(e.target.value)}
                        placeholder="Tìm theo word / reading / meaning..."
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                    <select
                      value={vocabCategory}
                      onChange={(e) => setVocabCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="all">Tất cả danh mục</option>
                      {vocabCategories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3">
                    <button
                      type="button"
                      onClick={importCurrentCategory}
                      className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-blue-300 text-blue-700 bg-white hover:bg-blue-50"
                      disabled={vocabLoading}
                      title="Import cả danh mục đang chọn"
                    >
                      <FolderPlus className="w-4 h-4" />
                      Import danh mục
                    </button>
                    {Array.from(selectedCategories).map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => toggleCategory(c)}
                        className="px-3 py-1.5 text-xs rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200"
                        title="Bỏ chọn danh mục"
                      >
                        {c} ✕
                      </button>
                    ))}
                  </div>

                  <div className="max-h-72 overflow-y-auto border border-gray-200 rounded-lg bg-white">
                    {vocabLoading ? (
                      <div className="p-4 flex items-center gap-2 text-sm text-gray-600">
                        <Loader className="w-4 h-4 animate-spin" />
                        Đang tải danh sách từ vựng...
                      </div>
                    ) : filteredVocab.length === 0 ? (
                      <div className="p-4 text-sm text-gray-500">Không có từ vựng phù hợp.</div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {filteredVocab.map((v: any) => {
                          const checked = selectedVocabIds.has(v.id);
                          return (
                            <button
                              type="button"
                              key={v.id}
                              onClick={() => toggleVocab(v.id)}
                              className="w-full text-left p-3 hover:bg-gray-50 flex items-start gap-3"
                            >
                              <div className="mt-0.5 text-blue-600">
                                {checked ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="font-semibold text-gray-900">
                                    {v.word} <span className="text-xs text-gray-400 font-normal">#{v.id}</span>
                                  </div>
                                  <div className="text-xs text-gray-500">{v.category || 'General'}</div>
                                </div>
                                <div className="text-xs text-gray-500">{v.reading}</div>
                                <div className="text-sm text-gray-700">{v.meaning}</div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-gray-500 mt-2">
                    Gợi ý: để import nhanh cả danh mục, chọn danh mục ở dropdown rồi bấm “Import danh mục”.
                  </p>
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
