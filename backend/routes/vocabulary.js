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

export default router;
