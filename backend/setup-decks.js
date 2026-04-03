import pool from './db.js';

async function createDecksTable() {
  const client = await pool.connect();
  try {
    console.log('Creating flashcard_decks table...');
    
    await client.query(`
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

    await client.query(`
      ALTER TABLE flashcards ADD COLUMN IF NOT EXISTS deck_id INT
    `);
    console.log('✅ Added deck_id column');

    try {
      await client.query(`
        ALTER TABLE flashcards 
        ADD CONSTRAINT fk_flashcard_deck 
        FOREIGN KEY (deck_id) REFERENCES flashcard_decks(id) ON DELETE CASCADE
      `);
      console.log('✅ Added foreign key');
    } catch (e) {
      console.log('ℹ️  Foreign key already exists');
    }

    await client.query(`CREATE INDEX IF NOT EXISTS idx_deck_user_id ON flashcard_decks(user_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_flashcard_deck_id ON flashcards(deck_id)`);
    console.log('✅ Created indexes');

    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    client.release();
  }
}

createDecksTable();
