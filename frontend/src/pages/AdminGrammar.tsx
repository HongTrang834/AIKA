import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Loader, Download, Upload } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { parseCSVFile, parseExcelFile } from '../lib/importParsers';
import ImportPreviewModal from '../components/ImportPreviewModal';

const API_BASE_URL = 'http://localhost:3000/api';

export default function AdminGrammar() {
  const { token } = useAuth();
  const { showToast } = useToast();
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
    category: '',
    level: 2,
  });

  // Import states
  const [showImport, setShowImport] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importMessage, setImportMessage] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [previewRecords, setPreviewRecords] = useState<any[]>([]);
  const [pendingImport, setPendingImport] = useState<any | null>(null);

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
        setFormData({ title: '', pattern: '', explanation: '', meaning: '', example_sentence: '', category: '', level: 2 });
      }
    } catch (error) {
      console.error('Error saving grammar:', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await fetch(`${API_BASE_URL}/admin/grammar/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchGrammar();
      showToast('Đã xóa ngữ pháp', 'success');
    } catch (error) {
      console.error('Error deleting grammar:', error);
      showToast('Lỗi khi xóa ngữ pháp', 'error');
    }
  };

  const handleEdit = (item: any) => {
    setFormData(item);
    setEditingId(item.id);
    setShowForm(true);
  };

  // Import handlers
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportLoading(true);
    setImportMessage('');

    try {
      let records: any[] = [];

      if (file.name.endsWith('.csv')) {
        const text = await file.text();
        records = parseCSVFile(text);
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        records = await parseExcelFile(file);
      } else {
        setImportMessage('❌ Định dạng file không hỗ trợ. Vui lòng dùng CSV hoặc Excel');
        setImportLoading(false);
        return;
      }

      if (records.length === 0) {
        setImportMessage('❌ File trống hoặc không có dữ liệu hợp lệ');
        setImportLoading(false);
        return;
      }

      // Show preview
      setPreviewRecords(records);
      setPendingImport(records);
      setShowPreview(true);
      setImportMessage(`✅ Tìm thấy ${records.length} bản ghi`);
    } catch (error: any) {
      setImportMessage(`❌ Lỗi: ${error.message}`);
    } finally {
      setImportLoading(false);
      event.target.value = '';
    }
  };

  const handleConfirmImport = async () => {
    if (!pendingImport) return;

    setImportLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/grammar/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ records: pendingImport }),
      });

      // Check if response is ok and has content
      if (!response.ok) {
        const errorText = await response.text();
        setImportMessage(`❌ Server error (${response.status}): ${errorText}`);
        setImportLoading(false);
        return;
      }

      // Check if response has content
      const contentLength = response.headers.get('content-length');
      if (contentLength === '0' || !contentLength) {
        setImportMessage(`❌ Server trả về response trống. Vui lòng kiểm tra server logs.`);
        setImportLoading(false);
        return;
      }

      const text = await response.text();
      if (!text) {
        setImportMessage(`❌ Server trả về response trống.`);
        setImportLoading(false);
        return;
      }

      const result = JSON.parse(text);

      if (response.ok) {
        setImportMessage(`✅ Import thành công! ${result.imported} bản ghi được thêm, ${result.skipped} bị bỏ qua`);
        setShowPreview(false);
        setPendingImport(null);
        setPreviewRecords([]);
        setShowImport(false);
        await fetchGrammar();
      } else {
        setImportMessage(`❌ Import thất bại: ${result.error}`);
      }
    } catch (error: any) {
      console.error('Import error:', error);
      setImportMessage(`❌ Lỗi: ${error.message}`);
    } finally {
      setImportLoading(false);
    }
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
        <div className="flex gap-3">
          <button
            onClick={() => setShowImport(!showImport)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-purple-700"
          >
            <Upload className="w-5 h-5" />
            Import
          </button>
          <button
            onClick={() => {
              setShowForm(!showForm);
              setEditingId(null);
              setFormData({ title: '', pattern: '', explanation: '', meaning: '', example_sentence: '', category: '', level: 2 });
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            Thêm Ngữ Pháp
          </button>
        </div>
      </div>

      {/* Import Section */}
      {showImport && (
        <div className="bg-white p-6 rounded-lg shadow-lg mb-8 border border-purple-200">
          <h2 className="text-xl font-bold mb-4">Import Ngữ Pháp từ File</h2>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-purple-300 rounded-lg p-8 text-center">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileSelect}
                  disabled={importLoading}
                  className="hidden"
                />
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-8 h-8 text-purple-600" />
                  <p className="text-gray-600">
                    Kéo thả file hoặc <span className="text-purple-600 font-bold">chọn file</span>
                  </p>
                  <p className="text-sm text-gray-500">CSV hoặc Excel (.xlsx, .xls)</p>
                </div>
              </label>
            </div>

            {importMessage && (
              <div className={`p-3 rounded ${importMessage.includes('❌') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                {importMessage}
              </div>
            )}

            <div className="bg-blue-50 p-4 rounded border border-blue-200">
              <p className="text-sm font-bold mb-2">📋 Format yêu cầu (CSV/Excel):</p>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• <span className="font-mono">pattern</span> - Dạng ngữ pháp (bắt buộc)</li>
                <li>• <span className="font-mono">meaning</span> - Nghĩa (bắt buộc)</li>
                <li>• <span className="font-mono">explanation</span> - Giải thích</li>
                <li>• <span className="font-mono">title</span> - Tiêu đề</li>
                <li>• <span className="font-mono">category</span> - Danh mục</li>
                <li>• <span className="font-mono">level</span> - Cấp độ (1-4)</li>
                <li>• <span className="font-mono">example_sentence</span> - Ví dụ tiếng Nhật</li>
                <li>• <span className="font-mono">example_translation</span> - Dịch sang Tiếng Việt</li>
              </ul>
            </div>

            <button
              onClick={() => setShowImport(false)}
              className="w-full bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
              disabled={importLoading}
            >
              Đóng
            </button>
          </div>
        </div>
      )}

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
              type="text"
              placeholder="Danh mục (Category)"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="border px-3 py-2 rounded"
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
              className="border px-3 py-2 rounded col-span-2"
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

      {/* Preview Modal */}
      <ImportPreviewModal
        isOpen={showPreview}
        records={previewRecords}
        totalRecords={previewRecords.length}
        onConfirm={handleConfirmImport}
        onCancel={() => {
          setShowPreview(false);
          setPendingImport(null);
        }}
        isLoading={importLoading}
        title="Preview Ngữ Pháp"
      />

      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="w-full">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-4 py-3 text-left">ID</th>
              <th className="px-4 py-3 text-left">Tiêu đề</th>
              <th className="px-4 py-3 text-left">Dạng</th>
              <th className="px-4 py-3 text-left">Nghĩa</th>
              <th className="px-4 py-3 text-left">Danh mục</th>
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
                <td className="px-4 py-3">{item.category || '-'}</td>
                <td className="px-4 py-3">N{item.level}</td>
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
