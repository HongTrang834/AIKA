import express from 'express';
import pool from '../db.js';

const router = express.Router();

// Get user flashcards (including global flashcards)
router.get('/', async (req, res) => {
  try {
    const userId = req.userId;
    console.log(`📚 Fetching flashcards for user ${userId}`);
    
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
        f.created_at,
        v.word,
        v.reading,
        v.meaning,
        COALESCE(d.name, 'No Deck') as deck_name,
        COALESCE(d.color, 'blue') as deck_color,
        COALESCE(d.is_global, FALSE) as deck_is_global
      FROM flashcards f
      LEFT JOIN vocabulary v ON f.vocab_id = v.id
      LEFT JOIN flashcard_decks d ON f.deck_id = d.id
      WHERE f.user_id = $1
         OR (f.user_id IS NULL AND d.is_global = TRUE)
      ORDER BY COALESCE(d.name, 'No Deck'), f.next_review_date`,
      [userId]
    );

    console.log(`✅ Found ${result.rows.length} flashcards for user ${userId}`);
    result.rows.forEach((fc) => {
      console.log(`  • ${fc.word} (${fc.meaning}) - deck: ${fc.deck_name}, user_id: ${fc.user_id}`);
    });

    res.json({ rows: result.rows });
  } catch (error) {
    console.error('❌ Flashcards error:', error);
    // Fallback for when flashcard_decks table doesn't exist
    try {
      const fallbackResult = await pool.query(
        'SELECT * FROM flashcards WHERE user_id = $1 ORDER BY next_review_date',
        [userId]
      );
      res.json({ rows: fallbackResult.rows });
    } catch (fallbackError) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
});

// Create flashcard from vocabulary or grammar
router.post('/', async (req, res) => {
  try {
    const userId = req.userId;
    const { vocab_id, grammar_id, deck_id } = req.body;

    if (!vocab_id && !grammar_id) {
      return res.status(400).json({ error: 'vocab_id or grammar_id is required' });
    }

    let finalDeckId = deck_id;

    // If deck_id provided, verify it belongs to user
    if (finalDeckId) {
      try {
        const deckCheck = await pool.query(
          'SELECT id FROM flashcard_decks WHERE id = $1 AND user_id = $2',
          [finalDeckId, userId]
        );

        if (deckCheck.rows.length === 0) {
          return res.status(403).json({ error: 'Deck not found' });
        }
      } catch (e) {
        // flashcard_decks table might not exist yet
        console.log('Note: flashcard_decks table might not exist yet');
        finalDeckId = null;
      }
    }

    const result = await pool.query(
      'INSERT INTO flashcards (user_id, vocab_id, grammar_id, deck_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [userId, vocab_id || null, grammar_id || null, finalDeckId || null]
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
