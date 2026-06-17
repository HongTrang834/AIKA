import express from 'express';
import pool from '../db.js';

const router = express.Router();

// Get conversation history for user
router.get('/history', async (req, res) => {
  try {
    const userId = req.userId;
    const { mode, limit = 50 } = req.query;

    let query = 'SELECT * FROM conversation_history WHERE user_id = $1';
    const params = [userId];

    if (mode) {
      query += ' AND mode = $2';
      params.push(mode);
    }

    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1);
    params.push(limit);

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
// Save conversation message
router.post('/save', async (req, res) => {
  try {
    const userId = req.userId;
    const { mode, user_message, ai_response, grammar_errors } = req.body;

    if (!user_message || !ai_response) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await pool.query(
      'INSERT INTO conversation_history (user_id, mode, user_message, ai_response, grammar_errors) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [userId, mode || 'free', user_message, ai_response, JSON.stringify(grammar_errors || [])]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Save conversation error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
