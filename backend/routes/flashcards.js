import express from 'express';
import pool from '../db.js';

const router = express.Router();

// Get user flashcards
router.get('/', async (req, res) => {
  try {
    const userId = req.userId;
    const result = await pool.query(
      'SELECT * FROM flashcards WHERE user_id = $1 ORDER BY next_review_date',
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Flashcards error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Create flashcard from vocabulary or grammar
router.post('/', async (req, res) => {
  try {
    const userId = req.userId;
    const { vocab_id, grammar_id } = req.body;

    if (!vocab_id && !grammar_id) {
      return res.status(400).json({ error: 'vocab_id or grammar_id is required' });
    }

    const result = await pool.query(
      'INSERT INTO flashcards (user_id, vocab_id, grammar_id) VALUES ($1, $2, $3) RETURNING *',
      [userId, vocab_id || null, grammar_id || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create flashcard error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Update flashcard review (Spaced Repetition Algorithm)
router.patch('/:id', async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { quality } = req.body; // 0-5 (0=wrong, 5=perfect)

    // SM-2 Algorithm
    const card = await pool.query(
      'SELECT * FROM flashcards WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (card.rows.length === 0) {
      return res.status(404).json({ error: 'Flashcard not found' });
    }

    const flashcard = card.rows[0];
    let { interval, repetitions, ease_factor } = flashcard;

    if (quality < 3) {
      // Wrong answer
      repetitions = 0;
      interval = 1;
    } else {
      // Correct answer
      repetitions += 1;
      if (repetitions === 1) {
        interval = 1;
      } else if (repetitions === 2) {
        interval = 3;
      } else {
        interval = Math.round(interval * ease_factor);
      }
    }

    // Update EF
    ease_factor = Math.max(
      1.3,
      ease_factor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)
    );

    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + interval);

    const result = await pool.query(
      'UPDATE flashcards SET interval = $1, repetitions = $2, ease_factor = $3, next_review_date = $4 WHERE id = $5 RETURNING *',
      [interval, repetitions, ease_factor, nextReview, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update flashcard error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Delete flashcard
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM flashcards WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Flashcard not found' });
    }

    res.json({ message: 'Deleted' });
  } catch (error) {
    console.error('Delete flashcard error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
