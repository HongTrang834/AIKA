import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Loader, Upload, Download, FileText, List } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { parseCSVFile, parseExcelFile, validateGrammarRecords } from '../lib/importParsers';
import ImportPreviewModal from '../components/ImportPreviewModal';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

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
      showToast('Grammar deleted', 'success');
    } catch (error) {
      console.error('Error deleting grammar:', error);
      showToast('Error deleting grammar', 'error');
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
        showToast('All grammar deleted', 'success');
      } else {
        showToast('Error deleting grammar', 'error');
      }
    } catch (error) {
      console.error('Error deleting all grammar:', error);
      showToast('Error deleting grammar', 'error');
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
        setImportMessage('❌ Unsupported file format. Please use CSV or Excel');
        setImportLoading(false);
        return;
      }

      if (records.length === 0) {
        setImportMessage('❌ Empty file or no valid data');
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
      setImportMessage(`✅ Found ${records.length} records (merged to ${merged.length})`);
    } catch (error: any) {
      setImportMessage(`❌ Error: ${error.message}`);
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
        <h1 className="h1-feather text-almost-black">Grammar Management</h1>
        <div className="flex gap-4">
          <button
            onClick={() => {
              setShowForm(!showForm);
              setShowImport(false);
              setEditingId(null);
              setFormData({ title: '', pattern: '', explanation: '', meaning: '', example_sentence: '', category: '', level: 2 });
            }}
            className="btn-3d-blue flex items-center gap-2 px-6"
          >
            <Plus className="w-5 h-5" />
            Add Grammar
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
            Delete All
          </button>
        </div>
      </div>

      {/* Import Section */}
      {showImport && (
        <div className="card-duo p-8 mb-8">
          {/* <h2 className="h2-feather mb-6">Import Ngữ Pháp</h2> */}

          {/* Tab Navigation */}
          <div className="flex gap-3 mb-6 border-b-2 border-cloud-gray pb-4">
            <button
              onClick={() => setActiveImportTab('csv')}
              className={`px-5 py-3 rounded-xl border-2 font-bold flex items-center gap-2 transition-all ${activeImportTab === 'csv'
                  ? 'border-sky-blue bg-sky-blue/10 text-sky-blue'
                  : 'border-transparent text-silver hover:bg-gray-50 hover:border-cloud-gray'
                }`}
            >
              <Upload className="w-5 h-5" />
              CSV File
            </button>
            <button
              onClick={() => setActiveImportTab('excel')}
              className={`px-5 py-3 rounded-xl border-2 font-bold flex items-center gap-2 transition-all ${activeImportTab === 'excel'
                  ? 'border-sky-blue bg-sky-blue/10 text-sky-blue'
                  : 'border-transparent text-silver hover:bg-gray-50 hover:border-cloud-gray'
                }`}
            >
              <FileText className="w-5 h-5" />
              Excel File
            </button>
          </div>

          {importMessage && (
            <div
              className={`p-5 rounded-2xl mb-6 font-bold border-2 ${importMessage.includes('✅')
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
                  <p className="font-extrabold text-[17px] text-almost-black">Drag and drop or <span className="text-sky-blue">choose CSV</span></p>
                  <p className="text-[15px] font-bold text-silver mt-2">Format: pattern, meaning, title, explanation, category, level, example_sentence, example_translation</p>
                </label>
              </div>
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
                  <p className="font-extrabold text-[17px] text-almost-black">Drag and drop or <span className="text-sky-blue">choose Excel</span></p>
                  <p className="text-[15px] font-bold text-silver mt-2">Format: .xlsx or .xls</p>
                </label>
              </div>
            </div>
          )}

          <button
            onClick={() => setShowImport(false)}
            className="mt-6 w-full btn-outline-gray px-6 py-4 flex items-center justify-center font-bold text-[17px] text-graphite"
          >
            Close
          </button>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="card-duo p-8 mb-8">
          <h2 className="h2-feather mb-6">{editingId ? 'Edit' : 'Add'} Grammar</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-5">
            <input
              type="text"
              placeholder="Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="border-2 border-cloud-gray px-5 py-4 rounded-2xl focus:border-sky-blue focus:bg-sky-blue/5 outline-none font-bold text-almost-black text-[15px]"
            />
            <input
              type="text"
              placeholder="Pattern"
              value={formData.pattern}
              onChange={(e) => setFormData({ ...formData, pattern: e.target.value })}
              required
              className="border-2 border-cloud-gray px-5 py-4 rounded-2xl focus:border-sky-blue focus:bg-sky-blue/5 outline-none font-bold text-almost-black text-[15px]"
            />
            <textarea
              placeholder="Explanation"
              value={formData.explanation}
              onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
              required
              className="border-2 border-cloud-gray px-5 py-4 rounded-2xl focus:border-sky-blue focus:bg-sky-blue/5 outline-none font-bold text-almost-black text-[15px] col-span-2"
              rows={2}
            />
            <input
              type="text"
              placeholder="Meaning"
              value={formData.meaning}
              onChange={(e) => setFormData({ ...formData, meaning: e.target.value })}
              required
              className="border-2 border-cloud-gray px-5 py-4 rounded-2xl focus:border-sky-blue focus:bg-sky-blue/5 outline-none font-bold text-almost-black text-[15px] col-span-2"
            />
            <input
              type="text"
              placeholder="Category"
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
            <input
              type="text"
              placeholder="Example"
              value={formData.example_sentence}
              onChange={(e) => setFormData({ ...formData, example_sentence: e.target.value })}
              className="border-2 border-cloud-gray px-5 py-4 rounded-2xl focus:border-sky-blue focus:bg-sky-blue/5 outline-none font-bold text-almost-black text-[15px] col-span-2"
            />
            <div className="col-span-2 flex gap-4 mt-2">
              <button type="submit" className="btn-3d-blue px-8 text-[17px]">
                {editingId ? 'Update' : 'Add'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
                className="btn-outline-gray px-8 text-[17px] text-graphite"
              >
                Cancel
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
        title="Preview Grammar"
        type="grammar"
      />

      {/* Table */}
      <div className="card-duo overflow-hidden">
        <table className="w-full">
          <thead className="bg-cloud-gray border-b-2 border-cloud-gray">
            <tr>
              <th className="px-5 py-4 text-left font-extrabold text-[13px] uppercase tracking-wider text-graphite">No.</th>
              <th className="px-5 py-4 text-left font-extrabold text-[13px] uppercase tracking-wider text-graphite">Title</th>
              <th className="px-5 py-4 text-left font-extrabold text-[13px] uppercase tracking-wider text-graphite">Pattern</th>
              <th className="px-5 py-4 text-left font-extrabold text-[13px] uppercase tracking-wider text-graphite">Meaning</th>
              <th className="px-5 py-4 text-left font-extrabold text-[13px] uppercase tracking-wider text-graphite">Category</th>
              <th className="px-5 py-4 text-left font-extrabold text-[13px] uppercase tracking-wider text-graphite">Level</th>
              <th className="px-5 py-4 text-center font-extrabold text-[13px] uppercase tracking-wider text-graphite">Actions</th>
            </tr>
          </thead>
          <tbody>
            {grammar.map((item, index) => (
              <tr key={item.id} className="border-b-2 border-cloud-gray hover:bg-gray-50 transition-colors">
                <td className="px-5 py-4 font-bold text-silver">{index + 1}</td>
                <td className="px-5 py-4 font-feather font-bold text-[19px] text-almost-black">{item.title}</td>
                <td className="px-5 py-4 font-bold text-sky-blue">{item.pattern}</td>
                <td className="px-5 py-4 font-bold text-graphite">{item.meaning}</td>
                <td className="px-5 py-4 font-bold text-silver">{item.category || '-'}</td>
                <td className="px-5 py-4 font-bold text-graphite">N{item.level}</td>
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

      {grammar.length === 0 && (
        <div className="text-center py-12 font-bold text-silver text-[17px]">No grammar found</div>
      )}

      {/* Delete All Confirm Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-almost-black/50 flex items-center justify-center z-50 p-4">
          <div className="card-duo p-10 max-w-sm w-full relative">
            <h2 className="h2-feather text-bubblegum-pink mb-4">⚠️ Delete All Grammar?</h2>
            <p className="font-bold text-graphite mb-2">This action will delete <strong>{grammar.length} grammar patterns</strong> and cannot be undone.</p>
            <p className="text-silver font-bold text-[15px] mb-8">Please make sure you want to continue.</p>
            <div className="flex gap-4 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="btn-outline-gray px-6 py-3 font-bold text-graphite disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAll}
                disabled={isDeleting}
                className="btn-3d-red px-6 py-3 disabled:opacity-50 flex items-center gap-2"
              >
                {isDeleting ? <Loader className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                {isDeleting ? 'Deleting...' : 'Delete All'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
