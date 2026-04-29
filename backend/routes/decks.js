import express from "express";
import pool from "../db.js";

const router = express.Router();

// Get global decks (created and managed by admin)
router.get("/", async (req, res) => {
    try {
        const userId = req.userId;

        const result = await pool.query(
            `SELECT d.id, d.name, d.description, d.color, d.is_global, d.created_at,
                    (SELECT COUNT(*) FROM flashcards f WHERE f.deck_id = d.id AND f.user_id IS NULL) as card_count,
                    (SELECT COUNT(*) FROM flashcards f WHERE f.deck_id = d.id AND f.user_id = $1) as user_card_count
             FROM flashcard_decks d
             WHERE d.is_global = true
             ORDER BY d.created_at DESC`,
            [userId]
        );

        res.json({ rows: result.rows });
    } catch (error) {
        console.error("Error fetching decks:", error);
        res.status(500).json({ error: error.message });
    }
});

// Get current user's personal decks
router.get("/my", async (req, res) => {
    try {
        const userId = req.userId;
        const result = await pool.query(
            `SELECT d.id, d.name, d.description, d.color, d.is_global, d.created_at,
                    COUNT(f.id)::int as card_count
             FROM flashcard_decks d
             LEFT JOIN flashcards f ON f.deck_id = d.id AND f.user_id = $1
             WHERE d.user_id = $1 AND d.is_global = false
             GROUP BY d.id
             ORDER BY d.created_at DESC`,
            [userId]
        );

        res.json({ rows: result.rows });
    } catch (error) {
        console.error("Error fetching personal decks:", error);
        res.status(500).json({ error: error.message });
    }
});

// Create a personal deck for current user
router.post("/", async (req, res) => {
    try {
        const userId = req.userId;
        const { name, description = "", color = "blue" } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ error: "Deck name is required" });
        }

        const result = await pool.query(
            `INSERT INTO flashcard_decks (user_id, name, description, color, is_global)
             VALUES ($1, $2, $3, $4, false)
             RETURNING id, name, description, color, is_global, created_at`,
            [userId, name.trim(), description, color]
        );
        res.json({ deck: result.rows[0] });
    } catch (error) {
        if (error.code === "23505") {
            return res.status(400).json({ error: "You already have a deck with this name" });
        }
        console.error("Error creating personal deck:", error);
        res.status(500).json({ error: error.message });
    }
});

// Delete a personal deck that belongs to current user
router.delete("/:id", async (req, res) => {
    try {
        const userId = req.userId;
        const deckId = req.params.id;

        const result = await pool.query(
            "DELETE FROM flashcard_decks WHERE id = $1 AND user_id = $2 AND is_global = false RETURNING id",
            [deckId, userId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Deck not found" });
        }

        res.json({ message: "Deck deleted successfully" });
    } catch (error) {
        console.error("Error deleting deck:", error);
        res.status(500).json({ error: error.message });
    }
});

// Update a personal deck that belongs to current user
router.put("/:id", async (req, res) => {
    try {
        const userId = req.userId;
        const deckId = req.params.id;
        const { name, description, color } = req.body;

        const result = await pool.query(
            `UPDATE flashcard_decks 
             SET name = COALESCE($1, name), 
                 description = COALESCE($2, description),
                 color = COALESCE($3, color),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $4 AND user_id = $5 AND is_global = false
             RETURNING id, name, description, color, is_global`,
            [name, description, color, deckId, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Deck not found" });
        }

        res.json({ deck: result.rows[0] });
    } catch (error) {
        console.error("Error updating deck:", error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
