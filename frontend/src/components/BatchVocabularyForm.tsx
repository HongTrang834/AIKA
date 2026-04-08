import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

interface BatchFormProps {
  onSubmit: (records: any[]) => Promise<void>;
  isLoading?: boolean;
}

interface RowData {
  id: string;
  word: string;
  reading: string;
  meaning: string;
  category: string;
  level: string;
}

export default function BatchVocabularyForm({ onSubmit, isLoading = false }: BatchFormProps) {
  const [rows, setRows] = useState<RowData[]>([
    { id: '1', word: '', reading: '', meaning: '', category: '', level: '2' },
  ]);
  const [error, setError] = useState('');

  const addRow = () => {
    const newRow: RowData = {
      id: Date.now().toString(),
      word: '',
      reading: '',
      meaning: '',
      category: '',
      level: '2',
    };
    setRows([...rows, newRow]);
  };

  const removeRow = (id: string) => {
    if (rows.length > 1) {
      setRows(rows.filter(r => r.id !== id));
    }
  };

  const updateRow = (id: string, field: keyof RowData, value: string) => {
    setRows(rows.map(r => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const handleSubmit = async () => {
    setError('');

    // Validate
    const filledRows = rows.filter(r => r.word || r.reading || r.meaning);
    if (filledRows.length === 0) {
      setError('❌ Please fill in at least one row');
      return;
    }

    const invalidRows = filledRows.filter(r => !r.word || !r.reading || !r.meaning);
    if (invalidRows.length > 0) {
      setError('❌ All rows must have word, reading, and meaning');
      return;
    }

    try {
      await onSubmit(filledRows);
      // Reset form
      setRows([{ id: '1', word: '', reading: '', meaning: '', category: '', level: '2' }]);
    } catch (err) {
      setError(`❌ ${err instanceof Error ? err.message : 'Submit failed'}`);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-lg">
      <h2 className="text-xl font-bold mb-4">Quick Add Vocabulary</h2>

      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      <div className="overflow-x-auto mb-4">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-3 py-2 text-left">Word</th>
              <th className="px-3 py-2 text-left">Reading</th>
              <th className="px-3 py-2 text-left">Meaning</th>
              <th className="px-3 py-2 text-left">Category</th>
              <th className="px-3 py-2 text-center">Level</th>
              <th className="px-3 py-2 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b hover:bg-gray-50">
                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={row.word}
                    onChange={(e) => updateRow(row.id, 'word', e.target.value)}
                    placeholder="学ぶ"
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={row.reading}
                    onChange={(e) => updateRow(row.id, 'reading', e.target.value)}
                    placeholder="まなぶ"
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={row.meaning}
                    onChange={(e) => updateRow(row.id, 'meaning', e.target.value)}
                    placeholder="to learn"
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={row.category}
                    onChange={(e) => updateRow(row.id, 'category', e.target.value)}
                    placeholder="Verbs"
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </td>
                <td className="px-3 py-2">
                  <select
                    value={row.level}
                    onChange={(e) => updateRow(row.id, 'level', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="1">N1</option>
                    <option value="2">N2</option>
                    <option value="3">N3</option>
                    <option value="4">N4</option>
                  </select>
                </td>
                <td className="px-3 py-2 text-center">
                  <button
                    onClick={() => removeRow(row.id)}
                    disabled={rows.length === 1}
                    className="text-red-500 hover:text-red-700 disabled:text-gray-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex gap-2">
        <button
          onClick={addRow}
          className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200"
        >
          <Plus className="w-4 h-4" />
          Add Row
        </button>
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Submitting...' : 'Submit'}
        </button>
      </div>
    </div>
  );
}
