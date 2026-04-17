import React from 'react';
import { X, BookOpen } from 'lucide-react';
import { motion } from 'motion/react';

interface WordDetailModalProps {
  vocab: {
    id: number;
    word: string;
    reading: string;
    meaning?: string;
    vietnamese_meaning?: string;
    example_sentence?: string;
    examples?: string; // JSON string array
    category?: string;
    level?: number;
  };
  onClose: () => void;
  onAddFlashcard?: (vocabId: number) => void;
}

export function WordDetailModal({ vocab, onClose, onAddFlashcard }: WordDetailModalProps) {
  const meaning = vocab.meaning || vocab.vietnamese_meaning || 'N/A';
  
  // Parse examples from JSON string or fallback to example_sentence
  let examples: Array<{ japanese: string; vietnamese: string }> = [];
  if (vocab.examples) {
    try {
      const parsed = JSON.parse(vocab.examples);
      // Handle both old format (array of strings) and new format (array of objects)
      if (Array.isArray(parsed)) {
        examples = parsed.map(ex => 
          typeof ex === 'string' 
            ? { japanese: ex, vietnamese: '' }
            : { japanese: ex.japanese || '', vietnamese: ex.vietnamese || '' }
        );
      }
    } catch (e) {
      // If parsing fails, use example_sentence as fallback
      examples = vocab.example_sentence ? [{ japanese: vocab.example_sentence, vietnamese: '' }] : [];
    }
  } else if (vocab.example_sentence) {
    examples = [{ japanese: vocab.example_sentence, vietnamese: '' }];
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
          <h2 className="text-2xl font-bold text-slate-900">Vocabulary Details</h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          {/* Main Display - Word & Reading */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8">
            <p className="text-slate-500 text-sm mb-2">Vocabulary Item</p>
            <div className="space-y-4">
              <div>
                <p className="text-5xl font-black text-blue-600">{vocab.word}</p>
              </div>
              <div>
                <p className="text-slate-600 text-sm">Reading</p>
                <p className="text-2xl text-slate-900">{vocab.reading}</p>
              </div>
            </div>
          </div>

          {/* Meaning */}
          <div className="bg-slate-50 p-6 rounded-xl">
            <p className="text-slate-600 text-sm font-semibold mb-2">Meaning</p>
            <p className="text-xl text-slate-900">{meaning}</p>
          </div>

          {/* Category */}
          {vocab.category && (
            <div className="bg-slate-50 p-6 rounded-xl">
              <p className="text-slate-600 text-sm font-semibold mb-2">Category</p>
              <p className="text-lg text-slate-900">{vocab.category}</p>
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
                  <div key={idx} className="bg-slate-50 p-4 rounded-xl border-l-4 border-blue-300">
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
                onAddFlashcard?.(vocab.id);
                onClose();
              }}
              className="w-full px-6 py-4 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-semibold text-lg"
            >
              + Add to Flashcard
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
