import fs from 'fs';
import path from 'path';
import pool from './backend/db.js';

async function runMigration() {
  try {
    console.log('🔄 Running migration: add_lessons...');
    
    const migrationFile = path.join(process.cwd(), 'database/migration_add_lessons.sql');
    const migrationSQL = fs.readFileSync(migrationFile, 'utf-8');
    
    // Split by semicolon to handle multiple statements
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    for (const statement of statements) {
      console.log(`Executing: ${statement.substring(0, 50)}...`);
      await pool.query(statement);
    }
    
    console.log('✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
