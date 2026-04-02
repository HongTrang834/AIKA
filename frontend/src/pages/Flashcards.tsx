import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Flame, Bell, Lightbulb, History, RotateCcw, Frown, Smile, Rocket, Loader, Plus } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function Flashcards() {
  const { token } = useAuth();
  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showNewFlashcardForm, setShowNewFlashcardForm] = useState(false);
  const [vocabId, setVocabId] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchFlashcards();
  }, [token]);

  const fetchFlashcards = async () => {
    try {
      if (!token) return;
      const data = await api.getFlashcards(token);
      setFlashcards(data.rows || []);
      setCurrentIndex(0);
      setIsFlipped(false);
    } catch (err) {
      console.error('Error fetching flashcards:', err);
      setError('Failed to load flashcards');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFlashcard = async () => {
    if (!vocabId || !token) return;
    setSubmitLoading(true);
    setError('');
    try {
      await api.createFlashcard(token, { vocab_id: parseInt(vocabId) });
      setVocabId('');
      setShowNewFlashcardForm(false);
      await fetchFlashcards();
    } catch (err: any) {
      setError(err.message || 'Failed to create flashcard');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleUpdateFlashcard = async (quality: number) => {
    if (!token || !flashcards[currentIndex]) return;
    try {
      await api.updateFlashcard(token, flashcards[currentIndex].id, quality);
      const newIndex = currentIndex + 1;
      if (newIndex < flashcards.length) {
        setCurrentIndex(newIndex);
        setIsFlipped(false);
      } else {
        alert('Session completed!');
        await fetchFlashcards();
      }
    } catch (err) {
      console.error('Error updating flashcard:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (flashcards.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <Lightbulb className="w-16 h-16 text-slate-300 mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">No Flashcards Yet</h2>
        <p className="text-slate-500 mb-6">Create your first flashcard to start learning!</p>
        <button
          onClick={() => setShowNewFlashcardForm(true)}
          className="bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Create Flashcard
        </button>

        {showNewFlashcardForm && (
          <div className="mt-8 bg-white p-6 rounded-xl border border-slate-200 w-full max-w-md">
            <h3 className="font-bold text-lg mb-4">Add Flashcard from Vocabulary</h3>
            {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}
            <div className="flex gap-2">
              <input
                type="number"
                value={vocabId}
                onChange={(e) => setVocabId(e.target.value)}
                placeholder="Enter vocabulary ID"
                className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                onClick={handleCreateFlashcard}
                disabled={submitLoading}
                className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50"
              >
                {submitLoading ? 'Adding...' : 'Add'}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  const current = flashcards[currentIndex];
  const progress = ((currentIndex + 1) / flashcards.length) * 100;

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 max-w-5xl mx-auto w-full min-h-[calc(100vh-80px)]">
      {/* Progress Header */}
      <div className="w-full max-w-2xl mb-12">
        <div className="flex justify-between items-end mb-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Spaced Repetition</span>
            <h3 className="text-2xl font-black font-headline text-slate-900">Learning Session</h3>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black font-headline text-primary">{currentIndex + 1}<span className="text-slate-300 text-lg font-medium">/{flashcards.length}</span></span>
          </div>
        </div>
        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-secondary rounded-full"
          />
        </div>
      </div>

      {/* The Flashcard */}
      <div 
        className="w-full max-w-xl aspect-[5/3.5] relative cursor-pointer group"
        onClick={() => setIsFlipped(!isFlipped)}
        style={{ perspective: '2000px' }}
      >
        <motion.div 
          className="w-full h-full relative"
          initial={false}
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 20 }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Front */}
          <div 
            className="absolute inset-0 bg-white rounded-[2.5rem] flex flex-col items-center justify-center p-12 border border-slate-100 shadow-2xl shadow-primary/5"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <div className="absolute top-8 left-8">
              <span className="bg-tertiary/10 text-tertiary text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">Vocabulary</span>
            </div>
            <p className="text-slate-400 text-xs font-bold uppercase mb-4 tracking-widest">Click to reveal meaning</p>
            <div className="text-7xl font-headline font-extrabold text-primary mb-4">{current?.word}</div>
            <div className="text-xl text-slate-500">{current?.reading}</div>
          </div>

          {/* Back */}
          <div 
            className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-[2.5rem] flex flex-col items-center justify-center p-12 border border-slate-100 shadow-2xl shadow-primary/5"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <div className="text-center space-y-6">
              <div className="text-4xl font-bold text-primary">{current?.vietnamese_meaning || current?.meaning}</div>
              {current?.level && (
                <p className="text-slate-500 text-sm">Level: {current.level}</p>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Rating Buttons */}
      <div className="mt-16 w-full max-w-2xl grid grid-cols-4 gap-4">
        {[
          { label: 'Failed', quality: 0, color: 'text-red-500', bg: 'bg-red-50' },
          { label: 'Hard', quality: 2, color: 'text-orange-500', bg: 'bg-orange-50' },
          { label: 'Good', quality: 4, color: 'text-green-500', bg: 'bg-green-50' },
          { label: 'Easy', quality: 5, color: 'text-blue-500', bg: 'bg-blue-50' },
        ].map((btn) => (
          <button 
            key={btn.quality}
            onClick={() => handleUpdateFlashcard(btn.quality)}
            className="group flex flex-col items-center gap-3 scale-95 active:scale-90 transition-transform"
          >
            <div className={`w-full h-16 rounded-2xl flex items-center justify-center transition-colors ${btn.bg} hover:opacity-80`}>
              <span className={`font-bold text-xl ${btn.color}`}>{btn.label}</span>
            </div>
            <span className={`text-[10px] font-black uppercase tracking-tighter ${btn.color}`}>{btn.quality}</span>
          </button>
        ))}
      </div>

      {/* Create New Flashcard Button */}
      <button
        onClick={() => setShowNewFlashcardForm(!showNewFlashcardForm)}
        className="mt-12 bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-3 rounded-xl font-semibold transition-colors flex items-center gap-2"
      >
        <Plus className="w-5 h-5" />
        Add Another Flashcard
      </button>

      {showNewFlashcardForm && (
        <div className="mt-6 bg-white p-6 rounded-xl border border-slate-200 w-full max-w-md">
          <h3 className="font-bold text-lg mb-4">Add Flashcard</h3>
          {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}
          <div className="flex gap-2">
            <input
              type="number"
              value={vocabId}
              onChange={(e) => setVocabId(e.target.value)}
              placeholder="Vocabulary ID"
              className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              onClick={handleCreateFlashcard}
              disabled={submitLoading}
              className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50"
            >
              {submitLoading ? '...' : 'Add'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
