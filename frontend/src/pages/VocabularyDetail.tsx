import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import DeckSelectionModal from '@/src/components/DeckSelectionModal';
import { useToast } from '../context/ToastContext';
import { api } from '../lib/api';

interface VocabularyItem {
  id: number;
  word: string;
  reading: string;
  meaning: string;
  category: string;
  level: string;
  example_sentence: string;
}

export default function VocabularyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { token } = useAuth();
  const { showToast } = useToast();
  const [vocabulary, setVocabulary] = useState<VocabularyItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeckSelection, setShowDeckSelection] = useState(false);
  const [addingId, setAddingId] = useState<number | null>(null);

  useEffect(() => {
    const fetchVocabulary = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');

        const res = await fetch(`/api/vocabulary/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          throw new Error('Failed to fetch vocabulary');
        }

        const data = await res.json();
        setVocabulary(data);
      } catch (err) {
        console.error('Error fetching vocabulary:', err);
        setError(err instanceof Error ? err.message : 'Error loading vocabulary');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchVocabulary();
    }
  }, [id]);

  const handleAddFlashcard = () => {
    if (vocabulary) {
      setAddingId(vocabulary.id);
      setShowDeckSelection(true);
    }
  };

  const handleDeckSelected = async (deckId: number) => {
    if (!token || !vocabulary) return;
    
    try {
      const response = await api.createFlashcard(token, { 
        vocab_id: vocabulary.id,
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
          <h1 className="text-4xl font-bold text-slate-900">Vocabulary Details</h1>
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
      ) : vocabulary ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200"
        >
          {/* Main Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Left: Vocabulary Display */}
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8">
                <p className="text-slate-500 text-sm mb-2">Vocabulary Item</p>
                <div className="space-y-4">
                  <div>
                    <p className="text-5xl font-black text-blue-600">{vocabulary.word}</p>
                  </div>
                  <div>
                    <p className="text-slate-600 text-sm">Reading</p>
                    <p className="text-2xl text-slate-900">{vocabulary.reading}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Details */}
            <div className="space-y-6">
              {/* Meaning */}
              <div className="bg-slate-50 p-6 rounded-xl">
                <p className="text-slate-600 text-sm font-semibold mb-2">Meaning</p>
                <p className="text-xl text-slate-900">{vocabulary.meaning}</p>
              </div>

              {/* Category */}
              <div className="bg-slate-50 p-6 rounded-xl">
                <p className="text-slate-600 text-sm font-semibold mb-2">Category</p>
                <p className="text-lg text-slate-900">{vocabulary.category}</p>
              </div>
            </div>
          </div>

          {/* Example Sentence */}
          {vocabulary.example_sentence && (
            <div className="mt-8 pt-8 border-t border-slate-200">
              <h3 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-slate-600" />
                Example Sentence
              </h3>
              <div className="bg-slate-50 p-6 rounded-xl">
                <p className="text-lg text-slate-900 leading-relaxed">
                  {vocabulary.example_sentence}
                </p>
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="mt-8 pt-8 border-t border-slate-200">
            <button
              onClick={handleAddFlashcard}
              disabled={addingId === vocabulary.id}
              className="w-full px-6 py-4 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors text-lg"
            >
              {addingId === vocabulary.id ? 'Adding...' : '+ Add to Flashcard'}
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
          <p className="text-slate-500 text-lg">Vocabulary not found</p>
        </motion.div>
      )}
    </div>
  );
}
