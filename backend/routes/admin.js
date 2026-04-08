import express from 'express';
import { adminMiddleware } from '../auth.js';
import pool from '../db.js';

const router = express.Router();

// ======================== VOCABULARY ADMIN ========================

// GET all vocabulary (with pagination)
router.get('/vocabulary', adminMiddleware, async (req, res) => {
  try {
    const limit = req.query.limit || 10;
    const offset = req.query.offset || 0;

    const result = await pool.query(
      'SELECT * FROM vocabulary ORDER BY id DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );

    const countResult = await pool.query('SELECT COUNT(*) FROM vocabulary');

    res.json({
      rows: result.rows,
      total: parseInt(countResult.rows[0].count),
    });
  } catch (error) {
    console.error('Error fetching vocabulary:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// IMPORT vocabulary from CSV (must be BEFORE :id routes)
router.post('/vocabulary/import', adminMiddleware, async (req, res) => {
  try {
    const { records } = req.body;

    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ error: 'No records to import' });
    }

    let imported = 0;
    let skipped = 0;
    const errors = [];

    console.log(`📥 Importing ${records.length} records...`);
    console.log('First record:', JSON.stringify(records[0], null, 2));

    // Group records by word+reading+meaning to merge multiple examples
    const groupedRecords = {};
    
    for (const record of records) {
      const word = record.word?.trim();
      const reading = record.reading?.trim();
      const meaning = record.meaning?.trim();
      const category = record.category?.trim() || null;
      const level = parseInt(record.level) || 2;
      const example_sentence = record.example_sentence?.trim() || null;
      const example_translation = record.example_translation?.trim() || null;

      // Validate required fields
      if (!word || !reading || !meaning) {
        skipped++;
        errors.push(`Missing required fields (word="${word}", reading="${reading}", meaning="${meaning}")`);
        continue;
      }

      const key = `${word}|${reading}|${meaning}`;
      
      if (!groupedRecords[key]) {
        groupedRecords[key] = {
          word,
          reading,
          meaning,
          category,
          level,
          examples: [],
        };
      }
      
      // Add example to the group if it exists and is not a duplicate
      if (example_sentence) {
        // Check if this exact example already exists
        const existingExample = groupedRecords[key].examples.find(
          e => e.japanese === example_sentence
        );
        
        if (!existingExample) {
          groupedRecords[key].examples.push({
            japanese: example_sentence,
            vietnamese: example_translation || '',
          });
        }
      }
    }

    // Delete existing records that will be replaced by merged ones
    const wordsToDelete = Object.values(groupedRecords).map(r => ({
      word: r.word,
      reading: r.reading,
      meaning: r.meaning,
    }));

    console.log(`🗑️  Deleting old entries for ${wordsToDelete.length} words...`);
    
    for (const item of wordsToDelete) {
      await pool.query(
        'DELETE FROM vocabulary WHERE word = $1 AND reading = $2 AND meaning = $3',
        [item.word, item.reading, item.meaning]
      );
    }

    // Insert grouped records into database
    for (const [key, record] of Object.entries(groupedRecords)) {
      try {
        const examplesJSON = record.examples.length > 0 ? JSON.stringify(record.examples) : null;

        console.log(`Record: word="${record.word}", reading="${record.reading}", examples=${record.examples.length}`);

        // Insert record with examples
        const result = await pool.query(
          'INSERT INTO vocabulary (word, reading, meaning, category, level, example_sentence, examples) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
          [record.word, record.reading, record.meaning, record.category, record.level, record.examples[0]?.japanese || null, examplesJSON]
        );

        if (result.rows.length > 0) {
          imported++;
          console.log(`✅ Imported: ${record.word} (${record.examples.length} examples}`);
        }
      } catch (err) {
        skipped++;
        errors.push(`${record.word}: ${err.message}`);
        console.error(`❌ Error importing record ${i + 1}:`, err.message);
      }
    }

    console.log(`\n📊 Import Summary: Imported=${imported}, Skipped=${skipped}, Total=${records.length}`);

    res.json({
      imported,
      skipped,
      total: records.length,
      errors: errors.slice(0, 10),
    });
  } catch (error) {
    console.error('Error importing vocabulary:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// CREATE vocabulary
router.post('/vocabulary', adminMiddleware, async (req, res) => {
  try {
    const { word, reading, meaning, category, level, example_sentence } = req.body;

    if (!word || !reading || !meaning) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await pool.query(
      'INSERT INTO vocabulary (word, reading, meaning, category, level, example_sentence) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [word, reading, meaning, category || null, level || 2, example_sentence || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating vocabulary:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// UPDATE vocabulary
router.put('/vocabulary/:id', adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { word, reading, meaning, category, level, example_sentence } = req.body;

    const result = await pool.query(
      'UPDATE vocabulary SET word = $1, reading = $2, meaning = $3, category = $4, level = $5, example_sentence = $6 WHERE id = $7 RETURNING *',
      [word, reading, meaning, category, level, example_sentence, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vocabulary not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating vocabulary:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// DELETE vocabulary
router.delete('/vocabulary/:id', adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM vocabulary WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vocabulary not found' });
    }

    res.json({ message: 'Vocabulary deleted successfully' });
  } catch (error) {
    console.error('Error deleting vocabulary:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ======================== GRAMMAR ADMIN ========================

// GET all grammar
router.get('/grammar', adminMiddleware, async (req, res) => {
  try {
    const limit = req.query.limit || 10;
    const offset = req.query.offset || 0;

    const result = await pool.query(
      'SELECT * FROM grammar ORDER BY id DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );

    const countResult = await pool.query('SELECT COUNT(*) FROM grammar');

    res.json({
      rows: result.rows,
      total: parseInt(countResult.rows[0].count),
    });
  } catch (error) {
    console.error('Error fetching grammar:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// IMPORT grammar from CSV (must be BEFORE :id routes)
router.post('/grammar/import', adminMiddleware, async (req, res) => {
  try {
    const { records } = req.body;

    if (!records || !Array.isArray(records)) {
      return res.status(400).json({ error: 'Invalid format: records array required' });
    }

    let imported = 0;
    let skipped = 0;
    const errors = [];
    const groupedRecords = {};

    // Group records by pattern|meaning key, aggregate examples
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const { pattern, meaning, explanation, category, level, example_sentence, example_translation, title } = record;

      // Validate required fields
      if (!pattern || !meaning) {
        skipped++;
        errors.push(`Missing required fields (pattern="${pattern}", meaning="${meaning}")`);
        continue;
      }

      const key = `${pattern}|${meaning}`;
      
      if (!groupedRecords[key]) {
        groupedRecords[key] = {
          title: title || pattern,
          pattern,
          meaning,
          explanation: explanation || '',
          category: category || null,
          level: level || 2,
          examples: [],
        };
      }
      
      // Add example to the group if it exists and is not a duplicate
      if (example_sentence) {
        const existingExample = groupedRecords[key].examples.find(
          e => e.japanese === example_sentence
        );
        
        if (!existingExample) {
          groupedRecords[key].examples.push({
            japanese: example_sentence,
            vietnamese: example_translation || '',
          });
        }
      }
    }

    // Delete existing records that will be replaced by merged ones
    const patternsToDelete = Object.values(groupedRecords).map(r => ({
      pattern: r.pattern,
      meaning: r.meaning,
    }));

    console.log(`🗑️  Deleting old entries for ${patternsToDelete.length} patterns...`);
    
    for (const item of patternsToDelete) {
      await pool.query(
        'DELETE FROM grammar WHERE pattern = $1 AND meaning = $2',
        [item.pattern, item.meaning]
      );
    }

    // Insert grouped records into database
    for (const [key, record] of Object.entries(groupedRecords)) {
      try {
        const examplesJSON = record.examples.length > 0 ? JSON.stringify(record.examples) : null;

        console.log(`Record: pattern="${record.pattern}", meaning="${record.meaning}", examples=${record.examples.length}`);

        // Insert record with examples
        const result = await pool.query(
          'INSERT INTO grammar (title, pattern, explanation, meaning, category, level, example_sentence, examples) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
          [record.title, record.pattern, record.explanation, record.meaning, record.category, record.level, record.examples[0]?.japanese || null, examplesJSON]
        );

        if (result.rows.length > 0) {
          imported++;
          console.log(`✅ Imported: ${record.pattern} (${record.examples.length} examples)`);
        }
      } catch (err) {
        skipped++;
        errors.push(`${record.pattern}: ${err.message}`);
        console.error(`❌ Error importing record:`, err.message);
      }
    }

    console.log(`\n📊 Import Summary: Imported=${imported}, Skipped=${skipped}, Total=${records.length}`);

    res.json({
      imported,
      skipped,
      total: records.length,
      errors: errors.slice(0, 10),
    });
  } catch (error) {
    console.error('Error importing grammar:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// CREATE grammar
router.post('/grammar', adminMiddleware, async (req, res) => {
  try {
    const { title, pattern, explanation, meaning, category, example_sentence, level } = req.body;

    if (!title || !pattern || !explanation || !meaning) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await pool.query(
      'INSERT INTO grammar (title, pattern, explanation, meaning, category, example_sentence, level) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [title, pattern, explanation, meaning, category || null, example_sentence || null, level || 2]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating grammar:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

// UPDATE grammar
router.put('/grammar/:id', adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, pattern, explanation, meaning, category, example_sentence, level } = req.body;

    const result = await pool.query(
      'UPDATE grammar SET title = $1, pattern = $2, explanation = $3, meaning = $4, category = $5, example_sentence = $6, level = $7 WHERE id = $8 RETURNING *',
      [title, pattern, explanation, meaning, category, example_sentence, level, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Grammar not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating grammar:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

// DELETE grammar
router.delete('/grammar/:id', adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM grammar WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Grammar not found' });
    }

    res.json({ message: 'Grammar deleted successfully' });
  } catch (error) {
    console.error('Error deleting grammar:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ======================== SCENARIOS ADMIN ========================

// GET all scenarios
router.get('/scenarios', adminMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM scenarios ORDER BY id DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching scenarios:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// CREATE scenario
router.post('/scenarios', adminMiddleware, async (req, res) => {
  try {
    const { title, description, context, example_conversation, difficulty_level } = req.body;

    if (!title || !context) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await pool.query(
      'INSERT INTO scenarios (title, description, context, example_conversation, difficulty_level) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [title, description || null, context, example_conversation || null, difficulty_level || 2]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating scenario:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// UPDATE scenario
router.put('/scenarios/:id', adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, context, example_conversation, difficulty_level } = req.body;

    const result = await pool.query(
      'UPDATE scenarios SET title = $1, description = $2, context = $3, example_conversation = $4, difficulty_level = $5 WHERE id = $6 RETURNING *',
      [title, description, context, example_conversation, difficulty_level, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Scenario not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating scenario:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// DELETE scenario
router.delete('/scenarios/:id', adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM scenarios WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Scenario not found' });
    }

    res.json({ message: 'Scenario deleted successfully' });
  } catch (error) {
    console.error('Error deleting scenario:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ======================== TESTS ADMIN ========================

// GET all tests
router.get('/tests', adminMiddleware, async (req, res) => {
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

// CREATE test
router.post('/tests', adminMiddleware, async (req, res) => {
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

// Auto-generate test questions
router.post('/tests/:id/auto-generate', adminMiddleware, async (req, res) => {
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

// DELETE test
router.delete('/tests/:id', adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM tests WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Test not found' });
    }

    res.json({ message: 'Test deleted successfully' });
  } catch (error) {
    console.error('Error deleting test:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET test questions (with details)
router.get('/tests/:id/questions', adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT id, test_id, question_text, question_type, correct_answer, options FROM test_questions WHERE test_id = $1 ORDER BY id',
      [id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching test questions:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// UPDATE test question
router.put('/tests/:id/questions/:questionId', adminMiddleware, async (req, res) => {
  try {
    const { id, questionId } = req.params;
    const { question_text, question_type, correct_answer, options } = req.body;

    if (!question_text || !correct_answer) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const optionsJson = typeof options === 'string' ? options : JSON.stringify(options);

    const result = await pool.query(
      'UPDATE test_questions SET question_text = $1, question_type = $2, correct_answer = $3, options = $4 WHERE id = $5 AND test_id = $6 RETURNING *',
      [question_text, question_type, correct_answer, optionsJson, questionId, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Question not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating question:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// DELETE test question
router.delete('/tests/:id/questions/:questionId', adminMiddleware, async (req, res) => {
  try {
    const { id, questionId } = req.params;

    const result = await pool.query(
      'DELETE FROM test_questions WHERE id = $1 AND test_id = $2 RETURNING id',
      [questionId, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Question not found' });
    }

    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Error deleting question:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Helper functions
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
  return wrong.slice(0, count); // Return only real answers, no placeholder
}

export default router;
