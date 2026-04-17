import React from 'react';
import { X, BookOpen, Lightbulb } from 'lucide-react';
import { motion } from 'motion/react';

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
  onAddFlashcard?: (grammarId: number) => void;
}

export function GrammarDetailModal({ grammar, onClose, onAddFlashcard }: GrammarDetailModalProps) {
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
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 flex items-center justify-between p-6">
          <h2 className="text-2xl font-bold text-slate-900">Grammar Details</h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          {/* Pattern Display */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-8">
            <p className="text-slate-500 text-sm mb-2">Grammar Pattern</p>
            <div className="space-y-4">
              <div>
                <p className="text-4xl font-black text-purple-600 font-mono break-words">{grammar.pattern}</p>
              </div>
              <div>
                <p className="text-slate-600 text-sm">Meaning</p>
                <p className="text-xl text-slate-900">{meaning}</p>
              </div>
            </div>
          </div>

          {/* Level */}
          {grammar.level && (
            <div className="bg-purple-50 p-6 rounded-xl hidden">
              <p className="text-slate-600 text-sm font-semibold mb-2">JLPT Level</p>
              <p className="text-2xl text-purple-600 font-bold">Level {grammar.level}</p>
            </div>
          )}

          {/* Explanation - Quick Tip */}
          {grammar.explanation && (
            <div className="bg-yellow-50 p-6 rounded-xl border-2 border-yellow-200">
              <p className="text-slate-600 text-xs font-semibold mb-2 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-yellow-600" />
                Quick Tip
              </p>
              <p className="text-slate-900">{grammar.explanation}</p>
            </div>
          )}

          {/* Example Sentences */}
          {examples.length > 0 && (
            <div className="mt-8 pt-8 border-t border-slate-200">
              <h3 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-slate-600" />
                Example Sentences ({examples.length})
              </h3>
              <div className="space-y-4">
                {examples.map((example, idx) => (
                  <div key={idx} className="bg-slate-50 p-4 rounded-xl border-l-4 border-purple-300">
                    <p className="text-lg text-slate-900 leading-relaxed font-medium mb-2">
                      {example.japanese}
                    </p>
                    {example.vietnamese && (
                      <p className="text-sm text-slate-600 italic">
                        {example.vietnamese}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add to Flashcard Button */}
          <div className="mt-8 pt-8 border-t border-slate-200">
            <button
              onClick={() => {
                onAddFlashcard?.(grammar.id);
                onClose();
              }}
              className="w-full px-6 py-4 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors font-semibold text-lg"
            >
              + Add to Flashcard
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
