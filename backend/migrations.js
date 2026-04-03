import pool from './db.js';

export async function runMigrations() {
  try {
    console.log('🔄 Running database migrations...');
    
    // Create flashcard_decks table if not exists
    const decksTableSQL = `
      CREATE TABLE IF NOT EXISTS flashcard_decks (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        color VARCHAR(50) DEFAULT 'blue',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, name)
      );
      
      CREATE INDEX IF NOT EXISTS idx_deck_user_id ON flashcard_decks(user_id);
    `;
    
    // Add deck_id column to flashcards if not exists
    const flashcardsAlterSQL = `
      ALTER TABLE flashcards 
      ADD COLUMN IF NOT EXISTS deck_id INTEGER REFERENCES flashcard_decks(id) ON DELETE SET NULL;
      
      CREATE INDEX IF NOT EXISTS idx_flashcard_deck_id ON flashcards(deck_id);
    `;
    
    // Execute migrations
    await pool.query(decksTableSQL);
    console.log('✅ flashcard_decks table ready');
    
    await pool.query(flashcardsAlterSQL);
    console.log('✅ flashcards.deck_id column ready');
    
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    // Continue anyway - app can work with mock decks
  }
}
