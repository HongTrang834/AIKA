import pool from './db.js';
import fs from 'fs';

async function runMigration() {
  try {
    console.log('Starting database migration...');
    
    // Create flashcard_decks table
    await pool.query(`
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
      )
    `);
    console.log('✅ Created flashcard_decks table');

    // Add deck_id column if not exists
    await pool.query(`
      ALTER TABLE flashcards ADD COLUMN IF NOT EXISTS deck_id INT
    `);
    console.log('✅ Added deck_id column to flashcards table');

    // Add foreign key constraint
    try {
      await pool.query(`
        ALTER TABLE flashcards 
        ADD CONSTRAINT fk_flashcard_deck 
        FOREIGN KEY (deck_id) REFERENCES flashcard_decks(id) ON DELETE CASCADE
      `);
      console.log('✅ Added foreign key constraint');
    } catch (e) {
      console.log('✅ Foreign key constraint already exists');
    }

    // Create indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_deck_user_id ON flashcard_decks(user_id)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_flashcard_deck_id ON flashcards(deck_id)
    `);
    console.log('✅ Created indexes');

    // Add default decks for existing users
    const decks = ['N2 Vocabulary', 'Kanji Practice', 'Grammar Patterns', 'Review'];
    const colors = ['blue', 'red', 'green', 'purple'];

    for (let i = 0; i < decks.length; i++) {
      await pool.query(`
        INSERT INTO flashcard_decks (user_id, name, description, color)
        SELECT id, $1, $2, $3 FROM users
        WHERE NOT EXISTS (
          SELECT 1 FROM flashcard_decks 
          WHERE flashcard_decks.user_id = users.id AND name = $1
        )
        ON CONFLICT DO NOTHING
      `, [decks[i], decks[i] + ' deck', colors[i]]);
    }
    console.log('✅ Added default decks for existing users');

    console.log('✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
