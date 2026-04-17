import fs from 'fs';

const csvFile = 'JLPT_N2_Grammar_FIXED.csv';

// Simple CSV parser
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
        fields.push(current.trim().replace(/^"|"$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    fields.push(current.trim().replace(/^"|"$/g, ''));
    
    if (i === 0) {
      headers.push(...fields);
    } else {
      const record = {};
      headers.forEach((h, idx) => {
        record[h] = fields[idx] || '';
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

// Create JSON for import
const importData = { records };
const jsonFile = 'grammar_import.json';
fs.writeFileSync(jsonFile, JSON.stringify(importData, null, 2), 'utf8');

console.log(`\n✨ Created ${jsonFile}`);
console.log(`\nTo import, run:`);
console.log(`curl -X POST http://localhost:5000/api/admin/grammar/import \\`);
console.log(`  -H "Content-Type: application/json" \\`);
console.log(`  -d @${jsonFile}`);
