-- Add flashcard_decks table
CREATE TABLE IF NOT EXISTS flashcard_decks (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    color VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, name)
);

-- Add deck_id to flashcards table if not exists
ALTER TABLE flashcards ADD COLUMN IF NOT EXISTS deck_id INT;

-- Add foreign key constraint if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_flashcard_deck'
    ) THEN
        ALTER TABLE flashcards 
        ADD CONSTRAINT fk_flashcard_deck 
        FOREIGN KEY (deck_id) REFERENCES flashcard_decks(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_deck_user_id ON flashcard_decks(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_deck_id ON flashcards(deck_id);

-- Add default decks for existing users
INSERT INTO flashcard_decks (user_id, name, description, color)
SELECT id, 'N2 Vocabulary', 'Vocabulary for N2 level', 'blue' FROM users
WHERE NOT EXISTS (
    SELECT 1 FROM flashcard_decks WHERE flashcard_decks.user_id = users.id AND name = 'N2 Vocabulary'
)
ON CONFLICT DO NOTHING;

INSERT INTO flashcard_decks (user_id, name, description, color)
SELECT id, 'Kanji Practice', 'Kanji characters and compounds', 'red' FROM users
WHERE NOT EXISTS (
    SELECT 1 FROM flashcard_decks WHERE flashcard_decks.user_id = users.id AND name = 'Kanji Practice'
)
ON CONFLICT DO NOTHING;

INSERT INTO flashcard_decks (user_id, name, description, color)
SELECT id, 'Grammar Patterns', 'Common grammar patterns', 'green' FROM users
WHERE NOT EXISTS (
    SELECT 1 FROM flashcard_decks WHERE flashcard_decks.user_id = users.id AND name = 'Grammar Patterns'
)
ON CONFLICT DO NOTHING;

INSERT INTO flashcard_decks (user_id, name, description, color)
SELECT id, 'Review', 'General review deck', 'purple' FROM users
WHERE NOT EXISTS (
    SELECT 1 FROM flashcard_decks WHERE flashcard_decks.user_id = users.id AND name = 'Review'
)
ON CONFLICT DO NOTHING;
