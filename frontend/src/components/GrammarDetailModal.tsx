import React from 'react';
import { X } from 'lucide-react';

interface GrammarDetailModalProps {
  grammar: {
    id: number;
    title?: string;
    pattern: string;
    meaning?: string;
    vietnamese_meaning?: string;
    explanation?: string;
    example_sentence?: string;
    examples?: string; // JSON string array
    level?: number;
  };
  onClose: () => void;
}

export function GrammarDetailModal({ grammar, onClose }: GrammarDetailModalProps) {
  const meaning = grammar.meaning || grammar.vietnamese_meaning || 'N/A';
  
  // Parse examples from JSON string or fallback to example_sentence
  let examples: Array<{ japanese: string; vietnamese: string }> = [];
  if (grammar.examples) {
    try {
      const parsed = JSON.parse(grammar.examples);
      if (Array.isArray(parsed)) {
        examples = parsed.map(ex => 
          typeof ex === 'string' 
            ? { japanese: ex, vietnamese: '' }
            : { japanese: ex.japanese || '', vietnamese: ex.vietnamese || '' }
        );
      }
    } catch (e) {
      examples = grammar.example_sentence ? [{ japanese: grammar.example_sentence, vietnamese: '' }] : [];
    }
  } else if (grammar.example_sentence) {
    examples = [{ japanese: grammar.example_sentence, vietnamese: '' }];
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 flex items-center justify-between p-6">
          <h2 className="text-2xl font-bold text-slate-900">Grammar Pattern</h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Pattern */}
          <div className="text-center">
            <div className="text-sm text-slate-500 mb-2">Pattern</div>
            <div className="text-3xl font-mono font-bold text-slate-900 break-words">{grammar.pattern}</div>
          </div>

          {/* Meaning */}
          <div className="bg-blue-50 rounded-xl p-4">
            <div className="text-xs font-bold text-blue-600 mb-2 uppercase tracking-wider">Meaning</div>
            <div className="text-lg font-semibold text-slate-900">{meaning}</div>
          </div>

          {/* Explanation */}
          {grammar.explanation && (
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">Explanation</div>
              <div className="text-sm text-slate-700 leading-relaxed">{grammar.explanation}</div>
            </div>
          )}

          {/* Example Sentences */}
          {examples.length > 0 && (
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="text-xs font-bold text-slate-600 mb-3 uppercase tracking-wider">
                Examples ({examples.length})
              </div>
              <div className="space-y-4">
                {examples.map((example, idx) => (
                  <div key={idx} className="border-l-2 border-slate-300 pl-3">
                    <div className="text-sm text-slate-900 leading-relaxed font-medium mb-1">
                      {example.japanese}
                    </div>
                    {example.vietnamese && (
                      <div className="text-sm text-slate-600 italic mb-2">
                        {example.vietnamese}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Level */}
          {grammar.level && (
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">Level</div>
              <div className="text-sm font-semibold text-slate-900">N{grammar.level}</div>
            </div>
          )}

          {/* Metadata */}
          <div className="text-xs text-slate-400 text-center">
            Pattern ID: {grammar.id}
          </div>
        </div>
      </div>
    </div>
  );
}
