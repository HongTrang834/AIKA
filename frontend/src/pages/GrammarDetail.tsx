import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Plus, Brain, BookCopy, Lightbulb, ChevronLeft, ChevronRight, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import DeckSelectionModal from '@/src/components/DeckSelectionModal';
import { useToast } from '../context/ToastContext';
import { api } from '../lib/api';
import { cn } from '../lib/utils';

interface GrammarItem {
  id: number;
  title: string;
  pattern: string;
  meaning: string;
  explanation: string;
  level: string;
  category: string;
  quick_tip: string;
  examples: { jp: string; vn: string }[];
  compare: { pattern: string; meaning: string; color: string }[];
}

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-xs font-bold", className)}>
      {children}
    </span>
  );
}

export default function GrammarDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { showToast } = useToast();

  const [grammar, setGrammar] = useState<GrammarItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI states from redesign
  const [activeEx, setActiveEx] = useState(0);
  const [saved, setSaved] = useState(false);
  const [showTip, setShowTip] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Existing logic state
  const [showDeckSelection, setShowDeckSelection] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    const fetchGrammar = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await api.getGrammarById(Number(id));
        // Mock missing data for now
        setGrammar({
          ...data,
          title: data.title || "Expressing purpose",
          category: data.category || "Purpose",
          quick_tip: data.quick_tip || "Used with dictionary form verbs. Do not use with adjectives or temporary states.",
          examples: data.examples && data.examples.length > 0 ? data.examples : [{ jp: data.example_sentence, vn: data.example_translation || "Translation is being updated." }],
          compare: data.compare || [
            { pattern: "〜のに", meaning: "Although... but... (contrast)", color: "#f59e0b" },
            { pattern: "〜から", meaning: "Because... so... (subjective reason)", color: "#ef4444" },
          ],
        });
      } catch (err) {
        console.error('Error fetching grammar:', err);
        setError(err instanceof Error ? err.message : 'Error loading grammar');
      } finally {
        setLoading(false);
      }
    };
    fetchGrammar();
  }, [id]);

  const handleAddFlashcard = () => {
    if (grammar) {
      setShowDeckSelection(true);
    }
  };

  const handleDeckSelected = async (deckId: number) => {
    if (!token || !grammar) return;
    setIsAdding(true);
    try {
      await api.createFlashcard(token, {
        grammar_id: grammar.id,
        deck_id: deckId
      });
      // Bỏ Toast hiện tại
      // showToast('Đã thêm vào flashcards', 'success');
      setSaved(true);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 1200);
      setShowDeckSelection(false);
    } catch (error: any) {
      showToast('Error: ' + (error.message || 'Unable to add to flashcards'), 'error');
    } finally {
      setIsAdding(false);
    }
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

  if (!grammar) {
    return <div className="flex items-center justify-center h-screen">Grammar not found.</div>;
  }
  
  const { pattern, title, meaning, level, category, explanation, quick_tip, examples, compare } = grammar;

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
          <div className="absolute -right-12 -top-12 h-52 w-52 rounded-full bg-sky-blue/10" />

          <div className="flex flex-wrap gap-2 mb-5">
            <Badge className="bg-sky-blue text-white">📖 Grammar</Badge>
            <Badge className="bg-white text-sky-blue border border-sky-200">{level}</Badge>
            <Badge className="bg-sky-blue/20 text-sky-blue">{category}</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 items-start">
            <div>
              <h1 className="font-display text-6xl md:text-7xl font-extrabold text-almost-black leading-tight mb-2" style={{ textShadow: "0 4px 24px rgba(28,176,246, 0.15)" }}>
                {pattern}
              </h1>
              <p className="text-xl font-bold text-slate-800 mb-1">{title}</p>
              <p className="text-base text-slate-600">{meaning}</p>
            </div>
            <button
              onClick={() => setShowTip(!showTip)}
              className={cn(
                "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-none text-3xl transition-all duration-200",
                showTip ? "bg-amber-400 shadow-lg shadow-amber-200" : "bg-amber-100"
              )}
            >
              💡
            </button>
          </div>

          {showTip && quick_tip && (
            <div className="mt-5 rounded-2xl border-2 border-amber-200 bg-white/70 p-5 backdrop-blur-sm">
              <p className="mb-1.5 text-xs font-extrabold uppercase tracking-widest text-amber-600">💡 Quick Tip</p>
              <p className="text-sm text-slate-700 leading-relaxed">{quick_tip}</p>
            </div>
          )}
        </div>

        {/* Explanation */}
        <div className="rounded-2xl border-2 border-slate-200 bg-white p-7 shadow-sm mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-100 text-lg">🧠</div>
            <p className="font-bold text-slate-800">Explanation</p>
          </div>
          <p className="text-sm text-slate-600 leading-loose">{explanation}</p>
        </div>

        {/* Examples */}
        <div className="rounded-2xl border-2 border-slate-200 bg-white p-7 shadow-sm mb-4">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-lg">📝</div>
              <p className="font-bold text-slate-800">Example sentence ({activeEx + 1}/{examples.length})</p>
            </div>
            <div className="flex gap-1.5">
              {examples.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveEx(i)}
                  className={cn(
                    "h-2.5 rounded-full border-none transition-all duration-300",
                    i === activeEx ? "w-7 bg-sky-blue" : "w-2.5 bg-slate-300"
                  )}
                />
              ))}
            </div>
          </div>

          <div className="min-h-[120px] rounded-2xl bg-gradient-to-br from-sky-50 to-blue-50 p-6">
            <p className="font-jp text-lg font-medium text-slate-800 mb-3 leading-relaxed">{examples[activeEx].jp}</p>
            <p className="text-sm italic text-sky-blue">🇻🇳 {examples[activeEx].vn}</p>
          </div>

          {examples.length > 1 && (
            <div className="grid grid-cols-2 gap-3 mt-4">
              <button
                onClick={() => setActiveEx(i => Math.max(0, i - 1))}
                disabled={activeEx === 0}
                className="flex items-center justify-center gap-2 rounded-xl border-2 border-slate-200 bg-white p-2.5 font-semibold text-slate-600 disabled:opacity-40"
              >
                <ChevronLeft size={16} /> Prev
              </button>
              <button
                onClick={() => setActiveEx(i => Math.min(examples.length - 1, i + 1))}
                disabled={activeEx === examples.length - 1}
                className="flex items-center justify-center gap-2 rounded-xl border-2 border-slate-200 bg-white p-2.5 font-semibold text-slate-600 disabled:opacity-40"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
        
        {/* Compare */}
        {compare && compare.length > 0 && (
          <div className="rounded-2xl border-2 border-slate-200 bg-white p-7 shadow-sm mb-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-100 text-lg">⚖️</div>
              <p className="font-bold text-slate-800">Compare similar patterns</p>
            </div>
            <div className="flex flex-col gap-2.5">
              {compare.map((c, i) => (
                <div key={i} className="flex items-center gap-4 rounded-xl bg-slate-50 p-4">
                  <span className="font-jp text-base font-bold min-w-[80px]" style={{ color: c.color }}>{c.pattern}</span>
                  <span className="text-sm text-slate-600">{c.meaning}</span>
                </div>
              ))}
            </div>
          </div>
        )}

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
