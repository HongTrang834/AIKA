-- Create Database
CREATE DATABASE aika_db;

-- Connect to aika_db and run the following:

-- Users Table
CREATE TABLE users
(
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    avatar_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vocabulary Table
CREATE TABLE vocabulary
(
    id SERIAL PRIMARY KEY,
    word VARCHAR(50) NOT NULL,
    reading VARCHAR(100) NOT NULL,
    meaning VARCHAR(500) NOT NULL,
    category VARCHAR(50),
    level INT DEFAULT 2,
    example_sentence VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Grammar Table
CREATE TABLE grammar
(
    id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    pattern VARCHAR(200) NOT NULL,
    explanation VARCHAR(1000) NOT NULL,
    meaning VARCHAR(500) NOT NULL,
    example_sentence VARCHAR(500),
    level INT DEFAULT 2
);

-- Flashcards Table
CREATE TABLE flashcards
(
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    vocab_id INT,
    grammar_id INT,
    interval INT DEFAULT 1,
    repetitions INT DEFAULT 0,
    ease_factor DECIMAL(3, 2) DEFAULT 2.5,
    next_review_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (vocab_id) REFERENCES vocabulary(id) ON DELETE SET NULL,
    FOREIGN KEY (grammar_id) REFERENCES grammar(id) ON DELETE SET NULL
);

-- Conversation History Table
CREATE TABLE conversation_history
(
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    mode VARCHAR(50),
    scenario_id INT,
    user_message VARCHAR(1000),
    ai_response VARCHAR(2000),
    grammar_errors JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Scenarios Table
CREATE TABLE scenarios
(
    id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    context VARCHAR(1000),
    example_conversation TEXT,
    difficulty_level INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Progress Table
CREATE TABLE user_progress
(
    id SERIAL PRIMARY KEY,
    user_id INT UNIQUE NOT NULL,
    total_vocab_learned INT DEFAULT 0,
    total_grammar_learned INT DEFAULT 0,
    total_kaiwas INT DEFAULT 0,
    total_flashcard_reviews INT DEFAULT 0,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for faster queries
CREATE INDEX idx_vocab_category ON vocabulary(category);
CREATE INDEX idx_grammar_level ON grammar(level);
CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_flashcard_user_id ON flashcards(user_id);
CREATE INDEX idx_conversation_user_id ON conversation_history(user_id);

-- Insert sample vocabulary
INSERT INTO vocabulary
    (word, reading, meaning, category, level, example_sentence)
VALUES
    ('経営', 'けいえい', 'Quản lý, điều hành', 'Business', 2, '企業の経営は複雑な決定を必要とします。'),
    ('企業', 'きぎょう', 'Công ty, doanh nghiệp', 'Business', 2, 'この企業は世界中で事業を展開しています。'),
    ('革新', 'かくしん', 'Đổi mới, cải tiến', 'General', 2, '技術革新は社会を変えました。'),
    ('市場', 'しじょう', 'Thị trường', 'Business', 2, '市場の需要に対応する必要があります。'),
    ('戦略', 'せんりゃく', 'Chiến lược, kế sách', 'Business', 2, 'マーケティング戦略が重要です。');

-- Insert sample grammar
INSERT INTO grammar
    (title, pattern, explanation, meaning, example_sentence, level)
VALUES
    ('~といった', '~といった', 'Dùng để liệt kê các ví dụ hoặc loại thứ gì đó', 'Nhưng những thứ như..., chẳng hạn như...', '野菜といった食材が必要です。', 2),
    ('~によって', '~によって', 'Chỉ tác nhân, phương tiện hoặc nguyên nhân', 'Bằng, do, vì', '彼の努力によって成功しました。', 2),
    ('~ばかりか', '~ばかりか', 'Không chỉ... mà còn...', 'Không những... mà còn..., hơn thế nữa', 'オフィスばかりか自宅でも仕事ができます。', 2);