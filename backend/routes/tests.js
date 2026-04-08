import express from 'express';
import pool from '../db.js';
import { authMiddleware } from '../auth.js';

const router = express.Router();

// Get all tests
router.get('/', async (req, res) => {
  try {
    const category = req.query.category;
    const topicType = req.query.type || 'vocabulary';

    let query = 'SELECT * FROM tests WHERE topic_type = $1';
    const params = [topicType];

    if (category) {
      query += ` AND category = $${params.length + 1}`;
      params.push(category);
    }

    query += ' ORDER BY category, name';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching tests:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Create test (authenticated users)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, category, topic_type, description, total_questions } = req.body;

    if (!name || !category) {
      return res.status(400).json({ error: 'Name and category are required' });
    }

    const result = await pool.query(
      'INSERT INTO tests (name, category, topic_type, description, total_questions) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, category, topic_type || 'vocabulary', description || '', total_questions || 5]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating test:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

// Auto-generate test questions (authenticated users)
router.post('/:id/auto-generate', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // Get test info
    const testResult = await pool.query('SELECT * FROM tests WHERE id = $1', [id]);
    if (testResult.rows.length === 0) {
      return res.status(404).json({ error: 'Test not found' });
    }

    const test = testResult.rows[0];
    const { category, topic_type, total_questions } = test;

    // Get all items in this category
    let itemsResult;
    if (topic_type === 'vocabulary') {
      itemsResult = await pool.query(
        'SELECT id, word, reading, meaning, category, example_sentence FROM vocabulary WHERE category = $1 LIMIT $2',
        [category, total_questions * 2]
      );
    } else {
      itemsResult = await pool.query(
        'SELECT id, pattern, meaning, category, example_sentence FROM grammar WHERE category = $1 LIMIT $2',
        [category, total_questions * 2]
      );
    }

    const items = itemsResult.rows;
    if (items.length === 0) {
      return res.status(400).json({ error: `No ${topic_type} items found in category "${category}"` });
    }

    // Calculate max number of wrong answers we can generate without placeholder
    const maxWrongAnswers = Math.max(1, Math.min(3, items.length - 2));

    // Generate questions
    const questionTypes = ['fill-blank', 'choose-meaning', 'choose-reading', 'sentence'];
    const generateQuestions = [];

    for (let i = 0; i < Math.min(total_questions, items.length); i++) {
      const item = items[i];
      const questionType = questionTypes[i % questionTypes.length];
      
      let question, options, correctAnswer;

      if (topic_type === 'vocabulary') {
        const word = item.word;
        const reading = item.reading;
        const meaning = item.meaning;

        switch (questionType) {
          case 'fill-blank':
            question = `"_____" có nghĩa là gì? (Đọc: ${reading})`;
            options = [meaning, ...getRandomWrongAnswers(items, meaning, i, 'meaning', maxWrongAnswers)];
            correctAnswer = meaning;
            break;
          case 'choose-reading':
            question = `Từ "${word}" đọc như thế nào?`;
            options = [reading, ...getRandomReadings(items, reading, maxWrongAnswers)];
            correctAnswer = reading;
            break;
          case 'choose-meaning':
            question = `Chọn nghĩa của từ "${word}"`;
            options = [meaning, ...getRandomWrongAnswers(items, meaning, i, 'meaning', maxWrongAnswers)];
            correctAnswer = meaning;
            break;
          case 'sentence':
            question = `Chọn từ phù hợp để điền vào: "Tôi phải _____ [${meaning}] mỗi ngày"`;
            options = [word, ...getRandomWrongWords(items, word, i, maxWrongAnswers)];
            correctAnswer = word;
            break;
        }
      } else {
        const pattern = item.pattern;
        const meaning = item.meaning;

        switch (questionType) {
          case 'fill-blank':
            question = `Ngữ pháp "_____" có ý nghĩa: ?`;
            options = [meaning, ...getRandomWrongAnswers(items, meaning, i, 'meaning', maxWrongAnswers)];
            correctAnswer = meaning;
            break;
          case 'choose-meaning':
            question = `Chọn ý nghĩa của ngữ pháp "${pattern}"`;
            options = [meaning, ...getRandomWrongAnswers(items, meaning, i, 'meaning', maxWrongAnswers)];
            correctAnswer = meaning;
            break;
          case 'choose-reading':
            question = `Ngữ pháp "${pattern}" diễn tả ý gì?`;
            options = [meaning, ...getRandomWrongAnswers(items, meaning, i, 'meaning', maxWrongAnswers)];
            correctAnswer = meaning;
            break;
          case 'sentence':
            question = `Ví dụ với "${pattern}": ?`;
            options = [item.example_sentence || meaning, ...getRandomWrongAnswers(items, item.example_sentence || meaning, i, 'example_sentence', maxWrongAnswers)];
            correctAnswer = item.example_sentence || meaning;
            break;
        }
      }

      generateQuestions.push({
        test_id: id,
        question_text: question,
        question_type: questionType,
        correct_answer: correctAnswer,
        options: JSON.stringify(options.sort(() => Math.random() - 0.5)),
        vocab_id: topic_type === 'vocabulary' ? item.id : null,
        grammar_id: topic_type === 'grammar' ? item.id : null,
      });
    }

    // Delete old questions
    await pool.query('DELETE FROM test_questions WHERE test_id = $1', [id]);

    // Insert new questions
    let inserted = 0;
    for (const q of generateQuestions) {
      await pool.query(
        'INSERT INTO test_questions (test_id, question_text, question_type, correct_answer, options, vocab_id, grammar_id) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [q.test_id, q.question_text, q.question_type, q.correct_answer, q.options, q.vocab_id, q.grammar_id]
      );
      inserted++;
    }

    res.json({
      message: `✅ Generated ${inserted} questions`,
      questions_generated: inserted,
    });
  } catch (error) {
    console.error('Error generating questions:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

// Get test with questions
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const testResult = await pool.query('SELECT * FROM tests WHERE id = $1', [id]);
    if (testResult.rows.length === 0) {
      return res.status(404).json({ error: 'Test not found' });
    }

    const questionsResult = await pool.query(
      'SELECT id, question_text, question_type, options FROM test_questions WHERE test_id = $1 ORDER BY id',
      [id]
    );

    res.json({
      test: testResult.rows[0],
      questions: questionsResult.rows,
    });
  } catch (error) {
    console.error('Error fetching test:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Submit test
router.post('/:id/submit', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { answers } = req.body;
    const userId = req.userId;

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'Invalid answers format' });
    }

    // Get all questions for this test
    const questionsResult = await pool.query(
      'SELECT id, correct_answer FROM test_questions WHERE test_id = $1',
      [id]
    );

    let correctCount = 0;
    const answersWithCorrect = answers.map((answer) => {
      const question = questionsResult.rows.find(q => q.id === answer.question_id);
      const isCorrect = question && question.correct_answer === answer.answer;
      if (isCorrect) correctCount++;
      return {
        ...answer,
        correct_answer: question?.correct_answer || '',
        is_correct: isCorrect,
      };
    });

    const score = (correctCount / questionsResult.rows.length) * 100;

    // Save result
    const resultResult = await pool.query(
      'INSERT INTO test_results (user_id, test_id, score, total_questions, answered_questions, answers) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [userId, id, score, questionsResult.rows.length, answers.length, JSON.stringify(answersWithCorrect)]
    );

    res.json({
      result: resultResult.rows[0],
      score,
      correctCount,
      totalQuestions: questionsResult.rows.length,
      answers: answersWithCorrect,
    });
  } catch (error) {
    console.error('Error submitting test:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get user's test results
router.get('/:id/results', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const result = await pool.query(
      'SELECT * FROM test_results WHERE test_id = $1 AND user_id = $2 ORDER BY completed_at DESC LIMIT 1',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No test results found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching results:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Helper functions for question generation
function getRandomWrongAnswers(items, correct, currentIndex, field, count) {
  const wrong = items
    .filter((item, idx) => idx !== currentIndex && item[field] !== correct)
    .map(item => item[field])
    .sort(() => Math.random() - 0.5);
  return wrong.slice(0, count); // Return only real answers, no placeholder
}

function getRandomReadings(items, correct, count) {
  const readings = items.map(item => item.reading).filter(r => r !== correct)
    .sort(() => Math.random() - 0.5);
  return readings.slice(0, count); // Return only real answers
}

function getRandomWrongWords(items, correct, currentIndex, count) {
  const wrong = items
    .filter((item, idx) => idx !== currentIndex && item.word !== correct)
    .map(item => item.word)
    .sort(() => Math.random() - 0.5);
  return wrong.slice(0, count); // Return only real answers
}

export default router;
