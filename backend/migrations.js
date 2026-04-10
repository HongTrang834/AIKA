import pool from './db.js';

export async function runMigrations() {
  try {
    console.log('🔄 Running database migrations...');
    
    // Drop and recreate flashcard_decks table properly
    try {
      await pool.query('DROP TABLE IF EXISTS flashcard_decks CASCADE;');
      console.log('🔄 Dropped old flashcard_decks table');
      // Wait a moment to ensure drop is complete
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (err) {
      console.log('ℹ️ Error dropping flashcard_decks:', err.message.substring(0, 50));
    }
    
    // Create flashcard_decks table fresh with IF NOT EXISTS as fallback
    const decksTableSQL = `
      CREATE TABLE IF NOT EXISTS flashcard_decks (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        color VARCHAR(50) DEFAULT 'blue',
        is_global BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    // Create indexes separately (they can be created after table exists)
    const decksIndexesSQL = `
      CREATE INDEX IF NOT EXISTS idx_deck_user_id ON flashcard_decks(user_id);
      CREATE INDEX IF NOT EXISTS idx_deck_is_global ON flashcard_decks(is_global);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_deck_user_id_name_unique ON flashcard_decks(user_id, name) WHERE user_id IS NOT NULL;
    `;
    
    await pool.query(decksTableSQL);
    console.log('✅ flashcard_decks table ready');
    
    // Add indexes
    try {
      await pool.query(decksIndexesSQL);
      console.log('✅ flashcard_decks indexes created');
    } catch (indexErr) {
      console.log('ℹ️ Index creation note:', indexErr.message.substring(0, 50));
    }

    // Add deck_id column to flashcards (now that flashcard_decks exists)
    const flashcardsAlterSQL = `
      ALTER TABLE flashcards 
      ADD COLUMN IF NOT EXISTS deck_id INTEGER REFERENCES flashcard_decks(id) ON DELETE SET NULL;
      
      CREATE INDEX IF NOT EXISTS idx_flashcard_deck_id ON flashcards(deck_id);
    `;

    // Make user_id nullable for global flashcards
    const flashcardsUserIdAlterSQL = `
      ALTER TABLE flashcards 
      ALTER COLUMN user_id DROP NOT NULL;
    `;
    
    try {
      await pool.query(flashcardsAlterSQL);
      console.log('✅ flashcards.deck_id column ready');
    } catch (err) {
      console.log('ℹ️ flashcards.deck_id column note:', err.message.substring(0, 50));
    }

    // Add examples column to vocabulary for storing multiple examples
    const vocabularyAlterSQL = `
      ALTER TABLE vocabulary 
      ADD COLUMN IF NOT EXISTS examples TEXT;
      
      COMMENT ON COLUMN vocabulary.examples IS 'JSON array of example objects: [{"japanese":"...", "vietnamese":"..."}, ...]';
    `;

    // Add category and examples columns to grammar table for topic grouping and multiple examples
    const grammarAlterSQL = `
      ALTER TABLE grammar 
      ADD COLUMN IF NOT EXISTS category VARCHAR(100);
    `;

    const grammarExamplesSQL = `
      ALTER TABLE grammar
      ADD COLUMN IF NOT EXISTS examples TEXT;
    `;

    // Alter avatar_url column to support large base64 images
    const avatarUrlAlterSQL = `
      ALTER TABLE users
      ALTER COLUMN avatar_url TYPE TEXT;
    `;

    // Tests table for mini assessments
    const testsTableSQL = `
      CREATE TABLE IF NOT EXISTS tests (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        topic_type VARCHAR(50) NOT NULL DEFAULT 'vocabulary',
        description TEXT,
        total_questions INT DEFAULT 5,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(name, category)
      );
    `;

    // Test questions table
    const testQuestionsTableSQL = `
      CREATE TABLE IF NOT EXISTS test_questions (
        id SERIAL PRIMARY KEY,
        test_id INT NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
        question_text TEXT NOT NULL,
        question_type VARCHAR(50) NOT NULL,
        correct_answer VARCHAR(255) NOT NULL,
        options JSONB NOT NULL,
        explanation TEXT,
        vocab_id INT REFERENCES vocabulary(id) ON DELETE SET NULL,
        grammar_id INT REFERENCES grammar(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_test_questions_test_id ON test_questions(test_id);
    `;

    // User test results
    const testResultsTableSQL = `
      CREATE TABLE IF NOT EXISTS test_results (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        test_id INT NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
        score DECIMAL(5, 2),
        total_questions INT,
        answered_questions INT,
        completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        answers JSONB
      );
      
      CREATE INDEX IF NOT EXISTS idx_test_results_user_id ON test_results(user_id);
      CREATE INDEX IF NOT EXISTS idx_test_results_test_id ON test_results(test_id);
    `;
    
    // Execute migrations - proper table and column order
    await pool.query(decksTableSQL);
    console.log('✅ flashcard_decks table ready');
    
    await pool.query(flashcardsAlterSQL);
    console.log('✅ flashcards.deck_id column ready');

    try {
      await pool.query(flashcardsUserIdAlterSQL);
      console.log('✅ flashcards.user_id now nullable for global flashcards');
    } catch (err) {
      console.log('ℹ️ flashcards.user_id nullable migration note:', err.message.substring(0, 50));
    }

    try {
      await pool.query(vocabularyAlterSQL);
      console.log('✅ vocabulary.examples column ready');
    } catch (err) {
      console.log('ℹ️ vocabulary.examples column note:', err.message.substring(0, 50));
    }

    try {
      await pool.query(grammarAlterSQL);
      console.log('✅ grammar.category column ready');
    } catch (err) {
      console.log('ℹ️ grammar.category column note:', err.message.substring(0, 50));
    }

    try {
      await pool.query(grammarExamplesSQL);
      console.log('✅ grammar.examples column ready');
    } catch (err) {
      console.log('ℹ️ grammar.examples column note:', err.message.substring(0, 50));
    }

    try {
      await pool.query(avatarUrlAlterSQL);
      console.log('✅ users.avatar_url column upgraded to TEXT');
    } catch (err) {
      // Column might already be TEXT or not exist, ignore
      console.log('ℹ️ avatar_url column type check:', err.message.substring(0, 50));
    }

    try {
      await pool.query(testsTableSQL);
      console.log('✅ tests table ready');
    } catch (err) {
      console.log('ℹ️ tests table note:', err.message.substring(0, 50));
    }

    try {
      await pool.query(testQuestionsTableSQL);
      console.log('✅ test_questions table ready');
    } catch (err) {
      console.log('ℹ️ test_questions table note:', err.message.substring(0, 50));
    }

    try {
      await pool.query(testResultsTableSQL);
      console.log('✅ test_results table ready');
    } catch (err) {
      console.log('ℹ️ test_results table note:', err.message.substring(0, 50));
    }
    
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    // Continue anyway - app can work with mock decks
  }
}
