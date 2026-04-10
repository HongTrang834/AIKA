import express from 'express';
import pool from '../db.js';
import { authMiddleware } from '../auth.js';

const router = express.Router();

// GET user progress
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;

    // Get or create user_progress
    const result = await pool.query(
      `SELECT 
        id,
        user_id,
        total_vocab_learned,
        total_grammar_learned,
        total_kaiwas,
        total_flashcard_reviews,
        last_activity,
        created_at
      FROM user_progress
      WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      // Create default progress if doesn't exist
      const createResult = await pool.query(
        `INSERT INTO user_progress (user_id, total_vocab_learned, total_grammar_learned, total_kaiwas, total_flashcard_reviews)
        VALUES ($1, 0, 0, 0, 0)
        RETURNING id, user_id, total_vocab_learned, total_grammar_learned, total_kaiwas, total_flashcard_reviews, last_activity, created_at`,
        [userId]
      );
      return res.json(createResult.rows[0]);
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching progress:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update vocab count
router.post('/vocab-add/:count', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const count = parseInt(req.params.count) || 1;

    const result = await pool.query(
      `UPDATE user_progress
      SET total_vocab_learned = total_vocab_learned + $1,
          last_activity = CURRENT_TIMESTAMP
      WHERE user_id = $2
      RETURNING total_vocab_learned`,
      [count, userId]
    );

    if (result.rows.length === 0) {
      // Create if not exists
      await pool.query(
        `INSERT INTO user_progress (user_id, total_vocab_learned) VALUES ($1, $2)`,
        [userId, count]
      );
    }

    res.json({ success: true, total_vocab_learned: result.rows[0]?.total_vocab_learned || count });
  } catch (error) {
    console.error('Error updating vocab progress:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update grammar count
router.post('/grammar-add/:count', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const count = parseInt(req.params.count) || 1;

    const result = await pool.query(
      `UPDATE user_progress
      SET total_grammar_learned = total_grammar_learned + $1,
          last_activity = CURRENT_TIMESTAMP
      WHERE user_id = $2
      RETURNING total_grammar_learned`,
      [count, userId]
    );

    if (result.rows.length === 0) {
      await pool.query(
        `INSERT INTO user_progress (user_id, total_grammar_learned) VALUES ($1, $2)`,
        [userId, count]
      );
    }

    res.json({ success: true, total_grammar_learned: result.rows[0]?.total_grammar_learned || count });
  } catch (error) {
    console.error('Error updating grammar progress:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update kaiwa count
router.post('/kaiwa-add/:count', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const count = parseInt(req.params.count) || 1;

    const result = await pool.query(
      `UPDATE user_progress
      SET total_kaiwas = total_kaiwas + $1,
          last_activity = CURRENT_TIMESTAMP
      WHERE user_id = $2
      RETURNING total_kaiwas`,
      [count, userId]
    );

    if (result.rows.length === 0) {
      await pool.query(
        `INSERT INTO user_progress (user_id, total_kaiwas) VALUES ($1, $2)`,
        [userId, count]
      );
    }

    res.json({ success: true, total_kaiwas: result.rows[0]?.total_kaiwas || count });
  } catch (error) {
    console.error('Error updating kaiwa progress:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update flashcard reviews count
router.post('/flashcard-review/:count', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const count = parseInt(req.params.count) || 1;

    const result = await pool.query(
      `UPDATE user_progress
      SET total_flashcard_reviews = total_flashcard_reviews + $1,
          last_activity = CURRENT_TIMESTAMP
      WHERE user_id = $2
      RETURNING total_flashcard_reviews`,
      [count, userId]
    );

    if (result.rows.length === 0) {
      await pool.query(
        `INSERT INTO user_progress (user_id, total_flashcard_reviews) VALUES ($1, $2)`,
        [userId, count]
      );
    }

    res.json({ success: true, total_flashcard_reviews: result.rows[0]?.total_flashcard_reviews || count });
  } catch (error) {
    console.error('Error updating flashcard reviews:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
