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

    // Get category from first record
    const firstCategory = records[0]?.category?.trim() || 'General';
    console.log(`📁 Category: ${firstCategory}`);

    // Only delete records with same category (preserve other categories)
    await pool.query('DELETE FROM vocabulary WHERE category = $1', [firstCategory]);
    console.log(`🗑️  Cleared vocabulary records for category: ${firstCategory}`);

    // Check if table is empty to reset sequence
    const countCheck = await pool.query('SELECT COUNT(*) FROM vocabulary');
    if (parseInt(countCheck.rows[0].count) === 0) {
      try {
        await pool.query("SELECT setval(pg_get_serial_sequence('vocabulary', 'id'), 1, false)");
        console.log('🔄 Reset vocabulary sequence to 1 because table is empty');
      } catch (seqErr) {
        console.error('Failed to reset vocabulary sequence:', seqErr.message);
      }
    }

    const validRecords = [];
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
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
        errors.push(`Row ${i + 1}: Missing required fields (word="${word}", reading="${reading}", meaning="${meaning}")`);
        continue;
      }

      validRecords.push({
        word,
        reading,
        meaning,
        category,
        level,
        example_sentence,
        example_translation
      });
    }

    if (validRecords.length > 0) {
      try {
        const values = [];
        const valueStrings = [];
        let paramIndex = 1;

        for (const record of validRecords) {
          valueStrings.push(`($${paramIndex}, $${paramIndex+1}, $${paramIndex+2}, $${paramIndex+3}, $${paramIndex+4}, $${paramIndex+5}, $${paramIndex+6})`);
          values.push(
            record.word,
            record.reading,
            record.meaning,
            record.category,
            record.level,
            record.example_sentence,
            record.example_translation
          );
          paramIndex += 7;
        }

        const query = `
          INSERT INTO vocabulary (word, reading, meaning, category, level, example_sentence, example_translation)
          VALUES ${valueStrings.join(', ')}
          RETURNING id
        `;
        const result = await pool.query(query, values);
        imported = result.rowCount;
      } catch (insertErr) {
        console.error('❌ Bulk insert vocabulary failed:', insertErr.message);
        return res.status(500).json({ error: 'Bulk insert vocabulary failed', details: insertErr.message });
      }
    }

    console.log(`\n📊 Import Summary: Imported=${imported}, Skipped=${skipped}, Total=${records.length}`);

    // Auto-generate test for imported category
    const countResult = await pool.query('SELECT COUNT(*) as total FROM vocabulary WHERE category = $1', [firstCategory]);
    const categoryCount = parseInt(countResult.rows[0].total);
    
    if (categoryCount > 0) {
      console.log(`\n📖 Auto-generating test for ${firstCategory} (${categoryCount} items)...`);
      
      try {
        let testId = null;
        const testResult = await pool.query(
          'SELECT id FROM tests WHERE category = $1 AND topic_type = $2',
          [firstCategory, 'vocabulary']
        );
        
        // Generate up to 50 questions or all if less
        const numQuestions = Math.min(50, categoryCount);
        const testName = `${firstCategory} Vocabulary Test`;
        
        if (testResult.rows.length > 0) {
          testId = testResult.rows[0].id;
          // Update name and total_questions to resolve conflicts and match current count
          await pool.query('UPDATE tests SET name = $1, total_questions = $2 WHERE id = $3', [testName, numQuestions, testId]);
        } else {
          const newTestResult = await pool.query(
            'INSERT INTO tests (name, category, topic_type, total_questions) VALUES ($1, $2, $3, $4) RETURNING id',
            [testName, firstCategory, 'vocabulary', numQuestions]
          );
          testId = newTestResult.rows[0].id;
        }
        
        await pool.query('DELETE FROM test_questions WHERE test_id = $1', [testId]);
        
        const vocabItems = await pool.query(
          'SELECT id, word, reading, meaning, category, example_sentence FROM vocabulary WHERE category = $1 ORDER BY RANDOM() LIMIT $2',
          [firstCategory, numQuestions * 2]
        );
        const items = vocabItems.rows;
        const maxWrongAnswers = Math.max(1, Math.min(3, items.length - 2));
        
        const questionTypes = ['fill-blank', 'choose-meaning', 'choose-reading', 'sentence'];
        const generatedQuestions = [];

        for (let i = 0; i < Math.min(numQuestions, items.length); i++) {
          const item = items[i];
          const questionType = questionTypes[i % 4];
          let q = '', ans = '', opts = [];
          
          if (questionType === 'fill-blank') {
            q = `"_____" có nghĩa là gì? (Đọc: ${item.reading})`;
            ans = item.meaning;
            opts = [item.meaning, ...getRandomWrongAnswers(items, item.meaning, i, 'meaning', maxWrongAnswers)];
          } else if (questionType === 'choose-reading') {
            q = `Từ "${item.word}" đọc như thế nào?`;
            ans = item.reading;
            opts = [item.reading, ...getRandomReadings(items, item.reading, maxWrongAnswers)];
          } else if (questionType === 'choose-meaning') {
            q = `Chọn nghĩa của từ "${item.word}"`;
            ans = item.meaning;
            opts = [item.meaning, ...getRandomWrongAnswers(items, item.meaning, i, 'meaning', maxWrongAnswers)];
          } else {
            q = `Chọn từ phù hợp để điền vào: "Tôi phải _____ [${item.meaning}] mỗi ngày"`;
            ans = item.word;
            opts = [item.word, ...getRandomWrongWords(items, item.word, i, maxWrongAnswers)];
          }
          
          opts = opts.sort(() => Math.random() - 0.5);
          generatedQuestions.push({
            q,
            ans,
            opts: JSON.stringify(opts),
            questionType,
            vocab_id: item.id
          });
        }

        if (generatedQuestions.length > 0) {
          const values = [];
          const valueStrings = [];
          let paramIndex = 1;
          for (const gq of generatedQuestions) {
            valueStrings.push(`($${paramIndex}, $${paramIndex+1}, $${paramIndex+2}, $${paramIndex+3}, $${paramIndex+4}, $${paramIndex+5})`);
            values.push(testId, gq.q, gq.ans, gq.opts, gq.questionType, gq.vocab_id);
            paramIndex += 6;
          }
          const query = `
            INSERT INTO test_questions (test_id, question_text, correct_answer, options, question_type, vocab_id)
            VALUES ${valueStrings.join(', ')}
          `;
          await pool.query(query, values);
        }

        console.log(`✅ Generated ${generatedQuestions.length} test questions for ${firstCategory}`);
      } catch (err) {
        console.error('⚠️  Auto-generate failed:', err.message);
      }
    }

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
    const { word, reading, meaning, category, level, example_sentence, example_translation } = req.body;

    if (!word || !reading || !meaning) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await pool.query(
      'INSERT INTO vocabulary (word, reading, meaning, category, level, example_sentence, example_translation) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [word, reading, meaning, category || null, level || 2, example_sentence || null, example_translation || null]
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
    const { word, reading, meaning, category, level, example_sentence, example_translation } = req.body;

    const result = await pool.query(
      'UPDATE vocabulary SET word = $1, reading = $2, meaning = $3, category = $4, level = $5, example_sentence = $6, example_translation = $7 WHERE id = $8 RETURNING *',
      [word, reading, meaning, category, level, example_sentence, example_translation, id]
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

// DELETE all vocabulary (must be before :id route)
router.delete('/vocabulary/all', adminMiddleware, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM vocabulary');
    try {
      await pool.query("SELECT setval(pg_get_serial_sequence('vocabulary', 'id'), 1, false)");
      console.log('🔄 Reset vocabulary sequence to 1 after deleting all');
    } catch (seqErr) {
      console.error('Failed to reset vocabulary sequence:', seqErr.message);
    }
    res.json({ message: `Deleted ${result.rowCount} vocabulary items` });
  } catch (error) {
    console.error('Error deleting all vocabulary:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// DELETE vocabulary by ID
router.delete('/vocabulary/:id', adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM vocabulary WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vocabulary not found' });
    }

    // Check if table is empty to reset sequence
    const countCheck = await pool.query('SELECT COUNT(*) FROM vocabulary');
    if (parseInt(countCheck.rows[0].count) === 0) {
      try {
        await pool.query("SELECT setval(pg_get_serial_sequence('vocabulary', 'id'), 1, false)");
        console.log('🔄 Reset vocabulary sequence to 1 because table is empty');
      } catch (seqErr) {
        console.error('Failed to reset vocabulary sequence:', seqErr.message);
      }
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

    console.log(`📥 Importing ${records.length} grammar records...`);
    console.log('First record:', JSON.stringify(records[0], null, 2));

    // Get category from first record
    const firstCategory = records[0]?.category?.trim() || 'jlpt_grammar';
    console.log(`📁 Category: ${firstCategory}`);

    // Only delete records with same category (preserve other categories)
    await pool.query('DELETE FROM grammar WHERE category = $1', [firstCategory]);
    console.log(`🗑️  Cleared grammar records for category: ${firstCategory}`);

    // Check if table is empty to reset sequence
    const countCheck = await pool.query('SELECT COUNT(*) FROM grammar');
    if (parseInt(countCheck.rows[0].count) === 0) {
      try {
        await pool.query("SELECT setval(pg_get_serial_sequence('grammar', 'id'), 1, false)");
        console.log('🔄 Reset grammar sequence to 1 because table is empty');
      } catch (seqErr) {
        console.error('Failed to reset grammar sequence:', seqErr.message);
      }
    }

    const validRecords = [];
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const title = record.title?.trim();
      const pattern = record.pattern?.trim();
      const meaning = record.meaning?.trim();
      const explanation = record.explanation?.trim() || '';
      const category = record.category?.trim() || null;
      const level = parseInt(record.level) || 2;
      const example_sentence = record.example_sentence?.trim() || null;
      const example_translation = record.example_translation?.trim() || null;

      // Validate required fields
      if (!pattern || !meaning) {
        skipped++;
        errors.push(`Row ${i + 1}: Missing required fields (pattern="${pattern}", meaning="${meaning}")`);
        continue;
      }

      validRecords.push({
        title: title || pattern,
        pattern,
        explanation,
        meaning,
        category,
        level,
        example_sentence,
        example_translation
      });
    }

    if (validRecords.length > 0) {
      try {
        const values = [];
        const valueStrings = [];
        let paramIndex = 1;

        for (const record of validRecords) {
          valueStrings.push(`($${paramIndex}, $${paramIndex+1}, $${paramIndex+2}, $${paramIndex+3}, $${paramIndex+4}, $${paramIndex+5}, $${paramIndex+6}, $${paramIndex+7})`);
          values.push(
            record.title,
            record.pattern,
            record.explanation,
            record.meaning,
            record.category,
            record.level,
            record.example_sentence,
            record.example_translation
          );
          paramIndex += 8;
        }

        const query = `
          INSERT INTO grammar (title, pattern, explanation, meaning, category, level, example_sentence, example_translation)
          VALUES ${valueStrings.join(', ')}
          RETURNING id
        `;
        const result = await pool.query(query, values);
        imported = result.rowCount;
      } catch (insertErr) {
        console.error('❌ Bulk insert grammar failed:', insertErr.message);
        return res.status(500).json({ error: 'Bulk insert grammar failed', details: insertErr.message });
      }
    }

    console.log(`\n📊 Import Summary: Imported=${imported}, Skipped=${skipped}, Total=${records.length}`);

    // Auto-generate test for imported category
    const countResult = await pool.query('SELECT COUNT(*) as total FROM grammar WHERE category = $1', [firstCategory]);
    const categoryCount = parseInt(countResult.rows[0].total);
    
    if (categoryCount > 0) {
      console.log(`\n📖 Auto-generating test for ${firstCategory} (${categoryCount} items)...`);
      
      try {
        let testId = null;
        const testResult = await pool.query(
          'SELECT id FROM tests WHERE category = $1 AND topic_type = $2',
          [firstCategory, 'grammar']
        );
        
        const numQuestions = Math.min(50, categoryCount);
        const testName = `${firstCategory} Grammar Test`;
        
        if (testResult.rows.length > 0) {
          testId = testResult.rows[0].id;
          // Update name and total_questions to resolve conflicts and match current count
          await pool.query('UPDATE tests SET name = $1, total_questions = $2 WHERE id = $3', [testName, numQuestions, testId]);
        } else {
          const newTestResult = await pool.query(
            'INSERT INTO tests (name, category, topic_type, total_questions) VALUES ($1, $2, $3, $4) RETURNING id',
            [testName, firstCategory, 'grammar', numQuestions]
          );
          testId = newTestResult.rows[0].id;
        }
        
        await pool.query('DELETE FROM test_questions WHERE test_id = $1', [testId]);
        
        const grammarItems = await pool.query(
          'SELECT id, pattern, meaning, category, example_sentence FROM grammar WHERE category = $1 ORDER BY RANDOM() LIMIT $2',
          [firstCategory, numQuestions * 2]
        );
        const items = grammarItems.rows;
        const maxWrongAnswers = Math.max(1, Math.min(3, items.length - 2));
        
        const questionTypes = ['fill-blank', 'choose-meaning', 'choose-reading', 'sentence'];
        const generatedQuestions = [];

        for (let i = 0; i < Math.min(numQuestions, items.length); i++) {
          const item = items[i];
          const questionType = questionTypes[i % 4];
          let q = '', ans = '', opts = [];
          
          if (questionType === 'fill-blank') {
            q = `Ngữ pháp "_____" có ý nghĩa: ?`;
            ans = item.meaning;
            opts = [item.meaning, ...getRandomWrongAnswers(items, item.meaning, i, 'meaning', maxWrongAnswers)];
          } else if (questionType === 'choose-meaning') {
            q = `Chọn ý nghĩa của ngữ pháp "${item.pattern}"`;
            ans = item.meaning;
            opts = [item.meaning, ...getRandomWrongAnswers(items, item.meaning, i, 'meaning', maxWrongAnswers)];
          } else if (questionType === 'choose-reading') {
            q = `Ngữ pháp "${item.pattern}" diễn tả ý gì?`;
            ans = item.meaning;
            opts = [item.meaning, ...getRandomWrongAnswers(items, item.meaning, i, 'meaning', maxWrongAnswers)];
          } else {
            const sentenceTarget = item.example_sentence || item.meaning;
            q = `Ví dụ với "${item.pattern}": ?`;
            ans = sentenceTarget;
            opts = [sentenceTarget, ...getRandomWrongAnswers(items, sentenceTarget, i, 'example_sentence', maxWrongAnswers)];
          }
          
          opts = opts.sort(() => Math.random() - 0.5);
          generatedQuestions.push({
            q,
            ans,
            opts: JSON.stringify(opts),
            questionType,
            grammar_id: item.id
          });
        }

        if (generatedQuestions.length > 0) {
          const values = [];
          const valueStrings = [];
          let paramIndex = 1;
          for (const gq of generatedQuestions) {
            valueStrings.push(`($${paramIndex}, $${paramIndex+1}, $${paramIndex+2}, $${paramIndex+3}, $${paramIndex+4}, $${paramIndex+5})`);
            values.push(testId, gq.q, gq.ans, gq.opts, gq.questionType, gq.grammar_id);
            paramIndex += 6;
          }
          const query = `
            INSERT INTO test_questions (test_id, question_text, correct_answer, options, question_type, grammar_id)
            VALUES ${valueStrings.join(', ')}
          `;
          await pool.query(query, values);
        }

        console.log(`✅ Generated ${generatedQuestions.length} test questions for ${firstCategory}`);
      } catch (err) {
        console.error('⚠️  Auto-generate failed:', err.message);
      }
    }

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
    const { title, pattern, explanation, meaning, category, example_sentence, example_translation, level } = req.body;

    if (!title || !pattern || !explanation || !meaning) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await pool.query(
      'INSERT INTO grammar (title, pattern, explanation, meaning, category, example_sentence, example_translation, level) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [title, pattern, explanation, meaning, category || null, example_sentence || null, example_translation || null, level || 2]
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
    const { title, pattern, explanation, meaning, category, example_sentence, example_translation, level } = req.body;

    const result = await pool.query(
      'UPDATE grammar SET title = $1, pattern = $2, explanation = $3, meaning = $4, category = $5, example_sentence = $6, example_translation = $7, level = $8 WHERE id = $9 RETURNING *',
      [title, pattern, explanation, meaning, category, example_sentence, example_translation, level, id]
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

// DELETE all grammar (must be before :id route)
router.delete('/grammar/all', adminMiddleware, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM grammar');
    try {
      await pool.query("SELECT setval(pg_get_serial_sequence('grammar', 'id'), 1, false)");
      console.log('🔄 Reset grammar sequence to 1 after deleting all');
    } catch (seqErr) {
      console.error('Failed to reset grammar sequence:', seqErr.message);
    }
    res.json({ message: `Deleted ${result.rowCount} grammar items` });
  } catch (error) {
    console.error('Error deleting all grammar:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// DELETE grammar by ID
router.delete('/grammar/:id', adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM grammar WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Grammar not found' });
    }

    // Check if table is empty to reset sequence
    const countCheck = await pool.query('SELECT COUNT(*) FROM grammar');
    if (parseInt(countCheck.rows[0].count) === 0) {
      try {
        await pool.query("SELECT setval(pg_get_serial_sequence('grammar', 'id'), 1, false)");
        console.log('🔄 Reset grammar sequence to 1 because table is empty');
      } catch (seqErr) {
        console.error('Failed to reset grammar sequence:', seqErr.message);
      }
    }

    res.json({ message: 'Grammar deleted successfully' });
  } catch (error) {
    console.error('Error deleting grammar:', error);
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
    if (generateQuestions.length > 0) {
      const values = [];
      const valueStrings = [];
      let paramIndex = 1;
      for (const q of generateQuestions) {
        valueStrings.push(`($${paramIndex}, $${paramIndex+1}, $${paramIndex+2}, $${paramIndex+3}, $${paramIndex+4}, $${paramIndex+5}, $${paramIndex+6})`);
        values.push(q.test_id, q.question_text, q.question_type, q.correct_answer, q.options, q.vocab_id, q.grammar_id);
        paramIndex += 7;
      }
      const query = `
        INSERT INTO test_questions (test_id, question_text, question_type, correct_answer, options, vocab_id, grammar_id)
        VALUES ${valueStrings.join(', ')}
      `;
      await pool.query(query, values);
      inserted = generateQuestions.length;
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

// ======================== DECKS ADMIN ========================

// GET all global decks
// GET all decks
router.get('/decks', adminMiddleware, async (req, res) => {
  try {
    const limit = req.query.limit || 50;
    const offset = req.query.offset || 0;

    const result = await pool.query(
      `SELECT 
        d.id,
        d.name,
        d.description,
        d.color,
        d.is_global,
        d.created_at,
        COALESCE(COUNT(f.id), 0) as card_count
      FROM flashcard_decks d
      LEFT JOIN flashcards f ON f.deck_id = d.id AND f.user_id IS NULL
      WHERE d.is_global = TRUE
      GROUP BY d.id
      ORDER BY d.created_at DESC
      LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const countResult = await pool.query('SELECT COUNT(*) FROM flashcard_decks WHERE is_global = TRUE');

    res.json({
      rows: result.rows,
      total: parseInt(countResult.rows[0].count),
    });
  } catch (error) {
    console.error('Error fetching decks:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET single deck with flashcards
router.get('/decks/:id', adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // Get deck info
    const deckResult = await pool.query(
      'SELECT * FROM flashcard_decks WHERE id = $1 AND is_global = TRUE',
      [id]
    );

    if (deckResult.rows.length === 0) {
      return res.status(404).json({ error: 'Deck not found' });
    }

    const deck = deckResult.rows[0];

    // Get flashcards with vocabulary
    const flashcardsResult = await pool.query(
      `SELECT 
        f.id,
        f.vocab_id,
        f.grammar_id,
        f.deck_id,
        COALESCE(v.word, g.pattern) as word,
        COALESCE(v.reading, g.title) as reading,
        COALESCE(v.meaning, g.meaning) as meaning
      FROM flashcards f
      LEFT JOIN vocabulary v ON f.vocab_id = v.id
      LEFT JOIN grammar g ON f.grammar_id = g.id
      WHERE f.deck_id = $1 AND f.user_id IS NULL
      ORDER BY f.id`,
      [id]
    );

    res.json({
      ...deck,
      flashcards: flashcardsResult.rows,
    });
  } catch (error) {
    console.error('Error fetching deck:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// CREATE global deck
router.post('/decks', adminMiddleware, async (req, res) => {
  try {
    const { name, description, color } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Deck name is required' });
    }

    const result = await pool.query(
      'INSERT INTO flashcard_decks (name, description, color, is_global) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, description || '', color || 'blue', true]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating global deck:', error.message);
    console.error('Error details:', error.code, error.constraint);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

// UPDATE global deck
router.put('/decks/:id', adminMiddleware, async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { name, description, color, vocab_ids } = req.body;

    await client.query('BEGIN');

    const result = await client.query(
      `UPDATE flashcard_decks 
       SET name = COALESCE($1, name), 
           description = COALESCE($2, description),
           color = COALESCE($3, color),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 AND is_global = TRUE
       RETURNING *`,
      [name, description, color, id]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Deck not found' });
    }

    if (Array.isArray(vocab_ids)) {
      // Sync flashcards: delete old global ones, insert new ones
      await client.query('DELETE FROM flashcards WHERE deck_id = $1 AND user_id IS NULL', [id]);
      
      const uniqueVocabIds = Array.from(new Set(vocab_ids));
      if (uniqueVocabIds.length > 0) {
        // Use a more robust insert to handle many IDs
        const insertValues = [];
        const valueParams = [];
        uniqueVocabIds.forEach((vId, index) => {
          insertValues.push(`(NULL, $${index + 2}, $1)`);
          valueParams.push(vId);
        });

        const insertQuery = `INSERT INTO flashcards (user_id, vocab_id, deck_id) VALUES ${insertValues.join(', ')}`;
        await client.query(insertQuery, [id, ...valueParams]);
      }
    }

    await client.query('COMMIT');
    
    // Get updated card count
    const countRes = await pool.query('SELECT COUNT(*) FROM flashcards WHERE deck_id = $1 AND user_id IS NULL', [id]);
    
    res.json({
      ...result.rows[0],
      card_count: parseInt(countRes.rows[0].count)
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating deck:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    client.release();
  }
});

// DELETE global deck
router.delete('/decks/:id', adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM flashcard_decks WHERE id = $1 AND is_global = TRUE RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Deck not found' });
    }

    res.json({ message: 'Deck deleted successfully' });
  } catch (error) {
    console.error('Error deleting deck:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// BULK CREATE FLASHCARDS FOR DECK
router.post('/decks/:deckId/flashcards/bulk', adminMiddleware, async (req, res) => {
  try {
    const { deckId } = req.params;
    const { flashcards, vocab_ids = [], categories = [] } = req.body;

    console.log(`📝 Bulk creating flashcards for deck ${deckId}`);
    console.log(`📦 Received vocab_ids=${vocab_ids?.length || 0}, categories=${categories?.length || 0}`);

    // Verify deck exists and is global
    const deckCheck = await pool.query(
      'SELECT id FROM flashcard_decks WHERE id = $1 AND is_global = TRUE',
      [deckId]
    );

    if (deckCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Deck not found or not global' });
    }

    let targetVocabIds = [];

    if (Array.isArray(vocab_ids) && vocab_ids.length > 0) {
      targetVocabIds.push(...vocab_ids.map((id) => Number(id)).filter(Boolean));
    }

    if (Array.isArray(categories) && categories.length > 0) {
      const categoryResult = await pool.query(
        'SELECT id FROM vocabulary WHERE category = ANY($1::text[])',
        [categories]
      );
      targetVocabIds.push(...categoryResult.rows.map((row) => row.id));
    }

    // Backward-compatible path for old payload format
    if (Array.isArray(flashcards) && flashcards.length > 0) {
      for (const fc of flashcards) {
        try {
          const { word, reading, meaning } = fc;
          if (!word || !meaning) continue;

          const vocabResult = await pool.query(
            'INSERT INTO vocabulary (word, reading, meaning, level) VALUES ($1, $2, $3, $4) RETURNING id',
            [word, reading || word, meaning, 2]
          );
          targetVocabIds.push(vocabResult.rows[0].id);
        } catch (itemErr) {
          console.error('❌ Error creating backward-compatible vocab item:', itemErr.message);
        }
      }
    }

    targetVocabIds = Array.from(new Set(targetVocabIds));

    if (targetVocabIds.length === 0) {
      return res.status(400).json({ error: 'No vocabulary selected' });
    }

    const existingResult = await pool.query(
      `SELECT vocab_id 
       FROM flashcards 
       WHERE deck_id = $1 AND user_id IS NULL AND vocab_id = ANY($2::int[])`,
      [deckId, targetVocabIds]
    );
    const existingSet = new Set(existingResult.rows.map((row) => row.vocab_id));

    const idsToInsert = targetVocabIds.filter((id) => !existingSet.has(id));
    let created = 0;
    const errors = [];

    for (const vocabId of idsToInsert) {
      try {
        await pool.query(
          'INSERT INTO flashcards (user_id, vocab_id, deck_id) VALUES ($1, $2, $3)',
          [null, vocabId, deckId]
        );

        created++;
      } catch (itemErr) {
        console.error('❌ Error creating flashcard item:', itemErr.message);
        errors.push(itemErr.message);
      }
    }

    console.log(`✅ Bulk creation complete: ${created}/${targetVocabIds.length} created`);

    res.json({
      message: `Created ${created} flashcards`,
      created,
      skipped: targetVocabIds.length - created,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Error bulk creating flashcards:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ======================== FLASHCARDS ADMIN ========================

// GET all flashcards (with pagination)
router.get('/flashcards', adminMiddleware, async (req, res) => {
  try {
    const limit = req.query.limit || 50;
    const offset = req.query.offset || 0;

    const result = await pool.query(
      `SELECT 
        f.id,
        f.user_id,
        f.vocab_id,
        f.grammar_id,
        f.deck_id,
        f.interval,
        f.repetitions,
        f.ease_factor,
        f.next_review_date,
        f.created_at,
        COALESCE(v.word, g.pattern, 'N/A') as word,
        COALESCE(v.reading, g.title, 'N/A') as reading,
        COALESCE(v.meaning, g.meaning, 'N/A') as meaning,
        COALESCE(u.username, 'Unknown') as username
      FROM flashcards f
      LEFT JOIN vocabulary v ON f.vocab_id = v.id
      LEFT JOIN grammar g ON f.grammar_id = g.id
      LEFT JOIN users u ON f.user_id = u.id
      ORDER BY f.created_at DESC
      LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const countResult = await pool.query('SELECT COUNT(*) FROM flashcards');

    res.json({
      rows: result.rows,
      total: parseInt(countResult.rows[0].count),
    });
  } catch (error) {
    console.error('Error fetching flashcards:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// CREATE flashcard
router.post('/flashcards', adminMiddleware, async (req, res) => {
  try {
    const { user_id, vocab_id, grammar_id, deck_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    if (!vocab_id && !grammar_id) {
      return res.status(400).json({ error: 'vocab_id or grammar_id is required' });
    }

    const result = await pool.query(
      'INSERT INTO flashcards (user_id, vocab_id, grammar_id, deck_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [user_id, vocab_id || null, grammar_id || null, deck_id || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating flashcard:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// UPDATE flashcard
router.put('/flashcards/:id', adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { deck_id, interval, repetitions, ease_factor } = req.body;

    const result = await pool.query(
      'UPDATE flashcards SET deck_id = $1, interval = $2, repetitions = $3, ease_factor = $4 WHERE id = $5 RETURNING *',
      [deck_id || null, interval || 0, repetitions || 0, ease_factor || 2.5, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Flashcard not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating flashcard:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// DELETE flashcard
router.delete('/flashcards/:id', adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM flashcards WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Flashcard not found' });
    }

    res.json({ message: 'Flashcard deleted successfully' });
  } catch (error) {
    console.error('Error deleting flashcard:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
