const pkg = require('pg');
const { Pool } = pkg;
const pool = new Pool({ 
  connectionString: 'postgresql://postgres:postgresql@localhost:5432/aika_db' 
});

async function check() {
  try {
    // Check grammar records
    const grammarRes = await pool.query(
      "SELECT COUNT(*) as total, COUNT(DISTINCT category) as categories FROM grammar"
    );
    console.log('📊 Grammar table:');
    console.log('  Total:', grammarRes.rows[0].total);
    console.log('  Categories:', grammarRes.rows[0].categories);

    // Check if test was auto-generated
    const testRes = await pool.query(
      "SELECT * FROM tests WHERE category = 'jlpt_grammar' AND topic_type = 'grammar'"
    );
    console.log('\n📚 Test for jlpt_grammar:');
    if (testRes.rows.length > 0) {
      const test = testRes.rows[0];
      console.log('  Name:', test.name);
      console.log('  Total questions:', test.total_questions);
      
      // Count actual questions
      const qRes = await pool.query(
        "SELECT COUNT(*) as total FROM test_questions WHERE test_id = $1",
        [test.id]
      );
      console.log('  Questions created:', qRes.rows[0].total);
    } else {
      console.log('  ❌ Test not found - auto-generation may not have run');
    }

    // Check categories in grammar
    const catRes = await pool.query(
      "SELECT DISTINCT category FROM grammar ORDER BY category"
    );
    console.log('\n🏷️  Grammar categories:');
    catRes.rows.forEach(r => console.log('  -', r.category));

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await pool.end();
  }
}

check();
