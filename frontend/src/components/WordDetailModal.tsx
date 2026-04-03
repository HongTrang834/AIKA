import React from 'react';
import { X } from 'lucide-react';

interface WordDetailModalProps {
  vocab: {
    id: number;
    word: string;
    reading: string;
    meaning?: string;
    vietnamese_meaning?: string;
    example_sentence?: string;
    category?: string;
    level?: number;
  };
  onClose: () => void;
}

export function WordDetailModal({ vocab, onClose }: WordDetailModalProps) {
  const meaning = vocab.meaning || vocab.vietnamese_meaning || 'N/A';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 flex items-center justify-between p-6">
          <h2 className="text-2xl font-bold text-slate-900">Word Details</h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Word & Reading */}
          <div className="text-center">
            <div className="text-sm text-slate-500 mb-2">Reading</div>
            <div className="text-sm text-slate-600 font-medium mb-4">{vocab.reading}</div>
            <div className="text-5xl font-bold text-slate-900 mb-2">{vocab.word}</div>
          </div>

          {/* Meaning */}
          <div className="bg-blue-50 rounded-xl p-4">
            <div className="text-xs font-bold text-blue-600 mb-2 uppercase tracking-wider">Meaning</div>
            <div className="text-lg font-semibold text-slate-900">{meaning}</div>
          </div>

          {/* Example Sentence */}
          {vocab.example_sentence && (
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">Example</div>
              <div className="text-sm text-slate-700 leading-relaxed">{vocab.example_sentence}</div>
            </div>
          )}

          {/* Category & Level */}
          <div className="grid grid-cols-2 gap-4">
            {vocab.category && (
              <div className="bg-slate-50 rounded-xl p-4">
                <div className="text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">Category</div>
                <div className="text-sm font-semibold text-slate-900">{vocab.category}</div>
              </div>
            )}
            {vocab.level && (
              <div className="bg-slate-50 rounded-xl p-4">
                <div className="text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">Level</div>
                <div className="text-sm font-semibold text-slate-900">N{vocab.level}</div>
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="text-xs text-slate-400 text-center">
            Word ID: {vocab.id}
          </div>
        </div>
      </div>
    </div>
  );
}
