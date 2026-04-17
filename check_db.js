import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:postgresql@localhost:5432/aika_db',
});

const queries = [
  'SELECT COUNT(*) as total FROM vocabulary;',
  'SELECT COUNT(DISTINCT category) as total_categories FROM vocabulary;',
  'SELECT category, COUNT(*) as count FROM vocabulary GROUP BY category ORDER BY count DESC LIMIT 20;',
  'SELECT COUNT(*) as total FROM grammar;',
  'SELECT COUNT(DISTINCT category) as total_categories FROM grammar;',
  'SELECT category, COUNT(*) as count FROM grammar GROUP BY category ORDER BY count DESC LIMIT 20;',
];

async function checkDatabase() {
  try {
    console.log('📊 Database Status Check\n');
    
    for (const query of queries) {
      console.log(`📋 Query: ${query}`);
      const result = await pool.query(query);
      console.log('📈 Result:', JSON.stringify(result.rows, null, 2));
      console.log('---\n');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkDatabase();
