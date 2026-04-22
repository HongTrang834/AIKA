-- Migration to add new columns and tables for redesigned details pages

-- Add 'category' and 'quick_tip' to the 'grammar' table
ALTER TABLE grammar ADD COLUMN
IF NOT EXISTS category VARCHAR
(50);
ALTER TABLE grammar ADD COLUMN
IF NOT EXISTS quick_tip VARCHAR
(500);

-- Add 'example_translation' to the 'vocabulary' table
ALTER TABLE vocabulary ADD COLUMN
IF NOT EXISTS example_translation VARCHAR
(500);

-- Create the 'grammar_examples' table to store multiple examples for each grammar point
CREATE TABLE
IF NOT EXISTS grammar_examples
(
    id SERIAL PRIMARY KEY,
    grammar_id INT NOT NULL,
    sentence VARCHAR
(500) NOT NULL,
    translation VARCHAR
(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY
(grammar_id) REFERENCES grammar
(id) ON
DELETE CASCADE
);

-- Create the 'grammar_compare' table for similar patterns
CREATE TABLE
IF NOT EXISTS grammar_compare
(
    id SERIAL PRIMARY KEY,
    grammar_id INT NOT NULL,
    pattern VARCHAR
(100) NOT NULL,
    meaning VARCHAR
(255) NOT NULL,
    color VARCHAR
(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY
(grammar_id) REFERENCES grammar
(id) ON
DELETE CASCADE
);
