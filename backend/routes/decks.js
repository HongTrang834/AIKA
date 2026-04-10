import express from 'express';
import pool from '../db.js';

const router = express.Router();

// Get all decks for a user (global + personal)
router.get('/', async (req, res) => {
    try {
        const userId = req.userId;
        try {
            const result = await pool.query(
                `SELECT id, name, description, color, is_global,
                        (SELECT COUNT(*) FROM flashcards WHERE deck_id = flashcard_decks.id) as card_count
                 FROM flashcard_decks 
                 WHERE is_global = TRUE OR user_id = $1 
                 ORDER BY is_global DESC, created_at DESC`,
                [userId]
            );
            res.json({ rows: result.rows });
        } catch (tableError) {
            // flashcard_decks table might not exist yet
            console.log('Note: flashcard_decks table does not exist yet');
            res.json({ rows: [] });
        }
    } catch (error) {
        console.error('Error fetching decks:', error);
        res.status(500).json({ error: error.message });
    }
});

// Create a new deck
router.post('/', async (req, res) => {
    try {
        const userId = req.userId;
        const { name, description = '', color = 'blue' } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Deck name is required' });
        }

        try {
            const result = await pool.query(
                `INSERT INTO flashcard_decks (user_id, name, description, color)
                 VALUES ($1, $2, $3, $4)
                 RETURNING id, name, description, color, created_at`,
                [userId, name, description, color]
            );
            res.json({ deck: result.rows[0] });
        } catch (tableError) {
            // flashcard_decks table doesn't exist
            console.log('flashcard_decks table not ready. Please run migration.');
            res.status(503).json({ error: 'Database not initialized. Please run migration.' });
        }
    } catch (error) {
        if (error.code === '23505') {
            // Unique constraint violation
            return res.status(400).json({ error: 'Deck with this name already exists' });
        }
        console.error('Error creating deck:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete a deck (only personal decks)
router.delete('/:id', async (req, res) => {
    try {
        const userId = req.userId;
        const deckId = req.params.id;

        // Check if deck belongs to user and is not global
        const deckCheck = await pool.query(
            'SELECT user_id, is_global FROM flashcard_decks WHERE id = $1',
            [deckId]
        );

        if (deckCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Deck not found' });
        }

        // Only allow deletion of personal decks, not global ones
        if (deckCheck.rows[0].is_global) {
            return res.status(403).json({ error: 'Cannot delete global decks' });
        }

        if (deckCheck.rows[0].user_id !== userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        await pool.query('DELETE FROM flashcard_decks WHERE id = $1', [deckId]);
        res.json({ message: 'Deck deleted' });
    } catch (error) {
        console.error('Error deleting deck:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update a deck (only personal decks)
router.put('/:id', async (req, res) => {
    try {
        const userId = req.userId;
        const deckId = req.params.id;
        const { name, description, color } = req.body;

        // Check if deck belongs to user
        const deckCheck = await pool.query(
            'SELECT user_id, is_global FROM flashcard_decks WHERE id = $1',
            [deckId]
        );

        if (deckCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Deck not found' });
        }

        // Only allow update of personal decks
        if (deckCheck.rows[0].is_global) {
            return res.status(403).json({ error: 'Cannot modify global decks' });
        }

        if (deckCheck.rows[0].user_id !== userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const result = await pool.query(
            `UPDATE flashcard_decks 
             SET name = COALESCE($1, name), 
                 description = COALESCE($2, description),
                 color = COALESCE($3, color),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $4
             RETURNING id, name, description, color`,
            [name, description, color, deckId]
        );

        res.json({ deck: result.rows[0] });
    } catch (error) {
        console.error('Error updating deck:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
