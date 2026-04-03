import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = 'http://localhost:3000/api';

export default function AdminGrammar() {
  const { token } = useAuth();
  const [grammar, setGrammar] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    pattern: '',
    explanation: '',
    meaning: '',
    example_sentence: '',
    level: 2,
  });

  useEffect(() => {
    fetchGrammar();
  }, [token]);

  const fetchGrammar = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/grammar?limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setGrammar(data.rows || []);
    } catch (error) {
      console.error('Error fetching grammar:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `${API_BASE_URL}/admin/grammar/${editingId}` : `${API_BASE_URL}/admin/grammar`;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        await fetchGrammar();
        setShowForm(false);
        setEditingId(null);
        setFormData({ title: '', pattern: '', explanation: '', meaning: '', example_sentence: '', level: 2 });
      }
    } catch (error) {
      console.error('Error saving grammar:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Xóa ngữ pháp này?')) return;
    try {
      await fetch(`${API_BASE_URL}/admin/grammar/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchGrammar();
    } catch (error) {
      console.error('Error deleting grammar:', error);
    }
  };

  const handleEdit = (item: any) => {
    setFormData(item);
    setEditingId(item.id);
    setShowForm(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Quản lý Ngữ Pháp</h1>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setFormData({ title: '', pattern: '', explanation: '', meaning: '', example_sentence: '', level: 2 });
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          Thêm Ngữ Pháp
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-lg mb-8 border border-gray-200">
          <h2 className="text-xl font-bold mb-4">{editingId ? 'Sửa' : 'Thêm'} Ngữ Pháp</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Tiêu đề (Title)"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="border px-3 py-2 rounded"
            />
            <input
              type="text"
              placeholder="Dạng (Pattern)"
              value={formData.pattern}
              onChange={(e) => setFormData({ ...formData, pattern: e.target.value })}
              required
              className="border px-3 py-2 rounded"
            />
            <textarea
              placeholder="Giải thích (Explanation)"
              value={formData.explanation}
              onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
              required
              className="border px-3 py-2 rounded col-span-2"
              rows={2}
            />
            <input
              type="text"
              placeholder="Nghĩa (Meaning)"
              value={formData.meaning}
              onChange={(e) => setFormData({ ...formData, meaning: e.target.value })}
              required
              className="border px-3 py-2 rounded col-span-2"
            />
            <input
              type="number"
              placeholder="Level"
              value={formData.level}
              onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) })}
              className="border px-3 py-2 rounded"
            />
            <input
              type="text"
              placeholder="Ví dụ (Example)"
              value={formData.example_sentence}
              onChange={(e) => setFormData({ ...formData, example_sentence: e.target.value })}
              className="border px-3 py-2 rounded"
            />
            <div className="col-span-2 flex gap-2">
              <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                {editingId ? 'Cập nhật' : 'Thêm'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
                className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="w-full">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-4 py-3 text-left">ID</th>
              <th className="px-4 py-3 text-left">Tiêu đề</th>
              <th className="px-4 py-3 text-left">Dạng</th>
              <th className="px-4 py-3 text-left">Nghĩa</th>
              <th className="px-4 py-3 text-left">Level</th>
              <th className="px-4 py-3 text-center">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {grammar.map((item) => (
              <tr key={item.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3">{item.id}</td>
                <td className="px-4 py-3 font-bold">{item.title}</td>
                <td className="px-4 py-3 font-mono">{item.pattern}</td>
                <td className="px-4 py-3">{item.meaning}</td>
                <td className="px-4 py-3">{item.level}</td>
                <td className="px-4 py-3 flex justify-center gap-2">
                  <button
                    onClick={() => handleEdit(item)}
                    className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="bg-red-500 text-white p-2 rounded hover:bg-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {grammar.length === 0 && (
        <div className="text-center py-8 text-gray-500">Không có ngữ pháp nào</div>
      )}
    </div>
  );
}
