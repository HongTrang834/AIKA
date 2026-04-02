import express from 'express';
import bcrypt from 'bcryptjs';
import { generateToken } from '../auth.js';
import pool from '../db.js';

const router = express.Router();

// Register User
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, full_name } = req.body;

    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if user exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const result = await pool.query(
      'INSERT INTO users (username, email, password_hash, full_name) VALUES ($1, $2, $3, $4) RETURNING id, username, email',
      [username, email, hashedPassword, full_name || username]
    );

    const user = result.rows[0];
    const token = generateToken(user.id);

    // Create user progress record
    await pool.query(
      'INSERT INTO user_progress (user_id) VALUES ($1)',
      [user.id]
    );

    res.status(201).json({
      user,
      token,
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Login User
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Missing email or password' });
    }

    const result = await pool.query(
      'SELECT id, username, email, password_hash FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user.id);

    res.json({
      user: { id: user.id, username: user.username, email: user.email },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get User Profile
router.get('/profile', async (req, res) => {
  try {
    const userId = req.userId;

    const result = await pool.query(
      'SELECT id, username, email, full_name, avatar_url, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    // Get user progress
    const progressResult = await pool.query(
      'SELECT total_vocab_learned, total_grammar_learned, total_kaiwas, total_flashcard_reviews FROM user_progress WHERE user_id = $1',
      [userId]
    );

    res.json({
      ...user,
      progress: progressResult.rows[0] || {},
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Update User Profile
router.put('/profile', async (req, res) => {
  try {
    const userId = req.userId;
    const { full_name, avatar_url } = req.body;

    const result = await pool.query(
      'UPDATE users SET full_name = COALESCE($1, full_name), avatar_url = COALESCE($2, avatar_url), updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING id, username, email, full_name, avatar_url',
      [full_name || null, avatar_url || null, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
