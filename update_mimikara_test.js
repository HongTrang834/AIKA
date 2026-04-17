import pkg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pkg;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Update total_questions for mimikara test
pool.query("UPDATE tests SET total_questions = 100 WHERE id = 14;")
  .then(res => {
    console.log('✅ Updated mimikara test to 100 questions');
    pool.end();
  })
  .catch(err => {
    console.error(err);
    pool.end();
  });
