import express from 'express';
import pool from '../db.js';

const router = express.Router();

// Get all grammar
router.get('/', async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;

    const query = 'SELECT * FROM grammar ORDER BY id LIMIT $1 OFFSET $2';
    const result = await pool.query(query, [limit, offset]);
    res.json(result.rows);
  } catch (error) {
    console.error('Grammar error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Search grammar by pattern or meaning (MUST BE BEFORE /:id)
router.get('/search/query', async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q || q.length < 1) {
      return res.json({ results: [] });
    }

    const searchQuery = `%${q}%`;
    const result = await pool.query(
      `SELECT id, pattern, meaning, explanation, example_sentence, level
       FROM grammar
       WHERE pattern ILIKE $1 OR meaning ILIKE $1 OR explanation ILIKE $1
       LIMIT $2`,
      [searchQuery, limit]
    );

    res.json({ results: result.rows });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get grammar by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM grammar WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Grammar not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Grammar error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Search grammar by pattern or meaning
router.get('/search/query', async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q || q.length < 1) {
      return res.json({ results: [] });
    }

    const searchQuery = `%${q}%`;
    const result = await pool.query(
      `SELECT id, pattern, meaning, explanation, example_sentence, category, n_level
       FROM grammar
       WHERE pattern ILIKE $1 OR meaning ILIKE $1 OR explanation ILIKE $1
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
