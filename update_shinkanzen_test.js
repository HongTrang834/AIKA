import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:postgresql@localhost:5432/aika_db',
});

async function findAndUpdateTest() {
  try {
    console.log('🔍 Finding shinkanzen test...\n');
    
    // Find shinkanzen test
    const testResult = await pool.query(
      `SELECT * FROM tests WHERE category = 'shinkanzen' AND topic_type = 'vocabulary'`
    );
    
    if (testResult.rows.length === 0) {
      console.log('❌ No shinkanzen vocabulary test found');
      await pool.end();
      return;
    }
    
    const test = testResult.rows[0];
    console.log(`📋 Found test: ${test.name} (ID: ${test.id})`);
    console.log(`   Current questions: ${test.total_questions}`);
    
    // Check how many vocabulary items in shinkanzen
    const vocabResult = await pool.query(
      `SELECT COUNT(*) as count FROM vocabulary WHERE category = 'shinkanzen'`
    );
    const vocabCount = vocabResult.rows[0].count;
    console.log(`📚 Vocabulary items in shinkanzen: ${vocabCount}`);
    
    // Update test to 100 questions
    await pool.query(
      `UPDATE tests SET total_questions = 100 WHERE id = $1`,
      [test.id]
    );
    console.log('✅ Updated test.total_questions to 100');
    
    // Delete old questions
    const deleteResult = await pool.query(
      `DELETE FROM test_questions WHERE test_id = $1`,
      [test.id]
    );
    console.log(`🗑️  Deleted ${deleteResult.rowCount} old questions`);
    
    // Generate 100 new questions
    console.log('\n🔄 Generating 100 new questions...');
    
    // Get all vocabulary items for this category
    const vocabItems = await pool.query(
      `SELECT * FROM vocabulary WHERE category = 'shinkanzen' ORDER BY RANDOM()`
    );
    
    if (vocabItems.rows.length < 100) {
      console.log(`⚠️  Only ${vocabItems.rows.length} items available, generating from those`);
    }
    
    const items = vocabItems.rows;
    const questionTypes = ['fill-blank', 'choose-reading', 'choose-meaning', 'sentence'];
    let questionsGenerated = 0;
    
    for (let i = 0; i < 100; i++) {
      try {
        const correctItem = items[i % items.length];
        const questionType = questionTypes[i % questionTypes.length];
        let question = '';
        let correctAnswer = '';
        let options = [];
        
        // Generate question based on type
        if (questionType === 'fill-blank') {
          question = `Fill the blank: ______ means "${correctItem.meaning}"`;
          correctAnswer = correctItem.word;
          // Get 3 random wrong answers
          options = [correctAnswer];
          for (let j = 0; j < 3; j++) {
            const randomItem = items[Math.floor(Math.random() * items.length)];
            if (!options.includes(randomItem.word)) {
              options.push(randomItem.word);
            }
          }
        } else if (questionType === 'choose-reading') {
          question = `Choose the correct reading for: ${correctItem.word}`;
          correctAnswer = correctItem.reading;
          options = [correctAnswer];
          for (let j = 0; j < 3; j++) {
            const randomItem = items[Math.floor(Math.random() * items.length)];
            if (!options.includes(randomItem.reading)) {
              options.push(randomItem.reading);
            }
          }
        } else if (questionType === 'choose-meaning') {
          question = `Choose the correct meaning for: ${correctItem.word}`;
          correctAnswer = correctItem.meaning;
          options = [correctAnswer];
          for (let j = 0; j < 3; j++) {
            const randomItem = items[Math.floor(Math.random() * items.length)];
            if (!options.includes(randomItem.meaning)) {
              options.push(randomItem.meaning);
            }
          }
        } else if (questionType === 'sentence') {
          question = `Fill the blank in the sentence: "${correctItem.example_sentence}"`;
          correctAnswer = correctItem.word;
          options = [correctAnswer];
          for (let j = 0; j < 3; j++) {
            const randomItem = items[Math.floor(Math.random() * items.length)];
            if (!options.includes(randomItem.word)) {
              options.push(randomItem.word);
            }
          }
        }
        
        // Shuffle options
        options = options.sort(() => Math.random() - 0.5);
        
        // Insert question
        await pool.query(
          `INSERT INTO test_questions (test_id, question_text, correct_answer, options, question_type, vocab_id)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [test.id, question, correctAnswer, JSON.stringify(options), questionType, correctItem.id]
        );
        
        questionsGenerated++;
        if ((i + 1) % 25 === 0) {
          console.log(`  ✅ Generated ${i + 1}/100 questions`);
        }
      } catch (err) {
        console.error(`❌ Error generating question ${i + 1}:`, err.message);
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`✅ Test updated: shinkanzen`);
    console.log(`📝 Questions generated: ${questionsGenerated}`);
    console.log(`✨ Done!`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

findAndUpdateTest();
