import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Check, Plus, X, Loader } from 'lucide-react';
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
  const [showConfetti, setShowConfetti] = useState(false);

  // Existing logic state
  const [showDeckSelection, setShowDeckSelection] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    const fetchVocabulary = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await api.getVocabularyById(Number(id));
        setVocabulary(data);
      } catch (err) {
        console.error('Error fetching vocabulary:', err);
        setError(err instanceof Error ? err.message : 'Error loading vocabulary');
      } finally {
        setLoading(false);
      }
    };
    fetchVocabulary();
  }, [id]);

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
      // Bỏ Toast hiện tại
      // showToast('Đã thêm vào flashcards', 'success');
      setSaved(true); // Sync with the new save button
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 1200);
      setShowDeckSelection(false);
    } catch (error: any) {
      showToast('Error: ' + (error.message || 'Unable to add to flashcards'), 'error');
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
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="w-14 h-14 animate-spin text-sky-blue" />
      </div>
    );
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
          Back
        </button>

        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl border-2 border-sky-200 bg-gradient-to-br from-sky-50 via-blue-50 to-sky-100 p-8 md:p-10 mb-5">
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-sky-blue/10" />

          <div className="flex flex-wrap gap-2 mb-5">
            <Badge className="bg-sky-blue text-white">⚡ Vocabulary</Badge>
            <Badge className="bg-white text-sky-blue border border-sky-200">{level}</Badge>
            <Badge className="bg-blue-100 text-blue-800">{category}</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div>
              <h1 className="font-display text-8xl font-extrabold text-almost-black leading-none mb-4" style={{ textShadow: "0 4px 24px rgba(28,176,246,0.2)" }}>
                {word}
              </h1>
              <button
                onClick={() => setRevealed(!revealed)}
                className={cn(
                  "inline-flex items-center justify-center gap-2 rounded-xl px-5 h-[56px] min-w-[200px] font-semibold transition-all duration-200",
                  revealed
                    ? "bg-sky-blue text-white shadow-lg shadow-sky-200"
                    : "bg-white/80 text-sky-blue border-2 border-sky-200"
                )}
              >
                <span className="font-jp text-lg flex items-center justify-center gap-2">
                  {revealed ? (
                    <>
                      {/* <span className="text-xl">👁</span> */}
                      {reading}
                    </>
                  ) : (
                    <>
                      {/* @ts-ignore */}
                      <dotlottie-wc src="https://lottie.host/9d650f31-f397-4975-a573-607bf6075bd9/IOVwsC4yPc.lottie" style={{ width: '32px', height: '32px' }} autoplay loop></dotlottie-wc>
                      Reveal reading
                    </>
                  )}
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
              <p className="font-bold text-slate-800">Example sentence</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4 mb-3">
              <p className="font-jp text-base leading-relaxed text-slate-800">{example_sentence}</p>
            </div>
            <p className="text-sm italic text-slate-500">🇻🇳 {example_translation}</p>
          </div>

          {/* Mini Quiz */}
          <div className={cn(
            "rounded-2xl border-2 p-7 shadow-sm transition-colors duration-300 h-[280px] flex flex-col",
            quizResult === 'correct' ? 'bg-blue-50 border-blue-200' :
              quizResult === 'wrong' ? 'bg-red-50 border-red-200' :
                'bg-white border-slate-200'
          )}>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-100 text-lg">🎯</div>
              <p className="font-bold text-slate-800">Mini Quiz</p>
            </div>

            <div className="flex-1 flex flex-col">
              {!quizMode ? (
                // <>
                //   <div className="flex-1 flex flex-col justify-center">
                //     <p className="text-sm text-slate-580 mb-2 leading-relaxed text-center ">
                //       Thử đọc từ này:
                //     </p>
                //     <strong className="font-jp text-lg text-sky-blue text-center">{word}</strong>
                //   </div>
                //   <button
                //     onClick={() => setQuizMode(true)}
                //     className="w-full rounded-xl border-none bg-gradient-to-br from-amber-400 to-orange-500 px-4 py-3 font-bold text-white shadow-lg shadow-amber-200 mt-auto"
                //   >
                //     ⚡ Bắt đầu Quiz!
                //   </button>
                // </>
                <>
                  <div className="flex-1 flex flex-col justify-center items-center py-4">

                    {/* Subtitle */}
                    <p className="text-sm text-slate-500 mb-2 tracking-wide">
                      Try reading this word
                    </p>

                    {/* Japanese Word */}
                    <strong className="font-jp text-4xl text-sky-500 text-center drop-shadow-sm mb-4">
                      {word}
                    </strong>
                  </div>

                  {/* Button */}
                  <button
                    onClick={() => setQuizMode(true)}
                    className="
      w-full rounded-2xl
      bg-gradient-to-r from-amber-400 to-orange-500
      px-4 py-3
      font-bold text-white text-lg
      shadow-lg shadow-orange-200
      transition-all duration-200
      hover:-translate-y-1 hover:shadow-xl
      active:scale-[0.98]
    "
                  >
                    ⚡ Start Quiz!
                  </button>
                </>
              ) : quizResult ? (
                <>
                  <div className="flex-1 flex flex-col justify-center items-center text-center">
                    <div className="flex justify-center items-center mb-2 h-[70px]">
                      {quizResult === 'correct' ? (
                        /* @ts-ignore */
                        <dotlottie-wc
                          src="https://lottie.host/c23b1e00-1e16-4ce9-8965-c92f7888bef6/PMcTTBWHcw.lottie"
                          style={{ width: '80px', height: '80px' }}
                          autoplay
                          loop
                        ></dotlottie-wc>
                      ) : (
                        /* @ts-ignore */
                        <dotlottie-wc
                          src="https://lottie.host/f8bc7aee-d395-444f-a60b-39f3b92ad084/pgwiMTI43a.lottie"
                          style={{ width: '50px', height: '50px' }}
                          autoplay
                          loop
                        ></dotlottie-wc>
                      )}
                    </div>
                    <p className={cn(
                      "text-lg font-bold mb-1",
                      quizResult === 'correct' ? 'text-blue-600' : 'text-red-600'
                    )}>
                      {quizResult === 'correct' ? 'Correct!' : 'Incorrect!'}
                    </p>
                    {/* <p className="text-sm text-slate-500 mb-0">
                      Đáp án: <strong className="font-jp text-sky-blue">{reading}</strong>
                    </p> */}
                  </div>
                  <button
                    onClick={resetQuiz}
                    className="rounded-lg border-none bg-sky-blue px-5 py-2 text-sm font-semibold text-white mx-auto mt-auto"
                  >
                    Try again
                  </button>
                </>
              ) : (
                <>
                  <div className="flex-1 flex flex-col justify-center">
                    <p className="text-sm text-slate-600 mb-2">Type the reading (hiragana):</p>
                    <input
                      value={quizAnswer}
                      onChange={e => setQuizAnswer(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && checkQuiz()}
                      placeholder="ひらがな..."
                      className="w-full rounded-xl border-2 border-slate-300 p-3 font-jp text-lg text-slate-800 outline-none focus:border-sky-blue"
                    />
                  </div>
                  <button
                    onClick={checkQuiz}
                    className="w-full rounded-xl border-none bg-sky-blue py-3 font-bold text-white mt-auto"
                  >
                    Check →
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleAddFlashcard}
          disabled={isAdding || saved}
          className={cn(
            "flex w-full items-center justify-center gap-3 rounded-2xl p-5 text-base font-bold text-white transition-all duration-300 disabled:opacity-70",
            saved
              ? "bg-sky-blue shadow-lg shadow-sky-200"
              : "bg-sky-blue shadow-lg shadow-sky-200 hover:shadow-xl hover:-translate-y-1"
          )}
        >
          {saved ? (
            <> <Check size={20} /> Saved to Deck! </>
          ) : isAdding ? (
            'Saving...'
          ) : (
            <> <Plus size={20} /> Add to Flashcard Deck </>
          )}
        </button>
      </div>

      {showConfetti && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {/* @ts-ignore */}
            <dotlottie-wc
              src="https://lottie.host/49ff8b22-0628-47de-8ede-7e81dff533ce/brgUWISvFk.lottie"
              style={{ width: '100%', height: '100%' }}
              autoplay
            ></dotlottie-wc>
          </div>
          <div className="flex flex-col items-center justify-center animate-in zoom-in-75 duration-200 gap-6">
            <Check size={100} strokeWidth={4} className="text-emerald-400 drop-shadow-2xl" />
            <p className="font-extrabold text-3xl text-white drop-shadow-lg tracking-wide">Successfully Saved!</p>
          </div>
        </div>
      )}

      <DeckSelectionModal
        isOpen={showDeckSelection}
        onClose={() => setShowDeckSelection(false)}
        onSelectDeck={handleDeckSelected}
        isLoading={isAdding}
      />
    </div>
  );
}
