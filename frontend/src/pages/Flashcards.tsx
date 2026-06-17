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
        setError("Unable to load decks right now. Please check the server status.");
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
        showToast("This deck does not contain any cards yet.", "info");
        setLoading(false);
        return;
      }

      setFlashcards(cards);
      setCurrentIndex(0);
      setIsFlipped(false);
      setStudyMode(true);
    } catch (err) {
      console.error("Error starting study:", err);
      showToast("Error loading flashcards", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFlashcard = async (quality: number) => {
    if (!token || !flashcards[currentIndex]) return;
    try {
      const currentCard = flashcards[currentIndex];
      await api.updateFlashcard(token, currentCard.id, quality);

      let updatedCards = [...flashcards];
      if (quality < 4) {
        // Append card to the end of the session queue for re-learning (Again/Hard)
        updatedCards.push(currentCard);
        setFlashcards(updatedCards);
      }

      const newIndex = currentIndex + 1;
      if (newIndex < updatedCards.length) {
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
    if (!window.confirm("Are you sure you want to delete this deck? All flashcards in this deck will be permanently deleted and cannot be recovered.")) return;

    try {
      if (!token) return;
      setLoading(true);
      await api.deleteDeck(token, deckId);
      showToast("Deck deleted successfully", "success");
      fetchDecks();
    } catch (err) {
      console.error("Error deleting deck:", err);
      showToast("Unable to delete deck", "error");
      setLoading(false);
    }
  };

  if (loading && !studyMode) {
    return (
      <div className="flex-grow flex items-center justify-center py-20">
        <Loader className="w-8 h-8 animate-spin text-sky-blue" />
      </div>
    );
  }

  if (!studyMode) {
    return (
      <div className="w-full space-y-20 py-8">
        {error && (
          <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-600 font-bold flex items-center gap-3">
            <Frown className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* Official Decks */}
        <section className="w-full">
          <h2 className="h2-feather text-almost-black flex items-center gap-3 text-3xl md:text-4xl font-extrabold mb-10">
            <Trophy size={36} className="text-sunshine-yellow shrink-0" />
            Official Decks
          </h2>
          {globalDecks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 card-duo bg-gray-50 border-dashed">
              <Bookmark className="w-12 h-12 text-silver mb-4" />
              <h3 className="text-lg font-bold text-graphite mb-1">No official decks yet</h3>
              <p className="text-silver text-sm">Official decks will appear here once created.</p>
            </div>
          ) : (
            <DeckGrid decks={globalDecks} onStartStudy={startStudy} isOfficial={true} />
          )}
        </section>

        {/* Personal Decks */}
        <section className="w-full">
          <h2 className="h2-feather text-almost-black flex items-center gap-3 text-3xl md:text-4xl font-extrabold mb-10">
            <Bookmark size={36} className="text-sky-blue shrink-0" />
            My Decks
          </h2>
          {myDecks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 card-duo bg-gray-50 border-dashed">
              <Bookmark className="w-12 h-12 text-silver mb-4" />
              <h3 className="text-lg font-bold text-graphite mb-2">You don't have any decks yet</h3>
              <p className="text-silver text-sm max-w-sm text-center">
                Save vocabulary or grammar from lessons to create your personal flashcard decks here.
              </p>
            </div>
          ) : (
            <DeckGrid decks={myDecks} onStartStudy={startStudy} isOfficial={false} onDeleteDeck={handleDeleteDeck} />
          )}
        </section>
      </div>
    );
  }

  const currentCard = flashcards[currentIndex];
  if (!currentCard) return null;

  return (
    <div className="w-full max-w-2xl mx-auto py-8 flex flex-col items-center">
      <div className="w-full">
        <div className="mb-10 flex items-center gap-6">
          <button
            onClick={() => { setStudyMode(false); fetchDecks(); }}
            className="p-3 hover:bg-gray-100 rounded-xl border-2 border-cloud-gray transition-colors text-graphite hover:border-silver"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1 h-3 bg-cloud-gray rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-sky-blue rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${((currentIndex + 1) / flashcards.length) * 100}%` }}
            />
          </div>
          <span className="text-sm font-bold text-silver w-12 text-right">
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
                <div className="absolute inset-0 w-full h-full p-8 flex flex-col items-center justify-center [backface-visibility:hidden] card-duo">
                  <div className={`absolute top-8 px-3 py-1.5 rounded-xl text-[11px] font-extrabold uppercase tracking-wider border-2 border-transparent ${currentCard.vocab_id ? 'bg-sky-blue-light text-sky-blue' : 'bg-grape-soda/10 text-grape-soda'}`}>
                    {currentCard.vocab_id ? "Vocabulary" : "Grammar"}
                  </div>
                  <h2 className="font-jp text-6xl md:text-7xl font-bold text-almost-black mb-2 drop-shadow-sm">{currentCard.word}</h2>
                  <p className="text-2xl text-graphite font-medium">{currentCard.reading}</p>
                  <p className="absolute bottom-8 text-silver font-bold text-sm animate-pulse">Tap to flip card</p>
                </div>

                {/* Back Side */}
                <div className="absolute inset-0 w-full h-full p-8 flex flex-col justify-center [backface-visibility:hidden] [transform:rotateY(180deg)] overflow-y-auto custom-scrollbar card-duo">
                  <div className="w-full max-w-full my-auto">
                    <div className="text-sky-blue text-xs font-bold uppercase tracking-wider mb-2">Meaning</div>
                    <h3 className="text-2xl font-bold text-almost-black mb-6">{currentCard.meaning}</h3>

                    {currentCard.explanation && (
                      <div className="mb-6 p-5 bg-sky-blue-light/30 rounded-xl border border-sky-blue/10">
                        <div className="text-xs font-bold text-sky-blue uppercase mb-2">Usage / Conjugation</div>
                        <p className="text-[15px] text-almost-black font-medium leading-relaxed">{currentCard.explanation}</p>
                      </div>
                    )}

                    {currentCard.example && (
                      <div className="p-5 bg-gray-50 rounded-xl border border-cloud-gray mt-4">
                        <div className="text-xs font-bold text-silver uppercase mb-3">Example</div>
                        <p className="text-lg text-almost-black mb-2 font-bold font-jp">{currentCard.example}</p>
                        <p className="text-sm text-graphite mb-3 font-medium">{currentCard.example_reading}</p>
                        <div className="w-full h-[2px] bg-cloud-gray mb-3"></div>
                        <p className="text-graphite font-bold text-sm italic">{currentCard.example_meaning}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-10 grid grid-cols-4 gap-4">
          {[
            { q: 1, label: "Again", icon: RotateCcw, color: "text-red-500 border-2 border-cloud-gray hover:border-red-300 hover:bg-red-50/50" },
            { q: 3, label: "Hard", icon: Frown, color: "text-sunshine-yellow border-2 border-cloud-gray hover:border-sunshine-yellow/50 hover:bg-sunshine-yellow/5" },
            { q: 4, label: "Good", icon: Smile, color: "text-sky-blue border-2 border-cloud-gray hover:border-sky-blue/50 hover:bg-sky-blue-light/20" },
            { q: 5, label: "Easy", icon: Rocket, color: "text-grape-soda border-2 border-cloud-gray hover:border-grape-soda/50 hover:bg-grape-soda/5" },
          ].map((btn) => (
            <button
              key={btn.q}
              onClick={() => handleUpdateFlashcard(btn.q)}
              className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl transition-all duration-200 active:translate-y-0.5 bg-white ${btn.color}`}
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {decks.map((deck) => (
        <div
          key={deck.id}
          className="group flex flex-col p-6 card-duo hover:-translate-y-1 hover:border-silver transition-all duration-300 relative overflow-hidden"
        >
          {/* Decorative subtle gradient background */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-sky-blue-light/30 to-grape-soda/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity"></div>

          {/* Badges */}
          <div className="flex justify-between items-start mb-5 relative z-10">
            <div className="flex flex-wrap gap-2">
              <span className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold uppercase tracking-wider border-2 border-transparent ${isOfficial ? 'bg-sky-blue-light text-sky-blue' : 'bg-grape-soda/10 text-grape-soda'}`}>
                {isOfficial ? 'Official' : 'Personal'}
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-sunshine-yellow/20 text-[#cc9f00] text-[11px] font-extrabold uppercase tracking-wider border-2 border-transparent">
                N2
              </span>
            </div>
            {!isOfficial && onDeleteDeck && (
              <button
                onClick={(e) => onDeleteDeck(deck.id, e)}
                className="p-1.5 text-silver hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors z-20"
                title="Delete deck"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Title & Description */}
          <h3 className="text-xl font-bold text-almost-black mb-2 line-clamp-1 relative z-10 font-feather">{deck.name}</h3>

          {/* Metadata */}
          <div className="flex items-center gap-4 text-[13px] text-silver font-bold mb-6 relative z-10">
            <div className="flex items-center gap-1.5 bg-cloud-gray/30 px-2.5 py-1 rounded-lg">
              <BookOpen className="w-4 h-4 text-graphite" />
              <span className="text-graphite">{deck.card_count || 0} cards</span>
            </div>
            <div className="flex items-center gap-1.5 text-silver">
              <Clock className="w-4 h-4" />
              <span>Updated</span>
            </div>
          </div>

          {/* Button */}
          <button
            onClick={() => onStartStudy(deck.id)}
            className="relative z-10 w-full py-3 px-4 btn-3d-blue text-[15px]"
          >
            Study now
          </button>
        </div>
      ))}
    </div>
  );
}
