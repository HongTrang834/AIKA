import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import pool from "./db.js";
import { runMigrations } from "./migrations.js";
import { authMiddleware } from "./auth.js";
import usersRouter from "./routes/users.js";
import vocabularyRouter from "./routes/vocabulary.js";
import grammarRouter from "./routes/grammar.js";
import flashcardsRouter from "./routes/flashcards.js";
import decksRouter from "./routes/decks.js";
import conversationRouter from "./routes/conversation.js";
import testsRouter from "./routes/tests.js";
import adminRouter from "./routes/admin.js";
import kaiwaRouter from "./routes/kaiwa.js";
import progressRouter from "./routes/progress.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test database connection
pool.query("SELECT NOW()", (err) => {
  if (err) {
    console.error("❌ Database connection failed:", err.message);
  } else {
    console.log("✅ Database connected successfully");
  }
});

const app = express();
const PORT = process.env.PORT || 3000;

// Run database migrations
await runMigrations();

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors({
  origin: "*",
  credentials: true,
}));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", database: !!process.env.DATABASE_URL });
});

// Debug endpoint to check database state
app.get("/api/debug/user/:userId", authMiddleware, async (req, res) => {
  try {
    const userId = req.params.userId || req.userId;
    const result = await pool.query(
      'SELECT id, username, email, full_name, avatar_url, created_at FROM users WHERE id = $1',
      [userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const user = result.rows[0];
    res.json({
      ...user,
      avatar_url: user.avatar_url ? user.avatar_url.substring(0, 100) + '...' : null
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============ PUBLIC ROUTES ============
app.use("/api/users", usersRouter);

// ============ ADMIN ROUTES (Protected) ============
app.use("/api/admin", adminRouter);

// ============ PROTECTED ROUTES ============
app.use("/api/vocabulary", vocabularyRouter);
app.use("/api/grammar", grammarRouter);

// Protected routes with auth middleware
app.use("/api/flashcards", authMiddleware, flashcardsRouter);
app.use("/api/decks", authMiddleware, decksRouter);
app.use("/api/conversation", authMiddleware, conversationRouter);
app.use("/api/kaiwa", authMiddleware, kaiwaRouter);
app.use("/api/progress", authMiddleware, progressRouter);
app.use("/api/tests", testsRouter);

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

if (!process.env.VERCEL) {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
      root: path.resolve(__dirname, "../frontend"),
    });
    app.use(vite.middlewares);
  } else {
    // Production: serve static files from dist
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;
