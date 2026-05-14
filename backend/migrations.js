import pool from "./db.js";

export async function runMigrations() {
  try {
    console.log("🔄 Running database migrations...");
    // FIRST: Clean up old data and reset sequences (REMOVED)
    // We no longer delete vocabulary and grammar on startup.
    // Ensure sequences are updated if we want to add new items.
    // For now, we leave the sequences as they are since we aren't clearing the tables.

    // Drop and recreate flashcard_decks table properly
    try {
      await pool.query("DROP TABLE IF EXISTS flashcard_decks CASCADE;");
      console.log("🔄 Dropped old flashcard_decks table");
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (err) {
      console.log("ℹ️ Error dropping flashcard_decks:", err.message.substring(0, 50));
    }

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

    const decksIndexesSQL = `
      CREATE INDEX IF NOT EXISTS idx_deck_user_id ON flashcard_decks(user_id);
      CREATE INDEX IF NOT EXISTS idx_deck_is_global ON flashcard_decks(is_global);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_deck_user_id_name_unique ON flashcard_decks(user_id, name) WHERE user_id IS NOT NULL;
    `;

    await pool.query(decksTableSQL);
    console.log("✅ flashcard_decks table ready");

    try {
      await pool.query(decksIndexesSQL);
      console.log("✅ flashcard_decks indexes created");
    } catch (indexErr) {
      console.log("ℹ️ Index creation note:", indexErr.message.substring(0, 50));
    }

    const flashcardsAlterSQL = `
      ALTER TABLE flashcards
      ADD COLUMN IF NOT EXISTS deck_id INTEGER REFERENCES flashcard_decks(id) ON DELETE SET NULL;
      CREATE INDEX IF NOT EXISTS idx_flashcard_deck_id ON flashcards(deck_id);
    `;

    const flashcardsUserIdAlterSQL = `
      ALTER TABLE flashcards
      ALTER COLUMN user_id DROP NOT NULL;
    `;

    const vocabularyAlterSQL = `
      ALTER TABLE vocabulary
      ADD COLUMN IF NOT EXISTS examples TEXT,
      ADD COLUMN IF NOT EXISTS example_translation TEXT;
      COMMENT ON COLUMN vocabulary.examples IS 'JSON array of example objects: [{"japanese":"...", "vietnamese":"..."}, ...]';
      COMMENT ON COLUMN vocabulary.example_translation IS 'Vietnamese translation of example_sentence';
    `;

    const vocabularyCategoryAlterSQL = `
      ALTER TABLE vocabulary
      ALTER COLUMN category TYPE TEXT;
      ALTER TABLE vocabulary
      ALTER COLUMN reading TYPE TEXT;
      ALTER TABLE vocabulary
      ALTER COLUMN word TYPE TEXT;
      ALTER TABLE vocabulary
      ALTER COLUMN meaning TYPE TEXT;
      ALTER TABLE vocabulary
      ALTER COLUMN example_sentence TYPE TEXT;
    `;

    const grammarAlterSQL = `
      ALTER TABLE grammar
      ADD COLUMN IF NOT EXISTS category VARCHAR(100),
      ADD COLUMN IF NOT EXISTS example_translation TEXT;
    `;

    const grammarCategoryAlterSQL = `
      ALTER TABLE grammar
      ALTER COLUMN category TYPE TEXT;
      ALTER TABLE grammar
      ALTER COLUMN pattern TYPE TEXT;
      ALTER TABLE grammar
      ALTER COLUMN title TYPE TEXT;
    `;

    const grammarExamplesSQL = `
      ALTER TABLE grammar
      ADD COLUMN IF NOT EXISTS examples TEXT;
    `;

    const avatarUrlAlterSQL = `
      ALTER TABLE users
      ALTER COLUMN avatar_url TYPE TEXT;
    `;

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

    await pool.query(decksTableSQL);
    console.log("✅ flashcard_decks table ready");

    await pool.query(flashcardsAlterSQL);
    console.log("✅ flashcards.deck_id column ready");

    try {
      await pool.query(flashcardsUserIdAlterSQL);
      console.log("✅ flashcards.user_id now nullable for global flashcards");
    } catch (err) {
      console.log("ℹ️ flashcards.user_id nullable migration note:", err.message.substring(0, 50));
    }

    try {
      await pool.query(vocabularyAlterSQL);
      console.log("✅ vocabulary.example_translation column ready");
    } catch (err) {
      console.log("ℹ️ vocabulary.examples column note:", err.message.substring(0, 50));
    }

    try {
      await pool.query(vocabularyCategoryAlterSQL);
      console.log("✅ vocabulary.category and reading columns upgraded to TEXT");
    } catch (err) {
      console.log("ℹ️ vocabulary category/reading type change note:", err.message.substring(0, 50));
    }

    try {
      await pool.query(grammarAlterSQL);
      console.log("✅ grammar.example_translation column ready");
    } catch (err) {
      console.log("ℹ️ grammar.category column note:", err.message.substring(0, 50));
    }

    try {
      await pool.query(grammarCategoryAlterSQL);
      console.log("✅ grammar.category, pattern, title columns upgraded to TEXT");
    } catch (err) {
      console.log("ℹ️ grammar column type change note:", err.message.substring(0, 50));
    }

    try {
      await pool.query(grammarExamplesSQL);
      console.log("✅ grammar.examples column ready");
    } catch (err) {
      console.log("ℹ️ grammar.examples column note:", err.message.substring(0, 50));
    }

    try {
      await pool.query(avatarUrlAlterSQL);
      console.log("✅ users.avatar_url column upgraded to TEXT");
    } catch (err) {
      console.log("ℹ️ avatar_url column type check:", err.message.substring(0, 50));
    }

    try {
      await pool.query(testsTableSQL);
      console.log("✅ tests table ready");
    } catch (err) {
      console.log("ℹ️ tests table note:", err.message.substring(0, 50));
    }

    try {
      await pool.query(testQuestionsTableSQL);
      console.log("✅ test_questions table ready");
    } catch (err) {
      console.log("ℹ️ test_questions table note:", err.message.substring(0, 50));
    }

    try {
      await pool.query(testResultsTableSQL);
      console.log("✅ test_results table ready");
    } catch (err) {
      console.log("ℹ️ test_results table note:", err.message.substring(0, 50));
    }

    // Create user_vocabulary_learned table
    const userVocabLearned = `
      CREATE TABLE IF NOT EXISTS user_vocabulary_learned (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        vocabulary_id INTEGER NOT NULL REFERENCES vocabulary(id) ON DELETE CASCADE,
        status VARCHAR(50) DEFAULT 'NEW',
        learned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        review_count INTEGER DEFAULT 0,
        last_reviewed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, vocabulary_id)
      );
      CREATE INDEX IF NOT EXISTS idx_user_vocab_user_id ON user_vocabulary_learned(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_vocab_status ON user_vocabulary_learned(status);
    `;

    try {
      await pool.query(userVocabLearned);
      console.log("✅ user_vocabulary_learned table ready");
    } catch (err) {
      console.log("ℹ️ user_vocabulary_learned table note:", err.message.substring(0, 50));
    }

    // Create user_grammar_learned table
    const userGrammarLearned = `
      CREATE TABLE IF NOT EXISTS user_grammar_learned (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        grammar_id INTEGER NOT NULL REFERENCES grammar(id) ON DELETE CASCADE,
        status VARCHAR(50) DEFAULT 'NEW',
        learned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        review_count INTEGER DEFAULT 0,
        last_reviewed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, grammar_id)
      );
      CREATE INDEX IF NOT EXISTS idx_user_grammar_user_id ON user_grammar_learned(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_grammar_status ON user_grammar_learned(status);
    `;

    try {
      await pool.query(userGrammarLearned);
      console.log("✅ user_grammar_learned table ready");
    } catch (err) {
      console.log("ℹ️ user_grammar_learned table note:", err.message.substring(0, 50));
    }

    // Create recently_learned_items view
    const recentlyLearnedView = `
      CREATE OR REPLACE VIEW recently_learned_items AS
        SELECT
          'vocabulary' as type,
          uvl.id,
          v.word,
          COALESCE(v.reading, '') as pronunciation,
          v.meaning,
          v.level,
          uvl.user_id,
          uvl.learned_at,
          uvl.status,
          uvl.review_count,
          uvl.last_reviewed_at
        FROM user_vocabulary_learned uvl
        JOIN vocabulary v ON uvl.vocabulary_id = v.id
      UNION ALL
        SELECT
          'grammar' as type,
          ugl.id,
          g.pattern as word,
          '' as pronunciation,
          g.meaning,
          g.level,
          ugl.user_id,
          ugl.learned_at,
          ugl.status,
          ugl.review_count,
          ugl.last_reviewed_at
        FROM user_grammar_learned ugl
        JOIN grammar g ON ugl.grammar_id = g.id;
    `;

    try {
      await pool.query(recentlyLearnedView);
      console.log("✅ recently_learned_items view ready");
    } catch (err) {
      console.log("ℹ️ recently_learned_items view note:", err.message.substring(0, 50));
    }

  } catch (error) {
    console.error("❌ Migration failed:", error);
  }
}
