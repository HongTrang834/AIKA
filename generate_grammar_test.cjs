const pkg = require('pg');
const { Pool } = pkg;
const pool = new Pool({ 
  connectionString: 'postgresql://postgres:postgresql@localhost:5432/aika_db' 
});

async function generateGrammarTest() {
  try {
    console.log('📖 Auto-generating grammar test...\n');

    // Get all grammar items
    const grammarRes = await pool.query('SELECT * FROM grammar LIMIT 100');
    const grammarItems = grammarRes.rows;
    console.log(`📚 Retrieved ${grammarItems.length} grammar items`);

    // Find or create test
    let testId = null;
    const testRes = await pool.query(
      "SELECT id FROM tests WHERE name LIKE '%JLPT N2 Grammar%' LIMIT 1"
    );

    if (testRes.rows.length > 0) {
      testId = testRes.rows[0].id;
      console.log(`✅ Found existing test: ID ${testId}`);
    } else {
      const newTestRes = await pool.query(
        "INSERT INTO tests (name, category, topic_type, total_questions) VALUES ($1, $2, $3, $4) RETURNING id",
        ['JLPT N2 Grammar Mini Test', 'jlpt_grammar', 'grammar', 100]
      );
      testId = newTestRes.rows[0].id;
      console.log(`✨ Created new test: ID ${testId}`);
    }

    // Update total_questions
    await pool.query('UPDATE tests SET total_questions = 100 WHERE id = $1', [testId]);
    console.log('✅ Updated total_questions to 100');

    // Delete old questions
    const delRes = await pool.query('DELETE FROM test_questions WHERE test_id = $1', [testId]);
    console.log(`🗑️  Deleted ${delRes.rowCount} old questions`);

    // Generate 100 questions with varied types
    console.log('\n🔄 Generating 100 test questions...');
    const questionTypes = ['choose-meaning', 'choose-pattern', 'fill-blank', 'explanation'];
    let inserted = 0;
    let failed = 0;

    for (let i = 0; i < 100; i++) {
      try {
        const item = grammarItems[i % grammarItems.length];
        const qType = questionTypes[i % 4];
        let q = '', ans = '', opts = [];

        if (qType === 'choose-meaning') {
          q = `What is the meaning of: ${item.pattern}`;
          ans = item.meaning;
          opts = [item.meaning];
        } else if (qType === 'choose-pattern') {
          q = `Which pattern means: ${item.meaning}`;
          ans = item.pattern;
          opts = [item.pattern];
        } else if (qType === 'fill-blank') {
          q = `Pattern: ${item.pattern}`;
          ans = item.meaning;
          opts = [item.meaning];
        } else {
          q = `Explanation: ${item.explanation}`;
          ans = item.pattern;
          opts = [item.pattern];
        }

        // Add 3 random wrong options
        for (let j = 0; j < 3; j++) {
          const randomItem = grammarItems[Math.floor(Math.random() * grammarItems.length)];
          if (qType === 'choose-pattern' && !opts.includes(randomItem.pattern)) {
            opts.push(randomItem.pattern);
          } else if (!opts.includes(randomItem.meaning)) {
            opts.push(randomItem.meaning);
          }
        }

        // Shuffle options
        opts = opts.slice(0, 4).sort(() => Math.random() - 0.5);

        await pool.query(
          'INSERT INTO test_questions (test_id, question_text, correct_answer, options, question_type, grammar_id) VALUES ($1, $2, $3, $4, $5, $6)',
          [testId, q, ans, JSON.stringify(opts), qType, item.id]
        );
        inserted++;

        if ((i + 1) % 25 === 0) {
          console.log(`  ✅ Generated ${i + 1}/100 questions`);
        }
      } catch (err) {
        failed++;
        console.error(`  ❌ Error on question ${i + 1}:`, err.message);
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`  ✅ Inserted: ${inserted}`);
    console.log(`  ❌ Failed: ${failed}`);
    console.log(`  📝 Test ID: ${testId}`);
    console.log(`\n✨ Done! JLPT N2 Grammar test is ready`);

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await pool.end();
  }
}

generateGrammarTest();
