import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { RotateCcw, Frown, Smile, Rocket, Loader, ArrowLeft, Bookmark, UserSquare2 } from "lucide-react";
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

  if (loading && !studyMode) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!studyMode) {
    return (
      <div className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <header className="mb-10">
            <h1 className="text-4xl font-extrabold text-slate-900 mb-2">Flashcard Decks</h1>
            <p className="text-slate-500 text-lg">Study from admin decks or your own personal decks.</p>
          </header>

          {error && <p className="text-red-600 mb-4">{error}</p>}

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Official Decks</h2>
            {globalDecks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                <Bookmark className="w-14 h-14 text-slate-300 mb-3" />
                <h3 className="text-lg font-bold text-slate-700">No official decks available yet</h3>
                <p className="text-slate-500">Admin can create these decks in the admin page.</p>
              </div>
            ) : (
              <DeckGrid decks={globalDecks} onStartStudy={startStudy} />
            )}
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <UserSquare2 className="w-6 h-6 text-primary" />
              My Flashcards
            </h2>
            {myDecks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                <Bookmark className="w-14 h-14 text-slate-300 mb-3" />
                <h3 className="text-lg font-bold text-slate-700">You do not have any decks yet</h3>
                <p className="text-slate-500">Use the + button in Vocabulary/Grammar to create and add cards.</p>
              </div>
            ) : (
              <DeckGrid decks={myDecks} onStartStudy={startStudy} />
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
        <div className="mb-8 flex items-center gap-4">
          <button 
            onClick={() => { setStudyMode(false); fetchDecks(); }}
            className="p-2 hover:bg-slate-200 rounded-lg transition"
          >
            <ArrowLeft className="w-6 h-6 text-slate-600" />
          </button>
          <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${((currentIndex + 1) / flashcards.length) * 100}%` }}
            />
          </div>
          <span className="text-sm font-bold text-slate-500">
            {currentIndex + 1} / {flashcards.length}
          </span>
        </div>

        <div className="relative h-[450px] w-full [perspective:1000px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentCard.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="w-full h-full"
            >
              <div
                className={`w-full h-full relative transition-all duration-500 [transform-style:preserve-3d] cursor-pointer ${isFlipped ? "[transform:rotateY(180deg)]" : ""}`}
                onClick={() => setIsFlipped(!isFlipped)}
              >
                <div className="absolute inset-0 w-full h-full bg-white rounded-3xl shadow-xl p-10 flex flex-col items-center justify-center [backface-visibility:hidden]">
                  <div className="text-primary text-sm font-bold uppercase tracking-widest mb-6">Vocabulary</div>
                  <h2 className="text-7xl font-bold text-slate-900 mb-4">{currentCard.word || currentCard.grammar_point}</h2>
                  <p className="text-2xl text-slate-400">{currentCard.reading}</p>
                  <p className="mt-12 text-slate-400 text-sm">Click to flip</p>
                </div>

                <div className="absolute inset-0 w-full h-full bg-white rounded-3xl shadow-xl p-10 flex flex-col [backface-visibility:hidden] [transform:rotateY(180deg)] overflow-y-auto">
                  <div className="text-primary text-sm font-bold uppercase tracking-widest mb-4">Meaning</div>
                  <h3 className="text-3xl font-bold text-slate-900 mb-6">{currentCard.meaning || currentCard.explanation}</h3>
                  
                  {currentCard.example && (
                    <div className="mt-6 p-6 bg-slate-50 rounded-2xl">
                      <div className="text-xs font-bold text-slate-400 uppercase mb-2">Example</div>
                      <p className="text-lg text-slate-800 mb-2">{currentCard.example}</p>
                      <p className="text-sm text-slate-500">{currentCard.example_reading}</p>
                      <p className="text-slate-600 mt-2">{currentCard.example_meaning}</p>
                    </div>
                  )}

                  <div className="mt-auto pt-6 text-center text-slate-400 text-sm">Click to flip back</div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-10 grid grid-cols-4 gap-4">
          {[
            { q: 1, label: "Again", icon: RotateCcw, color: "text-red-500 hover:bg-red-50" },
            { q: 3, label: "Hard", icon: Frown, color: "text-orange-500 hover:bg-orange-50" },
            { q: 4, label: "Good", icon: Smile, color: "text-green-500 hover:bg-green-50" },
            { q: 5, label: "Easy", icon: Rocket, color: "text-primary hover:bg-primary/5" },
          ].map((btn) => (
            <button
              key={btn.q}
              onClick={() => handleUpdateFlashcard(btn.q)}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-transparent transition-all ${btn.color}`}
            >
              <btn.icon className="w-6 h-6" />
              <span className="font-bold text-sm">{btn.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function DeckGrid({ decks, onStartStudy }: { decks: any[]; onStartStudy: (deckId: number) => void }) {
  const colors: Record<string, string> = {
    blue: "bg-blue-50 border-blue-200 text-blue-700",
    red: "bg-red-50 border-red-200 text-red-700",
    green: "bg-green-50 border-green-200 text-green-700",
    purple: "bg-purple-50 border-purple-200 text-purple-700",
    yellow: "bg-yellow-50 border-yellow-200 text-yellow-700",
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {decks.map((deck) => {
        const colorClass = colors[deck.color] || colors.blue;
        return (
          <motion.div
            key={deck.id}
            whileHover={{ y: -4 }}
            className={`p-8 rounded-2xl border-2 shadow-sm flex flex-col ${colorClass}`}
          >
            <h3 className="text-2xl font-bold mb-2">{deck.name}</h3>
            <p className="opacity-80 mb-6 flex-1">{deck.description || "No description available."}</p>
            <div className="flex items-center justify-between mt-auto">
              <span className="font-bold">{deck.card_count || 0} cards</span>
              <button
                onClick={() => onStartStudy(deck.id)}
                className="bg-white px-6 py-2 rounded-xl font-bold shadow-sm hover:shadow-md transition"
              >
                Study Now
              </button>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
