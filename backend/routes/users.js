import express from 'express';
import bcrypt from 'bcryptjs';
import { generateToken, authMiddleware } from '../auth.js';
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
      'INSERT INTO users (username, email, password_hash, full_name, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, email, role, full_name, avatar_url',
      [username, email, hashedPassword, full_name || username, 'student']
    );

    const user = result.rows[0];
    const token = generateToken(user.id, user.role);

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
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
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
      'SELECT id, username, email, password_hash, role, full_name, avatar_url FROM users WHERE email = $1',
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

    const token = generateToken(user.id, user.role);

    console.log('Login successful for user:', {
      id: user.id,
      username: user.username,
      avatar_url: user.avatar_url ? user.avatar_url.substring(0, 50) + '...' : 'null'
    });

    res.json({
      user: { id: user.id, username: user.username, email: user.email, role: user.role, full_name: user.full_name, avatar_url: user.avatar_url },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

// Get User Profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    
    console.log('GET /profile - userId from token:', userId);
    console.log('Authorization header:', req.headers.authorization?.substring(0, 20) + '...');

    if (!userId) {
      return res.status(401).json({ error: 'User ID not found in token' });
    }

    const result = await pool.query(
      'SELECT id, username, email, full_name, avatar_url, created_at, role FROM users WHERE id = $1',
      [userId]
    );

    console.log('Database query result:', result.rows.length > 0 ? 'Found user' : 'No user found');

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    
    console.log('User found:', {
      id: user.id,
      username: user.username,
      avatar_url: user.avatar_url ? user.avatar_url.substring(0, 50) + '...' : 'null'
    });

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
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

// Update User Profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const { full_name, avatar_url } = req.body;

    console.log('PUT /profile - userId:', userId);
    console.log('Updating with full_name:', full_name);
    console.log('Avatar URL size:', avatar_url ? avatar_url.length : 0, 'bytes');

    // Build dynamic UPDATE statement
    let updates = [];
    let params = [];
    let paramIndex = 1;

    if (full_name !== undefined && full_name !== null) {
      updates.push(`full_name = $${paramIndex}`);
      params.push(full_name);
      paramIndex++;
    }

    if (avatar_url !== undefined && avatar_url !== null) {
      updates.push(`avatar_url = $${paramIndex}`);
      params.push(avatar_url);
      paramIndex++;
    }

    // Always update the updated_at timestamp
    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    if (updates.length === 1) {
      // Only updated_at, no need to update
      return res.json({ id: userId, username: '', email: '', full_name: '', avatar_url: '' });
    }

    params.push(userId);

    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING id, username, email, full_name, avatar_url`;
    
    console.log('Update query:', query);
    console.log('Query params count:', params.length);
    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updatedUser = result.rows[0];
    console.log('Update result - avatar_url saved:', updatedUser.avatar_url ? updatedUser.avatar_url.substring(0, 50) + '...' : 'null');
    console.log('Update result - full_name:', updatedUser.full_name);

    // Verify by querying again
    const verifyResult = await pool.query(
      'SELECT id, avatar_url FROM users WHERE id = $1',
      [userId]
    );
    console.log('Verification query - avatar_url in DB:', verifyResult.rows[0].avatar_url ? verifyResult.rows[0].avatar_url.substring(0, 50) + '...' : 'null');

    res.json(updatedUser);
  } catch (error) {
    console.error('Update profile error:', error.message);
    console.error('Error details:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

// Change Password
router.post('/change-password', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const { old_password, new_password, confirm_password } = req.body;

    // Validate input
    if (!old_password || !new_password || !confirm_password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if new passwords match
    if (new_password !== confirm_password) {
      return res.status(400).json({ error: 'New passwords do not match' });
    }

    // Check password length
    if (new_password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Get user's current password hash
    const userResult = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify old password
    const user = userResult.rows[0];
    const passwordMatch = await bcrypt.compare(old_password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Old password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(new_password, 10);

    // Update password
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedPassword, userId]
    );

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Update User Progress
// Types: 'vocab', 'grammar', 'kaiwa', 'flashcard'
// Body: { type, increment (optional, default 1) }
router.post('/progress', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const { type, increment = 1 } = req.body;

    // Validate type
    const validTypes = {
      'vocab': 'total_vocab_learned',
      'grammar': 'total_grammar_learned',
      'kaiwa': 'total_kaiwas',
      'flashcard': 'total_flashcard_reviews'
    };

    if (!validTypes[type]) {
      return res.status(400).json({ error: 'Invalid progress type. Must be: vocab, grammar, kaiwa, flashcard' });
    }

    const columnName = validTypes[type];

    // Increment the progress value
    const result = await pool.query(
      `UPDATE user_progress 
       SET ${columnName} = ${columnName} + $1, last_activity = CURRENT_TIMESTAMP 
       WHERE user_id = $2 
       RETURNING total_vocab_learned, total_grammar_learned, total_kaiwas, total_flashcard_reviews`,
      [increment, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User progress not found' });
    }

    console.log(`User ${userId} - ${type} progress updated by +${increment}:`, result.rows[0]);

    res.json({
      message: `${type} progress updated`,
      progress: result.rows[0]
    });
  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Bulk update progress (for multiple types at once)
// Body: { vocab: 1, grammar: 0, kaiwa: 1, flashcard: 0 }
router.post('/progress/bulk', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const { vocab = 0, grammar = 0, kaiwa = 0, flashcard = 0 } = req.body;

    // Build dynamic update query
    let updates = ['last_activity = CURRENT_TIMESTAMP'];
    let params = [];
    let paramIndex = 1;

    if (vocab > 0) {
      updates.push(`total_vocab_learned = total_vocab_learned + $${paramIndex}`);
      params.push(vocab);
      paramIndex++;
    }

    if (grammar > 0) {
      updates.push(`total_grammar_learned = total_grammar_learned + $${paramIndex}`);
      params.push(grammar);
      paramIndex++;
    }

    if (kaiwa > 0) {
      updates.push(`total_kaiwas = total_kaiwas + $${paramIndex}`);
      params.push(kaiwa);
      paramIndex++;
    }

    if (flashcard > 0) {
      updates.push(`total_flashcard_reviews = total_flashcard_reviews + $${paramIndex}`);
      params.push(flashcard);
      paramIndex++;
    }

    params.push(userId);

    const result = await pool.query(
      `UPDATE user_progress 
       SET ${updates.join(', ')} 
       WHERE user_id = $${paramIndex} 
       RETURNING total_vocab_learned, total_grammar_learned, total_kaiwas, total_flashcard_reviews`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User progress not found' });
    }

    console.log(`User ${userId} - bulk progress updated:`, { vocab, grammar, kaiwa, flashcard }, 'Result:', result.rows[0]);

    res.json({
      message: 'Progress updated',
      progress: result.rows[0]
    });
  } catch (error) {
    console.error('Bulk update progress error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
