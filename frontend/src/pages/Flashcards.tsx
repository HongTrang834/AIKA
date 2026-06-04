import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { RotateCcw, Frown, Smile, Rocket, Loader, ArrowLeft, Bookmark, Flame, BookOpen, Target, Clock, Trophy, Trash2 } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function Flashcards() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [globalDecks, setGlobalDecks] = useState<any[]>([]);
  const [myDecks, setMyDecks] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [studyMode, setStudyMode] = useState(false);

  useEffect(() => {
    fetchDecks();
  }, [token]);

  const fetchDecks = async () => {
    try {
      if (!token) return;
      setLoading(true);
      setError("");

      const [globalRes, myRes] = await Promise.allSettled([
        api.getDecks(token),
        api.getMyDecks(token),
      ]);

      if (globalRes.status === "fulfilled") {
        setGlobalDecks(globalRes.value.rows || []);
      } else {
        console.error("Error fetching global decks:", globalRes.reason);
        setGlobalDecks([]);
      }

      if (myRes.status === "fulfilled") {
        setMyDecks(myRes.value.rows || []);
      } else {
        console.error("Error fetching my decks:", myRes.reason);
        setMyDecks([]);
      }

      if (globalRes.status === "rejected" && myRes.status === "rejected") {
        setError("Cannot load decks right now. Please check backend server.");
      }
    } finally {
      setLoading(false);
    }
  };

  const startStudy = async (deckId: number) => {
    try {
      if (!token) return;
      setLoading(true);

      const res = await api.getFlashcardsInDeck(token, deckId);
      const cards = res.rows || [];

      if (cards.length === 0) {
        showToast("This deck has no cards to study.", "info");
        setLoading(false);
        return;
      }

      setFlashcards(cards);
      setCurrentIndex(0);
      setIsFlipped(false);
      setStudyMode(true);
    } catch (err) {
      console.error("Error starting study:", err);
      showToast("Failed to load flashcards", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFlashcard = async (quality: number) => {
    if (!token || !flashcards[currentIndex]) return;
    try {
      const currentCard = flashcards[currentIndex];
      await api.updateFlashcard(token, currentCard.id, quality);

      const newIndex = currentIndex + 1;
      if (newIndex < flashcards.length) {
        setCurrentIndex(newIndex);
        setIsFlipped(false);
      } else {
        showToast("Session completed!", "success");
        setStudyMode(false);
        fetchDecks();
      }
    } catch (err) {
      console.error("Error updating flashcard:", err);
    }
  };

  const handleDeleteDeck = async (deckId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this deck? All flashcards in it will be removed. This action cannot be undone.")) return;

    try {
      if (!token) return;
      setLoading(true);
      await api.deleteDeck(token, deckId);
      showToast("Deck deleted successfully", "success");
      fetchDecks();
    } catch (err) {
      console.error("Error deleting deck:", err);
      showToast("Failed to delete deck", "error");
      setLoading(false);
    }
  };

  if (loading && !studyMode) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-slate-50">
        <Loader className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!studyMode) {
    return (
      <div className="flex-1 p-6 md:p-10 bg-slate-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2 tracking-tight">Flashcard Decks</h1>
              <p className="text-slate-500 font-medium">Master your Japanese vocabulary and grammar.</p>
            </div>
          </header>



          {error && (
            <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 font-medium flex items-center gap-3">
              <Frown className="w-5 h-5" />
              {error}
            </div>
          )}

          {/* Official Decks */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
              <Trophy className="w-6 h-6 text-amber-500" />
              Official Decks
            </h2>
            {globalDecks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 bg-white rounded-3xl border border-dashed border-slate-300">
                <Bookmark className="w-12 h-12 text-slate-300 mb-4" />
                <h3 className="text-lg font-bold text-slate-700 mb-1">No official decks yet</h3>
                <p className="text-slate-500 text-sm">Official decks will appear here once created.</p>
              </div>
            ) : (
              <DeckGrid decks={globalDecks} onStartStudy={startStudy} isOfficial={true} />
            )}
          </section>

          {/* Personal Decks */}
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
              <Bookmark className="w-6 h-6 text-indigo-500" />
              My Flashcards
            </h2>
            {myDecks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 bg-white rounded-3xl border border-dashed border-slate-300">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
                  <Bookmark className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-700 mb-2">You don't have any decks</h3>
                <p className="text-slate-500 text-sm max-w-sm text-center">
                  Save vocabulary or grammar points from lessons to create your personal flashcard decks here.
                </p>
              </div>
            ) : (
              <DeckGrid decks={myDecks} onStartStudy={startStudy} isOfficial={false} onDeleteDeck={handleDeleteDeck} />
            )}
          </section>
        </div>
      </div>
    );
  }

  const currentCard = flashcards[currentIndex];
  if (!currentCard) return null;

  return (
    <div className="flex-1 flex flex-col items-center py-12 px-6 bg-slate-50 min-h-screen">
      <div className="w-full max-w-2xl">
        <div className="mb-10 flex items-center gap-6">
          <button
            onClick={() => { setStudyMode(false); fetchDecks(); }}
            className="p-3 hover:bg-white rounded-xl border border-slate-200 shadow-sm transition-all text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-indigo-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${((currentIndex + 1) / flashcards.length) * 100}%` }}
            />
          </div>
          <span className="text-sm font-bold text-slate-500 w-12 text-right">
            {currentIndex + 1} / {flashcards.length}
          </span>
        </div>

        <div className="relative h-[400px] w-full [perspective:1000px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentCard.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full h-full"
            >
              <div
                className={`w-full h-full relative transition-all duration-500 [transform-style:preserve-3d] cursor-pointer ${isFlipped ? "[transform:rotateY(180deg)]" : ""}`}
                onClick={() => setIsFlipped(!isFlipped)}
              >
                {/* Front Side */}
                <div className="absolute inset-0 w-full h-full bg-white rounded-3xl border border-slate-200 shadow-sm p-8 flex flex-col items-center justify-center [backface-visibility:hidden]">
                  <div className="absolute top-8 text-indigo-600 text-[13px] font-bold uppercase tracking-wider bg-indigo-50 px-4 py-1.5 rounded-lg">
                    {currentCard.vocab_id ? "Vocabulary" : "Grammar"}
                  </div>
                  <h2 className="font-jp text-6xl md:text-7xl font-bold text-slate-800 mb-2 drop-shadow-sm">{currentCard.word}</h2>
                  <p className="text-2xl text-slate-500 font-medium">{currentCard.reading}</p>
                  <p className="absolute bottom-8 text-slate-400 font-medium text-sm animate-pulse">Tap to flip</p>
                </div>

                {/* Back Side */}
                <div className="absolute inset-0 w-full h-full bg-white rounded-3xl border border-slate-200 shadow-sm p-8 flex flex-col justify-center [backface-visibility:hidden] [transform:rotateY(180deg)] overflow-y-auto custom-scrollbar">
                  <div className="w-full max-w-full my-auto">
                    <div className="text-sky-500 text-xs font-bold uppercase tracking-wider mb-2">Meaning</div>
                    <h3 className="text-2xl font-bold text-slate-800 mb-6">{currentCard.meaning}</h3>

                    {currentCard.explanation && (
                      <div className="mb-6 p-5 bg-sky-50 rounded-2xl border border-sky-100">
                        <div className="text-xs font-bold text-sky-600 uppercase mb-2">Usage / Conjugation</div>
                        <p className="text-[15px] text-slate-700 font-medium leading-relaxed">{currentCard.explanation}</p>
                      </div>
                    )}

                    {currentCard.example && (
                      <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 mt-4">
                        <div className="text-xs font-bold text-slate-400 uppercase mb-3">Example</div>
                        <p className="text-lg text-slate-800 mb-2 font-bold font-jp">{currentCard.example}</p>
                        <p className="text-sm text-slate-600 mb-3 font-medium">{currentCard.example_reading}</p>
                        <div className="w-full h-px bg-slate-200 mb-3"></div>
                        <p className="text-slate-500 font-medium text-sm italic">{currentCard.example_meaning}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Feedback Buttons */}
        <div className="mt-10 grid grid-cols-4 gap-4">
          {[
            { q: 1, label: "Again", icon: RotateCcw, color: "text-red-500 bg-white hover:bg-red-50 border-slate-200 hover:border-red-200" },
            { q: 3, label: "Hard", icon: Frown, color: "text-amber-500 bg-white hover:bg-amber-50 border-slate-200 hover:border-amber-200" },
            { q: 4, label: "Good", icon: Smile, color: "text-indigo-500 bg-white hover:bg-indigo-50 border-slate-200 hover:border-indigo-200" },
            { q: 5, label: "Easy", icon: Rocket, color: "text-sky-500 bg-white hover:bg-sky-50 border-slate-200 hover:border-sky-200" },
          ].map((btn) => (
            <button
              key={btn.q}
              onClick={() => handleUpdateFlashcard(btn.q)}
              className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-1 ${btn.color}`}
            >
              <btn.icon className="w-6 h-6 mb-1" />
              <span className="font-bold text-sm">{btn.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function DeckGrid({ decks, onStartStudy, isOfficial, onDeleteDeck }: { decks: any[]; onStartStudy: (deckId: number) => void; isOfficial: boolean; onDeleteDeck?: (deckId: number, e: React.MouseEvent) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {decks.map((deck) => (
        <div
          key={deck.id}
          className="group flex flex-col bg-white p-6 rounded-[24px] border border-slate-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 relative overflow-hidden"
        >
          {/* Decorative subtle gradient background */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-sky-50 to-indigo-50 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity"></div>

          {/* Badges */}
          <div className="flex justify-between items-start mb-5 relative z-10">
            <div className="flex flex-wrap gap-2">
              <span className={`px-2.5 py-1 text-[11px] font-bold rounded-lg uppercase tracking-wider ${isOfficial ? 'bg-indigo-50 text-indigo-600' : 'bg-violet-50 text-violet-600'}`}>
                {isOfficial ? 'Official' : 'Personal'}
              </span>
              <span className="px-2.5 py-1 bg-sky-50 text-sky-600 text-[11px] font-bold rounded-lg uppercase tracking-wider">
                N2
              </span>
            </div>
            {!isOfficial && onDeleteDeck && (
              <button
                onClick={(e) => onDeleteDeck(deck.id, e)}
                className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors z-20"
                title="Delete Deck"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Title & Description */}
          <h3 className="text-xl font-bold text-slate-800 mb-2 line-clamp-1 relative z-10">{deck.name}</h3>

          {/* Metadata */}
          <div className="flex items-center gap-4 text-[13px] text-slate-400 font-medium mb-6 relative z-10">
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
              <BookOpen className="w-4 h-4 text-slate-400" />
              <span className="text-slate-600">{deck.card_count || 0} cards</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span>Updated</span>
            </div>
          </div>

          {/* Button */}
          <button
            onClick={() => onStartStudy(deck.id)}
            className="relative z-10 w-full py-3.5 rounded-xl bg-indigo-600 text-white text-sm font-bold shadow-md shadow-indigo-200/50 hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-300/50 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
          >
            Study Now
          </button>
        </div>
      ))}
    </div>
  );
}
