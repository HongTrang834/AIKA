import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:postgresql@localhost:5432/aika_db',
});

async function checkSchema() {
  try {
    console.log('📊 Database Schema Check\n');
    
    // Check vocabulary table schema
    console.log('📋 VOCABULARY Table Columns:');
    let result = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'vocabulary'
      ORDER BY ordinal_position;
    `);
    console.log(JSON.stringify(result.rows, null, 2));
    
    // Check grammar table schema
    console.log('\n📋 GRAMMAR Table Columns:');
    result = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'grammar'
      ORDER BY ordinal_position;
    `);
    console.log(JSON.stringify(result.rows, null, 2));
    
    // Check if grammar table exists
    console.log('\n📋 Tables in database:');
    result = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    console.log(JSON.stringify(result.rows.map(r => r.table_name), null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkSchema();
