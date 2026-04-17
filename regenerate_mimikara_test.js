import pkg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pkg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Helper functions from admin.js
function getRandomWrongAnswers(items, correct, currentIndex, field, count) {
  const wrong = items
    .filter((item, idx) => idx !== currentIndex && item[field] !== correct)
    .map(item => item[field])
    .sort(() => Math.random() - 0.5);
  return wrong.slice(0, count);
}

function getRandomReadings(items, correct, count) {
  const readings = items.map(item => item.reading).filter(r => r !== correct)
    .sort(() => Math.random() - 0.5);
  return readings.slice(0, count);
}

function getRandomWrongWords(items, correct, currentIndex, count) {
  const wrong = items
    .filter((item, idx) => idx !== currentIndex && item.word !== correct)
    .map(item => item.word)
    .sort(() => Math.random() - 0.5);
  return wrong.slice(0, count);
}

async function regenerateTest() {
  try {
    // Get test info
    const testResult = await pool.query('SELECT * FROM tests WHERE id = $1', [14]);
    if (testResult.rows.length === 0) {
      throw new Error('Test not found');
    }

    const test = testResult.rows[0];
    const { id, name, category, topic_type, total_questions } = test;
    
    console.log(`🔄 Regenerating test ${id} (${name}) with ${total_questions} questions...`);

    // Get all items in this category
    const itemsResult = await pool.query(
      'SELECT id, word, reading, meaning, category, example_sentence FROM vocabulary WHERE category = $1 LIMIT $2',
      [category, total_questions * 2]
    );

    const items = itemsResult.rows;
    if (items.length === 0) {
      throw new Error(`No vocabulary items found in category "${category}"`);
    }

    console.log(`📚 Found ${items.length} vocabulary items for category "${category}"`);

    // Calculate max wrong answers
    const maxWrongAnswers = Math.max(1, Math.min(3, items.length - 2));

    // Generate questions
    const questionTypes = ['fill-blank', 'choose-meaning', 'choose-reading', 'sentence'];
    const generateQuestions = [];

    for (let i = 0; i < Math.min(total_questions, items.length); i++) {
      const item = items[i];
      const questionType = questionTypes[i % questionTypes.length];
      
      let question, options, correctAnswer;

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

      generateQuestions.push({
        test_id: id,
        question_text: question,
        question_type: questionType,
        correct_answer: correctAnswer,
        options: JSON.stringify(options.sort(() => Math.random() - 0.5)),
        vocab_id: item.id,
        grammar_id: null,
      });
    }

    // Delete old questions
    await pool.query('DELETE FROM test_questions WHERE test_id = $1', [id]);
    console.log(`🗑️  Deleted old questions`);

    // Insert new questions
    let inserted = 0;
    for (const q of generateQuestions) {
      await pool.query(
        'INSERT INTO test_questions (test_id, question_text, question_type, correct_answer, options, vocab_id, grammar_id) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [q.test_id, q.question_text, q.question_type, q.correct_answer, q.options, q.vocab_id, q.grammar_id]
      );
      inserted++;
    }

    console.log(`✅ Generated ${inserted} questions for mimikara test`);
    pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    pool.end();
  }
}

regenerateTest();
