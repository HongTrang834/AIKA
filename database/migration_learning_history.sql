/**
 * Migration: User Learning History Tables
 * Tracks user's progress on each vocabulary and grammar item
 * Status: NEW (0) → LEARNING (1) → MASTERED (2)
 */

-- Create table for tracking vocabulary learning
CREATE TABLE
IF NOT EXISTS user_vocabulary_learned
(
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users
(id) ON
DELETE CASCADE,
  vocabulary_id INT
NOT NULL REFERENCES vocabulary
(id) ON
DELETE CASCADE,
  learned_at TIMESTAMP
DEFAULT NOW
(),
  status INT DEFAULT 0,
  review_count INT DEFAULT 0,
  last_reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW
(),
  updated_at TIMESTAMP DEFAULT NOW
(),
  UNIQUE
(user_id, vocabulary_id)
);

CREATE INDEX
IF NOT EXISTS idx_user_vocab_user_id ON user_vocabulary_learned
(user_id);
CREATE INDEX
IF NOT EXISTS idx_user_vocab_status ON user_vocabulary_learned
(status);
CREATE INDEX
IF NOT EXISTS idx_user_vocab_learned_at ON user_vocabulary_learned
(learned_at DESC);


-- Create table for tracking grammar learning
CREATE TABLE
IF NOT EXISTS user_grammar_learned
(
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users
(id) ON
DELETE CASCADE,
  grammar_id INT
NOT NULL REFERENCES grammar
(id) ON
DELETE CASCADE,
  learned_at TIMESTAMP
DEFAULT NOW
(),
  status INT DEFAULT 0,
  review_count INT DEFAULT 0,
  last_reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW
(),
  updated_at TIMESTAMP DEFAULT NOW
(),
  UNIQUE
(user_id, grammar_id)
);

CREATE INDEX
IF NOT EXISTS idx_user_grammar_user_id ON user_grammar_learned
(user_id);
CREATE INDEX
IF NOT EXISTS idx_user_grammar_status ON user_grammar_learned
(status);
CREATE INDEX
IF NOT EXISTS idx_user_grammar_learned_at ON user_grammar_learned
(learned_at DESC);


-- View to get recently learned items (vocabulary + grammar combined)
CREATE OR REPLACE VIEW recently_learned_items AS
    SELECT
        'vocabulary' as type,
        v.word,
        COALESCE(v.pronunciation, '') as pronunciation,
        v.meaning,
        v.level,
        uvl.user_id,
        uvl.learned_at,
        uvl.status,
        uvl.review_count,
        uvl.last_reviewed_at,
        uvl.id as tracking_id
    FROM user_vocabulary_learned uvl
        JOIN vocabulary v ON uvl.vocabulary_id = v.id
UNION ALL
    SELECT
        'grammar' as type,
        g.pattern as word,
        '' as pronunciation,
        g.meaning,
        g.level,
        ugl.user_id,
        ugl.learned_at,
        ugl.status,
        ugl.review_count,
        ugl.last_reviewed_at,
        ugl.id as tracking_id
    FROM user_grammar_learned ugl
        JOIN grammar g ON ugl.grammar_id = g.id;


-- Helper function to update vocabulary review
CREATE OR REPLACE FUNCTION update_vocab_review
(
  p_user_id INT,
  p_vocab_id INT,
  p_new_status INT
) RETURNS BOOLEAN AS $$
BEGIN
    UPDATE user_vocabulary_learned
  SET 
    status = p_new_status,
    review_count = review_count + 1,
    last_reviewed_at = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP
  WHERE user_id = p_user_id AND vocabulary_id = p_vocab_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;


-- Helper function to insert new vocabulary learning
CREATE OR REPLACE FUNCTION insert_vocab_learned
(
  p_user_id INT,
  p_vocab_id INT
) RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO user_vocabulary_learned
        (user_id, vocabulary_id, status)
    VALUES
        (p_user_id, p_vocab_id, 0)
    ON CONFLICT DO NOTHING;

RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
