import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Loader, Upload, Download, FileText, List } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import BatchVocabularyForm from '../components/BatchVocabularyForm';
import ImportPreviewModal from '../components/ImportPreviewModal';
import { parseExcelFile, parseCSVFile, validateRecords } from '../lib/importParsers';

const API_BASE_URL = 'http://localhost:3000/api';

type ImportTab = 'csv' | 'excel' | 'batch';

export default function AdminVocabulary() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [vocabulary, setVocabulary] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [activeImportTab, setActiveImportTab] = useState<ImportTab>('csv');
  const [importLoading, setImportLoading] = useState(false);
  const [importMessage, setImportMessage] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [previewRecords, setPreviewRecords] = useState<any[]>([]);
  const [pendingImport, setPendingImport] = useState<any | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    word: '',
    reading: '',
    meaning: '',
    category: '',
    level: 2,
    example_sentence: '',
  });

  useEffect(() => {
    fetchVocabulary();
  }, [token]);

  const fetchVocabulary = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/vocabulary?limit=5000`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setVocabulary(data.rows || []);
    } catch (error) {
      console.error('Error fetching vocabulary:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `${API_BASE_URL}/admin/vocabulary/${editingId}` : `${API_BASE_URL}/admin/vocabulary`;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        await fetchVocabulary();
        setShowForm(false);
        setEditingId(null);
        setFormData({ word: '', reading: '', meaning: '', category: '', level: 2, example_sentence: '' });
      }
    } catch (error) {
      console.error('Error saving vocabulary:', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await fetch(`${API_BASE_URL}/admin/vocabulary/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchVocabulary();
      showToast('Đã xóa từ vựng', 'success');
    } catch (error) {
      console.error('Error deleting vocabulary:', error);
      showToast('Lỗi khi xóa từ vựng', 'error');
    }
  };

  const handleDeleteAll = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/vocabulary/all`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        await fetchVocabulary();
        setShowDeleteConfirm(false);
        showToast('Đã xóa tất cả từ vựng', 'success');
      } else {
        showToast('Lỗi khi xóa từ vựng', 'error');
      }
    } catch (error) {
      console.error('Error deleting all vocabulary:', error);
      showToast('Lỗi khi xóa từ vựng', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = (item: any) => {
    setFormData(item);
    setEditingId(item.id);
    setShowForm(true);
  };

  const parseCSV = (text: string) => {
    const lines = text.trim().split('\n');
    const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      const values = lines[i].split(',').map(v => v.trim());
      const row: any = {};
      
      headers.forEach((header, idx) => {
        row[header] = values[idx] || '';
      });

      data.push(row);
    }

    return data;
  };

  const mergeRecords = (records: any[]) => {
    const groupedRecords = {} as any;
    
    // Group records by word+reading+meaning
    for (const record of records) {
      const word = record.word?.toString().trim();
      const reading = record.reading?.toString().trim();
      const meaning = record.meaning?.toString().trim();
      const category = record.category?.toString().trim() || '';
      const level = record.level ? parseInt(record.level) : 2;
      const example = record.example_sentence?.toString().trim() || '';
      const example_translation = record.example_translation?.toString().trim() || '';

      // Validate required fields
      if (!word || !reading || !meaning) {
        continue;
      }

      const key = `${word}|${reading}|${meaning}`;
      
      if (!groupedRecords[key]) {
        groupedRecords[key] = {
          word,
          reading,
          meaning,
          category: category || '',
          level: level,
          example_sentence: example || '',
          example_translation: example_translation || '',
          examples: [],
        };
      }
      
      // Add example to the group if it's unique
      if (example && !groupedRecords[key].examples.includes(example)) {
        groupedRecords[key].examples.push(example);
      }
    }

    // Convert grouped records to array - ready to send to backend
    return Object.values(groupedRecords);
  };

  const handleShowPreview = async (records: any[]) => {
    // DEBUG: Check merge impact
    const merged = mergeRecords(records);
    console.log(`📊 Original records: ${records.length}, After merge: ${merged.length}, Diff: ${records.length - merged.length}`);
    
    const validated = validateRecords(merged);
    setPreviewRecords(validated);
    setPendingImport(merged); // Send merged records to backend (no double merging!)
    setShowPreview(true);
  };

  const handleConfirmImport = async () => {
    if (!pendingImport) return;

    setImportLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/vocabulary/import`, {
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
      setImportMessage(`✅ Imported successfully! Added ${result.imported} words, ${result.skipped} skipped`);
      await fetchVocabulary();
      
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

  const handleBatchSubmit = async (records: any[]) => {
    await handleShowPreview(records);
  };

  const downloadTemplate = () => {
    const template = 'word,reading,meaning,category,level,example_sentence\n学ぶ,まなぶ,learn,Verbs,2,\n日本,にほん,Japan,Geography,1,';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vocabulary_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
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
        <h1 className="text-3xl font-bold">Quản lý Từ Vựng</h1>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setShowForm(!showForm);
              setShowImport(false);
              setEditingId(null);
              setFormData({ word: '', reading: '', meaning: '', category: '', level: 2, example_sentence: '' });
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            Thêm Từ Vựng
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
          <h2 className="text-xl font-bold mb-4">Import Từ Vựng</h2>

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
            <button
              onClick={() => setActiveImportTab('batch')}
              className={`px-4 py-2 flex items-center gap-2 ${
                activeImportTab === 'batch'
                  ? 'border-b-2 border-blue-600 text-blue-600 font-semibold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="w-4 h-4" />
              Quick Add
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
                  <div className="text-gray-600 mb-2">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p>Click to select CSV file or drag and drop</p>
                    <p className="text-sm text-gray-500 mt-1">Only .csv files accepted</p>
                  </div>
                </label>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-900 mb-2">
                  <strong>CSV Format:</strong> word,reading,meaning,category,level,example_sentence
                </p>
                <p className="text-xs text-blue-700 mb-3">Example:</p>
                <p className="font-mono text-xs whitespace-pre-wrap text-gray-700">
                  学ぶ,まなぶ,learn,Verbs,2,{'\n'}
                  日本,にほん,Japan,Geography,1,
                </p>
              </div>

              <button
                onClick={downloadTemplate}
                className="w-full bg-blue-100 text-blue-700 px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-200"
              >
                <Download className="w-5 h-5" />
                Download Template
              </button>
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
                  <div className="text-gray-600 mb-2">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p>Click to select Excel file or drag and drop</p>
                    <p className="text-sm text-gray-500 mt-1">Supports .xlsx and .xls files</p>
                  </div>
                </label>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-900 mb-2">
                  <strong>Excel Format:</strong> Column headers must be: word, reading, meaning
                </p>
                <p className="text-xs text-green-700">
                  Optional columns: category, level, example_sentence
                </p>
              </div>
            </div>
          )}

          {/* Batch Import Tab */}
          {activeImportTab === 'batch' && (
            <div className="mt-4">
              <BatchVocabularyForm onSubmit={handleBatchSubmit} isLoading={importLoading} />
            </div>
          )}
        </div>
      )}

      {/* Import Preview Modal */}
      <ImportPreviewModal
        isOpen={showPreview}
        records={previewRecords}
        totalRecords={previewRecords.length}
        onConfirm={handleConfirmImport}
        onCancel={() => {
          setShowPreview(false);
          setPendingImport(null);
          setPreviewRecords([]);
          setImportMessage('');
        }}
        isLoading={importLoading}
        title="Review Vocabulary Import"
      />

      {/* Form */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-lg mb-8 border border-gray-200">
          <h2 className="text-xl font-bold mb-4">{editingId ? 'Sửa' : 'Thêm'} Từ Vựng</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Từ (Word)"
              value={formData.word}
              onChange={(e) => setFormData({ ...formData, word: e.target.value })}
              required
              className="border px-3 py-2 rounded"
            />
            <input
              type="text"
              placeholder="Đọc (Reading)"
              value={formData.reading}
              onChange={(e) => setFormData({ ...formData, reading: e.target.value })}
              required
              className="border px-3 py-2 rounded"
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
            <textarea
              placeholder="Ví dụ (Example)"
              value={formData.example_sentence}
              onChange={(e) => setFormData({ ...formData, example_sentence: e.target.value })}
              className="border px-3 py-2 rounded col-span-2"
              rows={2}
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
              <th className="px-4 py-3 text-left">Từ</th>
              <th className="px-4 py-3 text-left">Đọc</th>
              <th className="px-4 py-3 text-left">Nghĩa</th>
              <th className="px-4 py-3 text-left">Danh mục</th>
              <th className="px-4 py-3 text-left">Level</th>
              <th className="px-4 py-3 text-left">Ví dụ</th>
              <th className="px-4 py-3 text-center">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {vocabulary.map((item) => (
              <tr key={item.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3">{item.id}</td>
                <td className="px-4 py-3 font-bold text-lg">{item.word}</td>
                <td className="px-4 py-3">{item.reading}</td>
                <td className="px-4 py-3">{item.meaning}</td>
                <td className="px-4 py-3">{item.category || '-'}</td>
                <td className="px-4 py-3">{item.level}</td>
                <td className="px-4 py-3 text-sm text-slate-600 max-w-xs truncate">{item.example_sentence || '-'}</td>
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

      {vocabulary.length === 0 && (
        <div className="text-center py-8 text-gray-500">Không có từ vựng nào</div>
      )}

      {/* Delete All Confirm Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-sm">
            <h2 className="text-2xl font-bold mb-4 text-red-600">Xóa Tất Cả Từ Vựng?</h2>
            <p className="text-gray-700 mb-2">Hành động này sẽ xóa <strong>{vocabulary.length} từ vựng</strong> và không thể hoàn tác.</p>
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
                {isDeleting && <Loader className="w-4 h-4 animate-spin" />}
                {isDeleting ? 'Đang xóa...' : 'Xóa Tất Cả'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
