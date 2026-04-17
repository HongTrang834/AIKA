import pkg from 'pg';
import fs from 'fs';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:postgresql@localhost:5432/aika_db',
});

// Parse CSV
function parseCSV(content) {
  const lines = content.split('\n').filter(l => l.trim());
  const headers = [];
  const records = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const fields = [];
    let current = '';
    let inQuote = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      const nextChar = line[j + 1];
      
      if (char === '"') {
        if (inQuote && nextChar === '"') {
          current += '"';
          j++;
        } else {
          inQuote = !inQuote;
        }
      } else if (char === ',' && !inQuote) {
        fields.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    fields.push(current);
    
    if (i === 0) {
      headers.push(...fields.map(f => f.trim().replace(/^"|"$/g, '')));
    } else {
      const record = {};
      headers.forEach((h, idx) => {
        let value = (fields[idx] || '').trim();
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1).replace(/""/g, '"');
        }
        record[h] = value;
      });
      
      if (record.pattern && record.meaning) {
        records.push(record);
      }
    }
  }
  
  return records;
}

async function importGrammar() {
  try {
    console.log('📖 Importing Grammar Data...\n');
    
    const csvFile = 'JLPT_N2_Grammar_IMPORT.csv';
    const content = fs.readFileSync(csvFile, 'utf8');
    const records = parseCSV(content);
    
    console.log(`📊 Parsed ${records.length} grammar records`);
    
    // Clear existing grammar
    await pool.query('DELETE FROM grammar');
    console.log('🗑️  Cleared grammar table');
    
    // Insert records
    let imported = 0;
    let errors = 0;
    
    for (let i = 0; i < records.length; i++) {
      try {
        const r = records[i];
        
        await pool.query(
          `INSERT INTO grammar 
           (title, pattern, explanation, meaning, category, level, example_sentence, example_translation)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            r.title || r.pattern,
            r.pattern,
            r.explanation || '',
            r.meaning,
            r.category || 'jlpt_grammar',
            2,
            r.example_sentence || '',
            r.example_translation || ''
          ]
        );
        
        imported++;
        if (i % 50 === 0) {
          console.log(`✅ Imported ${imported}/${records.length}...`);
        }
      } catch (err) {
        errors++;
        console.error(`❌ Error row ${i + 1}:`, err.message);
      }
    }
    
    // Verify import
    const result = await pool.query('SELECT COUNT(*) as total FROM grammar');
    const total = result.rows[0].total;
    
    const catResult = await pool.query(
      'SELECT COUNT(DISTINCT category) as categories FROM grammar'
    );
    const categories = catResult.rows[0].categories;
    
    console.log(`\n📊 Import Result:`);
    console.log(`✅ Imported: ${imported}`);
    console.log(`❌ Errors: ${errors}`);
    console.log(`📈 Total in DB: ${total}`);
    console.log(`📁 Categories: ${categories}`);
    
    // Show categories
    const catList = await pool.query(
      'SELECT DISTINCT category, COUNT(*) as count FROM grammar GROUP BY category ORDER BY count DESC LIMIT 20'
    );
    console.log(`\n📋 Grammar Categories:`);
    catList.rows.forEach(r => {
      console.log(`  - ${r.category}: ${r.count} items`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

importGrammar();
