import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Loader, Upload, Download, FileText, List } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { parseCSVFile, parseExcelFile, validateGrammarRecords } from '../lib/importParsers';
import ImportPreviewModal from '../components/ImportPreviewModal';

const API_BASE_URL = 'http://localhost:3000/api';

type ImportTab = 'csv' | 'excel' | 'batch';

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
  const [activeImportTab, setActiveImportTab] = useState<ImportTab>('csv');
  const [importLoading, setImportLoading] = useState(false);
  const [importMessage, setImportMessage] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [previewRecords, setPreviewRecords] = useState<any[]>([]);
  const [pendingImport, setPendingImport] = useState<any | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchGrammar();
  }, [token]);

  const fetchGrammar = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/grammar?limit=5000`, {
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

  const handleDeleteAll = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/grammar/all`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        await fetchGrammar();
        setShowDeleteConfirm(false);
        showToast('Đã xóa tất cả ngữ pháp', 'success');
      } else {
        showToast('Lỗi khi xóa ngữ pháp', 'error');
      }
    } catch (error) {
      console.error('Error deleting all grammar:', error);
      showToast('Lỗi khi xóa ngữ pháp', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = (item: any) => {
    setFormData(item);
    setEditingId(item.id);
    setShowForm(true);
  };

  const mergeRecords = (records: any[]) => {
    const groupedRecords = {} as any;
    
    // Group records by pattern|meaning
    for (const record of records) {
      const pattern = record.pattern?.toString().trim();
      const meaning = record.meaning?.toString().trim();
      const title = record.title?.toString().trim() || '';
      const explanation = record.explanation?.toString().trim() || '';
      const category = record.category?.toString().trim() || '';
      const level = record.level ? parseInt(record.level) : 2;

      // Validate required fields
      if (!pattern || !meaning) {
        continue;
      }

      const key = `${pattern}|${meaning}`;
      
      if (!groupedRecords[key]) {
        groupedRecords[key] = {
          title: title || pattern,
          pattern,
          meaning,
          explanation: explanation || '',
          category: category || '',
          level: level,
          example_sentence: record.example_sentence?.toString().trim() || '',
          example_translation: record.example_translation?.toString().trim() || '',
        };
      }
    }

    // Convert grouped records to array - ready to send to backend
    return Object.values(groupedRecords);
  };

  // Import handlers
  const handleShowPreview = async (records: any[]) => {
    // DEBUG: Check merge impact
    const merged = mergeRecords(records);
    console.log(`📊 Original records: ${records.length}, After merge: ${merged.length}, Diff: ${records.length - merged.length}`);
    
    const validated = validateGrammarRecords(merged);
    setPreviewRecords(validated);
    setPendingImport(merged); // Send merged records to backend
    setShowPreview(true);
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const records = parseCSVFile(text);
      
      if (records.length === 0) {
        setImportMessage('❌ File is empty!');
        return;
      }

      await handleShowPreview(records);
    } catch (error) {
      setImportMessage(`❌ ${error instanceof Error ? error.message : 'Error processing file'}`);
    } finally {
      e.target.value = '';
    }
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const records = await parseExcelFile(file);
      
      if (records.length === 0) {
        setImportMessage('❌ Excel file is empty!');
        return;
      }

      await handleShowPreview(records);
    } catch (error) {
      setImportMessage(`❌ ${error instanceof Error ? error.message : 'Error processing file'}`);
    } finally {
      e.target.value = '';
    }
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

      // Merge records to avoid duplicates
      const merged = mergeRecords(records);

      // Show preview
      const validated = validateGrammarRecords(merged);
      setPreviewRecords(validated);
      setPendingImport(merged); // Send merged records to backend
      setShowPreview(true);
      setImportMessage(`✅ Tìm thấy ${records.length} bản ghi (merged to ${merged.length})`);
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
      const res = await fetch(`${API_BASE_URL}/admin/grammar/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ records: pendingImport }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        let errorMessage = `Server error (${res.status})`;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }
        setImportMessage(`❌ ${errorMessage}`);
        return;
      }

      const result = await res.json();
      setImportMessage(`✅ Imported successfully! Added ${result.imported} items, ${result.skipped} skipped`);
      await fetchGrammar();
      
      setTimeout(() => {
        setShowPreview(false);
        setPendingImport(null);
        setShowImport(false);
        setImportMessage('');
      }, 2000);
    } catch (error) {
      setImportMessage(`❌ ${error instanceof Error ? error.message : 'Error importing'}`);
    } finally {
      setImportLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 h-full">
        <Loader className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Quản lý Ngữ Pháp</h1>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setShowForm(!showForm);
              setShowImport(false);
              setEditingId(null);
              setFormData({ title: '', pattern: '', explanation: '', meaning: '', example_sentence: '', category: '', level: 2 });
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            Thêm Ngữ Pháp
          </button>
          <button
            onClick={() => {
              setShowImport(!showImport);
              setShowForm(false);
              setImportMessage('');
              setActiveImportTab('csv');
            }}
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700"
          >
            <Upload className="w-5 h-5" />
            Import
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-700"
          >
            <Trash2 className="w-5 h-5" />
            Xóa Tất Cả
          </button>
        </div>
      </div>

      {/* Import Section */}
      {showImport && (
        <div className="bg-white p-6 rounded-lg shadow-lg mb-8 border border-gray-200">
          <h2 className="text-xl font-bold mb-4">Import Ngữ Pháp</h2>

          {/* Tab Navigation */}
          <div className="flex gap-2 mb-4 border-b">
            <button
              onClick={() => setActiveImportTab('csv')}
              className={`px-4 py-2 flex items-center gap-2 ${
                activeImportTab === 'csv'
                  ? 'border-b-2 border-blue-600 text-blue-600 font-semibold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Upload className="w-4 h-4" />
              CSV File
            </button>
            <button
              onClick={() => setActiveImportTab('excel')}
              className={`px-4 py-2 flex items-center gap-2 ${
                activeImportTab === 'excel'
                  ? 'border-b-2 border-blue-600 text-blue-600 font-semibold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              Excel File
            </button>
          </div>

          {importMessage && (
            <div
              className={`p-4 rounded-lg mb-4 ${
                importMessage.includes('✅')
                  ? 'bg-green-50 text-green-700'
                  : 'bg-red-50 text-red-700'
              }`}
            >
              {importMessage}
            </div>
          )}

          {/* CSV Import Tab */}
          {activeImportTab === 'csv' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleImportCSV}
                  disabled={importLoading}
                  className="hidden"
                  id="csv-input"
                />
                <label htmlFor="csv-input" className="cursor-pointer">
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="w-8 h-8 text-gray-600" />
                    <p className="text-gray-600">Kéo thả hoặc <span className="text-blue-600 font-bold">chọn CSV</span></p>
                    <p className="text-sm text-gray-500">Định dạng: pattern, meaning, title, explanation, category, level, example_sentence, example_translation</p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Excel Import Tab */}
          {activeImportTab === 'excel' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleImportExcel}
                  disabled={importLoading}
                  className="hidden"
                  id="excel-input"
                />
                <label htmlFor="excel-input" className="cursor-pointer">
                  <div className="flex flex-col items-center gap-2">
                    <FileText className="w-8 h-8 text-gray-600" />
                    <p className="text-gray-600">Kéo thả hoặc <span className="text-blue-600 font-bold">chọn Excel</span></p>
                    <p className="text-sm text-gray-500">Định dạng: .xlsx hoặc .xls</p>
                  </div>
                </label>
              </div>
            </div>
          )}

          <button
            onClick={() => setShowImport(false)}
            className="mt-4 w-full bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
          >
            Đóng
          </button>
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
        type="grammar"
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

      {/* Delete All Confirm Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-sm">
            <h2 className="text-2xl font-bold mb-4 text-red-600">⚠️ Xóa Tất Cả Ngữ Pháp?</h2>
            <p className="text-gray-700 mb-2">Hành động này sẽ xóa <strong>{grammar.length} ngữ pháp</strong> và không thể hoàn tác.</p>
            <p className="text-gray-600 mb-6 text-sm">Hãy chắc chắn rằng bạn muốn tiếp tục.</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleDeleteAll}
                disabled={isDeleting}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isDeleting ? <Loader className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {isDeleting ? 'Đang xóa...' : 'Xóa Tất Cả'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
