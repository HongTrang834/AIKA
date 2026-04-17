import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:postgresql@localhost:5432/aika_db',
});

async function checkTestQuestions() {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'test_questions'
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 test_questions columns:');
    console.log(JSON.stringify(result.rows, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkTestQuestions();
