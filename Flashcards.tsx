import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  Plus,
  Layers,
  Zap,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Flame,
  CheckCircle2,
  XCircle,
  Clock,
  Star,
} from "lucide-react";

/* ─────────────────────────────────────────────
   TYPES  (replace with your actual API types)
───────────────────────────────────────────── */
interface Flashcard {
  id: string | number;
  front: string;          // kanji / grammar pattern
  reading?: string;       // furigana
  back: string;           // meaning
  example?: string;       // example sentence
  example_translation?: string;
  level?: string;
  type?: "vocabulary" | "grammar";
  pos?: string;           // part of speech
}

interface Deck {
  id: string | number;
  name: string;
  description?: string;
  color?: string;
  flashcard_count?: number;
  flashcards?: Flashcard[];
}

interface Props {
  // ─── replace these with your real hooks / API calls ───
  decks: Deck[];
  loading: boolean;
  onStudyDeck: (deck: Deck) => Promise<Flashcard[]>;
  onRateCard: (cardId: string | number, rating: "again" | "hard" | "good" | "easy") => Promise<void>;
  onAddFlashcard?: (word: string, deckId?: string | number) => Promise<void>;
}

/* ─────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────── */
const DECK_COLORS = [
  { from: "#534AB7", to: "#7F77DD", light: "#EEEDFE", text: "#3C3489" },
  { from: "#0F6E56", to: "#1D9E75", light: "#E1F5EE", text: "#085041" },
  { from: "#993C1D", to: "#D85A30", light: "#FAECE7", text: "#712B13" },
  { from: "#185FA5", to: "#378ADD", light: "#E6F1FB", text: "#0C447C" },
  { from: "#993556", to: "#D4537E", light: "#FBEAF0", text: "#72243E" },
];

const RATING_CONFIG = {
  again: { label: "Lại",  sublabel: "< 1 phút", color: "#E24B4A", bg: "#FCEBEB", border: "#F09595" },
  hard:  { label: "Khó",  sublabel: "10 phút",  color: "#854F0B", bg: "#FAEEDA", border: "#FAC775" },
  good:  { label: "Được", sublabel: "1 ngày",   color: "#0F6E56", bg: "#E1F5EE", border: "#5DCAA5" },
  easy:  { label: "Dễ",   sublabel: "4 ngày",   color: "#3C3489", bg: "#EEEDFE", border: "#AFA9EC" },
} as const;

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
export default function Flashcards({
  decks,
  loading,
  onStudyDeck,
  onRateCard,
  onAddFlashcard,
}: Props) {
  const [studyDeck, setStudyDeck]         = useState<Deck | null>(null);
  const [flashcards, setFlashcards]       = useState<Flashcard[]>([]);
  const [index, setIndex]                 = useState(0);
  const [flipped, setFlipped]             = useState(false);
  const [exiting, setExiting]             = useState(false);
  const [exitDir, setExitDir]             = useState<1 | -1>(1);
  const [sessionStats, setSessionStats]   = useState({ again: 0, hard: 0, good: 0, easy: 0 });
  const [sessionStart]                    = useState(Date.now());
  const [elapsed, setElapsed]             = useState(0);
  const [finished, setFinished]           = useState(false);
  const [loadingStudy, setLoadingStudy]   = useState(false);
  const [showAddForm, setShowAddForm]     = useState(false);
  const [addWord, setAddWord]             = useState("");
  const [addLoading, setAddLoading]       = useState(false);
  const [addError, setAddError]           = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* Timer */
  useEffect(() => {
    if (studyDeck && !finished) {
      timerRef.current = setInterval(() => setElapsed(Math.floor((Date.now() - sessionStart) / 1000)), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [studyDeck, finished, sessionStart]);

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  /* Start studying a deck */
  const handleStudy = async (deck: Deck) => {
    setLoadingStudy(true);
    try {
      const cards = await onStudyDeck(deck);
      setFlashcards(cards);
      setStudyDeck(deck);
      setIndex(0);
      setFlipped(false);
      setFinished(false);
      setSessionStats({ again: 0, hard: 0, good: 0, easy: 0 });
    } finally {
      setLoadingStudy(false);
    }
  };

  /* Flip card */
  const handleFlip = useCallback(() => {
    if (!exiting) setFlipped(f => !f);
  }, [exiting]);

  /* Keyboard support */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!studyDeck || finished) return;
      if (e.code === "Space") { e.preventDefault(); handleFlip(); }
      if (flipped) {
        if (e.key === "1") handleRate("again");
        if (e.key === "2") handleRate("hard");
        if (e.key === "3") handleRate("good");
        if (e.key === "4") handleRate("easy");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [studyDeck, finished, flipped, handleFlip]);

  /* Rate card */
  const handleRate = async (rating: keyof typeof RATING_CONFIG) => {
    if (!flipped || exiting) return;
    const card = flashcards[index];
    setExiting(true);
    setExitDir(rating === "again" ? -1 : 1);
    setSessionStats(s => ({ ...s, [rating]: s[rating] + 1 }));

    try { await onRateCard(card.id, rating); } catch {}

    setTimeout(() => {
      if (index + 1 >= flashcards.length) {
        setFinished(true);
      } else {
        setIndex(i => i + 1);
        setFlipped(false);
      }
      setExiting(false);
    }, 320);
  };

  /* Add flashcard */
  const handleAdd = async () => {
    if (!addWord.trim()) return;
    setAddLoading(true);
    setAddError("");
    try {
      await onAddFlashcard?.(addWord.trim(), studyDeck?.id);
      setAddWord("");
      setShowAddForm(false);
    } catch {
      setAddError("Không tìm thấy từ vựng này.");
    } finally {
      setAddLoading(false);
    }
  };

  const current = flashcards[index];
  const progress = flashcards.length > 0 ? (index / flashcards.length) : 0;
  const totalRated = sessionStats.again + sessionStats.hard + sessionStats.good + sessionStats.easy;

  /* ── LOADING SCREEN ── */
  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          style={{ width: 36, height: 36, border: "3px solid #EEEDFE", borderTopColor: "#534AB7", borderRadius: "50%" }}
        />
      </div>
    );
  }

  /* ── DECK LIST ── */
  if (!studyDeck) {
    return (
      <div style={{ padding: "2.5rem 2rem", maxWidth: 900, margin: "0 auto" }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: "2.5rem" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: "#EEEDFE", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Layers size={18} color="#534AB7" />
            </div>
            <h2 style={{ fontSize: 26, fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.5px" }}>
              Bộ thẻ của tôi
            </h2>
          </div>
          <p style={{ fontSize: 14, color: "var(--color-text-secondary)", marginLeft: 48 }}>
            Chọn một bộ thẻ để bắt đầu luyện tập
          </p>
        </motion.div>

        {/* Empty state */}
        {decks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              textAlign: "center", padding: "4rem 2rem",
              border: "1.5px dashed var(--color-border-secondary)",
              borderRadius: 20, background: "var(--color-background-secondary)",
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 16 }}>
              <Layers size={48} color="#AFA9EC" style={{ margin: "0 auto" }} />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 8 }}>
              Chưa có bộ thẻ nào
            </h3>
            <p style={{ fontSize: 14, color: "var(--color-text-secondary)", marginBottom: 24 }}>
              Lưu từ vựng / ngữ pháp vào deck để bắt đầu học
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                background: "#534AB7", color: "#fff",
                border: "none", borderRadius: 10, padding: "10px 20px",
                fontWeight: 600, fontSize: 14, cursor: "pointer",
              }}
            >
              <Plus size={16} /> Thêm flashcard
            </button>
          </motion.div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
            {decks.map((deck, i) => {
              const col = DECK_COLORS[i % DECK_COLORS.length];
              return (
                <motion.div
                  key={deck.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  style={{
                    background: "var(--color-background-primary)",
                    border: "0.5px solid var(--color-border-tertiary)",
                    borderRadius: 18, overflow: "hidden", cursor: "pointer",
                  }}
                  onClick={() => handleStudy(deck)}
                >
                  {/* Color strip */}
                  <div style={{
                    height: 6,
                    background: `linear-gradient(90deg, ${col.from}, ${col.to})`,
                  }} />
                  <div style={{ padding: "18px 20px 20px" }}>
                    <div style={{
                      display: "inline-block", fontSize: 11, fontWeight: 600,
                      color: col.text, background: col.light,
                      padding: "3px 10px", borderRadius: 99, marginBottom: 10,
                    }}>
                      {deck.flashcard_count ?? 0} thẻ
                    </div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 6, lineHeight: 1.3 }}>
                      {deck.name}
                    </h3>
                    {deck.description && (
                      <p style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.5, marginBottom: 16 }}>
                        {deck.description}
                      </p>
                    )}
                    <button
                      style={{
                        width: "100%", padding: "9px 0", borderRadius: 10,
                        background: col.light, color: col.text,
                        border: "none", fontWeight: 600, fontSize: 13, cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      }}
                    >
                      <Zap size={14} /> Học ngay
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Loading overlay */}
        <AnimatePresence>
          {loadingStudy && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999,
              }}
            >
              <div style={{
                background: "var(--color-background-primary)", borderRadius: 16,
                padding: "28px 40px", textAlign: "center",
                border: "0.5px solid var(--color-border-tertiary)",
              }}>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                  style={{ width: 32, height: 32, border: "3px solid #EEEDFE", borderTopColor: "#534AB7", borderRadius: "50%", margin: "0 auto 12px" }}
                />
                <p style={{ fontSize: 14, color: "var(--color-text-secondary)" }}>Đang tải bộ thẻ...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  /* ── FINISHED SCREEN ── */
  if (finished) {
    const accuracy = totalRated > 0 ? Math.round((sessionStats.good + sessionStats.easy) / totalRated * 100) : 0;
    const col = DECK_COLORS[decks.findIndex(d => d.id === studyDeck.id) % DECK_COLORS.length] ?? DECK_COLORS[0];

    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "70vh", padding: "2rem" }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 22 }}
          style={{
            background: "var(--color-background-primary)",
            border: "0.5px solid var(--color-border-tertiary)",
            borderRadius: 24, padding: "2.5rem 2rem", maxWidth: 420, width: "100%",
            textAlign: "center",
          }}
        >
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
            style={{
              width: 72, height: 72, borderRadius: "50%",
              background: col.light, margin: "0 auto 20px",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <Star size={32} color={col.from} fill={col.from} />
          </motion.div>

          <h2 style={{ fontSize: 24, fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 6 }}>
            Hoàn thành!
          </h2>
          <p style={{ fontSize: 14, color: "var(--color-text-secondary)", marginBottom: 28 }}>
            {studyDeck.name}
          </p>

          {/* Stats grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
            {[
              { label: "Độ chính xác", value: `${accuracy}%`, color: col.text, bg: col.light },
              { label: "Thời gian",    value: formatTime(elapsed), color: "#0F6E56", bg: "#E1F5EE" },
              { label: "Thẻ đã học",  value: `${totalRated}`, color: "#185FA5", bg: "#E6F1FB" },
              { label: "Cần ôn lại",  value: `${sessionStats.again}`, color: "#A32D2D", bg: "#FCEBEB" },
            ].map(s => (
              <div key={s.label} style={{
                background: s.bg, borderRadius: 12, padding: "14px 10px",
              }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 12, color: s.color, opacity: 0.7, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Rating breakdown */}
          <div style={{
            display: "flex", gap: 6, justifyContent: "center", marginBottom: 24,
            fontSize: 12, color: "var(--color-text-secondary)",
          }}>
            {(Object.entries(sessionStats) as [keyof typeof RATING_CONFIG, number][]).map(([k, v]) => (
              <span key={k} style={{
                padding: "3px 10px", borderRadius: 99,
                background: RATING_CONFIG[k].bg, color: RATING_CONFIG[k].color,
                fontWeight: 600,
              }}>
                {RATING_CONFIG[k].label} {v}
              </span>
            ))}
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => handleStudy(studyDeck)}
              style={{
                flex: 1, padding: "11px 0", borderRadius: 12,
                background: col.from, color: "#fff",
                border: "none", fontWeight: 600, fontSize: 14, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}
            >
              <RotateCcw size={15} /> Học lại
            </button>
            <button
              onClick={() => setStudyDeck(null)}
              style={{
                flex: 1, padding: "11px 0", borderRadius: 12,
                background: "var(--color-background-secondary)", color: "var(--color-text-primary)",
                border: "0.5px solid var(--color-border-secondary)", fontWeight: 600, fontSize: 14, cursor: "pointer",
              }}
            >
              Tất cả deck
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  /* ── NO CARDS ── */
  if (flashcards.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 16 }}>
        <button
          onClick={() => setStudyDeck(null)}
          style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "var(--color-text-secondary)", cursor: "pointer", fontWeight: 500 }}
        >
          <ArrowLeft size={18} /> Quay lại
        </button>
        <p style={{ color: "var(--color-text-secondary)" }}>Bộ thẻ này chưa có flashcard.</p>
      </div>
    );
  }

  /* ── STUDY MODE ── */
  const deckColorIdx = decks.findIndex(d => d.id === studyDeck.id) % DECK_COLORS.length;
  const col = DECK_COLORS[deckColorIdx >= 0 ? deckColorIdx : 0];

  return (
    <div style={{ padding: "2rem 1.5rem", maxWidth: 640, margin: "0 auto" }}>

      {/* ── Top bar ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.75rem" }}>
        <button
          onClick={() => setStudyDeck(null)}
          style={{
            display: "flex", alignItems: "center", gap: 6, fontSize: 13,
            color: "var(--color-text-secondary)", background: "var(--color-background-primary)",
            border: "0.5px solid var(--color-border-secondary)", borderRadius: 8,
            padding: "6px 14px", cursor: "pointer", fontWeight: 500,
          }}
        >
          <ArrowLeft size={14} /> Tất cả deck
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 5, fontSize: 13,
            color: "var(--color-text-secondary)",
          }}>
            <Clock size={13} />
            {formatTime(elapsed)}
          </div>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11,
            fontWeight: 600, color: col.text, background: col.light,
            padding: "3px 10px", borderRadius: 99,
          }}>
            <Flame size={11} />
            {studyDeck.name}
          </div>
        </div>
      </div>

      {/* ── Progress ── */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>Tiến độ</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-primary)" }}>
            {index} / {flashcards.length} thẻ
          </span>
        </div>
        <div style={{ height: 5, background: "var(--color-background-secondary)", borderRadius: 99, overflow: "hidden" }}>
          <motion.div
            style={{ height: "100%", background: col.from, borderRadius: 99 }}
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>

        {/* Mini dot indicators */}
        <div style={{ display: "flex", gap: 4, marginTop: 8, flexWrap: "wrap" }}>
          {flashcards.map((_, i) => (
            <div
              key={i}
              style={{
                width: 6, height: 6, borderRadius: "50%",
                background: i < index ? col.from : i === index ? col.to : "var(--color-border-secondary)",
                transition: "background 0.3s",
              }}
            />
          ))}
        </div>
      </div>

      {/* ── Card ── */}
      <div
        style={{ marginBottom: "1.5rem", perspective: 1200, cursor: flipped ? "default" : "pointer" }}
        onClick={() => !flipped && handleFlip()}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, x: exitDir * 60, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: exitDir * -60, scale: 0.95 }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
          >
            {/* Card shell */}
            <div style={{
              background: "var(--color-background-primary)",
              border: "0.5px solid var(--color-border-tertiary)",
              borderRadius: 24, overflow: "hidden",
              minHeight: 260,
            }}>
              {/* Top accent */}
              <div style={{ height: 5, background: `linear-gradient(90deg, ${col.from}, ${col.to})` }} />

              <div style={{ padding: "1.75rem 2rem" }}>
                {/* Tags */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
                  <span style={{
                    fontSize: 11, fontWeight: 600, color: col.text, background: col.light,
                    padding: "3px 10px", borderRadius: 99,
                  }}>
                    {current.type === "grammar" ? "📖 Ngữ pháp" : "⚡ Từ vựng"} · {current.level ?? "N2"}
                  </span>
                  <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>
                    {index + 1}/{flashcards.length}
                  </span>
                </div>

                <AnimatePresence mode="wait">
                  {!flipped ? (
                    /* ── FRONT ── */
                    <motion.div
                      key="front"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                      style={{ textAlign: "center", paddingTop: "0.5rem" }}
                    >
                      <div style={{
                        fontSize: 68, fontWeight: 800, color: "var(--color-text-primary)",
                        lineHeight: 1, marginBottom: 10, letterSpacing: "-2px",
                        fontFamily: "'Noto Serif JP', serif",
                      }}>
                        {current.front}
                      </div>
                      {current.reading && (
                        <div style={{ fontSize: 18, color: col.from, fontWeight: 500, marginBottom: 16 }}>
                          {current.reading}
                        </div>
                      )}
                      <div style={{
                        display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12,
                        color: "var(--color-text-secondary)", marginTop: 8,
                        padding: "6px 14px", background: "var(--color-background-secondary)",
                        borderRadius: 99, cursor: "pointer",
                      }}
                        onClick={(e) => { e.stopPropagation(); handleFlip(); }}
                      >
                        <span>Nhấn để xem nghĩa</span>
                        <ChevronRight size={13} />
                      </div>
                    </motion.div>
                  ) : (
                    /* ── BACK ── */
                    <motion.div
                      key="back"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div style={{ marginBottom: "1rem" }}>
                        <p style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
                          Nghĩa
                        </p>
                        <p style={{ fontSize: 26, fontWeight: 600, color: "var(--color-text-primary)", lineHeight: 1.3 }}>
                          {current.back}
                        </p>
                        {current.pos && (
                          <span style={{
                            display: "inline-block", marginTop: 6, fontSize: 11, fontWeight: 600,
                            color: col.text, background: col.light, padding: "2px 8px", borderRadius: 99,
                          }}>
                            {current.pos}
                          </span>
                        )}
                      </div>

                      {current.example && (
                        <div style={{
                          background: "var(--color-background-secondary)",
                          borderLeft: `3px solid ${col.from}`,
                          borderRadius: "0 10px 10px 0",
                          padding: "10px 14px",
                        }}>
                          <p style={{ fontSize: 13, color: "var(--color-text-primary)", lineHeight: 1.7, marginBottom: 4, fontFamily: "'Noto Serif JP', serif" }}>
                            {current.example}
                          </p>
                          {current.example_translation && (
                            <p style={{ fontSize: 12, color: "var(--color-text-secondary)", fontStyle: "italic" }}>
                              🇻🇳 {current.example_translation}
                            </p>
                          )}
                        </div>
                      )}

                      <div style={{ marginTop: "0.75rem", display: "flex", justifyContent: "flex-end" }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleFlip(); }}
                          style={{
                            display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12,
                            color: "var(--color-text-secondary)", background: "none",
                            border: "0.5px solid var(--color-border-secondary)",
                            borderRadius: 8, padding: "5px 12px", cursor: "pointer",
                          }}
                        >
                          <ChevronLeft size={13} /> Xem lại
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Rating buttons ── */}
      <AnimatePresence>
        {flipped && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.22 }}
            style={{ marginBottom: "1.5rem" }}
          >
            <p style={{ fontSize: 11, color: "var(--color-text-secondary)", textAlign: "center", marginBottom: 10 }}>
              Bạn nhớ tốt đến đâu? <span style={{ opacity: 0.6 }}>(phím 1–4)</span>
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
              {(Object.entries(RATING_CONFIG) as [keyof typeof RATING_CONFIG, typeof RATING_CONFIG[keyof typeof RATING_CONFIG]][]).map(([key, cfg]) => (
                <motion.button
                  key={key}
                  whileHover={{ y: -3, transition: { duration: 0.15 } }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => handleRate(key)}
                  style={{
                    padding: "12px 8px",
                    borderRadius: 14,
                    background: cfg.bg,
                    border: `1.5px solid ${cfg.border}`,
                    cursor: "pointer",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                  }}
                >
                  <span style={{ fontSize: 14, fontWeight: 700, color: cfg.color }}>{cfg.label}</span>
                  <span style={{ fontSize: 11, color: cfg.color, opacity: 0.7 }}>{cfg.sublabel}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Session stats ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: "1.25rem" }}>
        {[
          { label: "Cần ôn lại", value: sessionStats.again + sessionStats.hard, color: "#A32D2D", bg: "#FCEBEB", icon: <XCircle size={14} /> },
          { label: "Đã nhớ",    value: sessionStats.good + sessionStats.easy,  color: "#0F6E56", bg: "#E1F5EE", icon: <CheckCircle2 size={14} /> },
          { label: "Còn lại",   value: flashcards.length - index,               color: "var(--color-text-secondary)", bg: "var(--color-background-secondary)", icon: <Layers size={14} /> },
        ].map(s => (
          <div key={s.label} style={{
            background: s.bg, borderRadius: 12, padding: "10px",
            textAlign: "center",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, color: s.color }}>
              {s.icon}
              <span style={{ fontSize: 20, fontWeight: 700 }}>{s.value}</span>
            </div>
            <div style={{ fontSize: 11, color: s.color, opacity: 0.75, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Add card button ── */}
      <div style={{ textAlign: "center" }}>
        <button
          onClick={() => setShowAddForm(s => !s)}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13,
            color: "var(--color-text-secondary)", background: "var(--color-background-secondary)",
            border: "0.5px solid var(--color-border-secondary)", borderRadius: 10,
            padding: "8px 18px", cursor: "pointer", fontWeight: 500,
          }}
        >
          <Plus size={14} /> Thêm thẻ mới
        </button>
      </div>

      {/* ── Add card form ── */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: "hidden", marginTop: 12 }}
          >
            <div style={{
              background: "var(--color-background-primary)",
              border: "0.5px solid var(--color-border-secondary)",
              borderRadius: 14, padding: "16px",
            }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 10 }}>
                Thêm từ vựng vào deck
              </p>
              {addError && (
                <p style={{ fontSize: 12, color: "#A32D2D", background: "#FCEBEB", padding: "6px 10px", borderRadius: 8, marginBottom: 8 }}>
                  {addError}
                </p>
              )}
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  value={addWord}
                  onChange={e => setAddWord(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleAdd()}
                  placeholder="Nhập từ hoặc ngữ pháp..."
                  style={{
                    flex: 1, padding: "9px 14px", fontSize: 14,
                    border: "0.5px solid var(--color-border-secondary)", borderRadius: 10,
                    background: "var(--color-background-secondary)",
                    color: "var(--color-text-primary)", outline: "none",
                  }}
                />
                <button
                  onClick={handleAdd}
                  disabled={addLoading || !addWord.trim()}
                  style={{
                    padding: "9px 18px", background: col.from, color: "#fff",
                    border: "none", borderRadius: 10, fontWeight: 600, fontSize: 13,
                    cursor: addLoading ? "not-allowed" : "pointer", opacity: addLoading ? 0.6 : 1,
                  }}
                >
                  {addLoading ? "..." : "Thêm"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keyboard hint */}
      <p style={{ fontSize: 11, color: "var(--color-text-secondary)", textAlign: "center", marginTop: 16, opacity: 0.6 }}>
        Space = lật thẻ · 1–4 = đánh giá
      </p>
    </div>
  );
}
