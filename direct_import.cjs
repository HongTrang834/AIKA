const pkg = require('pg');
const fs = require('fs');
const path = require('path');
const { Pool } = pkg;
const pool = new Pool({ connectionString: 'postgresql://postgres:postgresql@localhost:5432/aika_db' });

function parseCSV(content) {
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  const records = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    const values = line.split(',');
    if (values.length >= headers.length && values[0].trim()) {
      const record = {};
      headers.forEach((header, idx) => {
        record[header] = values[idx] ? values[idx].trim() : '';
      });
      records.push(record);
    }
  }
  return records;
}

async function run() {
  try {
    const csvFile = path.join(__dirname, 'JLPT_N2_Grammar.csv');
    const fileContent = fs.readFileSync(csvFile, 'utf8');
    const records = parseCSV(fileContent);
    console.log(`Parsed ${records.length} records`);

    let imported = 0;
    let skipped = 0;

    for (const record of records) {
      const check = await pool.query("SELECT id FROM grammar WHERE pattern = $1", [record.pattern]);
      if (check.rowCount === 0) {
        await pool.query(
          "INSERT INTO grammar (pattern, meaning, title, explanation, category, example_sentence, example_translation) VALUES ($1, $2, $3, $4, $5, $6, $7)",
          [record.pattern, record.meaning, record.title, record.explanation, record.category || 'N2 Grammar', record.example_sentence, record.example_translation]
        );
        imported++;
      } else {
        skipped++;
      }
    }
    console.log(`IMPORT_RESULT: Imported: ${imported}, Skipped: ${skipped}`);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}
run();
