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
import adminRouter from "./routes/admin.js";

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

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  // Run database migrations
  await runMigrations();

  // Middleware
  app.use(express.json());
  app.use(cors({
    origin: "*",
    credentials: true,
  }));

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", database: !!process.env.DATABASE_URL });
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

  // Error handler
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: "Internal Server Error" });
  });

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

startServer();
