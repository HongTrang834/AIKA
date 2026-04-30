import React from 'react';
import { X } from 'lucide-react';

interface PreviewRecord {
  // Vocabulary fields
  word?: string;
  reading?: string;
  
  // Grammar fields
  title?: string;
  pattern?: string;
  explanation?: string;
  example_translation?: string;

  // Common fields
  meaning: string;
  category?: string;
  level?: string | number;
  example_sentence?: string;
  example_count?: number;
  examples?: string[];
  error?: string;
}

interface ImportPreviewModalProps {
  isOpen: boolean;
  records: PreviewRecord[];
  totalRecords: number;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  title?: string;
  type?: 'vocabulary' | 'grammar';
}

export default function ImportPreviewModal({
  isOpen,
  records,
  totalRecords,
  onConfirm,
  onCancel,
  isLoading = false,
  title = 'Import Preview',
  type = 'vocabulary',
}: ImportPreviewModalProps) {
  if (!isOpen) return null;

  const validRecords = records.filter(r => !r.error);
  const errorRecords = records.filter(r => r.error);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full max-h-[80vh] overflow-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-blue-50 p-3 rounded">
              <p className="text-sm text-gray-600">Total Records</p>
              <p className="text-2xl font-bold text-blue-600">{totalRecords}</p>
            </div>
            <div className="bg-green-50 p-3 rounded">
              <p className="text-sm text-gray-600">Valid</p>
              <p className="text-2xl font-bold text-green-600">{validRecords.length}</p>
            </div>
            <div className="bg-red-50 p-3 rounded">
              <p className="text-sm text-gray-600">Errors</p>
              <p className="text-2xl font-bold text-red-600">{errorRecords.length}</p>
            </div>
          </div>

          {/* Preview Table */}
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-sm border border-gray-200 rounded">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-3 py-2 text-left">Status</th>
                  {type === 'vocabulary' ? (
                    <>
                      <th className="px-3 py-2 text-left">Word</th>
                      <th className="px-3 py-2 text-left">Reading</th>
                    </>
                  ) : (
                    <>
                      <th className="px-3 py-2 text-left">Title</th>
                      <th className="px-3 py-2 text-left">Pattern</th>
                    </>
                  )}
                  <th className="px-3 py-2 text-left">Meaning</th>
                  <th className="px-3 py-2 text-left">Category</th>
                  <th className="px-3 py-2 text-left">Level</th>
                  <th className="px-3 py-2 text-center">Examples</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record, idx) => (
                  <tr
                    key={idx}
                    className={`border-b ${record.error ? 'bg-red-50' : 'hover:bg-gray-50'}`}
                  >
                    <td className="px-3 py-2">
                      {record.error ? (
                        <span className="text-red-600 font-semibold text-xs">❌ ERROR</span>
                      ) : (
                        <span className="text-green-600 font-semibold text-xs">✓ OK</span>
                      )}
                    </td>
                    {type === 'vocabulary' ? (
                      <>
                        <td className="px-3 py-2 font-medium">{record.word}</td>
                        <td className="px-3 py-2">{record.reading}</td>
                      </>
                    ) : (
                      <>
                        <td className="px-3 py-2 font-medium">{record.title}</td>
                        <td className="px-3 py-2 font-mono text-blue-700">{record.pattern}</td>
                      </>
                    )}
                    <td className="px-3 py-2">{record.meaning}</td>
                    <td className="px-3 py-2 text-gray-600">{record.category || '—'}</td>
                    <td className="px-3 py-2 text-center">{record.level || '—'}</td>
                    <td className="px-3 py-2 text-center">
                      {record.example_count ? (
                        <span className="inline-flex items-center justify-center bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-semibold">
                          {record.example_count}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Error Details */}
          {errorRecords.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded p-3 text-sm mb-4">
              <p className="font-semibold text-red-900 mb-2">Errors Found:</p>
              <ul className="list-disc list-inside text-red-800 space-y-1">
                {errorRecords.slice(0, 5).map((record, idx) => (
                  <li key={idx}>
                    <strong>{type === 'vocabulary' ? record.word : record.pattern || '(missing pattern)'}</strong>: {record.error}
                  </li>
                ))}
                {errorRecords.length > 5 && (
                  <li>... and {errorRecords.length - 5} more errors</li>
                )}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex justify-end gap-3 bg-gray-50">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading || errorRecords.length > 0}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Importing...' : `Import ${validRecords.length} Records`}
          </button>
        </div>
      </div>
    </div>
  );
}
