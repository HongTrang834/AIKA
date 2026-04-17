import express from 'express';
import pool from '../db.js';

const router = express.Router();

// Get all vocabulary with pagination
router.get('/', async (req, res) => {
  try {
    const { category, limit = 20, offset = 0 } = req.query;

    let query = 'SELECT * FROM vocabulary';
    const params = [];

    if (category) {
      query += ' WHERE category = $1';
      params.push(category);
    }

    query += ' ORDER BY id LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    const result = await pool.query(query, params);
    
    const countResult = await pool.query('SELECT COUNT(*) as total FROM vocabulary');
    
    res.json({
      rows: result.rows,
      total: parseInt(countResult.rows[0].total),
    });
  } catch (error) {
    console.error('Vocab error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Search vocabulary by kanji, furigana, or meaning (MUST BE BEFORE /:id)
router.get('/search/query', async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q || q.length < 1) {
      return res.json({ results: [] });
    }

    const searchQuery = `%${q}%`;
    const result = await pool.query(
      `SELECT id, word, reading, meaning, category, level, example_sentence
       FROM vocabulary
       WHERE word ILIKE $1 OR reading ILIKE $1 OR meaning ILIKE $1
       LIMIT $2`,
      [searchQuery, limit]
    );

    res.json({ results: result.rows });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get vocabulary by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM vocabulary WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vocabulary not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Vocab error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get vocabulary categories
router.get('/categories', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT DISTINCT category FROM vocabulary WHERE category IS NOT NULL ORDER BY category'
    );
    res.json(result.rows.map(r => r.category));
  } catch (error) {
    console.error('Categories error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Search vocabulary by kanji, furigana, or meaning
router.get('/search/query', async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q || q.length < 1) {
      return res.json({ results: [] });
    }

    const searchQuery = `%${q}%`;
    const result = await pool.query(
      `SELECT id, kanji, furigana, pronunciation, meaning, example_sentence, category, n_level
       FROM vocabulary
       WHERE kanji ILIKE $1 OR furigana ILIKE $1 OR meaning ILIKE $1
       LIMIT $2`,
      [searchQuery, limit]
    );

    res.json({ results: result.rows });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
