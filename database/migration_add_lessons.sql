-- Migration: Add lessons-related tables and columns

-- Add last_lesson_id column to user_progress if it doesn't exist
ALTER TABLE user_progress
ADD COLUMN
IF NOT EXISTS last_lesson_id INT;

-- Create units table if it doesn't exist
CREATE TABLE
IF NOT EXISTS units
(
    id SERIAL PRIMARY KEY,
    title VARCHAR
(100) NOT NULL,
    description VARCHAR
(500),
    sequence_number INT NOT NULL,
    difficulty_level INT DEFAULT 2,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create lessons table if it doesn't exist
CREATE TABLE
IF NOT EXISTS lessons
(
    id SERIAL PRIMARY KEY,
    unit_id INT NOT NULL,
    title VARCHAR
(100) NOT NULL,
    description VARCHAR
(500),
    lesson_number DECIMAL
(3, 1) NOT NULL,
    type VARCHAR
(50),
    content TEXT,
    vocabulary_count INT DEFAULT 0,
    grammar_count INT DEFAULT 0,
    sequence_number INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY
(unit_id) REFERENCES units
(id) ON
DELETE CASCADE
);

-- Create indexes if they don't exist
CREATE INDEX
IF NOT EXISTS idx_lesson_unit_id ON lessons
(unit_id);
CREATE INDEX
IF NOT EXISTS idx_user_progress_user_id ON user_progress
(user_id);

-- Insert sample units
INSERT INTO units
    (title, description, sequence_number, difficulty_level)
VALUES
    ('Business Ethics', 'Learn professional Japanese communication', 1, 2),
    ('Office Communication', 'Daily workplace interactions', 2, 2),
    ('Formal Presentations', 'Meeting and presentation skills', 3, 2),
    ('Customer Service', 'Service industry Japanese', 4, 2),
    ('Advanced Negotiations', 'Complex business discussions', 5, 3)
ON CONFLICT DO NOTHING;

-- Insert sample lessons
INSERT INTO lessons
    (unit_id, title, description, lesson_number, type, sequence_number, vocabulary_count, grammar_count)
    SELECT u.id, 'Company Culture', 'Understanding Japanese business values', 1.0, 'grammar', 1, 15, 3
    FROM units u
    WHERE u.title = 'Business Ethics'
UNION ALL
    SELECT u.id, 'Corporate Hierarchy', 'Japanese company structure and roles', 1.1, 'vocabulary', 2, 20, 2
    FROM units u
    WHERE u.title = 'Business Ethics'
UNION ALL
    SELECT u.id, 'Decision Making', 'The consensus-based approach', 1.2, 'scenario', 3, 12, 4
    FROM units u
    WHERE u.title = 'Business Ethics'
UNION ALL
    SELECT u.id, 'Keigo Honorifics', 'Formal humble forms used in presentations', 4.2, 'grammar', 4, 18, 5
    FROM units u
    WHERE u.title = 'Business Ethics'
UNION ALL
    SELECT u.id, 'Email Etiquette', 'Writing professional emails', 2.0, 'grammar', 1, 10, 3
    FROM units u
    WHERE u.title = 'Office Communication'
UNION ALL
    SELECT u.id, 'Meeting Participation', 'Speaking in meetings', 2.1, 'scenario', 2, 14, 4
    FROM units u
    WHERE u.title = 'Office Communication'
UNION ALL
    SELECT u.id, 'Presentation Structure', 'Organizing effective presentations', 3.0, 'grammar', 1, 16, 3
    FROM units u
    WHERE u.title = 'Formal Presentations'
UNION ALL
    SELECT u.id, 'Visual Aids Discussion', 'Explaining charts and graphs', 3.1, 'vocabulary', 2, 12, 2
    FROM units u
    WHERE u.title = 'Formal Presentations'
ON CONFLICT DO NOTHING;
