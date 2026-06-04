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
      <div className="flex items-center justify-center py-20 h-full">
        <Loader className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="h1-feather text-almost-black">Quản lý Từ Vựng</h1>
        <div className="flex gap-4">
          <button
            onClick={() => {
              setShowForm(!showForm);
              setShowImport(false);
              setEditingId(null);
              setFormData({ word: '', reading: '', meaning: '', category: '', level: 2, example_sentence: '' });
            }}
            className="btn-3d-blue flex items-center gap-2 px-6"
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
            className="btn-3d-blue flex items-center gap-2 px-6"
          >
            <Upload className="w-5 h-5" />
            Import
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="btn-3d-red flex items-center gap-2 px-6"
          >
            <Trash2 className="w-5 h-5" />
            Xóa Tất Cả
          </button>
        </div>
      </div>

      {/* Import Section */}
      {showImport && (
        <div className="card-duo p-8 mb-8">
          <h2 className="h2-feather mb-6">Import Từ Vựng</h2>

          {/* Tab Navigation */}
          <div className="flex gap-3 mb-6 border-b-2 border-cloud-gray pb-4">
            <button
              onClick={() => setActiveImportTab('csv')}
              className={`px-5 py-3 rounded-xl border-2 font-bold flex items-center gap-2 transition-all ${
                activeImportTab === 'csv'
                  ? 'border-sky-blue bg-sky-blue/10 text-sky-blue'
                  : 'border-transparent text-silver hover:bg-gray-50 hover:border-cloud-gray'
              }`}
            >
              <Upload className="w-5 h-5" />
              CSV File
            </button>
            <button
              onClick={() => setActiveImportTab('excel')}
              className={`px-5 py-3 rounded-xl border-2 font-bold flex items-center gap-2 transition-all ${
                activeImportTab === 'excel'
                  ? 'border-sky-blue bg-sky-blue/10 text-sky-blue'
                  : 'border-transparent text-silver hover:bg-gray-50 hover:border-cloud-gray'
              }`}
            >
              <FileText className="w-5 h-5" />
              Excel File
            </button>
            <button
              onClick={() => setActiveImportTab('batch')}
              className={`px-5 py-3 rounded-xl border-2 font-bold flex items-center gap-2 transition-all ${
                activeImportTab === 'batch'
                  ? 'border-sky-blue bg-sky-blue/10 text-sky-blue'
                  : 'border-transparent text-silver hover:bg-gray-50 hover:border-cloud-gray'
              }`}
            >
              <List className="w-5 h-5" />
              Quick Add
            </button>
          </div>

          {importMessage && (
            <div
              className={`p-5 rounded-2xl mb-6 font-bold border-2 ${
                importMessage.includes('✅')
                  ? 'bg-sky-blue-light text-sky-blue border-sky-blue'
                  : 'bg-pink-50 text-bubblegum-pink border-bubblegum-pink'
              }`}
            >
              {importMessage}
            </div>
          )}

          {/* CSV Import Tab */}
          {activeImportTab === 'csv' && (
            <div className="space-y-6">
              <div className="border-4 border-dashed border-cloud-gray rounded-3xl p-10 text-center hover:border-sky-blue hover:bg-sky-blue/5 transition-all">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleImportCSV}
                  disabled={importLoading}
                  className="hidden"
                  id="csv-input"
                />
                <label htmlFor="csv-input" className="cursor-pointer flex flex-col items-center">
                  <Upload className="w-12 h-12 mb-4 text-silver" />
                  <p className="font-extrabold text-[17px] text-almost-black">Click to select CSV file or drag and drop</p>
                  <p className="text-[15px] font-bold text-silver mt-2">Only .csv files accepted</p>
                </label>
              </div>

              <div className="bg-sky-blue/10 p-6 rounded-2xl border-2 border-sky-blue/20">
                <p className="text-[15px] text-sky-blue font-extrabold mb-3">
                  CSV Format: word,reading,meaning,category,level,example_sentence
                </p>
                <p className="text-[13px] font-bold text-sky-blue/80 mb-2">Example:</p>
                <p className="font-mono text-[15px] font-bold whitespace-pre-wrap text-graphite">
                  学ぶ,まなぶ,learn,Verbs,2,{'\n'}
                  日本,にほん,Japan,Geography,1,
                </p>
              </div>

              <button
                onClick={downloadTemplate}
                className="w-full btn-outline-gray px-6 py-4 flex items-center justify-center gap-2 text-sky-blue hover:text-sky-blue hover:border-sky-blue hover:bg-sky-blue/5"
              >
                <Download className="w-6 h-6" />
                <span className="font-bold text-[17px]">Download Template</span>
              </button>
            </div>
          )}

          {/* Excel Import Tab */}
          {activeImportTab === 'excel' && (
            <div className="space-y-6">
              <div className="border-4 border-dashed border-cloud-gray rounded-3xl p-10 text-center hover:border-sky-blue hover:bg-sky-blue/5 transition-all">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleImportExcel}
                  disabled={importLoading}
                  className="hidden"
                  id="excel-input"
                />
                <label htmlFor="excel-input" className="cursor-pointer flex flex-col items-center">
                  <FileText className="w-12 h-12 mb-4 text-silver" />
                  <p className="font-extrabold text-[17px] text-almost-black">Click to select Excel file or drag and drop</p>
                  <p className="text-[15px] font-bold text-silver mt-2">Supports .xlsx and .xls files</p>
                </label>
              </div>

              <div className="bg-sky-blue-light p-6 rounded-2xl border-2 border-sky-blue/20">
                <p className="text-[15px] text-sky-blue font-extrabold mb-2">
                  Excel Format: Column headers must be: word, reading, meaning
                </p>
                <p className="text-[13px] font-bold text-sky-blue/80">
                  Optional columns: category, level, example_sentence
                </p>
              </div>
            </div>
          )}

          {/* Batch Import Tab */}
          {activeImportTab === 'batch' && (
            <div className="mt-6">
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
        <div className="card-duo p-8 mb-8">
          <h2 className="h2-feather mb-6">{editingId ? 'Sửa' : 'Thêm'} Từ Vựng</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-5">
            <input
              type="text"
              placeholder="Từ (Word)"
              value={formData.word}
              onChange={(e) => setFormData({ ...formData, word: e.target.value })}
              required
              className="border-2 border-cloud-gray px-5 py-4 rounded-2xl focus:border-sky-blue focus:bg-sky-blue/5 outline-none font-bold text-almost-black text-[15px]"
            />
            <input
              type="text"
              placeholder="Đọc (Reading)"
              value={formData.reading}
              onChange={(e) => setFormData({ ...formData, reading: e.target.value })}
              required
              className="border-2 border-cloud-gray px-5 py-4 rounded-2xl focus:border-sky-blue focus:bg-sky-blue/5 outline-none font-bold text-almost-black text-[15px]"
            />
            <input
              type="text"
              placeholder="Nghĩa (Meaning)"
              value={formData.meaning}
              onChange={(e) => setFormData({ ...formData, meaning: e.target.value })}
              required
              className="border-2 border-cloud-gray px-5 py-4 rounded-2xl focus:border-sky-blue focus:bg-sky-blue/5 outline-none font-bold text-almost-black text-[15px] col-span-2"
            />
            <input
              type="text"
              placeholder="Danh mục (Category)"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="border-2 border-cloud-gray px-5 py-4 rounded-2xl focus:border-sky-blue focus:bg-sky-blue/5 outline-none font-bold text-almost-black text-[15px]"
            />
            <input
              type="number"
              placeholder="Level"
              value={formData.level}
              onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) })}
              className="border-2 border-cloud-gray px-5 py-4 rounded-2xl focus:border-sky-blue focus:bg-sky-blue/5 outline-none font-bold text-almost-black text-[15px]"
            />
            <textarea
              placeholder="Ví dụ (Example)"
              value={formData.example_sentence}
              onChange={(e) => setFormData({ ...formData, example_sentence: e.target.value })}
              className="border-2 border-cloud-gray px-5 py-4 rounded-2xl focus:border-sky-blue focus:bg-sky-blue/5 outline-none font-bold text-almost-black text-[15px] col-span-2"
              rows={2}
            />
            <div className="col-span-2 flex gap-4 mt-2">
              <button type="submit" className="btn-3d-blue px-8 text-[17px]">
                {editingId ? 'Cập nhật' : 'Thêm'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
                className="btn-outline-gray px-8 text-[17px] text-graphite"
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="card-duo overflow-hidden">
        <table className="w-full">
          <thead className="bg-cloud-gray border-b-2 border-cloud-gray">
            <tr>
              <th className="px-5 py-4 text-left font-extrabold text-[13px] uppercase tracking-wider text-graphite">ID</th>
              <th className="px-5 py-4 text-left font-extrabold text-[13px] uppercase tracking-wider text-graphite">Từ</th>
              <th className="px-5 py-4 text-left font-extrabold text-[13px] uppercase tracking-wider text-graphite">Đọc</th>
              <th className="px-5 py-4 text-left font-extrabold text-[13px] uppercase tracking-wider text-graphite">Nghĩa</th>
              <th className="px-5 py-4 text-left font-extrabold text-[13px] uppercase tracking-wider text-graphite">Danh mục</th>
              <th className="px-5 py-4 text-left font-extrabold text-[13px] uppercase tracking-wider text-graphite">Level</th>
              <th className="px-5 py-4 text-left font-extrabold text-[13px] uppercase tracking-wider text-graphite">Ví dụ</th>
              <th className="px-5 py-4 text-center font-extrabold text-[13px] uppercase tracking-wider text-graphite">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {vocabulary.map((item) => (
              <tr key={item.id} className="border-b-2 border-cloud-gray hover:bg-gray-50 transition-colors">
                <td className="px-5 py-4 font-bold text-silver">{item.id}</td>
                <td className="px-5 py-4 font-feather font-bold text-[22px] text-almost-black">{item.word}</td>
                <td className="px-5 py-4 font-bold text-graphite">{item.reading}</td>
                <td className="px-5 py-4 font-bold text-graphite">{item.meaning}</td>
                <td className="px-5 py-4 font-bold text-silver">{item.category || '-'}</td>
                <td className="px-5 py-4 font-bold text-sky-blue">{item.level}</td>
                <td className="px-5 py-4 font-bold text-[13px] text-silver max-w-xs truncate">{item.example_sentence || '-'}</td>
                <td className="px-5 py-4 flex justify-center gap-3">
                  <button
                    onClick={() => handleEdit(item)}
                    className="p-3 rounded-xl border-2 border-cloud-gray text-sky-blue hover:bg-sky-blue/10 hover:border-sky-blue transition-all"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-3 rounded-xl border-2 border-cloud-gray text-bubblegum-pink hover:bg-pink-50 hover:border-bubblegum-pink transition-all"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {vocabulary.length === 0 && (
        <div className="text-center py-12 font-bold text-silver text-[17px]">Không có từ vựng nào</div>
      )}

      {/* Delete All Confirm Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-almost-black/50 flex items-center justify-center z-50 p-4">
          <div className="card-duo p-10 max-w-sm w-full relative">
            <h2 className="h2-feather text-bubblegum-pink mb-4">Xóa Tất Cả Từ Vựng?</h2>
            <p className="font-bold text-graphite mb-2">Hành động này sẽ xóa <strong>{vocabulary.length} từ vựng</strong> và không thể hoàn tác.</p>
            <p className="text-silver font-bold text-[15px] mb-8">Hãy chắc chắn rằng bạn muốn tiếp tục.</p>
            <div className="flex gap-4 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="btn-outline-gray px-6 py-3 font-bold text-graphite disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleDeleteAll}
                disabled={isDeleting}
                className="btn-3d-red px-6 py-3 disabled:opacity-50 flex items-center gap-2"
              >
                {isDeleting && <Loader className="w-5 h-5 animate-spin" />}
                {isDeleting ? 'Đang xóa...' : 'Xóa Tất Cả'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
