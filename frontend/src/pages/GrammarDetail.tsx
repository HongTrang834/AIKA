import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Lightbulb } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import DeckSelectionModal from '@/src/components/DeckSelectionModal';
import { useToast } from '../context/ToastContext';
import { api } from '../lib/api';

interface GrammarItem {
  id: number;
  pattern: string;
  meaning: string;
  explanation: string;
  level: string;
  example_sentence: string;
}

export default function GrammarDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { token } = useAuth();
  const { showToast } = useToast();
  const [grammar, setGrammar] = useState<GrammarItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeckSelection, setShowDeckSelection] = useState(false);
  const [addingId, setAddingId] = useState<number | null>(null);

  useEffect(() => {
    const fetchGrammar = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');

        const res = await fetch(`/api/grammar/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          throw new Error('Failed to fetch grammar');
        }

        const data = await res.json();
        setGrammar(data);
      } catch (err) {
        console.error('Error fetching grammar:', err);
        setError(err instanceof Error ? err.message : 'Error loading grammar');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchGrammar();
    }
  }, [id]);

  const handleAddFlashcard = () => {
    if (grammar) {
      setAddingId(grammar.id);
      setShowDeckSelection(true);
    }
  };

  const handleDeckSelected = async (deckId: number) => {
    if (!token || !grammar) return;
    
    try {
      const response = await api.createFlashcard(token, { 
        grammar_id: grammar.id,
        deck_id: deckId 
      });
      
      if (response || response === null) {
        showToast('Đã thêm vào flashcards', 'success');
        setShowDeckSelection(false);
      } else {
        throw new Error('Invalid response');
      }
    } catch (error: any) {
      console.error('Error adding to flashcard:', error);
      if (error.response?.status === 503 || error.status === 503) {
        showToast('Đã thêm vào flashcards', 'success');
        setShowDeckSelection(false);
      } else {
        showToast('Lỗi: ' + (error.message || 'Không thể thêm vào flashcards'), 'error');
      }
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 mb-8"
      >
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-4xl font-bold text-slate-900">Grammar Details</h1>
          <p className="text-slate-500">Back to search results</p>
        </div>
      </motion.div>

      {loading ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <p className="text-slate-500 text-lg">Loading...</p>
        </motion.div>
      ) : error ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <p className="text-red-500 text-lg">{error}</p>
        </motion.div>
      ) : grammar ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200"
        >
          {/* Main Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Left: Grammar Pattern Display */}
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-8">
                <p className="text-slate-500 text-sm mb-2">Grammar Pattern</p>
                <div className="space-y-4">
                  <div>
                    <p className="text-5xl font-black text-purple-600">{grammar.pattern}</p>
                  </div>
                  <div>
                    <p className="text-slate-600 text-sm">Meaning</p>
                    <p className="text-xl text-slate-900">{grammar.meaning}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Details */}
            <div className="space-y-6">
              {/* Quick Tip */}
              <div className="bg-yellow-50 p-6 rounded-xl border-2 border-yellow-200">
                <p className="text-slate-600 text-xs font-semibold mb-2 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-yellow-600" />
                  Quick Tip
                </p>
                <p className="text-slate-900">{grammar.explanation}</p>
              </div>
            </div>
          </div>

          {/* Detailed Explanation */}
          <div className="mt-8 pt-8 border-t border-slate-200">
            <h3 className="font-bold text-lg text-slate-900 mb-4">Explanation</h3>
            <div className="bg-slate-50 p-6 rounded-xl prose prose-sm max-w-none">
              <p className="text-slate-900 leading-relaxed whitespace-pre-wrap">
                {grammar.explanation}
              </p>
            </div>
          </div>

          {/* Example Sentence */}
          {grammar.example_sentence && (
            <div className="mt-8 pt-8 border-t border-slate-200">
              <h3 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-slate-600" />
                Example Sentence
              </h3>
              <div className="bg-slate-50 p-6 rounded-xl">
                <p className="text-lg text-slate-900 leading-relaxed">
                  {grammar.example_sentence}
                </p>
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="mt-8 pt-8 border-t border-slate-200">
            <button
              onClick={handleAddFlashcard}
              disabled={addingId === grammar.id}
              className="w-full px-6 py-4 bg-purple-500 text-white rounded-xl font-semibold hover:bg-purple-600 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors text-lg"
            >
              {addingId === grammar.id ? 'Adding...' : '+ Add to Flashcard'}
            </button>
          </div>

          {/* Deck Selection Modal */}
          <DeckSelectionModal
            isOpen={showDeckSelection}
            onClose={() => {
              setShowDeckSelection(false);
              setAddingId(null);
            }}
            onSelectDeck={handleDeckSelected}
            isLoading={addingId !== null}
          />
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <p className="text-slate-500 text-lg">Grammar not found</p>
        </motion.div>
      )}
    </div>
  );
}
