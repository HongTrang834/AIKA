import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Check, Plus, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import DeckSelectionModal from '@/src/components/DeckSelectionModal';
import { useToast } from '../context/ToastContext';
import { api } from '../lib/api';
import { cn } from '../lib/utils';

interface VocabularyItem {
  id: number;
  word: string;
  reading: string;
  meaning: string;
  category: string;
  level: string;
  example_sentence: string;
  example_translation: string;
}

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-xs font-bold", className)}>
      {children}
    </span>
  );
}

export default function VocabularyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { showToast } = useToast();
  
  const [vocabulary, setVocabulary] = useState<VocabularyItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New UI states
  const [revealed, setRevealed] = useState(false);
  const [saved, setSaved] = useState(false);
  const [quizMode, setQuizMode] = useState(false);
  const [quizAnswer, setQuizAnswer] = useState("");
  const [quizResult, setQuizResult] = useState<'correct' | 'wrong' | null>(null);

  // Existing logic state
  const [showDeckSelection, setShowDeckSelection] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    const fetchVocabulary = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await api.getVocabularyById(id, token);
        setVocabulary(data);
      } catch (err) {
        console.error('Error fetching vocabulary:', err);
        setError(err instanceof Error ? err.message : 'Error loading vocabulary');
      } finally {
        setLoading(false);
      }
    };
    fetchVocabulary();
  }, [id, token]);

  const handleAddFlashcard = () => {
    if (vocabulary) {
      setShowDeckSelection(true);
    }
  };

  const handleDeckSelected = async (deckId: number) => {
    if (!token || !vocabulary) return;
    setIsAdding(true);
    try {
      await api.createFlashcard(token, {
        vocab_id: vocabulary.id,
        deck_id: deckId
      });
      showToast('Đã thêm vào flashcards', 'success');
      setSaved(true); // Sync with the new save button
      setShowDeckSelection(false);
    } catch (error: any) {
      showToast('Lỗi: ' + (error.message || 'Không thể thêm vào flashcards'), 'error');
    } finally {
      setIsAdding(false);
    }
  };

  const checkQuiz = () => {
    if (!vocabulary) return;
    setQuizResult(quizAnswer.trim() === vocabulary.reading ? "correct" : "wrong");
  };

  const resetQuiz = () => {
    setQuizMode(false);
    setQuizResult(null);
    setQuizAnswer("");
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (error) {
    return <div className="flex items-center justify-center h-screen text-red-500">{error}</div>;
  }

  if (!vocabulary) {
    return <div className="flex items-center justify-center h-screen">Vocabulary not found.</div>;
  }

  const { word, reading, meaning, category, level, example_sentence, example_translation } = vocabulary;

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-200 px-4 py-2 font-semibold text-slate-600 transition hover:bg-slate-300 mb-7"
        >
          <ArrowLeft size={16} />
          Quay lại
        </button>

        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 via-blue-50 to-indigo-100 p-8 md:p-10 mb-5">
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-indigo-500/5" />

          <div className="flex flex-wrap gap-2 mb-5">
            <Badge className="bg-indigo-600 text-white">⚡ Từ Vựng</Badge>
            <Badge className="bg-white text-indigo-600 border border-indigo-200">{level}</Badge>
            <Badge className="bg-green-100 text-green-800">{category}</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div>
              <h1 className="font-display text-8xl font-extrabold text-indigo-900/90 leading-none mb-4" style={{ textShadow: "0 4px 24px rgba(99,102,241,0.2)" }}>
                {word}
              </h1>
              <button
                onClick={() => setRevealed(!revealed)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl px-5 py-2.5 font-semibold transition-all duration-200",
                  revealed
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                    : "bg-white/80 text-indigo-600 border-2 border-indigo-200"
                )}
              >
                <span className="font-jp text-lg">
                  {revealed ? `👁 ${reading}` : "👆 Xem cách đọc"}
                </span>
              </button>
            </div>

            <div className="min-w-[180px] rounded-2xl border-2 border-white/90 bg-white/70 p-6 backdrop-blur-sm">
              <p className="text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-2">Nghĩa</p>
              <p className="text-xl font-bold text-slate-800">{meaning}</p>
            </div>
          </div>
        </div>

        {/* 2 col layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Example */}
          <div className="rounded-2xl border-2 border-slate-200 bg-white p-7 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-lg">📝</div>
              <p className="font-bold text-slate-800">Câu ví dụ</p>
            </div>
            <div className="rounded-xl border-l-4 border-indigo-500 bg-slate-50 p-4 mb-3">
              <p className="font-jp text-base leading-relaxed text-slate-800">{example_sentence}</p>
            </div>
            <p className="text-sm italic text-slate-500">🇻🇳 {example_translation}</p>
          </div>

          {/* Mini Quiz */}
          <div className={cn(
            "rounded-2xl border-2 p-7 shadow-sm transition-colors duration-300",
            quizResult === 'correct' ? 'bg-green-50 border-green-200' :
            quizResult === 'wrong' ? 'bg-red-50 border-red-200' :
            'bg-white border-slate-200'
          )}>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-100 text-lg">🎯</div>
              <p className="font-bold text-slate-800">Mini Quiz</p>
            </div>

            {!quizMode ? (
              <>
                <p className="text-sm text-slate-500 mb-4 leading-relaxed">
                  Thử gõ cách đọc của <strong className="font-jp text-lg text-indigo-600">{word}</strong>
                </p>
                <button
                  onClick={() => setQuizMode(true)}
                  className="w-full rounded-xl border-none bg-gradient-to-br from-amber-400 to-orange-500 px-4 py-3 font-bold text-white shadow-lg shadow-amber-200"
                >
                  ⚡ Bắt đầu Quiz!
                </button>
              </>
            ) : quizResult ? (
              <div className="text-center">
                <p className="text-5xl mb-2">{quizResult === 'correct' ? '🎉' : '😅'}</p>
                <p className={cn(
                  "text-lg font-bold mb-1",
                  quizResult === 'correct' ? 'text-green-600' : 'text-red-600'
                )}>
                  {quizResult === 'correct' ? 'Chính xác!' : 'Chưa đúng!'}
                </p>
                <p className="text-sm text-slate-500 mb-4">
                  Đáp án: <strong className="font-jp text-indigo-600">{reading}</strong>
                </p>
                <button
                  onClick={resetQuiz}
                  className="rounded-lg border-none bg-indigo-600 px-5 py-2 text-sm font-semibold text-white"
                >
                  Thử lại
                </button>
              </div>
            ) : (
              <>
                <p className="text-sm text-slate-600 mb-2">Gõ cách đọc (hiragana):</p>
                <input
                  value={quizAnswer}
                  onChange={e => setQuizAnswer(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && checkQuiz()}
                  placeholder="ひらがな..."
                  className="w-full rounded-xl border-2 border-slate-300 p-3 mb-2 font-jp text-lg text-slate-800 outline-none focus:border-indigo-500"
                />
                <button
                  onClick={checkQuiz}
                  className="w-full rounded-xl border-none bg-indigo-600 py-3 font-bold text-white"
                >
                  Kiểm tra →
                </button>
              </>
            )}
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleAddFlashcard}
          disabled={isAdding || saved}
          className={cn(
            "flex w-full items-center justify-center gap-3 rounded-2xl p-5 text-base font-bold text-white transition-all duration-300 disabled:opacity-70",
            saved
              ? "bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-200"
              : "bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300"
          )}
        >
          {saved ? (
            <> <Check size={20} /> Đã lưu vào Deck! </>
          ) : isAdding ? (
            'Đang lưu...'
          ) : (
            <> <Plus size={20} /> Lưu vào Flashcard Deck </>
          )}
        </button>
      </div>

      <DeckSelectionModal
        isOpen={showDeckSelection}
        onClose={() => setShowDeckSelection(false)}
        onSelectDeck={handleDeckSelected}
        isLoading={isAdding}
      />
    </div>
  );
}
