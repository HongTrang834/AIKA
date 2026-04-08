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
    
    // Execute migrations
    await pool.query(decksTableSQL);
    console.log('✅ flashcard_decks table ready');
    
    await pool.query(flashcardsAlterSQL);
    console.log('✅ flashcards.deck_id column ready');

    await pool.query(vocabularyAlterSQL);
    console.log('✅ vocabulary.examples column ready');

    await pool.query(grammarAlterSQL);
    console.log('✅ grammar.category column ready');

    await pool.query(grammarExamplesSQL);
    console.log('✅ grammar.examples column ready');

    await pool.query(testsTableSQL);
    console.log('✅ tests table ready');

    await pool.query(testQuestionsTableSQL);
    console.log('✅ test_questions table ready');

    await pool.query(testResultsTableSQL);
    console.log('✅ test_results table ready');
    
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    // Continue anyway - app can work with mock decks
  }
}
