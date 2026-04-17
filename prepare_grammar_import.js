import fs from 'fs';

const csvFile = 'JLPT_N2_Grammar_IMPORT.csv';

// Simple CSV parser for properly formatted CSV
function parseCSV(content) {
  const lines = content.split('\n').filter(l => l.trim());
  const headers = [];
  const records = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Parse CSV fields with quote handling
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
    
    // Process header
    if (i === 0) {
      headers.push(...fields.map(f => f.trim().replace(/^"|"$/g, '')));
    } else {
      const record = {};
      headers.forEach((h, idx) => {
        let value = (fields[idx] || '').trim();
        // Remove surrounding quotes
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1);
          // Unescape double quotes
          value = value.replace(/""/g, '"');
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

console.log(`📄 Reading ${csvFile}...`);
const content = fs.readFileSync(csvFile, 'utf8');
const records = parseCSV(content);

console.log(`✅ Parsed ${records.length} records`);
console.log('\n📋 First record:');
console.log(records[0]);

console.log('\n📋 Second record:');
console.log(records[1]);

// Create JSON for import
const importData = { records };
const jsonFile = 'grammar_import.json';
fs.writeFileSync(jsonFile, JSON.stringify(importData, null, 2), 'utf8');

console.log(`\n✨ Created ${jsonFile} (${(fs.statSync(jsonFile).size / 1024).toFixed(2)} KB)`);
console.log(`\n✅ Ready to import!`);
console.log(`\nRun in another terminal:`);
console.log(`curl -X POST http://localhost:5000/api/admin/grammar/import -H "Content-Type: application/json" -d @grammar_import.json`);
