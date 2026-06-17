import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Loader, Search, Palette, CheckSquare, Square, FolderPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

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
  { name: 'blue', label: 'Blue', bg: 'bg-sky-blue/10', border: 'border-sky-blue', ring: 'ring-sky-blue' },
  { name: 'red', label: 'Red', bg: 'bg-pink-50', border: 'border-bubblegum-pink', ring: 'ring-bubblegum-pink' },
  { name: 'green', label: 'Green', bg: 'bg-sky-blue-light', border: 'border-sky-blue', ring: 'ring-sky-blue' },
  { name: 'purple', label: 'Purple', bg: 'bg-grape-soda/10', border: 'border-grape-soda', ring: 'ring-grape-soda' },
  { name: 'yellow', label: 'Yellow', bg: 'bg-sunshine-yellow/20', border: 'border-sunshine-yellow', ring: 'ring-[#cc9f00]' },
  { name: 'gray', label: 'Gray', bg: 'bg-cloud-gray/30', border: 'border-silver', ring: 'ring-silver' },
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
      showToast('Error loading decks', 'error');
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
      showToast('Unable to load vocabulary list', 'error');
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
      showToast('Please select a category to import', 'error');
      return;
    }
    toggleCategory(vocabCategory);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      showToast('Deck name cannot be empty', 'error');
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
                showToast(`Deck created successfully: +${bulkResult.created} cards`, 'success');
                newDeck.card_count = bulkResult.created;
                setDecks([{ ...newDeck, is_global: true }, ...decks]);
              } else {
                const error = await bulkRes.json();
                showToast(`Deck created but import error: ${error.error}`, 'error');
                setDecks([{ ...newDeck, card_count: 0, is_global: true }, ...decks]);
              }
            } catch (fcErr) {
              console.error('Error importing vocabulary into deck:', fcErr);
              showToast('Deck created but error importing vocabulary', 'error');
              setDecks([{ ...newDeck, card_count: 0, is_global: true }, ...decks]);
            }
          } else {
            setDecks([{ ...newDeck, card_count: 0, is_global: true }, ...decks]);
            showToast('Deck created successfully', 'success');
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
            showToast('Deck updated', 'success');
          } else {
            showToast('Error updating deck', 'error');
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
        showToast('Error saving deck', 'error');
      }
    } catch (error) {
      console.error('Error saving deck:', error);
      showToast('Error saving deck', 'error');
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
        showToast('Deck deleted', 'success');
      } else {
        showToast('Error deleting deck', 'error');
      }
    } catch (error) {
      console.error('Error deleting deck:', error);
      showToast('Error deleting deck', 'error');
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
        <Loader className="w-14 h-14 animate-spin text-sky-blue" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="h1-feather text-almost-black">Global Decks Management</h1>
          <p className="text-graphite font-bold mt-1 text-[15px]">These decks will be displayed to all users</p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setFormData({ name: '', description: '', color: 'blue' });
            setSelectedVocabIds(new Set());
            setSelectedCategories(new Set());
            setShowForm(true);
          }}
          className="btn-3d-blue flex items-center gap-2 px-6"
        >
          <Plus className="w-5 h-5" />
          Add Deck
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-16 top-1/2 -translate-y-1/2 w-5 h-5 text-silver" />
        <input
          type="text"
          placeholder="Search deck name or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-48 pr-4 py-3 border-2 border-cloud-gray rounded-2xl focus:outline-none focus:border-sky-blue focus:bg-sky-blue/5 font-bold text-almost-black text-[15px] transition-colors"
        />
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-almost-black/50 flex items-center justify-center z-50 p-4">
          <div className="card-duo p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="h2-feather mb-6 text-almost-black">{editingId ? 'Update' : 'Add'} Deck</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-[15px] font-extrabold text-graphite mb-2">Deck Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-5 py-4 border-2 border-cloud-gray rounded-2xl focus:outline-none focus:border-sky-blue focus:bg-sky-blue/5 font-bold text-[15px]"
                  placeholder="Example: N2 Business"
                  required
                />
              </div>

              <div>
                <label className="block text-[15px] font-extrabold text-graphite mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-5 py-4 border-2 border-cloud-gray rounded-2xl focus:outline-none focus:border-sky-blue focus:bg-sky-blue/5 font-bold text-[15px]"
                  placeholder="Short description of this deck"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-[15px] font-extrabold text-graphite mb-3">Color</label>
                <div className="grid grid-cols-3 gap-3">
                  {COLORS.map((colorOption) => (
                    <button
                      key={colorOption.name}
                      type="button"
                      onClick={() => setFormData({ ...formData, color: colorOption.name })}
                      className={`p-4 rounded-2xl border-4 transition-all flex items-center justify-center ${
                        formData.color === colorOption.name
                          ? `${colorOption.bg} ${colorOption.border}`
                          : `bg-white border-cloud-gray text-silver hover:border-silver`
                      }`}
                      title={colorOption.label}
                    >
                      <Palette className={`w-6 h-6 ${formData.color === colorOption.name ? 'text-almost-black' : ''}`} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Flashcards */}
              {true && (
                <div className="border-4 border-cloud-gray rounded-3xl p-6 bg-white">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <label className="block text-[15px] font-extrabold text-graphite">Select vocabulary (from Vocabulary bank)</label>
                      <p className="text-[13px] font-bold text-silver mt-1">
                        You can select individual words or bulk import by category.
                      </p>
                    </div>
                    <div className="text-[13px] font-bold text-silver bg-sky-blue/10 px-3 py-1.5 rounded-xl border border-sky-blue/20">
                      Selected: <b className="text-sky-blue text-[15px]">{selectedVocabIds.size}</b> words / <b className="text-sky-blue text-[15px]">{selectedCategories.size}</b> categories
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                    <div className="md:col-span-2 relative">
                      <Search className="absolute left-16 top-1/2 -translate-y-1/2 w-5 h-5 text-silver" />
                      <input
                        value={vocabSearch}
                        onChange={(e) => setVocabSearch(e.target.value)}
                        placeholder="Search by word / reading / meaning..."
                        className="w-full pl-48 pr-4 py-3 border-2 border-cloud-gray rounded-2xl focus:outline-none focus:border-sky-blue font-bold text-[13px]"
                      />
                    </div>
                    <select
                      value={vocabCategory}
                      onChange={(e) => setVocabCategory(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-cloud-gray rounded-2xl focus:outline-none focus:border-sky-blue font-bold text-[13px] text-graphite bg-white"
                    >
                      <option value="all">All categories</option>
                      {vocabCategories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    <button
                      type="button"
                      onClick={importCurrentCategory}
                      className="inline-flex items-center gap-2 px-4 py-2 text-[13px] font-bold rounded-xl border-2 border-sky-blue text-sky-blue bg-white hover:bg-sky-blue/10 transition-colors"
                      disabled={vocabLoading}
                      title="Import the entire selected category"
                    >
                      <FolderPlus className="w-5 h-5" />
                      Import category
                    </button>
                    {Array.from(selectedCategories).map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => toggleCategory(c)}
                        className="px-3 py-2 text-[13px] font-bold rounded-xl bg-sky-blue/10 border-2 border-sky-blue text-sky-blue hover:bg-sky-blue/20"
                        title="Deselect category"
                      >
                        {c} ✕
                      </button>
                    ))}
                  </div>

                  <div className="max-h-72 overflow-y-auto border-2 border-cloud-gray rounded-2xl bg-white">
                    {vocabLoading ? (
                      <div className="p-6 flex items-center justify-center gap-3 text-[15px] font-bold text-silver">
                        <Loader className="w-5 h-5 animate-spin" />
                        Loading vocabulary list...
                      </div>
                    ) : filteredVocab.length === 0 ? (
                      <div className="p-6 text-center text-[15px] font-bold text-silver">No matching vocabulary.</div>
                    ) : (
                      <div className="divide-y-2 divide-cloud-gray">
                        {filteredVocab.map((v: any) => {
                          const checked = selectedVocabIds.has(v.id);
                          return (
                            <button
                              type="button"
                              key={v.id}
                              onClick={() => toggleVocab(v.id)}
                              className={`w-full text-left p-4 hover:bg-sky-blue/5 flex items-start gap-4 transition-colors ${checked ? 'bg-sky-blue/10' : ''}`}
                            >
                              <div className={`mt-1 ${checked ? 'text-sky-blue' : 'text-silver'}`}>
                                {checked ? <CheckSquare className="w-6 h-6" /> : <Square className="w-6 h-6 border-2 border-cloud-gray rounded text-transparent" />}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between gap-2 mb-1">
                                  <div className="font-extrabold text-[17px] text-almost-black">
                                    {v.word} <span className="text-[11px] font-bold text-silver ml-1">#{v.id}</span>
                                  </div>
                                  <div className="text-[11px] font-bold text-silver bg-cloud-gray px-2 py-1 rounded-lg uppercase">{v.category || 'General'}</div>
                                </div>
                                <div className="text-[13px] font-bold text-silver mb-1">{v.reading}</div>
                                <div className="text-[15px] font-bold text-graphite">{v.meaning}</div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <p className="text-[13px] font-bold text-silver mt-3">
                    Tip: to quickly import the entire category, select the category from the dropdown and click "Import category".
                  </p>
                </div>
              )}

              <div className="flex gap-4 pt-6">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 btn-3d-blue py-4 font-bold text-[17px] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {saving && <Loader className="w-5 h-5 animate-spin" />}
                  {editingId ? 'Update' : 'Add Deck'}
                </button>
                <button
                  type="button"
                  onClick={handleCloseForm}
                  disabled={saving}
                  className="flex-1 btn-outline-gray py-4 font-bold text-[17px] text-graphite disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
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
            <div key={deck.id} className={`${colorOption.bg} border-4 ${colorOption.border} rounded-2xl p-6 relative group overflow-hidden transition-all hover:-translate-y-1`}>
              <div className="flex justify-between items-start mb-4 relative z-10">
                <h3 className="h2-feather text-almost-black flex-1 pr-4 leading-tight break-all">{deck.name}</h3>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleEdit(deck)}
                    className="p-2 rounded-xl bg-white/50 hover:bg-white border-2 border-transparent hover:border-cloud-gray transition-colors"
                    title="Edit deck"
                  >
                    <Edit2 className="w-5 h-5 text-sky-blue" />
                  </button>
                  <button
                    onClick={() => handleDelete(deck.id)}
                    className="p-2 rounded-xl bg-white/50 hover:bg-white border-2 border-transparent hover:border-cloud-gray transition-colors"
                    title="Delete deck"
                  >
                    <Trash2 className="w-5 h-5 text-bubblegum-pink" />
                  </button>
                </div>
              </div>

              {deck.description && (
                <p className="text-graphite font-bold text-[15px] mb-6 relative z-10">{deck.description}</p>
              )}

              <div className="flex justify-between items-center text-[15px] font-extrabold text-graphite pt-4 border-t-2 border-cloud-gray relative z-10">
                <span className="bg-white/50 px-3 py-1.5 rounded-xl border-2 border-cloud-gray/50">📚 {deck.card_count} flashcards</span>
                <span className="text-[13px] text-silver font-bold">
                  {new Date(deck.created_at).toLocaleDateString('en-US')}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {filteredDecks.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>No decks found.</p>
        </div>
      )}
    </div>
  );
}
