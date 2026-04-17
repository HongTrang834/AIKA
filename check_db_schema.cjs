const pkg = require('pg');
const { Pool } = pkg;
const pool = new Pool({ 
  user: 'postgres',
  host: 'localhost',
  database: 'aika_db',
  password: 'admin',
  port: 5432
});
async function check() {
  try {
    const res = await pool.query("SELECT * FROM information_schema.tables WHERE table_name = 'grammar'");
    console.log('TABLE_G_EXISTS=' + (res.rowCount > 0));
    const columns = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'grammar'");
    console.log('COLUMNS=' + columns.rows.map(r => r.column_name).join(','));
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}
check();
