/**
 * Database Migration - Thêm bảng Vocabulary & Grammar
 * 
 * Chạy migration:
 *   Node: node database/migration_n2.js
 *   Hoặc trực tiếp: psql -U postgres -d aika_db -f database/migration_n2.js
 */

-- TODO: Kiểm tra bảng tồn tại và tạo nếu chưa có

-- ===== VOCABULARY TABLE =====
-- TODO: Thêm fields khác nếu cần:
-- - furigana (ふりがな)
-- - word_type (noun, verb, adjective, etc)
-- - example_sentence
-- - image_url (hoặc kanji stroke diagram)
CREATE TABLE
IF NOT EXISTS vocabulary
(
  id SERIAL PRIMARY KEY,
  lesson_id INT REFERENCES lessons
(id) ON
DELETE CASCADE,
  word VARCHAR(255)
NOT NULL,
  meaning TEXT NOT NULL,
  pronunciation VARCHAR
(255),
  level INT DEFAULT 5, -- N2 level (1-10)
  created_at TIMESTAMP DEFAULT NOW
(),
  updated_at TIMESTAMP DEFAULT NOW
(),
  UNIQUE
(lesson_id, word)
);

CREATE INDEX
IF NOT EXISTS idx_vocabulary_lesson_id ON vocabulary
(lesson_id);
CREATE INDEX
IF NOT EXISTS idx_vocabulary_word ON vocabulary
(word);
CREATE INDEX
IF NOT EXISTS idx_vocabulary_level ON vocabulary
(level);


-- ===== GRAMMAR TABLE =====
-- TODO: Thêm fields khác nếu cần:
-- - usage_context (formal, casual, written, etc)
-- - difficulty_level
-- - related_patterns (danh sách các mẫu tương tự)
-- - video_url
CREATE TABLE
IF NOT EXISTS grammar
(
  id SERIAL PRIMARY KEY,
  lesson_id INT REFERENCES lessons
(id) ON
DELETE CASCADE,
  pattern VARCHAR(255)
NOT NULL,
  meaning TEXT NOT NULL,
  example TEXT,
  level INT DEFAULT 5, -- N2 level (1-10)
  created_at TIMESTAMP DEFAULT NOW
(),
  updated_at TIMESTAMP DEFAULT NOW
(),
  UNIQUE
(lesson_id, pattern)
);

CREATE INDEX
IF NOT EXISTS idx_grammar_lesson_id ON grammar
(lesson_id);
CREATE INDEX
IF NOT EXISTS idx_grammar_pattern ON grammar
(pattern);
CREATE INDEX
IF NOT EXISTS idx_grammar_level ON grammar
(level);


-- ===== UPDATE LESSONS TABLE =====
-- TODO: Thêm cột category vào lessons nếu chưa có
-- ALTER TABLE lessons ADD COLUMN IF NOT EXISTS category VARCHAR(255);


-- ===== STATISTICS VIEW =====
-- TODO: Query thống kê
CREATE OR REPLACE VIEW vocabulary_statistics AS
SELECT
    l.id,
    l.title,
    COUNT(v.id) as vocab_count,
    COUNT(g.id) as grammar_count
FROM lessons l
    LEFT JOIN vocabulary v ON l.id = v.lesson_id
    LEFT JOIN grammar g ON l.id = g.lesson_id
GROUP BY l.id, l.title;


-- ===== TEST DATA (Optional) =====
-- TODO: Xoá sau khi import dữ liệu thực
INSERT INTO vocabulary
    (lesson_id, word, meaning, pronunciation, level)
VALUES
    (1, '敬語', 'honorific language', 'けいご', 5),
    (1, '失礼', 'rude, disrespectful', 'しつれい', 5),
    (1, '了解', 'acknowledge, understood', 'りょうかい', 4),
    (2, '提案', 'proposal, suggestion', 'ていあん', 5),
    (2, '議論', 'discussion, debate', 'ぎろん', 5)
ON CONFLICT DO NOTHING;

INSERT INTO grammar
    (lesson_id, pattern, meaning, example, level)
VALUES
    (1, '~いただけますか', 'can you please', 'お手数ですが、確認していただけますか', 5),
    (1, '~してしまう', 'end up doing, accidentally', '大事なデータを削除してしまった', 5),
    (1, '~べきだ', 'should, ought to', 'その仕事は今日中に終わるべきだ', 5),
    (2, '~ないといけない', 'must, have to', 'この報告書は明日提出しないといけない', 5),
    (2, '~として', 'as, in the capacity of', 'マネージャーとして責任がある', 5)
ON CONFLICT DO NOTHING;

