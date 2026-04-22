import { useState } from "react";

const S = {
  card: {
    background: "#fff",
    borderRadius: 24,
    border: "2.5px solid #e2e8f0",
    padding: "28px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
  },
};

function Badge({ children, bg, color }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      background: bg, color, borderRadius: 999,
      padding: "4px 12px", fontSize: 12, fontWeight: 800,
    }}>{children}</span>
  );
}

function BackButton() {
  return (
    <button style={{
      display: "inline-flex", alignItems: "center", gap: 8,
      background: "#f1f5f9", border: "none", borderRadius: 14,
      padding: "10px 18px", fontWeight: 700, fontSize: 14,
      color: "#475569", cursor: "pointer", marginBottom: 28,
    }}>← Quay lại</button>
  );
}

// ─── VOCABULARY DETAIL ────────────────────────────────────────
const VOCAB = {
  word: "改善", reading: "かいぜん", meaning: "Cải thiện, cải tiến",
  category: "Business", level: "N2",
  example_sentence: "このシステムを改善することで、効率が上がります。",
  example_translation: "Bằng cách cải thiện hệ thống này, hiệu suất sẽ tăng lên.",
};

function VocabularyDetail() {
  const v = VOCAB;
  const [revealed, setRevealed] = useState(false);
  const [saved, setSaved] = useState(false);
  const [quizMode, setQuizMode] = useState(false);
  const [quizAnswer, setQuizAnswer] = useState("");
  const [quizResult, setQuizResult] = useState(null);

  const checkQuiz = () => {
    setQuizResult(quizAnswer.trim() === v.reading ? "correct" : "wrong");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", padding: "32px 24px" }}>
      <div style={{ maxWidth: 780, margin: "0 auto" }}>
        <BackButton />

        {/* Hero */}
        <div style={{
          background: "linear-gradient(135deg,#eef2ff 0%,#e0e7ff 50%,#ede9fe 100%)",
          borderRadius: 32, padding: "40px", marginBottom: 20,
          border: "2.5px solid #c7d2fe", position: "relative", overflow: "hidden",
        }}>
          <div style={{ position: "absolute", top: -60, right: -60, width: 220, height: 220, borderRadius: "50%", background: "rgba(99,102,241,0.08)" }} />

          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            <Badge bg="#6366f1" color="#fff">⚡ Từ Vựng</Badge>
            <Badge bg="#fff" color="#6366f1">{v.level}</Badge>
            <Badge bg="#f0fdf4" color="#059669">{v.category}</Badge>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 24, alignItems: "center" }}>
            <div>
              <p style={{
                fontFamily: "'Noto Sans JP',sans-serif",
                fontSize: 88, fontWeight: 900, color: "#4338ca",
                lineHeight: 1, marginBottom: 16,
                textShadow: "0 4px 24px rgba(99,102,241,0.25)",
              }}>{v.word}</p>
              <div
                onClick={() => setRevealed(!revealed)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  background: revealed ? "#6366f1" : "rgba(255,255,255,0.85)",
                  borderRadius: 14, padding: "10px 20px", cursor: "pointer",
                  border: "2px solid", borderColor: revealed ? "#6366f1" : "#c7d2fe",
                  boxShadow: revealed ? "0 4px 16px #6366f133" : "none",
                  transition: "all 0.25s",
                }}
              >
                <span style={{ fontSize: 14, fontWeight: 700, color: revealed ? "#fff" : "#6366f1", fontFamily: "'Noto Sans JP',sans-serif" }}>
                  {revealed ? `👁 ${v.reading}` : "👆 Xem cách đọc"}
                </span>
              </div>
            </div>

            <div style={{
              background: "rgba(255,255,255,0.8)", borderRadius: 20, padding: "24px",
              border: "2px solid rgba(255,255,255,0.9)", backdropFilter: "blur(8px)",
              minWidth: 180,
            }}>
              <p style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Nghĩa</p>
              <p style={{ fontSize: 18, fontWeight: 800, color: "#1e293b" }}>{v.meaning}</p>
            </div>
          </div>
        </div>

        {/* 2 col */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          {/* Example */}
          <div style={{ ...S.card }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{ width: 36, height: 36, background: "#fef3c7", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>📝</div>
              <p style={{ fontWeight: 800, color: "#1e293b", fontSize: 15 }}>Câu ví dụ</p>
            </div>
            <div style={{ background: "#f8fafc", borderRadius: 16, padding: "16px 20px", borderLeft: "4px solid #6366f1", marginBottom: 12 }}>
              <p style={{ fontFamily: "'Noto Sans JP',sans-serif", fontSize: 15, color: "#1e293b", fontWeight: 500, lineHeight: 1.8 }}>{v.example_sentence}</p>
            </div>
            <p style={{ fontSize: 13, color: "#64748b", fontStyle: "italic", lineHeight: 1.6 }}>🇻🇳 {v.example_translation}</p>
          </div>

          {/* Mini Quiz */}
          <div style={{
            ...S.card,
            background: quizResult === "correct" ? "linear-gradient(135deg,#ecfdf5,#d1fae5)" : quizResult === "wrong" ? "linear-gradient(135deg,#fff1f2,#ffe4e6)" : "#fff",
            transition: "background 0.4s",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{ width: 36, height: 36, background: "#f0f9ff", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🎯</div>
              <p style={{ fontWeight: 800, color: "#1e293b", fontSize: 15 }}>Mini Quiz</p>
            </div>

            {!quizMode ? (
              <>
                <p style={{ fontSize: 14, color: "#64748b", marginBottom: 16, lineHeight: 1.6 }}>
                  Thử gõ cách đọc của <strong style={{ color: "#6366f1", fontFamily: "'Noto Sans JP',sans-serif", fontSize: 18 }}>{v.word}</strong>
                </p>
                <button onClick={() => { setQuizMode(true); setQuizResult(null); setQuizAnswer(""); }} style={{
                  width: "100%", background: "linear-gradient(135deg,#f59e0b,#fbbf24)",
                  border: "none", borderRadius: 14, padding: "12px",
                  fontWeight: 800, fontSize: 14, color: "#fff", cursor: "pointer",
                  boxShadow: "0 4px 16px #f59e0b33",
                }}>⚡ Bắt đầu Quiz!</button>
              </>
            ) : quizResult ? (
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 44, marginBottom: 8 }}>{quizResult === "correct" ? "🎉" : "😅"}</p>
                <p style={{ fontWeight: 800, fontSize: 16, color: quizResult === "correct" ? "#059669" : "#e11d48", marginBottom: 4 }}>
                  {quizResult === "correct" ? "Chính xác!" : "Chưa đúng!"}
                </p>
                <p style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>
                  Đáp án: <strong style={{ fontFamily: "'Noto Sans JP',sans-serif", color: "#6366f1" }}>{v.reading}</strong>
                </p>
                <button onClick={() => { setQuizMode(false); setQuizResult(null); }} style={{
                  background: "#6366f1", border: "none", borderRadius: 12,
                  padding: "10px 20px", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer",
                }}>Thử lại</button>
              </div>
            ) : (
              <>
                <p style={{ fontSize: 14, color: "#64748b", marginBottom: 10 }}>Gõ cách đọc (hiragana):</p>
                <input
                  value={quizAnswer}
                  onChange={e => setQuizAnswer(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && checkQuiz()}
                  placeholder="ひらがな..."
                  style={{
                    width: "100%", padding: "12px 16px", marginBottom: 10,
                    border: "2px solid #e2e8f0", borderRadius: 14,
                    fontSize: 16, fontFamily: "'Noto Sans JP',sans-serif",
                    outline: "none", color: "#1e293b",
                  }}
                />
                <button onClick={checkQuiz} style={{
                  width: "100%", background: "#6366f1", border: "none",
                  borderRadius: 14, padding: "12px", fontWeight: 800,
                  fontSize: 14, color: "#fff", cursor: "pointer",
                }}>Kiểm tra →</button>
              </>
            )}
          </div>
        </div>

        {/* Save */}
        <button onClick={() => setSaved(!saved)} style={{
          width: "100%",
          background: saved ? "linear-gradient(135deg,#059669,#10b981)" : "linear-gradient(135deg,#6366f1,#8b5cf6)",
          border: "none", borderRadius: 20, padding: "20px",
          color: "#fff", fontWeight: 800, fontSize: 16, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          boxShadow: saved ? "0 8px 32px #05996944" : "0 8px 32px #6366f144",
          transition: "all 0.3s",
        }}>
          {saved ? "✅ Đã lưu vào Deck!" : "＋ Lưu vào Flashcard Deck"}
        </button>
      </div>
    </div>
  );
}

// ─── GRAMMAR DETAIL ───────────────────────────────────────────
const GRAMMAR = {
  pattern: "〜ために", title: "Diễn đạt mục đích",
  meaning: "Để làm gì / Vì mục đích gì", level: "N2", category: "Mục đích",
  quick_tip: "Dùng với động từ thể từ điển. Không dùng với tính từ hoặc trạng thái tạm thời.",
  explanation: "〜ために biểu đạt mục đích của hành động. Chủ thể của hai mệnh đề thường giống nhau. Phân biệt với 〜のに (mặc dù) và 〜から (vì lý do chủ quan).",
  examples: [
    { jp: "日本語を勉強するために、毎日練習しています。", vn: "Để học tiếng Nhật, tôi luyện tập mỗi ngày." },
    { jp: "健康のために、毎朝走ります。", vn: "Vì sức khỏe, tôi chạy bộ mỗi sáng." },
    { jp: "試験に合格するために、一生懸命勉強します。", vn: "Để đỗ kỳ thi, tôi học hành chăm chỉ." },
  ],
  compare: [
    { pattern: "〜のに", meaning: "Mặc dù... nhưng... (đối lập)", color: "#f59e0b" },
    { pattern: "〜から", meaning: "Vì... nên... (lý do chủ quan)", color: "#ef4444" },
    { pattern: "〜ので", meaning: "Vì... nên... (lý do khách quan)", color: "#8b5cf6" },
  ],
};

function GrammarDetail() {
  const g = GRAMMAR;
  const [activeEx, setActiveEx] = useState(0);
  const [saved, setSaved] = useState(false);
  const [showTip, setShowTip] = useState(false);

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", padding: "32px 24px" }}>
      <div style={{ maxWidth: 780, margin: "0 auto" }}>
        <BackButton />

        {/* Hero */}
        <div style={{
          background: "linear-gradient(135deg,#fdf4ff 0%,#fae8ff 50%,#ede9fe 100%)",
          borderRadius: 32, padding: "40px", marginBottom: 20,
          border: "2.5px solid #e9d5ff", position: "relative", overflow: "hidden",
        }}>
          <div style={{ position: "absolute", top: -50, right: -50, width: 200, height: 200, borderRadius: "50%", background: "rgba(168,85,247,0.08)" }} />

          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            <Badge bg="#9333ea" color="#fff">📖 Ngữ Pháp</Badge>
            <Badge bg="#fff" color="#9333ea">{g.level}</Badge>
            <Badge bg="#f5f3ff" color="#7c3aed">{g.category}</Badge>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 24, alignItems: "flex-start" }}>
            <div>
              <p style={{
                fontFamily: "'Noto Sans JP',sans-serif",
                fontSize: 64, fontWeight: 900, color: "#7c3aed",
                lineHeight: 1.1, marginBottom: 10,
                textShadow: "0 4px 24px rgba(124,58,237,0.2)",
              }}>{g.pattern}</p>
              <p style={{ fontWeight: 800, color: "#1e293b", fontSize: 20, marginBottom: 4 }}>{g.title}</p>
              <p style={{ fontSize: 15, color: "#64748b" }}>{g.meaning}</p>
            </div>

            <button onClick={() => setShowTip(!showTip)} style={{
              width: 56, height: 56, borderRadius: 18, border: "none",
              background: showTip ? "#fbbf24" : "#fef3c7",
              fontSize: 26, cursor: "pointer", flexShrink: 0,
              boxShadow: showTip ? "0 4px 16px #fbbf2444" : "none",
              transition: "all 0.2s",
            }}>💡</button>
          </div>

          {showTip && (
            <div style={{
              marginTop: 20, background: "rgba(255,255,255,0.85)",
              borderRadius: 16, padding: "16px 20px",
              border: "2px solid #fde68a", backdropFilter: "blur(8px)",
            }}>
              <p style={{ fontSize: 11, fontWeight: 800, color: "#d97706", marginBottom: 6, textTransform: "uppercase" }}>💡 Mẹo nhanh</p>
              <p style={{ fontSize: 14, color: "#1e293b", lineHeight: 1.7 }}>{g.quick_tip}</p>
            </div>
          )}
        </div>

        {/* Explanation */}
        <div style={{ ...S.card, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ width: 36, height: 36, background: "#f5f3ff", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🧠</div>
            <p style={{ fontWeight: 800, color: "#1e293b", fontSize: 15 }}>Giải thích</p>
          </div>
          <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.9 }}>{g.explanation}</p>
        </div>

        {/* Examples carousel */}
        <div style={{ ...S.card, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, background: "#fef3c7", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>📝</div>
              <p style={{ fontWeight: 800, color: "#1e293b", fontSize: 15 }}>Câu ví dụ ({activeEx + 1}/{g.examples.length})</p>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {g.examples.map((_, i) => (
                <button key={i} onClick={() => setActiveEx(i)} style={{
                  width: i === activeEx ? 28 : 10, height: 10,
                  borderRadius: 999, border: "none", cursor: "pointer",
                  background: i === activeEx ? "#9333ea" : "#e2e8f0",
                  transition: "all 0.25s",
                }} />
              ))}
            </div>
          </div>

          <div style={{ background: "linear-gradient(135deg,#fdf4ff,#f5f3ff)", borderRadius: 20, padding: "24px", borderLeft: "5px solid #9333ea", minHeight: 100 }}>
            <p style={{ fontFamily: "'Noto Sans JP',sans-serif", fontSize: 18, color: "#1e293b", fontWeight: 600, lineHeight: 1.8, marginBottom: 12 }}>
              {g.examples[activeEx].jp}
            </p>
            <p style={{ fontSize: 14, color: "#7c3aed", fontStyle: "italic" }}>🇻🇳 {g.examples[activeEx].vn}</p>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            <button onClick={() => setActiveEx(i => Math.max(0, i - 1))} disabled={activeEx === 0} style={{
              flex: 1, padding: "10px", borderRadius: 14, border: "2px solid #e2e8f0",
              background: "#fff", fontWeight: 700, fontSize: 14, color: "#64748b",
              cursor: activeEx === 0 ? "not-allowed" : "pointer", opacity: activeEx === 0 ? 0.4 : 1,
            }}>← Trước</button>
            <button onClick={() => setActiveEx(i => Math.min(g.examples.length - 1, i + 1))} disabled={activeEx === g.examples.length - 1} style={{
              flex: 1, padding: "10px", borderRadius: 14, border: "2px solid #e2e8f0",
              background: "#fff", fontWeight: 700, fontSize: 14, color: "#64748b",
              cursor: activeEx === g.examples.length - 1 ? "not-allowed" : "pointer",
              opacity: activeEx === g.examples.length - 1 ? 0.4 : 1,
            }}>Tiếp →</button>
          </div>
        </div>

        {/* Compare */}
        <div style={{ ...S.card, marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, background: "#fff1f2", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>⚖️</div>
            <p style={{ fontWeight: 800, color: "#1e293b", fontSize: 15 }}>So sánh mẫu tương tự</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {g.compare.map((c, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 14,
                background: "#f8fafc", borderRadius: 14, padding: "14px 18px",
                border: `2px solid ${c.color}22`,
              }}>
                <span style={{ fontFamily: "'Noto Sans JP',sans-serif", fontSize: 16, fontWeight: 800, color: c.color, minWidth: 80 }}>{c.pattern}</span>
                <span style={{ fontSize: 14, color: "#475569" }}>{c.meaning}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Save */}
        <button onClick={() => setSaved(!saved)} style={{
          width: "100%",
          background: saved ? "linear-gradient(135deg,#059669,#10b981)" : "linear-gradient(135deg,#9333ea,#7c3aed)",
          border: "none", borderRadius: 20, padding: "20px",
          color: "#fff", fontWeight: 800, fontSize: 16, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          boxShadow: saved ? "0 8px 32px #05996944" : "0 8px 32px #9333ea44",
          transition: "all 0.3s",
        }}>
          {saved ? "✅ Đã lưu vào Deck!" : "＋ Lưu vào Flashcard Deck"}
        </button>
      </div>
    </div>
  );
}

// ─── DEMO SWITCHER ────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("vocab");
  return (
    <div style={{ fontFamily: "'Inter',system-ui,sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800;900&family=Noto+Sans+JP:wght@400;500;700&display=swap'); *{box-sizing:border-box;margin:0;padding:0} button:active{transform:scale(0.97)}`}</style>

      {/* Floating tab switcher */}
      <div style={{
        position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
        background: "#1e293b", borderRadius: 999, padding: 6,
        display: "flex", gap: 4, zIndex: 999,
        boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
      }}>
        {[["vocab", "⚡ VocabularyDetail"], ["grammar", "📖 GrammarDetail"]].map(([id, label]) => (
          <button key={id} onClick={() => setPage(id)} style={{
            padding: "10px 20px", borderRadius: 999, border: "none",
            background: page === id ? "#6366f1" : "transparent",
            color: page === id ? "#fff" : "#94a3b8",
            fontWeight: 700, fontSize: 13, cursor: "pointer",
            transition: "all 0.2s",
          }}>{label}</button>
        ))}
      </div>

      {page === "vocab" ? <VocabularyDetail /> : <GrammarDetail />}
    </div>
  );
}
