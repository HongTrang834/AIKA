import express from 'express';
import { adminMiddleware } from '../auth.js';
import pool from '../db.js';

const router = express.Router();

// ======================== VOCABULARY ADMIN ========================

// GET all vocabulary (with pagination)
router.get('/vocabulary', adminMiddleware, async (req, res) => {
  try {
    const limit = req.query.limit || 10;
    const offset = req.query.offset || 0;

    const result = await pool.query(
      'SELECT * FROM vocabulary ORDER BY id DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );

    const countResult = await pool.query('SELECT COUNT(*) FROM vocabulary');

    res.json({
      rows: result.rows,
      total: parseInt(countResult.rows[0].count),
    });
  } catch (error) {
    console.error('Error fetching vocabulary:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// CREATE vocabulary
router.post('/vocabulary', adminMiddleware, async (req, res) => {
  try {
    const { word, reading, meaning, category, level, example_sentence } = req.body;

    if (!word || !reading || !meaning) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await pool.query(
      'INSERT INTO vocabulary (word, reading, meaning, category, level, example_sentence) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [word, reading, meaning, category || null, level || 2, example_sentence || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating vocabulary:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// UPDATE vocabulary
router.put('/vocabulary/:id', adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { word, reading, meaning, category, level, example_sentence } = req.body;

    const result = await pool.query(
      'UPDATE vocabulary SET word = $1, reading = $2, meaning = $3, category = $4, level = $5, example_sentence = $6 WHERE id = $7 RETURNING *',
      [word, reading, meaning, category, level, example_sentence, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vocabulary not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating vocabulary:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// DELETE vocabulary
router.delete('/vocabulary/:id', adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM vocabulary WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vocabulary not found' });
    }

    res.json({ message: 'Vocabulary deleted successfully' });
  } catch (error) {
    console.error('Error deleting vocabulary:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ======================== GRAMMAR ADMIN ========================

// GET all grammar
router.get('/grammar', adminMiddleware, async (req, res) => {
  try {
    const limit = req.query.limit || 10;
    const offset = req.query.offset || 0;

    const result = await pool.query(
      'SELECT * FROM grammar ORDER BY id DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );

    const countResult = await pool.query('SELECT COUNT(*) FROM grammar');

    res.json({
      rows: result.rows,
      total: parseInt(countResult.rows[0].count),
    });
  } catch (error) {
    console.error('Error fetching grammar:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// CREATE grammar
router.post('/grammar', adminMiddleware, async (req, res) => {
  try {
    const { title, pattern, explanation, meaning, example_sentence, level } = req.body;

    if (!title || !pattern || !explanation || !meaning) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await pool.query(
      'INSERT INTO grammar (title, pattern, explanation, meaning, example_sentence, level) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [title, pattern, explanation, meaning, example_sentence || null, level || 2]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating grammar:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// UPDATE grammar
router.put('/grammar/:id', adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, pattern, explanation, meaning, example_sentence, level } = req.body;

    const result = await pool.query(
      'UPDATE grammar SET title = $1, pattern = $2, explanation = $3, meaning = $4, example_sentence = $5, level = $6 WHERE id = $7 RETURNING *',
      [title, pattern, explanation, meaning, example_sentence, level, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Grammar not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating grammar:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// DELETE grammar
router.delete('/grammar/:id', adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM grammar WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Grammar not found' });
    }

    res.json({ message: 'Grammar deleted successfully' });
  } catch (error) {
    console.error('Error deleting grammar:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ======================== SCENARIOS ADMIN ========================

// GET all scenarios
router.get('/scenarios', adminMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM scenarios ORDER BY id DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching scenarios:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// CREATE scenario
router.post('/scenarios', adminMiddleware, async (req, res) => {
  try {
    const { title, description, context, example_conversation, difficulty_level } = req.body;

    if (!title || !context) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await pool.query(
      'INSERT INTO scenarios (title, description, context, example_conversation, difficulty_level) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [title, description || null, context, example_conversation || null, difficulty_level || 2]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating scenario:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// UPDATE scenario
router.put('/scenarios/:id', adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, context, example_conversation, difficulty_level } = req.body;

    const result = await pool.query(
      'UPDATE scenarios SET title = $1, description = $2, context = $3, example_conversation = $4, difficulty_level = $5 WHERE id = $6 RETURNING *',
      [title, description, context, example_conversation, difficulty_level, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Scenario not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating scenario:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// DELETE scenario
router.delete('/scenarios/:id', adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM scenarios WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Scenario not found' });
    }

    res.json({ message: 'Scenario deleted successfully' });
  } catch (error) {
    console.error('Error deleting scenario:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
