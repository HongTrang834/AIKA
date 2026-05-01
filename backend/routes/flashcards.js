import express from "express";
import pool from "../db.js";

const router = express.Router();

/**
 * FLASHCARD SYSTEM: USER PROGRESS ON GLOBAL DECKS
 * Users do not create cards or decks. 
 * Instead, the Admin populates Global Decks.
 * When a user studies a card, we track their personal progress (repetitions, interval, ease_factor).
 */

// Get flashcards for a specific deck (User Specific Progress)
router.get("/deck/:deckId", async (req, res) => {
  try {
    const userId = req.userId;
    const { deckId } = req.params;

    const deckResult = await pool.query(
      `SELECT id, is_global FROM flashcard_decks
       WHERE id = $1 AND (is_global = true OR user_id = $2)`,
      [deckId, userId]
    );

    if (deckResult.rows.length === 0) {
      return res.status(404).json({ error: "Deck not found" });
    }

    const deck = deckResult.rows[0];

    // If this is a global deck, ensure the user has progress rows for all template cards.
    // Template cards are stored as flashcards with user_id IS NULL.
    if (deck.is_global) {
      await pool.query(
        `
        INSERT INTO flashcards (user_id, vocab_id, grammar_id, deck_id)
        SELECT
          $1 as user_id,
          t.vocab_id,
          t.grammar_id,
          t.deck_id
        FROM flashcards t
        WHERE t.deck_id = $2
          AND t.user_id IS NULL
          AND NOT EXISTS (
            SELECT 1
            FROM flashcards f
            WHERE f.user_id = $1
              AND f.deck_id = t.deck_id
              AND (
                (t.vocab_id IS NOT NULL AND f.vocab_id = t.vocab_id)
                OR
                (t.grammar_id IS NOT NULL AND f.grammar_id = t.grammar_id)
              )
          )
        `,
        [userId, deckId]
      );
    }

    const result = await pool.query(
      `SELECT 
        f.id,
        f.user_id,
        f.vocab_id,
        f.grammar_id,
        f.deck_id,
        f.interval,
        f.repetitions,
        f.ease_factor,
        f.next_review_date,
        COALESCE(v.word, g.pattern) as word,
        COALESCE(v.reading, g.title) as reading,
        COALESCE(v.meaning, g.meaning) as meaning,
        COALESCE(v.example_sentence, g.example_sentence) as example,
        COALESCE(v.example_translation, g.example_translation) as example_meaning,
        g.explanation,
        d.name as deck_name
      FROM flashcards f
      LEFT JOIN vocabulary v ON f.vocab_id = v.id
      LEFT JOIN grammar g ON f.grammar_id = g.id
      LEFT JOIN flashcard_decks d ON f.deck_id = d.id
      WHERE f.user_id = $1 AND f.deck_id = $2
      ORDER BY f.next_review_date`,
      [userId, deckId]
    );

    res.json({ rows: result.rows });
  } catch (error) {
    console.error("Flashcards error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Add a word/grammar to a deck (Personal progress entry)
router.post("/add", async (req, res) => {
  try {
    const userId = req.userId;
    const { vocab_id, grammar_id, deck_id } = req.body;

    if (!deck_id) {
      return res.status(400).json({ error: "deck_id is required" });
    }

    if (!vocab_id && !grammar_id) {
      return res.status(400).json({ error: "vocab_id or grammar_id is required" });
    }

    const deckResult = await pool.query(
      `SELECT id FROM flashcard_decks
       WHERE id = $1 AND (is_global = true OR user_id = $2)`,
      [deck_id, userId]
    );

    if (deckResult.rows.length === 0) {
      return res.status(404).json({ error: "Deck not found" });
    }

    // Check if it already exists for this user in this deck
    const existing = await pool.query(
      `SELECT id FROM flashcards WHERE user_id = $1 AND deck_id = $2 AND 
       (vocab_id = $3 OR grammar_id = $4)`,
      [userId, deck_id, vocab_id || null, grammar_id || null]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "Already in this deck" });
    }

    const result = await pool.query(
      `INSERT INTO flashcards (user_id, vocab_id, grammar_id, deck_id) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [userId, vocab_id || null, grammar_id || null, deck_id]
    );

    res.status(201).json({ flashcard: result.rows[0] });
  } catch (error) {
    console.error("Add flashcard error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Update flashcard review (SM-2 Algorithm)
router.patch("/:id", async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { quality } = req.body; // 0-5

    const card = await pool.query(
      "SELECT * FROM flashcards WHERE id = $1 AND user_id = $2",
      [id, userId]
    );

    if (card.rows.length === 0) {
      return res.status(404).json({ error: "Flashcard not found" });
    }

    let { interval, repetitions, ease_factor } = card.rows[0];

    if (quality < 3) {
      repetitions = 0;
      interval = 1;
    } else {
      repetitions += 1;
      if (repetitions === 1) {
        interval = 1;
      } else if (repetitions === 2) {
        interval = 3;
      } else {
        interval = Math.round(interval * ease_factor);
      }
    }

    ease_factor = Math.max(1.3, ease_factor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + interval);

    const result = await pool.query(
      `UPDATE flashcards 
       SET interval = $1, repetitions = $2, ease_factor = $3, next_review_date = $4
       WHERE id = $5 AND user_id = $6
       RETURNING *`,
      [interval, repetitions, ease_factor, nextReview, id, userId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Update flashcard error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Delete flashcard
router.delete("/:id", async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    await pool.query("DELETE FROM flashcards WHERE id = $1 AND user_id = $2", [id, userId]);
    res.json({ message: "Flashcard removed from deck" });
  } catch (error) {
    console.error("Delete flashcard error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
